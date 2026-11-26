import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const evidenceDir = fileURLToPath(new URL('../../outputs/GV-PWA-EXERCISE-ATLAS-CONSISTENCY-AND-OFFLINE-RECOVERY/', import.meta.url));
const modes = [
  { sex: 'male', view: 'front', key: 'male-front' },
  { sex: 'male', view: 'back', key: 'male-back' },
  { sex: 'female', view: 'front', key: 'female-front' },
  { sex: 'female', view: 'back', key: 'female-back' }
];

async function bootWorkout(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'push_a1', title: 'Push A1', exercises: [{ key: 'bench_flat', sets: 2, target: '8-12' }, { key: 'db_incline', sets: 2, target: '8-12' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'atlas-profile', profiles: [{ id: 'atlas-profile', name: 'Atlas test', attributes: { trainingGoal: 'fitness' }, data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [] } }] }));
  });
  await page.reload();
  await expect(page.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
}

async function getModeEvidence(page, mode, networkMode) {
  if (!await page.locator('.exercise-hero').evaluate(el => el.open)) await page.locator('.exercise-hero > summary').click();
  await page.locator(`#exercisePresentation [data-presentation-sex="${mode.sex}"]`).click();
  await page.locator(`[data-atlas-view="${mode.view}"]`).click();
  const evidence = await page.locator('.anatomy-atlas__figure-wrap').evaluate(async figure => {
    const image = figure.querySelector('.anatomy-atlas__body');
    const svg = figure.querySelector('.anatomy-atlas__figure');
    await image.decode();
    await Promise.all(figure.getAnimations().map(animation => animation.finished));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const bodyStyle = getComputedStyle(image);
    const svgStyle = getComputedStyle(svg);
    const bodyRect = image.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const response = await caches.open('gymverse-v55').then(cache => cache.match(new URL(image.src)));
    if (!response) throw new Error(`WEBP_CACHE_MISS:${image.currentSrc}`);
    const digest = async blob => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))).map(value => value.toString(16).padStart(2, '0')).join('');
    return {
      imageUrl: new URL(image.currentSrc).pathname,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      bodyOpacity: bodyStyle.opacity,
      bodyFilter: bodyStyle.filter,
      svgOpacity: svgStyle.opacity,
      svgFilter: svgStyle.filter,
      blendMode: figure.dataset.highlightMode,
      boxAlignmentDelta: { width: bodyRect.width - svgRect.width, height: bodyRect.height - svgRect.height, x: bodyRect.x - svgRect.x, y: bodyRect.y - svgRect.y },
      cachedWebpSha256: await digest(await response.blob()),
      activeSurfaceIds: Array.from(figure.querySelectorAll('.anatomy-atlas__muscle--primary[data-muscle-id], .anatomy-atlas__muscle--secondary[data-muscle-id]'), path => path.dataset.muscleId).sort()
    };
  });
  const path = join(evidenceDir, `${networkMode}-${mode.key}.png`);
  await page.locator('.anatomy-atlas__figure-wrap').screenshot({ path });
  const buffer = await (await import('node:fs/promises')).readFile(path);
  return { ...evidence, screenshot: path.split(/[\\/]/).slice(-1)[0], screenshotSha256: createHash('sha256').update(buffer).digest('hex') };
}

