/* «Лавка Сороки» (задание 10, п. 2): деньги. Монетки 1, 2, 5, 10 р., ценники до 10 р. (на Ступеньке 2 — до 20 р.).
   Задания: «заплати ровно» (монетки нажатием кладутся на прилавок, Сорока считает вслух), «хватит ли монет?», «что дороже?»,
   «сколько сдачи с 10?» (только 3-й уровень). Игрушка, за которую заплатили ровно, — подарок в Домик Жёлудика (S.toys).
   Задание и счёт озвучивает Сорока (голос so); фраза с ценой собирается из кусочков: «Игрушка стоит» + число + «рублей». */
'use strict';

const SHOP_ID = 'k_shop';
const SHOP_TOYS = [
  { id: 'bear', e: '🧸' }, { id: 'ball', e: '⚽' }, { id: 'kite', e: '🪁' }, { id: 'train', e: '🚂' }, { id: 'yoyo', e: '🪀' }, { id: 'dino', e: '🦖' },
  { id: 'doll', e: '🪆' }, { id: 'paint', e: '🎨' }, { id: 'drum', e: '🥁' }, { id: 'car', e: '🚗' }, { id: 'balloon', e: '🎈' }, { id: 'robot', e: '🤖' }
];
const RUB = n => pl(n, 'рубль', 'рубля', 'рублей');
const coin = (v, attrs = '') => `<button class="coin c${v}" data-v="${v}" ${attrs}><b>${v}</b><i>₽</i></button>`;
const coinStatic = v => `<span class="coin c${v}"><b>${v}</b><i>₽</i></span>`;
const priceTag = p => `<span class="ptag">${p} ₽</span>`;
/* Кошелёк на уровень: ровно заплатить всегда можно */
const WALLETS = {
  1: [[1, 1, 1, 1, 1, 2, 2]],
  2: [[1, 1, 1, 2, 2, 2, 5], [1, 1, 2, 2, 5]],
  3: [[1, 1, 2, 2, 2, 5, 5, 10], [1, 2, 2, 5, 10]],
  21: [[1, 1, 2, 2, 5, 10], [1, 2, 2, 5, 5, 10]],
  22: [[1, 1, 2, 2, 5, 5, 10, 10], [1, 2, 2, 2, 5, 10, 10]],
  23: [[1, 2, 2, 5, 5, 10, 10], [1, 1, 2, 5, 10, 10]]
};
/* Какие монетки взять, чтобы вышло ровно p (перебор; монеток не больше 10) */
function coinSet(wallet, p) {
  let best = null;
  for (let m = 1; m < 1 << wallet.length; m++) {
    let s = 0; const idx = [];
    for (let i = 0; i < wallet.length; i++) if (m >> i & 1) { s += wallet[i]; idx.push(i); }
    if (s === p && (!best || idx.length < best.length)) best = idx;
  }
  return best;
}
const toyFor = () => { const free = SHOP_TOYS.filter(t => !(S.toys || []).includes(t.id)); return R.pick(free.length ? free : SHOP_TOYS); };
const shopScene = (toy, p) => `<div class="shop">${ART.soroka('happy', 'sshop')}<span class="stoy">${toy.e}</span>${priceTag(p)}</div>`;

