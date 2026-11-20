import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
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
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]'))).toHaveLength(1);
  await page.reload();
  expect(pageErrors).toEqual([]);
  await page.getByRole('button', { name: 'Historia' }).click();
  await expect(page.locator('#historyList').getByText('Push A1')).toBeVisible();
  await page.locator('#importFile').setInputFiles('tests/fixtures/backup-v4.json');
  await expect(page.getByText(/Dołączono/)).toBeVisible({ timeout: 3000 });
});
