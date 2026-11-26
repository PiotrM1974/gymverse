import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

async function start(page, exercises=[{key:'bench_flat',variantId:'default'}]) {
  await page.goto('/'); await page.evaluate(exercises=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('gymverse_plans',JSON.stringify([{id:'stage5-synthetic',title:'Synthetic',exercises:exercises.map(item=>({...item,sets:3,target:'8-12'}))}]));},exercises); await page.reload();await page.locator('[data-act="startPlan"][data-plan="stage5-synthetic"]').click();
}
test('dedicated variant images do not claim the image is missing',async({page})=>{
  await start(page,[{key:'db_fly',variantId:'incline'},{key:'shoulder_press',variantId:'dumbbells'},{key:'tri_overhead',variantId:'rope'},{key:'leg_press',variantId:'high_feet'}]);
  await page.locator('.exercise-hero > summary').click();
  for (const [i,id] of ['db_fly__incline','shoulder_press__dumbbells','tri_overhead__rope','leg_press__default'].entries()) {
    await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src',new RegExp(id+'-male[.]webp$'));
    await expect(page.locator('#variantImageMissing')).toBeHidden();
    if(i===3) await expect(page.locator('#variantImageShared')).toBeVisible(); else await expect(page.locator('#variantImageShared')).toBeHidden();
    if(i<3) await page.locator('#btnNextStep').click();
  }
});
for(const width of [320,375,390,430]) for(const theme of ['light','dark']) test(`technique and atlas ${width} ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme});await start(page);
  await expect(page.locator('.exercise-hero')).not.toHaveAttribute('open','');expect((await page.locator('#setsBody .set-row').first().boundingBox()).y).toBeLessThan(844);
  await mkdir('outputs/GV-BOLT-STAGE5/screenshots',{recursive:true});
  if(width===390||width===320&&theme==='dark') await page.screenshot({animations:'disabled',path:`outputs/GV-BOLT-STAGE5/screenshots/closed-${theme}-${width}.png`});
  await page.locator('.exercise-hero > summary').click();await expect(page.locator('#exercisePresentationImage')).toBeVisible();
  await expect(page.locator('#exercisePresentationCaption [data-panel="lower"]')).toContainText('DÓŁ');await expect(page.locator('#exercisePresentationCaption [data-panel="raised"]')).toContainText('GÓRA');
  await page.locator('#exercisePresentation [data-presentation-sex="female"]').click();await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src',/bench_flat__default-female[.]webp$/);
  await page.locator('#trainingAtlasDisclosure > summary').click();await expect(page.locator('#anatomyAtlas')).toBeVisible();
  await expect(page.locator('.anatomy-atlas__legend-group').first()).toContainText('Główne mięśnie');await expect(page.locator('.anatomy-atlas__legend-group').nth(1)).toContainText('Mięśnie pomocnicze');
  await page.locator('[data-atlas-view="back"]').click();await expect(page.locator('[data-atlas-view="back"]')).toHaveAttribute('aria-pressed','true');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const selector of ['#exercisePresentation [data-presentation-sex="female"]','[data-atlas-view="front"]','[data-atlas-view="back"]']) expect((await page.locator(selector).boundingBox()).height).toBeGreaterThanOrEqual(44);
  await page.locator('.anatomy-atlas__details > summary').click();await expect(page.locator('.anatomy-atlas__precision')).toBeVisible();await expect(page.locator('.anatomy-atlas__precision')).toContainText('przybliżony');
  if(width===390||width===320&&theme==='dark'){await page.locator('#view-workout').screenshot({animations:'disabled',style:'#appHeader{visibility:hidden!important}',path:`outputs/GV-BOLT-STAGE5/screenshots/${theme}-${width}.png`});}
  if(width===390&&theme==='dark'){await page.locator('.exercise-hero').screenshot({animations:'disabled',style:'#appHeader{visibility:hidden!important}',path:'outputs/GV-BOLT-STAGE5/screenshots/technique-dark.png'});await page.locator('#trainingAtlasDisclosure').screenshot({animations:'disabled',style:'#appHeader{visibility:hidden!important}',path:'outputs/GV-BOLT-STAGE5/screenshots/atlas-dark.png'});}
});
