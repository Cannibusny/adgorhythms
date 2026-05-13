var CACHE_NAME = 'adgorhythms-v1';
var OFFLINE_URLS = ['/checkin'];

// On install, cache the shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(OFFLINE_URLS);
    })
  );
  self.skipWaiting();
});

// On activate, clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Network-first for API calls, cache-first for pages
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Cache attendee JSON for offline check-in
  if (url.pathname.includes('/attendees-json')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache stats and recent for offline dashboard
  if (url.pathname.includes('/stats') || url.pathname.includes('/recent')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For navigation requests, try network then cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request) || caches.match('/checkin');
      })
    );
    return;
  }
});
