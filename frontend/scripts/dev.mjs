import { spawn } from 'node:child_process';
import { createReadStream, existsSync, statSync, watch } from 'node:fs';
import { promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultLocale, loadLocalizedRepositorySnapshot, renderLocalizedPage, supportedLocales } from './lib/thymeleaf-preview.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const port = Number.parseInt(process.env.PORT ?? '4173', 10);
const host = '127.0.0.1';
const noWatch = process.env.NO_WATCH === '1';
const watchTargets = [
  'src/templates',
  'src/locales',
  'src/js',
  'src/media',
  'scripts/build-site.mjs',
  'scripts/check-thymeleaf.mjs',
  'scripts/lib'
];

let buildTimer = null;
let buildRunning = false;
let buildQueued = false;
const MAX_LOG_ENTRIES = 1400;
const PLAYWRIGHT_STATUS_VALUES = new Set(['idle', 'pending', 'running', 'passed', 'failed', 'skipped']);
const ANSI_PATTERN = /\u001b\[[0-9;]*[A-Za-z]/g;
const E2E_RUNNER = {
  runId: 0,
  running: false,
  startedAt: '',
  finishedAt: '',
  exitCode: null,
  tests: [],
  logs: [],
  child: null
};
let e2eInventoryPromise = null;

function binPath(name) {
  const executable = process.platform === 'win32' ? `${name}.cmd` : name;
  return path.join(rootDir, 'node_modules', '.bin', executable);
}

function runProcess(command, args, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

function runCapture(command, args, options = {}) {
  const cwd = options.cwd ?? rootDir;
  const env = {
    ...process.env,
    ...(options.env ?? {})
  };

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      resolve({
        code: Number.isInteger(code) ? code : 1,
        stdout,
        stderr
      });
    });
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(`${JSON.stringify(payload)}\n`);
}

function parseDurationToMs(rawValue) {
  if (typeof rawValue !== 'string') {
    return 0;
  }

  const match = rawValue.trim().match(/^([\d.]+)\s*(ms|s|m|h)$/i);
  if (!match) {
    return 0;
  }

  const value = Number.parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (unit === 'ms') {
    return Math.round(value);
  }
  if (unit === 's') {
    return Math.round(value * 1000);
  }
  if (unit === 'm') {
    return Math.round(value * 60_000);
  }
  return Math.round(value * 3_600_000);
}

function normalizePathPrefix(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/^tests\//, '');
}

function normalizeOutputLine(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(ANSI_PATTERN, '')
    .replace(/\r/g, '')
    .trimEnd();
}

function parseListedTests(rawOutput) {
  const lines = rawOutput
    .split(/\n/)
    .map((line) => normalizeOutputLine(line))
    .filter(Boolean);
  const tests = [];
  const seen = new Set();

  for (const line of lines) {
    const match = line.match(/^\s*([^:\s][^:]*:\d+:\d+)\s+›\s+(.+)$/);
    if (!match) {
      continue;
    }

    const location = normalizePathPrefix(match[1]);
    const title = match[2].trim();
    const canonical = `${location} › ${title}`;
    if (seen.has(canonical)) {
      continue;
    }

    const name = title.split(' › ').at(-1)?.trim() || title;
    tests.push({
      id: canonical,
      location,
      title,
      name,
      status: 'idle',
      durationMs: 0
    });
    seen.add(canonical);
  }

  return tests;
}

function ensureKnownStatus(value) {
  return PLAYWRIGHT_STATUS_VALUES.has(value) ? value : 'idle';
}

function rebuildE2ESummary() {
  const total = E2E_RUNNER.tests.length;
  const passed = E2E_RUNNER.tests.filter((testCase) => testCase.status === 'passed').length;
  const failed = E2E_RUNNER.tests.filter((testCase) => testCase.status === 'failed').length;
  const running = E2E_RUNNER.running || E2E_RUNNER.tests.some((testCase) => testCase.status === 'running');
  const pending = E2E_RUNNER.tests.filter((testCase) => ['pending', 'running'].includes(testCase.status)).length;

  let status = 'idle';
  if (running) {
    status = 'running';
  } else if (failed > 0) {
    status = 'failed';
  } else if (total > 0 && passed === total) {
    status = 'passed';
  } else if (pending > 0) {
    status = 'pending';
  }

  return {
    total,
    passed,
    failed,
    pending,
    status
  };
}

