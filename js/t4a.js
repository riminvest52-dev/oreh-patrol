/* 4 класс, часть 2: таблица (для Проверки сил и Задания дня), большие числа, «в столбик», умножение и деление, порядок действий.
   Программа — общепринятая для 4 класса (ФГОС, порядок тем «Школы России»), без Петерсон. */
'use strict';

const rnz = (a, b, bad) => { let x; do x = R.int(a, b); while (bad && bad(x)); return x; };
/* Число из len цифр, где примерно zp цифр — нули (первая цифра не 0) */
function numZ(len, zp = 0.3) {
  let s = String(R.int(1, 9));
  for (let i = 1; i < len; i++) s += R.chance(zp) ? '0' : R.int(1, 9);
  return +s;
}
const lenOf = n => String(n).length;

/* ---------- Число словами (именительный падеж) ---------- */
const NW1 = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const NW10 = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const NW100 = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
function words3(n, fem) {
  const out = [], h = Math.floor(n / 100), r = n % 100, one = k => fem && k === 1 ? 'одна' : fem && k === 2 ? 'две' : NW1[k];
  if (h) out.push(NW100[h]);
  if (r < 20) { if (r) out.push(one(r)); } else { out.push(NW10[Math.floor(r / 10)]); if (r % 10) out.push(one(r % 10)); }
  return out.join(' ');
}
function numWords(n) {
  if (!n) return 'ноль';
  const m = Math.floor(n / 1e6), t = Math.floor(n / 1000) % 1000, u = n % 1000, out = [];
  if (m) out.push(words3(m) + ' ' + pl(m, 'миллион', 'миллиона', 'миллионов'));
  if (t) out.push(words3(t, true) + ' ' + pl(t, 'тысяча', 'тысячи', 'тысяч'));
  if (u) out.push(words3(u));
  return out.join(' ');
}
/* Число, записанное «без нулей внутри класса» — типичная ошибка: 304 056 → 30 456 */
function noPad(n) {
  const m = Math.floor(n / 1e6), t = Math.floor(n / 1000) % 1000, u = n % 1000;
  return +((m ? String(m) : '') + (m || t ? String(t) : '') + String(u));
}

/* ---------- Беличья кладовая: таблица (для Проверки сил и Задания дня) ---------- */
reg('tab', 'm4_tab', d => {
  const pool = d === 1 ? [2, 3, 4, 5] : d === 2 ? MUL_NUMS : [6, 7, 8, 9];
  const a = R.pick(pool), b = R.pick(d === 1 ? MUL_NUMS : pool), p = a * b;
  return { q: `Вычисли: <span class="ex">${a} · ${b}</span>`, type: 'num', answer: p, hint: mulWay(a, b),
    explain: [mulWay(a, b), `${a} · ${b} = ${p}.`], traps: [[p + a, `Это ${a} · ${b + 1}. Пересчитай: ${mulWay(a, b)}`], [p - a, `Это ${a} · ${b - 1} — на одно ${a} меньше.`]] };
});
reg('tab', 'm4_tabdiv', d => {
  const pool = d === 1 ? [2, 3, 4, 5] : d === 2 ? MUL_NUMS : [6, 7, 8, 9];
  const a = R.pick(pool), b = R.pick(d === 1 ? MUL_NUMS : pool), c = a * b;
  return { q: `Вычисли: <span class="ex">${c} : ${a}</span>`, type: 'num', answer: b, hint: mulWayDiv(c, a),
    explain: [`Деление — обратное умножению: ${a} · ${b} = ${c}, значит, ${c} : ${a} = ${b}.`] };
});