test('all four WebP silhouettes and SVG overlays remain equivalent after an offline PWA restart', async ({ page, context }) => {
  await mkdir(evidenceDir, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await bootWorkout(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.evaluate(() => localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'push_a1', title: 'Push A1', exercises: [{ key: 'bench_flat', sets: 2, target: '8-12' }, { key: 'db_incline', sets: 2, target: '8-12' }] }])));
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#btnNextStep').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await expect(page.locator('#anatomyAtlas')).toBeVisible();

  const online = {};
  for (const mode of modes) {
    online[mode.key] = await getModeEvidence(page, mode, 'online');
    expect(online[mode.key].complete).toBe(true);
    expect(online[mode.key].naturalWidth).toBe(1024);
    expect(Object.values(online[mode.key].boxAlignmentDelta).every(value => Math.abs(value) < 0.1)).toBe(true);
    expect(online[mode.key].bodyOpacity).toBe('1');
    expect(online[mode.key].svgOpacity).toBe('1');
    expect(online[mode.key].blendMode).toBe('refined');
  }

  const beforeOffline = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Wznów' }).click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await expect(page.locator('#anatomyAtlas')).toBeVisible();
  const resumed = await page.evaluate(async () => {
    const { EXERCISE_ATLAS_MAP } = await import('/src/data/anatomy/atlas-data.js');
    const active = JSON.parse(localStorage.getItem('gymverse_active'));
    const plans = JSON.parse(localStorage.getItem('gymverse_plans'));
    const exerciseId = active.swaps?.[active.step] || plans.find(plan => plan.id === active.planId).exercises[active.step].key;
    return { exerciseId, atlasId: document.querySelector('#anatomyAtlas').dataset.exerciseId, mapExists: Object.hasOwn(EXERCISE_ATLAS_MAP, exerciseId) };
  });
  const afterStorage = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
  resumed.storageEqual = JSON.stringify(beforeOffline) === JSON.stringify(afterStorage);
  expect(resumed.exerciseId).toBe('db_incline');
  expect(resumed.atlasId).toBe(resumed.exerciseId);
  expect(resumed.mapExists).toBe(true);
  expect(resumed.storageEqual).toBe(true);
  const offline = {};
  for (const mode of modes) {
    offline[mode.key] = await getModeEvidence(page, mode, 'offline');
    expect(offline[mode.key].complete).toBe(true);
    expect(offline[mode.key].naturalWidth).toBe(1024);
    expect(Object.values(offline[mode.key].boxAlignmentDelta).every(value => Math.abs(value) < 0.1)).toBe(true);
    expect(offline[mode.key].bodyOpacity).toBe(online[mode.key].bodyOpacity);
    expect(offline[mode.key].bodyFilter).toBe(online[mode.key].bodyFilter);
    expect(offline[mode.key].svgOpacity).toBe(online[mode.key].svgOpacity);
    expect(offline[mode.key].svgFilter).toBe(online[mode.key].svgFilter);
    expect(offline[mode.key].blendMode).toBe(online[mode.key].blendMode);
    expect(offline[mode.key].imageUrl).toBe(online[mode.key].imageUrl);
    expect(offline[mode.key].cachedWebpSha256).toBe(online[mode.key].cachedWebpSha256);
    expect(offline[mode.key].activeSurfaceIds).toEqual(online[mode.key].activeSurfaceIds);
  }

  await mkdir(evidenceDir, { recursive: true });
  await writeFile(join(evidenceDir, 'image-online-offline-results.json'), JSON.stringify({ browser: 'Microsoft Edge via Playwright Chromium', viewport: page.viewportSize(), resumedExercise: resumed, online, offline, physicalIPhone: 'NOT TESTED' }, null, 2));
});

test('mobile atlas remains readable at iPhone widths after skipping the fullscreen rest', async ({ page }) => {
  await bootWorkout(page);
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await page.locator('#weight_0').fill('45');
  await page.locator('#reps_0').fill('10');
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeVisible();
  await page.locator('#restScreen [data-act="timerSkip"]').click();
  await expect(page.locator('#restScreen')).toBeHidden();

  const results = [];
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: width === 430 ? 932 : 844 });
    if (!await page.locator('.exercise-hero').evaluate(el => el.open)) await page.locator('.exercise-hero > summary').click();
    await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();
    await page.locator('[data-atlas-view="back"]').click();
    await page.locator('#btnNextStep').scrollIntoViewIfNeeded();
    const measurement = await page.evaluate(() => {
      const figure = document.querySelector('.anatomy-atlas__figure-wrap');
      const body = document.querySelector('.anatomy-atlas__body');
      const svg = document.querySelector('.anatomy-atlas__figure');
      const legend = document.querySelector('.anatomy-atlas__legend');
      const next = document.querySelector('#btnNextStep');
      const timer = document.querySelector('#timerBar');
      const rect = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
      const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      return {
        viewportWidth: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        exerciseId: document.querySelector('#anatomyAtlas').dataset.exerciseId,
        imageUrl: body.currentSrc,
        imageLoaded: body.complete && body.naturalWidth === 1024,
        figureSvgAligned: Math.abs(figure.getBoundingClientRect().width - svg.getBoundingClientRect().width) < 0.1 && Math.abs(figure.getBoundingClientRect().height - svg.getBoundingClientRect().height) < 0.1,
        legendVisible: !!legend && getComputedStyle(legend).display !== 'none' && legend.getBoundingClientRect().width > 0,
        sexPressed: document.querySelector('#exercisePresentation [data-presentation-sex="female"]').getAttribute('aria-pressed'),
        viewPressed: document.querySelector('[data-atlas-view="back"]').getAttribute('aria-pressed'),
        timerVisible: getComputedStyle(timer).display !== 'none',
        timerOverlapsNext: overlaps(rect(timer), rect(next)),
        nextButtonVisible: next.getBoundingClientRect().width > 0 && getComputedStyle(next).visibility === 'visible'
      };
    });
    results.push(measurement);
    expect(measurement.documentWidth).toBeLessThanOrEqual(measurement.viewportWidth);
    expect(measurement.imageLoaded).toBe(true);
    expect(measurement.figureSvgAligned).toBe(true);
    expect(measurement.legendVisible).toBe(true);
    expect(measurement.sexPressed).toBe('true');
    expect(measurement.viewPressed).toBe('true');
    expect(measurement.timerVisible).toBe(false);
    expect(measurement.timerOverlapsNext).toBe(false);
    expect(measurement.nextButtonVisible).toBe(true);
  }
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(join(evidenceDir, 'mobile-results.json'), JSON.stringify({ browser: 'Microsoft Edge responsive emulation; no physical iPhone', results }, null, 2));
});
