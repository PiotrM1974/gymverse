import {test,expect} from '@playwright/test';

const programId='pg_'+'a'.repeat(32);
async function boot(page,count=3){
 await page.addInitScript(({id,count})=>{
  if(sessionStorage.getItem('stage9-fixture'))return;
  sessionStorage.setItem('stage9-fixture','1');
  const days=['day-one','day-two','day-three','day-four','day-five','day-six'].slice(0,count).map((day,index)=>({id:day,title:'Dzień '+(index+1),exercises:[{key:'bench_flat',sets:1,target:'8-10'}]}));
  localStorage.setItem('gymverse_schema','4');localStorage.setItem('gymverse_plans',JSON.stringify(days));localStorage.setItem('gymverse_history','[]');
  localStorage.setItem('gymverse_profiles_v1',JSON.stringify({schemaVersion:1,activeProfileId:'stage9-profile',profiles:[{id:'stage9-profile',name:'Profil syntetyczny',attributes:{},data:{},planPrograms:{schemaVersion:1,assignedProgramId:id,programs:[{id,title:'Pierwotny program',dayPlanIds:days.map(day=>day.id)}]}}]}));
 },{id:programId,count});
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
}

test('starting day from program persists its original context in active session and history',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());await boot(page);

 await page.locator('#view-plans [data-act="programPreview"][data-id="'+programId+'"]').click();await page.locator('[data-act="programDay"][data-id="day-one"]').click();
 await page.locator('[data-act="programDay"][data-id="day-two"]').click();
 await page.locator('[data-act="programStart"]').click();
 await expect.poll(()=>page.evaluate(()=>Boolean(JSON.parse(localStorage.getItem('gymverse_active'))?.sessionContext))).toBe(true);
 const context=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sessionContext);
 expect(context).toEqual({kind:'program',profileId:'stage9-profile',dayPlanId:'day-two',programId,programTitle:'Pierwotny program',dayNumber:2});
 await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();
 await page.locator('[data-act="finish"]').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history'))[0]);
 expect(saved.sessionContext).toEqual(context);expect(saved.details[0]).toMatchObject({exerciseId:'bench_flat',weight:40,reps:8});
 await page.locator('.header-nav [data-view="view-history"]').click();
 await expect(page.locator('.hist-card')).toContainText('Program podczas treningu: Pierwotny program · Dzień 2');
 await page.locator('#historyFilters > summary').click();await page.locator('[data-history-scope="programId"]').selectOption(programId);
 await expect(page.locator('.hist-card')).toHaveCount(1);
 await page.evaluate(async()=>{
  const store=window.__gymverseTestHarness.getStore();
  const registry=store.get('gymverse_profiles_v1');
  registry.profiles[0].planPrograms.programs=[];
  registry.profiles[0].planPrograms.assignedProgramId=null;
  await store.transact({gymverse_profiles_v1:registry});
 });
 await page.reload({waitUntil:'domcontentloaded'});await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
 await page.locator('.header-nav [data-view="view-history"]').click();
 await page.locator('#historyFilters > summary').click();await page.locator('[data-history-scope="programId"]').selectOption(programId);
 await expect(page.locator('.hist-card')).toContainText('Program podczas treningu: Pierwotny program · Dzień 2');
 expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history'))[0])).sessionContext).toEqual(context);
});

