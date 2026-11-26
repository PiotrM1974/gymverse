import { test, expect } from '@playwright/test';

test('smoke: app initializes and opens the plans view', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  expect(await page.evaluate(() => window.__gymverseTestHarness.getStore().mode)).toBe('localStorage');
  await expect(page.locator('#view-plans')).toHaveClass(/active/);
});

test('smoke: a single-card plan edit reaches the shared store', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {} }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="day-a"]').click();
  const preservedBefore = await page.evaluate(async () => {
    localStorage.setItem('gymverse_active', JSON.stringify({ id: 'session-one', planId: 'day-a', startedAt: 12345, step: 0, sets: [{ key: 'bench_flat', weight: 40, reps: 8, step: 0, setNumber: 1 }], rir: { 0: 2 }, exercises: [{ key: 'bench_flat', sets: 2, target: '8', restSeconds: 90 }] }));
    localStorage.setItem('gymverse_history', JSON.stringify([{ id: 'history-one', date: '2026-01-01T00:00:00Z', planId: 'day-a', planTitle: 'Synthetic day', details: [] }]));
    localStorage.setItem('gymverse_draft_v1', JSON.stringify({ version: 1, items: [{ planId: 'day-a', sessionId: '12345', step: 0, setNumber: 2, weight: '42', reps: '8' }] }));
    const snapshot = await window.__gymverseTestHarness.getStore().refreshSnapshot();
    return ['gymverse_active', 'gymverse_history', 'gymverse_draft_v1'].map(key => snapshot[key]);
  });
  await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].exercises[0].sets)).toBe(3);
  const preservedAfter = await page.evaluate(async () => {
    const snapshot = await window.__gymverseTestHarness.getStore().refreshSnapshot();
    return ['gymverse_active', 'gymverse_history', 'gymverse_draft_v1'].map(key => snapshot[key]);
  });
  expect(preservedAfter).toEqual(preservedBefore);
  expect(JSON.parse(preservedAfter[0]).rir['0']).toBe(2);
});

test('day editor waits for the shared program data lock and persists only after release', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {} }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  const other = await context.newPage();
  await other.goto('/');
  await other.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.evaluate(() => {
    window.lockHeld = false;
    window.lockDone = navigator.locks.request('gymnastika-plan-program-data', async () => {
      window.lockHeld = true;
      await new Promise(resolve => { window.releaseDiagnosticLock = resolve; });
    });
  });
  await page.waitForFunction(() => window.lockHeld);
  try {
    await other.locator('[data-act="editPlans"]').click();
    await other.locator('[data-act="peOpen"][data-id="day-a"]').click();
    await other.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
    await other.waitForTimeout(150);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].exercises[0].sets)).toBe(2);
    expect(await page.evaluate(() => window.lockHeld)).toBe(true);
    await page.evaluate(() => window.releaseDiagnosticLock());
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].exercises[0].sets)).toBe(3);
  } finally {
    await page.evaluate(async () => { window.releaseDiagnosticLock?.(); await window.lockDone; });
    await other.close();
  }
});

for (const editScope of ['same day', 'different days in one program']) {
  test(`stale ${editScope} edit is rejected without losing the first write`, async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('gymverse_schema', '4');
      localStorage.setItem('gymverse_plans', JSON.stringify([
        { id: 'day-a', title: 'Synthetic A', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }, { key: 'row_v', sets: 4, target: '8' }] },
        { id: 'day-b', title: 'Synthetic B', exercises: [{ key: 'leg_press', sets: 5, target: '8' }] }
      ]));
      localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: 'pg_11111111111111111111111111111111', programs: [{ id: 'pg_11111111111111111111111111111111', title: 'Synthetic program', dayPlanIds: ['day-a', 'day-b'] }] } }] }));
    });
    await page.reload();
    await page.waitForFunction(() => !!window.__gymverseTestHarness);
    const other = await context.newPage();
    await other.goto('/');
    await other.waitForFunction(() => !!window.__gymverseTestHarness);
    for (const tab of [page, other]) {
      await tab.locator('[data-act="editPlans"]').click();
      await tab.locator(`[data-act="peOpen"][data-id="day-a"]`).click();
    }
    await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
    await expect.poll(async () => page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans)[0].exercises[0].sets)).toBe(3);
    if (editScope === 'same day') await other.locator('[data-act="peSets"][data-i="1"][data-d="1"]').click();
    else {
      await other.locator('[data-act="peBack"]').click();
      await other.locator('[data-act="peOpen"][data-id="day-b"]').click();
      await other.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
    }
    await expect(other.locator('#toast')).toContainText('Plany lub profil zmieniły się w innym oknie');
    const stored = await page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans));
    expect(stored[0].exercises[0].sets).toBe(3);
    if (editScope === 'same day') expect(stored[0].exercises[1].sets).toBe(4);
    else expect(stored[1].exercises[0].sets).toBe(5);
    await other.close();
  });
}

