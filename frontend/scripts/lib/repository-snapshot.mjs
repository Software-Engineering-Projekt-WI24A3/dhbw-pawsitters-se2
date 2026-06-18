import { execFile } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const snapshotCache = new Map();
const snapshotBuilds = new Map();
const CACHE_TTL_MS = 120_000;
const COLUMN_ORDER = ['frontend', 'api', 'data', 'docs', 'misc'];
const COLUMN_TONE = {
  frontend: 'soft',
  api: 'solid',
  data: 'line',
  docs: 'muted',
  misc: 'ghost'
};
const COLUMN_LABEL = {
  frontend: 'Frontend',
  api: 'API',
  data: 'Data',
  docs: 'Docs',
  misc: 'Open'
};
const AUTHOR_PALETTE = [
  { accent: '#111827', soft: 'rgba(17, 24, 39, 0.08)', border: 'rgba(17, 24, 39, 0.18)', ink: '#111827' },
  { accent: '#2F5AA8', soft: 'rgba(47, 90, 168, 0.09)', border: 'rgba(47, 90, 168, 0.18)', ink: '#2F5AA8' },
  { accent: '#8A5A20', soft: 'rgba(138, 90, 32, 0.10)', border: 'rgba(138, 90, 32, 0.18)', ink: '#8A5A20' },
  { accent: '#0F766E', soft: 'rgba(15, 118, 110, 0.10)', border: 'rgba(15, 118, 110, 0.18)', ink: '#0F766E' },
  { accent: '#8B3D60', soft: 'rgba(139, 61, 96, 0.10)', border: 'rgba(139, 61, 96, 0.18)', ink: '#8B3D60' },
  { accent: '#5B6B2D', soft: 'rgba(91, 107, 45, 0.10)', border: 'rgba(91, 107, 45, 0.18)', ink: '#5B6B2D' }
];
const COLUMN_PALETTE = {
  frontend: { accent: '#111827', soft: 'rgba(17, 24, 39, 0.05)', border: 'rgba(17, 24, 39, 0.12)', ink: '#111827' },
  api: { accent: '#2F5AA8', soft: 'rgba(47, 90, 168, 0.06)', border: 'rgba(47, 90, 168, 0.14)', ink: '#2F5AA8' },
  data: { accent: '#8A5A20', soft: 'rgba(138, 90, 32, 0.07)', border: 'rgba(138, 90, 32, 0.14)', ink: '#8A5A20' },
  docs: { accent: '#0F766E', soft: 'rgba(15, 118, 110, 0.06)', border: 'rgba(15, 118, 110, 0.14)', ink: '#0F766E' },
  misc: { accent: '#4B5563', soft: 'rgba(75, 85, 99, 0.06)', border: 'rgba(75, 85, 99, 0.14)', ink: '#4B5563' }
};
const OPENAPI_RELATIVE_PATH = 'backend/src/main/resources/API_Calls/dhbw_pawsitters_se2-openapi.yaml';
const HTTP_METHOD_ORDER = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE'];
const HTTP_METHODS = new Set(HTTP_METHOD_ORDER.map((method) => method.toLowerCase()));

function hasOwnEntry(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function localeTag(locale) {
  switch (locale) {
    case 'de':
      return 'de-DE';
    case 'ro':
      return 'ro-RO';
    case 'en':
    default:
      return 'en-GB';
  }
}

function toneStyle(tone) {
  return `--tone-accent:${tone.accent};--tone-soft:${tone.soft};--tone-border:${tone.border};--tone-ink:${tone.ink};`;
}

function lookupMessage(messages, key, fallback) {
  if (!messages || !hasOwnEntry(messages, key)) {
    return fallback;
  }

  return messages[key];
}

function normalizeWhitespace(value = '') {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const REMOVED_REPOSITORY_SEGMENT = ['repository', 'api'].join('/');
const REMOVED_REPOSITORY_PATH = `/${REMOVED_REPOSITORY_SEGMENT}`;

function scrubRemovedRepositoryPath(value = '') {
  if (typeof value !== 'string') {
    return value;
  }

  if (!value.includes(REMOVED_REPOSITORY_PATH)) {
    return value;
  }

  return value
    .replace(`added the "${REMOVED_REPOSITORY_PATH}" underpage`, 'added repository underpage')
    .replaceAll(REMOVED_REPOSITORY_PATH, 'repository api');
}

function sanitizeRemovedRepositoryPathReferences(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRemovedRepositoryPathReferences(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, sanitizeRemovedRepositoryPathReferences(entryValue)])
    );
  }

  return scrubRemovedRepositoryPath(value);
}

