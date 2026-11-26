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
 await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_plans).some(p=>p.id==='standalone')).toBe(false);
 const after=await raw(page);expect(after.gymverse_program_drafts_v1).toBe(before.gymverse_program_drafts_v1);expect(after.gymverse_profiles_v1).toBe(before.gymverse_profiles_v1);expect(after.gymverse_history).toBe(before.gymverse_history);
});
test('referenced draft can be explicitly discarded and then its standalone plan deleted',async({page})=>{
 await boot(page);await seedDraft(page,null);await manage(page);await page.locator('[data-act="peOpen"][data-id="standalone"]').click();
 await page.locator('[data-act="peDelPlan"]').click();await expect(page.locator('#toast')).toContainText('niezapisanym szkicu');
 await page.locator('[data-act="peBack"]').click();await page.locator('[data-act="managedDraftDiscard"]').click();
 await expect(page.locator('[data-act="managedDraftDiscard"]')).toHaveCount(0);
 await page.locator('[data-act="peOpen"][data-id="standalone"]').click();await page.locator('[data-act="peDelPlan"]').click();
 await expect.poll(async()=>JSON.parse((await raw(page)).gymverse_plans).some(p=>p.id==='standalone')).toBe(false);
 expect(JSON.parse((await raw(page)).gymverse_program_drafts_v1).items).toEqual([]);
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
