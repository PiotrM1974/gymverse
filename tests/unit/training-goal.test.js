import { test, expect } from 'vitest';
import { bootstrapProfileState, createProfile, updateProfile, exportProfileSnapshot, importProfileSnapshot, switchProfile } from '../../src/features/profiles/profile-model.js';
import { planBackupImport } from '../../src/features/backup/import-plan.js';
const base=()=>bootstrapProfileState({}, {id:'profile-one'}).state;
const snapshot=(state)=>({gymverse_history:[],gymverse_plans:[],gymverse_profiles_v1:state});
test('training goal is optional, validated, preserved and explicitly cleared',()=>{
 const state=base();
 expect(Object.hasOwn(state.profiles[0].attributes||{},'trainingGoal')).toBe(false);
 for(const goal of ['fat_loss','hypertrophy','recomposition','fitness',null]) expect(createProfile(state,{name:'Other',trainingGoal:goal},{id:'profile-two'}).profile.attributes.trainingGoal).toBe(goal);
 expect(()=>createProfile(state,{name:'Other',trainingGoal:'wrong'},{id:'profile-two'})).toThrow('PROFILE_TRAINING_GOAL_INVALID');
 const one=updateProfile(state,'profile-one',{name:'One',trainingGoal:'fitness'}).state;
 expect(updateProfile(one,'profile-one',{name:'One'}).profile.attributes.trainingGoal).toBe('fitness');
 expect(updateProfile(one,'profile-one',{name:'One',trainingGoal:null}).profile.attributes.trainingGoal).toBeNull();
 expect(Object.hasOwn(updateProfile(state,'profile-one',{name:'One'}).profile.attributes,'trainingGoal')).toBe(false);
});
test('single profile export/import and switching preserve independent goals',()=>{
 const a=updateProfile(base(),'profile-one',{name:'One',trainingGoal:'fitness'}).state;
 const b=createProfile(a,{name:'Two',trainingGoal:'fat_loss'},{id:'profile-two'}).state;
 const payload=exportProfileSnapshot(b,{},'profile-one');
 const imported=importProfileSnapshot(b,payload,{id:'profile-three'}).state;
 expect(imported.profiles[2].attributes.trainingGoal).toBe('fitness');
 const switched=switchProfile(imported,{},'profile-two').state;
 expect(switched.profiles.map(p=>p.attributes.trainingGoal)).toEqual(['fitness','fat_loss','fitness']);
});
test('smart merge fills missing goal, preserves local conflict and null',()=>{
 const local=updateProfile(base(),'profile-one',{name:'One'}).state;
 const incoming=updateProfile(local,'profile-one',{name:'One',trainingGoal:'fitness'}).state;
 const merged=planBackupImport(snapshot(local),snapshot(incoming));
 expect(merged.snapshot.gymverse_profiles_v1.profiles[0].attributes.trainingGoal).toBe('fitness');
 const cleared=updateProfile(local,'profile-one',{name:'One',trainingGoal:null}).state;
 const conflict=planBackupImport(snapshot(cleared),snapshot(incoming));
 expect(conflict.snapshot.gymverse_profiles_v1.profiles[0].attributes.trainingGoal).toBeNull();
 expect(conflict.conflicts).toContainEqual({profileId:'profile-one',type:'profile-training-goal',recordId:'profile-one'});
});
