/* Беличья кладовая — тренажёр таблицы умножения (мир «4 класс», ссылка есть и в «Старом дубе» 5 класса).
   Каждый факт a · b (a, b = 2…9) учится отдельно: интервальное повторение (коробки Лейтнера) и правило
   «выучен = 3 верных с первой попытки в разные дни, каждый не дольше T с» (T — настройка взрослого: 5, 7 или 10 с, по умолчанию 7;
   «золотой» — последние два ответа не дольше T − 2 с). Время меряется тихо, таймер виден только в разминке.
   Прогресс фактов — S.mul, изученные столбики — S.mulCols, рекорд разминки — S.mulBest, порог — S.mulT. Слияние — в mergeStates (state.js). */
'use strict';

const MUL_NUMS = [2, 3, 4, 5, 6, 7, 8, 9];
const MUL_BOX_DAYS = [0, 1, 3, 7, 14];   /* коробка 0 — «ежедневная»: факт спрашиваем каждый день, пока не ответит верно */
const MUL_T_OPTS = [5, 7, 10], MUL_T_DEF = 7;
const MUL_KEEP = 10000;   /* ответы дольше 10 с не запоминаем: при любой настройке они медленные */
const mulT = st => (MUL_T_OPTS.includes((st || S).mulT) ? (st || S).mulT : MUL_T_DEF) * 1000;
const mulKey = (a, b) => a + 'x' + b;
const mulRec = (st, a, b) => ((st || S).mul || {})[mulKey(a, b)] || null;

/* Цвет факта: none — не встречался, learn — учится, know — знает, gold — знает быстро */
/* r — лучшее время за день по дням (только верные с первой попытки, не дольше 10 с). Порог применяется здесь,
   поэтому смена настройки сразу пересчитывает цвета. Медленный (дольше T) день серию не обрывает, но и не считается. */
function mulStatus(rec, st) {
  if (!rec || !rec.n) return 'none';
  const T = mulT(st), r = (rec.r || []).filter(x => x[1] <= T);
  if (r.length >= 5 && r.slice(-2).every(x => x[1] <= T - 2000)) return 'gold';
  if (r.length >= 3) return 'know';
  return 'learn';
}
const mulKnown = (rec, st) => { const s = mulStatus(rec, st); return s === 'know' || s === 'gold'; };
function mulCount(st) {
  const c = { none: 0, learn: 0, know: 0, gold: 0 };
  for (const a of MUL_NUMS) for (const b of MUL_NUMS) c[mulStatus(mulRec(st, a, b), st)]++;
  return c;
}
const mulDue = (rec, day) => !!rec && rec.n > 0 && (rec.due || '') <= (day || today());
const mulDueCount = st => { let n = 0; for (const a of MUL_NUMS) for (const b of MUL_NUMS) if (mulDue(mulRec(st, a, b))) n++; return n; };

/* Ответ по факту. first — с первой попытки, ms — сколько думал (только для первой попытки).
   Правила:
   — неверно → коробка 0, серия «выучен» начинается заново;
   — верно с первой попытки → коробка на ступень выше (если факт уже «пора повторить»), следующий показ через 1, 3, 7, 14 дней;
   — в серию «выучен» идёт лучшее время дня (дни должны быть разными), порог — при подсчёте цвета (mulStatus);
   — z — день последней ошибки: при слиянии ответы раньше этого дня с другого устройства не воскрешают серию. */
function mulAnswer(st, a, b, ok, ms, day) {
  day = day || today();
  st.mul = st.mul || {};
  const k = mulKey(a, b), rec = st.mul[k] || (st.mul[k] = { b: 0, due: day, r: [], n: 0, e: 0 });
  rec.n++; rec.ts = Date.now();
  if (!ok) { rec.e++; rec.b = 0; rec.due = day; rec.r = []; rec.z = day; return rec; }
  if ((rec.due || '') <= day) { rec.b = Math.min(4, rec.b + 1); rec.due = addDays(day, MUL_BOX_DAYS[rec.b]); }
  if (ms <= MUL_KEEP) {
    const last = rec.r[rec.r.length - 1];
    if (last && last[0] === day) last[1] = Math.min(last[1], ms);
    else rec.r.push([day, ms]);
    if (rec.r.length > 6) rec.r = rec.r.slice(-6);
  }
  return rec;
}

/* Слияние прогресса фактов с двух устройств. По каждому примеру:
   — коробка, срок повтора и счётчики — из более свежей записи;
   — ответы по дням (r) — из обеих: за день лучшее время, не больше 6 последних дней;
   — дни раньше последней ошибки (z) не берём: ошибка на любом устройстве начинает серию заново. */
function mergeMulRec(x, y) {
  if (!x) return y; if (!y) return x;
  const nw = (y.ts || 0) > (x.ts || 0) ? y : x, z = [x.z || '', y.z || ''].sort().pop();
  const days = {};
  for (const [d, ms] of [...(x.r || []), ...(y.r || [])]) if (d >= z) days[d] = Math.min(days[d] === undefined ? Infinity : days[d], ms);
  const R = Object.assign({}, nw, { r: Object.keys(days).sort().slice(-6).map(d => [d, days[d]]) });
  if (z) R.z = z;
  return R;
}
function mergeMul(A, B, R) {
  R.mul = {};
  const ma = A.mul || {}, mb = B.mul || {};
  for (const k of new Set([...Object.keys(ma), ...Object.keys(mb)])) R.mul[k] = mergeMulRec(ma[k], mb[k]);
  R.mulCols = Object.assign({}, A.mulCols, B.mulCols);
  R.mulBest = Math.max(A.mulBest || 0, B.mulBest || 0);
  /* Настройка взрослого — с более свежего устройства */
  const nw = (B._ts || 0) > (A._ts || 0) ? B : A, old = nw === A ? B : A;
  if (nw.mulT || old.mulT) R.mulT = nw.mulT || old.mulT;
}

