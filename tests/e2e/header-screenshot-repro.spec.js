import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const visualDir = 'outputs/GV-EXERCISE-IMAGES-THREE/visual';
const pilotUrl = '/gymverse/?local-exercise-presentation-pilot=1';
const measurements = [];

async function measure(page, width, state) {
  const geometry = await page.evaluate(() => {
    const header = document.querySelector('header');
    const content = document.querySelector('.container');
    const reps = document.querySelector('#reps_0');
    const rect = node => {
      const { top, bottom, height } = node.getBoundingClientRect();
      return { top, bottom, height };
    };
    return {
      scrollY,
      viewportHeight: innerHeight,
      header: rect(header),
      content: rect(content),
      reps: rect(reps),
      focused: document.activeElement?.id || null,
      headerButtonsReachable: [...document.querySelectorAll('header button')].every(button => {
        const box = button.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return button.contains(hit);
      })
    };
  });
  measurements.push({ width, state, ...geometry });
  expect(geometry.header.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.header.top).toBeLessThanOrEqual(1);
  expect(geometry.header.bottom).toBeLessThan(geometry.viewportHeight / 3);
  expect(geometry.headerButtonsReachable).toBe(true);
  return geometry;
}

test('header position in real viewport and full-page screenshots after exercise input', async ({ page, request }) => {
  const release = await request.post('/__pilot/release', { data: { release: 'pilot' } });
  expect(release.ok()).toBe(true);
  await mkdir(visualDir, { recursive: true });
  await page.goto(pilotUrl);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_plans', JSON.stringify([{
      id: 'header_synthetic', title: 'Test nagłówka',
      exercises: [{ key: 'leg_press', variantId: 'high_feet', sets: 1, target: '8-10' }]
    }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'header-profile', profiles: [{ id: 'header-profile', name: 'Test nagłówka', attributes: { age: 34, trainingGoal: 'fitness' }, data: {} }] }));
  });
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="header_synthetic"]').click();
  if (await page.locator('.exercise-hero > summary').count()) await page.locator('.exercise-hero > summary').click();
  await expect(page.locator('#currentExVariant')).toContainText('Stopy wyżej');
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();
  await expect(page.locator('#exercisePresentationFigure')).toHaveAttribute('aria-label', /lewy panel DÓŁ, prawy panel GÓRA/);
  await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
  await expect(page.locator('#trainingAtlasDisclosure')).toHaveJSProperty('open', false);
  await page.locator('#weight_0').fill('42.5');
  await page.locator('#reps_0').fill('8');

  for (const [width, height] of [[390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    await page.locator('#reps_0').evaluate(node => node.blur());
    await page.evaluate(() => scrollTo(0, 0));
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    const start = await measure(page, width, 'start');
    expect(start.content.top).toBeGreaterThanOrEqual(start.header.bottom);
    await page.screenshot({ path: `${visualDir}/header-${width}-start-viewport.png`, fullPage: false });
    await page.screenshot({ path: `${visualDir}/header-${width}-start-full-page.png`, fullPage: true });

    await page.locator('#reps_0').scrollIntoViewIfNeeded();
    const scrolled = await measure(page, width, 'scrolled');
    expect(scrolled.scrollY).toBeGreaterThan(0);
    await page.screenshot({ path: `${visualDir}/header-${width}-scrolled-viewport.png`, fullPage: false });

    await page.locator('#reps_0').focus();
    const focused = await measure(page, width, 'focused');
    expect(focused.scrollY).toBeGreaterThan(0);
    expect(focused.focused).toBe('reps_0');
    expect(focused.reps.top).toBeGreaterThanOrEqual(focused.header.bottom);
    expect(focused.reps.bottom).toBeLessThanOrEqual(height);
    await page.screenshot({ path: `${visualDir}/header-${width}-focused-viewport.png`, fullPage: false });
    await page.screenshot({ path: `${visualDir}/header-${width}-focused-full-page.png`, fullPage: true });
    await expect(page.locator('#weight_0')).toHaveValue('42.5');
    await expect(page.locator('#reps_0')).toHaveValue('8');
    await expect(page.locator('#exercisePresentation [data-presentation-sex="female"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
    await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
  }
  await writeFile(`${visualDir}/header-screenshot-measurements.json`, JSON.stringify(measurements, null, 2) + '\n');
});
