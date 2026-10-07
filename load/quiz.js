import http from 'k6/http';
import ws from 'k6/ws';
import { sleep, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const base = (__ENV.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const mailpit = (__ENV.MAILPIT_URL || 'http://localhost:8025').replace(/\/$/, '');
const mode = __ENV.SCENARIO || 'single200';
if (!['single200', 'parallel5x40'].includes(mode)) throw new Error('Unknown SCENARIO');
const sessions = Number(__ENV.SESSIONS || (mode === 'single200' ? 1 : 5));
const players = Number(__ENV.PLAYERS_PER_SESSION || (mode === 'single200' ? 200 : 40));
const questions = Number(__ENV.QUESTIONS || 3);
const rampSeconds = Number(__ENV.RAMP_SECONDS || 15);
const deadlineSeconds = Number(__ENV.DEADLINE_SECONDS || 180);
for (const value of [sessions, players, questions, rampSeconds, deadlineSeconds]) {
  if (!Number.isInteger(value) || value < 1) throw new Error('Scenario values must be positive integers');
}
if (deadlineSeconds <= rampSeconds + 30) throw new Error('DEADLINE_SECONDS must exceed ramp plus 30 seconds');

const joinSuccess = new Rate('join_success');
const answerSuccess = new Rate('answer_success');
const httpErrors = new Rate('http_application_errors');
const wsErrors = new Rate('ws_application_errors');
const finalCounts = new Rate('final_counts_match');
const completed = new Rate('participants_complete');
const joinLatency = new Trend('join_latency_ms', true);
const answerLatency = new Trend('answer_ack_latency_ms', true);
const joinedPlayers = new Counter('joined_players');
const ackCount = new Counter('answer_acknowledgements');
const serverAccepted = new Counter('server_accepted_answers');
const finalPlayers = new Counter('server_final_players');
const finalClients = new Counter('clients_receiving_final_results');
const presentersComplete = new Counter('presenters_complete');
const scenarios = {};
const countThresholds = {};
for (let index = 0; index < sessions; index++) {
  const env = { SESSION_INDEX: String(index) };
  scenarios[`presenter_${index}`] = {
    executor: 'per-vu-iterations', exec: 'presenter', vus: 1, iterations: 1,
    maxDuration: `${deadlineSeconds + 30}s`, env, tags: { game: String(index) }
  };
  scenarios[`participants_${index}`] = {
    executor: 'per-vu-iterations', exec: 'participant', vus: players, iterations: 1,
    maxDuration: `${deadlineSeconds + 30}s`, env, tags: { game: String(index) }
  };
  for (const metric of ['joined_players', 'answer_acknowledgements', 'server_accepted_answers',
    'server_final_players', 'clients_receiving_final_results', 'presenters_complete']) {
    countThresholds[`${metric}{game:${index}}`] = ['count>=1'];
  }
}
export const options = {
  scenarios,
  throw: true,
  setupTimeout: '180s',
  teardownTimeout: '60s',
  thresholds: {
    ...countThresholds,
    join_success: ['rate>=0.99'],
    answer_success: ['rate>=0.99'],
    http_application_errors: ['rate<0.01'],
    ws_application_errors: ['rate<0.01'],
    join_latency_ms: ['p(95)<2000'],
    answer_ack_latency_ms: ['p(95)<1000'],
    final_counts_match: ['rate==1'],
    participants_complete: ['rate>=0.99']
  },
  // URL tags would expose lifecycle mail tokens. Keep only bounded protocol/operation tags.
  systemTags: ['status', 'method', 'name', 'scenario', 'error_code'],
  summaryTrendStats: ['avg', 'p(95)', 'max']
};

function transport(method, url, body, params) {
  try {
    return http.request(method, url, body, params);
  } catch {
    // k6's default transport warnings include full token URLs. throw:true
    // routes failures here so only a bounded, non-sensitive message is logged.
    httpErrors.add(true);
    fail('HTTP transport failed; URL, credentials and body withheld');
  }
}

function parse(response, selector) {
  try { return selector ? response.json(selector) : response.json(); }
  catch { httpErrors.add(true); fail('Malformed server JSON; payload withheld'); }
}

function request(method, path, body, cookie, operation = 'presenter') {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) {
    headers.Cookie = cookie;
    const match = cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    if (match) headers['X-XSRF-TOKEN'] = decodeURIComponent(match[1]);
  } else {
    const token = http.cookieJar().cookiesForURL(base)['XSRF-TOKEN']?.[0];
    if (token) headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }
  const response = transport(method, `${base}${path}`, body == null ? null : JSON.stringify(body), {
    headers, tags: { name: operation }, redirects: 0
  });
  const okay = response.status >= 200 && response.status < 400;
  httpErrors.add(!okay);
  if (!okay) fail(`HTTP operation ${operation} failed (${response.status})`);
  return response;
}

function form(path, fields) {
  request('GET', path, null, null, 'auth-page');
  const token = http.cookieJar().cookiesForURL(base)['XSRF-TOKEN']?.[0];
  if (!token) fail('CSRF cookie missing');
  const response = transport('POST', `${base}${path}`, { ...fields, _csrf: decodeURIComponent(token) }, {
    headers: { 'X-XSRF-TOKEN': decodeURIComponent(token) },
    redirects: 0, tags: { name: 'auth-form' }
  });
  httpErrors.add(response.status !== 302 && response.status !== 303);
  if (![302, 303].includes(response.status)) fail('Authentication form submission failed');
  return response;
}

function verification(email) {
  const until = Date.now() + 30_000;
  while (Date.now() < until) {
    const response = transport('GET', `${mailpit}/api/v1/messages`, null, { tags: { name: 'mail-inbox' } });
    if (response.status === 200) {
      for (const message of parse(response, 'messages') || []) {
        if (!(message.To || []).some(to => to.Address === email)) continue;
        const detail = transport('GET', `${mailpit}/api/v1/message/${message.ID}`, null, { tags: { name: 'mail-detail' } });
        if (detail.status !== 200) continue;
        const text = `${parse(detail, 'Text') || ''} ${parse(detail, 'HTML') || ''}`.replace(/&amp;/g, '&');
        const match = text.match(/https?:\/\/[^\s<>"']+\/verify-email\?token=[A-Za-z0-9_-]+/);
        if (match) {
          if (!match[0].startsWith(`${base}/verify-email?`)) fail('Unexpected verification origin');
          return match[0].substring(base.length);
        }
      }
    }
    sleep(0.25);
  }
  fail('Verification email did not arrive');
}

function definition(index) {
  return {
    title: `Load ${mode} ${index}`, description: 'Ephemeral protocol-aware fixture', author: 'k6',
    questions: Array.from({ length: questions }, (_, n) => ({
      id: `q${n + 1}`, text: `Safety ${n + 1}`, points: 100, timeSeconds: 120,
      multiple: false, shuffleAnswers: false,
      answers: [
        { id: 'safe', text: 'Use protective equipment', correct: true },
        { id: 'unsafe', text: 'Ignore protective equipment', correct: false }
      ]
    }))
  };
}

export function setup() {
  const result = [];
  const run = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  for (let index = 0; index < sessions; index++) {
    http.cookieJar().clear(base);
    const email = `load-${run}-${index}@${__ENV.E2E_EMAIL_DOMAIN || 'example.test'}`;
    const password = `Qz!${run}-${index}-only-ephemeral`;
    form('/register', { email, password, passwordConfirmation: password });
    request('GET', verification(email), null, null, 'email-verification');
    const login = form('/login', { email, password });
    if (!(login.headers.Location || '').includes('/admin')) fail('Verified presenter login failed');
    request('GET', '/admin', null, null, 'admin-page');
    const jar = http.cookieJar().cookiesForURL(base);
    const cookie = Object.keys(jar).map(name => `${name}=${jar[name][0]}`).join('; ');
    const quiz = parse(request('POST', '/admin/api/quizzes', definition(index), cookie, 'quiz-create'));
    const session = parse(request('POST', '/admin/api/sessions', { quizFileName: quiz.fileName }, cookie, 'session-create'));
    request('POST', `/admin/api/sessions/${session.codehash}/leaderboard`, { enabled: false }, cookie, 'leaderboard-disable');
    result.push({ code: session.codehash, cookie, fileName: quiz.fileName });
  }
  // This data stays in process memory. Never log it or export setup state.
  return result;
}

function state(session) {
  return parse(request('GET', `/admin/api/sessions/${session.code}/state`, null, session.cookie, 'presenter-state'), 'payload');
}

function command(session, value) {
  return parse(request('POST', `/admin/api/sessions/${session.code}/commands`,
    { command: value }, session.cookie, 'presenter-command'));
}

function waitFor(session, predicate, limit = deadlineSeconds) {
  const until = Date.now() + limit * 1000;
  while (Date.now() < until) {
    const snapshot = state(session);
    if (predicate(snapshot)) return snapshot;
    sleep(0.1);
  }
  finalCounts.add(false);
  fail('Presenter barrier timed out');
}

export function presenter(data) {
  const session = data[Number(__ENV.SESSION_INDEX)];
  waitFor(session, snapshot => snapshot.participants.length === players &&
    snapshot.participants.every(player => player.connectionStatus === 'CONNECTED'));
  command(session, 'START');
  for (let q = 0; q < questions; q++) {
    const answered = waitFor(session, snapshot =>
      snapshot.state === 'RESULTS' && snapshot.currentQuestionIndex === q &&
      snapshot.receivedAnswerCount === players, 110);
    serverAccepted.add(answered.receivedAnswerCount);
    // The last connected answer automatically transitions QUESTION_OPEN -> RESULTS.
    const revealed = answered;
    finalCounts.add(revealed.state === 'RESULTS' && revealed.receivedAnswerCount === players &&
      revealed.results.options.reduce((sum, option) => sum + option.voteCount, 0) === players);
    command(session, 'NEXT');
  }
  const final = waitFor(session, snapshot => snapshot.state === 'FINAL_RESULTS', 10);
  finalPlayers.add(final.participants.length);
  finalCounts.add(final.participants.length === players && final.standings.length === players &&
    final.receivedAnswerCount === players);
  presentersComplete.add(1);
  // No CLOSE here: teardown runs only after all participant iterations finish.
}

export function participant(data) {
  const session = data[Number(__ENV.SESSION_INDEX)];
  // Deterministic spread of connections; no one-millisecond 200-socket burst.
  sleep(((__VU - 1) % players) / players * rampSeconds);
  const sent = new Map();
  const accepted = new Set();
  let joined = false;
  let final = false;
  const startedAt = Date.now();
  let response;
  try {
  response = ws.connect(`${base.replace(/^http/, 'ws')}/${session.code}/data`, {
    headers: { Origin: base }, tags: { name: 'participant-websocket' }
  }, socket => {
    socket.on('open', () => {
      socket.send(JSON.stringify({ type: 'JOIN', name: `Load player ${__VU}` }));
    });
    socket.on('message', raw => {
      let message;
      try { message = JSON.parse(raw); } catch { wsErrors.add(true); socket.close(); return; }
      if (message.type === 'JOINED') {
        if (!joined) {
          joinedPlayers.add(1);
          joinLatency.add(Date.now() - startedAt);
        }
        joined = true;
        wsErrors.add(false);
      }
      if (message.type === 'ERROR') {
        wsErrors.add(true);
        socket.close();
      }
      if (message.type === 'ANSWER_ACCEPTED' && sent.has(message.payload.questionId) &&
          !accepted.has(message.payload.questionId)) {
        accepted.add(message.payload.questionId);
        ackCount.add(1);
        answerLatency.add(Date.now() - sent.get(message.payload.questionId));
        wsErrors.add(false);
      }
      const snapshot = message.type === 'STATE' ? message.payload :
        message.type === 'JOINED' ? message.payload.session : null;
      if (!snapshot) return;
      if (snapshot.state === 'QUESTION_OPEN' && joined && !sent.has(snapshot.question.id)) {
        sent.set(snapshot.question.id, Date.now());
        socket.send(JSON.stringify({ type: 'ANSWER', questionId: snapshot.question.id, answerIds: ['safe'] }));
      }
      if (snapshot.state === 'RESULTS') {
        finalCounts.add(snapshot.receivedAnswerCount === players);
      }
      if (snapshot.state === 'FINAL_RESULTS') {
        final = snapshot.participants.length === players && accepted.size === questions;
        socket.close();
      }
    });
    socket.on('error', () => wsErrors.add(true));
    socket.setTimeout(() => socket.close(), deadlineSeconds * 1000);
  });
  } catch {
    wsErrors.add(true);
  } finally {
  const handshake = response?.status === 101;
  joinSuccess.add(joined && handshake);
  wsErrors.add(!joined || !handshake);
  // Planned question attempts stay in the denominator on timeout, disconnect,
  // missing STATE and failed handshakes, not only when socket.send succeeds.
  for (let q = 1; q <= questions; q++) {
    const okay = accepted.has(`q${q}`);
    answerSuccess.add(okay);
    wsErrors.add(!okay);
  }
  completed.add(final && sent.size === questions);
  if (final) finalClients.add(1);
  }
}

export function teardown(data) {
  for (const session of data) {
    command(session, state(session).state === 'FINAL_RESULTS' ? 'CLOSE' : 'ABORT');
    request('DELETE', `/admin/api/quizzes/${session.fileName}`, null, session.cookie, 'fixture-delete');
  }
}

export function handleSummary(data) {
  const metrics = {};
  for (const name of [
    'join_success', 'answer_success', 'http_application_errors', 'ws_application_errors',
    'join_latency_ms', 'answer_ack_latency_ms', 'final_counts_match', 'participants_complete',
    'joined_players', 'answer_acknowledgements', 'server_accepted_answers', 'server_final_players',
    'clients_receiving_final_results', 'presenters_complete'
  ]) metrics[name] = data.metrics[name]?.values || {};
  const count = (name, game) => data.metrics[`${name}{game:${game}}`]?.values.count || 0;
  const games = Array.from({ length: sessions }, (_, game) => {
    const joined = count('joined_players', game);
    const acks = count('answer_acknowledgements', game);
    const serverPlayers = count('server_final_players', game);
    const serverAnswers = count('server_accepted_answers', game);
    const final = count('clients_receiving_final_results', game);
    const presenters = count('presenters_complete', game);
    return { game, joined, acks, serverPlayers, serverAnswers, final, presenters,
      countsAgree: joined === players && serverPlayers === joined && acks === serverAnswers &&
        serverAnswers === players * questions && final === joined && presenters === 1 };
  });
  const countsAgree = games.every(game => game.countsAgree);
  const passed = countsAgree && Object.values(data.metrics).every(metric =>
    Object.values(metric.thresholds || {}).every(threshold => threshold.ok));
  const summary = {
    scenario: mode, sessions, playersPerSession: players, questions, rampSeconds,
    passed, countsAgree, metrics, games
  };
  return {
    stdout: `${mode}: ${passed ? 'PASS' : 'FAIL'}; ${sessions} sessions x ${players} players; ` +
      `joins=${metrics.joined_players.count || 0}; ACKs=${metrics.answer_acknowledgements.count || 0}; ` +
      `join p95=${metrics.join_latency_ms['p(95)'] || 0}ms; ACK p95=${metrics.answer_ack_latency_ms['p(95)'] || 0}ms\n`,
    [__ENV.SUMMARY_PATH || 'load/results/summary.json']: JSON.stringify(summary, null, 2),
    [(__ENV.SUMMARY_PATH || 'load/results/summary.json').replace(/\.json$/, '.txt')]:
      `${mode}: ${passed ? 'PASS' : 'FAIL'}\n` +
      games.map(game => `Game ${game.game}: joins=${game.joined}; ACKs=${game.acks}; server=${game.serverAnswers}; finals=${game.final}; exact=${game.countsAgree}`).join('\n') + '\n'
  };
}
