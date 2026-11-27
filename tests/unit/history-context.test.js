import {test,expect} from 'vitest';
import {captureSessionContext,nextProgramDay,validateSessionContext,matchesHistoryScope,historyProgramContext,currentProgramContext,progressionHistory,variantKey} from '../../src/features/plans/history-context.js';
const profile={planPrograms:{programs:[{id:'pg-a',title:'Program',dayPlanIds:['day-a','day-b']}]}};
const sessions=[{id:'a',planId:'day-a',planTitle:'Same',details:[{exerciseId:'db_fly',variantId:'incline',rir:2}]},{id:'b',planId:'outside',planTitle:'Same',details:[{exerciseId:'db_fly',variantId:'default'}]},{id:'legacy',planTitle:'Same',details:[]}];
test('captures exact program identity at start and rejects mere assignment or a wrong day',()=>{
 const id='pg_'+ 'a'.repeat(32),p={id:'profile-a',planPrograms:{assignedProgramId:id,programs:[{id,title:'Upper / Lower',dayPlanIds:['day-a','day-b','day-c']}]}};
 expect(captureSessionContext(p,'day-b',id)).toEqual({kind:'program',profileId:'profile-a',dayPlanId:'day-b',programId:id,programTitle:'Upper / Lower',dayNumber:2});
 expect(captureSessionContext(p,'day-b')).toEqual({kind:'standalone',profileId:'profile-a',dayPlanId:'day-b'});
 expect(()=>captureSessionContext(p,'day-outside',id)).toThrow();
});
test('historical program filter ignores current membership and legacy unknown records',()=>{
 const id='pg_'+'a'.repeat(32),other='pg_'+'b'.repeat(32);
 const saved={id:'saved',planId:'day-a',sessionContext:{kind:'program',profileId:'profile-a',dayPlanId:'day-a',programId:id,programTitle:'Old title',dayNumber:1},details:[]};
 const standalone={id:'standalone',planId:'day-b',sessionContext:{kind:'standalone',profileId:'profile-a',dayPlanId:'day-b'},details:[]};
 const legacy={id:'legacy',planId:'day-a',details:[]};
 const moved={id:'profile-a',planPrograms:{programs:[{id:other,title:'New title',dayPlanIds:['day-a','day-b']}]}};
 expect(historyProgramContext(saved,moved)).toMatchObject({kind:'program',programId:id,programTitle:'Old title',dayNumber:1});
 expect(historyProgramContext(standalone,moved)).toMatchObject({kind:'standalone'});
 expect(historyProgramContext(legacy,moved)).toMatchObject({kind:'unknown'});
 expect(currentProgramContext(legacy,moved)).toMatchObject({dayNumber:1});
 expect([saved,standalone,legacy].filter(s=>matchesHistoryScope(s,moved,{programId:id})).map(s=>s.id)).toEqual(['saved']);
 expect([saved,standalone,legacy].filter(s=>matchesHistoryScope(s,moved,{programId:other}))).toEqual([]);
});
test('context validation preserves old records and rejects mismatched or invented program references',()=>{
 const id='pg_'+'a'.repeat(32),valid={kind:'program',profileId:'profile-a',dayPlanId:'day-a',programId:id,programTitle:'Original',dayNumber:1};
 expect(validateSessionContext(undefined,'day-a')).toBe(true);
 expect(validateSessionContext(valid,'day-a')).toBe(true);
 expect(validateSessionContext({...valid,dayPlanId:'day-b'},'day-a')).toBe(false);
 expect(validateSessionContext({...valid,programId:'other'},'day-a')).toBe(false);
 expect(validateSessionContext({kind:'standalone',profileId:'profile-a',dayPlanId:'day-a',programId:id},'day-a')).toBe(false);
});
test('exercise and variant must match the same logged set',()=>{expect(matchesHistoryScope(sessions[0],profile,{exerciseId:'db_fly',variant:'default'})).toBe(false);expect(matchesHistoryScope(sessions[0],profile,{exerciseId:'db_fly',variant:'incline'})).toBe(true);expect(variantKey({})).not.toBe(variantKey({variantId:'default'}));});
test('progression isolates day and variant without modifying history',()=>{const before=JSON.stringify(sessions),plan={id:'day-a',exercises:[{key:'db_fly',variantId:'incline'}]};expect(progressionHistory(sessions,plan,'db_fly')).toEqual([sessions[0]]);expect(JSON.stringify(sessions)).toBe(before);expect(progressionHistory(sessions,{...plan,id:'missing'},'db_fly')).toEqual([]);});
import {analyzeExerciseProgression} from '../../src/features/plans/progression.js';
test('same names and different variants cannot provide the two sessions needed for progression',()=>{const plan={id:'day-a',exercises:[{key:'db_fly',variantId:'incline',sets:1,target:'8-10'}]},detail={exerciseId:'db_fly',variantId:'incline',setNumber:1,weight:40,reps:11,rir:2};const history=[{id:'one',planId:'day-a',date:'2026-11-20',details:[detail]},{id:'other-day',planId:'day-b',date:'2026-11-21',details:[detail]},{id:'other-variant',planId:'day-a',date:'2026-11-22',details:[{...detail,variantId:'default'}]}];const result=analyzeExerciseProgression({exerciseId:'db_fly',plan,history:progressionHistory(history,plan,'db_fly'),catalog:[{id:'db_fly'}]});expect(result.proposal).toBeNull();expect(result.reason).toBe('INSUFFICIENT_SESSIONS');});


test('suggests the next available day using completed workouts from the same profile and program',()=>{
  const id='pg_'+'a'.repeat(32);
  const program={id,title:'Testowy',dayPlanIds:['one','empty','three','four']};
  const plans=program.dayPlanIds.map(id=>({id,exercises:id==='empty'?[]:[{}]}));
  const saved=(day,dayNumber,date,scope={})=>({planId:day,date,details:[{reps:8}],
    sessionContext:{kind:'program',profileId:'profile-a',dayPlanId:day,programId:id,programTitle:'Stara nazwa',dayNumber,...scope}});
  const first=saved('one',1,'2026-11-25');
  const unrelated=[
    saved('three',3,'2026-11-26',{profileId:'profile-b'}),
    saved('three',3,'2026-11-26',{programId:'pg_'+'b'.repeat(32)}),
    {planId:'three',date:'2026-11-26',details:[{reps:8}]},
    {...saved('three',3,'2026-11-26'),details:[]}
  ];
  expect(nextProgramDay('profile-a',program,plans,unrelated)).toEqual({plan:plans[0],number:1});
  expect(nextProgramDay('profile-a',program,plans,[...unrelated,first])).toEqual({plan:plans[2],number:3});
  expect(nextProgramDay('profile-a',program,plans,[saved('four',4,'2026-11-26'),first])).toEqual({plan:plans[0],number:1});
  expect(nextProgramDay('profile-a',program,[],[first])).toBeNull();
});
