import { randomUUID } from 'node:crypto';
import { expect, type Page, type BrowserContext } from '@playwright/test';
import { capturedLink } from './mailpit';

export function account() {
  const domain = process.env.E2E_EMAIL_DOMAIN || 'example.test';
  return { email: `e2e-${randomUUID()}@${domain}`, password: `Qz!${randomUUID()}` };
}

export async function register(page: Page, user = account()) {
  await page.goto('/register');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password', { exact: true }).fill(user.password);
  const submitted = page.waitForResponse(response =>
    new URL(response.url()).pathname === '/register' && response.request().method() === 'POST');
  await page.getByRole('button', { name: /create account|register/i }).click();
  expect((await submitted).status(), 'Registration has no server error').toBeLessThan(400);
  await expect(page.getByRole('status')).toContainText(/verification link/i);
  return user;
}

export async function login(page: Page, user: ReturnType<typeof account>) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/\/admin(?:[?#]|$)/);
}

export async function authenticated(page: Page) {
  const user = await register(page);
  const verification = await capturedLink(user.email, '/verify-email');
  await page.goto(verification.toString());
  await expect(page.getByRole('status')).toContainText(/email verified/i);
  await login(page, user);
  return user;
}

export async function csrf(context: BrowserContext) {
  const token = (await context.cookies()).find(cookie => cookie.name === 'XSRF-TOKEN')?.value;
  if (!token) throw new Error('XSRF-TOKEN cookie missing');
  return { 'X-XSRF-TOKEN': decodeURIComponent(token) };
}

export async function logout(page: Page) {
  const response = await page.request.post('/logout', { headers: await csrf(page.context()) });
  expect(response.ok(), 'Logout succeeds').toBe(true);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login(?:[?#]|$)/);
}

export function quiz(title = `E2E ${randomUUID()}`, count = 1) {
  return {
    title, description: 'Isolated browser/load fixture', author: 'Quality suite',
    questions: Array.from({ length: count }, (_, index) => ({
      id: `q${index + 1}`, text: `Safety question ${index + 1}`, points: 100,
      timeSeconds: 120, multiple: false, shuffleAnswers: false,
      answers: [
        { id: 'safe', text: 'Use protective equipment', correct: true },
        { id: 'unsafe', text: 'Ignore protective equipment', correct: false }
      ]
    }))
  };
}

export async function createQuiz(page: Page, definition = quiz()) {
  const response = await page.request.post('/admin/api/quizzes', {
    headers: await csrf(page.context()), data: definition
  });
  expect(response.status(), 'Quiz creation succeeds').toBe(201);
  return await response.json() as { fileName: string; quiz: ReturnType<typeof quiz>; version: number };
}

export async function createSession(page: Page, fileName: string) {
  const response = await page.request.post('/admin/api/sessions', {
    headers: await csrf(page.context()), data: { quizFileName: fileName }
  });
  expect(response.status()).toBe(201);
  return await response.json() as { codehash: string };
}

export async function command(page: Page, code: string, value: string) {
  const response = await page.request.post(`/admin/api/sessions/${code}/commands`, {
    headers: await csrf(page.context()), data: { command: value }
  });
  expect(response.ok(), 'Presenter command succeeds').toBe(true);
}