function normalizeIdentityKey(value = '') {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function initials(value) {
  return normalizeWhitespace(value)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function compactDate(value, locale = 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatter = new Intl.DateTimeFormat(localeTag(locale), {
    day: '2-digit',
    month: 'short'
  });
  return formatter.format(date);
}

function displayDate(value, locale = 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatter = new Intl.DateTimeFormat(localeTag(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  return formatter.format(date);
}

function formatWeekday(value, locale = 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatter = new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'short'
  });
  return formatter.format(date);
}

function formatMonthDay(value, locale = 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatter = new Intl.DateTimeFormat(localeTag(locale), {
    day: '2-digit'
  });
  return formatter.format(date);
}

function formatMonthLabel(value, locale = 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const formatter = new Intl.DateTimeFormat(localeTag(locale), {
    month: 'short'
  });
  return formatter.format(date);
}

function isSameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveWorkspaceRoot(rootDir) {
  const parentRoot = path.resolve(rootDir, '..');
  if (existsSync(path.join(parentRoot, '.git'))) {
    return parentRoot;
  }

  if (
    existsSync(path.join(parentRoot, 'README.md'))
    && existsSync(path.join(parentRoot, OPENAPI_RELATIVE_PATH))
  ) {
    return parentRoot;
  }

  if (existsSync(path.join(rootDir, '.git'))) {
    return rootDir;
  }

  return rootDir;
}

function parseRemote(remoteUrl = '') {
  const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/i);
  if (match) {
    return {
      owner: match[1],
      repo: match[2]
    };
  }

  const repository = normalizeWhitespace(process.env.GITHUB_REPOSITORY ?? '');
  const repositoryMatch = repository.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (repositoryMatch) {
    return {
      owner: repositoryMatch[1],
      repo: repositoryMatch[2]
    };
  }

  return {
    owner: 'Software-Engineering-Projekt-WI24A3',
    repo: 'dhbw-pawsitters-se2'
  };
}

function buildGithubCommitIdentity(commit) {
  const authorLogin = normalizeWhitespace(commit?.author?.login ?? commit?.committer?.login ?? '');
  const authorName = normalizeWhitespace(commit?.commit?.author?.name ?? authorLogin ?? 'Unknown Author');
  const authorEmail = normalizeWhitespace(
    commit?.commit?.author?.email
      ?? (authorLogin ? `${authorLogin}@users.noreply.github.com` : '')
  );

  return {
    login: authorLogin || authorName,
    name: authorName || authorLogin || 'Unknown Author',
    email: authorEmail || `${normalizeIdentityKey(authorName || authorLogin || 'unknown')}@users.noreply.github.com`,
    avatarUrl: commit?.author?.avatar_url || commit?.committer?.avatar_url || '',
    profileUrl: commit?.author?.html_url || commit?.committer?.html_url || (authorLogin ? `https://github.com/${authorLogin}` : '')
  };
}

function buildCommitImportLogFromGithubCommits(commits = []) {
  return commits.map((commit) => {
    const identity = buildGithubCommitIdentity(commit);
    const commitDate = normalizeWhitespace(commit?.commit?.author?.date ?? commit?.commit?.committer?.date ?? '');
    const subject = normalizeWhitespace(String(commit?.commit?.message || '').split('\n')[0]);
    const parents = Array.isArray(commit?.parents)
      ? commit.parents.map((parent) => normalizeWhitespace(parent?.sha)).filter(Boolean).join(' ')
      : '';

    return `${normalizeWhitespace(commit?.sha)}\x1f${parents}\x1f${identity.name}\x1f${identity.email}\x1f${commitDate}\x1f${subject}\x1e`;
  }).join('');
}

function buildRecentCommitLogFromGithubCommits(commits = []) {
  return commits.map((commit) => {
    const identity = buildGithubCommitIdentity(commit);
    const hash = normalizeWhitespace(commit?.sha);
    const shortHash = hash.slice(0, 7);
    const commitDate = normalizeWhitespace(commit?.commit?.author?.date ?? commit?.commit?.committer?.date ?? '');
    const shortDate = toDateKey(commitDate);
    const subject = normalizeWhitespace(String(commit?.commit?.message || '').split('\n')[0]);
    return `${hash}\x1f${shortHash}\x1f${shortDate}\x1f${identity.name}\x1f${identity.email}\x1f${subject}\x1e`;
  }).join('');
}

function dedupeGithubCommitsBySha(commits = []) {
  const seenHashes = new Set();
  const unique = [];

  commits.forEach((commit) => {
    const hash = normalizeWhitespace(commit?.sha);
    if (!hash || seenHashes.has(hash)) {
      return;
    }

    seenHashes.add(hash);
    unique.push(commit);
  });

  return unique;
}

async function fetchGithubBranchCommits(owner, repo, branchName, perPage = 80) {
  const resourcePath = `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branchName)}&per_page=${Math.max(1, perPage)}`;
  const commits = await fetchGithubApiJson(resourcePath, { optional: false });
  if (!Array.isArray(commits)) {
    throw new Error(`GitHub API returned no commits for branch ${branchName}`);
  }

  return commits;
}

function buildAuthorSummariesFromGithubCommits(commits = [], identityIndex = new Map()) {
  const authorCounter = commits.reduce((counter, commit) => {
    const identity = buildGithubCommitIdentity(commit);
    indexIdentity(identityIndex, identity);
    const key = normalizeIdentityKey(identity.email) || normalizeIdentityKey(identity.login);
    const existing = counter.get(key) ?? {
      count: 0,
      identity
    };
    existing.count += 1;
    existing.identity = existing.identity || identity;
    counter.set(key, existing);
    return counter;
  }, new Map());

  const authorIdentities = [...authorCounter.values()].map((entry) => entry.identity.login || entry.identity.name);
  const paletteMap = buildPaletteMap(authorIdentities);
  const maxCount = Math.max(...[...authorCounter.values()].map((entry) => entry.count), 1);

  return [...authorCounter.values()]
    .map(({ count, identity }) => {
      const tone = paletteMap.get(identity.login || identity.name) ?? AUTHOR_PALETTE[0];
      const share = Math.max(12, Math.round((count / maxCount) * 100));
      return {
        count,
        linesContributed: 0,
        additions: 0,
        deletions: 0,
        name: identity.name || identity.login,
        login: identity.login || identity.name,
        avatarUrl: identity.avatarUrl || '',
        profileUrl: identity.profileUrl || (identity.login ? `https://github.com/${identity.login}` : ''),
        initials: initials(identity.name || identity.login),
        share,
        style: `--author-share:${share}%;`,
        toneStyle: `${toneStyle(tone)}--author-share:${share}%;`
      };
    })
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

async function buildGitSnapshotFromGithubApi({
  remoteUrl = '',
  owner = '',
  repo = '',
  currentBranch = '',
  reason = '',
  rawIssues = [],
  githubUsers = []
} = {}) {
  const repositoryOwner = normalizeWhitespace(owner);
  const repositoryName = normalizeWhitespace(repo);
  const repositoryLabel = `${repositoryOwner}/${repositoryName}`;

  const repositoryMeta = await fetchGithubApiJson(`/repos/${repositoryOwner}/${repositoryName}`, { optional: false });
  const apiDefaultBranch = normalizeWhitespace(repositoryMeta?.default_branch ?? '');
  const requestedBranch = normalizeWhitespace(currentBranch);
  const defaultBranch = requestedBranch || apiDefaultBranch || 'main';

  const fetchedBranches = await fetchGithubApiJson(
    `/repos/${repositoryOwner}/${repositoryName}/branches?per_page=100`,
    { optional: false }
  );
  if (!Array.isArray(fetchedBranches) || fetchedBranches.length === 0) {
    throw new Error('GitHub API returned no repository branches.');
  }

  const MAX_BRANCHES = 12;
  const prioritizedBranchNames = [
    defaultBranch,
    ...fetchedBranches.map((branch) => normalizeWhitespace(branch?.name)).filter(Boolean)
  ].filter(Boolean);
  const selectedBranchNames = [...new Set(prioritizedBranchNames)].slice(0, MAX_BRANCHES);

  const branchCommitEntries = await Promise.all(selectedBranchNames.map(async (branchName) => {
    const commits = await fetchGithubBranchCommits(repositoryOwner, repositoryName, branchName, 80);
    return {
      branchName,
      commits: dedupeGithubCommitsBySha(commits)
    };
  }));
  const populatedBranchEntries = branchCommitEntries.filter((entry) => entry.commits.length > 0);
  if (populatedBranchEntries.length === 0) {
    throw new Error('GitHub API returned empty commit histories for all selected branches.');
  }

  const effectiveDefaultBranch = populatedBranchEntries.find((entry) => entry.branchName === defaultBranch)?.branchName
    || populatedBranchEntries[0].branchName;
  const defaultBranchEntry = populatedBranchEntries.find((entry) => entry.branchName === effectiveDefaultBranch)
    || populatedBranchEntries[0];
  const lastCommitDate = normalizeWhitespace(
    defaultBranchEntry?.commits?.[0]?.commit?.author?.date
      ?? defaultBranchEntry?.commits?.[0]?.commit?.committer?.date
      ?? ''
  );

  const identityIndex = new Map();
  githubUsers.forEach((identity) => indexIdentity(identityIndex, identity));

  const branchGraphs = {};
  const activityCounts = new Map();
  const allCommits = [];

  populatedBranchEntries.forEach((entry) => {
    const refsMap = new Map();
    entry.commits.forEach((commit, index) => {
      const refs = [];
      if (index === 0) {
        refs.push(entry.branchName);
        if (entry.branchName === effectiveDefaultBranch) {
          refs.push('HEAD');
        }
      }

      const hash = normalizeWhitespace(commit?.sha);
      if (hash) {
        refsMap.set(hash, refs);
      }

      const activityDate = normalizeWhitespace(commit?.commit?.author?.date ?? commit?.commit?.committer?.date ?? '');
      const activityKey = toDateKey(activityDate);
      if (activityKey) {
        activityCounts.set(activityKey, (activityCounts.get(activityKey) ?? 0) + 1);
      }

      allCommits.push(commit);
      indexIdentity(identityIndex, buildGithubCommitIdentity(commit));
    });

    const importLog = buildCommitImportLogFromGithubCommits(entry.commits);
    const recentLog = buildRecentCommitLogFromGithubCommits(entry.commits);
    const branchLastCommitDate = normalizeWhitespace(
      entry.commits[0]?.commit?.author?.date ?? entry.commits[0]?.commit?.committer?.date ?? ''
    );

    branchGraphs[entry.branchName] = {
      branch: entry.branchName,
      graphImport: parseCommitImport(importLog, refsMap, identityIndex),
      recentCommits: parseBranchCommits(recentLog, identityIndex),
      lastCommitDate: branchLastCommitDate,
      lastCommitLabel: displayDate(branchLastCommitDate)
    };
  });

  const uniqueProjectCommits = dedupeGithubCommitsBySha(allCommits);
  const projectRefsMap = new Map();
  const headBranchGraph = branchGraphs[effectiveDefaultBranch];
  if (headBranchGraph?.graphImport?.[0]?.hash) {
    projectRefsMap.set(headBranchGraph.graphImport[0].hash, ['HEAD', effectiveDefaultBranch]);
  }
  const projectImportLog = buildCommitImportLogFromGithubCommits(uniqueProjectCommits);
  const projectRecentLog = buildRecentCommitLogFromGithubCommits(uniqueProjectCommits);
  const projectGraph = {
    branch: effectiveDefaultBranch,
    graphImport: parseCommitImport(projectImportLog, projectRefsMap, identityIndex),
    recentCommits: parseBranchCommits(projectRecentLog, identityIndex),
    lastCommitDate,
    lastCommitLabel: displayDate(lastCommitDate)
  };

  const authors = buildAuthorSummariesFromGithubCommits(defaultBranchEntry.commits, identityIndex);
  const totalCommits = uniqueProjectCommits.length;
  const mergeCommits = uniqueProjectCommits.filter((commit) => {
    const parentCount = Array.isArray(commit?.parents) ? commit.parents.length : 0;
    return parentCount > 1;
  }).length;

  return {
    remoteUrl: remoteUrl || `${normalizeWhitespace(repositoryMeta?.html_url) || `https://github.com/${repositoryLabel}`}.git`,
    repository: {
      owner: repositoryOwner,
      name: repositoryName,
      label: repositoryLabel
    },
    branch: effectiveDefaultBranch,
    defaultBranch: effectiveDefaultBranch,
    totalCommits,
    mergeCommits,
    branchCount: populatedBranchEntries.length,
    contributorCount: authors.length,
    authors,
    activity: {
      week: createActivitySeries(activityCounts, 'week'),
      month: createActivitySeries(activityCounts, 'month'),
      year: createActivitySeries(activityCounts, 'year')
    },
    branches: populatedBranchEntries.map((entry) => ({
      name: entry.branchName,
      ref: entry.branchName,
      hash: normalizeWhitespace(entry.commits[0]?.sha ?? ''),
      lastCommitDate: normalizeWhitespace(entry.commits[0]?.commit?.author?.date ?? entry.commits[0]?.commit?.committer?.date ?? ''),
      remoteOnly: false,
      selected: entry.branchName === effectiveDefaultBranch,
      lastCommitLabel: displayDate(entry.commits[0]?.commit?.author?.date ?? entry.commits[0]?.commit?.committer?.date ?? '')
    })),
    branchGraphs,
    projectGraph,
    lastCommitDate,
    lastCommitLabel: displayDate(lastCommitDate),
    buildWarning: reason,
    __rawIssues: rawIssues,
    __githubUsers: githubUsers
  };
}

function parseYamlScalar(value = '') {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) {
    return '';
  }

  const quoteWrapped = (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith('\'') && trimmed.endsWith('\''))
  );
  if (!quoteWrapped) {
    return trimmed;
  }

  return trimmed
    .slice(1, -1)
    .replaceAll('\\"', '"')
    .replaceAll("\\'", '\'');
}

