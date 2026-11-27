const EQUIPMENT = new Set(['bodyweight', 'dumbbells', 'barbell', 'bench', 'cables', 'machines', 'bands', 'pullup_bar', 'dip_bars']);
const SPLITS = new Set(['auto', 'full_body', 'push_pull', 'push_pull_legs', 'upper_lower', 'custom']);
const GOALS = new Set(['fat_loss', 'hypertrophy', 'strength', 'recomposition', 'fitness', 'maintenance']);
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// Only catalog IDs are eligible. This transparent mapping is operational metadata,
// not a claim of clinical validation or a complete anatomical classification.
const MAP = {
  bench_flat: { groups: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'bench'], pattern: 'horizontal_push' },
  db_incline: { groups: ['chest', 'triceps', 'shoulders'], equipment: ['dumbbells', 'bench'], pattern: 'horizontal_push' },
  lat_raise_stand: { groups: ['shoulders'], equipment: ['dumbbells'], pattern: 'shoulder_accessory' },
  tri_rope: { groups: ['triceps'], equipment: ['cables'], pattern: 'arm_isolation' },
  leg_press: { groups: ['quads', 'glutes'], equipment: ['machines'], pattern: 'knee_dominant' },
  lat_pulldown_wide: { groups: ['back', 'biceps'], equipment: ['cables', 'machines'], equipmentMode: 'any', pattern: 'vertical_pull' },
  row_v: { groups: ['back', 'biceps'], equipment: ['cables'], pattern: 'horizontal_pull' },
  rear_delt: { groups: ['shoulders', 'back'], equipment: ['dumbbells'], pattern: 'shoulder_accessory' },
  biceps_preacher: { groups: ['biceps'], equipment: ['machines'], pattern: 'arm_isolation' },
  leg_curl: { groups: ['hamstrings'], equipment: ['machines'], pattern: 'knee_flexion' },
  db_bench: { groups: ['chest', 'triceps', 'shoulders'], equipment: ['dumbbells', 'bench'], pattern: 'horizontal_push' },
  db_fly: { groups: ['chest'], equipment: ['dumbbells', 'bench'], pattern: 'chest_isolation' },
  front_raise: { groups: ['shoulders'], equipment: ['dumbbells'], pattern: 'shoulder_accessory' },
  lat_raise_seated: { groups: ['shoulders'], equipment: ['dumbbells'], pattern: 'shoulder_accessory' },
  tri_machine: { groups: ['triceps'], equipment: ['machines'], pattern: 'arm_isolation' },
  lat_pulldown_neutral: { groups: ['back', 'biceps'], equipment: ['cables', 'machines'], equipmentMode: 'any', pattern: 'vertical_pull' },
  row_straight: { groups: ['back', 'biceps'], equipment: ['cables'], pattern: 'horizontal_pull' },
  chest_machine: { groups: ['chest', 'triceps', 'shoulders'], equipment: ['machines'], pattern: 'horizontal_push' },
  pec_deck: { groups: ['chest'], equipment: ['machines'], pattern: 'chest_isolation' },
  shoulder_press: { groups: ['shoulders', 'triceps'], equipment: ['machines'], pattern: 'overhead_press' },
  lat_raise_cable: { groups: ['shoulders'], equipment: ['cables'], pattern: 'shoulder_accessory' },
  face_pull: { groups: ['shoulders', 'back'], equipment: ['cables'], pattern: 'shoulder_accessory' },
  row_machine: { groups: ['back', 'biceps'], equipment: ['machines'], pattern: 'horizontal_pull' },
  hammer_curl: { groups: ['biceps'], equipment: ['dumbbells'], pattern: 'arm_isolation' },
  cable_curl: { groups: ['biceps'], equipment: ['cables'], pattern: 'arm_isolation' },
  tri_overhead: { groups: ['triceps'], equipment: ['dumbbells'], pattern: 'arm_isolation' },
  leg_extension: { groups: ['quads'], equipment: ['machines'], pattern: 'knee_dominant' },
  smith_squat: { groups: ['quads', 'glutes'], equipment: ['machines'], pattern: 'deep_knee_flexion' },
  pullup: { groups: ['back', 'biceps'], equipment: ['pullup_bar'], pattern: 'vertical_pull' },
  dips: { groups: ['chest', 'triceps'], equipment: ['dip_bars'], pattern: 'horizontal_push' },
  pushup: { groups: ['chest', 'triceps', 'shoulders'], equipment: ['bodyweight'], pattern: 'floor_exercise' }
};

