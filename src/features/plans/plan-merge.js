export function sameDataValue(left,right){
  if(Object.is(left,right))return true;
  if(!left||!right||typeof left!=='object'||typeof right!=='object')return false;
  if(Array.isArray(left)||Array.isArray(right))return Array.isArray(left)&&Array.isArray(right)&&left.length===right.length&&left.every((value,index)=>sameDataValue(value,right[index]));
  const keys=Object.keys(left);
  return keys.length===Object.keys(right).length&&keys.every(key=>Object.hasOwn(right,key)&&sameDataValue(left[key],right[key]));
}
const same=sameDataValue;

// Merge edits by stable plan ID so a change to a different plan does not
// invalidate this edit. A concurrent edit to the same plan still fails closed.
export function mergePlanChanges(basePlans, proposedPlans, latestPlans) {
  const base = new Map(basePlans.map(plan => [plan.id, plan]));
  const proposed = new Map(proposedPlans.map(plan => [plan.id, plan]));
  const latest = new Map(latestPlans.map(plan => [plan.id, structuredClone(plan)]));
  const changed = new Set([...base.keys(), ...proposed.keys()]);

  for (const id of changed) {
    const before = base.get(id);
    const after = proposed.get(id);
    if (same(before, after)) continue;
    const current = latest.get(id);
    if (before === undefined) {
      if (current !== undefined && !same(current, after)) throw new Error('PLAN_DATA_STALE');
      if (current === undefined) latest.set(id, structuredClone(after));
    } else if (after === undefined) {
      if (current !== undefined && !same(current, before)) throw new Error('PLAN_DATA_STALE');
      latest.delete(id);
    } else {
      if (current !== undefined && same(current, after)) continue;
      if (current === undefined || !same(current, before)) throw new Error('PLAN_DATA_STALE');
      latest.set(id, structuredClone(after));
    }
  }

  const merged = latestPlans.filter(plan => latest.has(plan.id)).map(plan => latest.get(plan.id));
  for (const plan of proposedPlans) if (!base.has(plan.id) && latest.has(plan.id) && !latestPlans.some(current => current.id === plan.id)) merged.push(latest.get(plan.id));
  return merged;
}

export function mergeRecordChanges(baseRecords, proposedRecords, latestRecords) {
  const merged=structuredClone(latestRecords);
  for(const key of new Set([...Object.keys(baseRecords),...Object.keys(proposedRecords)])){
    const before=baseRecords[key],after=proposedRecords[key],current=latestRecords[key];
    if(same(before,after))continue;
    if(before===undefined){
      if(current!==undefined&&!same(current,after))throw new Error('PLAN_DATA_STALE');
      if(current===undefined)merged[key]=structuredClone(after);
    }else if(after===undefined){
      if(current!==undefined&&!same(current,before))throw new Error('PLAN_DATA_STALE');
      delete merged[key];
    }else{
      if(current!==undefined&&same(current,after))continue;
      if(current===undefined||!same(current,before))throw new Error('PLAN_DATA_STALE');
      merged[key]=structuredClone(after);
    }
  }
  return merged;
}
