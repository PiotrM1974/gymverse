import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const registry = JSON.parse(readFileSync(new URL('../../src/data/exercise-presentations/release-registry.json', import.meta.url)));
const entries = [
  ...registry.records.map(record => ({ key: record.exerciseId, variantId: record.variantId, source: record })),
  { key: 'leg_press', variantId: 'high_feet', source: registry.records.find(record => record.exerciseId === 'leg_press' && record.variantId === 'default') }
];

test('all accepted technique boards show both panels in the mobile workout card', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.evaluate(planEntries => {
    localStorage.clear();
    localStorage.setItem('gymverse_plans', JSON.stringify([{
      id: 'all_panels_synthetic', title: 'Syntetyczna kontrola ilustracji',
      exercises: planEntries.map(({ key, variantId }) => ({ key, variantId, sets: 1, target: '8-10' }))
    }]));
  }, entries.map(({ key, variantId }) => ({ key, variantId })));
  await page.reload();
  await page.locator('[data-act="startPlan"][data-plan="all_panels_synthetic"]').click();
  await page.locator('.exercise-hero > summary').click();

  for (const [index, entry] of entries.entries()) {
    await expect(page.locator('#exercisePresentation')).toHaveAttribute('data-exercise-id', entry.key);
    for (const sex of ['male', 'female']) {
      await page.locator(`#exercisePresentation [data-presentation-sex="${sex}"]`).click();
      const image = page.locator('#exercisePresentationImage');
      await expect.poll(() => image.evaluate(node => [node.naturalWidth, node.naturalHeight])).toEqual([768, 512]);
      expect(await image.getAttribute('src')).toMatch(new RegExp(`${entry.source.bySex[sex].technique.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
      const geometry = await page.evaluate(() => {
        const figure = document.querySelector('#exercisePresentationFigure').getBoundingClientRect();
        const image = document.querySelector('#exercisePresentationImage');
        const rendered = image.getBoundingClientRect();
        const style = getComputedStyle(image);
        return { figure: [figure.width, figure.height], image: [rendered.width, rendered.height], fit: style.objectFit, transform: style.transform, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(geometry.figure[0], `${entry.key}/${entry.variantId}/${sex}`).toBeGreaterThan(240);
      expect(Math.abs(geometry.figure[0] / geometry.figure[1] - 1.5)).toBeLessThan(.02);
      expect(Math.abs(geometry.image[0] - geometry.figure[0])).toBeLessThan(3);
      expect(Math.abs(geometry.image[1] - geometry.figure[1])).toBeLessThan(3);
      expect(geometry.fit).toBe('contain');
      expect(geometry.transform).toBe('none');
      expect(geometry.overflow).toBe(false);
    }
    await expect(page.locator('#exercisePresentation [data-presentation-position]')).toHaveCount(0);
    await expect(page.locator('#exercisePresentation [data-presentation-mode]')).toHaveCount(0);
    await expect(page.locator('[data-legacy-image-mode]')).toHaveCount(0);
    for (const panel of ['lower', 'raised']) {
      const caption = page.locator(`#exercisePresentationCaption [data-panel="${panel}"]`);
      await expect(caption).toBeVisible();
      await expect(caption).toContainText(entry.source.labels?.[panel] || (panel === 'lower' ? 'DÓŁ' : 'GÓRA'));
      expect((await caption.textContent()).trim().length).toBeGreaterThan(12);
    }
    if (index < entries.length - 1) await page.locator('#btnNextStep').click();
  }
});
