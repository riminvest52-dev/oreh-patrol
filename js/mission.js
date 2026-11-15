/* Задание 11, часть 2: «Семейная миссия» и «Задачка от сестры».
   Работает только с кодом семьи (облако). Данные — в прогрессе каждого игрока (S.fam), потому что облачная функция хранит только игроков:
     fam.c[понедельник][устройство] — сколько «кирпичиков» игрок принёс в миссию этой недели с этого устройства;
     fam.sent[дата] — задачка, которую школьница отправила младшей сестре в этот день (одна в день);
     fam.got[отправитель:дата] — младшая решила задачку; fam.thx[…] — её «смайлик-спасибо»;
     fam.seen[…] — школьница уже видела уведомление; fam.party[неделя] — праздник уже показан.
   Слияние (mergeFam): по каждому устройству — максимум, остальное — объединение. Так вклад не теряется и не удваивается.
   Веса: Лиза — 1 за ответ «сразу верно», школьный мир — 2 (задачи длиннее); решённая задачка от сестры — +5 каждой. */
'use strict';

const FAM_W = { kid: 1, four: 2, five: 2 }, FAM_GIFT = 5;
/* Миссии недели по кругу. unit — во что превращаются верные ответы, say — что говорит Жёлудик (озвучено) */
const MISSIONS = [
  { id: 'bridge', t: 'Мост через ручей', goal: 300, unit: ['досочка', 'досочки', 'досочек'], e: '🌉', say: 'Семейная миссия: построим мост через ручей! Каждый верный ответ — досочка.' },
  { id: 'garden', t: 'Сад у дуба', goal: 300, unit: ['саженец', 'саженца', 'саженцев'], e: '🌱', say: 'Семейная миссия: посадим сад у старого дуба! Каждый верный ответ — новое деревце.' },
  { id: 'hut', t: 'Домик для ёжика', goal: 320, unit: ['брёвнышко', 'брёвнышка', 'брёвнышек'], e: '🏡', say: 'Семейная миссия: построим домик для ёжика! Каждый верный ответ — брёвнышко.' },
  { id: 'lamps', t: 'Фонарики на празднике', goal: 300, unit: ['фонарик', 'фонарика', 'фонариков'], e: '🏮', say: 'Семейная миссия: зажжём фонарики для праздника! Каждый верный ответ — огонёк.' },
  { id: 'birds', t: 'Кормушки для птиц', goal: 320, unit: ['зёрнышко', 'зёрнышка', 'зёрнышек'], e: '🐦', say: 'Семейная миссия: покормим птиц! Каждый верный ответ — зёрнышко в кормушку.' },
  { id: 'rainbow', t: 'Радуга над лесом', goal: 340, unit: ['капелька', 'капельки', 'капелек'], e: '🌈', say: 'Семейная миссия: раскрасим радугу над лесом! Каждый верный ответ — капелька краски.' },
  { id: 'stars', t: 'Звёзды в небе', goal: 340, unit: ['звёздочка', 'звёздочки', 'звёздочек'], e: '✨', say: 'Семейная миссия: зажжём звёзды в ночном небе! Каждый верный ответ — звёздочка.' }
];
const FAM_SAY = {
  party: 'Ура! Семейная миссия выполнена! Вы с сестрой сделали это вместе!',
  partyS: 'Миссия выполнена! Вы с сестрой — настоящая команда.',
  giftN: 'Тебе задачка от Насти! Нажми на конверт.',
  gift: 'Тебе задачка от сестры! Нажми на конверт.',
  doneN: 'Ура! Ты решила задачку от Насти! Отправь ей смайлик-спасибо.',
  done: 'Ура! Ты решила задачку от сестры! Отправь ей смайлик-спасибо.',
  openN: 'Вот задачка от Насти!',
  open: 'Вот задачка от сестры!',
  thx: 'Спасибо отправлено!',
  near: 'Вместе вы уже совсем близко!'
};

