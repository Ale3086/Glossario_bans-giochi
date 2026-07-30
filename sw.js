const CACHE_NAME = 'giochi-bans-v3';

const URLS_TO_CACHE = [
  './',
  'index.html',
  'giochi.html',
  'bans.html',
  'admin.html',
  'tokens.css',
  'global.css',
  'components.css',
  'animations.css',
  'app.js',
  'db.js',
  'search.js',
  'manifest.json',
  'favicon.png'
];

// Install Event
self.addEventListener('install', (event) => {
  // skipWaiting is critical so we don't lock the user on an old version
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  // clients.claim immediately controls all open clients
  event.waitUntil(self.clients.claim());
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (like Supabase API calls)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network First, fallback to cache for HTML/JS/CSS (ensures we get updates if online, but works offline)
  // For a pure offline-first PWA, Cache First is often used, but Network First is safer for always getting latest HTML if we change logic
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response and save it to the cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
