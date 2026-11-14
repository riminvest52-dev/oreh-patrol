/* Ответ «в столбик» (4 класс): клетчатое поле как в тетради.
   Раскладка строится заранее: у каждой клетки — что в ней должно быть (v), порядок заполнения (ord),
   что сказать при ошибке (msg) и особые подсказки на типичные неверные цифры (alt).
   Переносы и «уменьшенные» цифры над разрядами — маленькие клетки, их заполнять не обязательно (opt).
   Проверка по шагам: неверные клетки подсвечиваются, подсказка — по первой неверной клетке в порядке решения. */
'use strict';

const PLACE = ['единиц', 'десятков', 'сотен', 'тысяч', 'десятков тысяч', 'сотен тысяч', 'миллионов'];
const digitsOf = n => String(n).split('').map(Number);
const dig = (n, k) => Math.floor(n / Math.pow(10, k)) % 10;   /* цифра разряда k (0 — единицы) */

/* Вспомогательное: раскладка со списком клеток и линий */
function colLay(W) {
  const L = { W, H: 0, cells: [], lines: [], bars: [], rowAlt: [] };
  let ord = 0;
  L.fix = (r, c, t, cls) => { L.cells.push({ r, c, t: String(t), cls }); L.H = Math.max(L.H, r + 1); };
  L.inp = (r, c, v, msg, o = {}) => { L.cells.push(Object.assign({ r, c, v: String(v), msg, ord: o.ord !== undefined ? o.ord : ord++ }, o)); L.H = Math.max(L.H, r + 1); };
  L.line = (r, c0, c1) => L.lines.push({ r, c0, c1 });   /* черта под строкой r от столбца c0 до c1 включительно */
  L.num = (r, cEnd, n) => digitsOf(n).forEach((d, i, a) => L.fix(r, cEnd - (a.length - 1 - i), d));
  return L;
}

/* ---------- Сложение ---------- */
function colAdd(a, b) {
  const s = a + b, n = String(s).length, W = n + 1, col = k => W - 1 - k, L = colLay(W);
  L.num(1, W - 1, a); L.num(2, W - 1, b); L.fix(2, 0, '+', 'sign'); L.line(2, 1, W - 1);
  let carry = 0;
  for (let k = 0; k < n; k++) {
    const x = dig(a, k), y = dig(b, k), t = x + y + carry, d = t % 10;
    const top = k < String(Math.max(a, b)).length;
    const msg = top
      ? `Разряд ${PLACE[k]}: ${x} + ${y}${carry ? ' + 1 (перенос)' : ''} = ${t}, пишем ${d}${t >= 10 ? `, а 1 переносим в разряд ${PLACE[k + 1]}` : ''}.`
      : `Перенесённая 1 становится новым разрядом — ${PLACE[k]}.`;
    const alt = {};
    if (carry && top) alt[(d + 9) % 10] = `Разряд ${PLACE[k]}: не забудь 1, перенесённую из разряда ${PLACE[k - 1]}.`;
    if (t >= 10 && top) alt[t] = 'В клетку пишем одну цифру, а десяток переносим в следующий разряд.';
    L.inp(3, col(k), d, msg, { alt, res: 1 });
    if (k > 0 && top) L.inp(0, col(k), carry ? 1 : '', carry ? `Над разрядом ${PLACE[k]} пишем перенесённую 1.` : `В разряд ${PLACE[k]} ничего не переносили.`, { opt: 1, sm: 1, ord: 900 + k });
    carry = t >= 10 ? 1 : 0;
  }
  return { lay: L, answer: s };
}

