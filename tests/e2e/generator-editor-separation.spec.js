import {setGeneratorDays} from './helpers/generator-days.js';
import { test, expect } from '@playwright/test';

async function boot(page) {
  page.on('dialog', dialog => dialog.accept());
  await page.addInitScript(() => {
    if(localStorage.getItem('generator-separation-seed'))return;
    localStorage.setItem('generator-separation-seed','1');
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', '[]');
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({
      schemaVersion: 1, activeProfileId: 'synthetic-profile', profiles: [{
        id: 'synthetic-profile', name: 'Testowy profil', attributes: {
          age: 32, trainingGoal: 'fitness', equipment: ['machines', 'dumbbells', 'bench', 'cables'],
          restrictions: ['overhead_press'], experience: 'beginner'
        }, data: {}
      }]
    }));
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => !!window.__gymverseTestHarness)).toBe(true);
}

async function enterGenerator(page) {
  await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await page.locator('[data-act="stage6Generator"]').click();
  await expect(page.locator('.generator-wizard')).toBeVisible();
}

async function generate(page, count) {
  await expect(page.locator('.generator-wizard > p')).toContainText('Krok 1 z 4');
  await page.locator('#generatorGoal').selectOption('hypertrophy');
  await page.locator('[data-act="generatorNext"]').click();
  await setGeneratorDays(page,count);
  await page.locator('[data-act="generatorNext"]').click();
  await expect(page.locator('.generator-wizard > p')).toContainText('Krok 3 z 4');
  await page.locator('[data-act="generatorNext"]').click();
  await expect(page.locator('#generatorReview')).toContainText(`${count} dni w tygodniu`);
  await page.locator('[data-act="generatePlan"]').click();
  await expect(page.locator('#generatorPreview')).toBeVisible();
}

async function seedEditablePlans(page){
  await page.evaluate(async()=>{
    const store=window.__gymverseTestHarness.getStore();
    await store.transact({gymverse_plans:['plan-a','plan-b','plan-c'].map((id,index)=>({id,title:`Syntetyczny plan ${index+1}`,exercises:[{key:'bench_flat',variantId:'default',sets:3,target:'8-12'}]}))});
  });
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
}

async function openOwnPlan(page,index){
  await page.locator('[data-act="editPlans"]').click();
  await expect(page.locator('#view-planedit [data-act="peOpen"]')).toHaveCount(3);
  await page.locator('#view-planedit [data-act="peOpen"]').nth(index).click();
}

test('own-plan view and generator stay separate; generator uses four steps', async ({ page }) => {
  await boot(page);
  await page.locator('[data-act="editPlans"]').click();
  await expect(page.locator('[data-act="programNew"]')).toBeVisible();
  await expect(page.locator('.generator-wizard')).toHaveCount(0);
  for (const theme of ['light','dark']) {
    await page.evaluate(value => document.documentElement.dataset.theme=value,theme);
    for (const width of [320,375,390]) {
      await page.setViewportSize({width,height:844});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width===390)await page.screenshot({path:`outputs/GV-GENERATOR-UX-REPAIR/chromium-own-plans-${theme}-390.png`,fullPage:true,animations:'disabled'});
    }
  }
  await page.locator('[data-act="programNew"]').click();
  await expect(page.locator('#view-program-editor .program-editor')).toBeVisible();
  for (const theme of ['light','dark']) {
    await page.evaluate(value => document.documentElement.dataset.theme=value,theme);
    for (const width of [320,375,390]) {
      await page.setViewportSize({width,height:844});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width===390)await page.screenshot({path:`outputs/GV-GENERATOR-UX-REPAIR/chromium-own-editor-${theme}-390.png`,fullPage:true,animations:'disabled'});
    }
  }
  await expect(page.locator('.generator-wizard')).toHaveCount(0);
  await page.locator('#view-program-editor [data-program-action="cancel"]').click();
  await page.locator('[data-view="view-plans"]').first().click();
  await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await page.locator('[data-act="stage6Own"]').click();
  await expect(page.locator('.generator-wizard')).toHaveCount(0);
  await page.locator('#view-planedit .view-head [data-act="view"]').click();
  await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await page.locator('[data-act="stage6Generator"]').click();
  await expect(page.locator('.generator-wizard')).toBeVisible();
  await expect(page.locator('#view-planedit [data-act="programNew"]')).toHaveCount(0);
  await expect(page.locator('#view-planedit .plan-grid')).toHaveCount(0);
  for (let step = 1; step <= 4; step++) {
    await expect(page.locator('.generator-wizard > p')).toContainText(`Krok ${step} z 4`);
    if (step < 4) await page.locator('[data-act="generatorNext"]').click();
  }
});

