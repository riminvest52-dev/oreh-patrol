/* Семейный кабинет: строка «сохранено или нет», код семьи и QR, дети, устройства, резервные копии.
   Открывается из раздела для взрослых (⚙️, удерживать 2 с). */
'use strict';

/* ---------- Статус облака: строка и значок в углу карты ---------- */
const cloudBar = () => { const s = Cloud.state(); return `<button class="cbar ${s.kind}" data-act="cbar" data-cstat="bar">${esc(s.text)}</button>`; };
const cloudDot = () => CLOUD_URL ? `<i class="cdot ${Cloud.state().kind}" data-cstat="dot" aria-hidden="true">☁</i>` : '';
function paintCloud() {
  const s = Cloud.state();
  document.querySelectorAll('[data-cstat]').forEach(el => {
    el.classList.remove('ok', 'wait', 'fail', 'none'); el.classList.add(s.kind);
    if (el.dataset.cstat === 'bar') el.textContent = s.text;
  });
}
Cloud.onChange(paintCloud);
ACT.cbar = async () => {
  if (!CLOUD_URL) return;
  if (!F.code) return showFamily();
  toast('Сохраняю…'); await Cloud.now(); paintCloud();
  const k = Cloud.state().kind; toast(k === 'ok' ? 'Сохранено ☁️' : k === 'wait' ? 'Нет интернета — сохраню позже' : 'Не получилось, попробую ещё раз');
};