/* ---------- Даты и данные ---------- */
const weekOf = (d = today()) => addDays(d, -((new Date(d + 'T12:00:00').getDay() + 6) % 7));
const missionOf = (w = weekOf()) => MISSIONS[((Math.round((new Date(w + 'T12:00:00') - new Date('2026-01-05T12:00:00')) / 864e5 / 7) % MISSIONS.length) + MISSIONS.length) % MISSIONS.length];
function famOf(st) {
  const f = st.fam = st.fam || {};
  for (const k of ['c', 'sent', 'got', 'thx', 'seen', 'party']) f[k] = f[k] || {};
  return f;
}
const famOn = () => !!(CLOUD_URL && F.code);
/* Игроки семьи с их прогрессом (текущий — из S, остальные — копия на этом устройстве, приходит из облака) */
const famPlayers = () => liveProfiles().filter(p => !p.gone).map(p => ({ p, st: p.id === F.current ? S : readProfile(p.id) })).filter(x => x.st);
const famReady = () => famOn() && famPlayers().length >= 2;
/* Принесла в миссию: верный ответ с первой попытки — вызывается из kid.js и play.js */
function famAdd(n) {
  if (!famOn()) return false;
  const f = famOf(S), w = weekOf(), c = f.c[w] = f.c[w] || {};
  c[F.device] = (c[F.device] || 0) + n;
  for (const k of Object.keys(f.c)) if (k < addDays(w, -56)) delete f.c[k];   /* храним 8 недель */
  return true;
}
/* Вклад каждого игрока за неделю: свои ответы + решённые задачки от сестры (обеим) */
function famTotals(w = weekOf()) {
  const pl = famPlayers(), by = {};
  for (const { p, st } of pl) by[p.id] = Object.values((famOf(st).c[w]) || {}).reduce((a, b) => a + b, 0);
  for (const { p, st } of pl) for (const key of Object.keys(famOf(st).got)) {
    const [from, date] = key.split(':');
    if (weekOf(date) !== w) continue;
    by[p.id] += FAM_GIFT; if (by[from] !== undefined) by[from] += FAM_GIFT;
  }
  /* Один человек в двух мирах (Настя: 4 и 5 класс) — одна полоска */
  const groups = [];
  for (const { p, st } of pl) {
    const nm = String(st.name || '').trim(), g = groups.find(x => nm && x.name.toLowerCase() === nm.toLowerCase());
    if (g) { g.v += by[p.id]; g.kid = g.kid && p.world === 'kid'; } else groups.push({ name: nm || 'игрок', v: by[p.id], kid: p.world === 'kid' });
  }
  return { pl, by, groups, sum: Object.values(by).reduce((a, b) => a + b, 0) };
}
function mergeFam(A, B, R) {
  if (!A.fam && !B.fam) return;
  const x = famOf(Object.assign({}, A, { fam: JSON.parse(JSON.stringify(A.fam || {})) })), y = famOf(Object.assign({}, B, { fam: JSON.parse(JSON.stringify(B.fam || {})) }));
  const r = { c: {}, sent: {}, got: {}, thx: {}, seen: {}, party: {} };
  for (const w of uniq(Object.keys(x.c), Object.keys(y.c))) {
    r.c[w] = {};
    for (const d of uniq(Object.keys(x.c[w] || {}), Object.keys(y.c[w] || {}))) r.c[w][d] = Math.max((x.c[w] || {})[d] || 0, (y.c[w] || {})[d] || 0);
  }
  /* Отправленная задачка: если вдруг с двух устройств в один день — остаётся та, что отправлена раньше */
  for (const k of uniq(Object.keys(x.sent), Object.keys(y.sent))) r.sent[k] = !x.sent[k] ? y.sent[k] : !y.sent[k] ? x.sent[k] : (y.sent[k].ts < x.sent[k].ts ? y.sent[k] : x.sent[k]);
  for (const k of uniq(Object.keys(x.got), Object.keys(y.got))) r.got[k] = Math.min(x.got[k] || Infinity, y.got[k] || Infinity);
  for (const k of uniq(Object.keys(x.seen), Object.keys(y.seen))) r.seen[k] = Math.max(x.seen[k] || 0, y.seen[k] || 0);
  r.thx = Object.assign({}, x.thx, y.thx); r.party = Object.assign({}, x.party, y.party);
  R.fam = r;
}