const BLOCKED = {
  overhead_press: new Set(['overhead_press']),
  deep_knee_flexion: new Set(['deep_knee_flexion', 'knee_dominant']),
  hip_hinge: new Set(['hip_hinge']),
  floor_exercises: new Set(['floor_exercise'])
};
const GROUPS = ['chest', 'back', 'quads', 'hamstrings', 'glutes', 'shoulders', 'biceps', 'triceps'];
const GAP_PATTERNS = ['hip_hinge', 'calves', 'core'];
let generationSequence = 0;

function generationId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  generationSequence += 1;
  return `${Date.now().toString(36)}-${generationSequence.toString(36)}`;
}

function failure(reason, extra = {}) { return { ok: false, reason, plan: null, ...extra }; }

export function getExerciseAlternatives({ exerciseId, equipment = [], restrictions = [], excludedExerciseIds = [], existingExerciseIds = [], catalog = [] } = {}) {
  const source = MAP[exerciseId];
  if (!source || !Array.isArray(catalog)) return [];
  const allowed = new Set(equipment);
  const blocked = new Set(restrictions);
  const excluded = new Set([...excludedExerciseIds, ...existingExerciseIds, exerciseId]);
  return catalog.filter(item => {
    const map = MAP[item?.id];
    if (!map || excluded.has(item.id) || blocked.has(item.id) || map.groups[0] !== source.groups[0]) return false;
    const equipmentMatches = map.equipmentMode === 'any' ? map.equipment.some(key => allowed.has(key)) : map.equipment.every(key => allowed.has(key));
    if (!equipmentMatches) return false;
    if (map.pattern === 'overhead_press' && blocked.has('overhead_press')) return false;
    if (['deep_knee_flexion', 'knee_dominant'].includes(map.pattern) && blocked.has('deep_knee_flexion')) return false;
    if (blocked.has(map.pattern) || [...blocked].some(key => BLOCKED[key]?.has(map.pattern))) return false;
    return true;
  });
}

