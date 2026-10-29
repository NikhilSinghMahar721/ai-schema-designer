/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['dot', {outputMode: 'summary'}]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'Chromium',
      use: { ...config.use, browser: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { ...config.use, browser: 'firefox' },
    },
    {
      name: 'WebKit',
      use: { ...config.use, browser: 'webkit' },
    },
  ],
};

export default config;