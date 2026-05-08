const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');
const { readHeaderRepositoryMenuHrefs } = require('./support/repository');
const {
  expectNoLegacyLoginRouteLinks,
  openLoginModal,
  closeLoginModal
} = require('./support/auth');

test.describe('Auth modal locale routing', () => {
  test('should open login modal in English and switch back to German', async ({ page }) => {
    await page.goto('/?locale=en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expectNoLegacyLoginRouteLinks(page);
    await openLoginModal(page, { locale: 'en' });

    const repositoryLinks = await readHeaderRepositoryMenuHrefs(page);
    expect(repositoryLinks).toEqual([
      '/repository/playwright?locale=en',
      '/repository/api?locale=en',
      '/repository/git?locale=en',
      '/repository/kanban?locale=en'
    ]);
    await expect(page.locator('.header_actions .locale_menu__summary')).toContainText(token('en', 'locale.en.code'));

    await closeLoginModal(page);
    await page.locator('.header_actions .locale_menu__summary').click();
    await page.locator('.header_actions .locale_menu__item').filter({ hasText: token('en', 'locale.de.label') }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await openLoginModal(page, { locale: 'de' });
    await closeLoginModal(page);
  });

  test('should open login modal from register page and switch locale to English', async ({ page }) => {
    await page.goto('/register?locale=ro');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ro');
    await expect(page.getByRole('heading', { name: token('ro', 'auth.register.title') })).toBeVisible();
    await expectNoLegacyLoginRouteLinks(page);
    await openLoginModal(page, {
      locale: 'ro',
      trigger: page.getByRole('button', { name: token('ro', 'auth.register.alt.cta') })
    });

    const repositoryLinks = await readHeaderRepositoryMenuHrefs(page);
    expect(repositoryLinks).toEqual([
      '/repository/playwright?locale=ro',
      '/repository/api?locale=ro',
      '/repository/git?locale=ro',
      '/repository/kanban?locale=ro'
    ]);
    await expect(page.locator('.header_actions .locale_menu__summary')).toContainText(token('ro', 'locale.ro.code'));

    await closeLoginModal(page);
    await page.locator('.header_actions .locale_menu__summary').click();
    await expect(page.locator('.header_actions .locale_menu__item')).toHaveCount(3);
    await page.locator('.header_actions .locale_menu__item').filter({ hasText: token('ro', 'locale.en.label') }).click();

    await expect(page).toHaveURL(/\/register\?locale=en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await openLoginModal(page, {
      locale: 'en',
      trigger: page.getByRole('button', { name: token('en', 'auth.register.alt.cta') })
    });
    await closeLoginModal(page);
  });

  test('should open the login modal when clicking a legacy /login link', async ({ page }) => {
    await page.goto('/?locale=de');
    const initialUrl = page.url();

    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expectNoLegacyLoginRouteLinks(page);

    await page.evaluate(() => {
      const legacyLink = document.createElement('a');
      legacyLink.id = 'legacy-login-link';
      legacyLink.href = '/login?locale=de';
      legacyLink.textContent = 'Legacy Login';
      document.body.appendChild(legacyLink);
    });

    await openLoginModal(page, {
      locale: 'de',
      trigger: page.locator('#legacy-login-link')
    });
    await expect(page).toHaveURL(initialUrl);
    await closeLoginModal(page);
  });
});
