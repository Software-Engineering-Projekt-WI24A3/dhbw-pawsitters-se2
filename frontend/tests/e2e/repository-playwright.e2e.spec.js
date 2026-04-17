const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');
const {
  expectNoLegacyLoginRouteLinks,
  openLoginModal,
  closeLoginModal
} = require('./support/auth');

test.describe('Repository playwright view', () => {
  test('should render a minimal start state, run tests, and show completion notification', async ({ page }) => {
    const completedStatus = {
      runner: {
        runId: 13,
        running: false,
        startedAt: '2026-04-16T14:08:00.000Z',
        finishedAt: '2026-04-16T14:09:11.000Z',
        exitCode: 1
      },
      summary: {
        total: 3,
        passed: 2,
        failed: 1,
        pending: 0,
        status: 'failed'
      },
      tests: [],
      logs: [
        { index: 0, stream: 'stdout', text: 'Running 3 tests using 1 worker', time: '2026-04-16T14:08:01.000Z' },
        { index: 1, stream: 'stdout', text: '✓ 1 [chromium] › e2e/repository-loading.e2e.spec.js:7:3', time: '2026-04-16T14:08:03.000Z' },
        { index: 2, stream: 'stdout', text: '✘ 2 [chromium] › e2e/repository-loading.e2e.spec.js:35:3', time: '2026-04-16T14:08:05.000Z' }
      ],
      nextLogIndex: 3
    };
    const runningStatus = {
      ...completedStatus,
      runner: {
        ...completedStatus.runner,
        running: true,
        finishedAt: '',
        exitCode: null
      },
      summary: {
        ...completedStatus.summary,
        pending: 1,
        status: 'running'
      },
      logs: completedStatus.logs.slice(0, 1),
      nextLogIndex: 1
    };

    let currentStatus = {
      ...completedStatus,
      runner: {
        ...completedStatus.runner,
        runId: 12
      }
    };
    let statusRequestCount = 0;

    await page.route('**/api/tests/e2e/status.json*', async (route) => {
      statusRequestCount += 1;
      if (currentStatus.runner.runId === 13 && statusRequestCount >= 2) {
        currentStatus = completedStatus;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(currentStatus)
      });
    });

    await page.route('**/api/tests/e2e/run', async (route) => {
      currentStatus = runningStatus;
      statusRequestCount = 0;
      await route.fulfill({
        status: 202,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(currentStatus)
      });
    });

    await page.goto('/repository/playwright');

    await expect(page).toHaveURL(/\/repository\/playwright$/);
    await expect(page.locator('.repository_switch__button').nth(0)).toContainText(token('de', 'repository.playwright.label'));
    await expect(page.locator('.repository_switch__button').nth(1)).toContainText(token('de', 'repository.git.label'));
    await expect(page.locator('.repository_switch__button').nth(2)).toContainText(token('de', 'repository.board.label'));
    await expect(page.locator('.repository_switch__button--active')).toContainText(token('de', 'repository.playwright.label'));
    await expect(page.getByRole('heading', { name: token('de', 'repository.playwright.title') })).toBeVisible();
    await expect(page.getByRole('button', { name: token('de', 'repository.playwright.run') })).toBeVisible();
    await expectNoLegacyLoginRouteLinks(page);
    await openLoginModal(page, { locale: 'de' });
    await closeLoginModal(page);
    await expect(page.locator('.playwright_run_surface')).toHaveCount(0);

    await page.getByRole('button', { name: token('de', 'repository.playwright.run') }).click();
    await expect(page.getByRole('button', { name: token('de', 'repository.playwright.running') })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.playwright_run_surface')).toBeVisible();
    await expect(page.locator('.repository_live_loading.playwright_live_loading')).toBeVisible();
    await expect(page.locator('.repository_live_loading__text')).toHaveText(token('de', 'repository.playwright.loading'));
    await expect(page.locator('.repository_live_loading__dot')).toHaveCount(3);
    await expect(page.locator('.playwright_logs_console')).toContainText('Running 3 tests using 1 worker');

    await expect(page.locator('.repository_live_loading.playwright_live_loading')).toBeHidden({ timeout: 15000 });
    await expect(page.locator('.site_notification').first()).toContainText(token('de', 'repository.playwright.notificationTitle'), { timeout: 15000 });
    await expect(page.locator('.site_notification').first()).toContainText(`2 ${token('de', 'repository.playwright.status.passed')}`);
    await expect(page.locator('.site_notification').first()).toContainText(`1 ${token('de', 'repository.playwright.status.failed')}`);
  });

  test('should expose consistent repository switch navigation targets', async ({ page }) => {
    await page.goto('/repository/playwright');
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expectNoLegacyLoginRouteLinks(page);

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
