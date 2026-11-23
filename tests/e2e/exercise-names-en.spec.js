import { test, expect } from '@playwright/test';

test('shows English built-in exercise names without rewriting saved names', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_custom', JSON.stringify({ c_synthetic: { name: 'Moje ćwiczenie', group: 'Klatka', bw: false } }));
    localStorage.setItem('gymverse_history', JSON.stringify([{
      id: 'synthetic-session', date: '2026-11-01T12:00:00.000Z', planId: 'push_a1', planTitle: 'Push A1',
      details: [
        { id: 'synthetic-set', exerciseId: 'bench_flat', exerciseName: 'Wyciskanie sztangi na ławce płaskiej', setNumber: 1, weight: 40, reps: 8 },
        { id: 'synthetic-custom-set', exerciseId: 'c_synthetic', exerciseName: 'Moje ćwiczenie', setNumber: 1, weight: 20, reps: 10 }
      ]
    }]));
  });
  await page.reload();
  const missingNames = await page.evaluate(async () => {
    const { EXERCISE_CATALOG } = await import('/src/exercise/catalog.js');
    return EXERCISE_CATALOG.map(exercise => exercise.id).filter(id => !window.GymNastikaExerciseNames?.[id]);
  });
  expect(missingNames).toEqual([]);

  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="push_a1"]').click();
  await expect(page.locator('#planEditBody')).toContainText('Incline Dumbbell Press');
  await expect(page.locator('#peAddSelect option[value="tri_machine"]')).toHaveText('Machine Triceps Extension');
  await page.getByRole('button', { name: 'Plany', exact: true }).click();

  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await expect(page.locator('#currentExName')).toHaveText('Barbell Bench Press');
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await expect(page.locator('#anatomyAtlas .anatomy-atlas')).toHaveAttribute('aria-label', /Barbell Bench Press/);

  await page.getByRole('button', { name: 'Historia' }).click();
  await page.locator('#historyList [data-act="histToggle"]').first().click();
  await expect(page.locator('#historyList')).toContainText('Barbell Bench Press');
  await expect(page.locator('#historyList')).toContainText('Moje ćwiczenie');
  const storedName = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history'))[0].details[0].exerciseName);
  expect(storedName).toBe('Wyciskanie sztangi na ławce płaskiej');
});
