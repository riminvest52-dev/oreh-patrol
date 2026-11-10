/* Офлайн-режим: все файлы игры кэшируются при первом открытии.
   При обновлении игры поменяйте VERSION — телефоны подтянут новую версию. */
const VERSION = 'oreh-v3';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/core.js', './js/t-fund.js', './js/t-lang.js', './js/t-models.js', './js/t-logic.js', './js/t-div.js',
  './js/topics.js', './js/art.js', './js/state.js', './js/cloud.js', './js/ui.js', './js/play.js', './js/screens.js', './js/kid.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Сначала сеть (чтобы получать обновления), без сети — из кэша */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
