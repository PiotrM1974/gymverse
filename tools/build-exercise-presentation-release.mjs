import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourceRegistryPath = 'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/local-pilot/presentation-registry.json';
const ownerReviewPath = 'outputs/GV-EXERCISE-IMAGES-COMPLETE/OWNER-VISUAL-REVIEW.json';
const assetRegisterPath = 'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/ASSET-REGISTER.json';
const approvalPath = 'outputs/GV-EXERCISE-IMAGES-COMPLETE/OWNER-PUBLICATION-APPROVAL.json';
const releaseRegistryPath = 'src/data/exercise-presentations/release-registry.json';
const targetRoot = 'src/data/exercise-images/selected';
const bytesAt = async path => readFile(resolve(root, path));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const parseJson = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const insideRoot = path => {
  const absolute = resolve(root, path);
  if (!absolute.startsWith(root + sep)) throw new Error(`PATH_ESCAPES_REPOSITORY: ${path}`);
  return absolute;
};

const [pilot, ownerReview, assetRegister, approval] = await Promise.all([
  parseJson(sourceRegistryPath), parseJson(ownerReviewPath), parseJson(assetRegisterPath), parseJson(approvalPath)
]);

const decisions = new Map();
for (const decision of ownerReview.decisions) decisions.set(`${decision.exerciseId}/${decision.variantId}`, decision);
const acceptedKeys = new Set([...decisions.entries()].filter(([, decision]) => decision.decision === 'accepted').map(([key]) => key));
const registryKeys = new Set(pilot.records.map(record => `${record.exerciseId}/${record.variantId}`));
if (acceptedKeys.size !== 34 || registryKeys.size !== 34 || [...acceptedKeys].some(key => !registryKeys.has(key)) || [...registryKeys].some(key => !acceptedKeys.has(key))) {
  throw new Error(`OWNER_SELECTION_COVERAGE_MISMATCH: accepted=${acceptedKeys.size}, registry=${registryKeys.size}`);
}
if (approval.recordType !== 'OWNER_PUBLICATION_APPROVAL' || approval.approvedOn !== '2026-11-23' || approval.approvedRecordCount !== 34 || approval.approvedTechniqueBoards !== 68) {
  throw new Error('OWNER_PUBLICATION_APPROVAL_MISSING_OR_SCOPE_MISMATCH');
}

const candidateAssets = [...assetRegister.completeLibraryCandidates, ...assetRegister.additionalCandidates];
const lineage = new Map(candidateAssets.map(asset => [`${asset.exerciseId}/${asset.variantId}/${asset.sex}`, asset]));
const latRaise = new Map(assetRegister.presentation.files.filter(file => file.role === 'technique').map(file => [file.sex, file]));
const reviewBytes = await bytesAt(ownerReviewPath);
const approvalBytes = await bytesAt(approvalPath);
if (approval.ownerVisualReviewSha256 !== sha256(reviewBytes)) throw new Error('OWNER_REVIEW_FINGERPRINT_MISMATCH');

const release = structuredClone(pilot);
release.presentationContractVersion = 2;
release.status = 'released';
release.publicationApproval = {
  record: approvalPath,
  recordSha256: sha256(approvalBytes),
  approvedOn: approval.approvedOn,
  scope: '34 owner-accepted exercise/variant records; both silhouettes; approved technique boards and their existing thumbnails',
  ownerVisualReview: ownerReviewPath,
  ownerVisualReviewSha256: sha256(reviewBytes),
  rightsAndTechnicalReview: 'Existing provenance, rights assessments, and technique-review statuses remain in the separate asset register; this release approval grants no blanket license and does not assert expert review.'
};

