const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');

function buildSessionResponse(loggedIn, email) {
  return {
    success: true,
    status: 200,
    message: 'Session retrieved successfully.',
    data: {
      loggedIn,
      email: loggedIn ? email : null
    },
    error: null,
    meta: {
      path: '/api/auth/session',
      timestamp: new Date().toISOString()
    }
  };
}

test.describe('Authentication flows', () => {
  test('completes full registration flow and redirects from /register to home', async ({ page }) => {
    const sessionState = {
      loggedIn: false,
      email: null
    };
    let registerPayload = null;

    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildSessionResponse(sessionState.loggedIn, sessionState.email))
      });
    });

    await page.route('**/api/auth/register', async (route) => {
      registerPayload = JSON.parse(route.request().postData() || '{}');
      sessionState.loggedIn = true;
      sessionState.email = registerPayload.email;

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'Registration successful.',
          data: {
            token: 'mock-token',
            role: 'PET_OWNER',
            passwordChangeRequired: false
          },
          error: null,
          meta: {
            path: '/api/auth/register',
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/register?locale=de');

    await page.getByRole('textbox', { name: token('de', 'auth.register.name'), exact: true }).fill('Anna Musterfrau');
    await page.getByRole('textbox', { name: token('de', 'auth.register.email'), exact: true }).fill('anna.musterfrau@example.com');
    await page.locator('input[type="password"][autocomplete="new-password"]').fill('SicheresKonto987654!');
    await page.getByRole('button', { name: token('de', 'auth.register.submit'), exact: true }).click();

    await expect.poll(() => registerPayload, { timeout: 10000 }).not.toBeNull();
    expect(registerPayload).toMatchObject({
      email: 'anna.musterfrau@example.com',
      password: 'SicheresKonto987654!',
      firstName: 'Anna',
      lastName: 'Musterfrau',
      phone: '+490000000000',
      birthDate: '1990-01-01',
      emergencyContact: 'Emergency contact',
      profilePicture: '/assets/media/favicon.png',
      bio: 'Pawsitters account',
      role: 'PET_OWNER',
      postalCode: null,
      city: null,
      acceptedPetSpecies: ['DOG']
    });

    await expect(page).toHaveURL(/\/?\?locale=de$/);
    await expect(page).not.toHaveURL(/\/register(?:\/)?(?:\?|$)/);
  });

  test('completes full modal login flow with mail check and hides login button when authenticated', async ({ page }) => {
    const sessionState = {
      loggedIn: false,
      email: null
    };
    const loginEmail = 'bestehender.user@example.com';
    let mailExistsChecks = 0;
    let loginPayload = null;

    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildSessionResponse(sessionState.loggedIn, sessionState.email))
      });
    });

    await page.route('**/api/users/mailExists*', async (route) => {
      const requestUrl = new URL(route.request().url());
      mailExistsChecks += 1;

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'Mail existence checked successfully.',
          data: {
            exists: requestUrl.searchParams.get('mail') === loginEmail
          },
          error: null,
          meta: {
            path: '/api/users/mailExists',
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.route('**/api/auth/login', async (route) => {
      loginPayload = JSON.parse(route.request().postData() || '{}');
      sessionState.loggedIn = true;
      sessionState.email = loginPayload.email;

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'Login successful.',
          data: {
            token: 'mock-token',
            role: 'PET_OWNER',
            passwordChangeRequired: false
          },
          error: null,
          meta: {
            path: '/api/auth/login',
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/repository/git?locale=de');

    await page.locator('.header_quick_menu__summary').click();
    await page
      .locator('.header_quick_menu__panel')
      .getByRole('button', { name: token('de', 'nav.login'), exact: true })
      .click();

    const modal = page.locator('.auth_modal');
    await expect(modal).toBeVisible();

    await modal.locator('input[data-auth-login-identifier]').fill(loginEmail);
    await modal.getByRole('button', { name: token('de', 'auth.modal.continue'), exact: true }).click();

    await expect.poll(() => mailExistsChecks, { timeout: 10000 }).toBe(1);
    const passwordInput = modal.locator('input[data-auth-login-password]');
    await expect(passwordInput).toBeVisible();

    await passwordInput.fill('VollstaendigSicher123!');
    await modal.getByRole('button', { name: token('de', 'auth.modal.continue'), exact: true }).click();

    await expect.poll(() => loginPayload, { timeout: 10000 }).not.toBeNull();
    expect(loginPayload).toEqual({
      email: loginEmail,
      password: 'VollstaendigSicher123!'
    });

    await expect(modal).toBeHidden({ timeout: 10000 });
    await expect.poll(async () => {
      await page.locator('.header_quick_menu__summary').click();
      const loginButtonCount = await page
        .locator('.header_quick_menu__panel')
        .getByRole('button', { name: token('de', 'nav.login'), exact: true })
        .count();
      await page.keyboard.press('Escape');
      return loginButtonCount;
    }, { timeout: 15000 }).toBe(0);
  });
});
