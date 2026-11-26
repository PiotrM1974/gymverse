import { test, expect } from 'vitest';
import { createProgramDraft, addDraftDay, attachDraftDay, commitProgramDraft } from '../../src/features/plans/program-editor.js';
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
  store.data.gymverse_plans='[{"id":"new"}]';
  await expect(commitProgramDraft(store,draft,{locks})).rejects.toThrow('PROGRAM_STATE_STALE');
  store.data.gymverse_plans='[]';store.data.gymverse_active='{"planId":"other"}';
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
