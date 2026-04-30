import { createReadStream, existsSync, statSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const port = Number.parseInt(process.env.PORT ?? '4173', 10);
const host = process.env.HOST ?? '127.0.0.1';

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

function main() {
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', `http://${host}:${port}`);
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
