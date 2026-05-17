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

test.describe('My offers card backgrounds', () => {
  test('uses gray fallback without image and a darkened image background when available', async ({ page }) => {
    const sessionState = {
      loggedIn: true,
      email: 'host@example.com'
    };

    const offers = [
      {
        id: 51,
        title: 'Ohne Bild',
        description: 'Fallback ohne Bild',
        pricePerDay: 25,
        acceptedPetSpecies: ['DOG'],
        services: ['Spaziergang'],
        availableFrom: '2026-06-01',
        availableTo: '2026-06-03',
        status: 'PUBLISHED'
      },
      {
        id: 52,
        title: 'Mit Bild',
        description: 'Soll abgedunkeltes Hintergrundbild zeigen',
        pricePerDay: 35,
        acceptedPetSpecies: ['CAT'],
        services: ['Fuetterung'],
        availableFrom: '2026-06-05',
        availableTo: '2026-06-07',
        imagePath: '/assets/media/pawsitters-scene.svg',
        status: 'PUBLISHED'
      }
    ];

    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildSessionResponse(sessionState.loggedIn, sessionState.email))
      });
    });

    await page.route('**/api/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'User retrieved successfully.',
          data: {
            id: 101,
            email: sessionState.email,
            firstName: 'Mara',
            lastName: 'Host',
            profilePicture: '/assets/media/favicon.png',
            role: 'HOST',
            acceptedPetSpecies: ['DOG']
          },
          error: null,
          meta: {
            path: '/api/users/me',
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.route('**/api/users/202*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'User retrieved successfully.',
          data: {
            id: 202,
            email: 'public-host@example.com',
            firstName: 'Public',
            lastName: 'Host',
            role: 'HOST',
            city: 'Munich',
            profilePicture: '/assets/media/favicon.png',
            acceptedPetSpecies: ['DOG'],
            pets: []
          },
          error: null,
          meta: {
            path: '/api/users/202',
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.route('**/api/pets/choices*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          choices: ['DOG', 'CAT']
        })
      });
    });

    await page.route('**/api/offers/host/202*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'Offers retrieved successfully.',
          data: offers,
          error: null,
          meta: {
            path: '/api/offers/host/202',
            timestamp: new Date().toISOString(),
            count: offers.length
          }
        })
      });
    });

    await page.route('**/api/offers', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'Offers retrieved successfully.',
          data: offers,
          error: null,
          meta: {
            path: '/api/offers',
            timestamp: new Date().toISOString(),
            count: offers.length
          }
        })
      });
    });

    await page.goto('/profile/my-offers?locale=de');

    const ownOffersCarousel = page.locator('.my_offers_carousel').first();
    const ownCenterCard = ownOffersCarousel.locator('.my_offers_carousel__card--center .my_offers_card');
    await expect(ownCenterCard).toBeVisible();
    await expect(ownCenterCard).not.toHaveClass(/my_offers_card--with-image/);
    await expect(ownCenterCard).not.toHaveAttribute('style', /--my-offer-card-image/);

    await ownOffersCarousel.getByRole('button', { name: token('de', 'myOffers.page.actions.next'), exact: true }).click();
    await expect(ownCenterCard).toHaveClass(/my_offers_card--with-image/);
    await expect(ownCenterCard).toHaveAttribute('style', /--my-offer-card-image/);

    await page.goto('/profile/202?locale=de');
    await page.getByRole('button', { name: token('de', 'profile.page.tabs.offers'), exact: true }).click();

    const publicOffersPanel = page.locator('[data-segment-value="offers"]');
    await expect(publicOffersPanel).toBeVisible();
    const publicCenterCard = publicOffersPanel.locator('.my_offers_carousel__card--center .my_offers_card');
    await expect(publicCenterCard).toBeVisible();
    await expect(publicCenterCard).not.toHaveClass(/my_offers_card--with-image/);
    await expect(publicCenterCard).not.toHaveAttribute('style', /--my-offer-card-image/);

    await publicOffersPanel.locator('.my_offers_carousel__nav--next').click();
    await expect(publicCenterCard).toHaveClass(/my_offers_card--with-image/);
    await expect(publicCenterCard).toHaveAttribute('style', /--my-offer-card-image/);
  });
});
