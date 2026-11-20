import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT || 41900);
const testServerUrl = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  use: { baseURL: testServerUrl, trace: 'retain-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {} } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'node tools/serve-test.mjs',
    env: { PORT: String(port) },
    url: testServerUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000
  }
});