for (const count of [1, 3, 6]) test(`generated ${count}-day plan is saved and assigned atomically`, async ({ page }, info) => {
  await boot(page);
  await enterGenerator(page);
  await generate(page, count);
  // The toast remains in the DOM with opacity 0, so Playwright still considers
  // it visible. Wait for the app's actual dismissal state before capturing UI.
  await expect(page.locator('#toast')).not.toHaveClass(/show/);
  await expect(page.locator('#generatorPreview .program-day-tabs button')).toHaveCount(count);
  await expect(page.locator('#generatorPreview [data-act="editGeneratedDay"], #generatorPreview [data-act="editGeneratedProgram"]')).toHaveCount(0);
  await expect(page.locator('#generatorPreview [data-act="previewSwap"], #generatorPreview [data-preview-select]')).toHaveCount(0);
  for (const theme of ['light', 'dark']) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
    for (const width of [320,375,390]) {
      await page.setViewportSize({width,height:844});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width===390)await page.screenshot({ path: `outputs/GV-GENERATOR-UX-REPAIR/${info.project.name}-generator-${count}-${theme}-390.png`, fullPage: true, animations: 'disabled' });
    }
  }
  const before = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  const draft = JSON.parse(before.gymverse_program_drafts_v1).items[0].draft;
  expect(JSON.parse(before.gymverse_plans)).toEqual([]);
  await page.locator('[data-act="saveGeneratedPreview"]').click();
  await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const after = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  const state = JSON.parse(after.gymverse_profiles_v1);
  const profile = state.profiles.find(item => item.id === 'synthetic-profile');
  expect(profile.planPrograms.assignedProgramId).toBe(draft.generatedProgramId);
  expect(profile.planPrograms.programs).toHaveLength(1);
  expect(profile.planPrograms.programs[0].dayPlanIds).toEqual(draft.dayPlanIds);
  expect(JSON.parse(after.gymverse_plans)).toEqual(draft.plans);
  expect(JSON.parse(after.gymverse_program_drafts_v1).items).toEqual([]);
  expect(after.gymverse_history).toBe(before.gymverse_history);
});

test('failed generated save retains the same draft ID for safe retry', async ({ page }) => {
  await boot(page);
  await enterGenerator(page);
  await generate(page, 3);
  const before = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  const id = JSON.parse(before.gymverse_program_drafts_v1).items[0].draft.generatedProgramId;
  await page.evaluate(() => {
    const native = Storage.prototype.setItem;
    let fail = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gymverse_profiles_v1' && fail) { fail = false; throw new Error('synthetic refusal'); }
      return native.call(this, key, value);
    };
  });
  await page.locator('[data-act="saveGeneratedPreview"]').click();
  await expect(page.locator('#toast')).toContainText('Szkic');
  const failed = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  expect(failed.gymverse_plans).toBe(before.gymverse_plans);
  expect(failed.gymverse_history).toBe(before.gymverse_history);
  expect(JSON.parse(failed.gymverse_program_drafts_v1).items[0].draft.generatedProgramId).toBe(id);
  await page.locator('[data-act="saveGeneratedPreview"]').click();
  await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const after = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  const profile = JSON.parse(after.gymverse_profiles_v1).profiles[0];
  expect(profile.planPrograms.programs).toHaveLength(1);
  expect(profile.planPrograms.assignedProgramId).toBe(id);
});

