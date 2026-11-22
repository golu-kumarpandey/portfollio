const http = require('http');
const fs = require('fs');
const path = require('path');
const handler = require('./chat');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1].startsWith('#') || process.env[match[1]]) return;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  });
}

const port = process.env.PORT || 8787;
http.createServer((request, response) => handler(request, response)).listen(port, () => console.log(`Ask Golu API listening on http://localhost:${port}`));
