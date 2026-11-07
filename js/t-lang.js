/* Поляна переводчика (математический язык) и Мельница (значение выражения, порядок действий) */
'use strict';

function cloneE(e) { return e.n !== undefined ? { n: e.n } : { op: e.op, l: cloneE(e.l), r: cloneE(e.r) }; }
function opNodes(e, acc = []) { if (e.n === undefined) { acc.push(e); opNodes(e.l, acc); opNodes(e.r, acc); } return acc; }
function mutants(e) {
  const first = [], rest = [];
  if (e.l.n === undefined) first.push(N(e.l.op, cloneE(e.l.l), N(e.op, cloneE(e.l.r), cloneE(e.r))));
  if (e.r.n === undefined) first.push(N(e.r.op, N(e.op, cloneE(e.l), cloneE(e.r.l)), cloneE(e.r.r)));
  const cnt = opNodes(e).length;
  for (let i = 0; i < cnt; i++) {
    const c = cloneE(e), nd = opNodes(c)[i];
    if (nd.op === '-' || nd.op === ':') { [nd.l, nd.r] = [nd.r, nd.l]; first.push(c); }
    for (const op of ['+', '-', '*', ':']) { const c2 = cloneE(e), nd2 = opNodes(c2)[i]; if (nd2.op !== op) { nd2.op = op; rest.push(c2); } }
  }
  return R.shuffle(first).concat(R.shuffle(rest));
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const LANG_CFG = { ops: ['+', '-', '*', ':'], max: 300, subMax: 25, mulMax: 9, divMax: 9 };
function langExpr(k) {
  for (let t = 0; t < 60; t++) { const e = buildExpr(R.int(8, 60), k, LANG_CFG); if (opCount(e) === k) return e; }
  return null;
}
const OPWORD = { '+': 'сложение', '-': 'вычитание', '*': 'умножение', ':': 'деление' };

reg('lang', 'lang_read', d => {
  const e = langExpr(d === 1 ? R.int(1, 2) : d === 2 ? 2 : 3); if (!e) return null;
  const right = cap(verbal(e));
  const options = choices(right, mutants(e).map(m => cap(verbal(m))));
  if (options.length < 3) return null;
  return { q: `Как правильно прочитать выражение?<br><span class="ex">${toStr(e, true)}</span>`, type: 'choice', options, answer: right, wide: true,
    hint: 'Название выражению даёт ПОСЛЕДНЕЕ действие. Какое действие здесь выполняется последним?',
    explain: [`Последнее действие — ${OPWORD[e.op]}, значит всё выражение — это «${OPNAME[e.op][0]}».`, `Дальше называем, ЧЕГО это ${OPNAME[e.op][0]}: сначала левая часть, потом правая.`, `${right}.`] };
});

reg('lang', 'lang_write', d => {
  const e = langExpr(d === 1 ? R.int(1, 2) : d === 2 ? 2 : 3); if (!e) return null;
  const right = toStr(e, true);
  const options = choices(right, mutants(e).map(m => toStr(m, true)));
  if (options.length < 3) return null;
  return { q: `Запиши на математическом языке:<br><b>${cap(verbal(e))}</b>`, type: 'choice', options, answer: right, mono: true,
    hint: 'Первое слово — это последнее действие. Например, «частное суммы…» — сначала сумма в скобках, потом деление.',
    explain: [`«${cap(OPNAME[e.op][0])}» — значит последнее действие ${OPWORD[e.op]}.`, `Правильная запись: ${right}.`] };
});

reg('lang', 'lang_value', d => {
  const e = langExpr(d === 1 ? 2 : d === 2 ? R.int(2, 3) : 3); if (!e) return null;
  const s = toStr(e, true), r = schoolSteps(s);
  if (!r.ok || r.value !== val(e)) return null;
  return { q: `Найди значение:<br><b>${cap(verbal(e))}</b>`, type: 'num', answer: r.value,
    hint: 'Сначала запиши выражение на математическом языке, потом вычисли.',
    explain: [`Запись: ${s}`].concat(r.steps.map((x, i) => `${i + 1}) ${x}`)) };
});

const REL = {
  'на+': { say: (a, b, n) => `${a} на ${n} больше ${b}`, f: (a, b, n) => `${a} = ${b} + ${n}`, bad: (a, b, n) => [`${a} = ${b} − ${n}`, `${b} = ${a} + ${n}`, `${a} = ${b} · ${n}`, `${a} + ${n} = ${b}`] },
  'на-': { say: (a, b, n) => `${a} на ${n} меньше ${b}`, f: (a, b, n) => `${a} = ${b} − ${n}`, bad: (a, b, n) => [`${a} = ${b} + ${n}`, `${b} = ${a} − ${n}`, `${a} = ${b} : ${n}`, `${a} − ${n} = ${b}`] },
  'в+': { say: (a, b, n) => `${a} в ${n} раз больше ${b}`, f: (a, b, n) => `${a} = ${b} · ${n}`, bad: (a, b, n) => [`${a} = ${b} : ${n}`, `${b} = ${a} · ${n}`, `${a} = ${b} + ${n}`, `${a} · ${n} = ${b}`] },
  'в-': { say: (a, b, n) => `${a} в ${n} раз меньше ${b}`, f: (a, b, n) => `${a} = ${b} : ${n}`, bad: (a, b, n) => [`${a} = ${b} · ${n}`, `${b} = ${a} : ${n}`, `${a} = ${b} − ${n}`, `${a} : ${n} = ${b}`] }
};
const REL_RULE = '«на … больше» → +, «на … меньше» → −, «в … раз больше» → ·, «в … раз меньше» → :';
reg('lang', 'lang_phrase', d => {
  if (d === 1) {
    const kind = R.pick(['на+', 'на-', 'в+', 'в-']);
    const n = kind[0] === 'в' ? R.int(2, 9) : R.int(5, 48);
    const a = kind === 'в-' ? n * R.int(3, 15) : kind === 'на-' ? R.int(n + 5, 120) : R.int(6, 60);
    const ans = { 'на+': a + n, 'на-': a - n, 'в+': a * n, 'в-': a / n }[kind];
    const word = { 'на+': `на ${n} больше`, 'на-': `на ${n} меньше`, 'в+': `в ${n} раз${n >= 2 && n <= 4 ? 'а' : ''} больше`, 'в-': `в ${n} раз${n >= 2 && n <= 4 ? 'а' : ''} меньше` }[kind];
    const sign = { 'на+': '+', 'на-': '−', 'в+': '·', 'в-': ':' }[kind];
    return { q: `Найди число, которое <b>${word}</b>, чем ${a}.`, type: 'num', answer: ans, hint: REL_RULE,
      explain: [REL_RULE, `${a} ${sign} ${n} = ${fmt(ans)}.`] };
  }
  const [x, y] = R.pick([['a', 'b'], ['x', 'y'], ['m', 'k'], ['c', 'd']]);
  const kind = R.pick(Object.keys(REL)), n = R.int(2, 9), rel = REL[kind];
  const raz = s => s.replace(/в (\d) раз /, (m, k) => `в ${k} раз${+k >= 2 && +k <= 4 ? 'а' : ''} `);
  if (d === 2) {
    const right = rel.f(x, y, n);
    return { q: `Как записать на математическом языке:<br><b>«${raz(rel.say(x, y, n))}»</b>?`, type: 'choice', mono: true,
      options: choices(right, R.shuffle(rel.bad(x, y, n))), answer: right, hint: REL_RULE,
      explain: [REL_RULE, `Если ${x} больше — к меньшему ${y} нужно прибавить (или умножить), чтобы получить ${x}. Если ${x} меньше — наоборот.`, `Ответ: ${right}.`] };
  }
  const forms = [
    { f: `${x} − ${y} = ${n}`, right: `${x} на ${n} больше ${y}`, bad: [`${y} на ${n} больше ${x}`, `${x} в ${n} раз больше ${y}`, `${x} на ${n} меньше ${y}`] },
    { f: `${x} : ${y} = ${n}`, right: `${x} в ${n} раз больше ${y}`, bad: [`${y} в ${n} раз больше ${x}`, `${x} на ${n} больше ${y}`, `${x} в ${n} раз меньше ${y}`] },
    { f: `${y} + ${n} = ${x}`, right: `${x} на ${n} больше ${y}`, bad: [`${y} на ${n} больше ${x}`, `${x} в ${n} раз больше ${y}`, `${x} на ${n} меньше ${y}`] },
    { f: `${x} · ${n} = ${y}`, right: `${y} в ${n} раз больше ${x}`, bad: [`${x} в ${n} раз больше ${y}`, `${y} на ${n} больше ${x}`, `${y} в ${n} раз меньше ${x}`] }
  ];
  const F = R.pick(forms);
  const right = raz(F.right);
  return { q: `Что означает запись <span class="ex">${F.f}</span>?`, type: 'choice', options: choices(right, F.bad.map(s => raz(s))), answer: right, wide: true,
    hint: 'Подставь числа! Например, если ' + x + ' = 12, то каким будет ' + y + '?', explain: [REL_RULE, `${F.f} означает: ${raz(F.right)}.`] };
});

/* ---------- Мельница: порядок действий ---------- */
reg('order', 'ord_value', d => {
  const k = d === 1 ? 2 : d === 2 ? 3 : 4;
  const cfg = { ops: ['+', '-', '*', ':'], max: d === 3 ? 5000 : 600, subMax: d === 3 ? 150 : 40, mulMax: 9, divMax: 9 };
  for (let t = 0; t < 60; t++) {
    const e = buildExpr(R.int(d === 3 ? 20 : 5, d === 3 ? 300 : 60), k, cfg);
    if (opCount(e) !== k) continue;
    const s = toStr(e, false);
    if (!(/[·:]/.test(s) && /[+−]/.test(s))) continue;
    const r = schoolSteps(s);
    if (!r.ok || r.value !== val(e)) continue;
    const ltr = leftToRight(s);
    return { q: `Найди значение выражения:<br><span class="ex">${s}</span>`, type: 'num', answer: r.value,
      hint: 'Порядок: 1) скобки; 2) умножение и деление слева направо; 3) сложение и вычитание слева направо.',
      explain: ['Порядок действий:'].concat(r.steps.map((x, i) => `${i + 1}) ${x}`),
        Number.isInteger(ltr) && ltr >= 0 && ltr !== r.value ? [`Если считать просто слева направо, выйдет ${fmt(ltr)} — это ошибка.`] : []) };
  }
  return null;
});

reg('order', 'ord_smart', d => {
  const kind = d === 1 ? R.pick(['pair', 'sum']) : d === 2 ? R.pick(['dist', 'dist', 'sum4']) : R.pick(['near', 'near', 'pair2']);
  if (kind === 'pair') {
    const [p, q] = R.pick([[25, 4], [50, 2], [20, 5], [4, 25], [2, 50], [5, 20]]);
    let m; do { m = R.int(7, 99); } while (m % 10 === 0);
    const s = R.chance(0.5) ? `${p} · ${m} · ${q}` : `${q} · ${m} · ${p}`;
    return { q: `Вычисли удобным способом:<br><span class="ex">${s}</span>`, type: 'num', answer: p * q * m, hint: `Какие два множителя дают «круглое» число?`,
      explain: ['Множители можно переставлять — произведение не изменится.', `${p} · ${q} = ${p * q}`, `${p * q} · ${m} = ${fmt(p * q * m)}`] };
  }
  if (kind === 'sum') {
    let a; do { a = R.int(11, 89); } while (a % 10 === 0);
    const c = 100 - a, b = R.int(12, 98);
    return { q: `Вычисли удобным способом:<br><span class="ex">${a} + ${b} + ${c}</span>`, type: 'num', answer: 100 + b, hint: 'Какие два слагаемых дают 100?',
      explain: ['Слагаемые можно переставлять и группировать.', `${a} + ${c} = 100`, `100 + ${b} = ${100 + b}`] };
  }
  if (kind === 'sum4') {
    const a = R.pick([125, 150, 35, 46, 64, 81]), c = (a > 100 ? 200 : 100) - a, b = R.int(21, 79), e = 100 - b;
    return { q: `Вычисли удобным способом:<br><span class="ex">${a} + ${b} + ${c} + ${e}</span>`, type: 'num', answer: a + b + c + e, hint: 'Сгруппируй слагаемые, которые дают круглые числа.',
      explain: [`(${a} + ${c}) + (${b} + ${e}) = ${a + c} + 100 = ${a + b + c + e}`] };
  }
  if (kind === 'dist') {
    const a = R.int(12, 89), tot = R.pick([10, 10, 100]), b = R.int(2, tot - 2), c = tot - b;
    if (R.chance(0.6)) return { q: `Вычисли удобным способом:<br><span class="ex">${a} · ${b} + ${a} · ${c}</span>`, type: 'num', answer: a * tot,
      hint: `Есть общий множитель ${a}. Вынеси его за скобки.`, explain: ['a · b + a · c = a · (b + c) — распределительный закон.', `${a} · (${b} + ${c}) = ${a} · ${tot} = ${fmt(a * tot)}`] };
    const big = R.int(11, 19), small = big - 10;
    return { q: `Вычисли удобным способом:<br><span class="ex">${a} · ${big} − ${a} · ${small}</span>`, type: 'num', answer: a * 10,
      hint: `Есть общий множитель ${a}.`, explain: ['a · b − a · c = a · (b − c).', `${a} · (${big} − ${small}) = ${a} · 10 = ${a * 10}`] };
  }
  if (kind === 'near') {
    const m = R.pick([99, 101, 999, 98]), a = R.int(3, 48);
    const base = m === 999 ? 1000 : 100, diff = m - base;
    return { q: `Вычисли удобным способом:<br><span class="ex">${m} · ${a}</span>`, type: 'num', answer: m * a, hint: `${m} = ${base} ${diff > 0 ? '+' : '−'} ${Math.abs(diff)}`,
      explain: [`${m} = ${base} ${diff > 0 ? '+' : '−'} ${Math.abs(diff)}`, `${base} · ${a} ${diff > 0 ? '+' : '−'} ${Math.abs(diff)} · ${a} = ${fmt(base * a)} ${diff > 0 ? '+' : '−'} ${Math.abs(diff) * a} = ${fmt(m * a)}`] };
  }
  const m = R.int(3, 9);
  return { q: `Вычисли удобным способом:<br><span class="ex">4 · ${m} · 25 · 3</span>`, type: 'num', answer: 300 * m,
    hint: 'Найди пару множителей, дающую 100.', explain: ['4 · 25 = 100', `${m} · 3 = ${3 * m}`, `100 · ${3 * m} = ${300 * m}`] };
});

function placements(nums, ops) {
  const S = i => fmt(nums[i]), o = i => ' ' + SYM[ops[i]] + ' ';
  if (nums.length === 3) return [S(0) + o(0) + S(1) + o(1) + S(2), '(' + S(0) + o(0) + S(1) + ')' + o(1) + S(2), S(0) + o(0) + '(' + S(1) + o(1) + S(2) + ')'];
  const [a, b, c, e] = [S(0), S(1), S(2), S(3)], [p, q, r] = [o(0), o(1), o(2)];
  return [a + p + b + q + c + r + e, '(' + a + p + b + ')' + q + c + r + e, a + p + '(' + b + q + c + ')' + r + e, a + p + b + q + '(' + c + r + e + ')',
    '(' + a + p + b + q + c + ')' + r + e, a + p + '(' + b + q + c + r + e + ')', '(' + a + p + b + ')' + q + '(' + c + r + e + ')'];
}
reg('order', 'ord_brackets', d => {
  const cnt = d === 1 ? 3 : 4, hi = d === 3 ? 40 : 20;
  for (let t = 0; t < 80; t++) {
    const nums = Array.from({ length: cnt }, () => R.int(2, hi));
    const ops = Array.from({ length: cnt - 1 }, () => R.pick(['+', '-', '*', ':']));
    if (!ops.some(o => o === '*' || o === ':') || !ops.some(o => o === '+' || o === '-')) continue;
    const pl = placements(nums, ops).map(s => ({ s, r: schoolSteps(s) })).filter(x => x.r.ok);
    if (!pl.length || pl[0].s !== placements(nums, ops)[0]) continue;
    const plain = pl[0].r.value;
    const cand = pl.slice(1).filter(x => x.r.value !== plain && pl.filter(y => y.r.value === x.r.value).length === 1);
    if (!cand.length) continue;
    const target = R.pick(cand);
    const others = R.shuffle(pl.filter(x => x.r.value !== target.r.value)).map(x => x.s);
    const options = choices(target.s, others);
    if (options.length < 3) continue;
    return { q: `Где поставить скобки, чтобы получилось <b>${fmt(target.r.value)}</b>?`, type: 'choice', options, answer: target.s, mono: true,
      hint: 'Проверь каждый вариант: посчитай по порядку действий.', explain: [`${target.s}:`].concat(target.r.steps.map((x, i) => `${i + 1}) ${x}`), [`Без скобок было бы ${fmt(plain)}.`]) };
  }
  return null;
});

const LETTER_T = {
  1: [['a + b · K', 'A + B · K'], ['(a + b) · K', '(A + B) · K'], ['a · K − b', 'A · K − B'], ['a − b : K', 'A − B : K']],
  2: [['(a − b) · c', '(A − B) · C'], ['a : b + c', 'A : B + C'], ['a · (b + c)', 'A · (B + C)'], ['a − b · c', 'A − B · C']],
  3: [['Ka + Mb', 'K · A + M · B'], ['Ka − b', 'K · A − B'], ['K · (a − b) + c', 'K · (A − B) + C'], ['a : K + Mb', 'A : K + M · B']]
};
reg('order', 'ord_letters', d => {
  for (let t = 0; t < 80; t++) {
    const [disp, num] = R.pick(LETTER_T[d]);
    const A = R.int(4, d === 3 ? 60 : 40), B = R.int(2, d === 3 ? 30 : 20), C = R.int(2, 12), K = R.int(2, 9), M = R.int(2, 6);
    const ds = disp.replace(/K/g, K).replace(/M/g, M);
    const ns = num.replace(/A/g, A).replace(/B/g, B).replace(/C/g, C).replace(/K/g, K).replace(/M/g, M);
    const r = schoolSteps(ns); if (!r.ok) continue;
    const vars = [`a = ${A}`, `b = ${B}`].concat(/c/.test(disp) ? [`c = ${C}`] : []).join(', ');
    return { q: `Найди значение выражения<br><span class="ex">${ds}</span><br>при ${vars}.`, type: 'num', answer: r.value,
      hint: /\d[ab]/.test(ds) ? `Запись вида ${K}a означает ${K} · a. Подставь числа вместо букв.` : 'Подставь числа вместо букв и считай по порядку действий.',
      explain: (/\d[ab]/.test(ds) ? [`${K}a — это ${K} · a (знак умножения перед буквой не пишут).`] : []).concat([`Подставляем: ${ns}`], r.steps.map((x, i) => `${i + 1}) ${x}`)) };
  }
  return null;
});
