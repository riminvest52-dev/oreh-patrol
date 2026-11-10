/* Ореховый склад (делители, кратные, простые, делимость суммы/произведения) и Сито (признаки делимости) */
'use strict';

function multiTask(q, items, isRight, hint, explain) {
  const answer = items.filter(isRight).map(String);
  return { q, type: 'multi', items: items.map(String), answer, hint, explain };
}

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
      traps: [[divs.length - 2, `Похоже, забыты делители 1 и ${N} — они тоже считаются.`], [divs.length - 1, `Проверь, не пропущен ли делитель 1 или само число ${N}.`]],
      explain: [`Пары: ${divs.filter(x => x * x <= N).map(x => `${x} · ${N / x}`).join(', ')}.`, `Все делители: ${divs.join(', ')} — всего ${divs.length}.`] };
  }
  const N = R.pick([12, 18, 20, 28, 30, 24, 16, 6]);
  const pd = divisors(N).filter(x => x < N), s = pd.reduce((a, b) => a + b, 0);
  return { q: `Найди сумму всех делителей числа <b>${N}</b>, кроме самого числа ${N}.`, type: 'num', answer: s, hint: 'Сначала выпиши все делители по порядку.',
    traps: [[s + N, `Само число ${N} по условию не считаем.`], [s - 1, 'Число 1 — тоже делитель, его нужно прибавить.']],
    explain: [`Делители (кроме ${N}): ${pd.join(', ')}.`, `${pd.join(' + ')} = ${s}.`].concat(s === N ? [`Сумма равна самому числу! Такие числа называют совершенными.`] : []) };
});

reg('div', 'div_multiples', d => {
  if (d === 1) {
    if (R.chance(0.35)) {
      const a = R.int(2, 9), k = R.int(2, 9), b = a * k;
      const kind = R.int(0, 1);
      const qtext = kind ? `Число ${b} для числа ${a} — это…` : `Число ${a} для числа ${b} — это…`;
      const right = kind ? 'кратное' : 'делитель';
      return { q: qtext, type: 'choice', options: ['делитель', 'кратное', 'ни то, ни другое'], answer: right, traps: [[kind ? 'делитель' : 'кратное', kind ? `${b} больше ${a} и делится на ${a} — значит, это кратное.` : `${a} меньше ${b}, и ${b} на него делится — значит, это делитель.`]],
        hint: 'Делитель — меньшее (на него делим). Кратное — большее (делится на данное).',
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
      traps: [[a - k, `${a - k} — двузначное, а нужно трёхзначное.`], [a + k, `Есть трёхзначное кратное ${k} и поменьше.`]],
      hint: `100 : ${k} = ? Посмотри, сколько не хватает.`, explain: [`100 : ${k} = ${Math.floor(100 / k)} (ост. ${100 % k}) — 100 не делится.`, `${Math.ceil(100 / k)} · ${k} = ${a} — первое трёхзначное кратное.`] }; }
    const a = Math.floor(99 / k) * k;
    return { q: `Найди <b>наибольшее двузначное</b> число, кратное ${k}.`, type: 'num', answer: a,
      traps: [[a + k, `${a + k} — уже трёхзначное.`], [a - k, `Есть двузначное кратное ${k} и побольше.`]],
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
      traps: n === 1 ? [[opts[0], 'У простого числа ровно два делителя, а у 1 — только один.']] : isPrime(n) ? [[opts[1], `Попробуй найти делитель ${n}, кроме 1 и ${n}, — не получится.`]] : [[opts[0], `Нечётное — ещё не значит простое: ${n} = ${divisors(n)[1]} · ${n / divisors(n)[1]}.`]],
      hint: 'Попробуй разделить на 2, 3, 5, 7…', explain: [primeWhy(n)] };
  }
  if (R.chance(0.5)) {
    const ps = [7, 11, 13, 17, 19, 23], p = R.pick([3, 7, 11, 13]), q = R.pick(ps.filter(x => x !== p));
    const n = p * q;
    return { q: `Число ${n} — произведение двух простых чисел. Найди <b>большее</b> из них.`, type: 'num', answer: Math.max(p, q), traps: [[Math.min(p, q), 'Это меньший множитель, а нужен больший.']],
      hint: 'Пробуй делить на 3, 7, 11, 13…', explain: [`${n} = ${Math.min(p, q)} · ${Math.max(p, q)}.`, `Оба множителя простые, большее — ${Math.max(p, q)}.`] };
  }
  const a = R.pick([10, 20, 30, 40, 50, 60, 70, 80]), b = a + 20;
  const list = []; for (let n = a; n <= b; n++) if (isPrime(n)) list.push(n);
  return { q: `Сколько простых чисел между ${a} и ${b}?`, type: 'num', answer: list.length, hint: 'Чётные (кроме 2) и оканчивающиеся на 5 сразу отбрасывай.',
    explain: [`Простые: ${list.join(', ')}.`, `Всего ${list.length}.`] };
});

