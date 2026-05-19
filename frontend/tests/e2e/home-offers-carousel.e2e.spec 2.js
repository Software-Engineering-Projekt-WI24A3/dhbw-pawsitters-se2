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

function buildMarketplacePayload(offers) {
  return {
    success: true,
    status: 200,
    message: 'Marketplace offers retrieved successfully.',
    data: offers,
    error: null,
    meta: {
      path: '/api/marketplace/offers',
      timestamp: new Date().toISOString(),
      count: offers.length
    }
  };
}

function buildLatestMarketplacePayload(offers) {
  return {
    success: true,
    status: 200,
    message: 'Latest marketplace offers retrieved successfully.',
    data: offers,
    error: null,
    meta: {
      path: '/api/marketplace/offers/latest',
      timestamp: new Date().toISOString(),
      count: offers.length
    }
  };
}

const marketplaceOffers = [
  {
    id: 1001,
    hostId: 501,
    hostFirstName: 'Eigene',
    hostLastName: 'Gastgeberin',
    title: 'Eigenes Hundesitting',
    description: 'Soll bei Login nicht sichtbar sein.',
    pricePerDay: 41,
    acceptedPetSpecies: ['DOG'],
    services: ['Spaziergang'],
    availableFrom: '2026-06-01',
    availableTo: '2026-06-05',
    status: 'PUBLISHED'
  },
  {
    id: 1002,
    hostId: 601,
    hostFirstName: 'Mara',
    hostLastName: 'Klein',
    title: 'Hunde in Berlin',
    description: 'Ruhige Tagesbetreuung mit Garten.',
    pricePerDay: 36,
    acceptedPetSpecies: ['DOG'],
    services: ['Spaziergang', 'Spielzeit'],
    availableFrom: '2026-06-03',
    availableTo: '2026-06-09',
    status: 'PUBLISHED'
  },
  {
    id: 1003,
    hostId: 602,
    hostFirstName: 'Lina',
    hostLastName: 'Voss',
    title: 'Katzenlounge Mitte',
    description: 'Katzenbetreuung in ruhiger Wohnung.',
    pricePerDay: 39,
    acceptedPetSpecies: ['CAT'],
    services: ['Fütterung', 'Spielzeit'],
    availableFrom: '2026-06-04',
    availableTo: '2026-06-08',
    status: 'PUBLISHED'
  },
  {
    id: 1004,
    hostId: 603,
    hostFirstName: 'Noah',
    hostLastName: 'Berg',
    title: 'Kaninchenhof',
    description: 'Innen- und Außenbereich mit Rückzugsorten.',
    pricePerDay: 29,
    acceptedPetSpecies: ['RABBIT'],
    services: ['Fütterung'],
    availableFrom: '2026-06-05',
    availableTo: '2026-06-10',
    status: 'PUBLISHED'
  },
  {
    id: 1005,
    hostId: 604,
    hostFirstName: 'Lea',
    hostLastName: 'Sommer',
    title: 'Papagei Care',
    description: 'Erfahrene Betreuung für Vögel.',
    pricePerDay: 34,
    acceptedPetSpecies: ['PARROT'],
    services: ['Freiflugzeit'],
    availableFrom: '2026-06-07',
    availableTo: '2026-06-14',
    status: 'PUBLISHED'
  },
  {
    id: 1006,
    hostId: 605,
    hostFirstName: 'Tom',
    hostLastName: 'Lenz',
    title: 'Hamster Nest',
    description: 'Sanfte Betreuung mit fester Routine.',
    pricePerDay: 23,
    acceptedPetSpecies: ['HAMSTER'],
    services: ['Fütterung'],
    availableFrom: '2026-06-06',
    availableTo: '2026-06-11',
    status: 'PUBLISHED'
  },
  {
    id: 1007,
    hostId: 606,
    hostFirstName: 'Iris',
    hostLastName: 'Lang',
    title: 'Pferdepark Wochenende',
    description: 'Weidezeit und tägliche Kontrolle.',
    pricePerDay: 58,
    acceptedPetSpecies: ['HORSE'],
    services: ['Auslauf'],
    availableFrom: '2026-06-10',
    availableTo: '2026-06-16',
    status: 'PUBLISHED'
  },
  {
    id: 1008,
    hostId: 607,
    hostFirstName: 'Mia',
    hostLastName: 'Graf',
    title: 'Fischhotel',
    description: 'Aquariumservice inklusive Kontrolle.',
    pricePerDay: 18,
    acceptedPetSpecies: ['FISH'],
    services: ['Wassercheck'],
    availableFrom: '2026-06-12',
    availableTo: '2026-06-18',
    status: 'PUBLISHED'
  }
];