/* ---------- Вычитание (с займом через нули: 40 003 − 2 785) ---------- */
function colSub(a, b) {
  const s = a - b, na = String(a).length, W = na + 1, col = k => W - 1 - k, L = colLay(W);
  L.num(1, W - 1, a); L.num(2, W - 1, b); L.fix(2, 0, '−', 'sign'); L.line(2, 1, W - 1);
  const ns = String(s).length;
  let lent = 0;                         /* этот разряд отдал 1 соседу справа */
  for (let k = 0; k < na; k++) {
    const x = dig(a, k), y = dig(b, k), eff = x - lent, need = eff < y, top = need ? eff + 10 : eff, d = top - y;
    let msg;
    if (need && eff < 0) msg = `Разряд ${PLACE[k]}: здесь был 0, у него уже заняли — занимаем у следующего разряда, 0 становится 9: 9 − ${y} = ${d}.`;
    else if (need) msg = `Разряд ${PLACE[k]}: ${eff} меньше ${y} — занимаем 1 у разряда ${PLACE[k + 1]}: ${eff + 10} − ${y} = ${d}.`;
    else if (lent) msg = `Разряд ${PLACE[k]}: у ${x} заняли 1, осталось ${eff}: ${eff} − ${y} = ${d}.`;
    else msg = `Разряд ${PLACE[k]}: ${x} − ${y} = ${d}.`;
    const alt = {};
    if (lent && !need) alt[(d + 1) % 10] = `Разряд ${PLACE[k]}: отсюда заняли 1 для соседнего разряда — эту цифру нужно было уменьшить на 1.`;
    if (lent && need && eff < 0) alt[(10 - y + 10) % 10] = `Разряд ${PLACE[k]}: у нуля занять нельзя, занимаем дальше, а 0 становится 9.`;
    if (need && y - eff >= 0 && y - eff <= 9 && y - eff !== d) alt[y - eff] = `Разряд ${PLACE[k]}: из меньшей цифры вычли большую — так нельзя. Займи 1 у соседнего разряда.`;
    if (k < ns) L.inp(3, col(k), d, msg, { alt, res: 1 });
    else if (d !== 0) throw new Error('sub layout');
    /* «Уменьшенная» цифра над разрядом, у которого заняли (необязательно, как точка в тетради) */
    lent = need ? 1 : 0;
    if (k + 1 < na && lent) {
      const nx = dig(a, k + 1), shown = nx === 0 ? 9 : nx - 1;
      L.inp(0, col(k + 1), shown, `Над разрядом ${PLACE[k + 1]} можно записать, сколько там осталось после займа: ${shown}.`, { opt: 1, sm: 1, ord: 900 + k });
    }
  }
  return { lay: L, answer: s };
}

/* ---------- Умножение: на однозначное и на двух-/трёхзначное (неполные произведения со сдвигом) ---------- */
function colMul(a, b) {
  const p = a * b, bd = digitsOf(b).reverse(), W = String(p).length + 1, col = k => W - 1 - k, L = colLay(W);
  L.num(0, W - 1, a); L.num(1, W - 1, b); L.fix(1, 0, '×', 'sign'); L.line(1, Math.min(col(String(a).length - 1), col(String(b).length - 1)), W - 1);
  if (bd.length === 1) {
    /* Строки: 0 — переносы (маленькие), 1 — a, 2 — b, 3 — ответ */
    L.cells.forEach(c => { c.r++; }); L.lines.forEach(x => { x.r++; });
    let carry = 0;
    const np = String(p).length;
    for (let k = 0; k < np; k++) {
      const x = dig(a, k), inA = k < String(a).length, t = inA ? x * b + carry : carry, d = t % 10;
      const msg = inA ? `Разряд ${PLACE[k]}: ${x} · ${b}${carry ? ` + ${carry} (запомнили)` : ''} = ${t}, пишем ${d}${t >= 10 ? `, ${Math.floor(t / 10)} запоминаем` : ''}.`
        : `Запомненное ${carry} пишем в разряд ${PLACE[k]}.`;
      const alt = {};
      if (carry && inA) alt[(d - carry + 10) % 10] = `Разряд ${PLACE[k]}: не забудь прибавить ${carry}, которые запомнили.`;
      L.inp(3, col(k), d, msg, { alt, res: 1 });
      if (inA && carry && k > 0) L.inp(0, col(k), carry, `Над разрядом ${PLACE[k]} можно записать, сколько запомнили: ${carry}.`, { opt: 1, sm: 1, ord: 900 + k });
      carry = Math.floor(t / 10);
    }
    return { lay: L, answer: p };
  }
  /* Неполные произведения */
  let r = 2;
  const parts = bd.map((d, i) => a * d * Math.pow(10, i));
  bd.forEach((d, i) => {
    const pp = a * d, np = String(pp).length;
    if (i === 1) L.fix(r, Math.max(0, col(np - 1 + i) - 1), '+', 'sign');
    for (let k = 0; k < np; k++) {
      const msg = i === 0 ? `Первое неполное произведение: ${fmt(a)} · ${d} = ${fmt(pp)}, пишем под единицами.`
        : `${i === 1 ? 'Второе' : 'Третье'} неполное произведение: ${fmt(a)} · ${d} = ${fmt(pp)}. Пишем со сдвигом: последняя цифра — под ${PLACE[i]}.`;
      L.inp(r, col(k + i), dig(pp, k), msg, { part: i });
    }
    for (let k = 0; k < i; k++) L.fix(r, col(k), '·', 'shift');
    r++;
  });
  L.line(r - 1, 1, W - 1);
  const np = String(p).length;
  for (let k = 0; k < np; k++) L.inp(r, col(k), dig(p, k), `Складываем неполные произведения по разрядам: ${parts.map(fmt).join(' + ')} = ${fmt(p)}.`, { res: 1 });
  const flat = bd.reduce((s, d) => s + a * d, 0);
  if (flat !== p) L.rowAlt.push({ r, vals: { [flat]: 'Похоже, неполные произведения сложены без сдвига. Второе пишется на одну клетку левее — под десятками.' } });
  return { lay: L, answer: p };
}

