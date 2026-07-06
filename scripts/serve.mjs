// Enkel lokal statisk server for dist/ — kun for forhåndsvisning (node scripts/serve.mjs).
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = process.env.PORT || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

async function resolve(p) {
  try { if ((await stat(p)).isDirectory()) return join(p, 'index.html'); return p; }
  catch { return null; }
}

createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = await resolve(join(DIST, url));
  if (!file) file = await resolve(join(DIST, url, 'index.html'));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1>');
  }
}).listen(PORT, () => console.log(`Forhåndsvisning: http://localhost:${PORT}`));