/* ---------- Картинка миссии: 12 частей появляются по мере вклада ---------- */
const MSEP = '#5B3418';
function missionArt(id, done) {
  const P = [], bg = [];
  const W = (c, s) => `<g class="mp${P.length < done ? ' on' : ''}" style="--d:${P.length}">${s}</g>`;
  const add = s => P.push(W(P.length, s));
  if (id === 'bridge') {
    bg.push(`<path d="M0 150 Q100 135 200 150 T400 150 V220 H0Z" fill="#8FD0EE"/><path d="M0 120 L70 128 L70 220 L0 220Z M330 128 L400 120 L400 220 L330 220Z" fill="#C9A06A" stroke="${MSEP}" stroke-width="2"/>`);
    for (let i = 0; i < 12; i++) { const x = 72 + i * 21.5, y = 126 - Math.sin((i + 0.5) / 12 * Math.PI) * 26; add(`<rect x="${x}" y="${y}" width="19" height="12" rx="2" fill="#B07A45" stroke="${MSEP}" stroke-width="2"/>`); }
  } else if (id === 'garden') {
    bg.push(`<path d="M0 170 Q200 150 400 170 V220 H0Z" fill="#A8D07A"/>`);
    for (let i = 0; i < 12; i++) { const x = 30 + (i % 6) * 68, y = i < 6 ? 150 : 195; add(i % 2 ? `<path d="M${x} ${y} v-18" stroke="#4E8A3A" stroke-width="3"/><circle cx="${x}" cy="${y - 22}" r="7" fill="#F28CA8" stroke="${MSEP}" stroke-width="2"/>`
      : `<rect x="${x - 3}" y="${y - 22}" width="6" height="22" fill="#8A5A30"/><circle cx="${x}" cy="${y - 32}" r="17" fill="#6DB35A" stroke="${MSEP}" stroke-width="2"/>`); }
  } else if (id === 'hut') {
    bg.push(`<path d="M0 190 H400 V220 H0Z" fill="#A8D07A"/>`);
    for (let i = 0; i < 8; i++) add(`<rect x="120" y="${174 - i * 13}" width="160" height="12" rx="6" fill="#B07A45" stroke="${MSEP}" stroke-width="2"/>`);
    add(`<path d="M105 82 L200 30 L200 82Z" fill="#C9532A" stroke="${MSEP}" stroke-width="2"/>`); add(`<path d="M200 30 L295 82 L200 82Z" fill="#C9532A" stroke="${MSEP}" stroke-width="2"/>`);
    add(`<rect x="182" y="140" width="34" height="46" rx="4" fill="#7A4A26" stroke="${MSEP}" stroke-width="2"/>`); add(`<rect x="232" y="112" width="30" height="26" fill="#FFE08A" stroke="${MSEP}" stroke-width="2"/>`);
  } else if (id === 'lamps') {
    bg.push(`<rect width="400" height="220" fill="#3C3A6E"/><path d="M0 50 Q100 100 200 60 T400 60" fill="none" stroke="${MSEP}" stroke-width="2"/>`);
    for (let i = 0; i < 12; i++) { const x = 18 + i * 33, y = 70 + Math.sin(i / 11 * Math.PI * 2) * 18 + (i % 2) * 18; add(`<line x1="${x}" y1="${y - 14}" x2="${x}" y2="${y}" stroke="${MSEP}"/><ellipse cx="${x}" cy="${y + 12}" rx="11" ry="14" fill="${['#F2B33D', '#E8833A', '#F28CA8'][i % 3]}" stroke="${MSEP}" stroke-width="2"/>`); }
  } else if (id === 'birds') {
    bg.push(`<rect x="60" y="60" width="8" height="160" fill="#8A5A30"/><rect x="332" y="60" width="8" height="160" fill="#8A5A30"/><path d="M40 70 L200 40 L360 70Z" fill="#C9532A" stroke="${MSEP}" stroke-width="2"/><rect x="70" y="150" width="260" height="14" fill="#B07A45" stroke="${MSEP}" stroke-width="2"/>`);
    for (let i = 0; i < 12; i++) { const x = 90 + (i % 6) * 44, y = i < 6 ? 140 : 100; add(`<ellipse cx="${x}" cy="${y}" rx="14" ry="11" fill="${['#6AA9E0', '#F2B33D', '#E8833A'][i % 3]}" stroke="${MSEP}" stroke-width="2"/><circle cx="${x + 9}" cy="${y - 9}" r="7" fill="${['#6AA9E0', '#F2B33D', '#E8833A'][i % 3]}" stroke="${MSEP}" stroke-width="2"/><path d="M${x + 15} ${y - 9} l7 2 -7 2" fill="#F2B33D"/>`); }
  } else if (id === 'rainbow') {
    bg.push(`<path d="M0 200 Q200 180 400 200 V220 H0Z" fill="#A8D07A"/>`);
    const C = ['#E5533D', '#F08A3A', '#F2C53D', '#6DB35A', '#4AA3D8', '#7B6CC9'];
    for (let i = 0; i < 12; i++) { const k = i % 6, half = i < 6 ? 'M' : 'L', r = 170 - k * 14; add(i < 6 ? `<path d="M${200 - r} 205 A${r} ${r} 0 0 1 200 ${205 - r}" fill="none" stroke="${C[k]}" stroke-width="13"/>` : `<path d="M200 ${205 - r} A${r} ${r} 0 0 1 ${200 + r} 205" fill="none" stroke="${C[k]}" stroke-width="13"/>`); }
  } else {
    bg.push(`<rect width="400" height="220" fill="#2E2C5A"/><path d="M0 200 Q200 180 400 200 V220 H0Z" fill="#3E5A3A"/>`);
    const pts = [[40, 50], [90, 80], [140, 40], [190, 90], [240, 50], [290, 100], [340, 40], [70, 140], [130, 120], [210, 150], [280, 140], [350, 120]];
    for (const [x, y] of pts) add(`<path d="M${x} ${y - 13} L${x + 4} ${y - 4} L${x + 13} ${y - 4} L${x + 6} ${y + 2} L${x + 9} ${y + 12} L${x} ${y + 6} L${x - 9} ${y + 12} L${x - 6} ${y + 2} L${x - 13} ${y - 4} L${x - 4} ${y - 4}Z" fill="#FFE08A" stroke="${MSEP}" stroke-width="1.5"/>`);
  }
  return `<svg class="msvg" viewBox="0 0 400 220" role="img" aria-label="Картинка миссии">
    <rect width="400" height="220" rx="16" fill="#FFF6E2"/>${bg.join('')}${P.join('')}<rect x="1" y="1" width="398" height="218" rx="16" fill="none" stroke="${MSEP}" stroke-width="3"/></svg>`;
}
const missionParts = (sum, goal) => Math.min(12, Math.floor(sum / goal * 12));

