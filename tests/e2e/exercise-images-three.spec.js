import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const pilotUrl = '/gymverse/?local-exercise-presentation-pilot=1';
const visualDir = 'outputs/GV-EXERCISE-IMAGES-THREE/visual';
const steps = [
  { id: 'db_bench', variant: 'default' },
  { id: 'lat_pulldown_wide', variant: 'default' },
  { id: 'leg_press', variant: 'default' },
  { id: 'leg_press', variant: 'high_feet' }
];

async function useCurrentPilot(request) {
  const response = await request.post('/__pilot/release', { data: { release: 'pilot' } });
  expect(response.ok()).toBe(true);
}

async function installSyntheticPlan(page) {
  await page.goto(pilotUrl);
  await page.evaluate(exercises => {
    localStorage.clear();
    localStorage.setItem('gymverse_plans', JSON.stringify([{
      id: 'synthetic_three_images', title: 'Test trzech ilustracji',
      exercises: exercises.map(({ id, variant }) => ({ key: id, variantId: variant, sets: 1, target: '8-10' }))
    }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'three-image-profile', profiles: [{ id: 'three-image-profile', name: 'Test ilustracji', attributes: { age: 34, trainingGoal: 'fitness' }, data: {} }] }));
  }, steps);
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="synthetic_three_images"]').click();
  if (await page.locator('.exercise-hero > summary').count()) await page.locator('.exercise-hero > summary').click();
}

async function expectImage(page, id, sex, kind = 'technique') {
  const image = page.locator('#exercisePresentationImage');
  await expect(image).toHaveAttribute('src', new RegExp(`/GV-EXERCISE-IMAGES-THREE/selected/${kind}/${id}__default-${sex}\\.webp$`));
  await expect.poll(() => image.evaluate(node => [node.naturalWidth, node.naturalHeight])).toEqual(kind === 'technique' ? [768, 512] : [256, 256]);
}

test('current workout card uses six new two-panel illustrations and the shared leg press variant', async ({ page, request }) => {
  await useCurrentPilot(request);
  await mkdir(visualDir, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await installSyntheticPlan(page);
  for (let step = 0; step < steps.length; step += 1) {
    const { id, variant } = steps[step];
    await expect(page.locator('#exercisePresentation')).toBeVisible();
    await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', id);
    await expect(page.locator('#trainingAtlasDisclosure')).toHaveJSProperty('open', false);
    await page.locator('#weight_0').fill('42.5');
    await page.locator('#reps_0').fill('8');
    for (const sex of ['male', 'female']) {
      await page.locator(`#exercisePresentation [data-presentation-sex="${sex}"]`).click();
      await expectImage(page, id, sex);
      await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
      await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
      await expect(page.locator('#weight_0')).toHaveValue('42.5');
      await expect(page.locator('#reps_0')).toHaveValue('8');
    }
    await page.locator('#trainingAtlasDisclosure > summary').click();
    await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', variant === 'high_feet' ? 'leg_press/high_feet' : id);
    await expect(page.locator('#anatomyAtlas [data-atlas-sex]')).toHaveCount(0);
    await page.locator('#trainingAtlasDisclosure > summary').click();
    if (variant === 'high_feet') {
      await expect(page.locator('#currentExVariant')).toContainText('Stopy wyżej');
      await expect(page.locator('#variantImageShared')).toHaveText('Ilustracja wariantu podstawowego');
      await expect(page.locator('#legacyExerciseImageBox')).toBeHidden();
      await expect(page.locator('#legacyImageControls')).toBeHidden();
    }
    if (step === 0 || step === 1 || step === 3) {
      const name = `${id}${variant === 'high_feet' ? '-high-feet' : ''}`;
      await page.locator('#reps_0').focus();
      await page.screenshot({ path: `${visualDir}/${name}-card-390-viewport.png`, fullPage: false });
      await page.locator('#reps_0').evaluate(node => node.blur());
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({ path: `${visualDir}/${name}-card-390.png`, fullPage: true });
    }
    for (const width of [375, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    if (step < steps.length - 1) await page.locator('#btnNextStep').click();
  }
  const active = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')));
  expect(active?.sets || []).toHaveLength(0);
});

test('new candidate boards and thumbnails load after an offline restart', async ({ page, request }) => {
  await useCurrentPilot(request);
  await page.goto(pilotUrl);
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration('/gymverse/'))?.active?.scriptURL || '')).toContain('local-exercise-presentation-pilot=1');
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('local-exercise-presentation-pilot=1');
  await expect.poll(() => page.evaluate(async () => {
    const cache = await caches.open('gymverse-v36-presentation-pilot');
    return (await cache.keys()).filter(request => request.url.includes('GV-EXERCISE-IMAGES-THREE')).length;
  })).toBe(12);
  await page.context().setOffline(true);
  await page.goto(pilotUrl);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'offline_three', title: 'Offline', exercises: [
      { key: 'db_bench', sets: 1, target: '8' },
      { key: 'lat_pulldown_wide', sets: 1, target: '8' },
      { key: 'leg_press', variantId: 'high_feet', sets: 1, target: '8' }
    ] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'three-image-profile', profiles: [{ id: 'three-image-profile', name: 'Test ilustracji', attributes: { age: 34, trainingGoal: 'fitness' }, data: {} }] }));
  });
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="offline_three"]').click();
  if (await page.locator('.exercise-hero > summary').count()) await page.locator('.exercise-hero > summary').click();
  for (const [index, id] of ['db_bench', 'lat_pulldown_wide', 'leg_press'].entries()) {
    await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();
    await expectImage(page, id, 'female');
    await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
    await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
    if (index < 2) await page.locator('#btnNextStep').click();
  }
  await page.context().setOffline(false);
});