function parseResponseCode(token = '') {
  const cleaned = parseYamlScalar(token.replace(/:$/, ''));
  if (!cleaned) {
    return '';
  }

  if (/^\d{3}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^default$/i.test(cleaned)) {
    return 'default';
  }

  return '';
}

function pathMethodComparator(left, right) {
  if (left.path !== right.path) {
    return left.path.localeCompare(right.path);
  }

  const leftOrder = HTTP_METHOD_ORDER.indexOf(left.method);
  const rightOrder = HTTP_METHOD_ORDER.indexOf(right.method);
  const safeLeftOrder = leftOrder >= 0 ? leftOrder : Number.POSITIVE_INFINITY;
  const safeRightOrder = rightOrder >= 0 ? rightOrder : Number.POSITIVE_INFINITY;

  if (safeLeftOrder !== safeRightOrder) {
    return safeLeftOrder - safeRightOrder;
  }

  return left.method.localeCompare(right.method);
}

function buildOpenApiFallbackSnapshot(sourcePath, errorMessage = '') {
  const fallbackTags = [{
    name: 'General',
    operationCount: 0,
    operations: []
  }];

  return {
    source: sourcePath,
    info: {
      title: '',
      version: ''
    },
    summary: {
      operationCount: 0,
      pathCount: 0,
      methodCount: 0,
      tagCount: 1
    },
    methods: [],
    tags: fallbackTags,
    operations: [],
    parseError: errorMessage
  };
}

function parseOpenApiYamlSnapshot(yamlContent, sourcePath) {
  const lines = String(yamlContent)
    .replace(/\r\n/g, '\n')
    .split('\n');
  const operations = [];
  const info = {
    title: '',
    version: ''
  };

  let inInfo = false;
  let inPaths = false;
  let currentPath = '';
  let currentOperation = null;
  let mode = '';
  let currentParameter = null;
  let inRequestBody = false;

  const closeMethodSection = () => {
    if (!currentOperation) {
      return;
    }

    const uniqueTags = [...new Set(currentOperation.tags.filter(Boolean))];
    const uniqueResponses = [...new Set(currentOperation.responses.filter(Boolean))];
    const parameters = currentOperation.parameters.map((parameter) => ({
      name: parameter.name,
      in: parameter.in
    }));

    currentOperation.tags = uniqueTags.length ? uniqueTags : ['General'];
    currentOperation.responses = uniqueResponses;
    currentOperation.parameters = parameters;
    currentOperation.pathParamCount = parameters.filter((parameter) => parameter.in === 'path').length;
    currentOperation.queryParamCount = parameters.filter((parameter) => parameter.in === 'query').length;
    currentOperation.hasParameters = parameters.length > 0;
    currentOperation.summary = currentOperation.summary || `${currentOperation.method} ${currentOperation.path}`;
    operations.push(currentOperation);
    currentOperation = null;
  };

  for (const line of lines) {
    const indentMatch = line.match(/^ */);
    const indent = indentMatch ? indentMatch[0].length : 0;
    const rawTrimmed = line.trim();
    if (!rawTrimmed || rawTrimmed.startsWith('#')) {
      continue;
    }

    if (indent === 0 && rawTrimmed === 'info:') {
      inInfo = true;
      inPaths = false;
      closeMethodSection();
      currentPath = '';
      mode = '';
      inRequestBody = false;
      continue;
    }

    if (indent === 0 && rawTrimmed === 'paths:') {
      inPaths = true;
      inInfo = false;
      closeMethodSection();
      currentPath = '';
      mode = '';
      inRequestBody = false;
      continue;
    }

    if (indent === 0 && rawTrimmed !== 'paths:' && inPaths) {
      inPaths = false;
      closeMethodSection();
      currentPath = '';
      mode = '';
      inRequestBody = false;
    }

    if (inInfo) {
      if (indent === 2 && rawTrimmed.startsWith('title:')) {
        info.title = parseYamlScalar(rawTrimmed.slice('title:'.length));
      } else if (indent === 2 && rawTrimmed.startsWith('version:')) {
        info.version = parseYamlScalar(rawTrimmed.slice('version:'.length));
      } else if (indent <= 0) {
        inInfo = false;
      }
      continue;
    }

    if (!inPaths) {
      continue;
    }

    if (indent === 2 && rawTrimmed.endsWith(':') && rawTrimmed.startsWith('/')) {
      closeMethodSection();
      currentPath = rawTrimmed.slice(0, -1).trim();
      mode = '';
      inRequestBody = false;
      continue;
    }

    if (!currentPath) {
      continue;
    }

    if (indent === 4 && rawTrimmed.endsWith(':')) {
      closeMethodSection();
      const methodName = rawTrimmed.slice(0, -1).trim().toLowerCase();
      if (!HTTP_METHODS.has(methodName)) {
        continue;
      }

      currentOperation = {
        key: '',
        method: methodName.toUpperCase(),
        path: currentPath,
        summary: '',
        operationId: '',
        tags: [],
        responses: [],
        parameters: [],
        requestBodyRequired: false
      };
      currentOperation.key = `${currentOperation.method} ${currentOperation.path}`;
      mode = '';
      inRequestBody = false;
      currentParameter = null;
      continue;
    }

    if (!currentOperation) {
      continue;
    }

    if (indent <= 4) {
      closeMethodSection();
      continue;
    }

    if (indent === 6 && rawTrimmed.startsWith('summary:')) {
      currentOperation.summary = parseYamlScalar(rawTrimmed.slice('summary:'.length));
      mode = '';
      continue;
    }

    if (indent === 6 && rawTrimmed.startsWith('operationId:')) {
      currentOperation.operationId = parseYamlScalar(rawTrimmed.slice('operationId:'.length));
      mode = '';
      continue;
    }

    if (indent === 6 && rawTrimmed === 'tags:') {
      mode = 'tags';
      continue;
    }

    if (indent === 6 && rawTrimmed === 'responses:') {
      mode = 'responses';
      continue;
    }

    if (indent === 6 && rawTrimmed === 'parameters:') {
      mode = 'parameters';
      currentParameter = null;
      continue;
    }

    if (indent === 6 && rawTrimmed === 'requestBody:') {
      inRequestBody = true;
      mode = '';
      continue;
    }

    if (indent === 6) {
      inRequestBody = false;
    }

    if (inRequestBody && indent >= 8 && rawTrimmed === 'required: true') {
      currentOperation.requestBodyRequired = true;
      continue;
    }

    if (mode === 'tags') {
      if (indent === 8 && rawTrimmed.startsWith('- ')) {
        const tag = parseYamlScalar(rawTrimmed.slice(2));
        if (tag) {
          currentOperation.tags.push(tag);
        }
        continue;
      }

      if (indent <= 6) {
        mode = '';
      }
    }

    if (mode === 'responses') {
      if (indent === 8 && rawTrimmed.endsWith(':')) {
        const code = parseResponseCode(rawTrimmed);
        if (code) {
          currentOperation.responses.push(code);
        }
        continue;
      }

      if (indent <= 6) {
        mode = '';
      }
    }

    if (mode === 'parameters') {
      if (indent === 8 && rawTrimmed.startsWith('- ')) {
        currentParameter = {
          name: '',
          in: ''
        };
        currentOperation.parameters.push(currentParameter);
        const inline = rawTrimmed.slice(2).trim();
        if (inline.startsWith('name:')) {
          currentParameter.name = parseYamlScalar(inline.slice('name:'.length));
        }
        continue;
      }

      if (!currentParameter) {
        if (indent <= 6) {
          mode = '';
        }
        continue;
      }

      if (indent >= 10 && rawTrimmed.startsWith('name:')) {
        currentParameter.name = parseYamlScalar(rawTrimmed.slice('name:'.length));
        continue;
      }

      if (indent >= 10 && rawTrimmed.startsWith('in:')) {
        currentParameter.in = parseYamlScalar(rawTrimmed.slice('in:'.length)).toLowerCase();
        continue;
      }

      if (indent <= 6) {
        mode = '';
        currentParameter = null;
      }
    }
  }

  closeMethodSection();

  const sortedOperations = operations.sort(pathMethodComparator);
  const pathCount = new Set(sortedOperations.map((operation) => operation.path)).size;
  const methodCounter = new Map();
  const tagBuckets = new Map();

  sortedOperations.forEach((operation) => {
    methodCounter.set(operation.method, (methodCounter.get(operation.method) ?? 0) + 1);
    operation.tags.forEach((tag) => {
      const bucket = tagBuckets.get(tag) ?? [];
      bucket.push(operation);
      tagBuckets.set(tag, bucket);
    });
  });

  const methods = [...methodCounter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => {
      const leftOrder = HTTP_METHOD_ORDER.indexOf(left.name);
      const rightOrder = HTTP_METHOD_ORDER.indexOf(right.name);
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return left.name.localeCompare(right.name);
    });

  const tags = [...tagBuckets.entries()]
    .map(([name, entries]) => ({
      name,
      operationCount: entries.length,
      operations: [...entries].sort(pathMethodComparator)
    }))
    .sort((left, right) => right.operationCount - left.operationCount || left.name.localeCompare(right.name));

  const normalizedTags = tags.length > 0
    ? tags
    : [{
      name: 'General',
      operationCount: 0,
      operations: []
    }];

  return {
    source: sourcePath,
    info,
    summary: {
      operationCount: sortedOperations.length,
      pathCount,
      methodCount: methods.length,
      tagCount: normalizedTags.length
    },
    methods,
    tags: normalizedTags,
    operations: sortedOperations
  };
}

