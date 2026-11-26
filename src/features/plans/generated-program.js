import {createProgramDraft} from './program-editor.js';
// Adapt records only. Exercise selection and training rules remain owned by generator.js.
export function createGeneratedProgramDraft(state,plans,result,answers){
 if(!result?.ok||!Array.isArray(result.plans)||result.plans.length<1||result.plans.length>6)throw Error('GENERATED_PROGRAM_INVALID');
 const days=structuredClone(result.plans),ids=days.map(p=>p.id);
 if(new Set(ids).size!==ids.length||ids.some(id=>plans.some(p=>p.id===id)))throw Error('GENERATED_PROGRAM_INVALID');
 const draft=createProgramDraft(state,plans);
 draft.generatedProgramId='pg_'+crypto.randomUUID().replaceAll('-','').toLowerCase();
 draft.title='Mój wygenerowany program';draft.dayPlanIds=ids;
 draft.plans.push(...days.map(day=>({...day,title:(day.title.length>40?day.title.replace(/^Do sprawdzenia · /,''):day.title).slice(0,40)})));
 draft.generatorAnswers=structuredClone(answers);
 return draft;
}
