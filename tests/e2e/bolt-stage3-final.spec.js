import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

for (const width of [320,375,390,430]) for (const theme of ['light','dark']) {
  test(`collapsed technique and series ${width} ${theme}`, async ({page}) => {
    await page.setViewportSize({width,height:844}); await page.emulateMedia({colorScheme:theme});
    await page.goto('/'); await page.evaluate(() => {localStorage.clear();sessionStorage.clear();localStorage.setItem('gymverse_plans',JSON.stringify([{id:'final-synthetic',title:'Synthetic',exercises:[{key:'bench_flat',sets:3,target:'8-12'}]}]));});
    await page.reload(); await page.locator('[data-act="startPlan"][data-plan="final-synthetic"]').click();
    await expect(page.locator('.exercise-hero')).not.toHaveAttribute('open','');
    await expect(page.locator('.exercise-hero > summary')).toHaveText('Technika');
    await expect(page.locator('#metaExerciseProgress')).toHaveText('Wykonane 0/3');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const row=await page.locator('#setsBody .set-row').first().boundingBox(); expect(row.y).toBeLessThan(844);
    await mkdir('outputs/GV-BOLT-STAGE3-FINAL/screenshots',{recursive:true});
    if (width===390 || width===320 && theme==='dark') await page.screenshot({animations:'disabled',path:`outputs/GV-BOLT-STAGE3-FINAL/screenshots/${theme}-${width}.png`});
    if (width===390 && theme==='dark') {
      await page.locator('.exercise-hero > summary').click();
      await expect(page.locator('#exercisePresentationImage')).toBeVisible();
      await expect(page.locator('#exercisePresentation [data-presentation-sex="female"]')).toBeVisible();
      await page.locator('.exercise-hero').screenshot({path:'outputs/GV-BOLT-STAGE3-FINAL/screenshots/technika-open.png'});
      await page.locator('.exercise-hero > summary').click();
      await page.locator('#weight_0').fill('40'); await page.locator('#reps_0').fill('8'); await page.locator('#btnDone_0').click();
      await expect(page.locator('#metaExerciseProgress')).toHaveText('Wykonane 1/3');
      await page.locator('[data-act="timerSkip"]').click();
      await page.screenshot({path:'outputs/GV-BOLT-STAGE3-FINAL/screenshots/wykonane.png'});
    }
  });
}
