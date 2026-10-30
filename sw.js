// Service worker: makes the site installable and lets visited pages open offline.
const CACHE = 'hsk-sim-v5';
const CORE = ['/', '/log.js', '/reader.js', '/cert.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  // Leave form submissions, audio (range requests) and other sites alone.
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('.mp3')) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('.vtt')) {
    // Pages and subtitles: always try the network first so updates show up right away.
    e.respondWith(fetch(req)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('/'))));
    return;
  }

  // Images, icons: serve from cache, refresh in the background.
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    });
    return hit || net;
  }));
});
