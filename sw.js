// Kill switch for the old Tamagotchi PWA's service worker. This project no
// longer registers a service worker at all, but a browser that still has
// the old one active (from before the game got reset) will keep serving
// its stale cached landscape-only build until something replaces it at
// the same URL. This file's only job is to wipe every cache, unregister
// itself, and hand control back to the network so the next load fetches
// the real, current site.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })()
  );
});
