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

/* ============ Мастерская дробей: умножение и деление ============ */
reg('fwork', 'w_mulnat', d => {
  const [a, b] = properQ(2, d === 1 ? 9 : 12), n = R.int(2, d === 1 ? 5 : 12); if (gcd(a, b) !== 1 || n % b === 0 && d === 1) return null;
  const div = d === 3 && R.chance(0.5);
  if (div) { const ans = Q(a, b * n); return fracTask({ q: `Вычисли: <span class="ex">${frH(a, b)} : ${n}</span>`, hint: 'Чтобы разделить дробь на натуральное число, умножь на это число знаменатель.',
    explain: [`${frH(a, b)} : ${n} = ${frH(a, `${b} · ${n}`)} = ${qHtml(ans)}.`] }, ans, 'frac', [[Q(a * n, b), 'Это умножение. При делении на число знаменатель умножают на это число.']]); }
  const ans = Q(a * n, b);
  return fracTask({ q: `Вычисли: <span class="ex">${frH(a, b)} · ${n}</span>`, hint: 'Чтобы умножить дробь на натуральное число, умножь на него числитель, а знаменатель оставь.',
    explain: [`${frH(a, b)} · ${n} = ${frH(`${a} · ${n}`, b)} = ${frH(a * n, b)}${qText(ans, true) !== `${a * n}/${b}` ? ' = ' + qHtml(ans, true) : ''}.`] }, ans, formOf(ans),
    [[Q(a * n, b * n), 'На число умножают только числитель. Если умножить и знаменатель — дробь не изменится.']]);
});
reg('fwork', 'w_mul', d => {
  const [a, b] = properQ(2, d === 1 ? 7 : 12), [c, e] = d === 3 && R.chance(0.4) ? [R.int(5, 15), R.int(2, 4)] : properQ(2, d === 1 ? 7 : 12);
  if (gcd(a, b) !== 1 || gcd(c, e) !== 1) return null;
  const ans = qMul(Q(a, b), Q(c, e)); if (ans.d === 1 && ans.n === 1) return null;
  const cut = gcd(a * c, b * e) > 1;
  return fracTask({ q: `Вычисли: <span class="ex">${frH(a, b)} · ${frH(c, e)}</span>`, draft: d > 1,
    hint: 'Числитель умножь на числитель, знаменатель — на знаменатель. Сокращай до умножения — так проще.',
    explain: [`${frH(a, b)} · ${frH(c, e)} = ${frH(`${a} · ${c}`, `${b} · ${e}`)}${cut ? ' — сокращаем' : ''} = ${qHtml(ans, true)}.`] }, ans, formOf(ans),
    [[Q(a * e, b * c), 'Это деление. При умножении числитель умножают на числитель, знаменатель — на знаменатель.'], [b === e ? Q(a * c, b) : null, 'Знаменатели тоже перемножают.']]);
});
reg('fwork', 'w_div', d => {
  const [a, b] = properQ(2, d === 1 ? 7 : 12), [c, e] = properQ(2, d === 1 ? 7 : 12);
  if (gcd(a, b) !== 1 || gcd(c, e) !== 1 || (a === c && b === e)) return null;
  const nat = d === 1 && R.chance(0.4);
  if (nat) { const n = R.int(2, 9), ans = Q(n * b, a); return fracTask({ q: `Вычисли: <span class="ex">${n} : ${frH(a, b)}</span>`, hint: 'Делить на дробь — значит умножать на обратную дробь.',
    explain: [`${n} : ${frH(a, b)} = ${n} · ${frH(b, a)} = ${qHtml(ans, true)}.`] }, ans, formOf(ans), [[Q(n * a, b), 'Это умножение. Делить на дробь — значит умножать на перевёрнутую (обратную) дробь.']]); }
  const ans = qDiv(Q(a, b), Q(c, e));
  return fracTask({ q: `Вычисли: <span class="ex">${frH(a, b)} : ${frH(c, e)}</span>`, draft: d > 1,
    hint: 'Делить на дробь — значит умножать на дробь, обратную делителю: «переворачиваем» вторую дробь.',
    explain: [`${frH(a, b)} : ${frH(c, e)} = ${frH(a, b)} · ${frH(e, c)} = ${qHtml(ans, true)}.`] }, ans, formOf(ans),
    [[qMul(Q(a, b), Q(c, e)), 'Это умножение. При делении вторую дробь переворачивают.'], [qMul(Q(b, a), Q(c, e)), 'Переворачивают делитель (вторую дробь), а не делимое.']]);
});
reg('fwork', 'w_mixed', d => {
  const b = R.int(2, 6), e = R.int(2, 6), w1 = R.int(1, d === 3 ? 5 : 3), w2 = R.int(1, d === 3 ? 4 : 2), a = R.int(1, b - 1), c = R.int(1, e - 1);
  if (gcd(a, b) !== 1 || gcd(c, e) !== 1) return null;
  const x = qMix(w1, a, b), y = qMix(w2, c, e), div = d > 1 && R.chance(0.45), ans = div ? qDiv(x, y) : qMul(x, y);
  if (ans.d > 30 || ans.n > 300) return null;
  return fracTask({ q: `Вычисли: <span class="ex">${mxH(w1, a, b)} ${div ? ':' : '·'} ${mxH(w2, c, e)}</span>`, draft: true,
    hint: 'Сначала переведи смешанные числа в неправильные дроби, потом умножай (дели).',
    explain: [`${mxH(w1, a, b)} = ${frH(x.n, x.d)}, ${mxH(w2, c, e)} = ${frH(y.n, y.d)}.`, div ? `${frH(x.n, x.d)} : ${frH(y.n, y.d)} = ${frH(x.n, x.d)} · ${frH(y.d, y.n)} = ${qHtml(ans, true)}.` : `${frH(x.n, x.d)} · ${frH(y.n, y.d)} = ${qHtml(ans, true)}.`] }, ans, formOf(ans),
    div ? [] : [[qAdd(Q(w1 * w2), qMul(Q(a, b), Q(c, e))), 'Нельзя умножать отдельно целые и дробные части! Переведи смешанные числа в неправильные дроби.']]);
});
reg('fwork', 'w_recip', d => {
  if (d === 1) { const [a, b] = properQ(2, 12); if (gcd(a, b) !== 1) return null; const ans = Q(b, a);
    return fracTask({ q: `Найди число, обратное дроби ${frH(a, b)}.`, hint: 'Обратная дробь — «перевёрнутая»: числитель и знаменатель меняются местами. Их произведение равно 1.',
      explain: [`${frH(a, b)} · ${frH(b, a)} = 1, значит, обратное число — ${frH(b, a)}.`] }, ans, 'frac', [[Q(a, b), 'Это та же дробь. Переверни её!']]); }
  if (d === 2 && R.chance(0.5)) { const n = R.int(2, 20); return fracTask({ q: `Найди число, обратное числу ${n}.`, hint: `${n} = ${frH(n, 1)}. Переверни дробь.`,
    explain: [`${n} = ${frH(n, 1)}, обратное — ${frH(1, n)}, ведь ${n} · ${frH(1, n)} = 1.`] }, Q(1, n), 'frac'); }
  const b = R.int(2, 9), a = R.int(1, b - 1), w = R.int(1, 4); if (gcd(a, b) !== 1) return null;
  const x = qMix(w, a, b);
  return fracTask({ q: `Найди число, обратное числу ${mxH(w, a, b)}.`, hint: 'Сначала запиши смешанное число неправильной дробью, потом переверни её.',
    explain: [`${mxH(w, a, b)} = ${frH(x.n, x.d)}.`, `Обратное число — ${frH(x.d, x.n)}.`] }, Q(x.d, x.n), 'frac', [[qMix(w, b, a), 'Переворачивают всю дробь, а не только дробную часть: сначала переведи в неправильную дробь.'], [Q(b, a), 'Целая часть тоже участвует: сначала переведи в неправильную дробь.']]);
});

