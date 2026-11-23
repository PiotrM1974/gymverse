import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT || 41981);
const origin = `http://127.0.0.1:${port}`;
const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['exercise-presentation-pilot.spec.js', 'exercise-images-three.spec.js', 'exercise-images-complete.spec.js'],
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: origin,
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
    launchOptions: channel ? { channel } : {}
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node tools/serve-presentation-pilot.mjs',
    env: { PORT: String(port) },
    url: `${origin}/gymverse/`,
    reuseExistingServer: false,
    timeout: 10_000
  }
});
