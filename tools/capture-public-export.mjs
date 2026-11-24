// Captures only synthetic data in a fresh, nonpersistent browser context.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dir = new URL('../tests/fixtures/phase0/', import.meta.url);
const sourceUrl = 'https://piotrm1974.github.io/gymverse/';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const html = await (await fetch(sourceUrl)).arrayBuffer();
if (sha256(Buffer.from(html)) !== '81c7383f5a02ef7ceef9c6ef0c8c3bb63f9d7943e93823bbfcbdfdd5fcf7be7b') throw Error('Public release changed: verify provenance before recapturing');
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ acceptDownloads: true });
  // Exercise the ordinary download fallback, not the OS sharing dialog.
  await page.addInitScript(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }));
  await page.goto(sourceUrl);
  await page.locator('[data-act="export"]').first().waitFor();
  await page.evaluate(() => {
    localStorage.clear();
    const history = [{ id: 'phase0-session', date: '2026-01-01T12:00:00.000Z', planId: 'phase0_synthetic', planTitle: 'Synthetic export verification', details:
      [[75,8],[70,10],[65,12]].map(([weight,reps],i) => ({id:'phase0-set-'+i,exerciseId:'bench_flat',variantId:'default',exerciseName:'Historical bench name',setNumber:i+1,weight,reps,date:'2026-01-01T12:00:00.000Z'}))
        .concat([{id:'phase0-variant',exerciseId:'leg_press',variantId:'high_feet',exerciseName:'Historical press',setNumber:1,weight:100,reps:10,date:'2026-01-01T12:00:00.000Z'}]) }];
    const plans = [{id:'phase0_synthetic',title:'Synthetic export verification',exercises:[{key:'bench_flat',variantId:'default',sets:3,target:'8-12'},{key:'leg_press',variantId:'high_feet',sets:1,target:'10-12'}]}];
    for (const [key,value] of Object.entries({gymverse_schema:4,gymverse_history:history,gymverse_plans:plans,gymverse_body:[{date:'2026-01-01',kg:80}],gymverse_rest:120,gymverse_bar:15})) localStorage.setItem(key,JSON.stringify(value));
  });
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="phase0_synthetic"]').click();
  await page.locator('#weight_0').fill('77,5');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await page.locator('.logo[data-view="view-plans"]').click();
  await page.locator('[data-act="export"]').first().click();
  await page.locator('#fileDeliveryPrompt').waitFor();
  page.on('dialog', d => d.accept());
  const downloading = page.waitForEvent('download');
  await page.locator('[data-act="deliverPreparedFile"]').click();
  const download = await downloading;
  const file = new URL('public-4fa087b-v5-synthetic.zip',dir);
  await download.saveAs(file.pathname.replace(/^\/(\w:)/,'$1'));
  const bytes = await fs.readFile(file);
  const source = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k=>k.startsWith('gymverse_')&&k!=='gymverse_last_backup').map(k=>[k,JSON.parse(localStorage.getItem(k))])));
  await fs.writeFile(new URL('public-4fa087b-source.json',dir),JSON.stringify(source,null,2)+'\n');
  const provenance = {synthetic:true,sourceUrl,sourceCommit:'4fa087b54446736ffeaf846a0da1d801d3c3e19a',captureDate:'2026-11-24',method:'Public UI export, second save click, real browser download; canShare=false selects supported fallback; fresh context',suggestedFilename:download.suggestedFilename(),file:'public-4fa087b-v5-synthetic.zip',sha256:sha256(bytes),bytes:bytes.length};
  await fs.writeFile(new URL('provenance.json',dir),JSON.stringify(provenance,null,2)+'\n');
  console.log(provenance);
} finally { await browser.close(); }
