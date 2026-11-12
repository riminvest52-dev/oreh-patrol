/* Лесная полянка — мир подготовки к 1 классу (6–7 лет).
   Только нажатия, задание читается вслух, без таймеров и штрафов. Герой — Жёлудик. */
'use strict';

/* ---------- Герой: Жёлудик (концепт утверждён, см. zheludik-brief.md) ----------
   Собран по zheludik-gen.py. У каждого вывода свои id градиентов и clipPath, чтобы два Жёлудика на экране не путались. */
const ZH = { INK: '#5B3418', B1: '#F7C46C', B2: '#E39A3B', B3: '#C0702A', C1: '#A8693A', C2: '#7E4A24', LEAF: '#7FB04A', LEAFD: '#4E7F2A', SHOE: '#8A3F1E', CHEEK: '#F28C70', IRIS: '#6B3A16' };
const ZH_CAP = 'M36 108 C30 70 66 44 104 44 C144 44 172 66 166 100 C142 116 62 120 36 108 Z';
const ZH_SCALES = (() => {
  let s = '';
  for (let r = 0, y = 54; y < 112; y += 11, r++) for (let x = 20 + (r % 2 ? 7 : 0); x < 190; x += 14) s += `<path d="M${x - 7} ${y} q7 9 14 0"/>`;
  return s;
})();
let zhelN = 0;
function zhGlove(x, y, rot, point) {
  const I = ZH.INK;
  const tip = point ? `<path d="M4 -7 C12 -9 20 -9 24 -7 C26 -5 25 -2 22 -2 L6 -1 Z" fill="#fff" stroke="${I}" stroke-width="2.4" stroke-linejoin="round"/>`
    : `<path d="M3 -6 q5 2 6 7 M-1 -8 q5 2 6 8" stroke="${I}" stroke-width="1.6" fill="none" opacity=".55"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-14" y="-5" width="9" height="12" rx="3" fill="#fff" stroke="${I}" stroke-width="2.4"/>
<path d="M-6 -9 C2 -14 13 -10 13 0 C13 9 2 12 -6 8 Z" fill="#fff" stroke="${I}" stroke-width="2.6" stroke-linejoin="round"/>
<ellipse cx="-1" cy="-11" rx="4" ry="5.5" transform="rotate(-25 -1 -11)" fill="#fff" stroke="${I}" stroke-width="2.4"/>${tip}</g>`;
}
const zhLimb = d => `<path d="${d}" stroke="${ZH.INK}" stroke-width="8.5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${ZH.B3}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
function zhArm([s, c, e, rot, pt]) { return zhLimb(`M${s[0]} ${s[1]} Q${c[0]} ${c[1]} ${e[0]} ${e[1]}`) + zhGlove(e[0], e[1], rot, pt); }
const ZH_POSES = {
  happy: [[[52, 150], [34, 170], [36, 188], 0, false], [[150, 148], [172, 132], [176, 108], -70, false]],
  cheer: [[[52, 144], [30, 120], [30, 96], -110, false], [[150, 142], [172, 118], [172, 94], -70, false]],
  think: [[[52, 152], [34, 172], [40, 190], 20, false], [[148, 156], [140, 182], [116, 180], 200, false]],
  show: [[[52, 152], [36, 172], [40, 190], 20, false], [[150, 150], [174, 150], [192, 142], -15, true]]
};
function zhEyes(mood) {
  const I = ZH.INK;
  if (mood === 'cheer') return `<path d="M70 138 q12 -14 24 0 M108 136 q12 -14 24 0" stroke="${I}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const [lx, ly] = { happy: [1, 0], think: [-3, -4], show: [4, 0] }[mood];
  return `<g class="zh-eyes">` + [[82, 140], [121, 139]].map(([cx, cy]) => {
    const ix = cx + lx, iy = cy - 1 + ly;
    return `<ellipse cx="${cx}" cy="${cy}" rx="14.5" ry="18.5" fill="#FFFDF6" stroke="${I}" stroke-width="3"/>
<ellipse cx="${ix}" cy="${iy}" rx="10" ry="12.5" fill="${ZH.IRIS}"/><ellipse cx="${ix}" cy="${iy + 1}" rx="5.4" ry="7" fill="#1E0F05"/>
<ellipse cx="${ix + 3.5}" cy="${iy - 5}" rx="4" ry="4.6" fill="#fff"/><circle cx="${ix - 3}" cy="${iy + 4}" r="1.6" fill="#fff"/>
<path d="M${cx - 13} ${cy - 10} Q${cx - 2} ${cy - 20} ${cx + 11} ${cy - 14}" stroke="${I}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }).join('') + '</g>';
}
function zhBrows(mood) {
  const I = ZH.INK;
  if (mood === 'think') return `<path d="M70 113 q10 -9 22 -3" stroke="${I}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M110 114 q10 1 20 4" stroke="${I}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (mood === 'cheer') return `<path d="M70 116 q11 -8 22 -2 M108 114 q11 -6 22 2" stroke="${I}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  return `<path d="M70 117 q12 -9 23 -3 M110 115 q12 -6 22 3" stroke="${I}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
}
function zhMouth(mood) {
  const I = ZH.INK;
  if (mood === 'think') return `<path d="M96 168 q8 -4 16 2" stroke="${I}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (mood === 'cheer') return `<path d="M78 158 Q101 196 126 156 Q102 166 78 158 Z" fill="#8E2A1E" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M90 176 Q102 168 114 176 Q102 186 90 176 Z" fill="#F07A6A"/><path d="M84 161 Q102 166 120 160 L119 164 Q102 170 85 165 Z" fill="#fff"/>`;
  return `<path d="M84 160 Q102 186 122 158 Q103 167 84 160 Z" fill="#8E2A1E" stroke="${I}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M93 172 Q103 166 113 172 Q103 180 93 172 Z" fill="#F07A6A"/>`;
}
ART.zhel = function (mood = 'happy', cls = '') {
  if (!ZH_POSES[mood]) mood = 'happy';
  const u = 'zh' + (++zhelN), I = ZH.INK;
  const [left, right] = ZH_POSES[mood];
  const legs = zhLimb('M88 206 Q86 216 84 224') + zhLimb('M114 206 Q116 216 118 224') +
    `<path d="M68 230 C68 220 78 218 88 222 C94 224 94 232 88 233 L72 233 C69 233 68 232 68 230 Z" fill="${ZH.SHOE}" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
<path d="M134 230 C134 220 124 218 114 222 C108 224 108 232 114 233 L130 233 C133 233 134 232 134 230 Z" fill="${ZH.SHOE}" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
<ellipse cx="76" cy="224" rx="4" ry="2" fill="#fff" opacity=".45"/><ellipse cx="126" cy="224" rx="4" ry="2" fill="#fff" opacity=".45"/>`;
  const body = `<path d="M100 82 C142 82 160 112 158 144 C156 180 128 204 101 212 C74 204 46 180 44 144 C42 112 58 82 100 82 Z" fill="url(#b${u})" stroke="${I}" stroke-width="4" stroke-linejoin="round"/>
<path d="M101 212 C100 216 99 220 101 223" stroke="${I}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
<path d="M62 120 C58 140 62 160 72 176" stroke="#FFF2CF" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>
<ellipse cx="66" cy="158" rx="10" ry="6.5" fill="${ZH.CHEEK}" opacity=".55"/><ellipse cx="136" cy="156" rx="10" ry="6.5" fill="${ZH.CHEEK}" opacity=".55"/>
<g transform="rotate(-7 100 90) translate(0 -3)"><path d="${ZH_CAP}" fill="url(#c${u})"/>
<g clip-path="url(#k${u})" stroke="${ZH.C2}" stroke-width="2.4" fill="none" opacity=".75">${ZH_SCALES}</g>
<path d="${ZH_CAP}" fill="none" stroke="${I}" stroke-width="4" stroke-linejoin="round"/>
<path d="M38 106 C70 118 138 114 165 99" stroke="${ZH.C2}" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M38 106 C70 118 138 114 165 99" stroke="${I}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6" transform="translate(0 4)"/>
<path d="M60 64 C72 54 88 50 98 50" stroke="#E2B07E" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>
<path d="M106 46 C106 34 112 24 124 20" stroke="${I}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M106 46 C106 34 112 24 124 20" stroke="${ZH.C2}" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M124 20 C128 10 138 8 142 12 C150 8 156 14 152 20 C160 22 160 30 152 32 C154 40 144 42 140 36 C134 40 126 34 130 28 C122 28 120 22 124 20 Z" fill="${ZH.LEAF}" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
<path d="M126 22 C134 24 142 26 150 26" stroke="${ZH.LEAFD}" stroke-width="2" fill="none" stroke-linecap="round"/></g>
${zhBrows(mood)}${zhEyes(mood)}
<ellipse cx="102" cy="152" rx="5" ry="3.6" fill="${ZH.B3}" opacity=".8"/><ellipse cx="100.5" cy="151" rx="1.6" ry="1.1" fill="#fff" opacity=".8"/>${zhMouth(mood)}`;
  const squash = mood === 'cheer' ? ' transform="translate(100 232) scale(1.05 .95) translate(-100 -232)"' : '';
  /* Моргание раз в 3–5 с: у каждого экземпляра свой период */
  const blink = (3 + Math.random() * 2).toFixed(1);
  return `<svg class="chip zh zh-${mood} ${cls}" style="--blink:${blink}s" viewBox="-10 0 230 242" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Жёлудик"><defs>
<radialGradient id="b${u}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#FFE3A6"/><stop offset=".35" stop-color="${ZH.B1}"/><stop offset=".8" stop-color="${ZH.B2}"/><stop offset="1" stop-color="${ZH.B3}"/></radialGradient>
<radialGradient id="c${u}" cx="40%" cy="25%" r="80%"><stop offset="0" stop-color="#C98A52"/><stop offset=".6" stop-color="${ZH.C1}"/><stop offset="1" stop-color="${ZH.C2}"/></radialGradient>
<clipPath id="k${u}"><path d="${ZH_CAP}"/></clipPath></defs>
<ellipse cx="101" cy="236" rx="46" ry="6" fill="${I}" opacity=".15"/>
<g class="zh-jump"><g${squash}>${legs}${body}${zhArm(left)}<g class="zh-arm-r">${zhArm(right)}</g></g></g></svg>`;
};
(() => { const base = ART.chip; ART.chip = (who, mood, cls, bust) => who === 'zhel' ? ART.zhel(mood, cls) : base(who, mood, cls, bust); })();

/* Озвучка (Voice) и похвала (Praise) — в js/voice.js */

/* ---------- Темы ---------- */
const KID_TOPICS = [
  { id: 'k_cnt', name: 'Считалочка', icon: '🐞', gens: ['k_count', 'k_flash'] },
  { id: 'k_dig', name: 'Цифры', icon: '🔢', gens: ['k_digit', 'k_put'] },
  { id: 'k_cmp', name: 'Больше и меньше', icon: '⚖️', gens: ['k_more', 'k_sign'] },
  { id: 'k_line', name: 'Числовая дорожка', icon: '🐾', gens: ['k_line', 'k_next'] },
  { id: 'k_house', name: 'Домики чисел', icon: '🏠', gens: ['k_frame', 'k_house'] },
  { id: 'k_add', name: 'Плюс и минус', icon: '➕', gens: ['k_add', 'k_sub'] },
  { id: 'k_shape', name: 'Фигуры и размеры', icon: '🔺', gens: ['k_shape', 'k_size'] },
  { id: 'k_where', name: 'Где что стоит', icon: '🧺', gens: ['k_where', 'k_order'] },
  { id: 'k_logic', name: 'Логика', icon: '🧩', gens: ['k_odd', 'k_pattern'] },
  /* Разделы-игры рядом с математикой: свой экран, регистрируются в KID_GAMES (js/k-path.js и следующие) */
  { id: 'k_path', name: 'Тропинка к дубу', icon: '🌳', gens: [], game: true }
];
const KID_GAMES = {};
const KTOPIC = Object.fromEntries(KID_TOPICS.map(t => [t.id, t]));
const KID_PER_SESSION = 6;

/* Предметы: формы после числа, винительный падеж (мн. и ед.), род */
const KI = [
  { e: '🍄', f: ['гриб', 'гриба', 'грибов'], a: 'грибы', s: 'гриб', g: 'm', put: true },
  { e: '🍎', f: ['яблоко', 'яблока', 'яблок'], a: 'яблоки', s: 'яблоко', g: 'n', put: true },
  { e: '🌰', f: ['орешек', 'орешка', 'орешков'], a: 'орешки', s: 'орешек', g: 'm', put: true },
  { e: '🐞', f: ['божья коровка', 'божьи коровки', 'божьих коровок'], a: 'божьих коровок', s: 'божью коровку', g: 'f' },
  { e: '🐟', f: ['рыбка', 'рыбки', 'рыбок'], a: 'рыбок', s: 'рыбку', g: 'f', put: true },
  { e: '⭐', f: ['звёздочка', 'звёздочки', 'звёздочек'], a: 'звёздочки', s: 'звёздочку', g: 'f', put: true },
  { e: '🍓', f: ['клубничка', 'клубнички', 'клубничек'], a: 'клубнички', s: 'клубничку', g: 'f', put: true },
  { e: '🦋', f: ['бабочка', 'бабочки', 'бабочек'], a: 'бабочек', s: 'бабочку', g: 'f' },
  { e: '🐸', f: ['лягушка', 'лягушки', 'лягушек'], a: 'лягушек', s: 'лягушку', g: 'f' },
  { e: '🐝', f: ['пчёлка', 'пчёлки', 'пчёлок'], a: 'пчёлок', s: 'пчёлку', g: 'f' }
];
const kf = (it, n) => pl(n, ...it.f);
const NUTW = n => `${n} ${pl(n, 'орешек', 'орешка', 'орешков')}`;
const grp = (e, n, cls = '') => `<div class="kgrp ${cls}">${Array.from({ length: n }, () => `<span>${e}</span>`).join('')}</div>`;
const kemo = e => `<span class="kemo">${e}</span>`;
const kword = w => `<span class="kword">${w}</span>`;
/* 4 варианта-числа рядом с ответом, по возрастанию */
function numOpts(ans, lo, hi, k = 4) {
  const set = new Set([ans]);
  for (const c of R.shuffle([ans - 1, ans + 1, ans - 2, ans + 2, ans + 3, ans - 3])) { if (set.size >= k) break; if (c >= lo && c <= hi) set.add(c); }
  for (let c = lo; set.size < k && c <= hi; c++) set.add(c);
  return [...set].sort((a, b) => a - b).map(v => ({ h: `<span class="knum">${v}</span>`, v }));
}

const KG = {};
/* 1. Считалочка */
KG.k_count = d => {
  const it = R.pick(KI), n = d === 1 ? R.int(2, 5) : d === 2 ? R.int(4, 10) : R.int(8, 15);
  return { kind: 'count', e: it.e, n, text: `Сколько тут ${it.f[2]}?`, say: `Сколько тут ${it.f[2]}? Нажимай по очереди и считай.`,
    hint: 'Нажимай на каждую картинку по одному разу — я буду считать вместе с тобой.',
    opts: numOpts(n, 1, 20), ans: n, why: `Считаем по порядку до ${n}. Всего ${n} ${kf(it, n)}.` };
};
const DICE = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8], 7: [0, 2, 3, 4, 5, 6, 8] };
const dice = n => `<div class="dice">${Array.from({ length: 9 }, (_, i) => `<i class="${DICE[n].includes(i) ? 'on' : ''}"></i>`).join('')}</div>`;
KG.k_flash = d => {
  const n = d === 1 ? R.int(1, 4) : d === 2 ? R.int(2, 6) : R.int(4, 7);
  return { kind: 'flash', n, ms: d === 1 ? 2200 : d === 2 ? 1600 : 1200, scene: dice(n), text: 'Сколько было точек?', say: 'Посмотри и запомни: сколько точек?',
    hint: 'Нажми «Покажи ещё раз» и посмотри внимательно.', opts: numOpts(n, 1, 9), ans: n, why: `${n === 1 ? 'Была' : 'Было'} ${n} ${pl(n, 'точка', 'точки', 'точек')}.` };
};
/* 2. Цифры */
KG.k_digit = d => {
  const it = R.pick(KI), hi = d === 1 ? 5 : d === 2 ? 9 : 10, n = R.int(d === 3 ? 5 : 1, hi);
  if (R.chance(0.5)) return { kind: 'pick', scene: grp(it.e, n), text: 'Какая цифра подходит?', say: `Посчитай ${it.a}. Какая цифра подходит?`,
    hint: 'Сначала посчитай картинки, потом найди такую цифру.', opts: numOpts(n, 1, 10), ans: n, why: `Тут ${n} ${kf(it, n)}. Это цифра ${n}.` };
  const vals = R.shuffle(numOpts(n, 1, hi).map(o => o.v));
  return { kind: 'pick', scene: `<div class="kbig">${n}</div>`, text: `Где ${n} ${kf(it, n)}?`, say: `Найди, где ${n} ${kf(it, n)}.`, layout: 'col',
    hint: 'Посчитай картинки в каждой строчке.', opts: vals.map(v => ({ h: grp(it.e, v, 'small'), v })), ans: n, why: `Вот ${n} ${kf(it, n)}. Это цифра ${n}.` };
};
KG.k_put = d => {
  const it = R.pick(KI.filter(x => x.put)), n = d === 1 ? R.int(1, 5) : d === 2 ? R.int(3, 8) : R.int(6, 10);
  return { kind: 'put', e: it.e, n, pile: Math.min(14, n + R.int(2, 4)), text: `Положи в корзинку ${n} ${n === 1 ? it.s : kf(it, n)}`,
    say: `Положи в корзинку ${n} ${n === 1 ? it.s : kf(it, n)}. Потом нажми «Готово».`, hint: 'Клади по одному и считай вслух. Лишнее можно вернуть — нажми на него в корзинке.',
    ans: n, why: `Нужно ${n}: кладём по одному и считаем до ${n}.` };
};
/* 3. Больше и меньше */
KG.k_more = d => {
  const it = R.pick(KI), hi = d === 1 ? 5 : d === 2 ? 8 : 10;
  let a = R.int(1, hi), b = R.int(1, hi);
  if (R.chance(d === 1 ? 0.2 : 0.25)) b = a;
  else if (d === 1) while (Math.abs(a - b) < 2) { a = R.int(1, hi); b = R.int(1, hi); }
  else while (a === b) b = R.int(1, hi);
  const more = R.chance(0.5), word = more ? 'больше' : 'меньше';
  /* На третьей ступени меньшая группа нарисована крупнее: не путаем размер с количеством */
  const big = d === 3 && a !== b ? (a < b ? 'L' : 'R') : '';
  const opts = [{ h: grp(it.e, a, big === 'L' ? 'big' : 'small'), v: 'L' }, { h: grp(it.e, b, big === 'R' ? 'big' : 'small'), v: 'R' }];
  opts.push({ h: kword('Поровну'), v: 'E' });   /* третий вариант всегда: не «50 на 50» */
  const ans = a === b ? 'E' : (a > b) === more ? 'L' : 'R';
  return { kind: 'pick', layout: 'pair', opts, ans, text: `Где ${word} ${it.f[2]}?`, say: `Где ${word} ${it.f[2]}? Если одинаково — нажми «Поровну».`,
    hint: 'Посчитай слева и справа. Большие картинки — не значит, что их больше!',
    why: a === b ? `Слева ${a} и справа ${b} — поровну.` : `Слева ${a}, справа ${b}. ${ans === 'L' ? 'Слева' : 'Справа'} ${word}.` };
};
KG.k_sign = d => {
  const hi = d === 1 ? 5 : d === 2 ? 10 : 20;
  const a = R.int(1, hi), b = R.chance(0.2) ? a : R.int(1, hi);
  const ans = a > b ? '>' : a < b ? '<' : '=';
  const pic = n => d === 1 ? grp('🌰', n, 'tiny') : '';
  const word = { '>': 'больше', '<': 'меньше', '=': 'равно' };
  return { kind: 'pick', layout: 'three', ans,
    scene: `<div class="kcmp"><div><div class="kbig">${a}</div>${pic(a)}</div><div class="kbig q">?</div><div><div class="kbig">${b}</div>${pic(b)}</div></div>`,
    opts: ['>', '<', '='].map(s => ({ h: `<span class="knum">${s === '>' ? '&gt;' : s === '<' ? '&lt;' : '='}</span>`, v: s })),
    text: 'Какой знак поставить?', say: `Что поставить между ${a} и ${b}? Больше, меньше или равно?`, hint: 'Острый носик знака всегда смотрит на меньшее число.',
    why: a === b ? `${a} и ${b} одинаковые — ставим «равно».` : `${Math.max(a, b)} больше, чем ${Math.min(a, b)}. Носик знака смотрит на меньшее: ${a} ${ans} ${b}.`,
    whySay: a === b ? `${a} и ${b} одинаковые, ставим равно.` : `${a} ${word[ans]} ${b}.` };
};
/* 4. Числовая дорожка */
KG.k_line = d => {
  const len = d === 1 ? 5 : 6, hi = d === 1 ? 6 : d === 2 ? 10 : 20, back = d === 3 && R.chance(0.4);
  const start = R.int(1, hi - len + 1);
  const seq = Array.from({ length: len }, (_, i) => start + i); if (back) seq.reverse();
  const k = R.int(1, len - 1), x = seq[k];
  return { kind: 'pick', scene: `<div class="kline">${seq.map((v, i) => `<span class="${i === k ? 'q' : ''}">${i === k ? '?' : v}</span>`).join('')}</div>`,
    text: 'Какое число пропало?', say: back ? 'Числа идут назад. Какое число пропало?' : 'Какое число пропало на дорожке?', hint: 'Посчитай вслух по порядку.',
    opts: numOpts(x, 0, 20), ans: x, why: `${back ? 'Считаем назад' : 'Считаем по порядку'}: ${seq.join(', ')}.` };
};
KG.k_next = d => {
  const hi = d === 1 ? 6 : d === 2 ? 10 : 20, n = R.int(2, hi - 1);
  const kind = d === 3 ? R.pick(['before', 'after', 'between']) : R.pick(['before', 'after']);
  if (kind === 'between') return { kind: 'pick', scene: `<div class="kline"><span>${n - 1}</span><span class="q">?</span><span>${n + 1}</span></div>`,
    text: `Какое число между ${n - 1} и ${n + 1}?`, say: `Какое число стоит между ${n - 1} и ${n + 1}?`, hint: 'Посчитай вслух по порядку.',
    opts: numOpts(n, 0, 20), ans: n, why: `${n - 1}, ${n}, ${n + 1} — число ${n} посередине.` };
  const x = kind === 'before' ? n - 1 : n + 1;
  return { kind: 'pick', scene: `<div class="kline">${kind === 'before' ? `<span class="q">?</span><span>${n}</span>` : `<span>${n}</span><span class="q">?</span>`}</div>`,
    text: `Какое число ${kind === 'before' ? 'перед' : 'после'} ${n}?`, say: `Какое число стоит ${kind === 'before' ? 'перед числом' : 'после числа'} ${n}?`,
    hint: kind === 'before' ? 'Перед — это на один меньше.' : 'После — это на один больше.',
    opts: numOpts(x, 0, 20), ans: x, why: kind === 'before' ? `Перед ${n} стоит ${x}: ${x}, ${n}.` : `После ${n} идёт ${x}: ${n}, ${x}.` };
};
/* 5. Домики чисел */
KG.k_frame = d => {
  let t, a;
  if (d === 1) { t = R.int(3, 5); a = R.int(1, t - 1); } else if (d === 2) { t = R.int(5, 9); a = R.int(2, t - 1); } else { t = 10; a = R.int(3, 8); }
  return { kind: 'frame', a, t, ans: t, text: t === 10 ? 'Заполни домик до 10' : `Сделай ${t}`,
    say: `В домике ${NUTW(a)}. Добавь орешки, чтобы стало ${t}. Потом нажми «Готово».`, hint: 'Считай все орешки в домике — и старые, и новые.',
    why: `${a} и ещё ${t - a} — получится ${t}.` };
};
KG.k_house = d => {
  const N = d === 1 ? R.int(2, 5) : d === 2 ? R.int(5, 8) : R.int(8, 10), a = R.int(1, N - 1), x = N - a;
  const help = d === 1 ? `<div class="kgrp tiny">${'<span>🌰</span>'.repeat(a)}${'<span class="ghost">⚪</span>'.repeat(x)}</div>` : d === 2 ? grp('🌰', a, 'tiny') : '';
  return { kind: 'pick', scene: `<div class="khouse"><div class="roof">${N}</div><div class="fl"><span>${a}</span><span class="q">?</span></div></div>${help}`,
    text: `${N} — это ${a} и сколько ещё?`, say: `Число ${N} — это ${a} и сколько ещё?`, hint: `Загибай пальчики: от ${a} считай до ${N}.`,
    opts: numOpts(x, 0, 10), ans: x, why: `${a} и ${x} — вместе ${N}.` };
};
/* 6. Плюс и минус */
KG.k_add = d => {
  const it = R.pick(KI);
  let a, b; if (d === 1) { a = R.int(1, 3); b = R.int(1, 5 - a); } else { a = R.int(2, 7); b = R.int(1, 10 - a); }
  const s = a + b;
  return { kind: 'pick', ans: s, opts: numOpts(s, 0, 10),
    scene: d < 3 ? `<div class="kplus">${grp(it.e, a, 'small')}<span class="op">+</span>${grp(it.e, b, 'small')}</div>` : `<div class="kex">${a} + ${b} = ?</div>`,
    text: d < 3 ? `Сколько всего ${it.f[2]}?` : `Сколько будет ${a} + ${b}?`, say: d < 3 ? `${a} да ещё ${b}. Сколько всего ${it.f[2]}?` : `Сколько будет ${a} плюс ${b}?`,
    hint: d < 3 ? 'Посчитай всех вместе.' : `Начни с ${a} и прибавь ещё ${b}: загибай пальчики.`, why: `${a} + ${b} = ${s}`, whySay: `${a} да ещё ${b} — будет ${s}.` };
};
KG.k_sub = d => {
  const it = R.pick(KI), n = d === 1 ? R.int(2, 5) : R.int(4, 10), k = R.int(1, d === 1 ? n - 1 : Math.min(n - 1, 5)), r = n - k;
  return { kind: 'pick', ans: r, opts: numOpts(r, 0, 10),
    scene: d < 3 ? `<div class="kgrp small">${Array.from({ length: n }, (_, i) => (i >= r ? `<span class="gone"><i>${it.e}</i></span>` : `<span>${it.e}</span>`)).join('')}</div>` : `<div class="kex">${n} − ${k} = ?</div>`,
    text: d < 3 ? 'Сколько осталось?' : `Сколько будет ${n} − ${k}?`, say: d < 3 ? `Было ${n} ${kf(it, n)}. ${k === 1 ? 'Одну картинку убрали — она зачёркнута' : k + ' убрали — они зачёркнуты'}. Сколько осталось?` : `Сколько будет ${n} минус ${k}?`,
    hint: d < 3 ? 'Зачёркнутые убрали. Посчитай только тех, кто не зачёркнут.' : `Начни с ${n} и отсчитай назад ${k}.`, why: d < 3 ? `Было ${n}, зачёркнуто ${k}. Не зачёркнуто ${r}: ${n} − ${k} = ${r}.` : `${n} − ${k} = ${r}`, whySay: `Было ${n}, убрали ${k}, осталось ${r}.` };
};
/* 7. Фигуры и размеры */
const SHAPES = {
  circle: { a: 'круг', pl: ['круг', 'круга', 'кругов'], svg: c => `<circle cx="40" cy="40" r="30" fill="${c}"/>`, why: 'Круг круглый, у него нет углов.' },
  square: { a: 'квадрат', pl: ['квадрат', 'квадрата', 'квадратов'], svg: c => `<rect x="12" y="12" width="56" height="56" rx="2" fill="${c}"/>`, why: 'У квадрата 4 угла и все стороны одинаковые.' },
  triangle: { a: 'треугольник', pl: ['треугольник', 'треугольника', 'треугольников'], svg: c => `<polygon points="40,8 74,70 6,70" fill="${c}"/>`, why: 'У треугольника 3 угла.' },
  rect: { a: 'прямоугольник', svg: c => `<rect x="4" y="22" width="72" height="38" rx="2" fill="${c}"/>`, why: 'У прямоугольника 4 угла: две стороны длинные, две короткие.' },
  oval: { a: 'овал', svg: c => `<ellipse cx="40" cy="40" rx="36" ry="22" fill="${c}"/>`, why: 'Овал похож на вытянутый круг или яйцо.' }
};
const KCOL = ['#E8604A', '#4A90D9', '#F5B43C', '#5E9E4A', '#9B59B6'];
const shp = (k, c, size = 72) => `<svg viewBox="0 0 80 80" width="${size}" height="${size}">${SHAPES[k].svg(c)}</svg>`;
KG.k_shape = d => {
  if (d === 3) {
    const target = R.pick(['circle', 'square', 'triangle']), n = R.int(2, 5);
    const others = Array.from({ length: R.int(3, 5) }, () => R.pick(Object.keys(SHAPES).filter(k => k !== target)));
    const pool = R.shuffle(Array(n).fill(target).concat(others)), P = SHAPES[target].pl;
    return { kind: 'pick', scene: `<div class="kshapes">${pool.map(k => shp(k, R.pick(KCOL), 52)).join('')}</div>`, text: `Сколько тут ${P[2]}?`,
      say: `Сколько тут ${P[2]}?`, hint: SHAPES[target].why, opts: numOpts(n, 1, 9), ans: n, why: `${SHAPES[target].why} Таких фигур ${n}.` };
  }
  const keys = d === 1 ? ['circle', 'square', 'triangle'] : Object.keys(SHAPES), target = R.pick(keys);
  const partner = { square: 'rect', rect: 'square', circle: 'oval', oval: 'circle' }[target];
  const rest = keys.filter(k => k !== target && k !== partner);
  const set = [target].concat(d === 2 && partner ? [partner] : [], R.shuffle(rest)).slice(0, d === 1 ? 3 : 4);
  return { kind: 'pick', layout: d === 1 ? 'three' : '', text: `Найди ${SHAPES[target].a}`, say: `Найди ${SHAPES[target].a}.`, hint: SHAPES[target].why,
    opts: R.shuffle(set).map(k => ({ h: shp(k, R.pick(KCOL)), v: k })), ans: target, why: SHAPES[target].why };
};
const ADJ = { big: { m: 'самый большой', n: 'самое большое', f: 'самую большую' }, small: { m: 'самый маленький', n: 'самое маленькое', f: 'самую маленькую' } };
const ADJN = { big: { m: 'самый большой', n: 'самое большое', f: 'самая большая' }, small: { m: 'самый маленький', n: 'самое маленькое', f: 'самая маленькая' } };
KG.k_size = d => {
  const big = R.chance(0.5);
  if (d === 1) {
    const it = R.pick(KI), sizes = R.sample([26, 34, 44, 56], 3), ans = big ? Math.max(...sizes) : Math.min(...sizes);
    const w = ADJ[big ? 'big' : 'small'][it.g];
    return { kind: 'pick', layout: 'three', text: `Найди ${w} ${it.s}`, say: `Найди ${w} ${it.s}.`, hint: 'Сравни картинки между собой.',
      opts: sizes.map(s => ({ h: `<span style="font-size:calc(var(--ki) * ${(s / 26).toFixed(2)});line-height:1">${it.e}</span>`, v: s })), ans, why: `Вот ${ADJN[big ? 'big' : 'small'][it.g]} ${it.f[0]}. Сравни с остальными.` };
  }
  if (d === 2) {
    const lens = R.sample([30, 45, 60, 75, 90, 105], 4), ans = big ? Math.max(...lens) : Math.min(...lens);
    return { kind: 'pick', layout: 'col', text: `Найди ${big ? 'самую длинную' : 'самую короткую'} ленточку`, say: `Найди ${big ? 'самую длинную' : 'самую короткую'} ленточку.`,
      hint: 'Все ленточки начинаются слева. Посмотри, где какая кончается.',
      opts: lens.map(l => ({ h: `<svg viewBox="0 0 120 20" width="100%" height="22" preserveAspectRatio="xMinYMid meet"><rect x="2" y="3" width="${l}" height="14" rx="7" fill="${R.pick(KCOL)}"/></svg>`, v: l })),
      ans, why: `${big ? 'Самая длинная' : 'Самая короткая'} ленточка — вот эта.` };
  }
  const hs = R.sample([2, 3, 4, 5, 6, 7], 4), ans = big ? Math.max(...hs) : Math.min(...hs);
  return { kind: 'pick', layout: 'four', text: `Найди ${big ? 'самую высокую' : 'самую низкую'} башню`, say: `Найди ${big ? 'самую высокую' : 'самую низкую'} башню.`,
    hint: 'Посчитай кубики в каждой башне.', opts: R.shuffle(hs).map(h => ({ h: `<div class="tower">${'<i></i>'.repeat(h)}</div>`, v: h })),
    ans, why: `В ${big ? 'самой высокой' : 'самой низкой'} башне ${ans} ${pl(ans, 'кубик', 'кубика', 'кубиков')}.` };
};
/* 8. Где что стоит */
const ANIM = [{ e: '🦔', g: 'ёжика' }, { e: '🐿️', g: 'белки' }, { e: '🐰', g: 'зайчика' }, { e: '🦊', g: 'лисички' }, { e: '🐻', g: 'медвежонка' },
  { e: '🐸', g: 'лягушки' }, { e: '🦉', g: 'совы' }, { e: '🐭', g: 'мышки' }];
