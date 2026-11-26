import {test,expect} from 'vitest';
import {createGeneratedProgramDraft} from '../../src/features/plans/generated-program.js';
import {generatePlan} from '../../src/features/plans/generator.js';
import {EXERCISE_CATALOG} from '../../src/exercise/catalog.js';
import {commitProgramDraft} from '../../src/features/plans/program-editor.js';
const attributes={age:34,experience:'beginner',equipment:['machines','dumbbells','bench','cables'],restrictions:[],trainingGoal:'fitness'};
const state={activeProfileId:'p',profiles:[{id:'p',attributes,data:{}}]};
test.each([1,2,3,4,5,6])('real generator %i days commits as one unassigned program',async count=>{
 const answers={daysPerWeek:count,goal:'hypertrophy',split:'auto'};
 const result=generatePlan({profile:attributes,preferences:answers,catalog:EXERCISE_CATALOG});expect(result.ok).toBe(true);
 const existing=[{id:'old',title:'Old',exercises:[]}];
 const draft=createGeneratedProgramDraft(state,existing,result,answers);
 expect(draft.dayPlanIds).toEqual(result.plans.map(p=>p.id));expect(draft.basePlans).toEqual(existing);
 draft.plans[1].exercises[0].target='15';expect(result.plans[0].exercises[0].target).not.toBe('15');
 if(count===6)expect(new Set(result.plans.map(p=>JSON.stringify(p.exercises))).size).toBeGreaterThan(1);
 const data={gymverse_profiles_v1:JSON.stringify(state),gymverse_plans:JSON.stringify(existing),gymverse_history:'[1]',gymverse_rir:'[2]'};
 const store={refreshSnapshot:async()=>({...data}),transact:async u=>{for(const[k,v]of Object.entries(u))data[k]=JSON.stringify(v);}};
 const saved=await commitProgramDraft(store,draft,{locks:{request:async(n,o,fn)=>fn()}});
 expect(saved.state.profiles[0].planPrograms.programs[0].dayPlanIds).toEqual(draft.dayPlanIds);
 expect(saved.state.profiles[0].planPrograms.assignedProgramId).toBeNull();expect(saved.state.profiles[0].attributes.trainingGoal).toBe('fitness');expect(data.gymverse_history).toBe('[1]');expect(data.gymverse_rir).toBe('[2]');
});
test('rejects duplicate and colliding generated identifiers',()=>{
 const p={id:'x',title:'X',exercises:[{key:'bench_flat',sets:3,target:'8'}]};
 expect(()=>createGeneratedProgramDraft(state,[],{ok:true,plans:[p,p]},{})).toThrow();
 expect(()=>createGeneratedProgramDraft(state,[p],{ok:true,plans:[p]},{})).toThrow();
});
