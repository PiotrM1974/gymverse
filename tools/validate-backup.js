#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { inspectLegacySnapshot, previewBackupV5 } from '../src/gv-data.js';

const filename = process.argv[2];
if (!filename) {
  process.stderr.write('Użycie: node tools/validate-backup.js <lokalny-plik-json-lub-zip-v5>\n');
  process.exitCode = 64;
} else {
  try {
    const info = await stat(filename);
    if (!info.isFile() || info.size <= 0 || info.size > 50 * 1024 * 1024) throw new Error('FILE_SIZE_INVALID');
    let result;
    if (/\.zip$/i.test(filename)) {
      const preview = await previewBackupV5(new Blob([await readFile(filename)], { type: 'application/zip' }));
      result = { ok: true, version: preview.version, sha256: preview.sha256, counts: preview.counts, schemaKeys: preview.schemaKeys, anomalies: [], mediaFileCount: preview.media.length };
    } else {
      const raw = await readFile(filename, 'utf8');
      let snapshot;
      try { snapshot = JSON.parse(raw); }
      catch {
        process.stdout.write(`${JSON.stringify({ ok: false, anomalies: ['JSON_PARSE_ERROR'] })}\n`);
        process.exitCode = 2;
      }
      if (snapshot !== undefined) result = await inspectLegacySnapshot(snapshot);
    }
    if (result) {
      process.stdout.write(`${JSON.stringify(result)}\n`);
      if (!result.ok) process.exitCode = 2;
    }
  } catch {
    process.stdout.write(`${JSON.stringify({ ok: false, anomalies: ['BACKUP_VALIDATION_ERROR'] })}\n`);
    process.exitCode = 2;
  }
}
