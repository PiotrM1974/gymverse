import { createHash } from 'node:crypto';
import { EXERCISE_CATALOG, EXERCISE_VARIANTS } from '../src/exercise/catalog.js';
import imageManifest from '../src/exercise/image-manifest.json' with { type: 'json' };

export const IMAGE_MANIFEST_SCHEMA_VERSION = 1;
export const IMAGE_MANIFEST_ASSETS_VERSION = 1;
export const EXERCISE_IMAGE_MANIFEST = imageManifest;
export const IMAGE_VIEW_NAMES = ['technique', 'muscles', 'thumbnail'];
export const IMAGE_REVIEWED_CATALOG_FIELDS = [
  'exerciseIdentity', 'equipmentAndPosition', 'executionMetadata', 'primaryMuscles', 'secondaryMuscles'
];

const VIEW_DIRECTORIES = {
  technique: 'technique',
  muscles: 'muscles',
  thumbnail: 'thumbnails'
};
const STATUSES = new Set(['pending', 'draft', 'review', 'approved', 'rejected']);
const DECISION_STATUSES = new Set(['pending', 'approved', 'rejected']);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const OWNER_CLARIFICATION_IDS = new Set(['owner-clarification:2026-11-20:tri-machine-dual-function']);
const exactKeys = (value, expected) => isPlainObject(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const isTimestamp = value => nonempty(value) && TIMESTAMP_PATTERN.test(value) && Number.isFinite(Date.parse(value));
const nullableEmpty = value => value === null;

function addError(errors, label, code) {
  errors.push(`${label}:${code}`);
}

function expectedCompositions(catalog, variants) {
  const result = new Map();
  for (const exercise of Array.isArray(catalog) ? catalog : []) {
    if (nonempty(exercise?.id)) result.set(`${exercise.id}/default`, { exercise, variant: null });
  }
  for (const variant of Array.isArray(variants) ? variants : []) {
    if (nonempty(variant?.exerciseId) && nonempty(variant?.variantId)) {
      const exercise = (Array.isArray(catalog) ? catalog : []).find(item => item.id === variant.exerciseId);
      result.set(`${variant.exerciseId}/${variant.variantId}`, { exercise, variant });
    }
  }
  return result;
}

export function expectedImagePath(exerciseId, variantId, viewName) {
  const directory = VIEW_DIRECTORIES[viewName];
  if (!directory) return null;
  return `img/exercises/${directory}/${exerciseId}__${variantId}.webp`;
}

export function getCatalogImageFingerprint(exercise, variant = null) {
  if (!exercise) return null;
  const snapshot = {
    exerciseId: exercise.id,
    name: exercise.name,
    group: exercise.group,
    equipment: variant?.equipment ?? exercise.equipment,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    metadata: variant?.metadata ?? exercise.metadata,
    variantId: variant?.variantId ?? 'default',
    variantDescription: variant?.variantDescription ?? null
  };
  return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

function validateView(record, viewName, view, errors, warnings) {
  const label = `${record.exerciseId}/${record.variantId}/${viewName}`;
  if (!isPlainObject(view)) {
    addError(errors, label, 'VIEW_INVALID');
    return;
  }
  if (!exactKeys(view, ['status', 'path', 'mimeType', 'width', 'height', 'sizeBytes', 'sha256', 'altText', 'derivedFrom', 'origin', 'reason'])) {
    addError(errors, label, 'VIEW_SHAPE_INVALID');
  }
  if (!STATUSES.has(view.status)) addError(errors, label, 'VIEW_STATUS_INVALID');

  const expectedDerivedFrom = viewName === 'technique' ? null : 'technique';
  if (view.derivedFrom !== expectedDerivedFrom) addError(errors, label, 'DERIVATION_INVALID');

  if (view.status === 'pending') {
    const fileFields = ['path', 'mimeType', 'width', 'height', 'sizeBytes', 'sha256', 'altText', 'origin'];
    if (fileFields.some(field => !nullableEmpty(view[field])) || !nonempty(view.reason)) {
      addError(errors, label, 'PENDING_FIELDS_INVALID');
    }
    return;
  }

  if (view.reason !== null) addError(errors, label, 'NON_PENDING_REASON_INVALID');
  if (view.path === null || view.mimeType === null || view.width === null || view.height === null ||
      view.sizeBytes === null || view.sha256 === null || view.altText === null || view.origin === null) {
    addError(errors, label, 'ASSET_FIELDS_INCOMPLETE');
  }
  if (typeof view.path !== 'string' || view.path !== expectedImagePath(record.exerciseId, record.variantId, viewName) ||
      view.path.startsWith('/') || view.path.includes('\\') || view.path.includes(':') ||
      view.path.includes('..') || view.path.includes('%') || view.path.includes('?') || view.path.includes('#')) {
    addError(errors, label, 'PATH_INVALID');
  }
  if (view.mimeType !== 'image/webp') addError(errors, label, 'MIME_INVALID');
  if (!Number.isInteger(view.width) || view.width < 1 || !Number.isInteger(view.height) || view.height < 1) {
    addError(errors, label, 'DIMENSIONS_INVALID');
  }
  if (!Number.isInteger(view.sizeBytes) || view.sizeBytes < 1) addError(errors, label, 'SIZE_INVALID');
  if (typeof view.sha256 !== 'string' || !SHA256_PATTERN.test(view.sha256)) addError(errors, label, 'SHA256_INVALID');
  if (!nonempty(view.altText)) addError(errors, label, 'ALT_TEXT_MISSING');
  if (!exactKeys(view.origin, ['kind', 'reference', 'tool', 'createdAt']) || !['generated', 'derived', 'legacy'].includes(view.origin.kind) ||
      !nonempty(view.origin.reference) || !(view.origin.tool === null || nonempty(view.origin.tool)) ||
      !(view.origin.createdAt === null || isTimestamp(view.origin.createdAt))) {
    addError(errors, label, 'ORIGIN_INVALID');
  }
  if (['generated', 'derived'].includes(view.origin?.kind) && (!nonempty(view.origin.tool) || !isTimestamp(view.origin.createdAt))) {
    addError(errors, label, 'ORIGIN_PROVENANCE_INCOMPLETE');
  }
  if (viewName === 'technique' && view.origin?.kind === 'derived') addError(errors, label, 'TECHNIQUE_ORIGIN_INVALID');
  if (viewName !== 'technique' && view.origin?.kind !== 'derived') addError(errors, label, 'DERIVED_VIEW_ORIGIN_INVALID');

  if (viewName === 'thumbnail' && (view.width !== 256 || view.height !== 256)) {
    addError(errors, label, 'THUMBNAIL_DIMENSIONS_INVALID');
  }
  if ((viewName === 'technique' || viewName === 'muscles') && (view.width !== 768 || view.height !== 768)) {
    warnings.push(`${label}:PREFERRED_DIMENSIONS_NOT_MET`);
  }
  const byteTarget = viewName === 'thumbnail' ? 40 * 1024 : 200 * 1024;
  if (Number.isInteger(view.sizeBytes) && view.sizeBytes > byteTarget) warnings.push(`${label}:OPTIMIZATION_TARGET_EXCEEDED`);
}

function validateReadiness(record, expected, errors) {
  const readiness = record.imageReadiness;
  const label = `${record.exerciseId}/${record.variantId}`;
  if (!isPlainObject(readiness) || !['pending', 'approved'].includes(readiness.status)) {
    addError(errors, label, 'IMAGE_READINESS_INVALID');
    return;
  }
  if (!exactKeys(readiness, ['status', 'reviewedFields', 'catalogFingerprint', 'reviewer', 'reviewedAt'])) addError(errors, label, 'IMAGE_READINESS_SHAPE_INVALID');
  if (readiness.status === 'pending') {
    if (!Array.isArray(readiness.reviewedFields) || readiness.reviewedFields.length !== 0 ||
        readiness.catalogFingerprint !== null || readiness.reviewer !== null || readiness.reviewedAt !== null) {
      addError(errors, label, 'IMAGE_READINESS_FIELDS_INVALID');
    }
    return;
  }
  if (!Array.isArray(readiness.reviewedFields) || readiness.reviewedFields.length !== IMAGE_REVIEWED_CATALOG_FIELDS.length ||
      IMAGE_REVIEWED_CATALOG_FIELDS.some((field, index) => readiness.reviewedFields[index] !== field) ||
      !SHA256_PATTERN.test(readiness.catalogFingerprint || '') || !nonempty(readiness.reviewer) || !isTimestamp(readiness.reviewedAt)) {
    addError(errors, label, 'IMAGE_READINESS_FIELDS_INVALID');
    return;
  }
  const currentFingerprint = getCatalogImageFingerprint(expected.exercise, expected.variant);
  if (readiness.catalogFingerprint !== currentFingerprint) addError(errors, label, 'CATALOG_FINGERPRINT_MISMATCH');
}

function validateOwnerApproval(record, errors) {
  const approval = record.ownerApproval;
  const label = `${record.exerciseId}/${record.variantId}`;
  if (!isPlainObject(approval) || !DECISION_STATUSES.has(approval.status)) {
    addError(errors, label, 'OWNER_APPROVAL_INVALID');
    return;
  }
  if (!exactKeys(approval, ['status', 'revision', 'reviewer', 'decidedAt', 'decisionId', 'reason'])) addError(errors, label, 'OWNER_APPROVAL_SHAPE_INVALID');
  if (approval.revision !== record.revision || !Number.isInteger(approval.revision) || approval.revision < 1) {
    addError(errors, label, 'OWNER_APPROVAL_REVISION_MISMATCH');
  }
  if (approval.status === 'pending') {
    if (approval.reviewer !== null || approval.decidedAt !== null || approval.decisionId !== null || approval.reason !== null) {
      addError(errors, label, 'OWNER_APPROVAL_FIELDS_INVALID');
    }
  } else if (!nonempty(approval.reviewer) || !isTimestamp(approval.decidedAt) || !nonempty(approval.decisionId)) {
    addError(errors, label, 'OWNER_APPROVAL_FIELDS_INVALID');
  } else if (approval.status === 'approved' && approval.reason !== null) {
    addError(errors, label, 'OWNER_APPROVAL_REASON_INVALID');
  } else if (approval.status === 'rejected' && !nonempty(approval.reason)) {
    addError(errors, label, 'OWNER_REJECTION_REASON_MISSING');
  }
}

function validateCompositionStatus(record, errors) {
  const statuses = IMAGE_VIEW_NAMES.map(name => record.views?.[name]?.status);
  const readiness = record.imageReadiness?.status;
  const owner = record.ownerApproval?.status;
  let consistent = false;
  if (record.status === 'pending') {
    consistent = statuses.every(status => status === 'pending') && readiness === 'pending' && owner === 'pending';
  } else if (record.status === 'draft') {
    consistent = statuses.some(status => status === 'draft') && owner === 'pending';
  } else if (record.status === 'review') {
    consistent = statuses.every(status => status === 'review' || status === 'approved') &&
      readiness === 'approved' && owner === 'pending';
  } else if (record.status === 'approved') {
    consistent = statuses.every(status => status === 'approved') && readiness === 'approved' && owner === 'approved';
  } else if (record.status === 'rejected') {
    consistent = owner === 'rejected';
  }
  if (!consistent) addError(errors, `${record.exerciseId}/${record.variantId}`, 'STATUS_CONTRADICTION');
}

export function validateImageManifest(manifest, {
  catalog = EXERCISE_CATALOG,
  variants = EXERCISE_VARIANTS
} = {}) {
  const errors = [];
  const warnings = [];
  if (!isPlainObject(manifest)) return { valid: false, errors: ['MANIFEST_INVALID'], warnings };
  if (!exactKeys(manifest, ['exerciseAssetsVersion', 'manifestSchemaVersion', 'records'])) errors.push('MANIFEST_SHAPE_INVALID');
  if (manifest.exerciseAssetsVersion !== IMAGE_MANIFEST_ASSETS_VERSION) errors.push('EXERCISE_ASSETS_VERSION_INVALID');
  if (manifest.manifestSchemaVersion !== IMAGE_MANIFEST_SCHEMA_VERSION) errors.push('MANIFEST_SCHEMA_VERSION_INVALID');
  if (!Array.isArray(manifest.records) || manifest.records.length !== 35) errors.push('COMPOSITION_COUNT_INVALID');

  const expected = expectedCompositions(catalog, variants);
  const seen = new Set();
  for (const record of Array.isArray(manifest.records) ? manifest.records : []) {
    if (!isPlainObject(record)) {
      errors.push('COMPOSITION_INVALID');
      continue;
    }
    if (!exactKeys(record, ['exerciseId', 'variantId', 'revision', 'status', 'provenance', 'imageReadiness', 'ownerApproval', 'views'])) {
      errors.push('COMPOSITION_SHAPE_INVALID');
    }
    const key = `${record.exerciseId}/${record.variantId}`;
    const label = key;
    if (!/^[a-z0-9_]+$/.test(record.exerciseId || '') || !/^[a-z0-9_]+$/.test(record.variantId || '')) {
      addError(errors, label, 'COMPOSITION_ID_INVALID');
    }
    if (seen.has(key)) addError(errors, label, 'COMPOSITION_ID_DUPLICATE');
    seen.add(key);
    const target = expected.get(key);
    if (!target?.exercise) addError(errors, label, 'COMPOSITION_REFERENCE_UNKNOWN');
    if (!Number.isInteger(record.revision) || record.revision < 1) addError(errors, label, 'REVISION_INVALID');
    if (!STATUSES.has(record.status)) addError(errors, label, 'COMPOSITION_STATUS_INVALID');
    if (!exactKeys(record.provenance, ['masterVersion', 'references', 'ownerClarificationIds']) || record.provenance.masterVersion !== '2.8' ||
        !Array.isArray(record.provenance.references) || record.provenance.references.length === 0 ||
        record.provenance.references.some(item => !nonempty(item)) || !Array.isArray(record.provenance.ownerClarificationIds) ||
        record.provenance.ownerClarificationIds.some(item => !nonempty(item))) {
      addError(errors, label, 'PROVENANCE_INVALID');
    }
    const expectedReferences = target?.variant?.provenance?.references ?? target?.exercise?.provenance?.references;
    if (Array.isArray(expectedReferences) && JSON.stringify(record.provenance?.references) !== JSON.stringify(expectedReferences)) {
      addError(errors, label, 'PROVENANCE_REFERENCE_MISMATCH');
    }
    if (record.provenance?.ownerClarificationIds?.some(id => !OWNER_CLARIFICATION_IDS.has(id))) {
      addError(errors, label, 'OWNER_CLARIFICATION_UNKNOWN');
    }
    if (key === 'tri_machine/default' && !record.provenance?.ownerClarificationIds?.includes('owner-clarification:2026-11-20:tri-machine-dual-function')) {
      addError(errors, label, 'TRI_MACHINE_OWNER_CLARIFICATION_MISSING');
    }
    if (!isPlainObject(record.views) || IMAGE_VIEW_NAMES.some(name => !(name in record.views)) ||
        Object.keys(record.views || {}).some(name => !IMAGE_VIEW_NAMES.includes(name))) {
      addError(errors, label, 'VIEW_SET_INVALID');
    } else {
      for (const name of IMAGE_VIEW_NAMES) validateView(record, name, record.views[name], errors, warnings);
    }
    validateReadiness(record, target, errors);
    validateOwnerApproval(record, errors);
    validateCompositionStatus(record, errors);
  }
  if (seen.size !== expected.size || [...expected.keys()].some(key => !seen.has(key))) errors.push('COMPOSITION_SET_MISMATCH');
  return { valid: errors.length === 0, errors, warnings };
}

function getWebpDimensions(bytes) {
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8X' && bytes.length >= 30) {
    return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  }
  if (chunk === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
    return {
      width: 1 + bytes[21] + ((bytes[22] & 0x3f) << 8),
      height: 1 + ((bytes[22] >> 6) & 0x03) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10)
    };
  }
  if (chunk === 'VP8 ') {
    for (let index = 20; index + 7 < bytes.length; index += 1) {
      if (bytes[index] === 0x9d && bytes[index + 1] === 0x01 && bytes[index + 2] === 0x2a) {
        return {
          width: bytes.readUInt16LE(index + 3) & 0x3fff,
          height: bytes.readUInt16LE(index + 5) & 0x3fff
        };
      }
    }
  }
  return null;
}