async function buildOpenApiSnapshot(workspaceRoot) {
  const sourcePath = path.join(workspaceRoot, OPENAPI_RELATIVE_PATH);

  try {
    const yamlContent = await fs.readFile(sourcePath, 'utf8');
    return parseOpenApiYamlSnapshot(yamlContent, OPENAPI_RELATIVE_PATH);
  } catch (error) {
    const detail = error?.message || 'unknown error';
    return buildOpenApiFallbackSnapshot(OPENAPI_RELATIVE_PATH, `OpenAPI parsing failed: ${detail}`);
  }
}

async function run(command, args, cwd) {
  const { stdout } = await execFileAsync(command, args, {
    cwd,
    maxBuffer: 1024 * 1024 * 32
  });
  return stdout.trim();
}

async function runOptional(command, args, cwd) {
  try {
    return await run(command, args, cwd);
  } catch {
    return '';
  }
}

async function runJsonRequired(command, args, cwd, contextLabel) {
  const output = await run(command, args, cwd);
  if (!output) {
    throw new Error(`${contextLabel} returned an empty response.`);
  }

  try {
    return JSON.parse(output);
  } catch {
    throw new Error(`${contextLabel} returned invalid JSON.`);
  }
}

async function runJsonOptional(command, args, cwd, contextLabel) {
  try {
    return await runJsonRequired(command, args, cwd, contextLabel);
  } catch {
    return null;
  }
}

function resolveGithubApiOrigin() {
  const configuredOrigin = normalizeWhitespace(process.env.GITHUB_API_ORIGIN ?? '');
  return configuredOrigin || 'https://api.github.com';
}

function buildGithubApiRequestHeaders() {
  const token = normalizeWhitespace(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '');
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'pawsitters-repository-snapshot'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchGithubApiJson(resourcePath, { optional = true } = {}) {
  if (typeof fetch !== 'function') {
    if (optional) {
      return null;
    }
    throw new Error('Fetch API is unavailable in this Node.js runtime.');
  }

  const normalizedPath = String(resourcePath || '').replace(/^\/+/, '');
  const url = new URL(normalizedPath, `${resolveGithubApiOrigin().replace(/\/+$/, '')}/`);

  try {
    const response = await fetch(url, {
      headers: buildGithubApiRequestHeaders()
    });
    if (!response.ok) {
      if (optional) {
        return null;
      }
      throw new Error(`GitHub API request failed with status ${response.status} for ${url.toString()}`);
    }

    return await response.json();
  } catch (error) {
    if (optional) {
      return null;
    }
    throw error;
  }
}

async function fetchOpenIssues(owner, repo, workspaceRoot) {
  const cliIssues = await runJsonOptional(
    'gh',
    ['api', `repos/${owner}/${repo}/issues?state=open&per_page=100`],
    workspaceRoot,
    'GitHub issues API'
  );
  const apiIssues = Array.isArray(cliIssues)
    ? cliIssues
    : await fetchGithubApiJson(`/repos/${owner}/${repo}/issues?state=open&per_page=100`);
  const issues = Array.isArray(apiIssues) ? apiIssues : [];

  return issues.filter((issue) => !issue.pull_request);
}

function prepareBody(body = '') {
  return normalizeWhitespace(
    body
      .replace(/(Beschreibung:|Schnittstellen:|Akzeptanzkriterien:|Epic:)/g, '\n$1')
      .replace(/([a-z])([A-Z][a-z]+:)/g, '$1\n$2')
  );
}

function extractDescription(body) {
  const match = body.match(/Beschreibung:\s*([\s\S]*?)(?:\n(?:Schnittstellen:|Akzeptanzkriterien:|Epic:)|$)/i);
  if (match?.[1]) {
    return normalizeWhitespace(match[1]);
  }

  return body
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .find((line) => line && !/^(Schnittstellen:|Akzeptanzkriterien:|Epic:)/i.test(line))
    ?? '';
}

function extractEndpoints(body) {
  return [...body.matchAll(/\b(GET|POST|PUT|PATCH|DELETE)\s+\/[^\s\n]+/g)]
    .map((match) => match[0]);
}

function extractCriteria(body) {
  const match = body.match(/Akzeptanzkriterien:\s*([\s\S]*?)(?:\n(?:Beschreibung:|Schnittstellen:|Epic:)|$)/i);
  if (!match?.[1]) {
    return [];
  }

  return match[1]
    .split('\n')
    .map((line) => normalizeWhitespace(line.replace(/^[-*]\s*/, '')))
    .filter(Boolean);
}

function splitIssueTitle(title = '') {
  const parts = title
    .split('|')
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

  if (parts.length < 2) {
    return {
      track: '',
      title: normalizeWhitespace(title)
    };
  }

  return {
    track: parts[0],
    title: parts.slice(1).join(' | ')
  };
}

function inferColumnId(issue) {
  const { track } = splitIssueTitle(issue.title);
  const milestone = normalizeWhitespace(issue.milestone?.title ?? '');
  const labels = (Array.isArray(issue?.labels) ? issue.labels : [])
    .map((label) => normalizeWhitespace(label.name ?? label))
    .join(' ');
  const body = normalizeWhitespace(issue.body ?? '');
  const typeName = normalizeWhitespace(issue.type?.name ?? '');
  const corpus = [track, issue.title, milestone, labels, body, typeName]
    .join(' ')
    .toLowerCase();

  if (/\bfrontend\b|\bui\/ux\b/.test(corpus)) {
    return 'frontend';
  }

  if (/\bapi\b|auth|session|controller|endpoint/.test(corpus)) {
    return 'api';
  }

  if (/daten|database|datenbank|persisten|entity|schema|klassendiagramm|service layer|service-schicht|repository/.test(corpus)) {
    return 'data';
  }

  if (/dokument|documentation|usecase|use case|artefakt|diagramm/.test(corpus)) {
    return 'docs';
  }

  return 'misc';
}

function buildPaletteMap(names) {
  const uniqueNames = [...new Set(names.filter(Boolean))].sort((left, right) => left.localeCompare(right));
  return new Map(uniqueNames.map((name, index) => [name, AUTHOR_PALETTE[index % AUTHOR_PALETTE.length]]));
}

function addRef(refMap, hash, ref) {
  if (!hash || !ref) {
    return;
  }

  const existingRefs = refMap.get(hash) ?? [];
  if (!existingRefs.includes(ref)) {
    existingRefs.push(ref);
  }
  refMap.set(hash, existingRefs);
}

function parseNamedRefs(refOutput, transformName = (name) => name) {
  const refMap = new Map();

  refOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [name, hash] = line.split('\t');
      if (!name || !hash) {
        return;
      }

      addRef(refMap, hash.trim(), transformName(name.trim()));
    });

  return refMap;
}

