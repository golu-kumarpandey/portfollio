const http = require('http');
const fs = require('fs');
const path = require('path');
const handler = require('./chat');

const projectRoot = path.join(__dirname, '..');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function servePortfolioFile(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET, HEAD');
    return response.end('Only GET requests are supported for the portfolio.');
  }

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.statusCode = 400;
    return response.end('Invalid URL.');
  }

  const relativePath = requestedPath === '/'
    ? 'index.html'
    : requestedPath.replace(/^\/+/, '');
  if (
    relativePath.startsWith('api/') ||
    relativePath.startsWith('.') ||
    relativePath.includes('/.')
  ) {
    response.statusCode = 404;
    return response.end('Not found.');
  }

  const filePath = path.resolve(projectRoot, relativePath);
  if (filePath !== projectRoot && !filePath.startsWith(`${projectRoot}${path.sep}`)) {
    response.statusCode = 403;
    return response.end('Forbidden.');
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.statusCode = 404;
      return response.end('Not found.');
    }
    response.setHeader(
      'Content-Type',
      contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    );
    if (request.method === 'HEAD') return response.end();
    fs.createReadStream(filePath).on('error', () => {
      if (!response.headersSent) response.statusCode = 500;
      response.end('Unable to read file.');
    }).pipe(response);
  });
}

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith('#') || process.env[match[1]]) return;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  });
}

const port = process.env.PORT || 8787;
http.createServer((request, response) => {
  const requestPath = new URL(request.url, 'http://localhost').pathname;
  if (requestPath === '/api/chat') return handler(request, response);
  return servePortfolioFile(request, response);
}).listen(port, () => console.log(`Ask Golu app listening on http://localhost:${port}`));
