import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import releaseRegistry from '../../src/data/exercise-presentations/release-registry.json' with { type: 'json' };

const source = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');

function createWorkerHarness({ cacheNames = ['gymverse-v3', 'gymverse-v4', 'other-app-cache'], offline = false, failAddUrl = null, appClients = [], workerUrl = 'https://gymverse.test/gymverse/sw.js' } = {}) {
  const listeners = {};
  const deleted = [];
  const opened = [];
  const added = [];
  const entries = new Map();
  const network = { offline };
  const scope = new URL('.', workerUrl).href;
  const keyOf = request => {
    const value = typeof request === 'string' ? request : request && (request.url || request.href);
    return value ? new URL(value, scope).href : value;
  };
  const pathOf = request => {
    if (typeof request === 'string') return request;
    const value = typeof request === 'string' ? request : request && (request.url || request.href);
    return new URL(value, scope).pathname.replace(new URL(scope).pathname, '');
  };
  const cache = {
    add: async url => {
      const path = pathOf(url);
      added.push(path);
      if (path === failAddUrl) throw new Error(`failed to cache ${path}`);
      entries.set(keyOf(url), { from: `installed:${url}` });
    },
    put: async (request, response) => { added.push(pathOf(request)); entries.set(keyOf(request), response); },
    match: async request => entries.get(keyOf(request)) || null
  };
  const caches = {
    keys: async () => cacheNames,
    delete: async key => { deleted.push(key); return true; },
    open: async key => { opened.push(key); return cache; },
    match: async () => null
  };
  let skipWaitingCalls = 0;
  let claimCalls = 0;
  const context = {
    self: {
      addEventListener: (name, handler) => { listeners[name] = handler; },
      skipWaiting: async () => { skipWaitingCalls += 1; },
      clients: { claim: async () => { claimCalls += 1; }, matchAll: async () => appClients },
      registration: { scope: 'https://gymverse.test/gymverse/' },
      location: { href: workerUrl }
    },
    caches,
    location: { origin: 'https://gymverse.test' },
    URL,
    fetch: async request => {
      if (network.offline) throw new Error('offline');
      const url = new URL(typeof request === 'string' ? request : request.href, scope);
      if (url.pathname.endsWith('/src/data/exercise-presentations/release-registry.json')) {
        return { ok: true, clone() { return this; }, json: async () => releaseRegistry };
      }
      return { ok: true, clone() { return this; } };
    },
    Promise,
    console
  };
  runInNewContext(source, context);
  return { listeners, deleted, opened, added, entries, setOffline(value) { network.offline = value; }, get skipWaitingCalls() { return skipWaitingCalls; }, get claimCalls() { return claimCalls; }, cache };
}