/* ---------- Деление уголком ---------- */
function colDiv(a, b) {
  const q = Math.floor(a / b), rem = a % b, ad = digitsOf(a), n = ad.length, nb = String(b).length;
  const W = n + 1 + Math.max(nb, String(q).length) + 1, L = colLay(W), dc = i => 1 + i;   /* столбец i-й цифры делимого */
  ad.forEach((d, i) => L.fix(0, dc(i), d));
  digitsOf(b).forEach((d, i) => L.fix(0, n + 2 + i, d));
  L.bars.push({ c: n + 1, r0: 0, r1: 1 });
  L.line(0, n + 2, W - 1);
  let i = 0, cur = 0, row = 1, qi = 0, first = true;
  /* Первое неполное делимое */
  while (i < n - 1 && cur * 10 + ad[i] < b) cur = cur * 10 + ad[i++];
  cur = cur * 10 + ad[i];
  const qCell = (d, msg, o) => { L.inp(1, n + 2 + qi, d, msg, Object.assign({ quo: 1 }, o)); qi++; };
  const steps = [];
  for (;;) {
    const qd = Math.floor(cur / b), P = qd * b, r = cur - P;
    if (qd === 0) {
      qCell(0, `${cur} меньше ${b} — в частном пишем 0${i < n - 1 ? ' и сносим следующую цифру' : ''}.`);
      steps.push(`${cur} меньше ${b} → в частном 0.`);
    } else {
      qCell(qd, `${first ? `Первое неполное делимое — ${cur}. ` : ''}Сколько раз ${b} помещается в ${cur}? ${b} · ${qd} = ${P}${(qd + 1) * b > cur ? `, а ${b} · ${qd + 1} = ${(qd + 1) * b} — уже больше ${cur}` : ''}. Пишем ${qd}.`,
        { alt: { [qd + 1]: `${b} · ${qd + 1} = ${(qd + 1) * b} — это больше ${cur}. Возьми цифру поменьше.`, [qd - 1]: `Остаток получится ${cur - (qd - 1) * b} — он не меньше ${b}. Возьми цифру побольше.` } });
      const pl = String(P).length;
      L.fix(row, dc(i) - pl, '−', 'sign');
      digitsOf(P).forEach((d, j) => L.inp(row, dc(i) - pl + 1 + j, d, `Умножаем цифру частного на делитель: ${b} · ${qd} = ${P}. Пишем под ${cur}.`));
      L.line(row, dc(i) - Math.max(pl, String(cur).length) + 1, dc(i));
      row++;
      steps.push(`${first ? 'Первое неполное делимое ' : ''}${cur} : ${b} = ${qd}; ${b} · ${qd} = ${P}; ${cur} − ${P} = ${r}.`);
    }
    first = false;
    if (i >= n - 1) {
      /* Последний остаток */
      if (qd !== 0) digitsOf(r).forEach((d, j, arr) => L.inp(row, dc(i) - (arr.length - 1 - j), d, `${cur} − ${P} = ${r} — это ${r ? 'остаток' : 'конец деления, остаток 0'}.`, { last: 1 }));
      break;
    }
    /* Разность и сносим следующую цифру */
    i++;
    const next = r * 10 + ad[i];
    if (qd !== 0) {
      const s = String(next), start = dc(i) - s.length + 1;
      s.split('').forEach((d, j) => {
        const isBrought = start + j === dc(i);
        L.inp(row, start + j, d, isBrought ? `Сносим следующую цифру делимого — ${ad[i]}.` : `Вычитаем: ${cur} − ${P} = ${r}, потом сносим ${ad[i]}.`);
      });
      row++;
    } else {
      /* после нуля в частном сносим цифру в ту же строку */
      if (row < 2) throw new Error('div layout');
      L.inp(row - 1, dc(i), ad[i], `Сносим следующую цифру делимого — ${ad[i]}.`);
    }
    cur = next;
  }
  const lost = +String(q).replace(/0/g, '');
  if (lost !== q && String(q).length > 1) L.rowAlt.push({ r: 1, quo: 1, vals: { [lost]: 'Потерялся ноль в частном: если неполное делимое меньше делителя, в частное пишем 0.' } });
  steps.push(`Ответ: ${fmt(q)}${rem ? `, остаток ${rem}` : ''}. Проверка: ${fmt(q)} · ${b}${rem ? ` + ${rem}` : ''} = ${fmt(a)} ✓`);
  return { lay: L, answer: q, rem, steps };
}

