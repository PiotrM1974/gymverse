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
const home=page=>page.locator('.header-nav [data-view="view-plans"]').click();
async function libraryProgram(page,id=A){
  await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await page.locator('#view-plan-choices [data-act="stage6Ready"]').click();
  await page.locator('#view-plan-library [data-act="programPreview"][data-id="'+id+'"]').click();
}
for(const count of [1,3,6])test(`home shows one card for a ${count}-day program and excludes its days`,async({page})=>{
  await boot(page,count);const before=await raw(page);
  const cards=page.locator('#view-plans .program-card');
  await expect(cards).toHaveCount(2);await expect(cards.first()).toHaveAttribute('data-id',A);
  await expect(cards.first()).toContainText('Aktywny');await expect(cards.last()).not.toContainText('Aktywny');
  await expect(cards.first()).toContainText(count===1?'1 dzień treningowy':`${count} dni treningowych`);
  await expect(page.locator('#view-plans [data-plan^="day-"], #view-plans [data-plan="other-day"]')).toHaveCount(0);
  await expect(page.locator('#standalonePlans .plan-card')).toHaveCount(1);
  await expect(page.locator('#standalonePlans')).toContainText('Samodzielne treningi');
  await expect(page.locator('#standalonePlans [data-plan="standalone"]')).toContainText('PUSH');
  await cards.first().press('Enter');await expect(page.locator('[data-act="programDay"]')).toHaveCount(count);
  await expect(page.locator('#programSelectedDay')).toBeHidden();
  for(let i=0;i<count;i++){
    await page.locator('[data-act="programDay"][data-id="day-'+i+'"]').click();
    await expect(page.locator('#programSelectedDay')).toBeVisible();
    await expect(page.locator('[data-act="programDay"][data-id="day-'+i+'"]').first()).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#programSelectedDay [data-act="programStart"]')).toBeVisible();
  }
  const after=await raw(page);for(const key of ['gymverse_plans','gymverse_profiles_v1','gymverse_history'])expect(after[key]).toBe(before[key]);
  await page.reload();await home(page);await expect(cards).toHaveCount(2);await expect(cards.first()).toHaveAttribute('data-id',A);
});

test('chosen program day starts with its real program and day identity',async({page})=>{
  await boot(page);await libraryProgram(page);
  await page.locator('[data-act="programDay"][data-id="day-1"]').click();
  await page.locator('[data-act="programStart"]').click();
  await expect(page.locator('#view-workout')).toHaveClass(/active/,{timeout:5000});
  const session=JSON.parse((await raw(page)).gymverse_active);
  expect(session.planId).toBe('day-1');expect(session.sessionContext).toMatchObject({kind:'program',profileId:'profile-a',programId:A,dayPlanId:'day-1',dayNumber:2});
});

test('home assignment switching and profile isolation survive reload without changing days',async({page})=>{
  await boot(page);const before=await raw(page);
  await page.locator('#view-plans .program-card[data-id="'+B+'"]').click();
  await page.locator('[data-act="programAssign"]').click();
  await expect(page.locator('#view-plans .program-card').first()).toHaveAttribute('data-id',B);
  await expect(page.locator('#view-plans .program-card[data-id="'+A+'"]')).not.toContainText('Aktywny');
  await page.reload();await expect(page.locator('#view-plans .program-card').first()).toHaveAttribute('data-id',B);
  const assigned=await raw(page);expect(assigned.gymverse_plans).toBe(before.gymverse_plans);expect(assigned.gymverse_history).toBe(before.gymverse_history);
  await page.getByRole('button',{name:'Ustawienia',exact:true}).click();await page.locator('#profileSelect').selectOption('profile-b');

  await expect(page.locator('#profileSelect')).toHaveValue('profile-b');
  await expect(page.locator('#view-plans .program-card')).toHaveCount(1);await expect(page.locator('#view-plans .program-card')).toHaveAttribute('data-id',C);
  await expect(page.locator('#standalonePlans')).toBeHidden();
  await page.getByRole('button',{name:'Ustawienia',exact:true}).click();await page.locator('#profileSelect').selectOption('profile-a');
  await expect(page.locator('#profileSelect')).toHaveValue('profile-a');await expect(page.locator('#view-plans .program-card').first()).toHaveAttribute('data-id',B);
  expect((await raw(page)).gymverse_plans).toBe(before.gymverse_plans);
});

