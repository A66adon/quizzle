import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['./support/safe-reporter.ts']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    // Auth URLs and POST bodies contain tokens/passwords. Never persist raw traces.
    trace: 'off',
    screenshot: 'off',
    video: 'off',
    actionTimeout: 15_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
});