/* ---------- Экран: поле, выбор клетки, ввод, проверка ---------- */
const COL_CW = 40, COL_CH = 46;
function colField(t, vals, marks) {
  const L = t.lay, cells = L.cells.map((c, i) => {
    const x = c.c * COL_CW, y = c.r * COL_CH;
    if (c.ord === undefined) return `<div class="cc fix ${c.cls || ''}" style="left:${x}px;top:${y}px">${c.t}</div>`;
    const v = vals[i] || '', m = marks ? marks[i] || '' : '';
    return `<button class="cc inp${c.sm ? ' sm' : ''}${c.quo ? ' quo' : ''} ${m}" data-act="colCell" data-i="${i}" style="left:${x}px;top:${y}px" aria-label="клетка">${v}</button>`;
  }).join('');
  const lines = L.lines.map(l => `<i class="cline" style="left:${l.c0 * COL_CW}px;top:${(l.r + 1) * COL_CH - 2}px;width:${(l.c1 - l.c0 + 1) * COL_CW}px"></i>`).join('')
    + L.bars.map(bb => `<i class="cvbar" style="left:${bb.c * COL_CW + COL_CW - 2}px;top:${bb.r0 * COL_CH + 4}px;height:${(bb.r1 - bb.r0 + 1) * COL_CH - 8}px"></i>`).join('');
  return `<div class="colwrap"><div class="colgrid" style="width:${L.W * COL_CW}px;height:${L.H * COL_CH}px">${lines}${cells}</div></div>`;
}
/* Порядок обхода клеток при вводе: основные — по ord, маленькие (переносы) — только если выбраны пальцем */
const colOrder = t => t.lay.cells.map((c, i) => [c, i]).filter(([c]) => c.ord !== undefined && !c.opt).sort((x, y) => x[0].ord - y[0].ord).map(([, i]) => i);
/* Число, записанное в строке (по клеткам ответа) */
function colRowNum(t, vals, pred) {
  const cs = t.lay.cells.map((c, i) => [c, i]).filter(([c]) => c.ord !== undefined && pred(c)).sort((x, y) => x[0].c - y[0].c);
  const s = cs.map(([, i]) => vals[i] || '').join('');
  return s === '' ? null : +s;
}
const colResPred = t => (t.lay.cells.some(c => c.quo) ? (c => c.quo) : (c => c.res));
/* Проверка: { ok, empty, wrong: [индексы], msg } */
function colCheck(t, vals) {
  const L = t.lay, wrong = [];
  let filled = 0;
  L.cells.forEach((c, i) => {
    if (c.ord === undefined) return;
    const g = vals[i] || '';
    if (g) filled++;
    if (c.opt) { if (g && g !== c.v) wrong.push(i); return; }
    if (g !== c.v) wrong.push(i);
  });
  if (!filled) return { ok: false, empty: true, wrong, msg: '' };
  if (!wrong.length) return { ok: true, wrong, msg: '' };
  /* Подсказка: сначала типичная ошибка всей строки (сдвиг, потерянный ноль), потом первая неверная клетка по порядку решения */
  for (const ra of L.rowAlt) {
    const num = colRowNum(t, vals, c => ra.quo ? c.quo : c.r === ra.r);
    if (num !== null && ra.vals[num]) return { ok: false, wrong, msg: ra.vals[num] };
  }
  const main = wrong.filter(i => !L.cells[i].opt).sort((x, y) => L.cells[x].ord - L.cells[y].ord);
  const fi = main.length ? main[0] : wrong[0], c = L.cells[fi], g = vals[fi] || '';
  const msg = !g ? `Не заполнена клетка: ${c.msg}` : (c.alt && c.alt[g]) || c.msg;
  return { ok: false, wrong, msg };
}
/* Решение целиком — для автотеста и показа после ответа */
const colSolution = t => { const v = {}; t.lay.cells.forEach((c, i) => { if (c.ord !== undefined && c.v !== '') v[i] = c.v; }); return v; };