/* ---------- Карточка на главном экране ---------- */
let GIFT_SAID = null;   /* про конверт Жёлудик говорит один раз за запуск */
function missionCard() {
  if (!famReady()) return '';
  const M = missionOf(), T = famTotals(), kid = worldOf() === 'kid';
  setTimeout(missionCheck, 500);
  const gift = kid ? giftFor() : null;
  if (gift && GIFT_SAID !== gift.key && !document.querySelector('#modal:not(.hidden)')) { GIFT_SAID = gift.key; setTimeout(() => { if (document.querySelector('.mgift')) Voice.say(sisName(gift.from) === 'Настя' ? FAM_SAY.giftN : FAM_SAY.gift, 'zh'); }, 1600); }
  const env = gift ? `<button class="mgift" data-act="giftOpen"><span class="menv">💌</span><b>Задачка от ${esc(rodName(sisName(gift.from)))}!</b></button>` : '';
  return `${env}<button class="mcard" data-act="mission"><span class="mce">${M.e}</span><span class="fct"><b>👨‍👩‍👧 Семейная миссия</b>
    <span class="small">${esc(M.t)} · вместе ${Math.min(T.sum, M.goal)} из ${M.goal}${T.sum >= M.goal ? ' ✓' : ''}</span></span></button>`;
}
const sisName = id => { const x = famPlayers().find(q => q.p.id === id); return x ? x.st.name || 'сестры' : 'сестры'; };
/* Склонение имён: «задачка от Насти», «тебе и Насте» */
const rodName = n => /я$/.test(n) ? n.slice(0, -1) + 'и' : /[гкхжшчщ]а$/.test(n) ? n.slice(0, -1) + 'и' : /а$/.test(n) ? n.slice(0, -1) + 'ы' : n;
const datName = n => /[ая]$/.test(n) ? n.slice(0, -1) + 'е' : n;

