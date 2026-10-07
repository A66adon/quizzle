import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import { authenticated, createQuiz, createSession } from '../support/app';

async function assertPage(page: Page, primary: string) {
  const control = page.locator(primary);
  await expect(control).toBeVisible();
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeInViewport();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1
  ), 'No horizontal overflow').toBe(true);
  const box = await control.boundingBox();
  expect(box?.height, 'Primary touch target height').toBeGreaterThanOrEqual(40);
  expect(box?.width, 'Primary touch target width').toBeGreaterThanOrEqual(40);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  // No blanket exclusions. Report rule IDs only; node HTML may contain private values.
  const severe = results.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''));
  expect(severe.map(item => item.id), 'No serious/critical accessibility violations').toEqual([]);
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`critical pages ${viewport.width}px ${colorScheme} @smoke`, async ({ page, browser }) => {
      test.setTimeout(180_000);
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
      await page.goto('/login');
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      await assertPage(page, 'button[type=submit]');
      await page.goto('/register');
      await assertPage(page, 'button[type=submit]');
      await authenticated(page);
      await assertPage(page, '[aria-label="Add a new quiz"]');
      const created = await createQuiz(page);
      await page.goto(`/editor?file=${encodeURIComponent(created.fileName)}`);
      await expect(page.locator('#save-status')).toContainText(/saved/i);
      await assertPage(page, '#details-continue');
      await page.locator('#delete-quiz').click();
      const dialog = page.getByRole('dialog', { name: 'Delete this quiz?' });
      await expect(dialog).toBeVisible();
      const bounds = await dialog.boundingBox();
      expect(bounds !== null && bounds.x >= 0 && bounds.y >= 0 &&
        bounds.x + bounds.width <= viewport.width + 1 &&
        bounds.y + bounds.height <= viewport.height + 1, 'Dialog fits viewport').toBe(true);
      await page.getByRole('button', { name: 'Keep quiz' }).click();
      await page.goto('/settings');
      await assertPage(page, '#save-settings');
      const session = await createSession(page, created.fileName);
      await page.goto(`/admin/sessions/${session.codehash}`);
      await assertPage(page, '#start-button');
      const participantContext = await browser.newContext({ viewport, colorScheme, reducedMotion: 'reduce' });
      try {
        const participant = await participantContext.newPage();
        await participant.goto(`/${session.codehash}`);
        await assertPage(participant, '#join-button');
      } finally {
        await participantContext.close();
      }
    });
  }
}
