import { test, expect } from '@playwright/test';

test('the high-feet plan entry carries its variant to the training atlas', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'push_a2', title: 'Push A2', exercises: [
      { key: 'db_bench', sets: 2, target: '8-12' }, { key: 'db_fly', sets: 2, target: '8-12' },
      { key: 'front_raise', sets: 2, target: '8-12' }, { key: 'lat_raise_seated', sets: 2, target: '8-12' },
      { key: 'tri_machine', sets: 2, target: '8-12' }, { key: 'leg_press', variantId: 'high_feet', sets: 2, target: '8-12' }
    ] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'atlas-profile', profiles: [{ id: 'atlas-profile', name: 'Atlas test', attributes: { trainingGoal: 'fitness' }, data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [] } }] }));
  });
  await page.reload();
  await expect(page.locator('[data-act="startPlan"][data-plan="push_a2"]')).toBeVisible();
  await page.locator('[data-act="startPlan"][data-plan="push_a2"]').click();
  for (let step = 0; step < 5; step += 1) await page.locator('#btnNextStep').click();
  await page.locator('.exercise-hero > summary').click();

  const result = await page.evaluate(async () => {
    const { EXERCISE_ATLAS_MAP } = await import('/src/data/anatomy/atlas-data.js');
    const active = JSON.parse(localStorage.getItem('gymverse_active'));
    const atlas = document.querySelector('#anatomyAtlas');
    return {
      activePlanId: active.planId,
      activeStep: active.step,
      activeExerciseId: active.swaps?.[active.step] || 'leg_press',
      activeVariantId: active.exercises[active.step].variantId,
      activeExerciseName: document.querySelector('#currentExName').textContent.trim(),
      imagePath: new URL(document.querySelector('#exercisePresentationImage').currentSrc).pathname,
      sharedImageCaption: document.querySelector('#variantImageShared').textContent.trim(),
      atlasExerciseId: atlas.dataset.exerciseId,
      atlasTitle: atlas.querySelector('.anatomy-atlas').getAttribute('aria-label'),
      baseMapExists: Object.hasOwn(EXERCISE_ATLAS_MAP, 'leg_press'),
      variantMapId: 'leg_press/high_feet',
      variantMapExists: Object.hasOwn(EXERCISE_ATLAS_MAP, 'leg_press/high_feet')
    };
  });

  expect(result.activeExerciseId).toBe('leg_press');
  expect(result.activePlanId).toBe('push_a2');
  expect(result.activeStep).toBe(5);
  expect(result.activeVariantId).toBe('high_feet');
  expect(result.activeExerciseName).toBe('Leg Press');
  expect(result.imagePath).toBe('/src/data/exercise-images/selected/technique/leg_press__default-male.webp');
  expect(result.sharedImageCaption).toBe('Ilustracja wariantu podstawowego');
  expect(result.atlasExerciseId).toBe('leg_press/high_feet');
  expect(result.atlasTitle).toContain('Leg Press — High Foot Placement');
  expect(result.baseMapExists).toBe(true);
  expect(result.variantMapId).toBe('leg_press/high_feet');
  expect(result.variantMapExists).toBe(true);

  await page.locator('#trainingAtlasDisclosure > summary').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  const snapshot = () => atlas.evaluate(root => ({
    muscles: [...root.querySelectorAll('.anatomy-atlas__muscle[data-muscle-id]')].map(node => ({
      id: node.dataset.muscleId, role: node.classList.contains('anatomy-atlas__muscle--primary') ? 'primary' : node.classList.contains('anatomy-atlas__muscle--secondary') ? 'secondary' : 'neutral',
      approximate: node.classList.contains('anatomy-atlas__muscle--approximate'), geometry: node.getAttribute('d')
    })),
    legend: [...root.querySelectorAll('.anatomy-atlas__region')].map(node => ({ text: node.textContent.trim(), className: node.className })),
    colors: {
      primary: root.querySelector('.anatomy-atlas__muscle--primary') ? getComputedStyle(root.querySelector('.anatomy-atlas__muscle--primary')).fill : null,
      secondary: root.querySelector('.anatomy-atlas__muscle--secondary') ? getComputedStyle(root.querySelector('.anatomy-atlas__muscle--secondary')).fill : null
    }
  }));
  for (const sex of ['male', 'female']) for (const view of ['front', 'back']) {
    await atlas.locator(`[data-atlas-sex="${sex}"]`).click();
    await atlas.locator(`[data-atlas-view="${view}"]`).click();
    const variant = await snapshot();
    await page.evaluate(selectedSex => window.GymNastikaMuscleAtlas.update('leg_press', { sex: selectedSex, showDisclosure: false }), sex);
    const base = await snapshot();
    expect(variant).toEqual(base);
    if (variant.colors.primary) expect(variant.colors.primary).toBe('rgb(240, 68, 56)');
    if (variant.colors.secondary) expect(variant.colors.secondary).toBe('rgb(243, 181, 68)');
    if (sex === 'female' && view === 'front') {
      expect(variant.muscles.filter(muscle => muscle.id.startsWith('ADDUCTOR_')).every(muscle => muscle.role === 'neutral')).toBe(true);
      expect(variant.legend.some(region => region.text.includes('Przywodziciele') && region.text.includes('Niepewne w tym widoku'))).toBe(true);
    }
    await page.evaluate(selectedSex => window.GymNastikaMuscleAtlas.update('leg_press/high_feet', { sex: selectedSex, showDisclosure: false }), sex);
    await expect(atlas).toHaveAttribute('data-exercise-id', 'leg_press/high_feet');
  }
  await atlas.locator('.anatomy-atlas__details summary').click();
  await expect(atlas.locator('.anatomy-atlas__note').first()).toContainText('Mapa wspólna z wariantem podstawowym. Ustawienie stóp może zmieniać udział poszczególnych mięśni');
  await expect(page.locator('#variantImageShared')).toBeVisible();
  await expect.poll(() => page.locator('#exercisePresentationImage').evaluate(image => image.naturalWidth)).toBe(768);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')).exercises.at(-1).variantId)).toBe('high_feet');
});
