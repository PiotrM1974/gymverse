import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.evaluate(() => new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('gymverse-db-v3');
    request.onsuccess = request.onblocked = () => resolve();
    request.onerror = () => reject(request.error);
  }));
});

const syntheticSnapshot = () => ({
  gymverse_schema: 2,
  gymverse_history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'synthetic', weight: 40, reps: 8 }] }],
  gymverse_plans: [{ id: 'synthetic', title: 'Plan syntetyczny', exercises: [] }],
  gymverse_custom: {},
  gymverse_active: { planId: 'synthetic', startedAt: 1, sets: [] },
  gymverse_draft_v1: { version: 1, items: [{ planId: 'synthetic', sessionId: '1', step: 0, setNumber: 1, weight: '40', reps: '8' }] }
});

test('stages, verifies and activates a synthetic snapshot idempotently without changing the source', async ({ page }) => {
  const result = await page.evaluate(async snapshot => {
    const before = JSON.stringify(snapshot);
    const { stageLegacyMigration } = await import('/src/gv-data.js');
    const first = await stageLegacyMigration(snapshot);
    const second = await stageLegacyMigration(snapshot);
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('gymverse-db-v3', 4);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const pointer = await new Promise((resolve, reject) => {
      const request = db.transaction('meta').objectStore('meta').get('activeSnapshot');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const record = await new Promise((resolve, reject) => {
      const request = db.transaction('snapshotRecords').objectStore('snapshotRecords').get(`${pointer.sha256}:gymverse_history`);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return { first, second, pointer, record, sourceUnchanged: JSON.stringify(snapshot) === before };
  }, syntheticSnapshot());
  expect(result.first.status).toBe('activated');
  expect(result.second.status).toBe('already-active');
  expect(result.pointer.sha256).toBe(result.first.sha256);
  expect(result.record.value).toEqual(syntheticSnapshot().gymverse_history);
  expect(result.sourceUnchanged).toBe(true);
});

test('keeps legacy storage authoritative until verified runtime cutover, then writes only to IndexedDB', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const runtime = window.__gymverseTestHarness.getStore();
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'synthetic', details: [] }]));
    const sourceBefore = localStorage.getItem('gymverse_history');
    const preview = await runtime.previewMigration();
    const beforeCutover = runtime.get('gymverse_history');
    await runtime.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true });
    await runtime.set('gymverse_history', [{ id: 'newer-synthetic', details: [] }]);
    const after = await runtime.exportSnapshot();
    const { createRuntimeStore } = await import('./src/gv-data.js');
    const reopened = await createRuntimeStore({ storage: localStorage, locks: navigator.locks, broadcast: false });
    const reopenedMode = reopened.mode;
    const reopenedValue = reopened.get('gymverse_history');
    reopened.close();
    runtime.close();
    return {
      beforeCutover, sourceBefore, sourceAfter: localStorage.getItem('gymverse_history'),
      mode: 'indexeddb', persisted: JSON.parse(after.gymverse_history), reopenedMode, reopenedValue
    };
  });
  expect(result.beforeCutover).toEqual([{ id: 'synthetic', details: [] }]);
  expect(result.mode).toBe('indexeddb');
  expect(result.sourceBefore).toBe(result.sourceAfter);
  expect(result.persisted).toEqual([{ id: 'newer-synthetic', details: [] }]);
  expect(result.reopenedMode).toBe('indexeddb');
  expect(result.reopenedValue).toEqual([{ id: 'newer-synthetic', details: [] }]);
  const restarted = await page.context().newPage();
  await restarted.goto('/');
  await expect.poll(() => restarted.evaluate(() => window.__gymverseTestHarness?.getStore().mode)).toBe('indexeddb');
  const restartedValue = await restarted.evaluate(() => window.__gymverseTestHarness.getStore().get('gymverse_history'));
  expect(restartedValue).toEqual([{ id: 'newer-synthetic', details: [] }]);
  await restarted.close();
});

test('does not activate a partial migration or fall back after IndexedDB becomes unavailable', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const runtime = window.__gymverseTestHarness.getStore();
    const preview = await runtime.previewMigration();
    try { await runtime.activateMigration(preview, { sourceExportVerified: false, v5ExportVerified: true }); }
    catch (error) { var rejected = error.message; }
    const stillLegacy = runtime.mode;
    const active = await runtime.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true });
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('gymverse-db-v3');
      request.onsuccess = () => resolve(); request.onerror = () => reject(request.error);
    });
    try { await runtime.set('gymverse_history', []); return { rejected, stillLegacy, active, writeError: null }; }
    catch (error) { return { rejected, stillLegacy, active, writeError: error.message }; }
  });
  expect(result.rejected).toBe('SOURCE_EXPORT_NOT_VERIFIED');
  expect(result.stillLegacy).toBe('localStorage');
  expect(result.active.status).toBe('activated');
  expect(result.writeError).toBe('ACTIVE_DATABASE_UNAVAILABLE');
});

