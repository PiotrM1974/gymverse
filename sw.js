/* GymNastika – wersjonowany cache powłoki i atlasu; dane treningowe pozostają osobno. */
const PILOT_URL = new URL(self.location?.href || 'sw.js', self.registration.scope);
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);
const LOCAL_PRESENTATION_PILOT = LOOPBACK_HOSTS.has(PILOT_URL.hostname.toLowerCase()) &&
  PILOT_URL.searchParams.get('local-exercise-presentation-pilot') === '1';
const CACHE = LOCAL_PRESENTATION_PILOT ? 'gymverse-v36-presentation-pilot' : 'gymverse-v15';
const RELEASE_REGISTRY = 'src/data/exercise-presentations/release-registry.json';
const BASE_SHELL = ['./', 'index.html', 'src/gv-base-b.js', 'src/gv-data.js', 'src/exercise/catalog.js', 'src/exercise/presentation-contract.js', 'src/vendor/zip.min.js', 'src/features/anatomy/atlas.js', 'src/features/anatomy/atlas.css', 'src/features/anatomy/highlight-engine.js', 'src/data/anatomy/catalog-mapping.js', 'src/data/anatomy/musclemap-diagrams.js', 'src/data/anatomy/atlas-data.js', 'src/data/anatomy/male-front.js', 'src/data/anatomy/male-back.js', 'src/data/anatomy/female-front.js', 'src/data/anatomy/female-back.js', 'src/data/anatomy/bodies/male-front.webp', 'src/data/anatomy/bodies/male-back.webp', 'src/data/anatomy/bodies/female-front.webp', 'src/data/anatomy/bodies/female-back.webp', 'src/data/anatomy/THIRD-PARTY-NOTICES.md', 'img/p1_5.jpg', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const PRESENTATION_PILOT_SHELL = [
  './?local-exercise-presentation-pilot=1',
  'src/exercise/presentation-contract.js',
  'outputs/GV-EXERCISE-PRESENTATION-CONTRACT-AND-PILOT/local-pilot/presentation-registry.json',
  'outputs/GV-LAT-RAISE-MALE-FEMALE/selected/technique/lat_raise_stand__default-male.webp',
  'outputs/GV-LAT-RAISE-MALE-FEMALE/selected/technique/lat_raise_stand__default-female.webp',
  'outputs/GV-LAT-RAISE-MALE-FEMALE/selected/thumbnails/lat_raise_stand__default-male.webp',
  'outputs/GV-LAT-RAISE-MALE-FEMALE/selected/thumbnails/lat_raise_stand__default-female.webp'
];
const THREE_IMAGE_PILOT_SHELL = ['db_bench', 'lat_pulldown_wide', 'leg_press'].flatMap(id =>
  ['male', 'female'].flatMap(sex => [
    `outputs/GV-EXERCISE-IMAGES-THREE/selected/technique/${id}__default-${sex}.webp`,
    `outputs/GV-EXERCISE-IMAGES-THREE/selected/thumbnails/${id}__default-${sex}.webp`
  ]));
const COMPLETE_IMAGE_PILOT_SHELL = ['bench_flat__default', 'db_incline__default', 'tri_rope__default', 'row_v__default', 'rear_delt__default', 'biceps_preacher__default', 'tri_machine__default', 'leg_curl__default', 'lat_pulldown_neutral__default', 'row_straight__default', 'db_fly__default', 'db_fly__incline', 'front_raise__default', 'lat_raise_seated__default', 'chest_machine__default', 'pec_deck__default', 'shoulder_press__default', 'shoulder_press__dumbbells', 'face_pull__default', 'lat_raise_cable__default', 'hammer_curl__default', 'cable_curl__default', 'tri_overhead__default', 'row_machine__default', 'leg_extension__default', 'tri_overhead__rope', 'smith_squat__default', 'pullup__default', 'dips__default', 'pushup__default'].flatMap(stem =>
  ['male', 'female'].flatMap(sex => [
    `outputs/GV-EXERCISE-IMAGES-COMPLETE/selected/technique/${stem}-${sex}.webp`,
    `outputs/GV-EXERCISE-IMAGES-COMPLETE/selected/thumbnails/${stem}-${sex}.webp`
  ]));
async function installPresentationAssets(cache) {
  if (LOCAL_PRESENTATION_PILOT) {
    const pilotShell = [...PRESENTATION_PILOT_SHELL, ...THREE_IMAGE_PILOT_SHELL, ...COMPLETE_IMAGE_PILOT_SHELL];
    await Promise.all(pilotShell.map(url => cache.add(url)));
    return;
  }

  const registryUrl = new URL(RELEASE_REGISTRY, self.registration.scope);
  const response = await fetch(registryUrl, { cache: 'reload' });
  if (!response.ok) throw new Error('EXERCISE_PRESENTATION_REGISTRY_FETCH_FAILED');
  const registry = await response.clone().json();
  if (registry.presentationContractVersion !== 2 || registry.status !== 'released' || !Array.isArray(registry.records) || registry.records.length !== 34) {
    throw new Error('EXERCISE_PRESENTATION_REGISTRY_INVALID');
  }
  const paths = registry.records.flatMap(record => Object.values(record.bySex || {}).flatMap(views =>
    ['technique', 'thumbnail'].map(view => views?.[view]?.path)));
  if (paths.length !== 136 || paths.some(path => typeof path !== 'string' || !path.startsWith('src/data/exercise-images/selected/') || path.includes('..') || path.includes(':'))) {
    throw new Error('EXERCISE_PRESENTATION_ASSET_LIST_INVALID');
  }
  await cache.put(registryUrl, response.clone());
  await Promise.all(paths.map(path => cache.add(new URL(path, self.registration.scope))));
}

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    await Promise.all(BASE_SHELL.map(url => cache.add(url)));
    await installPresentationAssets(cache);
  }));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('gymverse-') && k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'GYMVERSE_COUNT_APP_CLIENTS' || !event.ports || !event.ports[0]) return;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const scopePath = new URL(self.registration.scope).pathname;
    const appClients = clients.filter(client => {
      try { return new URL(client.url).pathname.startsWith(scopePath); } catch (_) { return false; }
    });
    event.ports[0].postMessage({ type: 'GYMVERSE_APP_CLIENT_COUNT', count: appClients.length });
  }).catch(() => event.ports[0].postMessage({ type: 'GYMVERSE_APP_CLIENT_COUNT', error: true })));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Strona: sieć, a offline wyłącznie powłoka zapisana przez udaną instalację worker'a.
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(req)
        .catch(() => caches.open(CACHE).then(c => c.match(req).then(r => r || c.match('index.html').then(index => index || c.match('./')))))
    );
    return;
  }

  // Obrazki i reszta: z cache, a w tle odświeżenie.
  e.respondWith(
    caches.open(CACHE).then(cache => cache.match(req).then(cached => {
      const net = fetch(req)
        .then(res => {
          if (res && res.ok) { const copy = res.clone(); cache.put(req, copy); }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    }))
  );
});