function payTask(d, two) {
  const wallet = R.pick(WALLETS[two ? 20 + d : d]).slice(), total = wallet.reduce((s, v) => s + v, 0);
  const [lo, hi] = two ? [d === 1 ? 11 : 12, d === 1 ? 15 : 20] : [d === 1 ? 2 : d === 2 ? 3 : 6, d === 1 ? 5 : 10];
  const p = R.int(lo, Math.min(hi, total)), sol = coinSet(wallet, p);
  if (!sol) return null;
  const toy = toyFor();
  return { kind: 'coins', who: 'so', wallet, p, sol, toy: toy.id, ans: p, scene: shopScene(toy, p), text: `Заплати ровно ${p} ₽`,
    say: ['Игрушка стоит', String(p), RUB(p) + '.', 'Заплати ровно.'], hint: 'Клади монетки по одной и считай, сколько уже набралось.',
    why: `Можно так: ${sol.map(i => wallet[i]).join(' + ')} = ${p}.`, whySay: 'Вот так можно заплатить ровно.' };
}
function enoughTask(d, two) {
  const p = two ? R.int(11, 20) : R.int(d === 1 ? 2 : 3, d === 1 ? 5 : 10);
  const want = R.pick(['more', 'eq', 'less']), sum = want === 'eq' ? p : want === 'more' ? p + R.int(1, 3) : p - R.int(1, Math.min(3, p - 1));
  /* Сумму раскладываем на монеты: крупные — сначала (1-й уровень — только 1 и 2) */
  const coins = []; let left = sum;
  for (const v of d === 1 && !two ? [2, 1] : [10, 5, 2, 1]) while (left >= v && (v < 10 || coins.length < 2)) { coins.push(v); left -= v; }
  if (left) return null;
  const opts = [{ h: kword('Хватит, и ещё останется'), v: 'more' }, { h: kword('Хватит ровно'), v: 'eq' }, { h: kword('Не хватит'), v: 'less' }];
  const toy = toyFor();
  return { kind: 'pick', who: 'so', layout: 'col', ans: want, opts,
    scene: `${shopScene(toy, p)}<div class="wallet show">👛 ${R.shuffle(coins).map(coinStatic).join('')}</div>`, text: 'Хватит ли этих монет?',
    say: ['Игрушка стоит', String(p), RUB(p) + '.', 'Хватит ли этих монет?'], hint: 'Посчитай, сколько всего денег в кошельке.',
    why: `В кошельке ${sum} ₽, игрушка стоит ${p} ₽.`,
    whySay: want === 'more' ? 'Денег больше, чем стоит игрушка. Хватит, и ещё останется.' : want === 'eq' ? 'Денег столько же, сколько стоит игрушка. Хватит ровно.' : 'Денег меньше, чем стоит игрушка. Не хватит.' };
}
function dearTask(d, two) {
  const [lo, hi] = two ? [d === 1 ? 11 : 5, 20] : [1, d === 1 ? 5 : 10];
  let a = R.int(lo, hi), b = R.int(lo, hi);
  if (R.chance(0.2)) b = a; else if (d === 1) { if (Math.abs(a - b) < 2) return null; } else if (a === b) return null;
  const [t1, t2] = R.sample(SHOP_TOYS, 2);
  const card = (t, p) => `<span class="dcard"><span class="stoy">${t.e}</span>${priceTag(p)}</span>`;
  const ans = a === b ? 'E' : a > b ? 'L' : 'R';
  return { kind: 'pick', who: 'so', layout: 'pair', ans, scene: `<div class="shop">${ART.soroka('happy', 'sshop')}</div>`, opts: [{ h: card(t1, a), v: 'L' }, { h: card(t2, b), v: 'R' }, { h: kword('Одинаково'), v: 'E' }],
    text: 'Что дороже?', say: 'Что дороже? Если цена одинаковая — нажми «Одинаково».', hint: 'Сравни числа на ценниках.',
    why: a === b ? `Обе стоят по ${a} ₽.` : `${Math.max(a, b)} ₽ больше, чем ${Math.min(a, b)} ₽.`, whySay: a === b ? 'Цены одинаковые.' : 'Дороже то, где число больше.' };
}
function changeTask() {
  const p = R.int(1, 9), x = 10 - p, toy = toyFor();
  return { kind: 'pick', who: 'so', ans: x, opts: numOpts(x, 0, 10), scene: `${shopScene(toy, p)}<div class="wallet show">👛 ${coinStatic(10)}</div>`,
    text: 'Сколько сдачи с 10 ₽?', say: ['Игрушка стоит', String(p), RUB(p) + '.', 'Ты даёшь 10 рублей. Сколько сдачи?'],
    hint: `Сдача — это сколько останется. Считай от ${p} до 10 на пальчиках.`, why: `10 − ${p} = ${x}`, whySay: `10 минус ${p} — будет ${x}.` };
}
KG.k_pay = d => payTask(d, false);
KG.k_enough = d => enoughTask(d, false);
KG.k_dear = d => dearTask(d, false);
KG.k_change = d => d === 3 ? changeTask() : payTask(d, false);
KG.k2_pay = d => payTask(d, true);
KG.k2_enough = d => enoughTask(d, true);
KG.k2_dear = d => dearTask(d, true);
KG.k2_change = d => d === 3 ? changeTask() : payTask(d, true);

/* Уголок на полянке — перед «Тропинкой к дубу»; Ступенька 2 — цены до 20 р. */
KID_TOPICS.splice(KID_TOPICS.findIndex(T => T.id === 'k_path'), 0, { id: SHOP_ID, name: 'Лавка Сороки', icon: '🛍️', gens: ['k_pay', 'k_enough', 'k_dear', 'k_change'] });
KTOPIC[SHOP_ID] = KID_TOPICS.find(T => T.id === SHOP_ID);
KID_STEP2[SHOP_ID] = { gens: ['k2_pay', 'k2_enough', 'k2_dear', 'k2_change'], back: { k2_pay: 'k_pay', k2_enough: 'k_enough', k2_dear: 'k_dear', k2_change: 'k_change' } };

/* ---------- Монетки на прилавке ---------- */
function shopCoinsHtml(t) {
  return `<div class="counter"><div class="ctl">прилавок</div><div class="cin" id="cin"></div><div class="csum"><span id="csum">0</span> ₽</div></div>
    <div class="wallet" id="wal">👛 ${t.wallet.map((v, i) => coin(v, `data-act="shCoin" data-i="${i}"`)).join('')}</div>`;
}
const shopSum = () => [...document.querySelectorAll('#cin .coin')].reduce((s, c) => s + +c.dataset.v, 0);
ACT.shCoin = el => {
  if (!K || K.done) return;
  const onCounter = el.parentElement.id === 'cin';
  (onCounter ? document.getElementById('wal') : document.getElementById('cin')).appendChild(el);
  const s = shopSum(); document.getElementById('csum').textContent = s;
  Sound.tap && Sound.tap();
  if (onCounter) return;
  if (s > K.t.p) Voice.say('Многовато! Убери монетку.', 'so');   /* Сорока считает вслух; больше цены — подсказывает */
  else Voice.say(String(s), 'so');
};
/* После второй ошибки Сорока сама выкладывает верные монетки */
function shopSolve(t) {
  const wal = document.getElementById('wal'), cin = document.getElementById('cin');
  [...cin.children].forEach(c => wal.appendChild(c));
  const btns = [...wal.querySelectorAll('.coin')];
  for (const i of t.sol) { const b = btns.find(x => +x.dataset.i === i); if (b) cin.appendChild(b); }
  document.getElementById('csum').textContent = shopSum();
}
/* Игрушка — подарок в Домик Жёлудика. true — если новая */
function shopGift(id) {
  S.toys = S.toys || [];
  if (S.toys.includes(id)) return false;
  S.toys.push(id); return true;
}
