/* Остров правды: высказывания, общие утверждения, «хотя бы один», контрпримеры.
   Почти всё собирается из случайных чисел и слов, чтобы задания не повторялись и не угадывались. */
'use strict';

const TF = ['Истинно', 'Ложно'];
/* Свойства чисел. verb — свойство выражено глаголом («делится»), с ним звучит «ни одно … не …» */
const PROPS = [
  { s: 'чётные', one: 'чётное', t: n => n % 2 === 0, why: n => `${n} ${n % 2 ? 'не делится' : 'делится'} на 2` },
  { s: 'нечётные', one: 'нечётное', t: n => n % 2 === 1, why: n => `${n} ${n % 2 ? 'не делится' : 'делится'} на 2` },
  { s: 'оканчиваются на 0', one: 'оканчивается на 0', verb: true, t: n => n % 10 === 0, why: n => `${n} оканчивается на ${n % 10}` },
  { s: 'делятся на 3', one: 'делится на 3', verb: true, t: n => n % 3 === 0, why: n => n % 3 ? `${n} : 3 = ${Math.floor(n / 3)} (ост. ${n % 3})` : `${n} = 3 · ${n / 3}` },
  { s: 'делятся на 4', one: 'делится на 4', verb: true, t: n => n % 4 === 0, why: n => n % 4 ? `${n} : 4 = ${Math.floor(n / 4)} (ост. ${n % 4})` : `${n} = 4 · ${n / 4}` },
  { s: 'делятся на 5', one: 'делится на 5', verb: true, t: n => n % 5 === 0, why: n => `${n} оканчивается на ${n % 10}` },
  { s: 'делятся на 9', one: 'делится на 9', verb: true, t: n => n % 9 === 0, why: n => `сумма цифр ${n} равна ${digitSum(n)}` },
  { s: 'больше 50', one: 'больше 50', verb: true, t: n => n > 50, why: n => `${n} ${n > 50 ? '>' : '≤'} 50` }
];
const dash = P => P.verb ? '' : '— ';

/* Одно высказывание о числах: {s, v, why}. want — нужная истинность (или undefined — любая) */
function fact(want) {
  for (let t = 0; t < 200; t++) {
    const f = factOnce();
    if (f && (want === undefined || f.v === want)) return f;
  }
  return null;
}
function factOnce() {
  const kind = R.int(0, 5);
  if (kind === 0) {
    const k = R.pick([2, 3, 4, 5, 6, 7, 9, 10]), n = R.chance(0.5) ? k * R.int(3, 20) : R.int(12, 120);
    const v = n % k === 0;
    return { s: `${n} делится на ${k}.`, v, why: v ? `${n} = ${k} · ${n / k} — делится, истинно.` : `${n} : ${k} = ${Math.floor(n / k)} (ост. ${n % k}) — не делится, значит, ложно.` };
  }
  if (kind === 1) {
    const n = R.int(11, 199), ev = R.chance(0.5);
    const v = (n % 2 === 0) === ev;
    return { s: `Число ${n} ${ev ? 'чётное' : 'нечётное'}.`, v, why: `${n} оканчивается на ${n % 10} — оно ${n % 2 ? 'нечётное' : 'чётное'}. ${v ? 'Истинно' : 'Ложно'}.` };
  }
  if (kind === 2) {
    const n = R.pick(TRICKY.filter(x => x > 1)), v = isPrime(n);
    return { s: `Число ${n} простое.`, v, why: primeWhy(n) + (v ? ' Истинно.' : ' Ложно.') };
  }
  if (kind === 3) {
    const a = R.int(11, 60), b = R.int(11, 60), ev = R.chance(0.5), v = ((a + b) % 2 === 0) === ev;
    return { s: `Сумма ${a} + ${b} — ${ev ? 'чётное' : 'нечётное'} число.`, v, why: `${a} + ${b} = ${a + b} — ${(a + b) % 2 ? 'нечётное' : 'чётное'}. ${v ? 'Истинно' : 'Ложно'}.` };
  }
  const P = R.pick(PROPS), nums = R.sample(Array.from({ length: 90 }, (_, i) => i + 10), 3).sort((a, b) => a - b);
  const hold = nums.filter(P.t), list = nums.join(', ');
  const q = kind === 4 ? 'all' : (P.verb && R.chance(0.5) ? 'none' : 'some');
  if (q === 'all') {
    const v = hold.length === 3, bad = nums.find(n => !P.t(n));
    return { s: `Все числа ${list} ${dash(P)}${P.s}.`, v, why: v ? `Проверяем каждое: ${nums.map(P.why).join('; ')}. Истинно.` : `Контрпример: ${P.why(bad)}. Значит, ложно.` };
  }
  if (q === 'some') {
    const v = hold.length > 0;
    return { s: `Хотя бы одно из чисел ${list} ${dash(P)}${P.one}.`, v, why: v ? `Пример: ${P.why(hold[0])}. Одного примера достаточно — истинно.` : `Проверяем каждое: ${nums.map(P.why).join('; ')}. Ни одно не подходит — ложно.` };
  }
  const v = hold.length === 0;
  return { s: `Ни одно из чисел ${list} не ${P.one}.`, v, why: v ? `Проверяем каждое: ${nums.map(P.why).join('; ')}. Ни одно не подходит — истинно.` : `Но ${P.why(hold[0])}. Значит, ложно.` };
}

