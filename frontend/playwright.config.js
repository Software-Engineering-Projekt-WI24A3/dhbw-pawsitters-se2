const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
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
