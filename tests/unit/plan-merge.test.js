import { expect, test } from 'vitest';
import { mergePlanChanges, mergeRecordChanges } from '../../src/features/plans/plan-merge.js';

test('merges edits to different plans by stable ID',()=>{
  const base=[{id:'a',title:'A',exercises:[]},{id:'b',title:'B',exercises:[]}];
  const proposed=[{...base[0],title:'A local'},base[1]];
  const latest=[base[0],{...base[1],title:'B remote'}];
  expect(mergePlanChanges(base,proposed,latest)).toEqual([{...base[0],title:'A local'},{...base[1],title:'B remote'}]);
});

test('rejects changes or deletions to a plan concurrently edited by another tab',()=>{
  const base=[{id:'a',title:'A',exercises:[]}];
  expect(()=>mergePlanChanges(base,[{...base[0],title:'A local'}],[{...base[0],title:'A remote'}])).toThrow('PLAN_DATA_STALE');
  expect(()=>mergePlanChanges(base,[],[{...base[0],title:'A remote'}])).toThrow('PLAN_DATA_STALE');
});

test('preserves concurrent plan additions and combines distinct custom exercise keys',()=>{
  const base=[{id:'a',title:'A',exercises:[]}],local=[...base,{id:'local',title:'Local',exercises:[]}],latest=[...base,{id:'remote',title:'Remote',exercises:[]}];
  expect(mergePlanChanges(base,local,latest).map(plan=>plan.id)).toEqual(['a','remote','local']);
  expect(mergeRecordChanges({}, {custom_a:{name:'A'}}, {custom_b:{name:'B'}})).toEqual({custom_b:{name:'B'},custom_a:{name:'A'}});
});

test('rejects concurrent changes to the same custom exercise key',()=>{
  expect(()=>mergeRecordChanges({custom_a:{name:'A'}},{custom_a:{name:'A local'}},{custom_a:{name:'A remote'}})).toThrow('PLAN_DATA_STALE');
});

test('record property order does not create a conflict, while exercise order remains meaningful',()=>{
  const base=[{id:'a',title:'A',exercises:[{key:'bench_flat',variantId:'default',sets:3,target:'8'},{key:'db_fly',sets:2,target:'10'}]}];
  const latest=[{title:'A',id:'a',exercises:[{sets:3,target:'8',key:'bench_flat',variantId:'default'},{target:'10',key:'db_fly',sets:2}]}];
  const proposed=structuredClone(base);proposed[0].exercises.reverse();
  expect(mergePlanChanges(base,proposed,latest)[0].exercises.map(ex=>ex.key)).toEqual(['db_fly','bench_flat']);
});