/* Готовое задание «в столбик»: q — что вычислить, kind — + − × : */
function colTask(kind, a, b, extra = {}) {
  const sym = { add: '+', sub: '−', mul: '·', div: ':' }[kind];
  const res = kind === 'add' ? colAdd(a, b) : kind === 'sub' ? colSub(a, b) : kind === 'mul' ? colMul(a, b) : colDiv(a, b);
  const hint = {
    add: 'Складывай по разрядам справа налево. Получилось 10 и больше — пиши единицы, а 1 переноси в следующий разряд.',
    sub: 'Вычитай по разрядам справа налево. Если цифра сверху меньше — займи 1 у соседнего разряда; у нуля занять нельзя, занимай дальше, а нули становятся девятками.',
    mul: String(b).length > 1 ? 'Умножь на каждую цифру второго множителя. Каждое следующее неполное произведение пиши со сдвигом на одну клетку влево, потом сложи.' : 'Умножай справа налево; десятки запоминай и прибавляй к следующему разряду.',
    div: 'Найди первое неполное делимое, подбери цифру частного, умножь, вычти, снеси следующую цифру. Если число меньше делителя — в частном 0.'
  }[kind];
  const explain = kind === 'div' ? res.steps : colExplain(kind, a, b, res.answer);
  return Object.assign({ q: `Вычисли в столбик: <span class="ex">${fmt(a)} ${sym} ${fmt(b)}</span>`, type: 'col', lay: res.lay, answer: res.answer, hint, explain }, extra);
}
function colExplain(kind, a, b, ans) {
  if (kind === 'mul' && String(b).length > 1) {
    const bd = digitsOf(b).reverse();
    return bd.map((d, i) => `${fmt(a)} · ${d} = ${fmt(a * d)}${i ? ` — пишем со сдвигом на ${i} ${pl(i, 'клетку', 'клетки', 'клеток')} влево` : ''}.`)
      .concat([`Складываем: ${bd.map((d, i) => fmt(a * d * Math.pow(10, i))).join(' + ')} = ${fmt(ans)}.`]);
  }
  const L = (kind === 'add' ? colAdd : kind === 'sub' ? colSub : colMul)(a, b).lay;
  return L.cells.filter(c => c.res).sort((x, y) => x.ord - y.ord).map(c => c.msg).concat([`Ответ: ${fmt(ans)}.`]);
}
