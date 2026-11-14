/* 5 класс (Петерсон), 3–4 четверть: НОД и НОК, степени, обыкновенные дроби, задачи на части, луч координат, углы, диаграммы.
   Ответ-дробь — тип 'frac' (поля «целая часть / числитель / знаменатель», js/play.js). ans — значение {n, d}, form: 'frac' | 'mixed'.
   Варианты-дроби — функция qChoice: optVals — значения вариантов (двойников по значению нет: 2/4 и 1/2 — двойник). */
'use strict';

/* ---------- Общие помощники ---------- */
const sup = (a, n) => `${a}<sup>${n}</sup>`;
const DEG = '°';
function primeFactors(n) { const r = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { r.push(p); n /= p; } if (n > 1) r.push(n); return r; }
const lcm = (a, b) => a / gcd(a, b) * b;
const factStr = n => primeFactors(n).join(' · ');
/* Задача с ответом-дробью. traps: [[значение {n,d}, 'пояснение'], …] */
function fracTask(base, ans, form, traps) {
  const mixed = form === 'mixed';
  return Object.assign(base, { type: 'frac', ans, form, answer: qText(ans, mixed), ansHtml: qHtml(ans, mixed),
    traps: (traps || []).filter(x => x && x[0] && x[0].d > 0 && x[0].n >= 0).map(([q, msg]) => [qText(q, mixed), msg]) });
}
/* Выбор из вариантов-дробей: правильный + отвлекающие, без двойников по значению */
function qChoice(base, ans, dists, mixed, traps) {
  const seen = new Set([qText(ans)]), list = [ans];
  for (const q of dists) {
    if (list.length >= 4) break;
    if (!q || q.d <= 0 || q.n <= 0) continue;
    const k = qText(q); if (seen.has(k)) continue;
    seen.add(k); list.push(q);
  }
  if (list.length < 3) return null;
  const sh = R.shuffle(list);
  return Object.assign(base, { type: 'choice', options: sh.map(q => qHtml(q, mixed)), optVals: sh.map(q => qText(q)), answer: qHtml(ans, mixed),
    answerPlain: qText(ans, mixed), ansHtml: qHtml(ans, mixed), traps: (traps || []).map(([q, m]) => [qHtml(q, mixed), m]) });
}
/* Сравнение: варианты <, =, > */
const cmpTask = (base, c, traps) => Object.assign(base, { type: 'choice', options: ['<', '=', '>'], answer: ['<', '=', '>'][c + 1], cols2: false, traps: traps || [] });
const sgn = c => ['<', '=', '>'][c + 1];
/* Правильная дробь a/b, 0 < a < b */
const properQ = (bMin, bMax) => { const b = R.int(bMin, bMax); return [R.int(1, b - 1), b]; };
const coprimePair = (lo, hi) => { let x, y; do { x = R.int(lo, hi); y = R.int(lo, hi); } while (x === y || gcd(x, y) !== 1); return [x, y]; };

