import { test, expect } from '../support/fixtures';
import { authenticated, createQuiz, csrf } from '../support/app';

test('authenticated mutations require CSRF and unauthenticated APIs do not disclose data', async ({ page, request }) => {
  await authenticated(page);
  const created = await createQuiz(page);
  const path = `/admin/api/quizzes/${encodeURIComponent(created.fileName)}`;
  expect((await page.request.delete(path)).status()).toBe(403);
  expect((await page.request.delete(path, { headers: { 'X-XSRF-TOKEN': 'invalid' } })).status()).toBe(403);
  expect((await page.request.get(path)).ok()).toBe(true);
  expect((await request.get('/admin/api/account/settings', { maxRedirects: 0 })).status()).toBe(401);
  expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(401);
  const response = await page.request.get('/login');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
  expect(response.headers()['cache-control']).toContain('no-store');
  expect(response.headers()['content-security-policy']).toBeTruthy();
  expect((await page.request.delete(path, { headers: await csrf(page.context()) })).status()).toBe(204);
});
