import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import manifest from '../src/exercise/image-manifest.json' with { type: 'json' };
import {
  IMAGE_VIEW_NAMES,
  verifyImageManifestFiles
} from './image-manifest-validator.mjs';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const isInsideRoot = path => {
  const relation = relative(root, path);
  return relation === '' || (!relation.startsWith(`..${sep}`) && relation !== '..' && !isAbsolute(relation));
};

const result = await verifyImageManifestFiles(manifest, async relativePath => {
  const candidate = resolve(root, relativePath);
  if (!isInsideRoot(candidate)) throw new Error('Asset path escapes repository root');
  const actualPath = await realpath(candidate);
  if (!isInsideRoot(actualPath)) throw new Error('Asset symlink escapes repository root');
  return readFile(actualPath);
});

const pendingViews = manifest.records.reduce((count, record) => count + IMAGE_VIEW_NAMES.filter(view => record.views[view].status === 'pending').length, 0);
console.log(`Compositions: ${manifest.records.length}`);
console.log(`Pending views: ${pendingViews}`);
for (const warning of result.warnings) console.warn(`WARNING ${warning}`);
for (const error of result.errors) console.error(`ERROR ${error}`);
if (!result.valid) process.exitCode = 1;
else console.log('Manifest validation: PASS');