/* ---------- Подсказки-способы (показываем при ошибке, а не сразу ответ) ---------- */
const MUL_PRI = { 1: 0, 10: 0, 2: 1, 5: 1, 9: 2, 4: 2, 3: 3, 6: 4, 7: 4, 8: 4 };
function mulWay(a, b) {
  /* a · b = a, взятое b раз. Способ строим по «удобному» множителю m; n — другой множитель */
  const swap = MUL_PRI[a] < MUL_PRI[b];
  const n = swap ? b : a, m = swap ? a : b, p = n * m;
  const pre = swap ? `Поменяй множители местами: ${a} · ${b} = ${n} · ${m}. ` : '';
  let way;
  if (m === 1) way = `Умножить на 1 — число не меняется: ${n} · 1 = ${n}.`;
  else if (m === 10) way = `Умножить на 10 — приписать ноль: ${n} · 10 = ${n * 10}.`;
  else if (m === 2) way = `×2 — это удвоить: ${n} + ${n} = ${p}.`;
  else if (m === 3) way = `×3 — удвой и прибавь ещё раз: ${n} · 2 = ${n * 2}, ${n * 2} + ${n} = ${p}.`;
  else if (m === 4) way = `×4 — удвой дважды: ${n} · 2 = ${n * 2}, ${n * 2} · 2 = ${p}.`;
  else if (m === 5) way = `×5 — половина от ×10: ${n} · 10 = ${n * 10}, половина — ${p}.`;
  else if (m === 9) way = `×9 — от ×10 отними одно ${n}: ${n} · 10 = ${n * 10}, ${n * 10} − ${n} = ${p}.`;
  else way = `Через соседний пример: ${n} · ${m - 1} = ${n * (m - 1)}, прибавь ещё ${n}: ${n * (m - 1)} + ${n} = ${p}.`;
  return pre + way;
}
const mulWayDiv = (c, a) => `Деление — обратное умножению. Какое число умножить на ${a}, чтобы получилось ${c}? ${a} · ? = ${c}.`;
const mulWayMiss = (b, c) => `Какое число умножить на ${b}, чтобы получилось ${c}? Это деление: ${c} : ${b} = ?`;

/* ---------- Подбор примеров ---------- */
/* Изученные столбики: пройденные в «Учим столбик» и те, где уже есть ответы */
function mulStudied(st) {
  st = st || S;
  const cols = new Set(Object.keys(st.mulCols || {}).map(Number));
  for (const k of Object.keys(st.mul || {})) { const [a] = k.split('x').map(Number); cols.add(a); }
  return MUL_NUMS.filter(c => cols.has(c));
}
/* Факты изученных столбиков (в обе стороны: выучил ×7 — значит и 7 · 4, и 4 · 7) */
function mulPool(st) {
  const cols = mulStudied(st), seen = new Set(), out = [];
  for (const c of cols) for (const k of MUL_NUMS) for (const [a, b] of [[c, k], [k, c]]) {
    const key = mulKey(a, b); if (!seen.has(key)) { seen.add(key); out.push([a, b]); }
  }
  return out;
}
/* Сессия: 70% «на подходе» (сначала те, кого пора повторить, потом новые и жёлтые) + 30% выученных для повторения */
function mulPick(st, n, day) {
  day = day || today();
  const pool = mulPool(st);
  if (!pool.length) return [];
  const known = [], learning = [];
  for (const f of pool) (mulKnown(mulRec(st, f[0], f[1]), st) ? known : learning).push(f);
  const order = list => R.shuffle(list).sort((x, y) => {
    const rx = mulRec(st, x[0], x[1]), ry = mulRec(st, y[0], y[1]);
    const dx = mulDue(rx, day) ? 0 : !rx ? 1 : 2, dy = mulDue(ry, day) ? 0 : !ry ? 1 : 2;
    return dx - dy || ((rx || {}).b || 0) - ((ry || {}).b || 0);
  });
  let nk = Math.min(known.length, Math.round(n * 0.3)), nl = Math.min(learning.length, n - nk);
  nk = Math.min(known.length, n - nl);
  let out = order(learning).slice(0, nl).concat(order(known).slice(0, nk));
  /* Фактов меньше, чем нужно, — повторяем по кругу */
  const base = out.slice();
  while (out.length < n && base.length) out = out.concat(R.shuffle(base)).slice(0, n);
  return R.shuffle(out);
}
const mulDueList = (st, day) => { const r = []; for (const a of MUL_NUMS) for (const b of MUL_NUMS) if (mulDue(mulRec(st, a, b), day)) r.push([a, b]); return r; };

