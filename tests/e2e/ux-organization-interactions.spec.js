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


test('touch controls and enlarged text keep the home, settings and generator usable',async({browser})=>{
 const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:320,height:844},baseURL:'http://127.0.0.1:'+process.env.PORT});const page=await context.newPage();await boot(page);
 await page.getByRole('button',{name:'Ustawienia',exact:true}).tap();await expect(page.locator('#view-settings')).toHaveClass(/active/);await page.locator('#backupMenuToggle').tap();await expect(page.locator('#backupActionMenu')).toBeVisible();
 await page.locator('.header-nav [data-view="view-plans"]').tap();await page.locator('[data-act="stage6OpenChoices"]').first().tap();await page.locator('[data-act="stage6Generator"]').tap();await page.locator('[data-act="generatorNext"]').tap();
 for(const key of ['mon','wed','fri'])await page.locator('[name="generatorSchedule"][value="'+key+'"]').tap();await expect(page.locator('[name="generatorSchedule"][value="tue"]')).toBeDisabled();
 for(const selector of ['.settings-toggle','.day-stepper button','.generator-schedule label'])for(const box of await page.locator(selector).evaluateAll(elements=>elements.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height};})))expect(box.h).toBeGreaterThanOrEqual(44);
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Ustawienia',exact:true}).tap();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.header-nav [data-view="view-plans"]').tap();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await context.close();
});
test('keyboard focus stays explicit and stepper works with Enter and Space',async({page})=>{
 await boot(page);const gear=page.getByRole('button',{name:'Ustawienia',exact:true});await gear.focus();await expect(gear).toBeFocused();await expect(gear).toHaveCSS('outline-style','solid');await gear.press('Enter');await page.locator('#backupMenuToggle').focus();await page.locator('#backupMenuToggle').press('Space');await expect(page.locator('#backupActionMenu')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#backupActionMenu')).toBeHidden();
 await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('[data-act="stage6OpenChoices"]').first().click();await page.locator('[data-act="stage6Generator"]').click();await page.locator('[data-act="generatorNext"]').click();await page.getByRole('button',{name:'Więcej dni'}).press('Enter');await expect(page.locator('#generatorDays')).toHaveText('4 dni');await page.getByRole('button',{name:'Mniej dni'}).press('Space');await expect(page.locator('#generatorDays')).toHaveText('3 dni');
});
test('program deletion failure preserves records and retry deletes only the intended program',async({page})=>{
 await boot(page);await page.locator('[data-act="editPlans"]').click();const before=await raw(page);
 await page.evaluate(()=>{const store=window.__gymverseTestHarness.getStore(),original=store.transact.bind(store);let fail=true;store.transact=async updates=>{if(fail&&updates.gymverse_profiles_v1){fail=false;throw Error('synthetic refusal');}return original(updates);};});
 const button=page.locator('.managed-program[data-id="'+A+'"] [data-act="programDelete"]');await button.click();await expect(page.locator('#toast')).toContainText('Nie usunięto programu');const failed=await raw(page);for(const key of ['gymverse_profiles_v1','gymverse_plans','gymverse_history'])expect(failed[key]).toBe(before[key]);await button.click();await expect(page.locator('.managed-program')).toHaveCount(1);const after=await raw(page);expect(after.gymverse_plans).toBe(before.gymverse_plans);expect(after.gymverse_history).toBe(before.gymverse_history);
});
