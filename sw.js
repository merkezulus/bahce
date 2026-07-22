/* Scarlet Elma Bahçesi — çevrimdışı önbellek */
const SURUM = "bahce-v2.0";
const DOSYALAR = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== SURUM).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) {
        // Arka planda sessizce güncelle (internet varsa)
        fetch(e.request).then(taze => {
          if (taze && taze.ok) caches.open(SURUM).then(c => c.put(e.request, taze));
        }).catch(() => {});
        return hit;
      }
      return fetch(e.request).then(taze => {
        if (taze && taze.ok && new URL(e.request.url).origin === location.origin) {
          const kopya = taze.clone();
          caches.open(SURUM).then(c => c.put(e.request, kopya));
        }
        return taze;
      }).catch(() =>
        e.request.mode === "navigate" ? caches.match("./index.html") : undefined
      );
    })
  );
});