for (const record of release.records) {
  const key = `${record.exerciseId}/${record.variantId}`;
  const decision = decisions.get(key);
  if (decision?.decision !== 'accepted') throw new Error(`EXERCISE_NOT_OWNER_ACCEPTED: ${key}`);
  record.status = 'released';
  record.ownerSelection = {
    approvalRecord: approvalPath,
    exerciseId: key.split('/')[0],
    variantId: key.split('/')[1],
    sourceSha256BySex: { ...decision.sexes },
    panelReordered: false
  };
  const panelReorderedBySex = [];

  for (const sex of ['male', 'female']) {
    let sourceLineage = lineage.get(`${key}/${sex}`);
    if (!sourceLineage && key === 'lat_raise_stand/default') {
      const source = latRaise.get(sex);
      const thumbnail = assetRegister.presentation.files.find(file => file.role === 'thumbnail' && file.sex === sex);
      sourceLineage = {
        source: source.source,
        sourceSha256: source.sourceSha256,
        technique: { path: source.selected, sha256: source.sha256 },
        thumbnail: { path: thumbnail.selected, sha256: thumbnail.sha256 }
      };
    }
    if (!sourceLineage) throw new Error(`ASSET_LINEAGE_MISSING: ${key}/${sex}`);
    panelReorderedBySex.push(Boolean(sourceLineage.panelReordered));
    const approvedHash = decision.sexes[sex];
    if (![sourceLineage.sourceSha256, sourceLineage.technique.sha256].includes(approvedHash)) {
      throw new Error(`OWNER_SELECTION_LINEAGE_MISMATCH: ${key}/${sex}`);
    }
    if (sourceLineage.source) {
      const sourceBytes = await bytesAt(sourceLineage.source);
      if (sha256(sourceBytes) !== sourceLineage.sourceSha256) throw new Error(`SOURCE_HASH_MISMATCH: ${key}/${sex}`);
    }

    for (const [view, folder] of [['technique', 'technique'], ['thumbnail', 'thumbnails']]) {
      const asset = record.bySex[sex][view];
      const registered = sourceLineage[view];
      if (!registered || asset.sha256 !== registered.sha256 || asset.path !== registered.path) {
        throw new Error(`REGISTERED_ASSET_MISMATCH: ${key}/${sex}/${view}`);
      }
      const originalBytes = await bytesAt(asset.path);
      if (sha256(originalBytes) !== asset.sha256) throw new Error(`ACTIVE_ASSET_HASH_MISMATCH: ${key}/${sex}/${view}`);
      const filename = `${record.exerciseId}__${record.variantId}-${sex}.webp`;
      const targetPath = `${targetRoot}/${folder}/${filename}`;
      await mkdir(dirname(insideRoot(targetPath)), { recursive: true });
      await copyFile(insideRoot(asset.path), insideRoot(targetPath));
      asset.path = targetPath;
    }
  }
  if (panelReorderedBySex[0] !== panelReorderedBySex[1]) throw new Error(`PANEL_ORDER_SILHOUETTE_MISMATCH: ${key}`);
  record.ownerSelection.panelReordered = panelReorderedBySex[0];
}

const triMachine = release.records.find(record => record.exerciseId === 'tri_machine');
const preacher = release.records.find(record => record.exerciseId === 'biceps_preacher');
if (triMachine.labels?.lower !== 'START' || triMachine.labels?.raised !== 'KONIEC' ||
    preacher.labels?.lower !== 'DÓŁ' || preacher.labels?.raised !== 'GÓRA' ||
    !preacher.ownerSelection.panelReordered) {
  throw new Error('APPROVED_PANEL_ORDER_MISMATCH');
}

await mkdir(dirname(insideRoot(releaseRegistryPath)), { recursive: true });
await writeFile(insideRoot(releaseRegistryPath), `${JSON.stringify(release, null, 2)}\n`, 'utf8');
const assetCount = release.records.reduce((total, record) => total + Object.values(record.bySex).reduce((count, views) => count + Object.keys(views).length, 0), 0);
console.log(`Exercise image release prepared: ${release.records.length} records, ${assetCount} active files, owner review and source lineage verified.`);
