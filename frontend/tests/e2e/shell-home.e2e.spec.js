const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');
const {
  expectNoLegacyLoginRouteLinks,
  openLoginModal,
  closeLoginModal
} = require('./support/auth');

test.describe('Shell home', () => {
  test('should render the global start page without repository graph content', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('#site-shell-header')).toBeVisible();
    await expect(page.getByRole('link', { name: token('de', 'brand.name'), exact: true })).toBeVisible();
    await expect(page.locator('.git_graph')).toHaveCount(0);
    await expectNoLegacyLoginRouteLinks(page);
    await openLoginModal(page, { locale: 'de' });
    await closeLoginModal(page);

    const headerPosition = await page.locator('#site-shell-header').evaluate((element) => {
      return window.getComputedStyle(element).position;
    });

    expect(headerPosition).toBe('sticky');
  });
});
