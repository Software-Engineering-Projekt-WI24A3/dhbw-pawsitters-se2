import { createReadStream, existsSync, statSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultLocale, loadLocalizedRepositorySnapshot, renderLocalizedPage, supportedLocales } from './lib/thymeleaf-preview.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const port = Number.parseInt(process.env.PORT ?? '4173', 10);
const host = process.env.HOST ?? '127.0.0.1';
const backendOrigin = new URL(process.env.BACKEND_ORIGIN ?? 'http://127.0.0.1:8080');
const BACKEND_PROXY_PATH_PREFIXES = ['/api/', '/actuator/'];
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
  if (supportedLocales.includes(normalized)) {
    return normalized;
  }

  return defaultLocale;
}

function tryResolveFilePath(urlPath) {
  const candidatePath = urlPath === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, urlPath.replace(/^\/+/, ''));

  if (existsSync(candidatePath) && statSync(candidatePath).isFile()) {
    return candidatePath;
  }

  const nestedIndexPath = path.join(candidatePath, 'index.html');
  if (existsSync(nestedIndexPath) && statSync(nestedIndexPath).isFile()) {
    return nestedIndexPath;
  }

  return null;
}

function resolveLocalePrefixedRedirect(requestUrl) {
  const localePrefixed = String(requestUrl?.pathname || '').match(/^\/(de|en|ro)(\/.*)?$/i);
  if (!localePrefixed) {
    return '';
  }

  const locale = localePrefixed[1].toLowerCase();
  const subPath = localePrefixed[2] || '/';
  const redirectUrl = new URL(subPath, `http://${host}:${port}`);
  requestUrl.searchParams.forEach((value, key) => {
    if (String(key).toLowerCase() === 'locale') {
      return;
    }
    redirectUrl.searchParams.append(key, value);
  });
  redirectUrl.searchParams.set('locale', locale);
  return `${redirectUrl.pathname}${redirectUrl.search}`;
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

  const dynamicFallbackPath = resolveDynamicPageFallback(urlPath);
  const routeCandidates = [urlPath];

  if (dynamicFallbackPath && !routeCandidates.includes(dynamicFallbackPath)) {
    routeCandidates.push(dynamicFallbackPath);
  }

  for (const candidate of [...new Set(routeCandidates)]) {
    const resolved = tryResolveFilePath(candidate);
    if (resolved) {
      return { filePath: resolved };
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

function firstHeaderValue(headerValue) {
  if (Array.isArray(headerValue)) {
    return headerValue[0] ?? '';
  }

  return typeof headerValue === 'string' ? headerValue : '';
}

function parseForwardedProto(forwardedHeaderValue = '') {
  const firstEntry = firstHeaderValue(forwardedHeaderValue).split(',')[0]?.trim() || '';
  if (!firstEntry) {
    return '';
  }

  const parameters = firstEntry.split(';');
  for (const parameter of parameters) {
    const [key = '', rawValue = ''] = parameter.split('=', 2);
    if (key.trim().toLowerCase() !== 'proto') {
      continue;
    }

    const unquotedValue = rawValue.trim().replace(/^"(.+)"$/, '$1').trim();
    return unquotedValue.toLowerCase();
  }

  return '';
}

function resolveForwardedProto(request) {
  const requestHeaders = request?.headers ?? {};
  const forwardedProtoHeader = firstHeaderValue(requestHeaders['x-forwarded-proto']);
  const forwardedProtoFromHeader = forwardedProtoHeader.split(',')[0]?.trim().toLowerCase() || '';
  if (forwardedProtoFromHeader === 'https' || forwardedProtoFromHeader === 'http') {
    return forwardedProtoFromHeader;
  }

  const forwardedHeaderProto = parseForwardedProto(requestHeaders.forwarded);
  if (forwardedHeaderProto === 'https' || forwardedHeaderProto === 'http') {
    return forwardedHeaderProto;
  }

  return request?.socket?.encrypted ? 'https' : 'http';
}

function buildProxyRequestHeaders(request) {
  const requestHeaders = request?.headers ?? {};
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
  headers['x-forwarded-proto'] = resolveForwardedProto(request);

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
        headers: buildProxyRequestHeaders(request)
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

function main() {
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
      const locale = resolveLocale(requestUrl.searchParams.get('locale'));

      if (requestUrl.pathname === '/api/repository/live.json') {
        await serveRepositorySnapshot(requestUrl, response);
        return;
      }

      if (requestUrl.pathname === '/api/pets/choices' || requestUrl.pathname === '/api/pets/choices.json') {
        const petChoicesPath = path.join(distDir, 'assets', 'data', 'pet-choices.json');
        if (existsSync(petChoicesPath) && statSync(petChoicesPath).isFile()) {
          await serveFile(response, petChoicesPath);
          return;
        }
      }

      if (requestUrl.pathname === '/api/locations/countries.json') {
        const countryFlagsPath = path.join(distDir, 'assets', 'data', 'country-flags.json');
        if (existsSync(countryFlagsPath) && statSync(countryFlagsPath).isFile()) {
          await serveFile(response, countryFlagsPath);
          return;
        }
      }

      if (shouldProxyToBackend(requestUrl.pathname)) {
        await proxyToBackend(request, response, requestUrl);
        return;
      }

      const localePrefixedRedirect = resolveLocalePrefixedRedirect(requestUrl);
      if (localePrefixedRedirect) {
        response.writeHead(302, { Location: localePrefixedRedirect });
        response.end();
        return;
      }

      const dynamicFallbackPath = resolveDynamicPageFallback(requestUrl.pathname);
      const localizedPage = await renderLocalizedPage(rootDir, requestUrl.pathname, locale)
        ?? (
          dynamicFallbackPath && dynamicFallbackPath !== requestUrl.pathname
            ? await renderLocalizedPage(rootDir, dynamicFallbackPath, locale)
            : null
        );
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
      if (resolved?.redirect) {
        response.writeHead(302, { Location: resolved.redirect });
        response.end();
        return;
      }

      if (resolved?.filePath) {
        await serveFile(response, resolved.filePath);
        return;
      }

      const notFoundPage = await renderLocalizedPage(rootDir, '/404', locale);
      if (notFoundPage) {
        response.writeHead(404, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        });
        response.end(notFoundPage);
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
    console.log(`Pawsitters server running at http://${host}:${port}/`);
  });
}

main();
