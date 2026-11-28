// ── SGI EDAR — Service Worker v1.0.0 ──────────────────────────
const CACHE = 'sgi-v8';

// Archivos a cachear para funcionamiento offline
const PRECACHE = [
  './',
  './index.html',
  './sms-diario.html',
  './inventarios.html',
  './ruta-colector-edaru.html',
  './simulador-proceso-edari.html',
  './calibraciones.html',
  './procedimiento-cloro-libre.html',
  './procedimiento-dbo5.html',
  './procedimiento-microbiologia.html',
  './procedimiento-sequedad.html',
  './procedimiento-solidos.html',
  './procedimiento-turbidez.html',
  './procedimiento-v30.html',
];

// Instalación: cachear recursos esenciales
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(PRECACHE.map(url => cache.add(url).catch(() => {})))
    )
  );
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first para HTML, cache-first para assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Solo interceptar mismo origen
  if(url.origin !== location.origin) return;

  // Firebase y APIs externas: siempre red
  if(url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;

  // Las páginas HTML se piden siempre al servidor sin pasar por la caché HTTP del navegador
  // (GitHub Pages permite cachearlas 10 min): así cada versión subida se ve al recargar.
  const esHTML = e.request.method === 'GET' && (e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html'));
  // (una petición de navegación no admite opciones: se construye una nueva con la misma URL;
  //  si el servidor redirige, se usa la petición original para no romper la navegación)
  const peticion = esHTML
    ? fetch(e.request.url, { cache: 'no-store', credentials: 'same-origin' })
        .then(r => r.redirected ? fetch(e.request) : r)
        .catch(() => fetch(e.request))
    : fetch(e.request);

  e.respondWith(
    peticion
      .then(res => {
        // Guardar copia fresca en caché si es ok
        if(res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          const clave = esHTML ? (url.origin + url.pathname) : e.request;   // sin ?v= para no acumular copias
          caches.open(CACHE).then(c => c.put(clave, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })) // fallback a caché si sin red
  );
});
