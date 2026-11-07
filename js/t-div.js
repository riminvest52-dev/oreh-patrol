/* Ореховый склад (делители, кратные, простые, делимость суммы/произведения) и Сито (признаки делимости) */
'use strict';

function multiTask(q, items, isRight, hint, explain) {
  const answer = items.filter(isRight).map(String);
  return { q, type: 'multi', items: items.map(String), answer, hint, explain };
}
const YN = ['Да', 'Нет'];

reg('div', 'div_divisors', d => {
  if (d === 1) {
    const N = R.pick([12, 15, 16, 18, 20, 24, 28, 30, 36]);
    const divs = divisors(N), non = R.sample(Array.from({ length: N }, (_, i) => i + 1).filter(x => N % x), Math.max(3, 10 - divs.length));
    const items = divs.concat(non).sort((a, b) => a - b);
    return multiTask(`Отметь <b>все делители</b> числа ${N}:`, items, x => N % x === 0, 'Делитель — число, на которое ' + N + ' делится без остатка. Не забудь 1 и само число!',
      [`Ищем парами: ${divs.filter(x => x * x <= N).map(x => `${x} · ${N / x}`).join(', ')}.`, `Делители ${N}: ${divs.join(', ')}.`]);
  }
  if (d === 2) {
    const N = R.pick([36, 48, 60, 42, 45, 72, 64, 100, 54, 40]);
    const divs = divisors(N);
    return { q: `Сколько делителей у числа <b>${N}</b>?`, type: 'num', answer: divs.length, hint: 'Ищи делители парами: 1 и ' + N + ', 2 и …',
      explain: [`Пары: ${divs.filter(x => x * x <= N).map(x => `${x} · ${N / x}`).join(', ')}.`, `Все делители: ${divs.join(', ')} — всего ${divs.length}.`] };
  }
  const N = R.pick([12, 18, 20, 28, 30, 24, 16, 6]);
  const pd = divisors(N).filter(x => x < N), s = pd.reduce((a, b) => a + b, 0);
  return { q: `Найди сумму всех делителей числа <b>${N}</b>, кроме самого числа ${N}.`, type: 'num', answer: s, hint: 'Сначала выпиши все делители по порядку.',
    explain: [`Делители (кроме ${N}): ${pd.join(', ')}.`, `${pd.join(' + ')} = ${s}.`].concat(s === N ? [`Сумма равна самому числу! Такие числа называют совершенными.`] : []) };
});

reg('div', 'div_multiples', d => {
  if (d === 1) {
    if (R.chance(0.35)) {
      const a = R.int(2, 9), k = R.int(2, 9), b = a * k;
      const kind = R.int(0, 1);
      const qtext = kind ? `Число ${b} для числа ${a} — это…` : `Число ${a} для числа ${b} — это…`;
      const right = kind ? 'кратное' : 'делитель';
      return { q: qtext, type: 'choice', options: ['делитель', 'кратное', 'ни то, ни другое'], answer: right, hint: 'Делитель — меньшее (на него делим). Кратное — большее (делится на данное).',
        explain: [`${b} : ${a} = ${k} без остатка.`, `Значит ${a} — делитель числа ${b}, а ${b} — кратное числа ${a}.`] };
    }
    const k = R.int(3, 9);
    const mult = R.sample(Array.from({ length: 12 }, (_, i) => k * (i + 2)), 4);
    const non = R.sample(Array.from({ length: 80 }, (_, i) => i + 10).filter(x => x % k), 4);
    const items = R.shuffle(mult.concat(non));
    return multiTask(`Отметь все числа, <b>кратные ${k}</b>:`, items, x => x % k === 0, `Кратное ${k} — число, которое делится на ${k} без остатка.`,
      [`Кратные ${k}: ${items.filter(x => x % k === 0).sort((a, b) => a - b).map(x => `${x} = ${k} · ${x / k}`).join('; ')}.`]);
  }
  if (d === 2) {
    const k = R.int(6, 19);
    if (R.chance(0.5)) { const a = Math.ceil(100 / k) * k; return { q: `Найди <b>наименьшее трёхзначное</b> число, кратное ${k}.`, type: 'num', answer: a,
      hint: `100 : ${k} = ? Посмотри, сколько не хватает.`, explain: [`100 : ${k} = ${Math.floor(100 / k)} (ост. ${100 % k}) — 100 не делится.`, `${Math.ceil(100 / k)} · ${k} = ${a} — первое трёхзначное кратное.`] }; }
    const a = Math.floor(99 / k) * k;
    return { q: `Найди <b>наибольшее двузначное</b> число, кратное ${k}.`, type: 'num', answer: a,
      hint: `99 : ${k} = ? Возьми целую часть и умножь обратно.`, explain: [`99 : ${k} = ${Math.floor(99 / k)} (ост. ${99 % k}).`, `${Math.floor(99 / k)} · ${k} = ${a}.`] };
  }
  const k = R.int(4, 9), a = R.int(10, 40), b = a + R.int(30, 60);
  const list = []; for (let n = a; n <= b; n++) if (n % k === 0) list.push(n);
  return { q: `Сколько чисел, кратных ${k}, находится между ${a} и ${b} (включая их)?`, type: 'num', answer: list.length,
    hint: `Найди первое кратное ${k} после ${a - 1} и шагай по ${k}.`, explain: [`Кратные ${k}: ${list.join(', ')}.`, `Всего ${list.length}.`] };
});

