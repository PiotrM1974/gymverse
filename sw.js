/* GymVerse – service worker: aplikacja działa offline po pierwszym wejściu. */
const CACHE = 'gymverse-v5';
const SHELL = ['./', 'index.html', 'src/gv-base-b.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u))))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('gymverse-') && k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Strona: najpierw sieć (świeża wersja), w razie braku internetu – kopia z cache.
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('index.html', copy));
          return res;
        })
        .catch(() => caches.open(CACHE).then(c => c.match('index.html').then(r => r || c.match('./'))))
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