/* ============ Задачи на части ============ */
const NAMES5 = ['Маша', 'Настя', 'Оля', 'Вера', 'Аня'];
reg('parts', 't_part', d => {
  const [a, b] = d === 1 ? [1, R.int(2, 8)] : properQ(3, d === 2 ? 9 : 12); if (gcd(a, b) !== 1) return null;
  const N = b * R.int(2, d === 3 ? 20 : 10), P = N / b * a;
  const kind = R.int(0, 2);
  if (kind === 0 && (N < 12 || N > 36)) return null;   /* в классе — от 12 до 36 учеников */
  const s = [[`В классе ${N} ${pl(N, 'ученик', 'ученика', 'учеников')}, ${frH(a, b)} из них — девочки. Сколько девочек в классе?`, 'девочек'], [`В саду ${N} деревьев, ${frH(a, b)} из них — яблони. Сколько яблонь в саду?`, 'яблонь'], [`Длина дороги ${N} км. Отремонтировали ${frH(a, b)} дороги. Сколько километров отремонтировали?`, 'км']][kind];
  return { q: s[0], type: 'num', answer: P, traps: [[P === N / a * b || N % a ? null : N / a * b, 'Чтобы найти дробь от числа, дели на знаменатель и умножай на числитель.'], [a > 1 ? N / b : null, `Это ${frH(1, b)}, а нужно ${frH(a, b)}.`]],
    hint: 'Целое раздели на знаменатель (одна часть) и умножь на числитель.', explain: [`${N} : ${b} = ${N / b} — одна часть.`].concat(a > 1 ? [`${N / b} · ${a} = ${P}.`] : []).concat([`Ответ: ${P} ${s[1] === 'км' ? 'км' : ''}`.trim() + '.']) };
});
reg('parts', 't_whole', d => {
  const [a, b] = d === 1 ? [1, R.int(2, 8)] : properQ(3, d === 2 ? 9 : 12); if (gcd(a, b) !== 1) return null;
  const N = b * R.int(2, d === 3 ? 20 : 10), P = N / b * a;
  const s = R.pick([[`${R.pick(NAMES5)} прочитала ${P} ${pl(P, 'страницу', 'страницы', 'страниц')} — это ${frH(a, b)} книги. Сколько страниц в книге?`], [`Туристы прошли ${P} км — это ${frH(a, b)} всего маршрута. Какова длина маршрута?`], [`Ёжик собрал ${P} ${pl(P, 'гриб', 'гриба', 'грибов')} — это ${frH(a, b)} всех грибов на поляне. Сколько грибов было на поляне?`]]);
  return { q: s[0], type: 'num', answer: N, traps: [[P % b ? null : P / b * a, 'Это дробь от числа. А здесь известна часть — ищем целое: дели на числитель, умножай на знаменатель.']],
    hint: 'Часть раздели на числитель (одна доля) и умножь на знаменатель.', explain: (a > 1 ? [`${P} : ${a} = ${P / a} — одна доля.`] : []).concat([`${P / a} · ${b} = ${N} — целое.`]) };
});
reg('parts', 't_rest', d => {
  const [a, b] = properQ(3, d === 1 ? 6 : 10); if (gcd(a, b) !== 1) return null;
  const N = b * R.int(d === 1 ? 10 : 20, d === 1 ? 50 : 120), spent = N / b * a, rest = N - spent;
  if (d === 3) {
    const [c, e] = properQ(2, 6); if (gcd(c, e) !== 1 || rest % e) return null;
    const sp2 = rest / e * c, ans = rest - sp2;
    return { q: `У ${R.pick(['Пети', 'Коли', 'Димы'])} было ${fmt(N)} р. Он потратил ${frH(a, b)} денег на книгу, а потом ${frH(c, e)} остатка — на ручки. Сколько рублей у него осталось?`, type: 'num', answer: ans, draft: true,
      traps: [[N - spent - N / e * c, `${frH(c, e)} берётся от остатка, а не от всех денег.`]],
      hint: 'Сначала найди остаток после первой покупки. Вторая дробь — от этого остатка.',
      explain: [`${fmt(N)} : ${b} · ${a} = ${fmt(spent)} р. — на книгу.`, `${fmt(N)} − ${fmt(spent)} = ${fmt(rest)} р. — остаток.`, `${fmt(rest)} : ${e} · ${c} = ${fmt(sp2)} р. — на ручки.`, `${fmt(rest)} − ${fmt(sp2)} = ${fmt(ans)} р.`] };
  }
  return { q: `У ${R.pick(['мамы', 'папы', 'бабушки'])} было ${fmt(N)} р. На продукты ушло ${frH(a, b)} этих денег. Сколько рублей осталось?`, type: 'num', answer: rest, draft: d > 1,
    traps: [[spent, 'Это сколько потратили. А спрашивают, сколько осталось.']],
    hint: 'Найди, сколько потратили (дробь от числа), и вычти из всех денег. Или найди, какая часть осталась.',
    explain: [`${fmt(N)} : ${b} · ${a} = ${fmt(spent)} р. — потратили.`, `${fmt(N)} − ${fmt(spent)} = ${fmt(rest)} р. — осталось.`] };
});
const WORK = [[6, 3, 2], [4, 12, 3], [6, 12, 4], [10, 15, 6], [12, 24, 8], [20, 30, 12], [4, 4, 2], [12, 4, 3], [10, 40, 8], [5, 20, 4], [30, 60, 20], [9, 18, 6], [8, 24, 6], [3, 6, 2], [15, 10, 6], [12, 6, 4]];
reg('parts', 't_work', d => {
  const [x, y, t] = R.pick(WORK), what = R.pick([['Первая труба наполняет бассейн', 'вторая', 'бассейна', 'наполнят бассейн'], ['Мастер выполняет заказ', 'ученик', 'заказа', 'выполнят заказ'], ['Первый насос откачивает воду из пруда', 'второй', 'пруда', 'откачают воду']]);
  if (d === 1) return fracTask({ q: `${what[0]} за ${x} ч. Какую часть ${what[2]} он${what[0].startsWith('Первая') ? 'а' : ''} ${what[0].startsWith('Первая') ? 'наполняет' : what[0].startsWith('Мастер') ? 'выполняет' : 'откачивает'} за 1 час?`,
    hint: 'Вся работа — 1. За 1 час выполняется 1 : время.', explain: [`1 : ${x} = ${frH(1, x)} — за 1 час.`] }, Q(1, x), 'frac', [[Q(x, 1), 'За час выполняется только часть работы — меньше 1.']]);
  if (d === 2) { const ans = qAdd(Q(1, x), Q(1, y)); return fracTask({ q: `${what[0]} за ${x} ч, а ${what[1]} — за ${y} ч. Какую часть ${what[2]} они ${what[3].split(' ')[0]} вместе за 1 час?`, draft: true,
    hint: 'Найди часть работы за 1 час для каждого и сложи.', explain: [`${frH(1, x)} + ${frH(1, y)} = ${qHtml(ans)} — вместе за 1 час.`] }, ans, 'frac', [[Q(2, x + y), 'Знаменатели не складывают: приведи дроби к общему знаменателю.'], [Q(1, x + y), 'Время не складывают: складывают части работы за 1 час.']]); }
  return { q: `${what[0]} за ${x} ч, а ${what[1]} — за ${y} ч. За сколько часов они ${what[3]}, если будут работать вместе?`, type: 'num', answer: t, draft: true,
    traps: [[x + y, 'Вместе работают быстрее, чем каждый в отдельности, — время не складывают.'], [(x + y) % 2 ? null : (x + y) / 2, 'Среднее время тут не подходит: складывают части работы за 1 час.']],
    hint: 'Найди, какую часть работы они делают вместе за 1 час, и раздели всю работу (1) на эту часть.',
    explain: [`За 1 час: ${frH(1, x)} + ${frH(1, y)} = ${frH(1, t)} работы.`, `1 : ${frH(1, t)} = ${t} (ч).`] };
});

