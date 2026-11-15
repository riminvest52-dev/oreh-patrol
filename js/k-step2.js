/* «Ступенька 2» Лесной полянки (задание 10, п. 1).
   Открывается в уголке, когда у него три звёздочки. Те же виды игр, но чуть сложнее; внутри — 3 уровня, как на первой ступеньке.
   Если ребёнок ошибся 2 раза подряд, следующий пример берётся с прошлого уровня (на 1-м уровне — с 3-го уровня первой ступеньки).
   Фразы озвучки по возможности повторяют уже записанные (dev/voice/phrases.html собирает все). */
'use strict';

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const ten = e => `<div class="k10">${`<span>${e}</span>`.repeat(10)}</div>`;

/* 1. Считалочка: до 20 */
KG.k2_count = d => {
  const it = R.pick(KI), n = d === 1 ? R.int(11, 15) : d === 2 ? R.int(11, 18) : R.int(15, 20);
  return { kind: 'count', e: it.e, n, text: `Сколько тут ${it.f[2]}?`, say: `Сколько тут ${it.f[2]}? Нажимай по очереди и считай.`,
    hint: 'Нажимай на каждую картинку по одному разу — я буду считать вместе с тобой.',
    opts: numOpts(n, 1, 20), ans: n, why: `Считаем по порядку до ${n}. Всего ${n} ${kf(it, n)}.`, whySay: `Считаем по порядку до ${n}.` };
};
/* Десяток и ещё сколько-то: в рамке всегда 10 */
KG.k2_tens = d => {
  const it = R.pick(KI.filter(x => x.put)), k = d === 1 ? R.int(1, 5) : d === 2 ? R.int(1, 9) : R.int(1, 10), n = 10 + k;
  const parts = [ten(it.e), '<span class="op">+</span>', k === 10 ? ten(it.e) : grp(it.e, k, 'small')];
  if (d === 3 && R.chance(0.5)) parts.reverse();   /* на 3-м уровне рамка бывает и справа */
  return { kind: 'pick', scene: `<div class="kten">${parts.join('')}</div>`, ans: n, opts: numOpts(n, 10, 20),
    text: k === 10 ? 'Два десятка. Сколько всего?' : `Десяток и ещё ${k}. Сколько всего?`,
    say: k === 10 ? 'Тут два десятка. Сколько всего?' : `Тут десяток и ещё ${k}. Сколько всего?`,
    hint: 'В рамке всегда десять. Считай дальше от десяти: одиннадцать, двенадцать…',
    why: k === 10 ? 'Два десятка — это 20.' : `Десяток и ${k} — это ${n}.`, whySay: `Вот число ${n}.` };
};
/* 2. Цифры: числа 11–20 */
KG.k2_find = d => {
  const n = R.int(d === 3 ? 12 : 11, d === 1 ? 15 : 20);
  const near = R.shuffle([n - 1, n + 1, n - 2, n + 2].filter(v => v >= 10 && v <= 20));
  const vals = d === 3 && n < 20 ? [n, n - 10, ...near.slice(0, 2)] : [n, ...near.slice(0, d === 1 ? 2 : 3)];   /* 3-й уровень: 14 и 4 — не путать */
  return { kind: 'pick', layout: vals.length === 3 ? 'three' : '', ans: n, opts: R.shuffle(vals).map(v => ({ h: `<span class="knum">${v}</span>`, v })),
    text: `Найди число ${n}`, say: `Найди число ${n}.`, hint: 'Посмотри на обе цифры. У чисел после десяти впереди стоит единица.',
    why: n === 20 ? '20 — это два десятка.' : `${n} — это десяток и ${n - 10}.`, whySay: `Вот число ${n}.` };
};
KG.k2_put = d => {
  const n = d === 1 ? R.int(11, 13) : d === 2 ? R.int(11, 16) : R.int(15, 20);
  return { kind: 'put', e: '🌰', n, pile: n + R.int(2, 4), text: `Положи в корзинку ${n} орешков`, say: `Положи в корзинку ${n} орешков. Потом нажми «Готово».`,
    hint: 'Клади по одному и считай вслух. Лишнее можно вернуть — нажми на него в корзинке.', ans: n,
    why: `Нужно ${n}: кладём по одному и считаем до ${n}.`, whySay: 'Кладём по одному и считаем вслух.' };
};
/* 3. Больше и меньше: до 20 */
KG.k2_big = d => {
  const big = R.chance(0.5), k = d === 1 ? 3 : 4, vals = R.sample(range(d === 3 ? 5 : 11, d === 1 ? 15 : 20), k);
  const ans = big ? Math.max(...vals) : Math.min(...vals), w = big ? 'большое' : 'маленькое';
  return { kind: 'pick', layout: k === 3 ? 'three' : '', ans, opts: vals.map(v => ({ h: `<span class="knum">${v}</span>`, v })),
    text: `Найди самое ${w} число`, say: `Найди самое ${w} число.`, hint: 'Вспомни числовую дорожку: чем дальше число, тем оно больше.',
    why: `Самое ${w} — ${ans}.`, whySay: `Вот число ${ans}.` };
};
KG.k2_sign = d => {
  const [lo, hi] = d === 1 ? [11, 15] : d === 2 ? [11, 20] : [1, 20];
  const a = R.int(lo, hi), b = R.chance(0.2) ? a : R.int(lo, hi);
  const ans = a > b ? '>' : a < b ? '<' : '=', word = { '>': 'больше', '<': 'меньше', '=': 'равно' };
  return { kind: 'pick', layout: 'three', ans,
    scene: `<div class="kcmp"><div><div class="kbig">${a}</div></div><div class="kbig q">?</div><div><div class="kbig">${b}</div></div></div>`,
    opts: ['>', '<', '='].map(s => ({ h: `<span class="knum">${s === '>' ? '&gt;' : s === '<' ? '&lt;' : '='}</span>`, v: s })),
    text: 'Какой знак поставить?', say: `Что поставить между ${a} и ${b}? Больше, меньше или равно?`, hint: 'Острый носик знака всегда смотрит на меньшее число.',
    why: a === b ? `${a} и ${b} одинаковые — ставим «равно».` : `${Math.max(a, b)} больше, чем ${Math.min(a, b)}. Носик знака смотрит на меньшее: ${a} ${ans} ${b}.`,
    whySay: a === b ? `${a} и ${b} одинаковые, ставим равно.` : `${a} ${word[ans]} ${b}.` };
};
/* 4. Числовая дорожка: от 10 до 20 */
KG.k2_line = d => {
  const len = 6, back = d === 3 && R.chance(0.5), start = d === 1 ? R.int(10, 13) : R.int(10, 15);
  const seq = Array.from({ length: len }, (_, i) => start + i); if (back) seq.reverse();
  const k = R.int(1, len - 1), x = seq[k];
  return { kind: 'pick', scene: `<div class="kline">${seq.map((v, i) => `<span class="${i === k ? 'q' : ''}">${i === k ? '?' : v}</span>`).join('')}</div>`,
    text: 'Какое число пропало?', say: back ? 'Числа идут назад. Какое число пропало?' : 'Какое число пропало на дорожке?', hint: 'Посчитай вслух по порядку.',
    opts: numOpts(x, 0, 20), ans: x, why: `${back ? 'Считаем назад' : 'Считаем по порядку'}: ${seq.join(', ')}.` };
};
KG.k2_next = d => {
  const n = R.int(11, 19), kind = d === 1 ? 'after' : d === 2 ? R.pick(['before', 'after']) : R.pick(['before', 'after', 'between']);
  if (kind === 'between') return { kind: 'pick', scene: `<div class="kline"><span>${n - 1}</span><span class="q">?</span><span>${n + 1}</span></div>`,
    text: `Какое число между ${n - 1} и ${n + 1}?`, say: `Какое число стоит между ${n - 1} и ${n + 1}?`, hint: 'Посчитай вслух по порядку.',
    opts: numOpts(n, 0, 20), ans: n, why: `${n - 1}, ${n}, ${n + 1} — число ${n} посередине.` };
  const x = kind === 'before' ? n - 1 : n + 1;
  return { kind: 'pick', scene: `<div class="kline">${kind === 'before' ? `<span class="q">?</span><span>${n}</span>` : `<span>${n}</span><span class="q">?</span>`}</div>`,
    text: `Какое число ${kind === 'before' ? 'перед' : 'после'} ${n}?`, say: `Какое число стоит ${kind === 'before' ? 'перед числом' : 'после числа'} ${n}?`,
    hint: kind === 'before' ? 'Перед — это на один меньше.' : 'После — это на один больше.',
    opts: numOpts(x, 0, 20), ans: x, why: kind === 'before' ? `Перед ${n} стоит ${x}: ${x}, ${n}.` : `После ${n} идёт ${x}: ${n}, ${x}.` };
};
/* 5. Домики чисел: дружные пары до 10, потом 11 и 12 */
KG.k2_pair = d => {
  const N = d === 3 ? R.pick([11, 12]) : 10, a = d === 3 ? R.int(N - 9, 9) : R.int(1, 9), x = N - a;
  const help = d === 1 ? `<div class="kgrp tiny">${'<span>🌰</span>'.repeat(a)}${'<span class="ghost">⚪</span>'.repeat(x)}</div>` : '';
  return { kind: 'pick', scene: `<div class="khouse"><div class="roof">${N}</div><div class="fl"><span>${a}</span><span class="q">?</span></div></div>${help}`,
    text: `${N} — это ${a} и сколько ещё?`, say: `Число ${N} — это ${a} и сколько ещё?`,
    hint: N === 10 ? `Загибай пальчики: от ${a} считай до 10.` : 'Считай на пальчиках от меньшего числа до большего.',
    opts: numOpts(x, 0, 10), ans: x, why: `${a} и ${x} — вместе ${N}.` };
};
KG.k2_bonds = d => {
  const N = d === 3 ? R.pick([11, 12]) : 10, a = R.int(Math.max(1, N - 9), Math.min(9, N - 1)), b = N - a;
  const cands = [];
  for (const s of [N - 1, N + 1]) for (let p = 1; p < s; p++) if (s - p <= 10 && p <= 10) cands.push([p, s - p]);
  const wrong = R.sample(cands.filter(([p]) => p !== a), d === 1 ? 2 : 3);
  const opts = R.shuffle([[a, b], ...wrong]).map(([p, q]) => ({ h: `<span class="knum kpair">${p} и ${q}</span>`, v: p + '+' + q }));
  return { kind: 'pick', layout: opts.length === 3 ? 'col' : '', ans: a + '+' + b, opts,
    scene: `<div class="khouse"><div class="roof">${N}</div></div>`, text: `Какие два числа вместе дают ${N}?`, say: `Какие два числа вместе дают ${N}?`,
    hint: 'Начни с первого числа и прибавляй второе на пальчиках.', why: `${a} и ${b} — вместе ${N}.` };
};
/* 6. Плюс и минус: в пределах 10, на 3-м уровне без картинок; «сколько не хватает» */
KG.k2_add = d => {
  if (d === 3 && R.chance(0.5)) {
    const n = R.int(4, 10), k = R.int(1, Math.min(n - 1, 5)), r = n - k;
    return { kind: 'pick', ans: r, opts: numOpts(r, 0, 10), scene: `<div class="kex">${n} − ${k} = ?</div>`, text: `Сколько будет ${n} − ${k}?`,
      say: `Сколько будет ${n} минус ${k}?`, hint: `Начни с ${n} и отсчитай назад ${k}.`, why: `${n} − ${k} = ${r}`, whySay: `Было ${n}, убрали ${k}, осталось ${r}.` };
  }
  const it = R.pick(KI), a = R.int(2, 7), b = R.int(1, 10 - a), s = a + b;
  if (d === 1 && s < 6) return null;
  if (d === 1) return { kind: 'pick', ans: s, opts: numOpts(s, 0, 10), scene: `<div class="kplus">${grp(it.e, a, 'small')}<span class="op">+</span>${grp(it.e, b, 'small')}</div>`,
    text: `Сколько всего ${it.f[2]}?`, say: `${a} да ещё ${b}. Сколько всего ${it.f[2]}?`, hint: 'Посчитай всех вместе.', why: `${a} + ${b} = ${s}`, whySay: `${a} да ещё ${b} — будет ${s}.` };
  const dots = d === 2 ? `<div class="kplus">${grp('🌰', a, 'tiny')}<span class="op">+</span>${grp('🌰', b, 'tiny')}</div>` : '';
  return { kind: 'pick', ans: s, opts: numOpts(s, 0, 10), scene: `<div class="kex">${a} + ${b} = ?</div>${dots}`, text: `Сколько будет ${a} + ${b}?`,
    say: `Сколько будет ${a} плюс ${b}?`, hint: `Начни с ${a} и прибавь ещё ${b}: загибай пальчики.`, why: `${a} + ${b} = ${s}`, whySay: `${a} да ещё ${b} — будет ${s}.` };
};
KG.k2_miss = d => {
  const a = R.int(2, 7), s = R.int(a + 1, 10), x = s - a;
  const pic = d === 1 ? `<div class="kgrp tiny">${'<span>🌰</span>'.repeat(a)}${'<span class="ghost">⚪</span>'.repeat(x)}</div>` : d === 2 ? grp('🌰', a, 'tiny') : '';
  return { kind: 'pick', ans: x, opts: numOpts(x, 0, 10), scene: `<div class="kex">${a} + ? = ${s}</div>${pic}`, text: `${a} + ? = ${s}`,
    say: `Было ${a}. Стало ${s}. Сколько добавили?`, hint: `Загибай пальчики: от ${a} считай до ${s}.`, why: `${a} + ${x} = ${s}`, whySay: `${a} да ещё ${x} — будет ${s}.` };
};
/* 7. Фигуры: из двух — одна; узор из фигур */
const PIECE = {
  sq_tri: { res: 'square', why: 'Два треугольника вместе — это квадрат.', w: 82, svg: c => `<polygon points="4,6 60,6 4,62" fill="${c}"/><polygon points="76,6 76,62 20,62" fill="${c}"/>` },
  sq_rect: { res: 'square', why: 'Два прямоугольника вместе — это квадрат.', w: 70, svg: c => `<rect x="4" y="7" width="26" height="56" rx="2" fill="${c}"/><rect x="40" y="7" width="26" height="56" rx="2" fill="${c}"/>` },
  rect_sq: { res: 'rect', why: 'Два квадрата вместе — это прямоугольник.', w: 78, svg: c => `<rect x="4" y="20" width="30" height="30" rx="2" fill="${c}"/><rect x="44" y="20" width="30" height="30" rx="2" fill="${c}"/>` },
  circ: { res: 'circle', why: 'Две половинки вместе — это круг.', w: 78, svg: c => `<path d="M34 7 A28 28 0 0 0 34 63 Z" fill="${c}"/><path d="M44 7 A28 28 0 0 1 44 63 Z" fill="${c}"/>` },
  tri_tri: { res: 'triangle', why: 'Два треугольника вместе — это большой треугольник.', w: 74, svg: c => `<polygon points="4,62 32,6 32,62" fill="${c}"/><polygon points="42,62 42,6 70,62" fill="${c}"/>` }
};
const pieceSvg = (k, c) => `<svg class="kpieces" viewBox="0 0 ${PIECE[k].w} 70" height="70">${PIECE[k].svg(c)}</svg>`;
KG.k2_build = d => {
  const c = R.pick(KCOL);
  if (d === 3) {   /* наоборот: из каких двух фигур сложить */
    const key = R.pick(Object.keys(PIECE)), target = PIECE[key].res;
    const others = R.sample(Object.keys(PIECE).filter(k => PIECE[k].res !== target), 3);
    const opts = R.shuffle([key, ...others]).map(k => ({ h: pieceSvg(k, c), v: k }));
    return { kind: 'pick', ans: key, opts, scene: shp(target, c, 96), text: `Из чего сложить ${SHAPES[target].a}?`,
      say: `Из каких двух фигур можно сложить ${SHAPES[target].a}?`, hint: 'Представь, что фигуры сдвинули вплотную. Что получится?', why: PIECE[key].why };
  }
  const key = R.pick(d === 1 ? ['sq_tri', 'sq_rect', 'circ', 'tri_tri'] : Object.keys(PIECE)), res = PIECE[key].res;
  const pool = d === 1 ? ['circle', 'square', 'triangle'] : Object.keys(SHAPES);
  const set = [res, ...R.sample(pool.filter(k => k !== res), d === 1 ? 2 : 3)];
  return { kind: 'pick', layout: d === 1 ? 'three' : '', ans: res, opts: R.shuffle(set).map(k => ({ h: shp(k, R.pick(KCOL)), v: k })),
    scene: pieceSvg(key, c), text: 'Что получится?', say: 'Что получится, если сложить эти две фигуры?',
    hint: 'Представь, что фигуры сдвинули вплотную. Что получится?', why: PIECE[key].why };
};
KG.k2_spat = d => {
  const shapes = ['circle', 'square', 'triangle'];
  let els;
  if (d < 3) els = R.sample(shapes, 3).map((s, i) => [s, KCOL[(i + R.int(0, 4)) % 5]]);
  else {   /* 3-й уровень: одна форма двух цветов и один цвет двух форм — смотреть и на то, и на другое */
    const [s1, s2] = R.sample(shapes, 2), [c1, c2] = R.sample(KCOL, 2);
    els = R.shuffle([[s1, c1], [s1, c2], [s2, c1]]);
  }
  const units = d === 1 ? [[0, 1]] : d === 2 ? [[0, 1, 2], [0, 1, 1]] : [[0, 0, 1, 2], [0, 1, 1, 2], [0, 1, 2, 2]];
  const u = R.pick(units).map(i => els[i]), len = u.length * 2 + R.int(0, u.length - 1);
  const seq = Array.from({ length: len }, (_, i) => u[i % u.length]), x = u[len % u.length];
  const key = e => e[0] + '|' + e[1], uniq = [...new Map(u.map(e => [key(e), e])).values()];
  let extra = els.find(e => !uniq.some(y => key(y) === key(e)));
  if (!extra) { const s = R.pick(shapes), cc = R.pick(KCOL); extra = [s, cc]; if (uniq.some(y => key(y) === key(extra))) return null; }
  const opts = R.shuffle(uniq.concat([extra])).map(e => ({ h: shp(e[0], e[1]), v: key(e) }));
  return { kind: 'pick', layout: opts.length === 3 ? 'three' : '', ans: key(x), opts,
    scene: `<div class="kpat shp">${seq.map(e => `<span>${shp(e[0], e[1])}</span>`).join('')}<span class="q">?</span></div>`,
    text: 'Что будет дальше?', say: 'Посмотри на узор. Что будет дальше?', hint: 'Найди кусочек, который повторяется.',
    why: 'Узор повторяется.', whySay: 'Узор повторяется. Смотри, вот что дальше.' };
};
/* 8. Где что стоит: «вторым справа», ряды и стороны */
KG.k2_order = d => {
  const side = d === 1 ? 'слева' : R.pick(['слева', 'справа']), k = R.int(0, d === 1 || (d === 2 && side === 'справа') ? 2 : 4);
  const row = R.sample(ANIM, 5), ans = side === 'слева' ? k : 4 - k;
  return { kind: 'pick', layout: 'five', scene: side === 'слева' ? '<div class="kstart">считаем отсюда 👉</div>' : '<div class="kstart right">👈 считаем отсюда</div>',
    text: `Кто стоит ${ORD[k]} ${side}?`, say: `Кто стоит ${ORD[k]} ${side}?`, hint: SIDE,
    opts: row.map((a, j) => ({ h: kemo(a.e), v: j })), ans, why: `Считаем ${side}: ${ORD.slice(0, k + 1).join(', ')}.` };
};
const ROWS3 = ['верхнем', 'среднем', 'нижнем'], COLS3 = ['слева', 'посередине', 'справа'], POS4 = ['вверху слева', 'вверху справа', 'внизу слева', 'внизу справа'];
KG.k2_grid = d => {
  if (d === 3 && R.chance(0.5)) return KG.k_where(3);
  if (d === 1) {
    const grid = R.sample(TH, 4), ans = R.int(0, 3);
    return { kind: 'pick', layout: 'grid2', text: `Что лежит ${POS4[ans]}?`, say: `Что лежит ${POS4[ans]}? Нажми на это.`, hint: 'Сначала найди нужный ряд, потом — сторону.',
      opts: grid.map((x, j) => ({ h: kemo(x.e), v: j })), ans, why: `Вот оно — ${POS4[ans]}.` };
  }
  const grid = R.sample(TH, 9), ans = R.int(0, 8), r = ROWS3[Math.floor(ans / 3)], c = COLS3[ans % 3];
  return { kind: 'pick', layout: 'grid3', text: `Что лежит в ${r} ряду ${c}?`, say: `Что лежит в ${r} ряду ${c}? Нажми на это.`, hint: 'Сначала найди нужный ряд, потом — сторону.',
    opts: grid.map((x, j) => ({ h: kemo(x.e), v: j })), ans, why: `Вот оно — в ${r} ряду ${c}.` };
};
/* 9. Логика: лишняя по цвету и форме; узоры ABB и ABC */
KG.k2_odd = d => {
  const shapes = ['circle', 'square', 'triangle', 'rect'], [s, s2] = R.sample(shapes, 2), [c, c2] = R.sample(KCOL, 2);
  const how = d === 1 ? 'both' : R.pick(['color', 'shape']);
  const odd = how === 'both' ? [s2, c2] : how === 'color' ? [s, c2] : [s2, c];
  const size = () => d === 3 ? R.pick([52, 64, 80]) : 72;
  const opts = R.shuffle([[s, c, 'n0'], [s, c, 'n1'], [s, c, 'n2'], [...odd, 'odd']]).map(([k, col, v]) => ({ h: shp(k, col, size()), v }));
  return { kind: 'pick', ans: 'odd', opts, text: 'Какая фигура лишняя?', say: 'Найди лишнюю фигуру. Смотри и на цвет, и на форму.',
    hint: 'Три фигуры одинаковые и по цвету, и по форме. Найди ту, что отличается.',
    why: how === 'both' ? 'Лишняя — другого цвета и другой формы.' : how === 'color' ? 'Лишняя — другого цвета.' : 'Лишняя — другой формы.' };
};
KG.k2_pat = d => {
  const syms = R.sample(PAT, 3);
  const units = d === 1 ? [[0, 1, 1]] : d === 2 ? [[0, 1, 2], [0, 0, 1]] : [[0, 0, 1, 2], [0, 1, 1, 2], [0, 1, 2, 2]];
  const u = R.pick(units).map(i => syms[i]), len = u.length * 2 + R.int(0, u.length - 1);
  const seq = Array.from({ length: len }, (_, i) => u[i % u.length]), x = u[len % u.length];
  const opts = R.shuffle([...new Set(u)].concat([R.pick(PAT.filter(p => !u.includes(p)))]));
  return { kind: 'pick', layout: opts.length === 3 ? 'three' : '', scene: `<div class="kpat">${seq.map(e => `<span>${e}</span>`).join('')}<span class="q">?</span></div>`,
    text: 'Что будет дальше?', say: 'Посмотри на узор. Что будет дальше?', hint: 'Найди кусочек, который повторяется.',
    opts: opts.map(e => ({ h: kemo(e), v: e })), ans: x, why: `Узор повторяется: ${u.join(' ')}.`, whySay: 'Узор повторяется. Смотри, вот что дальше.' };
};