/* ---------- Экран «Семья» ---------- */
const fmtDate = ts => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
function withState(st, fn) { const keep = S; S = st; try { return fn(); } finally { S = keep; } }
/* Сводка по ребёнку: звёзды, орешки, минуты за неделю, освоено, что подтянуть */
function childInfo(p) {
  const st = (p.id === F.current ? S : readProfile(p.id)) || fresh();
  const stars = Object.values(st.stars || {}).reduce((s, v) => s + (+v || 0), 0);
  let good = [], weak = [];
  withState(st, () => {
    if (p.world === 'kid' && typeof KID_TOPICS !== 'undefined') {
      const ms = KID_TOPICS.map(T => ({ name: T.name, M: st.mastery[T.id] })).filter(x => x.M && x.M.n >= 2);
      good = ms.filter(x => x.M.m >= 0.8).map(x => x.name);
      weak = ms.filter(x => x.M.m < 0.8).sort((a, b) => a.M.m - b.M.m).slice(0, 3).map(x => x.name);
    } else {
      good = TOPICS.filter(T => { const m = mast(T.id).m; return m !== null && m !== undefined && m >= 0.8; }).map(T => T.name);
      weak = Object.entries(st.skill || {}).filter(([g, M]) => GEN[g] && TOPIC[GEN[g].topic] && M.n >= 2 && M.m < 0.8)
        .sort((a, b) => a[1].m - b[1].m).slice(0, 3).map(([g]) => SKILL[g] || g);
    }
  });
  return { st, stars, good, weak, min: weekMinutes(st) };
}
function childCard(p) {
  const { st, stars, good, weak, min } = childInfo(p), w = WORLDS[p.world] || {};
  if (p.del) {
    const left = Math.max(1, DEL_DAYS - Math.floor((Date.now() - p.del) / 864e5));
    return `<div class="kidcard gone"><div class="kch">${ART.chip(p.hero, 'happy', '', true)}</div><div class="grow"><b>${esc(st.name || 'Без имени')}</b>
      <div class="small muted">Удалён ${fmtDate(p.del)}. Можно вернуть ещё ${left} ${pl(left, 'день', 'дня', 'дней')}.</div>
      <button class="btn ghost" style="margin-top:8px" data-act="kidBack" data-id="${p.id}">↩️ Вернуть</button></div></div>`;
  }
  return `<div class="kidcard"><div class="kch">${ART.chip(p.hero, 'happy', '', true)}</div><div class="grow">
    <div class="kn">${esc(st.name || 'Новый игрок')}${p.id === F.current ? ' <span class="small muted">· играет сейчас</span>' : ''}</div>
    <div class="small muted">${w.title || ''}</div>
    <div class="kstat"><span>★ ${stars}</span><span>${ART.acorn(18)} ${st.acorns}</span><span>⏱ ${min} мин за неделю</span></div>
    <div class="small"><b>Освоено:</b> ${good.length ? esc(good.join(', ')) : '<span class="muted">пока нет</span>'}</div>
    <div class="small"><b>Подтянуть:</b> ${weak.length ? esc(weak.join(', ')) : '<span class="muted">пока нечего</span>'}</div>
    <div class="krow"><button class="btn ghost" data-act="kidName" data-id="${p.id}">Переименовать</button>
      <button class="btn ghost" data-act="kidReset" data-id="${p.id}">Сбросить</button>
      <button class="btn ghost" style="color:var(--red)" data-act="kidDel" data-id="${p.id}">Удалить</button></div></div></div>`;
}
function deviceRows() {
  const me = guessDevice(), rows = [];
  rows.push(`<div class="drow"><div class="grow"><b>${esc(F.devName || me.name)}</b> <span class="small muted">(${esc(me.kind)}) · это устройство</span>
    <div class="small muted">${F.lastSync ? 'последнее сохранение ' + Cloud.ago(F.lastSync) : 'ещё не сохранялось'}</div></div>
    <button class="btn ghost" data-act="devName">Название</button></div>`);
  Object.entries(F.devices || {}).filter(([id]) => id !== F.device).sort((a, b) => (b[1].last || 0) - (a[1].last || 0))
    .forEach(([, d]) => rows.push(`<div class="drow"><div class="grow"><b>${esc(d.name || 'Устройство')}</b> <span class="small muted">(${esc(d.kind || '')})</span>
      <div class="small muted">последнее сохранение ${d.last ? Cloud.ago(d.last) : '—'}</div></div></div>`));
  return rows.join('');
}
function showFamily() {
  const kids = F.profiles.filter(p => !p.gone && (!p.del || Date.now() - p.del <= DEL_DAYS * 864e5));
  const back = F.current ? 'parentBack' : 'who';
  let body;
  if (!CLOUD_URL) body = `<div class="card"><p>Облако семьи пока не включено: прогресс хранится только на этом устройстве. Сохраняйте файл копии (ниже), чтобы ничего не потерять.</p></div>`;
  else if (!F.code) body = `<h3>Код семьи</h3><div class="card"><p>Это устройство ещё не подключено к облаку семьи.</p>
    <button class="btn green block" data-act="enterCode">У нас уже есть код</button>
    <button class="btn ghost block" style="margin-top:10px" data-act="famCreate">Создать код семьи (первое устройство)</button>
    <p class="small muted" style="margin-top:10px">Код создаётся один раз на всю семью. На остальных устройствах его нужно ввести, а не создавать новый.</p></div>`;
  else body = `<h3>Код семьи</h3><div class="card"><div class="famcode">${showCode(F.code)}</div>
    <p class="small muted">Введите этот код один раз на новом телефоне, планшете или в другом браузере — появятся все дети с прогрессом.</p>
    <div class="row"><button class="btn ghost grow" data-act="copyFam">📋 Скопировать</button><button class="btn ghost grow" data-act="famQr">🔳 Показать QR</button></div>
    <button class="btn ghost block" style="margin-top:10px" data-act="enterCode">Подключить к другой семье</button></div>`;
  const devices = CLOUD_URL && F.code ? `<h3 style="margin-top:18px">Устройства</h3><div class="card">${deviceRows()}</div>` : '';
  mount(`<div class="family"><div class="topbar"><button class="iconbtn" data-act="${back}">←</button><div class="grow"><b>Семья</b><div class="small muted">Код, дети, устройства, копии</div></div></div>
    ${cloudBar()}
    ${body}
    <h3 style="margin-top:18px">Дети</h3>${kids.map(childCard).join('') || '<div class="card muted">Пока нет игроков.</div>'}
    <button class="btn ghost block" style="margin-top:10px" data-act="who">＋ Добавить или сменить игрока</button>
    ${devices}
    <h3 style="margin-top:18px">Резервная копия</h3><div class="card">
      ${CLOUD_URL && F.code ? '<button class="btn ghost block" data-act="bakList">🕘 Восстановить состояние на дату…</button>' : ''}
      <button class="btn ghost block" style="margin-top:10px" data-act="bakSave">💾 Скачать файл копии</button>
      <button class="btn ghost block" style="margin-top:10px" data-act="bakLoad">📂 Загрузить из файла</button>
      <p class="small muted" style="margin-top:10px">${CLOUD_URL && F.code ? 'Облако хранит по одной копии на каждый день за 30 дней и предыдущее сохранение.' : ''} Файл копии — запасной путь без облака.</p></div></div>`);
}
ACT.family = () => showFamily();
ACT.parentBack = () => showParent();

