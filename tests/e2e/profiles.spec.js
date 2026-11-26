import {setGeneratorDays} from './helpers/generator-days.js';
import { test, expect } from '@playwright/test';
async function chooseProfileOptions(page,id,values){if(id==='newProfileRestrictions'&&!await page.locator('#profileRestrictionPicker').evaluate(e=>e.open))await page.locator('#profileRestrictionPicker > summary').click();if(id==='newProfileRestrictions'&&await page.locator('#profileExerciseGroup').count()&&!await page.locator('#profileExerciseGroup').evaluate(e=>e.open))await page.locator('#profileExerciseGroup > summary').click();for(const box of await page.locator('[data-profile-choice="'+id+'"]:checked').all())await box.uncheck();for(const value of values)await page.locator('[data-profile-choice="'+id+'"][value="'+value+'"]').check();}
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('fresh install offers profile creation, restore, and the existing safe skip path', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const welcome = page.locator('#stage6Welcome');
  await expect(welcome).toBeVisible();
  await expect(welcome.getByRole('button', { name: 'Utwórz profil' })).toBeVisible();
  await expect(welcome.getByRole('button', { name: 'Przywróć dane z kopii' })).toBeVisible();
  await expect(welcome.getByRole('button', { name: 'Pomiń na razie' })).toBeVisible();
  await welcome.getByRole('button', { name: 'Pomiń na razie' }).click();
  await expect(welcome).toBeHidden();
  await expect(page.locator('#profileSelect')).toBeVisible();
  await expect(page.locator('#planList .plan-card').first()).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).onboardingRequired)).toBe(false);
});

test('legacy data gets a one-time welcome that can be dismissed without changing workouts', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'legacy-plan-welcome', title: 'Plan zachowany', exercises: [{ key: 'bench_flat', sets: 3 }] }]));
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'legacy-session-welcome', date: '2026-11-20T10:00:00.000Z', planId: 'legacy-plan-welcome', details: [{ exerciseId: 'bench_flat', weight: 50, reps: 8 }] }]));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#legacyUpgradeWelcome');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Wykryliśmy dane z wcześniejszej wersji aplikacji');
  await expect(page.locator('.profile-quick-actions')).toBeVisible();
  await expect(page.locator('.profile-quick-actions button')).toHaveCount(2);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      await expect(card).toBeVisible();
      const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, body: document.body.scrollWidth }));
      expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
    }
  }
  const before = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem('gymverse_profiles_v1')),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history')
  }));
  expect(before.state.activeProfileId).toBe('legacy-default-profile');
  const continueButton = card.getByRole('button', { name: 'Kontynuuj bez zmian' });
  await continueButton.focus();
  await continueButton.press('Enter');
  await expect(card).toBeHidden();
  await expect(page.locator('#planList')).toContainText('Plan zachowany');
  const after = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem('gymverse_profiles_v1')),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history')
  }));
  expect(after.state.legacyUpgradePending).toBe(false);
  expect(after.state.profiles).toEqual(before.state.profiles);
  expect(after.plans).toBe(before.plans);
  expect(after.history).toBe(before.history);
  await page.reload();
  await expect(card).toBeHidden();
});

test('a valid GymNastika 2.0 profile registry opens normally without upgrade welcome', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'profile-current-01', profiles: [
      { id: 'legacy-default-profile', name: 'Profil archiwalny', createdAt: '2026-11-20T00:00:00.000Z', attributes: { age: 51, equipment: ['barbell'] }, data: { gymverse_history: JSON.stringify([{ id: 'retained-profile-history' }]) } },
      { id: 'profile-current-01', name: 'Mój bieżący profil', createdAt: '2026-11-21T00:00:00.000Z', attributes: { age: 35, sex: 'female', heightCm: 168, weightKg: 64, experience: 'several_months', returnAfterBreak: false, equipment: ['dumbbells'], restrictions: [] }, data: {} }
    ] }));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#stage6Welcome')).toBeHidden();
  await expect(page.locator('#legacyUpgradeWelcome')).toBeHidden();
  await expect(page.locator('#profileSelect')).toHaveValue('profile-current-01');
  await expect(page.locator('.profile-quick-actions')).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')));
  expect(state.profiles).toHaveLength(2);
  expect(state.profiles[0].data.gymverse_history).toContain('retained-profile-history');
  await page.locator('.profile-quick-actions').getByRole('button', { name: 'Edytuj profil' }).click();
  await expect(page.locator('#newProfileName')).toHaveValue('Mój bieżący profil');
  await page.locator('[data-act="profileNext"]').click();
  await expect(page.locator('#newProfileAge')).toHaveValue('35');
  await page.locator('#newProfileAge').fill('40');
  await page.locator('[data-act="profileCancel"]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')))).toEqual(state);
  await page.locator('.profile-quick-actions').getByRole('button', { name: 'Dodaj profil' }).click();
  await expect(page.locator('#newProfileName')).toHaveValue('');
  await page.locator('[data-act="profileCancel"]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')))).toEqual(state);
});

