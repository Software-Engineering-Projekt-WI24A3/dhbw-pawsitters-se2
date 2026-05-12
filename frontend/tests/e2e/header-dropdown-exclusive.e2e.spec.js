const { test, expect } = require('@playwright/test');

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

test.describe('Header dropdown exclusivity', () => {
  test('should keep only one corporate header dropdown open at a time', async ({ page }) => {
    const email = 'dropdown.user@example.com';

    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildSessionResponse(true, email))
      });
    });

    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'Profile loaded.',
          data: {
            id: 42,
            email,
            firstName: 'Dropdown',
            lastName: 'Tester'
          },
          error: null,
          meta: {
            path: '/api/users/me',
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/repository/git?locale=de');

    const localeDetails = page.locator('.header_actions details.locale_menu').first();
    const localeSummary = page.locator('.header_actions .locale_menu__summary').first();
    const userDetails = page.locator('.header_actions details.user_menu').first();
    const userSummary = page.locator('.header_actions .user_menu__summary').first();

    await expect(userSummary).toBeVisible();

    await localeSummary.click();
    await expect(localeDetails).toHaveAttribute('open', '');
    await expect(userDetails).not.toHaveAttribute('open', '');

    await userSummary.click();
    await expect(userDetails).toHaveAttribute('open', '');
    await expect(localeDetails).not.toHaveAttribute('open', '');

    await localeSummary.click();
    await expect(localeDetails).toHaveAttribute('open', '');
    await expect(userDetails).not.toHaveAttribute('open', '');
  });
});
