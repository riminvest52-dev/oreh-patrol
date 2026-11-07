/* Фундамент (Старый дуб): деление с нулём, умножение, величины, периметр/площадь, «на сколько / во сколько» */
'use strict';

reg('fund', 'f_div0', d => {
  let q, b;
  if (d === 1) { q = R.int(1, 9) * 100 + R.int(1, 9); b = R.int(2, 9); }
  else if (d === 2) {
    if (R.chance(0.5)) { q = R.int(1, 9) * 1000 + R.int(1, 9) * 100 + R.int(1, 9); b = R.int(3, 9); }
    else { q = R.int(1, 9) * 100 + R.int(1, 9); b = R.int(12, 25); }
  } else {
    q = R.pick([R.int(1, 9) * 1000 + R.int(1, 9) * 10, R.int(1, 9) * 1000 + R.int(1, 9) * 100 + R.int(1, 9) * 10, R.int(1, 9) * 1000 + R.int(1, 9)]);
    b = R.int(12, 48);
  }
  const a = q * b;
  const lost = +String(q).replace(/0/g, '');
  return {
    q: `Вычисли: <span class="ex">${fmt(a)} : ${b}</span>`, type: 'num', answer: q,
    hint: 'Дели уголком. Если очередное число меньше делителя — в частном пишем 0, и только потом сносим следующую цифру.',
    explain: longDivSteps(a, b).concat([`Частая ошибка — потерять ноль и получить ${fmt(lost)}. Проверка: ${fmt(q)} · ${b} = ${fmt(a)} ✓`])
  };
});

reg('fund', 'f_mul', d => {
  let a, b;
  if (d === 1) { a = R.int(23, 489); b = R.int(3, 9); }
  else if (d === 2) { a = R.int(25, 380); b = R.int(12, 48); }
  else { a = R.pick([R.int(1, 9) * 100 + R.int(1, 9), R.int(1, 9) * 1000 + R.int(1, 9) * 10 + R.int(1, 9)]); b = R.int(2, 9) * 10 + R.pick([0, 0, R.int(1, 9)]); }
  const p = a * b;
  const explain = [];
  if (b < 10) {
    const parts = String(a).split('').map((c, i, arr) => +c * Math.pow(10, arr.length - 1 - i)).filter(x => x);
    explain.push(`Разложим ${fmt(a)} по разрядам: ${parts.map(fmt).join(' + ')}.`);
    explain.push(parts.map(x => `${fmt(x)} · ${b} = ${fmt(x * b)}`).join('; ') + '.');
    explain.push(`Складываем: ${parts.map(x => fmt(x * b)).join(' + ')} = ${fmt(p)}.`);
  } else {
    const t = Math.floor(b / 10) * 10, u = b % 10;
    if (u) {
      explain.push(`${b} = ${t} + ${u}. Умножаем по частям:`);
      explain.push(`${fmt(a)} · ${t} = ${fmt(a * t)}; ${fmt(a)} · ${u} = ${fmt(a * u)}.`);
      explain.push(`${fmt(a * t)} + ${fmt(a * u)} = ${fmt(p)}.`);
    } else {
      explain.push(`Сначала умножим на ${t / 10}: ${fmt(a)} · ${t / 10} = ${fmt(a * t / 10)}.`);
      explain.push(`Ноль на конце множителя приписываем к ответу: ${fmt(a)} · ${t} = ${fmt(p)}.`);
    }
  }
  return { q: `Вычисли: <span class="ex">${fmt(a)} · ${b}</span>`, type: 'num', answer: p,
    hint: b < 10 ? 'Умножай по разрядам: сотни, десятки, единицы.' : `Представь ${b} как сумму десятков и единиц.`, explain };
});

