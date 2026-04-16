const { test, expect } = require('@playwright/test');
const { token } = require('./support/i18n');
const { loadLiveRepository } = require('./support/repository');

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function overwriteFirstGraphMessage(snapshot, message) {
  if (!snapshot || typeof snapshot !== 'object') {
    return false;
  }

  const graphs = [];
  if (snapshot.git?.projectGraph && typeof snapshot.git.projectGraph === 'object') {
    graphs.push(snapshot.git.projectGraph);
  }
  if (snapshot.git?.branchGraphs && typeof snapshot.git.branchGraphs === 'object') {
    Object.values(snapshot.git.branchGraphs).forEach((graph) => {
      if (graph && typeof graph === 'object') {
        graphs.push(graph);
      }
    });
  }

  let updated = false;
  graphs.forEach((graph) => {
    if (Array.isArray(graph.recentCommits) && graph.recentCommits[0]) {
      graph.recentCommits[0].message = message;
      updated = true;
    }
    if (Array.isArray(graph.graphImport) && graph.graphImport[0]) {
      graph.graphImport[0].subject = message;
      updated = true;
    }
  });

  return updated;
}

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

    const pickPreferredBranch = () => {
      const branches = Array.isArray(snapshot.git?.branches) ? snapshot.git.branches : [];
      if (branches.some((branch) => branch?.name === 'develop')) {
        return 'develop';
      }
      return snapshot.git?.defaultBranch || branches[0]?.name || '';
    };
    const graphImportSource = Array.isArray(snapshot.git?.projectGraph?.graphImport) && snapshot.git.projectGraph.graphImport.length > 0
      ? snapshot.git.projectGraph.graphImport
      : (snapshot.git?.branchGraphs?.[pickPreferredBranch()]?.graphImport || []);
    const mergeHashesFromSnapshot = graphImportSource
      .filter((commit) => Array.isArray(commit?.refs) && commit.refs.some((ref) => typeof ref === 'string' && ref.toLowerCase().startsWith('merge:')))
      .map((commit) => commit.hash)
      .filter((hash) => typeof hash === 'string' && hash.trim());
    const graphHashesForEdgeGap = mergeHashesFromSnapshot.length > 0
      ? mergeHashesFromSnapshot
      : graphImportSource
        .map((commit) => commit?.hash)
        .filter((hash) => typeof hash === 'string' && hash.trim());

    await page.getByRole('button', { name: token('de', 'repository.git.timeline') }).click();

    const graphPanel = page.locator('[data-segment-panel="gitView"][data-segment-value="graph"]');
    const graphSummary = graphPanel.locator('.repo_menu__summary').first();
    await expect(page.locator('[data-segmented="gitView"] .repository_segmented__button--active')).toContainText(token('de', 'repository.git.timeline'));
    await expect(page.locator('[data-gitgraph-container] svg')).toBeVisible();
    await expect.poll(async () => {
      return page.locator('.git_graph_branch_label').count();
    }, { timeout: 20000 }).toBeGreaterThan(0);
    const graphLayout = await page.locator('.git_graph_canvas_panel').evaluate((panel, edgeHashes) => {
      const container = panel.querySelector('[data-gitgraph-container]');
      const labels = Array.from(panel.querySelectorAll('.git_graph_branch_label'));
      const topLabel = labels.reduce((best, label) => (!best || label.offsetTop < best.offsetTop ? label : best), null);
      const svg = container?.querySelector('svg');
      const svgBBox = typeof svg?.getBBox === 'function' ? svg.getBBox() : null;
      const panelRect = panel.getBoundingClientRect();

      const readNodeCenter = (hash) => {
        if (!hash || !container) {
          return null;
        }

        const escaped = window.CSS?.escape ? window.CSS.escape(hash) : hash;
        const useNode = Array.from(container.querySelectorAll(`use[href="#${escaped}"], use[xlink\\:href="#${escaped}"]`))
          .find((node) => {
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
        const node = useNode || Array.from(container.querySelectorAll(`circle[id="${escaped}"]`))
          .find((circle) => {
            const rect = circle.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          });
        if (!node) {
          return null;
        }
        const rect = node.getBoundingClientRect();
        return rect.left - panelRect.left + panel.scrollLeft + (rect.width / 2);
      };

      const maxLabelRight = labels.reduce((max, label) => Math.max(max, label.offsetLeft + label.offsetWidth), 0);
      const maxContentRight = Math.max(maxLabelRight, svgBBox ? Math.ceil(svgBBox.x + svgBBox.width) : 0);
      const contentWidth = Math.round(container?.getBoundingClientRect().width || 0);
      const edgeCenters = Array.isArray(edgeHashes)
        ? edgeHashes.map((hash) => readNodeCenter(hash)).filter((x) => Number.isFinite(x))
        : [];
      const allNodeCenters = Array.from(container?.querySelectorAll('use[href], use[xlink\\:href], circle[id]') ?? [])
        .map((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) {
            return null;
          }
          return rect.left - panelRect.left + panel.scrollLeft + (rect.width / 2);
        })
        .filter((x) => Number.isFinite(x));
      const leftEdgeGap = edgeCenters.length > 0
        ? Math.min(...edgeCenters)
        : (allNodeCenters.length > 0 ? Math.min(...allNodeCenters) : 0);
      const topLabelCenter = topLabel ? topLabel.offsetLeft + (topLabel.offsetWidth / 2) : null;
      const topNodeCenter = topLabel ? readNodeCenter(topLabel.dataset.commitHash || '') : null;
      const topAnchorCenter = Number.isFinite(topLabelCenter) && Number.isFinite(topNodeCenter)
        ? (topLabelCenter + topNodeCenter) / 2
        : topLabelCenter;
      const viewportCenter = panel.scrollLeft + (panel.clientWidth / 2);

      return {
        overflowX: window.getComputedStyle(panel).overflowX,
        scrollWidth: Math.round(panel.scrollWidth || 0),
        clientWidth: Math.round(panel.clientWidth || 0),
        rightGap: contentWidth - maxContentRight,
        leftGap: Number.isFinite(leftEdgeGap) ? leftEdgeGap : 0,
        topAnchorCenter,
        viewportCenter
      };
    }, graphHashesForEdgeGap);
    expect(graphLayout.overflowX).toBe('auto');
    expect(graphLayout.scrollWidth).toBeGreaterThanOrEqual(graphLayout.clientWidth);
    expect(Math.abs(graphLayout.rightGap - graphLayout.leftGap)).toBeLessThanOrEqual(2);
    expect(Math.abs((graphLayout.topAnchorCenter ?? 0) - graphLayout.viewportCenter)).toBeLessThanOrEqual(2);
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

  test('should reload timeline after manual repository refresh', async ({ page }) => {
    const snapshot = await loadLiveRepository(page, 'de');
    const firstSnapshot = cloneJson(snapshot);
    const secondSnapshot = cloneJson(snapshot);
    const beforeMessage = `E2E Verlauf Vorher ${Date.now().toString(36)}`;
    const afterMessage = `E2E Verlauf Nachher ${Date.now().toString(36)}`;
    const firstHasGraph = overwriteFirstGraphMessage(firstSnapshot, beforeMessage);
    const secondHasGraph = overwriteFirstGraphMessage(secondSnapshot, afterMessage);

    test.skip(!(firstHasGraph && secondHasGraph), 'Snapshot has no graph commits to validate refresh rendering.');

    let requestCount = 0;
    await page.route('**/api/repository/live.json**', async (route) => {
      requestCount += 1;
      const payload = requestCount === 1 ? firstSnapshot : secondSnapshot;
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify(payload)
      });
    });

    await page.goto('/git');
    await page.getByRole('button', { name: token('de', 'repository.git.timeline') }).click();

    const graphPanel = page.locator('[data-segment-panel="gitView"][data-segment-value="graph"]');
    const firstCommitMessage = graphPanel.locator('.git_graph__card .git_commit__message').first();
    await expect(firstCommitMessage).toContainText(beforeMessage);

    await page.locator('.repository_switch__refresh').click();
    await expect.poll(() => requestCount, { timeout: 20000 }).toBeGreaterThanOrEqual(2);

    await expect(page.locator('[data-segmented="gitView"] .repository_segmented__button--active')).toContainText(token('de', 'repository.git.timeline'));
    await expect(page.locator('[data-gitgraph-container] svg')).toBeVisible();
    await expect(firstCommitMessage).toContainText(afterMessage, { timeout: 20000 });
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });
});
