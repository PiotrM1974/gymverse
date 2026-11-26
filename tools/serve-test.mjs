import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(fileURLToPath(new URL('..', import.meta.url))));
const port = Number(process.env.PORT || 41739);
const mount = '/gymverse';
const inputSnapshots = resolve(root, 'tests/fixtures/exercise-presentation-pilot/snapshots/input');
let release = process.env.PRESENTATION_RELEASE || 'production';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/__pilot/release' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const value = JSON.parse(body || '{}');
      if (!['input', 'pilot', 'pilot-fail', 'production'].includes(value.release)) {
        res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: 'release invalid' })); return;
      }
      release = value.release;
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      res.end(JSON.stringify({ release })); return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
    const decoded = decodeURIComponent(url.pathname);
    if (decoded === mount) { res.writeHead(308, { location: `${mount}/${url.search}` }); res.end(); return; }
    const mounted = decoded.startsWith(`${mount}/`);
    const relative = (mounted ? decoded.slice(mount.length + 1) : decoded.replace(/^\/+/, '')) || 'index.html';
    if (mounted && release === 'pilot-fail' && relative === 'src/data/exercise-images/selected/technique/lat_raise_stand__default-male.webp') {
      res.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-pilot-release': release });
      res.end('synthetic required candidate asset failure'); return;
    }
    let candidate;
    if (mounted && release === 'input' && ['index.html', 'sw.js'].includes(relative)) candidate = resolve(inputSnapshots, relative);
    else if (mounted && release === 'input' && relative === 'src/features/anatomy/atlas.js') candidate = resolve(inputSnapshots, 'atlas.js');
    else if (mounted && release === 'input' && relative === 'src/features/anatomy/atlas.css') candidate = resolve(inputSnapshots, 'atlas.css');
    else candidate = resolve(root, relative);
    candidate = await realpath(candidate);
    if (candidate !== root && !candidate.startsWith(root + sep)) throw new Error('outside root');
    if (!(await stat(candidate)).isFile()) throw new Error('not a file');
    const headers = { 'content-type': types[extname(candidate)] || 'application/octet-stream', 'cache-control': 'no-store', ...(mounted ? { 'x-pilot-release': release } : {}) };
    res.writeHead(200, headers);
    if (req.method === 'HEAD') res.end(); else res.end(await readFile(candidate));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
await new Promise((resolveListen, rejectListen) => {
  server.once('error', rejectListen);
  server.listen(port, '127.0.0.1', resolveListen);
});
console.log(`Test server listening at http://127.0.0.1:${port} (root: ${root})`);