test('legacy welcome edits the existing profile without duplicating it or losing history and plans', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'legacy-plan-edit', title: 'Plan zachowany', exercises: [{ key: 'bench_flat', sets: 3 }] }]));
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'legacy-session-edit', date: '2026-11-20T10:00:00.000Z', planId: 'legacy-plan-edit', details: [{ exerciseId: 'bench_flat', weight: 50, reps: 8 }] }]));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#legacyUpgradeWelcome');
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Uzupełnij profil' }).click();
  await expect(page.locator('#profileFormDetails')).toBeVisible();
  await expect(page.locator('#newProfileName')).toHaveValue('Mój profil');
  const originalId = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).activeProfileId);
  await page.locator('[data-act="profileNext"]').click();
  await expect(page.locator('#newProfileAge')).toHaveValue('');
  await page.locator('#newProfileAge').fill('38');
  await page.locator('[data-act="profileCancel"]').click();
  await expect(card).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).profiles[0].attributes?.age ?? null)).toBeNull();
  await card.getByRole('button', { name: 'Uzupełnij profil' }).click();
  await expect(page.locator('#newProfileName')).toHaveValue('Mój profil');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('#newProfileAge').fill('38');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('[data-act="createProfile"]').click();
  await expect(card).toBeHidden();
  const result = await page.evaluate(() => ({ state: JSON.parse(localStorage.getItem('gymverse_profiles_v1')), plans: localStorage.getItem('gymverse_plans'), history: localStorage.getItem('gymverse_history') }));
  expect(result.state.activeProfileId).toBe(originalId);
  expect(result.state.profiles).toHaveLength(1);
  expect(result.state.profiles[0]).toMatchObject({ id: originalId, name: 'Mój profil', attributes: { age: 38 } });
  expect(result.state.profiles[0].data).toMatchObject({ gymverse_plans: expect.any(String), gymverse_history: expect.any(String) });
  expect(JSON.parse(result.plans)[0].id).toBe('legacy-plan-edit');
  expect(JSON.parse(result.history)[0].id).toBe('legacy-session-edit');
});

async function completeOnboarding(page) { await page.waitForFunction(() => document.body.classList.contains('stage6-onboarding')); await page.locator('[data-act="stage6CreateProfile"]').click(); await page.locator('#newProfileName').fill('Profil testowy'); await page.locator('[data-act="profileNext"]').click(); await page.locator('[data-act="profileNext"]').click(); await page.locator('[data-act="profileNext"]').click(); await page.locator('[data-act="createProfile"]').click(); await page.locator('#view-plan-choices [data-act="stage6Skip"]').first().click(); }

test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('body:not(.stage6-onboarding) .profile-box:has(#profileSelect option):visible #profileManage:not([open])'), async () => { await page.locator('#profileManage > summary').click(); }); });

