import { test, expect } from '@playwright/test';

// Older workout scenarios continue after explicitly skipping the new rest screen.
test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('#restScreen:not([hidden])'), async () => { await page.waitForFunction(() => document.querySelector('#sessionSaveStatus').hidden); await page.locator('#restScreen [data-act="timerSkip" ]').click(); }); });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion:1, activeProfileId:'base-b-profile', profiles:[{ id:'base-b-profile', name:'Profil syntetyczny', attributes:{}, data:{} }] }));
  });
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').waitFor();
});

async function startPushA1(page) {
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
}

async function uploadSyntheticBackup(page, backup) {
  await page.locator('#importFile').setInputFiles({
    name: 'synthetic-v4.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup))
  });
}

async function keepLegacyV4Merge(dialog) {
  if (dialog.message().startsWith('OK = pełne odtworzenie JSON v4')) await dialog.dismiss();
  else await dialog.accept();
}

const syntheticBackup = () => ({
  app: 'gymverse', version: 4, exportedAt: '2026-01-01T00:00:00.000Z',
  history: [{ date: '2026-01-01T10:00:00.000Z', planId: 'push_a1', planTitle: 'Push A1', details: [{ exerciseId: 'bench_flat', exerciseName: 'Wyciskanie leżąc', setNumber: 1, weight: 40, reps: 8, date: '2026-01-01T10:00:00.000Z' }] }],
  lastWeights: {},
  body: [{ date: '2026-01-01', kg: 80 }],
  plans: [{ id: 'synthetic_plan', title: 'Plan testowy', exercises: [{ key: 'c_synthetic', sets: 1, target: '8-12' }] }],
  custom: { c_synthetic: { name: 'Ćwiczenie testowe', group: 'Klatka', bw: false } }
});

test('imports a zero-weight bodyweight set from a new custom exercise in legacy v4', async ({ page }) => {
  const backup = syntheticBackup();
  backup.custom.c_synthetic.bw = true;
  backup.history[0].details = [{ exerciseId: 'c_synthetic', exerciseName: 'Ćwiczenie testowe', setNumber: 1, weight: 0, reps: 10 }];
  page.on('dialog', keepLegacyV4Merge);
  await uploadSyntheticBackup(page, backup);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]').length)).toBe(1);
  const state = await page.evaluate(() => ({ history: JSON.parse(localStorage.getItem('gymverse_history')), custom: JSON.parse(localStorage.getItem('gymverse_custom')) }));
  expect(state.history[0].details).toMatchObject([{ exerciseId: 'c_synthetic', weight: 0, reps: 10 }]);
  expect(state.custom.c_synthetic.bw).toBe(true);
});

test('restores v4 lastWeights absent from history while retaining newer local values', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('gymverse_last_weights', JSON.stringify({ bench_flat: [{ weight: 75, reps: 5 }] })));
  await page.reload();
  const backup = syntheticBackup();
  backup.lastWeights = {
    bench_flat: [{ weight: 40, reps: 8 }],
    row_v: [{ weight: 50, reps: 10 }]
  };
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await keepLegacyV4Merge(dialog); });
  await uploadSyntheticBackup(page, backup);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_last_weights') || '{}').row_v)).toEqual([{ weight: 50, reps: 10 }]);
  const weights = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_last_weights')));
  expect(weights.bench_flat).toEqual([{ weight: 75, reps: 5 }]);
  expect(dialogs.some(message => /lokaln.*ciężar/i.test(message))).toBe(true);
});

test('imports valid v4 lastWeights even when the backup has no new history', async ({ page }) => {
  const backup = syntheticBackup();
  backup.history = [];
  backup.body = [];
  backup.plans = [];
  backup.custom = {};
  backup.lastWeights = { row_v: [{ weight: 52, reps: 9 }] };
  page.on('dialog', keepLegacyV4Merge);
  await uploadSyntheticBackup(page, backup);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_last_weights') || '{}').row_v))
    .toEqual([{ weight: 52, reps: 9 }]);
});

test('uses a saved v4 history result instead of the unrelated lastWeights hint', async ({ page }) => {
  const backup = syntheticBackup();
  backup.plans = [];
  backup.custom = {};
  backup.lastWeights = { bench_flat: [{ weight: 65, reps: 6 }] };
  page.on('dialog', keepLegacyV4Merge);
  await uploadSyntheticBackup(page, backup);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_last_weights') || '{}').bench_flat))
    .toEqual([{ weight: 65, reps: 6 }]);
  await page.reload();
  await startPushA1(page);
  await expect(page.locator('#setsBody .prev-val[data-i="0"]')).toHaveText('40 kg × 8');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_last_weights')).bench_flat)).toEqual([{ weight: 65, reps: 6 }]);
});

