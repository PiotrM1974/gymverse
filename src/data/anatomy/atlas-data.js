import { FULL_CATALOG_ATLAS_MAP } from './catalog-mapping.js';

/** Exercise-to-surface associations. Existing pilot definitions override derived catalog entries. */
const BASE_ATLAS_MAP = {
  ...FULL_CATALOG_ATLAS_MAP,
  lat_raise_stand: {
    title: 'Unoszenie hantli bokiem stojąc',
    primary: ['SHOULDER_SIDE_LEFT', 'SHOULDER_SIDE_RIGHT'],
    secondary: ['TRAPEZIUS_LEFT', 'TRAPEZIUS_RIGHT'],
    approximate: ['SHOULDER_SIDE_LEFT', 'SHOULDER_SIDE_RIGHT'],
    exact: ['TRAPEZIUS_LEFT', 'TRAPEZIUS_RIGHT'],
    unavailable: ['Nadgrzebieniowy'],
    regions: [
      { label: 'Boczny naramienny', role: 'primary', precision: 'approximate', ids: ['SHOULDER_SIDE_LEFT', 'SHOULDER_SIDE_RIGHT'], reason: 'Oryginalna powierzchnia jest wąskim pasem na brzegu barku; nie obejmuje pełnej powierzchni mięśnia.' },
      { label: 'Czworoboczny', role: 'secondary', precision: 'exact', ids: ['TRAPEZIUS_LEFT', 'TRAPEZIUS_RIGHT'] },
      { label: 'Nadgrzebieniowy', role: 'secondary', precision: 'unavailable', ids: [] }
    ],
    labels: ['Boczny naramienny', 'Czworoboczny'],
    note: 'Boczny naramienny jest w oryginalnym MuscleMap wąskim pasem na brzegu barku. Jest to przybliżenie, nie pełna powierzchnia mięśnia. Nadgrzebieniowy nie ma osobnej powierzchni.'
  },
  db_bench: {
    title: 'Wyciskanie hantli na ławce płaskiej',
    primary: ['CHEST_LEFT', 'CHEST_RIGHT'],
    secondary: ['TRICEPS_LEFT', 'TRICEPS_RIGHT', 'SHOULDER_FRONT_LEFT', 'SHOULDER_FRONT_RIGHT'],
    approximate: ['CHEST_LEFT', 'CHEST_RIGHT', 'SHOULDER_FRONT_LEFT', 'SHOULDER_FRONT_RIGHT'],
    exact: ['TRICEPS_LEFT', 'TRICEPS_RIGHT'],
    unavailable: [],
    regions: [
      { label: 'Piersiowy większy', role: 'primary', precision: 'approximate', ids: ['CHEST_LEFT', 'CHEST_RIGHT'], reason: 'CHEST nie wydziela granicy mięśnia piersiowego większego.' },
      { label: 'Triceps', role: 'secondary', precision: 'exact', ids: ['TRICEPS_LEFT', 'TRICEPS_RIGHT'] },
      { label: 'Przedni naramienny', role: 'secondary', precision: 'approximate', ids: ['SHOULDER_FRONT_LEFT', 'SHOULDER_FRONT_RIGHT'], reason: 'Powierzchnia jest regionem naramiennego, bez potwierdzonej granicy części.' }
    ],
    labels: ['Piersiowy większy', 'Triceps', 'Przedni naramienny'],
    note: 'Atlas nie dzieli klatki piersiowej na granice mięśnia piersiowego większego ani naramiennego na części.'
  },
  lat_pulldown_wide: {
    title: 'Ściąganie drążka wyciągu górnego do klatki - szeroko',
    primary: ['LATISSIMUS_LEFT', 'LATISSIMUS_RIGHT'],
    secondary: ['BICEPS_LEFT', 'BICEPS_RIGHT', 'RHOMBOID_LEFT', 'RHOMBOID_RIGHT', 'TRAPEZIUS_LEFT', 'TRAPEZIUS_RIGHT'],
    approximate: ['RHOMBOID_LEFT', 'RHOMBOID_RIGHT', 'TRAPEZIUS_LEFT', 'TRAPEZIUS_RIGHT'],
    exact: ['LATISSIMUS_LEFT', 'LATISSIMUS_RIGHT', 'BICEPS_LEFT', 'BICEPS_RIGHT'],
    unavailable: ['Obły większy'],
    regions: [
      { label: 'Najszerzy grzbietu', role: 'primary', precision: 'exact', ids: ['LATISSIMUS_LEFT', 'LATISSIMUS_RIGHT'] },
      { label: 'Biceps', role: 'secondary', precision: 'exact', ids: ['BICEPS_LEFT', 'BICEPS_RIGHT'] },
      { label: 'Środkowa część pleców (równoległoboczne i czworoboczny)', role: 'secondary', precision: 'approximate', ids: ['RHOMBOID_LEFT', 'RHOMBOID_RIGHT', 'TRAPEZIUS_LEFT', 'TRAPEZIUS_RIGHT'], reason: 'Połączony region równoległobocznych i czworobocznego.' },
      { label: 'Obły większy', role: 'secondary', precision: 'unavailable', ids: [] }
    ],
    labels: ['Najszerzy grzbietu', 'Obły większy', 'Biceps', 'Środkowa część pleców'],
    note: 'Obły większy nie ma osobnej powierzchni. Równoległoboczne i czworoboczny są przybliżeniem środkowej części pleców.'
  },
  leg_press: {
    title: 'Wypychanie nóg na suwnicy',
    // On female-front the source ADDUCTOR shapes occupy the lateral thigh,
    // where the corresponding male-front and both back diagrams place ABDUCTOR.
    // Keep the source IDs intact and withhold this misleading highlight.
    excludedByView: { 'female-front': ['ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT'] },
    primary: ['QUADRICEPS_LEFT', 'QUADRICEPS_RIGHT', 'GLUTEUS_LEFT', 'GLUTEUS_RIGHT'],
    secondary: ['ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT'],
    approximate: ['GLUTEUS_LEFT', 'GLUTEUS_RIGHT'],
    exact: ['QUADRICEPS_LEFT', 'QUADRICEPS_RIGHT', 'ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT'],
    unavailable: [],
    regions: [
      { label: 'Czworogłowe', role: 'primary', precision: 'exact', ids: ['QUADRICEPS_LEFT', 'QUADRICEPS_RIGHT'] },
      { label: 'Pośladkowy wielki', role: 'primary', precision: 'approximate', ids: ['GLUTEUS_LEFT', 'GLUTEUS_RIGHT'], reason: 'GLUTEUS nie wydziela osobno pośladkowego wielkiego.' },
      { label: 'Przywodziciele', role: 'secondary', precision: 'exact', ids: ['ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT'] }
    ],
    labels: ['Czworogłowe', 'Pośladkowe wielkie', 'Przywodziciele'],
    note: 'Region pośladkowy nie wydziela osobno mięśnia pośladkowego wielkiego. W źródłowej żeńskiej sylwetce z przodu ścieżki podpisane ADDUCTOR leżą na zewnętrznych stronach ud, więc oznaczenie przywodzicieli w tym widoku jest wstrzymane do wyjaśnienia.'
  }
};

export const EXERCISE_ATLAS_MAP = Object.freeze({
  ...BASE_ATLAS_MAP,
  'leg_press/high_feet': {
    ...BASE_ATLAS_MAP.leg_press,
    title: 'Wypychanie nóg na suwnicy — Stopy wyżej na platformie',
    note: `Mapa wspólna z wariantem podstawowym. Ustawienie stóp może zmieniać udział poszczególnych mięśni. ${BASE_ATLAS_MAP.leg_press.note}`
  }
});

export function getHighlightedMuscleIds(exerciseId) {
  const entry = EXERCISE_ATLAS_MAP[exerciseId];
  return entry ? [...entry.primary, ...entry.secondary] : [];
}
