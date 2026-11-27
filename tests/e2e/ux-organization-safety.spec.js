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


async function seedDraft(page,programId=A){return page.evaluate(async programId=>{
 const store=window.__gymverseTestHarness.getStore(),raw=await store.refreshSnapshot();
 const {createProgramDraft,attachDraftDay}=await import('./src/features/plans/program-editor.js');const {saveWorkingDraft}=await import('./src/features/plans/program-drafts.js');
 const draft=createProgramDraft(JSON.parse(raw.gymverse_profiles_v1),JSON.parse(raw.gymverse_plans),programId);
 if(!programId)attachDraftDay(draft,'standalone');draft.title='Do sprawdzenia — góra';
 return saveWorkingDraft(store,{id:'working-synthetic',revision:null,draft,selected:draft.dayPlanIds[0],custom:{},baseCustom:{}});
},programId);}
const manage=page=>page.locator('#view-plans [data-act="editPlans"]').click();
test('real draft does not block saved program deletion and cannot resurrect it',async({page})=>{
 await boot(page);await seedDraft(page);await manage(page);const before=await raw(page);
 await page.locator('.managed-program[data-id="'+A+'"] [data-act="programDelete"]').click();
 await expect(page.locator('.managed-program')).toHaveCount(1);
 const after=await raw(page);for(const key of ['gymverse_plans','gymverse_history','gymverse_program_drafts_v1'])expect(after[key]).toBe(before[key]);
 await page.locator('[data-act="managedDraftResume"]').click();await expect(page.locator('#view-program-editor')).toHaveClass(/active/);
 await page.locator('[data-program-action="save"]').click();await expect(page.locator('#programEditorStatus')).toContainText('Dane zmieniły');
 expect((await raw(page)).gymverse_profiles_v1).toBe(after.gymverse_profiles_v1);
});
test('base snapshot is not draft membership and does not block unrelated plan removal',async({page})=>{
 await boot(page);await seedDraft(page);await manage(page);const before=await raw(page);
 await page.locator('[data-act="peOpen"][data-id="standalone"]').click();await page.locator('[data-act="peDelPlan"]').click();
 await expect(page.locator('#toast')).toContainText('Usunięto plan');
 await expect(page.locator('[data-act="peOpen"][data-id="standalone"]')).toHaveCount(0);
 const after=await raw(page);expect(after.gymverse_program_drafts_v1).toBe(before.gymverse_program_drafts_v1);expect(after.gymverse_plans).toBe(before.gymverse_plans);expect(after.gymverse_history).toBe(before.gymverse_history);
 expect(JSON.parse(after.gymverse_profiles_v1).profiles[0].planPrograms.archivedDayPlanIds).toEqual(['standalone']);
});
test('a linked draft survives standalone plan deletion and cannot reactivate the plan',async({page})=>{
 await boot(page);await seedDraft(page,null);await manage(page);const before=await raw(page);
 await page.locator('[data-act="peOpen"][data-id="standalone"]').click();
 await page.locator('[data-act="peDelPlan"]').click();await expect(page.locator('#toast')).toContainText('Usunięto plan');
 const after=await raw(page);expect(after.gymverse_program_drafts_v1).toBe(before.gymverse_program_drafts_v1);
 await page.locator('[data-act="managedDraftResume"]').click();await expect(page.locator('#view-program-editor')).toHaveClass(/active/);
 await page.locator('[data-program-action="save"]').click();await expect(page.locator('#programEditorStatus')).toContainText('Dane zmieniły');
 expect((await raw(page)).gymverse_profiles_v1).toBe(after.gymverse_profiles_v1);
});
test('stale draft discard cannot delete a newer revision from another tab',async({page,context})=>{
 await boot(page);await seedDraft(page,null);await manage(page);await expect(page.locator('[data-act="managedDraftDiscard"]')).toBeVisible();
 const other=await context.newPage();await other.goto('/');await expect.poll(()=>other.evaluate(()=>!!window.__gymverseTestHarness)).toBe(true);
 await other.evaluate(async()=>{const store=window.__gymverseTestHarness.getStore(),{saveWorkingDraft}=await import('./src/features/plans/program-drafts.js');const item=JSON.parse((await store.refreshSnapshot()).gymverse_program_drafts_v1).items[0];item.draft.title='Nowsza praca';await saveWorkingDraft(store,item);});
 const before=await raw(other);await page.locator('[data-act="managedDraftDiscard"]').click();await expect(page.locator('#toast')).toContainText('Szkic zmienił');expect((await raw(other)).gymverse_program_drafts_v1).toBe(before.gymverse_program_drafts_v1);
 await other.close();
});
test('settings profile edit and switching preserve program and history isolation',async({page})=>{
 await boot(page);const before=await raw(page);await page.getByRole('button',{name:'Ustawienia',exact:true}).press('Enter');
 await page.locator('#profileManage > summary').click();await page.locator('#editProfileButton').click();await page.locator('#newProfileName').fill('Nie zapisuj');await page.locator('[data-act="profileCancel"]').click();expect((await raw(page)).gymverse_profiles_v1).toBe(before.gymverse_profiles_v1);
 await page.locator('#editProfileButton').click();await page.locator('#newProfileName').fill('Profil poprawiony');for(let i=0;i<3;i++)await page.locator('[data-act="profileNext"]').click();await page.locator('[data-act="createProfile"]').click();
 await expect(page.locator('#settingsActiveProfile')).toContainText('Profil poprawiony');const after=await raw(page);expect(after.gymverse_plans).toBe(before.gymverse_plans);expect(after.gymverse_history).toBe(before.gymverse_history);
 await page.locator('.header-nav [data-view="view-plans"]').click();await page.getByRole('button',{name:'Ustawienia',exact:true}).click();await page.locator('#profileSelect').selectOption('profile-b');await expect(page.locator('#view-plans .program-card')).toHaveCount(1);await expect(page.locator('#view-plans .program-card')).toContainText('Program profilu B');
 await page.getByRole('button',{name:'Ustawienia',exact:true}).click();await page.locator('#profileSelect').selectOption('profile-a');await expect(page.locator('#view-plans .program-card').first()).toHaveAttribute('data-id',A);expect((await raw(page)).gymverse_plans).toBe(before.gymverse_plans);
});