/* Предложения, которые НЕ являются высказываниями */
function nonStatement() {
  const a = R.int(12, 90), b = R.int(3, 9), n = b * R.int(3, 15);
  return R.pick([
    () => ({ s: `Сколько будет ${a} + ${b}?`, why: 'вопрос' }),
    () => ({ s: `Делится ли ${n} на ${b}?`, why: 'вопрос' }),
    () => ({ s: `Какое число больше: ${a} или ${a + b}?`, why: 'вопрос' }),
    () => ({ s: `Найди сумму чисел ${a} и ${b}.`, why: 'просьба' }),
    () => ({ s: `Раздели ${n} на ${b}!`, why: 'просьба' }),
    () => ({ s: `Запиши число ${a} цифрами.`, why: 'просьба' }),
    () => ({ s: `x + ${b} = ${a}`, why: 'предложение с переменной: пока x неизвестен, нельзя сказать, истинно или ложно' }),
    () => ({ s: `${n} делится на y.`, why: 'предложение с переменной: неизвестно, чему равно y' }),
    () => ({ s: 'Какая интересная задача!', why: 'восклицание' }),
    () => ({ s: 'Ура, у нас каникулы!', why: 'восклицание' })
  ])();
}
const NOTE_STMT = 'Высказывание — утверждение, про которое можно сказать: истинно оно или ложно. Ложное утверждение — тоже высказывание!';

reg('logic', 'log_tf', d => {
  if (d === 1) {
    const ns = R.int(2, 3), st = [], non = [], seen = new Set();
    while (st.length < ns) { const f = fact(); if (f && !seen.has(f.s)) { seen.add(f.s); st.push(f); } }
    while (non.length < 5 - ns) { const x = nonStatement(); if (!seen.has(x.s)) { seen.add(x.s); non.push(x); } }
    const all = R.shuffle(st.map(x => ({ s: x.s, ok: true, why: 'утверждение, оно ' + (x.v ? 'истинно' : 'ложно') + ' — высказывание' })).concat(non.map(x => ({ s: x.s, ok: false, why: x.why + ' — не высказывание' }))));
    return { q: 'Отметь все <b>высказывания</b>:', type: 'multi', wide: true, items: all.map(x => x.s), answer: all.filter(x => x.ok).map(x => x.s),
      hint: NOTE_STMT, explain: [NOTE_STMT].concat(all.map(x => `«${x.s}» — ${x.why}.`)) };
  }
  if (d === 2) {
    const fs = [], seen = new Set();
    const want = R.shuffle([true, false, R.chance(0.5), R.chance(0.5)]);
    for (const w of want) { let f; do { f = fact(w); } while (f && seen.has(f.s)); if (!f) return null; seen.add(f.s); fs.push(f); }
    return { q: 'Отметь все <b>истинные</b> высказывания:', type: 'multi', wide: true, items: fs.map(x => x.s), answer: fs.filter(x => x.v).map(x => x.s),
      hint: '«Все» — проверь каждое число. «Хотя бы одно» — хватит одного примера. «Ни одно» — проверь каждое.', explain: fs.map(x => `«${x.s}» ${x.why}`) };
  }
  const n = R.int(4, 5), fs = [], seen = new Set();
  while (fs.length < n) { const f = fact(); if (f && !seen.has(f.s)) { seen.add(f.s); fs.push(f); } }
  const k = fs.filter(x => x.v).length;
  return { q: `Сколько из этих высказываний <b>истинны</b>?<ol class="facts">${fs.map(x => `<li>${x.s}</li>`).join('')}</ol>`, type: 'num', answer: k, draft: true,
    traps: [[n - k, 'Похоже, посчитаны ложные высказывания, а нужно истинные.']],
    hint: 'Проверь каждое по очереди и ставь на черновике «И» или «Л».', explain: fs.map((x, i) => `${i + 1}) ${x.why}`).concat([`Истинных: ${k}.`]) };
});

