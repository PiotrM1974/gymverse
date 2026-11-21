import { test, expect } from '@playwright/test';

test('shows GymNastika branding while preserving the installed PWA identity', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('GymNastika');
  await expect(page.locator('header .logo')).toHaveText('GYMNASTIKA');
  await expect(page.locator('meta[name="apple-mobile-web-app-title"]')).toHaveAttribute('content', 'GymNastika');

  const manifestResponse = await page.request.get('/manifest.webmanifest');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('GymNastika');
  expect(manifest.short_name).toBe('GymNastika');
  expect(manifest.description).toBe('Dziennik treningowy — plany, treningi, historia i postępy');
  expect(manifest.start_url).toBe('./');
  expect(manifest.scope).toBe('./');
  expect(manifest).not.toHaveProperty('id');
});
