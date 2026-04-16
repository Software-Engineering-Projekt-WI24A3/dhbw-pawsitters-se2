const { test, expect } = require('@playwright/test');
const de = require('../src/locales/de.json');
const en = require('../src/locales/en.json');
const fr = require('../src/locales/fr.json');

function token(locale, key) {
  return key.split('.').reduce((current, part) => current[part], locale);
}

async function loadLiveRepository(page, locale = 'de') {
  const response = await page.request.get(`/api/repository/live.json?locale=${locale}`);
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test.describe('Pawsitters shell', () => {
  test('shows a marine-blue live loading indicator on repository pages while GitHub data is loading', async ({ page }) => {
    await page.route('**/api/repository/live.json?locale=de*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const response = await route.fetch();
      await route.fulfill({ response });
    });

    await page.goto('/git');
    await expect(page.locator('.repository_live_loading')).toBeVisible();
    await expect(page.locator('.repository_live_loading__text')).toHaveText('Daten werden live von Github geladen... :)');
    await expect(page.locator('.repository_live_loading__dot')).toHaveCount(3);
    await expect(page.locator('.repository_stage .repository_surface')).toHaveCount(0);
    await expect(page.locator('.repository_live_loading')).toBeHidden({ timeout: 20000 });
    await expect(page.locator('.repository_stage .repository_surface')).toHaveCount(2);

    await page.goto('/kanban');
    await expect(page.locator('.repository_live_loading')).toBeVisible();
    await expect(page.locator('.repository_live_loading__text')).toHaveText('Daten werden live von Github geladen... :)');
    await expect(page.locator('.board_legend')).toHaveCount(0);
    await expect(page.locator('.board_stage')).toHaveCount(0);
    await expect(page.locator('.repository_live_loading')).toBeHidden({ timeout: 20000 });
    await expect(page.locator('.board_legend')).toHaveCount(1);
    await expect(page.locator('.board_stage')).toHaveCount(1);
  });

  test('opens the root path globally and keeps repository content off the start page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('#site-shell-header')).toBeVisible();
    await expect(page.getByRole('heading', { name: token(de, 'brand.name'), exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: token(de, 'nav.repository') })).toHaveAttribute('href', '/repository/git');
    await expect(page.locator('.git_graph')).toHaveCount(0);

    const headerPosition = await page.locator('#site-shell-header').evaluate((element) => {
      return window.getComputedStyle(element).position;
    });

    expect(headerPosition).toBe('sticky');
  });

  test('renders the live Git repository page on /git with activity and branch filters', async ({ page }) => {
    const snapshot = await loadLiveRepository(page, 'de');
    const activityPanel = page.locator('[data-segment-panel="gitView"][data-segment-value="activity"]');
    const activityMenuSummary = activityPanel.locator('.repo_menu__summary').first();

    await page.goto('/git');

    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page).toHaveURL(/\/repository\/git$/);
    await expect(page.locator('.repository_workspace[data-repository-live]')).toBeVisible();
    await expect(page.locator('[data-repository-bootstrap]')).toHaveText('{}');
    await expect.poll(async () => {
      return page.locator('[data-segmented="gitView"] [data-segmented-value]').count();
    }, { timeout: 20000 }).toBeGreaterThan(0);
    await expect(page.locator('.git_metric')).toHaveCount(4);
    await expect(page.locator('[data-segmented="gitView"] .repository_segmented__button--active')).toContainText(token(de, 'repository.git.activity'));
    await expect(activityMenuSummary).toContainText(snapshot.git.activityRanges.week, { timeout: 20000 });
    await expect(activityPanel.locator('[data-activity-day]')).toHaveCount(snapshot.git.activity.week.length);

    const activityWidths = await activityPanel.locator('[data-activity-day]').evaluateAll((elements) => {
      return elements.map((element) => element.getBoundingClientRect().width);
    });
    const minWidth = Math.min(...activityWidths);
    const maxWidth = Math.max(...activityWidths);
    expect(maxWidth - minWidth).toBeLessThan(0.75);

    const activityBarStyle = await activityPanel.locator('.git_activity__bar').nth(0).evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderTopLeftRadius: style.borderTopLeftRadius,
        borderBottomLeftRadius: style.borderBottomLeftRadius
      };
    });
    expect(activityBarStyle.backgroundColor).toBe('rgb(23, 57, 95)');
    expect(activityBarStyle.borderTopLeftRadius).not.toBe('0px');
    expect(activityBarStyle.borderBottomLeftRadius).toBe('0px');

    await activityMenuSummary.click();
    await page.getByRole('button', { name: snapshot.git.activityRanges.month, exact: true }).click();

    await expect(activityMenuSummary).toContainText(snapshot.git.activityRanges.month);
    await expect(activityPanel.locator('[data-activity-day]')).toHaveCount(snapshot.git.activity.month.length);

    await page.getByRole('button', { name: token(de, 'repository.git.timeline') }).click();

    const graphPanel = page.locator('[data-segment-panel="gitView"][data-segment-value="graph"]');
    const graphSummary = graphPanel.locator('.repo_menu__summary').first();
    await expect(page.locator('[data-segmented="gitView"] .repository_segmented__button--active')).toContainText(token(de, 'repository.git.timeline'));
    await expect(page.locator('[data-gitgraph-container] svg')).toBeVisible();
    await expect(graphSummary).toContainText(snapshot.git.defaultBranch);

    const commitCards = graphPanel.locator('[data-recent-commit-hash]');
    await expect(graphPanel.locator('.git_graph__card.git_commit--merge')).toHaveCount(0);

    const firstRecentHash = await commitCards.first().getAttribute('data-recent-commit-hash');
    expect(firstRecentHash).toBeTruthy();

    await commitCards.first().locator('.git_commit__message').click();
    await expect(page.locator('.repo_modal__surface--commit')).toBeVisible();
    await expect(commitCards.first()).toHaveClass(/git_graph__card--active/);

    const firstGraphActiveHash = await page.evaluate(() => {
      const activeUse = document.querySelector('[data-gitgraph-container] use.git_graph_node--active[href^="#"]');
      if (activeUse) {
        return activeUse.getAttribute('href')?.slice(1) ?? null;
      }

      const activeCircle = document.querySelector('[data-gitgraph-container] circle.git_graph_node--active[id]');
      return activeCircle?.getAttribute('id') ?? null;
    });
    expect(firstGraphActiveHash).toBe(firstRecentHash);

    const secondRecentHash = await commitCards.nth(1).getAttribute('data-recent-commit-hash');
    if (secondRecentHash) {
      await page.evaluate((hash) => {
        const selector = `[data-gitgraph-container] circle[id="${hash}"], [data-gitgraph-container] use[href="#${hash}"]`;
        const graphNode = document.querySelector(selector);
        graphNode?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }, secondRecentHash);

      await expect(graphPanel.locator(`[data-recent-commit-hash="${secondRecentHash}"]`)).toHaveClass(/git_graph__card--active/);
    }

    await page.keyboard.press('Escape');
    await expect(page.locator('.repo_modal')).toHaveCount(0);

    const alternateBranch = snapshot.git.branches.find((branch) => branch.name !== snapshot.git.defaultBranch);
    if (alternateBranch) {
      await graphSummary.click();
      await page.getByRole('button', { name: alternateBranch.name, exact: true }).click();
      await expect(graphSummary).toContainText(alternateBranch.name);

      const firstCommit = snapshot.git.branchGraphs[alternateBranch.name]?.recentCommits?.[0];
      if (firstCommit) {
        await expect(graphPanel.locator('.git_commit__sha').first()).toContainText(firstCommit.shortSha);
      }
    }
  });

  test('renders the live Kanban page on /kanban with one active category at a time', async ({ page }) => {
    const snapshot = await loadLiveRepository(page, 'de');
    const firstColumn = snapshot.board.columns[0];
    const nextColumn = snapshot.board.columns.find((column) => column.id !== firstColumn.id && column.cards.length > 0)
      ?? snapshot.board.columns[1];

    await page.goto('/kanban');

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

  test('renders the English login page via locale query and keeps locale switching intact', async ({ page }) => {
    await page.goto('/login?locale=en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { name: token(en, 'auth.login.title') })).toBeVisible();
    await expect(page.locator('.header_center .repo_menu__item').first()).toHaveAttribute('href', '/repository/git?locale=en');
    await expect(page.locator('.header_center .repo_menu__item').nth(1)).toHaveAttribute('href', '/repository/kanban?locale=en');
    await expect(page.locator('.header_actions .locale_menu__summary')).toContainText(token(en, 'locale.en.code'));

    await page.locator('.header_actions .locale_menu__summary').click();
    await page.locator('.header_actions .locale_menu__item').filter({ hasText: token(en, 'locale.de.label') }).click();

    await expect(page).toHaveURL(/\/login(?:\?locale=de)?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });

  test('renders the French register route via locale query and keeps locale switching intact', async ({ page }) => {
    await page.goto('/register?locale=fr');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { name: token(fr, 'auth.register.title') })).toBeVisible();
    await expect(page.locator('.header_center .repo_menu__item').first()).toHaveAttribute('href', '/repository/git?locale=fr');
    await expect(page.locator('.header_actions .locale_menu__summary')).toContainText(token(fr, 'locale.fr.code'));

    await page.locator('.header_actions .locale_menu__summary').click();
    await expect(page.locator('.header_actions .locale_menu__item')).toHaveCount(3);
    await page.locator('.header_actions .locale_menu__item').filter({ hasText: token(fr, 'locale.en.label') }).click();

    await expect(page).toHaveURL(/\/register\?locale=en$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
