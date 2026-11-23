import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const appUrl = '/gymverse/';
const ids = ['bench_flat', 'db_incline', 'tri_rope', 'row_v', 'rear_delt', 'biceps_preacher', 'tri_machine', 'leg_curl', 'lat_pulldown_neutral', 'row_straight', 'db_fly', 'front_raise', 'lat_raise_seated', 'chest_machine', 'pec_deck', 'shoulder_press', 'face_pull', 'lat_raise_cable', 'hammer_curl', 'cable_curl', 'tri_overhead', 'row_machine', 'leg_extension', 'smith_squat', 'pullup', 'dips', 'pushup', 'lat_raise_stand', 'db_bench', 'lat_pulldown_wide', 'leg_press'];

async function installPlan(page) {
  await page.goto(appUrl);
  await page.evaluate(exercises => {
    localStorage.clear();
    localStorage.setItem('gymverse_plans', JSON.stringify([{
      id: 'new_images_synthetic', title: 'Syntetyczne ćwiczenia',
      exercises: exercises.map(key => ({ key, sets: 1, target: '8-10' }))
    }]));
  }, ids);
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="new_images_synthetic"]').click();
}

test('released boards, thumbnails, labels and input state appear in ordinary workout cards without the pilot flag', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installPlan(page);
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', id);
    await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', id);
    await expect(page.locator('#trainingAtlasDisclosure')).toHaveJSProperty('open', false);
    await page.locator('#weight_0').fill('42.5');
    await page.locator('#reps_0').fill('8');
    for (const sex of ['male', 'female']) {
      await page.locator(`#exercisePresentation [data-presentation-sex="${sex}"]`).click();
      await expect(page.locator('#anatomyAtlas .anatomy-atlas__figure-wrap')).toHaveAttribute('aria-label', new RegExp(sex === 'male' ? 'Męska' : 'Żeńska'));
      const technique = page.locator('#exercisePresentationImage');
      await expect(technique).toHaveAttribute('src', new RegExp(`/src/data/exercise-images/selected/technique/${id}__default-${sex}\\.webp$`));
      await expect.poll(() => technique.evaluate(image => [image.naturalWidth, image.naturalHeight])).toEqual([768, 512]);
      for (const position of ['lower', 'raised']) {
        await page.locator(`#exercisePresentation [data-presentation-position="${position}"]`).click();
        await expect(page.locator('#exercisePresentationFigure')).toHaveAttribute('data-position', position);
        if (id === 'tri_rope') {
          const screenshotDir = resolve('outputs/GV-EXERCISE-IMAGES-COMPLETE/screenshots');
          await mkdir(screenshotDir, { recursive: true });
          await page.locator('#exercisePresentation').screenshot({ path: resolve(screenshotDir, `tri_rope-${sex}-${position}-390.png`) });
        }
      }
      if (id === 'row_v') {
        await expect(page.locator('[data-presentation-position="lower"]')).toHaveText('ODDALONE');
        await expect(page.locator('[data-presentation-position="raised"]')).toHaveText('PRZY BRZUCHU');
      }
      await page.locator('#exercisePresentation [data-presentation-mode="thumbnail"]').click();
      await expect(technique).toHaveAttribute('src', new RegExp(`/src/data/exercise-images/selected/thumbnails/${id}__default-${sex}\\.webp$`));
      await expect.poll(() => technique.evaluate(image => [image.naturalWidth, image.naturalHeight])).toEqual([256, 256]);
      await page.locator('#exercisePresentation [data-presentation-mode="technique"]').click();
      await expect(page.locator('#weight_0')).toHaveValue('42.5');
      await expect(page.locator('#reps_0')).toHaveValue('8');
    }
    if (index < ids.length - 1) await page.locator('#btnNextStep').click();
  }
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('production images install into the ordinary offline cache and survive an offline restart', async ({ page }) => {
  await page.goto(appUrl);
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistration('/gymverse/'))?.active?.scriptURL || '')).toMatch(/\/gymverse\/sw\.js$/);
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toMatch(/\/gymverse\/sw\.js$/);
  await expect.poll(() => page.evaluate(async () => {
    const cache = await caches.open('gymverse-v17');
    return (await cache.keys()).filter(request => request.url.includes('/src/data/exercise-images/selected/')).length;
  })).toBe(136);
  await page.context().setOffline(true);
  await installPlan(page);
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', id);
    for (const sex of ['male', 'female']) {
      await page.locator(`#exercisePresentation [data-presentation-sex="${sex}"]`).click();
      await expect.poll(() => page.locator('#exercisePresentationImage').evaluate(image => image.naturalWidth)).toBe(768);
    }
    if (index < ids.length - 1) await page.locator('#btnNextStep').click();
  }
  await page.context().setOffline(false);
});

test('incline fly variant uses its own board without losing variant identity or set input', async ({ page, request }) => {
  await page.goto(appUrl);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_plans', JSON.stringify([{
      id: 'incline_fly_synthetic', title: 'Syntetyczny wariant',
      exercises: [{ key: 'db_fly', variantId: 'incline', sets: 1, target: '8-10' }]
    }]));
  });
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="incline_fly_synthetic"]').click();
  await expect(page.locator('#currentExVariant')).toContainText('skos');
  await page.locator('#weight_0').fill('42.5');
  await page.locator('#reps_0').fill('8');
  for (const sex of ['male', 'female']) {
    await page.locator(`#exercisePresentation [data-presentation-sex="${sex}"]`).click();
    await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', new RegExp(`/db_fly__incline-${sex}\\.webp$`));
    await page.locator('[data-presentation-position="raised"]').click();
    await page.locator('[data-presentation-mode="thumbnail"]').click();
    await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', new RegExp(`/db_fly__incline-${sex}\\.webp$`));
    await page.locator('[data-presentation-mode="technique"]').click();
    await expect(page.locator('#weight_0')).toHaveValue('42.5');
    await expect(page.locator('#reps_0')).toHaveValue('8');
  }
  await expect(page.locator('#trainingAtlasDisclosure')).toHaveJSProperty('open', false);
});