const TRICKY = [1, 2, 9, 15, 21, 27, 33, 39, 49, 51, 57, 87, 91, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 77, 63, 81, 93];
function primeWhy(n) {
  if (n === 1) return 'У 1 только один делитель — она ни простая, ни составная.';
  if (isPrime(n)) return `У ${n} только два делителя: 1 и ${n}. Простое.`;
  const p = divisors(n)[1];
  return `${n} = ${p} · ${n / p} — есть делитель кроме 1 и ${n}. Составное.`;
}
reg('div', 'div_prime', d => {
  if (d === 1) {
    const items = R.sample(Array.from({ length: 29 }, (_, i) => i + 1), 10).sort((a, b) => a - b);
    if (!items.some(isPrime) || items.every(isPrime)) return null;
    return multiTask('Отметь все <b>простые</b> числа:', items, isPrime, 'Простое число имеет ровно два делителя: 1 и само себя. Число 1 — не простое!',
      [`Простые: ${items.filter(isPrime).join(', ')}.`].concat(items.filter(x => !isPrime(x)).slice(0, 4).map(primeWhy)));
  }
  if (d === 2) {
    const n = R.pick(TRICKY), opts = ['Простое', 'Составное', 'Ни простое, ни составное'];
    return { q: `Число <b>${n}</b> — простое или составное?`, type: 'choice', options: opts, answer: n === 1 ? opts[2] : isPrime(n) ? opts[0] : opts[1],
      hint: 'Попробуй разделить на 2, 3, 5, 7…', explain: [primeWhy(n)] };
  }
  if (R.chance(0.5)) {
    const ps = [7, 11, 13, 17, 19, 23], p = R.pick([3, 7, 11, 13]), q = R.pick(ps.filter(x => x !== p));
    const n = p * q;
    return { q: `Число ${n} — произведение двух простых чисел. Найди <b>большее</b> из них.`, type: 'num', answer: Math.max(p, q),
      hint: 'Пробуй делить на 3, 7, 11, 13…', explain: [`${n} = ${Math.min(p, q)} · ${Math.max(p, q)}.`, `Оба множителя простые, большее — ${Math.max(p, q)}.`] };
  }
  const a = R.pick([10, 20, 30, 40, 50, 60, 70, 80]), b = a + 20;
  const list = []; for (let n = a; n <= b; n++) if (isPrime(n)) list.push(n);
  return { q: `Сколько простых чисел между ${a} и ${b}?`, type: 'num', answer: list.length, hint: 'Чётные (кроме 2) и оканчивающиеся на 5 сразу отбрасывай.',
    explain: [`Простые: ${list.join(', ')}.`, `Всего ${list.length}.`] };
});