test('program assignment waits behind a day edit lock and commits after release', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [{ id: 'pg_11111111111111111111111111111111', title: 'Synthetic program', dayPlanIds: ['day-a'] }] } }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.evaluate(() => {
    window.lockHeld = false;
    window.lockDone = navigator.locks.request('gymnastika-plan-program-data', async () => {
      window.lockHeld = true;
      await new Promise(resolve => { window.releaseDiagnosticLock = resolve; });
    });
  });
  await page.waitForFunction(() => window.lockHeld);
  const other = await context.newPage();
  await other.goto('/');
  await other.waitForFunction(() => !!window.__gymverseTestHarness);
  await other.locator('#assignedProgram [data-act="stage6Ready"]').click();
  await other.locator('[data-act="programPreview"][data-id="pg_11111111111111111111111111111111"]').click();
  try {
    await other.locator('[data-act="programAssign"]').click();
    await expect.poll(() => page.evaluate(async () => (await navigator.locks.query()).pending.some(lock => lock.name === 'gymnastika-plan-program-data'))).toBe(true);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).profiles[0].planPrograms.assignedProgramId)).toBeNull();
    await page.evaluate(() => window.releaseDiagnosticLock());
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_profiles_v1')).profiles[0].planPrograms.assignedProgramId)).toBe('pg_11111111111111111111111111111111');
  } finally {
    await page.evaluate(async () => { window.releaseDiagnosticLock?.(); await window.lockDone; });
    await other.close();
  }
});

test('deleting a program while its preview is open makes the preview stale without writing', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {}, planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [{ id: 'pg_11111111111111111111111111111111', title: 'Synthetic program', dayPlanIds: ['day-a'] }] } }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  const other = await context.newPage();
  await other.goto('/');
  await other.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.locator('#assignedProgram [data-act="stage6Ready"]').click();
  await page.locator('[data-act="programPreview"][data-id="pg_11111111111111111111111111111111"]').click();
  await other.evaluate(async () => {
    const store = window.__gymverseTestHarness.getStore();
    const snapshot = await store.refreshSnapshot();
    const state = JSON.parse(snapshot.gymverse_profiles_v1);
    const plans = JSON.parse(snapshot.gymverse_plans);
    const { commitProgramProfile, deleteProgram } = await import('./src/features/plans/programs.js');
    await commitProgramProfile(store, state, state.activeProfileId, plans, profile => deleteProgram(profile, 'pg_11111111111111111111111111111111'));
  });
  await page.locator('[data-act="programAssign"]').click();
  await expect(page.locator('#toast')).toContainText('Dane zmieniły się w innym oknie');
  const registry = await page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_profiles_v1));
  expect(registry.profiles[0].planPrograms.programs).toHaveLength(0);
  expect(registry.profiles[0].planPrograms.assignedProgramId).toBeNull();
  await other.close();
});

