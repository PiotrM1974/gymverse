import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

async function boot(page){
 await page.addInitScript(()=>{
  if(sessionStorage.getItem('stage10a-fixture'))return;
  sessionStorage.setItem('stage10a-fixture','1');
  localStorage.setItem('gymverse_schema','4');
  localStorage.setItem('gymverse_plans',JSON.stringify([
   {id:'push_a1',title:'Push A1',exercises:[{key:'bench_flat',variantId:'default',sets:2,target:'8-12',restSeconds:90}]},
   {id:'pull_a1',title:'Pull A1',exercises:[{key:'lat_pulldown_wide',variantId:'default',sets:2,target:'8-12'}]},
   {id:'full_body',title:'Full Body',exercises:[{key:'leg_press',variantId:'default',sets:2,target:'8-12'}]}
  ]));
 });
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('[data-act="startPlan"][data-plan="push_a1"]')).toBeVisible();
}

test('main screens keep compact controls and capture real before/after views',async({page},info)=>{
 const phase=process.env.STAGE10A_PHASE==='before'?'before':'after';
 const out=`outputs/GV-BOLT-STAGE10A/${phase}/${info.project.name}`;
 await mkdir(out,{recursive:true});
 await page.setViewportSize({width:390,height:844});await boot(page);
 for(const theme of ['light','dark']){
  await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
  await page.screenshot({path:`${out}/home-${theme}-390.png`,animations:'disabled'});
 }
 for(const theme of ['light','dark'])for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:844});await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#view-plans .plan-card').first()).toBeVisible();
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#planList').screenshot({path:`${out}/plan-cards-390.png`,animations:'disabled'});
 await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
 await expect(page.locator('#view-workout')).toBeVisible();
 for(const theme of ['light','dark']){
  await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
  await page.screenshot({path:`${out}/workout-${theme}-390.png`,fullPage:true,animations:'disabled'});
 }
 await page.locator('.workout-extras').evaluate(node=>node.open=true);
 await page.locator('.workout-control-card').screenshot({path:`${out}/workout-options-390.png`,animations:'disabled'});
 for(const theme of ['light','dark'])for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:844});await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
  const geometry=await page.evaluate(()=>{
   const cells=[...document.querySelectorAll('#setsBody .set-row:first-child td')].map(cell=>cell.getBoundingClientRect());
   return {fits:document.documentElement.scrollWidth<=innerWidth,columns:cells.length,aligned:cells.every((box,index)=>index===0||box.left>=cells[index-1].right-1),buttons:[...document.querySelectorAll('#view-workout .btn-done,#view-workout .exercise-rest-options button')].every(button=>button.getBoundingClientRect().height>=40)};
  });
  expect(geometry).toEqual({fits:true,columns:5,aligned:true,buttons:true});
 }
 await page.setViewportSize({width:320,height:844});
 await page.evaluate(()=>scrollTo(0,0));
 await page.locator('.workout-extras').evaluate(node=>node.open=false);
 await expect(page.locator('.workout-extras')).not.toHaveAttribute('open','');
 for(const theme of ['light','dark']){
  await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
  await page.screenshot({path:`${out}/workout-${theme}-320.png`,fullPage:true,animations:'disabled'});
 }
 await page.setViewportSize({width:390,height:844});
 await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();
 await expect(page.locator('#restScreen')).toBeVisible();
 for(const theme of ['light','dark']){
  await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
  await page.screenshot({path:`${out}/timer-${theme}-390.png`,animations:'disabled'});
 }
 for(const width of [320,375,390,430]){
  await page.setViewportSize({width,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#restScreen .rest-screen__controls button')).toHaveCount(3);
 }
 expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')))).sets[0]).toMatchObject({weight:40,reps:8});
});

test('cached Signal shell and an opened workout remain usable without network',async({page,context})=>{
 await boot(page);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload({waitUntil:'domcontentloaded'});
 await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 const shell=await page.evaluate(async()=>{
  const cache=await caches.open('gymverse-v56');
  return {index:Boolean(await cache.match('./index.html')),css:Boolean(await cache.match('./src/ui/signal.css'))};
 });
 expect(shell).toEqual({index:true,css:true});
 await context.setOffline(true);
 try {
  const cached=await page.evaluate(async()=>{
   const responses=await Promise.all([fetch('./index.html'),fetch('./src/ui/signal.css')]);
   return Promise.all(responses.map(async response=>({status:response.status,text:await response.text()})));
  });
  expect(cached.map(row=>row.status)).toEqual([200,200]);
  expect(cached[1].text).toContain('Stage 10A');
  await page.locator('[data-act="startPlan"][data-plan="push_a1"]').click();
  await page.locator('#weight_0').fill('40');await page.locator('#reps_0').fill('8');await page.locator('#btnDone_0').click();
  await expect(page.locator('#restScreen')).toBeVisible();
  expect((await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')))).sets[0]).toMatchObject({weight:40,reps:8});
 } finally {await context.setOffline(false);}
});
