import { test, expect } from '../support/fixtures';
import { authenticated, createQuiz, login, logout } from '../support/app';

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

test('two editor tabs preserve both sides of a revision conflict', async ({ page }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(page.locator('#save-status')).toContainText(/saved/i);
  const otherTab = await page.context().newPage();
  await otherTab.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
  await expect(otherTab.locator('#save-status')).toContainText(/^Saved/);
  await otherTab.getByLabel('Title', { exact: true }).fill('Newer server revision');
  await otherTab.getByRole('button', { name: 'Save', exact: true }).filter({ visible: true }).click();
  await expect(otherTab.locator('#save-status')).toContainText(/^Saved/);
  const conflict = page.waitForResponse(response =>
    response.request().method() === 'PUT' && response.url().includes('/admin/api/quizzes/'));
  await page.getByLabel('Title', { exact: true }).fill('Stale local revision');
  expect((await conflict).status()).toBe(409);
  await expect(page.getByRole('dialog', { name: 'Quiz revision conflict' })).toBeVisible();
  const stored = await (await page.request.get(`/admin/api/quizzes/${created.fileName}`)).json();
  expect(stored.quiz.title).toBe('Newer server revision');
  await page.getByRole('button', { name: 'Keep local' }).click();
  await expect(page.locator('#quiz-title')).toHaveValue('Stale local revision');
  await otherTab.close();
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
