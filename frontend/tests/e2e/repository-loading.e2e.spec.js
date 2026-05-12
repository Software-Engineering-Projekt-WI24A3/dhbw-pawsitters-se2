const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');
const { loadLiveRepository } = require('./support/repository');
const {
  expectNoLegacyLoginRouteLinks,
  openLoginModal,
  closeLoginModal
} = require('./support/auth');

test.describe('Repository live loading', () => {
  test('should keep git and kanban content pending until live data resolves', async ({ page }) => {
    const pendingLiveRequestResolvers = [];
    const observedLiveRequestUrls = [];

    await page.route('**/api/repository/live.json*', async (route) => {
      const requestUrl = route.request().url();
      const locale = new URL(requestUrl).searchParams.get('locale');
      if (locale === 'de') {
        observedLiveRequestUrls.push(requestUrl);
        await new Promise((resolve) => pendingLiveRequestResolvers.push(resolve));
      }
      try {
        const response = await route.fetch();
        await route.fulfill({ response });
      } catch (error) {
        const message = String(error?.message || '');
        if (/ECONNRESET|aborted|canceled|closed/i.test(message)) {
          await route.abort();
          return;
        }
        throw error;
      }
    });

    const releaseAllPendingLiveRequests = async () => {
      await expect.poll(() => pendingLiveRequestResolvers.length, { timeout: 10000 }).toBeGreaterThan(0);
      while (pendingLiveRequestResolvers.length > 0) {
        const release = pendingLiveRequestResolvers.shift();
        release();
      }
    };

    await page.goto('/repository/git');
    await expect.poll(() => observedLiveRequestUrls.length, { timeout: 10000 }).toBeGreaterThanOrEqual(1);
    await expect(page.locator('.repository_stage .repository_surface')).toHaveCount(0);
    await releaseAllPendingLiveRequests();
    await expect(page.locator('.repository_live_loading')).toBeHidden({ timeout: 20000 });
    await expect.poll(async () => page.locator('.repository_stage .repository_surface').count(), { timeout: 20000 })
      .toBeGreaterThan(0);
    await expectNoLegacyLoginRouteLinks(page);
    await openLoginModal(page, { locale: 'de' });
    await closeLoginModal(page);

    await page.goto('/repository/kanban');
    await expect.poll(() => observedLiveRequestUrls.length, { timeout: 10000 }).toBeGreaterThanOrEqual(2);
    await expect(page.locator('.board_legend')).toHaveCount(0);
    await expect(page.locator('.board_stage')).toHaveCount(0);
    await releaseAllPendingLiveRequests();
    await expect(page.locator('.repository_live_loading')).toBeHidden({ timeout: 20000 });
    await expect(page.locator('.board_legend')).toHaveCount(1, { timeout: 20000 });
    await expect(page.locator('.board_stage')).toHaveCount(1, { timeout: 20000 });
    expect(observedLiveRequestUrls.every((url) => new URL(url).searchParams.get('locale') === 'de')).toBe(true);
  });

  test('should request a fresh snapshot when the refresh action is triggered', async ({ page }) => {
    const snapshot = await loadLiveRepository(page, 'de');
    const observedRepositoryUrls = [];

    await page.route('**/api/repository/live.json*', async (route) => {
      const requestUrl = route.request().url();
      observedRepositoryUrls.push(requestUrl);

      const parsedUrl = new URL(requestUrl);
      if (parsedUrl.searchParams.get('refresh') === '1') {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(snapshot)
      });
    });

    await page.goto('/repository/git');
    await expect(page.locator('.repository_live_loading')).toBeHidden({ timeout: 20000 });

    const refreshButton = page.getByRole('button', { name: token('de', 'repository.refresh'), exact: true });
    await refreshButton.click();
    await expect(refreshButton).toBeDisabled();

    await expect.poll(() => {
      return observedRepositoryUrls.find((url) => {
        return new URL(url).searchParams.get('refresh') === '1';
      }) ?? '';
    }, { timeout: 10000 }).not.toBe('');

    const refreshRequestUrl = observedRepositoryUrls.find((url) => {
      return new URL(url).searchParams.get('refresh') === '1';
    });
    const refreshParams = new URL(refreshRequestUrl).searchParams;

    expect(refreshParams.get('locale')).toBe('de');
    expect(refreshParams.get('refresh')).toBe('1');
    expect(refreshParams.get('_')).toBeTruthy();
    await expect(refreshButton).toBeEnabled();
  });
});
