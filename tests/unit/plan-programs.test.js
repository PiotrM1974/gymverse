import {test,expect} from 'vitest';
import {createProgram,updateProgram,deleteProgram,readProgramDays,programAssignmentSnapshot,matchesProgramAssignmentSnapshot} from '../../src/features/plans/programs.js';
const plans=Array.from({length:6},(_,i)=>({id:`day-${i}`,title:`Day ${i}`,exercises:[]}));
const id='pg_11111111111111111111111111111111';
test('programs keep ordered existing day identities and delete metadata only',()=>{
 const p={id:'profile-one',data:{}};const created=createProgram(p,plans,{title:'Upper',dayPlanIds:['day-0','day-1','day-2']},{id});
 expect(readProgramDays(created,plans,id).map(x=>x.id)).toEqual(['day-0','day-1','day-2']);
 const changed=updateProgram(created,plans,id,{title:'Upper new',dayPlanIds:['day-2','day-0']});expect(changed.planPrograms.programs[0]).toEqual({id,title:'Upper new',dayPlanIds:['day-2','day-0']});
 expect(deleteProgram(changed,id).planPrograms.programs).toEqual([]);expect(plans).toHaveLength(6);
});
test('reject invalid day count, references and shared days',()=>{
 const p={id:'profile-one',data:{}};for(const ids of [[],['missing'],Array(7).fill('day-0'),['day-0','day-0']])expect(()=>createProgram(p,plans,{title:'x',dayPlanIds:ids},{id})).toThrow();
 const created=createProgram(p,plans,{title:'x',dayPlanIds:['day-0']},{id});expect(()=>createProgram(created,plans,{title:'other',dayPlanIds:['day-0']},{id:'pg_22222222222222222222222222222222'})).toThrow();
});
import {planBackupImport} from '../../src/features/backup/import-plan.js';
import {bootstrapProfileState,exportProfileSnapshot,importProfileSnapshot} from '../../src/features/profiles/profile-model.js';
import {commitProgramProfile,validatePlanPrograms} from '../../src/features/plans/programs.js';
import {createBackupV5,previewBackupV5} from '../../src/gv-data.js';
const rawPlans=JSON.stringify(plans);
const snapshot=(profile,raw=plans)=>({gymverse_plans:raw,gymverse_history:[],gymverse_profiles_v1:{schemaVersion:1,activeProfileId:'profile-one',profiles:[profile]}});
const testLocks={request:async(_name,_options,operation)=>operation({name:'gymnastika-plan-program-data'})};
test.each([1,3,6])('program of %i days survives profile and ZIP round trip',async count=>{
 let state=bootstrapProfileState({},{id:'profile-one'}).state;state.profiles[0]=createProgram(state.profiles[0],plans,{title:'Synthetic',dayPlanIds:plans.slice(0,count).map(p=>p.id)},{id});
 const out=exportProfileSnapshot(state,{gymverse_plans:rawPlans});const imported=importProfileSnapshot(state,out,{id:'profile-two'}).profile;expect(imported.planPrograms).toEqual(state.profiles[0].planPrograms);
 const snap=snapshot({...state.profiles[0],data:{gymverse_plans:rawPlans}});const result=await previewBackupV5(await createBackupV5(snap));expect(result.snapshot.gymverse_profiles_v1.profiles[0].planPrograms).toEqual(state.profiles[0].planPrograms);
});
test('program change commits only on success and can be retried',async()=>{
 const state=bootstrapProfileState({},{id:'profile-one'}).state;let fail=true;const writes=[];const store={refreshSnapshot:async()=>({gymverse_profiles_v1:JSON.stringify(state),gymverse_plans:rawPlans}),storage:{getItem:()=>null},transact:async value=>{if(fail)throw Error('quota');writes.push(value)}};
 const change=p=>createProgram(p,plans,{title:'Retry',dayPlanIds:['day-0']},{id});await expect(commitProgramProfile(store,state,'profile-one',plans,change,testLocks)).rejects.toThrow('quota');expect(state.profiles[0].planPrograms).toBeUndefined();fail=false;const next=await commitProgramProfile(store,state,'profile-one',plans,change,testLocks);expect(next.profiles[0].planPrograms.programs).toHaveLength(1);expect(writes).toHaveLength(1);
});
test('merge adds complete program, preserves conflicting days, and remains repeatable',()=>{
 const base={id:'profile-one',name:'Test',data:{}};const incoming=createProgram(base,plans,{title:'Synthetic',dayPlanIds:['day-0','day-1']},{id});
 let result=planBackupImport(snapshot(base,[]),snapshot(incoming,plans));expect(result.snapshot.gymverse_profiles_v1.profiles[0].planPrograms.programs[0].id).toBe(id);
 result=planBackupImport(result.snapshot,snapshot(incoming,plans));expect(result.snapshot.gymverse_profiles_v1.profiles[0].planPrograms.programs).toHaveLength(1);
 const changed=plans.map(p=>p.id==='day-0'?{...p,title:'Conflict'}:p);const conflict=planBackupImport(snapshot(base,changed),snapshot(incoming,plans));expect(conflict.snapshot.gymverse_profiles_v1.profiles[0].planPrograms).toBeUndefined();expect(conflict.conflicts.some(c=>c.type==='plan-program-days')).toBe(true);
});
test('validation rejects missing references and duplicate ownership',()=>{expect(()=>validatePlanPrograms({schemaVersion:1,assignedProgramId:null,programs:[{id,title:'X',dayPlanIds:['missing']}]},plans)).toThrow();});
test('assignment freshness ignores unrelated profile data but rejects reassignment or program edits',()=>{
 const profile=createProgram({id:'profile-one',data:{}},plans,{title:'Plan',dayPlanIds:['day-0']},{id});
 const state={activeProfileId:'profile-one',profiles:[profile]};
 const snapshot=programAssignmentSnapshot(state,'profile-one',id);
 const unrelated=structuredClone(state);unrelated.profiles[0].data={gymverse_history:'[]'};unrelated.profiles.push({id:'profile-two',name:'Two',data:{}});
 expect(matchesProgramAssignmentSnapshot(unrelated,snapshot)).toBe(true);
 const reassigned=structuredClone(state);reassigned.profiles[0].planPrograms.assignedProgramId=id;
 expect(matchesProgramAssignmentSnapshot(reassigned,snapshot)).toBe(false);
 const edited=structuredClone(state);edited.profiles[0].planPrograms.programs[0].title='Changed';
 expect(matchesProgramAssignmentSnapshot(edited,snapshot)).toBe(false);
});

