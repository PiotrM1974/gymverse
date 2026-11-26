import { DRAFT_KEY, readWorkingDrafts, saveWorkingDraft, removeWorkingDraft } from './program-drafts.js';
import { createProgramDraft, addDraftDay, attachDraftDay, commitProgramDraft } from './program-editor.js';

export function createProgramEditorUI(api) {
  let draft = null, selected = null, editing = false, busy = false, review = false;
  let baseCustom = null, custom = null, initial = null;
  let working=null, pending=Promise.resolve(), pendingCount=0, autosaveError=null, recovery=null;
  function workStatus(message){
    for(const el of document.querySelectorAll('[data-working-status]'))el.textContent=message;
  }
  function queueSave(){
    if(!draft||!working)return;
    const captured={draft:structuredClone(draft),selected,custom:structuredClone(custom),baseCustom:structuredClone(baseCustom)},identity=working.id;
    pendingCount++;workStatus('Zachowywanie szkicu…');
    pending=pending.then(async()=>{
      try{
        if(api.uncertain())throw Error('INTEGRITY_UNCERTAIN');
        if(!working||working.id!==identity)throw Error('DRAFT_CONFLICT');
        working=await saveWorkingDraft(api.store(),{...captured,id:identity,revision:working.revision});
        autosaveError=null;
      }catch(error){
        autosaveError=error;if(error.integrityUncertain)api.markUncertain();
        workStatus(error.message==='DRAFT_CONFLICT'?'Szkic zmienił się w innej karcie. Nie nadpisano go.':'Nie udało się zachować szkicu. Nie zamykaj strony; ponów zapis.');
        if(!editing){render();host.querySelector('[data-program-action="retry"]')?.focus();}
        api.notify(error.integrityUncertain?'Integralność danych jest niepewna. Dalsze zapisy zablokowano.':'Nie zachowano zmian szkicu. Pozostają w otwartym formularzu.');
      }finally{pendingCount--;if(autosaveError)workStatus(autosaveError.message==='DRAFT_CONFLICT'?'Szkic zmienił się w innej karcie. Nie nadpisano go.':'Nie udało się zachować szkicu. Nie zamykaj strony; ponów zapis.');else workStatus(pendingCount?'Zachowywanie szkicu…':'Szkic zachowany na tym urządzeniu.');}
    });
  }
  async function flushWork(){await pending;if(autosaveError)throw autosaveError;}
  const fingerprint = () => draft && JSON.stringify([draft.title, draft.dayPlanIds, draft.plans, custom]);
  const hasChanges = () => !!draft && (!draft.programId || fingerprint() !== initial);
  function discard() { draft=null;working=null;editing=false;api.restoreCustom(baseCustom);api.endDay(); }
  function allowLeave(id) {
    if (!draft || id==='view-program-editor' || (id==='view-planedit' && (editing || draft.generatorAnswers))) return true;
    if (busy || pendingCount) { api.notify('Poczekaj na zakończenie zapisu programu.'); return false; }
    if (hasChanges() && !confirm('Opuścić edytor? Zachowany szkic będzie dostępny do wznowienia.')) return false;
    if(autosaveError){api.notify('Nie zachowano szkicu. Ponów zapis lub jawnie odrzuć szkic.');return false;}
    discard();return true;
  }
  window.addEventListener('beforeunload',event=>{
    if(hasChanges()||busy){event.preventDefault();event.returnValue='';}
  });
  const esc = api.escape;
  const host = document.createElement('div');
  host.id = 'view-program-editor'; host.className = 'view-section';
  document.querySelector('#view-planedit').after(host);
  const button = (action, text, attrs='') => `<button type="button" class="btn-secondary" data-program-action="${action}" ${attrs}>${text}</button>`;
  function render() {
    if (!draft) return;
    if (!draft.dayPlanIds.includes(selected)) selected = draft.dayPlanIds[0];
    const day = draft.plans.find(item => item.id === selected);
    const profile = draft.baseState.profiles.find(item => item.id === draft.profileId);
    const occupied = new Set((profile.planPrograms?.programs || []).filter(item=>item.id!==draft.programId).flatMap(item=>item.dayPlanIds));
    const available = draft.plans.filter(item=>!occupied.has(item.id)&&!draft.dayPlanIds.includes(item.id));
    const details = item => `<ol class="stage6-exercises">${item.exercises.map((exercise,index)=>`<li><span class="stage6-number">${index+1}</span><div><strong>${esc(api.exerciseName({...exercise,name:custom[exercise.key]?.name||exercise.name}))}</strong><small>${esc(api.variantName(exercise))} · ${exercise.sets} serii · ${esc(exercise.target)} powt.</small><small>Przerwa ${api.rest(exercise)} s</small>${api.groups?.(exercise)?`<small>Grupy: ${esc(api.groups(exercise))}</small>`:''}</div></li>`).join('') || '<li>Dodaj ćwiczenia w edytorze dnia.</li>'}</ol>`;
    host.innerHTML = `<div class="program-editor"><p class="screen-eyebrow">${review?'PRZEGLĄD PRZED ZAPISEM':'WŁASNY PROGRAM'}</p><h1 class="screen-title">${esc(draft.title)}</h1><p class="small">Zmiany w szkicu zapiszesz przyciskiem „Zapisz program”.</p>
      <label>Nazwa programu<input class="select-custom" data-program-field="title" aria-label="Nazwa programu" maxlength="60" value="${esc(draft.title)}"></label>
      <h2>Przegląd tygodnia · ${draft.dayPlanIds.length} dni</h2>
      <div class="program-day-tabs" role="group" aria-label="Dni programu">${draft.dayPlanIds.map((id,index)=>button('select',`Dzień ${index+1}<span>${esc(draft.plans.find(item=>item.id===id).title)}</span>`,`data-id="${esc(id)}" aria-pressed="${!review&&id===selected}"`)).join('')}</div>
      ${review ? draft.dayPlanIds.map((id,index)=>{const item=draft.plans.find(plan=>plan.id===id);return `<section><h2>Dzień ${index+1} — ${esc(item.title)}</h2>${details(item)}</section>`;}).join('') : day ? `<section class="program-selected-day"><label>Nazwa dnia<input class="select-custom" data-program-field="dayTitle" aria-label="Nazwa dnia" maxlength="40" value="${esc(day.title)}"></label><div class="program-actions">${button('moveUp','↑ Wcześniej',draft.dayPlanIds.indexOf(selected)===0?'disabled':'')}${button('moveDown','↓ Później',draft.dayPlanIds.indexOf(selected)===draft.dayPlanIds.length-1?'disabled':'')}${button('detach','Odłącz dzień',draft.dayPlanIds.length===1?'disabled':'')}</div>${details(day)}${button('edit','Edytuj ćwiczenia dnia')}</section>` : ''}
      <div class="program-actions">${button('add','+ Nowy dzień',draft.dayPlanIds.length>=6?'disabled':'')}${available.length?`<label>Dołącz samodzielny trening<select class="select-custom" id="programAttach"><option value="">Wybierz trening</option>${available.map(item=>`<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('')}</select></label>${button('attach','Dołącz wybrany',draft.dayPlanIds.length>=6?'disabled':'')}`:''}</div>
      <div class="program-actions">${button('review',review?'Wróć do edycji':'Przejrzyj cały program')}<button class="btn-primary" data-program-action="save" ${busy?'disabled':''}>${busy?'Zapisywanie…':'Zapisz program'}</button>${draft.generatorAnswers?button('generator','Wróć do generatora'):''}${autosaveError?button('retry','Ponów zapis szkicu'):''}${button('cancel','Odrzuć szkic')}</div><p data-working-status role="status">${pendingCount?'Zachowywanie szkicu…':autosaveError?'Nie zachowano ostatnich zmian szkicu.':'Szkic zachowany na tym urządzeniu.'}</p><p id="programEditorStatus" role="status"></p></div>`;
    if(busy)host.querySelectorAll('button,input,select').forEach(control=>{control.disabled=true;});
  }
  function activate(item, fresh=false, show=true){
    working=item;draft=structuredClone(item.draft);baseCustom=structuredClone(item.baseCustom);custom=structuredClone(item.custom);
    selected=item.selected;review=false;editing=false;autosaveError=null;recovery=null;initial=fresh?fingerprint():null;
    render();if(show)api.show('view-program-editor');
    if(fresh)queueSave();
  }
  async function open(id=null, selectedDay=null, fresh=false) {
    try{
      if(draft){if(!confirm('Opuścić bieżący szkic? Zachowane zmiany pozostaną do wznowienia.'))return;await flushWork();discard();}
      if(api.active()){api.notify('Zakończ aktywny trening przed edycją programu.');return;}
      const raw=await api.store().refreshSnapshot(),state=JSON.parse(raw.gymverse_profiles_v1);
      const candidates=readWorkingDrafts(raw[DRAFT_KEY]).items.filter(item=>item.draft.profileId===state.activeProfileId&&item.draft.programId===id&&!item.draft.generatorAnswers);
      if(candidates.length&&!fresh){
        recovery={candidates,id,selectedDay};
        host.innerHTML='<div class="program-editor"><h1 class="screen-title">Znaleziono niezapisane zmiany</h1><p>Wznowienie nie zmieni zapisanego programu.</p>'+candidates.map(item=>'<section><h2>'+esc(item.draft.title)+'</h2><button class="btn-primary" data-recover="resume" data-id="'+esc(item.id)+'">Wznów edycję</button><button class="btn-secondary" data-recover="discard" data-id="'+esc(item.id)+'">Odrzuć szkic</button></section>').join('')+(id===null?'<button class="btn-secondary" data-recover="new">Utwórz kolejny program</button>':'')+'<p data-working-status role="status"></p></div>';
        api.show('view-program-editor');return;
      }
      const d=createProgramDraft(state,JSON.parse(raw.gymverse_plans||'[]'),id);if(!id)addDraftDay(d);
      const catalog=JSON.parse(raw.gymverse_custom||'{}');
      activate({id:crypto.randomUUID(),revision:null,draft:d,selected:d.dayPlanIds.includes(selectedDay)?selectedDay:d.dayPlanIds[0],custom:catalog,baseCustom:catalog},true);
    }catch(error){if(error.integrityUncertain)api.markUncertain();api.notify('Nie można otworzyć szkicu. Nie zmieniono danych.');}
  }
  host.addEventListener('click',async event=>{
    const target=event.target.closest('[data-recover]');if(!target||!recovery)return;
    if(target.dataset.recover==='new'){await open(null,null,true);return;}
    const item=recovery.candidates.find(x=>x.id===target.dataset.id);if(!item)return;
    try{
      if(api.uncertain())throw Error('INTEGRITY_UNCERTAIN');
      if(target.dataset.recover==='resume'){activate(item);return;}
      await removeWorkingDraft(api.store(),item);await open(recovery.id,recovery.selectedDay);
    }catch(error){if(error.integrityUncertain)api.markUncertain();workStatus('Nie usunięto szkicu. Dane zmieniły się lub zapis nie powiódł się. Otwórz edytor ponownie.');}
  });
  function returnToProgram() { editing=false;api.restoreCustom(baseCustom);api.endDay();render();api.show('view-program-editor'); }
  document.querySelector('#planEditBody').addEventListener('input',event=>{
    if(!editing||!draft||busy)return;
    const day=draft.plans.find(p=>p.id===selected),field=event.target.dataset.field;
    if(field==='peTitle')day.title=event.target.value;
    else if(field==='peTarget'&&day.exercises[Number(event.target.dataset.i)])day.exercises[Number(event.target.dataset.i)].target=event.target.value;
    else return;
    queueSave();
  });
  host.addEventListener('input',event=>{
    if(!draft||busy)return;
    if(event.target.dataset.programField==='title')draft.title=event.target.value;
    if(event.target.dataset.programField==='dayTitle')draft.plans.find(item=>item.id===selected).title=event.target.value;
    queueSave();
  });
  host.addEventListener('click',async event=>{
    const target=event.target.closest('[data-program-action]');if(!target||!draft||busy)return;
    try {
      const action=target.dataset.programAction;
      if(action==='generator'){await flushWork();const answers=structuredClone(draft.generatorAnswers);discard();api.generator(answers);return;}
      if(action==='select'){selected=target.dataset.id;review=false;}
      if(action==='add'){selected=addDraftDay(draft);review=false;}
      if(action==='attach'){const id=host.querySelector('#programAttach').value;attachDraftDay(draft,id);selected=id;review=false;}
      if(action==='detach'&&draft.dayPlanIds.length>1){draft.dayPlanIds=draft.dayPlanIds.filter(id=>id!==selected);selected=draft.dayPlanIds[0];}
      if(action==='moveUp'||action==='moveDown'){const i=draft.dayPlanIds.indexOf(selected),j=i+(action==='moveUp'?-1:1);if(j>=0&&j<draft.dayPlanIds.length)[draft.dayPlanIds[i],draft.dayPlanIds[j]]=[draft.dayPlanIds[j],draft.dayPlanIds[i]];}
      if(action==='review')review=!review;
      if(action==='retry'){queueSave();await flushWork();}
      if(action==='edit'){queueSave();editing=true;api.restoreCustom(custom);api.editDay(selected);return;}
      if(action==='cancel'){if(!confirm('Odrzucić niezapisany szkic programu?'))return;await pending;if(api.uncertain())throw Error('INTEGRITY_UNCERTAIN');if(working?.revision)await removeWorkingDraft(api.store(),working);discard();api.showLibrary();return;}
      if(action==='save'){
        if(api.uncertain())throw new Error('INTEGRITY_UNCERTAIN');
        draft.title=draft.title.trim();draft.plans.forEach(day=>day.title=day.title.trim());
        busy=true;render();
        try {
          await flushWork();
          const result=await commitProgramDraft(api.store(),draft,{custom,baseCustom,workingDraft:working});
          api.saved(result,custom,!!draft.generatorAnswers);draft=null;working=null;editing=false;api.endDay();api.preview(result.programId,selected);api.notify('Zapisano program. Przypisanie do profilu jest osobną decyzją.');return;
        } finally {busy=false;}
      }
      if(!['retry','save'].includes(action))queueSave();
      render();
      if(action==='review'||action==='select')window.scrollTo(0,0);
    } catch(error) {
      if(error.integrityUncertain)api.markUncertain();
      const message=error.integrityUncertain?'Integralność danych jest niepewna. Dalsze zapisy zablokowano.':['PROGRAM_STATE_STALE','DRAFT_CONFLICT'].includes(error.message)?'Dane zmieniły się w innym oknie. Nie zapisano zmian. Twój szkic pozostaje otwarty.':error.message==='PROGRAM_ACTIVE_SESSION'?'Trwa aktywny trening. Nie zapisano programu.':error.message==='PROGRAM_DAY_EMPTY'?'Dodaj ćwiczenia do każdego dnia przed zapisaniem.':'Nie zapisano programu. Sprawdź nazwę i dni lub ponów zapis. Szkic zachowano.';
      render();host.querySelector('#programEditorStatus').textContent=message;api.notify(message);
    }
  });
  return {async stageGenerated(d,catalog){
      if(api.active()||api.uncertain())throw Error('PROGRAM_UNAVAILABLE');
      if(draft)await flushWork();
      const previous=draft?.generatorAnswers?structuredClone(working):null;
      if(draft)discard();
      if(previous?.draft.generatedProgramId)d.generatedProgramId=previous.draft.generatedProgramId;
      activate({id:previous?.id||crypto.randomUUID(),revision:previous?.revision??null,draft:d,selected:d.dayPlanIds[0],custom:catalog,baseCustom:catalog},true,false);
      try{await flushWork();}catch(error){if(previous){activate(previous,false,false);error.previousGeneratedDraftRetained=true;}throw error;}
    },
    async updateGenerated(plans,selectedDay){draft.plans=[...structuredClone(draft.basePlans),...structuredClone(plans)];if(selectedDay&&draft.dayPlanIds.includes(selectedDay))selected=selectedDay;queueSave();await flushWork();},
    async resumeWorkingDraft(id){
      if(api.active()||api.uncertain()){api.notify('Nie można teraz otworzyć edycji. Dane szkicu pozostają zachowane.');return;}
      try{
        const raw=await api.store().refreshSnapshot(),state=JSON.parse(raw.gymverse_profiles_v1||'null');
        const item=readWorkingDrafts(raw[DRAFT_KEY]).items.find(row=>row.id===id&&row.draft.profileId===state?.activeProfileId&&!row.draft.generatorAnswers);
        if(!item)throw Error('DRAFT_NOT_FOUND');activate(item);
      }catch{api.notify('Nie można wznowić szkicu. Otwórz ponownie listę szkiców.');}
    },
    async generatedDrafts(){const raw=await api.store().refreshSnapshot(),state=JSON.parse(raw.gymverse_profiles_v1||'null');return readWorkingDrafts(raw[DRAFT_KEY]).items.filter(item=>item.draft.profileId===state?.activeProfileId&&item.draft.programId===null&&item.draft.generatorAnswers);},
    async resumeGeneratedDraft(id){const item=(await this.generatedDrafts()).find(row=>row.id===id);if(!item)throw Error('DRAFT_NOT_FOUND');activate(item,false,false);if(!draft.generatedProgramId){draft.generatedProgramId='pg_'+crypto.randomUUID().replaceAll('-','');queueSave();await flushWork();}return structuredClone(working);},
    async discardGeneratedDraft(id){const item=(await this.generatedDrafts()).find(row=>row.id===id);if(!item)throw Error('DRAFT_NOT_FOUND');await removeWorkingDraft(api.store(),item);},
    async cancelGenerated(){await flushWork();if(working?.revision)await removeWorkingDraft(api.store(),working);discard();},
    async saveGeneratedAndAssign({assign=true,edit=false}={}){
      if(busy)return false;
      if(!draft?.generatorAnswers||!draft.generatedProgramId)throw Error('GENERATED_PROGRAM_NOT_READY');
      if(api.uncertain())throw Error('INTEGRITY_UNCERTAIN');
      busy=true;
      try{
      if(autosaveError)queueSave();
      await flushWork();
      const latest=await api.store().refreshSnapshot(),state=JSON.parse(latest.gymverse_profiles_v1||'null');
      const profile=state?.profiles?.find(item=>item.id===draft.profileId);
      if(state?.activeProfileId!==draft.profileId||!profile)throw Error('PROGRAM_STATE_STALE');
      const prior=profile.planPrograms?.programs.find(item=>item.id===profile.planPrograms.assignedProgramId);
      if(assign&&prior&&!confirm(`Obecny program: ${prior.title}\nNowy program: ${draft.title}\nHistoria i wykonane treningi pozostaną zachowane. Zapisać i przypisać nowy program?`))return false;
      const result=await commitProgramDraft(api.store(),draft,{custom,baseCustom,workingDraft:working,assignProgram:assign});
      api.saved(result,result.custom||custom,true);draft=null;working=null;editing=false;api.endDay();api.show('view-plans');api.notify(assign?'Program został zapisany i przypisany. Historia pozostała bez zmian.':'Program został zapisany. Przypisanie profilu nie zmieniło się.');if(edit){busy=false;await open(result.programId);}return true;
      }finally{busy=false;}
    },
    showGenerated(mode,id){selected=id||selected;review=mode==='program';render();api.show('view-program-editor');if(mode==='day'){editing=true;api.restoreCustom(custom);api.editDay(selected);}if(mode==='save')host.querySelector('[data-program-action="save"]').click();},
    open,returnToProgram,allowLeave,leaveDay(){if(editing){editing=false;api.restoreCustom(baseCustom);}},get editing(){return editing;},get draft(){return draft;},
    localSave(plans,options){draft.plans=structuredClone(plans);if(options.custom){custom=structuredClone(options.custom);api.restoreCustom(custom);}queueSave();return true;},
    decorateDay(){if(!editing)return;const box=document.querySelector('#planEditBody');box.querySelector('[data-act="peDelPlan"]')?.remove();const back=box.querySelector('[data-act="peBack"]');if(back){back.removeAttribute('data-act');back.textContent='← Wróć do programu';back.onclick=returnToProgram;}const notice=document.createElement('p');notice.className='banner';notice.textContent='Edytujesz szkic dnia. Zatwierdź całość przyciskiem „Zapisz program”.';box.prepend(notice);const status=document.createElement('p');status.dataset.workingStatus='';status.setAttribute('role','status');status.textContent=pendingCount?'Zachowywanie szkicu…':autosaveError?'Nie zachowano ostatnich zmian.':'Szkic zachowany na tym urządzeniu.';box.prepend(status);}
  };
}