/* ============ Луч координат ============ */
const RAY = { x0: 24, u: 0, W: 360 };
function raySvg(n, units, pts, labels) {
  const U = Math.floor((RAY.W - RAY.x0 - 20) / units), X = v => RAY.x0 + v * U;
  let g = `<line x1="${RAY.x0 - 8}" y1="40" x2="${RAY.W - 4}" y2="40" stroke="#5B3418" stroke-width="2.5"/><path d="M${RAY.W - 4} 40 l-10 -5 v10 z" fill="#5B3418"/>`;
  for (let k = 0; k <= units * n; k++) { const big = k % n === 0; g += `<line x1="${X(k / n)}" x2="${X(k / n)}" y1="${big ? 30 : 34}" y2="${big ? 50 : 46}" stroke="#5B3418" stroke-width="${big ? 2.5 : 1.6}"/>`; }
  for (const [v, t] of labels) g += `<text x="${X(v)}" y="68" font-size="15" font-weight="700" text-anchor="middle" fill="#4A2814">${t}</text>`;
  for (const [v, t] of pts) g += `<circle cx="${X(v)}" cy="40" r="5.5" fill="#E8742E" stroke="#5B3418" stroke-width="2"/><text x="${X(v)}" y="20" font-size="16" font-weight="800" text-anchor="middle" fill="#C14A1A">${t}</text>`;
  return `<svg class="gfig ray" viewBox="0 0 ${RAY.W} 76" width="${RAY.W}">${g}</svg>`;
}
reg('ray', 'r_point', d => {
  const n = R.int(d === 1 ? 2 : 3, d === 1 ? 6 : 8), units = d === 3 ? R.int(2, 3) : 1, k = R.int(1, units * n - 1);
  if (k % n === 0) return null;
  const ans = Q(k, n), labels = Array.from({ length: units + 1 }, (_, i) => [i, String(i)]);
  return fracTask({ q: `Какое число отмечено на луче точкой A?`, fig: raySvg(n, units, [[k / n, 'A']], labels),
    hint: 'Посчитай, на сколько равных частей разделён единичный отрезок (от 0 до 1) — это знаменатель. Сколько таких частей до точки — числитель.',
    explain: [`Единичный отрезок разделён на ${n} ${pl(n, 'часть', 'части', 'частей')} — каждая часть ${frH(1, n)}.`, `До точки A — ${k} ${pl(k, 'часть', 'части', 'частей')}: A(${qHtml(ans, true)}).`] }, ans, units > 1 ? 'mixed' : 'frac',
    [[Q(k, n + 1), 'Считай не штрихи, а промежутки между ними: штрихов на 1 больше, чем частей.'], [Q(k, n - 1 || 1), 'Посчитай части единичного отрезка ещё раз.']]);
});
reg('ray', 'r_where', d => {
  const n = R.int(5, d === 1 ? 8 : 10), units = d === 3 ? 2 : 1;
  const ks = new Set(); while (ks.size < 4) { const k = R.int(1, units * n - 1); if (k % n) ks.add(k); }
  const arr = [...ks].sort((a, b) => a - b), letters = ['A', 'B', 'C', 'D'], pick = R.int(0, 3), target = Q(arr[pick], n);
  const show = qHtml(target, true);
  return { q: `Какая точка соответствует числу ${show}?`, fig: raySvg(n, units, arr.map((k, i) => [k / n, letters[i]]), Array.from({ length: units + 1 }, (_, i) => [i, String(i)])),
    type: 'choice', options: letters.slice(), answer: letters[pick], cols2: true,
    hint: `Единичный отрезок разделён на ${n} частей. ${target.d !== n ? `Сначала запиши ${show} со знаменателем ${n}.` : ''}`.trim(),
    explain: [`${show} = ${frH(arr[pick], n)}${units > 1 && arr[pick] > n ? ` = ${mxH(Math.floor(arr[pick] / n), arr[pick] % n, n)}` : ''}: отсчитай ${arr[pick]} ${pl(arr[pick], 'деление', 'деления', 'делений')} от 0.`, `Это точка ${letters[pick]}.`] };
});
reg('ray', 'r_scale', d => {
  const m = R.pick(d === 1 ? [5, 10] : [4, 5, 10]), step = R.pick(d === 1 ? [1, 2, 10] : d === 2 ? [5, 10, 20, 25] : [15, 25, 50, 200, 250]), L = m * step;
  const k = R.int(1, m * (d === 3 ? 2 : 1) - 1); if (k % m === 0) return null;
  const units = d === 3 ? 2 : 1, ans = k * step;
  let g = '', W = 340, x0 = 20, U = (W - 30) / (m * units);
  g += `<rect x="${x0}" y="30" width="${U * m * units}" height="14" rx="3" fill="#FFF3DE" stroke="#5B3418" stroke-width="2"/>`;
  for (let i = 0; i <= m * units; i++) { const big = i % m === 0; g += `<line x1="${x0 + i * U}" x2="${x0 + i * U}" y1="${big ? 22 : 26}" y2="30" stroke="#5B3418" stroke-width="${big ? 2.5 : 1.5}"/>`; if (big) g += `<text x="${x0 + i * U}" y="16" font-size="14" font-weight="700" text-anchor="middle" fill="#4A2814">${(i / m) * L}</text>`; }
  g += `<path d="M${x0 + k * U} 47 l-7 13 h14 z" fill="#E8742E" stroke="#5B3418" stroke-width="1.6"/>`;
  return { q: `Какое число показывает стрелка на шкале?`, fig: `<svg class="gfig" viewBox="0 0 ${W} 66" width="${W}">${g}</svg>`, type: 'num', answer: ans,
    traps: [[k, 'Это число делений. Сначала найди цену деления.'], [k * L, 'Цена одного деления — не ' + L + '. Раздели ' + L + ' на число делений между подписями.']],
    hint: `Найди цену деления: между подписями 0 и ${L} — ${m} делений.`, explain: [`Цена деления: ${L} : ${m} = ${step}.`, `Стрелка на ${k}-м делении: ${k} · ${step} = ${ans}.`] };
});

