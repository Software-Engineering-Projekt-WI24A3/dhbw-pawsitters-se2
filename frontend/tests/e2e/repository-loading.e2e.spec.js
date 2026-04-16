const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');
const { loadLiveRepository } = require('./support/repository');

test.describe('Repository live loading', () => {
  test('should show the live loading state before git and kanban data is rendered', async ({ page }) => {
    await page.route('**/api/repository/live.json?locale=de*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const response = await route.fetch();
      await route.fulfill({ response });
    });

    await page.goto('/git');
    await expect(page.locator('.repository_live_loading')).toBeVisible();
    await expect(page.locator('.repository_live_loading__text')).toHaveText(token('de', 'repository.liveLoading'));
    await expect(page.locator('.repository_live_loading__dot')).toHaveCount(3);
    await expect(page.locator('.repository_stage .repository_surface')).toHaveCount(0);
    await expect(page.locator('.repository_live_loading')).toBeHidden({ timeout: 20000 });
    await expect(page.locator('.repository_stage .repository_surface')).toHaveCount(2);

    await page.goto('/kanban');
    await expect(page.locator('.repository_live_loading')).toBeVisible();
    await expect(page.locator('.repository_live_loading__text')).toHaveText(token('de', 'repository.liveLoading'));
    await expect(page.locator('.board_legend')).toHaveCount(0);
    await expect(page.locator('.board_stage')).toHaveCount(0);
    await expect(page.locator('.repository_live_loading')).toBeHidden({ timeout: 20000 });
    await expect(page.locator('.board_legend')).toHaveCount(1);
    await expect(page.locator('.board_stage')).toHaveCount(1);
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

    await page.goto('/git');
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
