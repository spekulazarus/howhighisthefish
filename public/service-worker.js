/* Basic offline service worker for Next.js app */
const CACHE_VERSION = "v1";
const APP_CACHE = `app-cache-\${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",               // app shell
  "/manifest.json",  // PWA manifest
  "/icon.svg",       // app icon (ensure this exists)
  "/offline.html"    // offline fallback page
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Avoid failing install due to a single asset failure
        console.warn("[SW] install error:", err);
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => (key !== APP_CACHE ? caches.delete(key) : Promise.resolve()))
        )
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Strategy:
 * - Navigation requests: network-first with offline fallback to /offline.html.
 * - Same-origin GET asset requests: stale-while-revalidate.
 */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET
  if (req.method !== "GET") return;

  // Navigation requests (HTML pages)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache page for potential offline revisit
          const copy = res.clone();
          caches.open(APP_CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(async () => {
          // Try cached page, then fallback
          const cached = await caches.match(req);
          return cached || (await caches.match("/offline.html"));
        })
    );
    return;
  }

  // Same-origin assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((netRes) => {
            if (netRes && netRes.status === 200) {
              const copy = netRes.clone();
              caches.open(APP_CACHE).then((cache) => cache.put(req, copy));
            }
            return netRes;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