test('preserves duplicate-date sessions, all active-workout fields, and v1/v2/v4 keys', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const runtime = window.__gymverseTestHarness.getStore();
    const sessions = [1, 2].map(id => ({ id: `synthetic-${id}`, date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 30 + id, reps: 8 }] }));
    const active = { planId: 'push_a1', step: 2, sets: [{ step: 1, key: 'bench_flat', setNumber: 2, weight: 45, reps: 8 }], setCount: { 1: 4 }, timerEndAt: 12345, swaps: {}, rir: { 1: 2 } };
    const drafts = { version: 1, items: [{ planId: 'push_a1', sessionId: 'synthetic-session', step: 1, setNumber: 3, weight: '47.5', reps: '7', updatedAt: 1 }] };
    localStorage.setItem('gymverse_schema', JSON.stringify(1));
    localStorage.setItem('gymverse_history', JSON.stringify(sessions));
    localStorage.setItem('gymverse_last_weights', JSON.stringify({ bench_flat: [{ weight: 32, reps: 8 }] }));
    localStorage.setItem('gymverse_active', JSON.stringify(active));
    localStorage.setItem('gymverse_draft_v1', JSON.stringify(drafts));
    localStorage.setItem('gymverse_rest', JSON.stringify(180));
    const preview = await runtime.previewMigration();
    const result = await runtime.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true });
    return { result, sessions: runtime.get('gymverse_history'), active: runtime.get('gymverse_active'), drafts: runtime.get('gymverse_draft_v1'), rest: runtime.get('gymverse_rest') };
  });
  expect(result.result.status).toBe('activated');
  expect(result.sessions).toHaveLength(2);
  expect(result.sessions[0].date).toBe(result.sessions[1].date);
  expect(result.active).toMatchObject({ step: 2, setCount: { 1: 4 }, timerEndAt: 12345, rir: { 1: 2 } });
  expect(result.active.sets[0]).toMatchObject({ setNumber: 2, weight: 45, reps: 8 });
  expect(result.drafts.items[0]).toMatchObject({ setNumber: 3, weight: '47.5', reps: '7' });
  expect(result.rest).toBe(180);
});

test('retries an interrupted v1 migration idempotently without changing source values', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const values = new Map([
      ['gymverse_schema', '1'],
      ['gymverse_history', JSON.stringify([{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 40, reps: 8 }] }])]
    ]);
    const storage = {
      get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key)
    };
    let unavailable = false;
    const { createRuntimeStore } = await import('./src/gv-data.js');
    const runtime = await createRuntimeStore({ storage, locks: navigator.locks, broadcastChannelName: 'synthetic-retry', getIndexedDB: () => unavailable ? { open() { throw new Error('synthetic interrupted migration'); } } : indexedDB });
    const source = storage.getItem('gymverse_history');
    const preview = await runtime.previewMigration();
    unavailable = true;
    let firstFailure;
    try { await runtime.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true }); } catch (error) { firstFailure = error.message; }
    unavailable = false;
    const retry = await runtime.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true });
    const rows = runtime.get('gymverse_history');
    runtime.close();
    return { firstFailure, retry, sourceBefore: source, sourceAfter: storage.getItem('gymverse_history'), rows };
  });
  expect(result.firstFailure).toBeTruthy();
  expect(result.retry.status).toBe('activated');
  expect(result.sourceAfter).toBe(result.sourceBefore);
  expect(result.rows).toHaveLength(1);
});

