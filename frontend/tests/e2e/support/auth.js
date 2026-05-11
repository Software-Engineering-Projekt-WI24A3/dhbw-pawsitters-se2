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

async function resolveDefaultLoginTrigger(page, locale = 'de') {
  const loginLabel = token(locale, 'nav.login');
  const desktopHeaderLoginButton = page.locator('.header_actions').getByRole('button', {
    name: loginLabel,
    exact: true
  });
  if (await desktopHeaderLoginButton.isVisible().catch(() => false)) {
    return desktopHeaderLoginButton.first();
  }

  const quickMenuSummary = page.locator('.header_actions details.header_quick_menu > summary');
  if (await quickMenuSummary.isVisible().catch(() => false)) {
    await quickMenuSummary.first().click();
    const quickMenuLoginButton = page
      .locator('.header_actions details.header_quick_menu .repo_menu__panel')
      .getByRole('button', { name: loginLabel, exact: true });
    await expect(quickMenuLoginButton).toBeVisible();
    return quickMenuLoginButton.first();
  }

  const homeLoginButton = page.locator('.home_minimal__actions').getByRole('button', {
    name: loginLabel,
    exact: true
  });
  if (await homeLoginButton.isVisible().catch(() => false)) {
    return homeLoginButton.first();
  }

  const mobileMenuButton = page.locator('.menu_button');
  if (await mobileMenuButton.isVisible().catch(() => false)) {
    await mobileMenuButton.click();
    const mobileLoginButton = page.locator('.mobile_drawer').getByRole('button', {
      name: loginLabel,
      exact: true
    });
    await expect(mobileLoginButton).toBeVisible();
    return mobileLoginButton.first();
  }

  throw new Error(`Could not resolve a visible login trigger for locale "${locale}".`);
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
    trigger = null,
    keepUrl = true
  } = options;
  const currentUrl = page.url();
  const loginTrigger = trigger || await resolveDefaultLoginTrigger(page, locale);

  await loginTrigger.click();
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
