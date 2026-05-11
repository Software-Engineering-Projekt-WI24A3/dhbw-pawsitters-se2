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

function resolveFilePath(urlPath) {
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

      if (shouldProxyToBackend(requestUrl.pathname)) {
        await proxyToBackend(request, response, requestUrl);
        return;
      }

      const resolvedPath = resolveFilePath(requestUrl.pathname);

      if (resolvedPath) {
        await serveFile(response, resolvedPath);
        return;
      }

      const notFoundPath = path.join(rootDir, '404.html');
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