function mergeRefMaps(...refMaps) {
  const mergedMap = new Map();

  refMaps.forEach((refMap) => {
    refMap.forEach((refs, hash) => {
      refs.forEach((ref) => addRef(mergedMap, hash, ref));
    });
  });

  return mergedMap;
}

function normalizeBranchRefName(name) {
  if (name === 'origin/HEAD') {
    return '';
  }

  if (name.startsWith('origin/')) {
    return name.slice('origin/'.length);
  }

  return name;
}

function pickDefaultBranch(branches, currentBranch) {
  if (branches.some((branch) => branch.name === 'develop')) {
    return 'develop';
  }

  if (branches.some((branch) => branch.name === currentBranch)) {
    return currentBranch;
  }

  return branches[0]?.name ?? currentBranch ?? 'HEAD';
}

function createActivitySeries(activityCounts, range, locale = 'en') {
  const today = new Date();
  const entries = [];

  if (range === 'week') {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);

    for (let index = 0; index < 7; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = toDateKey(date);
      entries.push({
        key,
        count: activityCounts.get(key) ?? 0,
        label: formatWeekday(date.toISOString(), locale),
        fullLabel: displayDate(date.toISOString(), locale),
        isToday: isSameDay(date, today)
      });
    }
  } else if (range === 'month') {
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = toDateKey(date);
      entries.push({
        key,
        count: activityCounts.get(key) ?? 0,
        label: formatMonthDay(date.toISOString(), locale),
        fullLabel: displayDate(date.toISOString(), locale),
        isToday: isSameDay(date, today),
        emphasizeLabel: day === 1 || day === today.getDate() || day === daysInMonth || day % 5 === 0
      });
    }
  } else {
    const year = today.getFullYear();

    for (let month = 0; month < 12; month += 1) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      let count = 0;

      for (let day = 1; day <= monthEnd.getDate(); day += 1) {
        const date = new Date(year, month, day);
        const key = toDateKey(date);
        count += activityCounts.get(key) ?? 0;
      }

      entries.push({
        key: `${year}-${String(month + 1).padStart(2, '0')}`,
        count,
        label: formatMonthLabel(monthStart.toISOString(), locale),
        fullLabel: `${formatMonthLabel(monthStart.toISOString(), locale)} ${year}`,
        isToday: month === today.getMonth(),
        emphasizeLabel: true
      });
    }
  }

  const nonZeroCounts = entries
    .map((entry) => entry.count)
    .filter((count) => count > 0);
  const maxCount = Math.max(...nonZeroCounts, 0);
  const minNonZeroCount = nonZeroCounts.length > 0
    ? Math.min(...nonZeroCounts)
    : 0;
  const hasSpread = maxCount > minNonZeroCount;
  const MIN_BAR_HEIGHT = 8;
  const FLAT_BAR_HEIGHT = 58;
  const MAX_BAR_HEIGHT = 100;
  const TIE_SPREAD = 7;

  const withBaseHeights = entries.map((entry) => {
    let height = 0;

    if (entry.count > 0 && maxCount > 0) {
      if (!hasSpread) {
        height = FLAT_BAR_HEIGHT;
      } else {
        const logMin = Math.log1p(minNonZeroCount);
        const logMax = Math.log1p(maxCount);
        const logValue = Math.log1p(entry.count);
        const ratio = (logValue - logMin) / (logMax - logMin);
        const clampedRatio = Math.min(1, Math.max(0, ratio));
        const easedRatio = Math.pow(clampedRatio, 0.85);
        const scaledHeight = MIN_BAR_HEIGHT + (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * easedRatio;
        height = scaledHeight;
      }
    }

    return {
      ...entry,
      height
    };
  });

  const entriesByCount = withBaseHeights.reduce((map, entry, index) => {
    if (entry.count <= 0) {
      return map;
    }

    const group = map.get(entry.count) ?? [];
    group.push({ index, entry });
    map.set(entry.count, group);
    return map;
  }, new Map());

  const adjustedHeights = withBaseHeights.map((entry) => entry.height);
  entriesByCount.forEach((group, count) => {
    if (group.length < 2) {
      return;
    }

    const isMaxGroup = count === maxCount;
    const denominator = Math.max(1, group.length - 1);

    group.forEach(({ index }, groupIndex) => {
      const position = groupIndex / denominator;
      const baseHeight = adjustedHeights[index];
      let offset = (position - 0.5) * TIE_SPREAD;

      // Keep one true top bar at full height when multiple entries share the same max count.
      if (isMaxGroup) {
        offset = -(1 - position) * TIE_SPREAD;
      }

      const adjustedHeight = Math.min(
        MAX_BAR_HEIGHT,
        Math.max(MIN_BAR_HEIGHT, baseHeight + offset)
      );
      adjustedHeights[index] = adjustedHeight;
    });
  });

  return withBaseHeights.map((entry, index) => {
    const roundedHeight = Number(adjustedHeights[index].toFixed(1));
    return {
      ...entry,
      style: `--bar-size:${roundedHeight}%;`,
      height: roundedHeight
    };
  });
}

function buildIdentityFromUser(user) {
  if (!user?.login) {
    return null;
  }

  return {
    login: user.login,
    name: user.name || user.login,
    email: user.email || '',
    avatarUrl: user.avatar_url || user.avatarUrl || '',
    profileUrl: user.html_url || user.profileUrl || `https://github.com/${user.login}`
  };
}

function resolveIdentityName(identity, fallbackName = '') {
  if (!identity) {
    return fallbackName;
  }

  return identity.login || identity.name || fallbackName;
}

function addIdentityAlias(index, key, identity) {
  const normalizedKey = normalizeIdentityKey(key);
  if (!normalizedKey || index.has(normalizedKey)) {
    return;
  }

  index.set(normalizedKey, identity);
}

function indexIdentity(index, identity) {
  if (!identity) {
    return;
  }

  addIdentityAlias(index, identity.login, identity);
  addIdentityAlias(index, identity.email, identity);

  const emailMatch = identity.email.match(/\+([^@]+)@users\.noreply\.github\.com$/i);
  if (emailMatch?.[1]) {
    addIdentityAlias(index, emailMatch[1], identity);
  }
}

