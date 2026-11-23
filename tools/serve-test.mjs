import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(resolve(fileURLToPath(new URL('..', import.meta.url))));
const port = Number(process.env.PORT || 41739);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    const decoded = decodeURIComponent(url.pathname);
    const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
    const candidate = await realpath(resolve(root, relative));
    if (candidate !== root && !candidate.startsWith(root + sep)) throw new Error('outside root');
    if (!(await stat(candidate)).isFile()) throw new Error('not a file');
    res.writeHead(200, { 'content-type': types[extname(candidate)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(candidate));
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
