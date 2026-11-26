import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('welcome links to existing profile creation and restore without altering profile', async ({page}) => {
  await page.goto('/'); await expect(page.locator('#stage6Welcome')).toBeVisible();
  const before=await page.evaluate(()=>localStorage.getItem('gymverse_profiles_v1'));
  await expect(page.locator('#stage6Welcome')).toContainText('Przywróć dane z kopii');
  await page.locator('[data-act="stage6CreateProfile"]').click();
  await expect(page.locator('#newProfileName')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_profiles_v1'))).toBe(before);
  await page.locator('#newProfileName').fill('Profil testowy');await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="createProfile"]').click();await expect(page.locator('#view-plan-choices')).toBeVisible();
});

test('welcome restores a synthetic ZIP without creating another profile',async({page})=>{
  page.on('dialog', dialog=>dialog.accept());await page.goto('/');await expect(page.locator('#stage6Welcome')).toBeVisible();
  const bytes=await page.evaluate(async()=>{const {createBackupV5}=await import('./src/gv-data.js');const id='stage6-restored-profile';const data={gymverse_history:[],gymverse_plans:[{id:'stage6-restored-plan',title:'Restored',exercises:[{key:'bench_flat',sets:1,target:'8-10'}]}],gymverse_profiles_v1:{schemaVersion:1,activeProfileId:id,profiles:[{id,name:'Z kopii',createdAt:'2026-01-01T00:00:00Z',data:{}}]}};return Array.from(new Uint8Array(await (await createBackupV5(data)).arrayBuffer()));});
  const chooserPromise=page.waitForEvent('filechooser');await page.locator('[data-act="stage6Restore"]').click();const chooser=await chooserPromise;await chooser.setFiles({name:'synthetic.zip',mimeType:'application/zip',buffer:Buffer.from(bytes)});
  await expect(page.locator('#backupImportPreview')).toContainText('Przywrócenie pustej aplikacji');const reload=page.waitForEvent('framenavigated',{predicate:f=>f===page.mainFrame()});await page.locator('[data-backup-choice="merge"]').click();await reload;
  await expect(page.locator('#profileSelect')).toHaveValue('stage6-restored-profile');const profiles=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_profiles_v1')).profiles);expect(profiles.map(p=>p.id)).toEqual(['stage6-restored-profile']);
});

test('plan preview is read-only and requires a separate start', async ({page}) => {
  await page.goto('/');
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('gymverse_plans',JSON.stringify([{id:'test-plan-6',title:'Test plan',exercises:[{key:'db_fly',variantId:'incline',sets:3,target:'8-12',restSeconds:90}]}]));});
  await page.reload(); await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await expect(page.locator('#view-plan-choices')).toContainText('Generator treningowy');
  const before=await page.evaluate(()=>JSON.stringify({...localStorage}));
  await page.locator('#view-plan-choices [data-act="stage6Ready"]').click(); await page.locator('[data-act="stage6Preview"][data-id="test-plan-6"]').click();
  await expect(page.locator('#view-plan-preview')).toContainText('8-12');
  await expect(page.locator('#view-plan-preview')).toContainText('1:30');
  expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(before);
  await page.locator('#view-plan-preview [data-act="stage6Ready"]').click();await expect(page.locator('#view-plan-library')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_active'))).toBeNull();
});

test('four routes preserve active session and link to actual functions',async({page})=>{
  await page.goto('/');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('gymverse_plans',JSON.stringify([{id:'routes-plan',title:'Routes',exercises:[{key:'bench_flat',sets:2,target:'8-10'}]}]));});await page.reload();
  await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await page.locator('[data-act="stage6Own"]').click();await expect(page.locator('#view-planedit')).toBeVisible();
  await page.locator('#view-planedit [data-view="view-plans"]').click();await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await page.locator('[data-act="stage6Generator"]').click();await expect(page.locator('.generator-wizard-shell')).toHaveAttribute('open','');
  await page.locator('#view-planedit [data-view="view-plans"]').click();await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await page.locator('#view-plan-choices [data-act="stage6Skip"]').first().click();await expect(page.locator('#view-plans')).toBeVisible();
  await page.locator('[data-act="startPlan"][data-plan="routes-plan"]').click();await expect(page.locator('#view-workout')).toBeVisible();
  const active=await page.evaluate(()=>localStorage.getItem('gymverse_active'));await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();await page.locator('#view-plan-choices [data-act="stage6Ready"]').click();await page.locator('[data-act="stage6Preview"][data-id="routes-plan"]').click();
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_active'))).toBe(active);await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('#resumeBox [data-act="resume"]').click();await expect(page.locator('#view-workout')).toBeVisible();
});

for(const width of [320,375,390,430]) for(const theme of ['light','dark']) test(`stage6 responsive ${width} ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme});await page.goto('/');await expect(page.locator('#stage6Welcome')).toBeVisible();
  await mkdir('outputs/GV-BOLT-STAGE6/screenshots',{recursive:true});if(width===390)await page.screenshot({animations:'disabled',path:`outputs/GV-BOLT-STAGE6/screenshots/welcome-${theme}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('[data-act="stage6CreateProfile"]').click();await page.locator('#newProfileName').fill('Profil testowy');await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="createProfile"]').click();await expect(page.locator('#view-plan-choices')).toBeVisible();
  if(width===390&&theme==='dark')await page.screenshot({animations:'disabled',path:'outputs/GV-BOLT-STAGE6/screenshots/choices-dark.png'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#view-plan-choices [data-act="stage6Ready"]').click();await page.locator('#view-plan-library [data-act="stage6Preview"]').first().click();await expect(page.locator('#view-plan-preview')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width===390&&theme==='dark')await page.screenshot({animations:'disabled',path:'outputs/GV-BOLT-STAGE6/screenshots/preview-dark.png'});
});
