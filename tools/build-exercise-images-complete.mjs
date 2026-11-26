import { chromium } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const base = 'outputs/GV-EXERCISE-IMAGES-COMPLETE';
const registryPath = resolve(root, 'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/local-pilot/presentation-registry.json');
const provenancePath = resolve(root, 'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/ASSET-REGISTER.json');
const prompts = JSON.parse(await readFile(resolve(root, base, 'PROMPTS.json'), 'utf8'));
const onlyExerciseIds = new Set(process.argv.slice(2));
const recipes = [
  { exerciseId: 'bench_flat', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Pozycja DÓŁ: sztanga przy klatce, łokcie zgięte.', raised: 'Pozycja GÓRA: sztanga nad klatką, ramiona wyprostowane.', details: 'Plecy i głowa pozostają podparte na płaskiej ławce, a stopy na podłożu.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.nasm.org/resource-center/exercise-library/barbell-bench-press' },
  { exerciseId: 'db_incline', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Pozycja DÓŁ: hantle przy górnej części klatki, łokcie zgięte.', raised: 'Pozycja GÓRA: hantle nad klatką, ramiona wyprostowane.', details: 'Ławka ma dodatni skos około 30°; plecy i głowa pozostają podparte, a stopy na podłożu.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/25/incline-chest-press/' },
  { exerciseId: 'tri_rope', variantId: 'default', swapPanels: true, labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Pozycja DÓŁ: lina przy biodrach, łokcie wyprostowane.', raised: 'Pozycja GÓRA: dłonie na wysokości klatki, łokcie zgięte.', details: 'Ramiona pozostają blisko tułowia; lina jest połączona z górnym wyciągiem w obu kadrach.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/pros/expert-articles/6112/6-exercises-for-stronger-triceps/' },
  { exerciseId: 'row_v', variantId: 'default', labels: { lower: 'ODDALONE', raised: 'PRZY BRZUCHU' },
    copy: { lower: 'Uchwyt V oddalony od tułowia, ramiona wyciągnięte.', raised: 'Uchwyt V przy brzuchu, łokcie cofnięte.', details: 'Siedzenie i stopy pozostają podparte, tułów stabilny, a uchwyt połączony z dolnym wyciągiem.', thumbnail: 'Miniatura pokazuje uchwyt oddalony od tułowia.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/' },
  { exerciseId: 'rear_delt', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Pozycja DÓŁ: hantle pod barkami, tułów pochylony.', raised: 'Pozycja GÓRA: ramiona uniesione na boki, tułów nadal stabilny.', details: 'Oba kadry pokazują odwrotne rozpiętki w opadzie tułowia, bez podparcia ławką.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/equipment/dumbbells/' },
  { exerciseId: 'biceps_preacher', variantId: 'default', swapPanels: true, labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Pozycja DÓŁ: ręce na poduszce modlitewnika, łokcie niemal wyprostowane.', raised: 'Pozycja GÓRA: uchwyt uniesiony przez zgięcie łokci.', details: 'Ta sama zatwierdzona wizualnie maszyna jest pokazana także przy tricepsie. Dla bicepsa kadry mają odwrotną kolejność.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/292/tricep-extension/' },
  { exerciseId: 'tri_machine', variantId: 'default', labels: { lower: 'START', raised: 'KONIEC' },
    copy: { lower: 'START: łokcie zgięte, dłonie przy twarzy.', raised: 'KONIEC: przedramiona skierowane do przodu, łokcie prawie wyprostowane.', details: 'Siedzenie, podpora górnych części ramion i rama pozostają nieruchome. Uchwyty poruszają się wraz z dźwignią maszyny.', thumbnail: 'Miniatura pokazuje pozycję START.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/292/tricep-extension/' },
  { exerciseId: 'leg_curl', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Pozycja DÓŁ: nogi niemal wyprostowane, wałek przy dolnej części podudzi.', raised: 'Pozycja GÓRA: kolana zgięte, wałek uniesiony w kierunku pośladków.', details: 'Klatka piersiowa, biodra i uda pozostają podparte na maszynie.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/153/lying-hamstrings-curl/' },
  { exerciseId: 'lat_pulldown_neutral', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Pozycja DÓŁ: wąski uchwyt neutralny przy górnej części klatki.', raised: 'Pozycja GÓRA: uchwyt nad głową, ramiona uniesione.', details: 'Uda pozostają pod wałkami, a stopy na podłożu w obu pozycjach.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://smartworkout.app/pl/atlas-cwiczen/plecy/sciaganie-drazka-wyciagu-gornego-waskim-chwytem-neutralnym' },
  { exerciseId: 'row_straight', variantId: 'default', labels: { lower: 'ODDALONY', raised: 'PRZY BRZUCHU' },
    copy: { lower: 'Krótki prosty drążek oddalony od tułowia, ręce wyciągnięte.', raised: 'Krótki prosty drążek przy górnej części brzucha, łokcie cofnięte.', details: 'Stanowisko jak przy przyciąganiu uchwytu V: tułów pozostaje stabilny, stopy na podnóżkach, a drążek jest połączony z dolnym wyciągiem. Dłonie trzymają go nachwytem.', thumbnail: 'Miniatura pokazuje drążek oddalony od tułowia.' },
    techniqueSource: 'https://smartworkout.app/pl/atlas-cwiczen/plecy/przyciaganie-drazka-wyciagu-dolnego' },
  { exerciseId: 'db_fly', variantId: 'default', labels: { lower: 'ROZŁOŻONE', raised: 'ZŁĄCZONE' },
    copy: { lower: 'Hantle rozłożone na boki, łokcie lekko zgięte.', raised: 'Hantle zbliżone nad klatką, łokcie nadal lekko zgięte.', details: 'Głowa, plecy i biodra pozostają podparte na płaskiej ławce, a stopy na podłożu.', thumbnail: 'Miniatura pokazuje ramiona rozłożone na boki.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/21/lying-chest-fly/' },
  { exerciseId: 'db_fly', variantId: 'incline', labels: { lower: 'ROZŁOŻONE', raised: 'ZŁĄCZONE' },
    copy: { lower: 'Na lekko skośnej ławce hantle rozłożone na boki.', raised: 'Hantle zbliżone nad górną częścią klatki.', details: 'Wariant wykorzystuje ławkę z lekkim dodatnim skosem; biodra i plecy pozostają podparte.', thumbnail: 'Miniatura pokazuje ramiona rozłożone na boki na skośnej ławce.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/21/lying-chest-fly/' },
  { exerciseId: 'front_raise', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Hantle przed udami, ramiona opuszczone.', raised: 'Hantle uniesione przed siebie do wysokości barków.', details: 'Ćwiczenie wykonywane stojąc z dwoma hantlami; tułów pozostaje stabilny.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://fitcron.com/exercise/elevaciones-frontales-en-pronacion-con-mancuernas-deltoides/' },
  { exerciseId: 'lat_raise_seated', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Siedząc, hantle po bokach bioder.', raised: 'Siedząc, ramiona uniesione na boki do wysokości barków.', details: 'Stopy pozostają na podłożu, a tułów stabilny w obu kadrach.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/equipment/dumbbells/' },
  { exerciseId: 'chest_machine', variantId: 'default', labels: { lower: 'PRZY KLATCE', raised: 'WYPCHNIĘTE' },
    copy: { lower: 'Uchwyty maszyny przy bokach klatki, łokcie zgięte.', raised: 'Uchwyty wypchnięte przed tułów, ramiona niemal wyprostowane.', details: 'Plecy i biodra są podparte, a stopy stoją na platformie maszyny talerzowej.', thumbnail: 'Miniatura pokazuje uchwyty przy klatce.' },
    techniqueSource: 'https://fitcron.com/exercise/press-frontal-en-maquina-pectoral/' },
  { exerciseId: 'pec_deck', variantId: 'default', labels: { lower: 'ROZŁOŻONE', raised: 'ZŁĄCZONE' },
    copy: { lower: 'Ramiona rozłożone na boki, dłonie na pionowych drążkach.', raised: 'Dwa drążki zbliżone przed klatką piersiową.', details: 'Plecy są podparte; dłonie obejmują drążki chwytem neutralnym w obu pozycjach.', thumbnail: 'Miniatura pokazuje ramiona rozłożone.' },
    techniqueSource: 'https://fitcron.com/exercise/aperturas-extendidas-en-maquina-pectoral/' },
  { exerciseId: 'shoulder_press', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Uchwyty maszyny przy barkach, łokcie zgięte.', raised: 'Uchwyty uniesione nad głowę, ramiona niemal wyprostowane.', details: 'Plecy i biodra pozostają podparte na siedzisku maszyny.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/186/seated-shoulder-press/' },
  { exerciseId: 'shoulder_press', variantId: 'dumbbells', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Dwa hantle przy barkach, łokcie zgięte.', raised: 'Dwa hantle nad głową, ramiona niemal wyprostowane.', details: 'Wariant z dwoma hantlami; plecy opierają się o ławkę, a stopy pozostają na podłożu.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/' },
  { exerciseId: 'face_pull', variantId: 'default', labels: { lower: 'ODDALONA', raised: 'PRZY TWARZY' },
    copy: { lower: 'Lina oddalona od twarzy, ramiona wyciągnięte.', raised: 'Lina przy twarzy, łokcie uniesione na boki.', details: 'Postać stoi przodem do wyciągu. Lina jest połączona z bloczkiem na wysokości oczu; tułów pozostaje stabilny.', thumbnail: 'Miniatura pokazuje linę oddaloną od twarzy.' },
    techniqueSource: 'https://www.nasm.org/resource-center/exercise-library/face-pull' },
  { exerciseId: 'lat_raise_cable', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Dłoń dalsza od wyciągu trzyma uchwyt przy biodrze.', raised: 'Ta sama ręka uniesiona bokiem do wysokości barku.', details: 'Linka biegnie przed tułowiem do dolnego bloczka; postawa pozostaje stabilna.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/354/single-arm-lateral-raise/' },
  { exerciseId: 'hammer_curl', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Dwa hantle po bokach tułowia, chwyt neutralny.', raised: 'Jeden hantel uniesiony przez zgięcie łokcia, drugi pozostaje opuszczony.', details: 'Plansza pokazuje ruch naprzemienny; powtórzenia liczy się na rękę.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/10/hammer-curl/' },
  { exerciseId: 'cable_curl', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Prosty drążek dolnego wyciągu przy udach.', raised: 'Drążek uniesiony w kierunku klatki przez zgięcie łokci.', details: 'Postać stoi naprzeciw dolnego bloczka; drążek pozostaje połączony z linką w obu kadrach.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://fitcron.com/exercise/curl-en-supinacion-en-polea-baja-biceps/' },
  { exerciseId: 'tri_overhead', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Jeden hantel trzymany oburącz za głową, łokcie zgięte.', raised: 'Ten sam hantel nad głową, łokcie wyprostowane.', details: 'Jedna hantla w obu dłoniach, bez ruchu tułowia.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/74/triceps-extension/' },
  { exerciseId: 'row_machine', variantId: 'default', labels: { lower: 'ODDALONE', raised: 'PRZY TUŁOWIU' },
    copy: { lower: 'Uchwyt wyciągu oddalony, ramiona wyprostowane.', raised: 'Uchwyt przy dolnej części tułowia, łokcie cofnięte.', details: 'Siedzenie i stopy pozostają podparte, tułów stabilny, a uchwyt połączony z dolnym bloczkiem.', thumbnail: 'Miniatura pokazuje uchwyt oddalony.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/' },
  { exerciseId: 'leg_extension', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Kolana zgięte, wałek przy przedniej części podudzi.', raised: 'Kolana prawie wyprostowane, wałek uniesiony wraz z nogami.', details: 'Plecy i uda pozostają podparte na siedzisku maszyny.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/183/seated-leg-extension/' },
  { exerciseId: 'tri_overhead', variantId: 'rope', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Lina dolnego wyciągu za głową, łokcie zgięte.', raised: 'Lina nad głową, łokcie wyprostowane.', details: 'Wariant używa liny połączonej z dolnym wyciągiem; stopy ustawione stabilnie, tułów pozostaje wyprostowany.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://fitcron.com/exercise/extension-vertical-neutra-en-polea-baja-triceps/' },
  { exerciseId: 'smith_squat', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Przysiad ze sztangą prowadzoną po szynach Smitha.', raised: 'Pozycja stojąca ze sztangą wyżej na tych samych szynach.', details: 'Stopy pozostają na podłożu, a sztanga przesuwa się po dwóch prowadnicach.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/pros/expert-articles/5351/train-this-not-that-the-leg-edition/' },
  { exerciseId: 'pullup', variantId: 'default', labels: { lower: 'ZWIS', raised: 'PODCIĄGNIĘCIE' },
    copy: { lower: 'Zwis na drążku nachwytem, ramiona prawie wyprostowane.', raised: 'Podciągnięcie z brodą nad drążkiem.', details: 'Stopy pozostają nad podłożem, a chwyt na tym samym drążku.', thumbnail: 'Miniatura pokazuje zwis.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/191/pull-ups/' },
  { exerciseId: 'dips', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Ciało opuszczone między poręczami, łokcie zgięte.', raised: 'Ciało uniesione nad poręczami, ramiona wyprostowane.', details: 'Dłonie obejmują dwie stałe poręcze, a stopy nie dotykają podłoża.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://ifbb.com/wp-content/uploads/2023/06/IFBB-Fitness-Challenge-June-2023-1.pdf' },
  { exerciseId: 'pushup', variantId: 'default', labels: { lower: 'DÓŁ', raised: 'GÓRA' },
    copy: { lower: 'Klatka blisko podłoża, łokcie zgięte.', raised: 'Ciało wyżej, łokcie wyprostowane.', details: 'Dłonie i palce stóp pozostają na podłożu, a tułów, biodra i nogi tworzą linię.', thumbnail: 'Miniatura pokazuje pozycję DÓŁ.' },
    techniqueSource: 'https://www.acefitness.org/resources/everyone/exercise-library/41/push-up/' }
];

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const registry = JSON.parse(await readFile(registryPath, 'utf8'));
const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
const entries = [];
try {
  for (const recipe of recipes) {
    if (onlyExerciseIds.size && !onlyExerciseIds.has(recipe.exerciseId)) continue;
    const bySex = {};
    for (const sex of ['male', 'female']) {
      const stem = `${recipe.exerciseId}__${recipe.variantId}-${sex}`;
      const sourcePath = `${base}/source/${stem}-original.png`;
      const source = await readFile(resolve(root, sourcePath));
      const converted = await page.evaluate(async ({ data, swapPanels, isCableRow }) => {
        const load = src => new Promise((resolveImage, rejectImage) => {
          const image = new Image();
          image.onload = () => resolveImage(image);
          image.onerror = rejectImage;
          image.src = src;
        });
        const image = await load(`data:image/png;base64,${data}`);
        const cableRow = isCableRow && image.naturalWidth === 1774 && image.naturalHeight === 887;
        if (!cableRow && (image.naturalWidth !== 1536 || image.naturalHeight !== 1024)) throw new Error('Unexpected source dimensions');
        const board = document.createElement('canvas');
        board.width = 768; board.height = 512;
        const context = board.getContext('2d');
        if (cableRow) {
          context.fillStyle = '#68676b';
          context.fillRect(0, 0, 768, 512);
          context.drawImage(image, swapPanels ? 887 : 0, 0, 887, 887, 0, 64, 384, 384);
          context.drawImage(image, swapPanels ? 0 : 887, 0, 887, 887, 384, 64, 384, 384);
        } else {
          context.drawImage(image, swapPanels ? 768 : 0, 0, 768, 1024, 0, 0, 384, 512);
          context.drawImage(image, swapPanels ? 0 : 768, 0, 768, 1024, 384, 0, 384, 512);
        }
        const boardUrl = board.toDataURL('image/webp', 0.84);
        const thumb = document.createElement('canvas');
        thumb.width = 256; thumb.height = 256;
        const thumbContext = thumb.getContext('2d');
        thumbContext.fillStyle = '#d7d6d5';
        thumbContext.fillRect(0, 0, 256, 256);
        thumbContext.drawImage(board, 0, 0, 384, 512, 32, 0, 192, 256);
        const thumbUrl = thumb.toDataURL('image/webp', 0.84);
        if (!boardUrl.startsWith('data:image/webp;base64,') || !thumbUrl.startsWith('data:image/webp;base64,')) throw new Error('WebP encoder unavailable');
        return { board: boardUrl.split(',')[1], thumbnail: thumbUrl.split(',')[1] };
      }, { data: source.toString('base64'), swapPanels: !!recipe.swapPanels, isCableRow: ['row_machine', 'row_v', 'row_straight'].includes(recipe.exerciseId) });
      const technique = Buffer.from(converted.board, 'base64');
      const thumbnail = Buffer.from(converted.thumbnail, 'base64');
      const techniquePath = `${base}/selected/technique/${stem}.webp`;
      const thumbnailPath = `${base}/selected/thumbnails/${stem}.webp`;
      await mkdir(resolve(root, base, 'selected/technique'), { recursive: true });
      await mkdir(resolve(root, base, 'selected/thumbnails'), { recursive: true });
      await writeFile(resolve(root, techniquePath), technique);
      await writeFile(resolve(root, thumbnailPath), thumbnail);
      const label = sex === 'male' ? 'Męska' : 'Żeńska';
      const asset = (path, bytes, width, height, altText) => ({ path, mimeType: 'image/webp', width, height, sizeBytes: bytes.length, sha256: sha(bytes), altText, status: 'local-candidate' });
      bySex[sex] = {
        technique: asset(techniquePath, technique, 768, 512, `${label} plansza ${recipe.exerciseId}: ${recipe.labels.lower} po lewej, ${recipe.labels.raised} po prawej`),
        thumbnail: asset(thumbnailPath, thumbnail, 256, 256, `Miniatura: ${label.toLowerCase()} sylwetka, ${recipe.labels.lower}`)
      };
      entries.push({ exerciseId: recipe.exerciseId, variantId: recipe.variantId, sex,
        status: 'local-candidate', generatedDate: (['tri_machine', 'tri_rope', 'row_machine', 'row_v', 'row_straight', 'biceps_preacher', 'leg_curl', 'front_raise', 'chest_machine', 'pec_deck', 'shoulder_press', 'face_pull', 'lat_raise_cable', 'cable_curl', 'lat_pulldown_neutral'].includes(recipe.exerciseId) && recipe.variantId === 'default') || (recipe.exerciseId === 'tri_overhead' && recipe.variantId === 'rope') ? '2026-11-23' : '2026-11-22',
        tool: recipe.exerciseId === 'biceps_preacher' ? 'Local panel reorder of owner-approved tri_machine board; no new image generation' : 'Codex built-in image_gen.imagegen',
        prompt: recipe.exerciseId === 'biceps_preacher' ? null : prompts[recipe.variantId === 'default' ? `${recipe.exerciseId}/${sex}` : `${recipe.exerciseId}/${recipe.variantId}/${sex}`],
        inputImages: recipe.exerciseId === 'lat_pulldown_neutral' ? ['SmartWorkout narrow-neutral pulldown video visually inspected; source media not copied into project', 'Owner-supplied compact silver double-D handle photo (SHA-256 3234b40b54a47070bd3950570ebdc23c2c1dc5d3e8a61bed1dc9ff24b9e5a513; reference only)', 'Owner-supplied pulldown endpoint screenshots used as position references; not copied into project', sex === 'female' ? `${base}/source/candidates/lat_pulldown_neutral__default-male-smartworkout-v5.png (station and handle master)` : `${base}/source/candidates/lat_pulldown_neutral__default-male-smartworkout-v5.png (accepted corrected handle)`]
          : recipe.exerciseId === 'tri_machine' ? ['ACE 292 positions 1 and 2 (visual reference; not copied into project)', 'generated first pose, then edited second pose and athlete']
          : recipe.exerciseId === 'tri_rope' ? ['ACE 185 positions 1 and 2 (visual reference; not copied into project)', 'generated first pose, then edited second pose and female athlete']
          : recipe.exerciseId === 'biceps_preacher' ? [`${base}/source/tri_machine__default-${sex}-original.png (exact board copied; panels reversed in selected output)`]
          : recipe.exerciseId === 'row_v' ? ['Owner-supplied low-cable V-handle reference (SHA-256 789b89bc37bab4c3a99c9e2c0e8e6e00fb00131ca770775653709aff2c95e969; visual reference, not copied into project)', sex === 'female' ? 'Owner-approved generated male board edited to female athlete' : 'Original generated two-position board approved by owner']
          : recipe.exerciseId === 'row_straight' ? [`${base}/source/row_v__default-${sex}-original.png (owner-approved machine, bench, footplates and poses; handle replaced with a straight bar)`, 'SmartWorkout seated cable row video and text used for straight overhand bar and movement endpoints; source media not copied into project']
          : recipe.exerciseId === 'leg_curl' ? ['Fitcron lying leg curl animation frames 0 and 6 used as temporary mechanical references (GIF SHA-256 8999ec4f61892aadfd4283aea59aaa32d36a7d055ae81afa22c4bac3e70879ee; not project assets)', sex === 'female' ? 'New owner-accepted generated male board edited to female athlete' : 'New original selectorized machine board accepted visually by owner']
          : recipe.exerciseId === 'front_raise' ? ['Prior original GymNastika two-position board edited locally; Fitcron front-raise page used as movement endpoint reference, not copied into project']
          : recipe.exerciseId === 'chest_machine' ? ['Fitcron plate-loaded frontal press animation frames 0 and 6 were temporary mechanical references (GIF SHA-256 178fc6ea3e67dce373293a9041aefeb25b565c9f42c719b5d062efaa3eec7370; not project assets)', 'Owner-identified linkage defect in prior generated board corrected in v5; original fictional athlete retained']
          : recipe.exerciseId === 'pec_deck' ? ['Original GymNastika extended-arm board edited to remove forearm pads and retain slim vertical grip bars; Fitcron extended-machine page used as visual and neutral-grip reference, not copied']
          : recipe.exerciseId === 'shoulder_press' && recipe.variantId === 'default' ? [sex === 'female' ? 'Owner-accepted male board used as exact machine and pose reference; prior fictional female board used only for clothing and appearance' : 'Original GymNastika male board accepted visually by owner']
          : recipe.exerciseId === 'face_pull' ? ['Owner-supplied cable-station pose reference (SHA-256 392041cd28d76fcce4fc2a4cb74692931e45be0f0bbbc031be151d10de4920d3; visual reference, not copied into project)', sex === 'female' ? `${base}/source/candidates/face_pull__default-male-rear-threequarter-v2.png (machine and pose master); ${base}/source/candidates/face_pull__default-female-intermediate-v1.png (appearance reference)` : `${base}/source/candidates/face_pull__default-male-intermediate-v1.png (direct input, earlier exploratory draft and old fictional male board archived in candidate chain)`]
          : recipe.exerciseId === 'lat_raise_cable' ? ['ACE 354 and Fitcron single-arm cable lateral raise used for far-side hand and cross-body cable path; reference media not copied', sex === 'female' ? `${base}/source/candidates/lat_raise_cable__default-male-far-arm-v2.png (geometry master); prior fictional female board used for appearance` : 'Prior fictional male board used for appearance; near-side-arm machine geometry rejected']
          : recipe.exerciseId === 'cable_curl' ? ['Fitcron standing low-pulley supinated curl used as movement reference; reference media not copied', sex === 'female' ? `${base}/source/candidates/cable_curl__default-male-front-axis-v2.png (machine and pose master); prior fictional female board used for appearance` : `${base}/source/candidates/cable_curl__default-male-alignment-exploratory.png (direct input); prior fictional male board used for appearance`]
          : recipe.exerciseId === 'tri_overhead' && recipe.variantId === 'rope' ? ['Fitcron low-pulley overhead rope extension used as mechanics and position reference; reference media not copied', `${base}/source/candidates/tri_overhead__rope-${sex}-low-pulley-v2.png (rejected hyperextended posture)`, sex === 'female' ? `${base}/source/candidates/tri_overhead__rope-male-neutral-v3.png (neutral posture and machine master)` : `${base}/source/rejected/tri_overhead__rope-male-before-low-pulley-v3.png (original fictional athlete and machine)`]
          : recipe.exerciseId === 'row_machine' ? ['Owner-supplied cable-row machine photograph (SHA-256 33a159066439a011e3dec1168a55fb2e9bd4d63f45f89e5999624d628f0ff127; visual reference, not copied into project)', sex === 'female' ? 'Owner-approved generated male board edited to female athlete' : 'Original generated two-position board approved by owner'] : [],
        techniqueSource: recipe.techniqueSource,
        source: sourcePath, sourceSha256: sha(source), technique: bySex[sex].technique, thumbnail: bySex[sex].thumbnail,
        thumbnailMethod: 'Left panel of selected 768x512 board, scaled to 192x256 with 32px side gutters',
        panelReordered: !!recipe.swapPanels,
        technicalReview: recipe.exerciseId === 'row_straight' ? 'Owner directed use of the same low-cable row station and poses as accepted row_v, changing only to a short straight overhand bar, and accepted both revised boards on 2026-11-23. Visible movement compared with SmartWorkout seated cable row. Exact machine model and independent expert review remain unverified.'
          : recipe.exerciseId === 'lat_pulldown_neutral' ? 'Owner rejected prior grip and machine arrangements, then accepted both v5 boards on 2026-11-23. Visible seated direction, high-pulley position and movement endpoints compared with SmartWorkout video; compact double-D handle based on owner-supplied product photo. Hidden cable routing, precise equipment model and expert technique review remain unverified.'
          : recipe.exerciseId === 'tri_machine' ? 'Compared visible pose, grip and machine with both ACE 292 photographs; owner accepted visual on 2026-11-23; hidden mechanism and exact model unverified; no independent expert review'
          : recipe.exerciseId === 'tri_rope' ? 'Compared station orientation, pulley, cable, rope and elbow positions with ACE 185 photos; no independent expert review'
          : recipe.exerciseId === 'biceps_preacher' ? 'Owner explicitly approved the tri_machine visual for both exercise IDs on 2026-11-23; same frames are shown in reverse order for biceps. ACE 184 photographs use a different machine; this is an owner-selected shared visual, not a verified exact ACE 184 machine. No independent expert review.'
          : recipe.exerciseId === 'row_v' ? 'Owner accepted male and female V-handle low-cable row boards on 2026-11-23 after rejecting previous machine and handle. Visible machine and grip follow owner-supplied reference; ACE 48 supports the movement. Hidden cable path, exact model and expert review unverified.'
          : recipe.exerciseId === 'row_machine' ? `Owner accepted cable-row male board on 2026-11-23; ${sex === 'female' ? 'female counterpart visually checked by Codex' : 'male board visually checked by Codex'}. Cable row movement compared with ACE 48; owner-supplied machine is the equipment reference. Hidden cable path and manufacturer model unverified; no independent expert review`
          : recipe.exerciseId === 'leg_curl' ? 'Owner rejected the previous plate-loaded machine. New original selectorized machine, roller arc, fixed pivot and weight-stack lift were compared with Fitcron lying leg curl frames 0 and 6 and accepted visually on 2026-11-23. Internal cable routing and expert technique review remain unverified.'
          : recipe.exerciseId === 'front_raise' ? 'Owner accepted both edited visual boards on 2026-11-23. In the derived boards the raised dumbbells remain near shoulder height, below the face-height endpoint in the Fitcron reference; technical match remains partial. No independent expert review.'
          : recipe.exerciseId === 'chest_machine' ? 'Owner rejected selectorized v1 and linkage v4 because the black connecting rod appeared to stretch between positions. The plate-loaded v5 boards show front handle arms coupled by straight rods to rear weight rockers; owner accepted both visual boards on 2026-11-23. No independent expert mechanical or technique review.'
          : recipe.exerciseId === 'pec_deck' ? 'Owner retained the original extended-arm layout but identified hands apparently passing through forearm pads. Pads were removed, leaving slim vertical grip bars; both hands now hold separate bars with neutral grip in both positions. Owner accepted both visual boards on 2026-11-23. No independent expert review.'
          : recipe.exerciseId === 'shoulder_press' && recipe.variantId === 'default' ? 'Owner accepted male board but identified different machine construction in prior female board. Female board regenerated using male machine geometry and both positions as visual master; both accepted visually on 2026-11-23. No independent expert mechanical or technique review.'
          : recipe.exerciseId === 'face_pull' ? 'Owner rejected previous boards primarily for athlete orientation and placement relative to cable station. New male and female boards show an athlete facing the station in three-quarter rear view, using an owner-supplied pose reference and NASM movement description. Owner accepted both visually on 2026-11-23. Exact machine model, hidden cable routing and expert technique review remain unverified.'
          : recipe.exerciseId === 'lat_raise_cable' ? 'Owner rejected previous boards. ACE 354 and Fitcron describe the handle in the hand farther from the machine, with cable crossing in front of the body; accepted new male and female boards use this arrangement on a low pulley per GymNastika catalog. Owner accepted visual candidates on 2026-11-23. ACE pulley height differs from the catalog setup; no independent expert review.'
          : recipe.exerciseId === 'cable_curl' ? 'Owner rejected the side-of-machine framing and clarified that the athlete must stand directly opposite the low pulley. New male and female boards use an oblique camera with the tower ahead of the athlete and show both hands on the straight bar. Owner accepted both visually on 2026-11-23. Fitcron movement description supports the standing supinated curl; exact machine model and expert review remain unverified.'
          : recipe.exerciseId === 'tri_overhead' && recipe.variantId === 'rope' ? 'The former high-pulley upright boards did not match the vertical overhead rope variation in Fitcron. Low-pulley v2 was rejected by the owner for an unnaturally arched posture. V3 shows a neutral spine and stable staggered stance in both panels; owner accepted both visual boards on 2026-11-23. Exact internal cable routing and expert technique review remain unverified.'
          : 'Visual review by Codex; no independent expert review',
        publicUse: 'UNVERIFIED; local candidate only; no MIT or CC0 attribution' });
    }
    const record = { exerciseId: recipe.exerciseId, variantId: recipe.variantId, status: 'local-candidate',
      positions: { lower: 'left', raised: 'right' }, labels: recipe.labels, copy: recipe.copy, bySex,
      musclePresentation: { kind: 'atlas', exerciseId: recipe.exerciseId } };
    const index = registry.records.findIndex(item => item.exerciseId === recipe.exerciseId && item.variantId === recipe.variantId);
    if (index >= 0) registry.records[index] = record;
    else registry.records.push(record);
  }
} finally { await browser.close(); }
if (entries.some(entry => !entry.prompt && entry.exerciseId !== 'biceps_preacher')) throw new Error('Missing source prompt');
provenance.completeLibraryCandidates = onlyExerciseIds.size
  ? [...provenance.completeLibraryCandidates.filter(entry => !onlyExerciseIds.has(entry.exerciseId)), ...entries]
  : entries;
provenance.aceMachineReview = {
  reviewedOn: '2026-11-23',
  reviewer: 'Codex visual comparison only; no qualified expert review',
  photographsCopiedIntoProject: false,
  biceps_preacher: {
    reference: 'https://www.acefitness.org/resources/everyone/exercise-library/184/seated-biceps-curl/',
    observation: 'ACE 184 shows the curl movement but a different machine. The owner explicitly selected the tri_machine image pair as the common visual for both exercise IDs.',
    correction: 'Copied the approved tri_machine male and female boards, then reversed panel order for biceps DÓŁ/GÓRA while keeping exercise IDs distinct.',
    before: ['source/rejected/biceps_preacher__default-male-before-shared-machine.png', 'source/rejected/biceps_preacher__default-female-before-shared-machine.png'],
    status: 'owner-approved shared visual on 2026-11-23; exact ACE 184 equipment match and expert review unverified'
  },
  tri_rope: {
    reference: 'https://www.acefitness.org/resources/everyone/exercise-library/185/triceps-pushdowns/',
    observation: 'Previous candidates mirrored the ACE station and did not match the requested source construction.',
    correction: 'Replaced male and female local candidates with the tower on the left, athlete facing its high pulley, and continuous cable-to-rope path in both elbow positions.',
    before: ['source/rejected/tri_rope__default-male-before-ace185-review.png', 'source/rejected/tri_rope__default-female-before-ace185-review.png'],
    status: 'visual comparison with ACE 185 positions 1 and 2; no independent expert review'
  },
  leg_curl: {
    reference: 'https://fitcron.com/exercise/curl-femoral-horizontal-en-maquina-pierna/',
    secondaryReference: 'https://www.acefitness.org/resources/everyone/exercise-library/153/lying-hamstrings-curl/',
    observation: 'Owner rejected the plate-loaded candidate for incorrect machine mechanics. The Fitcron animation shows a fixed prone bench, posterior ankle rollers moving with the lower legs around a stationary pivot, and a selectorized stack lifted during knee flexion.',
    correction: 'Replaced male and female local candidate boards with an original selectorized-machine depiction. The prior plate-loaded candidates remain archived.',
    before: ['source/rejected/leg_curl__default-male-before-fitcron-v2.png', 'source/rejected/leg_curl__default-female-before-fitcron-v2.png'],
    status: 'owner-accepted visual on 2026-11-23; internal cable routing and independent expert review unverified'
  },
  tri_machine: {
    reference: 'https://www.acefitness.org/resources/everyone/exercise-library/292/tricep-extension/',
    observation: 'Owner selected both ACE 292 position photographs as the current equipment and motion reference, replacing the earlier plate-loaded requirement.',
    correction: 'Added male and female two-panel local candidates based on the compact selectorized machine, fixed elbow support and the reference grip positions.',
    status: 'owner accepted visual on 2026-11-23; hidden linkage and manufacturer model remain unverified; no independent expert review'
  },
  lat_pulldown_wide: {
    reference: 'https://www.acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/',
    correction: 'Replaced both male and female boards with a left-facing seated setup, angled overhead arm and high pulley based on ACE 158 visible positions.',
    before: ['source/rejected/lat_pulldown_wide__default-male-before-ace158-review.png', 'source/rejected/lat_pulldown_wide__default-female-before-ace158-review.png'],
    status: 'visually compared local candidate; exact manufacturer and hidden cable path unverified; no independent expert review'
  },
  lat_pulldown_neutral: {
    reference: 'https://smartworkout.app/pl/atlas-cwiczen/plecy/sciaganie-drazka-wyciagu-gornego-waskim-chwytem-neutralnym',
    equipmentReference: 'Owner-supplied compact silver neutral-grip handle photograph, SHA-256 3234b40b54a47070bd3950570ebdc23c2c1dc5d3e8a61bed1dc9ff24b9e5a513; not copied into project',
    correction: 'Replaced rejected front-facing and side-facing boards with a seated setup facing the weight stack and overhead pulley, plus two separate close neutral grips.',
    before: ['source/rejected/lat_pulldown_neutral__default-male-before-smartworkout-review.png', 'source/rejected/lat_pulldown_neutral__default-female-before-smartworkout-review.png'],
    status: 'owner accepted both visual boards on 2026-11-23; hidden cable routing, exact machine model and independent expert technique review remain unverified'
  },
  row_v: {
    reference: 'https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/',
    equipmentReference: 'Owner-supplied low-cable row image, SHA-256 789b89bc37bab4c3a99c9e2c0e8e6e00fb00131ca770775653709aff2c95e969; not copied into project',
    correction: 'Replaced rejected machine and handle with a fixed left tower, right bench, footplates, one horizontal cable and compact V handle in both positions.',
    before: ['source/rejected/row_v__default-male-before-owner-reference.png', 'source/rejected/row_v__default-female-before-owner-reference.png'],
    status: 'owner accepted both visual boards on 2026-11-23; exact model, hidden cable path, rights and expert review unverified'
  },
  row_straight: {
    reference: 'https://smartworkout.app/pl/atlas-cwiczen/plecy/przyciaganie-drazka-wyciagu-dolnego',
    equipmentReference: 'Owner-accepted row_v male and female boards, used as machine and pose masters; handle changed to short straight overhand bar',
    correction: 'Replaced prior machine layout with the accepted row_v tower, bench, footplates and low-cable path, with a straight bar in both positions.',
    before: ['source/rejected/row_straight__default-male-before-row-v-machine-v2.png', 'source/rejected/row_straight__default-female-before-row-v-machine-v2.png'],
    status: 'owner accepted both visual boards on 2026-11-23; exact machine model and independent expert technique review remain unverified'
  },
  row_machine: {
    reference: 'https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/',
    equipmentReference: 'Owner-supplied cable-row machine photograph, SHA-256 33a159066439a011e3dec1168a55fb2e9bd4d63f45f89e5999624d628f0ff127; not copied into project',
    correction: 'Replaced the rejected overhead-pivot boards with two-position low-cable-row boards using a fixed seat, footplates, handle and cable. Owner accepted the male image; female image is a local matching candidate.',
    before: ['source/rejected/row_machine__default-male-before-cable-reference.png', 'source/rejected/row_machine__default-female-before-cable-reference.png'],
    status: 'male owner-approved visual; female local candidate; exact model, hidden cable path, public-use rights and expert review unverified'
  }
};
await writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');
await writeFile(provenancePath, JSON.stringify(provenance, null, 2) + '\n');
console.log(`Derived ${entries.length} boards and ${entries.length} thumbnails; registry has ${registry.records.length} records.`);
