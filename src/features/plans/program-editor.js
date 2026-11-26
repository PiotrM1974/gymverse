import { DRAFT_KEY, removeDraftFromSnapshot } from './program-drafts.js';
import { archivedProgramDayIds, assignProgram, createProgram, updateProgram, validatePlanPrograms } from './programs.js';
import { mergePlanChanges, mergeRecordChanges, sameDataValue as same } from './plan-merge.js';
import { withPlanDataLock } from './synchronization.js';

const copy = value => structuredClone(value);

export function createProgramDraft(state, plans, programId = null) {
  const profile = state.profiles.find(item => item.id === state.activeProfileId);
  if (!profile) throw new Error('PROFILE_NOT_FOUND');
  const program = programId && profile.planPrograms?.programs.find(item => item.id === programId);
  if (programId && !program) throw new Error('PROGRAM_NOT_FOUND');
  return {
    profileId: profile.id, programId,
    title: program?.title || 'Mój program',
    dayPlanIds: copy(program?.dayPlanIds || []),
    plans: copy(plans), basePlans: copy(plans), baseState: {activeProfileId:state.activeProfileId,profiles:[{...copy(profile),data:{}}]}
  };
}

export function addDraftDay(draft, title = `Dzień ${draft.dayPlanIds.length + 1}`) {
  if (draft.dayPlanIds.length >= 6) throw new Error('PROGRAM_DAY_LIMIT');
  const day = { id: 'p_' + crypto.randomUUID().replaceAll('-', ''), title, exercises: [] };
  draft.plans.push(day);
  draft.dayPlanIds.push(day.id);
  return day.id;
}

export function attachDraftDay(draft, dayId) {
  const profile = draft.baseState.profiles.find(item => item.id === draft.profileId);
  const occupied = (profile.planPrograms?.programs || []).filter(item => item.id !== draft.programId).flatMap(item => item.dayPlanIds);
  if (draft.dayPlanIds.length >= 6 || draft.dayPlanIds.includes(dayId) || occupied.includes(dayId) || archivedProgramDayIds(profile).has(dayId) || !draft.plans.some(day => day.id === dayId)) throw new Error('PROGRAM_DAY_INVALID');
  draft.dayPlanIds.push(dayId);
}

export async function commitProgramDraft(store, draft, options = {}) {
  return withPlanDataLock(async () => {
    const before = await store.refreshSnapshot();
    const state = JSON.parse(before.gymverse_profiles_v1 || 'null');
    const plans = JSON.parse(before.gymverse_plans || '[]');
    const baseProfile=draft.baseState.profiles.find(item=>item.id===draft.profileId),currentProfile=state?.profiles?.find(item=>item.id===draft.profileId);
    if(state?.activeProfileId!==draft.profileId||!currentProfile||!baseProfile)throw new Error('PROGRAM_STATE_STALE');
    if(draft.programId){
      const baseProgram=baseProfile.planPrograms?.programs.find(item=>item.id===draft.programId),currentProgram=currentProfile.planPrograms?.programs.find(item=>item.id===draft.programId);
      if(!baseProgram||!same(baseProgram,currentProgram))throw new Error('PROGRAM_STATE_STALE');
    }else if(draft.generatedProgramId&&currentProfile.planPrograms?.programs.some(item=>item.id===draft.generatedProgramId))throw new Error('PROGRAM_STATE_STALE');
    if(draft.dayPlanIds.some(id=>archivedProgramDayIds(currentProfile).has(id)))throw new Error('PROGRAM_STATE_STALE');
    if(options.assignProgram&&(currentProfile.planPrograms?.assignedProgramId??null)!==(baseProfile.planPrograms?.assignedProgramId??null))throw new Error('PROGRAM_STATE_STALE');
    if(draft.generatorAnswers&&!same(currentProfile.attributes||{},baseProfile.attributes||{}))throw new Error('PROGRAM_STATE_STALE');
    if (before.gymverse_active && JSON.parse(before.gymverse_active)) throw new Error('PROGRAM_ACTIVE_SESSION');
    // The program editor detaches existing days; it never deletes their records.
    if(draft.basePlans.some(day=>!draft.plans.some(next=>next.id===day.id)))throw new Error('PROGRAM_DAY_INVALID');
    const nextPlans = mergePlanChanges(draft.basePlans,copy(draft.plans).filter(day => draft.basePlans.some(old => old.id === day.id) || draft.dayPlanIds.includes(day.id)),plans);
    if (new Set(nextPlans.map(day => day.id)).size !== nextPlans.length) throw new Error('PROGRAM_DAY_INVALID');
    for (const day of nextPlans) {
      if (!day.title?.trim() || day.title.length > 40 || !Array.isArray(day.exercises)) throw new Error('PROGRAM_DAY_INVALID');
      if (draft.dayPlanIds.includes(day.id) && !day.exercises.length) throw new Error('PROGRAM_DAY_EMPTY');
    }
    const index = state.profiles.findIndex(item => item.id === draft.profileId);
    const input = { title: draft.title, dayPlanIds: draft.dayPlanIds };
    const profile = draft.programId
      ? updateProgram(state.profiles[index], nextPlans, draft.programId, input)
      : createProgram(state.profiles[index], nextPlans, input, draft.generatedProgramId?{id:draft.generatedProgramId}:{});
    const savedProgramId=draft.programId||draft.generatedProgramId||profile.planPrograms.programs.at(-1).id;
    const savedProfile=options.assignProgram?assignProgram(profile,nextPlans,savedProgramId):profile;
    validatePlanPrograms(savedProfile.planPrograms, nextPlans);
    const nextState = copy(state);
    nextState.profiles[index] = savedProfile;
    const updates = { gymverse_plans: nextPlans, gymverse_profiles_v1: nextState };
    if (options.workingDraft) {
      if(options.workingDraft.draft.profileId!==draft.profileId || options.workingDraft.draft.programId!==draft.programId)throw Error('DRAFT_CONFLICT');
      updates[DRAFT_KEY]=removeDraftFromSnapshot(before[DRAFT_KEY],options.workingDraft);
    }
    if (options.custom) updates.gymverse_custom = mergeRecordChanges(options.baseCustom||{},options.custom,JSON.parse(before.gymverse_custom||'{}'));
    try {
      await store.transact(updates);
      const after = await store.refreshSnapshot();
      if (Object.entries(updates).some(([key, value]) => !same(JSON.parse(after[key] || 'null'), value))) {
        const error = new Error('PROGRAM_READBACK_FAILED');
        error.integrityUncertain = true;
        throw error;
      }
    } catch (error) {
      try {
        const after = await store.refreshSnapshot();
        if (Object.keys(updates).some(key => (after[key] ?? null) !== (before[key] ?? null))) error.integrityUncertain = true;
      } catch (_) { error.integrityUncertain = true; }
      throw error;
    }
    return { state: nextState, plans: nextPlans, custom:updates.gymverse_custom||options.custom, programId: savedProgramId };
  }, options.locks);
}
