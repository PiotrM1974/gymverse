import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const output = 'outputs/GV-SESSION-RESULTS-AND-SWAPS';
const detail = (setNumber, weight, reps, extra = {}) => ({ exerciseId: 'bench_flat', exerciseName: 'Stara nazwa', setNumber, weight, reps, ...extra });
const session = (details, extra = {}) => ({ date: '2026-01-01T12:00:00.000Z', planId: 'synthetic_session', planTitle: 'Synthetic', details, ...extra });
const three = () => session([detail(1, 75, 8), detail(2, 70, 10), detail(3, 65, 12)]);
let seedSequence=0;
async function seed(page, history = [], exercise = {}) {
  const seedId=String(++seedSequence);
  await page.addInitScript(({ history, exercise, seedId }) => {
    if(new URL(location.href).searchParams.get("fixture")!==seedId)return;
    if(localStorage.getItem('7b-session-fixture')===seedId)return;
    localStorage.clear();sessionStorage.clear();
    localStorage.setItem('7b-session-fixture',seedId);
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'synthetic_session', title: 'Synthetic', exercises: [{ key: 'bench_flat', variantId: 'default', sets: 3, target: '8-12', ...exercise }] }]));
    localStorage.setItem('gymverse_history', JSON.stringify(history));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'session-results-profile', profiles: [{ id: 'session-results-profile', name: 'Profil syntetyczny', attributes: { trainingGoal: 'fitness' }, data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [] } }] }));
  }, { history, exercise, seedId });
  await page.goto('/?fixture='+seedId,{waitUntil:'domcontentloaded'});
  await page.locator('[data-act="startPlan"][data-plan="synthetic_session"]').click();
}
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_active')));
async function save(page, i, weight = '40', reps = '8') {
  await page.locator('#weight_' + i).fill(weight);
  await page.locator('#reps_' + i).fill(reps);
  await page.locator('#btnDone_' + i).click();
  await expect(page.locator('#btnDone_' + i)).toHaveClass(/completed/);
  if (await page.locator('#restScreen').isVisible()) await page.locator('#restScreen [data-act="timerSkip"]').click();
}
async function resume(page) {
  await page.reload();
  await page.locator('[data-act="resume"]').click();
}
async function swap(page, key, accept = true) {
  await page.locator('[data-act="swapOpen"]').first().click();
  page.once('dialog', dialog => accept ? dialog.accept() : dialog.dismiss());
  await page.locator(`[data-act="chooseSwap"][data-key="${key}"]`).click();
}
async function aligned(page) {
  const bounds = await page.locator('#setsBody .set-row').evaluateAll(rows => rows.map(row => {
    const [w,r,b] = [...row.querySelectorAll('input,button')].map(el => el.getBoundingClientRect());
    return { sameLine: Math.abs(w.bottom-r.bottom)<2 && Math.abs(r.bottom-b.bottom)<2, noOverlap: w.right<=r.left && r.right<=b.left, touch: b.height>=44 && b.width>=44, contained: b.right<=row.getBoundingClientRect().right };
  }));
  for (const bound of bounds) expect(bound).toEqual({sameLine:true,noOverlap:true,touch:true,contained:true});
  expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

for (const width of [320,375,390,430,1280]) for (const theme of ['light','dark']) {
  test(`series and date fit ${width} ${theme}`, async ({ page }, info) => {
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({colorScheme:theme});
    await seed(page,[three()]);
    await aligned(page);
    await page.locator('#weight_0').fill('67,5');
    await page.locator('#reps_0').fill('9');
    await aligned(page);
    await page.locator('#btnDone_0').click();
    await expect(page.locator('.set-row.is-current')).toHaveCount(1);
    await expect(page.locator('.set-row.is-current #weight_1')).toBeVisible();
    await aligned(page);
    await page.locator('[data-act="timerSkip"]').click();
    await mkdir(output,{recursive:true});
    await page.locator('.workout-control-card').screenshot({style: '#appHeader { visibility:hidden !important; }', path:`${output}/${info.project.name}-${width}-${theme}-series.png`});
    await page.getByRole('button',{name:'Historia',exact:true}).click();
    await page.locator('#historyAddPanel > summary').click();
    await expect(page.locator('#histNewDate')).toBeVisible();
    const dateBounds=await page.locator('#histNewDate').evaluate(el=>{
      const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect(),s=getComputedStyle(el.parentElement);
      return {inside:r.left>=p.left+parseFloat(s.paddingLeft)-1&&r.right<=p.right-parseFloat(s.paddingRight)+1,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    expect(dateBounds).toEqual({inside:true,overflow:false});
    await page.locator('#histNewDate').fill('2026-01-02');
    await expect(page.locator('#histNewDate')).toHaveValue('2026-01-02');
    await page.locator('#histNewDate').locator('..').screenshot({style: '#appHeader { visibility:hidden !important; }', path:`${output}/${info.project.name}-${width}-${theme}-date.png`});
  });
}

test('previous results use stable IDs, set numbers, plan preference and no writes',async({page})=>{
  await seed(page,[three(),session([detail(1,99,2)],{planId:'other',planTitle:'Other',date:'2026-02-01T12:00:00Z'}), session([detail(1,999,1)],{date:'2099-01-01T12:00:00Z'})]);
  await expect(page.locator('.prev-val')).toHaveText(['75 kg × 8','70 kg × 10','65 kg × 12']);
  const before=await page.evaluate(()=>localStorage.getItem('gymverse_history'));
  await page.locator('#weight_1').fill('67,5');
  await page.locator('#reps_1').fill('11');
  await resume(page);
  await expect(page.locator('#weight_1')).toHaveValue('67,5');
  await expect(page.locator('.prev-val')).toHaveText(['75 kg × 8','70 kg × 10','65 kg × 12']);
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_history'))).toBe(before);
  await save(page,0,'80','9');
  await expect(page.locator('.prev-val').first()).toHaveText('75 kg × 8');
  await expect(page.locator('#weight_1')).toHaveValue('67,5');
  page.once('dialog',d=>d.accept());
  await page.locator('[data-act="finish"]').click();
  await page.locator('.logo[data-view="view-plans"]').click();
  await page.locator('[data-act="startPlan"]').first().click();
  await expect(page.locator('.prev-val')).toHaveText(['80 kg × 9','Brak danych','Brak danych']);
});

test('sparse sets and variants do not borrow adjacent or similarly named results',async({page})=>{
  await seed(page,[session([detail(1,67.5,8), detail(3,65,12),detail(2,500,5,{exerciseId:'db_bench',exerciseName:'Stara nazwa'}),detail(2,300,2,{variantId:'unknown'})],{planId:'other',planTitle:'Other'})],{sets:4});
  await expect(page.locator('.prev-val')).toHaveText(['67,5 kg × 8 · inny plan','Brak danych','65 kg × 12 · inny plan','Brak danych']);
  await seed(page,[session([detail(1,80,8,{exerciseId:'leg_press',variantId:'default'}),detail(1,100,10,{exerciseId:'leg_press',variantId:'high_feet'})])],{key:'leg_press',variantId:'high_feet'});
  await expect(page.locator('.prev-val').first()).toHaveText('100 kg × 10');
});

test('highlight follows first unfinished row through edits, unusual order and reload',async({page})=>{
  await seed(page);
  await expect(page.locator('.prev-val')).toHaveText(['Brak danych','Brak danych','Brak danych']);
  await save(page,2);
  await expect(page.locator('.is-current #weight_0')).toBeVisible();
  await save(page,0);
  await resume(page);
  await expect(page.locator('.is-current #weight_1')).toBeVisible();
  await save(page,1);
  await expect(page.locator('.set-row.is-current')).toHaveCount(0);
  await page.locator('#btnDone_0').click();
  await expect(page.locator('.is-current #weight_0')).toBeVisible();
  await page.locator('#btnDone_0').click();
  await expect(page.locator('.set-row.is-current')).toHaveCount(0);
  expect((await state(page)).sets).toHaveLength(3);
});

for(const completed of [0,1,2]) test(`swap after ${completed} sets preserves identities, history and plan`,async({page},info)=>{
  await page.setViewportSize({width:390,height:844});
  await seed(page,[three(),session([detail(1,25,8,{exerciseId:'db_bench'}),detail(2,22.5,10,{exerciseId:'db_bench'}),detail(3,20,12,{exerciseId:'db_bench'})])]);
  const plan=await page.evaluate(()=>localStorage.getItem('gymverse_plans'));
  const originalHistory=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')));
  for(let i=0;i<completed;i++) await save(page,i);
  await page.locator('#weight_'+completed).fill('99');
  const before=await state(page);
  await swap(page,'db_bench',false);
  expect(await state(page)).toEqual(before);
  await page.locator('#swapBox [data-act="swapOpen"]').click();
  await swap(page,'db_bench');
  await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id','db_bench');
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src',/db_bench__default-male/);
  await expect(page.locator('#weight_'+completed)).toHaveValue('');
  await expect(page.locator('.prev-val').nth(completed)).toHaveText(['25 kg × 8','22,5 kg × 10','20 kg × 12'][completed]);
  await resume(page);
  expect((await state(page)).sets).toEqual(before.sets);
  for(let i=completed;i<3;i++) await save(page,i,'22,5','10');
  if (await page.locator('#restScreen').isVisible()) await page.locator('#restScreen [data-act="timerSkip"]').click();
  await page.locator('.workout-control-card').screenshot({style: '#appHeader { visibility:hidden !important; }', path:`${output}/${info.project.name}-swap-after-${completed}.png`});
  await page.locator('[data-act="finish"]').click();
  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('gymverse_history')));
  expect(history.slice(0,-1)).toEqual(originalHistory);
  expect(history.at(-1).details.map(d=>[d.exerciseId,d.setNumber,d.weight])).toEqual(Array.from({length:3},(_,i)=>[i<completed?'bench_flat':'db_bench',i+1,i<completed?40:22.5]));
  expect(await page.evaluate(()=>localStorage.getItem('gymverse_plans'))).toBe(plan);
});

test('alternatives are deterministic, exclude self, support variants and empty results',async({page})=>{
  await seed(page);
  await page.locator('[data-act="swapOpen"]').first().click();
  const keys=await page.locator('[data-act="chooseSwap"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.key));
  expect(keys).toContain('db_bench'); expect(keys).not.toContain('bench_flat'); expect(keys).not.toContain('leg_press');
  await expect(page.locator('#swapOptions img').first()).toBeVisible();
  await page.locator('#swapBox [data-act="swapOpen"]').click();
  await page.locator('[data-act="swapOpen"]').first().click();
  expect(await page.locator('[data-act="chooseSwap"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.key))).toEqual(keys);
  await seed(page,[],{key:'shoulder_press'});
  await swap(page,'shoulder_press/dumbbells');
  await resume(page);
  await expect(page.locator('#currentExVariant')).not.toContainText('podstawowa');
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src',/shoulder_press__dumbbells/);
  await save(page,0);
  expect((await state(page)).sets[0].variantId).toBe('dumbbells');
  await seed(page,[],{key:'leg_curl'});
  await page.locator('[data-act="swapOpen"]').first().click();
  await expect(page.locator('#swapOptions')).toContainText('Brak odpowiedniego zamiennika');
});

test('manual history edits and deletion refresh previous values',async({page})=>{
  await seed(page,[three()]);
  await page.getByRole('button',{name:'Historia',exact:true}).click();
  await page.locator('.hist-head').first().click();
  page.once('dialog',d=>d.accept('67,5x9'));
  await page.locator('[data-act="histEditSet"]').first().click();
  await page.locator('.logo[data-view="view-plans"]').click();
  await page.locator('[data-act="resume"]').click();
  await expect(page.locator('.prev-val').first()).toHaveText('67,5 kg × 9');
  await page.getByRole('button',{name:'Historia',exact:true}).click();
  page.once('dialog',d=>d.accept());
  await page.locator('[data-act="histDelete"]').first().click();
  await page.locator('#historyAddPanel > summary').click();
  await page.locator('#histNewDate').fill('2026-01-02');
  await page.locator('[data-act="histNew"]').click();
  page.once('dialog',d=>d.accept('55x11'));
  await page.locator('[data-act="histAddSet"]').first().click();
  await page.locator('.logo[data-view="view-plans"]').click();
  await page.locator('[data-act="resume"]').click();
  await expect(page.locator('.prev-val')).toHaveText(['55 kg × 11','Brak danych','Brak danych']);
});

test('swap thumbnails and resumed results work offline',async({page,context})=>{
  await seed(page,[three()]);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await resume(page);
  expect(await page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await swap(page,'db_bench');
  await resume(page);
  await page.locator('[data-act="swapOpen"]').first().click();
  await expect.poll(()=>page.locator('#swapOptions img').evaluateAll(nodes=>nodes.every(n=>n.complete&&n.naturalWidth>0))).toBe(true);
  await expect(page.locator('#exercisePresentationImage')).toHaveAttribute('src',/db_bench/);
  await context.setOffline(false);
});

test('failed swap retains session, completed work and draft inputs',async({page})=>{
  await seed(page);
  await save(page,0);
  await page.locator('#weight_1').fill('42,5');
  await page.locator('#reps_1').fill('9');
  const before=await state(page);
  await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(key==='gymverse_active' && JSON.parse(value)?.swaps?.[0]) throw new DOMException('Synthetic full storage','QuotaExceededError');
      return original.call(this,key,value);
    };
  });
  await swap(page,'db_bench');
  await expect(page.locator('#currentExName')).toContainText('Barbell Bench Press');
  expect(await state(page)).toEqual(before);
  await expect(page.locator('#weight_1')).toHaveValue('42,5');
  await resume(page);
  expect((await state(page)).sets).toEqual(before.sets);
  await expect(page.locator('#weight_1')).toHaveValue('42,5');
});

test('rapid selection and saves do not duplicate or reassign completed sets',async({page})=>{
  await seed(page,[],{key:'pushup'});
  await save(page,0,'0','12');
  await page.locator('[data-act="swapOpen"]').first().click();
  page.once('dialog',d=>d.accept());
  await page.locator('[data-act="chooseSwap"][data-key="db_bench"]').evaluate(button=>{button.click();button.click();});
  await expect(page.locator('#anatomyAtlas')).toHaveAttribute('data-exercise-id','db_bench');
  await page.locator('#btnDone_0').click();
  await page.locator('#reps_0').fill('13');
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#btnDone_0')).toHaveClass(/completed/);
  await page.locator('#weight_1').fill('20');
  await page.locator('#reps_1').fill('10');
  await page.locator('#btnDone_1').evaluate(button=>{button.click();button.click();});
  await expect(page.locator('#btnDone_1')).toHaveClass(/completed/);
  expect((await state(page)).sets.map(s=>[s.key,s.weight,s.reps])).toEqual([['pushup',0,13],['db_bench',20,10]]);
  await page.locator('#weight_2').fill('22,5');
  await page.locator('#reps_2').fill('9');
  await page.locator('#reps_2').evaluate(input=>{
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    document.querySelector('#btnDone_2').click();
    input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  });
  await expect(page.locator('#btnDone_2')).toHaveClass(/completed/);
  expect((await state(page)).sets).toHaveLength(3);
});
