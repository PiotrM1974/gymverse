import {test,expect} from '@playwright/test';
const A='pg_'+'a'.repeat(32),B='pg_'+'b'.repeat(32),C='pg_'+'c'.repeat(32);
const raw=page=>page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());
async function boot(page,count=4){
  page.on('dialog',dialog=>dialog.accept());
  await page.addInitScript(({A,B,C,count})=>{
    if(localStorage.getItem('home-program-seeded'))return;
    localStorage.setItem('home-program-seeded','1');
    const exercise={key:'bench_flat',variantId:'default',sets:1,target:'8-10',restSeconds:60};
    const days=Array.from({length:count},(_,i)=>({id:'day-'+i,title:i%2?'PULL':'PUSH',exercises:[exercise,{key:'db_fly',variantId:'default',sets:1,target:'10-12',restSeconds:60}]}));
    const single={id:'standalone',title:'PUSH',dayOfWeek:'mon',exercises:[exercise]},other={id:'other-day',title:'PUSH',exercises:[exercise]},second={id:'second-profile-day',title:'Drugi profil',exercises:[exercise]};
    const profiles=[{id:'profile-a',name:'Profil testowy A',attributes:{age:32,trainingGoal:'hypertrophy',equipment:['dumbbells','bench','machines']},data:{},planPrograms:{schemaVersion:1,assignedProgramId:A,programs:[{id:B,title:'Program dodatkowy',dayPlanIds:[other.id]},{id:A,title:`PUSH / PULL — ${count} dni`,dayPlanIds:days.map(day=>day.id)}]}},{id:'profile-b',name:'Profil testowy B',attributes:{},data:{gymverse_plans:JSON.stringify([second]),gymverse_history:'[]'},planPrograms:{schemaVersion:1,assignedProgramId:C,programs:[{id:C,title:'Program profilu B',dayPlanIds:[second.id]}]}}];
    localStorage.setItem('gymverse_schema','4');localStorage.setItem('gymverse_plans',JSON.stringify([...days,other,single]));localStorage.setItem('gymverse_history','[]');localStorage.setItem('gymverse_profiles_v1',JSON.stringify({schemaVersion:1,activeProfileId:'profile-a',profiles}));
  },{A,B,C,count});
  await page.goto('/');await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
}


async function seedDraft(page,programId=A){return page.evaluate(async programId=>{
 const store=window.__gymverseTestHarness.getStore(),raw=await store.refreshSnapshot();
 const {createProgramDraft,attachDraftDay}=await import('./src/features/plans/program-editor.js');const {saveWorkingDraft}=await import('./src/features/plans/program-drafts.js');
 const draft=createProgramDraft(JSON.parse(raw.gymverse_profiles_v1),JSON.parse(raw.gymverse_plans),programId);
 if(!programId)attachDraftDay(draft,'standalone');draft.title='Do sprawdzenia — góra';
 return saveWorkingDraft(store,{id:'working-synthetic',revision:null,draft,selected:draft.dayPlanIds[0],custom:{},baseCustom:{}});
},programId);}
const manage=page=>page.locator('#view-plans [data-act="editPlans"]').click();

const home=page=>page.locator('.header-nav [data-view="view-plans"]').click();
const settings=page=>page.getByRole('button',{name:'Ustawienia',exact:true}).click();
async function switchTo(page,id){await settings(page);await page.locator('#profileSelect').selectOption(id);await expect(page.locator('#homeActiveProfile')).toHaveText(id==='profile-a'?'Profil testowy A':'Profil testowy B');await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_profiles_v1).activeProfileId).toBe(id);}
async function remove(page){await manage(page);await page.locator('.managed-program[data-id="'+A+'"] [data-act="programDelete"]').click();}
async function archivedUI(page,count){
 await expect(page.locator('.managed-program')).toHaveCount(1);await expect(page.locator('#view-planedit [data-act="peOpen"]')).toHaveCount(1);
 await home(page);await expect(page.locator('.program-card')).toHaveCount(1);await expect(page.locator('#planList .plan-card')).toHaveCount(1);
 for(let i=0;i<count;i++)await expect(page.locator('#view-plans [data-id="day-'+i+'"]')).toHaveCount(0);
}
async function migrate(page){await page.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore();await store.activateMigration(await store.previewMigration(),{sourceExportVerified:true,v5ExportVerified:true});});await page.reload();await expect.poll(()=>page.evaluate(()=>window.__gymverseTestHarness?.getStore().mode)).toBe('indexeddb');}