test('switching profiles while a day editor is open blocks its stale write', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Profile one day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'profile-one', profiles: [
      { id: 'profile-one', name: 'One', data: {} },
      { id: 'profile-two', name: 'Two', data: { gymverse_plans: JSON.stringify([{ id: 'day-b', title: 'Profile two day', exercises: [{ key: 'row_v', sets: 6, target: '8' }] }]) } }
    ] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  const other = await context.newPage();
  await other.goto('/');
  await other.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="day-a"]').click();
  await other.locator('#profileSelect').selectOption('profile-two');
  await other.locator('#profileManage > summary').click();
  const navigation = other.waitForEvent('framenavigated', { predicate: frame => frame === other.mainFrame() });
  await other.locator('[data-act="switchProfile"]').click();
  await navigation;
  await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect(page.locator('#toast')).toContainText('Plany lub profil zmieniły się w innym oknie');
  const latest = await page.evaluate(async () => {
    const snapshot = await window.__gymverseTestHarness.getStore().refreshSnapshot();
    return { plans: JSON.parse(snapshot.gymverse_plans), profiles: JSON.parse(snapshot.gymverse_profiles_v1) };
  });
  expect(latest.profiles.activeProfileId).toBe('profile-two');
  expect(latest.plans).toEqual([{ id: 'day-b', title: 'Profile two day', exercises: [{ key: 'row_v', sets: 6, target: '8' }] }]);
  await other.close();
});

test('IndexedDB tabs reject a stale plan write and preserve the committed record', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }, { key: 'row_v', sets: 4, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {} }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.evaluate(async () => {
    const store = window.__gymverseTestHarness.getStore();
    const preview = await store.previewMigration();
    await store.activateMigration(preview, { sourceExportVerified: true, v5ExportVerified: true });
  });
  await page.reload();
  await page.waitForFunction(() => window.__gymverseTestHarness?.getStore().mode === 'indexeddb');
  const other = await context.newPage();
  await other.goto('/');
  await other.waitForFunction(() => window.__gymverseTestHarness?.getStore().mode === 'indexeddb');
  for (const tab of [page, other]) {
    await tab.locator('[data-act="editPlans"]').click();
    await tab.locator('[data-act="peOpen"][data-id="day-a"]').click();
  }
  await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect.poll(async () => page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans)[0].exercises[0].sets)).toBe(3);
  await other.locator('[data-act="peSets"][data-i="1"][data-d="1"]').click();
  await expect(other.locator('#toast')).toContainText('Plany lub profil zmieniły się w innym oknie');
  const stored = await page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans));
  expect(stored[0].exercises.map(exercise => exercise.sets)).toEqual([3, 4]);
  await other.close();
});

test('plan write failure rolls back, reports failure, and can be retried', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {} }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="day-a"]').click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    let failOnce = true;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gymverse_plans' && failOnce) { failOnce = false; throw new DOMException('synthetic write failure', 'QuotaExceededError'); }
      return original.call(this, key, value);
    };
    window.restoreStorageSetter = () => { Storage.prototype.setItem = original; };
  });
  await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect(page.locator('#toast')).toContainText('Nie zapisano');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].exercises[0].sets)).toBe(2);
  await page.evaluate(() => window.restoreStorageSetter());
  await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect.poll(() => page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans)[0].exercises[0].sets)).toBe(3);
});

test('plan rollback failure is surfaced as uncertain integrity and blocks further writes', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {} }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="day-a"]').click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'gymverse_plans') {
        const sets = JSON.parse(value)[0].exercises[0].sets;
        if (sets === 3) { original.call(this, key, value); throw new DOMException('synthetic post-write failure', 'QuotaExceededError'); }
        if (sets === 2) throw new DOMException('synthetic rollback failure', 'QuotaExceededError');
      }
      return original.call(this, key, value);
    };
  });
  await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect(page.locator('#integrityWarning')).toBeVisible();
  await expect(page.locator('#toast')).toContainText('Integralność danych jest niepewna');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].exercises[0].sets)).toBe(3);
  await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].exercises[0].sets)).toBe(3);
});

