import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(fileURLToPath(new URL('..', import.meta.url))));
const port = Number(process.env.PORT || 41981);
const mount = '/gymverse';
const inputSnapshots = resolve(root, 'tests/fixtures/exercise-presentation-pilot/snapshots/input');
let release = process.env.PRESENTATION_RELEASE || 'production';
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml'
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/__pilot/release' && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      const value = JSON.parse(body || '{}');
      if (!['input', 'pilot', 'pilot-fail', 'production'].includes(value.release)) {
        response.writeHead(400, { 'content-type': 'application/json' }); response.end(JSON.stringify({ error: 'release invalid' })); return;
      }
      release = value.release;
      response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ release })); return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
    if (url.pathname === mount) { response.writeHead(308, { location: `${mount}/${url.search}` }); response.end(); return; }
    if (!url.pathname.startsWith(`${mount}/`)) { response.writeHead(404); response.end('Not found'); return; }
    const relative = decodeURIComponent(url.pathname.slice(mount.length + 1)) || 'index.html';
    if (release === 'pilot-fail' && relative === 'src/data/exercise-images/selected/technique/lat_raise_stand__default-male.webp') {
      response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-pilot-release': release });
      response.end('synthetic required candidate asset failure'); return;
    }
    let candidate;
    if (release === 'input' && ['index.html', 'sw.js'].includes(relative)) candidate = resolve(inputSnapshots, relative);
    else if (release === 'input' && relative === 'src/features/anatomy/atlas.js') candidate = resolve(inputSnapshots, 'atlas.js');
    else if (release === 'input' && relative === 'src/features/anatomy/atlas.css') candidate = resolve(inputSnapshots, 'atlas.css');
    else candidate = resolve(root, relative);
    candidate = await realpath(candidate);
    if (candidate !== root && !candidate.startsWith(root + sep) && !candidate.startsWith(inputSnapshots + sep)) throw new Error('outside root');
    if (!(await stat(candidate)).isFile()) throw new Error('not a file');
    const headers = { 'content-type': contentTypes[extname(candidate)] || 'application/octet-stream', 'cache-control': 'no-store', 'x-pilot-release': release };
    response.writeHead(200, headers);
    if (request.method === 'HEAD') response.end(); else response.end(await readFile(candidate));
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
    response.end('Not found');
  }
});

await new Promise((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', resolveListen);
});
console.log(`Presentation pilot test server listening at http://127.0.0.1:${port}${mount}/ (release: ${release})`);