test('generated draft is recovered from the generator and hidden from own-plan editor', async ({ page, context }) => {
  await boot(page);
  await enterGenerator(page);
  await generate(page, 3);
  const before = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  const item = JSON.parse(before.gymverse_program_drafts_v1).items[0];
  await page.close({ runBeforeUnload: false });
  const reopened = await context.newPage();
  reopened.on('dialog', dialog => dialog.accept());
  await reopened.goto('/');
  await reopened.locator('[data-act="editPlans"]').click();
  await expect(reopened.locator('.generator-wizard')).toHaveCount(0);
  await expect(reopened.locator('[data-recover]')).toHaveCount(0);
  await reopened.locator('#view-planedit .view-head [data-act="view"]').click();
  await reopened.locator('#view-plans [data-act="stage6OpenChoices"]').click();
  await reopened.locator('[data-act="stage6Generator"]').click();
  await expect(reopened.locator('#view-planedit')).toContainText('Znaleziono niezapisany szkic generatora');
  await reopened.locator('[data-act="generatorResume"]').click();
  await expect(reopened.locator('#generatorPreview')).toBeVisible();
  await expect(reopened.locator('#generatorPreview .program-day-tabs [aria-pressed="true"]')).toContainText('Dzień 1');
  const after = await reopened.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  expect(JSON.parse(after.gymverse_program_drafts_v1).items[0].draft.generatedProgramId).toBe(item.draft.generatedProgramId);
});

test('deleting a program clears only its assignment and keeps days and workout history',async({page})=>{
  await boot(page);
  const original=await page.evaluate(async()=>{
    const store=window.__gymverseTestHarness.getStore(),snapshot=await store.refreshSnapshot(),registry=JSON.parse(snapshot.gymverse_profiles_v1),id='pg_'+'c'.repeat(32),day={id:'synthetic-program-day',title:'Dzień syntetyczny',exercises:[{key:'bench_flat',variantId:'default',sets:2,target:'8-10'}]},program={id,title:'Program do usunięcia',dayPlanIds:[day.id]},profile=registry.profiles.find(item=>item.id===registry.activeProfileId);
    profile.planPrograms={schemaVersion:1,assignedProgramId:id,programs:[program]};
    const history=[{id:'synthetic-history',planId:day.id,planTitle:day.title,programId:id,programTitle:program.title,date:'2026-11-26T10:00:00.000Z',details:[{id:'synthetic-set',exerciseId:'bench_flat',variantId:'default',setNumber:1,weight:40,reps:8,rir:2}]}];
    await store.transact({gymverse_profiles_v1:registry,gymverse_plans:[day],gymverse_history:history});
    return {plans:[day],history};
  });
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);

  await page.locator('#view-plans [data-act="programPreview"]').click();
  await expect(page.locator('#view-program-preview')).toContainText('Program do usunięcia');
  await page.locator('.header-nav [data-view="view-plans"]').click();await page.locator('[data-act="editPlans"]').click();await page.locator('[data-act="programDelete"]').click();
  await expect(page.locator('.managed-program')).toHaveCount(0);
  const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());
  const registry=JSON.parse(after.gymverse_profiles_v1),profile=registry.profiles.find(item=>item.id==='synthetic-profile');
  expect(profile.planPrograms.assignedProgramId).toBeNull();
  expect(profile.planPrograms.programs).toEqual([]);
  expect(JSON.parse(after.gymverse_plans)).toEqual(original.plans);
  expect(JSON.parse(after.gymverse_history)).toEqual(original.history);
});

