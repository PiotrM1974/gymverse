import { test, expect } from '@playwright/test';

// Older workout scenarios continue after explicitly skipping the new rest screen.
test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('#restScreen:not([hidden])'), async () => { await page.waitForFunction(() => document.querySelector('#sessionSaveStatus').hidden); await page.locator('#restScreen [data-act="timerSkip" ]').click(); }); });
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const evidenceDir = fileURLToPath(new URL('../../outputs/GV-PWA-EXERCISE-ATLAS-CONSISTENCY-AND-OFFLINE-RECOVERY/', import.meta.url));

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'push_a1', title: 'Push A1', exercises: [{ key: 'bench_flat', sets: 2, target: '8-12' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'atlas-profile', profiles: [{ id: 'atlas-profile', name: 'Atlas test', attributes: { trainingGoal: 'fitness' }, data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [] } }] }));
  });
  await page.reload();
  await page.locator('[data-act="startPlan"]').first().waitFor();
});

async function expectWorkoutAtlasMatches(page) {
  if (!(await page.locator('#trainingAtlasDisclosure').evaluate(element => element.open))) {
    await page.locator('#trainingAtlasDisclosure > summary').click();
  }
  const result = await page.evaluate(async () => {
    const { EXERCISE_ATLAS_MAP } = await import('/src/data/anatomy/atlas-data.js');
    const { MUSCLEMAP_DIAGRAMS } = await import('/src/data/anatomy/musclemap-diagrams.js');
    const { EXERCISE_CATALOG } = await import('/src/exercise/catalog.js');
    const active = JSON.parse(localStorage.getItem('gymverse_active') || 'null');
    const plan = active && JSON.parse(localStorage.getItem('gymverse_plans') || '[]').find(item => item.id === active.planId);
    const base = plan?.exercises?.[active?.step];
    const exerciseId = active?.swaps?.[active?.step] || base?.key;
    const entry = EXERCISE_ATLAS_MAP[exerciseId];
    const expectedCardName = window.GymNastikaExerciseNames?.[exerciseId] || (active?.swaps?.[active?.step]
      ? EXERCISE_CATALOG.find(exercise => exercise.id === exerciseId)?.name
      : base?.name || EXERCISE_CATALOG.find(exercise => exercise.id === exerciseId)?.name);
    const atlas = document.querySelector('#anatomyAtlas');
    const sex = atlas.querySelector('[data-atlas-sex][aria-pressed="true"]')?.dataset.atlasSex || 'male';
    const view = atlas.querySelector('[data-atlas-view][aria-pressed="true"]')?.dataset.atlasView || 'front';
    const diagram = MUSCLEMAP_DIAGRAMS.find(item => item.id === `${sex}-${view}`);
    const sourceSurfaceIds = new Set((diagram?.muscles || []).map(path => path.id).filter(Boolean));
    const excluded = new Set(entry?.excludedByView?.[`${sex}-${view}`] || []);
    if (sex === 'female' && view === 'front') { excluded.add('ADDUCTOR_LEFT'); excluded.add('ADDUCTOR_RIGHT'); }
    const expectedVisibleSurfaces = new Set([...(entry?.primary || []), ...(entry?.secondary || [])].filter(id => sourceSurfaceIds.has(id) && !excluded.has(id)));
    const renderedActiveSurfaces = new Set(Array.from(atlas.querySelectorAll('.anatomy-atlas__muscle--primary[data-muscle-id], .anatomy-atlas__muscle--secondary[data-muscle-id]'), path => path.dataset.muscleId));
    const legend = Array.from(atlas.querySelectorAll('.anatomy-atlas__legend-group')).map(group => ({
      role: group.getAttribute('aria-label'),
      labels: Array.from(group.querySelectorAll('.anatomy-atlas__list li'), item => item.textContent.trim())
    }));
    return {
      activeId: exerciseId,
      atlasId: atlas.dataset.exerciseId,
      entryExists: Object.hasOwn(EXERCISE_ATLAS_MAP, exerciseId),
      cardName: document.querySelector('#currentExName')?.textContent.trim(),
      expectedCardName,
      title: atlas.querySelector('.anatomy-atlas > summary')?.textContent.trim() || atlas.querySelector('.anatomy-atlas')?.getAttribute('aria-label'),
      expectedTitle: window.GymNastikaExerciseNames?.[exerciseId] || entry?.title,
      expectedVisibleSurfaces: Array.from(expectedVisibleSurfaces).sort(),
      renderedActiveSurfaces: Array.from(renderedActiveSurfaces).sort(),
      legend,
      atlasHidden: atlas.hidden
    };
  });
  expect(result.activeId).toBeTruthy();
  expect(result.atlasId).toBe(result.activeId);
  expect(result.entryExists).toBe(true);
  expect(result.cardName).toBe(result.expectedCardName);
  expect(result.title, JSON.stringify(result)).toContain(result.expectedTitle);
  expect(result.renderedActiveSurfaces).toEqual(result.expectedVisibleSurfaces);
  expect(result.atlasHidden).toBe(false);
  return result;
}

