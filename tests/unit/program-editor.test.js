import { test, expect } from 'vitest';
import { createProgramDraft, addDraftDay, attachDraftDay, commitProgramDraft } from '../../src/features/plans/program-editor.js';
import { createProgram } from '../../src/features/plans/programs.js';
const state = () => ({schemaVersion:1,activeProfileId:'p',profiles:[{id:'p',data:{},attributes:{trainingGoal:'hypertrophy'}}]});
const locks = {request:async(name, options, operation)=>{expect(name).toBe('gymnastika-plan-program-data'); return operation();}};
function storeFor(registry, plans=[]) {
  const data={gymverse_profiles_v1:JSON.stringify(registry),gymverse_plans:JSON.stringify(plans),gymverse_history:'[{"id":"history"}]',gymverse_draft_v1:'{"items":[]}'};
  return {data,refreshSnapshot:async()=>({...data}),transact:async updates=>{for(const [key,value] of Object.entries(updates))data[key]=JSON.stringify(value);}};
}
test.each([1,3,6])('commits %i days with stable references and no implicit assignment', async count=>{
  const registry=state(),store=storeFor(registry),draft=createProgramDraft(registry,[]);
  for(let i=0;i<count;i++){addDraftDay(draft);draft.plans[i].exercises=[{key:'bench_flat',sets:3,target:'8-12',variantId:'default',restSeconds:90}];}
  const result=await commitProgramDraft(store,draft,{locks});
  expect(result.state.profiles[0].planPrograms.programs[0].dayPlanIds).toEqual(draft.dayPlanIds);
  expect(result.state.profiles[0].planPrograms.assignedProgramId).toBeNull();
  expect(result.plans).toEqual(draft.plans);
  expect(store.data.gymverse_history).toBe('[{"id":"history"}]');
  expect(result.state.profiles[0].attributes.trainingGoal).toBe('hypertrophy');
});
test('stale draft and active session cannot write',async()=>{
  const registry=state(),store=storeFor(registry),draft=createProgramDraft(registry,[]);
  store.data.gymverse_active='{"planId":"other"}';
  await expect(commitProgramDraft(store,draft,{locks})).rejects.toThrow('PROGRAM_ACTIVE_SESSION');
});
test('rejects empty days and invalid attachment, preserves draft for retry',async()=>{
  const registry=state(),store=storeFor(registry),draft=createProgramDraft(registry,[]);
  addDraftDay(draft);
  expect(()=>attachDraftDay(draft,'missing')).toThrow();
  await expect(commitProgramDraft(store,draft,{locks})).rejects.toThrow('PROGRAM_DAY_EMPTY');
  expect(JSON.parse(store.data.gymverse_plans)).toEqual([]);
  draft.plans[0].exercises=[{key:'bench_flat',sets:3,target:'8'}];
  const transact=store.transact;store.transact=async()=>{throw new Error('write failed');};
  await expect(commitProgramDraft(store,draft,{locks})).rejects.toThrow('write failed');
  store.transact=transact;
  await expect(commitProgramDraft(store,draft,{locks})).resolves.toHaveProperty('programId');
});
test('partial failed write marks uncertain integrity',async()=>{
  const registry=state(),store=storeFor(registry),draft=createProgramDraft(registry,[]);
  addDraftDay(draft);draft.plans[0].exercises=[{key:'bench_flat',sets:3,target:'8'}];
  store.transact=async updates=>{store.data.gymverse_plans=JSON.stringify(updates.gymverse_plans);throw new Error('rollback failed');};
  await expect(commitProgramDraft(store,draft,{locks})).rejects.toMatchObject({integrityUncertain:true});
});
test('generated program can be assigned in the same transaction and keeps its retry identity',async()=>{
  const registry=state(),store=storeFor(registry),draft=createProgramDraft(registry,[]);
  addDraftDay(draft);draft.plans[0].exercises=[{key:'bench_flat',sets:3,target:'8'}];
  draft.generatedProgramId='pg_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const result=await commitProgramDraft(store,draft,{locks,assignProgram:true});
  expect(result.programId).toBe(draft.generatedProgramId);
  expect(result.state.profiles[0].planPrograms.assignedProgramId).toBe(draft.generatedProgramId);
  expect(result.state.profiles[0].planPrograms.programs).toHaveLength(1);
  expect(JSON.parse(store.data.gymverse_profiles_v1).profiles[0].planPrograms.programs[0].id).toBe(draft.generatedProgramId);
});
test('commits a draft alongside an unrelated plan change without replacing it',async()=>{
  const registry=state(),base=[{id:'existing-a',title:'A',exercises:[{key:'bench_flat',sets:3,target:'8'}]},{id:'existing-b',title:'B',exercises:[{key:'row',sets:3,target:'8'}]}],store=storeFor(registry,base),draft=createProgramDraft(registry,base);
  addDraftDay(draft);draft.plans.at(-1).exercises=[{key:'bench_flat',sets:3,target:'8'}];
  store.data.gymverse_plans=JSON.stringify([{...base[0],title:'A concurrent edit'},base[1]]);
  const result=await commitProgramDraft(store,draft,{locks});
  expect(result.plans.find(plan=>plan.id==='existing-a').title).toBe('A concurrent edit');
  expect(result.plans.find(plan=>plan.id==='existing-b')).toEqual(base[1]);
  expect(result.plans).toHaveLength(3);
});
test('rejects a concurrent change to a day being edited by the draft',async()=>{
  const base=[{id:'existing-a',title:'A',exercises:[{key:'bench_flat',sets:3,target:'8'}]}],registry=state();registry.profiles[0]=createProgram(registry.profiles[0],base,{title:'Existing',dayPlanIds:['existing-a']},{id:'pg_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'});const store=storeFor(registry,base),draft=createProgramDraft(registry,base,'pg_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  draft.dayPlanIds=['existing-a'];draft.plans[0].exercises[0].sets=4;
  store.data.gymverse_plans=JSON.stringify([{...base[0],title:'A concurrent edit'}]);
  await expect(commitProgramDraft(store,draft,{locks})).rejects.toThrow('PLAN_DATA_STALE');
});

test('a program draft cannot delete an already persisted day record',async()=>{
  const base=[{id:'kept-day',title:'Zachowany dzień',exercises:[{key:'bench_flat',sets:3,target:'8'}]}],registry=state(),store=storeFor(registry,base),draft=createProgramDraft(registry,base);
  draft.plans=[];addDraftDay(draft);draft.plans[0].exercises=[{key:'bench_flat',sets:2,target:'10'}];
  const before=structuredClone(store.data);
  await expect(commitProgramDraft(store,draft,{locks})).rejects.toThrow('PROGRAM_DAY_INVALID');
  expect(store.data).toEqual(before);
});

test('an independent deleted day stays deleted while a new program is saved',async()=>{
  const base=[{id:'unrelated-day',title:'Dzień samodzielny',exercises:[{key:'bench_flat',sets:3,target:'8'}]}],registry=state(),store=storeFor(registry,base),draft=createProgramDraft(registry,base);
  addDraftDay(draft);draft.plans.at(-1).exercises=[{key:'bench_flat',sets:2,target:'10'}];store.data.gymverse_plans='[]';
  const saved=await commitProgramDraft(store,draft,{locks});
  expect(saved.plans.map(day=>day.id)).toEqual(draft.dayPlanIds);
});
