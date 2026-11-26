import { describe, expect, it } from 'vitest';
import { analyzeExerciseProgression } from '../../src/features/plans/progression.js';

const catalog = [{ id: 'bench_flat', name: 'Wyciskanie leżąc' }];

describe('exercise progression review', () => {
  it('proposes only a review after two distinct sessions meet every planned rep target', () => {
    const result = analyzeExerciseProgression({
      exerciseId: 'bench_flat',
      plan: { id: 'push-a', title: 'Push A', exercises: [{ key: 'bench_flat', sets: 3, target: '8-10' }] },
      catalog,
      history: [
        { id: 'session-a', date: '2026-01-01T10:00:00.000Z', details: [1, 2, 3].map(setNumber => ({ exerciseId: 'bench_flat', setNumber, weight: 40, reps: 11, rir: 2 })) },
        { id: 'session-b', date: '2026-01-08T10:00:00.000Z', details: [1, 2, 3].map(setNumber => ({ exerciseId: 'bench_flat', setNumber, weight: 40, reps: 11, rir: 2 })) }
      ]
    });
    expect(result.proposal).toMatchObject({ type: 'review-smallest-load-increase', currentLoad: 40, approvalRequired: true, evidenceSessionIds: ['session-a', 'session-b'] });
  });

  it('does not recommend a load increase until the user exceeds the top of the rep range', () => {
    const result = analyzeExerciseProgression({
      exerciseId: 'bench_flat',
      plan: { id: 'push-a', exercises: [{ key: 'bench_flat', sets: 3, target: '8-10' }] }, catalog,
      history: [
        { id: 'session-a', date: '2026-01-01', details: [1, 2, 3].map(setNumber => ({ exerciseId: 'bench_flat', setNumber, weight: 40, reps: 11 })) },
        { id: 'session-b', date: '2026-01-08', details: [11, 11, 10].map((reps, index) => ({ exerciseId: 'bench_flat', setNumber: index + 1, weight: 40, reps })) }
      ]
    });
    expect(result.proposal).toBeNull();
    expect(result.reason).toBe('REP_TARGET_NOT_EXCEEDED');
  });

  it('does not treat a logged bodyweight session as a load increase opportunity', () => {
    const result = analyzeExerciseProgression({
      exerciseId: 'pushup',
      plan: { id: 'bodyweight', exercises: [{ key: 'pushup', sets: 2, target: '8-10' }] },
      catalog: [{ id: 'pushup', metadata: { executionMode: 'bodyweight', loadUnit: 'additional_weight' } }],
      history: ['a', 'b'].map((id, index) => ({ id, date: `2026-01-0${index + 1}`, details: [1, 2].map(setNumber => ({ exerciseId: 'pushup', setNumber, weight: 0, reps: 11 })) }))
    });
    expect(result.proposal).toBeNull();
    expect(result.reason).toBe('BODYWEIGHT_LOAD_UNAVAILABLE');
  });

  it('requires the expected number of logged sets and a catalog exercise', () => {
    const partial = analyzeExerciseProgression({
      exerciseId: 'bench_flat',
      plan: { id: 'push-a', exercises: [{ key: 'bench_flat', sets: 3, target: '8-10' }] }, catalog,
      history: [1, 2].map((day, index) => ({ id: `session-${index}`, date: `2026-01-0${day}`, details: [{ exerciseId: 'bench_flat', setNumber: 1, weight: 40, reps: 10 }] }))
    });
    expect(partial.proposal).toBeNull();
    expect(partial.reason).toBe('INSUFFICIENT_COMPLETED_SETS');
    expect(analyzeExerciseProgression({ exerciseId: 'unknown', plan: { exercises: [] }, history: [], catalog }).reason).toBe('EXERCISE_NOT_IN_CATALOG');
  });

  it('does not count a duplicated history record as a second training session', () => {
    const session = { id: 'same-session', date: '2026-01-01', details: [1, 2, 3].map(setNumber => ({ exerciseId: 'bench_flat', setNumber, weight: 40, reps: 11 })) };
    const result = analyzeExerciseProgression({
      exerciseId: 'bench_flat', plan: { exercises: [{ key: 'bench_flat', sets: 3, target: '8-10' }] }, catalog,
      history: [session, { ...session, date: '2026-01-08' }]
    });
    expect(result.proposal).toBeNull();
    expect(result.reason).toBe('INSUFFICIENT_SESSIONS');
  });

  it('uses RIR as an optional caution signal when the user has recorded it', () => {
    const result = analyzeExerciseProgression({
      exerciseId: 'bench_flat',
      plan: { id: 'push-a', exercises: [{ key: 'bench_flat', sets: 3, target: '8-10' }] }, catalog,
      history: [
        { id: 'session-a', date: '2026-01-01', details: [1, 2, 3].map(setNumber => ({ exerciseId: 'bench_flat', setNumber, weight: 40, reps: 11, rir: 5 })) },
        { id: 'session-b', date: '2026-01-08', details: [1, 2, 3].map(setNumber => ({ exerciseId: 'bench_flat', setNumber, weight: 40, reps: 11, rir: 5 })) }
      ]
    });
    expect(result.proposal).toBeNull();
    expect(result.reason).toBe('EFFORT_NOT_HIGH_ENOUGH');
  });
});