reg('div', 'div_sum', d => {
  const rule = 'Если каждое слагаемое делится на число, то и сумма делится. Если одно слагаемое не делится, а остальные делятся — сумма не делится.';
  if (d === 1 || (d === 2 && R.chance(0.4))) {
    const k = R.pick([3, 4, 5, 6, 7, 8, 9, 11, 12]);
    const a = k * R.int(5, 40), both = R.chance(0.5);
    let b; if (both) b = k * R.int(2, 12); else { do { b = R.int(10, 99); } while (b % k === 0); }
    const sub = R.chance(0.3) && a > b, s = sub ? '−' : '+';
    return { q: `Не вычисляя, определи: делится ли <span class="ex">${a} ${s} ${b}</span> на ${k}?`, type: 'choice', options: YN, answer: both ? 'Да' : 'Нет', hint: rule,
      explain: [`${a} делится на ${k} (${a} = ${k} · ${a / k}).`, both ? `${b} делится на ${k} (${b} = ${k} · ${b / k}) — значит, и ${sub ? 'разность' : 'сумма'} делится.` : `${b} не делится на ${k} — значит, ${sub ? 'разность' : 'сумма'} не делится.`] };
  }
  if (d === 2) {
    const k = R.pick([3, 5, 7, 11]);
    const a = k * R.int(2, 9), yes = R.chance(0.6);
    let b; if (yes) b = R.int(11, 40); else { do { b = R.int(11, 40); } while (b % k === 0); }
    if (!yes) { let x; do { x = R.int(4, 30); } while (x % k === 0); return { q: `Делится ли произведение <span class="ex">${x} · ${b}</span> на ${k}?`, type: 'choice', options: YN, answer: 'Нет',
      hint: `${k} — простое. Произведение делится на простое число, только если хотя бы один множитель делится на него.`, explain: [`Ни ${x}, ни ${b} не делятся на ${k}, а ${k} — простое число. Значит, произведение не делится.`, `Проверка: ${x} · ${b} = ${x * b}, ${x * b} : ${k} = ${Math.floor(x * b / k)} (ост. ${x * b % k}).`] }; }
    return { q: `Делится ли произведение <span class="ex">${a} · ${b}</span> на ${k}?`, type: 'choice', options: YN, answer: 'Да',
      hint: 'Если хотя бы один множитель делится на число, то и произведение делится.', explain: [`${a} = ${k} · ${a / k} — делится на ${k}.`, 'Значит, и всё произведение делится на ' + k + '.'] };
  }
  const k = R.pick([3, 5, 7, 9]);
  let a, b; do { a = R.int(11, 60); b = R.int(11, 60); } while (a % k === 0 || b % k === 0);
  const yes = (a + b) % k === 0;
  if (R.chance(0.5)) return { q: `Оба числа ${a} и ${b} не делятся на ${k}. Делится ли их сумма на ${k}?`, type: 'choice', options: ['Да', 'Нет', 'Без вычисления не узнать'],
    answer: yes ? 'Да' : 'Нет', hint: 'Правило о делимости суммы здесь не помогает — придётся посчитать!',
    explain: ['Если оба слагаемых не делятся, правило ничего не говорит — нужно вычислить.', `${a} + ${b} = ${a + b}; ${a + b} : ${k} = ${Math.floor((a + b) / k)}${yes ? ' — делится!' : ` (ост. ${(a + b) % k}) — не делится.`}`] };
  let x, y; do { x = R.int(11, 40); y = k * R.int(2, 8) - x; } while (x % k === 0 || y <= 0 || y % k === 0);
  return { q: `Истинно или ложно?<br><b>«Если оба слагаемых не делятся на ${k}, то и сумма не делится на ${k}»</b>`, type: 'choice', options: TF, answer: TF[1],
    hint: 'Попробуй найти контрпример.', explain: [`Контрпример: ${x} + ${y} = ${x + y}. Ни ${x}, ни ${y} не делятся на ${k}, а ${x + y} делится!`, 'Значит, утверждение ложно.'] };
});

