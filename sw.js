/* Офлайн-режим и быстрый старт при плохой связи.
   - Файлы игры: сначала из кэша (мгновенно), свежая копия скачивается в фоне и пригодится при следующем запуске.
   - index.html: из сети, но ждём не больше 3 секунд, иначе — из кэша.
   При обновлении игры поменяйте VERSION — телефоны скачают все файлы заново одним пакетом. */
const VERSION = 'oreh-v3.3';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/core.js', './js/t-fund.js', './js/t-lang.js', './js/t-models.js', './js/t-logic.js', './js/t-div.js',
  './js/topics.js', './js/art.js', './js/state.js', './js/cloud.js', './js/ui.js', './js/play.js', './js/screens.js', './js/kid.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'
];
const PAGE_TIMEOUT = 3000;

self.addEventListener('install', e => {
  /* cache: 'reload' — мимо HTTP-кэша браузера, чтобы не положить в новую версию старые файлы */
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const fresh = req => fetch(req, { cache: 'no-cache' });
const store = (req, r) => { if (r && r.ok && r.type === 'basic') { const copy = r.clone(); return caches.open(VERSION).then(c => c.put(req, copy)).then(() => r); } return Promise.resolve(r); };
const fromCache = req => caches.match(req, { ignoreSearch: true });

/* Страница-заглушка на самый плохой случай: нет ни сети, ни кэша */
const OFFLINE = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ореховый патруль</title></head><body style="margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
background:#FFF3DE;color:#4A2814;font:600 20px system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box">
<div style="font-size:64px">🍂</div><div>Нет связи с сервером</div><div style="font-size:16px;font-weight:500;opacity:.75">Проверьте интернет и нажмите «Повторить».</div>
<button onclick="location.reload()" style="font:700 20px system-ui,sans-serif;color:#fff;background:#5E9E4A;border:0;border-radius:16px;padding:14px 34px">Повторить</button></body></html>`;
const offlinePage = () => new Response(OFFLINE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

function page(e) {
  const req = e.request;
  const net = fresh(req).then(r => store(req, r));
  const cached = () => fromCache(req).then(r => r || caches.match('./index.html')).then(r => r || caches.match('./'));
  return new Promise(resolve => {
    let done = false;
    const give = r => { if (!done && r) { done = true; resolve(r); } };
    /* Сеть не ответила за 3 секунды — отдаём кэш; если кэша нет, продолжаем ждать сеть */
    const timer = setTimeout(() => cached().then(give), PAGE_TIMEOUT);
    net.then(r => { clearTimeout(timer); give(r); })
      .catch(() => { clearTimeout(timer); cached().then(r => give(r || offlinePage())); });
    e.waitUntil(net.catch(() => null));
  });
}

function asset(e) {
  const req = e.request;
  const net = fresh(req).then(r => store(req, r));
  e.waitUntil(net.catch(() => null));                  /* обновление в фоне */
  return fromCache(req).then(r => r || net);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  e.respondWith(isPage ? page(e) : asset(e));
});
