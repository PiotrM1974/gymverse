import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { seedMuscleMapWorkout } from './helpers/seed-musclemap-workout.js';

const output = resolve(process.cwd(), 'outputs/GV-MUSCLEMAP-HIGHLIGHT-ENGINE');
test.beforeEach(async ({ page }) => { await seedMuscleMapWorkout(page); });
const views = [
  { sex: 'male', view: 'front', exercise: 'lat_raise_stand' },
  { sex: 'male', view: 'back', exercise: 'lat_raise_stand' },
  { sex: 'female', view: 'front', exercise: 'lat_raise_stand' },
  { sex: 'female', view: 'back', exercise: 'lat_raise_stand' }
];

async function selectAtlas(page, atlas, item) {
  await page.evaluate(() => window.GymNastikaMuscleAtlas.setHighlightMode('original'));
  await atlas.locator(`[data-atlas-sex="${item.sex}"]`).click();
  await atlas.locator(`[data-atlas-view="${item.view}"]`).click();
  await page.evaluate(id => window.GymNastikaMuscleAtlas.update(id), item.exercise);
  await atlas.locator('img.anatomy-atlas__body').evaluate(image => image.decode());
}

test('diagnostic image, mask, overlay and labeled boundaries for all four bodies', async ({ page }) => {
  test.setTimeout(120000);
  mkdirSync(resolve(output, 'diagnostic'), { recursive: true });
  await page.setViewportSize({ width: 430, height: 1600 });
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  for (let i = 0; i < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); i++) await page.locator('#btnNextStep').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  const findings = [];
  for (const item of views) {
    await selectAtlas(page, atlas, item);
    const slug = `${item.sex}-${item.view}`;
    const figure = atlas.locator('.anatomy-atlas__figure-wrap');
    const geometry = await figure.evaluate(root => {
      const image = root.querySelector('img');
      const svg = root.querySelector('svg');
      const ir = image.getBoundingClientRect();
      const sr = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      return {
        natural: [image.naturalWidth, image.naturalHeight],
        viewBox: [vb.x, vb.y, vb.width, vb.height],
        imageBox: { x: ir.x, y: ir.y, width: ir.width, height: ir.height },
        svgBox: { x: sr.x, y: sr.y, width: sr.width, height: sr.height },
        imageSvgDeltaPx: Math.max(Math.abs(ir.x - sr.x), Math.abs(ir.y - sr.y), Math.abs(ir.width - sr.width), Math.abs(ir.height - sr.height)),
        svgAspect: vb.width / vb.height,
        imageAspect: image.naturalWidth / image.naturalHeight,
        muscleCount: svg.querySelectorAll('.anatomy-atlas__muscle').length,
        labeledIds: [...new Set([...svg.querySelectorAll('[data-muscle-id]')].map(path => path.dataset.muscleId))].sort()
      };
    });
    expect(geometry.imageSvgDeltaPx).toBeLessThan(.1);
    expect(Math.abs(geometry.svgAspect - geometry.imageAspect)).toBeLessThan(1e-6);
    await figure.screenshot({ path: resolve(output, 'diagnostic', `${slug}-overlay.png`) });
    await figure.evaluate(root => { root.querySelector('svg').style.visibility = 'hidden'; });
    await figure.screenshot({ path: resolve(output, 'diagnostic', `${slug}-image-only.png`) });
    await figure.evaluate(root => {
      root.querySelector('svg').style.visibility = '';
      root.querySelector('img').style.visibility = 'hidden';
      root.style.background = '#fff';
      for (const path of root.querySelectorAll('svg path')) {
        path.style.fill = '#a8b8c8'; path.style.fillOpacity = '.55'; path.style.stroke = '#334155'; path.style.strokeWidth = '1';
      }
    });
    await figure.screenshot({ path: resolve(output, 'diagnostic', `${slug}-masks-only.png`) });
    await selectAtlas(page, atlas, item);
    await figure.evaluate(root => {
      const svg = root.querySelector('svg');
      for (const path of svg.querySelectorAll('path')) {
        path.style.fill = 'transparent'; path.style.stroke = '#087c87'; path.style.strokeWidth = '1.3'; path.style.strokeOpacity = '.9';
      }
    });
    await figure.screenshot({ path: resolve(output, 'diagnostic', `${slug}-all-boundaries.png`) });
    await figure.evaluate(root => {
      const svg = root.querySelector('svg');
      const seen = new Set();
      for (const path of svg.querySelectorAll('[data-muscle-id]')) {
        const id = path.dataset.muscleId;
        if (seen.has(id)) continue;
        seen.add(id);
        const box = path.getBBox();
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', String(box.x + box.width / 2));
        label.setAttribute('y', String(box.y + box.height / 2));
        label.setAttribute('font-size', '12');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#002b36');
        label.setAttribute('stroke', '#fff');
        label.setAttribute('stroke-width', '2');
        label.setAttribute('paint-order', 'stroke');
        label.textContent = id;
        svg.appendChild(label);
      }
    });
    await figure.screenshot({ path: resolve(output, 'diagnostic', `${slug}-ids.png`) });
    findings.push({ ...item, ...geometry });
  }
  writeFileSync(resolve(output, 'diagnostic-geometry.json'), JSON.stringify(findings, null, 2));
});

