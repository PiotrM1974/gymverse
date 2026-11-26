import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const evidenceDir = 'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/visual';
const atlasDisclosureEvidenceDir = `${evidenceDir}/training-atlas-disclosure`;
const pilotUrl = '/gymverse/?local-exercise-presentation-pilot=1';
const candidatePrefix = '/gymverse/src/data/exercise-images/selected/';
const captureExistingPilotScreenshots = process.env.GV_CAPTURE_EXISTING_PILOT_SCREENSHOTS === '1';

async function setRelease(request, release) {
  const response = await request.post('/__pilot/release', { data: { release } });
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ release });
}

async function seedPilotWorkout(page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('gymverse_schema')) localStorage.setItem('gymverse_schema', '4');
    if (!localStorage.getItem('gymverse_profiles_v1')) localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion:1, activeProfileId:'pilot-profile', profiles:[{ id:'pilot-profile', name:'Profil syntetyczny', attributes:{ age:34, trainingGoal:'fitness' }, data:{} }] }));
    let plans;
    try { plans = JSON.parse(localStorage.getItem('gymverse_plans') || '[]'); } catch { plans = []; }
    if (!Array.isArray(plans)) plans = [];
    if (!plans.some(plan => plan.id === 'push_a1')) plans.unshift({ id:'push_a1', title:'Push A1', exercises:[{key:'bench_flat',sets:4,target:'5-8'},{key:'db_incline',sets:3,target:'8-10'},{key:'lat_raise_stand',sets:4,target:'12-15'},{key:'tri_rope',sets:3,target:'10-12'},{key:'leg_press',sets:3,target:'8-10'}] });
    localStorage.setItem('gymverse_plans', JSON.stringify(plans));
  });
}

async function startAtLatRaise(page) {
  await seedPilotWorkout(page);
  await page.goto(pilotUrl);
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  if (await page.locator('.exercise-hero > summary').count()) await page.locator('.exercise-hero > summary').click();
  await expect(page.locator('#metaExerciseStep')).toHaveText('Ćwiczenie 1 z 5');
  await page.locator('#btnNextStep').click();
  await expect(page.locator('#metaExerciseStep')).toHaveText('Ćwiczenie 2 z 5');
  await page.locator('#btnNextStep').click();
  await expect(page.locator('#metaExerciseStep')).toHaveText('Ćwiczenie 3 z 5');
  await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
}

async function waitForImage(page, selector, width, height) {
  await expect.poll(() => page.locator(selector).evaluate(image => ({ width: image.naturalWidth, height: image.naturalHeight, complete: image.complete }))).toEqual({ width, height, complete: true });
}

async function storageSnapshot(page) {
  await page.evaluate(async () => { await window.__gymverseTestHarness.getStore().flush(); });
  return page.evaluate(async () => {
    const storageValues = storage => Object.fromEntries(Array.from({ length: storage.length }, (_, index) => storage.key(index)).sort().map(key => [key, storage.getItem(key)]));
    const databases = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
    const indexedDb = [];
    for (const item of databases.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!item.name) continue;
      const database = await new Promise((resolve, reject) => {
        const request = indexedDB.open(item.name);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const stores = {};
      for (const name of [...database.objectStoreNames].sort()) {
        stores[name] = await new Promise((resolve, reject) => {
          const transaction = database.transaction(name, 'readonly');
          const objectStore = transaction.objectStore(name);
          const keys = objectStore.getAllKeys();
          const values = objectStore.getAll();
          transaction.oncomplete = () => resolve({ keys: keys.result, values: values.result });
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error || new Error('IndexedDB snapshot aborted'));
        });
      }
      indexedDb.push({ name: item.name, stores });
      database.close();
    }
    return { localStorage: storageValues(localStorage), sessionStorage: storageValues(sessionStorage), indexedDb };
  });
}

async function expectWorkoutStorageUnchanged(page, expected) {
  const actualSnapshot = await storageSnapshot(page);
  const expectedSnapshot = structuredClone(expected);
  delete actualSnapshot.localStorage.gymverse_profiles_v1;
  delete expectedSnapshot.localStorage.gymverse_profiles_v1;
  expect(actualSnapshot).toEqual(expectedSnapshot);
}

