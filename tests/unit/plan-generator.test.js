import { describe, expect, it } from 'vitest';
import { EXERCISE_CATALOG } from '../../src/exercise/catalog.js';
import { analyzeManualPlans, generatePlan, GENERATOR_CATALOG_MAP, getExerciseAlternatives } from '../../src/features/plans/generator.js';

const adult = { age: 34, experience: 'beginner', equipment: ['machines', 'dumbbells', 'bench', 'cables'], restrictions: [] };

describe('evidence-aware plan generator', () => {
  it('audits manual weekly plans for volume, equipment, exclusions and unknown exercises', () => {
    const result = analyzeManualPlans({
      plans: [
        { id: 'manual-a', title: 'Plan A', dayOfWeek: 'mon', exercises: [{ key: 'bench_flat', sets: 3, target: '6-8', restSeconds: 60 }, { key: 'custom_unknown', sets: 2, target: '8-12' }] },
        { id: 'manual-b', title: 'Plan B', dayOfWeek: 'thu', exercises: [{ key: 'leg_press', sets: 2, target: '10-12' }] }
      ],
      profile: { ...adult, equipment: ['machines'], restrictions: ['leg_press'] },
      catalog: EXERCISE_CATALOG
    });
    expect(result.volume.primary.chest).toBe(3);
    expect(result.volume.primary.quads).toBe(2);
    expect(result.unmappedExerciseIds).toEqual(['custom_unknown']);
    expect(result.findings.map(item => item.code)).toEqual(expect.arrayContaining(['EQUIPMENT_MISSING', 'PROFILE_EXCLUSION', 'UNMAPPED_EXERCISE', 'CATALOG_GAPS']));
    expect(result.timeByPlan.map(item => item.planId)).toEqual(['manual-a', 'manual-b']);
  });
  it('has an explicit metadata mapping for every approved base exercise and no others', () => {
    expect(Object.keys(GENERATOR_CATALOG_MAP).sort()).toEqual(EXERCISE_CATALOG.map(item => item.id).sort());
  });
  it('offers only catalog substitutions that keep the primary group and respect equipment and movement exclusions', () => {
    const alternatives = getExerciseAlternatives({ exerciseId: 'bench_flat', equipment: ['machines'], restrictions: [], excludedExerciseIds: [], existingExerciseIds: [], catalog: EXERCISE_CATALOG });
    expect(alternatives.map(item => item.id)).toEqual(expect.arrayContaining(['chest_machine', 'pec_deck']));
    expect(alternatives.every(item => GENERATOR_CATALOG_MAP[item.id].groups[0] === 'chest')).toBe(true);
    expect(alternatives).not.toContainEqual(expect.objectContaining({ id: 'shoulder_press' }));
    const restricted = getExerciseAlternatives({ exerciseId: 'bench_flat', equipment: ['machines'], restrictions: ['overhead_press'], excludedExerciseIds: ['chest_machine'], existingExerciseIds: ['pec_deck'], catalog: EXERCISE_CATALOG });
    expect(restricted).toEqual([]);
  });
  it('only uses catalog exercises and reports uncovered movement needs', () => {
    const result = generatePlan({ profile: adult, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest', 'back', 'quads', 'hamstrings'] }, catalog: EXERCISE_CATALOG });
    expect(result.ok).toBe(true);
    expect(result.plans.flatMap(plan => plan.exercises).every(item => EXERCISE_CATALOG.some(row => row.id === item.key))).toBe(true);
    expect(result.coverage.complete).toBe(false);
    expect(result.coverage.missing).toEqual(expect.arrayContaining(['hip_hinge', 'calves', 'core']));
    expect(result.plan.requiresReview).toBe(true);
  });
  it('does not generate an adult prescription for minors', () => {
    expect(generatePlan({ profile: { ...adult, age: 17 }, preferences: { daysPerWeek: 3 }, catalog: EXERCISE_CATALOG })).toMatchObject({ ok: false, reason: 'ADULTS_ONLY' });
  });
  it('reports insufficient equipment and movement restrictions instead of inventing an exercise', () => {
    const result = generatePlan({ profile: { ...adult, equipment: ['bodyweight'], restrictions: ['overhead_press', 'deep_knee_flexion'] }, preferences: { daysPerWeek: 3, split: 'full_body' }, catalog: EXERCISE_CATALOG });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('INSUFFICIENT_CATALOG_COVERAGE');
    expect(result.plan).toBeNull();
  });
  it('honors movement exclusions such as overhead pressing and floor exercises', () => {
    const result = generatePlan({ profile: { ...adult, restrictions: ['overhead_press', 'floor_exercises'] }, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest', 'back', 'quads', 'hamstrings', 'glutes', 'shoulders', 'biceps', 'triceps'] }, catalog: EXERCISE_CATALOG });
    expect(result.ok).toBe(true);
    expect(result.plans.flatMap(plan => plan.exercises).some(item => ['shoulder_press', 'pushup'].includes(item.key))).toBe(false);
  });
  it('honors profile exclusions for a specific catalog exercise', () => {
    const result = generatePlan({ profile: { ...adult, restrictions: ['db_bench'] }, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest'], favoriteExerciseIds: ['db_bench'] }, catalog: EXERCISE_CATALOG });
    expect(result.ok).toBe(true);
    expect(result.plans.flatMap(plan => plan.exercises.map(exercise => exercise.key))).not.toContain('db_bench');
  });
  it('requires every part of a multi-piece setup such as barbell plus bench', () => {
    const result = generatePlan({ profile: { ...adult, equipment: ['bench'] }, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest'] }, catalog: EXERCISE_CATALOG });
    expect(result).toMatchObject({ ok: false, reason: 'INSUFFICIENT_CATALOG_COVERAGE' });
    expect(result.availableExerciseIds).not.toContain('bench_flat');
    expect(result.availableExerciseIds).not.toContain('db_bench');
  });
  it('rejects unsupported day counts and invalid split combinations', () => {
    expect(generatePlan({ profile: adult, preferences: { daysPerWeek: 0, split: 'full_body' }, catalog: EXERCISE_CATALOG })).toMatchObject({ ok: false, reason: 'PREFERENCES_INVALID' });
    expect(generatePlan({ profile: adult, preferences: { daysPerWeek: 2, split: 'push_pull_legs' }, catalog: EXERCISE_CATALOG })).toMatchObject({ ok: false, reason: 'PREFERENCES_INVALID' });
  });
  it('applies the selected goal, exercise exclusions, favorites, and opt-in history', () => {
    const result = generatePlan({
      profile: adult,
      preferences: { daysPerWeek: 3, split: 'full_body', sessionMinutes: 45, focus: ['chest', 'back'], goal: 'strength', favoriteExerciseIds: ['db_bench'], excludedExerciseIds: ['db_incline'], useHistory: true, recentExerciseIds: ['row_machine'] },
      catalog: EXERCISE_CATALOG
    });
    expect(result.ok).toBe(true);
    expect(result.plans.flatMap(plan => plan.exercises.map(exercise => exercise.key))).toContain('db_bench');
    expect(result.plans.flatMap(plan => plan.exercises.map(exercise => exercise.key))).not.toContain('db_incline');
    expect(result.plan.generation).toMatchObject({ goal: 'strength', historyInfluenced: true });
    expect(result.plan.goal).toBe('strength');
    expect(result.volume).toHaveProperty('weekly');
    expect(result.timeEstimateMinutes.low).toBeLessThanOrEqual(result.timeEstimateMinutes.high);
  });
  it('does not use history unless explicitly requested and rejects unknown exercise preferences', () => {
    const result = generatePlan({ profile: adult, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest', 'back'], recentExerciseIds: ['bench_flat'] }, catalog: EXERCISE_CATALOG });
    expect(result.ok).toBe(true);
    expect(result.plan.generation.historyInfluenced).toBe(false);
    expect(generatePlan({ profile: adult, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest'], excludedExerciseIds: ['unknown_exercise'] }, catalog: EXERCISE_CATALOG })).toMatchObject({ ok: false, reason: 'PREFERENCES_INVALID' });
  });
  it('starts with fewer editable sets when the adult profile reports returning after a break', () => {
    const result = generatePlan({ profile: { ...adult, returnAfterBreak: true }, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest', 'back'] }, catalog: EXERCISE_CATALOG });
    expect(result.ok).toBe(true);
    expect(result.plans.flatMap(plan => plan.exercises.map(exercise => exercise.sets))).toEqual(expect.arrayContaining([1]));
    expect(result.plans.every(plan => plan.exercises.every(exercise => exercise.sets === 1))).toBe(true);
    expect(result.plan.generation.defaultsNote).toContain('heurystyka');
  });
  it('uses selected weekdays when their count matches the training frequency', () => {
    const result = generatePlan({ profile: adult, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest', 'back'], scheduleDays: ['mon', 'wed', 'fri'] }, catalog: EXERCISE_CATALOG });
    expect(result.ok).toBe(true);
    expect(result.plans.map(plan => plan.dayOfWeek)).toEqual(['mon', 'wed', 'fri']);
    expect(generatePlan({ profile: adult, preferences: { daysPerWeek: 3, split: 'full_body', focus: ['chest'], scheduleDays: ['mon', 'fri'] }, catalog: EXERCISE_CATALOG })).toMatchObject({ ok: false, reason: 'PREFERENCES_INVALID' });
  });
  it('supports a one-day full-body schedule and a custom muscle split without inventing exercises', () => {
    const onceWeekly = generatePlan({ profile: adult, preferences: { daysPerWeek: 1, split: 'full_body', focus: ['chest', 'back'] }, catalog: EXERCISE_CATALOG });
    expect(onceWeekly.ok).toBe(true);
    expect(onceWeekly.plans).toHaveLength(1);
    const custom = generatePlan({ profile: adult, preferences: {
      daysPerWeek: 2, split: 'custom', focus: ['chest', 'back', 'quads', 'hamstrings'],
      customSplitFocus: [['chest', 'back'], ['quads', 'hamstrings']]
    }, catalog: EXERCISE_CATALOG });
    expect(custom.ok).toBe(true);
    expect(custom.plans).toHaveLength(2);
    expect(custom.plans[0].exercises.some(item => ['bench_flat', 'db_incline', 'db_bench', 'chest_machine'].includes(item.key))).toBe(true);
    expect(custom.plans[1].exercises.some(item => ['leg_press', 'leg_curl', 'leg_extension', 'smith_squat'].includes(item.key))).toBe(true);
    expect(custom.plans.flatMap(plan => plan.exercises).every(item => EXERCISE_CATALOG.some(row => row.id === item.key))).toBe(true);
    expect(custom.plan.generation).toMatchObject({ experience: 'beginner', returnAfterBreak: false });
    expect(custom.plans.every(plan => plan.title.length <= 40 && plan.title.includes('Do sprawdzenia'))).toBe(true);
  });
  it('refuses a custom split day when its selected muscle group has no compatible catalog exercise', () => {
    const result = generatePlan({ profile: { ...adult, equipment: ['cables'] }, preferences: {
      daysPerWeek: 2, split: 'custom', focus: ['triceps'], customSplitFocus: [['chest'], ['triceps']]
    }, catalog: EXERCISE_CATALOG });
    expect(result).toMatchObject({ ok: false, reason: 'INSUFFICIENT_CATALOG_COVERAGE', missingSplitGroups: [{ day: 1, groups: ['chest'] }] });
  });
  it('keeps every generated title within the existing 40-character plan limit', () => {
    const cases = [['full_body', 1], ['push_pull', 2], ['upper_lower', 2], ['push_pull_legs', 3], ['auto', 5]];
    for (const [split, daysPerWeek] of cases) {
      const result = generatePlan({ profile: adult, preferences: { daysPerWeek, split, focus: ['chest', 'back', 'quads', 'hamstrings'] }, catalog: EXERCISE_CATALOG });
      expect(result.ok).toBe(true);
      expect(result.plans.every(plan => plan.title.length <= 40 && plan.title.includes('Do sprawdzenia'))).toBe(true);
    }
  });
});