/* ---------- Ореховое дерево: сетка фактов ---------- */
const MUL_COL = { none: '#E2D6C6', learn: '#F5C94A', know: '#6DB04F', gold: '#E9A21A' };
const MUL_TXT = { none: 'не встречался', learn: 'учится', know: 'знает', gold: 'знает быстро' };
function mulGrid(st, small) {
  let h = `<div class="mgrid${small ? ' small' : ''}"><div class="mh">·</div>${MUL_NUMS.map(b => `<div class="mh">${b}</div>`).join('')}`;
  for (const a of MUL_NUMS) {
    h += `<div class="mh">${a}</div>`;
    for (const b of MUL_NUMS) {
      const s = mulStatus(mulRec(st, a, b), st);
      h += `<div class="mc ${s}" ${small ? '' : `data-act="mulFact" data-a="${a}" data-b="${b}"`} title="${a} · ${b}">${s === 'none' ? '' : s === 'gold' ? '★' : ''}</div>`;
    }
  }
  return h + '</div>';
}
function mulLegend(st) {
  const c = mulCount(st);
  return `<div class="mleg"><span><i class="mc none"></i>${c.none}</span><span><i class="mc learn"></i>${c.learn}</span><span><i class="mc know"></i>${c.know}</span><span><i class="mc gold">★</i>${c.gold}</span></div>`;
}
function mulTreeCard(st) {
  const c = mulCount(st), left = 64 - c.gold;
  return `<div class="card mtree">
    <div class="mcrown">${mulGrid(st)}</div><div class="mtrunk"></div>
    ${mulLegend(st)}
    <div class="small center" style="margin-top:6px">${left ? `До <b>золотого дерева</b> осталось ${left} ${pl(left, 'орешек', 'орешка', 'орешков')}` : '🌟 Дерево золотое — вся таблица выучена!'}</div>
    <div class="small muted center">Серый — ещё не встречался · жёлтый — учится · зелёный — знает · золотой — знает быстро</div></div>`;
}
ACT.mulFact = el => {
  const a = +el.dataset.a, b = +el.dataset.b, rec = mulRec(S, a, b), s = mulStatus(rec);
  toast(s === 'none' ? `${a} · ${b} — ещё не встречался` : `${a} · ${b} = ${a * b} — ${MUL_TXT[s]}`);
};
/* Для родителя: самые трудные факты (больше всего ошибок среди невыученных) */
function mulHard(st, k = 3) {
  const list = [];
  for (const a of MUL_NUMS) for (const b of MUL_NUMS) { const r = mulRec(st, a, b); if (r && r.e && !mulKnown(r, st)) list.push([a, b, r.e]); }
  return list.sort((x, y) => y[2] - x[2]).slice(0, k).map(([a, b]) => `${a} · ${b}`);
}
ACT.mulSetT = el => { S.mulT = +el.dataset.t; save(); toast(`Время на быстрый ответ: ${S.mulT} с`); showParent(); };
/* Столбик выучен — все его 8 фактов зелёные или золотые */
const mulColDone = (st, c) => MUL_NUMS.every(k => mulKnown(mulRec(st, c, k), st));
function mulParentCard(st) {
  const c = mulCount(st), hard = mulHard(st, 5), cols = MUL_NUMS.filter(n => mulColDone(st, n));
  return `<div class="card">${mulGrid(st, true)}${mulLegend(st)}
    <div class="small" style="margin-top:6px"><b>Выучены столбики:</b> ${cols.length ? cols.map(n => '×' + n).join(', ') : '<span class="muted">пока нет</span>'}</div>
    <div class="small"><b>Трудные примеры:</b> ${hard.length ? hard.join(', ') : '<span class="muted">пока нет</span>'}</div>
    <div class="small muted" style="margin-top:6px">Пример выучен, когда ребёнок 3 раза в разные дни ответил верно с первой попытки и не дольше ${mulT(st) / 1000} секунд (время меряется незаметно). Золотой — 5 таких ответов, последние два не дольше ${mulT(st) / 1000 - 2} секунд. Рекорд разминки: ${st.mulBest || 0}. Знает ${c.know + c.gold} из 64.</div>
    ${st === S ? `<div class="small" style="margin-top:10px"><b>Время на быстрый ответ:</b></div><div class="row mtset">${MUL_T_OPTS.map(n => `<button class="btn ${mulT(st) === n * 1000 ? 'green' : 'ghost'}" data-act="mulSetT" data-t="${n}">${n} с</button>`).join('')}</div>
    <div class="small muted">Если ребёнок нажимает медленно (планшет, маленький ребёнок) — поставьте 10 с. Цвета дерева пересчитаются сразу.</div>` : ''}</div></div>`;
}

