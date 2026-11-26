import '../../../src/features/anatomy/atlas.js';
import { EXERCISE_CATALOG } from '../../../src/exercise/catalog.js';

const demos = {
  lat_raise_stand: {
    plan: 'Push A1', sets: 4, target: '12–15', image: '/src/data/exercise-images/selected/technique/lat_raise_stand__default-male.webp',
    silhouettes: {
      male: { technique: '/src/data/exercise-images/selected/technique/lat_raise_stand__default-male.webp', thumbnail: '/src/data/exercise-images/selected/thumbnails/lat_raise_stand__default-male.webp' },
      female: { technique: '/src/data/exercise-images/selected/technique/lat_raise_stand__default-female.webp', thumbnail: '/src/data/exercise-images/selected/thumbnails/lat_raise_stand__default-female.webp' }
    },
    panel1: 'left', panel2: 'right', label1: 'DÓŁ', label2: 'GÓRA', technique: 'TECHNICALLY_VALID', confidence: 'Widoczne punkty ruchu są zgodne z ogólnym opisem ACE; ustawienie łopatek, łokci i nadgarstków wymaga oceny człowieka. Brak recenzji eksperckiej.',
    pose1: 'Hantle przy udach. ACE opisuje neutralny chwyt i stabilny tułów; obraz nie potwierdza wszystkich szczegółów ustawienia.',
    pose2: 'Ramiona uniesione w bok w przybliżeniu do wysokości barków. Kontrolowany powrót nie jest pokazany.',
    source: ['ACE — Lateral Raise', 'https://www.acefitness.org/resources/everyone/exercise-library/26/lateral-raise/']
  },
  db_bench: {
    plan: 'Push A2', sets: 3, target: '8–10', image: '/src/data/exercise-images/selected/technique/db_bench__default-male.webp',
    panel1: 'left', panel2: 'right', label1: 'GÓRA', label2: 'DÓŁ', technique: 'PARTIAL', confidence: 'ACE opisuje pozycję z hantlami nad klatką, kontrolowane opuszczenie i ponowne wyciśnięcie. Para pokazuje tylko górę → dół; nie przedstawia pełnego cyklu.',
    cycleNote: 'Ilustracje przedstawiają pozycję górną i dolną. Powtórzenie obejmuje kontrolowane opuszczenie hantli oraz ponowne wyciśnięcie.',
    pose1: 'Hantle nad klatką, stopy oparte o podłoże; to górna pozycja widoczna na szkicu, nie początek całego powtórzenia.',
    pose2: 'Hantle opuszczone w kierunku środkowej części klatki. Powrotne wyciśnięcie nie jest pokazane.',
    source: ['ACE — Chest Press', 'https://www.acefitness.org/resources/everyone/exercise-library/19/chest-press/']
  },
  lat_pulldown_wide: {
    plan: 'Pull A1', sets: 3, target: '8–10', image: '/src/data/exercise-images/selected/technique/lat_pulldown_wide__default-male.webp',
    panel1: 'left', panel2: 'right', label1: 'GÓRA', label2: 'DÓŁ', technique: 'PARTIAL', confidence: 'Szeroki chwyt i tor do górnej klatki odpowiadają ogólnemu opisowi NASM. Nie określono maszyny; mechanika linki i stosu pozostaje niezweryfikowana.',
    pose1: 'Siedząca pozycja z udami pod wałkiem, drążek nad głową.',
    pose2: 'Drążek przy górnej klatce; NASM zaleca stabilny tułów i kontrolę w obu kierunkach. Rysunek nie potwierdza mechaniki konkretnej maszyny.',
    source: ['NASM — Lat Pulldown Mechanics', 'https://www.nasm.org/resource-center/blog/training/the-biomechanics-of-the-lat-pulldown-muscles-grip-and-form']
  },
  leg_press: {
    plan: 'Push A1', sets: 3, target: '8–10', image: '/src/data/exercise-images/selected/technique/leg_press__default-male.webp',
    panel1: 'left', panel2: 'right', label1: 'ZGIĘCIE', label2: 'WYPROST', technique: 'PARTIAL', confidence: 'NASM opisuje kontrolowany wyprost bez blokowania kolan i kontrolowany powrót. Szkic nie rozstrzyga, czy kolana w drugim kadrze pozostają odblokowane.',
    pose1: 'Kolana zgięte, stopy na platformie, plecy oparte. Dokładny zakres i ustawienie stóp wymagają oceny.',
    pose2: 'Nogi prawie wyprostowane. Nie traktuj kadru jako wskazówki do blokowania kolan; szkic nie potwierdza ich ustawienia.',
    source: ['NASM — Leg Press', 'https://www.nasm.org/resource-center/exercise-library/leg-press']
  }
};