/* ============ Башня НОД и НОК ============ */
reg('nod', 'n_fact', d => {
  const P = d === 1 ? [2, 2, 3, 3, 5, 7] : d === 2 ? [2, 2, 2, 3, 3, 5, 7, 11] : [2, 2, 2, 3, 3, 5, 5, 7, 11, 13];
  const k = d === 1 ? 3 : d === 2 ? R.int(3, 4) : R.int(4, 5);
  const ps = R.sample(P, k).sort((a, b) => a - b), n = ps.reduce((a, b) => a * b, 1);
  if (n > (d === 1 ? 100 : d === 2 ? 500 : 2000) || n < 20) return null;
  const right = ps.join(' · ');
  /* Отвлекающие: два множителя слиты в составной (не до конца), один множитель заменён (не то число) */
  const merge = i => { const q = ps.slice(); const m = q[i] * q[i + 1]; q.splice(i, 2, m); return q.sort((a, b) => a - b).join(' · '); };
  const dist = [merge(0), merge(ps.length - 2), merge(Math.floor((ps.length - 1) / 2))];
  const sw = ps.slice(); const j = R.int(0, sw.length - 1); sw[j] = sw[j] === 2 ? 3 : sw[j] === 3 ? 2 : sw[j] + 2; dist.push(sw.sort((a, b) => a - b).join(' · '));
  const opts = [...new Set([right, ...dist])].slice(0, 4);
  if (opts.length < 3) return null;
  const options = R.shuffle(opts);
  return { q: `Как разложить число ${fmt(n)} <b>на простые множители</b>?`, type: 'choice', options, answer: right, optVals: options.slice(), mono: true,
    traps: dist.slice(0, 3).filter(x => x !== right).map(x => [x, 'Здесь есть составной множитель — его тоже надо разложить, пока все множители не станут простыми.']),
    hint: 'Дели число на 2, пока делится, потом на 3, на 5, на 7… Все множители должны быть простыми.',
    explain: [`${fmt(n)} = ${right}.`, 'Проверь: каждый множитель — простое число (делится только на 1 и на себя), а произведение равно исходному числу.'] };
});
function gcdPair(d) {
  const g = R.int(2, d === 1 ? 8 : d === 2 ? 15 : 24), [x, y] = coprimePair(2, d === 1 ? 6 : d === 2 ? 9 : 12);
  return { g, x, y, a: g * x, b: g * y };
}
reg('nod', 'n_gcd', d => {
  const { g, x, y, a, b } = gcdPair(d);
  if (a > (d === 1 ? 60 : 400) || b > (d === 1 ? 60 : 400)) return null;
  return { q: `Найди НОД(${a}; ${b}) — наибольший общий делитель.`, type: 'num', answer: g, draft: d > 1,
    traps: [[g * x * y, 'Это НОК — наименьшее общее кратное. А НОД — наибольшее число, на которое делятся оба числа.'], [Math.min(a, b), `${Math.min(a, b)} — делитель только одного из чисел.`]],
    hint: 'Разложи оба числа на простые множители и перемножь общие множители.',
    explain: [`${a} = ${factStr(a)}`, `${b} = ${factStr(b)}`, `Общие множители: ${factStr(g)}.`, `НОД(${a}; ${b}) = ${g}.`] };
});
reg('nod', 'n_lcm', d => {
  const { g, x, y, a, b } = gcdPair(d), L = g * x * y;
  if (L > (d === 1 ? 120 : d === 2 ? 600 : 2000)) return null;
  return { q: `Найди НОК(${a}; ${b}) — наименьшее общее кратное.`, type: 'num', answer: L, draft: d > 1,
    traps: [[g, 'Это НОД. А НОК — наименьшее число, которое делится на оба числа.'], [a * b, `${fmt(a * b)} — общее кратное, но не наименьшее: у чисел есть общий множитель ${g}.`]],
    hint: 'Возьми разложение большего числа и допиши недостающие множители из разложения меньшего.',
    explain: [`${a} = ${factStr(a)}`, `${b} = ${factStr(b)}`, `НОК = ${factStr(Math.max(a, b))} · ${factStr(L / Math.max(a, b))} = ${fmt(L)}.`, `Проверка: ${fmt(L)} : ${a} = ${L / a}, ${fmt(L)} : ${b} = ${L / b}.`] };
});
reg('nod', 'n_coprime', d => {
  const pairs = new Map();
  const want = R.int(1, 2);
  let guard = 0;
  while (pairs.size < 4 && guard++ < 200) {
    const good = [...pairs.values()].filter(Boolean).length < want;
    let a, b;
    if (good) { [a, b] = coprimePair(d === 1 ? 2 : 4, d === 1 ? 15 : d === 2 ? 30 : 60); if (d > 1 && isPrime(a) && isPrime(b)) continue; }
    else { const g = R.pick(d === 1 ? [2, 3, 5] : [2, 3, 7, 11]); a = g * R.int(2, d === 1 ? 6 : 9); b = g * R.int(2, d === 1 ? 6 : 9); if (a === b) continue; }
    const key = `${Math.min(a, b)} и ${Math.max(a, b)}`;
    if (!pairs.has(key)) pairs.set(key, gcd(a, b) === 1);
  }
  if (pairs.size < 4) return null;
  const items = R.shuffle([...pairs.keys()]), answer = items.filter(k => pairs.get(k));
  if (!answer.length || answer.length === items.length) return null;
  return { q: 'Отметь пары <b>взаимно простых</b> чисел.', type: 'multi', items, answer,
    hint: 'Взаимно простые — у них нет общих делителей, кроме 1. Составные числа тоже могут быть взаимно простыми!',
    explain: items.map(k => { const [a, b] = k.split(' и ').map(Number); return `${k}: НОД = ${gcd(a, b)} → ${gcd(a, b) === 1 ? 'взаимно простые' : 'не взаимно простые'}.`; }) };
});
reg('nod', 'n_word', d => {
  const kind = R.pick(d === 1 ? ['bus', 'bouq'] : ['bus', 'bouq', 'sq', 'step']);
  if (kind === 'bus') {
    const { g, x, y, a, b } = gcdPair(1), L = g * x * y; if (L > 120) return null;
    return { q: `От остановки одновременно отошли два автобуса. Первый возвращается на остановку каждые ${a} мин, второй — каждые ${b} мин. Через сколько минут они снова встретятся на остановке?`, type: 'num', answer: L, draft: true,
      traps: [[g, 'Это НОД. Встреча будет, когда пройдёт число минут, кратное и ' + a + ', и ' + b + ' — это НОК.'], [a * b, `${a * b} мин — тоже встреча, но не первая: найди НОК.`]],
      hint: 'Нужно наименьшее число, которое делится и на одно, и на другое время — это НОК.',
      explain: [`Время встречи делится и на ${a}, и на ${b}.`, `НОК(${a}; ${b}) = ${L}.`, `Ответ: через ${L} мин.`] };
  }
  if (kind === 'step') {
    const { g, x, y, a, b } = gcdPair(1), L = g * x * y; if (L > 150 || a < 20 && b < 20) return null;
    return { q: `Шаг папы — ${a} см, шаг сына — ${b} см. Они пошли от одной черты в одну сторону. Через сколько сантиметров их следы впервые снова совпадут?`, type: 'num', answer: L, draft: true,
      traps: [[g, 'Это НОД, а нужно число, кратное обоим шагам, — НОК.'], [a * b, 'Это общее кратное, но не наименьшее.']],
      hint: 'Расстояние должно делиться и на один шаг, и на другой. Нужно наименьшее такое — НОК.',
      explain: [`НОК(${a}; ${b}) = ${L}.`, `Ответ: ${L} см.`] };
  }
  const { g, x, y, a, b } = gcdPair(d); if (a > 200 || b > 200) return null;
  if (kind === 'bouq') return { q: `Есть ${a} ${pl(a, 'ромашка', 'ромашки', 'ромашек')} и ${b} ${pl(b, 'василёк', 'василька', 'васильков')}. Какое наибольшее число одинаковых букетов можно составить, чтобы использовать все цветы?`, type: 'num', answer: g, draft: true,
    traps: [[g * x * y, 'Это НОК. Число букетов должно делить и число ромашек, и число васильков — это НОД.']],
    hint: 'Число букетов — делитель и одного, и другого числа. Самый большой общий делитель — НОД.',
    explain: [`НОД(${a}; ${b}) = ${g}.`, `В каждом букете: ${x} ${pl(x, 'ромашка', 'ромашки', 'ромашек')} и ${y} ${pl(y, 'василёк', 'василька', 'васильков')}.`, `Ответ: ${g} ${pl(g, 'букет', 'букета', 'букетов')}.`] };
  return { q: `Прямоугольник ${a} см × ${b} см разрезали на одинаковые квадраты без остатка. Какой наибольшей может быть сторона квадрата?`, type: 'num', answer: g, draft: true,
    traps: [[g * x * y, 'Это НОК. Сторона квадрата должна делить обе стороны прямоугольника — это НОД.']],
    hint: 'Сторона квадрата укладывается целое число раз и в длину, и в ширину. Самая большая — НОД.',
    explain: [`НОД(${a}; ${b}) = ${g}.`, `Ответ: ${g} см (получится ${x} × ${y} квадратов).`] };
});

