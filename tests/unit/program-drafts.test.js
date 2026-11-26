import {test,expect} from 'vitest';
import {DRAFT_KEY,saveWorkingDraft,removeWorkingDraft,readWorkingDrafts} from '../../src/features/plans/program-drafts.js';
const locks={request:async(n,o,fn)=>fn()};
const state={activeProfileId:'profile-one',profiles:[{id:'profile-one',data:{}}]};
const payload=()=>({draft:{profileId:'profile-one',programId:null,title:'Test',dayPlanIds:['day-one'],plans:[{id:'day-one',title:'Dzień',exercises:[]}],basePlans:[],baseState:state},selected:'day-one',custom:{},baseCustom:{}});
function store(){const data={gymverse_profiles_v1:JSON.stringify(state)};return {data,refreshSnapshot:async()=>({...data}),transact:async u=>{for(const[k,v]of Object.entries(u))data[k]=JSON.stringify(v)}};}
test('working draft CAS refuses stale writes and stale deletes, preserves other drafts',async()=>{
 const s=store(),a=await saveWorkingDraft(s,{id:'draft-one',revision:null,...payload()},{locks});
 const b=await saveWorkingDraft(s,{...a,...payload()},{locks});
 await expect(saveWorkingDraft(s,a,{locks})).rejects.toThrow('DRAFT_CONFLICT');
 await expect(removeWorkingDraft(s,a,{locks})).rejects.toThrow('DRAFT_CONFLICT');
 await saveWorkingDraft(s,{id:'draft-two',revision:null,...payload()},{locks});
 await removeWorkingDraft(s,b,{locks});expect(readWorkingDrafts(s.data[DRAFT_KEY]).items.map(x=>x.id)).toEqual(['draft-two']);
 await expect(saveWorkingDraft(s,b,{locks})).rejects.toThrow('DRAFT_CONFLICT');
});
test('refuses wrong profile and reports partial write uncertainty',async()=>{
 const s=store(),r={id:'draft-one',revision:null,...payload()};s.data.gymverse_profiles_v1=JSON.stringify({...state,activeProfileId:'other'});
 await expect(saveWorkingDraft(s,r,{locks})).rejects.toThrow('DRAFT_PROFILE_CHANGED');
 s.data.gymverse_profiles_v1=JSON.stringify(state);s.transact=async u=>{s.data[DRAFT_KEY]=JSON.stringify(u[DRAFT_KEY]);throw Error('partial')};
 await expect(saveWorkingDraft(s,r,{locks})).rejects.toMatchObject({integrityUncertain:true});
});

import {bootstrapProfileState,switchProfile,createProfile,exportProfileSnapshot,deleteProfile} from '../../src/features/profiles/profile-model.js';
import {planBackupImport} from '../../src/features/backup/import-plan.js';
import {inspectLegacySnapshot,createBackupV5,previewBackupV5,restoreBackupV5} from '../../src/gv-data.js';
test('global drafts survive bootstrap/switch and stay out of per-profile exports; delete removes only owner',()=>{
 const initial=bootstrapProfileState({gymverse_plans:'[]'},{id:'profile-one'}).state;
 const registry=createProfile(initial,{name:'Two'},{id:'profile-two'}).state;
 const work={version:1,items:[{id:'draft-one',revision:'revision-one',...payload()},{id:'draft-two',revision:'revision-two',...payload(),draft:{...payload().draft,profileId:'profile-two',baseState:{activeProfileId:'profile-two',profiles:[{id:'profile-two'}]}}}]};
 const raw={gymverse_plans:'[]',[DRAFT_KEY]:JSON.stringify(work)};
 expect(bootstrapProfileState({...raw,gymverse_profiles_v1:JSON.stringify(registry)}).state).toEqual(registry);
 expect(switchProfile(registry,raw,'profile-two').updates).not.toHaveProperty(DRAFT_KEY);
 expect(exportProfileSnapshot(registry,raw).data).not.toHaveProperty(DRAFT_KEY);
 expect(deleteProfile(registry,'profile-one',raw).updates[DRAFT_KEY].items.map(x=>x.id)).toEqual(['draft-two']);
});
test('ZIP v5 optional draft roundtrip, explicit exclusion and malformed payload rejection',async()=>{
 const work={version:1,items:[{id:'draft-one',revision:'revision-one',...payload()}]};
 const snap={gymverse_schema:4,gymverse_plans:[],[DRAFT_KEY]:work};
 const preview=await previewBackupV5(await createBackupV5(snap));expect(preview.snapshot[DRAFT_KEY]).toEqual(work);expect(preview.counts.drafts).toBe(1);
 const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 await restoreBackupV5(storage,preview,{confirmed:true,restoreActive:false,restoreDrafts:true});expect(JSON.parse(values.get(DRAFT_KEY))).toEqual(work);
 await restoreBackupV5(storage,preview,{confirmed:true,restoreActive:false,restoreDrafts:false});expect(values.has(DRAFT_KEY)).toBe(false);
 expect((await inspectLegacySnapshot({[DRAFT_KEY]:{version:1,items:[{}]}})).ok).toBe(false);
});
test('smart import preserves newer local draft and admits distinct incoming draft',()=>{
 const base={gymverse_schema:4,gymverse_plans:[],gymverse_profiles_v1:{schemaVersion:1,activeProfileId:'profile-one',profiles:[{id:'profile-one',name:'One',data:{}}]}};
 const a={id:'draft-one',revision:'newer',...payload()},b={...a,revision:'older'},c={...a,id:'draft-two'};
 const plan=planBackupImport({...base,[DRAFT_KEY]:{version:1,items:[a]}},{...base,[DRAFT_KEY]:{version:1,items:[b,c]}});
 expect(plan.snapshot[DRAFT_KEY].items).toEqual([a,c]);expect(plan.conflicts.some(x=>x.type==='program-draft')).toBe(true);
});

