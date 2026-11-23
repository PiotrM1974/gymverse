import { EXERCISE_CATALOG, EXERCISE_VARIANTS } from '../../exercise/catalog.js';
import { MUSCLEMAP_DIAGRAMS } from './musclemap-diagrams.js';

// Exact, reviewed catalog labels only. No fuzzy name matching or implicit neighbor substitution.
const bilateral = suffix => [`${suffix}_LEFT`, `${suffix}_RIGHT`];
const term = (surfaceIds, precision, reason = '') => ({ surfaceIds, precision, reason });
const TERM_MAP = Object.freeze({
  'biceps': term(bilateral('BICEPS'), 'exact'),
  'triceps': term(bilateral('TRICEPS'), 'exact', 'Powierzchnia nie rozdziela trzech głów.'),
  'triceps (trzy głowy)': term(bilateral('TRICEPS'), 'approximate', 'TRICEPS nie rozdziela trzech głów.'),
  'triceps, szczególnie głowa długa': term(bilateral('TRICEPS'), 'approximate', 'Brak osobnej powierzchni głowy długiej.'),
  'czworoboczny': term(bilateral('TRAPEZIUS'), 'exact'),
  'najszerszy grzbietu': term(bilateral('LATISSIMUS'), 'exact'),
  'najszerszy': term(bilateral('LATISSIMUS'), 'exact'),
  'czworogłowe': term(bilateral('QUADRICEPS'), 'exact'),
  'przywodziciele': term(bilateral('ADDUCTOR'), 'exact', 'Na żeńskim widoku przednim położenie maski jest niezweryfikowane.'),
  'kulszowo-goleniowe': term(bilateral('HAMSTRINGS'), 'exact'),
  'piersiowy większy': term(bilateral('CHEST'), 'approximate', 'CHEST nie wydziela granicy mięśnia piersiowego większego.'),
  'piersiowy większy — część obojczykowa': term(bilateral('CHEST'), 'approximate', 'Brak podziału części obojczykowej.'),
  'część obojczykowa piersiowego większego': term(bilateral('CHEST'), 'approximate', 'Brak podziału części obojczykowej.'),
  'przedni naramienny': term(bilateral('SHOULDER_FRONT'), 'approximate', 'Powierzchnia jest regionem naramiennego, bez potwierdzonej granicy części.'),
  'boczny naramienny': term(bilateral('SHOULDER_SIDE'), 'approximate', 'Oryginalna powierzchnia jest wąskim pasem.'),
  'tylny naramienny': term(bilateral('SHOULDER_REAR'), 'approximate', 'Powierzchnia jest regionem, bez niezależnej walidacji granicy.'),
  'pośladkowe wielkie': term(bilateral('GLUTEUS'), 'approximate', 'GLUTEUS nie wydziela osobno pośladkowego wielkiego.'),
  'obły większy': term([], 'unavailable', 'Brak osobnej powierzchni MuscleMap.'),
  'nadgrzebieniowy': term([], 'unavailable', 'Brak osobnej powierzchni MuscleMap.'),
  'ramienny': term([], 'unavailable', 'Brak osobnej powierzchni MuscleMap.'),
  'rotatory zewnętrzne barku': term([], 'unavailable', 'Brak osobnej powierzchni MuscleMap.'),
  'środkowa część pleców': term([...bilateral('RHOMBOID'), ...bilateral('TRAPEZIUS')], 'approximate', 'Połączony region równoległobocznych i czworobocznego.'),
  'środkowe plecy': term([...bilateral('RHOMBOID'), ...bilateral('TRAPEZIUS')], 'approximate', 'Połączony region równoległobocznych i czworobocznego.'),
  'mięśnie środkowych pleców': term([...bilateral('RHOMBOID'), ...bilateral('TRAPEZIUS')], 'approximate', 'Połączony region równoległobocznych i czworobocznego.'),
  'mięśnie międzyłopatkowe': term([...bilateral('RHOMBOID'), ...bilateral('TRAPEZIUS')], 'approximate', 'Region międzyłopatkowy nie jest oddzielną strukturą atlasu.'),
  'równoległoboczne': term(bilateral('RHOMBOID'), 'approximate', 'Brak rozdzielenia mięśni równoległobocznych.'),
  'środkowy czworoboczny': term(bilateral('TRAPEZIUS'), 'approximate', 'Brak rozdzielenia włókien środkowych.'),
  'ramienno-promieniowy': term(bilateral('FOREARM'), 'approximate', 'FOREARM nie wydziela osobno ramienno-promieniowego.'),
  'brzuchaty łydki': term(bilateral('CALVES'), 'approximate', 'CALVES nie wydziela osobno brzuchatego łydki.'),
  'przedni i boczny naramienny': term([...bilateral('SHOULDER_FRONT'), ...bilateral('SHOULDER_SIDE')], 'approximate', 'Regiony nie rozdzielają dokładnie części naramiennego.')
});