/* ============ Угломерная ============ */
function angleSvg(deg, mark) {
  const cx = 60, cy = 110, r = 120, rad = deg * Math.PI / 180;
  const ex = cx + r * Math.cos(rad), ey = cy - r * Math.sin(rad), ar = 26;
  const arc = deg === 90 ? `<path d="M${cx + 18} ${cy} v-18 h-18" fill="none" stroke="#C14A1A" stroke-width="2.4"/>` : `<path d="M${cx + ar} ${cy} A${ar} ${ar} 0 0 0 ${cx + ar * Math.cos(rad)} ${cy - ar * Math.sin(rad)}" fill="none" stroke="#C14A1A" stroke-width="2.4"/>`;
  const W = deg > 90 ? 250 : 200;
  return `<svg class="gfig" viewBox="${deg > 90 ? -60 : 0} 0 ${W} 124" width="${W}"><line x1="${cx}" y1="${cy}" x2="${cx + r + 10}" y2="${cy}" stroke="#5B3418" stroke-width="3" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${ex}" y2="${Math.max(6, ey)}" stroke="#5B3418" stroke-width="3" stroke-linecap="round"/>${arc}<circle cx="${cx}" cy="${cy}" r="3.5" fill="#5B3418"/>${mark ? `<text x="${cx - 14}" y="${cy + 4}" font-size="14" font-weight="700" fill="#4A2814">O</text>` : ''}</svg>`;
}
const KINDS = ['острый', 'прямой', 'тупой', 'развёрнутый'];
const kindOf = a => a < 90 ? 'острый' : a === 90 ? 'прямой' : a < 180 ? 'тупой' : 'развёрнутый';
reg('angle', 'a_kind', d => {
  let a, q, fig = '';
  if (d === 1) { a = R.pick([R.int(10, 80), 90, R.int(100, 170), 180]); q = `Угол равен ${a}${DEG}. Какой это угол?`; }
  else if (d === 2) { a = R.pick([R.int(15, 75), 90, R.int(105, 165)]); q = 'Какой угол изображён на рисунке?'; fig = angleSvg(a); }
  else { const x = R.int(20, 80), y = R.int(20, 100); a = x + y; if (a > 180 || Math.abs(a - 90) < 3 && a !== 90) return null; q = `Угол разделили лучом на два угла: ${x}${DEG} и ${y}${DEG}. Каким был весь угол?`; }
  return { q, fig, type: 'choice', options: KINDS.slice(), answer: kindOf(a), cols2: true,
    hint: 'Острый — меньше 90°, прямой — ровно 90°, тупой — от 90° до 180°, развёрнутый — 180°.',
    explain: (d === 3 ? [`Весь угол: ${a}${DEG}.`] : []).concat([`${a}${DEG} — ${kindOf(a)} угол.`]) };
});
function protractorSvg(rays) {
  const cx = 170, cy = 150, R1 = 130, R2 = 106, R3 = 84;
  let g = `<path d="M${cx - R1} ${cy} A${R1} ${R1} 0 0 1 ${cx + R1} ${cy} Z" fill="#FFF3DE" fill-opacity=".85" stroke="#B88A5A" stroke-width="2"/>`;
  for (let t = 0; t <= 180; t += 5) {
    const rad = t * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad), big = t % 10 === 0;
    g += `<line x1="${cx + c * (R1 - (big ? 12 : 7))}" y1="${cy - s * (R1 - (big ? 12 : 7))}" x2="${cx + c * R1}" y2="${cy - s * R1}" stroke="#8A5A36" stroke-width="${big ? 1.6 : 1}"/>`;
    if (t % 20 === 0) {
      g += `<text x="${cx + c * R2}" y="${cy - s * R2 + 4}" font-size="11" text-anchor="middle" fill="#4A2814" font-weight="700">${t}</text>`;
      g += `<text x="${cx + c * R3}" y="${cy - s * R3 + 4}" font-size="9.5" text-anchor="middle" fill="#A0703F">${180 - t}</text>`;
    }
  }
  g += `<circle cx="${cx}" cy="${cy}" r="3.5" fill="#5B3418"/>`;
  for (const t of rays) { const rad = t * Math.PI / 180; g += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(rad) * (R1 + 22)}" y2="${cy - Math.sin(rad) * (R1 + 22)}" stroke="#C14A1A" stroke-width="3" stroke-linecap="round"/>`; }
  return `<svg class="gfig" viewBox="10 0 320 160" width="320">${g}</svg>`;
}
reg('angle', 'a_prot', d => {
  if (d === 3) {
    const t1 = R.int(1, 8) * 10, t2 = t1 + R.int(3, 9) * 10; if (t2 > 170) return null;
    return { q: 'Сколько градусов угол между двумя красными лучами?', fig: protractorSvg([t1, t2]), type: 'num', answer: t2 - t1,
      traps: [[t2, 'Ни один луч не проходит через 0 — нужно вычесть одно показание из другого.'], [180 - t1, 'Найди показания обоих лучей по одной шкале и вычти.']],
      hint: 'Посмотри, на какие числа одной шкалы указывают лучи, и найди разность.', explain: [`Лучи указывают на ${t1}${DEG} и ${t2}${DEG} (по одной шкале).`, `${t2} − ${t1} = ${t2 - t1}${DEG}.`] };
  }
  const t = d === 1 ? R.int(1, 17) * 10 : R.int(2, 34) * 5; if (t === 90 || (d === 2 && t % 10 === 0)) return null;
  return { q: 'Сколько градусов угол, отмеченный красными лучами?', fig: protractorSvg([0, t]), type: 'num', answer: t,
    traps: [[180 - t, 'Это показание другой шкалы. Считай по той шкале, где первая сторона угла стоит на 0.']],
    hint: 'Одна сторона угла проходит через 0 (справа). Читай числа по той же шкале — она начинается с 0 справа.', explain: [`Первая сторона — на 0, вторая — на ${t} по той же шкале.`, `Угол равен ${t}${DEG}.`] };
});
reg('angle', 'a_split', d => {
  if (d === 3) {
    const all = R.pick([120, 130, 140, 150, 160, 180]), x = R.int(2, 6) * 5, y = R.int(2, 6) * 5; if (all - x - y < 10) return null;
    return { q: `Внутри угла AOB, равного ${all}${DEG}, проведены лучи OC и OD так, что ∠AOC = ${x}${DEG} и ∠DOB = ${y}${DEG}, а луч OC ближе к OA. Найди ∠COD.`, type: 'num', answer: all - x - y, draft: true,
      traps: [[x + y, 'Это сумма двух крайних углов. Нужно вычесть их из всего угла.']], hint: 'Весь угол состоит из трёх частей. Вычти известные части из всего угла.',
      explain: [`∠COD = ${all} − ${x} − ${y} = ${all - x - y}${DEG}.`] };
  }
  const all = d === 1 ? 90 : 180, x = R.int(2, d === 1 ? 16 : 34) * 5;
  return { q: `Луч OC делит ${d === 1 ? 'прямой' : 'развёрнутый'} угол AOB на два угла. ∠AOC = ${x}${DEG}. Найди ∠COB.`, type: 'num', answer: all - x,
    traps: [[all + x, 'Угол COB — часть угла AOB, поэтому вычитаем.'], [d === 1 ? 180 - x : 90 - x > 0 ? 90 - x : null, d === 1 ? 'Прямой угол — 90°, а не 180°.' : 'Развёрнутый угол — 180°, а не 90°.']],
    hint: `${d === 1 ? 'Прямой' : 'Развёрнутый'} угол равен ${all}${DEG}. ∠AOC + ∠COB = ${all}${DEG}.`, explain: [`∠COB = ${all} − ${x} = ${all - x}${DEG}.`] };
});
reg('angle', 'a_tri', d => {
  if (d === 2 || (d === 3 && R.chance(0.5))) {
    const t = R.pick(['eq', 'iso', 'sc']), a = R.int(3, 12);
    let s; if (t === 'eq') s = [a, a, a]; else if (t === 'iso') { const b = R.int(2, 2 * a - 1); if (b === a) return null; s = R.shuffle([a, a, b]); } else { const b = R.int(3, 12), c = R.int(3, 12); if (new Set([a, b, c]).size < 3 || a + b <= c || a + c <= b || b + c <= a) return null; s = [a, b, c]; }
    if (d === 3) { const P = s.reduce((x, y) => x + y, 0); if (t !== 'eq') return null; return { q: `Периметр равностороннего треугольника ${P} см. Найди длину его стороны.`, type: 'num', answer: a, traps: [[P / 2 === Math.floor(P / 2) ? P / 2 : null, 'У треугольника три стороны, а не две.']], hint: 'У равностороннего треугольника все три стороны равны.', explain: [`${P} : 3 = ${a} (см).`] }; }
    const ans = { eq: 'равносторонний', iso: 'равнобедренный', sc: 'разносторонний' }[t];
    return { q: `Стороны треугольника: ${s.join(' см, ')} см. Какой это треугольник?`, type: 'choice', options: ['равносторонний', 'равнобедренный', 'разносторонний'], answer: ans,
      hint: 'Все стороны равны — равносторонний. Две равны — равнобедренный. Все разные — разносторонний.', explain: [`${ans[0].toUpperCase() + ans.slice(1)} треугольник.`] };
  }
  let A; do { const x = R.int(20, 110), y = R.int(20, 160 - x); A = R.shuffle([x, y, 180 - x - y]); } while (A.some(v => v < 10));
  if (R.chance(0.3)) { const x = R.int(20, 70); A = R.shuffle([90, x, 90 - x]); }
  const mx = Math.max(...A), ans = mx < 90 ? 'остроугольный' : mx === 90 ? 'прямоугольный' : 'тупоугольный';
  return { q: `Углы треугольника: ${A.join(DEG + ', ')}${DEG}. Какой это треугольник?`, type: 'choice', options: ['остроугольный', 'прямоугольный', 'тупоугольный'], answer: ans,
    hint: 'Смотри на самый большой угол: меньше 90° — остроугольный, 90° — прямоугольный, больше 90° — тупоугольный.', explain: [`Самый большой угол — ${mx}${DEG}, значит, треугольник ${ans}.`] };
});
reg('angle', 'a_circle', d => {
  if (d === 1) { const r = R.int(2, 25), byR = R.chance(0.5); return byR ? { q: `Радиус окружности ${r} см. Найди её диаметр.`, type: 'num', answer: 2 * r, traps: [[r % 2 ? null : r / 2, 'Диаметр в 2 раза больше радиуса, а не меньше.']], hint: 'Диаметр — это два радиуса: d = 2 · r.', explain: [`d = 2 · ${r} = ${2 * r} (см).`] }
    : { q: `Диаметр окружности ${2 * r} см. Найди её радиус.`, type: 'num', answer: r, traps: [[4 * r, 'Радиус в 2 раза меньше диаметра.']], hint: 'Радиус — половина диаметра: r = d : 2.', explain: [`r = ${2 * r} : 2 = ${r} (см).`] }; }
  if (d === 2) { const dm = R.int(2, 9), cm = R.pick([2, 4, 6, 8]); const D = dm * 10 + cm; return { q: `Диаметр круга ${dm} дм ${cm} см. Найди радиус в сантиметрах.`, type: 'num', answer: D / 2, traps: [[D, 'Это диаметр в сантиметрах. Радиус — половина диаметра.']], hint: 'Переведи диаметр в сантиметры и раздели на 2.', explain: [`${dm} дм ${cm} см = ${D} см.`, `${D} : 2 = ${D / 2} (см).`] }; }
  if (R.chance(0.5)) { const r1 = R.int(2, 12), r2 = R.int(2, 12); return { q: `Две окружности с радиусами ${r1} см и ${r2} см касаются друг друга снаружи. Найди расстояние между их центрами.`, type: 'num', answer: r1 + r2, traps: [[2 * (r1 + r2), 'Расстояние между центрами — сумма радиусов, а не диаметров.']], hint: 'Нарисуй: от одного центра до точки касания — радиус, от неё до другого центра — второй радиус.', explain: [`${r1} + ${r2} = ${r1 + r2} (см).`] }; }
  const a = R.int(2, 15) * 2; return { q: `Круг вписан в квадрат со стороной ${a} см (касается всех его сторон). Найди радиус круга.`, type: 'num', answer: a / 2, traps: [[a, 'Сторона квадрата равна диаметру, а радиус — половина диаметра.']], hint: 'Диаметр круга равен стороне квадрата.', explain: [`d = ${a} см, r = ${a} : 2 = ${a / 2} (см).`] };
});

