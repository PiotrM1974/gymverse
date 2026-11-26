import { test, expect } from '@playwright/test';

async function seedIllustrationPlans(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear(); localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([
      { id: 'push_a2', title: 'Push A2', exercises: [{ key: 'db_bench', sets: 3, target: '8-10' }, { key: 'db_fly', sets: 3, target: '10-12' }, { key: 'front_raise', sets: 2, target: '12-15' }, { key: 'lat_raise_seated', sets: 3, target: '12-15' }, { key: 'tri_machine', sets: 3, target: '10-12' }, { key: 'leg_press', variantId: 'high_feet', sets: 3, target: '12-15' }] },
      { id: 'pull_a2', title: 'Pull A2', exercises: [{ key: 'lat_pulldown_neutral', sets: 3, target: '10-12' }, { key: 'row_straight', sets: 3, target: '10-12' }, { key: 'rear_delt', sets: 3, target: '15' }, { key: 'biceps_preacher', sets: 3, target: '12-15' }, { key: 'leg_curl', sets: 3, target: '12-15' }] }
    ]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'legacy-image-profile', profiles: [{ id: 'legacy-image-profile', name: 'Test ilustracji', attributes: { age: 34, trainingGoal: 'fitness' }, data: {} }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
}

test('legacy JPEG files remain available while plan cards use approved illustrations', async ({ page }) => {
  await seedIllustrationPlans(page);

  for (const [plan, steps] of [
    ['push_a2', ['p2_1', 'p2_2', 'p2_3', 'p2_4', 'p2_5']],
    ['pull_a2', [null, null, null, 'pl2_4', 'pl2_5']]
  ]) {
    await page.locator(`[data-act="startPlan"][data-plan="${plan}"]`).click();
    await page.locator('.exercise-hero > summary').click();
    for (const [step, imageId] of steps.entries()) {
      if (step) await page.locator('#btnNextStep').click();
      if (imageId) {
        const legacy = await page.request.get(`/img/${imageId}.jpeg`);
        expect(legacy.ok(), imageId).toBe(true);
        expect(legacy.headers()['content-type']).toContain('image/jpeg');
      }
      await expect(page.locator('#currentExImg')).toBeHidden();
      await expect(page.locator('#exercisePresentationImage')).toBeVisible();
      await expect.poll(() => page.locator('#exercisePresentationImage').evaluate(image => image.naturalWidth)).toBe(768);
      await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', /.+/);
    }
    if (plan !== 'pull_a2') await seedIllustrationPlans(page);
  }
});
