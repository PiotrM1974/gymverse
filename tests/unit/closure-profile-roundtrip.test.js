import {test,expect} from 'vitest';
import {exportProfileSnapshot,importProfileSnapshot} from '../../src/features/profiles/profile-model.js';
for(const populated of [false,true]) test(`isolated profile export-import preserves all keys, populated=${populated}`,()=>{
 const source={schemaVersion:1,activeProfileId:'source-profile',profiles:[{id:'source-profile',name:'Synthetic',createdAt:'2026-01-01T00:00:00.000Z',attributes:{},data:{}}]};
 const data=populated?{
 gymverse_history:JSON.stringify([{id:'s',date:'2026-01-01T10:00:00Z',details:[{id:'set',exerciseId:'bench_flat',variantId:'default',setNumber:1,weight:40,reps:8}]}]),
 gymverse_plans:JSON.stringify([{id:'p1',title:'One',exercises:[]},{id:'p2',title:'Two',exercises:[]}]),
 gymverse_active:JSON.stringify({planId:'p1',startedAt:1,step:0,sets:[{id:'active-set',weight:40,reps:8}],timerEndAt:null}),
 gymverse_rest:JSON.stringify(120)
 }:{gymverse_history:'[]',gymverse_plans:'[]'};
 const payload=JSON.parse(JSON.stringify(exportProfileSnapshot(source,data)));
 const target={schemaVersion:1,activeProfileId:'target-profile',profiles:[{id:'target-profile',name:'Untouched',createdAt:'2026-01-01T00:00:00.000Z',attributes:{},data:{gymverse_history:'[]'}}]};
 const before=JSON.stringify(target);
 const result=importProfileSnapshot(target,payload,{id:'restored-profile'});
 expect(result.profile.data).toEqual(data);
 expect(result.state.profiles[0]).toEqual(target.profiles[0]);
 expect(JSON.stringify(target)).toBe(before);
 expect(result.profile.id).toBe('restored-profile');
});
