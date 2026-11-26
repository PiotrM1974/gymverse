import { test, expect } from '@playwright/test';

// Older workout scenarios continue after explicitly skipping the new rest screen.
test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('#restScreen:not([hidden])'), async () => { await page.waitForFunction(() => document.querySelector('#sessionSaveStatus').hidden); await page.locator('#restScreen [data-act="timerSkip" ]').click(); }); });
import { mkdir } from 'node:fs/promises';

const screenshotDir = 'outputs/GV-EXERCISE-VARIANTS/visual';

test('leg press variant survives plan, workout, offline resume, history and ZIP restore', async ({ browser, page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/');
  await page.waitForFunction(() => document.body.classList.contains('stage6-onboarding'));
  await page.locator('[data-act="stage6CreateProfile"]').click();
  await page.locator('#newProfileName').fill('Profil wariantów');
  for(let step=0;step<3;step++) await page.locator('[data-act="profileNext"]').click();
  await page.locator('[data-act="createProfile"]').click();
  await page.locator('#view-plan-choices [data-act="stage6Skip"]').first().click();
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="push_a1"]').click();
  await page.locator('[data-field="peVariant"]').last().selectOption('high_feet');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans') || '[]').find(p => p.id === 'push_a1')?.exercises[4]?.variantId)).toBe('high_feet');
  await page.locator('[data-act="view"][data-view="view-plans"]').last().click();
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  for (let i = 0; i < 4; i++) await page.locator('#btnNextStep').click();
  await expect(page.locator('#currentExVariant')).toContainText('Stopy wyżej');
  await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', 'leg_press/high_feet');
  await expect(page.locator('#variantImageShared')).toHaveText('Ilustracja wariantu podstawowego');
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /leg_press__default-male\.webp$/);
  await expect.poll(() => page.locator('#exercisePresentationImage').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('#exercisePresentationFigure')).toHaveAttribute('aria-label', /lewy panel DÓŁ, prawy panel GÓRA/);
  await expect(page.locator('#exercisePresentationCaption [data-panel="lower"]')).toContainText('kolana zgięte');
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"]')).toContainText('platforma odsunięta');
  if (process.env.GV_VARIANT_SCREENSHOTS === '1') {
    await mkdir(screenshotDir, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${screenshotDir}/variant-in-workout-390.png`, fullPage: true });
  }
  const activeBeforeAtlas = await page.evaluate(() => localStorage.getItem('gymverse_active'));
  await page.locator('.exercise-hero > summary').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();
  await page.locator('#anatomyAtlas [data-atlas-view="back"]').click();
  await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', 'leg_press/high_feet');
  await page.locator('#trainingAtlasDisclosure > summary').click();
  expect(await page.evaluate(() => localStorage.getItem('gymverse_active'))).toBe(activeBeforeAtlas);
  await page.locator('#weight_0').fill('85');
  await page.locator('#reps_0').fill('10');
  await page.locator('#btnDone_0').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active') || 'null')?.sets[0]?.variantId)).toBe('high_feet');
  // Continue from the next remaining set before testing session reload.
  await expect(page.locator('#weight_0')).toHaveValue('85');
  await page.reload();
  await page.locator('[data-act="resume"]').click();
  await expect(page.locator('#currentExVariant')).toContainText('Stopy wyżej');
  await expect(page.locator('#weight_0')).toHaveValue('85');
  await expect.poll(() => page.locator('#exercisePresentationImage').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('#reps_0')).toHaveValue('10');
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('sw.js');
  await page.context().setOffline(true);
  await page.reload();
  await page.locator('[data-act="resume"]').click();
  await expect(page.locator('#currentExVariant')).toContainText('Stopy wyżej');
  await expect(page.locator('#weight_0')).toHaveValue('85');
  await page.context().setOffline(false);
  await page.locator('[data-act="finish"]').click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]'));
  expect(saved.at(-1).details).toMatchObject([{ exerciseId: 'leg_press', variantId: 'high_feet', weight: 85, reps: 10 }]);
  await page.getByRole('button', { name: 'Historia' }).click();
  await page.locator('.hist-head').first().click();
  await expect(page.locator('#historyList')).toContainText('Stopy wyżej');
  if (process.env.GV_VARIANT_SCREENSHOTS === '1') await page.screenshot({ path: `${screenshotDir}/variant-in-history-390.png`, fullPage: true });

  const snapshot = await page.evaluate(async () => {
    const raw = await window.__gymverseTestHarness.getStore().exportSnapshot();
    return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, JSON.parse(value)]));
  });
  const bytes = await page.evaluate(async source => {
    const { createBackupV5 } = await import('./src/gv-data.js');
    return Array.from(new Uint8Array(await (await createBackupV5(source)).arrayBuffer()));
  }, snapshot);
  const clean = await browser.newContext();
  const imported = await clean.newPage();
  imported.on('dialog', dialog => dialog.accept());
  await imported.goto('/');
  await imported.locator('#importFile').setInputFiles({ name: 'synthetic-variants.zip', mimeType: 'application/zip', buffer: Buffer.from(bytes) });
  await imported.locator('[data-backup-choice="restore"]') .click();
  await expect.poll(() => imported.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]').at(-1)?.details[0]?.variantId)).toBe('high_feet');
  expect(await imported.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]').at(-1)?.details)).toEqual(saved.at(-1).details);
  await clean.close();
});

test('two positions keep independent variants and previous values never cross variants', async ({ page }) => {
  await page.addInitScript(() => {
    if(localStorage.getItem('7b-variants-fixture'))return;
    localStorage.setItem('7b-variants-fixture','1');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'synthetic_variants', title: 'Synthetic', exercises: [
      { key: 'leg_press', variantId: 'high_feet', sets: 1, target: '8-10' },
      { key: 'leg_press', variantId: 'default', sets: 1, target: '8-10' }
    ] }]));
    localStorage.setItem('gymverse_history', JSON.stringify([{ date: '2026-01-01T12:00:00.000Z', planId: 'old', planTitle: 'Old', details: [
      { exerciseId: 'leg_press', variantId: 'default', exerciseName: 'Suwnica', setNumber: 1, weight: 150, reps: 9 }
    ] }]));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-act="startPlan"][data-plan="synthetic_variants"]').click();
  await expect(page.locator('#currentExVariant')).toContainText('Stopy wyżej');
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /leg_press__default-male\.webp$/);
  await expect(page.locator('#currentExHint')).toBeEmpty();
  await expect(page.locator('.prev-val').first()).toHaveText('Brak danych');
  await page.locator('#weight_0').fill('90');
  await page.locator('#reps_0').fill('10');
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#currentExVariant')).toHaveText('Wersja podstawowa');
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /leg_press__default-male\.webp$/);
  await expect(page.locator('#exercisePresentationFigure')).toHaveAttribute('aria-label', /lewy panel DÓŁ, prawy panel GÓRA/);
  await expect(page.locator('#exercisePresentationCaption [data-panel="lower"]')).toContainText('kolana zgięte');
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"]')).toContainText('platforma odsunięta');
  await expect(page.locator('.prev-val').first()).toContainText('150');
  const active = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')));
  expect(active.exercises.map(e => e.variantId)).toEqual(['high_feet', 'default']);
  expect(active.sets[0]).toMatchObject({ step: 0, variantId: 'high_feet', weight: 90, reps: 10 });
  await page.evaluate(() => {
    const plan = JSON.parse(localStorage.getItem('gymverse_plans'));
    plan[0].exercises[0].variantId = 'default';
    localStorage.setItem('gymverse_plans', JSON.stringify(plan));
  });
  await page.reload();
  await page.locator('[data-act="resume"]').click();
  await page.locator('#btnPrev').click();
  await expect(page.locator('#currentExVariant')).toContainText('Stopy wyżej');
});

test('legacy and unknown variant strings survive; malformed variant types fail backup validation', async ({ page }) => {
  await page.addInitScript(() => {
    if(localStorage.getItem('7b-legacy-variant-fixture'))return;
    localStorage.setItem('7b-legacy-variant-fixture','1');
    localStorage.setItem('gymverse_history', JSON.stringify([{ date: '2026-01-01T12:00:00.000Z', planId: 'push_a1', planTitle: 'Legacy', details: [
      { exerciseId: 'leg_press', exerciseName: 'Suwnica', setNumber: 1, weight: 60, reps: 8 },
      { exerciseId: 'leg_press', variantId: 'dumbbells', exerciseName: 'Suwnica', setNumber: 2, weight: 70, reps: 9 }
    ] }]));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#migrateDataButton')).toBeVisible();
  const details = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history'))[0].details);
  expect(details[0]).not.toHaveProperty('variantId');
  expect(details[1]).toMatchObject({ variantId: 'dumbbells', weight: 70, reps: 9 });
  await page.getByRole('button', { name: 'Historia' }).click();
  await page.locator('.hist-head').first().click();
  await expect(page.locator('#historyList')).toContainText('Wariant nie został zapisany');
  await expect(page.locator('#historyList')).toContainText('Wariant nierozpoznany');
  const result = await page.evaluate(async () => {
    const { inspectLegacySnapshot } = await import('./src/gv-data.js');
    return inspectLegacySnapshot({ gymverse_history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'leg_press', variantId: 42, weight: 60, reps: 8 }] }], gymverse_plans: [] });
  });
  expect(result.ok).toBe(false);
  expect(result.anomalies).toContain('INVALID_SERIES');
});