test('merges v4 sessions with the same timestamp and deduplicates an identical repeated import by multiplicity', async ({ page }) => {
  const backup = syntheticBackup();
  const date = '2026-01-01T10:00:00.000Z';
  backup.history = [
    { date, planId: 'push_a1', planTitle: 'Push A1', details: [{ exerciseId: 'bench_flat', exerciseName: 'Bench', setNumber: 1, weight: 40, reps: 8, date }] },
    { date, planId: 'pull_a1', planTitle: 'Pull A1', details: [{ exerciseId: 'lat_pulldown_wide', exerciseName: 'Pulldown', setNumber: 1, weight: 55, reps: 9, date }] },
    { date, planId: 'push_a1', planTitle: 'Push A1', details: [{ exerciseId: 'bench_flat', exerciseName: 'Bench', setNumber: 1, weight: 40, reps: 8, date }] }
  ];
  page.on('dialog', keepLegacyV4Merge);
  await uploadSyntheticBackup(page, backup);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]').length)).toBe(3);
  await uploadSyntheticBackup(page, backup);
  const sessions = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]'));
  expect(sessions).toHaveLength(3);
  expect(new Set(sessions.map(session => session.id)).size).toBe(3);
  expect(sessions.every(session => session.details[0].id)).toBe(true);
});

test('rejects an uninterpretable imported series without changing history', async ({ page }) => {
  const backup = syntheticBackup();
  backup.history[0].details[0].exerciseId = 'unknown_synthetic';
  const before = await page.evaluate(() => localStorage.getItem('gymverse_history'));
  const dialogs = [];
  page.on('dialog', dialog => { dialogs.push(dialog.message()); return dialog.dismiss(); });
  await uploadSyntheticBackup(page, backup);
  await expect.poll(() => page.locator('#toast').textContent()).toMatch(/nie można bezpiecznie odczytać serii/i);
  expect(dialogs).toHaveLength(0);
  expect(await page.evaluate(() => localStorage.getItem('gymverse_history'))).toBe(before);
});

test('final-step completion asks before saving an incomplete session and shows real X/Y', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await startPushA1(page);
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  for (let i = 0; i < 4; i += 1) await page.locator('#btnNextStep').click();
  await expect(page.locator('#metaExerciseProgress')).toContainText('1/17');
  await expect(page.locator('#btnNextStep')).toBeHidden();
  await page.locator('[data-act="finish"]').click();
  expect(dialogs.some(message => /1\s*\/\s*17/.test(message))).toBe(true);
  const state = await page.evaluate(() => ({ active: localStorage.getItem('gymverse_active'), history: localStorage.getItem('gymverse_history') }));
  expect(state.active).not.toBeNull();
  expect(JSON.parse(state.history || '[]')).toHaveLength(0);
});

test('zero-set termination requires confirmation and preserves the active workout when declined', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await startPushA1(page);
  await page.getByRole('button', { name: /zakończ i zapisz trening/i }).click();
  expect(dialogs.some(message => /0\s*\/\s*17/.test(message))).toBe(true);
  const active = await page.evaluate(() => localStorage.getItem('gymverse_active'));
  expect(active).not.toBeNull();
});

test('manual finish confirms an incomplete session using the adjusted set count', async ({ page }) => {
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await startPushA1(page);
  await page.locator('.workout-extras > summary').click();
  await page.locator('#btnRemoveSet').click();
  await expect(page.locator('#metaExerciseProgress')).toContainText('0/16');
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await page.getByRole('button', { name: /zakończ i zapisz trening/i }).click();
  expect(dialogs.some(message => /1\s*\/\s*16/.test(message))).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('gymverse_active'))).not.toBeNull();
});

test('uncommitted inputs survive a reload and are clearly marked until the set is saved', async ({ page }) => {
  await startPushA1(page);
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gymverse_draft_v1'))).not.toBeNull();
  await page.reload();
  await page.getByRole('button', { name: 'Wznów' }).click();
  await expect(page.locator('#weight_0')).toHaveValue('40');
  await expect(page.locator('#reps_0')).toHaveValue('8');
  await expect(page.getByText('Wpis niezatwierdzony')).toBeVisible();
  await page.locator('#btnNextStep').click();
  await page.locator('#btnPrev').click();
  await expect(page.locator('#weight_0')).toHaveValue('40');
  await expect(page.locator('#reps_0')).toHaveValue('8');
  await page.locator('#btnDone_0').click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gymverse_draft_v1'))).toBeNull();
});

