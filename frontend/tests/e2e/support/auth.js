const { expect } = require('@playwright/test');
const { token } = require('./i18n');

function loginModal(page) {
  return page.locator('.auth_modal');
}

function headerLoginButton(page, locale = 'de') {
  return page.locator('.header_actions').getByRole('button', {
    name: token(locale, 'nav.login'),
    exact: true
  });
}

async function expectNoLegacyLoginRouteLinks(page) {
  await expect(
    page.locator('a[href$="/login"], a[href*="/login?"], a[href*="/login#"]')
  ).toHaveCount(0);
}

async function assertLoginModalContent(page, locale = 'de') {
  const modal = loginModal(page);
  await expect(modal).toBeVisible();
  await expect(
    modal.getByRole('heading', { name: token(locale, 'auth.modal.title') })
  ).toBeVisible();
  await expect(
    modal.getByRole('textbox', { name: token(locale, 'auth.modal.identifier') })
  ).toBeVisible();
  await expect(modal.locator('input[data-auth-login-identifier]')).toHaveCount(1);
  await expect(modal.locator('input[type="password"]')).toHaveCount(0);
  await expect(modal.locator('.auth_modal__brand-icon')).toBeVisible();
  await expect(
    modal.getByRole('button', { name: token(locale, 'auth.modal.continue'), exact: true })
  ).toBeVisible();
}

async function openLoginModal(page, options = {}) {
  const {
    locale = 'de',
    trigger = headerLoginButton(page, locale),
    keepUrl = true
  } = options;
  const currentUrl = page.url();

  await trigger.click();
  await assertLoginModalContent(page, locale);
  await expect(page.locator('body')).toHaveClass(/body--modal-open/);

  if (keepUrl) {
    await expect(page).toHaveURL(currentUrl);
  }
}

async function closeLoginModal(page) {
  const modal = loginModal(page);
  await modal.locator('.auth_modal__close').click();
  await expect(modal).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/body--modal-open/);
}

module.exports = {
  loginModal,
  headerLoginButton,
  expectNoLegacyLoginRouteLinks,
  assertLoginModalContent,
  openLoginModal,
  closeLoginModal
};
