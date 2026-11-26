import { test, expect } from '@playwright/test';
import { EXERCISE_ATLAS_MAP } from '../../src/data/anatomy/atlas-data.js';
import { MALE_FRONT, MALE_BACK, FEMALE_FRONT, FEMALE_BACK } from '../../src/data/anatomy/musclemap-diagrams.js';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { seedMuscleMapWorkout } from './helpers/seed-musclemap-workout.js';

const diagrams = { male: { front: MALE_FRONT, back: MALE_BACK }, female: { front: FEMALE_FRONT, back: FEMALE_BACK } };

test.beforeEach(async ({ page }) => { await seedMuscleMapWorkout(page); });

test('source shoulder surfaces match rendered paths and measure their footprint', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  for (let step = 0; step < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); step += 1) await page.locator('#btnNextStep').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  const measurements = [];
  for (const sex of ['male', 'female']) for (const view of ['front', 'back']) {
    await atlas.locator(`[data-atlas-sex="${sex}"]`).click();
    await atlas.locator(`[data-atlas-view="${view}"]`).click();
    for (const id of ['SHOULDER_SIDE_LEFT', 'SHOULDER_SIDE_RIGHT', 'SHOULDER_FRONT_LEFT', 'SHOULDER_FRONT_RIGHT']) {
      const source = diagrams[sex][view].muscles.filter(path => path.id === id);
      const rendered = await atlas.locator(`[data-muscle-id="${id}"]`).evaluateAll(paths => paths.map(path => path.getAttribute('d')));
      expect(rendered).toEqual(source.map(path => path.d));
      if (!source.length) continue;
      const footprint = await atlas.locator(`[data-muscle-id="${id}"]`).first().evaluate(path => {
        const box = path.getBBox();
        let inside = 0;
        const samples = 30;
        for (let y = 0; y < samples; y++) for (let x = 0; x < samples; x++) {
          const point = path.ownerSVGElement.createSVGPoint();
          point.x = box.x + (x + .5) * box.width / samples;
          point.y = box.y + (y + .5) * box.height / samples;
          if (path.isPointInFill(point)) inside++;
        }
        return { box: { x: box.x, y: box.y, width: box.width, height: box.height }, fillRatio: inside / (samples * samples), approxArea: inside / (samples * samples) * box.width * box.height };
      });
      measurements.push({ sex, view, id, ...footprint });
    }
  }
  const output = resolve(process.cwd(), 'outputs/GV-MUSCLEMAP-HIGHLIGHT-ENGINE/anatomy-regression');
  mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, 'shoulder-path-measurements.json'), JSON.stringify(measurements, null, 2));
  const legPaths = [];
  for (const sex of ['male', 'female']) for (const view of ['front', 'back']) {
    await atlas.locator(`[data-atlas-sex="${sex}"]`).click();
    await atlas.locator(`[data-atlas-view="${view}"]`).click();
    await page.evaluate(() => window.GymNastikaMuscleAtlas.update('leg_press'));
    for (const id of ['QUADRICEPS_LEFT', 'QUADRICEPS_RIGHT', 'ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT', 'ABDUCTOR_LEFT', 'ABDUCTOR_RIGHT']) {
      const boxes = await atlas.locator(`[data-muscle-id="${id}"]`).evaluateAll(paths => paths.map(path => {
        const b = path.getBBox();
        return { x: b.x, y: b.y, width: b.width, height: b.height, fill: getComputedStyle(path).fill };
      }));
      expect(boxes).toHaveLength(diagrams[sex][view].muscles.filter(path => path.id === id).length);
      legPaths.push({ sex, view, id, boxes });
    }
  }
  writeFileSync(resolve(output, 'leg-press-source-regions.json'), JSON.stringify(legPaths, null, 2));
});