test('profile creation, isolation, generator, and per-profile backup work with synthetic data', async ({ page, context }, testInfo) => {
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(() => {
    if(localStorage.getItem('7a-legacy-fixture'))return;
    localStorage.setItem('7a-legacy-fixture','1');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'synthetic-plan-01', title: 'Plan testowy', exercises: [{ key: 'bench_flat', exerciseId: 'bench_flat', sets: 3 }] }]));
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'synthetic-session-01', date: '2026-11-20T10:00:00.000Z', planId: 'synthetic-plan-01', details: [] }]));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#migrateDataButton')).toBeVisible();
  await expect(page.locator('#profileSelect option')).toHaveCount(1);
  const legacyProfileId = await page.locator('#profileSelect').inputValue();
  await page.locator('details summary').filter({ hasText: 'Dodaj profil' }).click();
  await page.locator('#newProfileName').fill('Profil syntetyczny');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('#newProfileAge').fill('34');
  await page.locator('#newProfileSex').selectOption('female');
  await page.locator('#newProfileHeight').fill('168');
  await page.locator('#newProfileWeight').fill('64');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('#newProfileExperience').selectOption('several_months');
  await page.locator('#newProfileReturnAfterBreak').selectOption('true');
  await page.locator('[data-act="profileNext"]').click();
  await chooseProfileOptions(page,'newProfileEquipment',['dumbbells', 'bench']);
  await chooseProfileOptions(page,'newProfileRestrictions',['overhead_press', 'db_bench']);
  await page.locator('[data-act="createProfile"]').click();
  await expect(page.locator('#profileSelect option')).toHaveCount(2);
  const newProfileId = await page.locator('#profileSelect').inputValue();
  expect(newProfileId).not.toBe(legacyProfileId);
  const secondProfile = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('gymverse_profiles_v1'));
    return state.profiles.find(profile => profile.id === state.activeProfileId);
  });
  expect(secondProfile.name).toBe('Profil syntetyczny');
  expect(secondProfile.attributes).toMatchObject({ age: 34, sex: 'female', heightCm: 168, weightKg: 64, experience: 'several_months', returnAfterBreak: true, equipment: ['dumbbells', 'bench'], restrictions: ['overhead_press', 'db_bench'] });
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('gymverse_history') || '[]'))).toEqual([]);

  await page.locator('#profileSelect').selectOption(legacyProfileId);
  await page.locator('[data-act="switchProfile"]').click();
  await expect(page.locator('#profileSelect')).toHaveValue(legacyProfileId);
  await expect(page.locator('#planList')).toContainText('Plan testowy');
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('gymverse_history')))).toHaveLength(1);

  await page.locator('#editProfileButton').click();
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('#newProfileAge').fill('34');
  await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();
  await chooseProfileOptions(page,'newProfileEquipment',['bodyweight', 'dumbbells', 'barbell', 'bench', 'cables', 'machines', 'pullup_bar', 'dip_bars']);
  await chooseProfileOptions(page,'newProfileRestrictions',['db_bench']);
  await page.locator('[data-act="createProfile"]').click();
  await expect.poll(() => page.evaluate(() => { const state = JSON.parse(localStorage.getItem('gymverse_profiles_v1')); return state.profiles.find(profile => profile.id === state.activeProfileId)?.attributes?.age; })).toBe(34);
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('details summary').filter({ hasText: 'Wygeneruj plan' }).click();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[name="generatorSchedule"][value="mon"]').check();
  await page.locator('[name="generatorSchedule"][value="wed"]').check();
  await page.locator('[name="generatorSchedule"][value="fri"]').check();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('#generatorFavorites').selectOption('db_bench');
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatePlan"]').click();
  await expect(page.locator('#generatorPreview')).toContainText('Podgląd propozycji');
  const lockTab = await context.newPage();
  await lockTab.goto('/');
  await lockTab.waitForFunction(() => !!window.__gymverseTestHarness);
  await lockTab.evaluate(() => {
    window.lockHeld = false;
    window.lockDone = navigator.locks.request('gymnastika-plan-program-data', async () => {
      window.lockHeld = true;
      await new Promise(resolve => { window.releasePlanLock = resolve; });
    });
  });
  await lockTab.waitForFunction(() => window.lockHeld);
  try {
    await page.locator('[data-act="saveGeneratedPreview"]').click();
    await expect.poll(() => lockTab.evaluate(async () => (await navigator.locks.query()).pending.some(lock => lock.name === 'gymnastika-plan-program-data'))).toBe(true);
    const beforeGenerated = await page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans||'[]').filter(plan => plan.id.startsWith('generated-')));
    expect(beforeGenerated).toHaveLength(0);
    await lockTab.evaluate(() => window.releasePlanLock());
    await expect.poll(() => page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans||'[]').filter(plan => plan.id.startsWith('generated-')).length)).toBe(3);
  } finally {
    await lockTab.evaluate(async () => { window.releasePlanLock?.(); await window.lockDone; });
    await lockTab.close();
  }
  await expect(page.locator('#view-program-preview')).toContainText('Do sprawdzenia · Całe ciało · dzień 1');
  const generated = await page.evaluate(async () => {
    const snapshot = await window.__gymverseTestHarness.getStore().refreshSnapshot();
    return JSON.parse(snapshot.gymverse_plans || '[]').filter(plan => plan.id.startsWith('generated-'));
  });
  expect(generated).toHaveLength(3);
  expect(generated.flatMap(plan => plan.exercises.map(exercise => exercise.key))).not.toContain('db_bench');
  expect(generated.map(plan => plan.dayOfWeek)).toEqual(['mon', 'wed', 'fri']);
  expect(generated.flatMap(plan => plan.exercises).every(exercise => ['bench_flat','db_incline','lat_raise_stand','tri_rope','leg_press','lat_pulldown_wide','row_v','rear_delt','biceps_preacher','leg_curl','db_bench','db_fly','front_raise','lat_raise_seated','tri_machine','lat_pulldown_neutral','row_straight','chest_machine','pec_deck','shoulder_press','lat_raise_cable','face_pull','row_machine','hammer_curl','cable_curl','tri_overhead','leg_extension','smith_squat','pullup','dips','pushup'].includes(exercise.key))).toBe(true);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  const sourceProfileId = await page.evaluate(async () => {
    const store = window.__gymverseTestHarness.getStore();
    const profileId = store.get('gymverse_profiles_v1').activeProfileId;
    const { replaceProfileAuxiliary } = await import('./src/gv-data.js');
    await replaceProfileAuxiliary(profileId, {
      interpretations: [{ id: 'profile-export-rule', exerciseId: 'bench_flat', sessionIds: ['profile-export-session'], ruleVersion: 1, source: 'user_confirmed', confirmedAt: '2026-01-02T00:00:00.000Z', interpretation: { unit: 'user_confirmed' } }],
      media: [{ name: 'custom-media/profile-export.png', bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]) }]
    });
    return profileId;
  });
  await page.locator('[data-act="openStorage"]').click();
  await page.locator('#view-storage [data-act="exportProfile"]').click();
  const download = await downloadPromise;
  const exportPath = join(testInfo.outputPath(), 'synthetic-profile.json');
  await download.saveAs(exportPath);
  const profileBackup = JSON.parse(await readFile(exportPath, 'utf8'));
  expect(profileBackup.format).toBe('gymverse-profile');
  expect(profileBackup.data).not.toHaveProperty('gymverse_profiles_v1');
  expect(profileBackup.data.gymverse_history).toContain('synthetic-session-01');
  expect(profileBackup.auxiliary.legacyInterpretations).toHaveLength(1);
  expect(profileBackup.auxiliary.customMedia[0].name).toBe('custom-media/profile-export.png');
  await page.locator('#profileImportFile').setInputFiles(exportPath);
  await expect(page.locator('#profileSelect option')).toHaveCount(3);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).profiles.length)).toBe(3);
  const imported = await page.evaluate(async () => {
    const state = JSON.parse(localStorage.getItem('gymverse_profiles_v1'));
    const profileId = state.profiles[state.profiles.length - 1].id;
    const { readLegacyInterpretations, readCustomMedia } = await import('./src/gv-data.js');
    return { profileId, rules: await readLegacyInterpretations({ profileId }), media: await readCustomMedia({ profileId }) };
  });
  expect(imported.profileId).not.toBe(sourceProfileId);
  expect(imported.rules.map(rule => rule.id)).toEqual(['profile-export-rule']);
  expect(imported.media.map(item => item.name)).toEqual(['custom-media/profile-export.png']);
});

