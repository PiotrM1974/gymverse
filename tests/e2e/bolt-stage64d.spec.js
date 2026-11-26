import {test,expect} from '@playwright/test';
const KEY='gymverse_program_drafts_v1';
const action=(p,n)=>p.locator(`[data-program-action="${n}"]`);
async function seed(page){
 await page.addInitScript(()=>{if(localStorage.getItem('d-seed'))return;localStorage.setItem('d-seed','1');localStorage.setItem('gymverse_schema','4');localStorage.setItem('gymverse_plans',JSON.stringify([{id:'standalone',title:'Samodzielny',exercises:[{key:'bench_flat',sets:2,target:'8'}]}]));localStorage.setItem('gymverse_profiles_v1',JSON.stringify({schemaVersion:1,activeProfileId:'profile-one',profiles:[{id:'profile-one',name:'One',attributes:{trainingGoal:'hypertrophy'},data:{}},{id:'profile-two',name:'Two',attributes:{trainingGoal:'fitness'},data:{}}]}));});
 await page.goto('/');await openNew(page);
}
async function openNew(page){await page.locator('[data-act="editPlans"]').click();await page.locator('[data-act="programNew"]').click();}
async function data(page){return page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());}
async function records(page){return JSON.parse((await data(page))[KEY]||'{"items":[]}').items;}
async function saved(page){await expect(page.locator('#view-program-editor [data-working-status]')).toHaveText('Szkic zachowany na tym urządzeniu.');}
async function fill(page,name){await page.getByLabel('Nazwa dnia',{exact:true}).fill(name);await action(page,'edit').click();await page.locator('#peAddSelect').selectOption('db_fly');await page.locator('[data-act="peAdd"]').click();await page.locator('[data-field="peVariant"]').last().selectOption('incline');await page.locator('[data-field="peRest"]').last().selectOption('120');await page.getByRole('button',{name:'← Wróć do programu',exact:true}).click();await saved(page);}
for(const count of [1,3,6])test(`durable ${count} day draft resumes after page closes without unload`,async({page,context},testInfo)=>{
 await seed(page);await page.getByLabel('Nazwa programu',{exact:true}).fill(`Roboczy ${count}`);
 for(let i=0;i<count;i++){if(i)await action(page,'add').click();await fill(page,`Dzień ${i+1}`);}
 await action(page,'select').nth(count-1).click();await saved(page);const before=await records(page),plans=(await data(page)).gymverse_plans;
 await page.close({runBeforeUnload:false});const next=await context.newPage();await next.goto('/');await openNew(next);
 await expect(next.getByRole('heading',{name:'Znaleziono niezapisane zmiany'})).toBeVisible();if(count===3)await next.screenshot({path:`outputs/GV-BOLT-STAGE64D/${testInfo.project.name}-recovery.png`,fullPage:true,animations:'disabled'});await next.locator('[data-recover="resume"]').click();
 await expect(next.getByLabel('Nazwa programu',{exact:true})).toHaveValue(`Roboczy ${count}`);await expect(next.getByLabel('Nazwa dnia',{exact:true})).toHaveValue(`Dzień ${count}`);
 expect(await records(next)).toEqual(before);expect((await data(next)).gymverse_plans).toBe(plans);
 await action(next,'review').click();await expect(next.locator('[data-program-action="select"][aria-pressed="true"]')).toHaveCount(0);
 await action(next,'select').first().click();await expect(next.getByLabel('Nazwa dnia',{exact:true})).toHaveValue('Dzień 1');
 await action(next,'save').click();await expect(next.locator('#view-program-preview')).toBeVisible();expect(await records(next)).toEqual([]);
 const actual=JSON.parse((await data(next)).gymverse_plans).filter(x=>x.id!=='standalone');expect(actual).toHaveLength(count);expect(actual[0].exercises[0]).toMatchObject({key:'db_fly',variantId:'incline',restSeconds:120});
});
test('existing program reload resumes edits and stale saved source cannot overwrite newer day',async({page})=>{
 await seed(page);await fill(page,'Original');await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();await page.locator('[data-act="programEdit"]').click();await page.getByLabel('Nazwa dnia',{exact:true}).fill('Roboczy');await saved(page);
 const item=(await records(page))[0],programId=item.draft.programId;page.on('dialog',d=>d.accept());await page.reload();await page.locator('#assignedProgram [data-act="stage6Ready"]').click();await page.locator(`[data-act="programPreview"][data-id="${programId}"]`).click();await page.locator('[data-act="programEdit"]').click();await page.locator('[data-recover="resume"]').click();await expect(page.getByLabel('Nazwa dnia',{exact:true})).toHaveValue('Roboczy');
 await page.evaluate(async id=>{const s=window.__gymverseTestHarness.getStore(),p=JSON.parse((await s.refreshSnapshot()).gymverse_plans);p.find(x=>x.id===id).title='Nowszy';await s.transact({gymverse_plans:p});},item.draft.dayPlanIds[0]);
 await action(page,'save').click();await expect(page.locator('#programEditorStatus')).toContainText('Dane zmieniły');expect(JSON.parse((await data(page)).gymverse_plans).find(x=>x.id===item.draft.dayPlanIds[0]).title).toBe('Nowszy');expect(await records(page)).toHaveLength(1);
});
test('two tabs cannot overwrite or discard a newer draft revision',async({page,context})=>{
 await seed(page);await fill(page,'Shared');const other=await context.newPage();await other.goto('/');await openNew(other);await other.locator('[data-recover="resume"]').click();
 await page.getByLabel('Nazwa programu',{exact:true}).fill('Nowsza wersja');await saved(page);const newer=await records(page);
 await other.getByLabel('Nazwa programu',{exact:true}).fill('Starsza karta');await expect(other.locator('#view-program-editor [data-working-status]')).toContainText('innej karcie');expect(await records(other)).toEqual(newer);
 other.on('dialog',d=>d.accept());await action(other,'cancel').click();await expect(other.locator('#view-program-editor')).toBeVisible();expect(await records(other)).toEqual(newer);
});
test('discard is explicit and profile switch does not expose or delete another profile draft',async({page})=>{
 await seed(page);await fill(page,'Profil One');await saved(page);const first=await records(page);
 await page.evaluate(async()=>{const s=window.__gymverseTestHarness.getStore();const {switchProfile}=await import('./src/features/profiles/profile-model.js');const raw=await s.refreshSnapshot(),state=JSON.parse(raw.gymverse_profiles_v1);delete raw.gymverse_profiles_v1;const result=switchProfile(state,raw,'profile-two');await s.transact(Object.fromEntries(Object.entries(result.updates).map(([k,v])=>[k,typeof v==='string'?JSON.parse(v):v])));});
 page.on('dialog',d=>d.accept());await page.reload();await openNew(page);await expect(page.getByLabel('Nazwa programu',{exact:true})).toBeVisible();await page.getByLabel('Nazwa programu',{exact:true}).fill('Two');await saved(page);expect(await records(page)).toHaveLength(2);
 await action(page,'cancel').click();await expect(page.locator('#view-plan-library')).toBeVisible();expect(await records(page)).toEqual(first);
});
test('autosave refusal remains visible and retry preserves program data',async({page})=>{
 await seed(page);await saved(page);const before=await data(page);
 await expect(action(page,'retry')).toHaveCount(0);
 await page.evaluate(()=>{const s=window.__gymverseTestHarness.getStore(),original=s.transact.bind(s);s.transact=async updates=>{s.transact=original;throw Error('synthetic refusal');};});
 await page.getByLabel('Nazwa programu',{exact:true}).fill('Retry');await expect(page.locator('#view-program-editor [data-working-status]')).toContainText('Nie udało');await expect(action(page,'retry')).toBeVisible();expect((await data(page))[KEY]).toBe(before[KEY]);
 await action(page,'retry').click();await saved(page);expect((await records(page))[0].draft.title).toBe('Retry');expect((await data(page)).gymverse_plans).toBe(before.gymverse_plans);
});
test('full ZIP v5 restores a working draft and malformed draft is rejected',async({page,browser})=>{
 await seed(page);await fill(page,'Kopia szkicu');const original=await records(page);
 const zip=await page.evaluate(async()=>{const s=window.__gymverseTestHarness.getStore(),raw=await s.refreshSnapshot(),snapshot=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,JSON.parse(v)]));const {backupProfiles}=await import('./src/features/backup/import-plan.js');snapshot.gymverse_profiles_v1=backupProfiles(snapshot);const {createBackupV5}=await import('./src/gv-data.js');return Array.from(new Uint8Array(await(await createBackupV5(snapshot)).arrayBuffer()));});
 const ctx=await browser.newContext({baseURL:new URL(page.url()).origin}),other=await ctx.newPage();await other.goto('/');await expect(other.locator('#stage6Welcome')).toBeVisible();
 await other.evaluate(async bytes=>{const {previewBackupV5,restoreBackupV5}=await import('./src/gv-data.js');const store=window.__gymverseTestHarness.getStore();const preview=await previewBackupV5(new Blob([new Uint8Array(bytes)]));await restoreBackupV5(store.storage,preview,{confirmed:true,restoreDrafts:true,restoreActive:true});await store.flush();},zip);
 await other.reload();await openNew(other);await other.locator('[data-recover="resume"]').click();await expect(other.getByLabel('Nazwa dnia',{exact:true})).toHaveValue('Kopia szkicu');expect(await records(other)).toEqual(original);await action(other,'save').click();await expect(other.locator('#view-program-preview')).toBeVisible();expect(await records(other)).toEqual([]);
 const valid=await other.evaluate(async()=>{const {inspectLegacySnapshot}=await import('./src/gv-data.js');return(await inspectLegacySnapshot({gymverse_program_drafts_v1:{version:1,items:[{id:'broken'}]}})).ok;});expect(valid).toBe(false);await ctx.close();
});

