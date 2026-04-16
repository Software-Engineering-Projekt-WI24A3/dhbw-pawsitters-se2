const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');

test.describe('Repository playwright view', () => {
  test('should render runner status and trigger a new e2e run', async ({ page }) => {
    const initialStatus = {
      runner: {
        runId: 12,
        running: false,
        startedAt: '2026-04-16T14:08:00.000Z',
        finishedAt: '2026-04-16T14:09:11.000Z',
        exitCode: 0
      },
      summary: {
        total: 3,
        passed: 2,
        failed: 1,
        pending: 0,
        status: 'failed'
      },
      tests: [
        {
          id: 'e2e/repository-loading.e2e.spec.js:7:3 › Repository live loading › should show the live loading state before git and kanban data is rendered',
          location: 'e2e/repository-loading.e2e.spec.js:7:3',
          title: 'Repository live loading › should show the live loading state before git and kanban data is rendered',
          name: 'should show the live loading state before git and kanban data is rendered',
          status: 'passed',
          durationMs: 1980
        },
        {
          id: 'e2e/repository-loading.e2e.spec.js:35:3 › Repository live loading › should request a fresh snapshot when the refresh action is triggered',
          location: 'e2e/repository-loading.e2e.spec.js:35:3',
          title: 'Repository live loading › should request a fresh snapshot when the refresh action is triggered',
          name: 'should request a fresh snapshot when the refresh action is triggered',
          status: 'failed',
          durationMs: 3112
        },
        {
          id: 'e2e/shell-home.e2e.spec.js:5:3 › Shell home › should render the global start page without repository graph content',
          location: 'e2e/shell-home.e2e.spec.js:5:3',
          title: 'Shell home › should render the global start page without repository graph content',
          name: 'should render the global start page without repository graph content',
          status: 'skipped',
          durationMs: 0
        }
      ],
      logs: [
        { index: 0, stream: 'stdout', text: 'Running 3 tests using 1 worker', time: '2026-04-16T14:08:01.000Z' },
        { index: 1, stream: 'stdout', text: '✓ 1 [chromium] › e2e/repository-loading.e2e.spec.js:7:3', time: '2026-04-16T14:08:03.000Z' }
      ],
      nextLogIndex: 2
    };
    let currentStatus = initialStatus;

    await page.route('**/api/tests/e2e/status.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(currentStatus)
      });
    });

    await page.route('**/api/tests/e2e/run', async (route) => {
      currentStatus = {
        ...initialStatus,
        runner: {
          ...initialStatus.runner,
          runId: 13,
          running: true,
          finishedAt: '',
          exitCode: null
        },
        summary: {
          ...initialStatus.summary,
          pending: 1,
          status: 'running'
        }
      };
      await route.fulfill({
        status: 202,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(currentStatus)
      });
    });

    await page.goto('/playwright');

    await expect(page).toHaveURL(/\/repository\/playwright$/);
    await expect(page.locator('.repository_switch__button').nth(0)).toContainText(token('de', 'repository.playwright.label'));
    await expect(page.locator('.repository_switch__button').nth(1)).toContainText(token('de', 'repository.git.label'));
    await expect(page.locator('.repository_switch__button').nth(2)).toContainText(token('de', 'repository.board.label'));
    await expect(page.locator('.repository_switch__button--active')).toContainText(token('de', 'repository.playwright.label'));
    await expect(page.locator('.playwright_metric').first()).toContainText(String(initialStatus.summary.total));
    await expect(page.locator('.playwright_tests_item')).toHaveCount(initialStatus.tests.length);
    await expect(page.locator('.playwright_logs_console')).toContainText('Running 3 tests using 1 worker');

    await page.getByRole('button', { name: token('de', 'repository.playwright.run') }).click();
    await expect(page.getByRole('button', { name: token('de', 'repository.playwright.running') })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.playwright_status_badge').first()).toContainText(token('de', 'repository.playwright.status.running'));
  });

  test('should expose consistent repository switch navigation targets', async ({ page }) => {
    await page.goto('/playwright');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');

    const switchLinks = await page.locator('.repository_switch__button').evaluateAll((elements) => {
      return elements.map((element) => element.getAttribute('href'));
    });
    expect(switchLinks).toEqual([
      '/repository/playwright',
      '/repository/git',
      '/repository/kanban'
    ]);

    await page.getByRole('link', { name: token('de', 'repository.git.label') }).click();
    await expect(page).toHaveURL(/\/repository\/git$/);

    await page.getByRole('link', { name: token('de', 'repository.board.label') }).click();
    await expect(page).toHaveURL(/\/repository\/kanban$/);
  });
});
