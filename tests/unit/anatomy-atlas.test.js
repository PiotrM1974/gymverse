import { describe, expect, it } from 'vitest';
import { EXERCISE_ATLAS_MAP, getHighlightedMuscleIds } from '../../src/data/anatomy/atlas-data.js';
import { MUSCLEMAP_DIAGRAMS } from '../../src/data/anatomy/musclemap-diagrams.js';

describe('MuscleMap exercise atlas data', () => {
  it('covers all catalog exercises and variants while retaining the four pilot IDs', () => {
    expect(Object.keys(EXERCISE_ATLAS_MAP)).toHaveLength(35);
    for (const id of ['db_bench', 'lat_pulldown_wide', 'lat_raise_stand', 'leg_press']) expect(EXERCISE_ATLAS_MAP[id]).toBeDefined();
    for (const mapping of Object.values(EXERCISE_ATLAS_MAP)) {
      expect(mapping.primary.length).toBeGreaterThan(0);
      expect(Array.isArray(mapping.secondary)).toBe(true);
    }
  });

  it('resolves every highlighted region against all four diagrams', () => {
    const ids = new Set(MUSCLEMAP_DIAGRAMS.flatMap(diagram => diagram.muscles.map(muscle => muscle.id)));
    for (const exerciseId of Object.keys(EXERCISE_ATLAS_MAP)) {
      for (const id of getHighlightedMuscleIds(exerciseId)) expect(ids.has(id), `${exerciseId}: ${id}`).toBe(true);
    }
  });

  it('keeps primary and secondary regions distinct', () => {
    const map = EXERCISE_ATLAS_MAP.lat_pulldown_wide;
    expect(map.primary).toContain('LATISSIMUS_LEFT');
    expect(map.primary).toContain('LATISSIMUS_RIGHT');
    expect(map.secondary).toContain('BICEPS_LEFT');
    expect(map.secondary).toContain('BICEPS_RIGHT');
  });

  it('declares exact, approximate and unavailable coverage without inventing surfaces', () => {
    expect(EXERCISE_ATLAS_MAP.lat_raise_stand.approximate).toContain('SHOULDER_SIDE_LEFT');
    expect(EXERCISE_ATLAS_MAP.lat_raise_stand.exact).toContain('TRAPEZIUS_LEFT');
    expect(EXERCISE_ATLAS_MAP.lat_raise_stand.unavailable).toContain('Nadgrzebieniowy');
    expect(EXERCISE_ATLAS_MAP.db_bench.approximate).toContain('CHEST_LEFT');
    expect(EXERCISE_ATLAS_MAP.db_bench.exact).toContain('TRICEPS_LEFT');
    expect(EXERCISE_ATLAS_MAP.lat_pulldown_wide.exact).toContain('LATISSIMUS_LEFT');
    expect(EXERCISE_ATLAS_MAP.lat_pulldown_wide.unavailable).toContain('Obły większy');
    expect(EXERCISE_ATLAS_MAP.leg_press.approximate).toContain('GLUTEUS_LEFT');
    for (const entry of Object.values(EXERCISE_ATLAS_MAP)) {
      expect(entry.regions.every(region => ['exact', 'approximate', 'unavailable'].includes(region.precision))).toBe(true);
      for (const region of entry.regions.filter(item => item.precision === 'unavailable')) expect(region.ids).toEqual([]);
    }
  });

  it('quarantines the misleading female-front adductor paths without relabeling source geometry', () => {
    expect(EXERCISE_ATLAS_MAP.leg_press.excludedByView['female-front']).toEqual(['ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT']);
    expect(EXERCISE_ATLAS_MAP.leg_press.secondary).toContain('ADDUCTOR_LEFT');
  });

  it('retains semantic path grouping and leaves the two unlabelled QUADS paths unguessed', () => {
    const [maleFront, maleBack, femaleFront, femaleBack] = MUSCLEMAP_DIAGRAMS;
    const unlabelledQuads = maleFront.muscles.filter(path => !path.id && path.group === 'QUADS');
    expect(unlabelledQuads).toHaveLength(2);
    expect(maleBack.muscles.filter(path => path.id === 'TRAPEZIUS_LEFT')).toHaveLength(2);
    expect(femaleFront.muscles.filter(path => path.id === 'QUADRICEPS_LEFT')).toHaveLength(2);
    expect(femaleBack.muscles.filter(path => path.id === 'TRAPEZIUS_LEFT')).toHaveLength(2);
  });

  it('retains all 38 semantic surface IDs across the four source diagrams', () => {
    const ids = new Set(MUSCLEMAP_DIAGRAMS.flatMap(diagram => diagram.muscles.map(path => path.id).filter(Boolean)));
    expect(ids).toHaveLength(38);
    expect(MUSCLEMAP_DIAGRAMS.map(diagram => diagram.muscles.filter(path => !path.id).length)).toEqual([2, 0, 0, 0]);
    expect(MUSCLEMAP_DIAGRAMS.map(diagram => new Set(diagram.muscles.map(path => path.id).filter(Boolean)).size)).toEqual([26, 28, 26, 28]);
  });
});
