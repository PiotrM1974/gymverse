import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

for(const width of [320,375,390,430]) for(const theme of ['light','dark']) test(`standalone welcome ${width} ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({colorScheme:theme});await page.goto('/');
 await expect(page.locator('#stage6Welcome')).toBeVisible();await expect(page.locator('#planList')).toBeHidden();await expect(page.locator('#profileManage')).toBeHidden();await expect(page.locator('.header-nav')).toBeHidden();await expect(page.locator('#skipProfileSetup')).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const styles=await page.locator('#stage6WelcomeTitle').evaluate(el=>{const s=getComputedStyle(el);return {font:s.fontFamily,weight:s.fontWeight,lineHeight:s.lineHeight,spacing:s.letterSpacing}});console.log('WELCOME_TYPOGRAPHY',JSON.stringify(styles));
 await mkdir('outputs/GV-BOLT-STAGE6-WELCOME/screenshots',{recursive:true});if(width===390||width===320&&theme==='dark')await page.screenshot({animations:'disabled',path:`outputs/GV-BOLT-STAGE6-WELCOME/screenshots/welcome-${theme}-${width}.png`});
 await page.locator('[data-act="stage6CreateProfile"]').click();await expect(page.locator('#newProfileName')).toBeVisible();await expect(page.locator('#planList')).toBeHidden();await page.locator('#newProfileName').fill('Profil syntetyczny');await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="createProfile"]').click();await expect(page.locator('#view-plan-choices')).toBeVisible();await expect(page.locator('#view-plan-choices .stage6-choice-grid button')).toHaveCount(4);
 if(width===390&&theme==='light'){await expect(page.locator('#toast')).not.toHaveClass(/show/);await page.screenshot({animations:'disabled',path:'outputs/GV-BOLT-STAGE6-WELCOME/screenshots/configured-light-390.png'});}
});
