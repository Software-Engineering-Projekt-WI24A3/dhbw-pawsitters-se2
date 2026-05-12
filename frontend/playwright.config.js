const { defineConfig } = require('@playwright/test');
const isCI = Boolean(process.env.CI);

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: isCI ? 2 : 1,
  workers: isCI ? 2 : 2,
  expect: {
    timeout: 5000
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run dev:test',
    cwd: __dirname,
    url: 'http://127.0.0.1:4173/',
    timeout: 120000,
    reuseExistingServer: true
  }
});
