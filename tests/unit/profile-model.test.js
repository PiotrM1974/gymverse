import { describe, expect, it } from 'vitest';
import { bootstrapProfileState, createProfile, deleteProfile, exportProfileSnapshot, importProfileSnapshot, PROFILE_STORAGE_KEY, switchProfile, updateProfile } from '../../src/features/profiles/profile-model.js';

describe('profile model migration and isolation', () => {
  const legacy = { gymverse_history: JSON.stringify([{ id: 'old-session' }]), gymverse_plans: JSON.stringify([{ id: 'push_a1' }]), gymverse_rest: '90' };
  it('migrates the existing single-user snapshot intact into a default profile', () => {
    const { state, updates } = bootstrapProfileState(legacy, { createdAt: '2026-11-24T00:00:00.000Z' });
    expect(state.profiles[0].data).toEqual(legacy);
    expect(state.activeProfileId).toBe('legacy-default-profile');
    expect(updates[PROFILE_STORAGE_KEY]).toEqual(state);
    expect(state.onboardingRequired).toBe(false);
    expect(state.legacyUpgradePending).toBe(true);
  });
  it('marks a brand-new local store for optional profile setup', () => {
    const initialized = bootstrapProfileState({});
    expect(initialized.state.onboardingRequired).toBe(true);
    expect(initialized.state.legacyUpgradePending).toBe(false);
    expect(initialized.updates[PROFILE_STORAGE_KEY]).toEqual(initialized.state);
  });
  it('is idempotent when profiles have already been initialized', () => {
    const first = bootstrapProfileState(legacy, { createdAt: '2026-11-24T00:00:00.000Z' });
    const second = bootstrapProfileState({ ...legacy, [PROFILE_STORAGE_KEY]: JSON.stringify(first.state) });
    expect(second.state).toEqual(first.state);
    expect(second.updates).toEqual({});
  });
  it('creates a bounded, named empty profile without changing the active one', () => {
    const state = bootstrapProfileState(legacy).state;
    const result = createProfile(state, { name: 'Ania', age: 34, sex: 'female', heightCm: 168, weightKg: 64, experience: 'beginner', equipment: ['dumbbells'], restrictions: ['avoid_overhead_press'] }, { id: 'profile-ania-0001' });
    expect(result.state.activeProfileId).toBe(state.activeProfileId);
    expect(result.profile.data).toEqual({});
    expect(result.profile.attributes).toEqual({ age: 34, sex: 'female', heightCm: 168, weightKg: 64, experience: 'beginner', returnAfterBreak: null, equipment: ['dumbbells'], restrictions: ['avoid_overhead_press'] });
    expect(() => createProfile(state, { name: '   ' }, { id: 'profile-ania-0002' })).toThrow('PROFILE_NAME_REQUIRED');
    expect(() => createProfile(state, { name: 'Niepełnoletni', age: 17.5 }, { id: 'profile-ania-0003' })).toThrow('PROFILE_AGE_INVALID');
    expect(() => createProfile(state, { name: 'Zły sprzęt', equipment: ['spaceship'] }, { id: 'profile-ania-0004' })).toThrow('PROFILE_EQUIPMENT_INVALID');
  });
  it('switches all legacy data atomically and clears keys absent from the target profile', () => {
    const state = bootstrapProfileState(legacy).state;
    const added = createProfile(state, { name: 'Ania' }, { id: 'profile-ania-0001' }).state;
    const result = switchProfile(added, legacy, 'profile-ania-0001');
    expect(result.updates.gymverse_history).toBeNull();
    expect(result.updates.gymverse_plans).toBeNull();
    expect(result.updates.gymverse_rest).toBeNull();
    expect(result.updates[PROFILE_STORAGE_KEY].activeProfileId).toBe('profile-ania-0001');
  });
  it('records a configured profile weight once as its first body measurement', () => {
    const state = bootstrapProfileState(legacy).state;
    const withNew = createProfile(state, { name: 'Ania', weightKg: 64 }, { id: 'profile-ania-0001', createdAt: '2026-11-27T10:00:00.000Z' }).state;
    const first = switchProfile(withNew, legacy, 'profile-ania-0001', { bodyMeasurementDate: '2026-11-27' });
    const baseline = JSON.stringify([{ date: '2026-11-27', kg: 64 }]);
    expect(first.updates.gymverse_body).toBe(baseline);
    const switchedAway = switchProfile(first.state, { ...legacy, gymverse_body: baseline }, 'legacy-default-profile');
    const switchedBack = switchProfile(switchedAway.state, legacy, 'profile-ania-0001');
    expect(switchedBack.updates.gymverse_body).toBe(baseline);
    const edited = updateProfile(switchedBack.state, 'profile-ania-0001', { name: 'Ania', weightKg: 68 });
    expect(edited.profile.attributes.weightKg).toBe(68);
    expect(edited.profile.data.gymverse_body).toBe(baseline);
  });
  it('does not invent an initial body measurement when no profile weight was entered', () => {
    const state = bootstrapProfileState(legacy).state;
    const withNew = createProfile(state, { name: 'Ania' }, { id: 'profile-ania-0001' }).state;
    expect(switchProfile(withNew, legacy, 'profile-ania-0001', { bodyMeasurementDate: '2026-11-27' }).updates.gymverse_body).toBeNull();
  });
  it('backfills an active profile weight on startup only when its measurement key is missing', () => {
    const state = bootstrapProfileState({}).state;
    const withWeight = updateProfile(state, state.activeProfileId, { name: 'Mój profil', weightKg: 70 }).state;
    const snapshot = { [PROFILE_STORAGE_KEY]: JSON.stringify(withWeight) };
    const backfilled = bootstrapProfileState(snapshot, { bodyMeasurementDate: '2026-11-27' });
    expect(backfilled.updates.gymverse_body).toBe(JSON.stringify([{ date: '2026-11-27', kg: 70 }]));
    expect(bootstrapProfileState({ ...snapshot, gymverse_body: '[]' }).updates).toEqual({});
  });
  it('saves the outgoing snapshot for the next switch back', () => {
    const legacyState = bootstrapProfileState(legacy).state;
    const withNew = createProfile(legacyState, { name: 'Ania' }, { id: 'profile-ania-0001' }).state;
    const switched = switchProfile(withNew, legacy, 'profile-ania-0001');
    const aniaData = { gymverse_history: JSON.stringify([{ id: 'ania-session' }]) };
    const back = switchProfile(switched.state, aniaData, 'legacy-default-profile');
    expect(back.updates.gymverse_history).toBe(legacy.gymverse_history);
    expect(back.state.profiles.find(profile