import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const evidenceDir = fileURLToPath(new URL('../../outputs/GV-EXERCISE-VISUAL-UNIFICATION-AND-UI-HARDENING/', import.meta.url));

test('atlas legend and long precision text stay inside a narrow desktop card', async ({ page }) => {
  await mkdir(evidenceDir, { recursive: true });
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'pull_a1', title: 'Pull A1', exercises: [{ key: 'lat_pulldown_wide', sets: 2, target: '8-12' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'atlas-profile', profiles: [{ id: 'atlas-profile', name: 'Atlas test', attributes: { trainingGoal: 'fitness' }, data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [] } }] }));
  });
  await page.reload();
  await expect(page.locator('[data-act="startPlan"][data-plan="pull_a1"]')).toBeVisible();
  await page.locator('[data-act="startPlan"][data-plan="pull_a1"]').click();
  await page.locator('#trainingAtlasDisclosure > summary').click();
  const atlas = page.locator('#anatomyAtlas');
  await expect(atlas).toBeVisible();
  await page.evaluate(() => window.GymNastikaMuscleAtlas.update(document.querySelector('#anatomyAtlas').dataset.exerciseId, { showSexControl: true, showDisclosure: false }));
  await atlas.evaluate(element => {
    element.style.width = '468px';
    element.style.maxWidth = '468px';
  });
  await atlas.locator('.anatomy-atlas__details summary').click();

  const measure = () => atlas.evaluate(element => {
    const bounds = node => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    };
    const layout = element.querySelector('.anatomy-atlas__layout');
    const legend = element.querySelector('.anatomy-atlas__legend');
    const textNodes = [...element.querySelectorAll('.anatomy-atlas__legend h3, .anatomy-atlas__list li, .anatomy-atlas__details summary, .anatomy-atlas__precision li, .anatomy-atlas__note')];
    return {
      card: bounds(element),
      layout: bounds(layout),
      figure: bounds(element.querySelector('.anatomy-atlas__figure-wrap')),
      legend: bounds(legend),
      text: textNodes.map(node => ({ text: node.textContent.trim(), ...bounds(node) })),
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth
    };
  });
  const assertContained = result => {
    expect(result.legend.right, JSON.stringify(result)).toBeLessThanOrEqual(result.card.right + 0.5);
    for (const item of result.text) {
      expect(item.right, `${item.text}: ${JSON.stringify(result)}`).toBeLessThanOrEqual(result.card.right + 0.5);
    }
    expect(result.scrollWidth, JSON.stringify(result)).toBeLessThanOrEqual(result.clientWidth + 1);
  };

  const result = await measure();
  await page.screenshot({ path: join(evidenceDir, 'atlas-narrow-card-current.png'), fullPage: true });
  await writeFile(join(evidenceDir, 'atlas-narrow-card-current.json'), JSON.stringify(result, null, 2));
  assertContained(result);

  const silhouettes = [];
  for (const sex of ['male', 'female']) {
    await atlas.locator(`[data-atlas-sex="${sex}"]`).click();
    for (const view of ['front', 'back']) {
      await atlas.locator(`[data-atlas-view="${view}"]`).click();
      const measurement = await measure();
      assertContained(measurement);
      silhouettes.push({ sex, view, ...measurement });
    }
  }

  const desktopWidths = [];
  for (const width of [560, 640, 700, 900]) {
    await atlas.evaluate((element, nextWidth) => {
      element.style.width = `${nextWidth}px`;
      element.style.maxWidth = `${nextWidth}px`;
    }, width);
    const measurement = await measure();
    assertContained(measurement);
    desktopWidths.push({ width, ...measurement });
  }
  await atlas.evaluate(element => { element.style.width = ''; element.style.maxWidth = ''; });
  const mobileWidths = [];
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 900 });
    const measurement = await measure();
    assertContained(measurement);
    mobileWidths.push({ width, ...measurement });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await atlas.evaluate(element => {
    element.style.width = '468px';
    element.style.maxWidth = '468px';
  });
  await page.screenshot({ path: join(evidenceDir, 'atlas-narrow-card-current.png'), fullPage: true });
  await writeFile(join(evidenceDir, 'atlas-layout-widths-after.json'), JSON.stringify({ silhouettes, desktopWidths, mobileWidths }, null, 2));
});