function runnerSnapshot(from = 0) {
  const safeFrom = Number.isFinite(from) ? Math.max(0, Math.floor(from)) : 0;
  const tests = E2E_RUNNER.tests.map((testCase) => ({
    id: testCase.id,
    location: testCase.location,
    title: testCase.title,
    name: testCase.name,
    status: ensureKnownStatus(testCase.status),
    durationMs: Number.isFinite(testCase.durationMs) ? testCase.durationMs : 0
  }));
  const logs = safeFrom > 0
    ? E2E_RUNNER.logs.slice(safeFrom)
    : [...E2E_RUNNER.logs];

  return {
    runner: {
      runId: E2E_RUNNER.runId,
      running: E2E_RUNNER.running,
      startedAt: E2E_RUNNER.startedAt,
      finishedAt: E2E_RUNNER.finishedAt,
      exitCode: E2E_RUNNER.exitCode
    },
    summary: rebuildE2ESummary(),
    tests,
    logs,
    nextLogIndex: E2E_RUNNER.logs.length
  };
}

async function discoverPlaywrightTests() {
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = await runCapture(npx, ['playwright', 'test', '--list', '--reporter=line']);
  const merged = `${result.stdout}\n${result.stderr}`;
  const discovered = parseListedTests(merged);

  if (discovered.length === 0 && result.code !== 0) {
    throw new Error('Failed to discover Playwright tests.');
  }

  return discovered;
}

async function ensureE2ETestInventory() {
  if (E2E_RUNNER.tests.length > 0 || E2E_RUNNER.running) {
    return;
  }

  if (!e2eInventoryPromise) {
    e2eInventoryPromise = discoverPlaywrightTests()
      .then((tests) => {
        E2E_RUNNER.tests = tests;
      })
      .finally(() => {
        e2eInventoryPromise = null;
      });
  }

  await e2eInventoryPromise;
}

function appendRunnerLog(stream, line) {
  const text = normalizeOutputLine(line);
  if (!text) {
    return;
  }

  const entry = {
    index: E2E_RUNNER.logs.length,
    stream: stream === 'stderr' ? 'stderr' : 'stdout',
    text,
    time: new Date().toISOString()
  };
  E2E_RUNNER.logs.push(entry);
  if (E2E_RUNNER.logs.length > MAX_LOG_ENTRIES) {
    E2E_RUNNER.logs = E2E_RUNNER.logs.slice(E2E_RUNNER.logs.length - MAX_LOG_ENTRIES);
    E2E_RUNNER.logs.forEach((logEntry, index) => {
      logEntry.index = index;
    });
  }

  const progress = text.match(/^\s*\[\d+\/(\d+)]\s+(?:\[[^\]]+]\s+›\s+)?(.+)$/);
  if (progress) {
    const canonical = normalizePathPrefix(progress[2]);
    const testCase = E2E_RUNNER.tests.find((entryTest) => normalizePathPrefix(entryTest.id) === canonical);
    if (testCase && ['idle', 'pending'].includes(testCase.status)) {
      testCase.status = 'running';
    }
  }

  const result = text.match(/^\s*([✓✔✘xX-])\s+\d+\s+(?:\[[^\]]+]\s+›\s+)?(.+?)\s+\(([\d.\s]+(?:ms|s|m|h))\)\s*$/i);
  if (!result) {
    return;
  }

  const symbol = result[1];
  const canonical = normalizePathPrefix(result[2]);
  const durationMs = parseDurationToMs(result[3]);
  const target = E2E_RUNNER.tests.find((entryTest) => normalizePathPrefix(entryTest.id) === canonical);

  if (!target) {
    const fallbackName = canonical.split(' › ').at(-1)?.trim() || canonical;
    E2E_RUNNER.tests.push({
      id: canonical,
      location: canonical.split(' › ')[0] || '',
      title: canonical.split(' › ').slice(1).join(' › '),
      name: fallbackName,
      status: 'pending',
      durationMs: 0
    });
  }

  const resolved = E2E_RUNNER.tests.find((entryTest) => normalizePathPrefix(entryTest.id) === canonical);
  if (!resolved) {
    return;
  }

  resolved.durationMs = durationMs;

  if (symbol === '✓' || symbol === '✔') {
    resolved.status = 'passed';
    return;
  }

  if (symbol === '-') {
    resolved.status = 'skipped';
    return;
  }

  resolved.status = 'failed';
}

function wireRunnerStream(stream, streamName) {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString().replace(/\r/g, '\n');
    let nextBreak = buffer.indexOf('\n');
    while (nextBreak !== -1) {
      const line = buffer.slice(0, nextBreak);
      buffer = buffer.slice(nextBreak + 1);
      appendRunnerLog(streamName, line);
      nextBreak = buffer.indexOf('\n');
    }
  });

  stream.on('end', () => {
    if (!buffer) {
      return;
    }
    appendRunnerLog(streamName, buffer);
    buffer = '';
  });
}