/* Контрпример к «Все числа, которые …, …». Явные формы — без склеивания окончаний */
const IMPL = [
  { a: 'делятся на 3', aOne: 'делится на 3', aInf: 'делиться на 3', b: 'делятся на 6', bOne: 'делится на 6', bInf: 'делиться на 6', A: n => n % 3 === 0, B: n => n % 6 === 0 },
  { a: 'делятся на 2', aOne: 'делится на 2', aInf: 'делиться на 2', b: 'делятся на 4', bOne: 'делится на 4', bInf: 'делиться на 4', A: n => n % 2 === 0, B: n => n % 4 === 0 },
  { a: 'оканчиваются на 4', aOne: 'оканчивается на 4', aInf: 'оканчиваться на 4', b: 'делятся на 4', bOne: 'делится на 4', bInf: 'делиться на 4', A: n => n % 10 === 4, B: n => n % 4 === 0 },
  { a: 'делятся на 5', aOne: 'делится на 5', aInf: 'делиться на 5', b: 'делятся на 10', bOne: 'делится на 10', bInf: 'делиться на 10', A: n => n % 5 === 0, B: n => n % 10 === 0 },
  { a: 'больше 20', aOne: 'больше 20', aInf: 'быть больше 20', b: 'больше 30', bOne: 'больше 30', bInf: 'быть больше 30', A: n => n > 20, B: n => n > 30 },
  { a: 'делятся на 4', aOne: 'делится на 4', aInf: 'делиться на 4', b: 'делятся на 8', bOne: 'делится на 8', bInf: 'делиться на 8', A: n => n % 4 === 0, B: n => n % 8 === 0 },
  { a: 'оканчиваются на 5', aOne: 'оканчивается на 5', aInf: 'оканчиваться на 5', b: 'делятся на 15', bOne: 'делится на 15', bInf: 'делиться на 15', A: n => n % 10 === 5, B: n => n % 15 === 0 },
  { a: 'делятся на 6', aOne: 'делится на 6', aInf: 'делиться на 6', b: 'делятся на 12', bOne: 'делится на 12', bInf: 'делиться на 12', A: n => n % 6 === 0, B: n => n % 12 === 0 },
  { a: 'чётные', aOne: 'чётное', aInf: 'быть чётным', b: 'делятся на 6', bOne: 'делится на 6', bInf: 'делиться на 6', A: n => n % 2 === 0, B: n => n % 6 === 0 }
];
reg('logic', 'log_counter', d => {
  const P = R.pick(IMPL);
  const claim = `«Все числа, которые ${P.a}, ${P.b}»`;
  const hint = `Контрпример должен ${P.aInf}, но при этом НЕ ${P.bInf}.`;
  const ceWhy = n => `${n}: ${P.aOne} ✓, но не ${P.bOne} ✗`;
  if (d === 2) {
    const two = Array.from({ length: 90 }, (_, i) => i + 10);
    const right = two.find(n => P.A(n) && !P.B(n)); if (!right) return null;
    const conf = two.find(n => P.A(n) && P.B(n)), notA = two.find(n => !P.A(n) && !P.B(n));
    return { q: `Найди <b>наименьшее двузначное</b> число, которое опровергает утверждение:<br><b>${claim}</b>`, type: 'num', answer: right, hint,
      traps: [[conf, `${conf} ${P.aOne} и ${P.bOne} — оно подтверждает утверждение, а не опровергает.`], [notA, `${notA} не ${P.aOne} — про такие числа утверждение ничего не говорит.`]],
      explain: ['Контрпример — число, для которого условие выполняется, а вывод — нет.', `Перебираем с 10: первое такое число — ${ceWhy(right)}.`] };
  }
  const pool = Array.from({ length: 95 }, (_, i) => i + 4);
  const ce = R.shuffle(pool.filter(n => P.A(n) && !P.B(n)));
  const good = R.shuffle(pool.filter(n => P.A(n) && P.B(n)));
  const notA = R.shuffle(pool.filter(n => !P.A(n)));
  if (ce.length < 3 || good.length < 3) return null;
  if (d === 3) {
    const k = R.int(1, 3), row = R.shuffle(ce.slice(0, k).concat(good.slice(0, R.int(2, 3)), notA.slice(0, 8))).slice(0, 8);
    const cnt = row.filter(n => P.A(n) && !P.B(n)).length; if (!cnt) return null;
    const notB = row.filter(n => !P.B(n)).length;
    return { q: `Сколько чисел из ряда <b>${row.join(', ')}</b> опровергают утверждение:<br><b>${claim}</b>?`, type: 'num', answer: cnt, hint, draft: true,
      traps: [[notB, `Числа, которые не ${P.a}, ничего не опровергают: утверждение говорит только о тех, что ${P.a}.`], [row.filter(P.A).length, 'Числа, для которых верно и условие, и вывод, утверждение подтверждают.']],
      explain: ['Контрпример — число, для которого условие выполняется, а вывод — нет.'].concat(row.filter(n => P.A(n) && !P.B(n)).map(ceWhy), [`Всего: ${cnt}.`]) };
  }
  const right = ce[0], dis = [good[0], good[1], R.chance(0.5) ? good[2] : notA[0]];
  return { q: `Какое число <b>опровергает</b> утверждение:<br><b>${claim}</b>?`, type: 'choice', options: choices(right, dis), answer: fmt(right), hint,
    traps: dis.map(n => [fmt(n), P.A(n) ? `${n} ${P.aOne} и ${P.bOne} — оно подтверждает утверждение.` : `${n} не ${P.aOne} — оно ничего не опровергает.`]),
    explain: ['Контрпример — число, для которого условие выполняется, а вывод — нет.', ceWhy(right) + '.'] };
});

