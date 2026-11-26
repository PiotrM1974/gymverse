import { describe, expect, it } from 'vitest';
import { resolveHighlightMode, sortMusclePaths } from '../../src/features/anatomy/highlight-engine.js';

describe('MuscleMap highlight engine', () => {
  it('falls back to original when a requested blend mode is unsupported', () => {
    expect(resolveHighlightMode('refined', { color: false, multiply: true })).toBe('original');
    expect(resolveHighlightMode('texture-aware', { color: true, multiply: false })).toBe('original');
    expect(resolveHighlightMode('refined', { color: true, multiply: true })).toBe('refined');
    expect(resolveHighlightMode('texture-aware', { color: true, multiply: true })).toBe('texture-aware');
    expect(resolveHighlightMode('unknown', { color: true, multiply: true })).toBe('original');
  });

  it('draws neutral first, secondary second, primary last while preserving source order within roles', () => {
    const paths = [{ id: 'p1' }, { id: 's1' }, { id: 'n1' }, { id: 's2' }, { id: 'p2' }];
    const role = { p1: 'primary', p2: 'primary', s1: 'secondary', s2: 'secondary', n1: 'neutral' };
    expect(sortMusclePaths(paths, path => role[path.id]).map(path => path.id)).toEqual(['n1', 's1', 's2', 'p1', 'p2']);
  });
});
