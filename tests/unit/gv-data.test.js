import { describe, expect, it } from 'vitest';
import { addStableIdentifiers, createBackupV5, ensureStableHistoryIds, inspectLegacySnapshot, previewBackupV5, requestStoragePersistence, restoreBackupV5, restoreLegacyV4 } from '../../src/gv-data.js';
import { BlobReader, BlobWriter, TextReader, TextWriter, ZipReader, ZipWriter } from '@zip.js/zip.js';

const validSynthetic = () => ({
  gymverse_schema: 2,
  gymverse_history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 40, reps: 8 }] }],
  gymverse_plans: [{ id: 'synthetic', title: 'Plan syntetyczny', exercises: [] }],
  gymverse_custom: { c_demo: { name: 'Ćwiczenie testowe', bw: false } },
  gymverse_active: null,
  gymverse_draft_v1: { version: 1, items: [] }
});

const syntheticBackupSnapshot = () => ({
  gymverse_schema: 4,
  gymverse_history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 40, reps: 8 }] }],
  gymverse_plans: [{ id: 'synthetic', title: 'Plan syntetyczny', exercises: [] }],
  gymverse_custom: { c_demo: { name: 'Ćwiczenie testowe', bw: false } },
  gymverse_body: [],
  gymverse_last_weights: { bench_flat: [{ weight: 40, reps: 8 }] },
  gymverse_active: { planId: 'synthetic', startedAt: 1, sets: [] },
  gymverse_draft_v1: { version: 1, items: [] },
  gymverse_rest: 90
});

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    values
  };
}