/* Отрицание: подлежащее × сказуемое, кванторы согласованы по роду */
const SUBJ = [
  { one: 'бурундук', pl: 'бурундуки', f: false }, { one: 'белка', pl: 'белки', f: true }, { one: 'ёжик', pl: 'ёжики', f: false },
  { one: 'сова', pl: 'совы', f: true }, { one: 'ученик', pl: 'ученики', f: false }, { one: 'мышка', pl: 'мышки', f: true }
];
const PRED = [
  { pl: 'любят орехи', one: 'любит орехи' }, { pl: 'умеют плавать', one: 'умеет плавать' }, { pl: 'живут в лесу', one: 'живёт в лесу' },
  { pl: 'знают таблицу умножения', one: 'знает таблицу умножения' }, { pl: 'спят зимой', one: 'спит зимой' }, { pl: 'умеют считать', one: 'умеет считать' }
];
reg('logic', 'log_neg', d => {
  const S = R.pick(SUBJ), P = R.pick(PRED);
  const one = S.f ? 'одна' : 'один', each = S.f ? 'Каждая' : 'Каждый';
  const F = {
    all: `Все ${S.pl} ${P.pl}.`, each: `${each} ${S.one} ${P.one}.`, allNot: `Все ${S.pl} не ${P.pl}.`,
    some: `Хотя бы ${one} ${S.one} ${P.one}.`, someNot: `Хотя бы ${one} ${S.one} не ${P.one}.`, none: `Ни ${one} ${S.one} не ${P.one}.`,
    several: `Некоторые ${S.pl} ${P.pl}.`, severalNot: `Некоторые ${S.pl} не ${P.pl}.`
  };
  const kinds = d === 1 ? ['all', 'each'] : d === 2 ? ['all', 'each', 'some'] : ['some', 'none', 'all'];
  const k = R.pick(kinds);
  let r, bad, traps;
  if (k === 'all' || k === 'each') {
    r = F.someNot; bad = [k === 'all' ? F.allNot : `${each} ${S.one} не ${P.one}.`, F.none, F.some];
    traps = [[bad[0], `Это слишком сильно. Чтобы «${F[k].replace(/\.$/, '')}» стало ложным, хватит одного, кто не ${P.one}.`], [F.none, '«Ни один не …» — тоже слишком сильно: хватит одного примера.']];
  } else if (k === 'some') {
    r = F.none; bad = [F.someNot, F.all, F.severalNot];
    traps = [[F.someNot, `Оба высказывания могут быть истинными сразу: если кто-то ${P.one}, а кто-то нет. А отрицание истинно только тогда, когда исходное ложно.`]];
  } else {
    r = F.some; bad = [F.all, F.someNot, F.allNot];
    traps = [[F.all, '«Все» — слишком сильно. Чтобы опровергнуть «ни один», хватит одного примера.']];
  }
  return { q: `Выбери <b>отрицание</b> высказывания:<br><b>«${F[k]}»</b>`, type: 'choice', options: choices(r, bad), answer: r, wide: true, traps,
    hint: 'Отрицание истинно ровно тогда, когда исходное высказывание ложно. Чтобы опровергнуть «все», хватит одного примера.',
    explain: ['Отрицание «Все … » — «Хотя бы один … не …».', 'Отрицание «Хотя бы один … » — «Ни один … не …», и наоборот.', `Ответ: ${r}`] };
});