const byId = new Map(EXERCISE_CATALOG.map(exercise => [exercise.id, exercise]));
const atlas = document.getElementById('anatomyAtlas');
const pose = document.getElementById('illustrationPose');
const title = document.getElementById('previewTitle');
const positionNote = document.getElementById('positionNote');
const activeButtons = [...document.querySelectorAll('[data-preview-exercise]')];
const poseButtons = [...document.querySelectorAll('[data-pose-choice]')];
const viewButtons = [...document.querySelectorAll('[data-view-choice]')];
let currentId = 'lat_raise_stand';
let currentPose = 'pose1';
let currentView = 'technique';
let imageLoadVersion = 0;

function selectedAtlasSex() {
  return atlas.querySelector('[data-atlas-sex][aria-pressed="true"]')?.dataset.atlasSex || 'male';
}

function loadIllustration(path, label) {
  const version = ++imageLoadVersion;
  const error = document.getElementById('illustrationError');
  pose.style.backgroundImage = 'none';
  pose.setAttribute('aria-busy', 'true');
  error.hidden = true;
  const image = new Image();
  image.onload = () => {
    if (version !== imageLoadVersion) return;
    pose.style.backgroundImage = `url("${path}")`;
    pose.removeAttribute('aria-busy');
    error.hidden = true;
  };
  image.onerror = () => {
    if (version !== imageLoadVersion) return;
    pose.removeAttribute('aria-busy');
    error.textContent = `Nie udało się wczytać ilustracji: ${label}. Wybierz inną pozycję lub sylwetkę.`;
    error.hidden = false;
    pose.dataset.assetError = 'true';
  };
  image.src = path;
}

function monitorAtlasBody() {
  const image = atlas.querySelector('.anatomy-atlas__body');
  const figure = atlas.querySelector('.anatomy-atlas__figure-wrap');
  const error = document.getElementById('atlasAssetError');
  if (!image || !figure) return;
  figure.hidden = true;
  error.hidden = true;
  const fail = () => {
    if (!image.isConnected) return;
    figure.hidden = true;
    error.textContent = `Nie udało się wczytać obrazu atlasu dla sylwetki ${selectedAtlasSex() === 'male' ? 'męskiej' : 'żeńskiej'}. Nie pokazuję zastępczej sylwetki.`;
    error.hidden = false;
  };
  const loaded = () => {
    if (!image.isConnected) return;
    figure.hidden = false;
    error.hidden = true;
  };
  image.addEventListener('error', fail, { once: true });
  image.addEventListener('load', loaded, { once: true });
  if (image.complete) image.naturalWidth ? loaded() : fail();
}

