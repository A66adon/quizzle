# Protocol-aware k6 load gates

**Measurements: NOT EXECUTED.** Docker/k6 are unavailable locally. No throughput,
capacity, latency, browser or PostgreSQL claims have been measured here.

Pinned execution image: `grafana/k6:1.3.0`. Use an isolated PostgreSQL 16 + Mailpit
development stack with HTTP local cookies and SMTP configured as described in
`e2e/README.md`. Never load-test public/production endpoints without permission.

From repository root:

```sh
mkdir -p load/results
SCENARIO=single200 k6 run --quiet load/quiz.js
SCENARIO=parallel5x40 SUMMARY_PATH=load/results/parallel5x40.json k6 run --quiet load/quiz.js
node -e 'const s=require("./load/results/parallel5x40.json");if(!s.passed||!s.countsAgree)process.exit(1)'
```

Or build an automatically cleaned disposable stack (Linux/Docker host networking):

```sh
export POSTGRES_PASSWORD="$(openssl rand -hex 24)"
bash e2e/run-ci.sh single200
bash e2e/run-ci.sh parallel5x40
```

Configuration: `BASE_URL` (localhost:8080), `MAILPIT_URL` (localhost:8025),
`E2E_EMAIL_DOMAIN` (example.test), `SCENARIO` (single200 or parallel5x40),
`SESSIONS` (1 or 5 by scenario), `PLAYERS_PER_SESSION` (200 or 40),
`QUESTIONS` (3), `RAMP_SECONDS` (15), `DEADLINE_SECONDS` (180), and
`SUMMARY_PATH` (load/results/summary.json). Positive integers are required;
deadline must exceed ramp plus 30 seconds. Changing counts changes the test,
not the release acceptance baseline.

Setup registers and verifies an ephemeral presenter per independent game using
captured SMTP, logs in with real CSRF/session cookies, creates quizzes/sessions,
and disables the optional between-question leaderboard. Presenter VUs wait
for all configured participants to be CONNECTED, then start and independently
advance several questions. Participant VUs spread handshakes across the ramp,
JOIN by name, receive real STATE, send ANSWER once per question, track
ANSWER_ACCEPTED and stay connected until FINAL_RESULTS. Results are generated
automatically by the last connected accepted answer. No “health endpoint load”
or synthetic ACK substitute is used.

The 200 participant sockets do not register accounts or authenticate locally:
only presenters do, once per game (one or five accounts in the default modes).
Increasing the participant count does not require raising authentication limits.

Planned join/question attempts remain in success-rate denominators on failed
handshake, disconnect, missing STATE, timeout, and unsent questions. HTTP and WS
application errors have separate rates, both below 1%; join/ACK success >=99%,
p95 join <2000ms (includes handshake), p95 ACK <1000ms, and completion >=99%.
The strict count gate additionally requires each game to have every configured
player, one presenter lifecycle, matching server votes and client ACKs for every
question, and every joined client receiving final results. Aggregate agreement
cannot hide one game stealing another game's counts.

CLOSE is in teardown **after all participants finish**, not after a guessed
sleep. Failed games use ABORT. Fixtures are deleted afterwards; secrets/setup
cookies remain only in memory. `systemTags` excludes URL/query values; compact
JSON and human output include metrics/counts only. Never enable HTTP debug or
export setup/teardown data: those expose credentials. The wrapper separately
checks `passed` and `countsAgree`, because `handleSummary` cannot make k6 exit
nonzero for a custom comparison. k6 thresholds themselves do return nonzero.

Workflow checks uncaught server exception signatures without archiving raw logs.
To claim a release result, record CPU/model, cores, RAM, OS, Docker/k6/image
versions, JVM heap/limits, database tuning, whether generators share the host,
commit, UTC time, configuration and both summaries. A shared GitHub runner is
functional evidence, **not** a stable performance regression reference machine.