/* Какие игры на второй ступеньке и куда откатываться (back: игра первой ступеньки, её 3-й уровень) */
const KID_STEP2 = {
  k_cnt: { gens: ['k2_count', 'k2_tens'], back: { k2_count: 'k_count', k2_tens: 'k_count' } },
  k_dig: { gens: ['k2_find', 'k2_put'], back: { k2_find: 'k_digit', k2_put: 'k_put' } },
  k_cmp: { gens: ['k2_big', 'k2_sign'], back: { k2_big: 'k_sign', k2_sign: 'k_sign' } },
  k_line: { gens: ['k2_line', 'k2_next'], back: { k2_line: 'k_line', k2_next: 'k_next' } },
  k_house: { gens: ['k2_pair', 'k2_bonds'], back: { k2_pair: 'k_house', k2_bonds: 'k_house' } },
  k_add: { gens: ['k2_add', 'k2_miss'], back: { k2_add: 'k_add', k2_miss: 'k_add' } },
  k_shape: { gens: ['k2_build', 'k2_spat'], back: { k2_build: 'k_shape', k2_spat: 'k_shape' } },
  k_where: { gens: ['k2_order', 'k2_grid'], back: { k2_order: 'k_order', k2_grid: 'k_where' } },
  k_logic: { gens: ['k2_odd', 'k2_pat'], back: { k2_odd: 'k_odd', k2_pat: 'k_pattern' } }
};
const step2Key = tid => tid + '#2';
const step2Open = tid => !!KID_STEP2[tid] && (S.stars[tid] || 0) >= 3;
const kidLevel2 = tid => Math.min(3, 1 + (S.stars[step2Key(tid)] || 0));

/* Выбор ступеньки: две большие кнопки */
function kidStepPick(tid) {
  const T = KTOPIC[tid], s1 = S.stars[tid] || 0, s2 = S.stars[step2Key(tid)] || 0, star = n => `<span class="kst">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;
  modal(`<h2>${T.icon} ${T.name}</h2>
    <div class="stack kstep">
      <button class="btn green block big" data-act="kStep" data-id="${tid}" data-s="2">🌟🌟 Ступенька 2 ${star(s2)}${S.medals[step2Key(tid)] ? ' 🏅' : ''}</button>
      <button class="btn ghost block big" data-act="kStep" data-id="${tid}" data-s="1">🌟 Ступенька 1 ${star(s1)}</button></div>`);
  Voice.say('Выбери ступеньку.', 'zh');
}
ACT.kStep = el => { closeModal(); kidOpen(el.dataset.id, +el.dataset.s); };