const diagrams = Object.fromEntries(MUSCLEMAP_DIAGRAMS.map(d => [d.id, new Set(d.muscles.map(p => p.id).filter(Boolean))]));
const variantsByExercise = new Map(EXERCISE_VARIANTS.map(v => [v.exerciseId, v]));
function makeEntry(exercise, variantId) {
  const records = [...exercise.primaryMuscles.map(name => ({ name, role: 'primary' })), ...exercise.secondaryMuscles.map(name => ({ name, role: 'secondary' }))];
  const regions = records.map(({ name, role }) => {
    const mapped = TERM_MAP[name];
    if (!mapped) throw new Error(`UNVERIFIED_CATALOG_TERM:${exercise.id}:${name}`);
    return { label: name, role, precision: mapped.precision, ids: mapped.surfaceIds, reason: mapped.reason };
  });
  const roleIds = role => [...new Set(regions.filter(r => r.role === role && r.precision !== 'unavailable').flatMap(r => r.ids))];
  return {
    title: variantId ? `${exercise.name} — ${variantsByExercise.get(exercise.id).variantDescription}` : exercise.name,
    primary: roleIds('primary'), secondary: roleIds('secondary'),
    approximate: regions.filter(r => r.precision === 'approximate').flatMap(r => r.ids),
    exact: regions.filter(r => r.precision === 'exact').flatMap(r => r.ids),
    unavailable: regions.filter(r => r.precision === 'unavailable').map(r => r.label),
    regions,
    note: variantId ? `Wariant ${variantId} dziedziczy mapowanie bazowe; atlas nie zakłada zmiany aktywacji.` : 'Oznaczenia są edukacyjnym zestawieniem powierzchni atlasu, nie pomiarem aktywacji.'
  };
}

export const FULL_CATALOG_ATLAS_MAP = Object.freeze(Object.fromEntries([
  ...EXERCISE_CATALOG.map(exercise => [exercise.id, makeEntry(exercise)]),
  ...EXERCISE_VARIANTS.map(variant => [
    `${variant.exerciseId}/${variant.variantId}`,
    makeEntry(EXERCISE_CATALOG.find(ex => ex.id === variant.exerciseId), variant.variantId)
  ])
]));

export function validateFullCatalogAtlasMap() {
  const errors = [];
  const expected = EXERCISE_CATALOG.length + EXERCISE_VARIANTS.length;
  if (EXERCISE_CATALOG.length !== 31 || EXERCISE_VARIANTS.length !== 4 || Object.keys(FULL_CATALOG_ATLAS_MAP).length !== expected) errors.push('CATALOG_OR_VARIANT_COUNT_MISMATCH');
  for (const [exerciseId, entry] of Object.entries(FULL_CATALOG_ATLAS_MAP)) for (const region of entry.regions) {
    if (!['primary', 'secondary'].includes(region.role)) errors.push(`${exerciseId}:ROLE_INVALID:${region.label}`);
    if (!['exact', 'approximate', 'unavailable', 'unverified'].includes(region.precision)) errors.push(`${exerciseId}:PRECISION_INVALID:${region.label}`);
    if (region.precision === 'unavailable' && region.ids.length) errors.push(`${exerciseId}:UNAVAILABLE_HAS_SURFACE:${region.label}`);
    if (region.precision !== 'unavailable' && !region.ids.length) errors.push(`${exerciseId}:MISSING_SURFACE_STATUS:${region.label}`);
    for (const id of region.ids) if (!Object.values(diagrams).some(ids => ids.has(id))) errors.push(`${exerciseId}:UNKNOWN_SURFACE:${id}`);
  }
  return { valid: errors.length === 0, errors };
}