async function waitForController(page, queryPart) {
  await expect.poll(() => page.evaluate(async query => {
    const registration = await navigator.serviceWorker.getRegistration('/gymverse/');
    return { active: registration?.active?.scriptURL || '', state: registration?.active?.state || '' };
  }, queryPart)).toMatchObject({ active: expect.stringContaining(queryPart), state: 'activated' });
}

test('real workout card synchronizes both silhouettes and atlas, and leaves session storage intact', async ({ page, request }) => {
  await mkdir(evidenceDir, { recursive: true });
  await setRelease(request, 'pilot');
  const pageErrors = [];
  const pageHideEvents = [];
  const candidateResponses = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.exposeFunction('__reportPilotPagehide', detail => pageHideEvents.push(detail));
  await page.addInitScript(() => addEventListener('pagehide', event => window.__reportPilotPagehide({ persisted: event.persisted }), { once: true }));
  page.on('response', response => {
    if (new URL(response.url()).pathname.startsWith(candidatePrefix)) candidateResponses.push({
      path: new URL(response.url()).pathname,
      status: response.status(),
      contentType: response.headers()['content-type'] || ''
    });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await startAtLatRaise(page);

  const panel = page.locator('#exercisePresentation');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  await expect(page.locator('#exercisePresentation [data-presentation-sex]')).toHaveCount(2);
  await expect(page.locator('#anatomyAtlas [data-atlas-sex]')).toHaveCount(0);
  await expect(page.locator('#exercisePresentation [data-presentation-sex="male"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
  await expect(page.locator('#exercisePresentationFigure')).toHaveAttribute('aria-label', /lewy panel DÓŁ, prawy panel GÓRA/);
  await page.locator('#trainingAtlasDisclosure > summary').click();
  await expect(page.locator('#trainingAtlasDisclosure')).toHaveJSProperty('open', true);
  await waitForImage(page, '#exercisePresentationImage', 768, 512);

  const before = await storageSnapshot(page);
  for (const sex of ['male', 'female']) {
    await page.locator(`#exercisePresentation [data-presentation-sex="${sex}"]`).click();
    await expect(page.locator('#exercisePresentation [data-presentation-sex][aria-pressed="true"]')).toHaveAttribute('data-presentation-sex', sex);
    await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
    await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
    await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
    await expect(page.locator('#anatomyAtlas .anatomy-atlas__figure-wrap')).toHaveAttribute('aria-label', new RegExp(sex === 'male' ? 'Męska' : 'Żeńska'));
    await waitForImage(page, '#exercisePresentationImage', 768, 512);
    const imagePath = await page.locator('#exercisePresentationImage').getAttribute('src');
    expect(imagePath).toContain(`lat_raise_stand__default-${sex}.webp`);
    expect(imagePath).toContain('/technique/');
    for (const view of ['front', 'back']) {
      await page.locator(`#anatomyAtlas [data-atlas-view="${view}"]`).click();
      await expect(page.locator(`#anatomyAtlas [data-atlas-view="${view}"]`)).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toHaveAttribute('src', new RegExp(`${sex}-${view}\\.webp$`));
      if (captureExistingPilotScreenshots && sex === 'male' && view === 'front') await page.screenshot({ path: join(evidenceDir, 'workout-card-male-two-panel-front-desktop.png'), fullPage: true });
      if (captureExistingPilotScreenshots && sex === 'female' && view === 'back') await page.screenshot({ path: join(evidenceDir, 'workout-card-female-two-panel-back-desktop.png'), fullPage: true });
    }
  }
  expect(candidateResponses.length).toBeGreaterThanOrEqual(2);
  expect(candidateResponses.every(response => response.status === 200 && response.contentType.startsWith('image/webp'))).toBe(true);
  const after = await storageSnapshot(page);
  expect(after).toEqual(before);

  await page.locator('#exercisePresentation [data-presentation-sex="female"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#exercisePresentation [data-presentation-sex="female"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('alt', /DÓŁ po lewej, GÓRA po prawej/i);

  for (const [width, height] of [[375, 812], [390, 844], [430, 932]]) {
    await page.setViewportSize({ width, height });
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      card: document.querySelector('#exercisePresentation').getBoundingClientRect().width,
      atlas: document.querySelector('#anatomyAtlas .anatomy-atlas').getBoundingClientRect().width,
      frame: document.querySelector('#exercisePresentationFigure').getBoundingClientRect().width
    }));
    expect(dimensions.document).toBeLessThanOrEqual(width);
    expect(dimensions.body).toBeLessThanOrEqual(width);
    expect(dimensions.card).toBeGreaterThan(0);
    expect(dimensions.card).toBeLessThanOrEqual(500);
    expect(dimensions.atlas).toBeGreaterThan(0);
    expect(dimensions.frame).toBeLessThanOrEqual(dimensions.card);
    if (captureExistingPilotScreenshots) await page.screenshot({ path: join(evidenceDir, `workout-card-mobile-${width}-female.png`), fullPage: true });
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#btnNextStep').click();
  await expect(panel).toHaveAttribute('data-exercise-id', 'tri_rope');
  await expect(panel).toBeVisible();
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /tri_rope__default-female[.]webp/);
  await page.locator('#btnPrev').click();
  await expect(panel).toBeVisible();
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /female/);
  await page.locator('#exercisePresentation summary').click();
  await expect(page.getByText(/Ilustracja przedstawia dwie pozycje ruchu/)).toBeVisible();
  await page.goto('/gymverse/?pagehide-check=1');
  expect(pageHideEvents).toHaveLength(1);
  expect(pageErrors).toEqual([]);
  await writeFile(join('outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/logs', 'UI-INTEGRATION.json'), JSON.stringify({ candidateResponses, pageErrors, pageHideEvents, matrix: { silhouettes: ['male', 'female'], shownPositions: ['lower', 'raised'], atlasViews: ['front', 'back'] }, mobileWidths: [375, 390, 430], syntheticStorageEqualBeforeAfter: true, ordinaryTrainingCard: true }, null, 2));
});

test('training atlas collapses without losing set draft or presentation state and resets only on exercise change', async ({ browser, request }) => {
  await mkdir(atlasDisclosureEvidenceDir, { recursive: true });
  await setRelease(request, 'pilot');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await startAtLatRaise(page);

  const disclosure = page.locator('#trainingAtlasDisclosure');
  const summary = disclosure.locator(':scope > summary');
  await expect(disclosure).toBeVisible();
  await expect(disclosure).toHaveJSProperty('open', false);
  await expect(summary).toHaveAccessibleName(/Zaangażowane mięśnie · pokaż/);
  await expect(page.locator('.workout-rest-settings > summary')).toBeVisible();
  await expect(page.locator('#weight_0')).toBeVisible();
  const collapsed = await page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    summaryHeight: document.querySelector('#trainingAtlasDisclosure > summary').getBoundingClientRect().height,
    disclosureHeight: document.querySelector('#trainingAtlasDisclosure').getBoundingClientRect().height,
    restTop: document.querySelector('.workout-rest-settings > summary').getBoundingClientRect().top,
    seriesTop: document.querySelector('.sets-table').getBoundingClientRect().top
  }));
  expect(collapsed.documentWidth).toBeLessThanOrEqual(collapsed.viewport);
  expect(collapsed.summaryHeight).toBeLessThan(60);
  expect(collapsed.disclosureHeight).toBeLessThanOrEqual(collapsed.summaryHeight + 2);
  expect(collapsed.restTop).toBeGreaterThanOrEqual(collapsed.seriesTop);
  await page.screenshot({ path: join(atlasDisclosureEvidenceDir, 'training-card-atlas-collapsed-390px.png'), fullPage: true });

  for (const [width, height] of [[375, 812], [390, 844], [430, 932], [900, 900]]) {
    await page.setViewportSize({ width, height });
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      disclosureHeight: document.querySelector('#trainingAtlasDisclosure').getBoundingClientRect().height,
      summaryHeight: document.querySelector('#trainingAtlasDisclosure > summary').getBoundingClientRect().height,
      summaryTop: document.querySelector('#trainingAtlasDisclosure').getBoundingClientRect().top,
      restTop: document.querySelector('.workout-rest-settings > summary').getBoundingClientRect().top,
      seriesTop: document.querySelector('.sets-table').getBoundingClientRect().top,
      firstWeightTop: document.querySelector('#weight_0').getBoundingClientRect().top
    }));
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewport);
    expect(layout.disclosureHeight).toBeLessThanOrEqual(layout.summaryHeight + 2);
    expect(layout.restTop).toBeGreaterThan(layout.summaryTop);
    if (width <= 430) expect(layout.restTop).toBeGreaterThanOrEqual(layout.seriesTop);
    expect(layout.firstWeightTop).toBeGreaterThan(layout.seriesTop);
  }
  await page.setViewportSize({ width: 390, height: 844 });

  await page.locator('#weight_0').fill('32.5');
  await page.locator('#reps_0').fill('11');
  await page.locator('#reps_0').blur();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('gymverse_draft_v1') || '')).toContain('"reps":"11"');
  await page.evaluate(async () => { await window.__gymverseTestHarness.getStore().flush(); });
  const beforeDisclosureActions = await storageSnapshot(page);
  const timerBefore = await page.locator('#timerBar').evaluate(element => ({ display: getComputedStyle(element).display, text: document.querySelector('#timerDigits').textContent }));

  await summary.press('Enter');
  await expect(disclosure).toHaveJSProperty('open', true);
  await expect(summary).toHaveAccessibleName(/Zaangażowane mięśnie · ukryj/);
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toBeVisible();
  await page.locator('#anatomyAtlas [data-atlas-view="back"]').click();
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').tap();
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /female/);
  await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');

  await expect(disclosure).toHaveJSProperty('open', true);
  await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__figure-wrap')).toHaveAttribute('aria-label', /Żeńska/);
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toHaveAttribute('src', /female-back\.webp$/);
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
  await expect(page.locator('#weight_0')).toHaveValue('32.5');
  await expect(page.locator('#reps_0')).toHaveValue('11');
  await page.screenshot({ path: join(atlasDisclosureEvidenceDir, 'training-card-atlas-expanded-390px.png'), fullPage: true });

  await page.locator('#exercisePresentation [data-presentation-sex="male"]').tap();
  await expect(disclosure).toHaveJSProperty('open', true);
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toHaveAttribute('src', /male-back\.webp$/);
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').tap();
  await expect(disclosure).toHaveJSProperty('open', true);
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toHaveAttribute('src', /female-back\.webp$/);

  await summary.tap();
  await expect(disclosure).toHaveJSProperty('open', false);
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
  await summary.press('Enter');
  await expect(disclosure).toHaveJSProperty('open', true);
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toHaveAttribute('src', /female-back\.webp$/);
  expect(await storageSnapshot(page)).toEqual(beforeDisclosureActions);
  const timerAfter = await page.locator('#timerBar').evaluate(element => ({ display: getComputedStyle(element).display, text: document.querySelector('#timerDigits').textContent }));
  expect(timerAfter).toEqual(timerBefore);

  await page.locator('#btnNextStep').click();
  await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', 'tri_rope');
  await expect(disclosure).toHaveJSProperty('open', false);
  await page.locator('#btnPrev').click();
  await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  await expect(disclosure).toHaveJSProperty('open', false);
  await summary.tap();
  await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toHaveAttribute('src', /female-back\.webp$/);
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /female/);
  await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
  await context.close();
});

