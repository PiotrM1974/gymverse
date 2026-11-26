import { withPlanDataLock } from './synchronization.js';
export const DRAFT_KEY='gymverse_program_drafts_v1';
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^[a-z0-9_-]{1,100}$/i.test(v);
const catalog=v=>object(v)&&Object.entries(v).every(([key,item])=>id(key)&&object(item)&&typeof item.name==='string'&&item.name.length<=500&&(!Object.hasOwn(item,'bw')||typeof item.bw==='boolean'));
const plans=v=>Array.isArray(v)&&v.length<=1000&&new Set(v.map(p=>p?.id)).size===v.length&&v.every(p=>object(p)&&id(p.id)&&typeof p.title==='string'&&p.title.length<=200&&Array.isArray(p.exercises)&&p.exercises.length<=200&&p.exercises.every(e=>object(e)&&typeof e.key==='string'&&(!Object.hasOwn(e,'target')||typeof e.target==='string')&&Number.isFinite(e.sets)&&e.sets>=0&&(!Object.hasOwn(e,'restSeconds')||Number.isFinite(e.restSeconds))&&(!Object.hasOwn(e,'variantId')||typeof e.variantId==='string')));
function generatorAnswers(v){
 if(!object(v))return false;
 const arrays=['scheduleDays','focus','equipment','favorites','exclusions','movementExclusions'];
 const strings=['goal','targetWeight','sessionMode','split','historyChoice','experience'];
 return Object.entries(v).every(([k,x])=>arrays.includes(k)?Array.isArray(x)&&x.length<=200&&x.every(t=>typeof t==='string'&&t.length<=100):strings.includes(k)?typeof x==='string'&&x.length<=100:k==='customSplitFocus'?Array.isArray(x)&&x.length<=6&&x.every(a=>Array.isArray(a)&&a.every(t=>typeof t==='string'&&t.length<=100)):['open','balanced','returnAfterBreak'].includes(k)?typeof x==='boolean':['step','daysPerWeek','sessionMinutes'].includes(k)?Number.isFinite(x):false);
}
export function validateWorkingDrafts(value) {
 if(!object(value)||value.version!==1||!Array.isArray(value.items)||value.items.length>100||JSON.stringify(value).length>5000000)throw Error('PROGRAM_DRAFT_INVALID');
 const ids=new Set();
 for(const item of value.items){
  const d=item?.draft;
  if(!object(item)||!id(item.id)||ids.has(item.id)||!id(item.revision)||!object(d)||!id(d.profileId)||(d.programId!==null&&!id(d.programId))||typeof d.title!=='string'||d.title.length>200||!Array.isArray(d.dayPlanIds)||d.dayPlanIds.length<1||d.dayPlanIds.length>6||new Set(d.dayPlanIds).size!==d.dayPlanIds.length||!plans(d.plans)||!plans(d.basePlans)||!d.dayPlanIds.every(k=>d.plans.some(p=>p.id===k))||!d.dayPlanIds.includes(item.selected)||!object(d.baseState)||d.baseState.activeProfileId!==d.profileId||!Array.isArray(d.baseState.profiles)||!d.baseState.profiles.some(p=>p.id===d.profileId)||!catalog(item.custom)||!catalog(item.baseCustom))throw Error('PROGRAM_DRAFT_INVALID');
  if(Object.hasOwn(d,'generatorAnswers')&&!generatorAnswers(d.generatorAnswers))throw Error('PROGRAM_DRAFT_INVALID');
  if(Object.hasOwn(d,'generatedProgramId')&&(typeof d.generatedProgramId!=='string'||!/^pg_[a-f0-9]{32}$/.test(d.generatedProgramId)))throw Error('PROGRAM_DRAFT_INVALID');
  ids.add(item.id);
 }
 return value;
}
export function readWorkingDrafts(raw){return raw==null?{version:1,items:[]}:validateWorkingDrafts(typeof raw==='string'?JSON.parse(raw):raw);}
export function removeDraftFromSnapshot(raw,reference){
 const value=structuredClone(readWorkingDrafts(raw));
 const prior=value.items.find(x=>x.id===reference.id);
 if(!prior||prior.revision!==reference.revision||prior.draft.profileId!==reference.draft.profileId)throw Error('DRAFT_CONFLICT');
 value.items=value.items.filter(x=>x.id!==reference.id);return value;
}
async function writeVerified(store,before,value){
 try{
  await store.transact({[DRAFT_KEY]:value});
  const after=await store.refreshSnapshot();
  if(JSON.stringify(readWorkingDrafts(after[DRAFT_KEY]))!==JSON.stringify(value)){const e=Error('DRAFT_READBACK_FAILED');e.integrityUncertain=true;throw e;}
 }catch(e){try{if((await store.refreshSnapshot())[DRAFT_KEY]!==before[DRAFT_KEY])e.integrityUncertain=true;}catch{e.integrityUncertain=true;}throw e;}
}
export async function saveWorkingDraft(store,item,options={}){
 return withPlanDataLock(async()=>{
  const before=await store.refreshSnapshot(),state=JSON.parse(before.gymverse_profiles_v1||'null');
  if(state?.activeProfileId!==item.draft.profileId)throw Error('DRAFT_PROFILE_CHANGED');
  const value=structuredClone(readWorkingDrafts(before[DRAFT_KEY])),prior=value.items.find(x=>x.id===item.id);
  if((prior?.revision??null)!==item.revision || (prior && (prior.draft.profileId!==item.draft.profileId || prior.draft.programId!==item.draft.programId)))throw Error('DRAFT_CONFLICT');
  const next={...structuredClone(item),revision:crypto.randomUUID()};
  value.items=value.items.filter(x=>x.id!==item.id);value.items.push(next);validateWorkingDrafts(value);
  await writeVerified(store,before,value);return next;
 },options.locks);
}
export async function removeWorkingDraft(store,reference,options={}){
 return withPlanDataLock(async()=>{
  const before=await store.refreshSnapshot(),state=JSON.parse(before.gymverse_profiles_v1||'null');
  if(state?.activeProfileId!==reference.draft.profileId)throw Error('DRAFT_PROFILE_CHANGED');
  await writeVerified(store,before,removeDraftFromSnapshot(before[DRAFT_KEY],reference));
 },options.locks);
}
// Profile switching and ZIP refresh profile.data; it is a cache, not the source of program edits.
export function programSourceIdentity(state){
 const profile=state?.profiles?.find(p=>p.id===state.activeProfileId);
 if(!profile)return null;
 const {data,...metadata}=profile;return {activeProfileId:state.activeProfileId,profile:metadata};
}