/* ---------- Экран миссии ---------- */
function showMission() {
  if (typeof K !== 'undefined') K = null; Voice.stop();
  const M = missionOf(), T = famTotals(), kid = worldOf() === 'kid', done = T.sum >= M.goal;
  const bars = T.groups.map(({ name, v, kid: k }) => {
    return `<div class="mrow"><span>${k ? '🌰' : '📘'} <b>${esc(name)}</b> ${/[ая]$/.test(name) ? 'внесла' : 'внёс'}: ${v} ${pl(v, ...M.unit)}</span>
      <div class="bar"><i style="width:${Math.min(100, v / M.goal * 100)}%"></i></div></div>`;
  }).join('');
  const sib = !kid && T.pl.find(x => x.p.world === 'kid');
  const end = addDays(weekOf(), 6), left = Math.max(0, Math.round((new Date(end + 'T23:59:59') - new Date()) / 864e5));
  (kid ? mountKid : mount)(`<div class="topbar"><button class="iconbtn" data-act="map">←</button><div class="grow"><b>👨‍👩‍👧 Семейная миссия</b><div class="small muted">Цель недели · ${left ? `ещё ${left} ${pl(left, 'день', 'дня', 'дней')}` : 'последний день'}</div></div></div>
    <div class="mission"><h2 class="center">${M.e} ${esc(M.t)}</h2>
    ${missionArt(M.id, missionParts(T.sum, M.goal))}
    <div class="mtot">Вместе: <b>${Math.min(T.sum, M.goal)}</b> из ${M.goal} ${pl(M.goal, ...M.unit)}${done ? ' — готово! 🎉' : ''}</div>
    <div class="card">${bars}<p class="small muted">Каждый ответ «сразу верно» — ${pl(1, ...M.unit)} в общую копилку. Решённая задачка от сестры — +${FAM_GIFT} каждой. Новая миссия — в понедельник.</p></div>
    ${sib ? `<button class="btn gold block big" data-act="giftPick">💌 Задачка для ${esc(rodName(sib.st.name || 'сестры'))}</button>` : ''}</div>`);
  if (kid) Voice.say(done ? FAM_SAY.party : T.sum >= M.goal * 0.8 ? FAM_SAY.near : M.say, 'zh');
}
ACT.mission = () => showMission();

/* Праздник (у обеих — на следующем входе) и уведомления о решённых задачках */
function missionCheck() {
  if (!famReady() || document.querySelector('#modal:not(.hidden)') || (typeof FW !== 'undefined' && FW)) return;
  if (!document.querySelector('.mcard')) return;
  const f = famOf(S), kid = worldOf() === 'kid';
  for (const w of [weekOf(), addDays(weekOf(), -7)]) {
    const M = missionOf(w), T = famTotals(w);
    if (T.sum < M.goal || f.party[w]) continue;
    f.party[w] = 1; addColl('fam:' + M.id); save();
    Sound.win(); confetti(40);
    modal(`<div class="center"><div style="font-size:64px">${M.e}</div><h2>Семейная миссия выполнена!</h2>
      <div class="mart">${missionArt(M.id, 12)}</div>
      <p>«${esc(M.t)}» — вы сделали это <b>вместе</b>!</p><p class="mstk">🤝 Новая семейная наклейка: <b>${esc(M.t)}</b></p>
      <button class="btn green block big" data-act="close">Ура! 🎉</button></div>`);
    Voice.say(kid ? FAM_SAY.party : FAM_SAY.partyS, kid ? 'zh' : 'fu');
    return;
  }
  if (kid) return;
  /* Школьнице: младшая решила задачку, пришёл смайлик */
  for (const { p, st } of famPlayers()) {
    if (p.world !== 'kid') continue;
    const g = famOf(st);
    for (const key of Object.keys(g.got)) {
      if (!key.startsWith(F.current + ':')) continue;
      const lvl = g.thx[key] ? 2 : 1;
      if ((f.seen[key] || 0) >= lvl) continue;
      f.seen[key] = lvl; save();
      Sound.ok();
      modal(`<div class="center"><div style="font-size:64px">${g.thx[key] || '💌'}</div><h2>${esc(st.name || 'Сестра')} решила твою задачку!</h2>
        <p>+${FAM_GIFT} в семейную миссию — тебе и ей.</p>${g.thx[key] ? `<p>${esc(st.name || 'Сестра')} говорит спасибо: <span style="font-size:32px">${g.thx[key]}</span></p>` : ''}
        <button class="btn green block" data-act="close">Здорово!</button></div>`);
      return;
    }
  }
}

