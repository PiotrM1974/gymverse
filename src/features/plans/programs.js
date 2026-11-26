import {sameDataValue} from './plan-merge.js';
const clone = value => structuredClone(value);
const ID = /^pg_[a-f0-9]{32}$/;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function validatePlanPrograms(value, plans) {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.programs) || value.programs.length > 200 || !(value.assignedProgramId === null || ID.test(value.assignedProgramId))) throw new Error('PROGRAMS_INVALID');
  if (Object.hasOwn(value,'archivedDayPlanIds') && (!Array.isArray(value.archivedDayPlanIds) || value.archivedDayPlanIds.length > 10000 || value.archivedDayPlanIds.some(id=>typeof id!=='string'||!id) || new Set(value.archivedDayPlanIds).size!==value.archivedDayPlanIds.length)) throw new Error('PROGRAM_ARCHIVE_INVALID');
  const ids = new Set(), days = new Set();
  const available = plans === undefined ? null : new Set(plans.map(plan => plan.id));
  for (const program of value.programs) {
    if (!isRecord(program) || !ID.test(program.id) || ids.has(program.id) || typeof program.title !== 'string' || !program.title.trim() || program.title !== program.title.trim() || program.title.length > 60 || !Array.isArray(program.dayPlanIds) || program.dayPlanIds.length < 1 || program.dayPlanIds.length > 6) throw new Error('PROGRAM_INVALID');
    ids.add(program.id);
    for (const day of program.dayPlanIds) {
      if (typeof day !== 'string' || !day || days.has(day) || (available && !available.has(day))) throw new Error('PROGRAM_DAY_INVALID');
      days.add(day);
    }
  }
  if (value.assignedProgramId !== null && !ids.has(value.assignedProgramId)) throw new Error('PROGRAM_ASSIGNMENT_INVALID');
  return value;
}
function generatedId(){if (!globalThis.crypto?.randomUUID) throw new Error('PROGRAM_ID_UNAVAILABLE');return 'pg_'+crypto.randomUUID().replaceAll('-','').toLowerCase();}
function container(profile){return clone(profile.planPrograms || {schemaVersion:1,assignedProgramId:null,programs:[]});}
export function createProgram(profile,plans,input,options={}) {
  const next=container(profile);const id=options.id||generatedId();next.programs.push({id,title:typeof input.title==='string'?input.title.trim():input.title,dayPlanIds:clone(input.dayPlanIds)});validatePlanPrograms(next,plans);return {...clone(profile),planPrograms:next};
}
export function updateProgram(profile,plans,id,input){
  const next=container(profile), index=next.programs.findIndex(p=>p.id===id);if(index<0)throw new Error('PROGRAM_NOT_FOUND');
  next.programs[index]={id,title:typeof input.title==='string'?input.title.trim():input.title,dayPlanIds:clone(input.dayPlanIds)};validatePlanPrograms(next,plans);return {...clone(profile),planPrograms:next};
}
// Retain day records for history/drafts; live program references always remain usable.
export function archivedProgramDayIds(profile){const data=profile?.planPrograms;const used=new Set((data?.programs||[]).flatMap(p=>p.dayPlanIds));return new Set((data?.archivedDayPlanIds||[]).filter(id=>!used.has(id)));}
export function deleteProgram(profile,id){const next=container(profile);if(!next.programs.some(p=>p.id===id))throw new Error('PROGRAM_NOT_FOUND');const removed=next.programs.find(p=>p.id===id);next.programs=next.programs.filter(p=>p.id!==id);const used=new Set(next.programs.flatMap(p=>p.dayPlanIds));next.archivedDayPlanIds=[...new Set([...(next.archivedDayPlanIds||[]),...removed.dayPlanIds])].filter(day=>!used.has(day));if(next.assignedProgramId===id)next.assignedProgramId=null;validatePlanPrograms(next);return {...clone(profile),planPrograms:next};}
export function readProgramDays(profile,plans,id){const data=container(profile);validatePlanPrograms(data,plans);const program=data.programs.find(p=>p.id===id);if(!program)throw new Error('PROGRAM_NOT_FOUND');return program.dayPlanIds.map(day=>clone(plans.find(plan=>plan.id===day)));}
export function readAssignedProgram(profile,plans){if(!profile.planPrograms)return null;validatePlanPrograms(profile.planPrograms,plans);const id=profile.planPrograms.assignedProgramId;return id===null?null:clone(profile.planPrograms.programs.find(p=>p.id===id));}
export function assignProgram(profile,plans,id){if(!profile.planPrograms){if(id===null)return clone(profile);throw new Error('PROGRAM_NOT_FOUND');}const next=container(profile);validatePlanPrograms(next,plans);if(id!==null&&!next.programs.some(p=>p.id===id))throw new Error('PROGRAM_NOT_FOUND');next.assignedProgramId=id;validatePlanPrograms(next,plans);return {...clone(profile),planPrograms:next};}
export function programAssignmentSnapshot(state,profileId,programId,plans){
  const profile=state?.profiles?.find(item=>item.id===profileId);
  if(!profile||state.activeProfileId!==profileId)return null;
  const program=profile.planPrograms?.programs.find(item=>item.id===programId)??null;
  return {profileId,programId,assignedProgramId:profile.planPrograms?.assignedProgramId??null,program:clone(program),...(plans?{days:(program?.dayPlanIds||[]).map(id=>clone(plans.find(day=>day.id===id)??null))}:{})};
}
export function matchesProgramAssignmentSnapshot(state,expected,plans){
  if(!expected)return false;
  const current=programAssignmentSnapshot(state,expected.profileId,expected.programId,plans);
  return !!current&&current.assignedProgramId===expected.assignedProgramId&&sameDataValue(current.program,expected.program)&&(!Object.hasOwn(expected,'days')||sameDataValue(current.days,expected.days));
}
export async function commitProgramProfile(store,state,profileId,plans,change){
  const {withPlanDataLock}=await import('./synchronization.js');
  return withPlanDataLock(async()=>{
    const latest=await store.refreshSnapshot();
    if(!latest.gymverse_profiles_v1||!latest.gymverse_plans)throw new Error('PROGRAM_STATE_STALE');
    const currentState=JSON.parse(latest.gymverse_profiles_v1),currentPlans=JSON.parse(latest.gymverse_plans);
    const baselineProfile=state?.profiles?.find(p=>p.id===profileId),currentProfile=currentState.profiles?.find(p=>p.id===profileId);
    if(currentState.activeProfileId!==profileId||!baselineProfile||!currentProfile||!sameDataValue(currentProfile.planPrograms??null,baselineProfile.planPrograms??null))throw new Error('PROGRAM_STATE_STALE');
    if(currentState.activeProfileId!==profileId)throw new Error('PROGRAM_PROFILE_NOT_ACTIVE');
    const index=currentState.profiles.findIndex(p=>p.id===profileId);if(index<0)throw new Error('PROFILE_NOT_FOUND');
    const profile=change(clone(currentState.profiles[index]),clone(currentPlans));if(profile.id!==profileId)throw new Error('PROFILE_ID_INVALID');
    if(profile.planPrograms)validatePlanPrograms(profile.planPrograms,currentPlans);
    const next=clone(currentState);next.profiles[index]=profile;
    const keys=['gymverse_plans','gymverse_profiles_v1'];
    const before=store.storage && new Map(keys.map(key=>[key,store.storage.getItem(key)]));
    try { await store.transact({gymverse_plans:clone(currentPlans),gymverse_profiles_v1:next}); }
    catch (error) {
      if (before && keys.some(key=>store.storage.getItem(key)!==before.get(key))) error.integrityUncertain=true;
      throw error;
    }
    return next;
  });
}
