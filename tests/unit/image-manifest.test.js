import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EXERCISE_IMAGE_MANIFEST,
  IMAGE_REVIEWED_CATALOG_FIELDS,
  getCatalogImageFingerprint,
  validateImageManifest,
  verifyImageManifestFiles
} from '../../tools/image-manifest-validator.mjs';
import { EXERCISE_CATALOG, EXERCISE_VARIANTS } from '../../src/exercise/catalog.js';

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function syntheticWebp(width = 768, height = 768) {
  const bytes = Buffer.alloc(30);
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WEBP', 8, 'ascii');
  bytes.write('VP8X', 12, 'ascii');
  bytes.writeUInt32LE(10, 16);
  bytes.writeUIntLE(width - 1, 24, 3);
  bytes.writeUIntLE(height - 1, 27, 3);
  return bytes;
}

function draftWithTechniqueAsset(bytes = syntheticWebp()) {
  const manifest = structuredClone(EXERCISE_IMAGE_MANIFEST);
  const record = manifest.records.find(item => item.exerciseId === 'db_bench');
  record.status = 'draft';
  record.views.technique = {
    status: 'draft',
    path: 'img/exercises/technique/db_bench__default.webp',
    mimeType: 'image/webp',
    width: 768,
    height: 768,
    sizeBytes: bytes.length,
    sha256: sha256(bytes),
    altText: 'Wyciskanie hantli na ławce płaskiej — technika wykonania',
    derivedFrom: null,
    origin: { kind: 'generated', reference: 'brief:db_bench:r1', tool: 'synthetic-test', createdAt: '2026-11-20T12:00:00.000Z' },
    reason: null
  };
  return manifest;
}

