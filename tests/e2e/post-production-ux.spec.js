import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const evidence = join(process.cwd(), 'outputs', 'GV-POST-PRODUCTION-UX');
const historyA = [
  { id: 'session-a1', date: '2020-01-01T12:00:00.000Z', planId: 'push_a1', planTitle: 'Dawny trening', totalVolume: 200, totalReps: 5, details: [{ exerciseId: 'bench_flat', weight: 40, reps: 5, setNumber: 1 }] },
  { id: 'session-a2', date: '2021-01-01T12:00:00.000Z', planId: 'push_a1', planTitle: 'Starszy trening', totalReps: 5, details: [{ exerciseId: 'bench_flat', weight: 30, reps: 5, setNumber: 1 }] },
  { id: 'empty-manual-session', date: '2022-01-01T12:00:00.000Z', planId: 'push_a1', planTitle: 'Pusty wpis', totalVolume: 999, totalReps: 0, details: [] }
];

async function seedProfiles(page) {
  const historyB = [{ id: 'session-b1', date: '2024-01-01T12:00:00.000Z', planId: 'push_a1', planTitle: 'Inny profil', totalVolume: 100, totalReps: 10, details: [{ exerciseId: 'bench_flat', weight: 10, reps: 10, setNumber: 1 }] }];
  await page.addInitScript(({ historyA, historyB }) => {
    if (localStorage.getItem('__post-production-profile-fixture')) return;
    localStorage.setItem('__post-production-profile-fixture', '1');
    const profile = (id, name, history) => ({ id, name, createdAt: '2020-01-01T00:00:00.000Z', attributes: {}, data: { gymverse_history: JSON.stringify(history), gymverse_schema: '4' } });
    localStorage.setItem('gymverse_history', JSON.stringify(historyA));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'profile-a-01', onboardingRequired: false, profiles: [profile('profile-a-01', 'Profil A', historyA), profile('profile-b-02', 'Profil B', historyB)] }));
  }, { historyA, historyB });
}
async function waitForApp(page) {
  await expect.poll(() => page.locator('#profileSelect option').count()).toBeGreaterThan(0);
}

test('home actions and floppy menu are compact, keyboard accessible, and use the existing flows', async ({ page }) => {
  await mkdir(evidence, { recursive: true });
  await seedProfiles(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await expect(page.locator('#view-plans')).toHaveClass(/active/);
  await expect(page.locator('#stage6WelcomeBack')).toBeHidden();
  await expect(page.locator('#skipProfileSetup')).toBeHidden();
  await expect(page.locator('#view-plans .backup-box')).toHaveCount(0);
  const toggle = page.getByRole('button', { name: 'Kopie bezpieczeństwa' });
  const menu = page.locator('#backupActionMenu');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();
  await expect(page.locator('#view-plans > .home-action-row .home-action')).toHaveCount(2);
  await expect(page.locator('#assignedProgram .home-action')).toHaveCount(1);
  const visibleLinks = await page.locator('#view-plans .btn-link').evaluateAll(buttons => buttons.filter(button => button.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).map(button => button.outerHTML));
  expect(visibleLinks).toHaveLength(0);
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      const touchTargets = await page.locator('#view-plans .home-action').evaluateAll(buttons => buttons.filter(button => button.getClientRects().length).map(button => button.getBoundingClientRect().height));
      expect(touchTargets.every(height => height >= 44)).toBe(true);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390) await page.screenshot({ path: join(evidence, `home-${theme}-menu-closed-390.png`), animations: 'disabled' });
    }
  }
  await toggle.click();
  await expect(menu).toBeVisible();
  for (const name of ['Zapisz kopię', 'Wczytaj kopię', 'Otwórz kopie bezpieczeństwa', 'Przygotuj bezpieczne przeniesienie danych']) {
    await expect(menu.getByRole('button', { name: new RegExp(name) })).toBeVisible();
  }
  const beforeOpen = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]))));
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const menuRect = await menu.boundingBox();
    expect(menuRect).not.toBeNull();
    expect(menuRect.x).toBeGreaterThanOrEqual(0);
    expect(menuRect.x + menuRect.width).toBeLessThanOrEqual(width);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) await page.screenshot({ path: join(evidence, 'home-dark-menu-open-390.png'), animations: 'disabled' });
  }
  await expect.poll(() => page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]))))).toBe(beforeOpen);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page.locator('#planList').click();
  await expect(menu).toBeHidden();
  await toggle.click();
  await menu.getByRole('button', { name: 'Otwórz kopie bezpieczeństwa' }).click();
  await expect(page.locator('#view-storage')).toHaveClass(/active/);
});

