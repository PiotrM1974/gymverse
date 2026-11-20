import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../../sw.js', import.meta.url), 'utf8');

function createWorkerHarness({ cacheNames = ['gymverse-v3', 'gymverse-v4', 'other-app-cache'], offline = false, failAddUrl = null } = {}) {
  const listeners = {};
  const deleted = [];
  const opened = [];
  const added = [];
  const entries = new Map();
  const network = { offline };
  const keyOf = request => {
    const value = typeof request === 'string' ? request : request && request.url;
    return value && value.startsWith('https://') ? new URL(value).pathname.replace(/^\//, '') : value;
  };
  const cache = {
    add: async url => {
      added.push(url);
      if (url === failAddUrl) throw new Error(`failed to cache ${url}`);
      entries.set(keyOf(url), { from: `installed:${url}` });
    },
    put: async (request, response) => { entries.set(keyOf(request), response); },
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
      clients: { claim: async () => { claimCalls += 1; } }
    },
    caches,
    location: { origin: 'https://gymverse.test' },
    URL,
    fetch: async () => { if (network.offline) throw new Error('offline'); return { ok: true, clone() { return this; } }; },
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
    expect(harness.opened).toContain('gymverse-v5');
    expect(harness.added).toContain('src/gv-base-b.js');
  });

  it('rejects installation if the critical helper cannot be cached', async () => {
    const harness = createWorkerHarness({ failAddUrl: 'src/gv-base-b.js' });
    let installation;
    harness.listeners.install({ waitUntil: promise => { installation = promise; } });
    await expect(installation).rejects.toThrow('failed to cache src/gv-base-b.js');
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
      request: { method: 'GET', url: 'https://gymverse.test/src/gv-base-b.js', mode: 'same-origin' },
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
      request: { method: 'GET', url: 'https://gymverse.test/', mode: 'navigate' },
      respondWith: promise => { response = promise; }
    });
    await expect(response).resolves.toBe(shell);
  });
});
