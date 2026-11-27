import { DRAFT_KEY, readWorkingDrafts } from '../plans/program-drafts.js';
const withoutProgramDrafts = snapshot => { if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return snapshot; const { gymverse_program_drafts_v1, ...profileData } = snapshot; return profileData; };
import { validatePlanPrograms } from '../plans/programs.js';
const PROFILE_STATE_KEY = 'gymverse_profiles_v1';
const APP_KEYS = Object.freeze([
  'gymverse_schema', 'gymverse_history', 'gymverse_active', 'gymverse_plans',
  'gymverse_custom', 'gymverse_body', 'gymverse_last_weights', 'gymverse_rest',
  'gymverse_bar', 'gymverse_last_backup', 'gymverse_deload_until',
  'gymverse_deload_start', 'gymverse_deload_snooze', 'gymverse_goal',
  'gymverse_history_backup_v1', 'gymverse_draft_v1'
]);
const clone = value => structuredClone(value);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const PROFILE_ID = /^[a-z0-9][a-z0-9_-]{7,63}$/i;
const EQUIPMENT = new Set(['bodyweight', 'dumbbells', 'barbell', 'bench', 'cables', 'machines', 'bands', 'pullup_bar', 'dip_bars']);
const EXPERIENCE = new Set(['beginner', 'several_months', 'one_to_three_years', 'over_three_years', 'intermediate', 'advanced']);
const TRAINING_GOALS = new Set(['fat_loss', 'hypertrophy', 'recomposition', 'fitness']);

function newProfileId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (!globalThis.crypto?.getRandomValues) throw new Error('PROFILE_ID_UNAVAILABLE');
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function initialBodyWeight(profile, date) {
  const kg = profile?.attributes?.weightKg;
  if (!Number.isFinite(kg) || kg < 20 || kg > 400) return null;
  const measurementDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date
    : typeof profile?.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(profile.createdAt)
      ? profile.createdAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  return JSON.stringify([{ date: measurementDate, kg }]);
}

function normalizeAttributes(input = {}) {
  if (!record(input)) throw new Error('PROFILE_ATTRIBUTES_INVALID');
  const { age = null, sex = null, heightCm = null, weightKg = null, experience = null, returnAfterBreak = null, equipment = [], restrictions = [] } = input;
  if (age !== null && (!Number.isInteger(age) || age < 1 || age > 120)) throw new Error('PROFILE_AGE_INVALID');
  if (sex !== null && !['female', 'male', 'other'].includes(sex)) throw new Error('PROFILE_SEX_INVALID');
  if (heightCm !== null && (!Number.isFinite(heightCm) || heightCm < 80 || heightCm > 250)) throw new Error('PROFILE_HEIGHT_INVALID');
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400)) throw new Error('PROFILE_WEIGHT_INVALID');
  if (experience !== null && !EXPERIENCE.has(experience)) throw new Error('PROFILE_EXPERIENCE_INVALID');
  if (returnAfterBreak !== null && typeof returnAfterBreak !== 'boolean') throw new Error('PROFILE_RETURN_AFTER_BREAK_INVALID');
  if (!Array.isArray(equipment) || equipment.length > EQUIPMENT.size || equipment.some(item => !EQUIPMENT.has(item))) throw new Error('PROFILE_EQUIPMENT_INVALID');
  if (!Array.isArray(restrictions) || restrictions.length > 20 || restrictions.some(item => typeof item !== 'string' || !/^[a-z0-9_-]{1,40}$/i.test(item))) throw new Error('PROFILE_RESTRICTIONS_INVALID');
  if (Object.hasOwn(input, 'trainingGoal') && input.trainingGoal !== null && !TRAINING_GOALS.has(input.trainingGoal)) throw new Error('PROFILE_TRAINING_GOAL_INVALID');
  return { age, sex, heightCm, weightKg, experience, returnAfterBreak, equipment: [...new Set(equipment)], restrictions: [...new Set(restrictions)], ...(Object.hasOwn(input, 'trainingGoal') ? { trainingGoal: input.trainingGoal } : {}) };
}