async function fetchGithubUsers(owner, repo, issues, workspaceRoot) {
  const contributorsFromCli = await runJsonOptional(
    'gh',
    ['api', `repos/${owner}/${repo}/contributors?per_page=100`],
    workspaceRoot,
    'GitHub contributors API'
  );
  const contributorsFromApi = Array.isArray(contributorsFromCli)
    ? contributorsFromCli
    : await fetchGithubApiJson(`/repos/${owner}/${repo}/contributors?per_page=100`);
  const contributors = Array.isArray(contributorsFromApi) ? contributorsFromApi : [];

  const issueUsers = issues.flatMap((issue) => {
    const assignees = Array.isArray(issue?.assignees) ? issue.assignees : [];
    return [issue?.user, ...assignees].filter(Boolean);
  });
  const knownUsers = [...contributors, ...issueUsers];

  const identitiesByLogin = new Map();
  knownUsers.forEach((user) => {
    const identity = buildIdentityFromUser(user);
    if (!identity?.login) {
      return;
    }

    const existing = identitiesByLogin.get(identity.login);
    if (!existing) {
      identitiesByLogin.set(identity.login, identity);
      return;
    }

    identitiesByLogin.set(identity.login, {
      ...existing,
      name: existing.name || identity.name,
      avatarUrl: existing.avatarUrl || identity.avatarUrl,
      profileUrl: existing.profileUrl || identity.profileUrl
    });
  });

  return [...identitiesByLogin.values()];
}

function parseAuthorContributionStats(logOutput) {
  const stats = new Map();

  logOutput
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [authorLine = '', ...numstatLines] = entry
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const [authorName = '', authorEmail = ''] = authorLine.split('\x1f');

      if (!authorName) {
        return;
      }

      const key = `${authorName}\x1f${authorEmail}`;
      const current = stats.get(key) ?? {
        count: 0,
        authorName,
        authorEmail,
        additions: 0,
        deletions: 0,
        linesContributed: 0
      };

      current.count += 1;

      for (const line of numstatLines) {
        const match = line.match(/^(\d+|-)\t(\d+|-)\t/);
        if (!match) {
          continue;
        }

        const additions = match[1] === '-' ? 0 : Number.parseInt(match[1], 10);
        const deletions = match[2] === '-' ? 0 : Number.parseInt(match[2], 10);
        current.additions += additions;
        current.deletions += deletions;
      }

      current.linesContributed = current.additions + current.deletions;
      stats.set(key, current);
    });

  return [...stats.values()]
    .sort((left, right) => right.count - left.count || left.authorName.localeCompare(right.authorName));
}

function parseCommitImport(logOutput, refsMap, identityMap) {
  const commits = logOutput
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash, parentsRaw = '', authorName = '', authorEmail = '', authorDate = '', subject = ''] = entry.split('\x1f');
      const identity = identityMap.get(normalizeIdentityKey(authorEmail))
        ?? null;

      return {
        author: {
          name: resolveIdentityName(identity, authorName),
          email: authorEmail,
          date: authorDate
        },
        refs: refsMap.get(hash) ?? [],
        hash,
        parents: parentsRaw ? parentsRaw.split(' ').filter(Boolean) : [],
        subject,
        body: ''
      };
    });

  const knownHashes = new Set(commits.map((commit) => commit.hash).filter(Boolean));

  return commits.map((commit) => ({
    ...commit,
    // Gitgraph can render broken transitions when parent hashes are missing from the import payload.
    parents: commit.parents.filter((parentHash) => knownHashes.has(parentHash))
  }));
}

function parseBranchCommits(logOutput, identityMap) {
  return logOutput
    .split('\x1e')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash = '', shortSha = '', date = '', authorName = '', authorEmail = '', subject = ''] = entry.split('\x1f');
      const identity = identityMap.get(normalizeIdentityKey(authorEmail))
        ?? null;

      return {
        hash,
        shortSha,
        date,
        dateLabel: compactDate(date),
        author: resolveIdentityName(identity, authorName),
        authorLogin: identity?.login || authorName,
        avatarUrl: identity?.avatarUrl || '',
        profileUrl: identity?.profileUrl || '',
        initials: initials(resolveIdentityName(identity, authorName)),
        message: subject,
        merge: /^merge /i.test(subject),
        tone: /^merge /i.test(subject) ? 'git_commit--merge' : ''
      };
    });
}

async function buildBranchGraphSnapshot(workspaceRoot, branch, refsMap, identityMap) {
  const [importLog, recentCommitLog, lastCommitDate] = await Promise.all([
    runOptional(
      'git',
      ['log', branch.ref, '--topo-order', '--date=iso-strict', '--pretty=format:%H%x1f%P%x1f%an%x1f%ae%x1f%ad%x1f%s%x1e', '-n', '120'],
      workspaceRoot
    ),
    runOptional('git', ['log', branch.ref, '--date=short', '--pretty=format:%H%x1f%h%x1f%ad%x1f%an%x1f%ae%x1f%s%x1e'], workspaceRoot),
    runOptional('git', ['log', branch.ref, '-1', '--date=iso-strict', '--pretty=%ad'], workspaceRoot)
  ]);

  const graphImport = parseCommitImport(importLog, refsMap, identityMap);
  const recentCommits = parseBranchCommits(recentCommitLog, identityMap);

  return {
    branch: branch.name,
    graphImport,
    recentCommits,
    lastCommitDate,
    lastCommitLabel: displayDate(lastCommitDate)
  };
}

