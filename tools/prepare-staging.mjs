import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const destination = resolve(root, 'outputs/GV-STAGE11B-STAGING/site-release');
try {
  await stat(destination);
  throw new Error(`Refusing to overwrite existing staging package: ${destination}`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

await mkdir(destination, { recursive: true });
for (const file of ['index.html', 'sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) {
  await cp(resolve(root, file), resolve(destination, file));
}
for (const directory of ['src', 'img']) await cp(resolve(root, directory), resolve(destination, directory), { recursive: true });

const manifestPath = resolve(destination, 'manifest.webmanifest');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.name = 'GymNastika TEST';
manifest.short_name = 'GYM TEST';
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const htmlPath = resolve(destination, 'index.html');
let html = await readFile(htmlPath, 'utf8');
html = html.replace('<title>GymNastika</title>', '<title>GymNastika TEST</title>')
  .replace('<meta name="apple-mobile-web-app-title" content="GymNastika">', '<meta name="apple-mobile-web-app-title" content="Gym TEST">')
  .replace('GYM<span>NASTIKA</span></button>', 'GYM<span>NASTIKA</span><span class="staging-test-badge">TEST</span></button>')
  .replace('</head>', '<style>.staging-test-badge{display:inline-flex;align-items:center;margin-left:7px;padding:2px 6px;border-radius:999px;background:#b42318;color:#fff;font:700 10px/1.2 Manrope,system-ui,sans-serif;letter-spacing:.06em;vertical-align:middle}</style>\n</head>');
if (!html.includes('staging-test-badge') || !html.includes('GymNastika TEST')) throw new Error('Could not apply visible TEST marking to staging copy');
await writeFile(htmlPath, html);

const swPath = resolve(destination, 'sw.js');
let sw = await readFile(swPath, 'utf8');
if (!sw.includes("'gymverse-v55'")) throw new Error('Expected production cache version was not found');
sw = sw.replaceAll("'gymverse-v55'", "'gymnastika-staging-test-v1'");
await writeFile(swPath, sw);

const registry = JSON.parse(await readFile(resolve(destination, 'src/data/exercise-presentations/release-registry.json'), 'utf8'));
const serviceWorker = await readFile(resolve(destination, 'sw.js'), 'utf8');
const shellMatch = serviceWorker.match(/const BASE_SHELL = \[(.*?)\];/s);
if (!shellMatch) throw new Error('Service Worker shell list is missing');
const shellAssets = [...shellMatch[1].matchAll(/'([^']+)'/g)].map(match => match[1]).filter(path => path !== './');
for (const asset of shellAssets) await stat(resolve(destination, asset));
const missing = [];
const integrityErrors = [];
for (const record of registry.records) for (const sex of ['male', 'female']) for (const kind of ['technique', 'thumbnail']) {
  const asset = record.bySex[sex][kind];
  const file = resolve(destination, asset.path);
  try {
    const bytes = await readFile(file);
    if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) integrityErrors.push(asset.path);
  } catch { missing.push(asset.path); }
}
if (missing.length || integrityErrors.length) throw new Error(`Staging asset validation failed; missing=${missing.length}, hashMismatch=${integrityErrors.length}`);
for (const icon of manifest.icons) await stat(resolve(destination, icon.src));
for (const font of ['src/ui/fonts/manrope-latin-variable.woff2', 'src/ui/fonts/manrope-latin-ext-variable.woff2', 'src/ui/fonts/OFL.txt']) await stat(resolve(destination, font));
for (const atlasAsset of ['src/data/anatomy/bodies/male-front.webp', 'src/data/anatomy/bodies/male-back.webp', 'src/data/anatomy/bodies/female-front.webp', 'src/data/anatomy/bodies/female-back.webp']) await stat(resolve(destination, atlasAsset));
const readme = `GymNastika 2.0 — TEST staging package\n\nThis package is a local copy for a future manual upload to the ROOT of a dedicated HTTPS origin. Do not upload to the production host or a subpath of its origin.\n\nThe PWA branding and service-worker cache are isolated for TEST. Use synthetic training data only. Installing this app creates a separate browser storage origin from production only when hosted on a separate hostname/origin.\n\nNo deployment has been performed. Files inside this folder are the upload payload; the parent folder is only the package container.\n`;
await writeFile(resolve(destination, 'STAGING-README.txt'), readme);
if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(html + serviceWorker)) throw new Error('Staging copy unexpectedly depends on Google Fonts');

const files = [];
async function walk(dir) {
  const { readdir } = await import('node:fs/promises');
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else files.push(full.slice(destination.length + 1).split(sep).join('/'));
  }
}
await walk(destination);
console.log(JSON.stringify({ destination, fileCount: files.length, releasedImageCount: registry.records.length * 4, integrityValidated: true, manifestScope: manifest.scope, serviceWorkerCache: 'gymnastika-staging-test-v1', files: files.length }, null, 2));
