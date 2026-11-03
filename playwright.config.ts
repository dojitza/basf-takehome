import { defineConfig, devices } from '@playwright/test';

if (!process.env['BROWSER_TEST_BASE_URL']) {
  throw new Error(
    'Run browser tests with npm run test:e2e to create an isolated stack',
  );
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 15000,
  expect: { timeout: 2500 },
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env['BROWSER_TEST_BASE_URL'],
    trace: 'retain-on-failure',
  },
});