test('migrates a legacy v4 storage snapshot without dropping its valid keys', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const runtime = window.__gymverseTestHarness.getStore();
    const legacy = {
      gymverse_schema: 4,
      gymverse_history: [{ date: '2026-03-04T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 50, reps: 7 }] }],
      gymverse_last_weights: { bench_flat: [{ weight: 50, reps: 7 }] },
      gymverse_plans: [{ id: 'legacy_v4', title: 'Plan v4', exercises: [{ key: 'bench_flat', sets: 2, target: '5-8' }] }],
      gymverse_custom: {}, gymverse_body: [], gymverse_rest: 120
    };
    Object.entries(legacy).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
    const preview = await runtime.previewMigration();
    const result = await runtime.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true });
    return { result, schema: runtime.get('gymverse_schema'), history: runtime.get('gymverse_history'), plans: runtime.get('gymverse_plans'), weights: runtime.get('gymverse_last_weights'), rest: runtime.get('gymverse_rest') };
  });
  expect(result.result.status).toBe('activated');
  expect(result.schema).toBe(4);
  expect(result.history[0].details[0].weight).toBe(50);
  expect(result.plans[0].id).toBe('legacy_v4');
  expect(result.weights.bench_flat[0].reps).toBe(7);
  expect(result.rest).toBe(120);
});

test('refuses migration while a second GymVerse tab is open', async ({ page }) => {
  const second = await page.context().newPage();
  await second.goto('/');
  await second.waitForFunction(() => !!window.__gymverseTestHarness);
  const result = await page.evaluate(async () => {
    const runtime = window.__gymverseTestHarness.getStore();
    const preview = await runtime.previewMigration();
    try { await runtime.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true }); return 'unexpected'; }
    catch (error) { return error.message; }
  });
  await second.close();
  expect(result).toBe('OTHER_TABS_OPEN');
});

test('keeps legacy storage active when the selector write fails for lack of space', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const values = new Map([['gymverse_schema', '1'], ['gymverse_history', '[]']]);
    const storage = {
      get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
      getItem: key => values.get(key) ?? null,
      setItem(key, value) {
        if (key === 'gymverse_storage_mode') { const error = new Error('synthetic quota error'); error.name = 'QuotaExceededError'; throw error; }
        values.set(key, String(value));
      },
      removeItem: key => values.delete(key)
    };
    const { createRuntimeStore } = await import('./src/gv-data.js');
    const runtime = await createRuntimeStore({ storage, locks: navigator.locks, broadcastChannelName: 'synthetic-quota' });
    const preview = await runtime.previewMigration();
    let error;
    try { await runtime.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true }); } catch (caught) { error = caught.name; }
    const mode = runtime.mode;
    runtime.close();
    return { error, mode, sourceHistory: storage.getItem('gymverse_history'), latch: storage.getItem('gymverse_storage_mode') };
  });
  expect(result.error).toBe('QuotaExceededError');
  expect(result.mode).toBe('localStorage');
  expect(result.sourceHistory).toBe('[]');
  expect(result.latch).toBeNull();
});

test('restores a synthetic ZIP v5 atomically after cutover and idles the restored timer', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const runtime = window.__gymverseTestHarness.getStore();
    const initialSource = await runtime.previewMigration();
    await runtime.activateMigration(initialSource, { sourceExportVerified: true, v5ExportVerified: true });
    const original = localStorage.getItem('gymverse_history');
    const { createBackupV5, previewBackupV5, restoreBackupV5 } = await import('./src/gv-data.js');
    const archive = await createBackupV5({
      gymverse_schema: 4,
      gymverse_history: [{ id: 'restored-synthetic', date: '2026-02-03T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 55, reps: 6 }] }],
      gymverse_last_weights: { bench_flat: [{ weight: 55, reps: 6 }] },
      gymverse_body: [{ date: '2026-02-03', kg: 80 }],
      gymverse_plans: [], gymverse_custom: {}, gymverse_active: { planId: 'synthetic', timerEndAt: 9999999999999, sets: [] },
      gymverse_draft_v1: { version: 1, items: [{ planId: 'synthetic', sessionId: 's1', step: 0, setNumber: 1, weight: '55', reps: '6' }] },
      gymverse_rest: 180, gymverse_bar: 15
    }, { createdAt: '2026-02-04T00:00:00.000Z' });
    const preview = await previewBackupV5(archive);
    const restored = await restoreBackupV5(runtime.storage, preview, { confirmed: true, restoreActive: true, restoreDrafts: true });
    return {
      restored, original, sourceAfter: localStorage.getItem('gymverse_history'),
      history: runtime.get('gymverse_history'), weights: runtime.get('gymverse_last_weights'), body: runtime.get('gymverse_body'),
      active: runtime.get('gymverse_active'), drafts: runtime.get('gymverse_draft_v1'), rest: runtime.get('gymverse_rest'), bar: runtime.get('gymverse_bar')
    };
  });
  expect(result.restored.status).toBe('restored');
  expect(result.sourceAfter).toBe(result.original);
  expect(result.history[0].id).toBe('restored-synthetic');
  expect(result.weights.bench_flat[0].weight).toBe(55);
  expect(result.body[0].kg).toBe(80);
  expect(result.active.timerEndAt).toBe(0);
  expect(result.drafts.items[0].weight).toBe('55');
  expect(result.rest).toBe(180);
  expect(result.bar).toBe(15);
});

