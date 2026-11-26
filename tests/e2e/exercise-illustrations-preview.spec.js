import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const previewUrl = '/tests/fixtures/exercise-illustrations/preview.html';
const evidenceDir = fileURLToPath(new URL('../../outputs/GV-LAT-RAISE-MALE-FEMALE/visual/', import.meta.url));
const examples = [
  ['lat_raise_stand', 'DÓŁ', 'GÓRA'],
  ['db_bench', 'GÓRA', 'DÓŁ'],
  ['lat_pulldown_wide', 'GÓRA', 'DÓŁ'],
  ['leg_press', 'ZGIĘCIE', 'WYPROST']
];

test('male/female technique and MuscleMap stay synchronized across all combinations and sizes', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(evidenceDir, { recursive: true });
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
  page.on('requestfailed', request => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.goto(previewUrl);
  const frame = page.locator('#illustrationPose');
  const sexButton = sex => page.locator(`#anatomyAtlas [data-atlas-sex="${sex}"]`);
  const viewButton = view => page.locator(`#anatomyAtlas [data-atlas-view="${view}"]`);
  await expect(page.getByText('PARA DO OCENY · PARTIAL')).toBeVisible();
  await expect(page.locator('#techniqueStatus')).toHaveAttribute('data-status', 'PARTIAL');
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__controls').first()).toHaveAttribute('aria-label', 'Sylwetka: Mężczyzna lub Kobieta');
  await expect(page.locator('#previewTitle')).toHaveAttribute('data-variant-id', 'default');
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 375, 390, 430]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : width < 500 ? 932 : 1050 });
    for (const sex of ['male', 'female']) {
      const positionBeforeSwitch = await frame.getAttribute('data-pose');
      const atlasViewBeforeSwitch = await viewButton('front').getAttribute('aria-pressed').then(async front => front === 'true' ? 'front' : ((await viewButton('back').getAttribute('aria-pressed')) === 'true' ? 'back' : 'unknown'));
      if (!(await sexButton(sex).getAttribute('aria-pressed')).includes('true')) {
        await sexButton(sex).focus();
        await page.keyboard.press('Space');
      }
      await expect(sexButton(sex)).toHaveAttribute('aria-pressed', 'true');
      await expect(frame).toHaveAttribute('data-pose', positionBeforeSwitch);
      await expect(viewButton(atlasViewBeforeSwitch)).toHaveAttribute('aria-pressed', 'true');
      await expect(frame).toHaveAttribute('data-sex', sex);
      await page.locator('[data-view-choice="thumbnail"]').click();
      await expect.poll(() => frame.evaluate(element => getComputedStyle(element).backgroundImage)).toContain(`thumbnails/lat_raise_stand__default-${sex}.webp`);
      const thumbnailDimensions = await frame.evaluate(async element => { const source = getComputedStyle(element).backgroundImage.slice(5, -2); const image = new Image(); image.src = source; await image.decode(); return [image.naturalWidth, image.naturalHeight]; });
      expect(thumbnailDimensions).toEqual([256, 256]);
      if (width === 1440) await page.screenshot({ path: join(evidenceDir, `desktop-${sex}-thumbnail.png`), fullPage: true });
      await page.locator('[data-view-choice="technique"]').click();
      await expect.poll(() => frame.evaluate(element => getComputedStyle(element).backgroundImage)).toContain(`technique/lat_raise_stand__default-${sex}.webp`);
      for (const pose of ['pose1', 'pose2']) {
        await page.locator(`[data-pose-choice="${pose}"]`).click();
        for (const atlasView of ['front', 'back']) {
          await viewButton(atlasView).click();
          await expect(viewButton(atlasView)).toHaveAttribute('aria-pressed', 'true');
          await expect(page.locator(`[data-atlas-sex="${sex}"]`)).toHaveAttribute('aria-pressed', 'true');
          await expect(frame).toHaveAttribute('data-pose', pose);
          await expect(frame).toHaveAttribute('aria-label', new RegExp(`${sex === 'male' ? 'Mężczyzna' : 'Kobieta'}.*${pose === 'pose1' ? 'DÓŁ' : 'GÓRA'}`));
          await expect.poll(() => frame.evaluate(element => getComputedStyle(element).backgroundImage)).toContain(`-${sex}.webp`);
          const rendered = await frame.evaluate(async element => {
            const source = getComputedStyle(element).backgroundImage.slice(5, -2);
            const response = await fetch(source);
            const image = new Image(); image.src = source; await image.decode();
            const box = element.getBoundingClientRect();
            return { source, ok: response.ok, width: image.naturalWidth, height: image.naturalHeight, frameWidth: box.width, ratio: box.width / box.height, documentWidth: document.documentElement.scrollWidth, viewport: innerWidth };
          });
          expect(rendered.source).toContain(`-${sex}.webp`);
          expect(rendered).toMatchObject({ ok: true, width: 768, height: 512 });
          expect(rendered.ratio).toBeCloseTo(0.75, 2);
          expect(rendered.documentWidth).toBeLessThanOrEqual(width);
          expect(rendered.frameWidth).toBeLessThanOrEqual(width);
          const atlasState = await page.locator('#anatomyAtlas .anatomy-atlas__figure-wrap').getAttribute('aria-label');
          expect(atlasState).toContain(sex === 'male' ? 'Męska' : 'Żeńska');
          expect(atlasState).toContain(atlasView === 'front' ? 'przodu' : 'tyłu');
          await expect.poll(() => page.locator('#anatomyAtlas .anatomy-atlas__body').evaluate(image => image.naturalWidth)).toBe(1024);
          if (width === 1440) await page.screenshot({ path: join(evidenceDir, `desktop-${sex}-${pose}-${atlasView}.png`), fullPage: true });
          if (width === 390 && pose === 'pose2' && atlasView === 'back') await page.screenshot({ path: join(evidenceDir, `mobile-390-${sex}-pose2-back.png`), fullPage: true });
        }
      }
    }
  }
  await page.locator('[data-preview-exercise="db_bench"]').click();
  await expect(page.locator('#previewTitle')).toHaveAttribute('data-exercise-id', 'db_bench');
  await expect(page.locator('#illustrationPose')).toHaveAttribute('data-sex', 'unpaired');
  await expect(page.locator('#anatomyAtlas [data-atlas-sex="female"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-preview-exercise="lat_raise_stand"]').click();
  await expect(page.locator('#illustrationPose')).toHaveAttribute('data-sex', 'female');
  await expect(page.locator('#anatomyAtlas [data-atlas-view="back"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => frame.evaluate(element => getComputedStyle(element).backgroundImage)).toContain('-female.webp');
  expect(failures).toEqual([]);
});

test('a missing gender asset reports the selected silhouette and never falls back to another file', async ({ page }) => {
  await mkdir(evidenceDir, { recursive: true });
  await page.route('**/lat_raise_stand__default-male.webp', route => route.abort());
  await page.goto(previewUrl);
  await expect(page.locator('#illustrationError')).toContainText('Mężczyzna');
  await expect(page.locator('#illustrationPose')).toHaveAttribute('data-sex', 'male');
  await expect(page.locator('#illustrationPose')).toHaveAttribute('data-asset-error', 'true');
  await expect.poll(() => page.locator('#illustrationPose').evaluate(element => getComputedStyle(element).backgroundImage)).toBe('none');
  await page.locator('#anatomyAtlas [data-atlas-sex="female"]').click();
  await expect(page.locator('#illustrationError')).toBeHidden();
  await expect(page.locator('#illustrationPose')).toHaveAttribute('data-sex', 'female');
  await expect.poll(() => page.locator('#illustrationPose').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('-female.webp');
  await expect(page.locator('#illustrationPose')).not.toHaveAttribute('data-asset-error', 'true');
  await expect(page.locator('[data-view-choice="muscles"]')).toHaveCount(0);
});

test('a missing MuscleMap body image reports an error and hides the unmatched diagram', async ({ page }) => {
  await page.route('**/female-front.webp', route => route.abort());
  await page.goto(previewUrl);
  await page.locator('#anatomyAtlas [data-atlas-sex="female"]').click();
  await expect(page.locator('#atlasAssetError')).toContainText('żeńskiej');
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__figure-wrap')).toBeHidden();
  await expect(page.locator('#anatomyAtlas [data-atlas-sex="female"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#atlasAssetError')).not.toContainText('męskiej');
  await page.locator('#anatomyAtlas [data-atlas-sex="male"]').click();
  await expect(page.locator('#atlasAssetError')).toBeHidden();
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__figure-wrap')).toBeVisible();
});

test('isolated exercise preview switches labeled positions and matching MuscleMap without persistence', async ({ page }) => {
  test.setTimeout(60_000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') pageErrors.push(message.text()); });
  await mkdir(evidenceDir, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => {
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'synthetic-session', details: [{ id: 'synthetic-set', exerciseId: 'synthetic-exercise', weight: 12, reps: 8 }] }]));
    localStorage.setItem('gymverse_active', JSON.stringify({ id: 'synthetic-active', planId: 'synthetic-plan', step: 2, sets: [{ weight: 12, reps: 8 }], timerEndAt: 1234567890 }));
    sessionStorage.setItem('synthetic-checkpoint', JSON.stringify({ marker: 'unchanged' }));
    const request = indexedDB.open('synthetic-training-profile', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('state', 'readwrite');
      transaction.objectStore('state').put({ marker: 'history', records: [{ exerciseId: 'synthetic-exercise', reps: 8 }] }, 'history');
      transaction.objectStore('state').put({ marker: 'active', step: 2 }, 'active');
      transaction.oncomplete = () => database.close();
    };
  });
  await page.goto(previewUrl);
  await expect(page.getByRole('heading', { name: 'Podgląd ilustracji ćwiczeń' })).toBeVisible();
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.open('synthetic-training-profile');
    request.onsuccess = () => { request.result.close(); resolve(); };
    request.onerror = () => reject(request.error);
  }));
  const snapshotStores = () => page.evaluate(async () => {
    const keyValues = storage => Object.fromEntries(Array.from({ length: storage.length }, (_, index) => storage.key(index)).sort().map(key => [key, storage.getItem(key)]));
    const databases = await indexedDB.databases();
    const indexedDb = [];
    for (const item of databases.sort((a, b) => a.name.localeCompare(b.name))) {
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
    return { localStorage: keyValues(localStorage), sessionStorage: keyValues(sessionStorage), indexedDb, serviceWorkers: (await navigator.serviceWorker?.getRegistrations?.() || []).length };
  });
  const beforeStorage = await snapshotStores();

  for (const [exerciseId, firstLabel, secondLabel] of examples) {
    await page.locator(`[data-preview-exercise="${exerciseId}"]`).click();
    await expect(page.locator('#previewTitle')).toHaveAttribute('data-exercise-id', exerciseId);
    await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', exerciseId);
    await expect.poll(() => page.locator('#anatomyAtlas .anatomy-atlas__body').evaluate(image => image.naturalWidth)).toBe(1024);
    await expect(page.locator('#illustrationPose')).toHaveAttribute('data-pose', 'pose1');
    await expect(page.locator('#poseLabelFirst')).toHaveText(firstLabel);
    await expect(page.locator('#illustrationPose')).toHaveAttribute('aria-label', new RegExp(firstLabel));
    await page.screenshot({ path: join(evidenceDir, `desktop-${exerciseId}-position1.png`), fullPage: true });

    const second = page.locator('[data-pose-choice="pose2"]');
    await second.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#illustrationPose')).toHaveAttribute('data-pose', 'pose2');
    await expect(page.locator('#poseLabelSecond')).toHaveText(secondLabel);
    await expect(page.locator('#illustrationPose')).toHaveAttribute('aria-label', new RegExp(secondLabel));
    await page.screenshot({ path: join(evidenceDir, `desktop-${exerciseId}-position2.png`), fullPage: true });

    await page.locator('[data-pose-choice="pose1"]').click();
    if (exerciseId === 'lat_raise_stand') {
      for (const sex of ['female', 'male']) await page.locator(`#anatomyAtlas [data-atlas-sex="${sex}"]`).click();
      for (const atlasView of ['back', 'front']) await page.locator(`#anatomyAtlas [data-atlas-view="${atlasView}"]`).click();
      for (const viewName of ['thumbnail', 'technique']) await page.locator(`[data-view-choice="${viewName}"]`).click();
      await page.locator('[data-pose-choice="pose2"]').click();
      await page.locator('[data-pose-choice="pose1"]').click();
    }
  }

  await expect(page.getByText('Podgląd timera', { exact: false })).toBeVisible();
  await page.screenshot({ path: join(evidenceDir, 'desktop-timer-preview.png'), fullPage: true });

  const afterStorage = await snapshotStores();
  expect(afterStorage).toEqual(beforeStorage);
  await expect(page.locator('#demoTimer strong')).toHaveText('01:30');
  await page.locator('[data-preview-exercise="db_bench"]').click();
  await expect(page.locator('#techniqueStatus')).toHaveAttribute('data-status', 'PARTIAL');
  await expect(page.getByText('Prawa do użycia: niezweryfikowane. Publikacja wstrzymana.', { exact: true })).toBeVisible();
  await expect(page.getByText('Ilustracje przedstawiają pozycję górną i dolną. Powtórzenie obejmuje kontrolowane opuszczenie hantli oraz ponowne wyciśnięcie.', { exact: false })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

for (const width of [375, 390, 430]) {
  test(`isolated preview remains within ${width}px mobile viewport`, async ({ page }) => {
    await mkdir(evidenceDir, { recursive: true });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 932 });
    await page.goto(previewUrl);
    for (const [exerciseId, firstLabel, secondLabel] of examples) {
      await page.locator(`[data-preview-exercise="${exerciseId}"]`).click();
      await expect(page.locator(`[data-preview-exercise="${exerciseId}"]`)).toHaveAttribute('aria-pressed', 'true');
      if (exerciseId === 'lat_raise_stand') await expect(page.locator('#rightsStatus')).toContainText('do potwierdzenia');
      else await expect(page.getByText('Prawa do użycia: niezweryfikowane. Publikacja wstrzymana.', { exact: true })).toBeVisible();
      await expect(page.locator('[data-pose-choice="pose1"]')).toBeVisible();
      await expect(page.locator('[data-pose-choice="pose2"]')).toBeVisible();
      const controls = page.locator('.pose-controls').boundingBox();
      const frame = page.locator('#illustrationPose').boundingBox();
      expect((await controls).y).toBeLessThan((await frame).y);
      for (const [pose, label] of [['pose1', firstLabel], ['pose2', secondLabel]]) {
        await page.locator(`[data-pose-choice="${pose}"]`).click();
        await expect(page.locator(`[data-pose-choice="${pose}"]`)).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#previewTitle')).toHaveAttribute('data-exercise-id', exerciseId);
        await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id', exerciseId);
        await expect(page.locator('#illustrationPose')).toHaveAttribute('data-pose', pose);
        await expect(page.locator('#illustrationPose')).toHaveAttribute('aria-label', new RegExp(label));
        await expect.poll(() => page.locator('#illustrationPose').evaluate(element => getComputedStyle(element).backgroundImage)).not.toBe('none');
        const rendered = await page.locator('#illustrationPose').evaluate(async element => {
          const css = getComputedStyle(element);
          const source = css.backgroundImage.slice(5, -2);
          const response = await fetch(source);
          const image = new Image();
          image.src = source;
          await image.decode();
          const box = element.getBoundingClientRect();
          return { ok: response.ok, width: image.naturalWidth, height: image.naturalHeight, boxWidth: box.width, boxHeight: box.height, backgroundSize: css.backgroundSize, position: css.backgroundPosition };
        });
        expect(rendered).toMatchObject({ ok: true, width: 768, height: 512, backgroundSize: '200% 100%' });
        expect(rendered.boxWidth / rendered.boxHeight).toBeCloseTo(0.75, 2);
      }
      if (width === 390) await page.screenshot({ path: join(evidenceDir, `mobile-${width}-${exerciseId}-position2.png`), fullPage: false });
    }
    await page.locator('#anatomyAtlas [data-atlas-sex="female"]').click();
    await page.locator('#anatomyAtlas [data-atlas-view="back"]').click();
    await expect.poll(() => page.locator('#anatomyAtlas .anatomy-atlas__body').evaluate(image => image.naturalWidth)).toBe(1024);
    await page.locator('#demoTimer').scrollIntoViewIfNeeded();

    const result = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      preview: document.querySelector('.preview-grid').getBoundingClientRect().width,
      atlas: document.querySelector('#anatomyAtlas').getBoundingClientRect().width,
      figure: document.querySelector('#anatomyAtlas .anatomy-atlas__figure-wrap').getBoundingClientRect().width,
      legend: document.querySelector('#anatomyAtlas .anatomy-atlas__legend').getBoundingClientRect().width
    }));
    expect(result.documentWidth).toBeLessThanOrEqual(width);
    expect(result.bodyWidth).toBeLessThanOrEqual(width);
    expect(result.atlas).toBeGreaterThan(0);
    expect(result.legend).toBeGreaterThan(0);
    await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toBeVisible();
    await page.screenshot({ path: join(evidenceDir, `mobile-${width}-atlas.png`), fullPage: true });
  });
}