async function runE2ETestSuite() {
  if (E2E_RUNNER.running) {
    return runnerSnapshot(0);
  }

  await ensureE2ETestInventory();

  E2E_RUNNER.runId += 1;
  E2E_RUNNER.running = true;
  E2E_RUNNER.startedAt = new Date().toISOString();
  E2E_RUNNER.finishedAt = '';
  E2E_RUNNER.exitCode = null;
  E2E_RUNNER.logs = [];
  E2E_RUNNER.tests = E2E_RUNNER.tests.map((testCase) => ({
    ...testCase,
    status: 'pending',
    durationMs: 0
  }));
  appendRunnerLog('stdout', 'Starting Playwright E2E run with reporter=list');

  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(npx, ['playwright', 'test', '--reporter=list'], {
    cwd: rootDir,
    env: {
      ...process.env
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  E2E_RUNNER.child = child;
  wireRunnerStream(child.stdout, 'stdout');
  wireRunnerStream(child.stderr, 'stderr');

  child.on('close', (code) => {
    E2E_RUNNER.running = false;
    E2E_RUNNER.finishedAt = new Date().toISOString();
    E2E_RUNNER.exitCode = Number.isInteger(code) ? code : 1;

    if (E2E_RUNNER.exitCode !== 0) {
      E2E_RUNNER.tests = E2E_RUNNER.tests.map((testCase) => {
        if (['pending', 'running'].includes(testCase.status)) {
          return {
            ...testCase,
            status: 'failed'
          };
        }
        return testCase;
      });
    } else {
      E2E_RUNNER.tests = E2E_RUNNER.tests.map((testCase) => {
        if (testCase.status === 'running') {
          return {
            ...testCase,
            status: 'passed'
          };
        }
        if (testCase.status === 'pending') {
          return {
            ...testCase,
            status: 'skipped'
          };
        }
        return testCase;
      });
    }

    E2E_RUNNER.child = null;
  });

  child.on('error', (error) => {
    appendRunnerLog('stderr', `Runner error: ${error.message}`);
    E2E_RUNNER.running = false;
    E2E_RUNNER.finishedAt = new Date().toISOString();
    E2E_RUNNER.exitCode = 1;
    E2E_RUNNER.child = null;
  });

  return runnerSnapshot(0);
}

async function buildSite() {
  if (buildRunning) {
    buildQueued = true;
    return;
  }

  buildRunning = true;

  try {
    await runProcess(process.execPath, ['./scripts/build-site.mjs'], 'site build');
  } finally {
    buildRunning = false;
  }

  if (buildQueued) {
    buildQueued = false;
    await buildSite();
  }
}

function queueBuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(() => {
    buildSite().catch((error) => {
      console.error(error.message);
    });
  }, 120);
}

function startFileWatchers() {
  return watchTargets.map((target) => watch(path.join(rootDir, target), { recursive: true }, () => {
    queueBuild();
  }));
}

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const map = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon'
  };

  return map[extension] ?? 'application/octet-stream';
}

function resolveFilePath(urlPath) {
  if (urlPath === '/git' || urlPath === '/git/') {
    return { redirect: '/repository/git' };
  }

  if (urlPath === '/kanban' || urlPath === '/kanban/') {
    return { redirect: '/repository/kanban' };
  }

  if (urlPath === '/playwright' || urlPath === '/playwright/') {
    return { redirect: '/repository/playwright' };
  }

  const localePrefixed = urlPath.match(/^\/(de|en|ro)(\/.*)?$/);
  if (localePrefixed) {
    const locale = localePrefixed[1];
    const subPath = localePrefixed[2] || '/';
    return { redirect: `${subPath}?locale=${locale}` };
  }

  if (urlPath === '/index.html') {
    return { filePath: path.join(rootDir, 'index.html') };
  }

  const sanitized = urlPath.replace(/^\/+/, '');
  const directPath = path.join(rootDir, sanitized);

  if (existsSync(directPath) && statSync(directPath).isFile()) {
    return { filePath: directPath };
  }

  if (existsSync(path.join(directPath, 'index.html'))) {
    return { filePath: path.join(directPath, 'index.html') };
  }

  return null;
}

async function serveFile(response, filePath) {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentType(filePath),
      'Cache-Control': 'no-store'
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}

