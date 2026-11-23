import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EXERCISE_ASSETS_VERSION,
  EXERCISE_CATALOG,
  EXERCISE_VARIANTS,
  getExerciseCatalogApprovalSummary,
  validateExerciseCatalog
} from '../../src/exercise/catalog.js';

const expectedMetadata = {
  bench_flat: ['displayed_load', 'barbell', 'per_set', 1, 2],
  db_incline: ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  lat_raise_stand: ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  tri_rope: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  leg_press: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  lat_pulldown_wide: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  row_v: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  rear_delt: ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  biceps_preacher: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  leg_curl: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  db_bench: ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  db_fly: ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  front_raise: ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  lat_raise_seated: ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  tri_machine: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  lat_pulldown_neutral: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  row_straight: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  chest_machine: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  pec_deck: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  shoulder_press: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  lat_raise_cable: ['displayed_load', 'single_side', 'per_side', 1, 1],
  face_pull: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  row_machine: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  hammer_curl: ['per_dumbbell', 'alternating', 'per_side', 2, 2],
  cable_curl: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  tri_overhead: ['per_dumbbell', 'bilateral_single_implement', 'per_set', 1, 2],
  leg_extension: ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  smith_squat: ['displayed_load', 'barbell', 'per_set', 1, 2],
  pullup: ['additional_weight', 'bodyweight', 'per_set', 1, 2],
  dips: ['additional_weight', 'bodyweight', 'per_set', 1, 2],
  pushup: ['additional_weight', 'bodyweight', 'per_set', 1, 2]
};

const expectedVariantMetadata = {
  'leg_press/high_feet': ['displayed_load', 'machine_or_cable', 'per_set', 1, 2],
  'db_fly/incline': ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  'shoulder_press/dumbbells': ['per_dumbbell', 'simultaneous', 'per_set', 2, 2],
  'tri_overhead/rope': ['displayed_load', 'machine_or_cable', 'per_set', 1, 2]
};

const metadataTuple = metadata => [
  metadata.loadUnit,
  metadata.executionMode,
  metadata.repsUnit,
  metadata.implementCount,
  metadata.trainedSides
];

describe('GV-IMG-META exercise catalog', () => {
  it('contains the exact 31 stable exercise IDs from the legacy catalog and the master specification', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    const legacyCatalog = html.match(/const CATALOG_BASE = \{([\s\S]*?)\n\};/)?.[1];
    expect(legacyCatalog).toBeTruthy();
    const legacyIds = [...legacyCatalog.matchAll(/^\s*([a-z0-9_]+):/gm)].map(match => match[1]).sort();
    expect(EXERCISE_CATALOG.map(exercise => exercise.id).sort()).toEqual(Object.keys(expectedMetadata).sort());
    expect(EXERCISE_CATALOG.map(exercise => exercise.id).sort()).toEqual(legacyIds);
  });

  it('preserves the existing statistical group for every exercise', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    const legacyGroups = html.match(/const GROUP_BASE = \{([\s\S]*?)\n\};/)?.[1];
    expect(legacyGroups).toBeTruthy();
    const expectedGroups = Object.fromEntries([...legacyGroups.matchAll(/([a-z0-9_]+):\s*'([^']+)'/g)].map(match => [match[1], match[2]]));
    expect(Object.fromEntries(EXERCISE_CATALOG.map(exercise => [exercise.id, exercise.group]))).toEqual(expectedGroups);
  });

  it('matches every normative load and execution field in master §3.4', () => {
    const actual = Object.fromEntries(EXERCISE_CATALOG.map(exercise => [exercise.id, metadataTuple(exercise.metadata)]));
    expect(actual).toEqual(expectedMetadata);
  });

  it('contains exactly the four master variants with their correct base relationships and metadata', () => {
    const actual = Object.fromEntries(EXERCISE_VARIANTS.map(variant => [
      `${variant.exerciseId}/${variant.variantId}`,
      { base: variant.exerciseId, metadata: metadataTuple(variant.metadata) }
    ]));
    const expected = Object.fromEntries(Object.entries(expectedVariantMetadata).map(([key, metadata]) => [
      key,
      { base: key.split('/')[0], metadata }
    ]));
    expect(actual).toEqual(expected);
  });

  it('is structurally complete and records explicit provenance and pending reasons', () => {
    expect(EXERCISE_ASSETS_VERSION).toBe(1);
    expect(validateExerciseCatalog(EXERCISE_CATALOG, EXERCISE_VARIANTS)).toEqual({ valid: true, errors: [] });
    for (const record of [...EXERCISE_CATALOG, ...EXERCISE_VARIANTS]) {
      expect(record.provenance.status).toBe('approved');
      expect(record.provenance.masterVersion).toBe('2.8');
      expect(record.provenance.references.length).toBeGreaterThan(0);
      for (const field of ['techniqueInstructions', 'commonMistakes', 'imageManifest']) {
        expect(record[field].status).toBe('pending');
        expect(record[field].reason.trim().length).toBeGreaterThan(0);
      }
      expect(record.approval.status).toBe('partial');
      expect(record.approval.pendingFields).toEqual(['techniqueInstructions', 'commonMistakes', 'imageManifest']);
      expect(record.imageManifest.expectedViews).toEqual(['technique', 'muscles', 'thumbnail']);
      expect(record.imageManifest.assets).toEqual([]);
    }
    expect(getExerciseCatalogApprovalSummary(EXERCISE_CATALOG, EXERCISE_VARIANTS)).toMatchObject({
      baseCount: 31,
      variantCount: 4,
      structurallyValid: true,
      approvedExecutionMetadata: 35,
      approvedAnatomyRecords: 31,
      recordsWithPendingFields: 35,
      fullyApprovedRecords: 0,
      pendingTechniqueInstructions: 35,
      pendingCommonMistakes: 35,
      pendingImageManifests: 35
    });
  });

  it('rejects invalid metadata, missing provenance and variants with unknown base exercises', () => {
    const invalidCatalog = structuredClone(EXERCISE_CATALOG);
    invalidCatalog[0].metadata.loadUnit = 'unknown';
    invalidCatalog[1].provenance.references = [];
    invalidCatalog[2].imageManifest.expectedViews = ['technique', 'random', 'thumbnail'];
    invalidCatalog[3].approval.pendingFields = ['techniqueInstructions'];
    const invalidVariants = structuredClone(EXERCISE_VARIANTS);
    invalidVariants[0].exerciseId = 'not_a_catalog_exercise';
    const result = validateExerciseCatalog(invalidCatalog, invalidVariants);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('bench_flat:LOAD_UNIT_INVALID');
    expect(result.errors).toContain('db_incline:PROVENANCE_INVALID');
    expect(result.errors).toContain('lat_raise_stand:IMAGE:IMAGE_VIEWS_INVALID');
    expect(result.errors).toContain('tri_rope:APPROVAL_STATUS_INVALID');
    expect(result.errors).toContain('not_a_catalog_exercise/high_feet:BASE_EXERCISE_UNKNOWN');
  });

  it('uses the mandated tri_machine display name and keeps the existing image mapping untouched', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    const triMachine = EXERCISE_CATALOG.find(exercise => exercise.id === 'tri_machine');
    expect(triMachine.name).toBe('Prostowanie przedramion na maszynie do tricepsa');
    expect(html).toContain("tri_machine: 'Prostowanie przedramion na maszynie do tricepsa'");
    expect(html).toContain("tri_machine: 'p2_5'");
  });
});
