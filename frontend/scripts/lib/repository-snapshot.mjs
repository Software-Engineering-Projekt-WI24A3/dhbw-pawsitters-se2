import { execFile } from 'node:child_process';
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

function parseRemote(remoteUrl = '') {
  const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/i);
  if (!match) {
    throw new Error('Could not determine GitHub repository from git remote.');
  }

  return {
    owner: match[1],
    repo: match[2]
  };
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

async function fetchGithubUserSafe(login, workspaceRoot) {
  try {
    return await runJsonRequired('gh', ['api', `users/${login}`], workspaceRoot, `GitHub user API (${login})`);
  } catch (error) {
    const notFound = String(error?.stderr || '').includes('Not Found')
      || String(error?.stdout || '').includes('"Not Found"');
    if (notFound) {
      return { login };
    }
    throw error;
  }
}

async function fetchGithubIdentityByCommitEmail(owner, repo, authorEmail, workspaceRoot) {
  const email = normalizeWhitespace(authorEmail);
  if (!email) {
    return null;
  }

  try {
    const commits = await runJsonRequired(
      'gh',
      ['api', `repos/${owner}/${repo}/commits?author=${encodeURIComponent(email)}&per_page=1`],
      workspaceRoot,
      `GitHub commits API (${email})`
    );

    const commit = Array.isArray(commits) ? commits[0] : null;
    const user = commit?.author;
    if (!user?.login) {
      return null;
    }

    return {
      login: user.login,
      name: user.login,
      email,
      avatarUrl: user.avatar_url || user.avatarUrl || '',
      profileUrl: user.html_url || user.profileUrl || `https://github.com/${user.login}`
    };
  } catch {
    return null;
  }
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
  const labels = issue.labels.map((label) => normalizeWhitespace(label.name ?? label)).join(' ');
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

  const maxCount = Math.max(...entries.map((entry) => entry.count), 0);

  return entries.map((entry) => {
    let height = 0;
    if (entry.count > 0 && maxCount > 0) {
      height = Math.max(10, Math.round((entry.count / maxCount) * 100));
    }

    return {
      ...entry,
      style: `--bar-size:${height}%;`,
      height
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
  const contributors = await runJsonRequired(
    'gh',
    ['api', `repos/${owner}/${repo}/contributors?per_page=100`],
    workspaceRoot,
    'GitHub contributors API'
  );

  const logins = new Set([
    ...contributors.map((user) => user.login),
    ...issues.flatMap((issue) => [
      issue.user?.login,
      ...issue.assignees.map((assignee) => assignee.login)
    ])
  ].filter(Boolean));

  const userDetails = await Promise.all([...logins].map(async (login) => {
    const user = await fetchGithubUserSafe(login, workspaceRoot);
    return buildIdentityFromUser(user ?? { login });
  }));

  return userDetails.filter(Boolean);
}

async function resolveAuthorIdentity(authorName, authorEmail, identityIndex, workspaceRoot) {
  const aliasCandidates = [
    authorEmail,
    authorEmail.match(/\+([^@]+)@users\.noreply\.github\.com$/i)?.[1]
  ].filter(Boolean);

  for (const candidate of aliasCandidates) {
    const identity = identityIndex.get(normalizeIdentityKey(candidate));
    if (identity) {
      return identity;
    }
  }

  const normalizedAuthorName = normalizeIdentityKey(authorName);
  if (normalizedAuthorName) {
    const directLoginMatch = identityIndex.get(normalizedAuthorName);
    if (directLoginMatch && normalizeIdentityKey(directLoginMatch.login) === normalizedAuthorName) {
      return directLoginMatch;
    }
  }

  return null;
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
  const issues = await runJsonRequired(
    'gh',
    ['api', `repos/${owner}/${repo}/issues?state=open&per_page=100`],
    workspaceRoot,
    'GitHub issues API'
  );
  const rawIssues = issues.filter((issue) => !issue.pull_request);
  const githubUsers = await fetchGithubUsers(owner, repo, rawIssues, workspaceRoot);
  const identityIndex = new Map();

  githubUsers.forEach((identity) => indexIdentity(identityIndex, identity));

  const authorStats = parseAuthorContributionStats(authorContributionLog);
  const commitEmails = [...new Set(authorStats
    .map((author) => normalizeWhitespace(author.authorEmail))
    .filter(Boolean))];
  const commitEmailIdentities = await Promise.all(commitEmails.map((email) => {
    return fetchGithubIdentityByCommitEmail(owner, repo, email, workspaceRoot);
  }));
  commitEmailIdentities
    .filter(Boolean)
    .forEach((identity) => indexIdentity(identityIndex, identity));

  await Promise.all(authorStats.map(async (author) => {
    const identity = await resolveAuthorIdentity(author.authorName, author.authorEmail, identityIndex, workspaceRoot);
    indexIdentity(identityIndex, identity);
  }));

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
  const defaultBranch = pickDefaultBranch(branchList, currentBranch);
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
  addRef(headRefs, headHash, 'HEAD');
  addRef(headRefs, headHash, currentBranch || defaultBranch || 'HEAD');
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
    branch: currentBranch || defaultBranch,
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

  return {
    remoteUrl,
    repository: {
      owner,
      name: repo,
      label: `${owner}/${repo}`
    },
    branch: currentBranch || defaultBranch,
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
      labels: issue.labels.map((label) => normalizeWhitespace(label.name ?? label)).filter(Boolean),
      hasLabels: issue.labels.length > 0,
      assignees: issue.assignees.map((assignee) => {
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
      assigneeCount: issue.assignees.length,
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
    }))
    .filter((column) => column.cards.length > 0);

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
  const workspaceRoot = path.resolve(rootDir, '..');
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

  return {
    generatedAt: new Date().toISOString(),
    repository: gitSnapshot.repository,
    git: Object.fromEntries(
      Object.entries(gitSnapshot).filter(([key]) => !key.startsWith('__'))
    ),
    board
  };
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
  parseCommitImport,
  parseBranchCommits,
  parseAuthorContributionStats
};
