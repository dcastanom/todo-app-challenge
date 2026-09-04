import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const FRONTEND = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const CI = !!process.env.CI;

// Playwright boots both dev servers unless E2E_NO_WEBSERVER is set.
type WebServer = NonNullable<PlaywrightTestConfig['webServer']>;
const webServer: WebServer | undefined = process.env.E2E_NO_WEBSERVER
  ? undefined
  : [
      {
        command: 'npm run dev --workspace backend',
        port: 4000,
        reuseExistingServer: !CI,
        timeout: 60_000,
        cwd: ROOT,
        // `test` silences logs and disables rate limiting for the run.
        env: { NODE_ENV: 'test' },
      },
      {
        command: 'npm run dev --workspace frontend',
        url: FRONTEND,
        reuseExistingServer: !CI,
        timeout: 60_000,
        cwd: ROOT,
      },
    ];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: FRONTEND,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(webServer ? { webServer } : {}),
});