describe('GV-IMG-META image manifest contract', () => {
  it('declares schema and asset versions separately and includes all 35 catalog compositions as pending', () => {
    const schema = JSON.parse(readFileSync(new URL('../../src/exercise/image-manifest.schema.json', import.meta.url), 'utf8'));
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.properties.exerciseAssetsVersion.const).toBe(1);
    expect(schema.properties.manifestSchemaVersion.const).toBe(1);
    expect(EXERCISE_IMAGE_MANIFEST.records).toHaveLength(35);

    const expected = [
      ...EXERCISE_CATALOG.map(item => `${item.id}/default`),
      ...EXERCISE_VARIANTS.map(item => `${item.exerciseId}/${item.variantId}`)
    ].sort();
    const actual = EXERCISE_IMAGE_MANIFEST.records.map(item => `${item.exerciseId}/${item.variantId}`).sort();
    expect(actual).toEqual(expected);
    expect(EXERCISE_IMAGE_MANIFEST.records.every(item => item.status === 'pending')).toBe(true);
    const triMachine = EXERCISE_IMAGE_MANIFEST.records.find(item => item.exerciseId === 'tri_machine');
    const bicepsPreacher = EXERCISE_IMAGE_MANIFEST.records.find(item => item.exerciseId === 'biceps_preacher');
    expect(triMachine.exerciseId).not.toBe(bicepsPreacher.exerciseId);
    expect(triMachine.provenance.ownerClarificationIds).toContain('owner-clarification:2026-11-20:tri-machine-dual-function');
    expect(bicepsPreacher.provenance.ownerClarificationIds).toContain('owner-clarification:2026-11-20:tri-machine-dual-function');
  });

  it('accepts the image-free pending manifest without fictitious paths or checksums', () => {
    const result = validateImageManifest(EXERCISE_IMAGE_MANIFEST);
    expect(result).toEqual({ valid: true, errors: [], warnings: [] });
    for (const record of EXERCISE_IMAGE_MANIFEST.records) {
      expect(record.imageReadiness.status).toBe('pending');
      expect(record.ownerApproval.status).toBe('pending');
      for (const view of Object.values(record.views)) {
        expect(view.status).toBe('pending');
        expect(view.path).toBeNull();
        expect(view.sha256).toBeNull();
      }
    }
  });

  it('rejects missing, duplicate, unknown, or incorrectly related composition IDs', () => {
    const manifest = structuredClone(EXERCISE_IMAGE_MANIFEST);
    manifest.records.pop();
    manifest.records.push(structuredClone(manifest.records[0]));
    manifest.records[1] = { ...structuredClone(manifest.records[1]), exerciseId: 'unknown_exercise' };
    const result = validateImageManifest(manifest);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('COMPOSITION_SET_MISMATCH');
    expect(result.errors).toContain('bench_flat/default:COMPOSITION_ID_DUPLICATE');
    expect(result.errors).toContain('unknown_exercise/default:COMPOSITION_REFERENCE_UNKNOWN');
  });

  it('requires provenance to match the catalog source and registered owner clarifications', () => {
    const manifest = structuredClone(EXERCISE_IMAGE_MANIFEST);
    const record = manifest.records.find(item => item.exerciseId === 'db_bench');
    record.provenance.references = ['§4.2:db_bench'];
    record.provenance.ownerClarificationIds = ['owner-clarification:invented'];
    const result = validateImageManifest(manifest);
    expect(result.errors).toContain('db_bench/default:PROVENANCE_REFERENCE_MISMATCH');
    expect(result.errors).toContain('db_bench/default:OWNER_CLARIFICATION_UNKNOWN');
  });

  it('rejects traversal, absolute URLs, and paths that do not match the record and view', () => {
    const unsafe = structuredClone(EXERCISE_IMAGE_MANIFEST);
    const record = unsafe.records.find(item => item.exerciseId === 'db_bench');
    record.status = 'draft';
    record.views.technique = { ...record.views.technique, status: 'draft', path: '../outside.webp' };
    expect(validateImageManifest(unsafe).errors).toContain('db_bench/default/technique:PATH_INVALID');

    const external = structuredClone(EXERCISE_IMAGE_MANIFEST);
    const target = external.records.find(item => item.exerciseId === 'db_bench');
    target.status = 'draft';
    target.views.technique = { ...target.views.technique, status: 'draft', path: 'https://example.test/db_bench.webp' };
    expect(validateImageManifest(external).errors).toContain('db_bench/default/technique:PATH_INVALID');

    const mismatched = draftWithTechniqueAsset();
    mismatched.records.find(item => item.exerciseId === 'db_bench').views.technique.path = 'img/exercises/technique/pullup__default.webp';
    expect(validateImageManifest(mismatched).errors).toContain('db_bench/default/technique:PATH_INVALID');
  });

  it('rejects contradictory composition and view statuses', () => {
    const manifest = structuredClone(EXERCISE_IMAGE_MANIFEST);
    const record = manifest.records.find(item => item.exerciseId === 'db_bench');
    record.status = 'approved';
    expect(validateImageManifest(manifest).errors).toContain('db_bench/default:STATUS_CONTRADICTION');
  });

  it('does not allow approval without reviewed illustration metadata and owner approval of this revision', () => {
    const manifest = draftWithTechniqueAsset();
    const record = manifest.records.find(item => item.exerciseId === 'db_bench');
    record.status = 'approved';
    for (const view of Object.values(record.views)) view.status = 'approved';
    expect(validateImageManifest(manifest).errors).toContain('db_bench/default:STATUS_CONTRADICTION');

    record.imageReadiness = {
      status: 'approved',
      reviewedFields: [...IMAGE_REVIEWED_CATALOG_FIELDS],
      catalogFingerprint: 'a'.repeat(64),
      reviewer: 'owner',
      reviewedAt: '2026-11-20T12:00:00.000Z'
    };
    record.ownerApproval = {
      status: 'approved',
      revision: record.revision,
      reviewer: 'owner',
      decidedAt: '2026-11-20T12:01:00.000Z',
      decisionId: 'owner-decision:synthetic-1',
      reason: null
    };
    expect(validateImageManifest(manifest).errors).toContain('db_bench/default/muscles:ASSET_FIELDS_INCOMPLETE');
  });

  it('can approve the image composition while technique text and common mistakes remain pending', () => {
    const manifest = structuredClone(EXERCISE_IMAGE_MANIFEST);
    const record = manifest.records.find(item => item.exerciseId === 'db_bench');
    record.status = 'approved';
    const exercise = EXERCISE_CATALOG.find(item => item.id === 'db_bench');
    record.imageReadiness = {
      status: 'approved',
      reviewedFields: [...IMAGE_REVIEWED_CATALOG_FIELDS],
      catalogFingerprint: getCatalogImageFingerprint(exercise),
      reviewer: 'owner',
      reviewedAt: '2026-11-20T12:00:00.000Z'
    };
    for (const viewName of ['technique', 'muscles', 'thumbnail']) {
      const view = record.views[viewName];
      const width = viewName === 'thumbnail' ? 256 : 768;
      view.status = 'approved';
      view.path = `img/exercises/${viewName === 'thumbnail' ? 'thumbnails' : viewName}/db_bench__default.webp`;
      view.mimeType = 'image/webp';
      view.width = width;
      view.height = width;
      view.sizeBytes = 100;
      view.sha256 = 'a'.repeat(64);
      view.altText = `Wyciskanie hantli na ławce płaskiej — ${viewName}`;
      view.origin = {
        kind: viewName === 'technique' ? 'generated' : 'derived',
        reference: `brief:db_bench:r${record.revision}`,
        tool: 'reviewed-image-tool',
        createdAt: '2026-11-20T12:00:00.000Z'
      };
      view.reason = null;
    }
    record.ownerApproval = {
      status: 'approved',
      revision: record.revision,
      reviewer: 'owner',
      decidedAt: '2026-11-20T12:01:00.000Z',
      decisionId: 'owner-decision:synthetic-1',
      reason: null
    };

    expect(exercise.techniqueInstructions.status).toBe('pending');
    expect(exercise.commonMistakes.status).toBe('pending');
    expect(validateImageManifest(manifest).errors).toEqual([]);
    record.ownerApproval.revision += 1;
    expect(validateImageManifest(manifest).errors).toContain('db_bench/default:OWNER_APPROVAL_REVISION_MISMATCH');
  });

  it('checks WebP signature, actual dimensions, byte length, and SHA-256 when bytes are available', async () => {
    const bytes = syntheticWebp();
    const manifest = draftWithTechniqueAsset(bytes);
    const result = await verifyImageManifestFiles(manifest, async path => path.endsWith('db_bench__default.webp') ? bytes : null);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    const tampered = draftWithTechniqueAsset(bytes);
    tampered.records.find(item => item.exerciseId === 'db_bench').views.technique.sha256 = '0'.repeat(64);
    const failed = await verifyImageManifestFiles(tampered, async () => bytes);
    expect(failed.valid).toBe(false);
    expect(failed.errors).toContain('db_bench/default/technique:SHA256_MISMATCH');

    const wrongDimensions = draftWithTechniqueAsset(bytes);
    wrongDimensions.records.find(item => item.exerciseId === 'db_bench').views.technique.width = 767;
    const dimensionFailure = await verifyImageManifestFiles(wrongDimensions, async () => bytes);
    expect(dimensionFailure.errors).toContain('db_bench/default/technique:FILE_DIMENSIONS_MISMATCH');

    const missing = await verifyImageManifestFiles(draftWithTechniqueAsset(bytes), async () => null);
    expect(missing.errors).toContain('db_bench/default/technique:ASSET_MISSING');
  });

  it('reports optimization target overruns as warnings rather than rejecting quality', () => {
    const manifest = draftWithTechniqueAsset(Buffer.alloc(220_000, 1));
    const result = validateImageManifest(manifest);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('db_bench/default/technique:OPTIMIZATION_TARGET_EXCEEDED');
  });
});