/* Создать семью / ввести код */
ACT.famCreate = () => modal(`<h2>Создать код семьи?</h2><p class="muted">Делайте это только на первом устройстве. Если код уже есть на другом телефоне или планшете — введите его, иначе получится вторая семья.</p>
  <div class="stack"><button class="btn green block" data-act="famCreateGo">Создать</button><button class="btn ghost block" data-act="enterCode">У нас уже есть код</button><button class="btn ghost block" data-act="close">Отмена</button></div>`);
ACT.famCreateGo = async () => {
  closeModal(); toast('Создаю…');
  const r = await Cloud.create();
  if (r !== 'ok') toast('Код создан. Сохраню в облако, когда появится связь.', 3000);
  askDeviceName(() => showFamily());
};
ACT.enterCode = () => modal(`<h2>Код семьи</h2><p class="muted small">Прогресс этого устройства объединится с прогрессом семьи: ничего не пропадёт.</p>
  <input class="input" id="fcode" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX">
  <button class="btn green block" style="margin-top:10px" data-act="codeGo">Подключиться</button>
  ${'BarcodeDetector' in window ? '<button class="btn ghost block" style="margin-top:10px" data-act="qrScan">📷 Сканировать QR</button>' : '<p class="small muted" style="margin-top:8px">QR-код можно навести камерой телефона: игра откроется сама и предложит подключиться.</p>'}
  <button class="btn ghost block" style="margin-top:10px" data-act="close">Отмена</button>`);
async function joinCode(code) {
  toast('Подключаюсь…', 4000);
  const r = await Cloud.join(code);
  if (r === 'net') { toast('Нет связи с облаком. Попробуйте позже.', 2600); return false; }
  if (r === 'limit') { toast('Слишком много неверных кодов. Подождите час.', 3200); return false; }
  if (r === 'none') { toast('Такой код не найден. Проверьте его.', 2600); return false; }
  closeModal(); toast('Готово, семья подключена!');
  askDeviceName(() => boot());
  return true;
}
ACT.codeGo = () => {
  const code = cleanCode(document.getElementById('fcode').value);
  if (!validCode(code)) { toast('В коде должно быть 8 знаков'); return; }
  joinCode(code);
};
/* Сканер QR внутри игры — там, где браузер умеет распознавать коды (Android Chrome) */
ACT.qrScan = async () => {
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); }
  catch (e) { toast('Нет доступа к камере'); return; }
  modal(`<h2>Наведите камеру на QR</h2><video id="qrv" playsinline muted style="width:100%;border-radius:14px;background:#000"></video>
    <button class="btn ghost block" style="margin-top:10px" data-act="qrStop">Отмена</button>`);
  const v = document.getElementById('qrv'); v.srcObject = stream; await v.play().catch(() => { });
  const det = new BarcodeDetector({ formats: ['qr_code'] });
  const stop = () => stream.getTracks().forEach(t => t.stop());
  ACT.qrStop = () => { stop(); closeModal(); };
  const loop = async () => {
    if (!document.getElementById('qrv')) return stop();
    try {
      const r = await det.detect(v), m = r[0] && /#fam=([A-Z0-9-]+)/i.exec(r[0].rawValue);
      if (m) { stop(); const c = cleanCode(m[1]); if (validCode(c)) return joinCode(c); }
    } catch (e) { }
    requestAnimationFrame(loop);
  };
  loop();
};
/* Ссылка из QR: ...#fam=ABCD-EFGH (часть после # на сервер не отправляется) */
function takeFam() {
  const m = /^#fam=([A-Za-z0-9-]+)$/.exec(location.hash);
  if (!m) return false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  const code = cleanCode(m[1]);
  if (!CLOUD_URL || !validCode(code)) return false;
  if (F.code === code) { setTimeout(() => toast('Это устройство уже в семье ☁️'), 300); return true; }
  setTimeout(() => modal(`<h2>Подключить к семье?</h2><p>Код семьи: <b>${showCode(code)}</b></p><p class="muted small">Прогресс этого устройства объединится с прогрессом семьи.</p>
    <div class="stack"><button class="btn green block" data-act="famLink" data-code="${code}">Подключить</button><button class="btn ghost block" data-act="close">Отмена</button></div>`), 300);
  return true;
}
ACT.famLink = el => joinCode(el.dataset.code);
ACT.famQr = () => {
  const url = location.origin + location.pathname + '#fam=' + showCode(F.code);
  let svg = '';
  try { const q = qrcode(0, 'M'); q.addData(url); q.make(); svg = q.createSvgTag({ cellSize: 4, margin: 8, scalable: true }); } catch (e) { }
  modal(`<h2>QR-код семьи</h2><div class="qrbox">${svg}</div><p class="small muted center">Наведите камеру нового телефона или планшета: откроется игра и предложит подключиться к семье.</p>
    <div class="famcode">${showCode(F.code)}</div><button class="btn ghost block" data-act="close">Закрыть</button>`);
};
ACT.copyFam = () => { try { navigator.clipboard.writeText(showCode(F.code || '')).then(() => toast('Код скопирован'), () => toast('Не получилось скопировать')); } catch (e) { toast('Не получилось скопировать'); } };

