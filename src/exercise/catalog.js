const sourceDocument = 'docs/spec/GymVerse_2_0_MASTER_PROMPT_v2_8.md';
const pendingTechniqueReason = 'MASTER PROMPT v2.8 podaje sprzęt i pozycję, ale nie zatwierdza pełnych instrukcji krok po kroku; wymaga osobnej redakcji.';
const pendingMistakesReason = 'MASTER PROMPT v2.8 nie zawiera zatwierdzonej listy typowych błędów dla tego wpisu.';
const pendingImageReason = 'Manifest bitmap i przypisanie ilustracji wymagają weryfikacji w GV-IMG; ten etap nie generuje ani nie przypisuje grafik.';

const metadata = (loadUnit, executionMode, repsUnit, implementCount, trainedSides) => ({
  loadUnit,
  executionMode,
  repsUnit,
  implementCount,
  trainedSides
});

const pending = reason => ({ status: 'pending', reason });
const approvedFields = ['name', 'group', 'equipment', 'primaryMuscles', 'secondaryMuscles', 'metadata', 'defaultVariant', 'provenance'];
const pendingFields = ['techniqueInstructions', 'commonMistakes', 'imageManifest'];

function baseExercise(id, name, group, equipment, primaryMuscles, secondaryMuscles, fields, anatomySection) {
  return {
    id,
    name,
    group,
    equipment,
    primaryMuscles,
    secondaryMuscles,
    defaultVariant: null,
    metadata: metadata(...fields),
    techniqueInstructions: pending(pendingTechniqueReason),
    commonMistakes: pending(pendingMistakesReason),
    imageManifest: {
      status: 'pending',
      reason: pendingImageReason,
      expectedViews: ['technique', 'muscles', 'thumbnail'],
      assets: []
    },
    approval: { status: 'partial', approvedFields: [...approvedFields], pendingFields: [...pendingFields] },
    provenance: {
      status: 'approved',
      masterVersion: '2.8',
      references: [`§3.4:${id}`, `${anatomySection}:${id}`]
    }
  };
}

export const EXERCISE_ASSETS_VERSION = 1;

/**
 * Normative catalog transcription from MASTER PROMPT v2.8 §§3.4 and 4.1–4.6.
 * Descriptive instructions, common mistakes and unverified image assignments
 * remain explicitly pending; the legacy image map in index.html is untouched.
 */