test('presentation silhouette controls accept actual touch input in the training card', async ({ browser, request }) => {
  await setRelease(request, 'pilot');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await startAtLatRaise(page);
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').tap();
  await expect(page.locator('#exercisePresentation [data-presentation-sex="female"]')).toHaveAttribute('aria-pressed', 'true');
  await waitForImage(page, '#exercisePresentationImage', 768, 512);
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /female/);
  await expect(page.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
  await expect(page.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
  await context.close();
});

test('broken and delayed image requests never fall back to another silhouette or overwrite the latest choice', async ({ browser, request }) => {
  await mkdir(evidenceDir, { recursive: true });
  await setRelease(request, 'pilot');
  const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  let delayedMale = false;
  await page.route('**/lat_raise_stand__default-male.webp', async route => {
    if (route.request().url().includes('/technique/')) {
      if (!delayedMale) { delayedMale = true; await new Promise(resolve => setTimeout(resolve, 700)); }
      await route.abort('failed');
      return;
    }
    await route.continue();
  });
  await startAtLatRaise(page);
  const panel = page.locator('#exercisePresentation');
  await expect(panel).toBeVisible();
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();
  await waitForImage(page, '#exercisePresentationImage', 768, 512);
  await page.locator('#exercisePresentation [data-presentation-sex="male"]').click();
  await expect(page.locator('#exercisePresentation [role="alert"]')).toContainText('Mężczyzna');
  await expect(page.locator('#legacyExerciseImageBox')).toBeHidden();
  await expect(page.locator('#exercisePresentationImage')).not.toHaveAttribute('src', /female/);
    if (captureExistingPilotScreenshots) await page.screenshot({ path: join(evidenceDir, 'workout-card-missing-male-asset.png'), fullPage: true });
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();
  await waitForImage(page, '#exercisePresentationImage', 768, 512);
  await expect(page.locator('#exercisePresentation [role="alert"]')).toBeHidden();
  await context.close();
});

test('a successful update precaches the local pilot and resumes the same workout offline', async ({ browser, request }) => {
  await mkdir(evidenceDir, { recursive: true });
  await setRelease(request, 'input');
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const inputPage = await context.newPage();
  await seedPilotWorkout(inputPage);
  await inputPage.goto('/gymverse/');
  await expect(inputPage.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
  await inputPage.evaluate(() => navigator.serviceWorker.ready);
  await inputPage.reload();
  await expect.poll(() => inputPage.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('/gymverse/sw.js');
  const baselineCache = await inputPage.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names.find(name => name.startsWith('gymverse-')));
    return { names, urls: (await cache.keys()).map(request => new URL(request.url).pathname) };
  });
  expect(baselineCache.urls.some(path => path.includes('GV-LAT-RAISE-MALE-FEMALE'))).toBe(false);

  await inputPage.locator('[data-act="startPlan"][data-plan="push_a1"]').click();

  if (await inputPage.locator('.exercise-hero > summary').count()) await inputPage.locator('.exercise-hero > summary').click();
  await inputPage.locator('#btnNextStep').click();
  await inputPage.locator('#btnNextStep').click();
  await expect(inputPage.locator('#currentExName')).toHaveText(/Unoszenie hantli bokiem stojąc|Standing Dumbbell Lateral Raise/);
  const workoutBefore = await storageSnapshot(inputPage);
  const baseline = await inputPage.evaluate(() => ({ controller: navigator.serviceWorker.controller?.scriptURL || '', registrations: 1 }));

  await setRelease(request, 'pilot');
  const updatedPage = await context.newPage();
  const responses = [];
  updatedPage.on('response', response => { if (response.url().includes('GV-LAT-RAISE-MALE-FEMALE') || response.url().includes('THIRD-PARTY-NOTICES')) responses.push({ url: response.url(), status: response.status(), fromServiceWorker: response.fromServiceWorker() }); });
  await updatedPage.goto(pilotUrl);
  await expect(updatedPage.locator('#resumeBox [data-act="resume"]')).toBeVisible();
  await updatedPage.locator('#resumeBox [data-act="resume"]').click();
  if (await updatedPage.locator('.exercise-hero > summary').count()) await updatedPage.locator('.exercise-hero > summary').click();
  await expect(updatedPage.locator('#exercisePresentation')).toBeVisible();
  await expect(updatedPage.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  await expect.poll(() => updatedPage.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/gymverse/');
    return registration?.waiting?.scriptURL || '';
  })).toContain('local-exercise-presentation-pilot=1');
  await expect.poll(() => updatedPage.evaluate(async () => {
    const names = await caches.keys();
    const name = names.find(name => name.includes('presentation-pilot'));
    if (!name) return 0;
    const cache = await caches.open(name);
    return (await cache.keys()).length;
  })).toBeGreaterThan(20);

  await inputPage.close();
  await updatedPage.close();

  let offlinePage;
  let activeController = '';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 250));
    offlinePage = await context.newPage();
    await offlinePage.goto(pilotUrl);
    activeController = await offlinePage.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '');
    if (activeController.includes('local-exercise-presentation-pilot=1')) break;
    await offlinePage.close();
  }
  expect(activeController).toContain('local-exercise-presentation-pilot=1');
  const cacheState = await offlinePage.evaluate(async () => {
    const names = await caches.keys();
    const cacheName = names.find(name => name.includes('presentation-pilot'));
    const cache = await caches.open(cacheName);
    const urls = (await cache.keys()).map(request => new URL(request.url).pathname);
    return { names, cacheName, urls };
  });
  const required = [
    'tests/fixtures/exercise-presentation-pilot/local-pilot/presentation-registry.json',
    'src/data/exercise-images/selected/technique/lat_raise_stand__default-male.webp',
    'src/data/exercise-images/selected/technique/lat_raise_stand__default-female.webp',
    'src/data/exercise-images/selected/thumbnails/lat_raise_stand__default-male.webp',
    'src/data/exercise-images/selected/thumbnails/lat_raise_stand__default-female.webp',
    'src/data/anatomy/THIRD-PARTY-NOTICES.md'
  ];
  for (const path of required) expect(cacheState.urls).toContain(`/gymverse/${path}`);

  await offlinePage.close();
  await context.setOffline(true);
  offlinePage = await context.newPage();
  const offlineResponses = [];
  const failedRequests = [];
  offlinePage.on('response', response => offlineResponses.push({ url: response.url(), status: response.status(), fromServiceWorker: response.fromServiceWorker() }));
  offlinePage.on('requestfailed', request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
  await offlinePage.goto(pilotUrl);
  await expect(offlinePage.locator('#resumeBox [data-act="resume"]')).toBeVisible();
  await offlinePage.locator('#resumeBox [data-act="resume"]').click();
  if (await offlinePage.locator('.exercise-hero > summary').count()) await offlinePage.locator('.exercise-hero > summary').click();
  await expect(offlinePage.locator('#exercisePresentation')).toBeVisible();
  await waitForImage(offlinePage, '#exercisePresentationImage', 768, 512);
  await expect(offlinePage.locator('#trainingAtlasDisclosure')).toHaveJSProperty('open', false);
  await offlinePage.locator('#trainingAtlasDisclosure > summary').click();
  await expect(offlinePage.locator('#trainingAtlasDisclosure')).toHaveJSProperty('open', true);
  await expect(offlinePage.locator('#anatomyAtlas .anatomy-atlas__body')).toBeVisible();
  await expect(offlinePage.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  expect(await offlinePage.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('local-exercise-presentation-pilot=1');
  const offlineNotice = await offlinePage.evaluate(async () => (await fetch('src/data/anatomy/THIRD-PARTY-NOTICES.md')).text());
  expect(offlineNotice).toContain('MIT');
  for (const sex of ['male', 'female']) {
    await offlinePage.locator(`#exercisePresentation [data-presentation-sex="${sex}"]`).click();
    await waitForImage(offlinePage, '#exercisePresentationImage', 768, 512);
    await expect(offlinePage.locator('#exercisePresentationCaption [data-panel="lower"] strong')).toHaveText('DÓŁ');
    await expect(offlinePage.locator('#exercisePresentationCaption [data-panel="raised"] strong')).toHaveText('GÓRA');
    for (const view of ['front', 'back']) {
      await offlinePage.locator(`#anatomyAtlas [data-atlas-view="${view}"]`).click();
      await expect(offlinePage.locator('#anatomyAtlas .anatomy-atlas__body')).toHaveAttribute('src', new RegExp(`${sex}-${view}\\.webp$`));
    }
  }
  expect(failedRequests.filter(item => item.url.includes('GV-LAT-RAISE-MALE-FEMALE') || item.url.includes('/src/'))).toEqual([]);
  expect(offlineResponses.some(item => item.fromServiceWorker && item.url.includes('lat_raise_stand__default-female.webp'))).toBe(true);
  expect(offlineResponses.some(item => item.fromServiceWorker && new URL(item.url).pathname === '/gymverse/')).toBe(true);
  await expectWorkoutStorageUnchanged(offlinePage, workoutBefore);
  const offlineProof = {
    baselineController: baseline.controller,
    activeController: await offlinePage.evaluate(() => navigator.serviceWorker.controller?.scriptURL || ''),
    cacheState,
    offlineResponses,
    failedRequests,
    syntheticStorageUnchanged: true
  };
  await writeFile(join('outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/logs', 'OFFLINE-SUCCESS.json'), JSON.stringify(offlineProof, null, 2));
  await context.close();
});

test('a required-image precache failure keeps the old worker active and reports a controlled offline candidate error', async ({ browser, request }) => {
  await mkdir(evidenceDir, { recursive: true });
  await setRelease(request, 'input');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const inputPage = await context.newPage();
  await seedPilotWorkout(inputPage);
  await inputPage.goto('/gymverse/');
  await expect(inputPage.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
  await inputPage.evaluate(() => navigator.serviceWorker.ready);
  await inputPage.reload();
  await expect.poll(() => inputPage.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('/gymverse/sw.js');
  await inputPage.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  if (await inputPage.locator('.exercise-hero > summary').count()) await inputPage.locator('.exercise-hero > summary').click();
  await inputPage.locator('#btnNextStep').click();
  await inputPage.locator('#btnNextStep').click();
  const before = await storageSnapshot(inputPage);

  await setRelease(request, 'pilot-fail');
  const updatePage = await context.newPage();
  const missingResponses = [];
  updatePage.on('response', response => { if (response.url().includes('lat_raise_stand__default-male.webp')) missingResponses.push({ status: response.status(), url: response.url() }); });
  await updatePage.goto(pilotUrl);
  await expect(updatePage.locator('#resumeBox [data-act="resume"]')).toBeVisible();
  await updatePage.locator('#resumeBox [data-act="resume"]').click();
  if (await updatePage.locator('.exercise-hero > summary').count()) await updatePage.locator('.exercise-hero > summary').click();
  await expect(updatePage.locator('#exercisePresentation [role="alert"]')).toContainText('Mężczyzna');
  await expect.poll(() => updatePage.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/gymverse/');
    return registration?.active?.scriptURL || '';
  })).toContain('/gymverse/sw.js');
  expect(missingResponses.some(response => response.status === 503)).toBe(true);
  await writeFile(join('outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/logs', 'OFFLINE-UPDATE-FAIL.json'), JSON.stringify({
    failedRequiredImage: missingResponses,
    activeControllerBeforeRestart: await updatePage.evaluate(() => navigator.serviceWorker.controller?.scriptURL || ''),
    cachesBeforeRestart: await updatePage.evaluate(() => caches.keys()),
    result: 'Pilot worker install failed; prior active worker remains. The network-online page reports the missing selected candidate, without another-sex fallback.'
  }, null, 2));
  await inputPage.close();
  await updatePage.close();
  await new Promise(resolve => setTimeout(resolve, 250));
  await context.setOffline(true);
  const offlinePage = await context.newPage();
  await offlinePage.goto(pilotUrl);
  await expect(offlinePage.locator('#resumeBox [data-act="resume"]')).toBeVisible();
  await offlinePage.locator('#resumeBox [data-act="resume"]').click();
  if (await offlinePage.locator('.exercise-hero > summary').count()) await offlinePage.locator('.exercise-hero > summary').click();
  await expect(offlinePage.locator('#exercisePresentation')).toBeVisible();
  await expect(offlinePage.locator('#exercisePresentation [role="alert"]')).toContainText(/Mężczyzna|nie udało się załadować/i);
  await expect(offlinePage.locator('#legacyExerciseImageBox')).toBeHidden();
  await expect(offlinePage.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', 'lat_raise_stand');
  await expectWorkoutStorageUnchanged(offlinePage, before);
  const controller = await offlinePage.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '');
  expect(controller).toContain('/gymverse/sw.js');
  if (captureExistingPilotScreenshots) await offlinePage.screenshot({ path: join(evidenceDir, 'workout-card-offline-precache-failure.png'), fullPage: true });
  await writeFile(join('outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/logs', 'OFFLINE-UPDATE-FAIL-REOPEN.json'), JSON.stringify({ controller, controlledErrorVisible: true, syntheticStorageUnchanged: true }, null, 2));
  await context.close();
});
