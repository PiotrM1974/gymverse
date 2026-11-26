import { MALE_FRONT, MALE_BACK, FEMALE_FRONT, FEMALE_BACK } from '../../data/anatomy/musclemap-diagrams.js';
import { EXERCISE_ATLAS_MAP } from '../../data/anatomy/atlas-data.js';
import { resolveHighlightMode, sortMusclePaths } from './highlight-engine.js';

const diagrams = {
  male: { front: MALE_FRONT, back: MALE_BACK },
  female: { front: FEMALE_FRONT, back: FEMALE_BACK }
};
const bodyImages = {
  male: { front: 'male-front', back: 'male-back' },
  female: { front: 'female-front', back: 'female-back' }
};
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function supportedBlendModes() {
  if (typeof CSS === 'undefined' || !CSS.supports('isolation', 'isolate')) return { color: false, multiply: false };
  return { color: CSS.supports('mix-blend-mode', 'color'), multiply: CSS.supports('mix-blend-mode', 'multiply') };
}

export function renderAnatomyAtlas(container, exerciseId, sex = 'male', view = 'front', requestedMode = 'refined', options = {}) {
  const entry = EXERCISE_ATLAS_MAP[exerciseId];
  if (!container || !entry) return false;
  const diagram = diagrams[sex]?.[view];
  if (!diagram) return false;
  const primary = new Set(entry.primary);
  const secondary = new Set(entry.secondary);
  const approximate = new Set(entry.approximate);
  const excluded = new Set([
    ...(entry.excludedByView?.[`${sex}-${view}`] || []),
    ...(sex === 'female' && view === 'front' ? ['ADDUCTOR_LEFT', 'ADDUCTOR_RIGHT'] : [])
  ]);
  const mode = resolveHighlightMode(requestedMode, supportedBlendModes());
  const image = `src/data/anatomy/bodies/${bodyImages[sex][view]}.webp`;
  const outlineMarkup = diagram.outline.map(path => `<path class="anatomy-atlas__outline" d="${path.d}"/>`).join('');
  const roleFor = path => excluded.has(path.id) ? 'neutral' : primary.has(path.id) ? 'primary' : secondary.has(path.id) ? 'secondary' : 'neutral';
  const orderedPaths = sortMusclePaths(diagram.muscles, roleFor);
  const muscleMarkup = orderedPaths.map(path => {
    const semantic = path.id ? `data-muscle-id="${esc(path.id)}" aria-label="${esc(path.id)}"` : `data-muscle-group="${esc(path.group || '')}"`;
    const role = roleFor(path);
    const approx = approximate.has(path.id) ? ' anatomy-atlas__muscle--approximate' : '';
    return `<path class="anatomy-atlas__muscle anatomy-atlas__muscle--${role}${approx}" d="${path.d}" ${semantic}/>`;
  }).join('');
  // A duplicate of each active source path adds a gentle, normal-color wash in
  // refined mode. It has exactly the same geometry and is hidden by both fallbacks.
  const tintMarkup = orderedPaths.filter(path => roleFor(path) !== 'neutral')
    .map(path => `<path class="anatomy-atlas__tint anatomy-atlas__tint--${roleFor(path)}" d="${path.d}"/>`).join('');
  const visibleIds = new Set(diagram.muscles.map(path => path.id).filter(Boolean));
  const regionStatus = region => {
    if (region.precision === 'unavailable') return 'Bez oznaczenia';
    if (region.ids.some(id => excluded.has(id))) return 'Niepewne w tym widoku';
    const count = region.ids.filter(id => visibleIds.has(id)).length;
    if (!count) return view === 'front' ? 'Zobacz tył' : 'Zobacz przód';
    if (count < region.ids.length) return 'Część na drugim widoku';
    return '';
  };
  const regionPrecision = region => region.ids.some(id => excluded.has(id)) ? 'unverified' : region.precision;
  const regionMarkup = role => entry.regions.filter(region => region.role === role).map(region => `
            <li class="anatomy-atlas__region anatomy-atlas__region--${regionPrecision(region)}">
              ${esc(region.label)}${regionStatus(region) ? ` <small>${regionStatus(region)}</small>` : ''}
            </li>`).join('');
  const precisionMarkup = entry.regions.map(region => {
    const precision = regionPrecision(region);
    const label = precision === 'exact' ? 'dokładna etykieta grupy MuscleMap' : precision === 'approximate' ? 'przybliżony region MuscleMap' : precision === 'unverified' ? 'niezweryfikowane położenie maski w tym widoku' : 'brak osobnej powierzchni';
    const surface = region.ids.length ? `; powierzchnia: ${esc(region.ids.join(', '))}` : '';
    const reason = precision === 'approximate'
      ? region.reason?.trim()
        ? `; ograniczenie: ${esc(region.reason)}`
        : '; szczegółowe uzasadnienie niezweryfikowane'
      : '';
    return `<li><strong>${esc(region.label)}</strong> — ${label}${surface}${reason}${regionStatus(region) ? `; ${regionStatus(region).toLowerCase()}` : ''}</li>`;
  }).join('');
  const sexControls = options.showSexControl === false ? '' : `
      <div class="anatomy-atlas__controls" role="group" aria-label="Płeć sylwetki">
        <button type="button" data-atlas-sex="male" aria-pressed="${sex === 'male'}">Mężczyzna</button>
        <button type="button" data-atlas-sex="female" aria-pressed="${sex === 'female'}">Kobieta</button>
      </div>`;
  const displayName = window.GymNastikaExerciseNames?.[exerciseId] || entry.title;
  const title = `Atlas mięśni — ${esc(displayName)}`;
  const wrapperTag = options.showDisclosure === false ? 'section' : 'details';
  const wrapperAttributes = options.showDisclosure === false ? `aria-label="${title}"` : 'open';
  const summary = options.showDisclosure === false ? '' : `<summary>${title}</summary>`;
  container.innerHTML = `
    <${wrapperTag} class="anatomy-atlas" ${wrapperAttributes}>
      ${summary}
      ${sexControls}
      <div class="anatomy-atlas__controls" role="group" aria-label="Widok sylwetki">
        <button type="button" data-atlas-view="front" aria-pressed="${view === 'front'}">Przód</button>
        <button type="button" data-atlas-view="back" aria-pressed="${view === 'back'}">Tył</button>
      </div>
      <div class="anatomy-atlas__layout">
        <div class="anatomy-atlas__figure-wrap" data-highlight-mode="${mode}" role="img" aria-label="${sex === 'male' ? 'Męska' : 'Żeńska'} sylwetka, widok ${view === 'front' ? 'z przodu' : 'z tyłu'}">
        <img class="anatomy-atlas__body" src="${image}" alt="" width="1024" height="1536" decoding="async">
        <svg class="anatomy-atlas__figure" viewBox="${esc(diagram.viewBox)}" aria-hidden="true" focusable="false">
          ${outlineMarkup}${muscleMarkup}${tintMarkup}
        </svg>
        </div>
        <div class="anatomy-atlas__legend">
          <section class="anatomy-atlas__legend-group" aria-label="Mięśnie główne">
            <h3><span class="anatomy-atlas__swatch anatomy-atlas__swatch--primary" aria-hidden="true"></span>Główne mięśnie</h3>
            <ul class="anatomy-atlas__list">${regionMarkup('primary')}</ul>
          </section>
          <section class="anatomy-atlas__legend-group" aria-label="Mięśnie pomocnicze">
            <h3><span class="anatomy-atlas__swatch anatomy-atlas__swatch--secondary" aria-hidden="true"></span>Mięśnie pomocnicze</h3>
            <ul class="anatomy-atlas__list">${regionMarkup('secondary')}</ul>
          </section>
          <details class="anatomy-atlas__details">
            <summary>Dokładność oznaczeń i ograniczenia</summary>
            <ul class="anatomy-atlas__precision">${precisionMarkup}</ul>
            ${entry.note ? `<p class="anatomy-atlas__note">${esc(entry.note)}</p>` : ''}
            <p class="anatomy-atlas__note">Oznaczenia pokazują dostępne obszary MuscleMap, nie pomiar aktywacji mięśni. Przełącz przód i tył, aby obejrzeć pozostałe obszary.</p>
          </details>
        </div>
      </div>
    </${wrapperTag}>`;
  return true;
}