for (const mode of ['localStorage', 'indexeddb']) {
  test(`deleting the last Push A1 keeps history, stats and progression in ${mode}`, async ({ page, browser }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem('deletion-seeded')) return;
      localStorage.setItem('deletion-seeded', '1');
      localStorage.setItem('gymverse_schema', '4');
      localStorage.setItem('gymverse_plans', JSON.stringify([{id:'push_a1',title:'Push A1',exercises:[{key:'bench_flat',variantId:'default',sets:1,target:'8-10'}]}]));
      localStorage.setItem('gymverse_history', '[]');
      localStorage.setItem('gymverse_profiles_v1', JSON.stringify({schemaVersion:1,activeProfileId:'profile-a',profiles:[{id:'profile-a',name:'Profil A',attributes:{},data:{}}]}));
    });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => !!window.__gymverseTestHarness)).toBe(true);
    if (mode === 'indexeddb') {
      await page.evaluate(async () => {
        const store = window.__gymverseTestHarness.getStore();
        await store.activateMigration(await store.previewMigration(), {sourceExportVerified:true,v5ExportVerified:true});
      });
      await page.reload();
      await expect.poll(() => page.evaluate(() => window.__gymverseTestHarness?.getStore().mode)).toBe(mode);
    }
    await page.locator('#planList [data-plan="push_a1"]').click();
    await page.locator('.workout-extras > summary').click();
    await page.locator('[data-act="rir"][data-v="2"]').click();
    await expect.poll(async () => JSON.parse((await raw(page)).gymverse_active).rir[0]).toBe(2);
    await expect(page.locator('#sessionSaveStatus')).toBeHidden();
    await page.locator('#weight_0').fill('40');
    await page.locator('#reps_0').fill('8');
    await page.locator('#btnDone_0').click();
    await expect(page.locator('#btnDone_0')).toHaveClass(/completed/);
    await page.locator('[data-act="finish"]').click();
    await expect.poll(async () => JSON.parse((await raw(page)).gymverse_history).length).toBe(1);
    await page.locator('.header-nav [data-view="view-plans"]').click();
    const before = await raw(page);
    await manage(page);
    await page.locator('[data-act="peOpen"][data-id="push_a1"]').click();
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('[data-act="peDelPlan"]').click();
    expect((await raw(page)).gymverse_profiles_v1).toBe(before.gymverse_profiles_v1);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-act="peDelPlan"]').click();
    await expect(page.locator('#toast')).toContainText('Usunięto plan');
    const after = await raw(page);
    for (const key of ['gymverse_history', 'gymverse_last_weights', 'gymverse_active', 'gymverse_draft_v1', 'gymverse_plans']) expect(after[key]).toBe(before[key]);
    expect(JSON.parse(after.gymverse_profiles_v1).profiles[0].planPrograms.archivedDayPlanIds).toEqual(['push_a1']);

    const verify = async app => {
      await expect(app.locator('#view-plans')).toHaveClass(/active/);
      await expect(app.locator('#planList .plan-card')).toHaveCount(0);
      await app.locator('.header-nav [data-view="view-history"]').click();
      await expect(app.locator('#histNewPlan option')).toHaveCount(0);
      await app.locator('[data-act="histToggle"]').click();
      await expect(app.locator('#hist_0')).toContainText('Barbell Bench Press');
      await expect(app.locator('#hist_0 .set-chip').first()).toHaveText('40×8 · RIR 2');
      await app.locator('.header-nav [data-view="view-stats"]').click();
      await expect(app.locator('#statsLifetime .lifetime-stat-value')).toHaveText(['1','320 kg']);
      await app.locator('.header-nav [data-view="view-charts"]').click();
      await expect(app.locator('#chartReadings .chart-reading')).toContainText('40 kg · maks. 8 powt. · tonaż 320 kg');
      await expect(app.locator('#progressionReview')).not.toContainText('Push A1');
    };
    await page.reload();
    await verify(page);
    if (mode === 'localStorage') {
      const bytes = await page.evaluate(async () => {
        const {createBackupV5} = await import('./src/gv-data.js');
        const store = window.__gymverseTestHarness.getStore();
        const snapshot = Object.fromEntries(Object.entries(await store.refreshSnapshot()).map(([key, value]) => [key, JSON.parse(value)]));
        const backup = await createBackupV5(snapshot);
        return Array.from(new Uint8Array(await backup.arrayBuffer()));
      });
      const isolated = await browser.newContext();
      try {
        const restored = await isolated.newPage();
        await restored.goto(new URL('/', page.url()).href);
        await expect.poll(() => restored.evaluate(() => !!window.__gymverseTestHarness)).toBe(true);
        await restored.evaluate(async data => {
          const {previewBackupV5, restoreBackupV5} = await import('./src/gv-data.js');
          const preview = await previewBackupV5(new Blob([new Uint8Array(data)], {type:'application/zip'}));
          await restoreBackupV5(window.__gymverseTestHarness.getStore().storage, preview, {confirmed:true,restoreActive:true,restoreDrafts:true});
        }, bytes);
        await restored.reload();
        await verify(restored);
        expect(JSON.parse((await raw(restored)).gymverse_history)).toEqual(JSON.parse(before.gymverse_history));
      } finally { await isolated.close(); }
    }
  });
}