for(const count of [1,3,6])for(const db of ['localStorage','indexedDB'])test('deleted '+count+' day program stays hidden with intact records in '+db,async({page})=>{
 await boot(page,count);if(db==='indexedDB')await migrate(page);const before=await raw(page);await remove(page);await archivedUI(page,count);
 const after=await raw(page),state=JSON.parse(after.gymverse_profiles_v1);expect(state.profiles[0].planPrograms.archivedDayPlanIds).toEqual(Array.from({length:count},(_,i)=>'day-'+i));expect(state.profiles[1]).toEqual(JSON.parse(before.gymverse_profiles_v1).profiles[1]);
 for(const key of ['gymverse_plans','gymverse_history','gymverse_active','gymverse_last_weights'])expect(after[key]).toBe(before[key]);
 await page.reload();await expect(page.locator('.program-card')).toHaveCount(1);await expect(page.locator('#planList .plan-card')).toHaveCount(1);await manage(page);await archivedUI(page,count);
 await manage(page);await page.locator('[data-act="programNew"]').click();await expect(page.locator('#programAttach option[value^="day-"]')).toHaveCount(0);
});

test('deletion preserves completed workout, tonnage, RIR, Previous and ZIP restoration',async({page,context})=>{
 await boot(page);await page.locator('.program-card[data-id="'+A+'"]').click();await page.locator('[data-act="programDay"]').first().click();await page.locator('[data-act="programStart"]').click();
 await page.locator('.workout-extras > summary').click();await page.locator('[data-act="rir"][data-v="2"]').click();await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_active).rir[0]).toBe(2);await expect(page.locator('#sessionSaveStatus')).toBeHidden();
 await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();await expect(page.locator('#restScreen')).toBeVisible();await page.locator('#restScreen [data-act="timerSkip"]').click();
 await page.locator('#weight_0').fill('10');await page.locator('#reps_0').fill('10');await page.locator('#btnDone_0').click();await page.locator('[data-act="finish"]').click();
 await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_history).length).toBe(1);await home(page);const before=await raw(page);await remove(page);await archivedUI(page,4);
 const after=await raw(page);expect(JSON.parse(after.gymverse_history)[0].details[0].rir).toBe(2);expect(after.gymverse_history).toBe(before.gymverse_history);expect(after.gymverse_last_weights).toBe(before.gymverse_last_weights);
 await page.locator('.header-nav [data-view="view-stats"]').click();await expect(page.locator('#statsLifetime')).toContainText('420');
 await page.locator('.header-nav [data-view="view-history"]').click();await expect(page.locator('.hist-card')).toHaveCount(1);await page.locator('.hist-head').click();await expect(page.locator('#historyList')).toContainText('40×8');
 const snap=await page.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore(),{createBackupV5,previewBackupV5}=await import('./src/gv-data.js');const parsed=Object.fromEntries(Object.entries(await store.refreshSnapshot()).map(([k,v])=>[k,JSON.parse(v)]));const zip=await createBackupV5(parsed);await previewBackupV5(zip);return Array.from(new Uint8Array(await zip.arrayBuffer()));});
 const isolated=await context.browser().newContext();const restored=await isolated.newPage();await restored.goto(page.url());await expect.poll(()=>restored.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
 await restored.evaluate(async bytes=>{const {previewBackupV5,restoreBackupV5}=await import('./src/gv-data.js');const preview=await previewBackupV5(new Blob([new Uint8Array(bytes)],{type:'application/zip'}));await restoreBackupV5(window.__gymverseTestHarness.getStore().storage,preview,{confirmed:true,restoreActive:true,restoreDrafts:true});},snap);await restored.reload();await expect(restored.locator('#planList .plan-card')).toHaveCount(1);expect(JSON.parse((await raw(restored)).gymverse_history)).toEqual(JSON.parse(before.gymverse_history));await manage(restored);await archivedUI(restored,4);
 await restored.locator('#planList [data-act="startPlan"]').click();await expect(restored.locator('.prev-val').first()).toContainText('40 kg × 8');await isolated.close();
});