/* ---------- Экран кладовой ---------- */
let MS = null;   /* текущая тренировка */
const MUL_SHEET = [
  '<b>a · b</b> — число a взяли b раз: 7 · 4 = 7 + 7 + 7 + 7 = 28.',
  'Множители можно менять местами: <b>3 · 8 = 8 · 3</b>. Выучил одно — знаешь и другое.',
  '<b>×2</b> — удвоить. <b>×4</b> — удвоить дважды. <b>×3</b> — удвоить и прибавить ещё раз.',
  '<b>×5</b> — половина от ×10: 7 · 5 = 70 : 2 = 35.',
  '<b>×9</b> — от ×10 отнять одно число: 9 · 7 = 70 − 7 = 63.',
  '<b>×6, ×7, ×8</b> — через соседний пример: 7 · 8 = 7 · 7 + 7 = 56.',
  'Деление — обратное умножению: 56 : 7 = 8, потому что 7 · 8 = 56.'
];
function showMul() {
  MS = null; SES = null;
  const c = mulCount(S), green = c.know + c.gold, due = mulDueCount(S), studied = mulStudied(S);
  const cols = MUL_NUMS.map(n => {
    const done = mulColDone(S, n), gold = MUL_NUMS.every(k => mulStatus(mulRec(S, n, k)) === 'gold');
    return `<button class="mcol ${gold ? 'gold' : done ? 'know' : S.mulCols && S.mulCols[n] ? 'learn' : ''}" data-act="mulLearn" data-c="${n}">×${n}</button>`;
  }).join('');
  const none = !studied.length;
  const mode = (act, icon, title, sub, off) => `<button class="mmode${off ? ' off' : ''}" ${off ? 'disabled' : `data-act="${act}"`}><span class="qi">${icon}</span><span><b>${title}</b><span class="small muted">${sub}</span></span></button>`;
  const back = (curProfile() || {}).world === 'five' ? 'mulBack5' : 'map';
  mount(`<div class="topbar"><button class="iconbtn" data-act="${back}" aria-label="Назад">←</button><div class="grow"><b>Беличья кладовая</b><div class="small muted">Тренажёр таблицы умножения</div></div>
      <span class="pill">${ART.acorn(20)}${S.acorns}</span></div>
    <div class="loc-head"><div class="big">${ART.chip('mindal', 'show')}</div><div class="bubble grow"><b>Миндалинка:</b> ${none
      ? 'Белки перепутали свои запасы: в каждом ряду по 7 орехов, а сколько всего — не знают! Начнём с любого столбика таблицы — например, с ×2.'
      : due ? `Пора повторить: ${due} ${pl(due, 'пример', 'примера', 'примеров')}. Каждый орешек на дереве — один пример таблицы. Сделаем всё дерево золотым!`
      : 'Каждый орешек на дереве — один пример таблицы. Сделаем всё дерево золотым!'}</div></div>
    ${mulTreeCard(S)}
    <h3 style="margin:14px 0 6px">Учим столбик</h3><div class="mcols">${cols}</div>
    <div class="small muted" style="margin:4px 2px 0">Сначала картинка, потом по порядку и вперемешку. Зелёный столбик — выучен.</div>
    <h3 style="margin:16px 0 6px">Тренировка</h3>
    <div class="mmodes">
      ${mode('mulMix', '🔀', 'Вперемешку', none ? 'Сначала выучи столбик' : '20 примеров из изученных столбиков', none)}
      ${mode('mulDiv', '➗', 'Деление', none ? 'Сначала выучи столбик' : '56 : 7 — обратные примеры', none)}
      ${mode('mulMiss', '❓', 'Пропущенный множитель', none ? 'Сначала выучи столбик' : '__ · 7 = 56', none)}
      ${mode('mulFast', '⏱️', 'Быстрая разминка', green >= 4 ? `60 секунд · твой рекорд: ${S.mulBest || 0}` : `Откроется, когда будет 4 зелёных орешка (сейчас ${green})`, green < 4)}
    </div>
    <button class="btn gold block" style="margin-top:14px" data-act="mulSheet">📜 Шпаргалка: способы</button>`);
}
ACT.mulOpen = () => showMul();
ACT.mulBack5 = () => showTopic('fund');
ACT.mulSheet = () => modal(`<h2>📜 Как запомнить таблицу</h2><ul style="padding-left:20px">${MUL_SHEET.map(s => `<li>${s}</li>`).join('')}</ul><button class="btn block green" data-act="close">Понятно!</button>`);

/* ---------- Тренировка ---------- */
/* Задание: { kind: 'mul'|'div'|'miss', a, b, pic, rec } — a · b = c; pic — картинка-массив; rec — записывать ли в прогресс фактов */
function mulTask(kind, a, b, opt = {}) {
  const c = a * b;
  const q = kind === 'div' ? `${c} : ${a} = ?` : kind === 'miss' ? `? · ${b} = ${c}` : `${a} · ${b} = ?`;
  const ans = kind === 'div' ? b : kind === 'miss' ? a : c;
  const way = kind === 'div' ? mulWayDiv(c, a) : kind === 'miss' ? mulWayMiss(b, c) : mulWay(a, b);
  return Object.assign({ kind, a, b, q, ans, way, rec: MUL_NUMS.includes(a) && MUL_NUMS.includes(b) }, opt);
}
function mulStart(cfg) {
  MS = Object.assign({ i: 0, ok: 0, acorns: 0, run: 0, input: '', retold: new Set() }, cfg);
  mulNext();
}
function mulRandKind(kind) { return kind === 'mix' ? 'mul' : kind; }
/* ×1 и ×10 — лёгкие примеры, в дерево не входят; в «Вперемешку» и «Разминке» — примерно 1 из 10 */
const mulEasy = () => { const k = R.pick(MUL_NUMS), e = R.pick([1, 10]); return R.chance(0.5) ? [k, e] : [e, k]; };
function mulSession(kind, title, n = 20, list) {
  let facts = list || mulPick(S, n);
  if (!facts.length) { toast('Сначала выучи какой-нибудь столбик 🙂'); return; }
  if (kind === 'mix' && !list) facts = R.shuffle(facts.map((f, i) => i % 10 === 9 ? mulEasy() : f));
  mulStart({ mode: kind, title, queue: facts.map(([a, b]) => mulTask(mulRandKind(kind), a, b)) });
}
ACT.mulMix = () => mulSession('mix', 'Вперемешку');
ACT.mulDiv = () => mulSession('div', 'Деление');
ACT.mulMiss = () => mulSession('miss', 'Пропущенный множитель');
ACT.mulDue = () => {
  const due = mulDueList(S);
  if (!due.length) { toast('Повторять пока нечего — всё по расписанию! 🎉'); return; }
  mulSession('mix', 'Повторение', Math.min(20, due.length), R.shuffle(due).slice(0, 20));
};
/* Учим столбик c: первый раз — картинки по порядку (c · 1 … c · 10), потом вперемешку; дальше — по порядку без картинки и вперемешку */
ACT.mulLearn = el => mulLearn(+el.dataset.c);
function mulLearn(c) {
  const first = !(S.mulCols && S.mulCols[c]);
  const seq = Array.from({ length: 10 }, (_, i) => mulTask('mul', c, i + 1, first ? { pic: true, rec: false } : {}));
  const mix = R.shuffle(MUL_NUMS).map(k => mulTask('mul', c, k));
  mulStart({ mode: 'learn', col: c, title: `Столбик ×${c}`, queue: seq.concat(mix) });
}

