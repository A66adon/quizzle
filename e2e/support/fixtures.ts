import { test as base, expect } from '@playwright/test';
import { redact } from './redact';
import { mkdirSync } from 'node:fs';

export const test = base.extend<{ runtimeDiagnostics: void }>({
  runtimeDiagnostics: [async ({ page }, use, testInfo) => {
    let consoleErrors = 0;
    let exceptions = 0;
    const diagnostics: string[] = [];
    const observe = (observed: typeof page) => {
      observed.on('console', message => {
        if (message.type() === 'error') {
          consoleErrors++;
          if (diagnostics.length < 20) diagnostics.push(redact(message.text()));
        }
      });
      observed.on('pageerror', error => {
        exceptions++;
        if (diagnostics.length < 20) diagnostics.push(redact(error.message));
      });
    };
    observe(page);
    page.context().on('page', observe);
    await use();
    if (testInfo.status !== testInfo.expectedStatus || exceptions > 0) {
      await testInfo.attach('safe-runtime-diagnostics', {
        body: JSON.stringify({ consoleErrors, uncaughtBrowserExceptions: exceptions, diagnostics }),
        contentType: 'application/json'
      });
      if (testInfo.title.startsWith('critical pages') &&
          !/\/(?:login|register|forgot-password|reset-password|verify-email|resend-verification)(?:[/?#]|$)/.test(page.url())) {
        mkdirSync('safe-results', { recursive: true });
        await page.screenshot({
          path: `safe-results/${testInfo.project.name}-${Date.now()}.png`,
          mask: [
            page.locator('input, textarea'),
            page.locator('#settings-account-email, #quiz-author-email, #my-name, #participant-grid, #winner-name')
          ]
        }).catch(() => {});
      }
    }
    expect(exceptions, 'No uncaught browser exceptions').toBe(0);
  }, { auto: true }]
});
export { expect };