const UNITS = [
  { big: 'км', small: 'м', k: 1000, kind: 'длина' }, { big: 'м', small: 'см', k: 100, kind: 'длина' },
  { big: 'м', small: 'дм', k: 10, kind: 'длина' }, { big: 'дм', small: 'см', k: 10, kind: 'длина' },
  { big: 'см', small: 'мм', k: 10, kind: 'длина' }, { big: 'м', small: 'мм', k: 1000, kind: 'длина' },
  { big: 'т', small: 'кг', k: 1000, kind: 'масса' }, { big: 'кг', small: 'г', k: 1000, kind: 'масса' },
  { big: 'ц', small: 'кг', k: 100, kind: 'масса' }, { big: 'т', small: 'ц', k: 10, kind: 'масса' },
  { big: 'ч', small: 'мин', k: 60, kind: 'время' }, { big: 'мин', small: 'с', k: 60, kind: 'время' },
  { big: 'сут', small: 'ч', k: 24, kind: 'время' }
];
reg('fund', 'f_units', d => {
  if (d === 1) {
    const u = R.pick(UNITS); const x = R.int(2, 9);
    const rem = u.k >= 100 ? R.int(Math.ceil(u.k / 10), u.k - 1) : R.int(1, u.k - 1);
    const withRem = R.chance(0.6);
    const ans = x * u.k + (withRem ? rem : 0);
    return { q: `Сколько это в «${u.small}»?<br><span class="ex">${x} ${u.big}${withRem ? ' ' + rem + ' ' + u.small : ''} = ? ${u.small}</span>`,
      type: 'num', answer: ans, hint: `Вспомни: 1 ${u.big} = ${u.k} ${u.small}.`,
      explain: [`1 ${u.big} = ${u.k} ${u.small}`, `${x} ${u.big} = ${x} · ${u.k} = ${fmt(x * u.k)} ${u.small}`].concat(withRem ? [`${fmt(x * u.k)} + ${rem} = ${fmt(ans)} ${u.small}`] : []) };
  }
  if (d === 2) {
    const u = R.pick(UNITS.filter(u => u.k >= 60));
    const x = R.int(2, 12);
    const rem = u.k === 60 || u.k === 24 ? R.int(1, u.k - 1) : (u.k === 1000 ? R.pick([R.int(1, 9), R.int(10, 99)]) : R.int(1, 9));
    const ans = x * u.k + rem;
    const naive = +(String(x) + String(rem));
    return { q: `Сколько это в «${u.small}»?<br><span class="ex">${x} ${u.big} ${rem} ${u.small} = ? ${u.small}</span>`,
      type: 'num', answer: ans, hint: `1 ${u.big} = ${u.k} ${u.small}. Сначала переведи ${x} ${u.big}, потом прибавь ${rem} ${u.small}.`,
      explain: [`1 ${u.big} = ${u.k} ${u.small}, значит ${x} ${u.big} = ${fmt(x * u.k)} ${u.small}.`, `${fmt(x * u.k)} + ${rem} = ${fmt(ans)} ${u.small}.`,
        `Ловушка: нельзя просто «приписать» числа — ${x} и ${rem} не дают ${fmt(naive)}.`] };
  }
  const u = R.pick(UNITS.filter(u => u.k >= 60));
  const x = R.int(2, 12);
  const rem = u.k === 1000 ? R.pick([R.int(1, 9) * 10, R.int(1, 9)]) : u.k === 100 ? R.int(1, 9) : R.int(5, u.k - 1);
  const total = x * u.k + rem;
  const s = (a, b) => `${a} ${u.big} ${b} ${u.small}`;
  const right = s(x, rem);
  const dis = [s(Math.floor(total / 100), total % 100), s(x * 10, rem), s(x, rem * 10), s(x + 1, rem), s(Math.floor(total / 10), total % 10), s(x, rem + 1)];
  return { q: `Выбери верную запись:<br><span class="ex">${fmt(total)} ${u.small} = ?</span>`, type: 'choice',
    options: choices(right, dis), answer: right, hint: `В 1 ${u.big} — ${u.k} ${u.small}. Сколько целых ${u.big} помещается в ${fmt(total)} ${u.small}?`,
    explain: [`1 ${u.big} = ${u.k} ${u.small}.`, `${fmt(total)} : ${u.k} = ${x} (ост. ${rem}).`, `Значит, ${fmt(total)} ${u.small} = ${right}.`] };
});

