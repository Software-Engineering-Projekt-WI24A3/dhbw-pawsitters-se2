const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');

test.use({
  viewport: {
    width: 360,
    height: 900
  }
});

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

async function readSegmentGeometry(page, selector) {
  return page.evaluate((segmentSelector) => {
    const group = document.querySelector(segmentSelector);
    if (!(group instanceof HTMLElement)) {
      return null;
    }

    const indicator = group.querySelector('.repository_segmented__indicator');
    const activeButton = group.querySelector('.repository_segmented__button--active');
    if (!(indicator instanceof HTMLElement) || !(activeButton instanceof HTMLElement)) {
      return null;
    }

    const groupStyles = window.getComputedStyle(group);
    const indicatorWidth = Number.parseFloat(groupStyles.getPropertyValue('--segment-width')) || 0;
    const indicatorX = Number.parseFloat(groupStyles.getPropertyValue('--segment-x')) || 0;

    return {
      indicatorWidth,
      indicatorX,
      activeWidth: activeButton.offsetWidth,
      activeX: activeButton.offsetLeft
    };
  }, selector);
}

async function assertSegmentGeometryAligned(page, selector) {
  const geometry = await readSegmentGeometry(page, selector);
  expect(geometry).not.toBeNull();
  expect(Math.abs(geometry.indicatorWidth - geometry.activeWidth)).toBeLessThanOrEqual(1.5);
  expect(Math.abs(geometry.indicatorX - geometry.activeX)).toBeLessThanOrEqual(1.5);
}

async function forceSegmentScrollAndResize(page, selector) {
  await page.evaluate((segmentSelector) => {
    const group = document.querySelector(segmentSelector);
    if (!(group instanceof HTMLElement)) {
      return;
    }

    group.scrollLeft = Math.max(0, group.scrollWidth - group.clientWidth);
    window.dispatchEvent(new Event('resize'));
  }, selector);
}

test.describe('Segmented indicator alignment', () => {
  test('keeps segmented indicator width and position correct after overflow scrolling and resize', async ({ page }) => {
    const sessionState = {
      loggedIn: true,
      email: 'host@example.com'
    };

    const offers = [
      {
        id: 51,
        title: 'Erstes Angebot',
        description: 'Beschreibung A',
        pricePerDay: 25,
        acceptedPetSpecies: ['DOG'],
        services: ['Spaziergang'],
        availableFrom: '2026-06-01',
        availableTo: '2026-06-03',
        status: 'PUBLISHED'
      },
      {
        id: 52,
        title: 'Zweites Angebot',
        description: 'Beschreibung B',
        pricePerDay: 35,
        acceptedPetSpecies: ['CAT'],
        services: ['Fuetterung'],
        availableFrom: '2026-06-05',
        availableTo: '2026-06-07',
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

    await page.route('**/api/users/me*', async (route) => {
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

    await page.route('**/api/offers*', async (route) => {
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

    await page.getByRole('button', { name: token('de', 'myOffers.page.createLinkLabel'), exact: true }).click();
    const modal = page.locator('[data-my-offers-create-modal]');
    await expect(modal).toBeVisible();

    const modalSegmentSelector = '[data-my-offers-create-modal] [data-segmented="myOffersCreateStep"]';
    await assertSegmentGeometryAligned(page, modalSegmentSelector);
    await forceSegmentScrollAndResize(page, modalSegmentSelector);
    await assertSegmentGeometryAligned(page, modalSegmentSelector);

    await page.goto('/profile/202?locale=de');
    await page.getByRole('button', { name: token('de', 'profile.page.tabs.offers'), exact: true }).click();

    const profileSegmentSelector = '[data-segmented="profileViewTab"]';
    await assertSegmentGeometryAligned(page, profileSegmentSelector);
    await forceSegmentScrollAndResize(page, profileSegmentSelector);
    await assertSegmentGeometryAligned(page, profileSegmentSelector);
  });
});