test('four mappings describe actual visible surfaces in every view and keep precision in details', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  for (let step = 0; step < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); step += 1) await page.locator('#btnNextStep').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  await expect(atlas).toBeVisible();
  const initialStorage = await page.evaluate(() => Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]));

  for (const [exerciseId, mapping] of Object.entries(EXERCISE_ATLAS_MAP)) {
    await page.evaluate(id => window.GymNastikaMuscleAtlas.update(id), exerciseId);
    const displayName = await page.evaluate(id => window.GymNastikaExerciseNames?.[id], exerciseId);
    await expect(atlas.locator('.anatomy-atlas')).toHaveAttribute('aria-label', `Atlas mięśni — ${displayName || mapping.title}`);
    await expect(atlas.locator('.anatomy-atlas__details')).not.toHaveAttribute('open');
    for (const sex of ['male', 'female']) for (const view of ['front', 'back']) {
      const sexButton = atlas.locator(`[data-atlas-sex="${sex}"]`);
      if (await sexButton.getAttribute('aria-pressed') !== 'true') await sexButton.click();
      await expect(sexButton).toHaveAttribute('aria-pressed', 'true');
      await atlas.locator('.anatomy-atlas__body').evaluate(image => image.decode());
      const viewButton = atlas.locator(`[data-atlas-view="${view}"]`);
      if (await viewButton.getAttribute('aria-pressed') !== 'true') await viewButton.click();
      await expect(viewButton).toHaveAttribute('aria-pressed', 'true');
      await atlas.locator('.anatomy-atlas__body').evaluate(image => image.decode());
      const source = diagrams[sex][view].muscles;
      const expectedPrimary = source.filter(path => mapping.primary.includes(path.id)).map(path => path.id).sort();
      const excluded = [
        ...(mapping.excludedByView?.[`${sex}-${view}`] || []),
        ...(sex === 'female' && view === 'front' ? ['ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT'] : [])
      ];
      const expectedSecondary = source.filter(path => mapping.secondary.includes(path.id) && !excluded.includes(path.id)).map(path => path.id).sort();
      const actual = await atlas.evaluate(root => ({
        primary: [...root.querySelectorAll('.anatomy-atlas__muscle--primary')].map(el => el.dataset.muscleId).sort(),
        secondary: [...root.querySelectorAll('.anatomy-atlas__muscle--secondary')].map(el => el.dataset.muscleId).sort()
      }));
      expect(actual.primary, `${exerciseId} ${sex} ${view} primary`).toEqual(expectedPrimary);
      expect(actual.secondary, `${exerciseId} ${sex} ${view} secondary`).toEqual(expectedSecondary);
      for (const region of mapping.regions) {
        const item = atlas.locator('.anatomy-atlas__region').filter({ hasText: region.label });
        const visible = region.ids.some(id => source.some(path => path.id === id));
        if (region.ids.some(id => excluded.includes(id))) await expect(item).toContainText('Niepewne w tym widoku');
        else if (!visible && region.precision !== 'unavailable') await expect(item).toContainText(view === 'front' ? 'Zobacz tył' : 'Zobacz przód');
        if (region.precision === 'unavailable') await expect(item).toContainText('Bez oznaczenia');
      }
    }
  }
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update('leg_press'));
  await atlas.locator('[data-atlas-sex="female"]').click();
  await atlas.locator('[data-atlas-view="front"]').click();
  await atlas.locator('.anatomy-atlas__details summary').click();
  await expect(atlas.locator('.anatomy-atlas__precision li').filter({ hasText: 'Przywodziciele' })).toContainText('niezweryfikowane');
  expect(await page.evaluate(() => Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]))).toEqual(initialStorage);
});

test('capture four exercise views and real before-after comparison', async ({ page }) => {
  test.setTimeout(90000);
  const output = resolve(process.cwd(), 'outputs/GV-MUSCLEMAP-HIGHLIGHT-ENGINE/anatomy-regression');
  const before = resolve(output, 'before');
  const after = resolve(output, 'after');
  mkdirSync(before, { recursive: true });
  mkdirSync(after, { recursive: true });
  await page.setViewportSize({ width: 390, height: 2400 });
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  for (let step = 0; step < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); step += 1) await page.locator('#btnNextStep').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  const cases = [
    { id: 'lat_raise_stand', sex: 'male', view: 'front' },
    { id: 'db_bench', sex: 'female', view: 'front' },
    { id: 'lat_pulldown_wide', sex: 'male', view: 'back' },
    { id: 'leg_press', sex: 'female', view: 'front' }
  ];
  const rows = [];
  for (const item of cases) {
    const filename = `exercise-${item.id}.png`;
    if (!existsSync(resolve(before, filename))) copyFileSync(resolve(process.cwd(), 'tests/fixtures/musclemap-anatomy-review/before', filename), resolve(before, filename));
    await atlas.locator(`[data-atlas-sex="${item.sex}"]`).click();
    await atlas.locator(`[data-atlas-view="${item.view}"]`).click();
    await page.evaluate(id => window.GymNastikaMuscleAtlas.update(id), item.id);
    await atlas.locator('img.anatomy-atlas__body').evaluate(image => image.decode());
    await atlas.screenshot({ path: resolve(after, filename) });
    rows.push({ ...item, before: readFileSync(resolve(before, filename)).toString('base64'), after: readFileSync(resolve(after, filename)).toString('base64') });
  }
  const board = await page.context().newPage();
  await board.setViewportSize({ width: 900, height: 1200 });
  await board.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:18px;background:#e9edf0;font:15px Arial,sans-serif;color:#24323c}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cell{background:white;padding:10px;border-radius:12px}.cell img{display:block;width:100%;height:auto}.cell h2{font-size:16px;margin:0 0 8px}</style><main class="grid">${rows.map(row => `<section class="cell"><h2>${row.id} — przed</h2><img src="data:image/png;base64,${row.before}"></section><section class="cell"><h2>${row.id} — po</h2><img src="data:image/png;base64,${row.after}"></section>`).join('')}</main>`);
  await board.screenshot({ path: resolve(output, 'comparison-before-after.png'), fullPage: true });
  await board.close();
});
