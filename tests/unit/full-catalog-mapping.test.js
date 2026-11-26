import { describe, expect, it } from 'vitest';
import { EXERCISE_CATALOG, EXERCISE_VARIANTS } from '../../src/exercise/catalog.js';
import { FULL_CATALOG_ATLAS_MAP, validateFullCatalogAtlasMap } from '../../src/data/anatomy/catalog-mapping.js';
import { EXERCISE_ATLAS_MAP } from '../../src/data/anatomy/atlas-data.js';

describe('full catalog anatomy metadata', () => {
  it('has one explicit entry for every catalog exercise and variant', () => {
    expect(EXERCISE_CATALOG).toHaveLength(31);
    expect(EXERCISE_VARIANTS).toHaveLength(4);
    expect(Object.keys(FULL_CATALOG_ATLAS_MAP)).toHaveLength(35);
    expect(validateFullCatalogAtlasMap()).toEqual({ valid: true, errors: [] });
  });

  it('retains pilot mappings and does not color muscles without surfaces', () => {
    for (const id of ['lat_raise_stand', 'db_bench', 'lat_pulldown_wide', 'leg_press']) expect(EXERCISE_ATLAS_MAP[id]).toBeDefined();
    for (const entry of Object.values(FULL_CATALOG_ATLAS_MAP)) {
      expect(entry.regions.filter(region => region.precision === 'unavailable').every(region => region.ids.length === 0)).toBe(true);
    }
  });

  it('inherits variants without changing the catalog role lists', () => {
    for (const variant of EXERCISE_VARIANTS) {
      const parent = FULL_CATALOG_ATLAS_MAP[variant.exerciseId];
      const child = FULL_CATALOG_ATLAS_MAP[`${variant.exerciseId}/${variant.variantId}`];
      expect(child.regions.map(({ label, role, precision, ids }) => ({ label, role, precision, ids })))
        .toEqual(parent.regions.map(({ label, role, precision, ids }) => ({ label, role, precision, ids })));
    }
  });

  it('uses the reviewed leg press map for high feet, including its female-front exclusion', () => {
    const base = EXERCISE_ATLAS_MAP.leg_press;
    const highFeet = EXERCISE_ATLAS_MAP['leg_press/high_feet'];
    expect(highFeet).toMatchObject({
      primary: base.primary,
      secondary: base.secondary,
      approximate: base.approximate,
      exact: base.exact,
      unavailable: base.unavailable,
      regions: base.regions,
      labels: base.labels,
      excludedByView: { 'female-front': ['ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT'] }
    });
    expect(highFeet.note).toContain('Mapa wspólna z wariantem podstawowym. Ustawienie stóp może zmieniać udział poszczególnych mięśni');
    expect(EXERCISE_ATLAS_MAP['leg_press/unknown']).toBeUndefined();
  });
});