function validateProfileState(value) {
  if (!record(value) || value.schemaVersion !== 1 || (value.onboardingRequired != null && typeof value.onboardingRequired !== 'boolean') || (value.legacyUpgradePending != null && typeof value.legacyUpgradePending !== 'boolean') || !Array.isArray(value.profiles) || value.profiles.length < 1 || value.profiles.length > 20) throw new Error('PROFILE_STATE_INVALID');
  const ids = new Set();
  for (const profile of value.profiles) {
    if (!record(profile) || !PROFILE_ID.test(profile.id) || ids.has(profile.id) || typeof profile.name !== 'string' || !profile.name.trim() || profile.name.length > 60 || !record(profile.data) || Object.keys(profile.data).some(key => !APP_KEYS.includes(key))) throw new Error('PROFILE_RECORD_INVALID');
    normalizeAttributes(profile.attributes || {});
    if (Object.hasOwn(profile, 'planPrograms')) validatePlanPrograms(profile.planPrograms);
    ids.add(profile.id);
  }
  if (!ids.has(value.activeProfileId)) throw new Error('ACTIVE_PROFILE_INVALID');
  return value;
}

export function readProfileState(snapshot) {
  if (!record(snapshot)) throw new Error('PROFILE_SNAPSHOT_INVALID');
  let parsed;
  try { parsed = snapshot[PROFILE_STATE_KEY] ? JSON.parse(snapshot[PROFILE_STATE_KEY]) : null; }
  catch { throw new Error('PROFILE_STATE_INVALID'); }
  return parsed == null ? null : clone(validateProfileState(parsed));
}

export function bootstrapProfileState(snapshot, options = {}) {
  snapshot=withoutProgramDrafts(snapshot);
  if (!record(snapshot) || Object.keys(snapshot).some(key => !APP_KEYS.includes(key) && key !== PROFILE_STATE_KEY)) throw new Error('PROFILE_SNAPSHOT_INVALID');
  const prior = readProfileState(snapshot);
  if (prior) {
    const active = prior.profiles.find(profile => profile.id === prior.activeProfileId);
    const updates = snapshot.gymverse_body == null ? { gymverse_body: initialBodyWeight(active, options.bodyMeasurementDate) } : {};
    if (updates.gymverse_body == null) return { state: prior, updates: {} };
    return { state: prior, updates };
  }
  const id = options.id || 'legacy-default-profile';
  const hasLegacyData = Object.keys(snapshot).length > 0;
  const state = { schemaVersion: 1, activeProfileId: id, onboardingRequired: !hasLegacyData, legacyUpgradePending: hasLegacyData, profiles: [{ id, name: 'Mój profil', createdAt: options.createdAt || new Date(0).toISOString(), data: clone(snapshot) }] };
  validateProfileState(state);
  return { state, updates: { [PROFILE_STATE_KEY]: state } };
}

export function createProfile(state, input, options = {}) {
  validateProfileState(state);
  if (state.profiles.length >= 20) throw new Error('PROFILE_LIMIT_REACHED');
  const name = typeof input?.name === 'string' ? input.name.trim().slice(0, 60) : '';
  if (!name) throw new Error('PROFILE_NAME_REQUIRED');
  const id = options.id || newProfileId();
  if (!id || !PROFILE_ID.test(id) || state.profiles.some(profile => profile.id === id)) throw new Error('PROFILE_ID_INVALID');
  const profile = { id, name, createdAt: options.createdAt || new Date().toISOString(), attributes: normalizeAttributes(input), data: {} };
  const next = { ...clone(state), profiles: [...clone(state.profiles), profile] };
  return { state: next, profile: clone(profile) };
}

export function updateProfile(state, profileId, input) {
  validateProfileState(state);
  const current = state.profiles.find(profile => profile.id === profileId);
  if (!current) throw new Error('PROFILE_NOT_FOUND');
  const name = typeof input?.name === 'string' ? input.name.trim().slice(0, 60) : '';
  if (!name) throw new Error('PROFILE_NAME_REQUIRED');
  const attributesInput = { ...input };
  if (!Object.hasOwn(attributesInput, 'trainingGoal') && Object.hasOwn(current.attributes || {}, 'trainingGoal')) attributesInput.trainingGoal = current.attributes.trainingGoal;
  const profile = { ...clone(current), name, attributes: normalizeAttributes(attributesInput) };
  const next = { ...clone(state), onboardingRequired: false, legacyUpgradePending: false, profiles: state.profiles.map(item => item.id === profileId ? profile : clone(item)) };
  return { state: next, profile: clone(profile) };
}

