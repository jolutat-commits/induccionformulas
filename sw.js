const CACHE_NAME = 'induccion-v2'; // Cambié el nombre a v2 para forzar la actualización
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. INSTALACIÓN
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  // Fuerza al Service Worker a tomar el control inmediatamente
  self.skipWaiting(); 
});

// 2. ACTIVACIÓN Y LIMPIEZA DE CACHÉ VIEJA
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si el nombre de la caché no es la actual, bórrala
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ESTRATEGIA: RED PRIMERO, CACHÉ DESPUÉS (Network-First)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si hay internet y la descarga fue exitosa, actualiza la caché
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response; // Devuelve la versión fresquita de internet
      })
      .catch(() => {
        // Si NO hay internet (modo offline), saca los archivos de la caché
        return caches.match(event.request);
      })
  );
});