test('audit overlapping active masks for the four exercise mappings', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  for (let i = 0; i < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); i++) await page.locator('#btnNextStep').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  const results = [];
  for (const exercise of ['lat_raise_stand', 'db_bench', 'lat_pulldown_wide', 'leg_press']) {
    for (const sex of ['male', 'female']) for (const view of ['front', 'back']) {
      await selectAtlas(page, atlas, { exercise, sex, view });
      const overlaps = await atlas.locator('svg').evaluate(svg => {
        const paths = [...svg.querySelectorAll('.anatomy-atlas__muscle--primary,.anatomy-atlas__muscle--secondary')];
        const records = [];
        for (let i = 0; i < paths.length; i++) for (let j = i + 1; j < paths.length; j++) {
          const a = paths[i], b = paths[j];
          const ar = a.getBBox(), br = b.getBBox();
          const left = Math.max(ar.x, br.x), top = Math.max(ar.y, br.y);
          const right = Math.min(ar.x + ar.width, br.x + br.width), bottom = Math.min(ar.y + ar.height, br.y + br.height);
          if (right <= left || bottom <= top) continue;
          let hits = 0;
          for (let y = top + 2; y < bottom; y += 4) for (let x = left + 2; x < right; x += 4) {
            const point = svg.createSVGPoint(); point.x = x; point.y = y;
            if (a.isPointInFill(point) && b.isPointInFill(point)) hits++;
          }
          if (hits) records.push({ a: a.dataset.muscleId, b: b.dataset.muscleId, roleA: a.classList.contains('anatomy-atlas__muscle--primary') ? 'primary' : 'secondary', roleB: b.classList.contains('anatomy-atlas__muscle--primary') ? 'primary' : 'secondary', approxArea: hits * 16 });
        }
        return records;
      });
      results.push({ exercise, sex, view, overlaps });
    }
  }
  mkdirSync(output, { recursive: true });
  writeFileSync(resolve(output, 'active-mask-overlaps.json'), JSON.stringify(results, null, 2));
});

test('compare blend modes on identical source masks and body images', async ({ page }) => {
  test.setTimeout(120000);
  const directory = resolve(output, 'blend-spike');
  mkdirSync(directory, { recursive: true });
  await page.setViewportSize({ width: 430, height: 1600 });
  await page.goto('/');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  for (let i = 0; i < 5 && await page.locator('#anatomyAtlas').evaluate(el => el.hidden); i++) await page.locator('#btnNextStep').click();
  const atlas = page.locator('#anatomyAtlas');
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  const cases = [
    { sex: 'male', view: 'front', exercise: 'lat_raise_stand' },
    { sex: 'male', view: 'back', exercise: 'lat_pulldown_wide' },
    { sex: 'female', view: 'front', exercise: 'db_bench' },
    { sex: 'female', view: 'back', exercise: 'lat_raise_stand' }
  ];
  const modes = [
    { id: 'original', blend: 'normal', opacity: null },
    { id: 'multiply-80', blend: 'multiply', opacity: .8 },
    { id: 'color-80', blend: 'color', opacity: .8 },
    { id: 'normal-55', blend: 'normal', opacity: .55 },
    { id: 'dual', blend: 'multiply', opacity: .55 },
    { id: 'color-dual', blend: 'color', opacity: .8 }
  ];
  const observations = [];
  const shots = [];
  for (const item of cases) {
    for (const mode of modes) {
      await selectAtlas(page, atlas, item);
      const figure = atlas.locator('.anatomy-atlas__figure-wrap');
      if (mode.id !== 'original') await figure.evaluate((root, selected) => {
        root.style.isolation = 'isolate';
        for (const path of root.querySelectorAll('.anatomy-atlas__muscle--primary,.anatomy-atlas__muscle--secondary')) {
          const fill = getComputedStyle(path).fill;
          path.style.mixBlendMode = selected.blend;
          path.style.fillOpacity = '1';
          path.style.opacity = String(selected.opacity);
          if (selected.id === 'dual' || selected.id === 'color-dual') {
            const tint = path.cloneNode(false);
            tint.removeAttribute('class');
            tint.removeAttribute('data-muscle-id');
            tint.removeAttribute('aria-label');
            tint.style.fill = fill;
            tint.style.fillOpacity = '1';
            tint.style.opacity = selected.id === 'dual' ? '.28' : '.22';
            tint.style.stroke = 'none';
            tint.style.mixBlendMode = 'normal';
            tint.style.pointerEvents = 'none';
            root.querySelector('svg').appendChild(tint);
          }
        }
      }, mode);
      const properties = await figure.evaluate(root => {
        const path = root.querySelector('.anatomy-atlas__muscle--primary');
        const style = path ? getComputedStyle(path) : null;
        return { isolation: getComputedStyle(root).isolation, blend: style?.mixBlendMode ?? null, opacity: style?.opacity ?? null, fill: style?.fill ?? null };
      });
      const name = `${item.sex}-${item.view}-${item.exercise}-${mode.id}.png`;
      const path = resolve(directory, name);
      await figure.screenshot({ path });
      shots.push({ item, mode: mode.id, image: readFileSync(path).toString('base64') });
      observations.push({ ...item, mode: mode.id, ...properties });
    }
  }
  writeFileSync(resolve(output, 'blend-spike-results.json'), JSON.stringify(observations, null, 2));
  const board = await page.context().newPage();
  await board.setViewportSize({ width: 1900, height: 1200 });
  await board.setContent(`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:12px;background:#e8edf0;font:14px Arial;color:#22313a}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px}.cell{background:white;padding:8px;border-radius:9px}.cell h2{font-size:13px;margin:0 0 7px}.cell img{width:100%;display:block}</style><main class="grid">${shots.map(shot => `<div class="cell"><h2>${shot.item.sex} ${shot.item.view} ${shot.item.exercise} — ${shot.mode}</h2><img src="data:image/png;base64,${shot.image}"></div>`).join('')}</main>`);
  await board.screenshot({ path: resolve(output, 'blend-spike-board.png'), fullPage: true });
  await board.close();
  expect(observations.filter(o => o.mode === 'multiply-80').every(o => o.blend === 'multiply' && o.isolation === 'isolate')).toBe(true);
});
