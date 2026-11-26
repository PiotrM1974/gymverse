import { test, expect } from '@playwright/test';

test('history at 390 px labels legacy volume for a completed 85 kg by 10 set', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    if(localStorage.getItem('7b-volume-fixture'))return;
    localStorage.setItem('7b-volume-fixture','1');
    localStorage.setItem('gymverse_history', JSON.stringify([{
      date: '2026-01-05T10:00:00.000Z',
      planId: 'synthetic_plan',
      planTitle: 'Trening testowy',
      details: [{ exerciseId: 'leg_press', variantId: 'high_feet', exerciseName: 'Suwnica', setNumber: 1, weight: 85, reps: 10 }]
    }]));
  });
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button', { name: 'Kopie bezpieczeństwa' }).click();
  await expect(page.locator('#migrateDataButton')).toBeVisible();
  await page.getByRole('button', { name: 'Historia' }).click();
  const stats = page.locator('.hist-stats').first();
  await expect(stats).toContainText('Objętość: 850 kg');
  await expect(stats).toContainText('10 powt.');
  await expect(stats).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const record = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history'))[0]);
  expect(record.details[0]).toMatchObject({ exerciseId: 'leg_press', variantId: 'high_feet', weight: 85, reps: 10 });
});
