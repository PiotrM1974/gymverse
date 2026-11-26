import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { seedMuscleMapWorkout } from './helpers/seed-musclemap-workout.js';

const output = resolve(process.cwd(), 'outputs/GV-MUSCLEMAP-HIGHLIGHT-ENGINE/regression');
const sourceDiagrams = [
  { file: 'male-front.js', label: 'Mężczyzna · przód', sex: 'male', view: 'front' },
  { file: 'male-back.js', label: 'Mężczyzna · tył', sex: 'male', view: 'back' },
  { file: 'female-front.js', label: 'Kobieta · przód', sex: 'female', view: 'front' },
  { file: 'female-back.js', label: 'Kobieta · tył', sex: 'female', view: 'back' }
];

test.beforeEach(async ({ page }) => { await seedMuscleMapWorkout(page); });

async function captureAtlasScreenshot(page, atlas, path) {
  await atlas.locator('img.anatomy-atlas__body').evaluate(image => image.decode());
  await page.evaluate(() => {
    const rect = document.querySelector('#anatomyAtlas').getBoundingClientRect();
    window.scrollBy(0, rect.top - 68);
  });
  const box = await atlas.boundingBox();
  return await page.screenshot({ path, clip: box });
}

test('GV-MUSCLEMAP-QA-GATE visual, mobile and offline evidence', async ({ page }) => {
  test.setTimeout(90000);
  mkdirSync(output, { recursive: true });
  const consoleErrors = [];
  page.on('pageerror', error => consoleErrors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  for (let step = 0; step < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); step += 1) {
    await page.locator('#btnNextStep').click();
  }
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  await expect(atlas).not.toBeHidden();
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update('lat_raise_stand'));
  const persistenceBefore = await page.evaluate(async () => {
    const localStorageEntries = Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]);
    const databases = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
    const stores = [];
    for (const descriptor of databases) {
      if (!descriptor.name) continue;
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(descriptor.name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const counts = await Promise.all([...db.objectStoreNames].map(name => new Promise((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const request = tx.objectStore(name).count();
        request.onsuccess = () => resolve([name, request.result]);
        request.onerror = () => reject(request.error);
      })));
      stores.push({ name: db.name, version: db.version, counts });
      db.close();
    }
    return { localStorageEntries, stores };
  });

  const viewShots = [];
  await page.setViewportSize({ width: 390, height: 2400 });
  for (const item of sourceDiagrams) {
    await atlas.locator(`[data-atlas-sex="${item.sex}"]`).click();
    await atlas.locator(`[data-atlas-view="${item.view}"]`).click();
    const path = resolve(output, `silhouette-${item.file.replace('.js', '')}.png`);
    const bytes = await captureAtlasScreenshot(page, atlas, path);
    viewShots.push({ ...item, path, imageLoaded: true, base64: bytes.toString('base64') });
  }

  const exerciseShots = [];
  await page.setViewportSize({ width: 390, height: 2400 });
  const exerciseCases = [
    { id: 'lat_raise_stand', sex: 'male', view: 'front', size: [390, 844] },
    { id: 'db_bench', sex: 'female', view: 'front', size: [430, 932] },
    { id: 'lat_pulldown_wide', sex: 'male', view: 'back', size: [390, 844] },
    { id: 'leg_press', sex: 'female', view: 'front', size: [430, 932] }
  ];
  for (const item of exerciseCases) {
    await page.setViewportSize({ width: item.size[0], height: 2400 });
    await atlas.locator(`[data-atlas-sex="${item.sex}"]`).click();
    await atlas.locator(`[data-atlas-view="${item.view}"]`).click();
    await page.evaluate(id => window.GymNastikaMuscleAtlas.update(id), item.id);
    const path = resolve(output, `exercise-${item.id}.png`);
    await captureAtlasScreenshot(page, atlas, path);
    await page.setViewportSize({ width: item.size[0], height: item.size[1] });
    const details = await page.evaluate(() => {
      const root = document.querySelector('#anatomyAtlas');
      const figure = root.querySelector('.anatomy-atlas__figure-wrap');
      const svg = root.querySelector('svg');
      const image = root.querySelector('img.anatomy-atlas__body');
      const primary = root.querySelectorAll('.anatomy-atlas__muscle--primary').length;
      const secondary = root.querySelectorAll('.anatomy-atlas__muscle--secondary').length;
      const sample = root.querySelector('.anatomy-atlas__muscle');
      const rect = figure.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      return {
        primaryPaths: primary,
        secondaryPaths: secondary,
        computedMuscleFill: sample ? getComputedStyle(sample).fill : null,
        figureBox: { width: rect.width, height: rect.height },
        svgImageBoxDelta: { width: Math.abs(rect.width - svgRect.width), height: Math.abs(rect.height - svgRect.height) },
        imageLoaded: image.complete && image.naturalWidth === 1024 && image.naturalHeight === 1536,
        viewport: { width: innerWidth, height: innerHeight },
        documentWidth: document.documentElement.scrollWidth,
        hasBodyPhoto: Boolean(root.querySelector('img, image'))
      };
    });
    exerciseShots.push({ id: item.id, sex: item.sex, view: item.view, viewport: `${item.size[0]}x${item.size[1]}`, path, ...details });
  }

  const responsiveLayouts = [];
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : width === 390 ? 844 : 932 });
    const details = await page.evaluate(() => {
      const root = document.querySelector('#anatomyAtlas');
      const figure = root.querySelector('.anatomy-atlas__figure-wrap').getBoundingClientRect();
      return { viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, figureWidth: Math.round(figure.width), figureHeight: Math.round(figure.height), imageLoaded: root.querySelector('img').complete && root.querySelector('img').naturalWidth === 1024 };
    });
    responsiveLayouts.push(details);
  }

  // Female-front adductor paths are withheld after anatomy review; inspect
  // both color roles on the male-front view where both remain supported.
  await atlas.locator('[data-atlas-sex="male"]').click();
  await atlas.locator('[data-atlas-view="front"]').click();
  const viewLayout = await page.evaluate(() => {
    const root = document.querySelector('#anatomyAtlas');
    const figure = root.querySelector('.anatomy-atlas__figure-wrap');
    const rect = figure.getBoundingClientRect();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      rootWidth: root.getBoundingClientRect().width,
      figureBox: { width: rect.width, height: rect.height },
      atlasStylesheetLinked: Boolean(document.querySelector('link[rel="stylesheet"][href$="atlas.css"]')),
      atlasStylesheetLoaded: [...document.styleSheets].some(sheet => sheet.href?.endsWith('/atlas.css')),
      computedMuscleFill: getComputedStyle(root.querySelector('.anatomy-atlas__muscle')).fill,
      mainColorApplied: getComputedStyle(root.querySelector('.anatomy-atlas__muscle--primary')).fill,
      goldColorApplied: getComputedStyle(root.querySelector('.anatomy-atlas__muscle--secondary')).fill,
      photoOverlay: Boolean(root.querySelector('img, image')),
      imageLoaded: root.querySelector('img').complete && root.querySelector('img').naturalWidth === 1024
    };
  });

  const resourceTiming = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(item => /anatomy\/|atlas\.css/.test(item.name))
    .map(item => ({ name: new URL(item.name).pathname, durationMs: Math.round(item.duration * 100) / 100, transferBytes: item.transferSize })));
  const cacheAudit = await page.evaluate(async () => {
    const cache = await caches.open('gymverse-v55');
    const paths = [
      'src/features/anatomy/atlas.js', 'src/features/anatomy/atlas.css', 'src/features/anatomy/highlight-engine.js',
      'src/data/anatomy/musclemap-diagrams.js', 'src/data/anatomy/atlas-data.js',
      'src/data/anatomy/male-front.js', 'src/data/anatomy/male-back.js',
      'src/data/anatomy/female-front.js', 'src/data/anatomy/female-back.js',
      'src/data/anatomy/bodies/male-front.webp', 'src/data/anatomy/bodies/male-back.webp',
      'src/data/anatomy/bodies/female-front.webp', 'src/data/anatomy/bodies/female-back.webp',
      'src/data/anatomy/THIRD-PARTY-NOTICES.md'
    ];
    const keys = await cache.keys();
    return {
      cacheNames: await caches.keys(),
      cacheVersion: 'gymverse-v55',
      paths: await Promise.all(paths.map(async path => ({ path, cached: Boolean(await cache.match(new URL(path, location.href).href)) }))),
      cacheEntryCount: keys.length
    };
  });

  // Four real element screenshots are composed into one contact sheet, without redrawing or replacing them.
  const board = await page.context().newPage();
  await board.setContent(`<!doctype html><meta charset="utf-8"><title>MuscleMap — cztery sylwetki</title>
    <style>body{margin:0;padding:16px;background:#eee;font:16px Arial,sans-serif;color:#111}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.cell{background:white;border:1px solid #aaa;padding:8px}.cell img{display:block;width:100%;height:auto}.cell h2{margin:0 0 8px;font-size:16px}</style>
    <main class="grid">${viewShots.map((item, i) => `<section class="cell"><h2>${item.label}</h2><img alt="${item.label}" src="data:image/png;base64,${item.base64}"></section>`).join('')}</main>`);
  await board.screenshot({ path: resolve(output, 'comparison-plate-four-silhouettes.png'), fullPage: true });

  const beforeDirectory = resolve(process.cwd(), 'tests/fixtures/musclemap-anatomy-review/before');
  const beforeViewItems = sourceDiagrams.map((item, index) => ({
    title: item.label,
    before: `data:image/png;base64,${readFileSync(resolve(beforeDirectory, `silhouette-${item.file.replace('.js', '')}.png`)).toString('base64')}`,
    after: `data:image/png;base64,${viewShots[index].base64}`
  }));
  await board.setContent(`<!doctype html><meta charset="utf-8"><title>Porównanie atlasu — sylwetki</title>
    <style>body{margin:0;padding:18px;background:#f0f3f5;font:15px Arial,sans-serif;color:#17232d}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.pair{background:#fff;border:1px solid #d7dfe6;border-radius:14px;padding:12px}.pair h2{margin:0 0 10px}.columns{display:grid;grid-template-columns:1fr 1fr;gap:8px}.columns h3{font-size:12px;margin:0 0 6px;color:#5e6a75}.columns img{width:100%;height:auto;display:block;border-radius:8px}</style>
    <main class="grid">${beforeViewItems.map(item => `<section class="pair"><h2>${item.title}</h2><div class="columns"><div><h3>PRZED</h3><img src="${item.before}"></div><div><h3>PO</h3><img src="${item.after}"></div></div></section>`).join('')}</main>`);
  await board.screenshot({ path: resolve(output, 'comparison-before-after-silhouettes.png'), fullPage: true });

  await board.close();

  const initialRequestAssetResults = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return fetch('src/data/anatomy/male-front.js').then(response => ({ ok: response.ok, status: response.status, contentType: response.headers.get('content-type') }));
  });
  const persistenceAfter = await page.evaluate(async () => {
    const localStorageEntries = Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]);
    const databases = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
    const stores = [];
    for (const descriptor of databases) {
      if (!descriptor.name) continue;
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(descriptor.name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const counts = await Promise.all([...db.objectStoreNames].map(name => new Promise((resolve, reject) => {
        const tx = db.transaction(name, 'readonly');
        const request = tx.objectStore(name).count();
        request.onsuccess = () => resolve([name, request.result]);
        request.onerror = () => reject(request.error);
      })));
      stores.push({ name: db.name, version: db.version, counts });
      db.close();
    }
    return { localStorageEntries, stores };
  });
  await page.context().setOffline(true);
  await page.close();
  const offlinePage = await page.context().newPage();
  const offlinePageErrors = [];
  offlinePage.on('pageerror', error => offlinePageErrors.push(String(error.stack || error)));
  let offlineLoad = null;
  try {
    const start = Date.now();
    await offlinePage.goto('/', { waitUntil: 'load', timeout: 12000 });
    offlineLoad = { loaded: true, durationMs: Date.now() - start, title: await offlinePage.title() };
    await offlinePage.evaluate(() => window.GymNastikaMuscleAtlas.update('db_bench'));
    offlineLoad.highlightMode = await offlinePage.evaluate(() => window.GymNastikaMuscleAtlas.getHighlightMode());
    offlineLoad.highlightBlend = await offlinePage.locator('#anatomyAtlas .anatomy-atlas__muscle--primary').first().evaluate(path => getComputedStyle(path).mixBlendMode);
    offlineLoad.atlasPrimaryPaths = await offlinePage.locator('#anatomyAtlas .anatomy-atlas__muscle--primary').count();
    offlineLoad.cachedBodyLoaded = await offlinePage.locator('#anatomyAtlas img').evaluate(image => image.complete && image.naturalWidth === 1024);
    offlineLoad.cachedNotice = (await offlinePage.evaluate(() => fetch('src/data/anatomy/THIRD-PARTY-NOTICES.md').then(response => response.ok)));
  } catch (error) {
    offlineLoad = { loaded: false, error: String(error).slice(0, 500) };
  }
  await page.context().setOffline(false);
  await offlinePage.close();

  const report = {
    browser: 'Microsoft Edge via Playwright Chromium project; not iPhone Safari',
    viewLayout,
    mobileExerciseLayouts: exerciseShots,
    responsiveLayouts,
    exerciseScreenshotPaths: exerciseShots.map(item => item.path),
    silhouetteScreenshotPaths: viewShots.map(item => item.path),
    resourceTiming,
    cacheAudit,
    onlineAssetFetch: initialRequestAssetResults,
    persistenceBefore: persistenceBefore,
    persistenceAfter: persistenceAfter,
    persistenceUnchangedByAtlas: JSON.stringify(persistenceBefore) === JSON.stringify(persistenceAfter),
    offlineRestart: offlineLoad,
    consoleErrors,
    offlinePageErrors
  };
  writeFileSync(resolve(output, 'visual-mobile-offline-results.json'), JSON.stringify(report, null, 2));
  expect(report.cacheAudit.paths.every(item => item.cached)).toBe(true);
  expect(report.persistenceUnchangedByAtlas).toBe(true);
  expect(report.offlineRestart.loaded).toBe(true);
  expect(report.consoleErrors).toEqual([]);
  expect(report.offlinePageErrors).toEqual([]);
  expect(report.viewLayout.imageLoaded).toBe(true);
  expect(report.responsiveLayouts.every(layout => layout.documentWidth === layout.viewportWidth && layout.imageLoaded)).toBe(true);
  expect(report.mobileExerciseLayouts.every(item => item.imageLoaded && item.svgImageBoxDelta.width === 0 && item.svgImageBoxDelta.height === 0)).toBe(true);
  expect(report.offlineRestart.cachedBodyLoaded).toBe(true);
  expect(report.offlineRestart.cachedNotice).toBe(true);
  expect(report.offlineRestart.highlightMode).toBe('refined');
  expect(report.offlineRestart.highlightBlend).toBe('color');
});