test('ten-step generator captures a custom split and reviews every answer before creation', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(() => {
    if(localStorage.getItem('7c-generator-fixture'))return;
    localStorage.setItem('7c-generator-fixture','1');
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'legacy-default-profile', profiles: [{
      id: 'legacy-default-profile', name: 'Profil testowy', createdAt: '2026-11-20T00:00:00.000Z',
      attributes: { age: 34, sex: null, heightCm: 170, weightKg: 70, experience: 'several_months', returnAfterBreak: false, equipment: ['machines', 'dumbbells', 'bench', 'cables'], restrictions: [] }, data: {}
    }] }));
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'wizard-session', date: '2026-11-20T10:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 40, reps: 8 }] }]));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#migrateDataButton')).toBeVisible();
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('details summary').filter({ hasText: 'Wygeneruj plan' }).click();

  await page.locator('#generatorGoal').selectOption('fat_loss');
  await page.locator('#generatorTargetWeight').fill('66');
  await page.locator('[data-act="generatorNext"]').click();
  await setGeneratorDays(page,2);
  await page.locator('[name="generatorSchedule"][value="mon"]').check();
  await page.locator('[name="generatorSchedule"][value="thu"]').check();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('#generatorMinutesPreset').selectOption('custom');
  await page.locator('#generatorMinutesCustom').fill('35');
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('#generatorSplit').selectOption('custom');
  await page.locator('[name="generatorCustomFocus"][data-day="0"]').selectOption(['chest', 'back']);
  await page.locator('[name="generatorCustomFocus"][data-day="1"]').selectOption(['quads', 'hamstrings']);
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('#generatorBalanced').uncheck();
  await page.locator('[name="generatorFocus"][value="chest"]').uncheck();
  await page.locator('[name="generatorFocus"][value="back"]').uncheck();
  await page.locator('[name="generatorFocus"][value="shoulders"]').uncheck();
  await page.locator('[name="generatorFocus"][value="biceps"]').uncheck();
  await page.locator('[name="generatorFocus"][value="triceps"]').uncheck();
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[name="generatorEquipment"]').evaluateAll(inputs => inputs.forEach(input => { input.checked = input.value === 'machines'; }));
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('#generatorFavorites').selectOption('chest_machine');
  await page.locator('#generatorExclusions').selectOption('smith_squat');
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('#generatorHistoryChoice').selectOption('no');
  await page.locator('[data-act="generatorNext"]').click();
  await page.locator('#generatorExperience').selectOption('several_months');
  await page.locator('#generatorReturnAfterBreak').check();
  await page.locator('[data-act="generatorNext"]').click();

  await expect(page.locator('#generatorReview')).toContainText('Redukcja tkanki tłuszczowej');
  await expect(page.locator('#generatorReview')).toContainText('66 kg');
  await expect(page.locator('#generatorReview')).toContainText('Poniedziałek');
  await expect(page.locator('#generatorReview')).toContainText('35 min');
  await expect(page.locator('#generatorReview')).toContainText('Własny podział');
  await expect(page.locator('#generatorReview')).toContainText('Maszyny');
  await expect(page.locator('#generatorReview')).toContainText('Chest Press Machine');
  await expect(page.locator('#generatorReview')).toContainText('Historia: nie');
  await expect(page.locator('#generatorReview')).toContainText('powrót po przerwie');
  await expect(page.locator('#planEditBody')).not.toContainText('Do sprawdzenia · Własny ');
  await page.locator('[data-act="generatorGoStep"][data-step="4"]').click();
  await expect(page.locator('#generatorSplit')).toHaveValue('custom');
  for (let step = 0; step < 6; step += 1) await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatePlan"]').click();
  await expect(page.locator('#generatorPreview')).toContainText('Podgląd propozycji');
  await expect(page.locator('#generatorPreview')).toContainText('Objętość tygodniowa');
  await expect(page.locator('#generatorPreview')).toContainText('Przerwa');
  await expect(page.locator('#generatorPreview')).toContainText('Sprzęt');
  await expect(page.locator('#generatorPreview')).toContainText('Wariant');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans') || '[]').filter(plan => plan.id.startsWith('generated-')))).toEqual([]);
  const firstSwap = page.locator('[data-act="previewSwap"]').first();
  const firstSwapId = await firstSwap.getAttribute('data-select-id');
  const oldExercise = await page.locator(`[data-preview-select="${firstSwapId}"]`).getAttribute('data-current-exercise');
  const swapSelect = page.locator(`[data-preview-select="${firstSwapId}"]`);
  await expect(swapSelect.locator('option')).toHaveCount(2);
  const replacement = await swapSelect.locator('option').nth(1).getAttribute('value');
  await swapSelect.selectOption(replacement);
  await firstSwap.click();
  await expect(page.locator(`[data-preview-exercise="${firstSwapId}"]`)).not.toHaveAttribute('data-exercise-id', oldExercise);
  await page.locator('[data-act="saveGeneratedPreview"]').click();
  await expect(page.locator('#generatorPreview')).not.toBeVisible();
  await expect.poll(() => page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans||'[]').filter(plan => plan.id.startsWith('generated-')).length)).toBe(2);
  await expect(page.locator('#view-program-preview')).toBeVisible();
  const programs=await page.evaluate(async()=>JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_profiles_v1).profiles.flatMap(p=>p.planPrograms?.programs||[]));
  expect(programs.at(-1).dayPlanIds).toHaveLength(2);
  await page.reload();
  await expect(page.locator('#migrateDataButton')).toBeVisible();
  await page.locator('[data-act="editPlans"]').click();
  await expect(page.locator('#planEditBody')).toContainText('Do sprawdzenia · Własny 1 · dzień 1');
  await expect(page.locator('#planEditBody')).toContainText('Do sprawdzenia · Własny 2 · dzień 2');
  await page.locator('#planEditBody [data-act="peOpen"][data-id^="generated-"]').first().click();
  await expect(page.locator('#planEditBody .pe-ex')).toHaveCount(3);
  await expect(page.locator('#planEditBody .pe-bot b')).toHaveText(['1', '1', '1']);
});