test('deleting a program day leaves its siblings, assignment and historical identity intact', async ({page}) => {
  await boot(page, 3);
  const program = page.locator('.managed-program[data-id="'+A+'"]');
  await manage(page);
  const before = await raw(page);
  await program.getByText('Usuń pojedynczy dzień', {exact:true}).click();
  await program.locator('[data-act="managedPlanDelete"][data-id="day-1"]').click();
  await expect(page.locator('#toast')).toContainText('Usunięto plan');
  const after = await raw(page);
  const state = JSON.parse(after.gymverse_profiles_v1);
  expect(state.profiles[0].planPrograms.assignedProgramId).toBe(A);
  expect(state.profiles[0].planPrograms.programs.find(program => program.id === A).dayPlanIds).toEqual(['day-0','day-2']);
  expect(state.profiles[0].planPrograms.archivedDayPlanIds).toEqual(['day-1']);
  expect(state.profiles[1]).toEqual(JSON.parse(before.gymverse_profiles_v1).profiles[1]);
  for (const key of ['gymverse_plans','gymverse_history','gymverse_active']) expect(after[key]).toBe(before[key]);
  await page.locator('.header-nav [data-view="view-plans"]').click();
  await page.locator('.program-card[data-id="'+A+'"] [data-act="programPreview"]').click();
  await expect(page.locator('[data-act="programDay"]')).toHaveCount(2);
  await expect(page.locator('[data-act="programDay"][data-id="day-1"]')).toHaveCount(0);
});

