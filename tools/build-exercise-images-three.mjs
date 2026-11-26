import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(fileURLToPath(new URL('..', import.meta.url)));
const base = resolve(project, 'outputs/GV-EXERCISE-IMAGES-THREE');
const exerciseIds = ['db_bench', 'lat_pulldown_wide', 'leg_press'];
const requestedId = process.argv[2];
if (requestedId && !exerciseIds.includes(requestedId)) throw new Error(`Unknown exercise ID: ${requestedId}`);
const entries = exerciseIds.filter(exerciseId => !requestedId || exerciseId === requestedId).flatMap(exerciseId =>
  ['male', 'female'].map(sex => ({ exerciseId, sex, stem: `${exerciseId}__default-${sex}` })));
await mkdir(resolve(base, 'selected/technique'), { recursive: true });
await mkdir(resolve(base, 'selected/thumbnails'), { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
const metadata = [];
try {
  for (const { exerciseId, sex, stem } of entries) {
    const source = await readFile(resolve(base, 'source', `${stem}-original.png`));
    const converted = await page.evaluate(async png64 => {
      const load = src => new Promise((resolveImage, rejectImage) => {
        const image = new Image();
        image.onload = () => resolveImage(image);
        image.onerror = rejectImage;
        image.src = src;
      });
      const original = await load(`data:image/png;base64,${png64}`);
      if (original.naturalWidth !== 1536 || original.naturalHeight !== 1024) throw new Error('Unexpected source dimensions');
      const board = document.createElement('canvas');
      board.width = 768; board.height = 512;
      board.getContext('2d').drawImage(original, 0, 0, 768, 512);
      const boardUrl = board.toDataURL('image/webp', 0.84);
      if (!boardUrl.startsWith('data:image/webp;base64,')) throw new Error('WebP encoder unavailable');
      const selected = await load(boardUrl);
      const thumb = document.createElement('canvas');
      thumb.width = 256; thumb.height = 256;
      const context = thumb.getContext('2d');
      context.fillStyle = '#d7d6d5';
      context.fillRect(0, 0, 256, 256);
      context.drawImage(selected, 0, 0, 384, 512, 32, 0, 192, 256);
      const thumbUrl = thumb.toDataURL('image/webp', 0.84);
      if (!thumbUrl.startsWith('data:image/webp;base64,')) throw new Error('Thumbnail WebP encoder unavailable');
      return { board: boardUrl.split(',')[1], thumbnail: thumbUrl.split(',')[1] };
    }, source.toString('base64'));
    const technique = Buffer.from(converted.board, 'base64');
    const thumbnail = Buffer.from(converted.thumbnail, 'base64');
    const techniquePath = `outputs/GV-EXERCISE-IMAGES-THREE/selected/technique/${stem}.webp`;
    const thumbnailPath = `outputs/GV-EXERCISE-IMAGES-THREE/selected/thumbnails/${stem}.webp`;
    await writeFile(resolve(project, techniquePath), technique);
    await writeFile(resolve(project, thumbnailPath), thumbnail);
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    metadata.push({ exerciseId, sex, source: `outputs/GV-EXERCISE-IMAGES-THREE/source/${stem}-original.png`, sourceSha256: hash(source),
      technique: { path: techniquePath, width: 768, height: 512, sizeBytes: technique.length, sha256: hash(technique) },
      thumbnail: { path: thumbnailPath, width: 256, height: 256, sizeBytes: thumbnail.length, sha256: hash(thumbnail) } });
  }
} finally { await browser.close(); }
const metadataPath = resolve(base, 'derived-metadata.json');
const previousMetadata = requestedId ? JSON.parse(await readFile(metadataPath, 'utf8')) : [];
const allMetadata = [...previousMetadata.filter(item => item.exerciseId !== requestedId), ...metadata];
await writeFile(metadataPath, JSON.stringify(allMetadata, null, 2) + '\n');
const registryPath = resolve(project, 'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/local-pilot/presentation-registry.json');
const registry = JSON.parse(await readFile(registryPath, 'utf8'));
const originalLatRaise = registry.records.find(record => record.exerciseId === 'lat_raise_stand' && record.variantId === 'default');
if (!originalLatRaise) throw new Error('Existing lat_raise_stand pilot record missing');
const names = { db_bench: 'wyciskania hantli na ławce płaskiej', lat_pulldown_wide: 'ściągania drążka wyciągu górnego', leg_press: 'wypychania nóg na suwnicy' };
const records = exerciseIds.filter(exerciseId => !requestedId || exerciseId === requestedId).map(exerciseId => {
  const bySex = {};
  for (const sex of ['male', 'female']) {
    const item = metadata.find(entry => entry.exerciseId === exerciseId && entry.sex === sex);
    const label = sex === 'male' ? 'Męska' : 'Żeńska';
    bySex[sex] = {
      technique: { ...item.technique, mimeType: 'image/webp', altText: `${label} plansza ${names[exerciseId]}: DÓŁ po lewej, GÓRA po prawej`, status: 'local-candidate' },
      thumbnail: { ...item.thumbnail, mimeType: 'image/webp', altText: `Miniatura ${sex === 'male' ? 'męskiej' : 'żeńskiej'} sylwetki podczas ${names[exerciseId]} w pozycji DÓŁ`, status: 'local-candidate' }
    };
  }
  return { exerciseId, variantId: 'default', status: 'local-candidate', positions: { lower: 'left', raised: 'right' }, bySex, musclePresentation: { kind: 'atlas', exerciseId } };
});
if (requestedId) {
  registry.records = registry.records.map(record => record.exerciseId === requestedId ? records[0] : record);
  if (!registry.records.some(record => record.exerciseId === requestedId)) registry.records.push(records[0]);
} else {
  registry.records = [originalLatRaise, ...records];
}
await writeFile(registryPath, JSON.stringify(registry, null, 2) + '\n');
const provenancePath = resolve(project, 'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/ASSET-REGISTER.json');
const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
const prompts = JSON.parse(await readFile(resolve(base, 'PROMPTS.json'), 'utf8'));
const newCandidates = metadata.map(item => ({
  exerciseId: item.exerciseId, variantId: 'default', sex: item.sex, status: 'local-candidate',
  generatedDate: '2026-11-22', tool: 'Codex built-in image_gen.imagegen',
  prompt: prompts[`${item.exerciseId}/${item.sex}`], inputImages: [],
  source: item.source, sourceSha256: item.sourceSha256,
  technique: item.technique, thumbnail: item.thumbnail,
  thumbnailMethod: 'Left DÓŁ panel of selected 768x512 board scaled to 192x256 with 32px side gutters',
  technicalReview: 'Visual review of generated board by Codex; no independent expert review',
  publicUse: 'UNVERIFIED; local candidate only; no MIT or CC0 attribution'
}));
provenance.additionalCandidates = requestedId
  ? [...(provenance.additionalCandidates || []).filter(item => item.exerciseId !== requestedId), ...newCandidates]
  : newCandidates;
const rejectedPath = resolve(base, 'source/rejected/lat_pulldown_wide__default-male-visible-stack.png');
const rejectedBytes = await readFile(rejectedPath);
const rejectedCandidate = {
  exerciseId: 'lat_pulldown_wide', sex: 'male', status: 'rejected',
  path: 'outputs/GV-EXERCISE-IMAGES-THREE/source/rejected/lat_pulldown_wide__default-male-visible-stack.png',
  sha256: createHash('sha256').update(rejectedBytes).digest('hex'),
  prompt: prompts['lat_pulldown_wide/male-rejected'],
  reason: 'Visible weight stack remains at nearly the same position while the bar moves; mechanical continuity not established.'
};
if (!requestedId) provenance.rejectedAdditionalCandidates = [rejectedCandidate];
await writeFile(provenancePath, JSON.stringify(provenance, null, 2) + '\n');
console.log(`Derived ${metadata.length} WebP boards and ${metadata.length} lower-panel thumbnails.`);