/* Название устройства — при первом подключении к семье */
function askDeviceName(after) {
  ACT.devNameGo = () => {
    const v = (document.getElementById('dn').value || '').trim().slice(0, 30);
    F.devName = v || guessDevice().name; saveFamily(); closeModal(); Cloud.soon(500); after && after();
  };
  modal(`<h2>Как назвать это устройство?</h2><p class="muted small">Так оно будет подписано в списке устройств семьи. Например: «Планшет Лизы», «Телефон мамы».</p>
    <input class="input" id="dn" maxlength="30" value="${esc(F.devName || guessDevice().name)}">
    <button class="btn green block" style="margin-top:10px" data-act="devNameGo">Готово</button>`);
}
ACT.devName = () => askDeviceName(() => showFamily());

/* Дети: переименовать, сбросить, удалить и вернуть */
const kidName = id => ((id === F.current ? S : readProfile(id)) || {}).name || 'игрок';
ACT.kidName = el => modal(`<h2>Новое имя</h2><input class="input" id="kn" maxlength="20" value="${esc(kidName(el.dataset.id))}">
  <button class="btn green block" style="margin-top:10px" data-act="kidNameGo" data-id="${el.dataset.id}">Сохранить</button><button class="btn ghost block" style="margin-top:10px" data-act="close">Отмена</button>`);
ACT.kidNameGo = el => { const v = document.getElementById('kn').value.trim(); if (!v) return toast('Напишите имя'); editProfileState(el.dataset.id, st => { st.name = v.slice(0, 20); }); closeModal(); showFamily(); };
ACT.kidReset = el => modal(`<h2>Сбросить прогресс?</h2><p class="muted">Звёзды, орешки, наклейки и статистика игрока <b>${esc(kidName(el.dataset.id))}</b> обнулятся на всех устройствах семьи. Вернуть можно только из резервной копии.</p>
  <div class="stack"><button class="btn block" style="background:var(--red);box-shadow:0 5px 0 var(--red-d)" data-act="kidResetGo" data-id="${el.dataset.id}">Да, сбросить</button><button class="btn ghost block" data-act="close">Отмена</button></div>`);
ACT.kidResetGo = el => {
  const id = el.dataset.id, isCur = id === F.current, st = resetState((isCur ? S : readProfile(id)) || fresh());
  st._ts = Date.now(); writeJson(profKey(id), st); if (isCur) S = st; Cloud.soon(500); closeModal(); toast('Прогресс сброшен'); showFamily();
};
ACT.kidDel = el => modal(`<h2>Удалить игрока?</h2><p class="muted">Игрок <b>${esc(kidName(el.dataset.id))}</b> пропадёт со всех устройств семьи. 30 дней его можно вернуть здесь же, в разделе «Дети».</p>
  <div class="stack"><button class="btn block" style="background:var(--red);box-shadow:0 5px 0 var(--red-d)" data-act="kidDelGo" data-id="${el.dataset.id}">Да, удалить</button><button class="btn ghost block" data-act="close">Отмена</button></div>`);
ACT.kidDelGo = el => { deleteProfile(el.dataset.id); closeModal(); toast('Игрок удалён. Вернуть можно 30 дней.', 2600); showFamily(); };
ACT.kidBack = el => { undeleteProfile(el.dataset.id); toast('Игрок вернулся!'); showFamily(); };

