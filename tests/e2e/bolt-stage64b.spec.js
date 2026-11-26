import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function seed(page) {
  await page.addInitScript(()=>{
    if(localStorage.getItem('stage64b-seeded'))return;
    localStorage.setItem('stage64b-seeded','1');
    localStorage.setItem('gymverse_schema','4');
    localStorage.setItem('gymverse_plans',JSON.stringify([{id:'standalone',title:'Samodzielny',exercises:[{key:'bench_flat',sets:2,target:'8'}]}]));
    localStorage.setItem('gymverse_profiles_v1',JSON.stringify({schemaVersion:1,activeProfileId:'profile-one',profiles:[{id:'profile-one',name:'Synthetic',attributes:{trainingGoal:'hypertrophy'},data:{}},{id:'profile-two',name:'Other synthetic',attributes:{trainingGoal:'fitness'},data:{}}]}));
  });
  await page.goto('/');
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="programNew"]').click();
}
const action=(page,name)=>page.locator(`#view-program-editor [data-program-action="${name}"]`);
async function fillDay(page,name){
  await page.getByLabel('Nazwa dnia',{exact:true}).fill(name);
  await action(page,'edit').click();
  await page.locator('#peAddSelect').selectOption('bench_flat');
  await page.locator('[data-act="peAdd"]').click();
  await page.locator('[data-field="peRest"]').last().selectOption('90');
  await page.getByRole('button',{name:'← Wróć do programu',exact:true}).click();
  await expect(page.locator('#view-program-editor [data-working-status]')).toHaveText('Szkic zachowany na tym urządzeniu.');
}
async function snapshot(page){return page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());}

test('new program ZIP export restores actual days in an empty profile',async({page,browser})=>{
  await seed(page);await fillDay(page,'ZIP dzień');await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();
  const saved=await snapshot(page),program=JSON.parse(saved.gymverse_profiles_v1).profiles[0].planPrograms;
  page.on('dialog',dialog=>dialog.accept());await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await page.locator('[data-act="export"]').first().click();await expect(page.locator('#fileDeliveryPrompt')).toBeVisible();
  const download=page.waitForEvent('download');await page.locator('[data-act="deliverPreparedFile"]').click();const file=await download;
  const context=await browser.newContext({baseURL:new URL(page.url()).origin});const restored=await context.newPage();restored.on('dialog',d=>d.accept());await restored.goto('/');await expect(restored.locator('#stage6Welcome')).toBeVisible();
  await restored.locator('#importFile').setInputFiles({name:'program.zip',mimeType:'application/zip',buffer:await readFile(await file.path())});await expect(restored.locator('#backupImportPreview')).toBeVisible();
  await restored.locator('[data-backup-choice="merge"]').click();await expect(restored.locator('#stage6Welcome')).not.toBeVisible();
  await expect.poll(async()=>{try{return JSON.parse((await snapshot(restored)).gymverse_profiles_v1).profiles.find(p=>p.id==='profile-one')?.planPrograms;}catch{return null;}}).toEqual(program);
  expect(JSON.parse((await snapshot(restored)).gymverse_plans)).toEqual(JSON.parse(saved.gymverse_plans));
  const localPlans=JSON.parse(saved.gymverse_plans);localPlans.find(p=>p.id===program.programs[0].dayPlanIds[0]).title='Lokalna zmiana';
  await restored.evaluate(async plans=>window.__gymverseTestHarness.getStore().transact({gymverse_plans:plans}),localPlans);
  await restored.locator('#importFile').setInputFiles({name:'program-repeat.zip',mimeType:'application/zip',buffer:await readFile(await file.path())});await expect(restored.locator('#backupImportPreview')).toBeVisible();
  await restored.locator('[data-backup-choice="merge"]').click();
  await expect.poll(async()=>{try{return JSON.parse((await snapshot(restored)).gymverse_plans);}catch{return null;}}).toEqual(localPlans);
  await context.close();
});

