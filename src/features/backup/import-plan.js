import { DRAFT_KEY, readWorkingDrafts } from '../plans/program-drafts.js';
// Compare source metrics rather than derived totals and catalog display names.
function legacySessionFingerprint(session) {
  const value=structuredClone(session);delete value.id;
  value.date=new Date(value.date).toISOString();
  if(Array.isArray(value.details)&&value.details.length){
    delete value.totalVolume;delete value.totalReps;
    value.details=value.details.map(set=>{const row={...set};delete row.id;delete row.exerciseName;delete row.unmappedExercise;row.variantId=row.variantId||'default';row.setNumber=Number(row.setNumber)||1;row.weight=Number(row.weight);row.reps=Number(row.reps);row.date=new Date(row.date||value.date).toISOString();return row;});
  }
  return canonical(value);
}
import { PROFILE_DATA_KEYS, readProfileState } from '../profiles/profile-model.js';
import { validatePlanPrograms } from '../plans/programs.js';
const clone = value => structuredClone(value);
const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}' : JSON.stringify(value);
const parse = (data,key,fallback) => data[key] == null ? clone(fallback) : JSON.parse(data[key]);
const rawData = snapshot => Object.fromEntries(PROFILE_DATA_KEYS.filter(k=>Object.hasOwn(snapshot,k)).map(k=>[k,JSON.stringify(snapshot[k])]));
export function backupProfiles(snapshot) {
  const raw=rawData(snapshot);
  const registry=readProfileState({ ...raw, ...(snapshot.gymverse_profiles_v1 ? {gymverse_profiles_v1:JSON.stringify(snapshot.gymverse_profiles_v1)} : {}) });
  if (!registry) return null;
  const result=clone(registry);
  result.profiles.find(p=>p.id===result.activeProfileId).data=raw;
  return result;
}
export function planBackupImport(current, incoming, options={}) {
  const local=backupProfiles(current), source=backupProfiles(incoming);
  if (!local) throw new Error('IMPORT_LOCAL_PROFILE_REQUIRED');
  const isEmpty=local.onboardingRequired===true && !local.profiles.some(p=>parse(p.data,'gymverse_history',[]).length || parse(p.data,'gymverse_active',null));
  let imported=source;
  if (!imported) {
    if (!options.targetProfileId || !local.profiles.some(p=>p.id===options.targetProfileId)) return {requiresAssignment:true,profiles:1,plans:(incoming.gymverse_plans||[]).length,sessions:(incoming.gymverse_history||[]).length};
    imported={activeProfileId:options.targetProfileId,profiles:[{id:options.targetProfileId,data:rawData(incoming)}]};
  }
  const stats={profiles:imported.profiles.length,plans:0,sessions:0,existing:0,added:0,conflicts:0,newProfiles:0};
  const registry=clone(local), conflicts=[];
  const mark=(profileId,type,recordId)=>{stats.conflicts++;conflicts.push({profileId,type,recordId});};
  for (const sourceProfile of imported.profiles) {
    const sourceData=sourceProfile.data;
    if (sourceProfile.planPrograms) validatePlanPrograms(sourceProfile.planPrograms,parse(sourceData,'gymverse_plans',[]));
    const sessions=parse(sourceData,'gymverse_history',[]);
    stats.sessions+=sessions.length;stats.plans+=parse(sourceData,'gymverse_plans',[]).length;
    let target=registry.profiles.find(p=>p.id===sourceProfile.id);
    if (!target) {
      target=clone(sourceProfile);registry.profiles.push(target);stats.newProfiles++;stats.added+=sessions.length;continue;
    }
    if (Object.hasOwn(sourceProfile.attributes || {}, 'trainingGoal')) {
      const sourceGoal=sourceProfile.attributes.trainingGoal;
      if (!Object.hasOwn(target.attributes || {}, 'trainingGoal')) target.attributes={...(target.attributes || {}),trainingGoal:sourceGoal};
      else if (target.attributes.trainingGoal !== sourceGoal) mark(target.id,'profile-training-goal',target.id);
    }
    const result=clone(target.data);
    const localCustom=parse(result,'gymverse_custom',{}), sourceCustom=parse(sourceData,'gymverse_custom',{});
    const blockedCustom=new Set(Object.keys(sourceCustom).filter(id=>Object.hasOwn(localCustom,id)&&canonical(localCustom[id])!==canonical(sourceCustom[id])));
    for(const id of blockedCustom) mark(target.id,'custom-exercise',id);
    const history=parse(result,'gymverse_history',[]);
    const seen=new Map(history.filter(s=>s.id).map(s=>[s.id,s]));
    const counts=new Map();history.forEach(s=>{const f=legacySessionFingerprint(s);counts.set(f,(counts.get(f)||0)+1);});
    const occurrences=new Map();
    for (const session of sessions) {
      if ((session.details||[]).some(row=>blockedCustom.has(row.exerciseId))) { mark(target.id,'session-custom-exercise',session.id);continue; }
      const durableId = session.id && !String(session.id).startsWith('legacy-session-');
      if (durableId && seen.has(session.id)) {
        if (legacySessionFingerprint(seen.get(session.id))===legacySessionFingerprint(session)) stats.existing++;else mark(target.id,'session',session.id);
        continue;
      }
      const f=legacySessionFingerprint(session),n=(occurrences.get(f)||0)+1;occurrences.set(f,n);
      if (!durableId && n<=(counts.get(f)||0)) {stats.existing++;continue;}
      history.push(clone(session));if(session.id)seen.set(session.id,session);stats.added++;
    }
    result.gymverse_history=JSON.stringify(history);
    for (const key of PROFILE_DATA_KEYS.filter(k=>k!=='gymverse_history')) {
      if (!Object.hasOwn(sourceData,key)) continue;
      if (!Object.hasOwn(result,key) && key !== 'gymverse_plans') {result[key]=sourceData[key];continue;}
      if (key==='gymverse_plans' || key==='gymverse_body') {
        const items=parse(result,key,[]), others=parse(sourceData,key,[]), identity=key==='gymverse_plans'?'id':'date';
        for(const item of others){if(key==='gymverse_plans'&&(item.exercises||[]).some(row=>blockedCustom.has(row.key))){mark(target.id,key);continue;}const prior=items.find(v=>v[identity]===item[identity]);if(!prior)items.push(clone(item));else if(canonical(prior)!==canonical(item))mark(target.id,key);}
        result[key]=JSON.stringify(items);
      } else if (['gymverse_custom','gymverse_last_weights'].includes(key)) {
        const map=parse(result,key,{});
        for(const [id,value] of Object.entries(parse(sourceData,key,{}))) {if(!Object.hasOwn(map,id))Object.defineProperty(map,id,{value:clone(value),enumerable:true,writable:true,configurable:true});}
        result[key]=JSON.stringify(map);
      }
      // Existing settings, drafts, active work and progression metadata always win.
    }
    target.data=result;
    if (sourceProfile.planPrograms) {
      const hadLocalPrograms=Object.hasOwn(target,'planPrograms');
      const sourcePlans=parse(sourceData,'gymverse_plans',[]), mergedPlans=parse(result,'gymverse_plans',[]);
      let programs=clone(target.planPrograms || {schemaVersion:1,assignedProgramId:null,programs:[]});
      for (const incomingProgram of sourceProfile.planPrograms.programs) {
        const prior=programs.programs.find(p=>p.id===incomingProgram.id);
        if (prior) { if (canonical(prior)!==canonical(incomingProgram)) mark(target.id,'plan-program',incomingProgram.id); continue; }
        if(incomingProgram.dayPlanIds.some(id=>(target.planPrograms?.archivedDayPlanIds||[]).includes(id))){mark(target.id,'plan-program-days',incomingProgram.id);continue;}
        const safe=incomingProgram.dayPlanIds.every(id=>{const a=sourcePlans.find(p=>p.id===id),b=mergedPlans.find(p=>p.id===id);return a && b && canonical(a)===canonical(b);});
        if (!safe) { mark(target.id,'plan-program-days',incomingProgram.id); continue; }
        const candidate=clone(programs);candidate.programs.push(clone(incomingProgram));
        try { validatePlanPrograms(candidate,mergedPlans);programs=candidate; }
        catch (_) { mark(target.id,'plan-program-days',incomingProgram.id); }
      }
      const incomingAssigned=sourceProfile.planPrograms.assignedProgramId;
      if (hadLocalPrograms) {
        if (programs.assignedProgramId!==incomingAssigned) mark(target.id,'profile-program-assignment',target.id);
      } else if (incomingAssigned!==null) {
        const sourceProgram=sourceProfile.planPrograms.programs.find(p=>p.id===incomingAssigned);
        const accepted=programs.programs.find(p=>p.id===incomingAssigned);
        const daysMatch=sourceProgram?.dayPlanIds.every(id=>{const a=sourcePlans.find(p=>p.id===id),b=mergedPlans.find(p=>p.id===id);return a&&b&&canonical(a)===canonical(b);});
        if (sourceProgram&&accepted&&canonical(sourceProgram)===canonical(accepted)&&daysMatch) programs.assignedProgramId=incomingAssigned;
        else mark(target.id,'profile-program-assignment',target.id);
      }
      const archived=[...new Set([...(programs.archivedDayPlanIds||[]),...(sourceProfile.planPrograms.archivedDayPlanIds||[])])];
      if(archived.length)programs.archivedDayPlanIds=archived;
      validatePlanPrograms(programs,mergedPlans);
      if (programs.programs.length || archived.length || target.planPrograms) target.planPrograms=programs;
    }
  }
  if (registry.profiles.length>20) throw new Error('PROFILE_LIMIT_REACHED');
  registry.onboardingRequired=false;
  const active=registry.profiles.find(p=>p.id===registry.activeProfileId);
  const snapshot={};for(const [key,value] of Object.entries(active.data))snapshot[key]=JSON.parse(value);
  snapshot.gymverse_profiles_v1=registry;
  if(current[DRAFT_KEY] || incoming[DRAFT_KEY]) {
    const work=clone(readWorkingDrafts(current[DRAFT_KEY]));
    for(const item of readWorkingDrafts(incoming[DRAFT_KEY]).items){
      if(!registry.profiles.some(p=>p.id===item.draft.profileId))continue;
      const prior=work.items.find(x=>x.id===item.id);
      if(!prior)work.items.push(clone(item));
      else if(canonical(prior)!==canonical(item))mark(item.draft.profileId,'program-draft',item.id);
    }
    snapshot[DRAFT_KEY]=work;
  }
  return {requiresAssignment:false,isEmpty,mode:isEmpty&&source?'restore':'merge',stats,conflicts,snapshot,profileOverview:imported.profiles.map(p=>({id:p.id,name:p.name||'Przypisany profil',sessions:parse(p.data,'gymverse_history',[]).length,plans:parse(p.data,'gymverse_plans',[]).length,programs:p.planPrograms?.programs.length||0})),sourceProfileId:source?.activeProfileId,ambiguousDefault:!!source?.profiles.some(p=>p.id==='legacy-default-profile' && local.profiles.some(v=>v.id===p.id))};
}

