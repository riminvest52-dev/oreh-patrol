/* Офлайн-режим и быстрый старт при плохой связи.
   - Страница и файлы игры: только из кэша СВОЕЙ версии — никогда не смешиваем старые и новые файлы
     (смесь ломала игру на первом запуске после обновления: новый index.html + старый kid.js).
   - Нового в кэше нет (первый запуск) — из сети, страница ждёт сеть не больше 3 секунд.
   - Обновление: новый sw.js скачивает ВСЕ файлы новой версии одним пакетом, включается сразу,
     а страница (index.html, controllerchange) один раз перезагружается уже целиком новой.
   При обновлении игры поменяйте VERSION. */
const VERSION = 'oreh-v3.9.1';
const FILES = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/core.js', './js/t-fund.js', './js/t-lang.js', './js/t-models.js', './js/t-logic.js', './js/t-div.js',
  './js/topics.js', './js/art.js', './js/art2.js', './js/state.js', './js/cloud.js', './js/ui.js', './js/voice-data.js', './js/voice.js', './js/play.js', './js/t-vol.js', './js/screens.js', './js/vendor/qrcode.js', './js/mult.js', './js/col.js', './js/t4a.js', './js/t4b.js', './js/vpr4.js', './js/topics4.js', './js/family.js', './js/kid.js', './js/k-path.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'
];
const PAGE_TIMEOUT = 3000;
/* Голоса героев — отдельный кэш, он переживает обновления игры: файлы докачиваются по мере открытия тем.
   Папка голоса меняет имя при любой перезаписи, так что файл по одному адресу никогда не меняется. */
const VOICE_CACHE = 'oreh-voice';

self.addEventListener('install', e => {
  /* cache: 'reload' — мимо HTTP-кэша браузера, чтобы не положить в новую версию старые файлы */
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== VOICE_CACHE).map(k => caches.delete(k))))
    .then(pruneVoice).then(() => self.clients.claim()));
});

const fresh = req => fetch(req, { cache: 'no-cache' });
const store = (req, r) => { if (r && r.ok && r.type === 'basic') { const copy = r.clone(); return caches.open(VERSION).then(c => c.put(req, copy)).then(() => r); } return Promise.resolve(r); };
const fromCache = req => caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true }));

/* Страница-заглушка на самый плохой случай: нет ни сети, ни кэша */
const OFFLINE = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ореховый патруль</title></head><body style="margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
background:#FFF3DE;color:#4A2814;font:600 20px system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box">
<div style="font-size:64px">🍂</div><div>Нет связи с сервером</div><div style="font-size:16px;font-weight:500;opacity:.75">Проверьте интернет и нажмите «Повторить».</div>
<button onclick="location.reload()" style="font:700 20px system-ui,sans-serif;color:#fff;background:#5E9E4A;border:0;border-radius:16px;padding:14px 34px">Повторить</button></body></html>`;
const offlinePage = () => new Response(OFFLINE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

function page(e) {
  const req = e.request;
  const cached = () => fromCache(req).then(r => r || fromCache('./index.html')).then(r => r || fromCache('./'));
  return cached().then(hit => hit || pageNet(e, cached));
}
function pageNet(e, cached) {
  const req = e.request;
  const net = fresh(req).then(r => store(req, r));
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

/* Убираем из кэша записи старых папок голоса (их больше нет в js/voice-data.js) */
function pruneVoice() {
  return caches.match('./js/voice-data.js').then(r => r ? r.text() : '').then(js => {
    const m = js.match(/"dirs":\{([^}]*)\}/); if (!m) return;
    const keep = new Set((m[1].match(/"[a-z]+-[0-9a-f]+"/g) || []).map(s => s.slice(1, -1)));
    return caches.open(VOICE_CACHE).then(c => c.keys().then(reqs => Promise.all(reqs.map(q => {
      const d = (new URL(q.url).pathname.match(/\/voice\/([^/]+)\//) || [])[1];
      return d && !keep.has(d) ? c.delete(q) : null;
    }))));
  }).catch(() => null);
}
function voice(e) {
  const req = e.request;
  return caches.open(VOICE_CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && r.ok && r.type === 'basic') c.put(req, r.clone()).catch(() => null);
    return r;
  })));
}

function asset(e) {
  const req = e.request;
  /* без фонового обновления: новая версия приходит только целиком, через смену VERSION */
  return fromCache(req).then(r => r || fresh(req).then(r2 => store(req, r2)));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/preview/')) return;   /* пробная версия нового раздела — всегда из сети, мимо кэша игры */
  if (/\/voice\/[^/]+\/[^/]+\.(ogg|mp3)$/.test(url.pathname)) return e.respondWith(voice(e));
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  e.respondWith(isPage ? page(e) : asset(e));
});