test('corrected machines and distinct variants render in the workout card', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(appUrl);
  const exercises = [
    { key: 'biceps_preacher' },
    { key: 'tri_machine' },
    { key: 'leg_curl' },
    { key: 'row_machine' },
    { key: 'shoulder_press', variantId: 'dumbbells' },
    { key: 'tri_overhead', variantId: 'rope' },
    { key: 'leg_press', variantId: 'high_feet' }
  ];
  await page.evaluate(items => {
    localStorage.clear();
    localStorage.setItem('gymverse_plans', JSON.stringify([{
      id: 'machine_review_synthetic', title: 'Syntetyczna kontrola maszyn',
      exercises: items.map(item => ({ ...item, sets: 1, target: '8-10' }))
    }]));
  }, exercises);
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="machine_review_synthetic"]').click();
  const screenshotDir = resolve('outputs/GV-EXERCISE-IMAGES-COMPLETE/screenshots');
  await mkdir(screenshotDir, { recursive: true });
  for (let index = 0; index < exercises.length; index += 1) {
    const { key, variantId } = exercises[index];
    await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', key);
    if (key === 'tri_machine') {
      await expect(page.locator('#exercisePresentation [data-presentation-position="lower"]')).toHaveText('START');
      await expect(page.locator('#exercisePresentation [data-presentation-position="raised"]')).toHaveText('KONIEC');
    }
    if (key === 'biceps_preacher') {
      await expect(page.locator('#exercisePresentation [data-presentation-position="lower"]')).toHaveText('DÓŁ');
      await expect(page.locator('#exercisePresentation [data-presentation-position="raised"]')).toHaveText('GÓRA');
    }
    if (key === 'row_machine') {
      await expect(page.locator('#exercisePresentation [data-presentation-position="lower"]')).toHaveText('ODDALONE');
      await expect(page.locator('#exercisePresentation [data-presentation-position="raised"]')).toHaveText('PRZY TUŁOWIU');
      await expect(page.locator('#exercisePresentationDetailsText')).toContainText('dolnym bloczkiem');
    }
    if (key === 'tri_overhead' && variantId === 'rope') {
      await expect(page.locator('#currentExVariant')).toContainText('Lina na wyciągu');
      await expect(page.locator('#exercisePresentationDetailsText')).toContainText('dolnym wyciągiem');
    }
    await page.locator('#weight_0').fill('42.5');
    await page.locator('#reps_0').fill('8');
    for (const sex of ['male', 'female']) {
      await page.locator(`#exercisePresentation [data-presentation-sex="${sex}"]`).click();
      const image = page.locator('#exercisePresentationImage');
      const expected = `${key}__${key === 'leg_press' && variantId === 'high_feet' ? 'default' : (variantId || 'default')}-${sex}`;
      await expect(image).toHaveAttribute('src', new RegExp(`/src/data/exercise-images/selected/technique/${expected}[.]webp$`));
      await expect.poll(() => image.evaluate(element => element.naturalWidth)).toBe(768);
      await page.locator('#exercisePresentation [data-presentation-position="lower"]').click();
      if (['biceps_preacher', 'tri_machine', 'row_machine'].includes(key) && sex === 'male') {
        await page.locator('#exercisePresentation').screenshot({ path: resolve(screenshotDir, `${key}-male-lower-390.png`) });
      }
      if (key === 'biceps_preacher' && sex === 'female') {
        await page.locator('#exercisePresentation').screenshot({ path: resolve(screenshotDir, `${key}-female-lower-390.png`) });
      }
      await page.locator('#exercisePresentation [data-presentation-position="raised"]').click();
      await expect(page.locator('#exercisePresentationFigure')).toHaveAttribute('data-position', 'raised');
      if (['biceps_preacher', 'tri_machine'].includes(key) && sex === 'male') {
        await page.locator('#exercisePresentation').screenshot({ path: resolve(screenshotDir, `${key}-male-raised-390.png`) });
      }
      if (['biceps_preacher', 'tri_machine', 'row_machine'].includes(key) && sex === 'female') {
        await page.locator('#exercisePresentation').screenshot({ path: resolve(screenshotDir, `${key}-female-raised-390.png`) });
      }
      await page.locator('#exercisePresentation [data-presentation-mode="thumbnail"]').click();
      await expect(image).toHaveAttribute('src', new RegExp(`/src/data/exercise-images/selected/thumbnails/${expected}[.]webp$`));
      await expect.poll(() => image.evaluate(element => element.naturalWidth)).toBe(256);
      await page.locator('#exercisePresentation [data-presentation-mode="technique"]').click();
      await expect(page.locator('#weight_0')).toHaveValue('42.5');
      await expect(page.locator('#reps_0')).toHaveValue('8');
    }
    if (variantId) await expect(page.locator('#currentExVariant')).not.toBeEmpty();
    if (key === 'leg_press') await expect(page.locator('#variantImageShared')).toBeVisible();
    if (index < exercises.length - 1) await page.locator('#btnNextStep').click();
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