test('program card preserves session resume timer RIR history and previous results',async({page})=>{
  await boot(page);const before=await raw(page);
  await page.locator('#view-plans .program-card[data-id="'+A+'"]').click();await page.locator('[data-act="programDay"][data-id="day-1"]').click();await page.locator('[data-act="programStart"]').click();
  await expect(page.locator('#weight_0')).toBeVisible();await page.locator('.workout-extras > summary').click();await page.locator('[data-act="rir"][data-v="2"]').click();
  await expect(page.locator('#sessionSaveStatus')).toBeHidden();await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeVisible();const saved=JSON.parse((await raw(page)).gymverse_active);expect(saved.restState.duration).toBe(60);
  await page.reload();await expect(page.locator('#restScreen')).toBeVisible();await page.locator('#restScreen [data-act="timerSkip"]').click();
  await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_active).step).toBe(1);
  await home(page);await expect(page.locator('#resumeBox [data-act="resume"]')).toBeVisible();await page.locator('#resumeBox [data-act="resume"]').click();
  expect(JSON.parse((await raw(page)).gymverse_active).id).toBe(saved.id);
  await page.locator('[data-act="finish"]').click();await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_history).length).toBe(1);
  const after=await raw(page),session=JSON.parse(after.gymverse_history)[0];
  expect(session.planId).toBe('day-1');expect(session.sessionContext).toEqual(saved.sessionContext);expect(session.details[0]).toMatchObject({exerciseId:'bench_flat',weight:40,reps:8,rir:2});
  expect(after.gymverse_plans).toBe(before.gymverse_plans);
  await home(page);await page.locator('#view-plans .program-card[data-id="'+A+'"]').click();await page.locator('[data-act="programDay"][data-id="day-1"]').click();await page.locator('[data-act="programStart"]').click();
  await expect(page.locator('.prev-val').first()).toContainText('40 kg × 8');
});

test('four-day home program and day details fit Signal light dark mobile widths',async({page})=>{
  await boot(page);
  async function capture(name){for(const theme of ['light','dark'])for(const width of [320,375,390]){
    await page.setViewportSize({width,height:844});await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name} ${theme} ${width}`).toBe(true);
    await page.evaluate(()=>window.scrollTo(0,0));await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
    if(width===390)await page.screenshot({path:`outputs/GV-20202-HOME/${name}-${theme}-390.png`,fullPage:true,animations:'disabled'});
  }}
  await capture('home');await page.locator('#standalonePlans').screenshot({path:'outputs/GV-20202-HOME/standalone-dark-390.png',animations:'disabled'});
  await page.locator('#view-plans .program-card[data-id="'+A+'"]').click();await expect(page.locator('#programSelectedDay')).toBeHidden();await capture('program');
  await page.locator('[data-act="programDay"][data-id="day-1"]').click();await capture('day-two');
});

for(const related of [false,true])test(`program start ${related?'rejects changed selected day':'allows unrelated day change'} under the shared lock`,async({page})=>{
  await boot(page);await page.locator('#view-plans .program-card[data-id="'+A+'"]').click();await page.locator('[data-act="programDay"][data-id="day-1"]').click();
  await page.evaluate(async related=>{const store=window.__gymverseTestHarness.getStore(),snapshot=await store.refreshSnapshot(),plans=JSON.parse(snapshot.gymverse_plans);plans.find(plan=>plan.id===(related?'day-1':'standalone')).title='Zmieniony dzień';await store.transact({gymverse_plans:plans});},related);
  const before=await raw(page);await page.locator('[data-act="programStart"]').click();
  if(related){await expect(page.locator('#toast')).toContainText('Odśwież podgląd');expect((await raw(page)).gymverse_active).toBe(before.gymverse_active);}
  else{await expect(page.locator('#view-workout')).toHaveClass(/active/);expect(JSON.parse((await raw(page)).gymverse_active).sessionContext.programId).toBe(A);}
  expect((await raw(page)).gymverse_plans).toBe(before.gymverse_plans);
});
