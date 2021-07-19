var CACHE_NAME = '2021-07-19 11:13';
var urlsToCache = [
  '/english-words-typing/',
  '/english-words-typing/index.js',
  '/english-words-typing/bgm.mp3',
  '/english-words-typing/cat.mp3',
  '/english-words-typing/correct.mp3',
  '/english-words-typing/end.mp3',
  '/english-words-typing/index.js',
  '/english-words-typing/keyboard.mp3',
  '/english-words-typing/favicon/original.svg',
  'https://marmooo.github.io/fonts/textar-light.woff2',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/simple-keyboard@latest/build/index.js',
  'https://cdn.jsdelivr.net/npm/simple-keyboard@latest/build/css/index.css',
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
    .open(CACHE_NAME)
    .then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
