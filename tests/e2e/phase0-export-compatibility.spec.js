import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const archivePath = new URL('../fixtures/phase0/public-4fa087b-v5-synthetic.zip', import.meta.url);
async function uploadAndReload(page, file) {
  // Restore intentionally schedules a reload after committing its transaction.
  // Wait for that navigation before querying or modifying the restored store.
  const reloaded = page.waitForEvent('framenavigated', { predicate: frame => frame === page.mainFrame() });
  await page.locator('#importFile').setInputFiles(file);
  await reloaded;
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
}
async function importPublicExport(page) {
  await page.goto('/');
  page.on('dialog', dialog => dialog.accept());
  await uploadAndReload(page,{name:'public-synthetic.zip',mimeType:'application/zip',buffer:await readFile(archivePath)});
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]')[0]?.id)).toBe('phase0-session');
}
async function snapshot(page) {
  return page.evaluate(async()=>Object.fromEntries(Object.entries(await window.__gymverseTestHarness.getStore().exportSnapshot()).map(([key,raw])=>[key,JSON.parse(raw)])));
}
test('original historical JSON v4 exporter output imports without inventing variant data',async({page})=>{
  await page.goto('/');
  page.on('dialog',d=>d.accept());
  await page.locator('#importFile').setInputFiles({name:'historical-v4.json',mimeType:'application/json',buffer:await readFile(new URL('../fixtures/phase0/legacy-7d32975-v4-synthetic.json',import.meta.url))});
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]')[0]?.details?.length)).toBe(4);
  const restored=await snapshot(page);
  expect(restored.gymverse_history[0].details.every(d=>!Object.hasOwn(d,'variantId'))).toBe(true);
  await page.reload();
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
  await page.reload();
  await page.locator('[data-act="resume"]').click();
  await expect(page.locator('.prev-val')).toHaveText(['75 kg × 8','70 kg × 10','65 kg × 12']);
  await expect(page.locator('#weight_0')).toHaveValue('77.5');
  await expect(page.locator('#btnDone_0')).toHaveClass(/completed/);
});

test('UI export reads active IndexedDB, downloads a file and restores offline in a clean context',async({page,browser})=>{
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
  await page.reload();
  await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false}));
  await page.locator('[data-act="export"]').first().click();
  await expect(page.locator('#fileDeliveryPrompt')).toBeVisible();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-act="deliverPreparedFile"]').click();
  const download=await downloadPromise;
  const buffer=await readFile(await download.path());
  const clean=await browser.newContext();
  const restoredPage=await clean.newPage();
  restoredPage.on('dialog',d=>d.accept());
  await restoredPage.goto('/');
  await restoredPage.evaluate(()=>navigator.serviceWorker.ready);
  await restoredPage.reload();
  await clean.setOffline(true);
  await uploadAndReload(restoredPage,{name:download.suggestedFilename(),mimeType:'application/zip',buffer});
  await expect.poll(()=>restoredPage.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]')[0]?.details[0]?.weight)).toBe(67.5);
  const actual=await snapshot(restoredPage);
  for(const key of ['gymverse_history','gymverse_plans','gymverse_body','gymverse_rest','gymverse_bar']) expect(actual[key]).toEqual(expected[key]);
  expect(actual.gymverse_active.sets).toEqual(expected.gymverse_active.sets);
  await clean.close();
});