test('backup menu routes save and restore to existing export and file selection without implicit migration', async ({ page }) => {
  await seedProfiles(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  const toggle = page.locator('#backupMenuToggle');
  await toggle.click();
  const before = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]))));
  await expect.poll(() => page.locator('#backupMenuMigrationNote').textContent()).not.toContain('Sprawdzanie');
  const migrationDisabled = await page.locator('#migrateDataButton').isDisabled();
  const migrationNote = await page.locator('#backupMenuMigrationNote').textContent();
  if (migrationDisabled) expect(migrationNote?.trim()).not.toBe('');
  await expect.poll(() => page.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]))))).toBe(before);
  await page.locator('#backupActionMenu').getByRole('button', { name: 'Zapisz kopię' }).click();
  await expect(page.locator('#fileDeliveryPrompt')).toBeVisible();
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Kopie bezpieczeństwa' }).click();
  await page.locator('#backupActionMenu').getByRole('button', { name: 'Wczytaj kopię' }).click();
  const fileChooser = await fileChooserPromise;
  expect(fileChooser).toBeTruthy();
});

test('workout keeps per-exercise rest visible and moves global rest into collapsed set options', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  const welcome = page.locator('#stage6Welcome');
  if (await welcome.isVisible()) {
    await welcome.getByRole('button', { name: 'Pomiń na razie' }).click();
    await expect(welcome).toBeHidden();
  }
  await page.locator('#planList .plan-card').first().click();
  await expect(page.locator('#view-workout')).toHaveClass(/active/);
  await expect(page.locator('.exercise-rest-panel')).toBeVisible();
  await expect(page.locator('.exercise-rest-panel .exercise-rest-options button')).toHaveCount(4);
  await expect(page.locator('.workout-rest-settings')).toHaveCount(0);
  await expect(page.locator('.workout-extras')).toBeVisible();
  await expect(page.locator('.workout-extras .rest-row')).toBeAttached();
  await expect(page.locator('.workout-extras')).not.toHaveAttribute('open', '');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(evidence, 'workout-light-no-duplicate-rest-390.png'), animations: 'disabled' });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await page.screenshot({ path: join(evidence, 'workout-dark-no-duplicate-rest-390.png'), animations: 'disabled' });
  await page.locator('.workout-extras > summary').click();
  await expect(page.locator('.workout-extras .rest-row')).toBeVisible();
  await expect(page.locator('.workout-extras .rest-row')).toContainText('Przerwa ogólna');
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('lifetime cards use only complete history in the active profile and respond to profile changes', async ({ page }) => {
  await mkdir(evidence, { recursive: true });
  await seedProfiles(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await page.getByRole('button', { name: 'Statystyki', exact: true }).click();
  const lifetime = page.locator('#statsLifetime');
  await expect(lifetime.locator('.lifetime-stat-value').nth(0)).toHaveText('2');
  await expect(lifetime).toContainText('350');
  await expect(lifetime).toContainText('WSZYSTKIE TRENINGI');
  await expect(lifetime).toContainText('CAŁKOWITY TONAŻ');
  for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390) await page.screenshot({ path: join(evidence, `stats-${theme}-390.png`), animations: 'disabled' });
    }
  }
  await page.locator('.header-nav [data-view="view-plans"]').click();
  await page.locator('#profileManage > summary').click();
  await page.locator('#profileSelect').selectOption('profile-b-02');
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.locator('[data-act="switchProfile"]').click()]);
  await page.getByRole('button', { name: 'Statystyki', exact: true }).click();
  await expect(page.locator('#statsLifetime')).toContainText('1');
  await expect(page.locator('#statsLifetime')).toContainText('100');
  await expect(page.locator('#statsLifetime')).not.toContainText('350');
  await page.locator('.header-nav [data-view="view-plans"]').click();
  await page.locator('#profileManage > summary').click();
  await page.locator('#profileSelect').selectOption('profile-a-01');
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.locator('[data-act="switchProfile"]').click()]);
  await page.getByRole('button', { name: 'Historia', exact: true }).click();
  await page.locator('#historyAddPanel > summary').click();
  await page.locator('#histNewDate').fill('2023-03-02');
  await page.locator('[data-act="histNew"]').click();
  const addedSessionId = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_history')).at(-1).id);
  page.once('dialog', dialog => dialog.accept('40x5'));
  await page.locator('[data-act="histAddSet"]').first().click();
  await page.getByRole('button', { name: 'Statystyki', exact: true }).click();
  await expect(page.locator('#statsLifetime .lifetime-stat-value').nth(0)).toHaveText('3');
  await expect(page.locator('#statsLifetime')).toContainText('550');
  await page.getByRole('button', { name: 'Historia', exact: true }).click();
  const addedSession = page.locator(`.hist-card[data-session-id="${addedSessionId}"]`);
  if (await addedSession.locator('.hist-head').getAttribute('aria-expanded') !== 'true') await addedSession.locator('.hist-head').click();
  page.once('dialog', dialog => dialog.accept());
  await addedSession.locator('[data-act="histDelete"]').click();
  await page.getByRole('button', { name: 'Statystyki', exact: true }).click();
  await expect(page.locator('#statsLifetime .lifetime-stat-value').nth(0)).toHaveText('2');
  await expect(page.locator('#statsLifetime')).toContainText('350');
});

test('offline app shell stays available after the current worker controls the synthetic session', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await page.evaluate(async () => { if ('serviceWorker' in navigator) await navigator.serviceWorker.ready; });
  await page.reload();
  await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller);
  expect(controlled).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#view-plans')).toHaveClass(/active/);
});
