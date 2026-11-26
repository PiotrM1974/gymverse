export const EXERCISE_PRESENTATION_CONTRACT_VERSION = 1;
export const EXERCISE_PRESENTATION_RELEASE_VERSION = 2;
import { EXERCISE_CATALOG, EXERCISE_VARIANTS } from './catalog.js';
const SEXES = ['male', 'female'];
const ASSET_KEYS = ['path', 'mimeType', 'width', 'height', 'sizeBytes', 'sha256', 'altText', 'status'];
const CATALOG_IDS = new Set(EXERCISE_CATALOG.map(item => item.id));
const VARIANT_KEYS = new Set(EXERCISE_VARIANTS.map(item => `${item.exerciseId}/${item.variantId}`));
const rootFor = () => 'src/data/exercise-images/selected/';
const SHA256 = /^[a-f0-9]{64}$/;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, expected) => isObject(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));

export function isLocalPresentationPilotEnabled(locationLike = globalThis.location) {
  if (!locationLike) return false;
  const host = String(locationLike.hostname || '').toLowerCase();
  if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(host)) return false;
  return new URLSearchParams(String(locationLike.search || '')).get('local-exercise-presentation-pilot') === '1';
}

export function validateExercisePresentationRegistry(registry, { availableAssets } = {}) {
  const errors = [];
  const isRelease = registry?.presentationContractVersion === EXERCISE_PRESENTATION_RELEASE_VERSION;
  const registryKeys = isRelease
    ? ['presentationContractVersion', 'status', 'publicationApproval', 'records']
    : ['presentationContractVersion', 'status', 'records'];
  if (!exactKeys(registry, registryKeys)) return { valid: false, errors: ['REGISTRY_SHAPE_INVALID'] };
  if (![EXERCISE_PRESENTATION_CONTRACT_VERSION, EXERCISE_PRESENTATION_RELEASE_VERSION].includes(registry.presentationContractVersion)) errors.push('PRESENTATION_VERSION_UNSUPPORTED');
  if (registry.status !== (isRelease ? 'released' : 'local-candidate') || !Array.isArray(registry.records) || registry.records.length < 1 || registry.records.length > EXERCISE_CATALOG.length + EXERCISE_VARIANTS.length - 1) errors.push('REGISTRY_STATUS_OR_RECORDS_INVALID');
  if (isRelease) {
    const approval = registry.publicationApproval;
    if (!exactKeys(approval, ['record', 'recordSha256', 'approvedOn', 'scope', 'ownerVisualReview', 'ownerVisualReviewSha256', 'rightsAndTechnicalReview']) ||
        typeof approval.record !== 'string' || approval.record.includes('..') || approval.record.startsWith('/') || approval.record.includes(':') ||
        !SHA256.test(approval.recordSha256 || '') || !/^\d{4}-\d{2}-\d{2}$/.test(approval.approvedOn || '') ||
        typeof approval.scope !== 'string' || !approval.scope.trim() || typeof approval.ownerVisualReview !== 'string' ||
        approval.ownerVisualReview.includes('..') || approval.ownerVisualReview.startsWith('/') || approval.ownerVisualReview.includes(':') ||
        !SHA256.test(approval.ownerVisualReviewSha256 || '') || typeof approval.rightsAndTechnicalReview !== 'string' || !approval.rightsAndTechnicalReview.trim()) {
      errors.push('PUBLICATION_APPROVAL_INVALID');
    }
  }

  const seen = new Set();
  for (const record of Array.isArray(registry.records) ? registry.records : []) {
    const requiredKeys = ['exerciseId', 'variantId', 'status', 'positions', 'bySex', 'musclePresentation'];
    const optionalKeys = isRelease ? ['labels', 'copy', 'ownerSelection'] : ['labels', 'copy'];
    if (!isObject(record) || requiredKeys.some(key => !Object.hasOwn(record, key)) || Object.keys(record).some(key => ![...requiredKeys, ...optionalKeys].includes(key))) {
      errors.push('PRESENTATION_RECORD_SHAPE_INVALID');
      continue;
    }
    const recordKey = `${record.exerciseId}/${record.variantId}`;
    if (seen.has(recordKey)) errors.push('PRESENTATION_RECORD_DUPLICATE');
    seen.add(recordKey);
    if (!CATALOG_IDS.has(record.exerciseId) || (record.variantId !== 'default' && !VARIANT_KEYS.has(recordKey)) || recordKey === 'leg_press/high_feet') errors.push('PRESENTATION_RECORD_ID_INVALID');
    if (record.status !== (isRelease ? 'released' : 'local-candidate')) errors.push('PRESENTATION_STATUS_INVALID');
    if (isRelease) {
      const selection = record.ownerSelection;
      if (!exactKeys(selection, ['approvalRecord', 'exerciseId', 'variantId', 'sourceSha256BySex', 'panelReordered']) ||
          selection.approvalRecord !== registry.publicationApproval.record || selection.exerciseId !== record.exerciseId || selection.variantId !== record.variantId ||
          typeof selection.panelReordered !== 'boolean' ||
          !exactKeys(selection.sourceSha256BySex, SEXES) || SEXES.some(sex => !SHA256.test(selection.sourceSha256BySex?.[sex] || ''))) errors.push('OWNER_SELECTION_INVALID');
    }
    if (!exactKeys(record.positions, ['lower', 'raised']) || record.positions.lower !== 'left' || record.positions.raised !== 'right') errors.push('PRESENTATION_POSITIONS_INVALID');
    if (record.labels && (!exactKeys(record.labels, ['lower', 'raised']) || Object.values(record.labels).some(value => typeof value !== 'string' || !value.trim()))) errors.push('PRESENTATION_LABELS_INVALID');
    if (record.copy && (!exactKeys(record.copy, ['lower', 'raised', 'details', 'thumbnail']) || Object.values(record.copy).some(value => typeof value !== 'string' || !value.trim()))) errors.push('PRESENTATION_COPY_INVALID');
    if (!isObject(record.bySex) || Object.keys(record.bySex).length !== 2 || SEXES.some(sex => !Object.hasOwn(record.bySex, sex))) errors.push('PRESENTATION_SEX_INVALID');

    for (const sex of SEXES) {
      const views = record.bySex?.[sex];
      if (!exactKeys(views, ['technique', 'thumbnail'])) {
        errors.push('PRESENTATION_VIEWS_INVALID');
        continue;
      }
      for (const [viewName, asset] of Object.entries(views)) {
        const label = `${sex}:${viewName}`;
        if (!exactKeys(asset, ASSET_KEYS)) { errors.push(`${label}:ASSET_SHAPE_INVALID`); continue; }
        const directory = viewName === 'technique' ? 'technique' : 'thumbnails';
        const dimension = viewName === 'technique' ? [768, 512] : [256, 256];
        const expectedPath = isRelease
          ? `src/data/exercise-images/selected/${directory}/${record.exerciseId}__${record.variantId}-${sex}.webp`
          : `${rootFor(record.exerciseId)}${directory}/${record.exerciseId}__${record.variantId}-${sex}.webp`;
        if (asset.path !== expectedPath || asset.path.includes('..') || asset.path.startsWith('/') || asset.path.includes(':')) errors.push(`${label}:ASSET_PATH_INVALID`);
        if (asset.mimeType !== 'image/webp' || asset.width !== dimension[0] || asset.height !== dimension[1]) errors.push(`${label}:ASSET_MEDIA_INVALID`);
        if (!Number.isInteger(asset.sizeBytes) || asset.sizeBytes < 1 || !SHA256.test(asset.sha256 || '') || typeof asset.altText !== 'string' || !asset.altText.trim()) errors.push(`${label}:ASSET_METADATA_INVALID`);
        if (asset.status !== 'local-candidate') errors.push(`${label}:ASSET_STATUS_INVALID`);
        if (availableAssets && !availableAssets.has(asset.path)) errors.push('ASSET_PATH_MISSING');
      }
    }
    if (!exactKeys(record.musclePresentation, ['kind', 'exerciseId']) || record.musclePresentation.kind !== 'atlas') errors.push('MUSCLE_PRESENTATION_KIND_INVALID');
    else if (record.musclePresentation.exerciseId !== record.exerciseId) errors.push('ATLAS_EXERCISE_MISMATCH');
  }
  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

export function resolveExercisePresentation({ registry, exerciseId, variantId = 'default', sex = 'male', enabled = false }) {
  if (!enabled) return { status: 'legacy', exerciseId, variantId };
  const validation = validateExercisePresentationRegistry(registry);
  if (!validation.valid) return { status: 'error', code: 'PRESENTATION_REGISTRY_INVALID', errors: validation.errors };
  const sharedBase = exerciseId === 'leg_press' && variantId === 'high_feet';
  const record = registry.records.find(item => item.exerciseId === exerciseId && item.variantId === (sharedBase ? 'default' : variantId));
  if (!record) return { status: 'legacy', exerciseId, variantId };
  if (!SEXES.includes(sex)) return { status: 'error', code: 'PRESENTATION_SEX_INVALID' };
  return {
    status: record.status,
    exerciseId: record.exerciseId,
    variantId,
    sharedBaseImage: sharedBase,
    sex,
    technique: record.bySex[sex].technique,
    thumbnail: record.bySex[sex].thumbnail,
    positions: record.positions,
    musclePresentation: record.musclePresentation
  };
}