test('cancelling the generated-plan preview leaves the saved plans unchanged', async ({ page }) => {
  await page.addInitScript(() => {
    if(localStorage.getItem('7b-cancel-fixture'))return;
    localStorage.setItem('7b-cancel-fixture','1');
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'preview-cancel-profile', profiles: [{ id: 'preview-cancel-profile', name: 'Test', createdAt: '2026-11-20T00:00:00.000Z', attributes: { age: 30, sex: null, heightCm: 170, weightKg: 70, experience: null, returnAfterBreak: false, equipment: ['machines', 'dumbbells', 'bench', 'cables'], restrictions: [] }, data: {} }] }));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('details summary').filter({ hasText: 'Wygeneruj plan' }).click();
  for (let step = 0; step < 9; step += 1) await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatePlan"]').click();
  await expect(page.locator('#generatorPreview')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans') || '[]').filter(plan => plan.id.startsWith('generated-')))).toEqual([]);
  await page.locator('[data-act="editGeneratorAnswers"]').click();
  await expect(page.locator('#generatorReview')).toBeVisible();
  await page.locator('[data-act="generatePlan"]').click();
  await expect(page.locator('#generatorPreview')).toBeVisible();
  await page.locator('[data-act="editGeneratorAnswers"]').click();
  for (let step = 0; step < 9; step += 1) await page.locator('[data-act="generatorBack"]').click();
  await page.locator('[data-act="generatorCancel"]').click();
  await expect(page.locator('#generatorPreview')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans') || '[]').filter(plan => plan.id.startsWith('generated-')))).toEqual([]);
});

test('progression review uses two recent logged sessions and saves approval without changing the plan', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    const now = Date.now();
    const sets = () => [1, 2].map(setNumber => ({ exerciseId: 'bench_flat', setNumber, weight: 40, reps: 11, rir: 2 }));
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'progression-test-plan', title: 'Plan progresji', exercises: [{ key: 'bench_flat', sets: 2, target: '8-10' }] }]));
    localStorage.setItem('gymverse_history', JSON.stringify([
      { id: 'progression-session-a', planId: 'progression-test-plan', date: new Date(now - 14 * 86400000).toISOString(), details: sets() },
      { id: 'progression-session-b', planId: 'progression-test-plan', date: new Date(now - 7 * 86400000).toISOString(), details: sets() }
    ]));
  });
  await page.reload();
  if (await page.locator('#stage6Welcome').isVisible()) await completeOnboarding(page);
  await page.locator('.header-nav [data-act="view"][data-view="view-charts"]').click();
  await page.locator('#chartExerciseSelect').selectOption('bench_flat');
  await expect(page.locator('#progressionReview')).toContainText('wskazówka S13');
  await expect(page.locator('#progressionReview')).toContainText('40 kg');
  await page.locator('[data-act="acceptProgressionReview"]').click();
  await expect(page.locator('#progressionReview')).toContainText('Decyzja zapisana dla tego planu');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans') || '[]').find(plan => plan.id === 'progression-test-plan'));
  expect(stored.progressionReview).toMatchObject({ exerciseId: 'bench_flat', currentLoad: 40, decision: 'user-approved-review' });
  expect(stored.exercises[0]).toMatchObject({ sets: 2, target: '8-10' });
  await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('#migrateDataButton')).toBeVisible();await page.locator('.header-nav [data-view="view-charts"]').click();await expect(page.locator('#progressionReview')).toContainText('Decyzja zapisana dla tego planu');
});

