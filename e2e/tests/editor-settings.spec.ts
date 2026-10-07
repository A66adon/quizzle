import { test, expect } from '../support/fixtures';
import { authenticated, createQuiz, csrf, login, logout } from '../support/app';

test('manual revision save survives reload @smoke', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.locator('#save-status')).toContainText(/saved/i);
  await page.getByLabel('Title', { exact: true }).fill('Manually saved safety quiz');
  await page.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
  await expect(page.locator('#save-status')).toContainText(/^Saved/);
  await page.reload();
  await expect(page.locator('#quiz-title')).toHaveValue('Manually saved safety quiz');
  const stored = await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json();
  expect(stored.version).toBeGreaterThan(created.version);
});

test('dirty navigation preserves changes and recovery can be discarded', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.locator('#save-status')).toContainText(/^Saved/);
  await page.route('**/admin/api/quizzes/*', route =>
    route.request().method() === 'PUT' ? route.fulfill({ status: 503, body: '{}' }) : route.continue());
  await page.getByLabel('Title', { exact: true }).fill('Draft retained on navigation');
  await expect(page.locator('#save-status')).toContainText(/unsaved|offline|locally/i);
  await page.getByRole('link', { name: 'Back to sessions' }).click();
  await expect(page.getByRole('dialog', { name: 'Leave without saving?' })).toBeVisible();
  await page.getByRole('button', { name: 'Stay', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Draft retained on navigation');
  await page.getByRole('link', { name: 'Back to sessions' }).click();
  await page.getByRole('button', { name: 'Leave without saving', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).toBeVisible();
  await page.getByRole('button', { name: 'Discard drafts' }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(created.quiz.title);
  expect((await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json()).quiz.title).toBe(created.quiz.title);
});

test('failed autosave preserves local draft and offers reload recovery @smoke', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.locator('#save-status')).toContainText(/saved/i);
  await page.route('**/admin/api/quizzes/*', route =>
    route.request().method() === 'PUT' ? route.abort('failed') : route.continue());
  await page.getByLabel('Title', { exact: true }).fill('Recovered offline safety draft');
  await expect(page.locator('#save-status')).toContainText(/offline|stored locally/i);
  page.on('dialog', dialog => dialog.accept());
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Recover local draft?' })).toBeVisible();
  await page.getByRole('button', { name: 'Restore draft' }).click();
  await expect(page.locator('#quiz-title')).toHaveValue('Recovered offline safety draft');
  await page.unroute('**/admin/api/quizzes/*');
  await page.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
  await expect(page.locator('#save-status')).toContainText(/^Saved/);
  await page.reload();
  await expect(page.locator('#quiz-title')).toHaveValue('Recovered offline safety draft');
});

test('another editor writer proactively pauses saving without overwriting its newer revision', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.locator('#save-status')).toContainText(/saved/i);
  let localSaves = 0;
  page.on('request', request => {
    if (request.method() === 'PUT' && new URL(request.url()).pathname.startsWith('/admin/api/quizzes/')) localSaves++;
  });
  const otherTab = await page.context().newPage();
  try {
    await otherTab.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
    await expect(otherTab.locator('#save-status')).toContainText(/^Saved/);
    await otherTab.getByLabel('Title', { exact: true }).fill('Newer server revision');
    const conflict = page.getByRole('dialog', { name: 'Quiz revision conflict' });
    await expect(conflict).toBeVisible();
    await expect(page.locator('#conflict-copy')).toContainText(/another tab changed a local draft/i);
    await expect(page.locator('#save-status')).toContainText(/^Conflict/);
    await otherTab.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
    await expect(otherTab.locator('#save-status')).toContainText(/^Saved/);
    await page.getByRole('button', { name: 'Keep local', exact: true }).click();
    await page.getByLabel('Title', { exact: true }).fill('Stale local revision');
    await expect(page.locator('#save-status')).toContainText(/^Conflict/);
    await page.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
    await expect(conflict).toBeVisible();
    await expect(page.locator('#quiz-title')).toHaveValue('Stale local revision');
    expect(localSaves, 'Storage conflict prevents both autosave and manual PUT').toBe(0);
    const stored = await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json();
    expect(stored.quiz.title).toBe('Newer server revision');
    expect(stored.version).toBe(created.version + 1);
  } finally { await otherTab.close(); }
});

test('editor receives HTTP 409 for a stale revision without shared-storage events', async ({ page, browser }) => {
  const user = await authenticated(page);
  const created = await createQuiz(page);
  const path = `/admin/api/quizzes/${encodeURIComponent(created.fileName)}`;
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.locator('#save-status')).toContainText(/^Saved/);
  const independentContext = await browser.newContext();
  try {
    const other = await independentContext.newPage();
    await login(other, user);
    const updated = await other.request.put(path, {
      headers: await csrf(independentContext),
      data: { quiz: { ...created.quiz, title: 'Independent newer server revision' }, version: created.version }
    });
    expect(updated.ok()).toBe(true);
    const revision = await updated.json();
    expect(revision.version).toBe(created.version + 1);
    const conflictDialog = page.getByRole('dialog', { name: 'Quiz revision conflict' });
    await expect(conflictDialog).not.toBeVisible();
    const staleResponse = page.waitForResponse(response =>
      response.request().method() === 'PUT' && new URL(response.url()).pathname === path);
    await page.getByLabel('Title', { exact: true }).fill('Local draft rejected by server revision');
    const rejected = await staleResponse;
    expect(rejected.status()).toBe(409);
    expect(await rejected.json()).toEqual({ error: 'REVISION_CONFLICT', currentVersion: revision.version });
    await expect(conflictDialog).toBeVisible();
    await expect(page.locator('#save-status')).toContainText(/^Conflict/);
    await expect(conflictDialog.getByRole('button', { name: 'Export local YAML', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Keep local', exact: true }).click();
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue('Local draft rejected by server revision');
    const stored = await (await page.request.get(path)).json();
    expect(stored.version).toBe(revision.version);
    expect(stored.quiz.title).toBe('Independent newer server revision');
  } finally { await independentContext.close(); }
});

test('settings persist through logout and login @smoke', async ({ page }) => {
  const user = await authenticated(page);
  const settings = await (await page.request.get('/admin/api/account/settings')).json();
  await page.goto('/settings');
  await expect(page.locator('#settings-account-email')).toHaveText(user.email);
  await page.locator('#allow-late-join').setChecked(!settings.allowLateJoin);
  await page.locator('#auto-advance-delay').fill('9');
  const saved = page.waitForResponse(response =>
    response.url().endsWith('/admin/api/account/settings') && response.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Save settings' }).click();
  expect((await saved).ok()).toBe(true);
  await logout(page);
  await login(page, user);
  await page.goto('/settings');
  await expect(page.locator('#auto-advance-delay')).toHaveValue('9');
  await expect(page.locator('#allow-late-join')).toBeChecked({ checked: !settings.allowLateJoin });
});
