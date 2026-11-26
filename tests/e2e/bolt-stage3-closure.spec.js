import { test, expect } from '@playwright/test';
async function openExtras(page) { await page.locator('.workout-extras').evaluate(node => { node.open = true; }); }

// Older workout scenarios continue after explicitly skipping the new rest screen.
test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('#restScreen:not([hidden])'), async () => { await page.waitForFunction(() => document.querySelector('#sessionSaveStatus').hidden); await page.locator('#restScreen [data-act="timerSkip" ]').click(); }); });

test('RIR and set count changes persist draft and completed set through reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion:1, activeProfileId:'closure-profile', profiles:[{ id:'closure-profile', name:'Profil syntetyczny', attributes:{}, data:{} }] }));
    localStorage.setItem('gymverse_plans', JSON.stringify([{id:'closure-synthetic', title:'Synthetic', exercises:[{key:'bench_flat',sets:3,target:'8-12'}]}]));
  });
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="closure-synthetic"]').click();
  await page.locator('#weight_0').fill('42,5');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(1);
  await page.locator('#weight_1').fill('47,5');
  await page.locator('#reps_1').fill('9');
  const draft = () => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_draft_v1'))?.items.find(x => x.setNumber === 2));
  await openExtras(page);await page.locator('[data-act="rir"][data-v="2"]').click();
  await expect.poll(draft).toMatchObject({weight:'47,5', reps:'9'});
  await page.locator('[data-act="addSet"]').click();
  await expect(page.locator('#setsBody .set-row')).toHaveCount(4);
  await expect.poll(draft).toMatchObject({weight:'47,5', reps:'9'});
  await page.locator('[data-act="removeSet"]').click();
  await expect(page.locator('#setsBody .set-row')).toHaveCount(3);
  await expect.poll(draft).toMatchObject({weight:'47,5', reps:'9'});
  await page.reload();
  await page.locator('[data-act="resume"]').click();
  await expect(page.locator('#weight_1')).toHaveValue('47,5');
  await expect(page.locator('#reps_1')).toHaveValue('9');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')));
  expect(state.rir['0']).toBe(2);
  expect(state.sets.map(({setNumber,weight,reps}) => ({setNumber,weight,reps}))).toEqual([{setNumber:1,weight:42.5,reps:8}]);
  await page.locator('#btnDone_1').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')).sets.map(({weight,reps})=>({weight,reps})))).toEqual([{weight:42.5,reps:8},{weight:47.5,reps:9}]);
  expect(await draft()).toBeUndefined();
});

test('failed swap leaves stored RIR and completed records unchanged', async ({page}) => {
  await page.goto('/'); await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('gymverse_plans',JSON.stringify([{id:'rir-failure',title:'Synthetic',exercises:[{key:'bench_flat',sets:3,target:'8-12'}]}]));});
  await page.reload(); await page.locator('[data-act="startPlan"][data-plan="rir-failure"]').click();
  await page.locator('#weight_0').fill('40'); await page.locator('#reps_0').fill('8'); await page.locator('#btnDone_0').click(); await expect(page.locator('#btnDone_0')).toHaveClass(/completed/); await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await openExtras(page);await page.locator('[data-act="rir"][data-v="2"]').click(); await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).rir['0'])).toBe(2); await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  const before=await page.evaluate(()=>localStorage.getItem('gymverse_active'));
  await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore();store.transact=()=>Promise.reject(new Error('synthetic failure'));});
  await page.locator('[data-act="swapOpen"]').first().click(); page.once('dialog',d=>d.accept()); await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').click();
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_active'))).toBe(before);
});

test('RIR entered before any set is retained without assigning it to the substitute', async ({page}) => {
  await page.goto('/'); await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('gymverse_plans',JSON.stringify([{id:'rir-pending',title:'Synthetic',exercises:[{key:'bench_flat',sets:1,target:'8-12'}]}]));});
  await page.reload(); await page.locator('[data-act="startPlan"][data-plan="rir-pending"]').click();
  await openExtras(page);await page.locator('[data-act="rir"][data-v="2"]').click(); await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).rir['0'])).toBe(2); await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await page.locator('[data-act="swapOpen"]').first().click(); page.once('dialog',d=>d.accept()); await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').click();
  let active=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active'))); expect(active.rirArchive).toEqual([{step:0,key:'bench_flat',variantId:'default',rir:2}]); expect(active.rir['0']).toBeUndefined();
  await page.locator('#weight_0').fill('30'); await page.locator('#reps_0').fill('8'); await page.locator('#btnDone_0').click(); await expect(page.locator('#btnDone_0')).toHaveClass(/completed/); await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await page.locator('[data-act="finish"]').click(); await expect(page.locator('#view-summary')).toHaveClass(/active/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')).at(-1)); expect(saved.rirArchive).toEqual([{step:0,key:'bench_flat',variantId:'default',rir:2}]); expect(saved.details[0].rir).toBeUndefined();
});