test('manual plan stores a per-exercise rest override and uses it in the workout timer', async ({ page }) => {
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await completeOnboarding(page);
  await page.evaluate(() => localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'manual-rest-plan', title: 'Plan z przerwą', exercises: [{ key: 'bench_flat', sets: 2, target: '6-8' }] }])));
  await page.reload();
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="manual-rest-plan"]').click();
  await page.locator('[data-field="peRest"][data-i="0"]').selectOption('60');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].exercises[0].restSeconds)).toBe(60);
  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await page.locator('[data-act="startPlan"][data-plan="manual-rest-plan"]').click();
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeVisible();
  await expect(page.locator('#restDigits')).toHaveText('01:00');
});

test('manual plan can be assigned to a weekday and is labelled in the plan list', async ({ page }) => {
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await completeOnboarding(page);
  await page.evaluate(() => localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'manual-day-plan', title: 'Plan poniedziałkowy', exercises: [{ key: 'bench_flat', sets: 2, target: '6-8' }] }])));
  await page.reload();
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="manual-day-plan"]').click();
  await page.locator('[data-field="peDayOfWeek"]').selectOption('mon');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].dayOfWeek)).toBe('mon');
  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await expect(page.locator('#planList [data-weekday="mon"]')).toContainText('Plan poniedziałkowy');
  await expect(page.locator('[data-plan="manual-day-plan"]')).toContainText('Poniedziałek');
});

test('manual plan audit shows an estimate and marks custom exercises that lack catalog mapping', async ({ page }) => {
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await completeOnboarding(page);
  await page.evaluate(() => {
    localStorage.setItem('gymverse_custom', JSON.stringify({ c_audit_test: { name: 'Ćwiczenie bez mapowania', group: 'Klatka', bw: false } }));
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'manual-audit-plan', title: 'Plan do analizy', dayOfWeek: 'mon', exercises: [{ key: 'bench_flat', sets: 3, target: '6-8', restSeconds: 60 }, { key: 'c_audit_test', sets: 2, target: '8-12' }] }]));
  });
  await page.reload();
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="manual-audit-plan"]').click();
  await page.locator('[data-act="auditPlan"]').click();
  await expect(page.locator('#manualPlanAudit')).toContainText('Ćwiczenie bez mapowania');
  await expect(page.locator('#manualPlanAudit')).toContainText('wymagają mapowania');
  await expect(page.locator('#manualPlanAudit')).toContainText('orientacyjny');
  await expect(page.locator('#manualPlanAudit')).toContainText('min');
});