test('draft refuses newly active session and preserves history RIR and drafts',async({page})=>{
  await seed(page);await fillDay(page,'Chroniony');
  await page.evaluate(()=>{localStorage.setItem('gymverse_active',JSON.stringify({planId:'standalone',rir:{0:2},sets:[]}));localStorage.setItem('gymverse_history','[{"id":"kept"}]');localStorage.setItem('gymverse_draft_v1','{"items":[{"planId":"standalone"}]}');});
  const before=await snapshot(page);await action(page,'save').click();await expect(page.locator('#programEditorStatus')).toContainText('aktywny trening');
  const after=await snapshot(page);for(const key of ['gymverse_plans','gymverse_profiles_v1','gymverse_active','gymverse_history','gymverse_draft_v1'])expect(after[key]).toBe(before[key]);
});

test('rollback failure warns and prevents another program save',async({page})=>{
  await seed(page);await fillDay(page,'Niepewny');
  await page.evaluate(()=>{const native=Storage.prototype.setItem;let first=true;Storage.prototype.setItem=function(key,value){if(key==='gymverse_profiles_v1'){if(first){first=false;native.call(this,key,value);}throw new Error('synthetic write and rollback failure');}return native.call(this,key,value);};});
  await action(page,'save').click();await expect(page.locator('#integrityWarning')).toBeVisible();
  const before=await snapshot(page);await action(page,'save').click();expect(await snapshot(page)).toEqual(before);
});

test('IndexedDB commits a new program and all day records together',async({page})=>{
  await seed(page);await fillDay(page,'IndexedDB');
  await page.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore();await store.activateMigration(await store.previewMigration(),{sourceExportVerified:true,v5ExportVerified:true});});
  await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();
  const saved=await snapshot(page);const group=JSON.parse(saved.gymverse_profiles_v1).profiles[0].planPrograms.programs[0];expect(JSON.parse(saved.gymverse_plans).some(p=>p.id===group.dayPlanIds[0])).toBe(true);
  await page.reload();await page.waitForFunction(()=>window.__gymverseTestHarness?.getStore().mode==='indexeddb');expect((await snapshot(page)).gymverse_plans).toBe(saved.gymverse_plans);
});
for(const count of [1,3,6])test(`creates and reopens ${count} day program without assignment`,async({page})=>{
  await seed(page);const before=await snapshot(page);
  await page.getByLabel('Nazwa programu',{exact:true}).fill(`Program ${count}`);
  for(let i=0;i<count;i++){if(i)await action(page,'add').click();await fillDay(page,`Trening ${i+1}`);}
  expect((await snapshot(page)).gymverse_plans).toBe(before.gymverse_plans);
  await action(page,'review').click();
  await expect(page.locator('#view-program-editor .stage6-exercises')).toHaveCount(count);
  if(count===3){await page.setViewportSize({width:390,height:850});for(const theme of ['light','dark']){await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);await page.screenshot({path:`outputs/GV-BOLT-STAGE64D/three-days-${theme}.png`,fullPage:true,animations:'disabled'});}}
  await action(page,'save').click();
  await expect(page.locator('#view-program-preview')).toBeVisible();
  const saved=await snapshot(page),registry=JSON.parse(saved.gymverse_profiles_v1),plans=JSON.parse(saved.gymverse_plans);
  const group=registry.profiles[0].planPrograms.programs[0];
  expect(registry.profiles[1]).toEqual(JSON.parse(before.gymverse_profiles_v1).profiles[1]);
  expect(group.dayPlanIds).toHaveLength(count);expect(registry.profiles[0].planPrograms.assignedProgramId).toBeNull();
  expect(plans.find(item=>item.id==='standalone')).toEqual(JSON.parse(before.gymverse_plans)[0]);
  expect(group.dayPlanIds.map(id=>plans.find(item=>item.id===id).title)).toEqual(Array.from({length:count},(_,i)=>`Trening ${i+1}`));
  await page.locator('[data-act="programEdit"]').click();
  for(let i=0;i<count;i++){await action(page,'select').nth(i).click();await expect(page.getByLabel('Nazwa dnia',{exact:true})).toHaveValue(`Trening ${i+1}`);}
  await fillDay(page,'Zmieniony ostatni');await action(page,'save').click();
  await expect(page.locator('#view-program-preview')).toBeVisible();
  const after=JSON.parse((await snapshot(page)).gymverse_plans);
  for(const id of group.dayPlanIds.slice(0,-1))expect(after.find(item=>item.id===id)).toEqual(plans.find(item=>item.id===id));
  expect(after.find(item=>item.id===group.dayPlanIds.at(-1)).exercises).toHaveLength(2);
  await page.reload();await page.locator('#assignedProgram [data-act="stage6Ready"]').click();
  await page.locator(`[data-act="programPreview"][data-id="${group.id}"]`).click();
  await expect(page.locator('[data-act="programDay"]')).toHaveCount(count);
});

