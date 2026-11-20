import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
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

const syntheticBackup = () => ({
  app: 'gymverse', version: 4, exportedAt: '2026-01-01T00:00:00.000Z',
  history: [{ date: '2026-01-01T10:00:00.000Z', planId: 'push_a1', planTitle: 'Push A1', details: [{ exerciseId: 'bench_flat', exerciseName: 'Wyciskanie leżąc', setNumber: 1, weight: 40, reps: 8, date: '2026-01-01T10:00:00.000Z' }] }],
  lastWeights: {},
  body: [{ date: '2026-01-01', kg: 80 }],
  plans: [{ id: 'synthetic_plan', title: 'Plan testowy', exercises: [{ key: 'c_synthetic', sets: 1, target: '8-12' }] }],
  custom: { c_synthetic: { name: 'Ćwiczenie testowe', group: 'Klatka', bw: false } }
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
  await page.locator('#btnNextStep').click();
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

test('a failed completion save keeps the active session and downloads an emergency JSON backup', async ({ page }, testInfo) => {
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
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /zakończ i zapisz trening/i }).click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath(await download.suggestedFilename());
  await download.saveAs(backupPath);
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
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
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  const before = await page.evaluate(() => ({
    custom: localStorage.getItem('gymverse_custom'),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history'),
    body: localStorage.getItem('gymverse_body')
  }));
  const dialogPromise = page.waitForEvent('dialog');
  await uploadSyntheticBackup(page, syntheticBackup());
  await dialogPromise;
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