/* Картинка-массив: c · k — k рядов по c орехов; слева — сколько уже насчитали рядами */
function mulPic(c, k) {
  const r = 9, gap = 4, w = c * (2 * r + gap), lab = 46, H = k * (2 * r + gap) + 4;
  let s = '';
  for (let i = 0; i < k; i++) {
    const y = 2 + i * (2 * r + gap) + r;
    for (let j = 0; j < c; j++) s += `<circle cx="${lab + j * (2 * r + gap) + r}" cy="${y}" r="${r}" fill="${i === k - 1 ? '#C9772F' : '#A9652E'}" stroke="#6E3E1A" stroke-width="1.5"/><path d="M${lab + j * (2 * r + gap) + r - 5} ${y - 5} q5 -5 10 0" stroke="#F3D3A3" stroke-width="2" fill="none"/>`;
    s += `<text x="${lab - 8}" y="${y + 5}" text-anchor="end" font-size="15" font-weight="800" fill="${i === k - 1 ? '#D9553A' : '#8A5A36'}">${i === k - 1 ? '?' : (i + 1) * c}</text>`;
  }
  return `<div class="marr"><svg viewBox="0 0 ${lab + w} ${H}" style="max-width:${Math.min(100, (lab + w) / 3.2)}%" role="img" aria-label="${k} рядов по ${c}">${s}</svg>
    <div class="small muted">${k} ${pl(k, 'ряд', 'ряда', 'рядов')} по ${c} ${pl(c, 'орешку', 'орешка', 'орешков')}${k > 1 ? ` — к ${(k - 1) * c} прибавь ещё ${c}` : ''}</div></div>`;
}

