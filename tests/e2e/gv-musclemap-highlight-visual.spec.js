import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { seedMuscleMapWorkout } from './helpers/seed-musclemap-workout.js';

const output = resolve(process.cwd(), 'outputs/GV-MUSCLEMAP-HIGHLIGHT-ENGINE');
test.beforeEach(async ({ page }) => { await seedMuscleMapWorkout(page); });

test('capture A/B/C, four bodies, shoulders and mobile widths from the local app', async ({ page }) => {
  test.setTimeout(120000);
  const visual = resolve(output, 'visual');
  mkdirSync(visual, { recursive: true });
  await page.setViewportSize({ width: 430, height: 1800 });
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  for (let i = 0; i < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); i++) await page.locator('#btnNextStep').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  const cases = [
    { sex: 'male', view: 'front', exercise: 'lat_raise_stand' },
    { sex: 'male', view: 'back', exercise: 'lat_pulldown_wide' },
    { sex: 'female', view: 'front', exercise: 'db_bench' },
    { sex: 'female', view: 'back', exercise: 'lat_raise_stand' }
  ];
  const modes = [
    { id: 'A-original', value: 'original' },
    { id: 'B-texture-aware', value: 'texture-aware' },
    { id: 'C-refined', value: 'refined' }
  ];
  const rows = [];
  const measurements = [];
  for (const item of cases) {
    await atlas.locator(`[data-atlas-sex="${item.sex}"]`).click();
    await atlas.locator(`[data-atlas-view="${item.view}"]`).click();
    await page.evaluate(id => window.GymNastikaMuscleAtlas.update(id), item.exercise);
    await atlas.locator('img.anatomy-atlas__body').evaluate(image => image.decode());
    for (const mode of modes) {
      await page.evaluate(value => window.GymNastikaMuscleAtlas.setHighlightMode(value), mode.value);
      const figure = atlas.locator('.anatomy-atlas__figure-wrap');
      const filename = `${item.sex}-${item.view}-${mode.id}.png`;
      const path = resolve(visual, filename);
      await figure.screenshot({ path });
      const geometry = await figure.evaluate(root => {
        const image = root.querySelector('img').getBoundingClientRect();
        const svg = root.querySelector('svg').getBoundingClientRect();
        return { width: image.width, height: image.height, delta: Math.max(Math.abs(image.x-svg.x),Math.abs(image.y-svg.y),Math.abs(image.width-svg.width),Math.abs(image.height-svg.height)) };
      });
      expect(geometry.delta).toBeLessThan(.1);
      rows.push({ ...item, mode: mode.id, path, base64: readFileSync(path).toString('base64') });
      measurements.push({ ...item, mode: mode.id, ...geometry });
    }
  }
  const board = await page.context().newPage();
  await board.setViewportSize({ width: 1300, height: 900 });
  await board.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#e8edf0;font:15px Arial;color:#17232d}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.cell{background:#fff;padding:9px;border-radius:10px}.cell h2{font-size:15px;margin:0 0 8px}.cell img{width:100%;display:block}</style><main class="grid">${rows.map(row => `<div class="cell"><h2>${row.sex} · ${row.view} · ${row.mode}</h2><img src="data:image/png;base64,${row.base64}"></div>`).join('')}</main>`);
  await board.screenshot({ path: resolve(output, 'comparison-A-B-C.png'), fullPage: true });
  await board.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#e8edf0;font:15px Arial;color:#17232d}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.cell{background:white;padding:9px;border-radius:10px}.cell h2{font-size:15px;margin:0 0 8px}.cell img{width:100%;display:block}</style><main class="grid">${rows.filter(row=>row.mode==='C-refined').map(row => `<div class="cell"><h2>${row.sex} · ${row.view}</h2><img src="data:image/png;base64,${row.base64}"></div>`).join('')}</main>`);
  await board.screenshot({ path: resolve(output, 'four-silhouettes-refined.png'), fullPage: true });
  await board.close();

  // Browser screenshot clipping magnifies only the existing image and paths.
  await page.setViewportSize({ width: 1100, height: 1800 });
  for (const sex of ['male', 'female']) for (const view of ['front', 'back']) {
    await atlas.locator(`[data-atlas-sex="${sex}"]`).click();
    await atlas.locator(`[data-atlas-view="${view}"]`).click();
    await page.evaluate(() => window.GymNastikaMuscleAtlas.update('lat_raise_stand'));
    await page.evaluate(() => window.GymNastikaMuscleAtlas.setHighlightMode('refined'));
    const figure = atlas.locator('.anatomy-atlas__figure-wrap');
    await figure.evaluate(root => { root.style.width = '768px'; root.style.maxWidth = 'none'; });
    await figure.scrollIntoViewIfNeeded();
    const box = await figure.boundingBox();
    const clip = { x: box.x + box.width * .22, y: box.y + box.height * .145, width: box.width * .56, height: box.height * .18 };
    await page.screenshot({ path: resolve(visual, `shoulders-${sex}-${view}.png`), clip });
  }

  const mobile = [];
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 2200 });
    await atlas.locator('[data-atlas-sex="male"]').click();
    await atlas.locator('[data-atlas-view="front"]').click();
    await page.evaluate(() => window.GymNastikaMuscleAtlas.update('lat_raise_stand'));
    await page.evaluate(() => window.GymNastikaMuscleAtlas.setHighlightMode('refined'));
    await atlas.locator('img.anatomy-atlas__body').evaluate(image => image.decode());
    await atlas.screenshot({ path: resolve(visual, `mobile-${width}.png`) });
    mobile.push(await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth })));
  }
  expect(mobile.every(item => item.viewport === item.document)).toBe(true);
  writeFileSync(resolve(output, 'visual-layout-results.json'), JSON.stringify({ measurements, mobile }, null, 2));
});