test('assignment snapshot checks relevant day content without blocking unrelated days',()=>{
 const profile=createProgram({id:'profile-one',data:{}},plans,{title:'Plan',dayPlanIds:['day-0']},{id}),state={activeProfileId:'profile-one',profiles:[profile]},snapshot=programAssignmentSnapshot(state,'profile-one',id,plans);
 const unrelated=structuredClone(plans);unrelated[1].title='Niezależna zmiana';expect(matchesProgramAssignmentSnapshot(state,snapshot,unrelated)).toBe(true);
 const changed=structuredClone(plans);changed[0].title='Zmieniony oglądany dzień';expect(matchesProgramAssignmentSnapshot(state,snapshot,changed)).toBe(false);
});
test('profile program metadata writes use latest plans and ignore unrelated plan changes',async()=>{
 const state=bootstrapProfileState({},{id:'profile-one'}).state,latestPlans=[...plans,{id:'added-in-other-tab',title:'Other',exercises:[]}],writes=[];
 const store={refreshSnapshot:async()=>({gymverse_profiles_v1:JSON.stringify(state),gymverse_plans:JSON.stringify(latestPlans)}),transact:async updates=>writes.push(updates)};
 const result=await commitProgramProfile(store,state,'profile-one',plans,profile=>createProgram(profile,latestPlans,{title:'New',dayPlanIds:['added-in-other-tab']},{id:'pg_33333333333333333333333333333333'}),testLocks);
 expect(result.profiles[0].planPrograms.programs[0].dayPlanIds).toEqual(['added-in-other-tab']);
 expect(writes).toHaveLength(1);
});
test('conflicting program ID retains local program and is recorded',()=>{
 const base={id:'profile-one',name:'Test',data:{}};const local=createProgram(base,plans,{title:'Local',dayPlanIds:['day-0']},{id});const source=createProgram(base,plans,{title:'Incoming',dayPlanIds:['day-0']},{id});const result=planBackupImport(snapshot(local),snapshot(source));expect(result.snapshot.gymverse_profiles_v1.profiles[0].planPrograms.programs[0].title).toBe('Local');expect(result.conflicts).toContainEqual({profileId:'profile-one',type:'plan-program',recordId:id});
});
test('missing program day rejects backup before it can be applied',async()=>{
 const base={id:'profile-one',name:'Test',data:{gymverse_plans:rawPlans}};const profile=createProgram(base,plans,{title:'Plan',dayPlanIds:['day-0']},{id});const broken=snapshot(profile,plans.filter(p=>p.id!=='day-0'));await expect(createBackupV5(broken)).rejects.toThrow('SNAPSHOT_INVALID');expect(()=>planBackupImport(snapshot(base),broken)).toThrow('PROGRAM_DAY_INVALID');
});
test('plan with blocked custom exercise does not enter program on merge',()=>{
 const day={id:'custom-day',title:'Custom',exercises:[{key:'c_shared',sets:1,target:'8'}]};const base={id:'profile-one',name:'Test',data:{}};const source=createProgram(base,[day],{title:'Program',dayPlanIds:['custom-day']},{id});const a=snapshot(base,[]);a.gymverse_custom={c_shared:{name:'Local',bw:false}};const b=snapshot(source,[day]);b.gymverse_custom={c_shared:{name:'Incoming',bw:true}};const result=planBackupImport(a,b);expect(result.snapshot.gymverse_plans).toEqual([]);expect(result.snapshot.gymverse_profiles_v1.profiles[0].planPrograms).toBeUndefined();
});
import {switchProfile} from '../../src/features/profiles/profile-model.js';
import {restoreLegacyV4} from '../../src/gv-data.js';
test('separate profiles keep independent programs and day data on switching',()=>{
 let state=bootstrapProfileState({},{id:'profile-one'}).state;state.profiles[0]=createProgram(state.profiles[0],plans,{title:'Same',dayPlanIds:['day-0']},{id});const other={id:'profile-two',name:'Two',data:{gymverse_plans:rawPlans}};state.profiles.push(createProgram(other,plans,{title:'Same',dayPlanIds:['day-1']},{id:'pg_22222222222222222222222222222222'}));const result=switchProfile(state,{gymverse_plans:rawPlans},'profile-two');expect(result.state.profiles.map(p=>p.planPrograms.programs[0].id)).toEqual([id,'pg_22222222222222222222222222222222']);expect(result.state.activeProfileId).toBe('profile-two');
});
test('editing a day does not alter another day, program or identifiers',()=>{
 const base={id:'profile-one',data:{}};const profile=createProgram(base,plans,{title:'Upper',dayPlanIds:['day-0','day-1']},{id});const edited=structuredClone(plans);edited[0].title='New';expect(readProgramDays(profile,edited,id).map(day=>day.id)).toEqual(['day-0','day-1']);expect(edited[1]).toEqual(plans[1]);expect(profile.planPrograms.programs[0].id).toBe(id);
});
test('full legacy restore is blocked when existing program days could be replaced',async()=>{
 let state=bootstrapProfileState({},{id:'profile-one'}).state;state.profiles[0]=createProgram(state.profiles[0],plans,{title:'Protected',dayPlanIds:['day-0']},{id});const storage={getItem:k=>k==='gymverse_profiles_v1'?JSON.stringify(state):null};await expect(restoreLegacyV4(storage,{}, {confirmed:true,restoreActive:false,restoreDrafts:false})).rejects.toThrow('LEGACY_RESTORE_PROGRAMS_PROTECTED');
});
test('failed rollback reports uncertain integrity instead of claiming a safe write',async()=>{
 const state=bootstrapProfileState({},{id:'profile-one'}).state;const values=new Map([['gymverse_plans',rawPlans],['gymverse_profiles_v1',JSON.stringify(state)]]);const store={refreshSnapshot:async()=>({gymverse_plans:values.get('gymverse_plans'),gymverse_profiles_v1:values.get('gymverse_profiles_v1')}),storage:{getItem:key=>values.get(key)??null},transact:async()=>{values.set('gymverse_plans','changed');throw new Error('rollback failed')}};const change=p=>createProgram(p,plans,{title:'X',dayPlanIds:['day-0']},{id});await expect(commitProgramProfile(store,state,'profile-one',plans,change,testLocks)).rejects.toMatchObject({integrityUncertain:true});
});
