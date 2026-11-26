import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const path = resolve('docs/reference/ACE-EXERCISE-INDEX.json');
const index = JSON.parse(await readFile(path, 'utf8'));
const reviewed = {
  10: ['Uginanie młotkowe', 'hammer_curl', 'Dwa hantle po bokach ciała; zgięcie łokcia przy chwycie neutralnym.'],
  21: ['Rozpiętki hantlami leżąc', 'db_fly', 'Hantle rozłożone nad ławką; zbliżenie rąk nad klatką.'],
  25: ['Wyciskanie na ławce skośnej', 'db_incline', 'Ciężary przy górnej części klatki; wypchnięcie nad klatkę.'],
  41: ['Pompka', 'pushup', 'Ramiona zgięte przy podłodze; wyprost do podporu.'],
  45: ['Wyciskanie nad głowę siedząc', 'shoulder_press/dumbbells', 'Ciężary przy barkach; wypchnięcie nad głowę.'],
  48: ['Wiosłowanie siedząc na wyciągu', null, 'Ręce wyciągnięte w stronę bloczków; przyciągnięcie uchwytów do tułowia.'],
  54: ['Unoszenie ramion przodem', 'front_raise', 'Ramiona przy tułowiu; uniesienie przed siebie.'],
  74: ['Prostowanie ramion nad głową', 'tri_overhead', 'Łokcie zgięte z ciężarem za głową; wyprost nad głowę.'],
  153: ['Uginanie nóg leżąc', 'leg_curl', 'Leżenie przodem z wałkiem przy tylnych podudziach; zgięcie kolan.'],
  154: ['Wypychanie nóg siedząc', null, 'Kolana zgięte na siedzisku; odepchnięcie platformy nogami.'],
  158: ['Ściąganie drążka wyciągu górnego siedząc', null, 'Drążek wysoko przed ciałem; ściągnięcie przed głowę w stronę klatki.'],
  168: ['Wiosłowanie siedząc na maszynie', 'row_machine', 'Ramiona wyciągnięte przy podparciu klatki; przyciągnięcie dźwigni.'],
  183: ['Prostowanie nóg siedząc', 'leg_extension', 'Kolana zgięte pod ruchomym wałkiem; wyprost kolan.'],
  184: ['Uginanie ramion na maszynie siedząc', 'biceps_preacher', 'Ramiona na skośnej podporze; zgięcie łokci unoszące dźwignię.'],
  185: ['Prostowanie ramion na wyciągu', null, 'Łokcie zgięte przy tułowiu; wyprost ramion w dół.'],
  186: ['Wyciskanie barkami na maszynie', 'shoulder_press', 'Uchwyty przy barkach; wypchnięcie w górę.'],
  188: ['Wyciskanie klatką na maszynie', 'chest_machine', 'Uchwyty przy klatce; wypchnięcie przed tułów.'],
  191: ['Podciąganie nachwytem', 'pullup', 'Zwis na drążku; podciągnięcie w stronę drążka.'],
  292: ['Prostowanie ramion na maszynie', null, 'Ramiona na podporze maszyny; wyprost łokci przesuwa uchwyty.'],
  354: ['Unoszenie jednego ramienia bokiem', null, 'Ręka z uchwytem nisko przy tułowiu; uniesienie bokiem.']
};
for (const entry of index.entries) {
  entry.sourceCategories = Object.fromEntries(Object.entries(entry.sourceCategories).map(([key, value]) => [key, value.map(item => item.replace(/\/$/, ''))]));
  const levels = entry.sourceCategories.experience;
  entry.aceDifficulty = levels.length === 1 ? ({ beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[levels[0]] || null) : null;
  entry.hasVideo = null; // Generic ACE footer includes a video link; per-exercise video is unconfirmed.
  const detail = reviewed[entry.aceId];
  if (detail) {
    entry.workingNamePl = detail[0];
    entry.gymnastikaMatch = detail[1];
    entry.positionSummary = detail[2];
    entry.reviewStatus = new Set(['48', '153', '158', '168', '183', '184', '292']).has(entry.aceId)
      ? 'source photo sequence and movement reviewed; no expert review'
      : 'source metadata and working movement summary; photos not individually reviewed';
  }
}
index.scope.note = 'All discovered ACE IDs have source metadata and a detail-page URL. Individual Polish names, movement descriptions and exact GymNastika matches are added only where reviewed. Category labels are not muscle roles. Per-exercise video availability is unverified.';
index.scope.polishNamesReviewed = index.entries.filter(entry => entry.workingNamePl).length;
index.scope.positionSummariesReviewed = index.entries.filter(entry => entry.positionSummary).length;
index.scope.unavailableDetailPages = index.failures.filter(item => /\/\d+\//.test(item.url)).length;
index.scope.entriesWithoutDetectedPhotos = index.entries.filter(entry => entry.photoCount === 0).map(entry => entry.aceId);
await writeFile(path, JSON.stringify(index, null, 2) + '\n');
console.log(index.scope);