test('simultaneous edits to different plans merge instead of reporting a false conflict',async({page,context})=>{
  await boot(page);await seedEditablePlans(page);
  const other=await context.newPage();await boot(other);
  await Promise.all([openOwnPlan(page,0),openOwnPlan(other,1)]);
  await page.locator('#view-planedit [data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_plans).find(plan=>plan.id==='plan-a').exercises[0].sets).toBe(4);
  await other.locator('#view-planedit [data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect.poll(async()=>{const plans=JSON.parse((await other.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_plans);return plans.find(plan=>plan.id==='plan-a').exercises[0].sets===4&&plans.find(plan=>plan.id==='plan-b').exercises[0].sets===4;}).toBe(true);
  const saved=JSON.parse((await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_plans);
  expect(saved.map(plan=>plan.exercises[0].sets)).toEqual([4,4,3]);
  await other.close();
});

test('simultaneous edits to the same plan reject the stale second change',async({page,context})=>{
  await boot(page);await seedEditablePlans(page);
  const other=await context.newPage();await boot(other);
  await Promise.all([openOwnPlan(page,0),openOwnPlan(other,0)]);
  await page.locator('#view-planedit [data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_plans).find(plan=>plan.id==='plan-a').exercises[0].sets).toBe(4);
  await other.locator('#view-planedit [data-act="peSets"][data-i="0"][data-d="-1"]').click();
  await expect(other.locator('#toast')).toContainText('zmieniły się');
  const saved=JSON.parse((await other.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_plans);
  expect(saved.find(plan=>plan.id==='plan-a').exercises[0].sets).toBe(4);
  await other.close();
});

for (const mode of ['localStorage', 'indexeddb']) test(`parallel writes to unrelated records do not conflict; same-record writes do (${mode})`, async ({ page, context }) => {
  await boot(page);
  if (mode === 'indexeddb') await page.evaluate(async () => {
    const store = window.__gymverseTestHarness.getStore();
    await store.activateMigration(await store.previewMigration(), { sourceExportVerified: true, v5ExportVerified: true });
  });
  const other = await context.newPage();
  await other.goto('/');
  await expect.poll(() => other.evaluate(() => !!window.__gymverseTestHarness)).toBe(true);
  await Promise.all([
    page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot()),
    other.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot())
  ]);
  const unrelated = await Promise.allSettled([
    page.evaluate(() => window.__gymverseTestHarness.getStore().transact({ gymverse_rest: 120 })),
    other.evaluate(() => window.__gymverseTestHarness.getStore().transact({ gymverse_history: [{ id: 'synthetic-history', rir: 2 }] }))
  ]);
  expect(unrelated.map(result => result.status)).toEqual(['fulfilled', 'fulfilled']);
  const merged = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  expect(JSON.parse(merged.gymverse_rest)).toBe(120);
  expect(JSON.parse(merged.gymverse_history)).toEqual([{ id: 'synthetic-history', rir: 2 }]);
  await Promise.all([
    page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot()),
    other.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot())
  ]);
  const sameRecord = await Promise.allSettled([
    page.evaluate(() => window.__gymverseTestHarness.getStore().transact({ gymverse_rest: 150 })),
    other.evaluate(() => window.__gymverseTestHarness.getStore().transact({ gymverse_rest: 180 }))
  ]);
  expect(sameRecord.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
  const final = await page.evaluate(() => window.__gymverseTestHarness.getStore().refreshSnapshot());
  expect([150, 180]).toContain(JSON.parse(final.gymverse_rest));
  await other.close();
});

test('legacy generated draft resumes after leaving its view and saves with stable day IDs',async({page})=>{
  await boot(page);await enterGenerator(page);await generate(page,3);
  const original=await page.evaluate(async()=>{
    const store=window.__gymverseTestHarness.getStore(),raw=await store.refreshSnapshot(),drafts=JSON.parse(raw.gymverse_program_drafts_v1);
    delete drafts.items[0].draft.generatedProgramId;
    await store.transact({gymverse_program_drafts_v1:drafts});return drafts.items[0];
  });
  await page.reload();await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
  await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();await page.locator('[data-act="stage6Generator"]').click();
  await page.locator('[data-act="generatorResume"]').click();await expect(page.locator('#generatorPreview')).toBeVisible();
  const resumed=await page.evaluate(async()=>JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_program_drafts_v1).items[0]);
  expect(resumed.id).toBe(original.id);expect(resumed.draft.dayPlanIds).toEqual(original.draft.dayPlanIds);expect(resumed.draft.generatedProgramId).toMatch(/^pg_[a-f0-9]{32}$/);
  await page.locator('.header-nav [data-view="view-plans"]').click();
  await page.locator('#view-plans [data-act="stage6OpenChoices"]').click();await page.locator('[data-act="stage6Generator"]').click();
  await expect(page.locator('[data-act="generatorResume"]')).toBeVisible();await page.locator('[data-act="generatorResume"]').click();
  await page.locator('[data-act="saveGeneratedPreview"]').click();await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot()),profile=JSON.parse(after.gymverse_profiles_v1).profiles[0];
  expect(profile.planPrograms.assignedProgramId).toBe(resumed.draft.generatedProgramId);expect(profile.planPrograms.programs[0].dayPlanIds).toEqual(original.draft.dayPlanIds);
});