describe('GV-DATA source snapshot inspection', () => {
  it('returns structural counts and a digest without exposing record values', async () => {
    const result = await inspectLegacySnapshot(validSynthetic());
    expect(result.ok).toBe(true);
    expect(result.counts).toMatchObject({ sessions: 1, sets: 1, plans: 1, customExercises: 1, drafts: 0 });
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(result)).not.toContain('bench_flat');
    expect(JSON.stringify(result)).not.toContain('Ćwiczenie testowe');
    expect(JSON.stringify(result)).not.toContain('40');
  });

  it('reports malformed known keys and unknown keys as anonymous anomaly codes', async () => {
    const snapshot = validSynthetic();
    snapshot.gymverse_history = { private: 'never echo this value' };
    snapshot.secret_export = 'do not expose';
    const result = await inspectLegacySnapshot(snapshot);
    expect(result.ok).toBe(false);
    expect(result.anomalies).toContain('HISTORY_NOT_ARRAY');
    expect(result.anomalies).toContain('UNKNOWN_KEY');
    expect(JSON.stringify(result)).not.toContain('never echo');
    expect(JSON.stringify(result)).not.toContain('do not expose');
  });

  it('detects incomplete series without emitting their values', async () => {
    const snapshot = validSynthetic();
    snapshot.gymverse_history[0].details.push({ exerciseId: 'synthetic', weight: -1, reps: 0 });
    const result = await inspectLegacySnapshot(snapshot);
    expect(result.ok).toBe(false);
    expect(result.anomalies).toContain('INVALID_SERIES');
    expect(JSON.stringify(result)).not.toContain('synthetic');
  });

  it('accepts the existing synthetic JSON v4 export shape', async () => {
    const result = await inspectLegacySnapshot({
      app: 'gymverse', version: 4, exportedAt: '2026-01-01T00:00:00.000Z',
      history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'synthetic', weight: 0, reps: 10 }] }],
      lastWeights: {}, body: [], plans: [], custom: {}
    });
    expect(result.ok).toBe(true);
    expect(result.counts).toMatchObject({ sessions: 1, sets: 1 });
    expect(result.schemaKeys).toContain('gymverse_history');
  });

  it('rejects unsafe weight-mode and unknown exercises before a confirmed v4 restore mutates storage', async () => {
    const backup = {
      app: 'gymverse', version: 4, exportedAt: '2026-01-02T00:00:00.000Z',
      history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 0, reps: 10 }] }],
      lastWeights: {}, body: [], plans: [], custom: {}
    };
    const storage = memoryStorage({ gymverse_history: 'previous-synthetic-state' });
    const validation = { strictExerciseCatalog: true, catalog: { bench_flat: 'Bench' }, bodyweightExerciseIds: [] };
    await expect(restoreLegacyV4(storage, backup, { confirmed: true, restoreActive: false, restoreDrafts: false, validationOptions: validation }))
      .rejects.toMatchObject({ anomalies: expect.arrayContaining(['SERIES_WEIGHT_MODE_INVALID']) });
    expect(storage.getItem('gymverse_history')).toBe('previous-synthetic-state');
    const unknown = structuredClone(backup);
    unknown.history[0].details[0] = { exerciseId: 'exercise_missing_from_catalog', weight: 40, reps: 8 };
    await expect(restoreLegacyV4(storage, unknown, { confirmed: true, restoreActive: false, restoreDrafts: false, validationOptions: validation }))
      .rejects.toMatchObject({ anomalies: expect.arrayContaining(['EXERCISE_UNKNOWN']) });
    expect(storage.getItem('gymverse_history')).toBe('previous-synthetic-state');
  });

  it('preserves zero-weight sets for imported custom bodyweight exercises and validates ZIP v5 against the target catalog', async () => {
    const backup = {
      app: 'gymverse', version: 4, exportedAt: '2026-01-02T00:00:00.000Z',
      history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'c_synthetic_bw', weight: 0, reps: 10 }] }],
      lastWeights: {}, body: [], plans: [], custom: { c_synthetic_bw: { name: 'Synthetic BW', bw: true } }
    };
    const validation = { strictExerciseCatalog: true, catalog: { bench_flat: 'Bench' }, bodyweightExerciseIds: [] };
    const preview = await inspectLegacySnapshot(backup, validation);
    expect(preview.ok).toBe(true);
    const legacyStore = memoryStorage({ gymverse_history: 'previous-synthetic-state' });
    await restoreLegacyV4(legacyStore, backup, { confirmed: true, restoreActive: false, restoreDrafts: false, validationOptions: validation });
    expect(JSON.parse(legacyStore.getItem('gymverse_history'))[0].details[0].weight).toBe(0);
    expect(JSON.parse(legacyStore.getItem('gymverse_history'))[0].details[0].reps).toBe(10);
    const zipSnapshot = { gymverse_schema: 4, gymverse_history: backup.history, gymverse_custom: backup.custom, gymverse_plans: [], gymverse_body: [], gymverse_last_weights: {} };
    const goodZip = await createBackupV5(zipSnapshot, { createdAt: '2026-01-02T00:00:00.000Z', validationOptions: validation });
    const goodPreview = await previewBackupV5(goodZip, validation);
    const zipStore = memoryStorage({ gymverse_history: 'prior-zip-state' });
    await restoreBackupV5(zipStore, goodPreview, { confirmed: true, restoreActive: false, restoreDrafts: false, validationOptions: validation });
    expect(JSON.parse(zipStore.getItem('gymverse_history'))[0].details[0].weight).toBe(0);
    const v5 = await createBackupV5({ gymverse_schema: 4, gymverse_history: [{ date: backup.history[0].date, details: [{ exerciseId: 'bench_flat', weight: 0, reps: 10 }] }], gymverse_custom: {} }, { createdAt: '2026-01-02T00:00:00.000Z' });
    await expect(previewBackupV5(v5, validation)).rejects.toMatchObject({ anomalies: expect.arrayContaining(['SERIES_WEIGHT_MODE_INVALID']) });
  });
});

