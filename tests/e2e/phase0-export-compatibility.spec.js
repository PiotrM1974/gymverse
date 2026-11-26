import { test, expect } from '@playwright/test';

// Older workout scenarios continue after explicitly skipping the new rest screen.
test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('#restScreen:not([hidden])'), async () => { await page.waitForFunction(() => document.querySelector('#sessionSaveStatus').hidden); await page.locator('#restScreen [data-act="timerSkip" ]').click(); }); });
import { readFile } from 'node:fs/promises';

const archivePath = new URL('../fixtures/phase0/public-4fa087b-v5-synthetic.zip', import.meta.url);
async function uploadAndReload(page, file) {
  // Restore intentionally schedules a reload after committing its transaction.
  // Wait for that navigation before querying or modifying the restored store.
  await page.locator('#importFile').setInputFiles(file);
  await expect(page.locator('#backupImportPreview')).toBeVisible();
  const reloaded = page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() });
  await page.locator('[data-backup-choice="restore"]').click();
  await reloaded;
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
}
async function importPublicExport(page) {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await expect(page.locator('#stage6Welcome')).toBeVisible();
  page.on('dialog', dialog => dialog.accept());
  await uploadAndReload(page,{name:'public-synthetic.zip',mimeType:'application/zip',buffer:await readFile(archivePath)});
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]')[0]?.id)).toBe('phase0-session');
}
async function completeRestoredOnboarding(page) {
  await expect(page.locator('#stage6Welcome')).toBeVisible();
  await page.locator('[data-act="stage6CreateProfile"]').click();
  await page.locator('#newProfileName').fill('Profil z kopii');
  for (let step = 1; step < 4; step++) await page.locator('#profileWizard [data-act="profileNext"]').click();
  await page.locator('#profileWizard [data-act="createProfile"]').click();
  await expect(page.locator('#stage6Welcome')).toBeHidden();
  await page.locator('#view-plan-choices [data-act="stage6Skip"]').first().click();
  await expect(page.locator('#view-plans')).toBeVisible();
}
async function snapshot(page) {
  return page.evaluate(async()=>Object.fromEntries(Object.entries(await window.__gymverseTestHarness.getStore().exportSnapshot()).map(([key,raw])=>[key,JSON.parse(raw)])));
}
test('original historical JSON v4 exporter output imports without inventing variant data',async({page})=>{
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await expect(page.locator('#stage6Welcome')).toBeVisible();
  page.on('dialog',d=>d.accept());
  await page.locator('#importFile').setInputFiles({name:'historical-v4.json',mimeType:'application/json',buffer:await readFile(new URL('../fixtures/phase0/legacy-7d32975-v4-synthetic.json',import.meta.url))});
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]')[0]?.details?.length)).toBe(4);
  const restored=await snapshot(page);
  expect(restored.gymverse_history[0].details.every(d=>!Object.hasOwn(d,'variantId'))).toBe(true);
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await completeRestoredOnboarding(page);
  await page.locator('[data-act="startPlan"][data-plan="phase0_synthetic"]').click();
  await expect(page.locator('.prev-val')).toHaveText(['75 kg × 8','70 kg × 10','65 kg × 12']);
});
test('actual public ZIP v5 restores history, variants, settings, active work and previous results',async({page})=>{
  await importPublicExport(page);
  const source=JSON.parse(await readFile(new URL('../fixtures/phase0/public-4fa087b-source.json',import.meta.url),'utf8'));
  const restored=await snapshot(page);
  for(const key of ['gymverse_history','gymverse_plans','gymverse_body','gymverse_rest','gymverse_bar']) expect(restored[key]).toEqual(source[key]);
  expect(restored.gymverse_active.sets).toEqual(source.gymverse_active.sets);
  expect(restored.gymverse_active.timerEndAt).toBe(0);
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await completeRestoredOnboarding(page);
  await page.locator('[data-act="resume"]').click();
  await expect(page.locator('.prev-val')).toHaveText(['75 kg × 8','70 kg × 10','65 kg × 12']);
  await expect(page.locator('#weight_0')).toHaveValue('77.5');
  await expect(page.locator('#btnDone_0')).toHaveClass(/completed/);
});