test('pagehide and hidden visibility preserve drafts when workout inputs exist or are unmounted', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await startPushA1(page);
  await page.locator('#weight_0').fill('42.5');
  await page.locator('#reps_0').fill('9');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_draft_v1') || '{"items":[]}').items))
    .toContainEqual(expect.objectContaining({ weight: '42.5', reps: '9', step: 0, setNumber: 1 }));

  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  const savedDraft = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_draft_v1')));
  expect(savedDraft.items).toContainEqual(expect.objectContaining({ weight: '42.5', reps: '9' }));

  await page.evaluate(() => {
    document.querySelector('#weight_0')?.remove();
    document.querySelector('#reps_0')?.remove();
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_draft_v1')))).toEqual(savedDraft);
  expect(await page.evaluate(() => localStorage.getItem('gymverse_active'))).not.toBeNull();
  expect(pageErrors).toEqual([]);

  await page.reload();
  await page.getByRole('button', { name: 'Wznów' }).click();
  await expect(page.locator('#weight_0')).toHaveValue('42.5');
  await expect(page.locator('#reps_0')).toHaveValue('9');
});

test('pagehide without an active workout leaves training storage unchanged', async ({ page }) => {
  const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
  expect(after).toEqual(before);
  expect(pageErrors).toEqual([]);
});

test('pagehide saves the last input snapshot when the workout form is unmounted before debounce', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await startPushA1(page);
  await page.locator('#weight_0').fill('37.5');
  await page.locator('#reps_0').fill('11');
  await page.evaluate(() => {
    document.querySelector('#weight_0')?.remove();
    document.querySelector('#reps_0')?.remove();
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
  });
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_draft_v1') || '{"items":[]}'));
  expect(draft.items).toContainEqual(expect.objectContaining({ weight: '37.5', reps: '11', step: 0, setNumber: 1 }));
  expect(await page.evaluate(() => localStorage.getItem('gymverse_active'))).not.toBeNull();
  expect(pageErrors).toEqual([]);
});

test('weight changed by a programmatic button is drafted and restored after reload', async ({ page }) => {
  await startPushA1(page);
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await page.locator('.workout-extras > summary').click();
  await page.locator('[data-act="copyPrev"]').click();
  await page.locator('[data-act="wstep"][data-d="2.5"]').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_draft_v1') || '{"items":[]}').items))
    .toContainEqual(expect.objectContaining({ weight: '42.5', reps: '8' }));
  await page.reload();
  await page.getByRole('button', { name: 'Wznów' }).click();
  await expect(page.locator('#weight_1')).toHaveValue('42.5');
  await expect(page.locator('#reps_1')).toHaveValue('8');
  await expect(page.getByText('Wpis niezatwierdzony')).toBeVisible();
});

test('finishing a different workout preserves saved weights absent from history', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('gymverse_last_weights', JSON.stringify({ legacy_orphan: [{ weight: 35, reps: 10 }] })));
  await page.reload();
  await startPushA1(page);
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: /zakończ i zapisz trening/i }).click();
  await expect(page.getByText('Trening zaliczony!')).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_last_weights')));
  expect(stored.legacy_orphan).toEqual([{ weight: 35, reps: 10 }]);
});

test('confirmed workout abandonment removes its active session and draft', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await startPushA1(page);
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gymverse_draft_v1'))).not.toBeNull();
  await page.locator('[data-act="discard"]').click();
  expect(await page.evaluate(() => localStorage.getItem('gymverse_active'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('gymverse_draft_v1'))).toBeNull();
});

