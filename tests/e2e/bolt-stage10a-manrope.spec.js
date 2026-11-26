import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function boot(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('manrope-fixture')) return;
    sessionStorage.setItem('manrope-fixture', '1');
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([
      { id: 'push_a1', title: 'Push A1', exercises: [{ key: 'bench_flat', sets: 2, target: '8-12' }] },
      { id: 'pull_a1', title: 'Pull A1', exercises: [{ key: 'lat_pulldown_wide', sets: 2, target: '8-12' }] },
      { id: 'full_body', title: 'Full Body', exercises: [{ key: 'leg_press', sets: 2, target: '8-12' }] }
    ]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'font-profile', profiles: [{ id: 'font-profile', name: 'Próba polskich znaków', attributes: { trainingGoal: 'hypertrophy' }, data: {} }] }));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
  await expect.poll(() => page.evaluate(async () => {
    await document.fonts.load('400 16px Manrope', 'Zażółć gęślą jaźń');
    await document.fonts.load('700 16px Manrope', 'Zażółć gęślą jaźń');
    return document.fonts.check('400 16px Manrope', 'Zażółć gęślą jaźń') && document.fonts.check('700 16px Manrope', 'Zażółć gęślą jaźń');
  })).toBe(true);
}

async function inspect(page, label, out) {
  for (const theme of ['light', 'dark']) for (const width of [320, 375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const result = await page.evaluate(() => {
      const visible = node => {
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden' && node.getBoundingClientRect().width > 0;
      };
      const roots = [...document.querySelectorAll('.view-section, #restScreen')].filter(visible);
      const controls = roots.flatMap(root => [...root.querySelectorAll('button,input,select')]).filter(visible);
      return {
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        escapedControls: controls.filter(node => {
          const box = node.getBoundingClientRect();
          return box.left < -1 || box.right > innerWidth + 1;
        }).map(node => node.id || node.textContent.trim().slice(0, 30)),
        fontFamilies: [document.querySelector('.logo'), ...roots, ...controls.slice(0, 6)].filter(Boolean).map(node => getComputedStyle(node).fontFamily)
      };
    });
    expect(result.horizontalOverflow, `${label} ${theme} ${width}`).toBe(false);
    expect(result.escapedControls, `${label} ${theme} ${width}`).toEqual([]);
    expect(result.fontFamilies.every(name => name.toLowerCase().includes('manrope')), `${label} ${theme} ${width}`).toBe(true);
    if (width === 320 || width === 390) await page.screenshot({ path: `${out}/${label}-${theme}-${width}.png`, fullPage: true, animations: 'disabled' });
  }
}

test('Manrope is used throughout home, profile, generator, editor, workout and timer', async ({ page }, info) => {
  test.setTimeout(90000);
  const out = `outputs/GV-BOLT-STAGE10A/manrope/${info.project.name}`;
  await mkdir(out, { recursive: true });
  await boot(page);
  await inspect(page, 'home', out);
  for (const [view, label] of [['view-stats', 'statistics'], ['view-charts', 'progress'], ['view-history', 'history']]) {
    await page.locator(`[data-act="view"][data-view="${view}"]`).first().click();
    await inspect(page, label, out);
  }
  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  await page.locator('#profileManage > summary').click();
  await page.locator('#profileManage details > summary').first().click();
  await inspect(page, 'profile', out);
  await page.locator('[data-act="stage6OpenChoices"]').first().click();
  await page.locator('[data-act="stage6Generator"]').click();
  await inspect(page, 'generator', out);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
  await page.locator('[data-act="editPlans"]').first().click();
  await page.locator('[data-act="programNew"]').click();
  await inspect(page, 'editor', out);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await inspect(page, 'workout', out);
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeVisible();
  await inspect(page, 'timer', out);
});

test('local Manrope files and Polish glyphs are cached for offline use', async ({ page, context }, info) => {
  await boot(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('gymverse-v55');
    return Promise.all(['manrope-latin-variable.woff2', 'manrope-latin-ext-variable.woff2'].map(async name => {
      const response = await cache.match(`./src/ui/fonts/${name}`);
      const bytes = response && new Uint8Array(await response.arrayBuffer());
      return { name, status: response?.status, signature: bytes && String.fromCharCode(...bytes.slice(0, 4)) };
    }));
  });
  expect(cached).toEqual([
    { name: 'manrope-latin-variable.woff2', status: 200, signature: 'wOF2' },
    { name: 'manrope-latin-ext-variable.woff2', status: 200, signature: 'wOF2' }
  ]);
  if (info.project.name === 'webkit') return; // Playwright WebKit offline network emulation has a known engine error; cache is verified above.
  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(async () => {
      await document.fonts.load('600 16px Manrope', 'Zażółć gęślą jaźń');
      return document.fonts.check('600 16px Manrope', 'Zażółć gęślą jaźń');
    })).toBe(true);
    await expect(page.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
  } finally { await context.setOffline(false); }
});
