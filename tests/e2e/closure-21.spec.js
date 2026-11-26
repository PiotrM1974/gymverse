import { test, expect } from '@playwright/test';

// Older workout scenarios continue after explicitly skipping the new rest screen.
test.beforeEach(async ({ page }) => { await page.addLocatorHandler(page.locator('#restScreen:not([hidden])'), async () => { await page.waitForFunction(() => document.querySelector('#sessionSaveStatus').hidden); await page.locator('#restScreen [data-act="timerSkip" ]').click(); }); });
async function seed(page) {
  await page.goto('/'); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await page.evaluate(() => {
    localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('gymverse_plans', JSON.stringify([{id:'closure',title:'Closure synthetic',exercises:[{key:'bench_flat',sets:1,target:'8-12'},{key:'db_bench',sets:1,target:'8-12'}]}]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({schemaVersion:1,activeProfileId:'closure-profile',profiles:[{id:'closure-profile',name:'Closure test',attributes:{age:34,trainingGoal:'fitness',equipment:['machines','dumbbells','bench','cables'],restrictions:[]},data:{},planPrograms:{schemaVersion:1,assignedProgramId:null,programs:[]}}]}));
  });
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await page.locator('[data-act="startPlan"][data-plan="closure"]').click();
}
async function save(page) {
  await page.locator('#weight_0').fill('40');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBeGreaterThan(0);
}
for (const width of [320,390,430]) for (const theme of ['light','dark']) test(`single final action and complete save ${width} ${theme}`, async ({page},info) => {
  await page.setViewportSize({width,height:900});
  await page.emulateMedia({colorScheme:theme});
  await seed(page); await save(page);
  await expect(page.locator('#currentExName')).toHaveText('Flat Dumbbell Bench Press');
  await expect(page.locator('#btnNextStep')).toBeHidden();
  await save(page);
  await expect(page.locator('#btnNextStep')).toBeHidden();
  await expect(page.locator('[data-act="finish"]')).toHaveClass('btn-primary');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('final-action.png'),fullPage:true});
  await page.locator('[data-act="finish"]').click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]').length)).toBe(1);
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')));
  expect(history).toHaveLength(1); expect(history[0].details).toHaveLength(2);
  expect(history[0].details.map(d=>d.weight)).toEqual([40,40]);
});
test('early finish and discard preserve history, cancellation preserves session',async({page})=>{
  await seed(page); await save(page);
  page.once('dialog',d=>d.dismiss());
  await page.locator('[data-act="finish"]').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(1);
  page.once('dialog',d=>d.accept());
  await page.locator('[data-act="finish"]').click();
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  const before=await page.evaluate(()=>localStorage.getItem('gymverse_history'));
  expect(JSON.parse(before)[0].details).toHaveLength(1);
  await page.locator('[data-act="startPlan"][data-plan="closure"]').click(); await save(page);
  page.once('dialog',d=>d.dismiss()); await page.locator('[data-act="discard"]').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')).sets.length)).toBe(1);
  page.once('dialog',d=>d.accept()); await page.locator('[data-act="discard"]').click();
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_history'))).toBe(before);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_active')))).toBeNull();
});
for (const [name,content] of [['empty',''],['broken','{'],['foreign','{"app":"other"}'],['future','{"app":"gymverse","version":999,"history":[]}'],['missing-series','{"app":"gymverse","version":4,"history":[{"date":"2026-01-01","details":[{"exerciseId":"bench_flat","weight":40}]}]}']]) test(`invalid import preserves all stored data: ${name}`,async({page})=>{
  await seed(page);
  await page.locator('[data-act="view"][data-view="view-plans"]').first().click();
  const before=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k!=='gymverse_draft_v1').map(k=>[k,localStorage.getItem(k)]))));
  if(!await page.locator('#profileManage').evaluate(el=>el.open)) await page.locator('#profileManage > summary').click();
  await page.locator('#profileManage [data-act="legacyImportBtn"]').click();
  await page.locator('#importFile').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(content)});
  await expect(page.locator('#toast')).toContainText(/Błąd|Nieobsługiwana|Import odrzucony/);
  expect(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter(k=>k!=='gymverse_draft_v1').map(k=>[k,localStorage.getItem(k)]))))).toBe(before);
});
test('rapid finish clicks save only one session',async({page})=>{
  await seed(page); await save(page); page.on('dialog',d=>d.accept());
  await page.locator('[data-act="finish"]').evaluate(button=>{button.click();button.click();button.click();});
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')||'[]').length)).toBe(1);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history'))[0].details.length)).toBe(1);
});
test('conflicting stable session ID refuses import and retains history',async({page})=>{
  await page.goto('/'); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  const original={id:'same-id',date:'2026-01-01T10:00:00.000Z',planId:'p',planTitle:'Synthetic',details:[{exerciseId:'bench_flat',setNumber:1,weight:40,reps:8}]};
  await page.evaluate(s=>{localStorage.clear();sessionStorage.clear();localStorage.setItem('gymverse_history',JSON.stringify([s]));},original);
  await page.reload(); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  if(!await page.locator('#profileManage').evaluate(el=>el.open)) await page.locator('#profileManage > summary').click();
  await page.locator('#profileManage [data-act="legacyImportBtn"]').waitFor();
  const before=await page.evaluate(()=>localStorage.getItem('gymverse_history'));
  if(!await page.locator('#profileManage').evaluate(el=>el.open)) await page.locator('#profileManage > summary').click();
  await page.locator('#profileManage [data-act="legacyImportBtn"]').click();
  await page.locator('#importFile').setInputFiles({name:'synthetic-conflict.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({app:'gymverse',version:4,history:[{...original,details:[{...original.details[0],weight:90}]}]}))});
  await expect(page.locator('#toast')).toContainText('Konflikt identyfikatora');
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_history'))).toBe(before);
});
test('oversize file is refused before parsing',async({page})=>{
  await page.goto('/'); await page.waitForFunction(()=>!!window.__gymverseTestHarness);
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('gymverse_history'))).not.toBeNull();
  const before=await page.evaluate(()=>localStorage.getItem('gymverse_history'));
  await page.locator('#importFile').setInputFiles({name:'synthetic-large.json',mimeType:'application/json',buffer:Buffer.alloc(25*1024*1024+1,32)});
  await expect(page.locator('#toast')).toContainText('limit 25 MB');
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_history'))).toBe(before);
});
