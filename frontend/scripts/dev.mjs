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

  const localePrefixed = urlPath.match(/^\/(de|en|fr)(\/.*)?$/);
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

    const localizedPage = await renderLocalizedPage(rootDir, requestUrl.pathname, locale);
    if (localizedPage) {
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      response.end(localizedPage);
      return;
    }

    const resolved = resolveFilePath(requestUrl.pathname);

    if (!resolved) {
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