test('legacy profile data remains isolated after the existing IndexedDB migration', async ({ page }) => {
  await page.addInitScript(() => {
    if(localStorage.getItem('7a-migration-fixture'))return;
    localStorage.setItem('7a-migration-fixture','1');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'indexeddb-synthetic-plan', title: 'Plan z migracji', exercises: [{ key: 'bench_flat', sets: 2, target: '8-10' }] }]));
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'indexeddb-synthetic-session', date: '2026-11-20T10:00:00.000Z', details: [] }]));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect.poll(() => page.evaluate(() => !!window.__gymverseTestHarness)).toBe(true);
  await expect(page.locator('#migrateDataButton')).toBeVisible();
  const migration = await page.evaluate(async () => {
    const store = window.__gymverseTestHarness.getStore();
    const preview = await store.previewMigration();
    return store.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true });
  });
  expect(migration.status).toBe('activated');
  await page.locator('details summary').filter({ hasText: 'Dodaj profil' }).click();
  await page.locator('#newProfileName').fill('Profil IndexedDB');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('#newProfileAge').fill('31');
  await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();
  await chooseProfileOptions(page,'newProfileEquipment',['machines', 'bench']);
  await page.locator('[data-act="createProfile"]').click();
  await expect.poll(() => page.evaluate(() => window.__gymverseTestHarness?.getStore().get('gymverse_profiles_v1')?.profiles?.length)).toBe(2);
  const state = await page.evaluate(() => window.__gymverseTestHarness.getStore().get('gymverse_profiles_v1'));
  const original = state.profiles.find(profile => profile.id === 'legacy-default-profile');
  expect(original.data.gymverse_history).toContain('indexeddb-synthetic-session');
  expect(state.profiles.find(profile => profile.id === state.activeProfileId).attributes.age).toBe(31);
  await page.locator('#profileSelect').selectOption('legacy-default-profile');
  await page.locator('[data-act="switchProfile"]').click();
  await expect(page.locator('#profileSelect')).toHaveValue('legacy-default-profile');
  await expect(page.locator('#planList')).toContainText('Plan z migracji');
  expect(await page.evaluate(() => window.__gymverseTestHarness.getStore().get('gymverse_history'))).toHaveLength(1);
});

test('IndexedDB legacy interpretations stay isolated by profile', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  const result = await page.evaluate(async () => {
    const { deleteProfileAuxiliary, readCustomMedia, readLegacyInterpretations, replaceProfileAuxiliary, saveLegacyInterpretation } = await import('./src/gv-data.js');
    const makeRule = (id, exerciseId) => ({ id, exerciseId, sessionIds: [`session-${id}`], ruleVersion: 1, source: 'user_confirmed', confirmedAt: '2026-01-02T00:00:00.000Z', interpretation: { unit: id } });
    await saveLegacyInterpretation(makeRule('rule-legacy-default', 'row_machine'));
    await saveLegacyInterpretation(makeRule('rule-default-profile', 'bench_flat'), { profileId: 'legacy-default-profile' });
    await saveLegacyInterpretation(makeRule('rule-profile-one', 'bench_flat'), { profileId: 'profile-one-0001' });
    await saveLegacyInterpretation(makeRule('rule-profile-two', 'leg_press'), { profileId: 'profile-two-0002' });
    const png = name => ({ name: `custom-media/${name}.png`, bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]) });
    await replaceProfileAuxiliary('profile-one-0001', { interpretations: [makeRule('rule-profile-one', 'bench_flat')], media: [png('profile-one')] });
    await replaceProfileAuxiliary('profile-two-0002', { interpretations: [makeRule('rule-profile-two', 'leg_press')], media: [png('profile-two')] });
    const isolated = {
      one: await readLegacyInterpretations({ profileId: 'profile-one-0001' }),
      two: await readLegacyInterpretations({ profileId: 'profile-two-0002' }),
      defaultProfile: await readLegacyInterpretations({ profileId: 'legacy-default-profile' }),
      legacyGlobal: await readLegacyInterpretations(),
      mediaOne: await readCustomMedia({ profileId: 'profile-one-0001' }),
      mediaTwo: await readCustomMedia({ profileId: 'profile-two-0002' })
    };
    await deleteProfileAuxiliary('profile-one-0001');
    return { ...isolated, afterDeleteOne: await readCustomMedia({ profileId: 'profile-one-0001' }), afterDeleteTwo: await readCustomMedia({ profileId: 'profile-two-0002' }) };
  });
  expect(result.one.map(rule => rule.id)).toEqual(['rule-profile-one']);
  expect(result.two.map(rule => rule.id)).toEqual(['rule-profile-two']);
  expect(result.defaultProfile.map(rule => rule.id).sort()).toEqual(['rule-default-profile', 'rule-legacy-default']);
  expect(result.legacyGlobal.map(rule => rule.id)).toEqual(['rule-legacy-default']);
  expect(result.mediaOne.map(item => item.name)).toEqual(['custom-media/profile-one.png']);
  expect(result.mediaTwo.map(item => item.name)).toEqual(['custom-media/profile-two.png']);
  expect(result.afterDeleteOne).toEqual([]);
  expect(result.afterDeleteTwo.map(item => item.name)).toEqual(['custom-media/profile-two.png']);
});