/* ============ Диаграммы ============ */
reg('charts', 'c_bar', d => {
  const n = d === 1 ? 4 : 5, step = 10, labels = R.pick([['Пн', 'Вт', 'Ср', 'Чт', 'Пт'], ['5 А', '5 Б', '5 В', '5 Г', '5 Д'], ['Янв', 'Фев', 'Мар', 'Апр', 'Май']]).slice(0, n);
  let vals; do vals = labels.map(() => step * R.int(1, 9)); while (new Set(vals).size < n || (d === 3 && vals.reduce((a, b) => a + b, 0) % n));
  const fig = `<div class="small muted">Сколько килограммов макулатуры собрали (диаграмма):</div>${barSvg(labels, vals, 'кг')}`, sum = vals.reduce((a, b) => a + b, 0);
  if (d === 3) return { q: 'По диаграмме: сколько килограммов собирали <b>в среднем</b> за один раз?', fig, type: 'num', answer: sum / n, draft: true,
    traps: [[sum, 'Это сумма. Среднее — сумма, делённая на количество.']], hint: 'Сложи все значения и раздели на их количество.', explain: [`${vals.join(' + ')} = ${sum}.`, `${sum} : ${n} = ${sum / n} (кг).`] };
  const [i, j] = R.sample([...labels.keys()], 2);
  if (d === 2) return { q: `По диаграмме: на сколько килограммов больше собрали в «${labels[vals[i] > vals[j] ? i : j]}», чем в «${labels[vals[i] > vals[j] ? j : i]}»?`, fig, type: 'num', answer: Math.abs(vals[i] - vals[j]),
    traps: [[vals[i] + vals[j], 'Спрашивают «на сколько больше» — нужно вычитать.']], hint: 'Найди высоту обоих столбиков по шкале и вычти.', explain: [`${Math.max(vals[i], vals[j])} − ${Math.min(vals[i], vals[j])} = ${Math.abs(vals[i] - vals[j])} (кг).`] };
  return { q: 'По диаграмме: сколько всего килограммов собрали?', fig, type: 'num', answer: sum, hint: 'Найди высоту каждого столбика по шкале и сложи.', explain: [`${vals.join(' + ')} = ${sum} (кг).`] };
});
const PIES = [[[1, 2], [1, 4], [1, 4]], [[1, 2], [1, 4], [1, 8], [1, 8]], [[1, 4], [1, 4], [1, 4], [1, 4]], [[1, 2], [1, 3], [1, 6]], [[1, 3], [1, 3], [1, 6], [1, 6]], [[3, 8], [1, 4], [1, 4], [1, 8]], [[1, 2], [3, 8], [1, 8]]];
const PIE_COL = ['#E8742E', '#4E9A6A', '#3D7CC9', '#F4C542'];
function pieSvg(parts, names, showFr) {
  const cx = 90, cy = 90, r = 80; let a0 = -Math.PI / 2, g = '', leg = '';
  parts.forEach(([a, b], i) => {
    const a1 = a0 + 2 * Math.PI * a / b, large = a / b > 0.5 ? 1 : 0;
    g += `<path d="M${cx} ${cy} L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z" fill="${PIE_COL[i]}" stroke="#5B3418" stroke-width="2"/>`;
    leg += `<g transform="translate(196 ${26 + i * 34})"><rect width="18" height="18" rx="4" fill="${PIE_COL[i]}" stroke="#5B3418" stroke-width="1.5"/><text x="26" y="14" font-size="15" fill="#4A2814">${names[i]}${showFr ? ` — ${a}/${b}` : ''}</text></g>`;
    a0 = a1;
  });
  return `<svg class="gfig" viewBox="0 0 340 184" width="340">${g}${leg}</svg>`;
}
reg('charts', 'c_pie', d => {
  /* без подписей долей (Орешек) — только половины, четверти и восьмые: их видно по рисунку */
  const parts = R.pick(d === 2 ? PIES.slice(0, 3) : PIES), names = R.shuffle(['Футбол', 'Плавание', 'Танцы', 'Шахматы']).slice(0, parts.length);
  const k = parts.reduce((m, [, b]) => lcm(m, b), 1), N = k * R.int(d === 1 ? 2 : 4, d === 1 ? 10 : 30), i = R.int(0, parts.length - 1), [a, b] = parts[i], v = N / b * a;
  const fig = pieSvg(parts, names, d === 1);
  if (d === 3) { const j = (i + 1) % parts.length, w = N / parts[j][1] * parts[j][0]; if (w === v) return null;
    return { q: `Опросили ${N} ${pl(N, 'пятиклассника', 'пятиклассников', 'пятиклассников')}, какой кружок они выбирают. На сколько больше выбрали «${v > w ? names[i] : names[j]}», чем «${v > w ? names[j] : names[i]}»?`, fig, type: 'num', answer: Math.abs(v - w), draft: true,
      hint: 'По рисунку определи, какую часть круга занимает каждый сектор, найди число учеников для каждого и вычти.', explain: [`${names[i]}: ${frH(a, b)} от ${N} = ${v}.`, `${names[j]}: ${frH(...parts[j])} от ${N} = ${w}.`, `${Math.max(v, w)} − ${Math.min(v, w)} = ${Math.abs(v - w)}.`] }; }
  return { q: `Опросили ${N} ${pl(N, 'пятиклассника', 'пятиклассников', 'пятиклассников')}, какой кружок они выбирают. Сколько человек выбрали «${names[i]}»?`, fig, type: 'num', answer: v,
    traps: [[a === 1 ? null : N / b, `Сектор занимает ${frH(a, b)} круга, а не ${frH(1, b)}.`]],
    hint: 'Определи, какую часть круга занимает сектор (половина, четверть, восьмая…), и найди эту часть от числа учеников.', explain: [`Сектор «${names[i]}» — ${frH(a, b)} круга.`, `${N} : ${b}${a > 1 ? ' · ' + a : ''} = ${v}.`] };
});
reg('charts', 'c_avg', d => {
  const n = d === 1 ? R.int(2, 3) : R.int(3, 5);
  if (d === 3) { const avg = R.int(10, 60), known = Array.from({ length: n - 1 }, () => R.int(Math.max(1, avg - 20), avg + 20)), last = avg * n - known.reduce((a, b) => a + b, 0); if (last <= 0) return null;
    return { q: `Среднее арифметическое ${n} чисел равно ${avg}. ${n - 1 === 1 ? 'Одно из них' : 'Известны ' + (n - 1) + ' из них'}: ${known.join(', ')}. Найди ${n - 1 === 1 ? 'второе' : 'последнее'} число.`, type: 'num', answer: last, draft: true,
      traps: [[avg, 'Среднее — не само число. Найди сумму всех чисел: среднее · количество.']], hint: 'Сумма всех чисел = среднее · количество. Вычти известные числа.',
      explain: [`Сумма всех: ${avg} · ${n} = ${avg * n}.`, `${avg * n} − ${known.join(' − ')} = ${last}.`] }; }
  let xs; do xs = Array.from({ length: n }, () => R.int(d === 1 ? 2 : 10, d === 1 ? 30 : 99)); while (xs.reduce((a, b) => a + b, 0) % n || new Set(xs).size < n);
  const s = xs.reduce((a, b) => a + b, 0), word = d === 2 && R.chance(0.5);
  return { q: word ? `За ${n} ${pl(n, 'день', 'дня', 'дней')} ${R.pick(NAMES5)} прочитала ${xs.join(', ')} страниц. Сколько страниц в среднем она читала в день?` : `Найди среднее арифметическое чисел: ${xs.join(', ')}.`, type: 'num', answer: s / n,
    traps: [[s, 'Это сумма. Её ещё нужно разделить на количество чисел.'], [s % (n - 1) ? null : s / (n - 1), `Делить нужно на количество чисел — на ${n}.`]],
    hint: 'Среднее арифметическое = сумма чисел : их количество.', explain: [`${xs.join(' + ')} = ${s}.`, `${s} : ${n} = ${s / n}.`] };
});
