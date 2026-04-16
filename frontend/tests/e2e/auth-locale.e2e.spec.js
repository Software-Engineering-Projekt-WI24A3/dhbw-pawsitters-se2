const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');
const { readHeaderRepositoryMenuHrefs } = require('./support/repository');

test.describe('Auth locale routing', () => {
  test('should render login in English and switch back to German', async ({ page }) => {
    await page.goto('/login?locale=en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: token('en', 'auth.login.title') })).toBeVisible();

    const repositoryLinks = await readHeaderRepositoryMenuHrefs(page);
    expect(repositoryLinks).toEqual([
      '/repository/playwright?locale=en',
      '/repository/git?locale=en',
      '/repository/kanban?locale=en'
    ]);
    await expect(page.locator('.header_actions .locale_menu__summary')).toContainText(token('en', 'locale.en.code'));

    await page.locator('.header_actions .locale_menu__summary').click();
    await page.locator('.header_actions .locale_menu__item').filter({ hasText: token('en', 'locale.de.label') }).click();

    await expect(page).toHaveURL(/\/login(?:\?locale=de)?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });

  test('should render register in French and switch to English', async ({ page }) => {
    await page.goto('/register?locale=fr');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { name: token('fr', 'auth.register.title') })).toBeVisible();

    const repositoryLinks = await readHeaderRepositoryMenuHrefs(page);
    expect(repositoryLinks).toEqual([
      '/repository/playwright?locale=fr',
      '/repository/git?locale=fr',
      '/repository/kanban?locale=fr'
    ]);
    await expect(page.locator('.header_actions .locale_menu__summary')).toContainText(token('fr', 'locale.fr.code'));

    await page.locator('.header_actions .locale_menu__summary').click();
    await expect(page.locator('.header_actions .locale_menu__item')).toHaveCount(3);
    await page.locator('.header_actions .locale_menu__item').filter({ hasText: token('fr', 'locale.en.label') }).click();

    await expect(page).toHaveURL(/\/register\?locale=en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