export async function verifyImageManifestFiles(manifest, readAsset) {
  const structural = validateImageManifest(manifest);
  const errors = [...structural.errors];
  const warnings = [...structural.warnings];
  if (typeof readAsset !== 'function') {
    return { valid: false, errors: [...errors, 'ASSET_READER_REQUIRED'], warnings };
  }
  if (errors.length > 0) return { valid: false, errors, warnings };

  for (const record of manifest.records) {
    for (const viewName of IMAGE_VIEW_NAMES) {
      const view = record.views[viewName];
      if (view.status === 'pending') continue;
      const label = `${record.exerciseId}/${record.variantId}/${viewName}`;
      let rawBytes;
      try {
        rawBytes = await readAsset(view.path);
      } catch {
        addError(errors, label, 'ASSET_READ_FAILED');
        continue;
      }
      if (rawBytes === null || rawBytes === undefined) {
        addError(errors, label, 'ASSET_MISSING');
        continue;
      }
      if (!(rawBytes instanceof Uint8Array)) {
        addError(errors, label, 'ASSET_BYTES_INVALID');
        continue;
      }
      const bytes = Buffer.from(rawBytes);
      if (bytes.length !== view.sizeBytes) addError(errors, label, 'SIZE_MISMATCH');
      if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
        addError(errors, label, 'WEBP_SIGNATURE_INVALID');
        continue;
      }
      if (bytes.length < 12 || bytes.readUInt32LE(4) + 8 !== bytes.length) {
        addError(errors, label, 'WEBP_CONTAINER_SIZE_INVALID');
        continue;
      }
      const digest = createHash('sha256').update(bytes).digest('hex');
      if (digest !== view.sha256) addError(errors, label, 'SHA256_MISMATCH');
      const dimensions = getWebpDimensions(bytes);
      if (!dimensions) {
        addError(errors, label, 'WEBP_DIMENSIONS_UNREADABLE');
      } else if (dimensions.width !== view.width || dimensions.height !== view.height) {
        addError(errors, label, 'FILE_DIMENSIONS_MISMATCH');
      }
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}
