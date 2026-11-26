import { test, expect } from '@playwright/test';
async function openExtras(page) { await page.locator('.workout-extras').evaluate(node => { node.open = true; }); }
import { mkdir } from 'node:fs/promises';

async function start(page, rest=60) {
  await page.addInitScript(rest => { if(localStorage.getItem('7c-timer-fixture'))return; localStorage.setItem('7c-timer-fixture','1'); localStorage.setItem('gymverse_plans',JSON.stringify([{id:'timer-synthetic',title:'Synthetic',exercises:[{key:'bench_flat',variantId:'default',sets:2,target:'8-12',restSeconds:rest},{key:'db_bench',variantId:'default',sets:1,target:'8-12',restSeconds:90}]}])); },rest);
  await page.goto('/',{waitUntil:'domcontentloaded'}); await page.locator('[data-act="startPlan"][data-plan="timer-synthetic"]').click();
}
async function save(page,i) { await page.locator(`#weight_${i}`).fill('40'); await page.locator(`#reps_${i}`).fill('8'); await page.locator(`#btnDone_${i}`).click(); }

test('saved set opens timer and skip returns to next incomplete set',async({page})=>{
  await start(page); await save(page,0);
  await expect(page.locator('#restScreen')).toBeVisible();
  const session=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));
  expect(session.sets.map(s=>[s.setNumber,s.weight,s.reps])).toEqual([[1,40,8]]);
  await page.locator('#restScreen [data-act="timerSkip"]').click();
  await expect(page.locator('#restScreen')).toBeHidden();
  await expect(page.locator('.set-row.is-current #weight_1')).toBeVisible();
});
test('last set goes to next exercise, final workout set does not start timer',async({page})=>{
  await start(page); await save(page,0); await page.locator('#restScreen [data-act="timerSkip"]').click();
  await save(page,1); await expect(page.locator('#restScreen')).toContainText('Dumbbell Bench Press'); await page.locator('#restScreen [data-act="timerSkip"]').click();
  await expect(page.locator('#currentExName')).toHaveText('Flat Dumbbell Bench Press'); await save(page,0);
  await expect(page.locator('#restScreen')).toBeHidden();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(3);
});
test('natural completion after last set advances to next exercise with completed exercise rest',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({colorScheme:'dark'});await page.clock.install();await start(page,60);await save(page,0);await page.locator('#restScreen [data-act="timerSkip"]').click();await save(page,1);
  await expect(page.locator('#restScreen')).toBeVisible();await expect(page.locator('#restNextExercise')).toHaveText('Flat Dumbbell Bench Press');
  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.restState.duration).toBe(60);expect(state.restState.targetStep).toBe(1);expect(state.restState.targetSet).toBe(1);
  await page.clock.fastForward(61000);await expect(page.locator('#restScreen')).toBeHidden();await expect(page.locator('#currentExName')).toHaveText('Flat Dumbbell Bench Press');await expect(page.locator('.set-row.is-current #weight_0')).toBeVisible();
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.step).toBe(1);expect(state.sets).toHaveLength(2);
  await mkdir('outputs/GV-BOLT-STAGE4/screenshots',{recursive:true});await page.screenshot({animations:'disabled',path:'outputs/GV-BOLT-STAGE4/screenshots/return-auto-dark-390.png'});
});
test('next pending set wraps to skipped exercise and honors modified set count',async({page})=>{
  await start(page,60);await openExtras(page);await page.locator('[data-act="addSet"]').click();await expect(page.locator('#setsBody .set-row')).toHaveCount(3);
  await page.locator('#btnNextStep').click();await expect(page.locator('#currentExName')).toHaveText('Flat Dumbbell Bench Press');await save(page,0);
  await expect(page.locator('#restScreen')).toBeVisible();let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.restState.duration).toBe(90);expect(state.restState.targetStep).toBe(0);expect(state.restState.targetSet).toBe(1);expect(state.setCount['0']).toBe(3);
  await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#currentExName')).toHaveText('Barbell Bench Press');await expect(page.locator('.set-row.is-current #weight_0')).toBeVisible();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.sets).toHaveLength(1);expect(state.sets[0].key).toBe('db_bench');
});
for (const seconds of [30,60,90,120,180,240,300]) test(`timer preserves ${seconds} seconds`,async({page})=>{await start(page,seconds);await save(page,0);await expect(page.locator('#restScreen')).toBeVisible();const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.restState.duration).toBe(seconds);});
test('paused timer and added time survive reload and resume',async({page})=>{
  await start(page);await save(page,0);await page.locator('#restPause').click();await expect(page.locator('#restPause')).toHaveText('Wznów');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).restState.pausedLeft);await page.locator('#restScreen [data-act="timerAdd"]').click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).restState.pausedLeft)).toBe(before+30);
  await page.reload();await expect(page.locator('#restScreen')).toBeVisible();await expect(page.locator('#restPause')).toHaveText('Wznów');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).restState.pausedLeft)).toBe(before+30);
  await page.locator('#restPause').click();await expect(page.locator('#restPause')).toHaveText('Pauza');
});
test('expired deadline returns to the next set after reopening',async({page})=>{
  await page.clock.install();await start(page);await save(page,0);await expect(page.locator('#restScreen')).toBeVisible();
  await page.clock.fastForward(61000);await expect(page.locator('#restScreen')).toBeHidden();await expect(page.locator('.set-row.is-current #weight_1')).toBeVisible();
  const active=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(active.sets).toHaveLength(1);expect(active.timerEndAt).toBe(0);expect(active.restState).toBeUndefined();
});
test('expired persisted deadline is reconciled on restart',async({page})=>{
  await start(page);await save(page,0);await expect(page.locator('#restScreen')).toBeVisible();
  await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('gymverse_active'));state.restState.endsAt=Date.now()-1000;state.timerEndAt=state.restState.endsAt;localStorage.setItem('gymverse_active',JSON.stringify(state));});
  await page.reload();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).restState)).toBeUndefined();await expect(page.locator('#restScreen')).toBeHidden();await expect(page.locator('.set-row.is-current #weight_1')).toBeVisible();
});
test('failed set save cannot open rest',async({page})=>{
  await start(page);await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore();store.transact=()=>Promise.reject(new Error('synthetic failure'));});page.on('dialog',d=>d.dismiss());await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeHidden();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(0);
});
test('rest deadline starts after a slow set transaction succeeds',async({page})=>{
  await start(page);await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore(),original=store.transact.bind(store);store.transact=async updates=>{if(updates.gymverse_active?.restState?.pending)await new Promise(resolve=>setTimeout(resolve,2200));return original(updates);};});
  await save(page,0);await expect(page.locator('#restScreen')).toBeVisible();const remaining=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).restState.endsAt-Date.now());expect(remaining).toBeGreaterThan(58000);
});
test('timer start failure preserves saved set and recovers on reload',async({page})=>{
  await start(page);await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore(),original=store.transact.bind(store);store.transact=updates=>updates.gymverse_active?.restState?.pending===false?Promise.reject(new Error('synthetic timer save failure')):original(updates);});page.on('dialog',d=>d.dismiss());
  await save(page,0);await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).restState?.pending)).toBe(true);await expect(page.locator('#restPause')).toHaveText('Ponów');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(1);
  await page.reload();await expect(page.locator('#restScreen')).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(1);
});
test('editing a completed set does not restart rest',async({page})=>{await start(page);await save(page,0);await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#restScreen')).toBeHidden();await page.locator('#btnDone_0').click();await page.locator('#reps_0').fill('9');await page.locator('#btnDone_0').click();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets[0].reps)).toBe(9);await expect(page.locator('#restScreen')).toBeHidden();});
test('running rest survives reload and preserves RIR, variant and other draft',async({page})=>{
  await start(page);await page.locator('#weight_1').fill('47,5');await page.locator('#reps_1').fill('9');await openExtras(page);await page.locator('[data-act="rir"][data-v="2"]').click();await expect(page.locator('#sessionSaveStatus')).toBeHidden();await save(page,0);await expect(page.locator('#restScreen')).toBeVisible();
  await page.reload();await expect(page.locator('#restScreen')).toBeVisible();await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#restScreen')).toBeHidden();
  await expect(page.locator('#weight_1')).toHaveValue('47,5');await expect(page.locator('#reps_1')).toHaveValue('9');const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.rir['0']).toBe(2);expect(state.sets[0].variantId).toBe('default');expect(state.sets).toHaveLength(1);
});
test('rapid duplicate confirmation produces one stored set and one rest',async({page})=>{
  await start(page);await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore(),original=store.transact.bind(store);store.transact=async(...args)=>{await new Promise(resolve=>setTimeout(resolve,400));return original(...args);};document.querySelector('#btnDone_0').click();document.querySelector('#btnDone_0').click();});
  await expect(page.locator('#toast')).toContainText('Trwa zapisywanie');await expect(page.locator('#restScreen')).toBeVisible();const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.sets).toHaveLength(1);expect(state.restState.completedSet).toBe(1);
});
test('swapping after rest preserves original series and RIR',async({page})=>{
  await start(page);await openExtras(page);await page.locator('[data-act="rir"][data-v="2"]').click();await expect(page.locator('#sessionSaveStatus')).toBeHidden();await save(page,0);await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#restScreen')).toBeHidden();
  await page.locator('[data-act="swapOpen"]').first().click();page.once('dialog',d=>d.accept());await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').click();
  let active=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(active.sets[0]).toMatchObject({key:'bench_flat',variantId:'default',rir:2});const id=active.sets[0].id;
  await save(page,1);await expect(page.locator('#restScreen')).toBeVisible();active=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(active.sets.map(s=>s.key)).toEqual(['bench_flat','db_bench']);expect(active.sets[0].id).toBe(id);expect(active.sets[0].rir).toBe(2);
});
test('rest returns to the next exercise with its saved variant',async({page})=>{
  await page.goto('/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('gymverse_plans',JSON.stringify([{id:'timer-variant',title:'Synthetic',exercises:[{key:'bench_flat',variantId:'default',sets:1,target:'8-12',restSeconds:60},{key:'leg_press',variantId:'high_feet',sets:1,target:'8-12'}]}]));});await page.reload();await page.locator('[data-act="startPlan"][data-plan="timer-variant"]').click();await save(page,0);await expect(page.locator('#restNextExercise')).toHaveText('Leg Press');await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#currentExVariant')).toContainText('Stopy wyżej');await expect(page.locator('.set-row.is-current #weight_0')).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.step).toBe(1);expect(state.exercises[1].variantId).toBe('high_feet');expect(state.sets[0].variantId).toBe('default');
});
test('swapping before a set keeps the substitute and its rest target',async({page})=>{
  await start(page);await page.locator('[data-act="swapOpen"]').first().click();page.once('dialog',d=>d.accept());await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').click();await save(page,0);await expect(page.locator('#restScreen')).toBeVisible();
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.sets[0].key).toBe('db_bench');expect(state.swaps['0']).toBe('db_bench');expect(state.restState.targetStep).toBe(0);expect(state.restState.targetSet).toBe(2);await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#currentExName')).toHaveText('Flat Dumbbell Bench Press');
});
test('duplicate skip completes rest only once',async({page})=>{await start(page);await save(page,0);await expect(page.locator('#restScreen')).toBeVisible();await page.evaluate(()=>{const btn=document.querySelector('#restScreen [data-act="timerSkip"]');btn.click();btn.click();});await expect(page.locator('#restScreen')).toBeHidden();const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.step).toBe(0);expect(state.sets).toHaveLength(1);expect(state.restState).toBeUndefined();});
test('failed rest completion keeps saved series and permits retry',async({page})=>{
  await start(page);await save(page,0);await expect(page.locator('#restScreen')).toBeVisible();await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore();window.__originalTimerTransact=store.transact;store.transact=()=>Promise.reject(new Error('synthetic failure'));});page.on('dialog',d=>d.dismiss());
  await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#restScreen')).toBeVisible();const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')));expect(state.sets).toHaveLength(1);expect(state.restState.completedSet).toBe(1);await expect(page.locator('#toast')).not.toBeEmpty();
  await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore();store.transact=window.__originalTimerTransact;});await expect(page.locator('#sessionSaveStatus')).toBeHidden();await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#restScreen')).toBeHidden();
});
for(const width of [320,375,390,430]) for(const theme of ['light','dark']) test(`rest screen ${width} ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme});await start(page);await save(page,0);
  await expect(page.locator('#restScreen')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===390 || width===320&&theme==='dark'){await mkdir('outputs/GV-BOLT-STAGE4/screenshots',{recursive:true});await page.screenshot({animations:'disabled',path:`outputs/GV-BOLT-STAGE4/screenshots/timer-${theme}-${width}.png`});}
  if(width===390&&theme==='dark'){await page.locator('#restScreen [data-act="timerSkip"]').click();await expect(page.locator('#restScreen')).toBeHidden();await page.screenshot({animations:'disabled',path:'outputs/GV-BOLT-STAGE4/screenshots/return-dark-390.png'});}
});