test('UI export reads active IndexedDB, downloads a file and restores offline in a clean context',async({page,browser},testInfo)=>{
  await importPublicExport(page);
  await page.evaluate(async()=>{
    const store=window.__gymverseTestHarness.getStore();
    const preview=await store.previewMigration();
    await store.activateMigration(preview,{sourceExportVerified:true,v5ExportVerified:true});
    const history=JSON.parse(store.storage.getItem('gymverse_history'));
    history[0].details[0].weight=67.5;
    await store.transact({gymverse_history:history});
  });
  const expected=await snapshot(page);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history'))[0].details[0].weight)).toBe(75);
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await completeRestoredOnboarding(page);
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  await page.locator('[data-act="openStorage"]').click();
  await page.locator('#view-storage [data-act="export"]').click();
  await expect(page.locator('#fileDeliveryPrompt')).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-act="deliverPreparedFile"]').click();
  const download=await downloadPromise;
  const offlineZip=testInfo.outputPath('active-indexeddb.zip');
  await download.saveAs(offlineZip);
  const clean=await browser.newContext();
  const restoredPage=await clean.newPage();
  restoredPage.on('dialog',d=>d.accept());
  await restoredPage.goto('/');
  await restoredPage.evaluate(()=>navigator.serviceWorker.ready);
  await restoredPage.reload();
  await expect(restoredPage.locator('#stage6Welcome')).toBeVisible();
  await restoredPage.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await clean.setOffline(true);
  await uploadAndReload(restoredPage,offlineZip);
  await expect.poll(()=>restoredPage.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]')[0]?.details[0]?.weight)).toBe(67.5);
  const actual=await snapshot(restoredPage);
  for(const key of ['gymverse_history','gymverse_plans','gymverse_body','gymverse_rest','gymverse_bar']) expect(actual[key]).toEqual(expected[key]);
  expect(actual.gymverse_active.sets).toEqual(expected.gymverse_active.sets);
  await clean.close();
});

test('downloaded multi-profile backup preserves swapped session, all history fields, plans and settings in clean context',async({page,browser})=>{
  await page.goto('/');
  await page.evaluate(()=>{
    localStorage.clear();sessionStorage.clear();
    localStorage.setItem('gymverse_plans',JSON.stringify([{id:'swap-roundtrip',title:'Synthetic swap',exercises:[{key:'bench_flat',sets:1,target:'8-12'}]}]));
  });
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await page.locator('[data-act="startPlan"][data-plan="swap-roundtrip"]').click();
  await page.locator('[data-act="swapOpen"]').first().click();
  page.once('dialog',d=>d.accept());
  await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').first().click();
  await page.locator('#weight_0').fill('22.5');await page.locator('#reps_0').fill('9');await page.locator('#btnDone_0').click();
  await page.locator('[data-act="finish"]').click();
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await page.evaluate(async()=>{
    const store=window.__gymverseTestHarness.getStore();
    const registry=store.get('gymverse_profiles_v1');
    const extra=structuredClone(registry.profiles[0]);
    extra.id='second-roundtrip-profile';extra.name='Second synthetic';
    extra.data={gymverse_history:JSON.stringify([{id:'second-session',date:'2026-01-01T12:00:00.000Z',planId:'second-plan',planTitle:'Second',details:[{id:'second-set',exerciseId:'leg_press',variantId:'high_feet',setNumber:1,weight:60,reps:10,date:'2026-01-01T12:00:00.000Z'}]}]),gymverse_plans:JSON.stringify([{id:'second-plan',title:'Second',exercises:[{key:'leg_press',variantId:'high_feet',sets:1,target:'8-12'}]}]),gymverse_rest:'120',gymverse_bar:'15'};
    registry.profiles.push(extra);
    await store.transact({gymverse_profiles_v1:registry,gymverse_body:[],gymverse_rest:120,gymverse_bar:15,gymverse_custom:{}});
  });
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  await page.locator('[data-act="export"]').first().click();
  await expect(page.locator('#fileDeliveryPrompt')).toBeVisible();
  const downloadEvent=page.waitForEvent('download');await page.locator('[data-act="deliverPreparedFile"]').click();
  const download=await downloadEvent;
  const downloadedBytes=await readFile(await download.path());
  const expected=await page.evaluate(async bytes=>{const {previewBackupV5}=await import('./src/gv-data.js');return (await previewBackupV5(new Blob([new Uint8Array(bytes)]))).snapshot;},Array.from(downloadedBytes));
  expect(expected.gymverse_history).toEqual((await snapshot(page)).gymverse_history);
  expect(expected.gymverse_history.at(-1).details[0].exerciseId).toBe('db_bench');
  expect(expected.gymverse_profiles_v1.profiles).toHaveLength(2);
  const clean=await browser.newContext();const target=await clean.newPage();
  target.on('dialog',d=>d.accept());await target.goto('/');
  await expect(target.locator('#stage6Welcome')).toBeVisible();
  await uploadAndReload(target,{name:'synthetic-roundtrip.zip',mimeType:'application/zip',buffer:await readFile(await download.path())});
  const actual=await snapshot(target);
  for(const key of ['gymverse_history','gymverse_profiles_v1','gymverse_plans','gymverse_body','gymverse_rest','gymverse_bar','gymverse_last_weights','gymverse_custom']) expect(actual[key]).toEqual(expected[key]);
  await clean.close();
});
