import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import presentationRegistry from '../../src/data/exercise-presentations/release-registry.json' with { type: 'json' };
import {
  EXERCISE_PRESENTATION_CONTRACT_VERSION,
  isLocalPresentationPilotEnabled,
  resolveExercisePresentation,
  validateExercisePresentationRegistry
} from '../../src/exercise/presentation-contract.js';
import { EXERCISE_IMAGE_MANIFEST, validateImageManifest } from '../../tools/image-manifest-validator.mjs';

const asset = (sex, kind) => ({
  path: `outputs/GV-LAT-RAISE-MALE-FEMALE/selected/${kind === 'technique' ? 'technique' : 'thumbnails'}/lat_raise_stand__default-${sex}.webp`,
  mimeType: 'image/webp',
  width: kind === 'technique' ? 768 : 256,
  height: kind === 'technique' ? 512 : 256,
  sizeBytes: 512,
  sha256: 'a'.repeat(64),
  altText: kind === 'technique'
    ? `${sex === 'male' ? 'Męska' : 'Żeńska'} plansza unoszenia hantli bokiem, DÓŁ po lewej i GÓRA po prawej`
    : `Miniatura ${sex === 'male' ? 'męskiej' : 'żeńskiej'} sylwetki w pozycji DÓŁ`,
  status: 'local-candidate'
});

function registry(overrides = {}) {
  return {
    presentationContractVersion: 1,
    status: 'local-candidate',
    records: [{
      exerciseId: 'lat_raise_stand',
      variantId: 'default',
      status: 'local-candidate',
      positions: { lower: 'left', raised: 'right' },
      bySex: {
        male: { technique: asset('male', 'technique'), thumbnail: asset('male', 'thumbnail') },
        female: { technique: asset('female', 'technique'), thumbnail: asset('female', 'thumbnail') }
      },
      musclePresentation: { kind: 'atlas', exerciseId: 'lat_raise_stand' }
    }],
    ...overrides
  };
}