export function generatePlan({ profile, preferences = {}, catalog = [] } = {}) {
  const attributes = profile?.attributes || profile;
  if (!attributes || !Number.isInteger(attributes.age) || attributes.age < 18) return failure('ADULTS_ONLY');
  const { daysPerWeek, split = 'auto', sessionMinutes = 45, focus = GROUPS, goal = 'hypertrophy', favoriteExerciseIds = [], excludedExerciseIds = [], useHistory = false, recentExerciseIds = [], scheduleDays = [], customSplitFocus = [] } = preferences;
  const resolvedSplit = split === 'auto' ? (daysPerWeek <= 3 ? 'full_body' : daysPerWeek === 4 ? 'upper_lower' : 'push_pull_legs') : split;
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 6 || !SPLITS.has(split) || (resolvedSplit === 'full_body' && daysPerWeek > 4) || (resolvedSplit === 'push_pull' && daysPerWeek < 2) || (resolvedSplit === 'push_pull_legs' && daysPerWeek < 3) || (resolvedSplit === 'upper_lower' && daysPerWeek < 2) || !Number.isInteger(sessionMinutes) || sessionMinutes < 20 || sessionMinutes > 120 || !Array.isArray(focus) || !focus.length || focus.some(group => !GROUPS.includes(group)) || !GOALS.has(goal) || typeof useHistory !== 'boolean' || !Array.isArray(favoriteExerciseIds) || !Array.isArray(excludedExerciseIds) || !Array.isArray(recentExerciseIds) || [...favoriteExerciseIds, ...excludedExerciseIds, ...recentExerciseIds].some(id => typeof id !== 'string' || !catalog.some(item => item.id === id)) || !Array.isArray(scheduleDays) || (scheduleDays.length && scheduleDays.length !== daysPerWeek) || new Set(scheduleDays).size !== scheduleDays.length || scheduleDays.some(day => !WEEKDAYS.includes(day)) || (resolvedSplit === 'custom' && (!Array.isArray(customSplitFocus) || customSplitFocus.length !== daysPerWeek || customSplitFocus.some(groups => !Array.isArray(groups) || !groups.length || new Set(groups).size !== groups.length || groups.some(group => !GROUPS.includes(group)))))) return failure('PREFERENCES_INVALID');
  if (!Array.isArray(attributes.equipment) || !attributes.equipment.length || attributes.equipment.some(item => !EQUIPMENT.has(item))) return failure('EQUIPMENT_REQUIRED');
  if (!Array.isArray(attributes.restrictions || [])) return failure('RESTRICTIONS_INVALID');
  const allowed = new Set(attributes.equipment);
  const restrictions = new Set(attributes.restrictions || []);
  const excluded = new Set(excludedExerciseIds);
  const favorites = new Set(favoriteExerciseIds);
  const recent = new Set(useHistory ? recentExerciseIds : []);
  const candidates = catalog.filter(item => {
    const map = MAP[item?.id];
    if (excluded.has(item?.id) || restrictions.has(item?.id)) return false;
    const equipmentMatches = map && (map.equipmentMode === 'any' ? map.equipment.some(item => allowed.has(item)) : map.equipment.every(item => allowed.has(item)));
    if (!map || !equipmentMatches) return false;
    if (map.pattern === 'overhead_press' && restrictions.has('overhead_press')) return false;
    if (['deep_knee_flexion', 'knee_dominant'].includes(map.pattern) && restrictions.has('deep_knee_flexion')) return false;
    if (restrictions.has(map.pattern) || [...restrictions].some(key => BLOCKED[key]?.has(map.pattern))) return false;
    return true;
  });
  const preferenceRank = item => favorites.has(item.id) ? 0 : recent.has(item.id) ? 1 : 2;
  candidates.sort((a, b) => preferenceRank(a) - preferenceRank(b));
  const covered = new Set(candidates.flatMap(item => MAP[item.id].groups));
  const missingGroups = focus.filter(group => !covered.has(group));
  if (candidates.length < 2 || missingGroups.length) return failure('INSUFFICIENT_CATALOG_COVERAGE', { availableExerciseIds: candidates.map(item => item.id), missingGroups });
  const missingSplitGroups = resolvedSplit === 'custom' ? customSplitFocus.map((groups, day) => ({ day: day + 1, groups: groups.filter(group => !candidates.some(item => MAP[item.id].groups.includes(group))) })).filter(item => item.groups.length) : [];
  if (missingSplitGroups.length) return failure('INSUFFICIENT_CATALOG_COVERAGE', { availableExerciseIds: candidates.map(item => item.id), missingSplitGroups });

  const targetCount = Math.max(2, Math.min(8, Math.floor(sessionMinutes / 10)));
  const setsPerExercise = attributes.returnAfterBreak === true ? 1 : 2;
  const defaultsNote = attributes.returnAfterBreak === true
    ? `Jedna seria i zakres ${goal === 'strength' ? '4–6' : '8–12'} powtórzeń to ostrożna heurystyka do edycji dla osoby wracającej po przerwie, nie indywidualna recepta.`
    : goal === 'strength' ? 'Dwie serie i 4–6 powtórzeń to ustawienia robocze do edycji; nie są indywidualną receptą ani wskazaniem ciężaru.' : 'Dwie serie i 8–12 powtórzeń to ustawienia robocze do edycji, nie indywidualna recepta.';
  const planId = generationId();
  const weeklyExerciseUse = new Map();
  const sessions = Array.from({ length: daysPerWeek }, (_, day) => {
    const dayFocus = resolvedSplit === 'full_body'
      ? focus
      : resolvedSplit === 'upper_lower'
        ? (day % 2 === 0 ? focus.filter(group => !['quads', 'hamstrings', 'glutes'].includes(group)) : focus.filter(group => ['quads', 'hamstrings', 'glutes'].includes(group)))
        : resolvedSplit === 'push_pull'
          ? (day % 2 === 0 ? focus.filter(group => ['chest', 'shoulders', 'triceps', 'quads'].includes(group)) : focus.filter(group => ['back', 'biceps', 'hamstrings', 'glutes'].includes(group)))
          : resolvedSplit === 'push_pull_legs'
            ? (day % 3 === 0 ? focus.filter(group => ['chest', 'shoulders', 'triceps'].includes(group)) : day % 3 === 1 ? focus.filter(group => ['back', 'biceps'].includes(group)) : focus.filter(group => ['quads', 'hamstrings', 'glutes'].includes(group)))
            : customSplitFocus[day];
    const chosen = [];
    const used = new Set();
    const dayCandidates = candidates.filter(item => dayFocus.some(group => MAP[item.id].groups.includes(group)));
    const dayRank = (a, b) => {
      const score = item => preferenceRank(item) * 2 + (weeklyExerciseUse.get(item.id) || 0) * 3;
      return score(a) - score(b);
    };
    for (const group of dayFocus) {
      if (chosen.length >= targetCount) break;
      const item = dayCandidates.filter(candidate => !used.has(candidate.id) && MAP[candidate.id].groups.includes(group)).sort(dayRank)[0];
      if (item) { chosen.push(item); used.add(item.id); }
    }
    for (const item of dayCandidates.slice().sort(dayRank)) if (chosen.length < targetCount && !used.has(item.id)) { chosen.push(item); used.add(item.id); }
    for (const item of chosen) weeklyExerciseUse.set(item.id, (weeklyExerciseUse.get(item.id) || 0) + 1);
    const splitLabel = resolvedSplit === 'full_body' ? 'Całe ciało' : resolvedSplit === 'upper_lower' ? (day % 2 ? 'Dół' : 'Góra') : resolvedSplit === 'push_pull' ? (day % 2 ? 'Pull' : 'Push') : resolvedSplit === 'push_pull_legs' ? ['Push', 'Pull', 'Nogi'][day % 3] : `Własny ${day + 1}`;
    return { id: `generated-${planId}-${day + 1}`, title: `Do sprawdzenia · ${splitLabel} · dzień ${day + 1}`, ...(scheduleDays.length ? { dayOfWeek: scheduleDays[day] } : {}), exercises: chosen.slice(0, targetCount).map(item => ({ key: item.id, sets: setsPerExercise, target: goal === 'strength' ? '4-6' : '8-12' })) };
  });
  const thinSessions = sessions.map((session, index) => session.exercises.length < 2 ? index + 1 : null).filter(Boolean);
  if (thinSessions.length) return failure('INSUFFICIENT_CATALOG_COVERAGE', { availableExerciseIds: candidates.map(item => item.id), thinSessions });
  const missing = GAP_PATTERNS.slice();
  const volume = { primary: Object.fromEntries(GROUPS.map(group => [group, 0])), secondary: Object.fromEntries(GROUPS.map(group => [group, 0])) };
  sessions.forEach(session => session.exercises.forEach(exercise => {
    const groups = MAP[exercise.key].groups;
    if (groups[0]) volume.primary[groups[0]] += exercise.sets;
    groups.slice(1).forEach(group => { volume.secondary[group] += exercise.sets; });
  }));
  const weekly = Object.fromEntries(GROUPS.map(group => [group, volume.primary[group] + volume.secondary[group] * 0.5]));
  const sessionTimes = sessions.map(session => {
    const exerciseCount = session.exercises.length;
    const setCount = session.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    const low = Math.ceil((6 * 60 + setCount * 40 + Math.max(0, setCount - exerciseCount) * 120 + exerciseCount * 35) / 60);
    return { low, high: low + Math.max(5, Math.ceil(exerciseCount * 1.5)) };
  });
  const goalNotes = {
    fat_loss: 'Plan oporowy nie obiecuje redukcji ani tempa utraty masy; cardio i żywienie pozostają poza tym modułem (S09–S10).',
    hypertrophy: 'Objętość można dostosować; brak uniwersalnego minimum serii dla każdej osoby (S01–S02).',
    strength: 'Ustawiono roboczy zakres 4–6 powtórzeń; ciężar wybierasz samodzielnie i nie trzeba testować 1RM (S01, S03).',
    recomposition: 'Plan nie przewiduje indywidualnych zmian składu ciała ani ich tempa.',
    fitness: 'Ta propozycja obejmuje wyłącznie ćwiczenia oporowe; katalog nie zapewnia pełnego modułu cardio (S08, S10–S11).',
    maintenance: 'Plan nie wymusza stałego zwiększania ciężaru; dostosuj go do samopoczucia i celu.'
  };
  if (attributes.returnAfterBreak === true) goalNotes[goal] += ' Zaznaczono powrót po przerwie — potraktuj plan jako szkic i oceń tolerancję objętości przed każdym zwiększeniem.';
  const historyInfluenced = useHistory && recent.size > 0;
  return {
    ok: true,
    plan: { title: 'Plan wygenerowany · do sprawdzenia', split: resolvedSplit, goal, sessions, requiresReview: true, generation: { modelVersion: 3, requestedSplit: split, goal, experience: attributes.experience || null, returnAfterBreak: attributes.returnAfterBreak === true, historyInfluenced, sources: ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S08', 'S09', 'S10', 'S11'], defaultsNote } },
    plans: sessions,
    coverage: { complete: missing.length === 0, missing, missingGroups },
    volume: { primary: volume.primary, secondary: volume.secondary, weekly, model: 'Primary sets count as 1; secondary sets are shown separately and approximated as 0.5 for the weekly estimate.' },
    timeEstimateMinutes: { low: Math.min(...sessionTimes.map(value => value.low)), high: Math.max(...sessionTimes.map(value => value.high)) },
    ignoredFavorites: favoriteExerciseIds.filter(id => !candidates.some(item => item.id === id)),
    notes: ['Plan jest propozycją; sprawdź go i dostosuj przed użyciem.', 'W katalogu brakuje zawiasu biodrowego, ćwiczeń na łydki i core. Nie przedstawiam planu jako pełnego pokrycia ciała.', 'Ciężar dobiera użytkownik. Generator nie wylicza go z wieku, płci ani masy ciała.', goalNotes[goal], historyInfluenced ? 'Poprzednie ćwiczenia wykorzystano wyłącznie do priorytetyzacji znanych użytkownikowi ruchów, bez wyliczania ciężarów.' : 'Historia nie wpływa na propozycję, chyba że włączysz tę opcję.']
  };
}

/** Descriptive audit for saved manual plans. It never changes a plan or prescribes load. */
export function analyzeManualPlans({ plans = [], profile = {}, catalog = [] } = {}) {
  const attributes = profile?.attributes || profile;
  const restrictions = new Set(attributes?.restrictions || []);
  const equipment = new Set(attributes?.equipment || []);
  const catalogIds = new Set(catalog.map(item => item?.id).filter(id => typeof id === 'string'));
  const volume = { primary: Object.fromEntries(GROUPS.map(group => [group, 0])), secondary: Object.fromEntries(GROUPS.map(group => [group, 0])) };
  const unmappedExerciseIds = new Set();
  const equipmentMissingIds = new Set();
  const excludedExerciseIds = new Set();
  const timeByPlan = [];
  const scheduledDays = new Map();

  for (const plan of Array.isArray(plans) ? plans : []) {
    if (!plan || !Array.isArray(plan.exercises)) continue;
    if (WEEKDAYS.includes(plan.dayOfWeek)) scheduledDays.set(plan.dayOfWeek, [...(scheduledDays.get(plan.dayOfWeek) || []), plan.id]);
    let setCount = 0;
    let restSeconds = 0;
    let exerciseCount = 0;
    for (const exercise of plan.exercises) {
      if (!exercise || typeof exercise.key !== 'string') continue;
      exerciseCount += 1;
      const sets = Number.isInteger(Number(exercise.sets)) ? Math.min(12, Math.max(1, Number(exercise.sets))) : 0;
      setCount += sets;
      const mapping = MAP[exercise.key];
      if (!m