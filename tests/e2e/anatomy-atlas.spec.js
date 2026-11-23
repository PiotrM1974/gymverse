import { test, expect } from '@playwright/test';

test('renders the exercise atlas and switches sex and view without touching workout data', async ({ page }) => {
  await page.goto('/');
  const stylesheet = await page.request.get('/src/features/anatomy/atlas.css');
  expect(stylesheet.ok()).toBeTruthy();
  expect(stylesheet.headers()['content-type']).toContain('text/css');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  for (let step = 0; step < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); step += 1) {
    await page.locator('#btnNextStep').click();
  }

  const atlas = page.locator('#anatomyAtlas');
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await expect(atlas).toBeVisible();
  await expect(atlas.locator('.anatomy-atlas__muscle--primary')).toHaveCount(2);
  await expect(atlas.locator('.anatomy-atlas__muscle--secondary')).toHaveCount(4);
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();
  await expect(atlas.locator('.anatomy-atlas__figure-wrap')).toHaveAttribute('aria-label', 'Żeńska sylwetka, widok z przodu');
  await atlas.getByRole('button', { name: 'Tył' }).click();
  await expect(atlas.locator('.anatomy-atlas__figure-wrap')).toHaveAttribute('aria-label', 'Żeńska sylwetka, widok z tyłu');
  await expect(atlas.locator('img.anatomy-atlas__body')).toHaveJSProperty('naturalWidth', 1024);
  await expect(atlas.locator('img.anatomy-atlas__body')).toHaveJSProperty('naturalHeight', 1536);
  await expect(atlas.locator('.anatomy-atlas__details')).not.toHaveAttribute('open');
  await atlas.locator('.anatomy-atlas__details summary').click();
  await expect(atlas.locator('.anatomy-atlas__precision')).toBeVisible();
  expect(await atlas.locator('svg [id]').count()).toBe(0);

  for (const [exerciseId, view] of [['db_bench', 'front'], ['lat_pulldown_wide', 'back'], ['leg_press', 'front']]) {
    await atlas.locator(`[data-atlas-view="${view}"]`).click();
    await page.evaluate(id => window.GymNastikaMuscleAtlas.update(id), exerciseId);
    await expect(atlas.locator('.anatomy-atlas__muscle--primary').first()).toBeVisible();
  }
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update('leg_press', { showSexControl: true, showDisclosure: false }));
  await atlas.locator('[data-atlas-sex="male"]').click();
  await atlas.locator('[data-atlas-view="front"]').click();
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update('leg_press', { showSexControl: true, showDisclosure: false }));
  await expect(atlas.locator('svg [data-muscle-group="QUADS"]')).toHaveCount(2);
  await expect(atlas.locator('svg [data-muscle-group="QUADS"].anatomy-atlas__muscle--neutral')).toHaveCount(2);
  await expect(atlas.locator('svg [data-muscle-id="undefined"]')).toHaveCount(0);
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update('bench_flat'));
  await expect(atlas).toBeVisible();
  await expect(atlas.locator('.anatomy-atlas')).toHaveAttribute('aria-label', /Barbell Bench Press/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]'))).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active') || 'null')?.sets || [])).toEqual([]);
});
