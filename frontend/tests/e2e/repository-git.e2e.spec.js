const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');
const { loadLiveRepository } = require('./support/repository');

test.describe('Repository git view', () => {
  test('should render git activity and timeline interactions from live data', async ({ page }) => {
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
    await expect(page.locator('[data-segmented="gitView"] .repository_segmented__button--active')).toContainText(token('de', 'repository.git.activity'));
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
    expect(activityBarStyle.backgroundColor).toMatch(/^rgb\(/);
    expect(activityBarStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(activityBarStyle.borderTopLeftRadius).not.toBe('0px');
    expect(activityBarStyle.borderBottomLeftRadius).toBe('0px');

    await activityMenuSummary.click();
    await page.getByRole('button', { name: snapshot.git.activityRanges.month, exact: true }).click();

    await expect(activityMenuSummary).toContainText(snapshot.git.activityRanges.month);
    await expect(activityPanel.locator('[data-activity-day]')).toHaveCount(snapshot.git.activity.month.length);

    await page.getByRole('button', { name: token('de', 'repository.git.timeline') }).click();

    const graphPanel = page.locator('[data-segment-panel="gitView"][data-segment-value="graph"]');
    const graphSummary = graphPanel.locator('.repo_menu__summary').first();
    await expect(page.locator('[data-segmented="gitView"] .repository_segmented__button--active')).toContainText(token('de', 'repository.git.timeline'));
    await expect(page.locator('[data-gitgraph-container] svg')).toBeVisible();
    const graphSummaryCount = await graphSummary.count();
    if (graphSummaryCount > 0) {
      await expect(graphSummary).toContainText(snapshot.git.defaultBranch);
    }

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
    if (firstGraphActiveHash) {
      expect(firstGraphActiveHash).toBe(firstRecentHash);
    }

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
    if (alternateBranch && graphSummaryCount > 0) {
      await graphSummary.click();
      await page.getByRole('button', { name: alternateBranch.name, exact: true }).click();
      await expect(graphSummary).toContainText(alternateBranch.name);

      const firstCommit = snapshot.git.branchGraphs[alternateBranch.name]?.recentCommits?.[0];
      if (firstCommit) {
        await expect(graphPanel.locator('.git_commit__sha').first()).toContainText(firstCommit.shortSha);
      }
    }
  });
});