test('IndexedDB preserves in-progress text before blur and resumes selected second day',async({page,context})=>{
 await seed(page);await fill(page,'First');await action(page,'add').click();await fill(page,'Second');
 await page.evaluate(async()=>{const s=window.__gymverseTestHarness.getStore();await s.activateMigration(await s.previewMigration(),{sourceExportVerified:true,v5ExportVerified:true});});
 await action(page,'edit').click();await page.locator('[data-field="peTarget"]').first().fill('10-15');
 await expect.poll(async()=>{const item=(await records(page))[0];return item.draft.plans.find(p=>p.id===item.selected).exercises[0].target;}).toBe('10-15');
 await page.close({runBeforeUnload:false});const next=await context.newPage();await next.goto('/');await openNew(next);await next.locator('[data-recover="resume"]').click();
 await expect(next.getByLabel('Nazwa dnia',{exact:true})).toHaveValue('Second');await action(next,'edit').click();await expect(next.locator('[data-field="peTarget"]').first()).toHaveValue('10-15');
 expect(await next.evaluate(()=>window.__gymverseTestHarness.getStore().mode)).toBe('indexeddb');
});

test('existing draft resumes and commits only the edited second day',async({page,context})=>{
 await seed(page);await fill(page,'First');await action(page,'add').click();await fill(page,'Second');await action(page,'save').click();await expect(page.locator('#view-program-preview')).toBeVisible();
 const original=JSON.parse((await data(page)).gymverse_plans);await page.locator('[data-act="programEdit"]').click();await page.getByLabel('Nazwa dnia',{exact:true}).fill('Edited second');await saved(page);const item=(await records(page))[0];
 await page.close({runBeforeUnload:false});const next=await context.newPage();await next.goto('/');await next.locator('#assignedProgram [data-act="stage6Ready"]').click();await next.locator(`[data-act="programPreview"][data-id="${item.draft.programId}"]`).click();await next.locator('[data-act="programEdit"]').click();await next.locator('[data-recover="resume"]').click();
 await expect(next.getByLabel('Nazwa dnia',{exact:true})).toHaveValue('Edited second');await action(next,'save').click();await expect(next.locator('#view-program-preview')).toBeVisible();const actual=JSON.parse((await data(next)).gymverse_plans);
 expect(actual.find(p=>p.id===item.selected).title).toBe('Edited second');expect(actual.filter(p=>p.id!==item.selected)).toEqual(original.filter(p=>p.id!==item.selected));expect(await records(next)).toEqual([]);
});

