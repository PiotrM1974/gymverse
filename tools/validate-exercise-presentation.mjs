import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import releaseRegistry from '../src/data/exercise-presentations/release-registry.json' with { type: 'json' };
import ownerReview from '../outputs/GV-EXERCISE-IMAGES-COMPLETE/OWNER-VISUAL-REVIEW.json' with { type: 'json' };
import approval from '../outputs/GV-EXERCISE-IMAGES-COMPLETE/OWNER-PUBLICATION-APPROVAL.json' with { type: 'json' };
import { resolveExercisePresentation, validateExercisePresentationRegistry } from '../src/exercise/presentation-contract.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const errors = [];
const insideRoot = path => {
  const absolute = resolve(root, path);
  if (!absolute.startsWith(root + sep)) throw new Error(`PATH_ESCAPES_REPOSITORY: ${path}`);
  return absolute;
};
const ownerDecisions = new Map();
for (const decision of ownerReview.decisions) ownerDecisions.set(`${decision.exerciseId}/${decision.variantId}`, decision);
const accepted = new Set([...ownerDecisions].filter(([, decision]) => decision.decision === 'accepted').map(([key]) => key));
const registryKeys = new Set(releaseRegistry.records.map(record => `${record.exerciseId}/${record.variantId}`));

if (accepted.size !== 34 || registryKeys.size !== 34 || [...accepted].some(key => !registryKeys.has(key)) || [...registryKeys].some(key => !accepted.has(key))) {
  errors.push('OWNER_ACCEPTED_RECORD_COVERAGE_MISMATCH');
}
if (approval.recordType !== 'OWNER_PUBLICATION_APPROVAL' || approval.approvedOn !== releaseRegistry.publicationApproval.approvedOn || approval.approvedRecordCount !== 34 || approval.approvedTechniqueBoards !== 68 || approval.approvedThumbnails !== 68) {
  errors.push('PUBLICATION_APPROVAL_SCOPE_MISMATCH');
}
const ownerReviewBytes = await readFile(insideRoot('outputs/GV-EXERCISE-IMAGES-COMPLETE/OWNER-VISUAL-REVIEW.json'));
const approvalBytes = await readFile(insideRoot('outputs/GV-EXERCISE-IMAGES-COMPLETE/OWNER-PUBLICATION-APPROVAL.json'));
if (hash(ownerReviewBytes) !== approval.ownerVisualReviewSha256 || hash(ownerReviewBytes) !== releaseRegistry.publicationApproval.ownerVisualReviewSha256) errors.push('OWNER_REVIEW_HASH_MISMATCH');
if (hash(approvalBytes) !== releaseRegistry.publicationApproval.recordSha256) errors.push('PUBLICATION_APPROVAL_HASH_MISMATCH');

const assetPaths = new Set(releaseRegistry.records.flatMap(record => Object.values(record.bySex).flatMap(views => Object.values(views).map(asset => asset.path))));
const registryValidation = validateExercisePresentationRegistry(releaseRegistry, { availableAssets: assetPaths });
errors.push(...registryValidation.errors);
if (releaseRegistry.presentationContractVersion !== 2 || releaseRegistry.status !== 'released') errors.push('RELEASE_REGISTRY_STATUS_INVALID');
if (assetPaths.size !== 136) errors.push('ACTIVE_ASSET_COUNT_MISMATCH');

for (const record of releaseRegistry.records) {
  const key = `${record.exerciseId}/${record.variantId}`;
  const decision = ownerDecisions.get(key);
  if (decision?.decision !== 'accepted') errors.push(`${key}:NOT_OWNER_ACCEPTED`);
  if (record.ownerSelection?.sourceSha256BySex?.male !== decision?.sexes?.male || record.ownerSelection?.sourceSha256BySex?.female !== decision?.sexes?.female) errors.push(`${key}:OWNER_SELECTION_HASH_MISMATCH`);

  for (const sex of ['male', 'female']) {
    for (const view of ['technique', 'thumbnail']) {
      const asset = record.bySex[sex][view];
      if (!/^[a-f0-9]{64}$/.test(record.ownerSelection?.sourceSha256BySex?.[sex] || '')) errors.push(`${key}/${sex}:OWNER_SOURCE_HASH_INVALID`);
      try {
        const bytes = await readFile(insideRoot(asset.path));
        const metadata = await stat(insideRoot(asset.path));
        if (metadata.size !== asset.sizeBytes || hash(bytes) !== asset.sha256) errors.push(`${asset.path}:SIZE_OR_SHA256_MISMATCH`);
        if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') errors.push(`${asset.path}:WEBP_HEADER_INVALID`);
      } catch {
        errors.push(`${asset.path}:FILE_MISSING`);
      }
    }
  }
}

const activeFiles = [];
for (const folder of ['technique', 'thumbnails']) {
  for (const entry of await readdir(insideRoot(`src/data/exercise-images/selected/${folder}`), { withFileTypes: true })) {
    if (entry.isDirectory()) errors.push(`UNEXPECTED_DIRECTORY: ${folder}/${entry.name}`);
    else activeFiles.push(`src/data/exercise-images/selected/${folder}/${entry.name}`);
  }
}
if (activeFiles.length !== 136 || activeFiles.some(path => !assetPaths.has(path))) errors.push('PUBLIC_ASSET_DIRECTORY_NOT_ALLOWLISTED');

const triMachine = releaseRegistry.records.find(record => record.exerciseId === 'tri_machine');
const preacher = releaseRegistry.records.find(record => record.exerciseId === 'biceps_preacher');
if (triMachine?.labels?.lower !== 'START' || triMachine?.labels?.raised !== 'KONIEC') errors.push('TRICEPS_POSITION_LABELS_INVALID');
if (preacher?.labels?.lower !== 'DÓŁ' || preacher?.labels?.raised !== 'GÓRA' || !preacher?.copy?.thumbnail?.includes('DÓŁ')) errors.push('PREACHER_POSITION_LABELS_INVALID');
if (preacher?.ownerSelection?.panelReordered !== true || triMachine?.ownerSelection?.panelReordered !== false) errors.push('PREACHER_PANEL_ORDER_NOT_RECORDED');
if (releaseRegistry.records.some(record => ['tri_machine', 'biceps_preacher'].includes(record.exerciseId) && JSON.stringify(record).includes('EXPERT_REVIEWED'))) errors.push('EXPERT_REVIEW_WAS_INFERRED');
const highFeet = resolveExercisePresentation({ registry: releaseRegistry, exerciseId: 'leg_press', variantId: 'high_feet', sex: 'male', enabled: true });
if (highFeet.status !== 'released' || highFeet.variantId !== 'high_feet' || !highFeet.sharedBaseImage || !highFeet.technique.path.includes('leg_press__default-male.webp')) errors.push('LEG_PRESS_HIGH_FEET_SHARING_INVALID');

if (errors.length) {
  console.error(`Exercise presentation release validation: FAIL (${[...new Set(errors)].length} issues)`);
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Exercise presentation release validation: PASS (34 accepted mappings, 68 boards, 68 thumbnails, exact active asset hashes).');
}
