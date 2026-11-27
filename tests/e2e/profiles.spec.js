import {setGeneratorDays} from './helpers/generator-days.js';
import { test, expect } from '@playwright/test';
async function chooseProfileOptions(page,id,values){if(id==='newProfileRestrictions'&&!await page.locator('#profileRestrictionPicker').evaluate(e=>e.open))await page.locator('#profileRestrictionPicker > summary').click();if(id==='newProfileRestrictions'&&await page.locator('#profileExerciseGroup').count()&&!await page.locator('#profileExerciseGroup').evaluate(e=>e.open))await page.locator('#profileExerciseGroup > summary').click();for(const box of await page.locator('[data-profile-choice="'+id+'"]:checked').all())await box.uncheck();for(const value of values)await page.locator('[data-profile-choice="'+id+'"][value="'+value+'"]').check();}
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('fresh install offers profile creation, restore, and the existing safe skip path', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const welcome = page.locator('#stage6Welcome');
  await expect(welcome).toBeVisible();
  await expect(welcome.getByRole('button', { name: 'Utwórz profil' })).toBeVisible();
  await expect(welcome.getByRole('button', { name: 'Przywróć dane z kopii' })).toBeVisible();
  await expect(welcome.getByRole('button', { name: 'Pomiń na razie' })).toBeVisible();
  await welcome.getByRole('button', { name: 'Pomiń na razie' }).click();
  await expect(welcome).toBeHidden();
  await expect(page.locator('#profileSelect')).toBeVisible();
  await expect(page.locator('#planList .plan-card').first()).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).onboardingRequired)).toBe(false);
});

test('legacy data gets a one-time welcome that can be dismissed without changing workouts', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'legacy-plan-welcome', title: 'Plan zachowany', exercises: [{ key: 'bench_flat', sets: 3 }] }]));
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'legacy-session-welcome', date: '2026-11-20T10:00:00.000Z', planId: 'legacy-plan-welcome', details: [{ exerciseId: 'bench_flat', weight: 50, reps: 8 }] }]));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const card = page.locator('#legacyUpgradeWelcome');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Wykryliśmy dane z wcześniejszej wersji aplikacji');
  await expect(page.locator('.profile-quick-actions')).toBeVisible();
  await expect(page.locator('.profile-quick-actions button')).toHaveCount(2);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      await expect(card).toBeVisible();
      const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, body: document.body.scrollWidth }));
      expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
    }
  }
  const before = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem('gymverse_profiles_v1')),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history')
  }));
  expect(before.state.activeProfileId).toBe('legacy-default-profile');
  const continueButton = card.getByRole('button', { name: 'Kontynuuj bez zmian' });
  await continueButton.focus();
  await continueButton.press('Enter');
  await expect(card).toBeHidden();
  await expect(page.locator('#planList')).toContainText('Plan zachowany');
  const after = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem('gymverse_profiles_v1')),
    plans: localStorage.getItem('gymverse_plans'),
    history: localStorage.getItem('gymverse_history')
  }));
  expect(after.state.legacyUpgradePending).toBe(false);
  expect(after.state.profiles).toEqual(before.state.profiles);
  expect(after.plans).toBe(before.plans);
  expect(after.history).toBe(before.history);
  await page.reload();
  await expect(card).toBeHidden();
});

test('a valid GymNastika 2.0 profile registry opens normally without upgrade welcome', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'profile-current-01', profiles: [
      { id: 'legacy-default-profile', name: 'Profil archiwalny', createdAt: '2026-11-20T00:00:00.000Z', attributes: { age: 51, equipment: ['barbell'] }, data: { gymverse_history: JSON.stringify([{ id: 'retained-profile-history' }]) } },
      { id: 'profile-current-01', name: 'Mój bieżący profil', createdAt: '2026-11-21T00:00:00.000Z', attributes: { age: 35, sex: 'female', heightCm: 168, weightKg: 64, experience: 'several_months', returnAfterBreak: false, equipment: ['dumbbells'], restrictions: [] }, data: {} }
    ] }));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#stage6Welcome')).toBeHidden();
  await expect(page.locator('#legacyUpgradeWelcome')).toBeHidden();
  await expect(page.locator('#profileSelect')).toHaveValue('profile-current-01');
  await expect(page.locator('.profile-quick-actions')).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')));
  expect(state.profiles).toHaveLength(2);
  expect(state.profiles[0].data.gymverse_history).toContain('retained-profile-history');
  await page.locator('.profile-quick-actions').getByRole('button', { name: 'Edytuj profil' }).click();
  await expect(page.locator('#newProfileName')).toHaveValue('Mój bieżący profil');
  await page.locator('[data-act="profileNext"]').click();
  await expect(page.locator('#newProfileAge')).toHaveValue('35');
  await page.locator('#newProfileAge').fill('40');
  await page.locato