test('removing the plan of a running session preserves active data and a stale tab cannot start it again', async ({page, context}) => {
  await boot(page);
  const other = await context.newPage();
  await other.goto('/');
  await expect.poll(() => other.evaluate(() => !!window.__gymverseTestHarness)).toBe(true);
  await page.locator('#planList [data-plan="standalone"]').click();
  await page.locator('#weight_0').fill('52');
  await page.locator('#reps_0').fill('8');
  await page.locator('#btnDone_0').click();
  await expect(page.locator('#btnDone_0')).toHaveClass(/completed/);
  await page.locator('.header-nav [data-view="view-plans"]').click();
  await manage(page);
  const before = await raw(page);
  await page.locator('[data-act="managedPlanDelete"][data-id="standalone"]').click();
  await expect(page.locator('#toast')).toContainText('Usunięto plan');
  const after = await raw(page);
  for (const key of ['gymverse_active','gymverse_history','gymverse_draft_v1']) expect(after[key]).toBe(before[key]);
  await other.locator('#planList [data-plan="standalone"]').click();
  await expect(other.locator('#toast')).toContainText('Plan lub profil zmienił się');
  await other.locator('.header-nav [data-view="view-history"]').click();
  await other.getByText('Dodaj trening z przeszłości', {exact:true}).click();
  await other.locator('#histNewPlan').selectOption('standalone');
  await other.locator('[data-act="histNew"]').click();
  await expect(other.locator('#toast')).toContainText('Plan usunięto w innej karcie');
  expect((await raw(other)).gymverse_active).toBe(before.gymverse_active);
  expect((await raw(other)).gymverse_history).toBe(before.gymverse_history);
  await page.reload();
  await page.locator('#resumeBox [data-act="resume"]').click();
  await expect(page.locator('#weight_0')).toHaveValue('52');
  await other.locator('#histNewPlan').selectOption('other-day');
  await other.locator('[data-act="histNew"]').click();
  await expect(other.locator('#toast')).toContainText('Dodano trening');
  const [otherSession] = JSON.parse((await raw(other)).gymverse_history);
  await page.locator('[data-act="finish"]').click();
  await expect(page.locator('#view-summary')).toHaveClass(/active/);
  const saved = await raw(other);
  expect(saved.gymverse_active).toBeUndefined();
  const [otherResult, resumedResult] = JSON.parse(saved.gymverse_history);
  expect(otherResult).toEqual(otherSession);
  expect(resumedResult.details[0]).toMatchObject({exerciseId:'bench_flat',weight:52,reps:8});
});