/* ============ Лестница степеней ============ */
reg('pow', 'p_val', d => {
  const a = R.int(2, d === 1 ? 10 : d === 2 ? 9 : 12), n = d === 1 ? R.int(2, 3) : R.int(2, d === 2 ? 5 : 6), v = a ** n;
  if (v > (d === 1 ? 1000 : d === 2 ? 10000 : 100000) || (d === 1 && n === 3 && a > 6)) return null;
  const tens = d === 3 && R.chance(0.3) ? R.int(3, 6) : 0;
  if (tens) return { q: `Вычисли: ${sup(10, tens)}`, type: 'num', answer: 10 ** tens, traps: [[10 * tens, `${sup(10, tens)} — это не 10 · ${tens}, а ${tens} множителей по 10: единица и ${tens} нулей.`]],
    hint: `10 в степени ${tens} — это единица и ${tens} ${pl(tens, 'нуль', 'нуля', 'нулей')}.`, explain: [`${sup(10, tens)} = ${Array(tens).fill(10).join(' · ')} = ${fmt(10 ** tens)}.`] };
  return { q: `Вычисли: ${sup(a, n)}`, type: 'num', answer: v, draft: v > 100,
    traps: [[a * n, `${sup(a, n)} — это не ${a} · ${n}, а ${n} ${pl(n, 'множитель', 'множителя', 'множителей')} по ${a}.`], [n ** a, 'Перепутаны основание и показатель.']],
    hint: `${sup(a, n)} = ${Array(n).fill(a).join(' · ')}.`, explain: [`${sup(a, n)} = ${Array(n).fill(a).join(' · ')} = ${fmt(v)}.`] };
});
reg('pow', 'p_sq', d => {
  const cube = d === 3 ? R.chance(0.5) : d === 2 ? R.chance(0.3) : false, a = cube ? R.int(2, d === 3 ? 10 : 6) : R.int(d === 1 ? 2 : 6, d === 1 ? 12 : 20);
  const v = cube ? a ** 3 : a * a, w = cube ? 'куб' : 'квадрат';
  if (d === 1 || R.chance(0.3)) return { q: `Найди ${w} числа ${a}.`, type: 'num', answer: v,
    traps: [[cube ? a * 3 : a * 2, `${w[0].toUpperCase() + w.slice(1)} числа — это ${a} · ${a}${cube ? ' · ' + a : ''}, а не ${a} · ${cube ? 3 : 2}.`]],
    hint: cube ? `Куб — число, умноженное само на себя три раза: ${a} · ${a} · ${a}.` : `Квадрат — число, умноженное само на себя: ${a} · ${a}.`,
    explain: [`${sup(a, cube ? 3 : 2)} = ${cube ? `${a} · ${a} · ${a}` : `${a} · ${a}`} = ${fmt(v)}.`] };
  return { q: `${w[0].toUpperCase() + w.slice(1)} какого числа равен ${fmt(v)}?`, type: 'num', answer: a,
    traps: [[cube ? (v % 3 ? null : v / 3) : (v % 2 ? null : v / 2), `${sup('a', cube ? 3 : 2)} — это a · a${cube ? ' · a' : ''}, а не a · ${cube ? 3 : 2}. Подбери число.`]],
    hint: `Подбери число, которое при умножении само на себя${cube ? ' три раза' : ''} даёт ${fmt(v)}.`,
    explain: [`${cube ? `${a} · ${a} · ${a}` : `${a} · ${a}`} = ${fmt(v)}, значит, это число ${a}.`] };
});
reg('pow', 'p_order', d => {
  const a = R.int(2, 9), b = R.int(2, d === 1 ? 6 : 9), c = R.int(2, 9), e = R.int(2, 5);
  const forms = d === 1 ? ['a+b2', 'b2-a', 'c*b2'] : d === 2 ? ['(a+b)2', 'c*b2', 'b2+c2', '(c*b)2'] : ['c*b2-(a)3', '(a+b)2:c', 'a3+b2*c', '(b2-a)*c'];
  const f = R.pick(forms);
  let q, v, steps, traps = [];
  if (f === 'a+b2') { v = a + b * b; q = `${a} + ${sup(b, 2)}`; steps = [`${sup(b, 2)} = ${b * b}`, `${a} + ${b * b} = ${v}`]; traps = [[(a + b) ** 2, 'Сначала возводят в степень, потом складывают.'], [a + 2 * b, `${sup(b, 2)} = ${b} · ${b}, а не ${b} · 2.`]]; }
  else if (f === 'b2-a') { if (b * b <= a) return null; v = b * b - a; q = `${sup(b, 2)} − ${a}`; steps = [`${sup(b, 2)} = ${b * b}`, `${b * b} − ${a} = ${v}`]; traps = [[2 * b - a, `${sup(b, 2)} = ${b} · ${b}, а не ${b} · 2.`]]; }
  else if (f === 'c*b2') { v = c * b * b; q = `${c} · ${sup(b, 2)}`; steps = [`${sup(b, 2)} = ${b * b}`, `${c} · ${b * b} = ${v}`]; traps = [[(c * b) ** 2, `Степень относится только к ${b}: сначала ${sup(b, 2)}, потом умножение.`]]; }
  else if (f === '(a+b)2') { v = (a + b) ** 2; q = `(${a} + ${b})<sup>2</sup>`; steps = [`${a} + ${b} = ${a + b}`, `${sup(a + b, 2)} = ${v}`]; traps = [[a * a + b * b, `(${a} + ${b})<sup>2</sup> ≠ ${sup(a, 2)} + ${sup(b, 2)}: сначала скобки, потом степень.`]]; }
  else if (f === 'b2+c2') { v = b * b + c * c; q = `${sup(b, 2)} + ${sup(c, 2)}`; steps = [`${sup(b, 2)} = ${b * b}`, `${sup(c, 2)} = ${c * c}`, `${b * b} + ${c * c} = ${v}`]; traps = [[(b + c) ** 2, 'Здесь нет скобок: каждое число возводят в квадрат отдельно.']]; }
  else if (f === '(c*b)2') { v = (c * b) ** 2; if (v > 5000) return null; q = `(${c} · ${b})<sup>2</sup>`; steps = [`${c} · ${b} = ${c * b}`, `${sup(c * b, 2)} = ${v}`]; traps = [[c * b * b, 'В квадрат возводится всё произведение в скобках.']]; }
  else if (f === 'c*b2-(a)3') { v = c * b * b - a ** 3; if (v <= 0) return null; q = `${c} · ${sup(b, 2)} − ${sup(a, 3)}`; steps = [`${sup(b, 2)} = ${b * b}`, `${sup(a, 3)} = ${a ** 3}`, `${c} · ${b * b} = ${c * b * b}`, `${c * b * b} − ${a ** 3} = ${v}`]; }
  else if (f === '(a+b)2:c') { const s = (a + b) ** 2; if (s % c) return null; v = s / c; q = `(${a} + ${b})<sup>2</sup> : ${c}`; steps = [`${a} + ${b} = ${a + b}`, `${sup(a + b, 2)} = ${s}`, `${s} : ${c} = ${v}`]; traps = [[(a * a + b * b) % c ? null : (a * a + b * b) / c, 'Сначала скобки, потом степень.']]; }
  else if (f === 'a3+b2*c') { v = a ** 3 + b * b * c; q = `${sup(a, 3)} + ${sup(b, 2)} · ${c}`; steps = [`${sup(a, 3)} = ${a ** 3}`, `${sup(b, 2)} = ${b * b}`, `${b * b} · ${c} = ${b * b * c}`, `${a ** 3} + ${b * b * c} = ${v}`]; traps = [[(a ** 3 + b * b) * c, 'Умножение выполняют раньше сложения.']]; }
  else { if (b * b <= a) return null; v = (b * b - a) * c; q = `(${sup(b, 2)} − ${a}) · ${c}`; steps = [`${sup(b, 2)} = ${b * b}`, `${b * b} − ${a} = ${b * b - a}`, `${b * b - a} · ${c} = ${v}`]; }
  return { q: `Найди значение выражения: <span class="ex">${q}</span>`, type: 'num', answer: v, draft: d > 1, traps,
    hint: 'Порядок: скобки → степени → умножение и деление → сложение и вычитание.', explain: steps.concat([`Ответ: ${fmt(v)}.`]) };
});
reg('pow', 'p_cmp', d => {
  const pairs = d === 1 ? [[2, 3, 3, 2], [2, 4, 4, 2], [3, 2, 2, 3], [5, 2, 2, 5], [10, 2, 2, 10], [4, 2, 3, 3], [6, 2, 2, 6]]
    : [[2, 5, 5, 2], [3, 4, 4, 3], [2, 6, 6, 2], [2, 4, 4, 2], [3, 3, 5, 2], [2, 7, 5, 3], [10, 3, 3, 10], [2, 10, 10, 3], [7, 2, 2, 7], [9, 2, 3, 4], [8, 2, 4, 3], [5, 3, 11, 2]];
  const [a, m, b, n] = R.pick(pairs), sw = R.chance(0.5);
  const [x, xm, y, ym] = sw ? [b, n, a, m] : [a, m, b, n], c = Math.sign(x ** xm - y ** ym);
  return cmpTask({ q: `Сравни: <span class="ex">${sup(x, xm)} ○ ${sup(y, ym)}</span>`, hint: 'Вычисли каждую степень, потом сравни числа.',
    explain: [`${sup(x, xm)} = ${fmt(x ** xm)}`, `${sup(y, ym)} = ${fmt(y ** ym)}`, `${fmt(x ** xm)} ${sgn(c)} ${fmt(y ** ym)}`] }, c,
    x * xm !== y * ym && Math.sign(x * xm - y * ym) !== c ? [[sgn(Math.sign(x * xm - y * ym)), 'Похоже, основание умножили на показатель. Степень — это повторное умножение!']] : []);
});
reg('pow', 'p_write', d => {
  const a = R.int(2, d === 1 ? 9 : 15), n = R.int(3, d === 1 ? 4 : 6);
  if (a ** n === n ** a) return null;   /* 2⁴ = 4² — варианты-двойники по значению */
  if (d === 3 && R.chance(0.5)) {
    const b = R.int(2, 9); if (b === a) return null;
    const m = R.int(2, 3), q = Array(n).fill(a).concat(Array(m).fill(b)).join(' · ');
    const right = `${sup(a, n)} · ${sup(b, m)}`, opts = [right, `${sup(a * b, n + m)}`, `${sup(a, m)} · ${sup(b, n)}`, `${sup(a + b, n)}`];
    return { q: `Запиши произведение с помощью степеней: <span class="ex">${q}</span>`, type: 'choice', options: R.shuffle(opts), answer: right, optVals: opts.slice(),
      hint: 'Одинаковые множители собери в степень: основание — сам множитель, показатель — сколько раз он повторяется.',
      explain: [`${a} повторяется ${n} ${pl(n, 'раз', 'раза', 'раз')}, ${b} — ${m} ${pl(m, 'раз', 'раза', 'раз')}.`, `${q} = ${right}.`] };
  }
  const q = Array(n).fill(a).join(' · '), right = sup(a, n), opts = [right, sup(n, a), `${a} · ${n}`, sup(a, n + 1)];
  return { q: `Запиши произведение в виде степени: <span class="ex">${q}</span>`, type: 'choice', options: R.shuffle(opts), answer: right, optVals: opts.slice(),
    traps: [[`${a} · ${n}`, 'Это произведение, а не степень.'], [sup(n, a), 'Основание — повторяющийся множитель, показатель — число множителей.']],
    hint: 'Основание — повторяющийся множитель, показатель — сколько раз он повторяется.',
    explain: [`Множитель ${a} повторяется ${n} ${pl(n, 'раз', 'раза', 'раз')}.`, `${q} = ${right}.`] };
});