const latestMarketplaceOffers = [
  {
    id: 1010,
    hostId: 609,
    hostFirstName: 'Sina',
    hostLastName: 'Reiter',
    title: 'Penthouse Paws',
    description: 'Ruhige Premium-Betreuung über den Dächern.',
    pricePerDay: 62,
    acceptedPetSpecies: ['DOG'],
    services: ['Spaziergang', 'Training'],
    availableFrom: '2026-06-13',
    availableTo: '2026-06-20',
    status: 'PUBLISHED'
  },
  {
    id: 1009,
    hostId: 608,
    hostFirstName: 'Jule',
    hostLastName: 'Kramer',
    title: 'Rheinblick Cats',
    description: 'Katzenbetreuung mit Blick aufs Wasser.',
    pricePerDay: 46,
    acceptedPetSpecies: ['CAT'],
    services: ['Spielzeit', 'Fütterung'],
    availableFrom: '2026-06-13',
    availableTo: '2026-06-19',
    status: 'PUBLISHED'
  },
  ...marketplaceOffers.slice().reverse()
];

const hostCities = {
  501: 'Berlin',
  601: 'Berlin',
  602: 'Hamburg',
  603: 'Bremen',
  604: 'Leipzig',
  605: 'Köln',
  606: 'Dresden',
  607: 'Stuttgart',
  608: 'Düsseldorf',
  609: 'Frankfurt'
};

