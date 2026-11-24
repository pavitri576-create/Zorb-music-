const APP_CACHE = 'zorb-shell-v1';
const AUDIO_CACHE = 'zorb-offline-audio-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/songs/neon-blade.mp3',
  '/songs/close-eyes.mp3',
  '/songs/rave.mp3',
  '/songs/metamorphosis.mp3',
  '/songs/murder-in-my-mind.mp3',
  '/songs/sahara.mp3',
  '/songs/lua-na-praca.mp3',
  '/songs/montagem-pegadora.mp3',
  '/songs/heavenly-jumpstyle.mp3',
  '/songs/luz-roja.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url)
            .then((res) => {
              if (res && res.ok) return cache.put(url, res);
              return undefined;
            })
            .catch(() => undefined)
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_CACHE && key !== AUDIO_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network first, fallback cleanly to cached app shell so "Disconnected / Page Not Found" never happens
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(APP_CACHE).then((cache) => cache.put('/', copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match('/')) || (await caches.match('/index.html'));
          return (
            cached ||
            new Response('<!doctype html><html><body style="background:#000;color:#fff"></body></html>', {
              headers: { 'Content-Type': 'text/html' },
            })
          );
        })
    );
    return;
  }

  // Audio files: check offline audio cache first, then app cache, then network
  if (url.pathname.startsWith('/songs/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(APP_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
            }
            return response;
          })
          .catch(() => new Response('', { status: 503, statusText: 'Offline' }));
      })
    );
    return;
  }

  // Static JS/CSS/Image assets: stale-while-revalidate / cache-first fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(APP_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
