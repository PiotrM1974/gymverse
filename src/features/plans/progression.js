function parseRepRange(value) {
  const match = typeof value === 'string' && value.match(/^\s*(\d{1,2})\s*[-–]\s*(\d{1,2})\s*$/);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  return min >= 1 && max >= min && max <= 60 ? { min, max } : null;
}

function validLoggedSets(session, exerciseId) {
  if (!Array.isArray(session?.details)) return [];
  const seenSetNumbers = new Set();
  return session.details
    .filter(set => set?.exerciseId === exerciseId && Number.isInteger(Number(set.setNumber)) && Number(set.setNumber) > 0 && Number.isFinite(Number(set.weight)) && Number(set.weight) >= 0 && Number.isInteger(Number(set.reps)) && Number(set.reps) > 0)
    .sort((a, b) => Number(a.setNumber) - Number(b.setNumber))
    .filter(set => {
      const number = Number(set.setNumber);
      if (seenSetNumbers.has(number)) return false;
      seenSetNumbers.add(number);
      return true;
    });
}

/**
 * Descriptive double-progression review. It never assigns a load: a suggestion
 * is emitted only after two distinct logged sessions meet every prescribed set
 * at the top of the plan's rep range and the same load.
 */
export function analyzeExerciseProgression({ exerciseId, plan, history = [], catalog = [] } = {}) {
  const catalogEntry = catalog.find(item => item?.id === exerciseId);
  if (typeof exerciseId !== 'string' || !catalogEntry) return { proposal: null, reason: 'EXERCISE_NOT_IN_CATALOG', trend: [] };
  const exercise = Array.isArray(plan?.exercises) ? plan.exercises.find(item => item?.key === exerciseId) : null;
  if (!exercise) return { proposal: null, reason: 'EXERCISE_NOT_IN_PLAN', trend: [] };
  const target = parseRepRange(exercise.target);
  const expectedSets = Number(exercise.sets);
  if (!target || !Number.isInteger(expectedSets) || expectedSets < 1) return { proposal: null, reason: 'PLAN_TARGET_UNAVAILABLE', trend: [] };

  const sessionIds = new Set();
  const sessions = (Array.isArray(history) ? history : [])
    .map((session, index) => ({ session, index, sets: validLoggedSets(session, exerciseId), time: Date.parse(session?.date) }))
    .filter(row => row.sets.length && Number.isFinite(row.time))
    .filter(row => {
      const id = typeof row.session.id === 'string' && row.session.id ? `id:${row.session.id}` : `row:${row.session.date}:${row.index}`;
      if (sessionIds.has(id)) return false;
      sessionIds.add(id);
      return true;
    })
    .sort((a, b) => a.time - b.time || a.index - b.index);
  const latest = sessions.slice(-3);
  const trend = latest.map(({ session, sets }) => ({
    sessionId: typeof session.id === 'string' ? session.id : null,
    date: session.date,
    setCount: sets.length,
    averageReps: Math.round(sets.reduce((sum, set) => sum + Number(set.reps), 0) / sets.length * 10) / 10,
    loads: [...new Set(sets.map(set => Number(set.weight)))]
  }));
  if (sessions.length < 2) return { proposal: null, reason: 'INSUFFICIENT_SESSIONS', trend };

  const pair = sessions.slice(-2);
  if (pair.some(row => row.sets.length < expectedSets)) return { proposal: null, reason: 'INSUFFICIENT_COMPLETED_SETS', trend };
  if (pair.some(row => row.sets.slice(0, expectedSets).some(set => Number(set.reps) < target.max))) return { proposal: null, reason: 'REP_TARGET_NOT_MET', trend };
  if (pair.some(row => row.sets.slice(0, expectedSets).some(set => Number(set.reps) < target.max + 1))) return { proposal: null, reason: 'REP_TARGET_NOT_EXCEEDED', trend };
  const weights = pair.map(row => row.sets.slice(0, expectedSets).map(set => Number(set.weight)));
  const sameLoad = weights.every(row => row.every(weight => weight === row[0])) && weights[0][0] === weights[1][0];
  if (!sameLoad) return { proposal: null, reason: 'LOAD_NOT_STABLE', trend };
  if (catalogEntry.metadata?.executionMode === 'bodyweight' && catalogEntry.metadata?.loadUnit === 'additional_weight' && weights[1][0] <= 0) {
    return { proposal: null, reason: 'BODYWEIGHT_LOAD_UNAVAILABLE', trend };
  }

  const hasRir = pair.some(row => row.sets.slice(0, expectedSets).some(set => set.rir != null && set.rir !== ''));
  if (hasRir && pair.some(row => row.sets.slice(0, expectedSets).some(set => !Number.isInteger(Number(set.rir)) || Number(set.rir) < 0 || Number(set.rir) > 3))) {
    return { proposal: null, reason: 'EFFORT_NOT_HIGH_ENOUGH', trend };
  }

  return {
    proposal: {
      type: 'review-smallest-load-increase',
      currentLoad: weights[1][0],
      targetReps: target,
      expectedSets,
      evidenceSessionIds: pair.map(row => typeof row.session.id === 'string' ? row.session.id : null),
      approvalRequired: true,
      sources: ['S13'],
      note: 'Przekroczenie celu i wskazówka S13 2–10% są stosowane tylko jako kontekst, nie automatyczna dawka ani indywidualna prognoza. Wybierz zmianę samodzielnie.'
    },
    reason: null,
    trend
  };
}