test('attach, reorder, detach, rename and explicit assignment preserve standalone records',async({page})=>{
  await seed(page);await fillDay(page,'Nowy dzień');
  await page.locator('#programAttach').selectOption('standalone');await action(page,'attach').click();
  await action(page,'moveUp').click();await action(page,'save').click();
  await expect(page.locator('#view-program-preview')).toBeVisible();
  const first=await snapshot(page),group=JSON.parse(first.gymverse_profiles_v1).profiles[0].planPrograms.programs[0];
  expect(group.dayPlanIds[0]).toBe('standalone');
  await page.locator('[data-act="programEdit"]').click();
  await page.getByLabel('Nazwa programu',{exact:true}).fill('Nowa nazwa');
  await action(page,'detach').click();await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();
  expect(JSON.parse((await snapshot(page)).gymverse_plans).find(item=>item.id==='standalone')).toEqual(JSON.parse(first.gymverse_plans).find(item=>item.id==='standalone'));
  expect(JSON.parse((await snapshot(page)).gymverse_profiles_v1).profiles[0].planPrograms.programs[0].title).toBe('Nowa nazwa');
  await page.locator('[data-act="programAssign"]').click();
  await expect.poll(async()=>JSON.parse((await snapshot(page)).gymverse_profiles_v1).profiles[0].planPrograms.assignedProgramId).toBe(group.id);
  expect(JSON.parse((await snapshot(page)).gymverse_active||'null')).toBeNull();
});

test('two shared tabs reject stale program draft and retain the form',async({page,context})=>{
  await seed(page);await fillDay(page,'Pierwszy zapis');
  const other=await context.newPage();await other.goto('/');await other.locator('[data-act="editPlans"]').click();await other.locator('[data-act="programNew"]').click();await other.locator('[data-recover="new"]').click();await fillDay(other,'Stary szkic');
  await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();const first=await snapshot(page);
  await action(other,'save').click();await expect(other.locator('#programEditorStatus')).toContainText('Dane zmieniły');
  expect((await snapshot(other)).gymverse_plans).toBe(first.gymverse_plans);
  expect((await snapshot(other)).gymverse_profiles_v1).toBe(first.gymverse_profiles_v1);
  await expect(other.getByLabel('Nazwa dnia',{exact:true})).toHaveValue('Stary szkic');
});

test('safe write failure permits retry without partial days',async({page})=>{
  await seed(page);await fillDay(page,'Ponowiony');const before=await snapshot(page);
  await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore();const native=store.transact.bind(store);store.transact=async updates=>{store.transact=native;throw new Error('synthetic refusal');};});
  await action(page,'save').click();await expect(page.locator('#programEditorStatus')).toContainText('Nie zapisano');expect((await snapshot(page)).gymverse_plans).toBe(before.gymverse_plans);
  await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();
});

test('new program save waits for the shared lock held by another tab',async({page,context})=>{
  await seed(page);await fillDay(page,'Zablokowany');const before=await snapshot(page);
  const other=await context.newPage();await other.goto('/');await other.waitForFunction(()=>window.__gymverseTestHarness);
  await other.evaluate(()=>{window.held=false;window.lockTask=navigator.locks.request('gymnastika-plan-program-data',async()=>{window.held=true;await new Promise(resolve=>window.unlock=resolve);});});
  await other.waitForFunction(()=>window.held);await action(page,'save').click();
  await expect.poll(()=>page.evaluate(async()=> (await navigator.locks.query()).pending.some(lock=>lock.name==='gymnastika-plan-program-data'))).toBe(true);
  expect((await snapshot(page)).gymverse_plans).toBe(before.gymverse_plans);
  await other.evaluate(async()=>{window.unlock();await window.lockTask;});await expect(page.locator('#view-program-preview')).toBeVisible();
  expect(JSON.parse((await snapshot(page)).gymverse_plans)).toHaveLength(2);await other.close();
});

