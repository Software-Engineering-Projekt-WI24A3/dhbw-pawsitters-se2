const { expect } = require('@playwright/test');
const { token } = require('./i18n');

const LOGIN_TRIGGER_LOOKUP_TIMEOUT_MS = 5000;
const LOGIN_TRIGGER_LOOKUP_INTERVAL_MS = 100;
const LOGIN_TRIGGER_CLICK_TIMEOUT_MS = 5000;
const LOGIN_MODAL_CLOSE_TIMEOUT_MS = 5000;

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
  const lookupLabels = Array.from(new Set([
    token(locale, 'nav.login'),
    token('de', 'nav.login'),
    token('en', 'nav.login'),
    token('ro', 'nav.login')
  ]));
  const loginLabelPattern = new RegExp(
    `^(${lookupLabels.map((label) => escapeRegex(label)).join('|')})$`,
    'i'
  );
  const desktopHeaderLoginButton = page.locator('.header_actions').getByRole('button', {
    name: loginLabelPattern
  });
  const quickMenuSummary = page.locator('.header_actions details.header_quick_menu > summary');
  const homeLoginButton = page.locator('.home_minimal__actions').getByRole('button', {
    name: loginLabelPattern
  });
  const mobileMenuButton = page.locator('.menu_button');

  const deadline = Date.now() + LOGIN_TRIGGER_LOOKUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await desktopHeaderLoginButton.first().isVisible().catch(() => false)) {
      return desktopHeaderLoginButton.first();
    }

    if (await quickMenuSummary.first().isVisible().catch(() => false)) {
      await quickMenuSummary.first().click();
      const quickMenuLoginButton = page
        .locator('.header_actions details.header_quick_menu .repo_menu__panel')
        .getByRole('button', { name: loginLabelPattern });
      await expect(quickMenuLoginButton.first()).toBeVisible();
      return quickMenuLoginButton.first();
    }

    if (await homeLoginButton.first().isVisible().catch(() => false)) {
      return homeLoginButton.first();
    }

    if (await mobileMenuButton.first().isVisible().catch(() => false)) {
      await mobileMenuButton.first().click();
      const mobileLoginButton = page.locator('.mobile_drawer').getByRole('button', {
        name: loginLabelPattern
      });
      await expect(mobileLoginButton.first()).toBeVisible();
      return mobileLoginButton.first();
    }

    await page.waitForTimeout(LOGIN_TRIGGER_LOOKUP_INTERVAL_MS);
  }

  throw new Error(`Could not resolve a visible login trigger for locale "${locale}".`);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
  await expect(modal.locator('input[data-auth-login-password]:visible')).toHaveCount(0);
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
  await page.waitForLoadState('domcontentloaded');

  if (trigger) {
    await trigger.click({ timeout: LOGIN_TRIGGER_CLICK_TIMEOUT_MS });
  } else {
    let clicked = false;
    let lastClickError = null;

    for (let attempt = 0; attempt < 2 && !clicked; attempt += 1) {
      const resolvedTrigger = await resolveDefaultLoginTrigger(page, locale);
      try {
        await resolvedTrigger.click({ timeout: LOGIN_TRIGGER_CLICK_TIMEOUT_MS });
        clicked = true;
      } catch (error) {
        lastClickError = error;
      }
    }

    if (!clicked && lastClickError) {
      throw lastClickError;
    }
  }

  await assertLoginModalContent(page, locale);
  await expect(page.locator('body')).toHaveClass(/body--modal-open/);

  if (keepUrl) {
    await expect(page).toHaveURL(currentUrl);
  }
}

async function closeLoginModal(page) {
  const modal = loginModal(page);
  const closeButton = modal.locator('.auth_modal__close');
  try {
    await closeButton.click({ timeout: LOGIN_MODAL_CLOSE_TIMEOUT_MS });
  } catch {
    await page.keyboard.press('Escape');
  }
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
