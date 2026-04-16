const CACHE_NAME = 'control-horas-v2';
const ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Instalar — cachear solo iconos y manifest, NO index.html
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar — limpiar cachés viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — index.html siempre desde red, resto network-first con cache fallback
self.addEventListener('fetch', event => {
  // No cachear peticiones a la API
  if (event.request.url.includes('/api/')) {
    return;
  }

  // index.html — siempre red, sin caché
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Resto — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
