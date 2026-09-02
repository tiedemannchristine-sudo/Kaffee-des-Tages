const CACHE = "kaffee-des-tages-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./img/dripper.png",
  "./img/chemex.png",
  "./img/immersion.png",
  "./img/aeropress.png",
  "./img/moka.png",
  "./img/coldbrew.png",
  "./img/espresso.png",
  "./img/turkish.png",
  "./img/batch.png",
  "./img/syphon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const isHtmlPage =
    req.mode === "navigate" ||
    (req.method === "GET" && (req.headers.get("accept") || "").includes("text/html"));

  if (isHtmlPage) {
    // HTML-Seiten: immer zuerst frisch vom Netz laden, Cache nur als Offline-Fallback.
    event.respondWith(
      fetch(req)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Bilder & sonstige Assets: weiterhin schnell aus dem Cache, sonst vom Netz nachladen.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (response.ok && req.url.includes("/img/")) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