test('regeneration failure retains the prior draft; retry replaces it without duplicating programs',async({page})=>{
  await boot(page);await enterGenerator(page);await generate(page,3);
  const before=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot()),original=JSON.parse(before.gymverse_program_drafts_v1).items[0];
  await page.evaluate(firstDay=>{
    const native=Storage.prototype.setItem;let fail=true;
    Storage.prototype.setItem=function(key,value){if(key==='gymverse_program_drafts_v1'&&fail){const next=JSON.parse(value).items[0];if(next&&next.draft.dayPlanIds[0]!==firstDay){fail=false;throw Error('synthetic regeneration write refusal');}}return native.call(this,key,value);};
  },original.draft.dayPlanIds[0]);
  await page.locator('[data-act="regeneratePlan"]').click();await expect(page.locator('#toast')).toContainText('Poprzedni szkic pozostaje zachowany');
  const failed=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());expect(failed.gymverse_program_drafts_v1).toBe(before.gymverse_program_drafts_v1);expect(failed.gymverse_plans).toBe(before.gymverse_plans);
  await page.locator('[data-act="regeneratePlan"]').click();await expect(page.locator('#toast')).toContainText('Propozycja jest gotowa');
  const retry=await page.evaluate(async()=>JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_program_drafts_v1));
  expect(retry.items).toHaveLength(1);expect(retry.items[0].id).toBe(original.id);expect(retry.items[0].draft.generatedProgramId).toBe(original.draft.generatedProgramId);expect(retry.items[0].draft.dayPlanIds).not.toEqual(original.draft.dayPlanIds);
  await page.locator('[data-act="saveGeneratedPreview"]').click();await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());expect(JSON.parse(after.gymverse_profiles_v1).profiles[0].planPrograms.programs).toHaveLength(1);expect(JSON.parse(after.gymverse_program_drafts_v1).items).toEqual([]);
});

test('replacing an assigned program requires confirmation and retains the previous program',async({page})=>{
  await boot(page);await enterGenerator(page);await generate(page,1);await page.locator('[data-act="saveGeneratedPreview"]').click();await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const before=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot()),prior=JSON.parse(before.gymverse_profiles_v1).profiles[0].planPrograms;
  await enterGenerator(page);await generate(page,3);
  page.removeAllListeners('dialog');page.once('dialog',dialog=>dialog.dismiss());await page.locator('[data-act="saveGeneratedPreview"]').click();
  await expect(page.locator('#generatorPreview')).toBeVisible();expect((await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_profiles_v1).toBe(before.gymverse_profiles_v1);
  page.once('dialog',dialog=>dialog.accept());await page.locator('[data-act="saveGeneratedPreview"]').click();await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot()),programs=JSON.parse(after.gymverse_profiles_v1).profiles[0].planPrograms;
  expect(programs.programs).toHaveLength(2);expect(programs.programs.find(item=>item.id===prior.assignedProgramId)).toEqual(prior.programs[0]);expect(programs.assignedProgramId).not.toBe(prior.assignedProgramId);expect(JSON.parse(after.gymverse_plans)).toHaveLength(4);expect(after.gymverse_history).toBe(before.gymverse_history);
});

test('manual exercise add reorder remove and independent plan deletion preserve the other plans',async({page})=>{
  await boot(page);await seedEditablePlans(page);await openOwnPlan(page,0);
  await page.locator('#peAddSelect').selectOption('db_fly');await page.locator('[data-act="peAdd"]').click();
  await page.locator('[data-act="peMove"][data-i="1"][data-d="-1"]').click();
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_plans)[0].exercises.map(ex=>ex.key)).toEqual(['db_fly','bench_flat']);
  await page.locator('[data-act="peDel"][data-i="0"]').click();
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_plans)[0].exercises.map(ex=>ex.key)).toEqual(['bench_flat']);
  const plans=await page.evaluate(async()=>JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans));
  const kept=plans.slice(1);await page.locator('[data-act="peDelPlan"]').click();
  await expect.poll(async()=>JSON.parse((await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_plans)).toEqual(kept);
});

test('day referenced by a durable program draft cannot be deleted',async({page})=>{
  await boot(page);await seedEditablePlans(page);
  const before=await page.evaluate(async()=>{
    const store=window.__gymverseTestHarness.getStore(),raw=await store.refreshSnapshot(),{createProgramDraft,attachDraftDay}=await import('./src/features/plans/program-editor.js'),{saveWorkingDraft}=await import('./src/features/plans/program-drafts.js');
    const draft=createProgramDraft(JSON.parse(raw.gymverse_profiles_v1),JSON.parse(raw.gymverse_plans));attachDraftDay(draft,'plan-a');await saveWorkingDraft(store,{id:'synthetic-durable',revision:null,draft,selected:'plan-a',custom:{},baseCustom:{}});return store.refreshSnapshot();
  });
  await openOwnPlan(page,0);await page.locator('[data-act="peDelPlan"]').click();await expect(page.locator('#toast')).toContainText('niezapisanym szkicu programu');
  const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());expect(after.gymverse_plans).toBe(before.gymverse_plans);expect(after.gymverse_program_drafts_v1).toBe(before.gymverse_program_drafts_v1);
});