test('RIR follows variant identity across a swap with multiple sets', async ({page}) => {
  await page.goto('/'); await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('gymverse_plans',JSON.stringify([{id:'rir-variant',title:'Synthetic',exercises:[{key:'leg_press',variantId:'high_feet',sets:3,target:'8-12'}]}]));});
  await page.reload(); await page.locator('[data-act="startPlan"][data-plan="rir-variant"]').click();
  for (let i=0;i<2;i++){await page.locator(`#weight_${i}`).fill('40');await page.locator(`#reps_${i}`).fill('8');await page.locator(`#btnDone_${i}`).click();await expect(page.locator(`#btnDone_${i}`)).toHaveClass(/completed/);await expect(page.locator('#sessionSaveStatus')).toBeHidden();}
  await openExtras(page);await page.locator('[data-act="rir"][data-v="2"]').click(); await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await page.locator('[data-act="swapOpen"]').first().click(); page.once('dialog',d=>d.accept()); await page.locator('[data-act="chooseSwap"][data-key="leg_press"]').click();
  let active=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active'))); expect(active.sets[1]).toMatchObject({key:'leg_press',variantId:'high_feet',rir:2});
  await page.locator('#weight_2').fill('50'); await page.locator('#reps_2').fill('9'); await page.locator('#btnDone_2').click(); await expect(page.locator('#btnDone_2')).toHaveClass(/completed/); await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await openExtras(page);await page.locator('[data-act="rir"][data-v="1"]').click(); await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await page.locator('[data-act="finish"]').click(); await expect(page.locator('#view-summary')).toHaveClass(/active/);
  const details=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')).at(-1).details); expect(details[1]).toMatchObject({variantId:'high_feet',rir:2}); expect(details[2]).toMatchObject({variantId:'default',rir:1});
});

test('swap preserves completed records and their RIR through resume and history', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('gymverse_plans', JSON.stringify([{id:'closure-synthetic',title:'Synthetic',exercises:[{key:'bench_flat',sets:3,target:'8-12'}]}])); });
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="closure-synthetic"]').click();
  await page.locator('#weight_0').fill('40'); await page.locator('#reps_0').fill('8'); await page.locator('#btnDone_0').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(1);
  await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await openExtras(page);await page.locator('[data-act="rir"][data-v="2"]').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')).rir['0'])).toBe(2);
  await expect(page.locator('#sessionSaveStatus')).toBeHidden();
  await page.locator('#weight_1').fill('45'); await page.locator('#reps_1').fill('9');
  await page.locator('[data-act="swapOpen"]').first().click();
  let message = '';
  page.once('dialog', async dialog => { message = dialog.message(); await dialog.accept(); });
  await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').click();
  expect(message).toContain('Niezapisane pola zostaną wyczyszczone');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')));
  expect(state.sets.map(({key,weight,reps})=>({key,weight,reps}))).toEqual([{key:'bench_flat',weight:40,reps:8}]);
  expect(state.rir['0']).toBeUndefined();
  expect(state.sets[0].rir).toBe(2);
  await page.reload(); await page.locator('[data-act="resume"]').click();
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')))).sets).toEqual(state.sets);
  page.once('dialog', d => d.accept());
  await page.locator('[data-act="finish"]').click();
  await expect(page.locator('#view-summary')).toHaveClass(/active/);
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history')));
  expect(history.at(-1).details[0]).toMatchObject({exerciseId:'bench_flat',weight:40,reps:8,rir:2});
  expect(history.at(-1).rir.bench_flat).toBe(2);
  const roundtrip = await page.evaluate(async () => {
    const {createBackupV5,previewBackupV5,restoreBackupV5} = await import('./src/gv-data.js');
    const runtime=window.__gymverseTestHarness.getStore();
    const snapshot=Object.fromEntries(Object.entries(await runtime.exportSnapshot()).map(([key,value])=>[key,JSON.parse(value)]));
    const backup=await createBackupV5(snapshot);
    const preview=await previewBackupV5(backup);
    await restoreBackupV5(runtime.storage,preview,{confirmed:true,restoreActive:true,restoreDrafts:true});
    return JSON.parse(runtime.storage.getItem('gymverse_history')).at(-1);
  });
  expect(roundtrip.details[0]).toMatchObject({exerciseId:'bench_flat',weight:40,reps:8,rir:2});
  await page.getByRole('button',{name:'Historia',exact:true}).click();
  await page.locator('.hist-head').first().click();
  await expect(page.locator('.hist-ex').filter({hasText:'Barbell Bench Press'})).toContainText('RIR 2');
  await page.getByRole('button',{name:'Plany',exact:true}).click();
  const originalProfile=await page.locator('#profileSelect').inputValue();
  await page.locator('#profileManage > summary').click();
  await page.locator('#profileFormDetails > summary').click();
  await page.locator('#newProfileName').fill('Profil syntetyczny drugi');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('#newProfileAge').fill('34');
  await page.locator('#newProfileWeight').fill('70');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('#newProfileTrainingGoal').selectOption('hypertrophy');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('[data-act="createProfile"]').click();
  await expect(page.locator('#profileSelect option')).toHaveCount(2);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]'))).toEqual([]);
  await page.locator('#profileSelect').selectOption(originalProfile);
  await page.locator('#profileManage > summary').click();
  await page.locator('[data-act="switchProfile"]').click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]').at(-1)?.details[0]?.rir)).toBe(2);
});