/* Резервные копии: из облака и файлом */
ACT.bakList = async () => {
  modal('<h2>Резервные копии</h2><p class="muted">Загружаю список…</p>');
  let list;
  try { list = await Cloud.backups(); } catch (e) { modal('<h2>Резервные копии</h2><p>Нет связи с облаком. Попробуйте позже.</p><button class="btn ghost block" data-act="close">Закрыть</button>'); return; }
  const rows = list.map(b => `<button class="btn ghost block" style="margin-top:8px" data-act="bakPick" data-id="${b.id}">${b.id === 'prev' ? 'Предыдущее сохранение' + (b.ts ? ' · ' + Cloud.ago(b.ts) : '') : 'На конец дня ' + new Date(b.id + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}</button>`).join('');
  modal(`<h2>Восстановить на дату</h2><p class="muted small">Прогресс детей станет таким, как был тогда, на всех устройствах семьи.</p>${rows || '<p>Копий пока нет: первая появится завтра.</p>'}
    <button class="btn ghost block" style="margin-top:12px" data-act="close">Отмена</button>`);
};
function confirmRestore(doc, when) {
  const names = (doc.profiles || []).filter(p => !p.gone && doc.states[p.id]).map(p => doc.states[p.id].name || 'без имени');
  ACT.restoreGo = () => {
    try { const n = restoreDoc(doc); closeModal(); toast(`Восстановлено игроков: ${n}`, 2600); Cloud.now(); showFamily(); }
    catch (e) { toast('Копия не подошла 😕'); }
  };
  modal(`<h2>Восстановить?</h2><p>Копия ${esc(when)}: ${esc(names.join(', ')) || '—'}.</p><p class="muted small">Текущий прогресс этих детей заменится на сохранённый в копии на всех устройствах. Другие игроки не изменятся.</p>
    <div class="stack"><button class="btn green block" data-act="restoreGo">Восстановить</button><button class="btn ghost block" data-act="close">Отмена</button></div>`);
}
ACT.bakPick = async el => {
  let doc; try { doc = await Cloud.backup(el.dataset.id); } catch (e) { toast('Нет связи с облаком'); return; }
  if (!doc) { toast('Копия не найдена'); return; }
  confirmRestore(doc, el.dataset.id === 'prev' ? '(предыдущее сохранение)' : 'на ' + new Date(el.dataset.id + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }));
};
ACT.bakSave = () => {
  const data = { t: 'oreh-backup', v: 1, ts: Date.now(), doc: Cloud.doc() };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `oreh-patrol-kopiya-${today()}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Файл копии сохранён');
};
ACT.bakLoad = () => {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => {
    const f = inp.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try { const o = JSON.parse(rd.result); if (o.t !== 'oreh-backup' || !o.doc) throw 0; confirmRestore(o.doc, 'из файла от ' + fmtDate(o.ts)); }
      catch (e) { toast('Это не файл копии «Орехового патруля»'); }
    };
    rd.readAsText(f);
  };
  inp.click();
};

/* Блок в разделе для взрослых: статус и вход в «Семью» */
const familyEntry = () => `${CLOUD_URL ? cloudBar() : ''}<button class="btn gold block" style="margin-top:10px" data-act="family">👨‍👩‍👧 Семья: код, дети, устройства, копии</button>`;

/* Первый запуск на устройстве, где облако ещё не подключено */
const newDeviceCard = () => CLOUD_URL && !F.code ? `<div class="newdev">${F.profiles.length ? 'Прогресс этого устройства пока не сохраняется в облаке.' : 'Это новое устройство.'}
  Если у вашей семьи уже есть код — <button class="btn green" data-act="enterCode">Ввести код</button>
  ${F.profiles.length ? '<div class="small" style="margin-top:8px">Кода ещё нет? <a href="#" data-act="famCreate">Создать код семьи</a></div>' : ''}</div>` : '';
/* Устройство с игроками, но без семьи: раз в неделю спрашиваем взрослого при запуске */
function askCloudOnce() {
  if (!CLOUD_URL || F.code || !liveProfiles().length) return;
  if (F.cloudAsked && Date.now() - F.cloudAsked < 7 * 864e5) return;
  F.cloudAsked = Date.now(); saveFamily();
  modal(`<h2>☁️ Сохранять прогресс в облаке?</h2><p class="muted">Тогда звёзды и орешки не потеряются и будут видны на всех устройствах семьи. Это вопрос для взрослого.</p>
    <div class="stack"><button class="btn green block" data-act="enterCode">У нас уже есть код семьи</button>
    <button class="btn gold block" data-act="famCreate">Создать код семьи</button><button class="btn ghost block" data-act="close">Позже</button></div>`);
}