import {createProgramDraft,addDraftDay,commitProgramDraft} from '../../src/features/plans/program-editor.js';
test('program commit consumes only matching draft atomically and cannot consume a newer revision',async()=>{
 const s=store(),d=createProgramDraft(state,[]);addDraftDay(d);d.plans[0].exercises=[{key:'bench_flat',sets:3,target:'8'}];
 const a=await saveWorkingDraft(s,{id:'draft-one',revision:null,draft:d,selected:d.dayPlanIds[0],custom:{},baseCustom:{}},{locks});
 const b=await saveWorkingDraft(s,{...a,id:'draft-two',revision:null},{locks});
 const newer=await saveWorkingDraft(s,a,{locks});
 await expect(commitProgramDraft(s,d,{locks,workingDraft:a})).rejects.toThrow('DRAFT_CONFLICT');expect(s.data.gymverse_plans).toBeUndefined();
 await commitProgramDraft(s,d,{locks,workingDraft:newer});expect(readWorkingDrafts(s.data[DRAFT_KEY]).items).toEqual([b]);
});

test('a known revision cannot transfer a draft to another profile or program',async()=>{
 const s=store(),a=await saveWorkingDraft(s,{id:'draft-one',revision:null,...payload()},{locks});
 await expect(saveWorkingDraft(s,{...a,draft:{...a.draft,programId:'another-program'}},{locks})).rejects.toThrow('DRAFT_CONFLICT');
 s.data.gymverse_profiles_v1=JSON.stringify({...state,activeProfileId:'profile-two'});
 await expect(saveWorkingDraft(s,{...a,draft:{...a.draft,profileId:'profile-two'}},{locks})).rejects.toThrow('DRAFT_CONFLICT');
 expect(readWorkingDrafts(s.data[DRAFT_KEY]).items).toEqual([a]);
});

test('legacy exercises without target survive generated draft backup; malformed answers fail',async()=>{const s=store(),item={id:'draft-legacy',revision:null,...payload()};item.draft.plans.push({id:'legacy',title:'Legacy',exercises:[{key:'bench_flat',sets:3}]});item.draft.basePlans=structuredClone(item.draft.plans.slice(1));item.draft.generatorAnswers={goal:'fitness',daysPerWeek:3,focus:['chest']};const saved=await saveWorkingDraft(s,item,{locks});expect(readWorkingDrafts(s.data[DRAFT_KEY]).items[0]).toEqual(saved);saved.draft.generatorAnswers.focus='invalid';await expect(saveWorkingDraft(s,saved,{locks})).rejects.toThrow('PROGRAM_DRAFT_INVALID');});