test('exports ZIP v5 from the active IndexedDB snapshot after cutover', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const runtime = window.__gymverseTestHarness.getStore();
    const seeded = {
      gymverse_schema: 4,
      gymverse_history: [{ id: 'active-source-synthetic', date: '2026-04-05T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 42, reps: 9 }] }],
      gymverse_last_weights: { bench_flat: [{ weight: 42, reps: 9 }] },
      gymverse_body: [{ date: '2026-04-05', kg: 79 }],
      gymverse_plans: [{ id: 'backup-synthetic', title: 'Synthetic', exercises: [{ key: 'bench_flat', sets: 3, target: '5-8' }] }],
      gymverse_custom: {}, gymverse_rest: 90, gymverse_bar: 20
    };
    Object.entries(seeded).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
    const sourceBefore = localStorage.getItem('gymverse_history');
    const before = await runtime.previewMigration();
    await runtime.activateMigration(before, { sourceExportVerified: true, v5ExportVerified: true });
    const raw = await runtime.exportSnapshot();
    const snapshot = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, JSON.parse(value)]));
    const { createBackupV5, previewBackupV5 } = await import('./src/gv-data.js');
    const archive = await createBackupV5(snapshot, { createdAt: '2026-04-06T00:00:00.000Z' });
    const inspected = await previewBackupV5(archive);
    return { mode: runtime.mode, archiveSize: archive.size, inspected: { ok: inspected.ok, counts: inspected.counts, history: inspected.snapshot.gymverse_history, plans: inspected.snapshot.gymverse_plans, rest: inspected.snapshot.gymverse_rest }, sourceBefore, sourceAfter: localStorage.getItem('gymverse_history') };
  });
  expect(result.mode).toBe('indexeddb');
  expect(result.archiveSize).toBeGreaterThan(0);
  expect(result.inspected.ok).toBe(true);
  expect(result.inspected.counts).toMatchObject({ sessions: 1, sets: 1, plans: 1 });
  expect(result.inspected.history[0].id).toBe('active-source-synthetic');
  expect(result.inspected.plans[0].id).toBe('backup-synthetic');
  expect(result.inspected.rest).toBe(90);
  expect(result.sourceAfter).toBe(result.sourceBefore);
});

test('restores synthetic JSON v4 into IndexedDB while retaining app settings and idling its timer', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const runtime = window.__gymverseTestHarness.getStore();
    localStorage.setItem('gymverse_schema', '2');
    localStorage.setItem('gymverse_history', '[]');
    localStorage.setItem('gymverse_rest', '240');
    const sourceBefore = localStorage.getItem('gymverse_history');
    const migration = await runtime.previewMigration();
    await runtime.activateMigration(migration, { sourceExportVerified: true, v5ExportVerified: true });
    const { restoreLegacyV4 } = await import('./src/gv-data.js');
    const restored = await restoreLegacyV4(runtime.storage, {
      app: 'gymverse', version: 4, exportedAt: '2026-05-06T00:00:00.000Z',
      history: [{ date: '2026-05-05T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 60, reps: 5 }] }],
      lastWeights: { bench_flat: [{ weight: 60, reps: 5 }] }, body: [{ date: '2026-05-05', kg: 78 }],
      plans: [{ id: 'v4-synthetic', title: 'v4', exercises: [{ key: 'bench_flat', sets: 2, target: '5-8' }] }],
      custom: {},
      activeWorkout: { planId: 'v4-synthetic', timerEndAt: 9999999999999, sets: [] },
      drafts: { version: 1, items: [{ planId: 'v4-synthetic', sessionId: 'v4-session', step: 0, setNumber: 1, weight: '60', reps: '5' }] }
    }, { confirmed: true, restoreActive: true, restoreDrafts: true });
    return {
      restored, sourceBefore, sourceAfter: localStorage.getItem('gymverse_history'),
      history: runtime.get('gymverse_history'), lastWeights: runtime.get('gymverse_last_weights'),
      body: runtime.get('gymverse_body'), plans: runtime.get('gymverse_plans'),
      active: runtime.get('gymverse_active'), drafts: runtime.get('gymverse_draft_v1'), rest: runtime.get('gymverse_rest')
    };
  });
  expect(result.restored.status).toBe('restored');
  expect(result.sourceAfter).toBe(result.sourceBefore);
  expect(result.history[0].details[0].weight).toBe(60);
  expect(result.lastWeights.bench_flat[0].reps).toBe(5);
  expect(result.body[0].kg).toBe(78);
  expect(result.plans[0].id).toBe('v4-synthetic');
  expect(result.active.timerEndAt).toBe(0);
  expect(result.drafts.items[0].weight).toBe('60');
  expect(result.rest).toBe(240);
});

