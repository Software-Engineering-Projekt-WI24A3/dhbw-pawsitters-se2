import { createReadStream, existsSync, statSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const port = Number.parseInt(process.env.PORT ?? '4173', 10);
const host = process.env.HOST ?? '127.0.0.1';
const backendOrigin = new URL(process.env.BACKEND_ORIGIN ?? 'http://127.0.0.1:8080');
const BACKEND_PROXY_PATH_PREFIXES = ['/api/', '/actuator/'];
const DEFAULT_LOCALE = 'de';
const SUPPORTED_LOCALES = new Set(['de', 'en', 'ro']);
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade'
]);

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

function resolveLocale(localeValue = '') {
  const normalized = String(localeValue || '').trim().toLowerCase();
  if (SUPPORTED_LOCALES.has(normalized)) {
    return normalized;
  }

  return DEFAULT_LOCALE;
}

function tryResolveFilePath(urlPath) {
  const candidatePath = urlPath === '/'
    ? path.join(rootDir, 'index.html')
    : path.join(rootDir, urlPath.replace(/^\/+/, ''));

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    return candidatePath;
  }

  const nestedIndexPath = path.join(candidatePath, 'index.html');
  if (existsSync(nestedIndexPath) && statSync(nestedIndexPath).isFile()) {
    return nestedIndexPath;
  }

  return null;
}

function isLocalePrefixedPath(urlPath = '') {
  return /^\/(?:de|en|ro)(?:\/|$)/i.test(urlPath);
}

function resolveDynamicPageFallback(urlPath = '') {
  const normalizedPath = String(urlPath || '').trim().replace(/\/+$/, '') || '/';
  const localizedProfileMatch = normalizedPath.match(/^\/(de|en|ro)\/profile\/[^/]+$/i);

  if (localizedProfileMatch?.[1]) {
    return `/${localizedProfileMatch[1].toLowerCase()}/profile`;
  }

  if (/^\/profile\/[^/]+$/i.test(normalizedPath)) {
    return '/profile';
  }

  return '';
}

function resolveFilePath(urlPath, locale = DEFAULT_LOCALE) {
  const normalizedLocale = resolveLocale(locale);
  const dynamicFallbackPath = resolveDynamicPageFallback(urlPath);
  const routeCandidates = [urlPath];

  if (dynamicFallbackPath && !routeCandidates.includes(dynamicFallbackPath)) {
    routeCandidates.push(dynamicFallbackPath);
  }

  const candidates = [];

  for (const routeCandidate of routeCandidates) {
    if (!isLocalePrefixedPath(routeCandidate) && normalizedLocale !== DEFAULT_LOCALE) {
      candidates.push(routeCandidate === '/' ? `/${normalizedLocale}` : `/${normalizedLocale}${routeCandidate}`);
    }
    candidates.push(routeCandidate);
  }

  for (const candidate of [...new Set(candidates)]) {
    const resolved = tryResolveFilePath(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

async function serveFile(response, filePath, statusCode = 200) {
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) {
    throw new Error('not_a_file');
  }

  response.writeHead(statusCode, {
    'Content-Type': contentType(filePath),
    'Cache-Control': 'no-store'
  });
  createReadStream(filePath).pipe(response);
}

function shouldProxyToBackend(pathname) {
  return BACKEND_PROXY_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function buildProxyRequestHeaders(requestHeaders = {}) {
  const headers = {};

  Object.entries(requestHeaders).forEach(([name, value]) => {
    if (value === undefined || HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      return;
    }

    headers[name] = value;
  });

  headers.host = backendOrigin.host;
  if (typeof requestHeaders.host === 'string' && requestHeaders.host.trim()) {
    headers['x-forwarded-host'] = requestHeaders.host;
  }
  headers['x-forwarded-proto'] = 'http';

  return headers;
}

function applyProxyResponseHeaders(response, upstreamHeaders = {}) {
  Object.entries(upstreamHeaders).forEach(([name, value]) => {
    if (value === undefined || HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      return;
    }

    response.setHeader(name, value);
  });
}

async function proxyToBackend(request, response, requestUrl) {
  const upstreamUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, backendOrigin);
  const transport = upstreamUrl.protocol === 'https:' ? https : http;

  await new Promise((resolve) => {
    const upstreamRequest = transport.request(
      upstreamUrl,
      {
        method: request.method ?? 'GET',
        headers: buildProxyRequestHeaders(request.headers)
      },
      (upstreamResponse) => {
        applyProxyResponseHeaders(response, upstreamResponse.headers);
        response.writeHead(upstreamResponse.statusCode ?? 502);
        upstreamResponse.pipe(response);
        upstreamResponse.on('end', resolve);
      }
    );

    upstreamRequest.on('error', (error) => {
      if (!response.headersSent) {
        response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(`${JSON.stringify({
          error: 'backend_proxy_failed',
          message: error.message
        })}\n`);
      }
      resolve();
    });

    request.pipe(upstreamRequest);
  });
}

function main() {
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
      const locale = resolveLocale(requestUrl.searchParams.get('locale'));

      if (requestUrl.pathname === '/api/repository/live.json') {
        const localizedSnapshotPath = path.join(rootDir, 'assets', 'data', `repository-live.${locale}.json`);
        const fallbackSnapshotPath = path.join(rootDir, 'assets', 'data', `repository-live.${DEFAULT_LOCALE}.json`);
        const snapshotPath = existsSync(localizedSnapshotPath) ? localizedSnapshotPath : fallbackSnapshotPath;

        if (existsSync(snapshotPath) && statSync(snapshotPath).isFile()) {
          await serveFile(response, snapshotPath);
          return;
        }

        response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        response.end(`${JSON.stringify({
          error: 'repository_snapshot_missing',
          message: 'Missing repository snapshot file'
        })}\n`);
        return;
      }

      if (requestUrl.pathname === '/api/pets/choices' || requestUrl.pathname === '/api/pets/choices.json') {
        const petChoicesPath = path.join(rootDir, 'assets', 'data', 'pet-choices.json');
        if (existsSync(petChoicesPath) && statSync(petChoicesPath).isFile()) {
          await serveFile(response, petChoicesPath);
          return;
        }
      }

      if (requestUrl.pathname === '/api/locations/countries.json') {
        const countryFlagsPath = path.join(rootDir, 'assets', 'data', 'country-flags.json');
        if (existsSync(countryFlagsPath) && statSync(countryFlagsPath).isFile()) {
          await serveFile(response, countryFlagsPath);
          return;
        }
      }

      if (shouldProxyToBackend(requestUrl.pathname)) {
        await proxyToBackend(request, response, requestUrl);
        return;
      }

      const resolvedPath = resolveFilePath(requestUrl.pathname, locale);

      if (resolvedPath) {
        await serveFile(response, resolvedPath);
        return;
      }

      const notFoundPath = resolveFilePath('/404', locale) || path.join(rootDir, '404.html');
      if (existsSync(notFoundPath) && statSync(notFoundPath).isFile()) {
        await serveFile(response, notFoundPath, 404);
        return;
      }

      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal server error');
    }
  });

  server.listen(port, host, () => {
    console.log(`Pawsitters static server running at http://${host}:${port}/`);
  });
}

main();