test('day editor preserves exercise order variants sets reps and rest in the program',async({page})=>{
  await seed(page);await fillDay(page,'Ćwiczenia');await action(page,'edit').click();
  await page.locator('#peAddSelect').selectOption('db_fly');await page.locator('[data-act="peAdd"]').click();
  await page.locator('[data-field="peVariant"]').last().selectOption('incline');
  await page.locator('[data-field="peTarget"]').last().fill('10-15');await page.locator('[data-field="peTarget"]').last().press('Tab');
  await page.locator('[data-act="peSets"][data-i="1"][data-d="1"]').click();
  await page.locator('[data-field="peRest"]').last().selectOption('120');
  await page.locator('[data-act="peMove"][data-i="1"][data-d="-1"]').click();
  await page.getByRole('button',{name:'← Wróć do programu',exact:true}).click();await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();
  const saved=await snapshot(page);const group=JSON.parse(saved.gymverse_profiles_v1).profiles[0].planPrograms.programs[0];const day=JSON.parse(saved.gymverse_plans).find(p=>p.id===group.dayPlanIds[0]);
  expect(day.exercises[0]).toMatchObject({key:'db_fly',variantId:'incline',sets:4,target:'10-15',restSeconds:120});expect(day.exercises[1].key).toBe('bench_flat');
});

for(const theme of ['light','dark'])for(const width of [320,375,390,430])test(`program layout ${theme} ${width}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:850});await seed(page);await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  for(let i=0;i<6;i++){if(i)await action(page,'add').click();await fillDay(page,`Trening ${i+1}`);}
  await action(page,'review').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`outputs/GV-BOLT-STAGE64D/${testInfo.project.name}-${theme}-${width}-six-days.png`,fullPage:true,animations:'disabled'});
  await action(page,'select').nth(1).click();await action(page,'edit').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`outputs/GV-BOLT-STAGE64D/${testInfo.project.name}-${theme}-${width}-edit-day.png`,fullPage:true,animations:'disabled'});
});

test('unsaved program warns before leaving or reloading and leaving preserves recoverable draft',async({page})=>{
  await seed(page);await fillDay(page,'Szkic chroniony');const before=await snapshot(page);
  expect(await page.evaluate(()=>!window.dispatchEvent(new Event('beforeunload',{cancelable:true})))).toBe(true);
  let prompted=false;page.once('dialog',async dialog=>{prompted=true;await dialog.dismiss();});
  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  expect(prompted).toBe(true);await expect(page.locator('#view-program-editor')).toBeVisible();
  await expect(page.getByLabel('Nazwa dnia',{exact:true})).toHaveValue('Szkic chroniony');
  page.once('dialog',dialog=>dialog.accept());await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await expect(page.locator('#view-program-editor')).not.toBeVisible();
  expect((await snapshot(page)).gymverse_plans).toBe(before.gymverse_plans);
  expect((await snapshot(page)).gymverse_program_drafts_v1).toBe(before.gymverse_program_drafts_v1);
  expect(await page.evaluate(()=>!window.dispatchEvent(new Event('beforeunload',{cancelable:true})))).toBe(false);
});

test('saved program has no leave warning until changed and day edits remain guarded',async({page})=>{
  await seed(page);await fillDay(page,'Zapisany');await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();
  await page.locator('[data-act="programEdit"]').click();
  expect(await page.evaluate(()=>!window.dispatchEvent(new Event('beforeunload',{cancelable:true})))).toBe(false);
  await action(page,'edit').click();await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  expect(await page.evaluate(()=>!window.dispatchEvent(new Event('beforeunload',{cancelable:true})))).toBe(true);
  page.once('dialog',d=>d.dismiss());await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await expect(page.locator('#view-planedit')).toBeVisible();
  await page.getByRole('button',{name:'← Wróć do programu',exact:true}).click();await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();
  expect(await page.evaluate(()=>!window.dispatchEvent(new Event('beforeunload',{cancelable:true})))).toBe(false);
});
