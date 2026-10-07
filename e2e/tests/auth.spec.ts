import { test, expect } from '../support/fixtures';
import { account, authenticated, login, logout, register } from '../support/app';
import { capturedLink } from '../support/mailpit';

test('register, pending login, verify once, login and logout @smoke', async ({ page }) => {
  const user = await register(page);
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.locator('#login-error')).toBeVisible();
  const link = await capturedLink(user.email, '/verify-email');
  await page.goto(link.toString());
  await login(page, user);
  await logout(page);
  await page.goto(link.toString());
  await expect(page).not.toHaveURL(/\/admin(?:[?#]|$)/);
  await expect(page.getByRole('alert')).toContainText(/invalid|expired|used|failed/i);
});

test('resend supersedes verification and forgot responses are generic', async ({ page }) => {
  const user = await register(page);
  const original = await capturedLink(user.email, '/verify-email');
  await page.goto('/resend-verification');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByRole('button', { name: 'Send verification link' }).click();
  await expect(page.locator('#auth-message')).toContainText(/if the account is eligible/i);
  const replacement = await capturedLink(user.email, '/verify-email', [original.toString()]);
  await page.goto(original.toString());
  await expect(page.getByRole('alert')).toContainText(/could not be completed/i);
  const tampered = new URL(replacement);
  tampered.searchParams.set('token', 'not-a-valid-verification-token');
  await page.goto(tampered.toString());
  await expect(page.getByRole('alert')).toBeVisible();
  await page.goto(replacement.toString());
  await expect(page.getByRole('status')).toContainText(/email verified/i);
  let acknowledgement = '';
  for (const email of [user.email, account().email]) {
    await page.goto('/forgot-password');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.locator('#auth-message')).toBeVisible();
    const text = await page.locator('#auth-message').innerText();
    if (acknowledgement) expect(text).toBe(acknowledgement);
    acknowledgement = text;
  }
});

test('forgot/reset is single-use, revokes sessions and does not auto-login @smoke', async ({ page, browser }) => {
  const user = await authenticated(page);
  const oldContext = await browser.newContext();
  try {
    const oldSession = await oldContext.newPage();
    await login(oldSession, user);
    await logout(page);
    await page.goto('/forgot-password');
    await page.getByLabel('Email', { exact: true }).fill(user.email);
    await page.getByRole('button', { name: /send|reset/i }).click();
    await expect(page.locator('#auth-message')).toBeVisible();
    const link = await capturedLink(user.email, '/reset-password');
    const next = { ...user, password: account().password };
    await page.goto(link.toString());
    await expect(page).not.toHaveURL(/token=/);
    await page.getByLabel('New password', { exact: true }).fill(next.password);
    await page.getByLabel('Confirm password', { exact: true }).fill(next.password);
    await page.getByRole('button', { name: /reset|save|change/i }).click();
    await expect(page).toHaveURL(/\/login(?:[?#]|$)/);
    expect((await oldSession.request.get('/admin/api/account/settings', { maxRedirects: 0 })).status()).toBe(401);
    await page.getByLabel('Email', { exact: true }).fill(user.email);
    await page.getByLabel('Password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('#login-error')).toBeVisible();
    await login(page, next);
    await logout(page);
    await page.goto(link.toString());
    await page.getByLabel('New password', { exact: true }).fill(user.password);
    await page.getByLabel('Confirm password', { exact: true }).fill(user.password);
    await page.getByRole('button', { name: /reset|save|change/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await login(page, next);
  } finally {
    await oldContext.close();
  }
});
