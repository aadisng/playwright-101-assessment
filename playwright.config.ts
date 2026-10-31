import 'dotenv/config';
import { defineConfig } from '@playwright/test';
import type { CloudOptions } from './tests/fixtures/test';

const cloud = process.env.TEST_TARGET === 'cloud';
if (cloud && (!process.env.LT_USERNAME || !process.env.LT_ACCESS_KEY)) {
  throw new Error('Cloud execution requires LT_USERNAME and LT_ACCESS_KEY in .env or the environment. Use the Automation Dashboard access key, not the login password.');
}

export default defineConfig<CloudOptions>({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 2,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: 'https://www.testmuai.com',
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },
  projects: cloud ? [
    { name: 'cloud-chrome-windows-10', workers: 1, use: { browserName: 'chromium', cloudTarget: { browser: 'Chrome', platform: 'Windows 10' } } },
    { name: 'cloud-firefox-macos-sonoma', workers: 1, use: { browserName: 'firefox', cloudTarget: { browser: 'pw-firefox', platform: 'macOS Sonoma' } } },
  ] : [
    { name: 'local-chromium', use: { browserName: 'chromium' } },
    { name: 'local-firefox', use: { browserName: 'firefox' } },
  ],
});