export function dismissLegacyUpgradeNotice(state) {
  validateProfileState(state);
  if (state.legacyUpgradePending !== true) return clone(state);
  return { ...clone(state), legacyUpgradePending: false };
}

export function switchProfile(state, currentSnapshot, targetId, options = {}) {
  currentSnapshot=withoutProgramDrafts(currentSnapshot);
  validateProfileState(state);
  if (!record(currentSnapshot) || Object.keys(currentSnapshot).some(key => !APP_KEYS.includes(key))) throw new Error('PROFILE_SNAPSHOT_INVALID');
  const target = state.profiles.find(profile => profile.id === targetId);
  if (!target) throw new Error('PROFILE_NOT_FOUND');
  if (state.activeProfileId === targetId) return { state: clone(state), updates: {} };
  const profiles = clone(state.profiles);
  const current = profiles.find(profile => profile.id === state.activeProfileId);
  current.data = clone(currentSnapshot);
  const next = { ...clone(state), activeProfileId: targetId, profiles };
  const updates = Object.fromEntries(APP_KEYS.map(key => [key, Object.hasOwn(target.data, key) ? clone(target.data[key]) : null]));
  if (updates.gymverse_body == null) updates.gymverse_body = initialBodyWeight(target, options.bodyMeasurementDate);
  updates[PROFILE_STATE_KEY] = next;
  return { state: next, updates };
}

export function deleteProfile(state, profileId, currentSnapshot) {
  const drafts=currentSnapshot?.[DRAFT_KEY];
  const cleanup=drafts==null?{}:{[DRAFT_KEY]:{version:1,items:readWorkingDrafts(drafts).items.filter(item=>item.draft.profileId!==profileId)}};
  currentSnapshot=withoutProgramDrafts(currentSnapshot);
  validateProfileState(state);
  if (state.profiles.length <= 1) throw new Error('LAST_PROFILE');
  const removed = state.profiles.find(profile => profile.id === profileId);
  if (!removed) throw new Error('PROFILE_NOT_FOUND');
  const profiles = clone(state.profiles.filter(profile => profile.id !== profileId));
  if (profileId !== state.activeProfileId) return { state: { ...clone(state), profiles }, updates: { ...cleanup, [PROFILE_STATE_KEY]: { ...clone(state), profiles } } };
  if (!record(currentSnapshot) || Object.keys(currentSnapshot).some(key => !APP_KEYS.includes(key))) throw new Error('PROFILE_SNAPSHOT_INVALID');
  const next = profiles[0];
  const nextState = { schemaVersion: 1, activeProfileId: next.id, profiles };
  const updates = Object.fromEntries(APP_KEYS.map(key => [key, Object.hasOwn(next.data, key) ? clone(next.data[key]) : null]));
  Object.assign(updates,cleanup);
  updates[PROFILE_STATE_KEY] = nextState;
  return { state: nextState, updates };
}

export function exportProfileSnapshot(state, currentSnapshot, profileId = state?.activeProfileId) {
  currentSnapshot=withoutProgramDrafts(currentSnapshot);
  validateProfileState(state);
  const profile = state.profiles.find(item => item.id === profileId);
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const data = profileId === state.activeProfileId ? currentSnapshot : profile.data;
  if (!record(data) || Object.keys(data).some(key => !APP_KEYS.includes(key))) throw new Error('PROFILE_SNAPSHOT_INVALID');
  if (profile.planPrograms) validatePlanPrograms(profile.planPrograms, JSON.parse(data.gymverse_plans || '[]'));
  return { format: 'gymverse-profile', schemaVersion: 1, profile: { id: profile.id, name: profile.name, createdAt: profile.createdAt, attributes: clone(profile.attributes || {}), ...(profile.planPrograms ? {planPrograms: clone(profile.planPrograms)} : {}) }, data: clone(data) };
}

export function importProfileSnapshot(state, payload, options = {}) {
  validateProfileState(state);
  if (!record(payload) || payload.format !== 'gymverse-profile' || pa