test('deleting one historical workout preserves plans and the other session',async({page})=>{
  await boot(page);await seedEditablePlans(page);
  const before=await page.evaluate(async()=>{
    const store=window.__gymverseTestHarness.getStore();await store.transact({gymverse_history:[1,2].map(n=>({id:`synthetic-session-${n}`,date:`2026-01-0${n}T10:00:00.000Z`,planId:'plan-a',planTitle:'Syntetyczny plan 1',totalVolume:320,totalReps:8,details:[{id:`set-${n}`,exerciseId:'bench_flat',exerciseName:'Wyciskanie sztangi na ławce płaskiej',variantId:'default',setNumber:1,date:`2026-01-0${n}T10:00:00.000Z`,weight:40,reps:8,rir:2}]}))});return store.refreshSnapshot();
  });
  await page.reload();await page.getByRole('button',{name:'Historia',exact:true}).click();
  const card=page.locator('.hist-card[data-session-id="synthetic-session-1"]');await card.locator('.hist-head').click();await card.locator('[data-act="histDelete"]').click();
  await expect(card).toHaveCount(0);const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());expect(JSON.parse(after.gymverse_history)).toEqual(JSON.parse(before.gymverse_history).filter(item=>item.id==='synthetic-session-2'));expect(after.gymverse_plans).toBe(before.gymverse_plans);
});

test('generator and plan merge module are available offline in the new worker cache',async({page,context})=>{
  await boot(page);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
  expect(await page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  expect(await page.evaluate(async()=>!!await (await caches.open('gymverse-v58')).match(new URL('./src/features/plans/plan-merge.js',location.href)))).toBe(true);
  await context.setOffline(true);await page.reload();await enterGenerator(page);await generate(page,1);await page.locator('[data-act="saveGeneratedPreview"]').click();await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const raw=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());expect(JSON.parse(raw.gymverse_profiles_v1).profiles[0].planPrograms.assignedProgramId).toMatch(/^pg_[a-f0-9]{32}$/);await context.setOffline(false);
});

for(const mode of ['localStorage','indexeddb'])test(`stale history deletion cannot overwrite another tabs new session (${mode})`,async({page,context})=>{
  await boot(page);await seedEditablePlans(page);
  await page.evaluate(async mode=>{
    const store=window.__gymverseTestHarness.getStore();await store.transact({gymverse_history:[{id:'prior-session',date:'2026-01-01T10:00:00.000Z',planId:'plan-a',planTitle:'Syntetyczny',totalVolume:0,totalReps:0,details:[]}]});
    if(mode==='indexeddb')await store.activateMigration(await store.previewMigration(),{sourceExportVerified:true,v5ExportVerified:true});
  },mode);
  await page.reload();await page.getByRole('button',{name:'Historia',exact:true}).click();
  const other=await context.newPage();await other.goto('/');await expect.poll(()=>other.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
  const committed=await other.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore(),raw=await store.refreshSnapshot(),sessions=JSON.parse(raw.gymverse_history);sessions.push({...sessions[0],id:'new-session',date:'2026-01-02T10:00:00.000Z'});await store.transact({gymverse_history:sessions});return store.refreshSnapshot();});
  const card=page.locator('.hist-card[data-session-id="prior-session"]');await card.locator('.hist-head').click();await card.locator('[data-act="histDelete"]').click();
  await expect.poll(()=>page.evaluate(()=>!!document.querySelector('#toast').textContent||!document.querySelector('.hist-card[data-session-id="prior-session"]'))).toBe(true);expect((await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot())).gymverse_history).toBe(committed.gymverse_history);await expect(page.locator('#toast')).toContainText('Historia zmieniła się');await other.close();
});

