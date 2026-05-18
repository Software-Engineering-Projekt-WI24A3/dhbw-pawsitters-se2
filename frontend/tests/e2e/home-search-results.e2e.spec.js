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

function buildMarketplacePayload(path, message, data, count = null) {
  return {
    success: true,
    status: 200,
    message,
    data,
    error: null,
    meta: {
      path,
      timestamp: new Date().toISOString(),
      count: Number.isInteger(count) ? count : Array.isArray(data) ? data.length : 0
    }
  };
}

const matchingOffers = [
  {
    id: 3201,
    hostId: 901,
    hostFirstName: 'Lea',
    hostLastName: 'Sommer',
    title: 'Morgenrunde im Park',
    location: 'Berlin Mitte',
    description: 'Hunde werden in ruhiger Umgebung betreut.',
    pricePerDay: 48,
    acceptedPetSpecies: ['DOG'],
    services: ['Spaziergang'],
    availableFrom: '2026-06-10',
    availableTo: '2026-06-16',
    status: 'PUBLISHED'
  },
  {
    id: 3202,
    hostId: 902,
    hostFirstName: 'Nora',
    hostLastName: 'Lang',
    title: 'Terrassen-Sitting',
    location: 'Berlin Kreuzberg',
    description: 'Tagesbetreuung mit festen Ruhezeiten.',
    pricePerDay: 44,
    acceptedPetSpecies: ['DOG', 'CAT'],
    services: ['Spaziergang', 'Fütterung'],
    availableFrom: '2026-06-12',
    availableTo: '2026-06-18',
    status: 'PUBLISHED'
  },
  {
    id: 3203,
    hostId: 903,
    hostFirstName: 'Mia',
    hostLastName: 'Graf',
    title: 'Kiezbetreuung',
    location: 'Berlin Prenzlauer Berg',
    description: 'Persönliche Betreuung im Tagesablauf.',
    pricePerDay: 42,
    acceptedPetSpecies: ['DOG'],
    services: ['Spielzeit'],
    availableFrom: '2026-06-11',
    availableTo: '2026-06-15',
    status: 'PUBLISHED'
  },
  {
    id: 3204,
    hostId: 904,
    hostFirstName: 'Tom',
    hostLastName: 'Krüger',
    title: 'Ruhiger Innenhof',
    location: 'Berlin Charlottenburg',
    description: 'Flexibler Tagesplan für sensible Tiere.',
    pricePerDay: 46,
    acceptedPetSpecies: ['DOG'],
    services: ['Spaziergang', 'Pflege'],
    availableFrom: '2026-06-09',
    availableTo: '2026-06-17',
    status: 'PUBLISHED'
  },
  {
    id: 3205,
    hostId: 905,
    hostFirstName: 'Ava',
    hostLastName: 'Meyer',
    title: 'Stadtgarten-Aufenthalt',
    location: 'Berlin Neukölln',
    description: 'Kleine Gruppe mit viel Bewegung.',
    pricePerDay: 47,
    acceptedPetSpecies: ['DOG'],
    services: ['Auslauf'],
    availableFrom: '2026-06-08',
    availableTo: '2026-06-14',
    status: 'PUBLISHED'
  },
  {
    id: 3206,
    hostId: 906,
    hostFirstName: 'Lina',
    hostLastName: 'Wirth',
    title: 'Abendbetreuung am Kanal',
    location: 'Berlin Friedrichshain',
    description: 'Ruhige Abendrunden und strukturierter Ablauf.',
    pricePerDay: 45,
    acceptedPetSpecies: ['DOG'],
    services: ['Spaziergang'],
    availableFrom: '2026-06-13',
    availableTo: '2026-06-19',
    status: 'PUBLISHED'
  }
];

const alternativeDateOffers = [
  {
    id: 3301,
    hostId: 907,
    hostFirstName: 'Sina',
    hostLastName: 'Kurz',
    title: 'Wochenendpaket im Süden',
    location: 'Berlin Tempelhof',
    description: 'Betreuung mit klaren Ruhephasen.',
    pricePerDay: 43,
    acceptedPetSpecies: ['DOG'],
    services: ['Spielzeit'],
    availableFrom: '2026-07-04',
    availableTo: '2026-07-11',
    status: 'PUBLISHED'
  },
  {
    id: 3302,
    hostId: 908,
    hostFirstName: 'Noah',
    hostLastName: 'Peters',
    title: 'Tagesbetreuung am See',
    location: 'Berlin Köpenick',
    description: 'Flexible Betreuung auf Anfrage.',
    pricePerDay: 41,
    acceptedPetSpecies: ['DOG'],
    services: ['Auslauf', 'Fütterung'],
    availableFrom: '2026-07-08',
    availableTo: '2026-07-15',
    status: 'PUBLISHED'
  }
];

test('shows white loading screen and renders search carousels with matching and alternative offers', async ({ page }) => {
  await page.setViewportSize({ width: 1360, height: 920 });

  await page.route('**/api/auth/session*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(buildSessionResponse(false, null))
    });
  });

  await page.route('**/api/pets/choices*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({ choices: ['DOG', 'CAT', 'RABBIT'] })
    });
  });

  await page.route('**/api/marketplace/offers/latest*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(buildMarketplacePayload(
        '/api/marketplace/offers/latest',
        'Latest marketplace offers retrieved successfully.',
        matchingOffers.slice(0, 5)
      ))
    });
  });

  await page.route('**/api/marketplace/offers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(buildMarketplacePayload(
        '/api/marketplace/offers',
        'Marketplace offers retrieved successfully.',
        matchingOffers
      ))
    });
  });

  await page.route('**/api/users/*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        success: true,
        status: 200,
        message: 'User fetched.',
        data: {
          city: 'Berlin'
        },
        error: null,
        meta: {
          path: '/api/users',
          timestamp: new Date().toISOString()
        }
      })
    });
  });

  await page.route('**/api/marketplace/offers/search*', async (route) => {
    await page.waitForTimeout(700);
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        success: true,
        status: 200,
        message: 'Marketplace offers searched successfully.',
        data: {
          matchingOffers,
          alternativeDateOffers
        },
        error: null,
        meta: {
          path: '/api/marketplace/offers/search',
          timestamp: new Date().toISOString(),
          count: matchingOffers.length + alternativeDateOffers.length
        }
      })
    });
  });

  await page.goto('/?locale=de');

  await page.getByRole('button', { name: token('de', 'header.search.submitAria'), exact: true }).click();

  const searchResultsSection = page.locator('.home_search_results');
  await expect(searchResultsSection).toBeVisible();
  await expect(searchResultsSection.locator('.repository_live_loading__dots')).toBeVisible();

  await expect(searchResultsSection.getByText(token('de', 'home.page.search.matching.heading'))).toBeVisible();
  await expect(searchResultsSection.getByText(token('de', 'home.page.search.alternative.heading'))).toBeVisible();
  await expect(searchResultsSection.getByText('Morgenrunde im Park')).toBeVisible();
  await expect(searchResultsSection.getByText('Wochenendpaket im Süden')).toBeVisible();

  const primarySearchCarousel = searchResultsSection.locator('.home_latest_offers--search').nth(0);
  await primarySearchCarousel.getByRole('button', { name: token('de', 'home.page.actions.next'), exact: true }).click();
  await expect(primarySearchCarousel.getByRole('button', { name: token('de', 'home.page.actions.previous'), exact: true })).toBeVisible();
});
