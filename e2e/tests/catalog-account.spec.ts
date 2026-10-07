import { test, expect } from '../support/fixtures';
import { account, authenticated, createQuiz, createSession, csrf, login, logout } from '../support/app';

test('catalog validation, revisions, YAML round trip and ownership', async ({ page, browser }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  const path = `/admin/api/quizzes/${encodeURIComponent(created.fileName)}`;
  const headers = await csrf(page.context());
  const invalid = await page.request.put(path, {
    headers, data: { quiz: { ...created.quiz, questions: [] }, version: created.version }
  });
  expect(invalid.status()).toBe(400);
  const updated = await page.request.put(path, {
    headers, data: { quiz: { ...created.quiz, title: 'Revised safety training' }, version: created.version }
  });
  expect(updated.ok()).toBe(true);
  const revision = await updated.json();
  expect(revision.version).toBeGreaterThan(created.version);
  const stale = await page.request.put(path, {
    headers, data: { quiz: created.quiz, version: created.version }
  });
  expect(stale.status()).toBe(409);
  expect(await stale.json()).toEqual({ error: 'REVISION_CONFLICT', currentVersion: revision.version });
  const exported = await page.request.get(`${path}/export`);
  expect(exported.ok()).toBe(true);
  expect(exported.headers()['content-type']).toMatch(/yaml/);
  const imported = await page.request.post('/admin/api/quizzes/import', {
    headers: { ...headers, 'Content-Type': 'application/yaml' }, data: await exported.text()
  });
  expect(imported.status()).toBe(201);
  const copy = await imported.json();
  expect(copy.fileName).not.toBe(created.fileName);
  expect(copy.quiz.title).toBe('Revised safety training');
  expect(copy.quiz.questions).toEqual(created.quiz.questions);
  const otherContext = await browser.newContext();
  try {
    const other = await otherContext.newPage();
    await authenticated(other);
    expect((await other.request.get(path)).status()).toBe(404);
    expect((await other.request.delete(path, { headers: await csrf(otherContext) })).status()).toBe(404);
    const catalog = await (await other.request.get('/admin/api/quizzes')).json();
    expect(JSON.stringify(catalog)).not.toContain(created.fileName);
  } finally { await otherContext.close(); }
  expect((await page.request.delete(path, { headers })).status()).toBe(204);
  expect((await page.request.get(path)).status()).toBe(404);
});

test('settings validation, password reauthentication and account deletion', async ({ page, browser }) => {
  const user = await authenticated(page);
  const created = await createQuiz(page);
  const session = await createSession(page, created.fileName);
  const otherContext = await browser.newContext();
  try {
    const other = await otherContext.newPage();
    await authenticated(other);
    const otherQuiz = await createQuiz(other);
    const settings = await (await page.request.get('/admin/api/account/settings')).json();
    expect((await page.request.put('/admin/api/account/settings', {
      headers: await csrf(page.context()), data: { allowLateJoin: true, autoAdvanceDelayMs: -1 }
    })).status()).toBe(400);
    expect(await (await page.request.get('/admin/api/account/settings')).json()).toEqual(settings);
    await page.goto('/settings');
    await page.getByLabel('Current password', { exact: true }).fill('incorrect-password');
    const next = account().password;
    await page.getByLabel('New password', { exact: true }).fill(next);
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.locator('#password-error')).toBeVisible();
    await page.getByLabel('Current password', { exact: true }).fill(user.password);
    const changed = page.waitForResponse(response =>
      response.url().endsWith('/change-password') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Update password' }).click();
    expect((await changed).ok()).toBe(true);
    await logout(page);
    await login(page, { ...user, password: next });
    await page.goto('/settings');
    await page.getByLabel('Current password to confirm deletion').fill(next);
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete my account' }).click();
    await expect(page).toHaveURL(/\/login/);
    expect((await other.request.get(`/admin/api/quizzes/${otherQuiz.fileName}`)).ok()).toBe(true);
    expect((await other.request.get(`/admin/api/sessions/${session.codehash}`)).status()).toBe(404);
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(next);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.locator('#login-error')).toBeVisible();
  } finally { await otherContext.close(); }
});
