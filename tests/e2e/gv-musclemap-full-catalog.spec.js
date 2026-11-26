import { test, expect } from '@playwright/test';
import { seedMuscleMapWorkout } from './helpers/seed-musclemap-workout.js';

test.beforeEach(async ({ page }) => { await seedMuscleMapWorkout(page); });

test('all 31 exercises and 4 variants render only catalog-approved surfaces in all four views', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update('bench_flat', { showSexControl: true, showDisclosure: false }));
  await page.locator('.anatomy-atlas__details summary').click();
  const precision = page.locator('.anatomy-atlas__precision');
  await expect(precision).toContainText('CHEST nie wydziela granicy mięśnia piersiowego większego.');
  await expect(precision.locator('li').filter({ hasText: 'piersiowy większy' })).toContainText('powierzchnia: CHEST_LEFT, CHEST_RIGHT');
  const keys = await page.evaluate(async () => {
    const [{ EXERCISE_ATLAS_MAP }, { MUSCLEMAP_DIAGRAMS }] = await Promise.all([
      import('/src/data/anatomy/atlas-data.js'), import('/src/data/anatomy/musclemap-diagrams.js')
    ]);
    return { exercises: Object.keys(EXERCISE_ATLAS_MAP), diagrams: MUSCLEMAP_DIAGRAMS.map(d => ({ id: d.id, ids: d.muscles.map(p => p.id).filter(Boolean) })) };
  });
  expect(keys.exercises).toHaveLength(35);
  const diagramById = new Map(keys.diagrams.map(d => [d.id, d.ids]));
  for (const id of keys.exercises) {
    await page.evaluate(id => window.GymNastikaMuscleAtlas.update(id), id);
    await expect(page.locator('#anatomyAtlas')).toBeVisible();
    for (const [sex, view] of [['male', 'front'], ['male', 'back'], ['female', 'front'], ['female', 'back']]) {
      await page.locator(`[data-atlas-sex="${sex}"]`).click();
      await page.locator(`[data-atlas-view="${view}"]`).click();
      const diagramId = `${sex}-${view}`;
      const rendered = await page.locator('#anatomyAtlas .anatomy-atlas__muscle:not(.anatomy-atlas__muscle--neutral)').evaluateAll(paths => paths.map(p => p.dataset.muscleId));
      for (const surface of rendered) expect(diagramById.get(diagramId), `${id} ${diagramId} ${surface}`).toContain(surface);
      await expect(page.locator('#anatomyAtlas .anatomy-atlas__figure-wrap')).toHaveAttribute('data-highlight-mode', 'refined');
    }
  }
  await page.evaluate(id => window.GymNastikaMuscleAtlas.update(id), 'smith_squat');
  await page.locator('[data-atlas-sex="female"]').click();
  await page.locator('[data-atlas-view="front"]').click();
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__muscle--secondary[data-muscle-id^="ADDUCTOR_"]')).toHaveCount(0);
  await page.locator('.anatomy-atlas__details summary').click();
  await expect(page.locator('.anatomy-atlas__precision')).toContainText('niezweryfikowane');
});