test('atlas remains readable inside a narrow desktop panel with active timer preview', async ({ page }) => {
  await mkdir(evidenceDir, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(previewUrl);
  const atlas = page.locator('#anatomyAtlas');
  await atlas.evaluate(element => { element.style.width = '468px'; element.style.maxWidth = '468px'; });
  await page.locator('[data-preview-exercise="lat_raise_stand"]').click();
  await page.locator('#anatomyAtlas .anatomy-atlas__details summary').click();
  const result = await page.evaluate(() => {
    const card = document.querySelector('#anatomyAtlas');
    return {
      cardWidth: card.getBoundingClientRect().width,
      scrollWidth: card.scrollWidth,
      clientWidth: card.clientWidth,
      maxTextRight: Math.max(...[...card.querySelectorAll('.anatomy-atlas__legend, .anatomy-atlas__list li, .anatomy-atlas__precision li, .anatomy-atlas__note')].map(node => node.getBoundingClientRect().right)),
      cardRight: card.getBoundingClientRect().right
    };
  });
  expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth + 1);
  expect(result.maxTextRight).toBeLessThanOrEqual(result.cardRight + 0.5);
  await expect(page.locator('#demoTimer')).toBeVisible();
  await page.screenshot({ path: join(evidenceDir, 'desktop-narrow-atlas-timer.png'), fullPage: true });
});

test('position switch supports touch input on a mobile-sized touch device', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(previewUrl);
  await page.locator('#anatomyAtlas [data-atlas-sex="female"]').tap();
  await expect(page.locator('#illustrationPose')).toHaveAttribute('data-sex', 'female');
  await expect.poll(() => page.locator('#illustrationPose').evaluate(element => getComputedStyle(element).backgroundImage)).toContain('-female.webp');
  await expect(page.locator('#anatomyAtlas [data-atlas-sex="female"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-preview-exercise="leg_press"]').tap();
  await expect(page.locator('#poseLabelFirst')).toHaveText('ZGIĘCIE');
  await page.locator('[data-pose-choice="pose2"]').tap();
  await expect(page.locator('#illustrationPose')).toHaveAttribute('data-pose', 'pose2');
  await expect(page.locator('#illustrationPose')).toHaveAttribute('aria-label', /WYPROST/);
  await expect(page.locator('#demoTimer strong')).toHaveText('01:30');
  await context.close();
});
