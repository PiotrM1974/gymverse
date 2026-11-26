import { test, expect } from '@playwright/test';
import { seedMuscleMapWorkout } from './helpers/seed-musclemap-workout.js';

test.beforeEach(async ({ page }) => { await seedMuscleMapWorkout(page); });

test('highlight modes preserve mask geometry, colors, fallback and training storage', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  for (let i = 0; i < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); i++) await page.locator('#btnNextStep').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  await page.locator('#trainingAtlasDisclosure > summary').click();
  expect(await page.evaluate(() => typeof window.GymNastikaMuscleAtlas.setHighlightMode)).toBe('function');
  const initialStorage = await page.evaluate(() => Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]));
  const basePaths = await atlas.locator('svg [data-muscle-id]').evaluateAll(paths => paths.map(path => [path.dataset.muscleId, path.getAttribute('d')]));
  for (const [mode, blend] of [['original', 'normal'], ['texture-aware', 'multiply'], ['refined', 'color']]) {
    await page.evaluate(value => window.GymNastikaMuscleAtlas.setHighlightMode(value), mode);
    await expect(atlas.locator('.anatomy-atlas__figure-wrap')).toHaveAttribute('data-highlight-mode', mode);
    const properties = await atlas.evaluate(root => ({
      isolation: getComputedStyle(root.querySelector('.anatomy-atlas__figure-wrap')).isolation,
      blend: getComputedStyle(root.querySelector('.anatomy-atlas__muscle--primary')).mixBlendMode,
      primary: getComputedStyle(root.querySelector('.anatomy-atlas__muscle--primary')).fill,
      secondary: getComputedStyle(root.querySelector('.anatomy-atlas__muscle--secondary')).fill,
      active: [...root.querySelectorAll('.anatomy-atlas__muscle--primary,.anatomy-atlas__muscle--secondary')].map(path => path.getAttribute('d')),
      rolesInOrder: [...root.querySelectorAll('.anatomy-atlas__muscle')].map(path => path.classList.contains('anatomy-atlas__muscle--primary') ? 2 : path.classList.contains('anatomy-atlas__muscle--secondary') ? 1 : 0),
      tints: [...root.querySelectorAll('.anatomy-atlas__tint')].map(path => ({ d: path.getAttribute('d'), display: getComputedStyle(path).display, stroke: getComputedStyle(path).stroke }))
    }));
    expect(properties.blend).toBe(blend);
    expect(properties.primary).toBe('rgb(240, 68, 56)');
    expect(properties.secondary).toBe('rgb(243, 181, 68)');
    if (mode !== 'original') expect(properties.isolation).toBe('isolate');
    expect(properties.rolesInOrder).toEqual([...properties.rolesInOrder].sort((a, b) => a - b));
    expect(properties.tints.map(tint => tint.d)).toEqual(properties.active);
    expect(properties.tints.every(tint => tint.stroke === 'none')).toBe(true);
    expect(properties.tints.every(tint => mode === 'refined' ? tint.display !== 'none' : tint.display === 'none')).toBe(true);
    const paths = await atlas.locator('svg [data-muscle-id]').evaluateAll(items => items.map(path => [path.dataset.muscleId, path.getAttribute('d')]));
    expect(paths).toEqual(basePaths);
  }
  await atlas.locator('[data-atlas-sex="female"]').click();
  await atlas.locator('[data-atlas-view="back"]').click();
  await expect(atlas.locator('.anatomy-atlas__figure-wrap')).toHaveAttribute('data-highlight-mode', 'refined');
  expect(await page.evaluate(() => Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]))).toEqual(initialStorage);
});
