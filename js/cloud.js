/* Облако семьи. Игра всегда работает с данными на устройстве, а в облако они уходят, когда есть сеть.
   Сам семейный код на сервер не передаётся, только его SHA-256. Сервер: server/index.py (Yandex Cloud Function).
   Запрос: POST text/plain {op, key, ...}; ответ JSON {ok, ...}. */
'use strict';

/* Адрес облачной функции. Его печатает server/setup_cloud.py; пока пусто — облако выключено и игра работает как раньше */
const CLOUD_FN = 'https://functions.yandexcloud.net/d4e68un4r6mu11dn7uai';
const CLOUD_URL = (() => {
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {   /* проверка на компьютере: dev/kv_server.py */
    try { const u = localStorage.getItem('oreh_dev_cloud'); if (u) return u; } catch (e) { }
  }
  return CLOUD_FN;
})();

const CODE_ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ2345679';   /* без 0, O, 1, I, L и 8 (похожа на B) */
function newFamilyCode() {
  const a = new Uint32Array(8); crypto.getRandomValues(a);
  return Array.from(a, n => CODE_ABC[n % CODE_ABC.length]).join('');
}
const showCode = c => c.slice(0, 4) + '-' + c.slice(4);
/* Код могут набрать русскими буквами: похожие заменяем на латинские */
function cleanCode(s) {
  const ru = { 'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'Р': 'P', 'С': 'C', 'Т': 'T', 'У': 'Y', 'Х': 'X', 'З': '3' };
  return String(s).toUpperCase().replace(/[АВЕКМНРСТУХЗ]/g, c => ru[c]).replace(/[^A-Z0-9]/g, '');
}
const validCode = c => c.length === 8 && [...c].every(ch => CODE_ABC.includes(ch));
/* Как назвать устройство по умолчанию */
function guessDevice() {
  const ua = navigator.userAgent || '';
  const br = /YaBrowser/.test(ua) ? 'Яндекс Браузер' : /Edg\//.test(ua) ? 'Edge' : /Firefox/.test(ua) ? 'Firefox' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'браузер';
  if (/iPad|Tablet|SM-T|Pad/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return { name: 'Планшет', kind: (/Android/.test(ua) ? 'Android' : 'iPad') + ', ' + br };
  if (/iPhone/.test(ua)) return { name: 'Телефон', kind: 'iPhone, ' + br };
  if (/Android/.test(ua)) return { name: 'Телефон', kind: 'Android, ' + br };
  return { name: 'Компьютер', kind: br };
}

const Cloud = (() => {
  let timer = 0, busy = false, again = false, status = 'idle', dirty = false;
  const listeners = [];

  async function keyOf(code) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('orehpatrol:' + code));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  }
  async function call(body) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000);
    try {
      /* text/plain: браузер не шлёт предварительный запрос, меньше мест для сбоя */
      const r = await fetch(CLOUD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), signal: ctl.signal });
      if (r.status === 429) { const e = new Error('limit'); e.limit = true; throw e; }
      if (!r.ok) throw new Error('http ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }
  function myDevice() {
    const g = guessDevice();
    return { name: F.devName || g.name, kind: g.kind, last: Date.now() };
  }
  function localDoc() {
    const states = {};
    F.profiles.forEach(p => {
      if (p.gone) return;
      const st = p.id === F.current ? S : readProfile(p.id);
      if (st) { const { sound, ...data } = st; states[p.id] = data; }   /* звук — настройка устройства */
    });
    const devices = Object.assign({}, F.devices || {});
    if (F.devName) devices[F.device] = myDevice();
    return { v: 2, profiles: F.profiles.map(p => p.gone ? { id: p.id, del: p.del, ch: p.ch, gone: 1 } : p), states, devices };
  }
  /* Вливает документ из облака в данные устройства. Возвращает true, если что-то изменилось */
  function absorb(doc) {
    if (!doc || doc.v !== 2) return false;
    let changed = false;
    for (const rp of doc.profiles) {
      const i = F.profiles.findIndex(p => p.id === rp.id);
      if (i < 0) { F.profiles.push(rp); changed = true; }
      else { const w = newerProfile(F.profiles[i], rp); if (w !== F.profiles[i]) { F.profiles[i] = Object.assign({}, rp); changed = true; } }
      const remote = doc.states[rp.id]; if (!remote || rp.gone) continue;
      const isCur = rp.id === F.current, local = isCur ? S : readProfile(rp.id);
      const merged = local ? mergeStates(local, remote) : normState(remote);
      if (!local || !sameData(local, merged)) changed = true;
      writeJson(profKey(rp.id), merged);
      if (isCur) S = merged;
    }
    /* Устройства: у каждого берём запись с самым поздним сохранением */
    F.devices = F.devices || {};
    for (const [id, d] of Object.entries(doc.devices || {})) if (id !== F.device && (!F.devices[id] || (d.last || 0) > (F.devices[id].last || 0))) F.devices[id] = d;
    if (purgeProfiles()) changed = true;
    if (F.current && (F.profiles.find(p => p.id === F.current) || {}).del) { const nx = liveProfiles()[0]; if (nx) useProfile(nx.id); else { F.current = null; S = fresh(); } changed = true; }
    saveFamily();
    return changed;
  }
  function repaint() {
    const box = document.querySelector('.screen'), top = box ? box.scrollTop : 0;
    if (document.querySelector('.forest')) showMap();
    else if (document.querySelector('.ktiles')) showKidMap();
    else if (document.querySelector('.who')) showWho();
    else if (document.querySelector('.family')) showFamily();
    else return;
    const nb = document.querySelector('.screen'); if (nb) nb.scrollTop = top;
  }
  function setStatus(s) { status = s; listeners.forEach(f => { try { f(); } catch (e) { } }); }
  let running = null;
  /* Сохранить сейчас: если сохранение уже идёт — дождаться его и сохранить ещё раз */
  async function now() { if (running) { await running; } return sync(); }
  async function sync() {
    if (!CLOUD_URL || !F.code) return;
    if (busy) { again = true; return running; }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setStatus('offline'); return; }
    busy = true; clearTimeout(timer);
    let done; running = new Promise(r => { done = r; });
    try {
      const key = await keyOf(F.code), res = await call({ op: 'get', key });
      const changed = absorb(res.doc);
      const doc = localDoc();
      const sent = dirty; dirty = false;
      if (!res.doc || !sameData(doc, res.doc)) { try { await call({ op: 'put', key, doc }); } catch (e) { dirty = dirty || sent; throw e; } }
      F.lastSync = Date.now(); saveFamily();
      setStatus('ok');
      if (changed) repaint();
    } catch (e) { setStatus(e.limit ? 'limit' : navigator.onLine === false ? 'offline' : 'fail'); }
    finally { busy = false; running = null; done(); if (again) { again = false; soon(); } }
  }
  /* После сохранения ждём 45 с: за игру это 1–2 записи в минуту, а не каждое нажатие (бесплатный объём бакета — 10 000 записей в месяц).
     Уход с экрана или закрытие игры отправляет несохранённое сразу. */
  function soon(ms = 45000) { if (!CLOUD_URL || !F.code) return; dirty = true; setStatus(status); clearTimeout(timer); timer = setTimeout(sync, ms); }
  function start() {
    if (!CLOUD_URL) return;
    sync();
    window.addEventListener('online', () => sync());
    window.addEventListener('offline', () => setStatus('offline'));
    document.addEventListener('visibilitychange', () => sync());   /* и при уходе с экрана: отправить несохранённое */
    setInterval(() => { if (dirty || Date.now() - (F.lastSync || 0) > 5 * 60000) sync(); else setStatus(status); }, 60000);
  }
  /* Новая семья на этом устройстве */
  async function create() {
    if (!CLOUD_URL) return 'off';
    F.code = newFamilyCode(); saveFamily(); dirty = true;
    await sync();
    return status === 'ok' ? 'ok' : 'net';
  }
  /* Подключение к семье по коду. Игроки с тем же именем и миром сливаются в одного */
  async function join(code) {
    let res;
    try { res = await call({ op: 'join', key: await keyOf(code) }); } catch (e) { return e.limit ? 'limit' : 'net'; }
    const doc = res.doc;
    if (!doc || doc.v !== 2) return 'none';
    const same = (x, y) => String(x || '').trim().toLowerCase() === String(y || '').trim().toLowerCase();
    for (const lp of [...F.profiles]) {
      if (lp.del || doc.profiles.some(p => p.id === lp.id)) continue;
      const mine = lp.id === F.current ? S : readProfile(lp.id);
      if (!mine || !mine.name) continue;
      const twin = doc.profiles.find(p => !p.del && p.world === lp.world && doc.states[p.id] && same(doc.states[p.id].name, mine.name));
      if (!twin) continue;
      const merged = mergeStates(doc.states[twin.id], mine);
      doc.states[twin.id] = merged;
      F.profiles = F.profiles.filter(p => p.id !== lp.id);
      F.profiles.push(twin);
      writeJson(profKey(twin.id), merged);
      try { localStorage.removeItem(profKey(lp.id)); } catch (e) { }
      if (F.current === lp.id) { F.current = twin.id; S = merged; }
    }
    F.code = code; saveFamily(); dirty = true;
    absorb(doc);
    await sync();
    return 'ok';
  }
  /* Копии в облаке: [{id: 'prev' | 'ГГГГ-ММ-ДД', ts}] */
  async function backups() {
    const res = await call({ op: 'backups', key: await keyOf(F.code) });
    return res.list || [];
  }
  async function backup(id) {
    const res = await call({ op: 'backup', key: await keyOf(F.code), id });
    return res.doc;
  }
  /* Состояние для строки статуса: kind — ok (зелёный), wait (жёлтый), fail (красный), none (облако не подключено) */
  function state() {
    if (!CLOUD_URL) return { kind: 'none', text: 'Прогресс хранится только на этом устройстве' };
    if (!F.code) return { kind: 'none', text: '☁️ Облако не подключено — нажмите, чтобы подключить' };
    if (status === 'offline' || (typeof navigator !== 'undefined' && navigator.onLine === false)) return { kind: 'wait', text: '⏳ Нет интернета — сохранится, когда появится' };
    if (status === 'limit') return { kind: 'fail', text: '⚠️ Слишком много попыток — подождите час' };
    if (status === 'fail') return { kind: 'fail', text: '⚠️ Не сохраняется — нажмите, чтобы повторить' };
    if (!F.lastSync) return { kind: 'wait', text: '⏳ Сохраняю…' };
    return { kind: 'ok', text: `☁️ Сохранено · ${ago(F.lastSync)}${dirty ? ' · сейчас сохраню новое' : ''}` };
  }
  function ago(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'только что';
    if (m < 60) return `${m} ${pl(m, 'минуту', 'минуты', 'минут')} назад`;
    const d = new Date(ts), t = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (dstr(d) === today()) return 'сегодня в ' + t;
    if (dstr(d) === addDays(today(), -1)) return 'вчера в ' + t;
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ' в ' + t;
  }
  return { soon, start, join, create, now, backups, backup, state, ago, doc: localDoc, onChange: f => listeners.push(f), get dirty() { return dirty; } };
})();