function rectSvg(a, b, la, lb) {
  const W = 240, H = 130, k = Math.min(150 / a, 80 / b, 12), w = Math.max(60, a * k), h = Math.max(34, b * k);
  const x = (W - w) / 2 - 18, y = (H - h) / 2 + 8;
  return `<svg class="fig" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#FFE2B0" stroke="#8A5228" stroke-width="3"/>` +
    `<text x="${W / 2}" y="${y - 6}" text-anchor="middle" class="figt">${la}</text>` +
    `<text x="${x + w + 8}" y="${y + h / 2 + 6}" class="figt">${lb}</text></svg>`;
}
reg('fund', 'f_geom', d => {
  const pr = 'Периметр — длина «забора» вокруг фигуры: P = (a + b) · 2. Площадь — сколько квадратиков 1×1 помещается внутри: S = a · b.';
  if (d === 1) {
    const a = R.int(3, 14), b = R.int(2, a - 1);
    if (R.chance(0.5)) return { q: `Найди <b>периметр</b> прямоугольника со сторонами ${a} см и ${b} см (в см).`, fig: rectSvg(a, b, a + ' см', b + ' см'),
      type: 'num', answer: 2 * (a + b), hint: 'Периметр — сумма длин всех четырёх сторон.', explain: [pr, `P = (${a} + ${b}) · 2 = ${2 * (a + b)} см.`, `Не путай с площадью: ${a} · ${b} = ${a * b} — это площадь.`] };
    return { q: `Найди <b>площадь</b> прямоугольника со сторонами ${a} см и ${b} см (в см²).`, fig: rectSvg(a, b, a + ' см', b + ' см'),
      type: 'num', answer: a * b, hint: 'Площадь прямоугольника = длина · ширина.', explain: [pr, `S = ${a} · ${b} = ${a * b} см².`] };
  }
  if (d === 2) {
    const a = R.int(4, 15), b = R.int(2, 12);
    if (R.chance(0.5)) return { q: `Площадь прямоугольника ${a * b} см², одна сторона ${a} см. Найди другую сторону (в см).`, fig: rectSvg(a, b, a + ' см', '?'),
      type: 'num', answer: b, hint: 'S = a · b, значит b = S : a.', explain: [pr, `b = S : a = ${a * b} : ${a} = ${b} см.`] };
    return { q: `Периметр прямоугольника ${2 * (a + b)} см, одна сторона ${a} см. Найди другую сторону (в см).`, fig: rectSvg(a, b, a + ' см', '?'),
      type: 'num', answer: b, hint: 'Сначала найди сумму двух соседних сторон: P : 2.', explain: [pr, `a + b = P : 2 = ${2 * (a + b)} : 2 = ${a + b} см.`, `b = ${a + b} − ${a} = ${b} см.`] };
  }
  const v = R.int(1, 3);
  if (v === 1) { const s = R.int(3, 12); return { q: `Площадь квадрата ${s * s} см². Найди его периметр (в см).`, type: 'num', answer: 4 * s,
    hint: 'Какое число, умноженное само на себя, даёт площадь?', explain: [`${s} · ${s} = ${s * s}, значит сторона квадрата ${s} см.`, `P = ${s} · 4 = ${4 * s} см.`] }; }
  if (v === 2) { const b = R.int(2, 9), k = R.int(2, 5), a = b * k; return { q: `Длина прямоугольника ${a} см, а ширина в ${k} раза меньше. Найди площадь (в см²).`, fig: rectSvg(a, b, a + ' см', '?'),
    type: 'num', answer: a * b, hint: `Сначала найди ширину: ${a} : ${k}.`, explain: [`Ширина: ${a} : ${k} = ${b} см.`, `S = ${a} · ${b} = ${a * b} см².`] }; }
  const a = R.int(6, 15), b = R.int(2, a - 1);
  return { q: `Периметр прямоугольника ${2 * (a + b)} см, длина ${a} см. Найди его площадь (в см²).`, fig: rectSvg(a, b, a + ' см', '?'),
    type: 'num', answer: a * b, hint: 'Сначала найди ширину через периметр.', explain: [`a + b = ${2 * (a + b)} : 2 = ${a + b} см.`, `Ширина: ${a + b} − ${a} = ${b} см.`, `S = ${a} · ${b} = ${a * b} см².`] };
});