test('standalone start and old session stay distinct even when their day currently belongs to a six-day program',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());await boot(page,6);
 // Start while the day is standalone, then attach it: history must retain its original context.
 await page.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore(),registry=store.get('gymverse_profiles_v1');registry.profiles[0].planPrograms.programs[0].dayPlanIds=registry.profiles[0].planPrograms.programs[0].dayPlanIds.filter(id=>id!=='day-two');await store.transact({gymverse_profiles_v1:registry});});
 await page.reload({waitUntil:'domcontentloaded'});await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
 await page.locator('[data-act="startPlan"][data-plan="day-two"]').click();
 await expect.poll(()=>page.evaluate(()=>Boolean(JSON.parse(localStorage.getItem('gymverse_active'))?.sessionContext))).toBe(true);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sessionContext)).toEqual({kind:'standalone',profileId:'stage9-profile',dayPlanId:'day-two'});
 await page.locator('#weight_0').fill('42.5');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();await page.locator('[data-act="finish"]').click();
 await page.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore();const registry=store.get('gymverse_profiles_v1');registry.profiles[0].planPrograms.programs[0].dayPlanIds.splice(1,0,'day-two');await store.transact({gymverse_profiles_v1:registry});const history=store.get('gymverse_history');history.push({id:'old-session',planId:'day-two',planTitle:'Dzień 2',date:'2026-01-01T10:00:00.000Z',details:[{id:'old-set',exerciseId:'bench_flat',weight:30,reps:8,setNumber:1}]});await store.transact({gymverse_history:history});});
 await page.reload({waitUntil:'domcontentloaded'});await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);await page.locator('.header-nav [data-view="view-history"]').click();
 await expect(page.locator('.hist-card')).toHaveCount(2);await expect(page.locator('.hist-card').filter({hasText:'Trening samodzielny'})).toHaveCount(1);await expect(page.locator('.hist-card').filter({hasText:'Program nieustalony'})).toHaveCount(1);
 await page.locator('#historyFilters > summary').click();await page.locator('[data-history-scope="programId"]').selectOption(programId);await expect(page.locator('.hist-card')).toHaveCount(0);
});

test('program start rejects a stale preview changed by another tab and releases the shared lock',async({page,context})=>{
 page.on('dialog',dialog=>dialog.accept());await boot(page);

 await page.locator('#view-plans [data-act="programPreview"][data-id="'+programId+'"]').click();await page.locator('[data-act="programDay"][data-id="day-one"]').click();
 const second=await context.newPage();await second.goto('/',{waitUntil:'domcontentloaded'});
 await expect.poll(()=>second.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
 await second.evaluate(async()=>{
  const store=window.__gymverseTestHarness.getStore();
  const registry=store.get('gymverse_profiles_v1');
  registry.profiles[0].planPrograms.programs[0].title='Zmieniony w drugiej karcie';
  await store.transact({gymverse_profiles_v1:registry});
 });
 const before=await second.evaluate(()=>({active:localStorage.getItem('gymverse_active'),history:localStorage.getItem('gymverse_history')}));
 await page.locator('[data-act="programStart"]').click();
 await expect(page.locator('#toast')).toContainText('Program lub jego dzień zmienił się');
 const after=await second.evaluate(()=>({active:localStorage.getItem('gymverse_active'),history:localStorage.getItem('gymverse_history')}));
 expect(after).toEqual(before);
 await page.reload({waitUntil:'domcontentloaded'});await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);

 await page.locator('#view-plans [data-act="programPreview"][data-id="'+programId+'"]').click();await page.locator('[data-act="programDay"][data-id="day-one"]').click();
 await page.locator('[data-act="programStart"]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active'))?.sessionContext?.programTitle)).toBe('Zmieniony w drugiej karcie');
 await second.close();
});

test('program day action and historical labels fit Signal light and dark at mobile widths',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());await boot(page);

 await page.locator('#view-plans [data-act="programPreview"][data-id="'+programId+'"]').click();await page.locator('[data-act="programDay"][data-id="day-one"]').click();
 await page.locator('[data-act="programDay"][data-id="day-two"]').click();
 for(const theme of ['light','dark'])for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:850});
  await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
  await expect(page.locator('[data-act="programStart"]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('program context survives RIR, exercise swap, reload and session completion',async({page})=>{
 page.on('dialog',dialog=>dialog.accept());await boot(page);

 await page.locator('#view-plans [data-act="programPreview"][data-id="'+programId+'"]').click();await page.locator('[data-act="programDay"][data-id="day-one"]').click();
 await page.locator('[data-act="programStart"]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active'))?.sessionContext?.kind)).toBe('program');
 const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sessionContext);
 await page.locator('.workout-extras > summary').click();await page.locator('[data-act="rir"][data-v="2"]').click();
 await page.locator('[data-act="swapOpen"]').first().click();
 await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').click();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active'))?.swaps?.[0])).toBe('db_bench');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sessionContext)).toEqual(original);
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('[data-act="resume"]')).toBeVisible();
 await page.locator('[data-act="resume"]').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sessionContext)).toEqual(original);
 await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();
 await page.locator('[data-act="finish"]').click();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history'))[0]);
 expect(saved.sessionContext).toEqual(original);expect(saved.details[0].exerciseId).toBe('db_bench');
});
