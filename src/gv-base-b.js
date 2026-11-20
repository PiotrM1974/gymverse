(function exposeGymVerseBaseB(root) {
  const DRAFT_KEY = 'gymverse_draft_v1';

  function calculateWorkoutProgress(plan, active) {
    const exercises = plan && Array.isArray(plan.exercises) ? plan.exercises : [];
    const overrides = active && active.setCount && typeof active.setCount === 'object' ? active.setCount : {};
    const required = exercises.reduce((sum, exercise, step) => {
      const override = Number(overrides[step]);
      const planned = Number.isInteger(override) && override >= 1 && override <= 12
        ? override
        : Number(exercise && exercise.sets) || 0;
      return sum + Math.max(0, planned);
    }, 0);
    const uniqueSets = new Set();
    (active && Array.isArray(active.sets) ? active.sets : []).forEach(set => {
      const step = Number(set && set.step);
      const setNumber = Number(set && set.setNumber);
      if (Number.isInteger(step) && step >= 0 && step < exercises.length && Number.isInteger(setNumber) && setNumber > 0) {
        uniqueSets.add(`${step}:${setNumber}`);
      }
    });
    const completed = uniqueSets.size;
    return { required, completed, missing: Math.max(0, required - completed), excess: Math.max(0, completed - required) };
  }

  function persistJsonTransaction(storage, updates) {
    const entries = Object.entries(updates || {}).map(([key, value]) => [key, value === null ? null : JSON.stringify(value)]);
    const before = new Map(entries.map(([key]) => [key, storage.getItem(key)]));
    const attempted = [];
    try {
      for (const [key, value] of entries) {
        attempted.push(key);
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
        if (storage.getItem(key) !== value) {
          const error = new Error(`Storage read-back mismatch for ${key}`);
          error.name = 'StorageVerificationError';
          throw error;
        }
      }
      return true;
    } catch (error) {
      const rollbackErrors = [];
      for (const key of attempted.reverse()) {
        try {
          const previous = before.get(key);
          if (previous === null) storage.removeItem(key);
          else storage.setItem(key, previous);
          if (storage.getItem(key) !== previous) throw new Error(`Storage rollback mismatch for ${key}`);
        } catch (rollbackError) { rollbackErrors.push(rollbackError); }
      }
      if (rollbackErrors.length) error.rollbackErrors = rollbackErrors;
      throw error;
    }
  }

  function readDraftPayload(storage) {
    try {
      const raw = storage.getItem(DRAFT_KEY);
      const payload = raw == null ? null : JSON.parse(raw);
      return payload && payload.version === 1 && Array.isArray(payload.items)
        ? { version: 1, items: payload.items.filter(item => item && typeof item.planId === 'string' && typeof item.sessionId === 'string' && Number.isInteger(item.step) && Number.isInteger(item.setNumber)) }
        : { version: 1, items: [] };
    } catch (_) { return { version: 1, items: [] }; }
  }

  function sameDraftRow(a, b) {
    return a.planId === b.planId && a.sessionId === String(b.sessionId) && a.step === Number(b.step) && a.setNumber === Number(b.setNumber);
  }

  function putDraft(storage, draft) {
    const row = {
      planId: String(draft.planId), sessionId: String(draft.sessionId), step: Number(draft.step),
      setNumber: Number(draft.setNumber), weight: String(draft.weight), reps: String(draft.reps),
      updatedAt: Number(draft.updatedAt) || Date.now()
    };
    if (!row.planId || !row.sessionId || !Number.isInteger(row.step) || row.step < 0 || !Number.isInteger(row.setNumber) || row.setNumber < 1) {
      throw new TypeError('Invalid workout draft');
    }
    const payload = readDraftPayload(storage);
    payload.items = payload.items.filter(item => !sameDraftRow(item, row));
    payload.items.push(row);
    persistJsonTransaction(storage, { [DRAFT_KEY]: payload });
    return row;
  }

  function getDraft(storage, query) {
    return readDraftPayload(storage).items.find(item => sameDraftRow(item, query)) || null;
  }

  function draftPayloadWithout(storage, predicate) {
    const payload = readDraftPayload(storage);
    const items = payload.items.filter(item => !predicate(item));
    return items.length ? { version: 1, items } : null;
  }

  function removeDraft(storage, query) {
    const payload = readDraftPayload(storage);
    const items = payload.items.filter(item => !sameDraftRow(item, query));
    if (items.length === payload.items.length) return false;
    persistJsonTransaction(storage, { [DRAFT_KEY]: items.length ? { version: 1, items } : null });
    return true;
  }

  root.GymVerseBaseB = Object.freeze({
    DRAFT_KEY,
    calculateWorkoutProgress,
    persistJsonTransaction,
    readDraftPayload,
    putDraft,
    getDraft,
    draftPayloadWithout,
    removeDraft
  });
})(globalThis);