test('active workout exercise ID, atlas ID, selected map and rendered surfaces stay synchronized', async ({ page }) => {
  await mkdir(evidenceDir, { recursive: true });
  const defaultPlans = [
    { id: 'push_a1', title: 'Push A1', exercises: ['bench_flat', 'db_incline', 'lat_raise_stand', 'tri_rope', 'leg_press'] },
    { id: 'pull_a1', title: 'Pull A1', exercises: ['lat_pulldown_wide', 'row_v', 'rear_delt', 'biceps_preacher', 'leg_curl'] },
    { id: 'push_a2', title: 'Push A2', exercises: ['db_bench', 'db_fly', 'front_raise', 'lat_raise_seated', 'tri_machine', 'leg_press'] },
    { id: 'pull_a2', title: 'Pull A2', exercises: ['lat_pulldown_neutral', 'row_straight', 'rear_delt', 'biceps_preacher', 'leg_curl'] }
  ].map(plan => ({ ...plan, exercises: plan.exercises.map(key => ({ key, sets: 2, target: '8-12' })) }));
  await page.evaluate(plans => localStorage.setItem('gymverse_plans', JSON.stringify(plans)), defaultPlans);
  await page.reload();
  for (const planId of ['push_a1', 'pull_a1', 'push_a2', 'pull_a2']) {
    if (planId !== 'push_a1') {
      await page.locator('.logo[data-view="view-plans"]').click();
      page.once('dialog', dialog => dialog.accept());
    }
    await page.locator(`[data-act="startPlan"][data-plan="${planId}"]`).click();
    if (planId === 'push_a1') {
      await page.locator('[data-act="swapOpen"]').first().click();
      page.once('dialog', dialog => dialog.accept());
      await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').click();
      expect((await expectWorkoutAtlasMatches(page)).activeId).toBe('db_bench');
      await page.locator('[data-act="swapOpen"]').first().click();
      page.once('dialog', dialog => dialog.accept());
      await page.locator('[data-act="chooseSwap"][data-key="bench_flat"]').click();
    }
    let result = await expectWorkoutAtlasMatches(page);
    const firstExerciseId = result.activeId;

    await page.locator('#weight_0').fill('50');
    await page.locator('#reps_0').fill('8');
    await page.locator('#btnDone_0').click();
    await expectWorkoutAtlasMatches(page);
    expect(await page.locator('#anatomyAtlas').getAttribute('data-exercise-id')).toBe(firstExerciseId);

    await page.locator('#btnNextStep').click();
    await expect.poll(() => page.locator('#anatomyAtlas').getAttribute('data-exercise-id')).not.toBe(firstExerciseId);
    result = await expectWorkoutAtlasMatches(page);
    const secondExerciseId = result.activeId;

    await page.locator('#btnPrev').click();
    await expect.poll(() => page.locator('#anatomyAtlas').getAttribute('data-exercise-id')).toBe(firstExerciseId);
    await expectWorkoutAtlasMatches(page);
    await page.locator('#btnNextStep').click();
    await expect.poll(() => page.locator('#anatomyAtlas').getAttribute('data-exercise-id')).toBe(secondExerciseId);
    await expectWorkoutAtlasMatches(page);

    await page.reload();
    await page.getByRole('button', { name: 'Wznów' }).click();
    await expect.poll(() => page.locator('#anatomyAtlas').getAttribute('data-exercise-id')).toBe(secondExerciseId);
    await expectWorkoutAtlasMatches(page);

    const planLength = defaultPlans.find(plan => plan.id === planId).exercises.length;
    for (let step = 1; step < planLength; step += 1) {
      const currentId = await page.locator('#anatomyAtlas').getAttribute('data-exercise-id');
      const expectedId = defaultPlans.find(plan => plan.id === planId).exercises[step].key;
      expect(currentId).toBe(expectedId);
      await expectWorkoutAtlasMatches(page);
      if (step < planLength - 1) await page.locator('#btnNextStep').click();
    }
  }
});

test('captures a clean screenshot of the current exercise and its matching atlas', async ({ page }) => {
  await mkdir(evidenceDir, { recursive: true });
  await page.evaluate(() => localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'pull_a1', title: 'Pull A1', exercises: [{ key: 'lat_pulldown_wide', sets: 2, target: '8-12' }, { key: 'row_v', sets: 2, target: '8-12' }] }])));
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="pull_a1"]').click();
  const result = await expectWorkoutAtlasMatches(page);
  await page.locator('#anatomyAtlas .anatomy-atlas__body').evaluate(image => image.decode());
  await page.locator('#view-workout').evaluate(async view => { await Promise.all(view.getAnimations().map(animation => animation.finished)); });
  await page.screenshot({ path: join(evidenceDir, 'active-lat-pulldown-atlas-consistent.png'), fullPage: true });
  const screenshot = await readFile(join(evidenceDir, 'active-lat-pulldown-atlas-consistent.png'));
  await writeFile(join(evidenceDir, 'exercise-consistency-screenshot.json'), JSON.stringify({ exerciseId: result.activeId, atlasId: result.atlasId, title: result.title, renderedSurfaces: result.renderedActiveSurfaces, screenshotSha256: createHash('sha256').update(screenshot).digest('hex') }, null, 2));
});

test('all default-plan exercise IDs and all four catalog variant IDs have an atlas map', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { EXERCISE_ATLAS_MAP } = await import('/src/data/anatomy/atlas-data.js');
    const { EXERCISE_VARIANTS } = await import('/src/exercise/catalog.js');
    const source = await fetch('/index.html').then(response => response.text());
    const ids = Array.from(source.matchAll(/exd\('([^']+)'/g), match => match[1]);
    const variants = EXERCISE_VARIANTS.map(variant => ({ ...variant, atlasId: `${variant.exerciseId}/${variant.variantId}` }));
    return {
      ids,
      missingMaps: [...new Set(ids)].filter(id => !EXERCISE_ATLAS_MAP[id]),
      variants: variants.map(variant => ({ id: variant.atlasId, mapAvailable: Object.hasOwn(EXERCISE_ATLAS_MAP, variant.atlasId) }))
    };
  });
  expect(result.ids.length).toBeGreaterThan(20);
  expect(result.missingMaps).toEqual([]);
  expect(result.variants).toHaveLength(4);
  expect(result.variants.every(item => item.mapAvailable)).toBe(true);
});
