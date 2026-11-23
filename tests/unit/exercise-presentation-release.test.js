import { describe, expect, it } from 'vitest';
import releaseRegistry from '../../src/data/exercise-presentations/release-registry.json' with { type: 'json' };
import {
  EXERCISE_PRESENTATION_RELEASE_VERSION,
  resolveExercisePresentation,
  validateExercisePresentationRegistry
} from '../../src/exercise/presentation-contract.js';

const activeAssetPaths = new Set(releaseRegistry.records.flatMap(record =>
  Object.values(record.bySex).flatMap(views => Object.values(views).map(asset => asset.path))));

describe('public exercise presentation release', () => {
  it('binds all owner-accepted records to the released app asset directory', () => {
    expect(releaseRegistry.presentationContractVersion).toBe(EXERCISE_PRESENTATION_RELEASE_VERSION);
    expect(releaseRegistry.status).toBe('released');
    expect(releaseRegistry.records).toHaveLength(34);
    expect(activeAssetPaths.size).toBe(136);
    expect([...activeAssetPaths].every(path => path.startsWith('src/data/exercise-images/selected/'))).toBe(true);
    expect(validateExercisePresentationRegistry(releaseRegistry, { availableAssets: activeAssetPaths })).toEqual({ valid: true, errors: [] });
  });

  it('keeps the triceps and preacher panel order and the preacher lower-position thumbnail', () => {
    const tri = releaseRegistry.records.find(record => record.exerciseId === 'tri_machine');
    const biceps = releaseRegistry.records.find(record => record.exerciseId === 'biceps_preacher');
    expect(tri.labels).toEqual({ lower: 'START', raised: 'KONIEC' });
    expect(biceps.labels).toEqual({ lower: 'DÓŁ', raised: 'GÓRA' });
    expect(biceps.copy.thumbnail).toContain('DÓŁ');
    expect(biceps.ownerSelection.sourceSha256BySex).toEqual(tri.ownerSelection.sourceSha256BySex);
    expect(biceps.ownerSelection.panelReordered).toBe(true);
    expect(tri.ownerSelection.panelReordered).toBe(false);
    expect(biceps.bySex.male.technique.path).toContain('/biceps_preacher__default-male.webp');
    expect(biceps.bySex.male.thumbnail.path).toContain('/biceps_preacher__default-male.webp');
  });

  it('resolves the high-foot leg press to the approved base image without changing its variant ID', () => {
    const presentation = resolveExercisePresentation({ registry: releaseRegistry, exerciseId: 'leg_press', variantId: 'high_feet', sex: 'female', enabled: true });
    expect(presentation).toMatchObject({ status: 'released', exerciseId: 'leg_press', variantId: 'high_feet', sharedBaseImage: true, sex: 'female' });
    expect(presentation.technique.path).toContain('leg_press__default-female.webp');
  });

  it('does not mark image publication as expert technique review or assign a blanket license', () => {
    expect(releaseRegistry.publicationApproval.approvedOn).toBe('2026-11-23');
    expect(releaseRegistry.publicationApproval.rightsAndTechnicalReview).toContain('does not assert expert review');
    expect(releaseRegistry.records.every(record => Object.values(record.bySex).every(views =>
      Object.values(views).every(asset => asset.status === 'local-candidate')))).toBe(true);
    expect(JSON.stringify(releaseRegistry)).not.toContain('EXPERT_REVIEWED');
  });
});
