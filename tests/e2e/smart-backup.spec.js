import {test,expect} from '@playwright/test';

// Older workout scenarios continue after explicitly skipping the new rest screen.
test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('#restScreen:not([hidden])'), async () => { await page.waitForFunction(() => document.querySelector('#sessionSaveStatus').hidden); await page.locator('#restScreen [data-act="timerSkip" ]').click(); }); });
const session=n=>({id:'smart-session-'+n,date:'2026-01-01T10:00:00.000Z',planId:'smart-plan',planTitle:'Synthetic',details:[{id:'set-'+n,exerciseId:'bench_flat',setNumber:1,weight:40+n,reps:8,date:'2026-01-01T10:00:00.000Z'}]});
async function boot(page,history=[],id='smart-profile-one'){
 await page.addInitScript(({history,id})=>{
 if(sessionStorage.getItem('smart-fixture-ready'))return;
 localStorage.clear();sessionStorage.clear();sessionStorage.setItem('smart-fixture-ready','1');localStorage.setItem('gymverse_history',JSON.stringify(history));localStorage.setItem('gymverse_plans',JSON.stringify([{id:'smart-plan',title:'Synthetic',exercises:[{key:'bench_flat',sets:1,target:'8-12'}]}]));localStorage.setItem('gymverse_profiles_v1',JSON.stringify({schemaVersion:1,activeProfileId:id,profiles:[{id,name:'Synthetic',createdAt:'2026-01-01T00:00:00Z',data:{}}]}));
 },{history,id});await page.goto('/',{waitUntil:'domcontentloaded'});await expect(page.locator('#migrateDataButton')).toBeVisible();
}
async function archive(page,sessions,id='smart-profile-one'){
 const bytes=await page.evaluate(async({sessions,id})=>{
 const {createBackupV5}=await import('./src/gv-data.js');const data={gymverse_history:sessions,gymverse_plans:[{id:'smart-plan',title:'Synthetic',exercises:[{key:'bench_flat',sets:1,target:'8-12'}]}],gymverse_profiles_v1:{schemaVersion:1,activeProfileId:id,profiles:[{id,name:'Synthetic',createdAt:'2026-01-01T00:00:00Z',data:{}}]}};
 return Array.from(new Uint8Array(await (await createBackupV5(data)).arrayBuffer()));
 },{sessions,id});return {name:'synthetic-smart.zip',mimeType:'application/zip',buffer:Buffer.from(bytes)};
}
async function commit(page){const reload=page.waitForEvent('framenavigated',{predicate:f=>f===page.mainFrame()});await page.locator('[data-backup-choice="merge"]').click();await reload;await page.waitForFunction(()=>!!window.__gymverseTestHarness);}
for(const width of [320,390,430])for(const theme of ['light','dark'])test(`safe supplementation and repeat ${width} ${theme}`,async({page},info)=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:theme});await boot(page,[session(1)]);
 const file=await archive(page,[session(1),session(2)]);await page.locator('#importFile').setInputFiles(file);
 await expect(page.locator('#backupImportPreview')).toContainText('Już obecne: 1. Nowe: 1. Konflikty: 0');
 expect(await page.locator('#backupImportPreview').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('preview.png')});await commit(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')).map(s=>s.id))).toEqual(['smart-session-1','smart-session-2']);
 await page.locator('#importFile').setInputFiles(file);await expect(page.locator('#backupImportPreview')).toContainText('Już obecne: 2. Nowe: 0.');await commit(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')).length)).toBe(2);
});
test('different profile and conflicts preserve existing user and completed sets',async({page})=>{
 await boot(page,[session(1)]);let file=await archive(page,[session(2)],'smart-profile-two');await page.locator('#importFile').setInputFiles(file);await expect(page.locator('#backupImportPreview')).toContainText('Nowe profile: 1');await commit(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_profiles_v1')).profiles.length)).toBe(2);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history'))[0].details[0].weight)).toBe(41);
 file=await archive(page,[{...session(1),details:[{...session(1).details[0],weight:900}]}]);await page.locator('#importFile').setInputFiles(file);await expect(page.locator('#backupImportPreview')).toContainText('Konflikty: 1');await commit(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history'))[0].details[0].weight)).toBe(41);
});
test('empty onboarding restores complete backup without empty-profile wizard',async({page})=>{
 await page.goto('/');await expect(page.locator('#stage6Welcome')).toBeVisible();const file=await archive(page,[session(1)]);page.on('dialog',d=>d.accept());
 await page.locator('#importFile').setInputFiles(file);await expect(page.locator('#backupImportPreview')).toContainText('Przywrócenie pustej aplikacji');await commit(page);
 await expect(page.locator('#profileSelect')).toHaveValue('smart-profile-one');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')).length)).toBe(1);
 await page.locator('[data-act="startPlan"][data-plan="smart-plan"]').click();await expect(page.locator('.prev-val')).toHaveText(['41 kg × 8']);
});