test.describe('Home offers carousel', () => {
  test('excludes own published offers when logged in and supports species filter plus center modal', async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 920 });

    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildSessionResponse(true, 'owner@example.com'))
      });
    });

    await page.route('**/api/users/me*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'User retrieved successfully.',
          data: {
            id: 501,
            email: 'owner@example.com',
            firstName: 'Eigene',
            lastName: 'Gastgeberin',
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

    await page.route('**/api/pets/choices*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ choices: ['DOG', 'CAT', 'RABBIT', 'PARROT', 'HAMSTER', 'HORSE', 'FISH'] })
      });
    });

    await page.route('**/api/marketplace/offers/latest*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildLatestMarketplacePayload(latestMarketplaceOffers))
      });
    });

    await page.route('**/api/marketplace/offers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildMarketplacePayload(marketplaceOffers))
      });
    });

    await page.route('**/api/users/*', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const match = pathname.match(/\/api\/users\/(\d+)$/);
      if (!match) {
        await route.fallback();
        return;
      }

      const userId = Number.parseInt(match[1], 10);
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'User retrieved successfully.',
          data: {
            id: userId,
            firstName: `Host-${userId}`,
            lastName: 'Test',
            city: hostCities[userId] || '',
            role: 'HOST',
            acceptedPetSpecies: ['DOG'],
            pets: []
          },
          error: null,
          meta: {
            path: `/api/users/${userId}`,
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/?locale=de');

    await expect(page.getByText(token('de', 'home.page.headingPrefix'))).toBeVisible();
    await expect(page.locator('.home_offers_reel__card')).toHaveCount(5);
    await expect(page.locator('.home_offers_reel__card--left-2')).toHaveCount(1);
    await expect(page.locator('.home_offers_reel__card--right-2')).toHaveCount(1);
    await expect(page.locator('.home_offer_slide--interactive')).toHaveCount(1);

    await expect(page.locator('.home_offers_reel__viewport')).not.toContainText('Eigenes Hundesitting');

    await page.locator('.home_offers_species_link').click();
    await page.locator('.home_offers_species_option').filter({ hasText: 'Katzen' }).first().click();

    await expect(page.locator('.home_offers_reel__card--center .home_offer_slide__title')).toHaveText('Katzenlounge Mitte');

    await page.locator('.home_offers_reel__card--center .home_offer_slide--interactive').click();
    const modal = page.locator('.home_offer_modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.settings_edit_modal__surface')).toBeVisible();
    await expect(modal.locator('.auth_modal__brand-icon')).toHaveAttribute('src', /1F431\.svg/);
    await expect(modal).toContainText('Katzenlounge Mitte');
    await expect(modal).toContainText('Hamburg');
    await modal.locator('.auth_modal__close').click();
    await expect(modal).toBeHidden();

    const latestSection = page.locator('.home_latest_offers');
    await expect(latestSection.getByText(token('de', 'home.page.latest.heading'))).toBeVisible();
    await expect(page.locator('.home_latest_offers__item--full')).toHaveCount(5);
    await expect(page.locator('.home_latest_offers__item--peek-right')).toHaveCount(1);
    await expect(page.locator('.home_latest_offers__item--peek-left')).toHaveCount(0);
    await expect(page.locator('.home_latest_offers__item--full .home_latest_offer_card__title').first()).toHaveText('Penthouse Paws');
    await expect(latestSection.locator('.my_offers_carousel__nav--next')).toBeVisible();
    await expect(latestSection.locator('.my_offers_carousel__nav--prev')).toHaveCount(0);

    await latestSection.locator('.my_offers_carousel__nav--next').click();

    await expect(page.locator('.home_latest_offers__item--full')).toHaveCount(4);
    await expect(page.locator('.home_latest_offers__item--peek-right')).toHaveCount(1);
    await expect(page.locator('.home_latest_offers__item--peek-left')).toHaveCount(1);
    await expect(latestSection.locator('.my_offers_carousel__nav--prev')).toBeVisible();
    await expect(latestSection.locator('.my_offers_carousel__nav--next')).toBeVisible();

    for (let step = 0; step < 4; step += 1) {
      await latestSection.locator('.my_offers_carousel__nav--next').click();
    }

    await expect(page.locator('.home_latest_offers__item--full')).toHaveCount(5);
    await expect(page.locator('.home_latest_offers__item--peek-left')).toHaveCount(1);
    await expect(page.locator('.home_latest_offers__item--peek-right')).toHaveCount(0);
    await expect(page.locator('.home_latest_offers__item--full .home_latest_offer_card__title').first()).toHaveText('Papagei Care');
    await expect(latestSection.locator('.my_offers_carousel__nav--next')).toHaveCount(0);
    await expect(latestSection.locator('.my_offers_carousel__nav--prev')).toBeVisible();
  });

  test('shows all published offers when user is not logged in', async ({ page }) => {
    await page.setViewportSize({ width: 1360, height: 920 });

    await page.route('**/api/auth/session*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildSessionResponse(false, ''))
      });
    });

    await page.route('**/api/pets/choices*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ choices: ['DOG', 'CAT', 'RABBIT', 'PARROT', 'HAMSTER', 'HORSE', 'FISH'] })
      });
    });

    await page.route('**/api/marketplace/offers/latest*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildLatestMarketplacePayload(latestMarketplaceOffers))
      });
    });

    await page.route('**/api/marketplace/offers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(buildMarketplacePayload(marketplaceOffers))
      });
    });

    await page.route('**/api/users/*', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
      const match = pathname.match(/\/api\/users\/(\d+)$/);
      if (!match) {
        await route.fallback();
        return;
      }

      const userId = Number.parseInt(match[1], 10);
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'User retrieved successfully.',
          data: {
            id: userId,
            firstName: `Host-${userId}`,
            lastName: 'Test',
            city: hostCities[userId] || '',
            role: 'HOST',
            acceptedPetSpecies: ['DOG'],
            pets: []
          },
          error: null,
          meta: {
            path: `/api/users/${userId}`,
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/?locale=de');

    await expect(page.locator('.home_offers_reel__card--center .home_offer_slide__title')).toHaveText('Eigenes Hundesitting');
    await expect(page.locator('.home_offers_reel__card')).toHaveCount(5);
    await expect(page.getByText(token('de', 'home.page.latest.heading'))).toBeVisible();
    await expect(page.locator('.home_latest_offers__item--full')).toHaveCount(5);
    await expect(page.locator('.home_latest_offers__item--peek-right')).toHaveCount(1);
  });
});