test('profile boot, generator, and progression helper use work offline from the v26 shell cache', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#profileHeading')).toHaveText('Witaj w GymNastika!');
  await expect(page.locator('#profileSelect')).toBeHidden();
  await expect(page.locator('#profileFormDetails')).toHaveJSProperty('open', true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('/sw.js');
  await page.locator('[data-act="stage6CreateProfile"]').click();
  await page.locator('#newProfileName').fill('Profil offline');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('#newProfileAge').fill('29');
  await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();
  await chooseProfileOptions(page,'newProfileEquipment',['machines', 'dumbbells', 'bench', 'cables', 'barbell', 'pullup_bar', 'dip_bars']);
  await page.locator('[data-act="createProfile"]').click();
  await page.locator('#view-plan-choices [data-act="stage6Skip"]').first().click();
  await expect(page.locator('#profileSelect option:checked')).toHaveText('Profil offline');
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('/sw.js');
  await page.context().setOffline(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => typeof window.GymNastikaProgression?.analyzeExerciseProgression)).toBe('function');
  await expect(page.locator('#profileSelect option')).toHaveCount(1);
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('details summary').filter({ hasText: 'Wygeneruj plan' }).click();
  for (let step = 0; step < 9; step += 1) await page.locator('[data-act="generatorNext"]').click();
  await page.locator('[data-act="generatePlan"]').click();
  await expect(page.locator('#generatorPreview')).toBeVisible();
  await page.locator('[data-act="saveGeneratedPreview"]').click();
  await expect(page.locator('#view-program-preview')).toContainText('Do sprawdzenia · Całe ciało · dzień 1');
  await expect(page.locator('#generatorPreview')).not.toBeVisible();
  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="programNew"]').click();
  await expect(page.locator('#view-program-editor')).toBeVisible();
  await page.context().setOffline(false);
});

test('a new user completes setup before using ready plans', async ({ page }) => {
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#profileHeading')).toHaveText('Witaj w GymNastika!');
  await completeOnboarding(page);
  await expect(page.locator('#profileSelect')).toBeVisible();
  await expect(page.locator('#profileWelcome')).toBeHidden();
  await expect(page.locator('#planList')).toContainText('Push A1');
});

test('legacy GymNastika v4 history merges into the chosen profile without overwriting', async ({ page }) => {
  const verifiedFixturePath = join(process.cwd(), 'tests/fixtures/phase0/legacy-7d32975-v4-synthetic.json');
  const fixturePath = join(test.info().outputPath(), 'legacy-v4-with-unknown-exercise.json');
  const legacy = JSON.parse(await readFile(verifiedFixturePath, 'utf8'));
  legacy.history[0].details.push({ exerciseId: 'legacy_unknown_001', exerciseName: 'Historyczne ćwiczenie bez mapowania', setNumber: 1, weight: 25, reps: 7, date: legacy.history[0].date });
  await writeFile(fixturePath, JSON.stringify(legacy));
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await completeOnboarding(page);
  await page.locator('details summary').filter({ hasText: 'Dodaj profil' }).click();
  await page.locator('#newProfileName').fill('Profil importu');
  await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();
  await page.locator('[data-act="createProfile"]').click();
  await expect(page.locator('#profileSelect option')).toHaveCount(2);
  const targetId = await page.locator('#profileSelect').inputValue();
  const profileIds = await page.locator('#profileSelect option').evaluateAll(options => options.map(option => option.value));
  const untouchedId = profileIds.find(id => id !== targetId);
  expect(untouchedId).toBeTruthy();

  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await page.locator('#profileManage [data-act="legacyImportBtn"]').click();
  await page.locator('#importFile').setInputFiles(fixturePath);
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain('Starsza GymNastika v4 → profil „Profil importu”');
  expect(dialogs[0]).toContain('Treningi: 1 nowych z 1; serie: 5; ćwiczenia: 2 rozpoznanych, 1 nierozpoznanych');
  expect(dialogs[0]).toContain('istniejące treningi nie są nadpisywane');
  await expect(page.locator('#toast')).toContainText('Dołączono: 1 treningów, 1 pomiarów wagi');
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('gymverse_history')))).toHaveLength(1);
  const importedHistory = JSON.parse(await page.evaluate(() => localStorage.getItem('gymverse_history')));
  expect(importedHistory[0].details.find(detail => detail.exerciseId === 'legacy_unknown_001')).toMatchObject({ exerciseName: 'Historyczne ćwiczenie bez mapowania', weight: 25, reps: 7 });
  await page.locator('.header-nav [data-act="view"][data-view="view-history"]').click();
  await page.locator('#historyList [data-act="histToggle"]').first().click();
  await expect(page.locator('#historyList')).toContainText('Historyczne ćwiczenie bez mapowania');
  await expect(page.locator('#historyList')).toContainText('wymaga mapowania');
  await expect(page.locator('#historyList')).toContainText('25×7');
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('gymverse_last_weights'))).bench_flat).toEqual(legacy.lastWeights.bench_flat);
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('gymverse_plans')))).toHaveLength(1);
  const untouched = await page.evaluate(id => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).profiles.find(profile => profile.id === id), untouchedId);
  expect(JSON.parse(untouched.data.gymverse_history || '[]')).toEqual([]);

  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await page.locator('#profileManage [data-act="legacyImportBtn"]').click();
  await page.locator('#importFile').setInputFiles(fixturePath);
  await expect(page.locator('#toast')).toContainText('kopia nie zawiera innych nowych danych');
  expect(dialogs).toHaveLength(1);
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('gymverse_history')))).toHaveLength(1);
  expect(await page.evaluate(id => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).activeProfileId, targetId)).toBe(targetId);
});
