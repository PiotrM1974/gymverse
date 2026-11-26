export function chooseBackupImport(plan) {
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');dialog.id='backupImportPreview';
    dialog.style.cssText='width:min(90vw,540px);max-height:85dvh;overflow:auto;border:1px solid var(--border);border-radius:20px;padding:20px;margin:auto;background:var(--card-bg,#172332);color:var(--text,#fff);box-sizing:border-box';
    const title=document.createElement('h2');title.textContent='Import kopii GymNastika';title.style.cssText='font-family:inherit;font-size:22px;font-weight:700;letter-spacing:normal;line-height:1.25;text-shadow:none;margin:0 0 12px';dialog.append(title);
    const summary=document.createElement('p');
    const s=plan.stats;
    const programCount=(plan.profileOverview||[]).reduce((sum,profile)=>sum+(profile.programs||0),0);
    summary.textContent=`Profile: ${s.profiles}. Programy: ${programCount}. Plany: ${s.plans}. Treningi: ${s.sessions}. Już obecne: ${s.existing}. Nowe: ${s.added}. Konflikty: ${s.conflicts+(plan.auxiliaryConflicts||0)}. Nowe profile: ${s.newProfiles}.`;
    dialog.append(summary);
    const metrics=document.createElement('ul');metrics.className='backup-metrics';
    for(const [label,value] of [['Profile',s.profiles],['Programy',programCount],['Plany',s.plans],['Treningi',s.sessions],['Już obecne',s.existing],['Do dodania',s.added],['Konflikty',s.conflicts+(plan.auxiliaryConflicts||0)],['Nowe profile',s.newProfiles]]){
      const item=document.createElement('li'),number=document.createElement('strong'),caption=document.createElement('span');number.textContent=String(value);caption.textContent=label;item.append(number,caption);metrics.append(item);
    }
    dialog.append(metrics);
    const profiles=document.createElement('ul');
    profiles.className='backup-profiles';profiles.style.cssText='padding-left:32px;margin:12px 0';
    for(const profile of plan.profileOverview||[]){const row=document.createElement('li');row.textContent=`${profile.name}: ${profile.programs||0} programów, ${profile.plans} planów, ${profile.sessions} treningów`;row.style.overflowWrap='anywhere';profiles.append(row);}dialog.append(profiles);
    if(plan.stats.conflicts || plan.auxiliaryConflicts){const labels={'profile-program-assignment':'różne przypisania programu','plan-program':'różne programy o tym samym identyfikatorze','plan-program-days':'brakujące lub konfliktujące dni programu'};const details=document.createElement('p');details.textContent='Konflikty: '+[...new Set((plan.conflicts||[]).map(c=>labels[c.type]||c.type))].join(', ')+(plan.auxiliaryConflicts?' — także dane pomocnicze':'')+'. Przy uzupełnianiu zachowamy rekordy lokalne.';dialog.append(details);}
    const description=document.createElement('p');description.textContent=plan.mergeUnavailable?'Nie można bezpiecznie porównać bieżących danych. Uzupełnianie jest zablokowane. Dostępne jest anulowanie albo osobno potwierdzone pełne odtworzenie kopii.':plan.isEmpty?'Przywrócenie pustej aplikacji wraz z profilami.':'Uzupełnienie istniejących danych i dodanie osobnych profili według ID. Konfliktujące rekordy zostaną pominięte, bieżące wartości zachowane. Aktywny timer po odtworzeniu pozostanie zatrzymany.';dialog.append(description);
    if(plan.ambiguousDefault){const note=document.createElement('p');note.textContent='Starszy profil domyślny ma wspólny identyfikator techniczny. Potwierdź, że to dane tego samego użytkownika, albo anuluj import. Nazwa nie jest dowodem tożsamości.';dialog.append(note);}
    for(const [action,label] of [['merge',plan.isEmpty?'Przywróć kompletną kopię':plan.ambiguousDefault?'Potwierdzam profil — dodaj brakujące dane':'Dodaj brakujące dane'],['restore','Pełne zastąpienie — dalsze potwierdzenie'],['cancel','Anuluj']]){
      if(plan.mergeUnavailable && action==='merge') continue;
      const button=document.createElement('button');button.dataset.backupChoice=action;button.className=action==='merge'?'btn-primary':'btn-secondary';button.textContent=label;button.style.cssText='width:100%;margin-top:12px;white-space:normal';button.onclick=()=>{dialog.close();dialog.remove();resolve(action);};dialog.append(button);
    }
    dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.remove();resolve('cancel');});
    document.body.append(dialog);dialog.showModal();
  });
}