test('a failed completion save keeps the active session and offers an emergency JSON backup', async ({ page }) => {
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: ({ files }) => { window.__sharedEmergencyFile = files[0]; return Promise.resolve(); }, configurable: true });
  });
  await startPushA1(page);
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gymverse_last_weights') throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  await page.getByRole('button', { name: /zakończ i zapisz trening/i }).click();
  await expect(page.locator('#fileDeliveryPrompt')).toBeVisible();
  await page.locator('[data-act="deliverPreparedFile"]').click();
  await expect.poll(() => page.evaluate(() => !!window.__sharedEmergencyFile)).toBe(true);
  const backup = await page.evaluate(async () => JSON.parse(await window.__sharedEmergencyFile.text()));
  const state = await page.evaluate(() => ({ active: localStorage.getItem('gymverse_active'), history: localStorage.getItem('gymverse_history'), toast: document.querySelector('#toast').textContent }));
  expect(dialogs.some(message => /awaryjn/i.test(message))).toBe(true);
  expect(backup.version).toBe(4);
  expect(backup.history).toHaveLength(1);
  expect(backup.activeWorkout.sets).toHaveLength(1);
  expect(state.active).not.toBeNull();
  expect(JSON.parse(state.history || '[]')).toHaveLength(0);
  expect(state.toast).not.toContain('Trening zaliczony!');
});

test('rejecting a synthetic backup import leaves custom exercises, plans and history unchanged', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('gymverse_history', '[]'));
  const dialogs = [];
  let resolveMerge;
  const mergeConfirmation = new Promise(resolve => { resolveMerge = resolve; });
  page.on('dialog', async dialog => {
    if (dialog.message().startsWith('OK = pełne odtworzenie JSON v4')) { await dialog.dismiss(); return; }
    dialogs.push(dialog.message());
    await dialog.dismiss();
    resolveMerge();
  });
  const before = await page.evaluate(() => ({
    custom: localStorage.getItem('gymverse_custom'),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history'),
    body: localStorage.getItem('gymverse_body')
  }));
  await uploadSyntheticBackup(page, syntheticBackup());
  await mergeConfirmation;
  const state = await page.evaluate(() => ({
    custom: localStorage.getItem('gymverse_custom'),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history'),
    body: localStorage.getItem('gymverse_body')
  }));
  expect(dialogs).toHaveLength(1);
  expect(state).toEqual(before);
});

test('a malformed synthetic import changes no state and is rejected before confirmation', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('gymverse_history', '[]'));
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  const before = await page.evaluate(() => ({
    custom: localStorage.getItem('gymverse_custom'),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history'),
    body: localStorage.getItem('gymverse_body')
  }));
  const malformed = syntheticBackup();
  malformed.history[0].date = 'not-a-date';
  await uploadSyntheticBackup(page, malformed);
  await expect.poll(() => page.evaluate(() => document.querySelector('#toast').textContent)).toContain('Błąd');
  expect(dialogs).toHaveLength(0);
  const after = await page.evaluate(() => ({
    custom: localStorage.getItem('gymverse_custom'),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history'),
    body: localStorage.getItem('gymverse_body')
  }));
  expect(after).toEqual(before);
});

test('a failed synthetic import save rolls back persisted state and does not publish partial data', async ({ page }) => {
  const before = await page.evaluate(() => ({
    custom: localStorage.getItem('gymverse_custom'),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history'),
    body: localStorage.getItem('gymverse_body')
  }));
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gymverse_body') throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  page.on('dialog', dialog => dialog.accept());
  await uploadSyntheticBackup(page, syntheticBackup());
  await expect.poll(() => page.evaluate(() => document.querySelector('#toast').textContent)).toContain('Brak miejsca');
  const state = await page.evaluate(() => ({
    custom: localStorage.getItem('gymverse_custom'),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history'),
    body: localStorage.getItem('gymverse_body')
  }));
  expect(state).toEqual(before);
});

test('an import with failed rollback warns about uncertain integrity and offers the available JSON export', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: ({ files }) => { window.__sharedEmergencyFile = files[0]; return Promise.resolve(); }, configurable: true });
  });
  await page.reload();
  await page.evaluate(() => localStorage.setItem('gymverse_body', '[]'));
  await page.reload();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gymverse_body') throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
  });
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  await uploadSyntheticBackup(page, syntheticBackup());
  await expect(page.locator('#fileDeliveryPrompt')).toBeVisible();
  await page.locator('[data-act="deliverPreparedFile"]').click();
  await expect.poll(() => page.evaluate(() => !!window.__sharedEmergencyFile)).toBe(true);
  const backup = await page.evaluate(async () => JSON.parse(await window.__sharedEmergencyFile.text()));
  expect(dialogs.some(message => /integralność.*niepewna/i.test(message))).toBe(true);
  expect(dialogs.some(message => /awaryjn/i.test(message))).toBe(true);
  expect(backup.version).toBe(4);
  expect(await page.evaluate(() => document.querySelector('#toast').textContent)).not.toMatch(/Dane nie zostały zmienione/i);
});
