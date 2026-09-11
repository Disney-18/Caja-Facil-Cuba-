const CACHE = 'caja-facil-cuba-v1';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './inventario.html',
  './contador.html',
  './caja.html',
  './reportes.html',
  './ajustes.html',
  './css/styles.css',
  './js/app.js',
  './js/pos.js',
  './js/inventario.js',
  './js/contador.js',
  './js/caja.js',
  './js/reportes.js',
  './js/ajustes.js',
  './manifest.json'
];

const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/fonts/tabler-icons.woff2',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/fonts/tabler-icons.woff',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/fonts/tabler-icons.ttf'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache =>
        Promise.all([
          cache.addAll(LOCAL_ASSETS),
          Promise.allSettled(
            EXTERNAL_ASSETS.map(url =>
              fetch(url, { mode: 'cors' })
                .then(res => res.ok && cache.put(url, res))
                .catch(() => {})
            )
          )
        ])
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {
          if (res && (res.status === 200 || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          if (req.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});