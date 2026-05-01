const { test, expect } = require('@playwright/test');
const { loadLiveRepository } = require('./support/repository');
const {
  expectNoLegacyLoginRouteLinks,
  openLoginModal,
  closeLoginModal
} = require('./support/auth');

test.describe('Repository kanban view', () => {
  test('should keep exactly one active board column and render matching cards', async ({ page }) => {
    const snapshot = await loadLiveRepository(page, 'de');
    const firstColumn = snapshot.board.columns[0];
    const nextColumn = snapshot.board.columns.find((column) => column.id !== firstColumn.id && column.cards.length > 0)
      ?? snapshot.board.columns[1];

    await page.goto('/repository/kanban');

    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page).toHaveURL(/\/repository\/kanban$/);
    await expect(page.locator('.repository_workspace[data-repository-live]')).toBeVisible();
    await expect(page.locator('[data-repository-bootstrap]')).toHaveText('{}');
    await expect.poll(async () => {
      return page.locator('[data-segmented="boardView"] [data-segmented-value]').count();
    }, { timeout: 20000 }).toBe(snapshot.board.columns.length);
    await expect(page.locator('.board_metric')).toHaveCount(4);
    await expect(page.locator('[data-segmented="boardView"] .repository_segmented__button--active')).toContainText(firstColumn.label);
    await expect(page.locator('.board_metric').nth(0)).toContainText(String(snapshot.board.summary.openCount));
    await expect(page.locator('.board_metric').nth(1)).toContainText(String(snapshot.board.summary.assignedCount));
    await expect(page.locator('.board_metric').nth(2)).toContainText(String(snapshot.board.summary.ownerCount));
    await expect(page.locator('.board_metric').nth(3)).toContainText(String(snapshot.board.summary.criteriaCount));
    await expect(page.locator('.board_legend .repo_avatar__image').first()).toBeVisible();
    await expect(page.locator('.board_showcase')).toHaveCount(1);
    await expect(page.locator('.board_showcase__label')).toHaveText(firstColumn.label);
    await expect(page.locator('.board_card')).toHaveCount(firstColumn.cards.length);
    await expect(page.locator('.board_card__description')).toHaveCount(0);
    await expectNoLegacyLoginRouteLinks(page);
    await openLoginModal(page, { locale: 'de' });
    await closeLoginModal(page);

    if (firstColumn.cards.length > 0) {
      await expect(page.getByRole('heading', { name: firstColumn.cards[0].title })).toBeVisible();
      await page.locator('.board_card').first().click();
      await expect(page.locator('.repo_modal__surface--board')).toBeVisible();
      await expect(page.locator('.repo_modal__github')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.repo_modal')).toHaveCount(0);
    }

    await page.getByRole('button', { name: nextColumn.label, exact: true }).click();

    await expect(page.locator('[data-segmented="boardView"] .repository_segmented__button--active')).toContainText(nextColumn.label);
    await expect(page.locator('.board_showcase')).toHaveCount(1);
    await expect(page.locator('.board_showcase__label')).toHaveText(nextColumn.label);
    await expect(page.locator('.board_card')).toHaveCount(nextColumn.cards.length);

    if (nextColumn.cards.length > 0) {
      await expect(page.getByRole('heading', { name: nextColumn.cards[0].title })).toBeVisible();
    } else {
      await expect(page.locator('.board_showcase__empty')).toBeVisible();
    }
  });
});
