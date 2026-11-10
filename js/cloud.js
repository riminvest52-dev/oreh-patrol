/* Облако: один документ на семью. Игра всегда работает с данными на устройстве,
   а сюда они уходят, когда есть сеть. Сам семейный код на сервер не передаётся, только его SHA-256.
   Запрос к серверу: POST text/plain {op:'get',key} или {op:'put',key,doc}; ответ JSON {ok,doc}. */
'use strict';

const CLOUD_URL = (() => {
  if (['localhost', '127.0.0.1'].includes(location.hostname)) {   /* проверка на компьютере: заглушка dev/kv_server.py */
    try { const u = localStorage.getItem('oreh_dev_cloud'); if (u) return u; } catch (e) { }
  }
  return '';   /* адрес облачной функции; пока пусто, облако выключено и игра работает как раньше */
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

const Cloud = (() => {
  let timer = 0, busy = false, again = false, status = 'idle';

  async function keyOf(code) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('orehpatrol:' + code));
    return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
  }
  async function call(body) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000);
    try {
      /* text/plain: браузер не шлёт предварительный запрос, меньше мест для сбоя */
      const r = await fetch(CLOUD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body), signal: ctl.signal });
      if (!r.ok) throw new Error('http ' + r.status);
      return await r.json();
    } finally { clearTimeout(t); }
  }
  function localDoc() {
    const states = {};
    F.profiles.forEach(p => {
      const st = p.id === F.current ? S : readProfile(p.id);
      if (st) { const { sound, ...data } = st; states[p.id] = data; }   /* звук — настройка устройства */
    });
    return { v: 2, profiles: F.profiles, states };
  }
  /* Вливает документ из облака в данные устройства. Возвращает true, если что-то изменилось */
  function absorb(doc) {
    if (!doc || doc.v !== 2) return false;
    let changed = false;
    for (const rp of doc.profiles) {
      if (!F.profiles.some(p => p.id === rp.id)) { F.profiles.push(rp); changed = true; }
      const remote = doc.states[rp.id]; if (!remote) continue;
      const isCur = rp.id === F.current, local = isCur ? S : readProfile(rp.id);
      const merged = local ? mergeStates(local, remote) : normState(remote);
      if (!local || !sameData(local, merged)) changed = true;
      writeJson(profKey(rp.id), merged);
      if (isCur) S = merged;
    }
    saveFamily();
    return changed;
  }
  function repaint() {
    const box = document.querySelector('.screen'), top = box ? box.scrollTop : 0;
    if (document.querySelector('.forest')) showMap(); else if (document.querySelector('.who')) showWho(); else return;
    document.querySelector('.screen').scrollTop = top;
  }
  async function sync() {
    if (!CLOUD_URL) return;
    if (busy) { again = true; return; }
    if (!F.code) { if (!F.profiles.length) return; F.code = newFamilyCode(); saveFamily(); }
    busy = true;
    try {
      const key = await keyOf(F.code), res = await call({ op: 'get', key });
      const changed = absorb(res.doc);
      const doc = localDoc();
      if (!res.doc || !sameData(doc, res.doc)) await call({ op: 'put', key, doc });
      F.lastSync = Date.now(); saveFamily();
      status = 'ok';
      if (changed) repaint();
    } catch (e) { status = 'fail'; }
    finally { busy = false; if (again) { again = false; soon(); } }
  }
  function soon() { if (!CLOUD_URL) return; clearTimeout(timer); timer = setTimeout(sync, 4000); }
  function start() {
    if (!CLOUD_URL) return;
    sync();
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', sync);
  }
  /* Подключение к семье по коду. Игроки с тем же именем и миром сливаются в одного */
  async function join(code) {
    let res;
    try { res = await call({ op: 'get', key: await keyOf(code) }); } catch (e) { return 'net'; }
    const doc = res.doc;
    if (!doc || doc.v !== 2) return 'none';
    const same = (x, y) => String(x || '').trim().toLowerCase() === String(y || '').trim().toLowerCase();
    for (const lp of [...F.profiles]) {
      if (doc.profiles.some(p => p.id === lp.id)) continue;
      const mine = lp.id === F.current ? S : readProfile(lp.id);
      if (!mine || !mine.name) continue;
      const twin = doc.profiles.find(p => p.world === lp.world && doc.states[p.id] && same(doc.states[p.id].name, mine.name));
      if (!twin) continue;
      const merged = mergeStates(doc.states[twin.id], mine);
      doc.states[twin.id] = merged;
      F.profiles = F.profiles.filter(p => p.id !== lp.id);
      F.profiles.push(twin);
      writeJson(profKey(twin.id), merged);
      try { localStorage.removeItem(profKey(lp.id)); } catch (e) { }
      if (F.current === lp.id) { F.current = twin.id; S = merged; }
    }
    F.code = code; saveFamily();
    absorb(doc);
    await sync();
    return 'ok';
  }
  function statusText() {
    const when = F.lastSync ? new Date(F.lastSync).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
    if (status === 'fail') return `Сейчас нет связи с облаком. На этом устройстве всё сохранено${when ? `, в облаке данные от ${when}` : ''}.`;
    return when ? `В облаке сохранено: ${when}` : 'В облако ещё не сохраняли';
  }
  return { soon, start, join, now: sync, statusText };
})();