reg('fund', 'f_more', d => {
  if (d === 1) {
    const b = R.int(3, 12), k = R.int(2, 9), a = b * k;
    if (R.chance(0.5)) return { q: `На сколько ${a} больше ${b}?`, type: 'num', answer: a - b, hint: '«На сколько больше» — узнаём вычитанием.',
      explain: ['«На сколько больше/меньше» → вычитание.', `${a} − ${b} = ${a - b}.`, `(А «во сколько раз» было бы делением: ${a} : ${b} = ${k}.)`] };
    return { q: `Во сколько раз ${a} больше ${b}?`, type: 'num', answer: k, hint: '«Во сколько раз больше» — узнаём делением.',
      explain: ['«Во сколько раз больше/меньше» → деление.', `${a} : ${b} = ${k}.`, `(А «на сколько» было бы вычитанием: ${a} − ${b} = ${a - b}.)`] };
  }
  if (d === 2) {
    const b = R.int(3, 12), k = R.int(3, 8), a = b * k;
    const qs = {
      div: `Во сколько раз у Фундука больше орехов, чем у Миндалинки?`, sub: `На сколько у Фундука больше орехов, чем у Миндалинки?`,
      add: `Сколько орехов у них вместе?`, mul: `Сколько орехов у ${k} таких зверьков, как Миндалинка?`
    };
    const op = R.pick(['div', 'sub', 'add']);
    const ex = { div: `${a} : ${b}`, sub: `${a} − ${b}`, add: `${a} + ${b}` }[op];
    return { q: `У Фундука ${NUTS(a)}, у Миндалинки ${b}. На какой вопрос отвечает действие <span class="ex">${ex}</span>?`, type: 'choice',
      options: R.shuffle([qs.div, qs.sub, qs.add, qs.mul]), answer: qs[op], wide: true, hint: '«На сколько» — вычитание, «во сколько раз» — деление, «вместе» — сложение.',
      explain: ['«На сколько больше» → вычитание.', '«Во сколько раз больше» → деление.', '«Сколько вместе» → сложение.', `Значит, ${ex} отвечает на вопрос: «${qs[op]}»`] };
  }
  if (R.chance(0.5)) {
    const a = R.int(6, 15), b = R.int(3, 9);
    return { q: `На сколько произведение чисел ${a} и ${b} больше их суммы?`, type: 'num', answer: a * b - (a + b),
      hint: 'Найди отдельно произведение и сумму, потом сравни вычитанием.', explain: [`Произведение: ${a} · ${b} = ${a * b}.`, `Сумма: ${a} + ${b} = ${a + b}.`, `${a * b} − ${a + b} = ${a * b - (a + b)}.`] };
  }
  const q = R.int(4, 16), b = R.int(2, 6), a = q * b, k = R.int(2, 6), big = q * k;
  return { q: `Во сколько раз частное чисел ${a} и ${b} меньше числа ${big}?`, type: 'num', answer: k,
    hint: 'Найди частное, а потом узнай делением, во сколько раз оно меньше.', explain: [`Частное: ${a} : ${b} = ${q}.`, `${big} : ${q} = ${k}.`] };
});