test('rejects malformed input before creating or activating a database snapshot', async ({ page }) => {
  const result = await page.evaluate(async snapshot => {
    const { stageLegacyMigration } = await import('/src/gv-data.js');
    try { await stageLegacyMigration(snapshot); return 'unexpected-success'; }
    catch (error) { return error.message; }
  }, { gymverse_schema: 2, gymverse_history: [{ details: [{ exerciseId: 'synthetic', weight: -1, reps: 0 }] }] });
  expect(result).toBe('LEGACY_SNAPSHOT_INVALID');
  const dbExists = await page.evaluate(() => new Promise(resolve => {
    const request = indexedDB.open('gymverse-db-v3');
    request.onsuccess = () => { request.result.close(); resolve(true); };
    request.onerror = () => resolve(false);
    request.onupgradeneeded = () => { request.transaction.abort(); resolve(false); };
  }));
  expect(dbExists).toBe(false);
});

test('stages a synthetic legacy v4 export into canonical keys without mutating the export', async ({ page }) => {
  const result = await page.evaluate(async legacy => {
    const before = JSON.stringify(legacy);
    const { stageLegacyMigration } = await import('./src/gv-data.js');
    const migration = await stageLegacyMigration(legacy);
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('gymverse-db-v3', 4);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const pointer = await new Promise((resolve, reject) => {
      const request = db.transaction('meta').objectStore('meta').get('activeSnapshot');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return { status: migration.status, keys: pointer.keys, unchanged: before === JSON.stringify(legacy) };
  }, {
    app: 'gymverse', version: 4, exportedAt: '2026-01-02T00:00:00.000Z',
    history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'synthetic', weight: 20, reps: 5 }] }],
    lastWeights: {}, body: [], plans: [], custom: {}
  });
  expect(result.status).toBe('activated');
  expect(result.keys).toContain('gymverse_history');
  expect(result.keys).not.toContain('history');
  expect(result.unchanged).toBe(true);
});

test('creates and previews a synthetic ZIP v5 through the browser served module', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { createBackupV5, previewBackupV5 } = await import('./src/gv-data.js');
    const snapshot = {
      gymverse_schema: 4,
      gymverse_history: [{ date: '2026-01-01T12:00:00.000Z', details: [{ exerciseId: 'synthetic', weight: 25, reps: 10 }] }],
      gymverse_plans: [], gymverse_custom: {}, gymverse_body: [], gymverse_last_weights: {},
      gymverse_active: { planId: 'synthetic', startedAt: 1, sets: [] },
      gymverse_draft_v1: { version: 1, items: [] }
    };
    const archive = await createBackupV5(snapshot, { createdAt: '2026-01-02T00:00:00.000Z' });
    const preview = await previewBackupV5(archive);
    return { type: archive.type, size: archive.size, counts: preview.counts, activePresent: !!preview.snapshot.gymverse_active };
  });
  expect(result.type).toBe('application/zip');
  expect(result.size).toBeGreaterThan(0);
  expect(result.counts).toMatchObject({ sessions: 1, sets: 1 });
  expect(result.activePresent).toBe(true);
});

