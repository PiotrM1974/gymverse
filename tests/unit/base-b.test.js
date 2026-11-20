import '../../src/gv-base-b.js';
import { describe, expect, it } from 'vitest';

const { calculateWorkoutProgress, persistJsonTransaction, putDraft, getDraft, removeDraft } = globalThis.GymVerseBaseB;

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(String(key)); }
}

describe('GV-BASE-B core regressions', () => {
  it('counts skipped exercises and manual setCount changes as required work', () => {
    const progress = calculateWorkoutProgress(
      { exercises: [{ sets: 2 }, { sets: 2 }, { sets: 1 }] },
      { setCount: { 0: 1 }, sets: [{ step: 0, setNumber: 1 }, { step: 2, setNumber: 1 }] }
    );
    expect(progress).toEqual({ required: 4, completed: 2, missing: 2, excess: 0 });
  });

  it('reports excess sets separately and does not count duplicate records twice', () => {
    const progress = calculateWorkoutProgress(
      { exercises: [{ sets: 2 }] },
      { sets: [{ step: 0, setNumber: 1 }, { step: 0, setNumber: 1 }, { step: 0, setNumber: 2 }, { step: 0, setNumber: 3 }] }
    );
    expect(progress).toEqual({ required: 2, completed: 3, missing: 0, excess: 1 });
  });

  it('keeps zero completed series incomplete', () => {
    expect(calculateWorkoutProgress({ exercises: [{ sets: 3 }] }, { sets: [] }))
      .toEqual({ required: 3, completed: 0, missing: 3, excess: 0 });
  });

  it('rolls back an earlier key if a later localStorage write fails', () => {
    const storage = new MemoryStorage();
    storage.setItem('gymverse_history', 'old-history');
    const setItem = storage.setItem.bind(storage);
    storage.setItem = (key, value) => {
      if (key === 'gymverse_last_weights') throw new DOMException('full', 'QuotaExceededError');
      setItem(key, value);
    };

    let failure;
    try {
      persistJsonTransaction(storage, {
        gymverse_history: [{ date: 'synthetic' }],
        gymverse_last_weights: { synthetic: [] }
      });
    } catch (error) { failure = error; }
    expect(failure && failure.name).toBe('QuotaExceededError');
    expect(storage.getItem('gymverse_history')).toBe('old-history');
    expect(storage.getItem('gymverse_last_weights')).toBeNull();
  });

  it('persists unfinished draft strings, finds them by session and removes only the matching row', () => {
    const storage = new MemoryStorage();
    const draft = { planId: 'push_a1', sessionId: 'synthetic-session', step: 2, setNumber: 1, weight: '40,', reps: '8', updatedAt: 1 };
    putDraft(storage, draft);
    expect(getDraft(storage, draft)).toMatchObject({ weight: '40,', reps: '8' });
    expect(removeDraft(storage, draft)).toBe(true);
    expect(getDraft(storage, draft)).toBeNull();
  });
});