/* Общее утверждение или утверждение о существовании */
function kindStatement() {
  const S = R.pick(SUBJ), P = R.pick(PRED), one = S.f ? 'одна' : 'один';
  const Pn = R.pick(PROPS), nums = R.sample(Array.from({ length: 90 }, (_, i) => i + 10), 3).sort((a, b) => a - b).join(', ');
  const k = R.int(2, 9);
  return R.pick([
    () => ({ s: `Все ${S.pl} ${P.pl}.`, gen: true }),
    () => ({ s: `${S.f ? 'Каждая' : 'Каждый'} ${S.one} ${P.one}.`, gen: true }),
    () => ({ s: `Любое число, которое делится на ${k * 2}, делится на ${k}.`, gen: true }),
    () => ({ s: `Все числа ${nums} ${dash(Pn)}${Pn.s}.`, gen: true }),
    () => ({ s: `Ни ${one} ${S.one} не ${P.one}.`, gen: true }),
    () => ({ s: `Хотя бы ${one} ${S.one} ${P.one}.`, gen: false }),
    () => ({ s: `Некоторые ${S.pl} ${P.pl}.`, gen: false }),
    () => ({ s: `Существует двузначное число, которое делится на ${k + 10}.`, gen: false }),
    () => ({ s: `Хотя бы одно из чисел ${nums} ${dash(Pn)}${Pn.one}.`, gen: false })
  ])();
}
reg('logic', 'log_proof', d => {
  if (d === 1) {
    const items = [], seen = new Set();
    for (let t = 0; t < 100 && items.length < 5; t++) { const x = kindStatement(); if (!seen.has(x.s)) { seen.add(x.s); items.push(x); } }
    const g = items.filter(x => x.gen).length; if (!g || g === items.length) return null;
    return { q: 'Отметь все <b>общие</b> утверждения:', type: 'multi', wide: true, items: items.map(x => x.s), answer: items.filter(x => x.gen).map(x => x.s),
      hint: 'Слова «все, каждый, любой, ни один» — общее утверждение. «Существует, хотя бы один, некоторые» — утверждение о существовании.',
      explain: ['Общее утверждение говорит про всех: «все», «каждый», «любой», «ни один».'].concat(items.map(x => `«${x.s}» — ${x.gen ? 'общее' : 'о существовании'}.`)) };
  }
  for (let t = 0; t < 50; t++) {
    const a = R.pick([3, 4, 6, 7, 9, 11, 12]), b = R.pick([2, 3, 4, 5, 6]); if (a === b || a % b === 0 || b % a === 0) continue;
    const l = a * b / gcd(a, b);
    if (l > 99) continue;
    if (d === 3) {
      const right = Math.ceil(10 / l) * l;
      return { q: `Найди <b>наименьшее двузначное</b> число, которое делится и на ${a}, и на ${b}.`, type: 'num', answer: right,
        traps: [[a * b, `${a * b} = ${a} · ${b} подходит, но есть число и поменьше.`], [l < 10 ? l : null, `${l} — однозначное, а нужно двузначное.`]],
        hint: `Перебирай числа, кратные ${Math.max(a, b)}: ${Math.max(a, b)}, ${2 * Math.max(a, b)}, … — и проверяй делимость на ${Math.min(a, b)}.`,
        explain: [`Кратные ${Math.max(a, b)}: ${Array.from({ length: Math.ceil(right / Math.max(a, b)) }, (_, i) => (i + 1) * Math.max(a, b)).join(', ')}.`, `${right} = ${a} · ${right / a} и ${right} = ${b} · ${right / b} ✓ — первое двузначное.`] };
    }
    const right = l * R.int(1, Math.floor(99 / l));
    const dis = R.shuffle([right + a, right - b, a * 10 + 1, b * 7 + 1, right + 1].filter(n => n > 0 && !(n % a === 0 && n % b === 0)));
    return { q: `Как доказать, что <b>существует</b> число, которое делится и на ${a}, и на ${b}?<br>Выбери пример:`, type: 'choice',
      options: choices(right, dis), answer: fmt(right), hint: `Проверь каждое число: делится ли оно и на ${a}, и на ${b}?`,
      explain: ['Утверждение о существовании доказывают одним примером.', `${right} = ${a} · ${right / a} и ${right} = ${b} · ${right / b} ✓`] };
  }
  return null;
});