/* ---------- Большие числа ---------- */
const bigLen = d => d === 1 ? R.int(4, 5) : d === 2 ? 6 : 7;
reg('big', 'b_read', d => {
  let n; do n = numZ(bigLen(d), 0.35); while (noPad(n) === n || !/0/.test(String(n)));
  const w = numWords(n);
  if (R.chance(0.5)) {
    return { q: `Запиши цифрами: «${w}»`, type: 'num', answer: n,
      hint: 'Раздели число на классы по три цифры: миллионы, тысячи, единицы. В каждом классе (кроме первого слева) ровно три цифры — пустые разряды заполняем нулями.',
      explain: [`Классы: ${fmt(n).split(/\s/).map((c, i, a) => `${['единиц', 'тысяч', 'миллионов'][a.length - 1 - i]} — ${c}`).join(', ')}.`, `Число: ${fmt(n)}.`],
      traps: [[noPad(n), 'В каждом классе три цифры: если десятков или сотен нет, пишем нули. Например, «пятьдесят шесть» в классе единиц — это 056.']] };
  }
  const swap = s => { const i = R.int(1, s.length - 2); return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2); };
  const ds = [noPad(n)]; for (let k = 0; k < 8 && ds.length < 5; k++) { const x = +swap(String(n)); if (x !== n && lenOf(x) === lenOf(n) && !ds.includes(x)) ds.push(x); }
  ds.push(n * 10, Math.floor(n / 10));
  const nums = [n, ...ds.filter(x => x !== n && x > 0)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  const options = R.shuffle(nums.map(numWords));
  return { q: `Как читается число <span class="ex">${fmt(n)}</span>?`, type: 'choice', options, answer: w,
    hint: 'Читай по классам слева направо: сначала миллионы, потом тысячи, потом единицы. Нули не читаются.',
    explain: [`${fmt(n)} — ${w}.`, 'Каждый класс читаем как трёхзначное число и добавляем название класса.'] };
});
reg('big', 'b_place', d => {
  const n = numZ(bigLen(d) + (d === 1 ? 1 : 0), 0.15), L = lenOf(n);
  if (R.chance(0.5)) {
    const k = R.int(1, L - 1), digit = dig(n, k);
    const traps = [];
    if (k > 0 && dig(n, k - 1) !== digit) traps.push([dig(n, k - 1), `Это цифра разряда ${PLACE[k - 1]}. Считай разряды справа: единицы, десятки, сотни, тысячи…`]);
    if (dig(n, L - 1 - k) !== digit) traps.push([dig(n, L - 1 - k), 'Разряды считаем справа налево, начиная с единиц.']);
    return { q: `Какая цифра стоит в разряде <b>${PLACE[k]}</b> в числе <span class="ex">${fmt(n)}</span>?`, type: 'num', answer: digit, traps,
      hint: 'Справа налево: единицы, десятки, сотни, тысячи, десятки тысяч, сотни тысяч, миллионы.',
      explain: [String(n).split('').map((c, i) => `${c} — ${PLACE[L - 1 - i]}`).join(', ') + '.', `В разряде ${PLACE[k]} стоит ${digit}.`] };
  }
  const opts = [[1, 'десятков', 10], [2, 'сотен', 100], [3, 'тысяч', 1000]].filter(x => x[0] < L - 1);
  const [k, name, m] = R.pick(opts), total = Math.floor(n / m), nameN = x => pl(x, ...{ 'десятков': ['десяток', 'десятка', 'десятков'], 'сотен': ['сотня', 'сотни', 'сотен'], 'тысяч': ['тысяча', 'тысячи', 'тысяч'] }[name]);
  return { q: `Сколько всего <b>${name}</b> в числе <span class="ex">${fmt(n)}</span>?`, type: 'num', answer: total,
    traps: [[dig(n, k), `${dig(n, k)} — это цифра в разряде ${name}. А всего ${name} — это число без последних ${k} ${pl(k, 'цифры', 'цифр', 'цифр')}: ${fmt(total)}.`]],
    hint: `Закрой последние ${k} ${pl(k, 'цифру', 'цифры', 'цифр')} — оставшееся число и есть количество ${name}.`,
    explain: [`В ${fmt(n)} всего ${fmt(total)} ${nameN(total)}: отбрасываем ${k} ${pl(k, 'последнюю цифру', 'последние цифры', 'последних цифр')}.`, `Проверка: ${fmt(total)} ${nameN(total)} = ${fmt(total * m)}${n % m ? `, и ещё остаток ${n % m}` : ''}.`] };
});
reg('big', 'b_sum', d => {
  const n = numZ(bigLen(d) - (d === 3 ? 1 : 0), 0.35), parts = String(n).split('').map((c, i, a) => +c * Math.pow(10, a.length - 1 - i)).filter(x => x);
  if (parts.length < 3) return null;
  const sumStr = ps => ps.map(fmt).join(' + ');
  if (R.chance(0.5)) {
    const wrongs = [
      parts.map((x, i) => i === parts.length - 2 ? x / 10 : x), parts.map((x, i) => i === 0 ? x / 10 : x), parts.map((x, i) => i === 1 ? x * 10 : x)
    ].filter(ps => ps.every(Number.isInteger) && ps.reduce((s, x) => s + x, 0) !== n);
    return { q: `Как записать число <span class="ex">${fmt(n)}</span> суммой разрядных слагаемых?`, type: 'choice', answer: sumStr(parts),
      options: R.shuffle([sumStr(parts), ...wrongs.map(sumStr)].filter((x, i, a) => a.indexOf(x) === i)).slice(0, 4).concat([]).sort(() => 0),
      hint: 'Каждая ненулевая цифра даёт слагаемое: цифра и столько нулей, сколько разрядов справа от неё.',
      explain: String(n).split('').map((c, i, a) => +c ? `${c} в разряде ${PLACE[a.length - 1 - i]} → ${fmt(+c * Math.pow(10, a.length - 1 - i))}` : null).filter(Boolean).concat([`${fmt(n)} = ${sumStr(parts)}.`]) };
  }
  return { q: `Какое число равно сумме <span class="ex">${sumStr(parts)}</span>?`, type: 'num', answer: n,
    traps: [[noPad(n), 'Пустые разряды заполняем нулями — иначе цифры встанут не в свои разряды.'], [+String(n).replace(/0/g, ''), 'Нули внутри числа терять нельзя: они держат пустые разряды.']],
    hint: 'Запиши каждое слагаемое на своём месте: тысячи под тысячами, сотни под сотнями. Где цифры нет — ноль.',
    explain: [`${sumStr(parts)} = ${fmt(n)}.`, 'Пустые разряды — нули.'] };
});
reg('big', 'b_cmp', d => {
  if (d === 3) {
    const L = R.int(5, 6), base = numZ(L, 0.3), digits = String(base).split('');
    const set = new Set([base]);
    for (let k = 0; k < 30 && set.size < 4; k++) { const s = R.shuffle(digits); if (s[0] !== '0') set.add(+s.join('')); }
    if (set.size < 4) return null;
    const nums = [...set], mx = Math.max(...nums);
    return { q: 'Какое число самое большое?', type: 'choice', options: R.shuffle(nums).map(fmt), answer: fmt(mx),
      hint: 'У всех чисел одинаково цифр — сравнивай поразрядно слева: у кого раньше встретится бо́льшая цифра, то и больше.',
      explain: [`Сравниваем слева направо по разрядам: ${nums.sort((x, y) => y - x).map(fmt).join(' > ')}.`, `Самое большое — ${fmt(mx)}.`] };
  }
  let a, b, left;
  if (d === 2 && R.chance(0.4)) {
    a = numZ(R.int(4, 6), 0.4);
    const parts = String(a).split('').map((c, i, s) => +c * Math.pow(10, s.length - 1 - i)).filter(x => x);
    b = R.chance(0.5) ? a : R.pick([a + R.pick([10, 100, 1000]), Math.max(1000, a - R.pick([10, 100]))]);
    left = parts.map(fmt).join(' + '); [a, b] = [b, a];   /* слева — сумма разрядных слагаемых (значение a после обмена — правая часть) */
    const sign = b === a ? '=' : b > a ? '>' : '<';
    return { q: `Сравни: <span class="ex">${left} ○ ${fmt(a)}</span>`, type: 'choice', options: ['<', '=', '>'], answer: sign, mono: true,
      hint: 'Сначала найди значение суммы — это число, записанное по разрядам. Потом сравни.',
      explain: [`${left} = ${fmt(b)}.`, `${fmt(b)} ${sign} ${fmt(a)}.`] };
  }
  const L = d === 1 ? R.int(4, 5) : 6;
  a = numZ(L, 0.3);
  const k = R.int(0, L - 2), s = String(a).split(''), i = L - 1 - k;
  let nd; do nd = R.int(0, 9); while (nd === +s[i]);
  s[i] = String(nd); b = +s.join('');
  if (d === 1 && R.chance(0.3)) b = numZ(L - 1, 0.3);
  const sign = a > b ? '>' : a < b ? '<' : '=';
  return { q: `Сравни: <span class="ex">${fmt(a)} ○ ${fmt(b)}</span>`, type: 'choice', options: ['<', '=', '>'], answer: sign, mono: true,
    hint: 'Больше то число, в котором больше цифр. Если цифр поровну — сравнивай разряды слева направо до первой разной цифры.',
    explain: lenOf(a) !== lenOf(b) ? [`В ${fmt(Math.max(a, b))} больше разрядов, значит, оно больше.`, `${fmt(a)} ${sign} ${fmt(b)}.`]
      : [`Разряды совпадают до разряда ${PLACE[k]}: там ${dig(a, k)} и ${dig(b, k)}.`, `${fmt(a)} ${sign} ${fmt(b)}.`] };
});
reg('big', 'b_x10', d => {
  const v = R.int(1, 4);
  if (v === 1) {   /* увеличить */
    const m = R.pick(d === 1 ? [10, 100] : [10, 100, 1000]), n = numZ(d === 1 ? 3 : 4, 0.3), z = lenOf(m) - 1;
    return { q: `Увеличь число <span class="ex">${fmt(n)}</span> в ${fmt(m)} раз.`, type: 'num', answer: n * m,
      traps: [[n * (m / 10 || 1), `Увеличить в ${fmt(m)} раз — приписать ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`], [n + m, `«Увеличить в ${fmt(m)} раз» — это умножить, а не прибавить ${fmt(m)}.`]],
      hint: `Увеличить в ${fmt(m)} раз — значит умножить на ${fmt(m)}: приписать справа ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`,
      explain: [`${fmt(n)} · ${fmt(m)} = ${fmt(n * m)}.`] };
  }
  if (v === 2) {   /* уменьшить */
    const m = R.pick(d === 1 ? [10, 100] : [10, 100, 1000]), base = numZ(d === 1 ? 2 : 3, 0.2), n = base * m, z = lenOf(m) - 1;
    return { q: `Уменьши число <span class="ex">${fmt(n)}</span> в ${fmt(m)} раз.`, type: 'num', answer: base,
      traps: [[n - m, `«Уменьшить в ${fmt(m)} раз» — это разделить, а не вычесть ${fmt(m)}.`], [m > 10 ? n / (m / 10) : n / 100, `Уменьшить в ${fmt(m)} раз — отбросить ${z} ${pl(z, 'ноль', 'нуля', 'нулей')} справа.`]],
      hint: `Уменьшить в ${fmt(m)} раз — разделить на ${fmt(m)}: отбросить справа ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`,
      explain: [`${fmt(n)} : ${fmt(m)} = ${fmt(base)}.`] };
  }
  /* следующее / предыдущее */
  const round = R.pick(d === 1 ? [1000, 10000] : d === 2 ? [10000, 100000] : [100000, 1000000]) * R.int(1, 9);
  if (v === 3) {
    const n = round - 1;
    return { q: `Какое число следует за числом <span class="ex">${fmt(n)}</span>?`, type: 'num', answer: round,
      hint: 'Следующее число на 1 больше. Девятки при прибавлении 1 превращаются в нули, а единица переходит в следующий разряд.',
      explain: [`${fmt(n)} + 1 = ${fmt(round)}.`] };
  }
  return { q: `Какое число стоит перед числом <span class="ex">${fmt(round)}</span>?`, type: 'num', answer: round - 1,
    traps: [[round - 10, 'Предыдущее число на 1 меньше, а не на 10.']],
    hint: 'Предыдущее число на 1 меньше. Когда вычитаем 1 из числа с нулями на конце, нули становятся девятками.',
    explain: [`${fmt(round)} − 1 = ${fmt(round - 1)}.`] };
});