/* ============ Пирог дробей ============ */
reg('pie', 'q_part', d => {
  const [a, b] = d === 1 ? [1, R.int(2, 9)] : properQ(3, d === 2 ? 9 : 12), N = b * R.int(d === 3 ? 6 : 2, d === 1 ? 10 : 15);
  if (a === 0 || gcd(a, b) !== 1) return null;
  return { q: `Найди ${frH(a, b)} от числа ${fmt(N)}.`, type: 'num', answer: N / b * a,
    traps: [[N % a ? null : N / a * b, `Наоборот: сначала дели на знаменатель ${b}, потом умножай на числитель ${a}.`], [a === 1 ? null : N / b, `Это только ${frH(1, b)}. Нужно взять ${a} таких частей.`]],
    hint: 'Чтобы найти дробь от числа, раздели число на знаменатель и умножь на числитель.',
    explain: [`${fmt(N)} : ${b} = ${fmt(N / b)} — это ${frH(1, b)}.`].concat(a > 1 ? [`${fmt(N / b)} · ${a} = ${fmt(N / b * a)} — это ${frH(a, b)}.`] : []) };
});
reg('pie', 'q_whole', d => {
  const [a, b] = d === 1 ? [1, R.int(2, 9)] : properQ(3, d === 2 ? 9 : 12), N = b * R.int(d === 3 ? 6 : 2, d === 1 ? 10 : 15), P = N / b * a;
  if (gcd(a, b) !== 1) return null;
  return { q: `${frH(a, b)} числа равны ${fmt(P)}. Найди это число.`, type: 'num', answer: N,
    traps: [[P % b ? null : P / b * a, `Это ${frH(a, b)} от ${fmt(P)}. А здесь ${fmt(P)} — уже часть, ищем целое: дели на числитель, умножай на знаменатель.`]],
    hint: 'Чтобы найти число по его дроби, раздели на числитель и умножь на знаменатель.',
    explain: (a > 1 ? [`${fmt(P)} : ${a} = ${fmt(P / a)} — это ${frH(1, b)} числа.`] : []).concat([`${fmt(P / a)} · ${b} = ${fmt(N)} — всё число.`]) };
});
reg('pie', 'q_kind', d => {
  const wantImp = R.chance(0.5), items = new Set(), ans = [];
  const qs = [];
  let guard = 0;
  while (qs.length < 5 && guard++ < 200) {
    const b = R.int(2, d === 1 ? 9 : 15), a = R.int(1, b + (d === 1 ? 5 : 9));
    if (d === 1 && a === b) continue;
    const h = frH(a, b); if (items.has(h)) continue;
    items.add(h); qs.push([a, b]);
  }
  for (const [a, b] of qs) if ((a >= b) === wantImp) ans.push(frH(a, b));
  if (!ans.length || ans.length === qs.length) return null;
  return { q: `Отметь все <b>${wantImp ? 'неправильные' : 'правильные'}</b> дроби.`, type: 'multi', items: qs.map(([a, b]) => frH(a, b)), answer: ans, answerPlain: ans.map(plain5).join(', '),
    hint: 'Правильная дробь: числитель меньше знаменателя (дробь меньше 1). Неправильная: числитель больше знаменателя или равен ему.',
    explain: qs.map(([a, b]) => `${frH(a, b)}: ${a} ${a < b ? '<' : a === b ? '=' : '>'} ${b} → ${a < b ? 'правильная' : 'неправильная'}.`) };
});
const plain5 = h => String(h).replace(/<span class="fr"><b>(\d+)<\/b><b>(\d+)<\/b><\/span>/g, '$1/$2').replace(/<[^>]+>/g, '');
reg('pie', 'q_tomixed', d => {
  const b = R.int(2, d === 1 ? 6 : d === 2 ? 10 : 12), w = R.int(1, d === 1 ? 4 : 9), r = R.int(1, b - 1), n = w * b + r;
  if (gcd(r, b) !== 1) return null;   /* дробная часть сразу несократимая — проверяем именно выделение целой части */
  return Object.assign(fracTask({ q: `Выдели целую часть: <span class="ex">${frH(n, b)}</span>`, strict: true,
    hint: `Раздели числитель на знаменатель с остатком: частное — целая часть, остаток — новый числитель.`,
    explain: [`${n} : ${b} = ${w} (ост. ${r}).`, `${frH(n, b)} = ${mxH(w, r, b)}.`] }, Q(n, b), 'mixed', [[qMix(r, w, b), 'Целая часть — это частное, а остаток идёт в числитель.']]));
});
reg('pie', 'q_toimp', d => {
  const b = R.int(2, d === 1 ? 6 : d === 2 ? 10 : 12), w = R.int(1, d === 1 ? 4 : 9), a = R.int(1, b - 1), n = w * b + a;
  if (gcd(a, b) !== 1) return null;
  return fracTask({ q: `Запиши в виде неправильной дроби: <span class="ex">${mxH(w, a, b)}</span>`,
    hint: 'Целую часть умножь на знаменатель и прибавь числитель. Знаменатель остаётся тем же.',
    explain: [`${w} · ${b} + ${a} = ${n}.`, `${mxH(w, a, b)} = ${frH(n, b)}.`] }, Q(n, b), 'frac',
    [[Q(w + a, b), 'Целую часть надо сначала умножить на знаменатель, а уже потом прибавить числитель.'], [Q(w * a + b, b), 'Целую часть умножают на знаменатель, а не на числитель.']]);
});