test('profile changes during the wizard prevent generating from stale restrictions',async({page})=>{
  await boot(page);await enterGenerator(page);await page.locator('[data-act="generatorNext"]').click();await page.locator('[data-act="generatorNext"]').click();await page.locator('[data-act="generatorNext"]').click();
  await page.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore(),raw=await store.refreshSnapshot(),state=JSON.parse(raw.gymverse_profiles_v1);state.profiles[0].attributes.restrictions.push('knee');await store.transact({gymverse_profiles_v1:state});});
  await page.locator('[data-act="generatePlan"]').click();await expect(page.locator('#toast')).toContainText('Profil zmienił się');await expect(page.locator('#generatorPreview')).toHaveCount(0);
  const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());expect(JSON.parse(after.gymverse_plans)).toEqual([]);expect(after.gymverse_program_drafts_v1).toBeUndefined();
});

test('saved generated program survives assignment refusal and retries assignment without duplication',async({page})=>{
  await boot(page);await enterGenerator(page);await generate(page,3);
  // An already persisted, unassigned generated program is a supported state.
  // The normal generator action commits save+assignment together; this fixture
  // exercises the separate library assignment/retry operation explicitly.
  const id=await page.evaluate(async()=>{
    const store=window.__gymverseTestHarness.getStore();
    const raw=await store.refreshSnapshot(),item=JSON.parse(raw.gymverse_program_drafts_v1).items[0];
    const {commitProgramDraft}=await import('./src/features/plans/program-editor.js');
    return (await commitProgramDraft(store,item.draft,{workingDraft:item})).programId;
  });
  await page.reload();await expect.poll(()=>page.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);

  await page.locator('#view-plans [data-act="programPreview"][data-id="'+id+'"]').click();
  const before=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());
  const original=JSON.parse(before.gymverse_profiles_v1).profiles[0].planPrograms;
  expect(original.assignedProgramId).toBeNull();expect(original.programs).toHaveLength(1);
  await page.evaluate(()=>{
    const native=Storage.prototype.setItem;let fail=true;
    Storage.prototype.setItem=function(key,value){
      if(key==='gymverse_profiles_v1'&&fail){fail=false;throw Error('synthetic assignment refusal');}
      return native.call(this,key,value);
    };
  });
  await page.locator('[data-act="programAssign"]').click();
  await expect(page.locator('#toast')).toContainText('Nie zapisano przypisania. Spróbuj ponownie.');
  await expect(page.locator('#view-program-preview')).toHaveClass(/active/);
  await expect(page.locator('[data-act="programAssign"]')).toBeEnabled();
  const failed=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());
  for(const key of ['gymverse_plans','gymverse_profiles_v1','gymverse_history','gymverse_program_drafts_v1'])expect(failed[key]).toBe(before[key]);
  await page.locator('[data-act="programAssign"]').click();
  await expect(page.locator('#view-plans')).toHaveClass(/active/);
  await expect(page.locator('#toast')).toContainText('Przypisano program do profilu.');
  const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());
  const assigned=JSON.parse(after.gymverse_profiles_v1).profiles[0].planPrograms;
  expect(assigned.programs).toEqual(original.programs);expect(assigned.assignedProgramId).toBe(id);
  for(const key of ['gymverse_plans','gymverse_history','gymverse_program_drafts_v1'])expect(after[key]).toBe(before[key]);
});

test('returning to generator answers and cancelling preserves the saved program',async({page})=>{
  await boot(page);await enterGenerator(page);await generate(page,1);
  await page.locator('[data-act="saveGeneratedPreview"]').click();await expect(page.locator('#view-plans')).toHaveClass(/active/);
  const before=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());
  await enterGenerator(page);await generate(page,3);
  await page.locator('[data-act="editGeneratorAnswers"]').click();
  await expect(page.locator('.generator-wizard > p')).toContainText('Krok 1 z 4');
  await expect(page.locator('#generatorGoal')).toHaveValue('hypertrophy');
  await expect(page.locator('[data-act="programNew"]')).toHaveCount(0);
  await page.locator('[data-act="generatorCancel"]').click();
  await expect(page.locator('#view-plan-choices')).toHaveClass(/active/);
  const after=await page.evaluate(()=>window.__gymverseTestHarness.getStore().refreshSnapshot());
  for(const key of ['gymverse_plans','gymverse_profiles_v1','gymverse_history'])expect(after[key]).toBe(before[key]);
  expect(JSON.parse(after.gymverse_program_drafts_v1).items).toEqual([]);
});