/* ---------- Мост «в столбик»: сложение и вычитание многозначных ---------- */
const hasCarry = (a, b) => { for (let k = 0; k < 7; k++) if (dig(a, k) + dig(b, k) >= 10) return true; return false; };
const hasBorrow = (a, b) => { for (let k = 0; k < 7; k++) if (dig(a, k) < dig(b, k)) return true; return false; };
const noCarrySum = (a, b) => { let s = 0; for (let k = 0; k < 7; k++) s += ((dig(a, k) + dig(b, k)) % 10) * Math.pow(10, k); return s; };
const absDiff = (a, b) => { let s = 0; for (let k = 0; k < 7; k++) s += Math.abs(dig(a, k) - dig(b, k)) * Math.pow(10, k); return s; };
reg('colb', 'c_add', d => {
  const la = d === 1 ? 4 : d === 2 ? 5 : 6;
  let a, b; do { a = numZ(la, 0.15); b = numZ(R.int(la - 1, la), 0.15); } while (!hasCarry(a, b) || a + b >= Math.pow(10, 7));
  return colTask('add', a, b, { traps: [[noCarrySum(a, b), 'Похоже, забыт перенос: если в разряде получилось 10 и больше, 1 переносится в следующий разряд.']] });
});
reg('colb', 'c_sub', d => {
  let a, b;
  if (d === 3) {   /* вычитание из числа с нулями: 40 003 − 2 785 */
    do { const L = R.int(4, 5); a = R.int(1, 9) * Math.pow(10, L - 1) + (R.chance(0.5) ? R.int(1, 9) : R.int(1, 9) * 10 + R.int(0, 9) * (R.chance(0.5) ? 0 : 1)); b = numZ(L - 1, 0.1); } while (a <= b || !hasBorrow(a, b));
  } else {
    const la = d === 1 ? 4 : 5;
    do { a = numZ(la, 0.2); b = numZ(R.int(la - 1, la), 0.15); } while (a <= b || !hasBorrow(a, b));
  }
  return colTask('sub', a, b, { traps: [[absDiff(a, b), 'Похоже, из меньшей цифры вычли большую «наоборот». Если сверху цифра меньше — займи 1 у соседнего разряда.']] });
});
reg('colb', 'c_word', d => {
  const big = () => d === 1 ? R.int(1200, 9800) : d === 2 ? R.int(12000, 98000) : R.int(120000, 980000);
  const v = R.int(1, 4);
  if (v === 1) {
    const A = big(), B = Math.round(big() / R.int(2, 4)), C = R.int(Math.round((A + B) / 4), Math.round((A + B) * 0.8));
    return { q: `На складе было ${fmt(A)} кг крупы. Привезли ещё ${fmt(B)} кг, а потом отправили в магазины ${fmt(C)} кг. Сколько килограммов крупы стало на складе?`, type: 'num', answer: A + B - C, draft: true,
      traps: [[A - B - C > 0 ? A - B - C : null, 'Привезли — значит, крупы стало больше: эти килограммы прибавляем.'], [A + B, 'Это сколько было после привоза. Потом ещё отправили — вычти.']],
      hint: 'Сначала узнай, сколько стало после привоза, потом вычти то, что отправили.',
      explain: [`1) ${fmt(A)} + ${fmt(B)} = ${fmt(A + B)} (кг) — стало после привоза.`, `2) ${fmt(A + B)} − ${fmt(C)} = ${fmt(A + B - C)} (кг) — осталось.`, `Ответ: ${fmt(A + B - C)} кг.`] };
  }
  if (v === 2) {
    const A = big(), B = Math.round(A / R.int(3, 8));
    return { q: `В первый день по мосту проехало ${fmt(A)} машин, а во второй — на ${fmt(B)} больше. Сколько машин проехало по мосту за два дня?`, type: 'num', answer: A + A + B, draft: true,
      traps: [[A + B, `${fmt(A + B)} — это только второй день. Спрашивают про два дня вместе.`]],
      hint: 'Сначала узнай, сколько машин было во второй день, потом сложи оба дня.',
      explain: [`1) ${fmt(A)} + ${fmt(B)} = ${fmt(A + B)} (м.) — во второй день.`, `2) ${fmt(A)} + ${fmt(A + B)} = ${fmt(2 * A + B)} (м.) — за два дня.`, `Ответ: ${fmt(2 * A + B)} ${pl(2 * A + B, 'машина', 'машины', 'машин')}.`] };
  }
  if (v === 3) {
    const A = big(), B = Math.round(A / R.int(3, 8));
    return { q: `В городе ${fmt(A)} жителей, а в соседнем посёлке — на ${fmt(B)} меньше. Сколько жителей в городе и посёлке вместе?`, type: 'num', answer: A + A - B, draft: true,
      traps: [[A - B, `${fmt(A - B)} — это только посёлок. Спрашивают, сколько вместе.`], [A + A + B, '«На … меньше» — значит, вычитаем.']],
      hint: 'Сначала найди, сколько жителей в посёлке («на … меньше» — вычитание), потом сложи.',
      explain: [`1) ${fmt(A)} − ${fmt(B)} = ${fmt(A - B)} (ж.) — в посёлке.`, `2) ${fmt(A)} + ${fmt(A - B)} = ${fmt(2 * A - B)} (ж.) — вместе.`, `Ответ: ${fmt(2 * A - B)} ${pl(2 * A - B, 'житель', 'жителя', 'жителей')}.`] };
  }
  const total = R.pick(d === 1 ? [10000, 20000] : d === 2 ? [50000, 80000, 100000] : [300000, 500000]);
  const A = Math.round(total * R.int(25, 45) / 100 / 10) * 10 + R.int(1, 9) * 10, B = Math.round(total * R.int(15, 35) / 100 / 10) * 10 + R.int(1, 9);
  return { q: `У семьи было ${fmt(total)} рублей. Холодильник стоил ${fmt(A)} р., а плита — ${fmt(B)} р. Сколько рублей осталось после покупки?`, type: 'num', answer: total - A - B, draft: true,
    traps: [[A + B, `${fmt(A + B)} р. — это сколько потратили. А спрашивают, сколько осталось.`]],
    hint: 'Узнай, сколько потратили, и вычти это из того, что было.',
    explain: [`1) ${fmt(A)} + ${fmt(B)} = ${fmt(A + B)} (р.) — потратили.`, `2) ${fmt(total)} − ${fmt(A + B)} = ${fmt(total - A - B)} (р.) — осталось.`, `Ответ: ${fmt(total - A - B)} р.`] };
});

