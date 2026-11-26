import {mkdir} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
const A='pg_'+'a'.repeat(32),B='pg_'+'b'.repeat(32),C='pg_'+'c'.repeat(32);
const raw=page=>page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());
async function boot(page,count=4){
  page.on('dialog',dialog=>dialog.accept());
  await page.addInitScript(({A,B,C,count})=>{
    if(localStorage.getItem('home-program-seeded'))return;
    localStorage.setItem('home-program-seeded','1');
    const exercise={key:'bench_flat',variantId:'default',sets:1,target:'8-10',restSeconds:60};
    const days=Array.from({length:count},(_,i)=>({id:'day-'+i,title:i%2?'PULL':'PUSH',exercises:[exercise,{key:'db_fly',variantId:'default',sets:1,target:'10-12',restSeconds:60}]}));
    const single={id:'standalone',title:'PUSH',dayOfWeek:'mon',exercises:[exercise]},other={id:'other-day',title:'PUSH',exercises:[exercise]},second={id:'second-profile-day',title:'Drugi profil',exercises:[exercise]};
    const profiles=[{id:'profile-a',name:'Profil testowy A',attributes:{age:32,trainingGoal:'hypertrophy',equipment:['dumbbells','bench','machines']},data:{},planPrograms:{schemaVersion:1,assignedProgramId:A,programs:[{id:B,title:'Program dodatkowy',dayPlanIds:[other.id]},{id:A,title:`PUSH / PULL — ${count} dni`,dayPlanIds:days.map(day=>day.id)}]}},{id:'profile-b',name:'Profil testowy B',attributes:{},data:{gymverse_plans:JSON.stringify([second]),gymverse_history:'[]'},planPrograms:{schemaVersion:1,assignedProgramId:C,programs:[{id:C,title:'Program profilu B',dayPlanIds:[second.id]}]}}];
    localStorage.setItem('gymverse_schema','4');localStorage.setItem('gymverse_plans',JSON.stringify([...days,other,single]));localStorage.setItem('gymverse_history','[]');localStorage.setItem('gymverse_profiles_v1',JSON.stringify({schemaVersion:1,activeProfileId:'profile-a',profiles}));
  },{A,B,C,count});
  await page.goto('/');await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
}


async function enterGenerator(page){await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();await page.locator('[data-act="stage6Generator"]').click();await page.locator('[data-act="generatorNext"]').click();}
for(const theme of ['light','dark'])test('nine UX screens fit mobile widths '+theme,async({page})=>{
 test.setTimeout(90000);await boot(page);await page.emulateMedia({colorScheme:theme});await mkdir('outputs/GV-UX-ORGANIZATION',{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 async function capture(name){for(const width of [320,375,390,430]){
 await page.setViewportSize({width,height:844});await page.evaluate(()=>window.scrollTo(0,0));
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(width===390){await expect.poll(()=>page.locator('.view-section.active .program-cover img,.view-section.active img.exercise-thumbnail,.view-section.active img.workout-heading-art').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);await expect(page.locator('#toast')).not.toHaveClass(/show/);await page.screenshot({path:'outputs/GV-UX-ORGANIZATION/'+name+'-'+theme+'-390.png',fullPage:name!=='12-rest',animations:'disabled'});}
 } }
 await capture('01-home');await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.body,'::before').backgroundImage.includes('radial-gradient'))).toBe(true);expect(await page.evaluate(()=>getComputedStyle(document.body,'::before').pointerEvents)).toBe('none');
 await page.locator('#view-plans .program-card').first().click();await page.locator('[data-act="programDay"][data-id="day-1"]').click();await capture('04-program');
 await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('[data-act="editPlans"]').click();await capture('05-editor');
 await page.getByRole('button',{name:'Ustawienia',exact:true}).click();await capture('08-settings');await page.locator('#backupMenuToggle').click();await capture('09-backups');
 await page.locator('.header-nav [data-view="view-stats"]').click();await capture('07-stats');await page.locator('.header-nav [data-view="view-charts"]').click();await capture('10-progress');await page.locator('.header-nav [data-view="view-history"]').click();await capture('11-history');
 await page.locator('.header-nav [data-view="view-plans"]').click();await enterGenerator(page);await capture('02-generator');
 await page.locator('[data-act="generatorNext"]').click();await page.locator('[data-act="generatorNext"]').click();await page.locator('[data-act="generatePlan"]').click();await expect(page.locator('#generatorPreview')).toBeVisible();await expect(page.locator('.generated-exercise-details').first()).not.toHaveAttribute('open','');await page.locator('.generated-exercise-details > summary').first().click();await expect(page.locator('.generated-exercise-information').first()).toBeVisible();await page.locator('.generated-exercise-details > summary').first().click();await capture('03-generated-preview');
 await page.locator('[data-act="saveGeneratedForEdit"]').click();await expect(page.locator('#view-program-editor')).toHaveClass(/active/);await expect(page.locator('[data-program-field="title"]')).toBeEnabled();await page.locator('[data-program-field="title"]').fill('Program po osobnej edycji');await expect(page.locator('[data-working-status]')).toContainText('Szkic zachowany');await capture('05b-program-editor');
 const saved=await raw(page),profile=JSON.parse(saved.gymverse_profiles_v1).profiles[0];expect(profile.planPrograms.programs).toHaveLength(3);expect(profile.planPrograms.assignedProgramId).toBe(A);
 await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('#view-plans .program-card').first().click();await page.locator('[data-act="programDay"][data-id="day-0"]').click();await page.locator('[data-act="programStart"]').click();await expect(page.locator('#weight_0')).toBeVisible();await expect(page.locator('.workout-heading-art')).toHaveAttribute('src',/bench_flat__default-male.webp$/);await capture('06-workout');
 await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();await expect(page.locator('#restScreen')).toBeVisible();await capture('12-rest');await page.locator('#restScreen [data-act="timerSkip"]').click();await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_active).step).toBe(1);await expect(page.locator('.workout-heading-art')).toHaveAttribute('src',/db_fly__default-male.webp$/);
 expect(errors).toEqual([]);
});
