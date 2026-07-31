// Service Worker de Proyecto Octágono.
// Estrategia: cache-first para el app shell, con actualización en segundo
// plano. Todo el juego (motor, combate, audio sintetizado) es código
// local, así que una vez cacheado funciona 100% sin conexión.

const CACHE_VERSION = "octagono-v1";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/main.css",
  "./js/main.js",
  "./js/engine/loop.js",
  "./js/engine/camera.js",
  "./js/engine/particles.js",
  "./js/engine/input.js",
  "./js/engine/utils.js",
  "./js/data/moves.js",
  "./js/data/archetypes.js",
  "./js/combat/board.js",
  "./js/combat/swipeSystem.js",
  "./js/combat/comboResolver.js",
  "./js/combat/ai.js",
  "./js/combat/combatManager.js",
  "./js/fighters/fighter.js",
  "./js/fighters/animator.js",
  "./js/fighters/fighterRenderer.js",
  "./js/effects/hitEffects.js",
  "./js/effects/screenEffects.js",
  "./js/effects/koEffects.js",
  "./js/audio/audioEngine.js",
  "./js/ui/hud.js",
  "./js/ui/menu.js",
  "./js/ui/screens.js",
  "./js/sprites/fighterShapes.js",
  "./js/animations/moveAnimations.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/favicon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