reg('div', 'div_sum', d => {
  const rule = 'Если каждое слагаемое делится на число, то и сумма делится. Если одно слагаемое не делится, а остальные делятся — сумма не делится.';
  /* Без «Да / Нет»: выбор из четырёх, отметка нескольких или ввод числа */
  if (d === 1 || (d === 2 && R.chance(0.4))) {
    const k = R.pick([3, 4, 5, 6, 7, 8, 9, 11, 12]), a = k * R.int(12, 60), v = R.int(0, 2);
    const notK = (lo, hi) => { let x; do { x = R.int(lo, hi); } while (x % k === 0); return x; };
    if (v === 0) {
      const sub = R.chance(0.3), w = sub ? 'разность' : 'сумма';
      const good = k * R.int(2, sub ? Math.min(12, a / k - 1) : 12);
      const bad = new Set(); while (bad.size < 3) { const x = notK(10, sub ? Math.min(99, a - 1) : 99); if (x !== good) bad.add(x); }
      return { q: sub ? `Какое из чисел можно <b>вычесть</b> из ${a}, чтобы разность делилась на ${k}?` : `Какое из чисел можно <b>прибавить</b> к ${a}, чтобы сумма делилась на ${k}?`,
        type: 'choice', options: R.shuffle([good, ...bad]).map(String), answer: String(good), hint: rule,
        traps: [...bad].map(x => [String(x), `${x} не делится на ${k}, а ${a} делится — значит, ${w} не разделится на ${k}.`]),
        explain: [`${a} = ${k} · ${a / k} — делится на ${k}.`, `Значит, ${sub ? 'вычитать' : 'прибавлять'} нужно число, которое тоже делится на ${k}: ${good} = ${k} · ${good / k}.`,
          `Остальные числа на ${k} не делятся, и ${w} с ними не разделится.`] };
    }
    if (v === 1) {
      const ny = R.int(2, 3), rows = [], seen = new Set();
      while (rows.length < 5) {
        const ok = rows.filter(r => r.ok).length < ny, x = k * R.int(5, 40), y = ok ? k * R.int(2, 15) : notK(10, 99);
        const s = R.chance(0.5) ? `${x} + ${y}` : `${y} + ${x}`;
        if (seen.has(s)) continue; seen.add(s); rows.push({ s, ok, x, y });
      }
      const list = R.shuffle(rows);
      return multiTask(`Не вычисляя, отметь все суммы, которые <b>делятся на ${k}</b>:`, list.map(r => r.s), s => rows.find(r => r.s === s).ok, rule,
        list.map(r => r.ok ? `${r.s}: ${r.x} и ${r.y} делятся на ${k} → сумма делится ✓` : `${r.s}: ${r.x} делится на ${k}, а ${r.y} — нет → сумма не делится`));
    }
    const ans = Math.ceil(10 / k) * k;
    return { q: `Число ${a} делится на ${k}. Какое <b>наименьшее двузначное</b> число можно прибавить к ${a}, чтобы сумма тоже делилась на ${k}?`, type: 'num', answer: ans,
      hint: `Раз ${a} делится на ${k}, второе слагаемое тоже должно делиться на ${k}.`,
      traps: [[10, `10 не делится на ${k} — тогда и сумма не разделится.`], [k, `${k} — однозначное число, а нужно двузначное.`], [ans + k, `Есть двузначное число, кратное ${k}, и поменьше.`]],
      explain: [`${a} делится на ${k}, поэтому сумма делится, только если второе слагаемое тоже делится на ${k}.`, `Двузначные числа, кратные ${k}: ${ans}, ${ans + k}, ${ans + 2 * k}, … Наименьшее — ${ans}.`] };
  }
  if (d === 2) {
    const k = R.pick([3, 5, 7, 11]);
    const notK = (lo, hi) => { let x; do { x = R.int(lo, hi); } while (x % k === 0); return x; };
    const prod = ok => { const f = ok ? k * R.int(2, 9) : notK(4, 40), g = notK(11, 40); return R.chance(0.5) ? { s: `${f} · ${g}`, f, g, x: f, y: g, ok } : { s: `${g} · ${f}`, f, g, x: g, y: f, ok }; };
    const why = r => r.ok ? `${r.s}: ${r.f} = ${k} · ${r.f / k} → произведение делится ✓` : `${r.s}: ни ${r.x}, ни ${r.y} не делятся на ${k} → не делится`;
    const pHint = `${k} — простое число. Произведение делится на ${k}, только если хотя бы один множитель делится на ${k}.`;
    const pick = n => { const rows = [], seen = new Set(); while (rows.length < n.length) { const r = prod(n[rows.length]); if (!seen.has(r.s)) { seen.add(r.s); rows.push(r); } } return rows; };
    if (R.chance(0.5)) {
      const rows = pick([true, false, false, false]), right = rows[0];
      return { q: `Какое произведение <b>делится на ${k}</b>?`, type: 'choice', options: R.shuffle(rows.map(r => r.s)), answer: right.s, hint: pHint,
        traps: rows.slice(1).map(r => [r.s, `Ни ${r.x}, ни ${r.y} не делятся на ${k}, а ${k} — простое число. Значит, это произведение не делится.`]),
        explain: [pHint, why(right)] };
    }
    const ny = R.int(2, 3), rows = R.shuffle(pick(Array.from({ length: 5 }, (_, i) => i < ny)));
    return multiTask(`Не вычисляя, отметь все произведения, которые <b>делятся на ${k}</b>:`, rows.map(r => r.s), s => rows.find(r => r.s === s).ok, pHint, [pHint].concat(rows.map(why)));
  }
  const k = R.pick([3, 5, 7, 9]);
  const nd = () => { let x; do { x = R.int(11, 60); } while (x % k === 0); return x; }, dv = () => k * R.int(2, Math.floor(60 / k));
  if (R.chance(0.6)) {
    /* «Без вычисления не узнать» — верный ответ, когда оба слагаемых не делятся */
    const O = ['Да, делится', 'Нет, не делится', 'Без вычисления не узнать'], c = R.pick([0, 0, 1, 2, 2]);
    const a = c === 2 ? nd() : dv(), b = c === 0 ? nd() : c === 1 ? dv() : nd(), s = a + b;
    const calc = `Проверка: ${a} + ${b} = ${s}; ${s % k ? `${s} на ${k} не делится (ост. ${s % k})` : `${s} = ${k} · ${s / k}`}.`;
    if (c === 2) return { q: `Не вычисляя, определи: делится ли сумма <span class="ex">${a} + ${b}</span> на ${k}?`, type: 'choice', options: O, answer: O[2], hint: rule,
      traps: [[O[0], `Оба слагаемых не делятся на ${k} — правило тут ничего не говорит. Сумма может делиться, а может и не делиться.`],
        [O[1], `Оба слагаемых не делятся на ${k} — правило тут ничего не говорит. Например, ${k + 1} + ${2 * k - 1} = ${3 * k} делится на ${k}.`]],
      explain: ['Правило работает, только когда хотя бы одно слагаемое делится на число.', `Здесь ни ${a}, ни ${b} не делятся на ${k}, поэтому без вычисления не узнать.`, calc] };
    const ok = c === 1;
    return { q: `Не вычисляя, определи: делится ли сумма <span class="ex">${a} + ${b}</span> на ${k}?`, type: 'choice', options: O, answer: ok ? O[0] : O[1], hint: rule,
      traps: [[O[2], ok ? `Оба слагаемых делятся на ${k} — правило отвечает сразу.` : `${a} делится на ${k}, а ${b} — нет. Правило отвечает сразу.`],
        [ok ? O[1] : O[0], ok ? `${a} и ${b} делятся на ${k} — значит, и сумма делится.` : `${b} не делится на ${k}, а ${a} делится — значит, сумма не делится.`]],
      explain: [`${a} = ${k} · ${a / k} — делится на ${k}.`, ok ? `${b} = ${k} · ${b / k} — тоже делится, значит, и сумма делится.` : `${b} не делится на ${k}, значит, сумма не делится.`, calc] };
  }
  /* Контрпример к ложному утверждению */
  let x, y; do { x = nd(); y = k * R.int(2, 10) - x; } while (y <= 10 || y % k === 0);
  let p, q; do { p = nd(); q = nd(); } while ((p + q) % k === 0);
  const m = dv(), n = nd(), u = dv(), w = dv();
  const right = `${x} и ${y}`, opts = [right, `${p} и ${q}`, `${m} и ${n}`, `${u} и ${w}`];
  if (new Set(opts).size < 4) return null;
  return { q: `Утверждение: <b>«Если оба слагаемых не делятся на ${k}, то и сумма не делится на ${k}»</b>.<br>Какая пара чисел показывает, что оно <b>ложно</b>?`,
    type: 'choice', options: R.shuffle(opts), answer: right, hint: 'Нужен контрпример: оба числа не делятся на ' + k + ', а сумма делится.',
    traps: [[opts[1], `${p} + ${q} = ${p + q} — тоже не делится на ${k}. Этот пример с утверждением согласен, а не опровергает его.`],
      [opts[2], `${m} делится на ${k}, а в утверждении оба слагаемых не делятся.`], [opts[3], `Оба числа делятся на ${k} — утверждение говорит о других числах.`]],
    explain: [`${x} и ${y} не делятся на ${k}, а ${x} + ${y} = ${x + y} = ${k} · ${(x + y) / k} — делится!`, 'Один такой пример — контрпример — показывает, что утверждение ложно.'] };
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
    /* Без «Да / Нет»: отметить все подходящие числа или найти остаток по признаку */
    if (R.chance(0.5)) {
      const k = R.pick([3, 9]), S = SIGN[k], ny = R.int(2, 3), total = R.int(5, 6), yes = [], no = [];
      while (yes.length < ny) { const n = k * R.int(Math.ceil(100 / k), Math.floor(9999 / k)); if (!yes.includes(n)) yes.push(n); }
      /* Для 9 среди «нет» есть числа, которые делятся на 3, но не на 9 */
      while (no.length < total - ny) {
        const n = R.int(100, 9999), trick = k === 9 && no.length < 2;
        if (!S.t(n) && (!trick || n % 3 === 0) && !no.includes(n)) no.push(n);
      }
      const items = R.shuffle(yes.concat(no));
      return { q: `Отметь все числа, которые <b>делятся на ${k}</b>:`, type: 'multi', items: items.map(fmt), answer: items.filter(S.t).map(fmt), hint: S.rule,
        explain: [S.rule].concat(items.map(n => `${fmt(n)}: ${S.why(n)} → ${S.t(n) ? 'делится ✓' : 'не делится'}`)) };
    }
    const k = R.pick([3, 3, 9, 9, 5, 2]);
    let n; do { n = R.int(100, 9999); } while (n % k === 0 && R.chance(0.75));
    const r = n % k, last = n % 10, ds = digitSum(n), digs = String(n).split('');
    if (k === 2 || k === 5) return { q: `Какой <b>остаток</b> получится при делении числа ${fmt(n)} на ${k}? Найди по последней цифре.`, type: 'num', answer: r,
      hint: `Остаток при делении на ${k} зависит только от последней цифры.`, traps: [[last, `${last} — это последняя цифра. А нужен остаток от её деления на ${k}.`]],
      explain: [`Последняя цифра — ${last}.`, `${last} : ${k} = ${Math.floor(last / k)} (ост. ${r}) → у числа ${fmt(n)} тот же остаток: ${r}.`] };
    return { q: `Какой <b>остаток</b> получится при делении числа ${fmt(n)} на ${k}? Найди по сумме цифр, не деля столбиком.`, type: 'num', answer: r,
      hint: `Число и сумма его цифр дают одинаковый остаток при делении на ${k}.`,
      traps: [[ds, `${ds} — это сумма цифр. Теперь найди остаток от деления ${ds} на ${k}.`], [(k - r) % k, `Это сколько не хватает до делимости, а нужен остаток.`]],
      explain: [`Сумма цифр: ${digs.join(' + ')} = ${ds}.`, `${ds} : ${k} = ${Math.floor(ds / k)} (ост. ${ds % k}).`, `Значит, ${fmt(n)} при делении на ${k} даёт остаток ${r}.`] };
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