export async function prepareMergedBackup(currentPreview, incomingPreview, plan, validationOptions={}) {
  const {createBackupV5,previewBackupV5}=await import('../../gv-data.js');
  const groups=preview=>new Map([
    [preview.snapshot.gymverse_profiles_v1?.activeProfileId || plan.targetProfileId || plan.snapshot.gymverse_profiles_v1.activeProfileId,{interpretations:preview.interpretations||[],media:preview.media||[]}],
    ...(preview.profileAuxiliaries||[]).map(g=>[g.profileId,g])
  ]);
  const local=groups(currentPreview),source=groups(incomingPreview);
  let auxiliaryConflicts=0;
  const combined=new Map();
  for(const profile of plan.snapshot.gymverse_profiles_v1.profiles){
    const a=local.get(profile.id)||{interpretations:[],media:[]},b=source.get(profile.id)||{interpretations:[],media:[]};
    const group={profileId:profile.id,interpretations:clone(a.interpretations),media:clone(a.media)};
    for(const [field,id] of [['interpretations','id'],['media','name']])for(const item of b[field]){
      if(field==='interpretations' && plan.conflicts.some(conflict=>conflict.profileId===profile.id && conflict.recordId && (conflict.type==='custom-exercise' ? item.exerciseId===conflict.recordId : conflict.type.startsWith('session') && (item.sessionIds||[]).includes(conflict.recordId)))) { auxiliaryConflicts++; continue; }
      const prior=group[field].find(v=>v[id]===item[id]);
      if(!prior)group[field].push(clone(item));else if(canonical(prior)!==canonical(item))auxiliaryConflicts++;
    }
    combined.set(profile.id,group);
  }
  const activeId=plan.snapshot.gymverse_profiles_v1.activeProfileId;
  const active=combined.get(activeId);
  const archive=await createBackupV5(plan.snapshot,{legacyInterpretations:active.interpretations,customMedia:active.media,profileAuxiliaries:[...combined.values()].filter(g=>g.profileId!==activeId),validationOptions});
  return {preview:await previewBackupV5(archive,validationOptions),auxiliaryConflicts};
}