/* ---------- «Задачка от сестры» ---------- */
/* Генераторы, которые подходят для подарка: выбор из вариантов, без таймера и денег */
const GIFT_OK = t => t && !['flash', 'coins'].includes(t.kind);
function giftChoices(kidSt) {
  const tops = KID_TOPICS.filter(T => !T.game), out = [], used = new Set();
  for (let k = 0; k < 40 && out.length < 3; k++) {
    const T = R.pick(tops); if (used.has(T.id)) continue;
    const d = Math.min(3, 1 + (kidSt.stars[T.id] || 0));
    const t = withState(kidSt, () => makeKid(R.pick(T.gens), d));
    if (!GIFT_OK(t)) continue;
    t.topic = T.id; used.add(T.id); out.push(t);
  }
  return out;
}
let GIFTS = null;
ACT.giftPick = () => {
  const sib = famPlayers().find(x => x.p.world === 'kid'); if (!sib) return;
  const f = famOf(S), sent = f.sent[today()], nm = sib.st.name || 'сестра';
  if (sent) {
    const solved = famOf(sib.st).got[F.current + ':' + today()];
    return modal(`<h2>💌 Задачка на сегодня уже отправлена</h2><p>${solved ? `${esc(nm)} её уже решила! 🎉` : `${esc(nm)} увидит конверт на своём экране.`}</p><p class="muted small">Завтра можно будет отправить новую.</p>
      <button class="btn green block" data-act="close">Хорошо</button>`);
  }
  GIFTS = giftChoices(sib.st);
  mount(`<div class="topbar"><button class="iconbtn" data-act="mission">←</button><div class="grow"><b>💌 Задачка для ${esc(rodName(nm))}</b><div class="small muted">Выбери одну — ${esc(nm)} решит её у себя</div></div></div>
    <div class="gpick">${GIFTS.map((t, i) => `<div class="card gopt"><div class="small muted">${KTOPIC[t.topic].icon} ${esc(KTOPIC[t.topic].name)}</div>
      <div class="gq"><b>${t.text}</b></div><div class="gscene">${t.kind === 'count' ? `<div class="kgrp">${Array.from({ length: t.n }, () => `<span class="kit">${t.e}</span>`).join('')}</div>` : t.scene || ''}</div>
      ${t.opts && t.opts.every(o => String(o.h).length < 60) ? `<div class="gopts">${t.opts.map(o => `<span>${o.h}</span>`).join('')}</div>` : ''}
      <div class="small muted">Ответ: <b>${esc(String(t.ans))}</b></div>
      <button class="btn gold block" data-act="giftSend" data-i="${i}">Отправить эту 💌</button></div>`).join('')}</div>
    <button class="btn ghost block" data-act="giftPick">🔄 Другие задачки</button>`);
};
ACT.giftSend = el => {
  const t = GIFTS && GIFTS[+el.dataset.i]; if (!t) return;
  const sib = famPlayers().find(x => x.p.world === 'kid'); if (!sib) return;
  famOf(S).sent[today()] = { to: sib.p.id, t, ts: Date.now() };
  for (const k of Object.keys(famOf(S).sent)) if (k < addDays(today(), -14)) delete famOf(S).sent[k];
  save(); Cloud.now(); GIFTS = null; Sound.ok();
  toast(`💌 Отправлено! ${sib.st.name || 'Сестра'} увидит конверт на своём экране.`, 2600);
  showMission();
};
/* Младшей: самая ранняя нерешённая задачка за последнюю неделю */
function giftFor() {
  const me = famOf(S);
  for (const { p, st } of famPlayers()) {
    if (p.id === F.current) continue;
    const s = famOf(st).sent;
    for (const d of Object.keys(s).sort()) {
      if (d < addDays(today(), -6) || s[d].to !== F.current) continue;
      const key = p.id + ':' + d;
      if (!me.got[key]) return { key, from: p.id, t: s[d].t };
    }
  }
  return null;
}
ACT.giftOpen = () => {
  const g = giftFor(); if (!g) return showKidMap();
  const t = g.t, nm = sisName(g.from);
  K = { tid: t.topic, step: 1, d: t.d, queue: [t.gen], i: 0, first: 0, acorns: 0, wrongRun: 0, run: 0, miss: 0, preset: t, gift: g.key, from: nm };
  Voice.prefetch(t.topic);
  kidNext();
  /* Сначала «Тебе задачка от Насти!», потом само задание */
  Voice.say(nm === 'Настя' ? FAM_SAY.openN : FAM_SAY.open, 'zh').then(() => { if (K && K.gift && K.t && !K.done) Voice.say(K.t.say, K.t.who || 'nr'); });
};
/* Конец задачки от сестры (вызывается из kidFinish) */
function giftFinish(k) {
  const f = famOf(S);
  if (!f.got[k.gift]) f.got[k.gift] = Date.now();
  giveAcorns(1); save(); Cloud.soon(3000);
  Sound.win(); confetti(24);
  mountKid(`<div class="result">${ART.zhel('cheer')}<h1>Задачка от ${esc(rodName(k.from))} решена!</h1>
    <p style="font-size:20px">+${FAM_GIFT} в семейную миссию — тебе и ${esc(k.from === 'сестры' ? 'сестре' : datName(k.from))}!</p>
    <p style="font-size:20px">Отправь смайлик-спасибо:</p>
    <div class="thx">${['💛', '🤗', '🌸', '😘'].map(e => `<button class="kopt" data-act="giftThx" data-k="${k.gift}" data-e="${e}">${e}</button>`).join('')}</div>
    <div class="stack"><button class="btn ghost block big" data-act="map">На полянку 🌳</button></div></div>`);
  Voice.say(k.from === 'Настя' ? FAM_SAY.doneN : FAM_SAY.done, 'zh');
}
ACT.giftThx = el => {
  famOf(S).thx[el.dataset.k] = el.dataset.e; save(); Cloud.soon(3000);
  document.querySelectorAll('.thx .kopt').forEach(b => { b.disabled = true; b.classList.toggle('right', b === el); });
  Voice.say(FAM_SAY.thx, 'zh'); toast('Спасибо отправлено! ' + el.dataset.e);
};

