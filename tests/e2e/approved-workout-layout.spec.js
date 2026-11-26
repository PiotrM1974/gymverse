import { test, expect } from '@playwright/test';

test('technique and expanded MuscleMap stay above sets in both Signal themes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-act="stage6CreateProfile"]').click();
  await page.locator('#newProfileName').fill('Profil syntetyczny');
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('[data-act="profileNext"]').click();
  await page.locator('[data-act="createProfile"]').click();
  await page.locator('#view-plan-choices [data-act="stage6Skip"]').first().click();
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('.exercise-hero > summary').click();
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#trainingAtlasDisclosure > summary').click();

  for (const [theme, colors, fillRgb, onFill, backgroundRgb] of [
    ['light', ['#0647D8', '#F35B16', '#00979E', '#715C00'], 'rgb(6, 71, 216)', 'rgb(255, 255, 255)', 'rgb(244, 246, 248)'],
    ['dark', ['#5D90FF', '#FF7A32', '#35D6D0', '#FFDC3D'], 'rgb(93, 144, 255)', 'rgb(10, 27, 53)', 'rgb(13, 20, 32)']
  ]) {
    await page.emulateMedia({ colorScheme: theme });
    await expect(page.locator('#btnDone_0')).toHaveCSS('background-color', fillRgb);
    await expect(page.locator('#appHeader')).toHaveCSS('background-color', backgroundRgb);
    await expect(page.locator('#anatomyAtlas .anatomy-atlas')).toHaveCSS('background-color', theme === 'dark' ? 'rgb(28, 42, 58)' : 'rgb(255, 255, 255)');
    await expect(page.locator('#anatomyAtlas .anatomy-atlas__legend-group h3').first()).toHaveCSS('color', theme === 'dark' ? 'rgb(246, 248, 251)' : 'rgb(23, 33, 43)');
    const state = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const css = getComputedStyle(document.documentElement);
      const figure = document.querySelector('#exercisePresentationFigure');
      return {
        imageBeforeAtlas: rect('.exercise-hero').bottom <= rect('#trainingAtlasDisclosure').top,
        atlasBeforeSets: rect('#trainingAtlasDisclosure').bottom <= rect('.workout-control-card').top,
        figureWidth: figure.getBoundingClientRect().width,
        imageWidth: document.querySelector('#exercisePresentationImage').getBoundingClientRect().width,
        imageLoaded: document.querySelector('#exercisePresentationImage').naturalWidth > 0,
        colors: ['--accent-fill', '--push', '--pull', '--yellow-text'].map(token => css.getPropertyValue(token).trim()),
        doneBackground: getComputedStyle(document.querySelector('#btnDone_0')).backgroundColor,
        doneText: getComputedStyle(document.querySelector('#btnDone_0')).color,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        legendReadable: [...document.querySelectorAll('#anatomyAtlas .anatomy-atlas__legend-group')].every(group =>
          group.querySelector('h3').getBoundingClientRect().bottom <= group.querySelector('li').getBoundingClientRect().top)
      };
    });
    expect(state.imageBeforeAtlas).toBe(true);
    expect(state.atlasBeforeSets).toBe(true);
    expect(state.imageLoaded).toBe(true);
    expect(Math.abs(state.imageWidth - state.figureWidth)).toBeLessThan(3);
    expect(state.colors).toEqual(colors);
    expect(state.doneBackground).toBe(fillRgb);
    expect(state.doneText).toBe(onFill);
    expect(state.overflow).toBe(false);
    expect(state.legendReadable).toBe(true);
  }

  await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src', /bench_flat__default-female\.webp/);
  await expect(page.locator('#anatomyAtlas .anatomy-atlas__body')).toHaveAttribute('src', /female-front\.webp/);
  await expect(page.locator('#weight_0')).toHaveValue('40');
  await expect(page.locator('#reps_0')).toHaveValue('8');

  await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeVisible();
  await page.locator('#restScreen [data-act="timerSkip"]').click();
  await expect(page.locator('#restScreen')).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const bottomOverlap = await page.evaluate(() => {
    const lastAction = document.querySelector('#view-workout [data-act="discard"]').getBoundingClientRect();
    const timer = document.querySelector('#timerBar').getBoundingClientRect();
    return { lastActionBottom: lastAction.bottom, timerTop: timer.top };
  });
  expect(bottomOverlap.lastActionBottom).toBeGreaterThan(0);
});