test('full ZIP export from an older tab includes the latest draft from another tab',async({page,context})=>{
 await seed(page);await saved(page);const other=await context.newPage();await other.goto('/');await expect(other.locator('#migrateDataButton')).toBeVisible();
 await page.getByLabel('Nazwa programu',{exact:true}).fill('Latest from another tab');await fill(page,'Fresh');const expected=await records(page);
 other.on('dialog',d=>d.accept());await other.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
 await other.locator('[data-act="export"]').first().click();await expect(other.locator('#fileDeliveryPrompt')).toBeVisible();
 const downloading=other.waitForEvent('download');await other.locator('[data-act="deliverPreparedFile"]').click();const file=await downloading;const {readFile}=await import('node:fs/promises');const bytes=Array.from(await readFile(await file.path()));
 const result=await other.evaluate(async bytes=>{const {previewBackupV5}=await import('./src/gv-data.js');return(await previewBackupV5(new Blob([new Uint8Array(bytes)]))).snapshot.gymverse_program_drafts_v1.items;},bytes);
 expect(result).toEqual(expected);
});

test('recovery screen fits LIGHT DARK 320 to 430 and explicit discard removes that draft',async({page},info)=>{
 await seed(page);await fill(page,'Roboczy');const id=(await records(page))[0].id;page.on('dialog',d=>d.accept());await page.reload({waitUntil:'domcontentloaded'});await openNew(page);await expect(page.getByRole('heading',{name:'Znaleziono niezapisane zmiany'})).toBeVisible();
 for(const theme of ['light','dark'])for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:850});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===320)await page.screenshot({path:`outputs/GV-BOLT-STAGE64D/${info.project.name}-recovery-${theme}-320.png`,fullPage:true,animations:'disabled'});
 }
 await page.locator('[data-recover="discard"]').click();await expect(page.getByLabel('Nazwa programu',{exact:true})).toBeVisible();await expect.poll(async()=>(await records(page)).some(x=>x.id===id)).toBe(false);
});