export const EXERCISE_CATALOG = [
  baseExercise('bench_flat', 'Wyciskanie sztangi na ławce płaskiej', 'Klatka', 'Sztanga, płaska ławka, klasyczne wyciskanie',
    ['piersiowy większy'], ['triceps', 'przedni naramienny'], ['displayed_load', 'barbell', 'per_set', 1, 2], '§4.1'),
  baseExercise('db_incline', 'Wyciskanie hantli na ławce skośnej', 'Klatka', 'Dwa hantle, ławka ok. 30°',
    ['piersiowy większy — część obojczykowa'], ['przedni naramienny', 'triceps'], ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.1'),
  baseExercise('lat_raise_stand', 'Unoszenie hantli bokiem stojąc', 'Barki', 'Dwa hantle, unoszenie bokiem na stojąco',
    ['boczny naramienny'], ['nadgrzebieniowy', 'czworoboczny'], ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.3'),
  baseExercise('tri_rope', 'Triceps na linach wyciągu górnego', 'Triceps', 'Wyciąg górny, lina, prostowanie przedramion w dół',
    ['triceps (trzy głowy)'], [], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.5'),
  baseExercise('leg_press', 'Wypychanie nóg na suwnicy', 'Nogi', 'Suwnica pod kątem ok. 45°, stopy pośrodku platformy',
    ['czworogłowe', 'pośladkowe wielkie'], ['przywodziciele'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.6'),
  baseExercise('lat_pulldown_wide', 'Ściąganie drążka wyciągu górnego do klatki - szeroko', 'Plecy', 'Wyciąg górny, szeroki nachwyt do klatki',
    ['najszerszy grzbietu', 'obły większy'], ['biceps', 'środkowa część pleców'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.2'),
  baseExercise('row_v', 'Przyciąganie uchwytu V wyciągu dolnego do brzucha', 'Plecy', 'Wyciąg dolny, siedząc, uchwyt V do brzucha',
    ['najszerszy', 'środkowe plecy'], ['biceps', 'tylny naramienny'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.2'),
  baseExercise('rear_delt', 'Unoszenie hantli tyłem', 'Barki', 'Dwa hantle, pochylenie, odwrotne rozpiętki',
    ['tylny naramienny'], ['równoległoboczne', 'środkowy czworoboczny'], ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.3'),
  baseExercise('biceps_preacher', 'Biceps na maszynie modlitewnik', 'Biceps', 'Maszyna modlitewnik do uginania łokci',
    ['biceps', 'ramienny'], ['ramienno-promieniowy'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.4'),
  baseExercise('leg_curl', 'Uginanie nóg na maszynie leżąc', 'Nogi', 'Uginanie nóg leżąc, wałek nad tylną częścią podudzi',
    ['kulszowo-goleniowe'], ['brzuchaty łydki'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.6'),
  baseExercise('db_bench', 'Wyciskanie hantli na ławce płaskiej', 'Klatka', 'Dwa hantle, ławka płaska',
    ['piersiowy większy'], ['triceps', 'przedni naramienny'], ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.1'),
  baseExercise('db_fly', 'Rozpiętki hantlami na ławce płaskiej lub lekkim skosie', 'Klatka', 'Dwa hantle, ławka płaska, lekko zgięte łokcie, rozpiętki',
    ['piersiowy większy'], ['przedni naramienny'], ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.1'),
  baseExercise('front_raise', 'Unoszenie hantli przodem', 'Barki', 'Hantle unoszone przed siebie; wariant domyślny dwa hantle',
    ['przedni naramienny'], ['część obojczykowa piersiowego większego'], ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.3'),
  baseExercise('lat_raise_seated', 'Unoszenie hantli bokiem siedząc', 'Barki', 'Dwa hantle, unoszenie bokiem siedząc',
    ['boczny naramienny'], ['nadgrzebieniowy', 'czworoboczny'], ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.3'),
  baseExercise('tri_machine', 'Prostowanie przedramion na maszynie do tricepsa', 'Triceps', 'Siedząca maszyna ze stosem do prostowania łokci z podparciem górnych części ramion — wzorzec ACE 292',
    ['triceps'], [], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.5'),
  baseExercise('lat_pulldown_neutral', 'Ściąganie drążka wyciągu górnego do klatki - chwyt neutralny/wąski', 'Plecy', 'Wyciąg górny, wąski chwyt neutralny',
    ['najszerszy grzbietu'], ['biceps', 'obły większy', 'mięśnie międzyłopatkowe'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.2'),
  baseExercise('row_straight', 'Przyciąganie prostego drążka wyciągu dolnego do brzucha', 'Plecy', 'Wyciąg dolny, siedząc, prosty drążek do brzucha',
    ['najszerszy', 'równoległoboczne', 'środkowy czworoboczny'], ['biceps', 'tylny naramienny'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.2'),
  baseExercise('chest_machine', 'Wyciskanie na maszynie (klatka)', 'Klatka', 'Maszyna siedząca do poziomego wyciskania klatką',
    ['piersiowy większy'], ['triceps', 'przedni naramienny'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.1'),
  baseExercise('pec_deck', 'Rozpiętki na maszynie (butterfly)', 'Klatka', 'Butterfly, siedzące przywodzenie ramion',
    ['piersiowy większy'], ['przedni naramienny'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.1'),
  baseExercise('shoulder_press', 'Wyciskanie nad głowę (maszyna lub hantle)', 'Barki', 'Domyślnie siedząca maszyna do wyciskania nad głowę',
    ['przedni i boczny naramienny'], ['triceps'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.3'),
  baseExercise('lat_raise_cable', 'Unoszenie bokiem na wyciągu', 'Barki', 'Wyciąg dolny, unoszenie jednego ramienia bokiem',
    ['boczny naramienny'], ['nadgrzebieniowy', 'czworoboczny'], ['displayed_load', 'single_side', 'per_side', 1, 1], '§4.3'),
  baseExercise('face_pull', 'Face pull na wyciągu', 'Barki', 'Wyciąg z liną, przyciągnięcie do twarzy i rotacja zewnętrzna',
    ['tylny naramienny', 'mięśnie środkowych pleców'], ['rotatory zewnętrzne barku'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.3'),
  baseExercise('row_machine', 'Wiosłowanie na maszynie siedząc', 'Plecy', 'Maszyna do wiosłowania siedząc',
    ['najszerszy', 'równoległoboczne', 'środkowy czworoboczny'], ['biceps', 'tylny naramienny'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.2'),
  baseExercise('hammer_curl', 'Uginanie hantli młotkowo', 'Biceps', 'Dwa hantle, chwyt neutralny, domyślnie naprzemiennie; powtórzenia na rękę',
    ['ramienny', 'ramienno-promieniowy'], ['biceps'], ['per_dumbbell', 'alternating', 'per_side', 2, 2], '§4.4'),
  baseExercise('cable_curl', 'Uginanie przedramion na wyciągu', 'Biceps', 'Wyciąg dolny, drążek do uginania łokci',
    ['biceps', 'ramienny'], ['ramienno-promieniowy'], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.4'),
  baseExercise('tri_overhead', 'Prostowanie przedramion znad głowy (hantla lub lina)', 'Triceps', 'Domyślnie jeden hantel trzymany oburącz, prostowanie znad głowy',
    ['triceps, szczególnie głowa długa'], [], ['per_dumbbell', 'bilateral_single_implement', 'per_set', 1, 2], '§4.5'),
  baseExercise('leg_extension', 'Prostowanie nóg na maszynie siedząc', 'Nogi', 'Prostowanie nóg siedząc',
    ['czworogłowe'], [], ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.6'),
  baseExercise('smith_squat', 'Przysiad na suwnicy Smitha', 'Nogi', 'Przysiad ze sztangą w prowadnicy Smitha',
    ['czworogłowe', 'pośladkowe wielkie'], ['przywodziciele'], ['displayed_load', 'barbell', 'per_set', 1, 2], '§4.6'),
  baseExercise('pullup', 'Podciąganie na drążku', 'Plecy', 'Drążek, nachwyt średnio szeroki',
    ['najszerszy', 'obły większy'], ['biceps', 'mięśnie międzyłopatkowe'], ['additional_weight', 'bodyweight', 'per_set', 1, 2], '§4.2'),
  baseExercise('dips', 'Dipy na poręczach', 'Klatka', 'Poręcze równoległe, umiarkowanie pionowy tułów',
    ['triceps'], ['piersiowy większy', 'przedni naramienny'], ['additional_weight', 'bodyweight', 'per_set', 1, 2], '§4.1'),
  baseExercise('pushup', 'Pompki', 'Klatka', 'Klasyczna pompka, prosta linia ciała',
    ['piersiowy większy', 'triceps'], ['przedni naramienny'], ['additional_weight', 'bodyweight', 'per_set', 1, 2], '§4.1')
];

function variant(exerciseId, variantId, variantDescription, equipment, fields, section) {
  return {
    exerciseId,
    variantId,
    variantDescription,
    equipment,
    metadata: metadata(...fields),
    techniqueInstructions: pending(pendingTechniqueReason),
    commonMistakes: pending(pendingMistakesReason),
    imageManifest: {
      status: 'pending',
      reason: pendingImageReason,
      expectedViews: ['technique', 'muscles', 'thumbnail'],
      assets: []
    },
    approval: { status: 'partial', approvedFields: ['exerciseId', 'variantId', 'variantDescription', 'equipment', 'metadata', 'provenance'], pendingFields: [...pendingFields] },
    provenance: {
      status: 'approved',
      masterVersion: '2.8',
      references: [`§3.4:${exerciseId}/${variantId}`, `${section}:${exerciseId}/${variantId}`]
    }
  };
}

export const EXERCISE_VARIANTS = [
  variant('leg_press', 'high_feet', 'Stopy wyżej na platformie, bez wymyślania procentowego udziału mięśni',
    'Suwnica pod kątem ok. 45°, stopy wyżej na platformie', ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.7'),
  variant('db_fly', 'incline', 'Lekki dodatni skos ławki',
    'Dwa hantle, ławka na lekkim dodatnim skosie', ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.7'),
  variant('shoulder_press', 'dumbbells', 'Dwa hantle zamiast maszyny, zapis kg/hantel',
    'Dwa hantle', ['per_dumbbell', 'simultaneous', 'per_set', 2, 2], '§4.7'),
  variant('tri_overhead', 'rope', 'Lina na wyciągu zamiast jednego hantla',
    'Lina na wyciągu', ['displayed_load', 'machine_or_cable', 'per_set', 1, 2], '§4.7')
];

const LOAD_UNITS = new Set(['displayed_load', 'per_dumbbell', 'additional_weight']);
const EXECUTION_MODES = new Set(['simultaneous', 'alternating', 'single_side', 'bilateral_single_implement', 'machine_or_cable', 'barbell', 'bodyweight']);
const REPS_UNITS = new Set(['per_set', 'per_side']);
const REQUIRED_IMAGE_VIEWS = ['technique', 'muscles', 'thumbnail'];
const REQUIRED_EXERCISE_IDS = new Set([
  'bench_flat', 'db_incline', 'lat_raise_stand', 'tri_rope', 'leg_press', 'lat_pulldown_wide', 'row_v',
  'rear_delt', 'biceps_preacher', 'leg_curl', 'db_bench', 'db_fly', 'front_raise', 'lat_raise_seated',
  'tri_machine', 'lat_pulldown_neutral', 'row_straight', 'chest_machine', 'pec_deck', 'shoulder_press',
  'lat_raise_cable', 'face_pull', 'row_machine', 'hammer_curl', 'cable_curl', 'tri_overhead',
  'leg_extension', 'smith_squat', 'pullup', 'dips', 'pushup'
]);
const REQUIRED_VARIANT_IDS = new Set(['leg_press/high_feet', 'db_fly/incline', 'shoulder_press/dumbbells', 'tri_overhead/rope']);

function validateMetadata(fields, label, errors) {
  if (!fields || !LOAD_UNITS.has(fields.loadUnit)) errors.push(`${label}:LOAD_UNIT_INVALID`);
  if (!fields || !EXECUTION_MODES.has(fields.executionMode)) errors.push(`${label}:EXECUTION_MODE_INVALID`);
  if (!fields || !REPS_UNITS.has(fields.repsUnit)) errors.push(`${label}:REPS_UNIT_INVALID`);
  if (!Number.isInteger(fields?.implementCount) || fields.implementCount < 1) errors.push(`${label}:IMPLEMENT_COUNT_INVALID`);
  if (![1, 2].includes(fields?.trainedSides)) errors.push(`${label}:TRAINED_SIDES_INVALID`);
}

function validatePendingField(value, label, errors, expectedViews = false) {
  if (!value || value.status !== 'pending' || typeof value.reason !== 'string' || !value.reason.trim()) {
    errors.push(`${label}:PENDING_REASON_MISSING`);
  }
  if (expectedViews && (!Array.isArray(value?.expectedViews) || value.expectedViews.length !== REQUIRED_IMAGE_VIEWS.length || REQUIRED_IMAGE_VIEWS.some((view, index) => value.expectedViews[index] !== view))) {
    errors.push(`${label}:IMAGE_VIEWS_INVALID`);
  }
  if (expectedViews && (!Array.isArray(value?.assets) || value.assets.length !== 0)) errors.push(`${label}:UNVERIFIED_ASSET_ASSIGNED`);
}

function validateProvenance(value, label, errors) {
  if (value?.status !== 'approved' || value?.masterVersion !== '2.8' || !Array.isArray(value.references) || value.references.length === 0 || value.references.some(ref => typeof ref !== 'string' || !ref.includes('§'))) {
    errors.push(`${label}:PROVENANCE_INVALID`);
  }
}

export function validateExerciseCatalog(catalog = EXERCISE_CATALOG, variants = EXERCISE_VARIANTS) {
  const errors = [];
  if (!Array.isArray(catalog) || catalog.length !== 31) errors.push('BASE_COUNT_INVALID');
  if (!Array.isArray(variants) || variants.length !== 4) errors.push('VARIANT_COUNT_INVALID');

  const ids = new Set();
  for (const exercise of Array.isArray(catalog) ? catalog : []) {
    const label = String(exercise?.id || 'UNKNOWN_EXERCISE');
    if (typeof exercise?.id !== 'string' || !/^[a-z0-9_]+$/.test(exercise.id)) errors.push(`${label}:ID_INVALID`);
    if (ids.has(exercise.id)) errors.push(`${label}:ID_DUPLICATE`);
    ids.add(exercise.id);
    if (typeof exercise?.name !== 'string' || !exercise.name.trim()) errors.push(`${label}:NAME_MISSING`);
    if (typeof exercise?.group !== 'string' || !exercise.group.trim()) errors.push(`${label}:GROUP_MISSING`);
    if (typeof exercise?.equipment !== 'string' || !exercise.equipment.trim()) errors.push(`${label}:EQUIPMENT_MISSING`);
    if (!Array.isArray(exercise?.primaryMuscles) || exercise.primaryMuscles.length === 0 || exercise.primaryMuscles.some(item => typeof item !== 'string' || !item.trim())) errors.push(`${label}:PRIMARY_MUSCLES_INVALID`);
    if (!Array.isArray(exercise?.secondaryMuscles) || exercise.secondaryMuscles.some(item => typeof item !== 'string' || !item.trim())) errors.push(`${label}:SECONDARY_MUSCLES_INVALID`);
    if (exercise?.defaultVariant !== null) errors.push(`${label}:DEFAULT_VARIANT_MUST_USE_BASE_ROW`);
    validateMetadata(exercise?.metadata, label, errors);
    validatePendingField(exercise?.techniqueInstructions, `${label}:TECHNIQUE`, errors);
    validatePendingField(exercise?.commonMistakes, `${label}:MISTAKES`, errors);
    validatePendingField(exercise?.imageManifest, `${label}:IMAGE`, errors, true);
    if (exercise?.approval?.status !== 'partial' || !sameFields(exercise.approval.pendingFields, pendingFields) || !sameFields(exercise.approval.approvedFields, approvedFields)) errors.push(`${label}:APPROVAL_STATUS_INVALID`);
    validateProvenance(exercise?.provenance, label, errors);
  }
  if (ids.size !== REQUIRED_EXERCISE_IDS.size || [...REQUIRED_EXERCISE_IDS].some(id => !ids.has(id))) errors.push('NORMATIVE_EXERCISE_IDS_MISMATCH');

  const variantIds = new Set();
  for (const item of Array.isArray(variants) ? variants : []) {
    const label = `${item?.exerciseId || 'UNKNOWN_EXERCISE'}/${item?.variantId || 'UNKNOWN_VARIANT'}`;
    const id = `${item?.exerciseId}/${item?.variantId}`;
    if (!ids.has(item?.exerciseId)) errors.push(`${label}:BASE_EXERCISE_UNKNOWN`);
    if (typeof item?.variantId !== 'string' || !/^[a-z0-9_]+$/.test(item.variantId)) errors.push(`${label}:VARIANT_ID_INVALID`);
    if (variantIds.has(id)) errors.push(`${label}:VARIANT_ID_DUPLICATE`);
    variantIds.add(id);
    if (typeof item?.variantDescription !== 'string' || !item.variantDescription.trim()) errors.push(`${label}:DESCRIPTION_MISSING`);
    if (typeof item?.equipment !== 'string' || !item.equipment.trim()) errors.push(`${label}:EQUIPMENT_MISSING`);
    validateMetadata(item?.metadata, label, errors);
    validatePendingField(item?.techniqueInstructions, `${label}:TECHNIQUE`, errors);
    validatePendingField(item?.commonMistakes, `${label}:MISTAKES`, errors);
    validatePendingField(item?.imageManifest, `${label}:IMAGE`, errors, true);
    const variantApprovedFields = ['exerciseId', 'variantId', 'variantDescription', 'equipment', 'metadata', 'provenance'];
    if (item?.approval?.status !== 'partial' || !sameFields(item.approval.pendingFields, pendingFields) || !sameFields(item.approval.approvedFields, variantApprovedFields)) errors.push(`${label}:APPROVAL_STATUS_INVALID`);
    validateProvenance(item?.provenance, label, errors);
  }

  if (variantIds.size !== REQUIRED_VARIANT_IDS.size || [...REQUIRED_VARIANT_IDS].some(id => !variantIds.has(id))) errors.push('NORMATIVE_VARIANTS_MISMATCH');
  return { valid: errors.length === 0, errors };
}

function sameFields(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length && expected.every((field, index) => actual[index] === field);
}

export function getExerciseCatalogApprovalSummary(catalog = EXERCISE_CATALOG, variants = EXERCISE_VARIANTS) {
  const records = [...catalog, ...variants];
  const result = validateExerciseCatalog(catalog, variants);
  return {
    baseCount: catalog.length,
    variantCount: variants.length,
    structurallyValid: result.valid,
    approvedExecutionMetadata: records.filter(record => LOAD_UNITS.has(record.metadata?.loadUnit) && EXECUTION_MODES.has(record.metadata?.executionMode) && REPS_UNITS.has(record.metadata?.repsUnit) && Number.isInteger(record.metadata?.implementCount) && [1, 2].includes(record.metadata?.trainedSides)).length,
    approvedAnatomyRecords: catalog.filter(record => record.primaryMuscles?.length > 0 && Array.isArray(record.secondaryMuscles)).length,
    recordsWithPendingFields: records.filter(record => pendingFields.some(field => record[field]?.status === 'pending')).length,
    fullyApprovedRecords: records.filter(record => record.approval?.status === 'approved').length,
    pendingTechniqueInstructions: records.filter(record => record.techniqueInstructions?.status === 'pending').length,
    pendingCommonMistakes: records.filter(record => record.commonMistakes?.status === 'pending').length,
    pendingImageManifests: records.filter(record => record.imageManifest?.status === 'pending').length
  };
}