/* ============ Кухня дробей ============ */
reg('kitchen', 'k_reduce', d => {
  const [a, b] = properQ(2, d === 1 ? 7 : 11); if (gcd(a, b) !== 1) return null;
  const k = d === 1 ? R.int(2, 5) : d === 2 ? R.int(3, 9) : R.pick([6, 8, 9, 10, 12, 14, 15, 16, 18]);
  return fracTask({ q: `Сократи дробь: <span class="ex">${frH(a * k, b * k)}</span>`,
    hint: 'Найди число, на которое делятся и числитель, и знаменатель (лучше всего — их НОД), и раздели на него оба.',
    explain: [`НОД(${a * k}; ${b * k}) = ${k}.`, `${frH(a * k, b * k)} = ${frH(`${a * k} : ${k}`, `${b * k} : ${k}`)} = ${frH(a, b)}.`] }, Q(a, b), 'frac',
    [[Q(a, b * k), 'Сокращая, делят и числитель, и знаменатель на одно и то же число — не только числитель.'], [Q(a * k, b), 'Сокращая, делят и числитель, и знаменатель — не только знаменатель.']]);
});
reg('kitchen', 'k_equiv', d => {
  const [a, b] = properQ(2, d === 1 ? 6 : 10); if (gcd(a, b) !== 1) return null;
  const k = R.int(2, d === 1 ? 5 : 9), top = d > 1 && R.chance(0.5);
  const q = top ? `${frH(a, b)} = ${frH(a * k, '?')}` : `${frH(a, b)} = ${frH('?', b * k)}`;
  const ans = top ? b * k : a * k;
  return { q: `Найди число, которое пропущено: <span class="ex">${q}</span>`, type: 'num', answer: ans,
    traps: [[top ? b + (a * k - a) : a + (b * k - b), 'Числитель и знаменатель умножают на одно и то же число, а не прибавляют к ним одно и то же.']],
    hint: 'Основное свойство дроби: числитель и знаменатель можно умножить на одно и то же число.',
    explain: [top ? `${a} · ${k} = ${a * k}, значит, и знаменатель умножаем на ${k}.` : `${b} · ${k} = ${b * k}, значит, и числитель умножаем на ${k}.`, `${frH(a, b)} = ${frH(a * k, b * k)}. Ответ: ${ans}.`] };
});
reg('kitchen', 'k_cmp', d => {
  let x, y, why, traps = [];
  if (d === 1) { const b = R.int(3, 12); let a1, a2; do { a1 = R.int(1, b - 1); a2 = R.int(1, b - 1); } while (a1 === a2); x = [a1, b]; y = [a2, b]; why = 'Знаменатели одинаковые — больше та дробь, у которой больше числитель.'; }
  else if (d === 2 && R.chance(0.6)) { const a = R.int(1, 6); let b1, b2; do { b1 = R.int(a + 1, 12); b2 = R.int(a + 1, 12); } while (b1 === b2); x = [a, b1]; y = [a, b2]; why = 'Числители одинаковые — больше та дробь, у которой меньше знаменатель (доли крупнее).';
    traps = [[sgn(Math.sign(b1 - b2)), 'Чем больше знаменатель, тем мельче доли: 1/8 меньше 1/5.']]; }
  else {
    if (R.chance(0.2)) { const [a, b] = properQ(2, 7), k = R.int(2, 4); if (gcd(a, b) !== 1) return null; x = [a, b]; y = [a * k, b * k]; }
    else { let b1, b2; do { b1 = R.int(3, 12); b2 = R.int(3, 12); } while (b1 === b2); x = [R.int(1, b1 - 1), b1]; y = [R.int(1, b2 - 1), b2]; }
    why = 'Приведи дроби к общему знаменателю и сравни числители.';
  }
  if (R.chance(0.5)) [x, y] = [y, x];
  const c = qCmp(Q(...x), Q(...y)), L = lcm(x[1], y[1]);
  return cmpTask({ q: `Сравни дроби: <span class="ex">${frH(...x)} ○ ${frH(...y)}</span>`, hint: why,
    explain: x[1] === y[1] ? [`${x[0]} ${sgn(Math.sign(x[0] - y[0]))} ${y[0]}, значит, ${frH(...x)} ${sgn(c)} ${frH(...y)}.`]
      : [`Общий знаменатель ${L}: ${frH(...x)} = ${frH(x[0] * L / x[1], L)}, ${frH(...y)} = ${frH(y[0] * L / y[1], L)}.`, `${frH(...x)} ${sgn(c)} ${frH(...y)}.`] }, c, traps.filter(t => t[0] !== sgn(c)));
});
reg('kitchen', 'k_common', d => {
  let b1, b2, b3 = 0;
  do { b1 = R.int(2, d === 1 ? 10 : 16); b2 = R.int(2, d === 1 ? 10 : 16); } while (b1 === b2 || gcd(b1, b2) === 1 || b1 % b2 === 0 || b2 % b1 === 0);
  if (d === 3) { b3 = R.int(2, 12); if ([b1, b2].includes(b3)) return null; }
  const L = b3 ? lcm(lcm(b1, b2), b3) : lcm(b1, b2), P = b1 * b2 * (b3 || 1);
  if (L > 120) return null;
  const fs = [b1, b2].concat(b3 ? [b3] : []).map(b => { let a; do a = R.int(1, b - 1); while (gcd(a, b) !== 1); return frH(a, b); });
  return { q: `Найди наименьший общий знаменатель дробей ${fs.join(b3 ? ', ' : ' и ').replace(/, ([^,]*)$/, ' и $1')}.`, type: 'num', answer: L,
    traps: [[P, `${fmt(P)} — общий знаменатель, но не наименьший. Наименьший общий знаменатель — НОК знаменателей.`]],
    hint: 'Наименьший общий знаменатель — это НОК знаменателей.', explain: [`НОК(${[b1, b2].concat(b3 ? [b3] : []).join('; ')}) = ${L}.`] };
});
reg('kitchen', 'k_tocommon', d => {
  let b1, b2; do { b1 = R.int(2, d === 1 ? 8 : 12); b2 = R.int(2, d === 1 ? 8 : 12); } while (b1 === b2 || (d === 1 && b2 % b1 && b1 % b2));
  const a1 = R.int(1, b1 - 1), a2 = R.int(1, b2 - 1); if (gcd(a1, b1) !== 1 || gcd(a2, b2) !== 1) return null;
  const L = lcm(b1, b2), n1 = a1 * L / b1, n2 = a2 * L / b2;
  const pair = (p, q) => `${frH(p, L)} и ${frH(q, L)}`, right = pair(n1, n2);
  const cand = [pair(a1, a2), pair(n1, a2), pair(a1, n2), pair(n2, n1)].filter(o => o !== right);
  const opts = [...new Set([right, ...cand])].slice(0, 4); if (opts.length < 3) return null;
  return { q: `Приведи к общему знаменателю ${L}: <span class="ex">${frH(a1, b1)} и ${frH(a2, b2)}</span>`, type: 'choice', options: R.shuffle(opts), answer: right, answerPlain: `${n1}/${L} и ${n2}/${L}`,
    optVals: opts.map(plain5), traps: [[pair(a1, a2), 'Знаменатель поменяли, а числитель — нет. Числитель тоже умножают на дополнительный множитель.']],
    hint: 'Найди дополнительный множитель для каждой дроби (общий знаменатель : знаменатель) и умножь на него и числитель, и знаменатель.',
    explain: [`${L} : ${b1} = ${L / b1} → ${frH(a1, b1)} = ${frH(n1, L)}.`, `${L} : ${b2} = ${L / b2} → ${frH(a2, b2)} = ${frH(n2, L)}.`] };
});

