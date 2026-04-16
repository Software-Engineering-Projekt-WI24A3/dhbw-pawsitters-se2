const { expect } = require('@playwright/test');

async function loadLiveRepository(page, locale = 'de') {
  const response = await page.request.get(`/api/repository/live.json?locale=${locale}`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function readHeaderRepositoryMenuHrefs(page) {
  return page.locator('.header_center .repo_menu__item').evaluateAll((elements) => {
    return elements.map((element) => element.getAttribute('href'));
  });
}

module.exports = {
  loadLiveRepository,
  readHeaderRepositoryMenuHrefs
};