describe('versioned exercise presentation contract', () => {
  it('preserves the legacy v1 image-manifest reader and the unchanged exercise set', () => {
    expect(EXERCISE_PRESENTATION_CONTRACT_VERSION).toBe(1);
    expect(validateImageManifest(EXERCISE_IMAGE_MANIFEST).valid).toBe(true);
    expect(EXERCISE_IMAGE_MANIFEST.records).toHaveLength(35);
    expect(EXERCISE_IMAGE_MANIFEST.records.some(record => record.exerciseId === 'lat_raise_stand' && record.variantId === 'default')).toBe(true);
  });

  it('accepts a local candidate with two sex presentations and a separate atlas descriptor', () => {
    const result = validateExercisePresentationRegistry(registry());
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('keeps the checked-in release registry complete without depending on local pilot artifacts', () => {
    expect(presentationRegistry.presentationContractVersion).toBe(2);
    expect(validateExercisePresentationRegistry(presentationRegistry).valid).toBe(true);
    expect(presentationRegistry.status).toBe('released');
    expect(presentationRegistry.records[0].status).toBe('released');
    expect(presentationRegistry.records[0].musclePresentation).toEqual({ kind: 'atlas', exerciseId: 'lat_raise_stand' });
    expect(presentationRegistry.records.map(record => `${record.exerciseId}/${record.variantId}`)).toEqual([
      'lat_raise_stand/default', 'db_bench/default', 'lat_pulldown_wide/default', 'leg_press/default',
      'bench_flat/default', 'db_incline/default', 'tri_rope/default', 'row_v/default', 'rear_delt/default',
      'biceps_preacher/default', 'leg_curl/default', 'lat_pulldown_neutral/default', 'row_straight/default',
      'db_fly/default', 'db_fly/incline', 'front_raise/default', 'lat_raise_seated/default', 'chest_machine/default',
      'pec_deck/default', 'shoulder_press/default', 'shoulder_press/dumbbells', 'face_pull/default',
      'lat_raise_cable/default', 'hammer_curl/default', 'cable_curl/default', 'tri_overhead/default',
      'row_machine/default', 'leg_extension/default', 'tri_overhead/rope', 'smith_squat/default',
      'pullup/default', 'dips/default', 'pushup/default', 'tri_machine/default'
    ]);
  });

  it('resolves six new boards, six thumbnails, and only the explicit leg press sharing rule', () => {
    for (const exerciseId of ['db_bench', 'lat_pulldown_wide', 'leg_press']) {
      for (const sex of ['male', 'female']) {
        const resolved = resolveExercisePresentation({ registry: presentationRegistry, exerciseId, sex, enabled: true });
        expect(resolved.status).toBe('released');
        for (const kind of ['technique', 'thumbnail']) {
          const asset = resolved[kind];
          const bytes = readFileSync(new URL(`../../${asset.path}`, import.meta.url));
          expect(bytes.length).toBe(asset.sizeBytes);
          expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
          expect(asset.path).toContain(`${exerciseId}__default-${sex}.webp`);
        }
      }
    }
    const highFeet = resolveExercisePresentation({ registry: presentationRegistry, exerciseId: 'leg_press', variantId: 'high_feet', sex: 'female', enabled: true });
    const base = resolveExercisePresentation({ registry: presentationRegistry, exerciseId: 'leg_press', variantId: 'default', sex: 'female', enabled: true });
    expect(highFeet).toMatchObject({ status: 'released', variantId: 'high_feet', sharedBaseImage: true });
    expect(highFeet.technique.path).toBe(base.technique.path);
    expect(highFeet.thumbnail.path).toBe(base.thumbnail.path);
    expect(resolveExercisePresentation({ registry: presentationRegistry, exerciseId: 'leg_press', variantId: 'unknown', enabled: true }).status).toBe('legacy');
  });

  it('keeps recorded owner source hashes identical for biceps and triceps while retaining separate exercise records', () => {
    const biceps = presentationRegistry.records.find(record => record.exerciseId === 'biceps_preacher');
    const triceps = presentationRegistry.records.find(record => record.exerciseId === 'tri_machine');
    expect(biceps.labels).toEqual({ lower: 'DÓŁ', raised: 'GÓRA' });
    expect(triceps.labels).toEqual({ lower: 'START', raised: 'KONIEC' });
    for (const sex of ['male', 'female']) {
      expect(biceps.ownerSelection.sourceSha256BySex[sex]).toBe(triceps.ownerSelection.sourceSha256BySex[sex]);
      const bicepsView = resolveExercisePresentation({ registry: presentationRegistry, exerciseId: 'biceps_preacher', sex, enabled: true });
      const tricepsView = resolveExercisePresentation({ registry: presentationRegistry, exerciseId: 'tri_machine', sex, enabled: true });
      expect(bicepsView.exerciseId).toBe('biceps_preacher');
      expect(tricepsView.exerciseId).toBe('tri_machine');
      expect(bicepsView.technique.path).not.toBe(tricepsView.technique.path);
      expect(bicepsView.technique.sha256).not.toBe(tricepsView.technique.sha256);
    }
  });

  it('rejects unsupported versions, unknown sex keys, and unknown muscle presentation types', () => {
    expect(validateExercisePresentationRegistry(registry({ presentationContractVersion: 99 })).errors).toContain('PRESENTATION_VERSION_UNSUPPORTED');
    const unknownSex = registry();
    unknownSex.records[0].bySex.other = unknownSex.records[0].bySex.male;
    expect(validateExercisePresentationRegistry(unknownSex).errors).toContain('PRESENTATION_SEX_INVALID');
    const unknownKind = registry();
    unknownKind.records[0].musclePresentation.kind = 'overlay';
    expect(validateExercisePresentationRegistry(unknownKind).errors).toContain('MUSCLE_PRESENTATION_KIND_INVALID');
  });

  it('rejects a cross-exercise atlas reference and a missing candidate asset', () => {
    const wrongAtlas = registry();
    wrongAtlas.records[0].musclePresentation.exerciseId = 'db_bench';
    expect(validateExercisePresentationRegistry(wrongAtlas).errors).toContain('ATLAS_EXERCISE_MISMATCH');
    const withMissing = registry();
    const available = new Set([
      withMissing.records[0].bySex.male.technique.path,
      withMissing.records[0].bySex.male.thumbnail.path,
      withMissing.records[0].bySex.female.thumbnail.path
    ]);
    expect(validateExercisePresentationRegistry(withMissing, { availableAssets: available }).errors).toContain('ASSET_PATH_MISSING');
  });

  it('resolves only an exact exercise, base variant, and selected sex without image fallback', () => {
    const data = registry();
    const female = resolveExercisePresentation({ registry: data, exerciseId: 'lat_raise_stand', variantId: 'default', sex: 'female', enabled: true });
    expect(female.status).toBe('local-candidate');
    expect(female.technique.path).toContain('__default-female.webp');
    expect(female.thumbnail.path).toContain('__default-female.webp');
    expect(female.musclePresentation).toEqual({ kind: 'atlas', exerciseId: 'lat_raise_stand' });
    expect(resolveExercisePresentation({ registry: data, exerciseId: 'lat_raise_stand', variantId: 'incline', sex: 'female', enabled: true }).status).toBe('legacy');
    expect(resolveExercisePresentation({ registry: data, exerciseId: 'front_raise', variantId: 'default', sex: 'female', enabled: true }).status).toBe('legacy');
  });

  it('returns controlled errors for an invalid selected sex or broken candidate registry', () => {
    expect(resolveExercisePresentation({ registry: registry(), exerciseId: 'lat_raise_stand', variantId: 'default', sex: 'other', enabled: true })).toMatchObject({ status: 'error', code: 'PRESENTATION_SEX_INVALID' });
    expect(resolveExercisePresentation({ registry: registry({ presentationContractVersion: 99 }), exerciseId: 'lat_raise_stand', variantId: 'default', sex: 'male', enabled: true })).toMatchObject({ status: 'error', code: 'PRESENTATION_REGISTRY_INVALID' });
  });

  it('keeps candidate assets inactive outside an explicit loopback pilot URL', () => {
    const query = '?local-exercise-presentation-pilot=1';
    expect(isLocalPresentationPilotEnabled({ hostname: '127.0.0.1', search: query })).toBe(true);
    expect(isLocalPresentationPilotEnabled({ hostname: 'localhost', search: query })).toBe(true);
    expect(isLocalPresentationPilotEnabled({ hostname: 'piotrm1974.github.io', search: query })).toBe(false);
    expect(isLocalPresentationPilotEnabled({ hostname: '127.0.0.1', search: '' })).toBe(false);
  });
});