test('active workout in another tab blocks deletion and stale deletion cannot affect a switched profile',async({page,context})=>{
 await boot(page);await manage(page);const other=await context.newPage();other.on('dialog',d=>d.accept());await other.goto('/');await expect.poll(()=>other.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
 await other.locator('.program-card[data-id="'+A+'"]').click();await other.locator('[data-act="programDay"]').first().click();await other.locator('[data-act="programStart"]').click();await other.locator('#weight_0').fill('45');await other.locator('#reps_0').fill('9');await other.locator('#btnDone_0').click();await expect(other.locator('#restScreen')).toBeVisible();await expect.poll(async()=>JSON.parse((await raw(other)).gymverse_active).restState?.pending).toBe(false);
 const before=await raw(other);await page.locator('.managed-program[data-id="'+A+'"] [data-act="programDelete"]').click();await expect(page.locator('#toast')).toContainText('Najpierw zakończ');expect((await raw(page)).gymverse_profiles_v1).toBe(before.gymverse_profiles_v1);expect((await raw(page)).gymverse_active).toBe(before.gymverse_active);
 await other.locator('#restScreen [data-act="timerSkip"]').click();await switchTo(other,'profile-b');const switched=await raw(other);await page.locator('.managed-program[data-id="'+A+'"] [data-act="programDelete"]').click();await expect(page.locator('#toast')).toContainText('zmieniły się');expect((await raw(page)).gymverse_profiles_v1).toBe(switched.gymverse_profiles_v1);
 await switchTo(other,'profile-a');await other.locator('#resumeBox button').first().click();await expect(other.locator('#view-workout')).toHaveClass(/active/);expect(JSON.parse((await raw(other)).gymverse_active).sets[0]).toMatchObject({weight:45,reps:9});await other.close();
});

test('refused deletion preserves records and can retry after lock release',async({page})=>{
 await boot(page);const before=await raw(page);await page.evaluate(()=>{const native=Storage.prototype.setItem;window.restoreArchiveWrite=()=>Storage.prototype.setItem=native;let fail=true;Storage.prototype.setItem=function(k,v){if(k==='gymverse_profiles_v1'&&fail&&JSON.parse(v).profiles[0].planPrograms.archivedDayPlanIds){fail=false;throw Error('synthetic refusal');}return native.call(this,k,v);};});
 await remove(page);await expect(page.locator('#toast')).toContainText('Nie usunięto');expect((await raw(page)).gymverse_profiles_v1).toBe(before.gymverse_profiles_v1);expect((await raw(page)).gymverse_plans).toBe(before.gymverse_plans);
 await page.evaluate(()=>window.restoreArchiveWrite());await page.locator('.managed-program[data-id="'+A+'"] [data-act="programDelete"]').click();await archivedUI(page,4);
 expect(await page.evaluate(async()=>(await navigator.locks.query()).held.filter(l=>l.name==='gymnastika-plan-program-data').length)).toBe(0);
});

test('profile selector is settings-only; editing is protected and switching rejects a stale second tab',async({page,context})=>{
 await boot(page);await settings(page);await page.locator('#editProfileButton').click();await page.locator('#newProfileName').fill('Niezapisana nazwa');const before=await raw(page);await page.locator('#profileSelect').selectOption('profile-b');await expect(page.locator('#toast')).toContainText('Zapisz albo anuluj');expect((await raw(page)).gymverse_profiles_v1).toBe(before.gymverse_profiles_v1);await expect(page.locator('#newProfileName')).toHaveValue('Niezapisana nazwa');await page.locator('[data-act="profileCancel"]').click();
 const other=await context.newPage();await other.goto('/');await expect.poll(()=>other.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);await settings(other);await switchTo(page,'profile-b');const switched=await raw(page);await other.locator('#profileSelect').selectOption('profile-b');await expect(other.locator('#toast')).toContainText('zmieniły się');expect((await raw(other)).gymverse_profiles_v1).toBe(switched.gymverse_profiles_v1);await other.close();await page.reload();await expect(page.locator('#homeActiveProfile')).toHaveText('Profil testowy B');
});

for(const theme of ['light','dark'])test('read-only home identity and settings fit 320 375 390 '+theme,async({page},info)=>{
 await boot(page);await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
 for(const width of [320,375,390]){await page.setViewportSize({width,height:844});await home(page);await expect(page.locator('#view-plans select')).toHaveCount(0);await expect(page.locator('#homeActiveProfile')).toHaveText('Profil testowy A');await expect(page.locator('#profileHeading')).toHaveCSS('position','static');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width===390&&info.project.name==='chromium'){await expect.poll(()=>page.locator('.program-cover img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);await page.screenshot({path:'outputs/GV-RELEASE-203-FIX/home-'+theme+'-390.png',fullPage:true,animations:'disabled'});}await settings(page);await expect(page.locator('#profileSelect')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);if(width===390&&info.project.name==='chromium')await page.screenshot({path:'outputs/GV-RELEASE-203-FIX/settings-'+theme+'-390.png',fullPage:true,animations:'disabled'});}
});


test('first start creates one profile and keeps its picker exclusively in settings',async({page})=>{
 await page.goto('/');await expect(page.locator('#stage6Welcome')).toBeVisible();await page.locator('[data-act="stage6CreateProfile"]').click();await page.locator('#newProfileName').fill('Nowy profil testowy');for(let i=0;i<3;i++)await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="createProfile"]').click();await page.locator('#view-plan-choices [data-act="stage6Skip"]').first().click();await expect(page.locator('#homeActiveProfile')).toHaveText('Nowy profil testowy');await expect(page.locator('#view-plans select')).toHaveCount(0);await settings(page);await expect(page.locator('#profileSelect option')).toHaveCount(1);await expect(page.locator('#profileSelect option')).toContainText('Aktywny');await page.locator('#profileManage > summary').click();await expect(page.locator('#deleteProfileButton')).toBeDisabled();await page.reload();await expect(page.locator('#homeActiveProfile')).toHaveText('Nowy profil testowy');
});

test('durable editor draft survives switching profile and reopening',async({page})=>{
 await boot(page);await seedDraft(page);const before=await raw(page);await switchTo(page,'profile-b');await manage(page);await expect(page.locator('[data-act="managedDraftResume"]')).toHaveCount(0);await switchTo(page,'profile-a');await manage(page);await expect(page.locator('[data-act="managedDraftResume"]')).toHaveCount(1);expect((await raw(page)).gymverse_program_drafts_v1).toBe(before.gymverse_program_drafts_v1);await page.locator('[data-act="managedDraftResume"]').click();await expect(page.locator('[data-program-field="title"]')).toHaveValue('Do sprawdzenia — góra');
});


test('failed deletion rollback exposes uncertain integrity and blocks further writes',async({page})=>{
 await boot(page);const before=await raw(page);await page.evaluate(()=>{const set=Storage.prototype.setItem;let first=true;Storage.prototype.setItem=function(k,v){if(k==='gymverse_profiles_v1'){if(first){first=false;set.call(this,k,v);}throw Error('synthetic rollback failure');}return set.call(this,k,v);};});await remove(page);await expect(page.locator('#integrityWarning')).toBeVisible();await expect(page.locator('#toast')).toContainText('Integralność danych');
 expect(await page.evaluate(async()=>{try{await window.__gymverseTestHarness.getStore().transact({gymverse_history:[]});return false;}catch{return true;}})).toBe(true);expect(await page.evaluate(()=>localStorage.getItem('gymverse_plans'))).toBe(before.gymverse_plans);expect(await page.evaluate(()=>localStorage.getItem('gymverse_history'))).toBe(before.gymverse_history);
});


test('historical JSON v4 history imports without replacing archived day records',async({page})=>{
 const {readFile}=await import('node:fs/promises');const fixture=JSON.parse(await readFile('tests/fixtures/phase0/legacy-7d32975-v4-synthetic.json','utf8'));
 await boot(page);await remove(page);await page.locator('.managed-program[data-id="'+B+'"] [data-act="programDelete"]').click();await expect(page.locator('.managed-program')).toHaveCount(0);const before=await raw(page);
 async function importFixture(value){await settings(page);await page.locator('#backupMenuToggle').click();const choosing=page.waitForEvent('filechooser');await page.locator('#backupActionMenu [data-act="legacyImportBtn"]').click();await (await choosing).setFiles({name:'synthetic-v4.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});}
 await importFixture(fixture);await expect(page.locator('#toast')).toContainText('archiwalne');expect((await raw(page)).gymverse_plans).toBe(before.gymverse_plans);
 delete fixture.plans;await importFixture(fixture);await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_history).length).toBe(fixture.history.length);const after=await raw(page);expect(after.gymverse_plans).toBe(before.gymverse_plans);expect(JSON.parse(after.gymverse_profiles_v1).profiles[0].planPrograms).toEqual(JSON.parse(before.gymverse_profiles_v1).profiles[0].planPrograms);await page.reload();await expect(page.locator('#planList .plan-card')).toHaveCount(1);
});