/* ---------- Сито: признаки делимости ---------- */
const SIGN = {
  2: { t: n => n % 2 === 0, rule: 'На 2 делятся числа, которые оканчиваются чётной цифрой (0, 2, 4, 6, 8).', why: n => `оканчивается на ${n % 10}` },
  5: { t: n => n % 5 === 0, rule: 'На 5 делятся числа, которые оканчиваются на 0 или 5.', why: n => `оканчивается на ${n % 10}` },
  10: { t: n => n % 10 === 0, rule: 'На 10 делятся числа, которые оканчиваются на 0.', why: n => `оканчивается на ${n % 10}` },
  3: { t: n => n % 3 === 0, rule: 'На 3 делятся числа, сумма цифр которых делится на 3.', why: n => `сумма цифр ${digitSum(n)}` },
  9: { t: n => n % 9 === 0, rule: 'На 9 делятся числа, сумма цифр которых делится на 9.', why: n => `сумма цифр ${digitSum(n)}` },
  6: { t: n => n % 6 === 0, rule: 'На 6 делится число, которое делится и на 2, и на 3.', why: n => `${n % 2 ? 'нечётное' : 'чётное'}, сумма цифр ${digitSum(n)}` },
  15: { t: n => n % 15 === 0, rule: 'На 15 делится число, которое делится и на 3, и на 5.', why: n => `оканчивается на ${n % 10}, сумма цифр ${digitSum(n)}` }
};
reg('sieve', 'sv_check', d => {
  const k = d === 1 ? R.pick([2, 5, 10]) : d === 2 ? R.pick([3, 9]) : R.pick([6, 15, 9]);
  const S = SIGN[k], lo = d === 1 ? 100 : 1000, hi = d === 1 ? 9999 : 99999;
  const yes = [], no = [];
  while (yes.length < 3) { const n = k * R.int(Math.ceil(lo / k), Math.floor(hi / k)); if (!yes.includes(n)) yes.push(n); }
  while (no.length < 4) { const n = R.int(lo, hi); if (!S.t(n) && !no.includes(n)) no.push(n); }
  const items = R.shuffle(R.sample(yes, R.int(2, 3)).concat(no.slice(0, R.int(3, 4))));
  return { q: `Отметь числа, которые <b>делятся на ${k}</b>:`, type: 'multi', items: items.map(fmt), answer: items.filter(S.t).map(fmt), hint: S.rule,
    explain: [S.rule].concat(items.map(n => `${fmt(n)}: ${S.why(n)} → ${S.t(n) ? 'делится ✓' : 'не делится'}`)) };
});

reg('sieve', 'sv_digit', d => {
  if (d === 1) {
    const k = R.pick([2, 5, 10, 3, 9]), S = SIGN[k], yes = R.chance(0.5);
    let n; do { n = R.int(1000, 99999); } while (S.t(n) !== yes);
    return { q: `Делится ли число <b>${fmt(n)}</b> на ${k}?`, type: 'choice', options: YN, answer: yes ? 'Да' : 'Нет', hint: S.rule, explain: [S.rule, `${fmt(n)}: ${S.why(n)} → ${yes ? 'делится' : 'не делится'}.`] };
  }
  for (let t = 0; t < 100; t++) {
    const len = R.int(3, 4), pos = R.int(1, len - 1);
    const digits = Array.from({ length: len }, (_, i) => i === 0 ? R.int(1, 9) : R.int(0, 9));
    const k = d === 2 ? R.pick([3, 9]) : R.pick([3, 6, 9]);
    const ok = [];
    for (let c = 0; c <= 9; c++) { const ds = digits.slice(); ds[pos] = c; if (+ds.join('') % k === 0) ok.push(c); }
    if (!ok.length) continue;
    const mask = digits.map((x, i) => i === pos ? '*' : x).join('');
    const sOther = digits.reduce((s, x, i) => i === pos ? s : s + x, 0);
    if (d === 2) {
      const ask = ok.length === 1 ? 'Какую цифру' : 'Какую <b>наименьшую</b> цифру';
      return { q: `${ask} можно поставить вместо *, чтобы число <b>${mask}</b> делилось на ${k}?`, type: 'num', answer: ok[0], hint: SIGN[k].rule,
        explain: [SIGN[k].rule, `Сумма известных цифр: ${sOther}.`, `Подходят цифры: ${ok.join(', ')}. ${ok.length > 1 ? 'Наименьшая — ' + ok[0] + '.' : ''}`] };
    }
    if (ok.length < 2 && R.chance(0.7)) continue;
    return { q: `Сколько существует цифр, которые можно поставить вместо *, чтобы число <b>${mask}</b> делилось на ${k}?`, type: 'num', answer: ok.length, hint: SIGN[k].rule,
      explain: [SIGN[k].rule, `Сумма известных цифр: ${sOther}.`, `Подходят цифры: ${ok.join(', ')} — всего ${ok.length}.`] };
  }
  return null;
});
