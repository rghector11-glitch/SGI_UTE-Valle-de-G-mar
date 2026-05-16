const CACHE = 'ute-sgi-v5';
const BASE = '/SGI_UTE-Valle-de-G-mar';
const ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/calibraciones.html',
  BASE + '/simulador-edari.html',
  BASE + '/ruta-colector-edaru.html',
  BASE + '/sms-diario.html',
  BASE + '/inventarios.html',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if(res && res.status === 200 && res.type === 'basic') {
          const toCache = res.clone(); // clone BEFORE returning
          caches.open(CACHE).then(c => c.put(e.request, toCache));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