describe('GV-DATA persistent history identifiers', () => {
  it('assigns repeatable legacy identifiers while preserving same-time sessions and multiplicity', () => {
    const legacy = [
      { date: '2026-01-01T12:00:00.000Z', planId: 'push_a1', details: [{ exerciseId: 'bench_flat', setNumber: 1, weight: 40, reps: 8 }] },
      { date: '2026-01-01T12:00:00.000Z', planId: 'pull_a1', details: [{ exerciseId: 'lat_pulldown_wide', setNumber: 1, weight: 50, reps: 9 }] },
      { date: '2026-01-02T12:00:00.000Z', planId: 'push_a1', details: [{ exerciseId: 'bench_flat', setNumber: 1, weight: 40, reps: 8 }] },
      { date: '2026-01-02T12:00:00.000Z', planId: 'push_a1', details: [{ exerciseId: 'bench_flat', setNumber: 1, weight: 40, reps: 8 }] }
    ];
    const once = ensureStableHistoryIds(legacy);
    const twice = ensureStableHistoryIds(legacy);
    expect(once.map(session => session.id)).toEqual(twice.map(session => session.id));
    expect(new Set(once.map(session => session.id)).size).toBe(4);
    expect(once[0].details[0].id).toBe(twice[0].details[0].id);
    expect(once[0].details[0].id).toBeTruthy();
  });

  it('preserves existing UUIDs and includes durable identifiers in backup snapshots', () => {
    const snapshot = { gymverse_history: [{ id: 'session-uuid', date: '2026-01-01T12:00:00.000Z', details: [{ id: 'set-uuid', exerciseId: 'bench_flat', weight: 40, reps: 8 }] }] };
    const identified = addStableIdentifiers(snapshot);
    expect(identified.gymverse_history[0].id).toBe('session-uuid');
    expect(identified.gymverse_history[0].details[0].id).toBe('set-uuid');
    expect(snapshot.gymverse_history[0].id).toBe('session-uuid');
  });
});