/* ---------- Мельница умножения и деления ---------- */
const noCarryMul = (a, b) => { let s = 0; for (let k = 0; k < 7; k++) s += ((dig(a, k) * b) % 10) * Math.pow(10, k); return s; };
const noZeroDigits = n => +String(n).replace(/0/g, () => String(R.int(1, 9)));
reg('mill', 'm_mul1', d => {
  const a = d === 1 ? R.int(102, 989) : d === 2 ? numZ(4, 0.2) : numZ(5, 0.35), b = R.int(3, 9);
  return colTask('mul', a, b, { traps: [[noCarryMul(a, b), 'Похоже, забыли прибавить то, что запомнили из предыдущего разряда.']] });
});
reg('mill', 'm_mul2', d => {
  const a = d === 1 ? R.int(23, 98) : d === 2 ? R.int(102, 899) : R.int(102, 699);
  const b = noZeroDigits(d === 3 ? R.int(102, 389) : R.int(12, 98));
  const bd = String(b).split('').reverse().map(Number), flat = bd.reduce((s, x) => s + a * x, 0);
  return colTask('mul', a, b, { traps: [[flat, 'Неполные произведения сложены без сдвига. Второе пишется на одну клетку левее, третье — на две.']] });
});
reg('mill', 'm_div1', d => {
  const b = R.int(d === 1 ? 2 : 3, 9);
  let q;
  if (d === 1) q = R.int(12, 99) + (R.chance(0.3) ? 0 : R.int(1, 9) * 100) * (R.chance(0.5) ? 1 : 0);
  else if (d === 2) q = R.pick([R.int(1, 9) * 100 + R.int(1, 9), R.int(1, 9) * 1000 + R.int(1, 9) * 10 + R.int(1, 9), R.int(1, 9) * 1000 + R.int(1, 9) * 100 + R.int(1, 9)]);
  else q = R.pick([R.int(1, 9) * 10000 + R.int(1, 9) * 100 + R.int(1, 9), R.int(1, 9) * 1000 + R.int(1, 9) * 10, R.int(1, 9) * 10000 + R.int(1, 9) * 10 + R.int(0, 9)]);
  if (q < 10) q += 20;
  const a = q * b, lost = +String(q).replace(/0/g, '');
  return colTask('div', a, b, { traps: [[lost, 'Потерялся ноль в частном: если неполное делимое меньше делителя, в частное пишем 0.']] });
});
reg('mill', 'm_div2', d => {
  const b = R.int(12, d === 1 ? 35 : 68);
  const q = d === 1 ? R.int(12, 49) : d === 2 ? R.int(1, 9) * 100 + R.int(1, 9) : R.pick([R.int(1, 9) * 100 + R.int(1, 9) * 10, R.int(1, 9) * 1000 + R.int(1, 9) * 10 + R.int(1, 9), R.int(1, 9) * 100 + R.int(1, 9)]);
  const a = q * b, lost = +String(q).replace(/0/g, '');
  return colTask('div', a, b, { traps: [[lost, 'Потерялся ноль в частном: число меньше делителя — в частное 0.']] });
});
reg('mill', 'm_round', d => {
  const v = R.int(1, 2);
  if (d === 1) {
    const m = R.pick([10, 100, 1000]), z = lenOf(m) - 1;
    if (v === 1) { const a = R.int(12, 990); return { q: `Вычисли: <span class="ex">${fmt(a)} · ${fmt(m)}</span>`, type: 'num', answer: a * m,
      traps: [[a * m * 10, `Лишний ноль: при умножении на ${fmt(m)} приписываем ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`], [m > 10 ? a * m / 10 : null, `Умножить на ${fmt(m)} — приписать ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`]],
      hint: `Умножить на ${fmt(m)} — приписать справа ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`, explain: [`${fmt(a)} · ${fmt(m)} = ${fmt(a * m)}.`] }; }
    const q = R.int(3, 990); return { q: `Вычисли: <span class="ex">${fmt(q * m)} : ${fmt(m)}</span>`, type: 'num', answer: q,
      traps: [[m > 10 ? q * 10 : null, `Разделить на ${fmt(m)} — отбросить ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`]],
      hint: `Разделить на ${fmt(m)} — отбросить справа ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`, explain: [`${fmt(q * m)} : ${fmt(m)} = ${fmt(q)}.`] };
  }
  /* на круглые: ×30, ×400, :20, :300 */
  const k = R.int(2, 9), z = d === 2 ? 1 : R.int(1, 2), m = k * Math.pow(10, z);
  if (v === 1) {
    const a = d === 2 ? R.int(12, 98) * (R.chance(0.3) ? 10 : 1) : R.int(12, 250);
    return { q: `Вычисли: <span class="ex">${fmt(a)} · ${fmt(m)}</span>`, type: 'num', answer: a * m,
      traps: [[a * k, `Не забудь ${z === 1 ? 'ноль' : 'нули'} множителя ${fmt(m)}: умножь на ${k} и припиши ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`], [a * m * 10, 'Лишний ноль: считай нули множителя внимательно.']],
      hint: `${fmt(m)} = ${k} · ${fmt(Math.pow(10, z))}. Умножь на ${k}, потом припиши ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`,
      explain: [`${fmt(a)} · ${k} = ${fmt(a * k)}.`, `Приписываем ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}: ${fmt(a)} · ${fmt(m)} = ${fmt(a * m)}.`] };
  }
  const q = d === 2 ? R.int(4, 98) : R.int(12, 99), a = q * m;
  return { q: `Вычисли: <span class="ex">${fmt(a)} : ${fmt(m)}</span>`, type: 'num', answer: q,
    traps: [[q * Math.pow(10, z), `Разделили только на ${k}. Ещё нужно разделить на ${fmt(Math.pow(10, z))} — отбросить ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}.`]],
    hint: `Раздели на ${fmt(Math.pow(10, z))} (отбрось ${z} ${pl(z, 'ноль', 'нуля', 'нулей')}), потом на ${k}.`,
    explain: [`${fmt(a)} : ${fmt(Math.pow(10, z))} = ${fmt(a / Math.pow(10, z))}.`, `${fmt(a / Math.pow(10, z))} : ${k} = ${fmt(q)}.`, `Проверка: ${fmt(q)} · ${fmt(m)} = ${fmt(a)} ✓`] };
});
reg('mill', 'm_rem', d => {
  const b = d === 3 ? R.int(12, 25) : R.int(3, 9), q = d === 1 ? R.int(3, 9) : d === 2 ? R.int(12, 99) : R.int(12, 60), r = R.int(1, b - 1), a = q * b + r;
  const show = (x, y) => `${fmt(x)} (ост. ${y})`;
  const opts = [show(q, r)];
  if (r + b < 100 && q > 1) opts.push(show(q - 1, r + b));
  opts.push(show(q + 1, Math.abs(b - r)));
  if (r > 1) opts.push(show(q, r - 1)); else opts.push(show(q, r + 1));
  opts.push(show(q - 1 > 0 ? q - 1 : q + 2, r));
  const options = R.shuffle(opts.filter((x, i, a2) => a2.indexOf(x) === i)).slice(0, 4);
  if (!options.includes(show(q, r))) options[0] = show(q, r);
  return { q: `Раздели с остатком: <span class="ex">${fmt(a)} : ${b}</span>`, type: 'choice', options: R.shuffle(options), answer: show(q, r), draft: d >= 2,
    traps: [[show(q - 1, r + b), `Остаток ${r + b} больше делителя ${b} — значит, ${b} помещается ещё раз. Остаток всегда меньше делителя.`]],
    hint: `Найди наибольшее число, которое делится на ${b} и не больше ${fmt(a)}. Остаток должен быть меньше ${b}.`,
    explain: [`${fmt(q * b)} — наибольшее число, не больше ${fmt(a)}, которое делится на ${b}: ${fmt(q * b)} : ${b} = ${fmt(q)}.`, `Остаток: ${fmt(a)} − ${fmt(q * b)} = ${r}, и ${r} < ${b} ✓`, `Проверка: ${fmt(q)} · ${b} + ${r} = ${fmt(a)} ✓`] };
});