async function buildGitSnapshot(workspaceRoot) {
  const [
    currentBranch,
    totalCommitsRaw,
    mergeCommitsRaw,
    remoteUrl,
    lastCommitDate,
    headHash,
    activityLog,
    authorContributionLog,
    branchOutput,
    localHeadsOutput,
    remoteHeadsOutput,
    tagRefsOutput
  ] = await Promise.all([
    runOptional('git', ['branch', '--show-current'], workspaceRoot),
    runOptional('git', ['rev-list', '--count', '--all'], workspaceRoot),
    runOptional('git', ['rev-list', '--count', '--merges', '--all'], workspaceRoot),
    runOptional('git', ['remote', 'get-url', 'origin'], workspaceRoot),
    runOptional('git', ['log', '-1', '--all', '--date=iso-strict', '--pretty=%ad'], workspaceRoot),
    runOptional('git', ['rev-parse', 'HEAD'], workspaceRoot),
    runOptional('git', ['log', '--all', '--date=short', '--pretty=%ad'], workspaceRoot),
    runOptional('git', ['log', '--all', '--numstat', '--format=%x1e%an%x1f%ae'], workspaceRoot),
    runOptional(
      'git',
      ['for-each-ref', '--format=%(refname:short)\t%(objectname)\t%(committerdate:iso-strict)', 'refs/heads', 'refs/remotes/origin'],
      workspaceRoot
    ),
    runOptional('git', ['for-each-ref', '--format=%(refname:short)\t%(objectname)', 'refs/heads'], workspaceRoot),
    runOptional('git', ['for-each-ref', '--format=%(refname:short)\t%(objectname)', 'refs/remotes/origin'], workspaceRoot),
    runOptional('git', ['for-each-ref', '--format=%(refname:short)\t%(objectname)', 'refs/tags'], workspaceRoot)
  ]);

  const { owner, repo } = parseRemote(remoteUrl);
  const rawIssues = await fetchOpenIssues(owner, repo, workspaceRoot);
  const githubUsers = await fetchGithubUsers(owner, repo, rawIssues, workspaceRoot);
  const identityIndex = new Map();
  const currentBranchName = currentBranch || process.env.GITHUB_REF_NAME || '';
  const currentHeadHash = headHash || process.env.GITHUB_SHA || '';

  githubUsers.forEach((identity) => indexIdentity(identityIndex, identity));

  const authorStats = parseAuthorContributionStats(authorContributionLog);
  authorStats.forEach((author) => {
    const normalizedEmail = normalizeWhitespace(author.authorEmail);
    if (!normalizedEmail) {
      return;
    }

    const existingIdentity = identityIndex.get(normalizeIdentityKey(normalizedEmail));
    if (existingIdentity) {
      return;
    }

    const synthesizedIdentity = {
      login: normalizeWhitespace(author.authorName) || normalizedEmail,
      name: normalizeWhitespace(author.authorName) || normalizedEmail,
      email: normalizedEmail,
      avatarUrl: '',
      profileUrl: ''
    };
    indexIdentity(identityIndex, synthesizedIdentity);
  });

  const activityCounts = activityLog
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((map, date) => {
      map.set(date, (map.get(date) ?? 0) + 1);
      return map;
    }, new Map());

  const branches = branchOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((map, line) => {
      const [rawRef = '', hash = '', committedAt = ''] = line.split('\t');
      const name = normalizeBranchRefName(rawRef);

      if (!name) {
        return map;
      }

      const existing = map.get(name);
      const candidate = {
        name,
        ref: rawRef.startsWith('origin/') && existing?.ref ? existing.ref : rawRef,
        hash,
        lastCommitDate: committedAt,
        remoteOnly: rawRef.startsWith('origin/')
      };

      if (!existing || (!candidate.remoteOnly && existing.remoteOnly)) {
        map.set(name, candidate);
      }

      return map;
    }, new Map());

  const branchList = [...branches.values()];
  const defaultBranch = pickDefaultBranch(branchList, currentBranchName);
  branchList.sort((left, right) => {
    if (left.name === defaultBranch) {
      return -1;
    }
    if (right.name === defaultBranch) {
      return 1;
    }

    return right.lastCommitDate.localeCompare(left.lastCommitDate) || left.name.localeCompare(right.name);
  });

  const localHeadRefs = parseNamedRefs(localHeadsOutput);
  const remoteHeadRefs = parseNamedRefs(remoteHeadsOutput, (name) => normalizeBranchRefName(name));
  const tagRefs = parseNamedRefs(tagRefsOutput, (name) => `tag: ${name}`);
  const headRefs = new Map();
  addRef(headRefs, currentHeadHash, 'HEAD');
  addRef(headRefs, currentHeadHash, currentBranchName || defaultBranch || 'HEAD');
  const refsMap = mergeRefMaps(localHeadRefs, remoteHeadRefs, tagRefs, headRefs);

  const branchGraphs = Object.fromEntries(await Promise.all(branchList.map(async (branch) => ([
    branch.name,
    await buildBranchGraphSnapshot(workspaceRoot, branch, refsMap, identityIndex)
  ]))));

  const [projectGraphImportLog, projectRecentCommitLog] = await Promise.all([
    runOptional(
      'git',
      ['log', '--all', '--topo-order', '--date=iso-strict', '--pretty=format:%H%x1f%P%x1f%an%x1f%ae%x1f%ad%x1f%s%x1e'],
      workspaceRoot
    ),
    runOptional(
      'git',
      ['log', '--all', '--date=short', '--pretty=format:%H%x1f%h%x1f%ad%x1f%an%x1f%ae%x1f%s%x1e'],
      workspaceRoot
    )
  ]);
  const projectGraph = {
    branch: currentBranchName || defaultBranch,
    graphImport: parseCommitImport(projectGraphImportLog, refsMap, identityIndex),
    recentCommits: parseBranchCommits(projectRecentCommitLog, identityIndex),
    lastCommitDate,
    lastCommitLabel: displayDate(lastCommitDate)
  };

  const paletteMap = buildPaletteMap([
    ...authorStats.map((author) => {
      const identity = identityIndex.get(normalizeIdentityKey(author.authorEmail))
        ?? null;
      return identity?.login || identity?.name || author.authorName;
    })
  ]);

  const maxCount = Math.max(...authorStats.map((author) => author.count), 1);
  const authors = authorStats
    .map((author) => {
      const identity = identityIndex.get(normalizeIdentityKey(author.authorEmail))
        ?? null;
      const tone = paletteMap.get(identity?.login || identity?.name || author.authorName) ?? AUTHOR_PALETTE[0];
      const share = Math.max(12, Math.round((author.count / maxCount) * 100));

      return {
        count: author.count,
        linesContributed: author.linesContributed,
        additions: author.additions,
        deletions: author.deletions,
        name: resolveIdentityName(identity, author.authorName),
        login: identity?.login || author.authorName,
        avatarUrl: identity?.avatarUrl || '',
        profileUrl: identity?.profileUrl || '',
        initials: initials(resolveIdentityName(identity, author.authorName)),
        share,
        style: `--author-share:${share}%;`,
        toneStyle: `${toneStyle(tone)}--author-share:${share}%;`
      };
    })
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));

  const hasUsableBranches = branchList.length > 0;
  const hasUsableGraph = projectGraph.graphImport.length > 0 && projectGraph.recentCommits.length > 0;
  const hasUsableContributors = authors.length > 0;
  if (!hasUsableBranches || !hasUsableGraph || !hasUsableContributors) {
    return buildGitSnapshotFromGithubApi({
      remoteUrl,
      owner,
      repo,
      currentBranch: currentBranchName || 'develop',
      reason: 'Git/CLI metadata unavailable; using live GitHub API repository data.',
      rawIssues,
      githubUsers
    });
  }

  return {
    remoteUrl,
    repository: {
      owner,
      name: repo,
      label: `${owner}/${repo}`
    },
    branch: currentBranchName || defaultBranch,
    defaultBranch,
    totalCommits: Number.parseInt(totalCommitsRaw || '0', 10),
    mergeCommits: Number.parseInt(mergeCommitsRaw || '0', 10),
    branchCount: branchList.length,
    contributorCount: authors.length,
    authors,
      activity: {
        week: createActivitySeries(activityCounts, 'week'),
        month: createActivitySeries(activityCounts, 'month'),
        year: createActivitySeries(activityCounts, 'year')
      },
    branches: branchList.map((branch) => ({
      ...branch,
      selected: branch.name === defaultBranch,
      lastCommitLabel: displayDate(branch.lastCommitDate)
    })),
    branchGraphs,
    projectGraph,
    lastCommitDate,
    lastCommitLabel: displayDate(lastCommitDate),
    __rawIssues: rawIssues,
    __githubUsers: githubUsers
  };
}

function decorateAssignee(assignee, paletteMap) {
  const tone = paletteMap.get(assignee.login) ?? AUTHOR_PALETTE[0];

  return {
    ...assignee,
    initials: initials(assignee.name || assignee.login),
    style: toneStyle(tone)
  };
}

function decorateBoard(rawBoard, paletteMap) {
  const cardMap = new Map(rawBoard.cards.map((card) => {
    const primaryIdentity = card.assignees[0] ?? card.author ?? null;
    const tone = primaryIdentity?.login
      ? (paletteMap.get(primaryIdentity.login) ?? AUTHOR_PALETTE[0])
      : (COLUMN_PALETTE[card.columnId] ?? COLUMN_PALETTE.misc);

    return [card.key, {
      ...card,
      ownerStyle: toneStyle(tone),
      assignees: card.assignees.map((assignee) => decorateAssignee(assignee, paletteMap))
    }];
  }));

  const owners = [...new Map(rawBoard.cards
    .flatMap((card) => card.assignees)
    .map((assignee) => [assignee.login, decorateAssignee(assignee, paletteMap)]))
    .values()]
    .sort((left, right) => left.login.localeCompare(right.login));

  return {
    ...rawBoard,
    cards: rawBoard.cards.map((card) => cardMap.get(card.key)),
    columns: rawBoard.columns.map((column) => ({
      ...column,
      toneStyle: toneStyle(COLUMN_PALETTE[column.id] ?? COLUMN_PALETTE.misc),
      cards: column.cards.map((card) => cardMap.get(card.key))
    })),
    owners
  };
}