async function serveRepositorySnapshot(requestUrl, response) {
  const requestedLocale = requestUrl.searchParams.get('locale') ?? defaultLocale;
  const locale = supportedLocales.includes(requestedLocale) ? requestedLocale : defaultLocale;
  const forceFresh = requestUrl.searchParams.get('refresh') === '1';

  try {
    const snapshot = await loadLocalizedRepositorySnapshot(rootDir, locale, { fresh: forceFresh });
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    response.end(`${JSON.stringify(snapshot)}\n`);
  } catch (error) {
    response.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    response.end(`${JSON.stringify({
      error: 'repository_snapshot_failed',
      message: error.message
    })}\n`);
  }
}

async function main() {
  await runProcess(binPath('tailwindcss'), [
    '-c',
    'tailwind.config.js',
    '-i',
    './src/tailwind/site.css',
    '-o',
    './assets/css/site.css',
    '--minify'
  ], 'tailwind build');

  await buildSite();

  const tailwindWatcher = noWatch
    ? null
    : spawn(binPath('tailwindcss'), [
      '-c',
      'tailwind.config.js',
      '-i',
      './src/tailwind/site.css',
      '-o',
      './assets/css/site.css',
      '--watch'
    ], {
      cwd: rootDir,
      stdio: 'inherit'
    });

  const watchers = noWatch ? [] : startFileWatchers();

  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
    const localeFromQuery = requestUrl.searchParams.get('locale') ?? defaultLocale;
    const locale = supportedLocales.includes(localeFromQuery) ? localeFromQuery : defaultLocale;

    if (requestUrl.pathname === '/api/repository/live.json') {
      await serveRepositorySnapshot(requestUrl, response);
      return;
    }

    if (requestUrl.pathname === '/api/tests/e2e/status.json') {
      if (request.method !== 'GET') {
        sendJson(response, 405, {
          error: 'method_not_allowed',
          message: 'Only GET is supported for /api/tests/e2e/status.json'
        });
        return;
      }

      try {
        await ensureE2ETestInventory();
        const from = Number.parseInt(requestUrl.searchParams.get('from') ?? '0', 10);
        sendJson(response, 200, runnerSnapshot(Number.isFinite(from) ? from : 0));
      } catch (error) {
        sendJson(response, 500, {
          error: 'e2e_status_failed',
          message: error.message
        });
      }
      return;
    }

    if (requestUrl.pathname === '/api/tests/e2e/run') {
      if (request.method !== 'POST') {
        sendJson(response, 405, {
          error: 'method_not_allowed',
          message: 'Only POST is supported for /api/tests/e2e/run'
        });
        return;
      }

      try {
        const snapshot = await runE2ETestSuite();
        sendJson(response, E2E_RUNNER.running ? 202 : 200, snapshot);
      } catch (error) {
        sendJson(response, 500, {
          error: 'e2e_run_failed',
          message: error.message
        });
      }
      return;
    }

    const localizedPage = await renderLocalizedPage(rootDir, requestUrl.pathname, locale);
    if (localizedPage) {
      const isNotFoundRoute = requestUrl.pathname === '/404' || requestUrl.pathname === '/404.html';
      response.writeHead(isNotFoundRoute ? 404 : 200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      response.end(localizedPage);
      return;
    }

    const resolved = resolveFilePath(requestUrl.pathname);

    if (!resolved) {
      const notFoundPage = await renderLocalizedPage(rootDir, '/404', locale);
      if (notFoundPage) {
        response.writeHead(404, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        response.end(notFoundPage);
        return;
      }

      response.writeHead(404);
      response.end('Not found');
      return;
    }

    if (resolved.redirect) {
      response.writeHead(302, { Location: resolved.redirect });
      response.end();
      return;
    }

    await serveFile(response, resolved.filePath);
  });

  let cleanedUp = false;
  const cleanup = (exitCode = 0) => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;
    clearTimeout(buildTimer);
    server.close();
    tailwindWatcher?.kill('SIGTERM');
    E2E_RUNNER.child?.kill('SIGTERM');
    for (const watcher of watchers) {
      watcher.close();
    }
    process.exit(exitCode);
  };

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the active dev server or run with PORT=${port + 1} npm run dev.`);
      cleanup(1);
      return;
    }

    console.error(error.message);
    cleanup(1);
  });

  server.listen(port, host, () => {
    console.log(`Pawsitters frontend dev server running at http://${host}:${port}/de${noWatch ? ' (watch disabled)' : ''}`);
  });

  process.on('SIGINT', () => cleanup(0));
  process.on('SIGTERM', () => cleanup(0));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