describe('GV-DATA v5 backup', () => {
  it('reports storage persistence outcomes without suggesting durability is guaranteed', async () => {
    await expect(requestStoragePersistence(null)).resolves.toBe('unsupported');
    await expect(requestStoragePersistence({ persisted: async () => true, persist: async () => false })).resolves.toBe('persistent');
    await expect(requestStoragePersistence({ persisted: async () => false, persist: async () => false })).resolves.toBe('best-effort');
    await expect(requestStoragePersistence({ persisted: async () => false, persist: async () => { throw new Error('denied'); } })).resolves.toBe('best-effort');
  });

  it('exports a ZIP v5 and validates it without exposing or changing the source', async () => {
    const snapshot = syntheticBackupSnapshot();
    const before = JSON.stringify(snapshot);
    const archive = await createBackupV5(snapshot, {
      createdAt: '2026-01-02T00:00:00.000Z',
      legacyInterpretations: [{ id: 'rule-synthetic', exerciseId: 'db_bench', sessionIds: ['session-synthetic'], ruleVersion: 1, source: 'user_confirmed', confirmedAt: '2026-01-02T00:00:00.000Z', interpretation: { unit: 'per_dumbbell' } }]
    });
    const preview = await previewBackupV5(archive);
    expect(archive.type).toBe('application/zip');
    expect(preview).toMatchObject({ ok: true, version: 5, counts: { sessions: 1, sets: 1, plans: 1 } });
    expect(preview.schema).toBe('legacy-storage-snapshot');
    expect(preview.snapshot.gymverse_rest).toBe(90);
    expect(preview.snapshot.gymverse_history[0].id).toBeTruthy();
    expect(preview.snapshot.gymverse_history[0].details[0].id).toBeTruthy();
    expect(preview.snapshot.gymverse_draft_v1).toEqual(snapshot.gymverse_draft_v1);
    expect(preview.interpretations).toHaveLength(1);
    expect(preview.counts.legacyInterpretations).toBe(1);
    expect(JSON.stringify({ counts: preview.counts, schemaKeys: preview.schemaKeys })).not.toContain('bench_flat');
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it('rejects a changed payload whose checksum no longer matches', async () => {
    const archive = await createBackupV5(syntheticBackupSnapshot(), { createdAt: '2026-01-02T00:00:00.000Z' });
    const reader = new ZipReader(new BlobReader(archive));
    const entries = await reader.getEntries();
    const writer = new ZipWriter(new BlobWriter('application/zip'));
    for (const entry of entries) {
      const text = await entry.getData(new TextWriter());
      await writer.add(entry.filename, new TextReader(entry.filename === 'data.json' ? `${text} ` : text));
    }
    const tampered = await writer.close();
    await reader.close();
    await expect(previewBackupV5(tampered)).rejects.toThrow('CHECKSUM_MISMATCH');
  });

  it('requires explicit restore choices, replaces only after confirmation, and preserves source until then', async () => {
    const preview = await previewBackupV5(await createBackupV5(syntheticBackupSnapshot(), { createdAt: '2026-01-02T00:00:00.000Z' }));
    const storage = memoryStorage({ gymverse_history: 'old-state', gymverse_active: 'live-session', unrelated: 'preserved' });
    await expect(restoreBackupV5(storage, preview, { confirmed: false, restoreActive: false, restoreDrafts: false })).rejects.toThrow('RESTORE_CONFIRMATION_REQUIRED');
    expect(storage.getItem('gymverse_history')).toBe('old-state');
    await expect(restoreBackupV5(storage, preview, { confirmed: true })).rejects.toThrow('RESTORE_SESSION_CHOICES_REQUIRED');
    await expect(restoreBackupV5(storage, preview, { confirmed: true, restoreActive: false, restoreDrafts: true })).resolves.toMatchObject({ status: 'restored' });
    expect(JSON.parse(storage.getItem('gymverse_history'))).toHaveLength(1);
    expect(storage.getItem('gymverse_active')).toBeNull();
    expect(JSON.parse(storage.getItem('gymverse_draft_v1'))).toEqual({ version: 1, items: [] });
    expect(storage.getItem('unrelated')).toBe('preserved');
  });

  it('reports uncertain integrity if both import and rollback writes fail', async () => {
    const preview = await previewBackupV5(await createBackupV5(syntheticBackupSnapshot(), { createdAt: '2026-01-02T00:00:00.000Z' }));
    const storage = memoryStorage({ gymverse_history: 'previous-state' });
    let historyWrites = 0;
    const setItem = storage.setItem;
    storage.setItem = (key, value) => {
      if (key === 'gymverse_history' && ++historyWrites <= 2) throw new Error('synthetic storage failure');
      setItem(key, value);
    };
    let caught;
    try { await restoreBackupV5(storage, preview, { confirmed: true, restoreActive: true, restoreDrafts: true }); }
    catch (error) { caught = error; }
    expect(caught).toBeTruthy();
    expect(caught.integrityUncertain).toBe(true);
    expect(caught.rollbackErrors).toHaveLength(1);
  });

  it('checksum-validates optional user media and returns it only after successful preview', async () => {
    const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    const preview = await previewBackupV5(await createBackupV5(syntheticBackupSnapshot(), {
      createdAt: '2026-01-02T00:00:00.000Z',
      customMedia: [{ name: 'custom-media/demo.png', bytes: pngHeader }]
    }));
    expect(preview.media).toHaveLength(1);
    expect(preview.media[0].name).toBe('custom-media/demo.png');
    expect(preview.media[0].bytes).toEqual(pngHeader);
  });

  it('rejects ZIP Slip names and executable payload paths', async () => {
    const writer = new ZipWriter(new BlobWriter('application/zip'));
    await writer.add('../outside.json', new TextReader('{}'));
    const malicious = await writer.close();
    await expect(previewBackupV5(malicious)).rejects.toThrow();
  });

  it('requires confirmation before full v4 restore and preserves app settings', async () => {
    const legacy = {
      app: 'gymverse', version: 4, exportedAt: '2026-01-02T00:00:00.000Z',
      history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 30, reps: 8 }] }],
      lastWeights: {}, body: [], plans: [], custom: {}
    };
    const storage = memoryStorage({ gymverse_history: 'old-history', gymverse_active: 'old-active', gymverse_draft_v1: 'old-draft', gymverse_rest: '90', unrelated: 'keep' });
    await expect(restoreLegacyV4(storage, legacy, { confirmed: false, restoreActive: false, restoreDrafts: false })).rejects.toThrow('RESTORE_CONFIRMATION_REQUIRED');
    expect(storage.getItem('gymverse_history')).toBe('old-history');
    await expect(restoreLegacyV4(storage, legacy, { confirmed: true, restoreActive: false, restoreDrafts: false })).resolves.toMatchObject({ status: 'restored' });
    const restoredSession = JSON.parse(storage.getItem('gymverse_history'))[0];
    expect(restoredSession.details[0].weight).toBe(30);
    expect(restoredSession.id).toMatch(/^legacy-session-/);
    expect(restoredSession.details[0].id).toMatch(/^legacy-set-/);
    expect(storage.getItem('gymverse_active')).toBeNull();
    expect(storage.getItem('gymverse_draft_v1')).toBeNull();
    expect(storage.getItem('gymverse_rest')).toBe('90');
    expect(storage.getItem('unrelated')).toBe('keep');
  });
});