function initAtlas() {
  const container = document.getElementById('anatomyAtlas');
  if (!container) return;
  let currentExercise = container.dataset.exerciseId || '';
  let sex = 'male';
  let view = 'front';
  let showSexControl = true;
  let showDisclosure = true;
  let highlightMode = resolveHighlightMode('refined', supportedBlendModes());
  const refresh = () => renderAnatomyAtlas(container, currentExercise, sex, view, highlightMode, { showSexControl, showDisclosure });
  window.GymNastikaMuscleAtlas = Object.freeze({
    update(exerciseId, options = {}) {
      currentExercise = exerciseId || '';
      if (options.sex === 'male' || options.sex === 'female') sex = options.sex;
      if (typeof options.showSexControl === 'boolean') showSexControl = options.showSexControl;
      if (typeof options.showDisclosure === 'boolean') showDisclosure = options.showDisclosure;
      container.dataset.exerciseId = currentExercise;
      container.hidden = !EXERCISE_ATLAS_MAP[currentExercise];
      refresh();
    },
    setPresentationSex(value) {
      if (value !== 'male' && value !== 'female') return false;
      sex = value;
      refresh();
      return true;
    },
    getPresentationState() { return Object.freeze({ exerciseId: currentExercise, sex, view, showSexControl }); },
    setHighlightMode(requested) {
      highlightMode = resolveHighlightMode(requested, supportedBlendModes());
      refresh();
      return highlightMode;
    },
    getHighlightMode() { return highlightMode; }
  });
  document.addEventListener('gymnastika:exercise-step', event => {
    const { exerciseId, ...options } = event.detail || {};
    window.GymNastikaMuscleAtlas.update(exerciseId, options);
  });
  container.addEventListener('click', event => {
    const sexButton = event.target.closest('[data-atlas-sex]');
    const viewButton = event.target.closest('[data-atlas-view]');
    if (sexButton && showSexControl) sex = sexButton.dataset.atlasSex;
    if (viewButton) view = viewButton.dataset.atlasView;
    if (sexButton || viewButton) refresh();
  });
  container.hidden = !EXERCISE_ATLAS_MAP[currentExercise];
  refresh();
}

if (typeof document !== 'undefined') initAtlas();
