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


test('programs use equipment artwork while the active group uses the exact exercise thumbnail',async({page})=>{
 await boot(page);await page.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore(),raw=await store.refreshSnapshot(),state=JSON.parse(raw.gymverse_profiles_v1);const keys=['bench_flat','db_bench','leg_press'];const plans=keys.map((key,i)=>({id:'art-day-'+i,title:'Plan '+i,exercises:[{key,variantId:'default',sets:1,target:'8-10',restSeconds:60}]}));state.profiles[0].planPrograms={schemaVersion:1,assignedProgramId:null,programs:plans.map((p,i)=>({id:'pg_'+String(i+1).repeat(32),title:'Program '+i,dayPlanIds:[p.id]}))};await store.transact({gymverse_plans:plans,gymverse_profiles_v1:state});});
 await page.reload();await expect(page.locator('.program-card')).toHaveCount(3);const before=await raw(page);
 await expect(page.locator('.program-card img[data-art-key]')).toHaveCount(3);
 const covers=()=>page.locator('.plan-card[data-card-tint]').evaluateAll(cards=>cards.map(card=>({id:card.dataset.id,art:card.querySelector('[data-art-key]').dataset.artKey,tint:card.dataset.cardTint})));
 const chosen=await covers();expect(new Set(chosen.map(c=>c.art)).size).toBe(3);
 await page.reload();await expect(page.locator('.program-card')).toHaveCount(3);expect(await covers()).toEqual(chosen);
 await expect.poll(()=>page.locator('.program-card img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth===384))).toBe(true);
 await page.locator('.program-card').nth(1).locator('[data-act="programPreview"]').click();await page.locator('[data-act="programDay"]').click();await page.locator('[data-act="programStart"]').click();await expect(page.locator('.workout-heading-art')).toHaveAttribute('src',/db_bench__default-male.webp$/);
 expect((await raw(page)).gymverse_plans).toBe(before.gymverse_plans);expect((await raw(page)).gymverse_profiles_v1).toBe(before.gymverse_profiles_v1);
});


test('local 3D covers and random card colours survive offline reload',async({page,context})=>{
 test.setTimeout(60000);await boot(page);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
 expect(await page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await expect(page.locator('.program-card')).toHaveCount(2);
 const chosen=await page.locator('.plan-card[data-card-tint]').evaluateAll(cards=>cards.map(c=>[c.dataset.id,c.dataset.cardTint,c.querySelector('[data-art-key]').dataset.artKey]));
 await context.setOffline(true);await page.reload();await expect(page.locator('.program-card')).toHaveCount(2);
 expect(await page.locator('.plan-card[data-card-tint]').evaluateAll(cards=>cards.map(c=>[c.dataset.id,c.dataset.cardTint,c.querySelector('[data-art-key]').dataset.artKey]))).toEqual(chosen);
 const fetched=await page.evaluate(async()=>Promise.all(['bench','dumbbells','machine','kettlebells','leg-press','barbell'].map(async kind=>{const r=await fetch('src/ui/program-art/'+kind+'.webp');return {ok:r.ok,size:(await r.blob()).size};})));
 expect(fetched.every(r=>r.ok&&r.size>10000)).toBe(true);
 await expect.poll(()=>page.locator('.plan-card img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth===384))).toBe(true);
});

for(const theme of ['light','dark'])test('3D program cards showcase '+theme,async({page})=>{
 await boot(page);await page.emulateMedia({colorScheme:theme});await page.setViewportSize({width:390,height:844});
 await mkdir('outputs/GV-UX-ORGANIZATION',{recursive:true});
 await expect.poll(()=>page.locator('.plan-card img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth===384))).toBe(true);
 for(const width of [320,375,390,430]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'outputs/GV-UX-ORGANIZATION/14-raised-cards-'+theme+'-390.png',fullPage:true,animations:'disabled'});
});