const TH = [{ e: '🍎', i: 'яблоком', g: 'яблока' }, { e: '⚽', i: 'мячом', g: 'мяча' }, { e: '🧸', i: 'мишкой', g: 'мишки' }, { e: '🎈', i: 'шариком', g: 'шарика' },
  { e: '🍐', i: 'грушей', g: 'груши' }, { e: '🚗', i: 'машинкой', g: 'машинки' }, { e: '📕', i: 'книжкой', g: 'книжки' }, { e: '🧁', i: 'кексом', g: 'кекса' }, { e: '🍌', i: 'бананом', g: 'банана' }];
const SIDE = 'Справа — со стороны правой руки, слева — со стороны левой.';
KG.k_where = d => {
  if (d < 3) {
    const n = d === 1 ? 3 : 4, row = R.sample(ANIM, n);
    let text, ans;
    if (d === 2 && R.chance(0.5)) { const i = R.int(1, n - 2); text = `Кто стоит между ${row[i - 1].g} и ${row[i + 1].g}?`; ans = i; }
    else { const right = R.chance(0.5), i = right ? R.int(0, n - 2) : R.int(1, n - 1); text = `Кто стоит ${right ? 'справа' : 'слева'} от ${row[i].g}?`; ans = right ? i + 1 : i - 1; }
    return { kind: 'pick', layout: 'row', text, say: text + ' Нажми на него.', hint: SIDE, opts: row.map((a, j) => ({ h: kemo(a.e), v: j })), ans, why: 'Вот он! ' + SIDE };
  }
  const grid = R.sample(TH, 9), rels = [];
  for (let p = 0; p < 9; p++) {
    const r = Math.floor(p / 3), c = p % 3;
    if (r > 0) rels.push([p, 'под', p - 3]); if (r < 2) rels.push([p, 'над', p + 3]);
    if (c > 0) rels.push([p, 'справа от', p - 1]); if (c < 2) rels.push([p, 'слева от', p + 1]);
  }
  const [ans, rel, ref] = R.pick(rels), T = grid[ref];
  const text = `Что лежит ${rel} ${rel.length === 3 ? T.i : T.g}?`;
  return { kind: 'pick', layout: 'grid3', text, say: text + ' Нажми на это.', hint: rel === 'над' ? 'Над — это выше.' : rel === 'под' ? 'Под — это ниже.' : SIDE,
    opts: grid.map((x, j) => ({ h: kemo(x.e), v: j })), ans, why: `Вот оно — ${rel} ${rel.length === 3 ? T.i : T.g}.` };
};
const ORD = ['первым', 'вторым', 'третьим', 'четвёртым', 'пятым'];
KG.k_order = d => {
  const row = R.sample(ANIM, 5), k = R.int(0, d === 1 ? 2 : 4);
  if (d < 3 || R.chance(0.5)) return { kind: 'pick', layout: 'five', scene: '<div class="kstart">считаем отсюда 👉</div>', text: `Кто стоит ${ORD[k]}?`,
    say: `Кто стоит ${ORD[k]}? Считай слева.`, hint: 'Считай слева: первый, второй, третий…', opts: row.map((a, j) => ({ h: kemo(a.e), v: j })), ans: k,
    why: `Считаем слева: ${ORD.slice(0, k + 1).join(', ')}.` };
  const words = R.shuffle([k].concat(R.sample([0, 1, 2, 3, 4].filter(x => x !== k), 3))).sort((a, b) => a - b);
  return { kind: 'pick', scene: `<div class="kstart">считаем отсюда 👉</div><div class="krow">${row.map((a, j) => `<span class="${j === k ? 'kmark' : ''}">${a.e}</span>`).join('')}</div>`,
    text: 'Каким по счёту стоит зверёк в кружке?', say: 'Каким по счёту стоит зверёк в кружочке? Считай слева.', hint: 'Считай слева: первый, второй, третий…',
    opts: words.map(w => ({ h: kword(ORD[w][0].toUpperCase() + ORD[w].slice(1)), v: w })), ans: k, why: `Считаем слева: ${ORD.slice(0, k + 1).join(', ')}.` };
};
/* 9. Логика */
const CATS = [
  { n: 'фрукты', e: ['🍎', '🍐', '🍌', '🍇', '🍑', '🍒', '🍊'] }, { n: 'овощи', e: ['🥕', '🥒', '🍅', '🧅', '🥔', '🌽'] },
  { n: 'животные', e: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐮'] }, { n: 'транспорт', e: ['🚗', '🚌', '🚲', '🚂', '✈️', '🚜'] },
  { n: 'одежда', e: ['👕', '👖', '👗', '🧦', '🧢', '🧤'] }
];
KG.k_odd = d => {
  if (d === 3) {
    const n = R.int(3, 6), m = n + R.pick([-1, 1]);
    const forms = [v => `<span class="knum">${v}</span>`, v => `<div class="dots">${'<i></i>'.repeat(v)}</div>`, v => grp('🍎', v, 'tiny'), v => grp('⭐', v, 'tiny')];
    const oddForm = R.int(0, 3);
    const opts = forms.map((f, i) => ({ h: f(i === oddForm ? m : n), v: i === oddForm ? 'odd' : 'n' + i }));
    return { kind: 'pick', text: 'Какая карточка лишняя?', say: 'Найди лишнюю карточку. Посчитай, сколько на каждой.', hint: 'Посчитай, сколько на каждой карточке.',
      opts: R.shuffle(opts), ans: 'odd', why: `На трёх карточках по ${n}, а на лишней — ${m}.` };
  }
  const [A, B] = d === 1 ? R.sample(CATS, 2) : R.shuffle(R.pick([[CATS[0], CATS[1]], [CATS[2], CATS[0]], [CATS[3], CATS[4]], [CATS[1], CATS[0]]]));
  const three = R.sample(A.e, 3), odd = R.pick(B.e);
  return { kind: 'pick', text: 'Что лишнее?', say: 'Что здесь лишнее?', hint: 'Три картинки похожи. Какая к ним не подходит?',
    opts: R.shuffle(three.map(e => ({ h: kemo(e), v: 'n' + e })).concat([{ h: kemo(odd), v: 'odd' }])), ans: 'odd',
    why: `${three.join(' ')} — это ${A.n}, а ${odd} — нет.`, whySay: `Три картинки — это ${A.n}. А лишняя — нет.` };
};
const PAT = ['🔴', '🔵', '🟡', '🟢', '🟣'];
KG.k_pattern = d => {
  if (d === 3 && R.chance(0.5)) {
    const step = R.pick([1, 2]), start = R.int(1, step === 1 ? 10 : 6), seq = Array.from({ length: 4 }, (_, i) => start + i * step), x = start + 4 * step;
    return { kind: 'pick', scene: `<div class="kline">${seq.map(v => `<span>${v}</span>`).join('')}<span class="q">?</span></div>`, text: 'Какое число дальше?',
      say: 'Какое число будет дальше?', hint: 'На сколько каждое число больше предыдущего?', opts: numOpts(x, 0, 20), ans: x,
      why: `Каждый раз прибавляем ${step}: ${seq.join(', ')}, ${x}.` };
  }
  const syms = R.sample(PAT, 3);
  const units = d === 1 ? [[0, 1]] : d === 2 ? [[0, 1, 2], [0, 0, 1], [0, 1, 1]] : [[0, 0, 1, 1], [0, 1, 2, 1], [0, 0, 1, 2]];
  const u = R.pick(units).map(i => syms[i]), len = u.length * 2 + R.int(0, u.length - 1);
  const seq = Array.from({ length: len }, (_, i) => u[i % u.length]), x = u[len % u.length];
  const opts = R.shuffle([...new Set(u)].concat([R.pick(PAT.filter(p => !u.includes(p)))]));
  return { kind: 'pick', layout: opts.length === 3 ? 'three' : '', scene: `<div class="kpat">${seq.map(e => `<span>${e}</span>`).join('')}<span class="q">?</span></div>`,
    text: 'Что будет дальше?', say: 'Посмотри на узор. Что будет дальше?', hint: 'Найди кусочек, который повторяется.',
    opts: opts.map(e => ({ h: kemo(e), v: e })), ans: x, why: `Узор повторяется: ${u.join(' ')}.`, whySay: 'Узор повторяется. Смотри, вот что дальше.' };
};
function makeKid(gen, d) {
  for (let k = 0; k < 20; k++) {
    try { const t = KG[gen](d); if (t) { t.gen = gen; t.d = d; return t; } } catch (e) { if (k === 19) throw e; }
  }
}

/* ---------- Экраны ---------- */
let K = null;
/* Экраны Лизы шире (планшет): класс kidw снимается при любом другом экране */
const mountKid = (html, f) => { const r = mount(html, f); document.body.classList.add('kidw'); return r; };
const kidLevel = tid => Math.min(3, 1 + (S.stars[tid] || 0));
function showKidWelcome() {
  mountKid(`<div class="hero">${ART.zhel('happy')}</div>
    <h1 class="center">Лесная полянка</h1>
    <div class="bubble" style="margin:10px 0 16px;font-size:20px">Привет! Я <b>Жёлудик</b>. Будем считать, искать и играть с числами. Я буду читать задания вслух!</div>
    <label class="muted small" for="nm">Как зовут нового игрока? (взрослый может помочь)</label>
    <input class="input" id="nm" maxlength="20" autocomplete="off" placeholder="Имя" value="${esc(S.name)}">
    <button class="btn block green big" style="margin-top:14px" data-act="kJoin">Играть! 🌰</button>`);
}
ACT.kJoin = () => {
  const v = document.getElementById('nm').value.trim();
  if (!v) { toast('Напиши имя 🙂'); return; }
  S.name = v.slice(0, 20); save(); showKidMap();
};
function showKidMap() {
  K = null; if (typeof PT !== 'undefined') PT = null; Voice.stop();
  const next = KID_TOPICS.reduce((m, T) => (S.stars[T.id] || 0) < (S.stars[m.id] || 0) ? T : m, KID_TOPICS[0]).id;
  const tiles = KID_TOPICS.map(T => {
    const st = S.stars[T.id] || 0;
    return `<button class="ktile ${T.id === next && st < 3 ? 'next' : ''}" data-act="kTopic" data-id="${T.id}"><span class="ki">${T.icon}</span><b>${T.name}</b>
      <span class="kst">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span></button>`;
  }).join('');
  mountKid(`<div class="topbar"><div class="avatar" data-act="who" role="button" aria-label="Сменить игрока">${ART.zhel('happy')}<span class="swap">⇄</span></div>
      <div class="grow"><div class="hello">Привет, ${esc(S.name || 'друг')}!</div><div class="small muted">Лесная полянка</div></div>
      <span class="pill">${ART.acorn(22)}${S.acorns}</span><button class="iconbtn" data-act="parent" aria-label="Для взрослых">⚙️</button></div>
    <div class="ktiles">${tiles}</div>
    <button class="btn gold block" style="margin-top:16px" data-act="album">📒 Наклейки · ${S.stickers.length}</button>`);
  Praise.hello(); Voice.prefetch('kid');
}
const kidOpen = tid => KTOPIC[tid] && KTOPIC[tid].game ? KID_GAMES[tid].start() : kidStart(tid);
ACT.kTopic = el => kidOpen(el.dataset.id);
ACT.kAgain = el => kidOpen(el.dataset.id);
function kidStart(tid) {
  const T = KTOPIC[tid], q = [];
  while (q.length < KID_PER_SESSION) q.push(...R.shuffle(T.gens));
  K = { tid, d: kidLevel(tid), queue: q.slice(0, KID_PER_SESSION), i: 0, first: 0, acorns: 0, wrongRun: 0, run: 0 };
  Voice.prefetch(tid);
  kidNext();
}
function kidNext() {
  if (K.i >= K.queue.length) return kidFinish();
  let d = K.d; if (K.wrongRun >= 2 && d > 1) d--;   /* после двух неудач подряд — полегче */
  const t = makeKid(K.queue[K.i], d); t.topic = K.tid;
  Object.assign(K, { t, tries: 0, done: false, tapped: 0, flashTok: (K.flashTok || 0) + 1 });
  renderKid();
}
function renderKid() {
  const t = K.t;
  const dots = K.queue.map((_, i) => `<i class="${i < K.i ? 'done' : i === K.i ? 'cur' : ''}"></i>`).join('');
  let scene = t.scene || '', opts = '';
  if (t.kind === 'count') scene = `<div class="kgrp tap">${Array.from({ length: t.n }, (_, i) => `<button class="kit" data-act="kTap" data-i="${i}">${t.e}</button>`).join('')}</div>`;
  if (t.kind === 'put') scene = `<div class="kpile" id="kpile">${Array.from({ length: t.pile }, () => `<button class="kit" data-act="kMove">${t.e}</button>`).join('')}</div>
    <div class="kbasket"><div class="kbl">🧺 корзинка</div><div class="kin" id="kin"></div></div>`;
  if (t.kind === 'frame') scene = `<div class="tenframe">${Array.from({ length: 10 }, (_, i) => i < t.a ? '<span class="cell fix">🌰</span>' : '<button class="cell" data-act="kCell"></button>').join('')}</div>`;
  if (t.kind === 'flash') scene = `<div class="kflash" id="kfl">${t.scene}</div><button class="btn ghost" data-act="kShow">👀 Покажи ещё раз</button>`;
  if (t.opts) opts = `<div class="kopts ${t.layout || ''}">${t.opts.map((o, i) => `<button class="kopt" data-act="kPick" data-i="${i}">${o.h}</button>`).join('')}</div>`;
  if (t.kind === 'put' || t.kind === 'frame') opts += '<button class="btn green block big kdone" data-act="kDone">Готово ✓</button>';
  mountKid(`<div class="kplay">
    <div class="playtop"><button class="iconbtn" data-act="kQuit" aria-label="Выйти">✕</button><div class="kdots">${dots}</div><span class="pill">${ART.acorn(20)}<span>${K.acorns}</span></span></div>
    <div class="kbody"><div class="kq"><button class="ksay" data-act="kSay" aria-label="Прочитать ещё раз">🔊</button><div class="kt">${t.text}</div></div>
    <div class="kright"><div class="kscene">${scene}</div>${opts}</div>
    <div class="helper" id="khelp">${ART.zhel('happy')}<div class="bubble" id="kbub">${K.i === 0 ? 'Я читаю задание вслух. Нажми 🔊, чтобы послушать ещё раз.' : R.pick(['Ты справишься!', 'Подумай, не спеши.', 'Я рядом!', 'Интересно, что получится?'])}</div></div></div></div>`);
  Voice.say(t.say, 'nr');
  if (t.kind === 'flash') kFlash();
}
function kFlash() {
  const tok = K.flashTok, el = document.getElementById('kfl'); if (!el) return;
  el.classList.remove('hide');
  setTimeout(() => { if (K && K.flashTok === tok && !K.done) { const e = document.getElementById('kfl'); if (e) e.classList.add('hide'); } }, K.t.ms);
}
const kBub = (html, mood) => {
  const b = document.getElementById('kbub'); if (b) b.innerHTML = html;
  const h = document.querySelector('#khelp svg'); if (h && mood) h.outerHTML = ART.zhel(mood);
};
ACT.kSay = () => { if (K) Voice.say(K.t.say, 'nr'); };
ACT.kShow = () => { if (K && !K.done) { K.flashTok++; kFlash(); } };
ACT.kTap = el => {
  if (!K || K.done || el.classList.contains('on')) return;
  K.tapped++; el.classList.add('on'); el.insertAdjacentHTML('beforeend', `<b>${K.tapped}</b>`);
  Voice.say(String(K.tapped), 'zh');
};
ACT.kMove = el => {
  if (!K || K.done) return;
  const inB = el.parentElement.id === 'kin';
  document.getElementById(inB ? 'kpile' : 'kin').appendChild(el);
};
ACT.kCell = el => {
  if (!K || K.done) return;
  el.classList.toggle('add'); el.textContent = el.classList.contains('add') ? '🌰' : '';
};
ACT.kPick = el => { if (!K || K.done || el.classList.contains('off')) return; kAnswer(K.t.opts[+el.dataset.i].v, el); };
ACT.kDone = () => {
  if (!K || K.done) return;
  const t = K.t;
  if (t.kind === 'put') kAnswer(document.getElementById('kin').children.length);
  else kAnswer(t.a + document.querySelectorAll('.tenframe .cell.add').length);
};
function kAnswer(v, el) {
  const t = K.t;
  if (v === t.ans) return kResolve(true);
  K.tries++;
  Sound.bad();
  if (el) el.classList.add('off');
  if (K.tries < 2) {
    kBub(`Не совсем. Попробуй ещё! <div class="small muted" style="margin-top:4px">💡 ${t.hint || 'Посмотри ещё раз внимательно.'}</div>`, 'think');
    Voice.say('Попробуй ещё раз! ' + (t.hint || ''), 'zh');
    return;
  }
  kResolve(false);
}
/* После второй ошибки Жёлудик показывает решение на предметах */
function kSolve() {
  const t = K.t;
  if (t.kind === 'count') document.querySelectorAll('.kit').forEach((b, i) => { b.classList.add('on'); const n = b.querySelector('b'); if (n) n.remove(); b.insertAdjacentHTML('beforeend', `<b>${i + 1}</b>`); });
  if (t.kind === 'flash') { K.flashTok++; const e = document.getElementById('kfl'); if (e) e.classList.remove('hide'); }
  if (t.kind === 'put') {
    const pile = document.getElementById('kpile'), kin = document.getElementById('kin');
    while (kin.children.length > t.n) pile.appendChild(kin.lastElementChild);
    while (kin.children.length < t.n && pile.children.length) kin.appendChild(pile.firstElementChild);
  }
  if (t.kind === 'frame') {
    const cells = [...document.querySelectorAll('.tenframe button.cell')];
    cells.forEach((c, i) => { const on = i < t.t - t.a; c.classList.toggle('add', on); c.textContent = on ? '🌰' : ''; });
  }
}
function kResolve(ok) {
  const t = K.t; K.done = true;
  const first = ok && K.tries === 0;
  kidRecord(t, first);
  if (first) { K.first++; K.acorns++; giveAcorns(1); }
  K.wrongRun = ok ? 0 : K.wrongRun + 1;
  save();
  document.querySelectorAll('.kopt').forEach((b, i) => {
    b.disabled = true;
    if (t.opts[i].v === t.ans) b.classList.add('right'); else if (!b.classList.contains('off')) b.classList.add('dim');
  });
  document.querySelectorAll('.kit, .tenframe .cell, .kdone').forEach(b => { b.disabled = true; });
  if (!ok) kSolve();
  /* Похвала голосом: со второй попытки, 3 и 5 подряд — всегда, обычный верный ответ — примерно 1 из 3 */
  K.run = first ? K.run + 1 : 0;
  const p = !ok ? null : Praise.say(!first ? 'second' : K.run === 5 ? 'streak5' : K.run === 3 ? 'streak3' : 'ok', 'kid');
  const praise = p ? esc(p.text) : R.pick(['Молодец!', 'Верно!', 'Умница!', 'Здорово!', 'Отлично!']);
  if (ok) Sound.ok();
  kBub(ok ? (first ? `${praise} +1 ${ART.acorn(18)}` : p ? praise : `${praise} Получилось!`) : `Смотри! ${esc(t.why)}`, ok ? 'cheer' : 'show');
  if (!ok) Voice.say('Смотри. ' + (t.whySay || t.why), 'zh');
  const last = K.i + 1 >= K.queue.length;
  document.querySelector('.kright').insertAdjacentHTML('beforeend', `<button class="btn green block big knext" data-act="kNext">${last ? 'Готово 🏁' : 'Дальше ➜'}</button>`);
  setTimeout(() => { const b = document.querySelector('.knext'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 60);
}
ACT.kNext = () => { if (!K) return; K.i++; kidNext(); };
ACT.kQuit = () => modal(`<h2>Выйти на полянку?</h2><p class="muted">Орешки, которые уже есть, останутся.</p>
  <div class="stack"><button class="btn green block" data-act="close">Играть дальше</button><button class="btn ghost block" data-act="kQuitYes">На полянку</button></div>`);
ACT.kQuitYes = () => { closeModal(); K = null; Voice.stop(); showKidMap(); };
function kidRecord(t, ok) {
  S.solved++; if (ok) S.right++;
  updMastery(t.topic, t.d, ok); updSkill(t.gen, t.d, ok);
  const day = today(), H = S.history[day] || { n: 0, ok: 0 }; H.n++; if (ok) H.ok++; S.history[day] = H;
  S.recent.unshift({ ts: Date.now(), topic: t.topic, q: plain(t.text), given: ok ? 'сразу верно' : 'не с первого раза', right: String(t.ans), ok });
  S.recent = S.recent.slice(0, 40);
}
function kidFinish() {
  const k = K; K = null;
  markActive();
  const prev = S.stars[k.tid] || 0, earn = k.first >= KID_PER_SESSION - 1 && prev < 3;
  if (earn) S.stars[k.tid] = prev + 1;
  giveAcorns(2); save(); Sound.win(); confetti(earn ? 26 : 12);
  const st = S.stars[k.tid] || 0;
  mountKid(`<div class="result">${ART.zhel('cheer')}<h1>Молодец${S.name ? ', ' + esc(S.name) : ''}!</h1>
    <div class="bigstars kst">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></div>
    ${earn ? '<p style="font-size:20px"><b>Новая звёздочка!</b></p>' : ''}
    <p style="font-size:20px">Сразу верно: <b>${k.first}</b> из ${k.queue.length}</p>
    <p><span class="pill">+${k.acorns + 2} ${ART.acorn(20)}</span></p>
    <div class="stack"><button class="btn green block big" data-act="kAgain" data-id="${k.tid}">Ещё раз 🔁</button><button class="btn ghost block big" data-act="map">На полянку 🌳</button></div></div>`);
  Praise.say(earn ? 'star' : 'level', 'kid');
}

/* ---------- Раздел для взрослых ---------- */
function showKidParent() {
  const acc = S.solved ? Math.round(S.right / S.solved * 100) : 0, stars = KID_TOPICS.reduce((s, T) => s + (S.stars[T.id] || 0), 0);
  const rows = KID_TOPICS.map(T => {
    const M = mast(T.id), [lbl, col] = masteryLabel(M.m), pct = M.m === null || M.m === undefined ? 0 : Math.round(M.m * 100), st = S.stars[T.id] || 0;
    return `<div class="trow"><div style="font-size:22px">${T.icon}</div><div><div class="tn">${T.name} <span class="small" style="color:${col}">· ${lbl}</span></div>
      <div class="bar"><i style="width:${pct}%;background:${col}"></i></div></div><div class="small muted">${'★'.repeat(st) || '—'} · ступень ${kidLevel(T.id)}</div></div>`;
  }).join('');
  mount(`<div class="topbar"><button class="iconbtn" data-act="map">←</button><div class="grow"><b>Для родителей · ${esc(S.name)}</b><div class="small muted">Подготовка к 1 классу</div></div></div>
    <div class="card"><div class="row" style="justify-content:space-around;text-align:center">
      <div><div style="font-size:26px;font-weight:800">${S.solved}</div><div class="small muted">заданий</div></div>
      <div><div style="font-size:26px;font-weight:800">${acc}%</div><div class="small muted">сразу верно</div></div>
      <div><div style="font-size:26px;font-weight:800">${stars}</div><div class="small muted">звёзд из ${KID_TOPICS.length * 3}</div></div>
      <div><div style="font-size:26px;font-weight:800">${S.streak.best}</div><div class="small muted">лучшая серия</div></div></div></div>
    ${movedCard()}
    <h3 style="margin-top:18px">Темы</h3><div class="card">${rows}
      <p class="small muted">В игре 6 заданий. Если 5 из 6 решены с первого раза, тема получает звёздочку, и задания становятся сложнее: ступень 1 — числа до 5, ступень 2 — до 10, ступень 3 — до 20. После двух ошибок подряд задания на время становятся проще.</p></div>
    ${cloudCard()}
    <h3 style="margin-top:18px">Настройки</h3><div class="card">
      <button class="btn ghost block" style="margin-bottom:12px" data-act="who">👧 Сменить или добавить игрока</button>
      <label class="small muted" for="pn">Имя</label><div class="row"><input class="input" id="pn" maxlength="20" value="${esc(S.name)}"><button class="btn" data-act="saveName">OK</button></div>
      <button class="btn ghost block" style="margin-top:12px" data-act="kVoice">${Voice.on() ? '🗣️ Озвучка заданий включена' : '🤐 Озвучка заданий выключена'}</button>
      ${Voice.has ? '' : '<p class="small muted">Этот браузер не умеет читать вслух. Попробуйте Chrome.</p>'}
      <button class="btn ghost block" style="margin-top:12px" data-act="sound">${S.sound ? '🔊 Звуки включены' : '🔇 Звуки выключены'}</button>
      <button class="btn ghost block" style="margin-top:12px" data-act="import">📥 Загрузить прогресс</button>
      <button class="btn ghost block" style="margin-top:12px;color:var(--red)" data-act="reset">Сбросить прогресс игрока</button></div>
    <p class="small muted center" style="margin-top:14px">Ореховый патруль · Лесная полянка · счёт, сравнение, состав числа, фигуры, ориентирование, логика</p>`);
}
ACT.kVoice = () => { Voice.toggle(); showKidParent(); if (Voice.on()) Voice.say('Озвучка включена.', 'zh'); };
