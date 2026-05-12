import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLocalizedRepositorySnapshot } from '../scripts/lib/thymeleaf-preview.mjs';
import { loadRepositorySnapshot } from '../scripts/lib/repository-snapshot.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function daysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

test('live repository snapshot exposes real git and board data', async () => {
  const snapshot = await loadLocalizedRepositorySnapshot(rootDir, 'de', { fresh: true });
  const columnIds = snapshot.board.columns.map((column) => column.id);
  const totalBoardCards = snapshot.board.columns.reduce((total, column) => total + column.cards.length, 0);
  const totalCriteria = snapshot.board.columns.reduce((total, column) => {
    return total + column.cards.reduce((columnTotal, card) => columnTotal + card.criteria.length, 0);
  }, 0);

  assert.ok(snapshot.repository.owner.length > 0);
  assert.ok(snapshot.repository.name.length > 0);
  assert.equal(snapshot.repository.label, `${snapshot.repository.owner}/${snapshot.repository.name}`);
  assert.ok(columnIds.length > 0);
  assert.ok(columnIds.every((id) => ['frontend', 'api', 'data', 'docs', 'misc'].includes(id)));
  assert.ok(snapshot.board.columns.every((column) => column.cards.length > 0));
  assert.equal(snapshot.board.summary.openCount, totalBoardCards);
  assert.equal(snapshot.board.summary.criteriaCount, totalCriteria);
  assert.ok(totalBoardCards > 0);
  assert.ok(snapshot.board.cards.every((card) => card.url?.startsWith('https://github.com/')));
  assert.ok(snapshot.board.owners.length > 0);
  assert.ok(snapshot.board.owners.every((owner) => owner.profileUrl?.startsWith('https://github.com/')));

  assert.ok(snapshot.git.remoteUrl.includes('github.com'));
  assert.ok(snapshot.git.defaultBranch.length > 0);
  assert.ok(snapshot.git.branches.some((branch) => branch.name === snapshot.git.defaultBranch));
  assert.equal(snapshot.git.contributorCount, snapshot.git.authors.length);
  assert.ok(snapshot.git.authors.length > 0);
  assert.ok(snapshot.git.authors.every((author) => author.login?.length > 0));
  assert.ok(snapshot.git.authors.every((author) => !author.profileUrl || author.profileUrl.startsWith('https://github.com/')));
  assert.equal(snapshot.git.activity.week.length, 7);
  assert.equal(snapshot.git.activity.month.length, daysInCurrentMonth());
  assert.ok(snapshot.git.branchGraphs[snapshot.git.defaultBranch]);
  assert.ok(snapshot.git.branchGraphs[snapshot.git.defaultBranch].graphImport.length > 0);
  assert.ok(snapshot.git.branchGraphs[snapshot.git.defaultBranch].recentCommits.length > 0);
  assert.equal(snapshot.api, undefined);
});

test('repository pages do not embed static snapshot payloads', async () => {
  const gitTemplate = await readFile(path.join(rootDir, 'src/templates/pages/repository-git.html'), 'utf8');
  const kanbanTemplate = await readFile(path.join(rootDir, 'src/templates/pages/repository-kanban.html'), 'utf8');

  assert.ok(gitTemplate.includes('data-repository-bootstrap hidden>{}</div>'));
  assert.ok(kanbanTemplate.includes('data-repository-bootstrap hidden>{}</div>'));
  assert.ok(!gitTemplate.includes('repositorySnapshotJson'));
  assert.ok(!kanbanTemplate.includes('repositorySnapshotJson'));
});

test('fresh repository snapshots rebuild and replace the in-memory cache', async () => {
  const firstBuild = await loadRepositorySnapshot(rootDir, { fresh: true });
  const cachedBeforeRefresh = await loadRepositorySnapshot(rootDir);
  assert.strictEqual(cachedBeforeRefresh, firstBuild);

  const rebuilt = await loadRepositorySnapshot(rootDir, { fresh: true });
  assert.notStrictEqual(rebuilt, firstBuild);

  const cachedAfterRefresh = await loadRepositorySnapshot(rootDir);
  assert.strictEqual(cachedAfterRefresh, rebuilt);
});
