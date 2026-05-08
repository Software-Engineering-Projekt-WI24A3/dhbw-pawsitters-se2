import assert from 'node:assert/strict';
import test from 'node:test';
import { __repositorySnapshotInternals } from '../scripts/lib/repository-snapshot.mjs';

test('parseCommitImport keeps only parent links that exist in payload', () => {
  const refsMap = new Map([['a1', ['main']]]);
  const identityMap = new Map();
  const raw = [
    'a1\x1fb1 z9\x1fMax Mustermann\x1fmax@example.com\x1f2026-04-15T10:00:00+02:00\x1fmerge commit',
    'b1\x1f\x1fMax Mustermann\x1fmax@example.com\x1f2026-04-14T10:00:00+02:00\x1fbase commit'
  ].join('\x1e');

  const commits = __repositorySnapshotInternals.parseCommitImport(raw, refsMap, identityMap);

  assert.equal(commits.length, 2);
  assert.deepEqual(commits[0].parents, ['b1']);
  assert.deepEqual(commits[0].refs, ['main']);
  assert.equal(commits[0].subject, 'merge commit');
});

test('parseCommitImport preserves existing commit metadata', () => {
  const refsMap = new Map();
  const identityMap = new Map();
  const raw = 'c1\x1f\x1fAda Lovelace\x1fada@example.com\x1f2026-04-13T09:00:00+02:00\x1finitial commit\x1e';

  const [commit] = __repositorySnapshotInternals.parseCommitImport(raw, refsMap, identityMap);

  assert.equal(commit.hash, 'c1');
  assert.equal(commit.author.name, 'Ada Lovelace');
  assert.equal(commit.author.email, 'ada@example.com');
  assert.equal(commit.author.date, '2026-04-13T09:00:00+02:00');
  assert.equal(commit.subject, 'initial commit');
  assert.deepEqual(commit.parents, []);
});

test('parseBranchCommits does not map by author display name', () => {
  const identityMap = new Map([
    ['known@example.com', {
      login: 'real-user',
      name: 'Completely Different',
      email: 'known@example.com',
      avatarUrl: 'https://example.com/avatar.png',
      profileUrl: 'https://github.com/real-user'
    }]
  ]);
  const raw = 'd1\x1fd1\x1f2026-04-13\x1freal-user\x1funknown@example.com\x1fname-only mapping must not happen\x1e';

  const [commit] = __repositorySnapshotInternals.parseBranchCommits(raw, identityMap);

  assert.equal(commit.author, 'real-user');
  assert.equal(commit.authorLogin, 'real-user');
  assert.equal(commit.avatarUrl, '');
  assert.equal(commit.profileUrl, '');
});

test('parseAuthorContributionStats counts commits and changed lines per author', () => {
  const raw = [
    'Ada Lovelace\x1fada@example.com\n3\t1\tsrc/a.js\n2\t0\tsrc/b.js',
    'Ada Lovelace\x1fada@example.com',
    'Grace Hopper\x1fgrace@example.com\n1\t4\tsrc/c.js'
  ].join('\x1e');

  const stats = __repositorySnapshotInternals.parseAuthorContributionStats(raw);

  assert.equal(stats.length, 2);
  assert.equal(stats[0].authorName, 'Ada Lovelace');
  assert.equal(stats[0].count, 2);
  assert.equal(stats[0].additions, 5);
  assert.equal(stats[0].deletions, 1);
  assert.equal(stats[0].linesContributed, 6);
  assert.equal(stats[1].authorName, 'Grace Hopper');
  assert.equal(stats[1].count, 1);
  assert.equal(stats[1].linesContributed, 5);
});

test('parseAuthorContributionStats ignores malformed and binary numstat entries', () => {
  const raw = [
    'Linus Torvalds\x1flinus@example.com\n-\t-\tassets/logo.png\nnot-a-numstat-line\n7\t3\tsrc/kernel.c'
  ].join('\x1e');

  const [stats] = __repositorySnapshotInternals.parseAuthorContributionStats(raw);

  assert.equal(stats.count, 1);
  assert.equal(stats.additions, 7);
  assert.equal(stats.deletions, 3);
  assert.equal(stats.linesContributed, 10);
});

test('createActivitySeries applies tie-breaking for duplicate max counts', () => {
  const toDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toDateKey(date);
  });

  const counts = new Map([
    [days[0], 1],
    [days[1], 8],
    [days[2], 8]
  ]);

  const series = __repositorySnapshotInternals.createActivitySeries(counts, 'week', 'de');
  const maxCount = Math.max(...series.map((entry) => entry.count));
  const maxBars = series.filter((entry) => entry.count === maxCount);

  assert.equal(maxBars.length, 2);
  assert.notEqual(maxBars[0].height, maxBars[1].height);
  assert.equal(Math.max(...maxBars.map((entry) => entry.height)), 100);
});

test('parseOpenApiYamlSnapshot extracts dynamic operations and tags', () => {
  const yaml = `
openapi: 3.0.3
info:
  title: Demo API
  version: 2.1.0
paths:
  /pets:
    get:
      summary: List pets
      tags:
        - Catalog
      responses:
        "200":
          description: ok
    post:
      operationId: createPet
      requestBody:
        required: true
      responses:
        "201":
          description: created
  /pets/{id}:
    get:
      parameters:
        - name: id
          in: path
      responses:
        "200":
          description: ok
`;

  const snapshot = __repositorySnapshotInternals.parseOpenApiYamlSnapshot(yaml, 'demo.yaml');

  assert.equal(snapshot.info.title, 'Demo API');
  assert.equal(snapshot.info.version, '2.1.0');
  assert.equal(snapshot.summary.operationCount, 3);
  assert.equal(snapshot.summary.pathCount, 2);
  assert.equal(snapshot.summary.methodCount, 2);
  assert.ok(snapshot.summary.tagCount >= 1);
  assert.equal(snapshot.operations.find((operation) => operation.operationId === 'createPet')?.requestBodyRequired, true);
  assert.equal(snapshot.operations.find((operation) => operation.path === '/pets/{id}')?.pathParamCount, 1);
});
