import {test,expect} from '@playwright/test';
async function completeOnboarding(page){await page.locator('[data-act="stage6CreateProfile"]').click();await page.locator('#newProfileName').fill('Profil testowy');await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="createProfile"]').click();await page.locator('#view-plan-choices [data-act="stage6Skip"]').first().click();}
for(const width of [320,375,390,430])for(const theme of ['light','dark'])test(`shell ${width} ${theme}`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme});await page.goto('/');await completeOnboarding(page);await page.locator('[data-act="startPlan"]').first().waitFor();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.header-nav button')).toHaveCount(4);
 for(const button of await page.locator('.header-nav button').all()){const rect=await button.boundingBox();expect(rect.height).toBeGreaterThanOrEqual(44);}
 const plans=page.locator('[data-act="startPlan"]');expect(await plans.count()).toBeGreaterThan(0);

 await page.evaluate(()=>window.scrollTo(0,0));await expect(page.locator('#appHeader')).not.toHaveClass(/compact/);
 await page.screenshot({path:`outputs/GV-BOLT-STAGE2/${theme}-${width}.png`,fullPage:true});
 await plans.first().scrollIntoViewIfNeeded();await page.locator('#planList').screenshot({path:`outputs/GV-BOLT-STAGE2/plans-${theme}-${width}.png`});
 await page.locator('#themeSwitch').click();await expect(page.locator('html')).toHaveAttribute('data-theme',theme==='dark'?'light':'dark');
});
test('navigation, profile, backup and workout resume remain reachable',async({page})=>{
 await page.goto('/');await completeOnboarding(page);await page.locator('[data-act="startPlan"]').first().waitFor();
 for(const [view,heading] of [['view-stats','Statystyki'],['view-charts','Progres'],['view-history','Historia']]){await page.locator(`.header-nav [data-view="${view}"]`).click();await expect(page.locator('#'+view)).toHaveClass(/active/);await expect(page.locator(`.header-nav [data-view="${view}"]`)).toHaveAttribute('aria-current','page');}
 await page.locator('.header-nav [data-view="view-plans"]').click();await expect(page.locator('#profileSelect')).toBeVisible();await expect(page.locator('[data-act="export"]').first()).toBeVisible();await expect(page.locator('[data-act="importBtn"]').first()).toBeVisible();
 await page.locator('[data-act="startPlan"]').first().click();await expect(page.locator('#view-workout')).toHaveClass(/active/);await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('[data-act="resume"]').click();await expect(page.locator('#view-workout')).toHaveClass(/active/);
});
test('shell and plan cards work after offline reload',async({page,context})=>{
 await page.goto('/');await completeOnboarding(page);await page.locator('[data-act="startPlan"]').first().waitFor();await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.locator('[data-act="startPlan"]').first().waitFor();await context.setOffline(true);await page.reload();await page.locator('[data-act="startPlan"]').first().waitFor();await page.locator('.header-nav [data-view="view-history"]').click();await expect(page.locator('#view-history')).toHaveClass(/active/);await context.setOffline(false);
});
