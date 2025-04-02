const CACHE_NAME = 'id-card-cache-v3';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/card.html',
  '/styles.css',
  '/assets/index.js.pobrane',
  '/manifest.json',
  '/assets/index.css',
  'https://i.imgur.com/gC8DDHD.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle iOS Safari specifically
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    // For iOS, serve from cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          return cached || fetch(event.request)
            .then(response => {
              // Cache the response if it's a core asset
              if (CORE_ASSETS.some(asset => event.request.url.includes(asset))) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
              }
              return response;
            });
        })
    );
  } else {
    // For other browsers, network first then cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response if it's a core asset
          if (CORE_ASSETS.some(asset => event.request.url.includes(asset))) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Cache data when app is opened from homescreen
self.addEventListener('message', event => {
  if (event.data.type === 'CACHE_DATA') {
    caches.open(CACHE_NAME)
      .then(cache => cache.put('/app-data', new Response(JSON.stringify(event.data.payload))));
  }
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
