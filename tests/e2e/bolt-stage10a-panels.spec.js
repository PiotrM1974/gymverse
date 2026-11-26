import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function start(page, restSeconds = null) {
  await page.addInitScript(customRest => {
    if (sessionStorage.getItem('stage10a-panels')) return;
    sessionStorage.setItem('stage10a-panels', '1');
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'push_a1', title: 'Push A1', exercises: [{ key: 'bench_flat', sets: 2, target: '8-12', ...(customRest == null ? {} : { restSeconds: customRest }) }] }]));
  }, restSeconds);
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await expect(page.locator('#setsBody .set-row')).toHaveCount(2);
}

test('advanced panels start closed, preserve draft and controls, and keep the exercise rest visible', async ({ page }, info) => {
  test.setTimeout(60000);
  const out = `outputs/GV-BOLT-STAGE10A/panels/${info.project.name}`;
  await mkdir(out, { recursive: true });
  await start(page);
  const extras = page.locator('.workout-extras');
  const settings = page.locator('.workout-rest-settings');
  for (const theme of ['light', 'dark']) for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await expect(extras).not.toHaveAttribute('open', '');
    await expect(settings).not.toHaveAttribute('open', '');
    await expect(page.locator('.exercise-rest-options button')).toHaveCount(4);
    await expect(page.locator('.exercise-rest-options button').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} ${width}`).toBe(true);
    if (width === 390) await page.screenshot({ path: `${out}/collapsed-${theme}-390.png`, fullPage: true, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#weight_0').fill('42,5');
  await page.locator('#reps_0').fill('9');
  await extras.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(extras).toHaveAttribute('open', '');
  for (const action of ['wstep', 'copyPrev', 'plates', 'addSet', 'removeSet', 'rir']) await expect(extras.locator(`[data-act="${action}"]`).first()).toBeVisible();
  await page.locator('[data-act="wstep"][data-d="2.5"]').click();
  await expect(page.locator('#weight_0')).toHaveValue('45');
  await page.locator('[data-act="plates"]').click();
  await expect(page.locator('#platesBox')).toBeVisible();
  await page.locator('[data-act="rir"][data-v="2"]').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')).rir['0'])).toBe(2);
  await page.locator('[data-act="addSet"]').click();
  await expect(page.locator('#setsBody .set-row')).toHaveCount(3);
  await page.locator('[data-act="removeSet"]').click();
  await expect(page.locator('#setsBody .set-row')).toHaveCount(2);
  await extras.locator('summary').click();
  await expect(extras).not.toHaveAttribute('open', '');
  await expect(page.locator('#weight_0')).toHaveValue('45');
  await expect(page.locator('#reps_0')).toHaveValue('9');
  await settings.locator('summary').click();
  await expect(settings).toHaveAttribute('open', '');
  await expect(settings.locator('.rest-row button')).toHaveCount(5);
  await page.locator('[data-act="rest"][data-sec="240"]').click();
  await expect(page.locator('#exerciseRestCurrent')).toContainText('4:00');
  await settings.locator('summary').click();
  await expect(settings).not.toHaveAttribute('open', '');
  await expect(page.locator('#weight_0')).toHaveValue('45');
  await extras.locator('summary').click();
  await settings.locator('summary').click();
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; scrollTo(0, 0); });
  await page.screenshot({ path: `${out}/expanded-dark-390.png`, fullPage: true, animations: 'disabled' });
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeVisible();
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')))).sets[0]).toMatchObject({ weight: 45, reps: 9 });
  await page.locator('#restScreen [data-act="timerSkip"]').click();
  await expect(page.locator('#weight_1')).toBeVisible();
  await extras.locator('summary').click();
  await expect(extras).not.toHaveAttribute('open', '');
  await page.locator('#weight_1').fill('47,5');
  await page.locator('#reps_1').fill('8');
  await extras.locator('summary').click();
  await extras.locator('summary').click();
  await expect(page.locator('#weight_1')).toHaveValue('47,5');
  await expect(page.locator('#reps_1')).toHaveValue('8');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_draft_v1') || '{"items":[]}').items.some(item => item.setNumber === 2 && item.weight === '47,5'))).toBe(true);
  await page.reload();
  await page.locator('[data-act="resume"]').click();
  await expect(page.locator('#weight_1')).toHaveValue('47,5');
  await expect(page.locator('#reps_1')).toHaveValue('8');
  await expect(extras).not.toHaveAttribute('open', '');
  await expect(settings).not.toHaveAttribute('open', '');
});

test('exercise rest keeps precedence over the general setting, including a custom value', async ({ page }) => {
  await start(page);
  await page.locator('.workout-rest-settings > summary').click();
  await page.locator('[data-act="rest"][data-sec="240"]').click();
  await expect(page.locator('#exerciseRestCurrent')).toContainText('4:00');
  await page.locator('[data-act="exerciseRest"][data-sec="120"]').click();
  await expect(page.locator('#exerciseRestCurrent')).toContainText('2:00');
  await page.locator('[data-act="rest"][data-sec="90"]').click();
  await expect(page.locator('#exerciseRestCurrent')).toContainText('2:00');
});

test('a nonpreset exercise rest survives the collapsed general settings and drives the timer', async ({ page }) => {
  await start(page, 90);
  await expect(page.locator('#exerciseRestCurrent')).toContainText('1:30');
  await page.locator('.workout-rest-settings > summary').click();
  await page.locator('[data-act="rest"][data-sec="240"]').click();
  await expect(page.locator('#exerciseRestCurrent')).toContainText('1:30');
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeVisible();
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')))).restState.duration).toBe(90);
});