function render() {
  const exercise = byId.get(currentId);
  const data = demos[currentId];
  if (!exercise || !data) return;
  const sex = selectedAtlasSex();
  const isNewSet = currentId === 'lat_raise_stand';
  const side = data[currentPose === 'pose1' ? 'panel1' : 'panel2'];
  title.textContent = exercise.name;
  title.dataset.exerciseId = currentId;
  title.dataset.variantId = 'default';
  document.getElementById('planName').textContent = data.plan;
  document.getElementById('planTarget').textContent = `${data.sets} × ${data.target}`;
  document.getElementById('exerciseEquipment').textContent = exercise.equipment;
  document.getElementById('techniqueStatus').textContent = isNewSet ? 'PARTIAL' : data.technique;
  document.getElementById('techniqueStatus').dataset.status = isNewSet ? 'PARTIAL' : data.technique;
  document.getElementById('statusExplanation').textContent = isNewSet ? 'Nowy zestaw do oceny. ACE opisuje stabilny tułów, neutralny chwyt i unoszenie do wysokości barków; ilustracja nie potwierdza wszystkich ustawień. Brak recenzji eksperckiej.' : data.confidence;
  document.getElementById('poseLabelFirst').textContent = data.label1;
  document.getElementById('poseLabelSecond').textContent = data.label2;
  document.getElementById('sourceLine').innerHTML = `Punkt odniesienia techniki: <a href="${data.source[1]}" target="_blank" rel="noreferrer">${data.source[0]}</a>.`;
  const selectedView = isNewSet ? currentView : null;
  positionNote.textContent = selectedView === 'thumbnail'
    ? `${data.pose1} Miniatura pochodzi z panelu DÓŁ.`
    : [data[currentPose], data.cycleNote].filter(Boolean).join(' ');
  const image = selectedView ? data.silhouettes[sex][selectedView] : data.image;
  pose.style.backgroundPosition = selectedView === 'thumbnail' ? 'center' : side === 'left' ? 'left center' : 'right center';
  pose.style.backgroundSize = selectedView === 'thumbnail' ? '100% 100%' : '200% 100%';
  pose.dataset.view = selectedView || 'legacy';
  pose.dataset.sex = isNewSet ? sex : 'unpaired';
  delete pose.dataset.assetError;
  pose.classList.toggle('is-thumbnail', selectedView === 'thumbnail');
  document.querySelector('.view-controls').hidden = !isNewSet;
  document.querySelector('.pose-controls').hidden = selectedView === 'thumbnail';
  document.getElementById('assetChip').textContent = isNewSet ? 'PARA DO OCENY · PARTIAL' : 'SZKIC';
  document.getElementById('rightsStatus').textContent = isNewSet ? 'Warunki usługi do potwierdzenia. Publikacja wstrzymana.' : 'Prawa do użycia: niezweryfikowane. Publikacja wstrzymana.';
  pose.dataset.pose = currentPose;
  pose.dataset.exerciseId = currentId;
  pose.dataset.sourcePanel = side;
  const sexName = sex === 'male' ? 'Mężczyzna' : 'Kobieta';
  pose.setAttribute('aria-label', `${isNewSet ? `${sexName}, ` : ''}${selectedView === 'thumbnail' ? 'Miniatura' : data[currentPose === 'pose1' ? 'label1' : 'label2']} — ${exercise.name}. ${data[currentPose]}`);
  activeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewExercise === currentId)));
  poseButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.poseChoice === currentPose)));
  viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.viewChoice === (selectedView || 'technique'))));
  window.GymNastikaMuscleAtlas?.update(currentId);
  const sexControls = atlas.querySelector('.anatomy-atlas__controls[aria-label="Płeć sylwetki"]');
  if (sexControls) {
    sexControls.setAttribute('aria-label', 'Sylwetka: Mężczyzna lub Kobieta');
    sexControls.dataset.previewSilhouetteSource = 'true';
    if (!sexControls.querySelector('[data-preview-sex-label]')) {
      const label = document.createElement('span');
      label.dataset.previewSexLabel = 'true';
      label.textContent = 'Sylwetka:';
      sexControls.prepend(label);
    }
  }
  document.getElementById('atlasScope').textContent = isNewSet
    ? `Sylwetka ${sexName} jest wspólnym wyborem dla ilustracji techniki i atlasu.`
    : 'Pozostałe szkice nie mają pary ilustracji techniki dla obu sylwetek; wybór dotyczy atlasu.';
  monitorAtlasBody();
  loadIllustration(image, `${sexName}, ${selectedView === 'thumbnail' ? 'miniatura pozycji DÓŁ' : data[currentPose === 'pose1' ? 'label1' : 'label2']}`);
}

activeButtons.forEach(button => button.addEventListener('click', () => {
  currentId = button.dataset.previewExercise;
  currentPose = 'pose1';
  currentView = 'technique';
  render();
}));
viewButtons.forEach(button => button.addEventListener('click', () => {
  currentView = button.dataset.viewChoice;
  render();
}));
poseButtons.forEach(button => button.addEventListener('click', () => {
  currentPose = button.dataset.poseChoice;
  render();
}));
atlas.addEventListener('click', event => {
  if (event.target.closest('[data-atlas-sex]') && currentId === 'lat_raise_stand') render();
  else if (event.target.closest('[data-atlas-view]')) render();
});
render();