test('restores a synthetic ZIP v5 through the application confirmation flow', async ({ page }) => {
  const archiveBytes = await page.evaluate(async () => {
    const { createBackupV5 } = await import('./src/gv-data.js');
    const archive = await createBackupV5({
      gymverse_schema: 4,
      gymverse_history: [{ date: '2026-02-03T12:00:00.000Z', details: [{ exerciseId: 'synthetic', weight: 20, reps: 5 }] }],
      gymverse_plans: [], gymverse_custom: {}, gymverse_body: [], gymverse_last_weights: {},
      gymverse_active: { planId: 'synthetic', startedAt: 2, sets: [] },
      gymverse_draft_v1: { version: 1, items: [{ planId: 'synthetic', sessionId: '2', step: 0, setNumber: 1, weight: '20', reps: '5', updatedAt: 1 }] }
    }, {
      createdAt: '2026-02-04T00:00:00.000Z',
      customMedia: [{ name: 'custom-media/synthetic.png', bytes: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]) }],
      legacyInterpretations: [{ id: 'rule-synthetic', exerciseId: 'synthetic', sessionIds: ['session-synthetic'], ruleVersion: 1, source: 'user_confirmed', confirmedAt: '2026-02-04T00:00:00.000Z', interpretation: { unit: 'user_confirmed' } }]
    });
    return Array.from(new Uint8Array(await archive.arrayBuffer()));
  });
  await page.evaluate(() => localStorage.setItem('gymverse_history', JSON.stringify([{ date: 'old synthetic state', details: [] }])));
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#importFile').setInputFiles({ name: 'gymverse_backup_synthetic.zip', mimeType: 'application/zip', buffer: Buffer.from(archiveBytes) });
  await page.waitForFunction(() => {
    try { return JSON.parse(localStorage.getItem('gymverse_history') || '[]')[0]?.date === '2026-02-03T12:00:00.000Z'; }
    catch { return false; }
  });
  const restored = await page.evaluate(() => ({
    active: JSON.parse(localStorage.getItem('gymverse_active') || 'null'),
    drafts: JSON.parse(localStorage.getItem('gymverse_draft_v1') || 'null')
  }));
  expect(restored.active.startedAt).toBe(2);
  expect(restored.drafts.items).toHaveLength(1);
  const interpretations = await page.evaluate(async () => {
    const { readLegacyInterpretations, readCustomMedia } = await import('./src/gv-data.js');
    return { interpretations: await readLegacyInterpretations(), media: await readCustomMedia() };
  });
  expect(interpretations.interpretations).toHaveLength(1);
  expect(interpretations.interpretations[0]).toMatchObject({ source: 'user_confirmed', exerciseId: 'synthetic' });
  expect(interpretations.media).toHaveLength(1);
  expect(interpretations.media[0].name).toBe('custom-media/synthetic.png');
});

test('offers a confirmed full restore for legacy JSON v4 while preserving unrelated app settings', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('gymverse_history', JSON.stringify([{ date: 'old synthetic state', details: [] }]));
    localStorage.setItem('gymverse_rest', '75');
  });
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#importFile').setInputFiles({
    name: 'synthetic-full-restore-v4.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      app: 'gymverse', version: 4, exportedAt: '2026-03-01T00:00:00.000Z',
      history: [{ date: '2026-02-28T12:00:00.000Z', details: [{ exerciseId: 'bench_flat', weight: 10, reps: 5 }] }],
      lastWeights: {}, body: [], plans: [], custom: {}
    }))
  });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('gymverse_history') || '[]')[0]?.date === '2026-02-28T12:00:00.000Z');
  expect(await page.evaluate(() => localStorage.getItem('gymverse_rest'))).toBe('75');
});

test('stores confirmed legacy interpretations separately from source history', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const rawHistory = JSON.stringify([{ date: 'synthetic-date', details: [] }]);
    localStorage.setItem('gymverse_history', rawHistory);
    const { saveLegacyInterpretation, readLegacyInterpretations } = await import('./src/gv-data.js');
    const saved = await saveLegacyInterpretation({
      id: 'rule-synthetic', exerciseId: 'bench_flat', sessionIds: ['session-synthetic'], ruleVersion: 1,
      source: 'user_confirmed', confirmedAt: '2026-01-02T00:00:00.000Z', interpretation: { load: 'per_dumbbell' }
    });
    return { saved, rows: await readLegacyInterpretations(), unchanged: localStorage.getItem('gymverse_history') === rawHistory };
  });
  expect(result.rows).toHaveLength(1);
  expect(result.saved.source).toBe('user_confirmed');
  expect(result.unchanged).toBe(true);
});

test('service worker installs and serves the backup module and ZIP codec offline', async ({ page, context }) => {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('gymverse-v6');
    return {
      module: !!await cache.match(new URL('src/gv-data.js', location.href).href),
      codec: !!await cache.match(new URL('src/vendor/zip.min.js', location.href).href)
    };
  });
  expect(cached).toEqual({ module: true, codec: true });
  await context.setOffline(true);
  const offline = await page.evaluate(async () => {
    const response = await fetch('src/gv-data.js');
    return { ok: response.ok, status: response.status, content: (await response.text()).includes('createBackupV5') };
  });
  expect(offline).toEqual({ ok: true, status: 200, content: true });
});