/* ---------- Порядок действий ---------- */
const OPW = { '+': 'сложение', '-': 'вычитание', '*': 'умножение', ':': 'деление' };
function expr4(d) {
  const k = d === 1 ? 3 : d === 2 ? 4 : 5;
  for (let t = 0; t < 40; t++) {
    const e = buildExpr(R.int(d === 1 ? 20 : 30, d === 1 ? 300 : 900), k, { ops: ['+', '-', '*', ':'], max: d === 3 ? 20000 : 5000, mulMax: 9, divMax: 9, subMax: d === 1 ? 90 : 400 });
    const s = toStr(e), r = schoolSteps(s);
    if (opCount(e) !== k || !r.ok || r.value !== val(e)) continue;
    const ops = new Set((s.match(/[+−·:]/g) || []));
    if (ops.size < 2) continue;
    if (d >= 2 && !/\(/.test(s) && R.chance(0.6)) continue;   /* на 2–3 ступени чаще со скобками */
    return { e, s, r };
  }
  return null;
}
reg('ord4', 'o4_value', d => {
  const x = expr4(d); if (!x) return null;
  const lr = leftToRight(x.s);
  return { q: `Найди значение выражения:<div class="ex big">${x.s}</div>`, type: 'num', answer: x.r.value, draft: true,
    traps: [[Number.isInteger(lr) && lr >= 0 ? lr : null, LEFT_RIGHT_TRAP]],
    hint: 'Порядок: 1) действия в скобках; 2) умножение и деление слева направо; 3) сложение и вычитание слева направо. Пронумеруй действия над знаками.',
    explain: x.r.steps.map((st, i) => `${i + 1}) ${st}`).concat([`Ответ: ${fmt(x.r.value)}.`]) };
});
reg('ord4', 'o4_order', d => {
  const x = expr4(d); if (!x) return null;
  const askLast = R.chance(0.5);
  /* «Первым» спрашиваем, только когда ответ один: не больше одной пары скобок */
  if (!askLast && (x.s.match(/\(/g) || []).length > 1) return null;
  const firstOp = (x.r.steps[0].match(/ ([+−·:]) /) || [])[1], lastOp = x.e.op;
  const symToOp = { '+': '+', '−': '-', '·': '*', ':': ':' };
  const ans = askLast ? OPW[lastOp] : OPW[symToOp[firstOp]];
  return { q: `Какое действие выполняется <b>${askLast ? 'последним' : 'первым'}</b>?<div class="ex big">${x.s}</div>`, type: 'choice',
    options: ['сложение', 'вычитание', 'умножение', 'деление'], answer: ans, cols2: true,
    hint: 'Сначала скобки, потом умножение и деление, потом сложение и вычитание. Действия одной ступени — слева направо.',
    explain: x.r.steps.map((st, i) => `${i + 1}) ${st}`).concat([`${askLast ? 'Последнее' : 'Первое'} действие — ${ans}.`]) };
});
/* Все расстановки скобок для a ○ b ○ c ○ d — как пишут в школе: только нужные скобки */
function bracketings(n, o) {
  const P = { '+': 1, '-': 1, '*': 2, ':': 2 };
  const f = (i, j) => {
    if (i === j) return [{ s: fmt(n[i]) }];
    const out = [];
    for (let k = i; k < j; k++) for (const L of f(i, k)) for (const Rr of f(k + 1, j)) {
      const op = o[k], lp = L.op && P[L.op] < P[op], rp = Rr.op && (P[Rr.op] < P[op] || (P[Rr.op] === P[op] && (op === '-' || op === ':')));
      out.push({ s: `${lp ? '(' + L.s + ')' : L.s} ${SYM[op]} ${rp ? '(' + Rr.s + ')' : Rr.s}`, op });
    }
    return out;
  };
  return [...new Set(f(0, n.length - 1).map(x => x.s))].filter(x => /\(/.test(x));
}
reg('ord4', 'o4_brackets', d => {
  const cnt = 4;
  for (let t = 0; t < 60; t++) {
    const n = Array.from({ length: cnt }, () => R.int(2, d === 1 ? 20 : d === 2 ? 40 : 60)), o = Array.from({ length: cnt - 1 }, () => R.pick(['+', '-', '*', ':']));
    if (new Set(o).size < 2) continue;
    const plain = n.map((x, i) => (i ? SYM[o[i - 1]] + ' ' : '') + fmt(x)).join(' '), pv = schoolSteps(plain);
    const vars = [...new Set(bracketings(n, o))]
      .map(s => ({ s, r: schoolSteps(s) })).filter(x => x.r.ok && Number.isInteger(x.r.value) && x.r.value >= 0 && x.r.max <= 5000);
    const byVal = {}; vars.forEach(x => { (byVal[x.r.value] = byVal[x.r.value] || []).push(x); });
    const uniq = Object.values(byVal).filter(g => g.length === 1).map(g => g[0]).filter(x => /\(/.test(x.s) && (!pv.ok || x.r.value !== pv.value));
    if (!uniq.length) continue;
    const ans = R.pick(uniq), others = vars.filter(x => x.r.value !== ans.r.value && x.s !== ans.s);
    if (others.length < 2) continue;
    const opts = R.shuffle([ans.s, ...R.sample(others.map(x => x.s).filter((s, i, a) => a.indexOf(s) === i), 3)]);
    return { q: `Где поставить скобки, чтобы значение выражения было равно <b>${fmt(ans.r.value)}</b>?<div class="ex">${plain}</div>`, type: 'choice', options: opts, answer: ans.s, mono: true, draft: true,
      hint: 'Посчитай каждый вариант по порядку действий: сначала скобки. Подходит тот, где получается нужное число.',
      explain: ans.r.steps.map((st, i) => `${i + 1}) ${st}`).concat([`${ans.s} = ${fmt(ans.r.value)}.`]) };
  }
  return null;
});
reg('ord4', 'o4_lr', d => {
  for (let t = 0; t < 50; t++) {
    let s, wrong;
    if (R.chance(0.5)) {   /* a : b · c */
      const b = R.int(2, 9), c = R.int(2, d === 1 ? 5 : 9), q = R.int(2, d === 1 ? 12 : 40), a = q * b;
      if (a % (b * c) !== 0 && false) continue;
      s = `${fmt(a)} : ${b} · ${c}`; wrong = Number.isInteger(a / (b * c)) ? a / (b * c) : null;
    } else {   /* a − b + c */
      const a = R.int(d === 1 ? 30 : 200, d === 1 ? 99 : 900), b = R.int(10, a - 5), c = R.int(5, b - 1);
      s = `${fmt(a)} − ${fmt(b)} + ${fmt(c)}`; wrong = a - (b + c);
    }
    if (d === 3) s = `${s} ${R.pick(['+', '−'])} ${R.int(2, 9)} · ${R.int(2, 9)}`;
    const r = schoolSteps(s); if (!r.ok) continue;
    return { q: `Найди значение выражения:<div class="ex big">${s}</div>`, type: 'num', answer: r.value,
      traps: [[wrong !== null && wrong >= 0 && d < 3 ? wrong : null, 'Действия одной ступени (умножение и деление или сложение и вычитание) выполняют по порядку слева направо.']],
      hint: 'Умножение и деление — одна ступень, сложение и вычитание — другая. Внутри одной ступени — строго слева направо.',
      explain: r.steps.map((st, i) => `${i + 1}) ${st}`).concat([`Ответ: ${fmt(r.value)}.`]) };
  }
  return null;
});
