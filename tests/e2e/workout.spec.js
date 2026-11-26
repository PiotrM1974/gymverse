import { test, expect } from '@playwright/test';

// Older workout scenarios continue after explicitly skipping the new rest screen.
test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('#restScreen:not([hidden])'), async () => { await page.waitForFunction(() => document.querySelector('#sessionSaveStatus').hidden); await page.locator('#restScreen [data-act="timerSkip" ]').click(); }); });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.evaluate(() => {
    const plan = { id: 'push_a1', title: 'Push A1', exercises: [{ key: 'bench_flat', variantId: 'default', sets: 2, target: '8-12', restSeconds: 90 }] };
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([plan]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({
      schemaVersion: 1,
      activeProfileId: 'workout-e2e-profile',
      profiles: [{ id: 'workout-e2e-profile', name: 'Profil testowy', attributes: { age: 30, trainingGoal: 'hypertrophy', equipment: ['barbell', 'bench'], restrictions: [] }, data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [] } }]
    }));
  });
  await page.reload();
  await expect(page.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
});

async function keepLegacyV4Merge(dialog) {
  if (dialog.message().startsWith('OK = pełne odtworzenie JSON v4')) await dialog.dismiss();
  else await dialog.accept();
}

test('starts the first plan, records a set, finishes, survives reload and imports synthetic backup v4', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', keepLegacyV4Merge);
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await page.getByRole('button', { name: /zakończ i zapisz trening/i }).click();
  await expect(page.getByText('Trening zaliczony!')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gymverse_active'))).toBeNull();
  const firstSession = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]')[0]);
  expect(firstSession.id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(firstSession.details[0].id).toMatch(/^[0-9a-f-]{36}$/i);
  await page.reload();
  expect(pageErrors).toEqual([]);
  const reloadedSession = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]')[0]);
  expect(reloadedSession.id).toBe(firstSession.id);
  expect(reloadedSession.details[0].id).toBe(firstSession.details[0].id);
  await page.getByRole('button', { name: 'Historia' }).click();
  await expect(page.locator('#historyList').getByText('Push A1')).toBeVisible();
  await page.locator('#importFile').setInputFiles('tests/fixtures/backup-v4.json');
  await expect(page.getByText(/Dołączono/)).toBeVisible({ timeout: 3000 });
});