function mapIssues(rawIssues, identityIndex) {
  const cards = rawIssues.map((issue) => {
    const labels = Array.isArray(issue?.labels) ? issue.labels : [];
    const assignees = Array.isArray(issue?.assignees) ? issue.assignees : [];
    const normalizedBody = prepareBody(issue.body);
    const { track, title } = splitIssueTitle(issue.title);
    const columnId = inferColumnId(issue);
    const description = extractDescription(normalizedBody);
    const criteria = extractCriteria(normalizedBody);
    const endpoints = extractEndpoints(normalizedBody);
    const authorIdentity = identityIndex.get(normalizeIdentityKey(issue.user?.login))
      || buildIdentityFromUser(issue.user)
      || null;

    return {
      key: String(issue.number),
      number: issue.number,
      numberLabel: `#${issue.number}`,
      title,
      track: track || normalizeWhitespace(issue.milestone?.title ?? issue.type?.name ?? COLUMN_LABEL[columnId]),
      state: String(issue.state || 'open').toUpperCase(),
      stateLabel: String(issue.state || 'open').toUpperCase(),
      columnId,
      tone: COLUMN_TONE[columnId],
      toneClass: `board_card--${COLUMN_TONE[columnId]}`,
      description,
      hasDescription: Boolean(description),
      endpoints,
      hasEndpoints: endpoints.length > 0,
      criteria,
      hasCriteria: criteria.length > 0,
      labels: labels.map((label) => normalizeWhitespace(label.name ?? label)).filter(Boolean),
      hasLabels: labels.length > 0,
      assignees: assignees.map((assignee) => {
        const identity = identityIndex.get(normalizeIdentityKey(assignee.login))
          || buildIdentityFromUser(assignee)
          || null;

        return {
          login: identity?.login || assignee.login,
          name: identity?.name || assignee.login,
          avatarUrl: identity?.avatarUrl || assignee.avatar_url || '',
          profileUrl: identity?.profileUrl || assignee.html_url || `https://github.com/${assignee.login}`
        };
      }),
      assigneeCount: assignees.length,
      author: authorIdentity
        ? {
          login: authorIdentity.login,
          name: authorIdentity.name,
          avatarUrl: authorIdentity.avatarUrl,
          profileUrl: authorIdentity.profileUrl
        }
        : null,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      createdLabel: compactDate(issue.created_at),
      updatedLabel: compactDate(issue.updated_at),
      url: issue.html_url
    };
  });

  const columnMap = new Map(COLUMN_ORDER.map((id) => [id, []]));
  for (const card of cards) {
    columnMap.get(card.columnId)?.push(card);
  }

  const columns = COLUMN_ORDER
    .map((id) => ({
      id,
      label: COLUMN_LABEL[id],
      cards: (columnMap.get(id) ?? []).sort((left, right) => right.number - left.number)
    }));

  const assigneeLogins = new Set(cards.flatMap((card) => card.assignees.map((assignee) => assignee.login)));
  const criteriaCount = cards.reduce((total, card) => total + card.criteria.length, 0);

  return {
    cards,
    columns,
    summary: {
      openCount: cards.length,
      assignedCount: cards.filter((card) => card.assigneeCount > 0).length,
      ownerCount: assigneeLogins.size,
      criteriaCount
    }
  };
}

async function buildRepositorySnapshot(rootDir) {
  const workspaceRoot = resolveWorkspaceRoot(rootDir);
  const gitSnapshot = await buildGitSnapshot(workspaceRoot);
  const rawIssues = Array.isArray(gitSnapshot.__rawIssues) ? gitSnapshot.__rawIssues : [];
  const githubUsers = Array.isArray(gitSnapshot.__githubUsers)
    ? gitSnapshot.__githubUsers
    : await fetchGithubUsers(gitSnapshot.repository.owner, gitSnapshot.repository.name, rawIssues, workspaceRoot);
  const identityIndex = new Map();
  githubUsers.forEach((identity) => indexIdentity(identityIndex, identity));

  const rawBoard = mapIssues(rawIssues, identityIndex);
  const paletteMap = buildPaletteMap([
    ...gitSnapshot.authors.map((author) => author.login || author.name),
    ...rawBoard.cards.flatMap((card) => card.assignees.map((assignee) => assignee.login))
  ]);
  const board = decorateBoard(rawBoard, paletteMap);

  return sanitizeRemovedRepositoryPathReferences({
    generatedAt: new Date().toISOString(),
    repository: gitSnapshot.repository,
    git: Object.fromEntries(
      Object.entries(gitSnapshot).filter(([key]) => !key.startsWith('__'))
    ),
    board
  });
}

function localizeBoardCard(card, locale, messages) {
  return {
    ...card,
    stateLabel: lookupMessage(messages, `repository.board.state.${card.state.toLowerCase()}`, card.stateLabel),
    labels: card.labels.map((label) => lookupMessage(
      messages,
      `repository.board.labels.${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label
    )),
    createdLabel: compactDate(card.createdAt, locale),
    updatedLabel: compactDate(card.updatedAt, locale)
  };
}

function localizeRepositorySnapshot(snapshot, locale, messages) {
  const localizedBoardCards = snapshot.board.cards.map((card) => localizeBoardCard(card, locale, messages));
  const localizedCardMap = new Map(localizedBoardCards.map((card) => [card.key, card]));

  return {
    ...snapshot,
    git: {
      ...snapshot.git,
      activityRanges: {
        week: lookupMessage(messages, 'repository.git.range.week', 'This week'),
        month: lookupMessage(messages, 'repository.git.range.month', 'This month'),
        year: lookupMessage(messages, 'repository.git.range.year', 'This year')
      },
      activity: {
        week: snapshot.git.activity.week.map((day) => ({
          ...day,
          label: formatWeekday(day.key, locale),
          fullLabel: displayDate(day.key, locale)
        })),
        month: snapshot.git.activity.month.map((day) => ({
          ...day,
          label: formatMonthDay(day.key, locale),
          fullLabel: displayDate(day.key, locale)
        })),
        year: snapshot.git.activity.year.map((day) => ({
          ...day,
          label: formatMonthLabel(`${day.key}-01`, locale),
          fullLabel: day.fullLabel
        }))
      },
      branches: snapshot.git.branches.map((branch) => ({
        ...branch,
        lastCommitLabel: displayDate(branch.lastCommitDate, locale)
      })),
      branchGraphs: Object.fromEntries(Object.entries(snapshot.git.branchGraphs).map(([branchName, graph]) => [branchName, {
        ...graph,
        lastCommitLabel: displayDate(graph.lastCommitDate, locale),
        recentCommits: graph.recentCommits.map((commit) => ({
          ...commit,
          dateLabel: compactDate(commit.date, locale)
        }))
      }])),
      projectGraph: {
        ...snapshot.git.projectGraph,
        lastCommitLabel: displayDate(snapshot.git.projectGraph.lastCommitDate, locale),
        recentCommits: snapshot.git.projectGraph.recentCommits.map((commit) => ({
          ...commit,
          dateLabel: compactDate(commit.date, locale)
        }))
      },
      lastCommitLabel: displayDate(snapshot.git.lastCommitDate, locale)
    },
    board: {
      ...snapshot.board,
      emptyText: lookupMessage(messages, 'repository.board.empty', 'No open tickets in this category.'),
      cards: localizedBoardCards,
      columns: snapshot.board.columns.map((column) => ({
        ...column,
        label: lookupMessage(messages, `repository.board.column.${column.id}`, column.label),
        cards: column.cards.map((card) => localizedCardMap.get(card.key) ?? card)
      }))
    }
  };
}

export async function loadRepositorySnapshot(rootDir, options = {}) {
  const cacheKey = rootDir;
  const cached = snapshotCache.get(cacheKey);
  const fresh = options.fresh === true;

  if (!fresh && cached && (Date.now() - cached.createdAt) < CACHE_TTL_MS) {
    return cached.value;
  }

  if (snapshotBuilds.has(cacheKey)) {
    return snapshotBuilds.get(cacheKey);
  }

  const buildPromise = (async () => {
    const snapshot = await buildRepositorySnapshot(rootDir);
    snapshotCache.set(cacheKey, {
      createdAt: Date.now(),
      value: snapshot
    });
    return snapshot;
  })();

  snapshotBuilds.set(cacheKey, buildPromise);

  try {
    return await buildPromise;
  } finally {
    snapshotBuilds.delete(cacheKey);
  }
}

export { localizeRepositorySnapshot };
export const __repositorySnapshotInternals = {
  createActivitySeries,
  parseCommitImport,
  parseBranchCommits,
  parseAuthorContributionStats,
  parseOpenApiYamlSnapshot
};