describe('service worker cache safety', () => {
  it('deletes only previous GymVerse caches and does not take over active clients', async () => {
    const harness = createWorkerHarness();
    let activation;
    harness.listeners.activate({ waitUntil: promise => { activation = promise; } });
    await activation;
    expect(harness.deleted).toEqual(['gymverse-v3', 'gymverse-v4']);
    expect(harness.claimCalls).toBe(0);
  });

  it('does not skip the waiting phase that protects active workouts', async () => {
    const harness = createWorkerHarness();
    let installation;
    harness.listeners.install({ waitUntil: promise => { installation = promise; } });
    await installation;
    expect(harness.skipWaitingCalls).toBe(0);
  });

  it('keeps the app shell and new local helper in the GymVerse cache', async () => {
    const harness = createWorkerHarness();
    let installation;
    harness.listeners.install({ waitUntil: promise => { installation = promise; } });
    await installation;
    expect(harness.opened).toContain('gymverse-v17');
    expect(harness.added).toContain('src/ui/signal.css');
    expect(harness.added).toContain('src/gv-base-b.js');
    expect(harness.added).toContain('src/gv-data.js');
    expect(harness.added).toContain('src/vendor/zip.min.js');
    expect(harness.added).toContain('src/features/anatomy/highlight-engine.js');
    expect(harness.added).toContain('src/data/anatomy/catalog-mapping.js');
    expect(harness.added).toContain('img/p1_5.jpg');
    for (const asset of [
      'src/data/anatomy/bodies/male-front.webp',
      'src/data/anatomy/bodies/male-back.webp',
      'src/data/anatomy/bodies/female-front.webp',
      'src/data/anatomy/bodies/female-back.webp',
      'src/data/anatomy/THIRD-PARTY-NOTICES.md',
      'src/exercise/presentation-contract.js'
    ]) expect(harness.added).toContain(asset);
  });

  it('rejects installation if the critical helper cannot be cached', async () => {
    const harness = createWorkerHarness({ failAddUrl: 'src/gv-base-b.js' });
    let installation;
    harness.listeners.install({ waitUntil: promise => { installation = promise; } });
    await expect(installation).rejects.toThrow('failed to cache src/gv-base-b.js');
  });

  it('pre-caches only the whitelisted production assets in the ordinary worker shell', async () => {
    for (const workerUrl of [
      'https://gymverse.test/gymverse/sw.js',
      'https://gymverse.test/gymverse/sw.js?local-exercise-presentation-pilot=1'
    ]) {
      const harness = createWorkerHarness({ workerUrl });
      let installation;
      harness.listeners.install({ waitUntil: promise => { installation = promise; } });
      await installation;
      expect(harness.opened).toContain('gymverse-v17');
      expect(harness.added).toContain('src/data/exercise-presentations/release-registry.json');
      expect(harness.added.filter(url => url.startsWith('src/data/exercise-images/selected/'))).toHaveLength(136);
      expect(harness.added.every(url => !url.startsWith('outputs/'))).toBe(true);
    }
  });

  it('precaches the exact local pilot assets only on loopback with the explicit worker flag', async () => {
    const harness = createWorkerHarness({ workerUrl: 'http://127.0.0.1:41981/gymverse/sw.js?local-exercise-presentation-pilot=1' });
    let installation;
    harness.listeners.install({ waitUntil: promise => { installation = promise; } });
    await installation;
    expect(harness.opened).toContain('gymverse-v36-presentation-pilot');
    for (const asset of [
      './?local-exercise-presentation-pilot=1',
      'src/exercise/presentation-contract.js',
      'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/local-pilot/presentation-registry.json',
      'outputs/GV-LAT-RAISE-MALE-FEMALE/selected/technique/lat_raise_stand__default-male.webp',
      'outputs/GV-LAT-RAISE-MALE-FEMALE/selected/technique/lat_raise_stand__default-female.webp',
      'outputs/GV-LAT-RAISE-MALE-FEMALE/selected/thumbnails/lat_raise_stand__default-male.webp',
      'outputs/GV-LAT-RAISE-MALE-FEMALE/selected/thumbnails/lat_raise_stand__default-female.webp'
    ]) expect(harness.added).toContain(asset);
    for (const id of ['db_bench', 'lat_pulldown_wide', 'leg_press']) {
      for (const sex of ['male', 'female']) {
        for (const kind of ['technique', 'thumbnails']) {
          expect(harness.added).toContain(`outputs/GV-EXERCISE-IMAGES-THREE/selected/${kind}/${id}__default-${sex}.webp`);
        }
      }
    }
  });

  it('keeps the previous cache when a required release image cannot be cached', async () => {
    const harness = createWorkerHarness({
      failAddUrl: 'src/data/exercise-images/selected/technique/lat_raise_stand__default-male.webp'
    });
    let installation;
    harness.listeners.install({ waitUntil: promise => { installation = promise; } });
    await expect(installation).rejects.toThrow('failed to cache');
    expect(harness.opened).toContain('gymverse-v17');
    expect(harness.deleted).toEqual([]);
    expect(harness.skipWaitingCalls).toBe(0);
  });

  it('serves the installed shell and helper offline after a successful installation', async () => {
    const harness = createWorkerHarness();
    let installation;
    harness.listeners.install({ waitUntil: promise => { installation = promise; } });
    await installation;
    // Switch the simulated network offline only after the install populated its cache.
    harness.setOffline(true);
    let navigation;
    harness.listeners.fetch({
      request: { method: 'GET', url: 'https://gymverse.test/', mode: 'navigate' },
      respondWith: promise => { navigation = promise; }
    });
    await expect(navigation).resolves.toEqual({ from: 'installed:index.html' });
    let helper;
    harness.listeners.fetch({
      request: { method: 'GET', url: 'https://gymverse.test/gymverse/src/gv-base-b.js', mode: 'same-origin' },
      respondWith: promise => { helper = promise; }
    });
    await expect(helper).resolves.toEqual({ from: 'installed:src/gv-base-b.js' });
  });

  it('serves a previously cached legacy image path while offline', async () => {
    const harness = createWorkerHarness({ offline: true });
    const request = { method: 'GET', url: 'https://gymverse.test/img/p1_1.jpg', mode: 'no-cors' };
    const savedImage = { from: 'saved-legacy-image' };
    await harness.cache.put(request, savedImage);
    let response;
    harness.listeners.fetch({ request, respondWith: promise => { response = promise; } });
    await expect(response).resolves.toBe(savedImage);
  });

  it('serves the cached app shell for an offline navigation', async () => {
    const harness = createWorkerHarness({ offline: true });
    const shell = { from: 'cached-index' };
    await harness.cache.put('index.html', shell);
    let response;
    harness.listeners.fetch({
      request: { method: 'GET', url: 'https://gymverse.test/gymverse/', mode: 'navigate' },
      respondWith: promise => { response = promise; }
    });
    await expect(response).resolves.toBe(shell);
  });

  it('counts only GymVerse windows in the service-worker scope for migration safety', async () => {
    const harness = createWorkerHarness({ appClients: [
      { url: 'https://gymverse.test/gymverse/' },
      { url: 'https://gymverse.test/gymverse/history' },
      { url: 'https://gymverse.test/other-app/' }
    ] });
    let response;
    let work;
    harness.listeners.message({
      data: { type: 'GYMVERSE_COUNT_APP_CLIENTS' },
      ports: [{ postMessage: message => { response = message; } }],
      waitUntil: promise => { work = promise; }
    });
    await work;
    expect(response).toEqual({ type: 'GYMVERSE_APP_CLIENT_COUNT', count: 2 });
  });
});
