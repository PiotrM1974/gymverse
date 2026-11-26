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

test('settings contains profile and backup actions without cluttering home',async({page})=>{
 await boot(page);const before=await raw(page);
 await expect(page.locator('#view-plans [data-act="addProfile"]')).toHaveCount(0);
 await expect(page.locator('#view-plans #backupMenuToggle')).toHaveCount(0);
 await page.getByRole('button',{name:'Ustawienia',exact:true}).click();
 await expect(page.locator('#view-settings')).toHaveClass(/active/);
 await expect(page.locator('#view-settings [data-act="addProfile"]')).toBeVisible();
 await page.locator('#backupMenuToggle').click();await expect(page.locator('#backupActionMenu [data-act="export"]')).toBeVisible();
 await page.locator('#backupActionMenu [data-act="openStorage"]').click();await expect(page.locator('#view-storage')).toHaveClass(/active/);
 const after=await raw(page);for(const key of ['gymverse_plans','gymverse_profiles_v1','gymverse_history'])expect(after[key]).toBe(before[key]);
});
test('day stepper caps weekdays and preserves entered duration across changes',async({page})=>{
 await boot(page);await page.locator('[data-act="stage6OpenChoices"]').first().click();await page.locator('[data-act="stage6Generator"]').click();
 await page.locator('[data-act="generatorNext"]').click();
 await expect(page.locator('input#generatorDays')).toHaveCount(0);
 await expect(page.locator('#generatorDays')).toHaveText('3 dni');
 await page.locator('#generatorMinutesPreset').selectOption('custom');await page.locator('#generatorMinutesCustom').fill('67');
 for(const key of ['mon','wed','fri'])await page.locator('[name="generatorSchedule"][value="'+key+'"]').check();
 await expect(page.locator('[name="generatorSchedule"][value="tue"]')).toBeDisabled();
 await page.locator('[name="generatorSchedule"][value="wed"]').uncheck();await expect(page.locator('[name="generatorSchedule"][value="tue"]')).toBeEnabled();
 await page.locator('[data-act="generatorDaysMinus"]').click();await expect(page.locator('#generatorDays')).toHaveText('2 dni');
 await expect(page.locator('#generatorMinutesCustom')).toHaveValue('67');
 await page.locator('[data-act="generatorDaysMinus"]').click();await expect(page.locator('[name="generatorSchedule"]:checked')).toHaveCount(2);
 await expect(page.locator('[name="generatorSchedule"][value="mon"]')).toBeChecked();await expect(page.locator('[name="generatorSchedule"][value="fri"]')).toBeChecked();
 await expect(page.locator('[data-act="generatorNext"]')).toBeDisabled();await expect(page.locator('#generatorDays')).toHaveText('1 dzień');
 await expect(page.locator('#generatorScheduleStatus')).toContainText('Odznacz');
 await page.locator('#generatorMinutesPreset').selectOption('45');await expect(page.locator('[name="generatorSchedule"]:checked')).toHaveCount(2);await expect(page.locator('[data-act="generatorNext"]')).toBeDisabled();
 await page.locator('[name="generatorSchedule"][value="fri"]').uncheck();await expect(page.locator('[name="generatorSchedule"]:checked')).toHaveCount(1);
 await expect(page.locator('[data-act="generatorDaysMinus"]')).toBeDisabled();
});
test('saved programs are managed centrally and deletion preserves days and history',async({page})=>{
 await boot(page);const before=await raw(page);
 await page.locator('#view-plans .program-card').first().click();
 await expect(page.locator('#programPreviewBody [data-act="programDelete"]')).toHaveCount(0);
 await expect(page.locator('#programPreviewBody').getByRole('button',{name:'Usuń program',exact:true})).toHaveCount(0);
 await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('[data-act="editPlans"]').click();
 await expect(page.locator('#view-planedit')).toHaveClass(/active/);
 await expect(page.locator('.managed-program')).toHaveCount(2);
 await page.locator('.managed-program[data-id="'+A+'"] [data-act="programDelete"]').click();
 await expect(page.locator('.managed-program')).toHaveCount(1);
 const after=await raw(page);expect(after.gymverse_plans).toBe(before.gymverse_plans);expect(after.gymverse_history).toBe(before.gymverse_history);
 const state=JSON.parse(after.gymverse_profiles_v1);expect(state.profiles[0].planPrograms.assignedProgramId).toBeNull();expect(state.profiles[0].planPrograms.programs.map(p=>p.id)).toEqual([B]);
});


test('settings expose existing profile-wide preferences and release info without changing training data',async({page})=>{
 await boot(page);const before=await raw(page);await page.getByRole('button',{name:'Ustawienia',exact:true}).click();
 await expect(page.locator('#settingsAbout')).toContainText('GymNastika 2.0.3');
 await expect(page.locator('#settingsPreferences')).toContainText('Globalne preferencje treningowe');
 await page.locator('#settingsPreferences [data-act="rest"][data-sec="180"]').click();
 await page.locator('#settingsPreferences [data-act="bar"][data-kg="15"]').click();
 await expect.poll(async()=>Number((await raw(page)).gymverse_bar)).toBe(15);
 await page.reload();await expect(page.locator('.program-card')).toHaveCount(2);await page.getByRole('button',{name:'Ustawienia',exact:true}).click();
 await expect(page.locator('#settingsPreferences [data-act="rest"][data-sec="180"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#settingsPreferences [data-act="bar"][data-kg="15"]')).toHaveAttribute('aria-pressed','true');
 const after=await raw(page);for(const key of ['gymverse_plans','gymverse_history','gymverse_active'])expect(after[key]).toBe(before[key]);
 await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('#profileSelect').selectOption('profile-b');await expect(page.locator('.program-card')).toHaveCount(1);
 await page.getByRole('button',{name:'Ustawienia',exact:true}).click();await expect(page.locator('#settingsPreferences [data-act="rest"][data-sec="0"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('#profileSelect').selectOption('profile-a');await expect(page.locator('.program-card')).toHaveCount(2);
 await page.locator('.program-card').first().click();await page.locator('[data-act="programDay"]').first().click();await page.locator('[data-act="programStart"]').click();
 await expect(page.locator('#exerciseRestCurrent')).toContainText('1:00');expect(JSON.parse((await raw(page)).gymverse_rest)).toBe(180);
});
