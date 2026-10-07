import { test, expect } from '../support/fixtures';
import { authenticated, command, createQuiz, createSession, csrf, quiz } from '../support/app';

for (const count of [1, 3]) {
test(`presenter and participant complete ${count} realtime rounds ${count === 1 ? '@smoke' : ''}`, async ({ page, browser }) => {
  await authenticated(page);
  const created = await createQuiz(page, quiz(undefined, count));
  const session = await createSession(page, created.fileName);
  const participantContext = await browser.newContext();
  try {
    const participant = await participantContext.newPage();
    let acknowledgements = 0;
    let reconnected = false;
    const errors: string[] = [];
    participant.on('websocket', socket => socket.on('framereceived', event => {
      try {
        const message = JSON.parse(String(event.payload));
        if (message.type === 'ANSWER_ACCEPTED') acknowledgements++;
        if (message.type === 'JOINED' && message.payload.reconnected) reconnected = true;
        if (message.type === 'ERROR') errors.push(message.payload.code);
      } catch { errors.push('INVALID_SERVER_JSON'); }
    }));
    await page.goto(`/admin/sessions/${session.codehash}`);
    await participant.goto(`/${session.codehash}`);
    await participant.getByLabel(/name/i).fill('Safety player');
    await participant.getByRole('button', { name: /join/i }).click();
    await expect.poll(async () => {
      const response = await page.request.get(`/admin/api/sessions/${session.codehash}/state`);
      return (await response.json()).payload.participants.length;
    }).toBe(1);
    if (count > 1) {
      await participant.reload();
      await expect.poll(() => reconnected, { message: 'Reload reconnects the same participant' }).toBe(true);
      const state = await (await page.request.get(`/admin/api/sessions/${session.codehash}/state`)).json();
      expect(state.payload.participants).toHaveLength(1);
    }

    await page.locator('#start-button').click();
    for (let index = 0; index < count; index++) {
      await expect(participant.getByRole('heading', { name: `Safety question ${index + 1}`, exact: true })).toBeVisible();
      await participant.getByRole('button', { name: /Use protective equipment/ }).click();
      await expect.poll(() => acknowledgements).toBe(index + 1);
      // The last connected player's answer automatically reveals results.
      await expect(page.locator('#results-view')).toBeVisible();
      await expect(participant.locator('#results-view')).toBeVisible();
      const state = await (await page.request.get(`/admin/api/sessions/${session.codehash}/state`)).json();
      expect(state.payload.receivedAnswerCount).toBe(1);
      expect(state.payload.results.options.find((item: { answerId: string }) => item.answerId === 'safe').voteCount).toBe(1);
      await page.locator('#next-button').click();
      if (index < count - 1) {
        await expect.poll(async () =>
          (await (await page.request.get(`/admin/api/sessions/${session.codehash}`)).json()).state
        ).toMatch(/LEADERBOARD|QUESTION_OPEN/);
        const nextState = await (await page.request.get(`/admin/api/sessions/${session.codehash}`)).json();
        if (nextState.state === 'LEADERBOARD') await command(page, session.codehash, 'NEXT');
      }
    }
    await expect.poll(async () =>
      (await (await page.request.get(`/admin/api/sessions/${session.codehash}`)).json()).state
    ).toBe('FINAL_RESULTS');
    await expect(participant.getByRole('heading', { name: 'Quiz complete', exact: true })).toBeVisible();
    expect(errors, 'No application protocol errors').toEqual([]);
    await command(page, session.codehash, 'CLOSE');
  } finally {
    await participantContext.close();
  }
});
}

for (const allowed of [false, true]) {
  test(`new games enforce persisted late-join setting ${allowed}`, async ({ page, browser }) => {
    await authenticated(page);
    expect((await page.request.put('/admin/api/account/settings', {
      headers: await csrf(page.context()), data: { allowLateJoin: allowed, autoAdvanceDelayMs: 120000 }
    })).ok()).toBe(true);
    const created = await createQuiz(page);
    const session = await createSession(page, created.fileName);
    await command(page, session.codehash, 'START');
    const participantContext = await browser.newContext();
    try {
      const participant = await participantContext.newPage();
      await participant.goto(`/${session.codehash}`);
      await participant.getByLabel('Display name', { exact: true }).fill('Late player');
      await participant.getByRole('button', { name: 'Join quiz', exact: true }).click();
      if (allowed) {
        await expect(participant.getByRole('heading', { name: 'Safety question 1', exact: true })).toBeVisible();
        await participant.getByRole('button', { name: /Use protective equipment/ }).click();
        await expect(participant.locator('#results-view')).toBeVisible();
        const snapshot = await (await page.request.get(`/admin/api/sessions/${session.codehash}/state`)).json();
        expect(snapshot.payload.receivedAnswerCount).toBe(1);
      } else {
        await expect(participant.locator('#client-message')).toContainText(/started|late|join/i);
        const snapshot = await (await page.request.get(`/admin/api/sessions/${session.codehash}/state`)).json();
        expect(snapshot.payload.participants).toHaveLength(0);
      }
    } finally {
      await command(page, session.codehash, 'ABORT');
      await participantContext.close();
    }
  });
}
