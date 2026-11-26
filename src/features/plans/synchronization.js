export const PLAN_DATA_LOCK = 'gymnastika-plan-program-data';

export async function withPlanDataLock(operation, locks = globalThis.navigator?.locks) {
  if (!locks || typeof locks.request !== 'function') throw new Error('PLAN_DATA_LOCK_UNAVAILABLE');
  return locks.request(PLAN_DATA_LOCK, { mode: 'exclusive' }, operation);
}
