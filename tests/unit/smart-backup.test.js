import {test,expect} from 'vitest';
import {planBackupImport} from '../../src/features/backup/import-plan.js';
const session=n=>({id:'session-'+n,date:'2026-01-01T10:00:00Z',details:[{exerciseId:'bench_flat',setNumber:1,weight:40+n,reps:8}]});
const snapshot=(sessions,id='profile-one')=>({gymverse_history:sessions,gymverse_plans:[],gymverse_profiles_v1:{schemaVersion:1,activeProfileId:id,profiles:[{id,name:'Same name',data:{}}]}});
test('80 common + 15 absent sessions, repeat import is idempotent',()=>{
 const local=snapshot(Array.from({length:80},(_,i)=>session(i))),source=snapshot(Array.from({length:95},(_,i)=>session(i)));
 const before=structuredClone(local);const plan=planBackupImport(local,source);
 expect(plan.stats).toMatchObject({existing:80,added:15,conflicts:0});expect(plan.snapshot.gymverse_history).toHaveLength(95);
 expect(planBackupImport(plan.snapshot,source).stats).toMatchObject({existing:95,added:0});expect(local).toEqual(before);
});
test('partial overlap and ID conflict preserve local session and active work',()=>{
 const local=snapshot([session(1),session(3)]);local.gymverse_active={sets:[session(1).details[0]],startedAt:1};
 const source=snapshot([{...session(1),details:[{...session(1).details[0],weight:999}]},session(2)]);
 const plan=planBackupImport(local,source);expect(plan.stats).toMatchObject({conflicts:1,added:1});expect(plan.snapshot.gymverse_history[0]).toEqual(session(1));expect(plan.snapshot.gymverse_active).toEqual(local.gymverse_active);
});
test('same name different identity creates independent profile',()=>{
 const plan=planBackupImport(snapshot([session(1)]),snapshot([session(2)],'profile-two'));
 expect(plan.stats.newProfiles).toBe(1);expect(plan.snapshot.gymverse_profiles_v1.profiles).toHaveLength(2);expect(plan.snapshot.gymverse_history).toEqual([session(1)]);
});
test('smart import keeps historical program context and refuses a conflicting older copy',()=>{
 const context={kind:'program',profileId:'profile-one',dayPlanId:'day-one',programId:'pg_'+'a'.repeat(32),programTitle:'Original',dayNumber:1};
 const logged={...session(1),planId:'day-one',sessionContext:context};
 const imported=planBackupImport(snapshot([]),snapshot([logged]));
 expect(imported.snapshot.gymverse_history[0].sessionContext).toEqual(context);
 const older={...logged};delete older.sessionContext;
 const second=planBackupImport(imported.snapshot,snapshot([older]));
 expect(second.stats).toMatchObject({conflicts:1,added:0});
 expect(second.snapshot.gymverse_history[0]).toEqual(logged);
});
test('import preview counts actual programs separately from day plans',()=>{
 const source=snapshot([]);source.gymverse_plans=[{id:'day-one',title:'Day one',exercises:[{key:'bench_flat',sets:1,target:'8-12'}]}];
 source.gymverse_profiles_v1.profiles[0].planPrograms={schemaVersion:1,assignedProgramId:null,programs:[{id:'pg_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',title:'Program',dayPlanIds:['day-one']}]};
 const plan=planBackupImport(snapshot([]),source);
 expect(plan.profileOverview).toMatchObject([{programs:1,plans:1,sessions:0}]);
});
test('legacy profileless backup requires explicit target',()=>{
 const local=snapshot([]),source={gymverse_history:[session(1)]};expect(planBackupImport(local,source).requiresAssignment).toBe(true);
 expect(planBackupImport(local,source,{targetProfileId:'profile-one'}).stats.added).toBe(1);
});
test('conflicting plans, settings and progression retain local values',()=>{
 const local=snapshot([]),source=snapshot([]);local.gymverse_plans=[{id:'p',title:'New',progression:{approved:true}}];source.gymverse_plans=[{id:'p',title:'Old'}];local.gymverse_rest=120;source.gymverse_rest=60;
 const result=planBackupImport(local,source);expect(result.snapshot.gymverse_plans).toEqual(local.gymverse_plans);expect(result.snapshot.gymverse_rest).toBe(120);expect(result.stats.conflicts).toBe(1);
});
test('legacy identical same-time sessions preserve multiplicity',()=>{
 const s=session(1);delete s.id;const plan=planBackupImport(snapshot([s]),snapshot([s,s]));expect(plan.stats).toMatchObject({existing:1,added:1});expect(plan.snapshot.gymverse_history).toHaveLength(2);
});
test('custom exercise identity collision blocks dependent sessions and plans',()=>{
 const local=snapshot([]),source=snapshot([{...session(1),details:[{exerciseId:'c_shared',weight:40,reps:8}]}]);
 local.gymverse_custom={c_shared:{name:'One',bw:false}};source.gymverse_custom={c_shared:{name:'Other',bw:true}};
 source.gymverse_plans=[{id:'new-plan',exercises:[{key:'c_shared',sets:1,target:'8-12'}]}];
 const result=planBackupImport(local,source);expect(result.stats.conflicts).toBe(3);expect(result.snapshot.gymverse_history).toHaveLength(0);expect(result.snapshot.gymverse_plans).toHaveLength(0);expect(result.snapshot.gymverse_custom).toEqual(local.gymverse_custom);
});
test('generated legacy IDs are content hints, not evidence of a different session',()=>{
 const local=snapshot([{...session(1),id:'legacy-session-old-1'}]);
 const source=snapshot([{...session(1),id:'legacy-session-new-1'}]);
 expect(planBackupImport(local,source).stats).toMatchObject({existing:1,added:0,conflicts:0});
});
test('explicitly unmapped historical series remain portable without catalog guessing',async()=>{
 const {createBackupV5,previewBackupV5}=await import('../../src/gv-data.js');
 const data={gymverse_history:[{id:'unknown-source',date:'2026-01-01T00:00:00Z',details:[{exerciseId:'historical_unknown',unmappedExercise:true,setNumber:1,weight:25,reps:7}]}]};
 const options={strictExerciseCatalog:true,catalog:{bench_flat:'Bench'}};
 const restored=await previewBackupV5(await createBackupV5(data,{validationOptions:options}),options);
 expect(restored.snapshot.gymverse_history[0].details[0]).toMatchObject({exerciseId:'historical_unknown',unmappedExercise:true,weight:25,reps:7});
});
test('interpretation of conflicting imported session cannot change the retained session',async()=>{
 const {createBackupV5,previewBackupV5}=await import('../../src/gv-data.js');
 const {prepareMergedBackup}=await import('../../src/features/backup/import-plan.js');
 const current=snapshot([session(1)]),incoming=snapshot([{...session(1),details:[{...session(1).details[0],weight:900}]}]);
 const rule={id:'unsafe-rule',exerciseId:'bench_flat',sessionIds:['session-1'],ruleVersion:1,source:'user_confirmed',confirmedAt:'2026-01-02T00:00:00.000Z',interpretation:{unit:'user_confirmed'}};
 const local=await previewBackupV5(await createBackupV5(current));const source=await previewBackupV5(await createBackupV5(incoming,{legacyInterpretations:[rule]}));
 const plan=planBackupImport(local.snapshot,source.snapshot);const result=await prepareMergedBackup(local,source,plan);
 expect(result.preview.interpretations).toHaveLength(0);expect(result.auxiliaryConflicts).toBe(1);expect(result.preview.snapshot.gymverse_history[0].details[0].weight).toBe(41);
});
test('backup rejects unsupported schema and broken JSON inside inactive profiles',async()=>{
 const {createBackupV5}=await import('../../src/gv-data.js');
 for(const data of [{gymverse_schema:'999'},{gymverse_history:'{'},{gymverse_history:[]}]){
 const source=snapshot([]);source.gymverse_profiles_v1.profiles.push({id:'inactive-profile',name:'Invalid synthetic',data});
 await expect(createBackupV5(source)).rejects.toThrow('SNAPSHOT_INVALID');
 }
});
