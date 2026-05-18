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

function createTinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnQnX0AAAAASUVORK5CYII=',
    'base64'
  );
}

test.describe('My offers create flow', () => {
  test('uses setup step for title, period and optional image before the offer details step', async ({ page }) => {
    const sessionState = {
      loggedIn: true,
      email: 'host@example.com'
    };
    let createOfferPayload = null;

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

    await page.route('**/api/pets/choices*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          choices: ['DOG', 'CAT']
        })
      });
    });

    await page.route('**/v1/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          results: [
            {
              name: 'Berlin',
              country: 'Germany',
              country_code: 'DE',
              admin1: 'Berlin',
              latitude: 52.52,
              longitude: 13.405,
              feature_code: 'PPLC'
            }
          ]
        })
      });
    });

    await page.route('**/api/offers/**/image*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          success: true,
          status: 200,
          message: 'Offer image uploaded successfully.',
          data: {
            id: 991,
            hostId: 101,
            hostFirstName: 'Mara',
            hostLastName: 'Host',
            title: createOfferPayload?.title || 'Wochenend-Sitting',
            location: createOfferPayload?.location || 'Berlin',
            description: createOfferPayload?.description || '',
            imagePath: '/uploads/offers/offer-991-abc.png',
            pricePerDay: createOfferPayload?.pricePerDay ?? 45.5,
            acceptedPetSpecies: createOfferPayload?.acceptedPetSpecies || [],
            services: createOfferPayload?.services || [],
            availableFrom: createOfferPayload?.availableFrom,
            availableTo: createOfferPayload?.availableTo,
            status: 'DRAFT'
          },
          error: null,
          meta: {
            path: '/api/offers/991/image',
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.route('**/api/offers*', async (route) => {
      const request = route.request();

      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({
            success: true,
            status: 200,
            message: 'Offers retrieved successfully.',
            data: [],
            error: null,
            meta: {
              path: '/api/offers',
              timestamp: new Date().toISOString(),
              count: 0
            }
          })
        });
        return;
      }

      if (request.method() === 'POST') {
        createOfferPayload = JSON.parse(request.postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({
            success: true,
            status: 200,
            message: 'Offer created successfully.',
            data: {
              id: 991,
              hostId: 101,
              hostFirstName: 'Mara',
              hostLastName: 'Host',
              title: createOfferPayload.title,
              location: createOfferPayload.location || null,
              description: createOfferPayload.description,
              imagePath: null,
              pricePerDay: createOfferPayload.pricePerDay,
              acceptedPetSpecies: createOfferPayload.acceptedPetSpecies || [],
              services: createOfferPayload.services || [],
              availableFrom: createOfferPayload.availableFrom,
              availableTo: createOfferPayload.availableTo,
              status: 'DRAFT'
            },
            error: null,
            meta: {
              path: '/api/offers',
              timestamp: new Date().toISOString()
            }
          })
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/profile/my-offers?locale=de');

    await page.getByRole('button', { name: token('de', 'myOffers.page.createLinkLabel'), exact: true }).click();
    const modal = page.locator('[data-my-offers-create-modal]');
    await expect(modal).toBeVisible();
    const createModalWidth = await modal.locator('.settings_edit_modal__surface').evaluate((element) => (
      Math.round(element.getBoundingClientRect().width)
    ));
    expect(createModalWidth).toBeGreaterThanOrEqual(440);
    expect(createModalWidth).toBeLessThanOrEqual(744);

    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.stepNext'), exact: true }).click();
    await expect(modal.locator('[data-segment-value="setup"]')).toBeVisible();

    await modal.locator('[data-my-offers-form-title]').fill('Wochenend-Sitting');

    const availabilityDays = modal.locator(
      '[data-segment-value="setup"] .header_search_date__day:not(.header_search_date__day--outside)'
    );
    await availabilityDays.first().click();
    await availabilityDays.nth(2).click();

    await modal.locator('[data-my-offers-image-upload]').setInputFiles({
      name: 'angebot.png',
      mimeType: 'image/png',
      buffer: createTinyPngBuffer()
    });
    await expect(modal.locator('.my_offers_create_setup__preview')).toBeVisible();

    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.stepNext'), exact: true }).click();
    await expect(modal.locator('[data-segment-value="species"]')).toBeVisible();

    await modal.locator('[data-segment-value="species"] .register_pet_chip').first().click();
    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.stepNext'), exact: true }).click();
    await expect(modal.locator('[data-segment-value="details"]')).toBeVisible();

    await expect(modal.locator('[data-my-offers-form-title]')).toBeHidden();

    const cityInput = modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.city'), exact: true });
    await cityInput.fill('Ber');
    await expect(modal.locator('.register_city_picker__option').first()).toBeVisible();
    await modal.locator('.register_city_picker__option').first().click();

    await modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.price'), exact: true }).fill('45,5');
    await modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.flow'), exact: true }).fill('Morgenrunde, Betreuung, Abendrunde');
    await modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.dayStructure'), exact: true }).fill('Ruhige Pausen zwischen Aktivphasen');
    await modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.services'), exact: true }).fill('Spaziergang, Fuetterung');

    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.stepNext'), exact: true }).click();
    await expect(modal.locator('[data-segment-value="review"]')).toBeVisible();

    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.confirm'), exact: true }).click();

    await expect.poll(() => createOfferPayload, { timeout: 10000 }).not.toBeNull();

    expect(createOfferPayload).toMatchObject({
      title: 'Wochenend-Sitting',
      location: 'Berlin',
      pricePerDay: 45.5,
      services: ['Spaziergang', 'Fuetterung']
    });
    expect(Array.isArray(createOfferPayload.acceptedPetSpecies)).toBe(true);
    expect(createOfferPayload.acceptedPetSpecies.length).toBeGreaterThan(0);
    expect(createOfferPayload.availableFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(createOfferPayload.availableTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(createOfferPayload.availableTo >= createOfferPayload.availableFrom).toBe(true);
    expect(createOfferPayload).not.toHaveProperty('image');
    expect(createOfferPayload).not.toHaveProperty('imagePath');

    await expect(modal).toBeHidden();
  });

  test('keeps notifications above the create modal when create request fails', async ({ page }) => {
    const sessionState = {
      loggedIn: true,
      email: 'host@example.com'
    };

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

    await page.route('**/api/pets/choices*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          choices: ['DOG', 'CAT']
        })
      });
    });

    await page.route('**/v1/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          results: [
            {
              name: 'Berlin',
              country: 'Germany',
              country_code: 'DE',
              admin1: 'Berlin',
              latitude: 52.52,
              longitude: 13.405,
              feature_code: 'PPLC'
            }
          ]
        })
      });
    });

    await page.route('**/api/offers*', async (route) => {
      const request = route.request();

      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({
            success: true,
            status: 200,
            message: 'Offers retrieved successfully.',
            data: [],
            error: null,
            meta: {
              path: '/api/offers',
              timestamp: new Date().toISOString(),
              count: 0
            }
          })
        });
        return;
      }

      if (request.method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json; charset=utf-8',
          body: JSON.stringify({
            success: false,
            status: 500,
            message: 'Failed to create offer.',
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              details: ['Create offer failed']
            },
            meta: {
              path: '/api/offers',
              timestamp: new Date().toISOString()
            }
          })
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/profile/my-offers?locale=de');

    await page.getByRole('button', { name: token('de', 'myOffers.page.createLinkLabel'), exact: true }).click();
    const modal = page.locator('[data-my-offers-create-modal]');
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.stepNext'), exact: true }).click();
    await modal.locator('[data-my-offers-form-title]').fill('Wochenend-Sitting');

    const availabilityDays = modal.locator(
      '[data-segment-value="setup"] .header_search_date__day:not(.header_search_date__day--outside)'
    );
    await availabilityDays.first().click();
    await availabilityDays.nth(2).click();

    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.stepNext'), exact: true }).click();
    await modal.locator('[data-segment-value="species"] .register_pet_chip').first().click();
    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.stepNext'), exact: true }).click();

    const cityInput = modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.city'), exact: true });
    await cityInput.fill('Ber');
    await expect(modal.locator('.register_city_picker__option').first()).toBeVisible();
    await modal.locator('.register_city_picker__option').first().click();

    await modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.price'), exact: true }).fill('45');
    await modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.flow'), exact: true }).fill('Morgenrunde');
    await modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.dayStructure'), exact: true }).fill('Ruhige Pausen');
    await modal.getByRole('textbox', { name: token('de', 'myOffers.page.labels.services'), exact: true }).fill('Spaziergang');

    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.stepNext'), exact: true }).click();
    await expect(modal.locator('[data-segment-value="review"]')).toBeVisible();

    await modal.getByRole('button', { name: token('de', 'myOffers.page.actions.confirm'), exact: true }).click();

    const notification = page.locator('.site_notification').first();
    await expect(notification).toBeVisible();
    await expect(modal).toBeVisible();

    const notificationIsTopmost = await page.evaluate(() => {
      const notificationElement = document.querySelector('.site_notification');
      if (!(notificationElement instanceof HTMLElement)) {
        return false;
      }

      const rect = notificationElement.getBoundingClientRect();
      const x = Math.max(0, Math.min(window.innerWidth - 1, rect.left + (rect.width / 2)));
      const y = Math.max(0, Math.min(window.innerHeight - 1, rect.top + (rect.height / 2)));
      const topElement = document.elementFromPoint(x, y);

      return Boolean(topElement && notificationElement.contains(topElement));
    });

    expect(notificationIsTopmost).toBe(true);
  });
});