/* ============ Мост дробей: сложение и вычитание ============ */
const formOf = q => q.n > q.d ? 'mixed' : 'frac';
reg('fbridge', 'b_same', d => {
  const b = R.int(3, d === 1 ? 9 : 15), minus = R.chance(0.45);
  let a1 = R.int(1, b - 1), a2 = R.int(1, b - 1);
  if (minus && a1 <= a2) [a1, a2] = [a2, a1];
  if (a1 === a2 || (d === 1 && !minus && a1 + a2 >= b)) return null;
  const x = Q(a1, b), y = Q(a2, b), ans = minus ? qSub(x, y) : qAdd(x, y); if (ans.n === 0) return null;
  const op = minus ? '−' : '+', r = minus ? a1 - a2 : a1 + a2;
  return fracTask({ q: `Вычисли: <span class="ex">${frH(a1, b)} ${op} ${frH(a2, b)}</span>`,
    hint: 'Знаменатели одинаковые: числители складывай (вычитай), а знаменатель оставь тем же.',
    explain: [`${frH(a1, b)} ${op} ${frH(a2, b)} = ${frH(`${a1} ${op} ${a2}`, b)} = ${frH(r, b)}${qText(ans, true) !== `${r}/${b}` ? ' = ' + qHtml(ans, true) : ''}.`] }, ans, formOf(ans),
    minus ? [] : [[Q(a1 + a2, 2 * b), 'Знаменатели не складывают! При одинаковых знаменателях складывают только числители.']]);
});
reg('fbridge', 'b_diff', d => {
  let b1, b2;
  if (d === 1) { b1 = R.int(2, 6); b2 = b1 * R.int(2, 3); } else { do { b1 = R.int(2, 10); b2 = R.int(2, 12); } while (b1 === b2); }
  if (R.chance(0.5)) [b1, b2] = [b2, b1];
  const a1 = R.int(1, b1 - 1), a2 = R.int(1, b2 - 1), x = Q(a1, b1), y = Q(a2, b2);
  if (gcd(a1, b1) !== 1 || gcd(a2, b2) !== 1) return null;
  const minus = R.chance(0.45) && qCmp(x, y) > 0, ans = minus ? qSub(x, y) : qAdd(x, y), L = lcm(b1, b2);
  if (d === 1 && !minus && ans.n > ans.d) return null;
  const op = minus ? '−' : '+', n1 = a1 * L / b1, n2 = a2 * L / b2;
  return fracTask({ q: `Вычисли: <span class="ex">${frH(a1, b1)} ${op} ${frH(a2, b2)}</span>`, draft: d > 1,
    hint: 'Приведи дроби к общему знаменателю (НОК знаменателей), потом складывай или вычитай числители.',
    explain: [`Общий знаменатель ${L}: ${frH(a1, b1)} = ${frH(n1, L)}, ${frH(a2, b2)} = ${frH(n2, L)}.`, `${frH(n1, L)} ${op} ${frH(n2, L)} = ${frH(minus ? n1 - n2 : n1 + n2, L)}${qText(ans, true) !== `${minus ? n1 - n2 : n1 + n2}/${L}` ? ' = ' + qHtml(ans, true) : ''}.`] }, ans, formOf(ans),
    [[minus ? (b1 > b2 && a1 >= a2 ? Q(a1 - a2, b1 - b2) : null) : Q(a1 + a2, b1 + b2), 'Числители и знаменатели не складывают (не вычитают) между собой! Сначала приведи дроби к общему знаменателю.']]);
});
reg('fbridge', 'b_mixed', d => {
  const b = R.int(3, d === 3 ? 8 : 10), minus = R.chance(0.5);
  let b2 = b; if (d === 3) { b2 = R.int(2, 8); if (b2 === b) return null; }
  const w1 = R.int(2, 9), w2 = R.int(1, w1 - (minus ? 1 : 0)), a1 = R.int(1, b - 1), a2 = R.int(1, b2 - 1);
  if (gcd(a1, b) !== 1 || gcd(a2, b2) !== 1) return null;
  const x = qMix(w1, a1, b), y = qMix(w2, a2, b2);
  if (minus && qCmp(x, y) <= 0) return null;
  const carry = minus ? a1 * b2 < a2 * b : a1 * b2 + a2 * b >= b * b2;
  if (d === 1 && carry) return null;
  if (d === 2 && b === b2 && !carry && R.chance(0.6)) return null;
  const ans = minus ? qSub(x, y) : qAdd(x, y), op = minus ? '−' : '+';
  const traps = minus && b === b2 && a1 < a2 ? [[qMix(w1 - w2, a2 - a1, b), 'Из меньшей дробной части вычесть большую нельзя: займи 1 у целой части (1 = ' + frH(b, b) + ').']] : [];
  if (!minus && b === b2 && a1 + a2 > b) traps.push([qAdd(Q(w1 + w2), Q(a1 + a2 - b, b)), 'Из неправильной дробной части выдели целую и прибавь её к целым.']);
  const steps = b === b2 ? [`Целые: ${w1} ${op} ${w2}, дробные части: ${frH(a1, b)} ${op} ${frH(a2, b)}.`] : [`Приведи дробные части к общему знаменателю ${lcm(b, b2)}.`];
  if (carry) steps.push(minus ? `Дробная часть уменьшаемого меньше — занимаем 1 у целой части.` : `Дробная часть получилась больше 1 — выделяем из неё целую.`);
  steps.push(`Ответ: ${qHtml(ans, true)}.`);
  return fracTask({ q: `Вычисли: <span class="ex">${mxH(w1, a1, b)} ${op} ${mxH(w2, a2, b2)}</span>`, draft: true,
    hint: 'Целые части складывай (вычитай) с целыми, дробные — с дробными. Если дробную часть не вычесть — займи 1 у целых.', explain: steps }, ans, 'mixed', traps);
});
reg('fbridge', 'b_one', d => {
  const [a, b] = properQ(2, d === 1 ? 9 : 12); if (gcd(a, b) !== 1) return null;
  const w = d === 1 ? 1 : R.int(2, 9), w2 = d === 3 ? R.int(1, w - 1) : 0;
  if (d === 3 && w < 2) return null;
  const sub = w2 ? qMix(w2, a, b) : Q(a, b), ans = qSub(Q(w), sub);
  const subH = w2 ? mxH(w2, a, b) : frH(a, b);
  return fracTask({ q: `Вычисли: <span class="ex">${w} − ${subH}</span>`,
    hint: `Представь 1 в виде дроби ${frH(b, b)}: из целых возьми одну единицу.`,
    explain: [`${w} = ${w - 1 - w2 > 0 || w2 ? `${w - 1} ${frH(b, b)}` : frH(b, b)}.`.replace(/^1 = 0 /, '1 = '), `${w} − ${subH} = ${qHtml(ans, true)}.`] }, ans, formOf(ans),
    [[qAdd(Q(w - w2), Q(a, b)), `Нужно вычесть, а не дописать дробь: ${w} − ${subH} меньше ${w - w2}.`], [w - w2 - 1 >= 0 ? qMix(w - w2, a, b) : null, 'Целую часть уменьшили не на ту величину.'], [Q(b - a, b * w), 'Из 1 = ' + frH(b, b) + ' вычитаем ' + frH(a, b) + ', а не делим на целое.']]);
});
reg('fbridge', 'b_word', d => {
  let b1 = R.int(3, 12), b2 = d === 1 ? b1 : R.int(2, 12);
  const a1 = R.int(1, b1 - 1), a2 = R.int(1, b2 - 1), x = Q(a1, b1), y = Q(a2, b2), s = qAdd(x, y);
  if (gcd(a1, b1) !== 1 || gcd(a2, b2) !== 1 || qCmp(s, Q(1)) >= 0) return null;
  const rest = d === 3 || (d === 2 && R.chance(0.5)), ans = rest ? qSub(Q(1), s) : s;
  const who = R.pick([['Маша прочитала', 'книги', 'Какую часть книги она прочитала за два дня?', 'Какая часть книги осталась непрочитанной?'], ['Бригада отремонтировала', 'дороги', 'Какую часть дороги отремонтировали за два дня?', 'Какая часть дороги осталась?'], ['Ёжик собрал', 'урожая грибов на поляне', 'Какую часть урожая собрал ёжик за два дня?', 'Какая часть урожая осталась на поляне?']]);
  return fracTask({ q: `${who[0]} в первый день ${frH(a1, b1)} ${who[1]}, а во второй — ${frH(a2, b2)}. ${rest ? who[3] : who[2]}`, draft: d > 1,
    hint: rest ? 'Вся книга (дорога, урожай) — это 1. Сначала найди, сколько сделано за два дня, потом вычти из 1.' : 'Сложи части за первый и второй день.',
    explain: [`${frH(a1, b1)} + ${frH(a2, b2)} = ${qHtml(s)} — за два дня.`].concat(rest ? [`1 − ${qHtml(s)} = ${qHtml(ans)} — осталось.`] : []) }, ans, 'frac',
    [[rest ? s : null, 'Это сделано за два дня, а спрашивают, сколько осталось.'], [b1 !== b2 ? Q(a1 + a2, b1 + b2) : Q(a1 + a2, 2 * b1), 'Знаменатели не складывают.']]);
});
