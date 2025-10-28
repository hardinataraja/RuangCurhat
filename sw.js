const CACHE_NAME = "ruangcurhat-cache-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch and Cache
self.addEventListener("fetch", (event) => {
  // Abaikan permintaan eksternal (misal ke API atau CDN)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Gunakan cache dulu, lalu fallback ke jaringan
      return (
        response ||
        fetch(event.request)
          .then((res) => {
            if (!res || res.status !== 200 || res.type !== "basic") return res;
            const responseToCache = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return res;
          })
          .catch(() => caches.match("/index.html"))
      );
    })
  );
});

