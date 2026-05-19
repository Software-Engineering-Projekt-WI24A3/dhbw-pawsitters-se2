const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');

function apiSuccess(path, message, data, count = null) {
  return {
    success: true,
    status: 200,
    message,
    data,
    error: null,
    meta: {
      path,
      timestamp: new Date().toISOString(),
      count: Number.isInteger(count)
        ? count
        : Array.isArray(data)
          ? data.length
          : 0
    }
  };
}

test('creates and renders a non-empty opening message when requesting an offer', async ({ page }) => {
  await page.setViewportSize({ width: 1360, height: 920 });

  const nowIso = new Date().toISOString();
  const offer = {
    id: 501,
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
  };
  const currentUser = {
    id: 2001,
    firstName: 'Lena',
    lastName: 'Muster',
    email: 'lena@example.com',
    city: 'Berlin',
    profilePicture: ''
  };
  const pet = {
    id: 7101,
    name: 'Milo',
    species: 'DOG',
    breed: 'Mischling',
    age: 3,
    specialNeeds: '',
    imagePath: '',
    defaultImagePath: ''
  };
  const chat = {
    id: 9901,
    offerId: offer.id,
    offerTitle: offer.title,
    offerPricePerDay: offer.pricePerDay,
    offerAvailableFrom: offer.availableFrom,
    offerAvailableTo: offer.availableTo,
    hostId: offer.hostId,
    hostFirstName: offer.hostFirstName,
    hostLastName: offer.hostLastName,
    requesterId: currentUser.id,
    requesterFirstName: currentUser.firstName,
    requesterLastName: currentUser.lastName,
    createdAt: nowIso,
    lastMessageAt: nowIso,
    closedAt: null,
    closedByUserId: null,
    lastMessagePreview: ''
  };
  const expectedOpeningLine = `${currentUser.firstName} ${currentUser.lastName} ${token('de', 'home.page.modal.requestOpeningIntro')} " ${offer.title} " ${token('de', 'home.page.modal.requestOpeningSuffix')}`;

  let chatExists = false;
  let createdMessage = null;
  let capturedOpeningContent = '';

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/auth/session' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'Session retrieved successfully.', {
          loggedIn: true,
          email: currentUser.email
        }))
      });
      return;
    }

    if (path === '/api/users/me' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'User fetched successfully.', currentUser))
      });
      return;
    }

    if (path === '/api/pets/choices' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ choices: ['DOG', 'CAT'] })
      });
      return;
    }

    if (path === '/api/pets' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'Pets retrieved successfully.', [pet]))
      });
      return;
    }

    if (path === '/api/marketplace/offers/latest' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'Latest offers retrieved successfully.', [offer]))
      });
      return;
    }

    if (path === '/api/marketplace/offers' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'Offers retrieved successfully.', [offer]))
      });
      return;
    }

    if (path.startsWith('/api/users/') && method === 'GET') {
      const requestedId = Number(path.split('/').pop());
      const user = requestedId === offer.hostId
        ? {
          id: offer.hostId,
          firstName: offer.hostFirstName,
          lastName: offer.hostLastName,
          city: 'Berlin',
          profilePicture: ''
        }
        : currentUser;
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'User fetched successfully.', user))
      });
      return;
    }

    if (path === '/api/chats' && method === 'GET') {
      const chats = chatExists
        ? [{ ...chat, lastMessagePreview: createdMessage?.content || '' }]
        : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'Chats retrieved successfully.', chats))
      });
      return;
    }

    if (path === '/api/chats' && method === 'POST') {
      chatExists = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'Chat created successfully.', chat))
      });
      return;
    }

    if (path === `/api/chats/${chat.id}/messages` && method === 'POST') {
      const payload = request.postDataJSON ? request.postDataJSON() : {};
      capturedOpeningContent = typeof payload?.content === 'string' ? payload.content : '';
      createdMessage = {
        id: 8801,
        chatId: chat.id,
        senderId: currentUser.id,
        senderFirstName: currentUser.firstName,
        senderLastName: currentUser.lastName,
        content: capturedOpeningContent,
        createdAt: nowIso,
        attachments: [],
        type: 'TEXT',
        bookingProposal: null
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'Chat message created successfully.', createdMessage))
      });
      return;
    }

    if (path === `/api/chats/${chat.id}/messages` && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(apiSuccess(path, 'Chat messages retrieved successfully.', createdMessage ? [createdMessage] : []))
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify({
        success: false,
        status: 404,
        message: `No mock for ${method} ${path}`,
        data: null,
        error: null,
        meta: {
          path,
          timestamp: nowIso
        }
      })
    });
  });

  await page.goto('/?locale=de');

  await expect(page.locator('.home_latest_offer_card--interactive').first()).toBeVisible();
  await page.locator('.home_latest_offer_card--interactive').first().click();

  await page.getByRole('button', { name: token('de', 'home.page.modal.requestButton'), exact: true }).click();
  await expect(page.locator('.home_offer_request_modal')).toBeVisible();

  await page.getByRole('button', { name: new RegExp(`\\b${pet.name}\\b`) }).click();

  await Promise.all([
    page.waitForURL(/\/profile\/messages(\?|$)/),
    page.getByRole('button', { name: token('de', 'home.page.modal.requestSubmit'), exact: true }).click()
  ]);

  expect(capturedOpeningContent).toBeTruthy();
  expect(capturedOpeningContent.startsWith('[PAWSITTERS_OFFER_REQUEST:')).toBeTruthy();
  await expect(page.locator('.messages_request_notice').first()).toBeVisible();
  const openingLineText = (await page.locator('.messages_request_notice__line').first().innerText()).replace(/\s+/g, ' ').trim();
  expect(openingLineText).toContain(expectedOpeningLine);
  await expect(page.locator('.messages_request_notice__offer_button').first()).toHaveText(offer.title);
});
