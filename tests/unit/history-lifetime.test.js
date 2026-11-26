import { expect, test } from 'vitest';
import { lifetimeTrainingStats } from '../../src/features/plans/history-context.js';

test('lifetime totals include only completed unique records and calculate legacy volume without mutating history', () => {
  const history = [
    { id: 'saved-a', date: '2020-01-01', totalVolume: 200, details: [{ exerciseId: 'bench_flat', weight: 40, reps: 5 }] },
    { id: 'saved-a', date: '2020-01-01', totalVolume: 200, details: [{ exerciseId: 'bench_flat', weight: 40, reps: 5 }] },
    { id: 'legacy-no-total', date: '2021-01-01', details: [{ exerciseId: 'bench_flat', weight: 30, reps: 5 }] },
    { id: 'manual-empty', date: '2022-01-01', totalVolume: 0, details: [] },
    { id: 'invalid', date: '2023-01-01', details: [{ exerciseId: '', weight: 30, reps: 0 }] }
  ];
  const before = JSON.stringify(history);
  const result = lifetimeTrainingStats(history, session => session.details.reduce((sum, set) => sum + set.weight * set.reps, 0));
  expect(result).toEqual({ workouts: 2, totalVolume: 350 });
  expect(JSON.stringify(history)).toBe(before);
});