test('failed merge rolls back, retries safely and preserves active completed work',async({page})=>{
await boot(page,[session(1)]);await page.locator('[data-act="startPlan"][data-plan="smart-plan"]').click();await page.locator('#weight_0').fill('45');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
 const file=await archive(page,[session(1),session(2)]);
 const historyBefore=await page.evaluate(()=>localStorage.getItem('gymverse_history'));
 await page.locator('#importFile').setInputFiles(file);await expect(page.locator('#backupImportPreview')).toBeVisible();
 await page.evaluate(()=>{const write=Storage.prototype.setItem;let failed=false;Storage.prototype.setItem=function(key,value){if(key==='gymverse_history'&&!failed){failed=true;throw new DOMException('Synthetic storage failure','QuotaExceededError');}return write.call(this,key,value);};});
 await page.locator('[data-backup-choice="merge"]').click();await expect(page.locator('#toast')).toContainText('Nie udało się');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')))).toEqual(JSON.parse(historyBefore));
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(1);
 await page.locator('#importFile').setInputFiles(file);await commit(page);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')).length)).toBe(2);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(1);
});

test('merge preserves existing auxiliary data and imports auxiliary data of another profile',async({page})=>{
 await boot(page,[session(1)]);
 const bytes=await page.evaluate(async()=>{
  const {replaceProfileAuxiliary,createBackupV5}=await import('./src/gv-data.js');
  const rule=id=>({id,exerciseId:'bench_flat',sessionIds:['smart-session-1'],ruleVersion:1,source:'user_confirmed',confirmedAt:'2026-01-02T00:00:00.000Z',interpretation:{unit:'user_confirmed'}});
  await replaceProfileAuxiliary('smart-profile-one',{interpretations:[rule('local-rule')],media:[]});
  const registry={schemaVersion:1,activeProfileId:'smart-profile-two',profiles:[{id:'smart-profile-two',name:'Second',data:{}}]};
  const archive=await createBackupV5({gymverse_profiles_v1:registry,gymverse_history:[],gymverse_plans:[]},{legacyInterpretations:[rule('imported-rule')],customMedia:[{name:'custom-media/imported.png',bytes:new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])}]});
  return Array.from(new Uint8Array(await archive.arrayBuffer()));
 });
 await page.locator('#importFile').setInputFiles({name:'synthetic-aux.zip',mimeType:'application/zip',buffer:Buffer.from(bytes)});await commit(page);
 const result=await page.evaluate(async()=>{const {readLegacyInterpretations,readCustomMedia}=await import('./src/gv-data.js');return {local:await readLegacyInterpretations({profileId:'smart-profile-one'}),other:await readLegacyInterpretations({profileId:'smart-profile-two'}),media:(await readCustomMedia({profileId:'smart-profile-two'})).map(m=>m.name)};});
 expect(result.local.map(r=>r.id)).toEqual(['local-rule']);expect(result.other.map(r=>r.id)).toEqual(['imported-rule']);expect(result.media).toEqual(['custom-media/imported.png']);
});
