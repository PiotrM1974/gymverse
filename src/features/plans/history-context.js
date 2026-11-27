const PROGRAM_ID=/^pg_[a-f0-9]{32}$/;
const text=value=>typeof value==='string'&&value.length>0&&value.length<=120;
export const variantKey = row => Object.hasOwn(row,'variantId') ? String(row.variantId) : '__missing__';
export function validateSessionContext(context,planId){
 if(context===undefined)return true;
 if(!context||typeof context!=='object'||Array.isArray(context)||!text(context.profileId)||!text(context.dayPlanId)||context.dayPlanId!==planId)return false;
 if(context.kind==='standalone')return Object.keys(context).sort().join(',')==='dayPlanId,kind,profileId';
 if(context.kind!=='program'||!PROGRAM_ID.test(context.programId)||typeof context.programTitle!=='string'||!context.programTitle.trim()||context.programTitle.length>60||!Number.isInteger(context.dayNumber)||context.dayNumber<1||context.dayNumber>6)return false;
 return Object.keys(context).sort().join(',')==='dayNumber,dayPlanId,kind,profileId,programId,programTitle';
}
export function captureSessionContext(profile,dayPlanId,programId=null){
 if(!text(profile?.id)||!text(dayPlanId))throw new Error('SESSION_CONTEXT_INVALID');
 const base={kind:'standalone',profileId:profile.id,dayPlanId};
 if(programId===null)return base;
 const program=profile.planPrograms?.programs.find(item=>item.id===programId);
 const dayNumber=program?.dayPlanIds.indexOf(dayPlanId)+1;
 if(!program||!PROGRAM_ID.test(programId)||!dayNumber||dayNumber<1)throw new Error('SESSION_PROGRAM_STALE');
 const context={...base,kind:'program',programId,programTitle:program.title,dayNumber};
 if(!validateSessionContext(context,dayPlanId))throw new Error('SESSION_CONTEXT_INVALID');
 return context;
}
export function currentProgramContext(session,profile){
 if(!session?.planId)return null;
 const programs=(profile?.planPrograms?.programs||[]).filter(p=>p.dayPlanIds.includes(session.planId));
 return programs.length===1?{program:programs[0],dayNumber:programs[0].dayPlanIds.indexOf(session.planId)+1}:null;
}
export function historyProgramContext(session){
 const context=session?.sessionContext;
 return validateSessionContext(context,session?.planId)&&context?context:{kind:'unknown'};
}
// Follow the current order using only sessions recorded for this program and profile.
export function nextProgramDay(profileId, program, plans, sessions) {
  const dayIds = program.dayPlanIds;
  const startable = new Map(plans.filter(plan => plan.exercises?.length).map(plan => [plan.id, plan]));
  let lastIndex = -1;
  let lastTime = -Infinity;
  for (const session of sessions) {
    const context = historyProgramContext(session);
    if (context.kind !== 'program' || context.profileId !== profileId || context.programId !== program.id) continue;
    const index = dayIds.indexOf(context.dayPlanId);
    const time = Date.parse(session.date);
    if (index < 0 || !Number.isFinite(time) || time < lastTime || !session.details?.some(set => Number(set.reps) > 0)) continue;
    lastIndex = index;
    lastTime = time;
  }
  for (let offset = 1; offset <= dayIds.length; offset++) {
    const index = (lastIndex + offset) % dayIds.length;
    const plan = startable.get(dayIds[index]);
    if (plan) return {plan, number: index + 1};
  }
  return null;
}
export function matchesHistoryScope(session,profile,scope={}){
 if(scope.programId&&historyProgramContext(session).programId!==scope.programId)return false;
 if(scope.dayId&&session.planId!==scope.dayId)return false;
 if(scope.exerciseId||scope.variant)return (session.details||[]).some(d=>(!scope.exerciseId||d.exerciseId===scope.exerciseId)&&(!scope.variant||variantKey(d)===scope.variant));
 return true;
}
export function progressionHistory(history,plan,exerciseId){
 const exercise=plan?.exercises?.find(e=>e.key===exerciseId);if(!exercise)return [];
 return history.filter(s=>s.planId===plan.id).map(s=>({...s,details:(s.details||[]).filter(d=>d.exerciseId===exerciseId&&variantKey(d)===variantKey(exercise))})).filter(s=>s.details.length);
}

export function lifetimeTrainingStats(sessions,volumeForSession){
 const seen=new Set();let workouts=0,totalVolume=0;
 for(const session of Array.isArray(sessions)?sessions:[]){
  const details=Array.isArray(session?.details)?session.details:[];
  const hasCompletedSet=details.some(set=>set&&typeof set.exerciseId==='string'&&set.exerciseId&&Number.isFinite(Number(set.weight))&&Number(set.weight)>=0&&Number.isFinite(Number(set.reps))&&Number(set.reps)>0);
  if(!hasCompletedSet)continue;
  const id=typeof session.id==='string'?session.id.trim():'';
  if(id&&seen.has(id))continue;
  if(id)seen.add(id);
  const volume=typeof volumeForSession==='function'?volumeForSession(session):Number(session.totalVolume);
  if(!Number.isFinite(volume)||volume<0)continue;
  workouts++;
  totalVolume+=volume;
 }
 return {workouts,totalVolume};
}