test('day editor refuses to save when Web Locks are unavailable', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic day', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {} }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.locator('[data-act="editPlans"]').click();
  await page.locator('[data-act="peOpen"][data-id="day-a"]').click();
  await page.evaluate(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
  await page.locator('[data-act="peSets"][data-i="0"][data-d="1"]').click();
  await expect(page.locator('#toast')).toContainText('nie zapewnia bezpiecznej synchronizacji');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('gymverse_plans'))[0].exercises[0].sets)).toBe(2);
});

test('closing a tab releases its held Web Lock to a waiting tab', async ({ page, context }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  await page.evaluate(() => {
    window.lockHeld = false;
    window.lockDone = navigator.locks.request('gymnastika-plan-program-data', async () => {
      window.lockHeld = true;
      await new Promise(() => {});
    });
  });
  await page.waitForFunction(() => window.lockHeld);
  const waiter = await context.newPage();
  await waiter.goto('/');
  await waiter.waitForFunction(() => !!window.__gymverseTestHarness);
  await waiter.evaluate(() => {
    window.lockAcquired = false;
    window.lockDone = navigator.locks.request('gymnastika-plan-program-data', () => { window.lockAcquired = true; });
  });
  await page.close();
  await waiter.waitForFunction(() => window.lockAcquired);
  await waiter.evaluate(() => window.lockDone);
  await waiter.close();
});

test('ZIP v5 merge waits for the shared lock and writes the imported plan after release', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gymverse_schema', '4');
    localStorage.setItem('gymverse_plans', JSON.stringify([{ id: 'day-a', title: 'Synthetic A', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] }]));
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify({ schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {} }] }));
  });
  await page.reload();
  await page.waitForFunction(() => !!window.__gymverseTestHarness);
  const other = await context.newPage();
  await other.goto('/');
  await other.waitForFunction(() => !!window.__gymverseTestHarness);
  const bytes = await other.evaluate(async () => {
    const { createBackupV5 } = await import('./src/gv-data.js');
    const snapshot = {
      gymverse_history: [],
      gymverse_plans: [
        { id: 'day-a', title: 'Synthetic A', exercises: [{ key: 'bench_flat', sets: 2, target: '8' }] },
        { id: 'day-b', title: 'Imported B', exercises: [{ key: 'row_v', sets: 3, target: '8' }] }
      ],
      gymverse_profiles_v1: { schemaVersion: 1, activeProfileId: 'test-profile', profiles: [{ id: 'test-profile', name: 'Synthetic', data: {} }] }
    };
    return Array.from(new Uint8Array(await (await createBackupV5(snapshot)).arrayBuffer()));
  });
  await other.locator('#importFile').setInputFiles({ name: 'synthetic-stage64.zip', mimeType: 'application/zip', buffer: Buffer.from(bytes) });
  await expect(other.locator('#backupImportPreview')).toBeVisible();
  await page.evaluate(() => {
    window.lockHeld = false;
    window.lockDone = navigator.locks.request('gymnastika-plan-program-data', async () => {
      window.lockHeld = true;
      await new Promise(resolve => { window.releaseDiagnosticLock = resolve; });
    });
  });
  await page.waitForFunction(() => window.lockHeld);
  try {
    await other.locator('[data-backup-choice="merge"]').click();
    await expect.poll(() => page.evaluate(async () => (await navigator.locks.query()).pending.some(lock => lock.name === 'gymnastika-plan-program-data'))).toBe(true);
    const beforeRelease = await page.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans));
    expect(beforeRelease.map(plan => plan.id)).toEqual(['day-a']);
    await page.evaluate(() => window.releaseDiagnosticLock());
    await other.waitForFunction(() => !!window.__gymverseTestHarness);
    const afterRelease = await other.evaluate(async () => JSON.parse((await window.__gymverseTestHarness.getStore().refreshSnapshot()).gymverse_plans));
    expect(afterRelease.map(plan => plan.id)).toEqual(['day-a', 'day-b']);
  } finally {
    await page.evaluate(async () => { window.releaseDiagnosticLock?.(); await window.lockDone; });
    await other.close();
  }
});
