import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function seed(page, plans = [{ id: 'push_a1', title: 'Push A1', exercises: [{ key: 'bench_flat', sets: 2, target: '8-12', restSeconds: 90 }, { key: 'leg_press', sets: 2, target: '8-12', restSeconds: 90 }] }]) {
  await page.addInitScript(items => {
    if (sessionStorage.getItem('active-set-fixture')) return;
    sessionStorage.setItem('active-set-fixture', '1');
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify(items));
  }, plans);
  await page.goto('/');
  await expect(page.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
}

async function saveSet(page, index) {
  await page.locator(`#weight_${index}`).fill('40');
  await page.locator(`#reps_${index}`).fill('8');
  await page.locator(`#btnDone_${index}`).click();
  await expect(page.locator(`#btnDone_${index}`)).toHaveClass(/completed/);
}

test('active row uses a slim blue mark, keeps five columns and follows confirmed sets', async ({ page }, info) => {
  test.setTimeout(60000);
  const out = `outputs/GV-BOLT-STAGE10A/active-set/after/${info.project.name}`;
  await mkdir(out, { recursive: true });
  await seed(page);
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  for (const theme of ['light', 'dark']) for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const row = await page.locator('#setsBody .set-row').first().evaluate(element => {
      const cells = [...element.querySelectorAll('td')];
      const bounds = cells.map(cell => cell.getBoundingClientRect());
      return {
        active: element.classList.contains('is-current'),
        barWidth: getComputedStyle(cells[0], '::after').width,
        barColor: getComputedStyle(cells[0], '::after').backgroundColor,
        numberColor: getComputedStyle(cells[0]).color,
        topBorder: getComputedStyle(cells[0]).borderTopWidth,
        sameLine: Math.max(...bounds.map(box => box.y + box.height / 2)) - Math.min(...bounds.map(box => box.y + box.height / 2)) < 5,
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        differentBackground: getComputedStyle(cells[0]).backgroundColor !== getComputedStyle(element.nextElementSibling.querySelector('td')).backgroundColor
      };
    });
    expect(row, `${theme} ${width}`).toMatchObject({ active: true, barWidth: '3px', topBorder: '0px', sameLine: true, noOverflow: true, differentBackground: true });
    expect(row.barColor).toBe(row.numberColor);
    await expect(page.locator('#setsBody .set-row.is-current')).toHaveCount(1);
    if (width === 390 || (width === 320 && theme === 'dark')) await page.screenshot({ path: `${out}/first-${theme}-${width}.png`, fullPage: true, animations: 'disabled' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  await page.locator('#weight_0').focus();
  expect(await page.locator('#weight_0').evaluate(node => getComputedStyle(node).outlineWidth)).toBe('3px');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('#setsBody .set-row:first-child td').first().evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await saveSet(page, 0);
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')))).sets).toHaveLength(1);
  await expect(page.locator('#restScreen')).toBeVisible();
  await page.locator('#restScreen [data-act="timerSkip"]').click();
  await expect(page.locator('#setsBody .set-row').nth(1)).toHaveClass(/is-current/);
  await page.screenshot({ path: `${out}/second-light-390.png`, fullPage: true, animations: 'disabled' });
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#setsBody .set-row').first()).toHaveClass(/is-current/);
  await saveSet(page, 0);
  await expect(page.locator('#setsBody .set-row').nth(1)).toHaveClass(/is-current/);
  await saveSet(page, 1);
  await expect(page.locator('#restScreen')).toBeVisible();
  await page.locator('#restScreen [data-act="timerSkip"]').click();
  await expect(page.locator('#metaExerciseStep')).toContainText('2 z 2');
  await expect(page.locator('#setsBody .set-row').first()).toHaveClass(/is-current/);
  await saveSet(page, 0);
  await page.locator('#restScreen [data-act="timerSkip"]').click();
  await saveSet(page, 1);
  await expect(page.locator('#restScreen')).toBeHidden();
  await expect(page.locator('#setsBody .set-row.is-current')).toHaveCount(0);
});

test('failed save leaves the active marker and recorded sets unchanged', async ({ page }) => {
  await seed(page);
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.evaluate(() => {
    const store = window.__gymverseTestHarness.getStore();
    const original = store.transact.bind(store);
    store.transact = (updates, ...args) => updates.gymverse_active ? Promise.reject(new Error('synthetic write failure')) : original(updates, ...args);
  });
  page.on('dialog', dialog => dialog.dismiss());
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#setsBody .set-row').first()).toHaveClass(/is-current/);
  await expect(page.locator('#btnDone_0')).not.toHaveClass(/completed/);
  await expect(page.locator('#restScreen')).toBeHidden();
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')))).sets).toHaveLength(0);
});

test('plan cards use the correct Polish exercise count', async ({ page }) => {
  const item = (id, count) => ({ id, title: id, exercises: Array.from({ length: count }, () => ({ key: 'bench_flat', sets: 1, target: '8' })) });
  await seed(page, [item('push_a1', 1), item('pull_a1', 2), item('full_body', 5)]);
  await expect(page.locator('[data-plan="push_a1"]')).toContainText('1 ćwiczenie');
  await expect(page.locator('[data-plan="pull_a1"]')).toContainText('2 ćwiczenia');
  await expect(page.locator('[data-plan="full_body"]')).toContainText('5 ćwiczeń');
});