/* ---------- Раздел для взрослых ---------- */
function missionParent() {
  if (!CLOUD_URL) return '';
  if (!F.code) return `<div class="card mpar"><b>👨‍👩‍👧 Семейная миссия</b><p class="small muted">Общая цель недели для сестёр: каждая вносит вклад из своего мира, без соревнования. Работает через облако семьи.</p>
    <button class="btn gold block" data-act="family">Включите код семьи, чтобы играть вместе</button></div>`;
  if (famPlayers().length < 2) return `<div class="card mpar"><b>👨‍👩‍👧 Семейная миссия</b><p class="small muted">Появится, когда в семье будет два игрока.</p></div>`;
  const M = missionOf(), T = famTotals();
  return `<div class="card mpar"><b>👨‍👩‍👧 Семейная миссия: ${esc(M.t)}</b><p class="small muted">Вместе ${Math.min(T.sum, M.goal)} из ${M.goal}. ${T.groups.map(g => `${esc(g.name)} — ${g.v}`).join(', ')}.
    Вес ответа: Лиза — ${FAM_W.kid}, школьный мир — ${FAM_W.five}; задачка от сестры — +${FAM_GIFT} обеим.</p></div>`;
}

/* Фразы для озвучки (dev/voice/phrases.html) */
function missionPhrases() {
  return MISSIONS.map(m => ['zh', m.say, 'mission']).concat(Object.entries(FAM_SAY).map(([k, v]) => [k === 'partyS' ? 'fu' : 'zh', v, 'mission']));
}