function mulNext() {
  if (MS.i >= MS.queue.length) return mulFinish();
  Object.assign(MS, { task: MS.queue[MS.i], input: '', tries: 0, done: false, t0: performance.now() });
  mulRender();
}
function mulKeypad(fast) {
  return `<div class="display empty mdisp" id="disp">?</div>
    <div class="keypad big">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button class="key" data-act="mulKey" data-k="${k}">${k}</button>`).join('')}
    <button class="key del" data-act="mulKey" data-k="del" aria-label="Стереть">⌫</button><button class="key" data-act="mulKey" data-k="0">0</button>
    <button class="key ok" data-act="${fast ? 'mulFastCheck' : 'mulCheck'}" aria-label="Проверить">✓</button></div>`;
}
function mulRender() {
  const t = MS.task, pct = (MS.i / MS.queue.length) * 100;
  mount(`<div class="play">
    <div class="playtop"><button class="iconbtn" data-act="mulQuit" aria-label="Выйти">✕</button><div class="progress"><i style="width:${pct}%"></i></div>
      <span class="pill">${ART.acorn(20)}<span>${MS.acorns}</span></span></div>
    <div class="muted small" style="margin:0 0 8px 2px">${esc(MS.title)} · ${MS.i + 1} из ${MS.queue.length}</div>
    <div class="card task center">${t.pic ? mulPic(t.a, t.b) : ''}<div class="mq">${t.q}</div></div>
    <div class="answer" id="ans">${mulKeypad(false)}</div>
    <div id="fb"></div>
    <div class="helper" id="helper">${ART.chip('mindal', 'happy')}<div class="bubble">${t.pic ? 'Считай рядами: каждый новый ряд — ещё ' + t.a + '.' : 'Вспомни ответ и набери его на клавиатуре.'}</div></div></div>`);
}
ACT.mulKey = el => {
  if (!MS || MS.done) return;
  const k = el.dataset.k;
  if (k === 'del') MS.input = MS.input.slice(0, -1);
  else if (MS.input.length < 3) MS.input = (MS.input === '0' ? '' : MS.input) + k;
  const d = document.getElementById('disp');
  d.textContent = MS.input || '?'; d.classList.toggle('empty', !MS.input);
  d.style.borderColor = ''; d.style.background = '';
};
document.addEventListener('keydown', e => {
  if (!MS || MS.done || !document.getElementById('disp')) return;
  if (/^\d$/.test(e.key)) ACT.mulKey({ dataset: { k: e.key } });
  else if (e.key === 'Backspace') ACT.mulKey({ dataset: { k: 'del' } });
  else if (e.key === 'Enter') (MS.mode === 'fast' ? ACT.mulFastCheck : ACT.mulCheck)();
});
/* Учёт ответа в общей статистике игрока (задач решено, история по дням, последние ошибки) */
function mulStat(t, ok, given) {
  S.solved++; if (ok) S.right++;
  const H = S.history[today()] || { n: 0, ok: 0 }; H.n++; if (ok) H.ok++; S.history[today()] = H;
  if (!ok) { S.recent.unshift({ ts: Date.now(), topic: 'mul', q: t.q.replace('?', '…'), given: String(given), right: String(t.ans), ok: false }); S.recent = S.recent.slice(0, 40); }
}
ACT.mulCheck = () => {
  if (!MS || MS.done) return;
  const t = MS.task;
  if (!MS.input) { toast('Сначала набери ответ 🙂'); return; }
  const given = +MS.input, ok = given === t.ans, d = document.getElementById('disp');
  const ms = performance.now() - MS.t0;
  if (MS.tries === 0) {
    const before = { cols: MUL_NUMS.filter(n => mulColDone(S, n)), gold: mulCount(S).gold };
    if (t.rec) mulAnswer(S, t.a, t.b, ok, ms);
    mulStat(t, ok, given);
    if (ok) { MS.ok++; const ac = 1; MS.acorns += ac; giveAcorns(ac); }
    save();
    if (t.rec && ok) mulCelebrate(before);
  }
  if (!ok && MS.tries === 0) {
    MS.tries = 1; MS.input = ''; Sound.bad();
    d.textContent = given; d.style.borderColor = 'var(--red)'; d.style.background = '#FBE0D8';
    setTimeout(() => { if (!MS || MS.done || MS.input) return; d.textContent = '?'; d.classList.add('empty'); d.style.borderColor = ''; d.style.background = ''; }, 900);
    document.getElementById('fb').innerHTML = `<div class="feedback try"><div class="fh">🤔 Не совсем. Попробуй ещё раз!</div></div>`;
    document.getElementById('helper').innerHTML = `${ART.chip('mindal', 'think')}<div class="bubble">💡 ${t.way}</div>`;
    MS.run = 0;
    /* Ошибочный пример вернётся в конце тренировки ещё раз */
    if (t.rec && !MS.retold.has(t.q) && MS.queue.length < 40) { MS.retold.add(t.q); MS.queue.push(Object.assign({}, t, { pic: false })); }
    return;
  }
  MS.done = true;
  d.textContent = given; d.style.borderColor = ok ? 'var(--green)' : 'var(--red)'; d.style.background = ok ? '#E3F4D2' : '#FBE0D8';
  document.querySelector('.keypad').classList.add('hidden');
  const second = MS.tries > 0;
  MS.run = ok && !second ? MS.run + 1 : 0;
  if (ok) Sound.ok(); else Sound.bad();
  const p = ok ? Praise.say(second ? 'second' : MS.run === 5 ? 'streak5' : MS.run === 3 ? 'streak3' : 'ok', 'four') : Praise.say('bad', 'four');
  const fact = t.kind === 'mul' ? `${t.a} · ${t.b} = ${t.a * t.b}` : t.kind === 'div' ? `${t.a * t.b} : ${t.a} = ${t.b}, потому что ${t.a} · ${t.b} = ${t.a * t.b}` : `${t.a} · ${t.b} = ${t.a * t.b}`;
  document.getElementById('fb').innerHTML = ok
    ? `<div class="feedback ok"><div class="fh">${second ? '👍 Получилось со второй попытки!' : `✅ Верно! +1 ${ART.acorn(20)}`}</div><div class="small">${fact}</div></div>`
    : `<div class="feedback bad"><div class="fh">🤔 Запомним этот пример</div><div>Правильный ответ: <b>${fact}</b></div><div class="small" style="margin-top:4px">💡 ${t.way}</div></div>`;
  document.getElementById('fb').insertAdjacentHTML('beforeend', `<button class="btn ${ok ? 'green' : ''} block" style="margin-top:12px" data-act="mulGo">${MS.i + 1 >= MS.queue.length ? 'Готово 🏁' : 'Дальше →'}</button>`);
  const line = p ? esc(p.text) : ok ? R.pick(['Ура! 🎉', 'Молодец!', 'Так держать!', 'Орешек наш! 🌰']) : 'Ничего страшного — этот пример ещё вернётся.';
  document.getElementById('helper').innerHTML = `${ART.chip(p && p.who === 'fu' ? 'funduk' : 'mindal', ok ? 'cheer' : 'show')}<div class="bubble">${line}</div>`;
  /* Верный ответ с первой попытки — сразу дальше, чтобы держать темп */
  if (ok && !second) { const my = MS, i = MS.i; setTimeout(() => { if (MS === my && MS.i === i && MS.done) ACT.mulGo(); }, 1100); }
};
ACT.mulGo = () => { if (!MS) return; MS.i++; mulNext(); };
/* Столбик стал зелёным / всё дерево золотое — особая похвала */
function mulCelebrate(before) {
  const now = MUL_NUMS.filter(n => mulColDone(S, n)).filter(n => !before.cols.includes(n) && !S.medals['mulcol' + n]);
  if (now.length) {
    now.forEach(n => { S.medals['mulcol' + n] = true; }); giveAcorns(5); MS.acorns += 5; save();
    setTimeout(() => { toast(`🌳 Столбик ×${now[0]} стал зелёным! +5 ${ART.acorn(18)}`, 3000); confetti(18); Praise.say('col', 'four'); }, 400);
  }
  if (mulCount(S).gold === 64 && before.gold < 64 && !S.medals.mulgold) {
    S.medals.mulgold = true; giveAcorns(30); save();
    setTimeout(mulGoldScene, 1200);
  }
}
function mulGoldScene() {
  Sound.win(); confetti(40); Praise.say('gold', 'four');
  modal(`<div class="center"><div class="goldtree">🌳</div><h2>Золотое дерево!</h2>
    <p>Все 64 примера таблицы умножения выучены — быстро и без ошибок. Белки устроили праздник в честь тебя!</p>
    <p><span class="pill">+30 ${ART.acorn(20)}</span></p><button class="btn green block" data-act="close">Ура! 🎉</button></div>`);
}
ACT.mulQuit = () => modal(`<h2>Закончить тренировку?</h2><p class="muted">Всё решённое сохранится.</p>
  <div class="stack"><button class="btn green block" data-act="close">Продолжить</button><button class="btn ghost block" data-act="mulQuitYes">Выйти</button></div>`);
ACT.mulQuitYes = () => { closeModal(); const m = MS; MS = null; if (m && m.mode === 'fast') clearInterval(m.timer); markActive(); showMul(); };

function mulFinish() {
  const s = MS; MS = null;
  markActive();
  let bonus = 0, text = '';
  if (s.mode === 'learn') {
    S.mulCols = S.mulCols || {};
    const first = !S.mulCols[s.col]; S.mulCols[s.col] = 1;
    text = first ? `Столбик ×${s.col} пройден! Теперь он будет попадаться во «Вперемешку». Чтобы он стал зелёным, отвечай верно и быстро в разные дни.` : `Повторили столбик ×${s.col}.`;
  }
  if (s.daily) {
    const first = !(S.daily.date === today() && S.daily.done);
    S.daily = { date: today(), done: true }; if (first) { bonus = 10; giveAcorns(10); }
    text = `Задание дня выполнено! Серия: ${streakNow()} ${pl(streakNow(), 'день', 'дня', 'дней')} подряд.`;
  }
  save(); Sound.win(); if (s.ok >= s.queue.length - 2) confetti(16);
  setTimeout(() => Praise.say('level', 'four'), 0);
  const c = mulCount(S);
  showResult({ mood: s.ok >= s.queue.length * 0.7 ? 'cheer' : 'happy', title: s.daily ? 'Задание дня выполнено! 🔥' : 'Тренировка окончена!',
    text: (text ? text + ' ' : '') + `На дереве: зелёных ${c.know}, золотых ${c.gold} из 64.`,
    stars: null, ok: s.ok, n: s.queue.length, acorns: s.acorns + bonus, buttons: [['К дереву 🌳', 'mulOpen', 'green'], ['На карту', 'map', 'ghost']] });
}

/* ---------- Быстрая разминка: 60 секунд, только «зелёные» и «золотые» примеры. Прогресс фактов не меняет, рекорд — только свой ---------- */
ACT.mulFast = () => {
  const facts = []; for (const a of MUL_NUMS) for (const b of MUL_NUMS) if (mulKnown(mulRec(S, a, b))) facts.push([a, b]);
  if (facts.length < 4) { toast('Разминка откроется, когда будет 4 зелёных орешка'); return; }
  MS = { mode: 'fast', title: 'Быстрая разминка', facts, ok: 0, n: 0, input: '', end: Date.now() + 60000, done: false };
  mount(`<div class="play"><div class="playtop"><button class="iconbtn" data-act="mulQuit" aria-label="Выйти">✕</button><div class="progress fastbar"><i id="fbar" style="width:100%"></i></div>
      <span class="pill" id="ftime">60 с</span></div>
    <div class="muted small" style="margin:0 0 8px 2px">Быстрая разминка · верно: <b id="fok">0</b> · твой рекорд: ${S.mulBest || 0}</div>
    <div class="card task center"><div class="mq" id="fq"></div></div>
    <div class="answer" id="ans">${mulKeypad(true)}</div></div>`);
  mulFastNext();
  MS.timer = setInterval(() => {
    if (!MS || MS.mode !== 'fast') return;
    const left = Math.max(0, MS.end - Date.now());
    const bar = document.getElementById('fbar'), tm = document.getElementById('ftime');
    if (bar) bar.style.width = (left / 600) + '%'; if (tm) tm.textContent = Math.ceil(left / 1000) + ' с';
    if (!left) mulFastEnd();
  }, 200);
};
function mulFastNext() {
  const [a, b] = R.chance(0.1) ? mulEasy() : R.pick(MS.facts);
  MS.task = mulTask('mul', a, b); MS.input = '';
  const q = document.getElementById('fq'), d = document.getElementById('disp');
  if (q) q.textContent = MS.task.q;
  if (d) { d.textContent = '?'; d.classList.add('empty'); d.style.borderColor = ''; d.style.background = ''; }
}
ACT.mulFastCheck = () => {
  if (!MS || MS.mode !== 'fast' || MS.done || !MS.input) return;
  const ok = +MS.input === MS.task.ans, d = document.getElementById('disp');
  MS.n++; if (ok) { MS.ok++; Sound.ok(); } else Sound.bad();
  document.getElementById('fok').textContent = MS.ok;
  d.style.borderColor = ok ? 'var(--green)' : 'var(--red)'; d.style.background = ok ? '#E3F4D2' : '#FBE0D8';
  if (!ok) d.textContent = `${MS.task.a} · ${MS.task.b} = ${MS.task.ans}`;
  MS.done = true; const my = MS;
  setTimeout(() => { if (MS === my) { MS.done = false; mulFastNext(); } }, ok ? 250 : 1200);
};
function mulFastEnd() {
  const s = MS; MS = null; clearInterval(s.timer);
  const prev = S.mulBest || 0, rec = s.ok > prev;
  if (rec) S.mulBest = s.ok;
  const ac = Math.min(10, Math.floor(s.ok / 3)); giveAcorns(ac);
  S.solved += s.n; S.right += s.ok;
  const H = S.history[today()] || { n: 0, ok: 0 }; H.n += s.n; H.ok += s.ok; S.history[today()] = H;
  save(); markActive(); Sound.win(); if (rec) confetti(20);
  showResult({ mood: rec ? 'cheer' : 'happy', title: rec ? 'Новый рекорд! 🏆' : 'Разминка окончена!',
    text: rec ? (prev ? `Было ${prev}, стало ${s.ok}. Быстрее, чем раньше!` : 'Первый рекорд записан. В следующий раз попробуй побить его!') : `Твой рекорд — ${prev}. Сегодня — ${s.ok}. Попробуй ещё раз!`,
    stars: null, ok: s.ok, n: s.n, acorns: ac, buttons: [['Ещё раз', 'mulFast', 'green'], ['К дереву 🌳', 'mulOpen', 'ghost']] });
}

/* ---------- Мир «4 класс»: карта, быстрые карточки, задание дня ---------- */
/* Часть 1 задания 07: открыта только Беличья кладовая, остальные локации появятся в частях 2 и 3 */
const FOUR_MAP = [
  { id: 'mul', name: 'Беличья кладовая', icon: '🐿️', act: 'mulOpen' },
  { id: 'big', name: 'Большие числа', icon: '🔢', sub: 'Скоро' },
  { id: 'col', name: 'Мост «в столбик»', icon: '🌉', sub: 'Скоро' },
  { id: 'mill', name: 'Мельница умножения и деления', icon: '⚙️', sub: 'Скоро' },
  { id: 'ord4', name: 'Порядок действий', icon: '🪜', sub: 'Скоро' },
  { id: 'units4', name: 'Лавка величин', icon: '⚖️', sub: 'Скоро' },
  { id: 'road', name: 'Дорога и магазин', icon: '🛒', sub: 'Скоро' },
  { id: 'frac4', name: 'Доли', icon: '🥧', sub: 'Скоро' },
  { id: 'eq4', name: 'Уравнения', icon: '🔑', sub: 'Скоро' },
  { id: 'geo4', name: 'Геометрия', icon: '📐', sub: 'Скоро' },
  { id: 'data4', name: 'Таблицы и логика', icon: '📊', sub: 'Скоро' }
];
function fourQuick() {
  const dailyDone = S.daily.date === today() && S.daily.done, due = mulDueCount(S);
  return `<div class="quick">
    <div class="qcard ${dailyDone ? '' : 'hot'}" data-act="daily">${dailyDone ? '<span class="done">✅</span>' : ''}<div class="qi">☀️</div><div><div class="qt">Задание дня</div><div class="qs">${dailyDone ? 'Выполнено! Можно ещё' : '20 примеров · +10 орешков'}</div></div></div>
    <div class="qcard" data-act="review">${due ? `<span class="badge">${due}</span>` : ''}<div class="qi">🧺</div><div><div class="qt">Повторение</div><div class="qs">${due ? 'Пора повторить!' : 'Всё по расписанию'}</div></div></div>
    <div class="qcard off"><div class="qi">🧭</div><div><div class="qt">Проверка сил</div><div class="qs">Скоро — когда откроются все уголки леса</div></div></div>
    <div class="qcard" data-act="album"><div class="qi">📒</div><div><div class="qt">Альбом наклеек</div><div class="qs">${S.stickers.length} из ${STICKERS.length}</div></div></div>
  </div>`;
}
/* Задание дня 4 класса: 20 примеров вперемешку; если ни один столбик ещё не начат — первый неначатый столбик */
function fourDaily() {
  if (!mulStudied(S).length) { mulLearn(2); MS.daily = true; MS.title = 'Задание дня · столбик ×2'; mulRender(); return; }
  mulSession('mix', 'Задание дня'); if (MS) MS.daily = true;
}
/* Ссылка на тренажёр из «Старого дуба» (5 класс) */
function mulLink() {
  const c = mulCount(S);
  return `<div class="card mlink" data-act="mulOpen" role="button"><div class="qi">🐿️</div><div class="grow"><b>Тренажёр таблицы умножения</b>
    <div class="small muted">Беличья кладовая · знаешь ${c.know + c.gold} из 64</div></div><div style="font-size:22px">→</div></div>`;
}
