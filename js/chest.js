/* Задание 11, часть 3: «Сундук-сюрприз».
   Выпадает после хорошей серии (5 верных с первой попытки подряд или уровень без ошибок) с вероятностью 30%,
   не больше 2 раз за запуск игры и не реже 1 раза в 3 запуска (если две прошлые игры с сериями прошли без сундука — выпадает точно).
   Не продаётся за орешки и не связан с деньгами. Орешки за задания не меняются.
   Внутри — одно из: наклейка (наборы по 12 на мир), вещь в Домик (Лиза) или трофей (Настя), наряд героя (8 штук, виден на аватаре),
   секретная страница истории (бонус-реплика к открытой главе — js/story.js).
   Хранение: S.coll — id полученного ('st:мир:i', 'h:id', 'tr:id', 'w:герой:id', 'sec:мир:i'), S.wear — что надето, S.chest — счётчики запусков. */
'use strict';

const CHEST_P = 0.3, CHEST_MAX = 2;
const CHEST_STK = {
  kid: [['🦊', 'Лисичка'], ['🐻', 'Медвежонок'], ['🐰', 'Зайка'], ['🦉', 'Совушка'], ['🐿️', 'Бельчонок'], ['🦔', 'Ёжик'], ['🐸', 'Лягушонок'], ['🐞', 'Божья коровка'], ['🦋', 'Бабочка'], ['🐌', 'Улитка'], ['🍄', 'Грибок'], ['🌻', 'Подсолнух']],
  five: [['🔭', 'Телескоп'], ['🧭', 'Компас'], ['🗺️', 'Карта сокровищ'], ['🔍', 'Лупа сыщика'], ['📐', 'Угольник'], ['🧮', 'Счёты'], ['🪐', 'Сатурн'], ['☄️', 'Комета'], ['🧪', 'Пробирка'], ['🎯', 'Точно в цель'], ['🦫', 'Бобрёнок Плотник'], ['🕵️', 'Детектив']],
  four: [['🍁', 'Кленовый лист'], ['🏕️', 'Палатка'], ['🛶', 'Каноэ'], ['🎒', 'Рюкзак'], ['🔦', 'Фонарик'], ['🧣', 'Тёплый шарф'], ['❄️', 'Снежинка'], ['🌰', 'Запас на зиму'], ['🍯', 'Мёд'], ['🧤', 'Варежки'], ['🦌', 'Олень'], ['⛄', 'Снеговик']]
};
const CHEST_HOUSE = [['bear', '🧸', 'Плюшевый мишка'], ['balloon', '🎈', 'Воздушный шарик'], ['kite', '🪁', 'Воздушный змей'], ['horse', '🎠', 'Лошадка'],
  ['yoyo', '🪀', 'Йо-йо'], ['gift', '🎁', 'Подарок'], ['kitten', '🐱', 'Котёнок'], ['globe', '🌍', 'Глобус']];
const CHEST_TROPHY = [['cup', '🏆', 'Кубок патруля'], ['gold', '🥇', 'Золотая медаль'], ['order', '🎖️', 'Орден смекалки'], ['key', '🗝️', 'Старинный ключ'],
  ['scroll', '📜', 'Свиток мудрости'], ['spy', '🔭', 'Подзорная труба'], ['gem', '💎', 'Кристалл'], ['hour', '⏳', 'Песочные часы'], ['feather', '🪶', 'Перо Сороки']];
/* Наряды: где на аватаре — top (на голове), eyes, neck */
const CHEST_WEAR = [['cap', '🧢', 'Кепка', 'top'], ['crown', '👑', 'Корона', 'top'], ['tophat', '🎩', 'Цилиндр', 'top'], ['bow', '🎀', 'Бантик', 'top'],
  ['glasses', '👓', 'Очки', 'eyes'], ['shades', '🕶️', 'Тёмные очки', 'eyes'], ['scarf', '🧣', 'Шарф', 'neck'], ['medal', '🏅', 'Медаль', 'neck']];
const CHEST_SAY = {
  open: 'Ого! Сундук-сюрприз! Посмотрим, что внутри.',
  st: 'Тебе новая наклейка!', h: 'Новая вещь для домика!', w: 'Наряд для Жёлудика!', sec: 'Секретная страница истории! Загляни в лес.',
  wearOn: 'Красиво! Мне очень идёт.'
};

const heroKey = () => (curProfile() || {}).hero || (worldOf() === 'kid' ? 'zhel' : 'funduk');
const chestOf = st => { const c = st.chest = st.chest && typeof st.chest === 'object' ? st.chest : {}; c.miss = c.miss || 0; return c; };

/* ---------- Решение «выпал ли сундук» (чистая функция — проверяется в dev/test-merge.html) ----------
   c — S.chest, sid — номер этого запуска игры, rnd — случайное число 0..1. */
function chestRoll(c, sid, rnd) {
  if (c.cur !== sid) {   /* первая хорошая серия в этом запуске: подводим итог прошлого */
    if (c.cur) c.miss = c.got ? 0 : (c.miss || 0) + 1;
    c.cur = sid; c.got = 0;
  }
  if (c.got >= CHEST_MAX) return false;
  const sure = !c.got && (c.miss || 0) >= 2;   /* две прошлые игры без сундука — в этой точно */
  if (!sure && rnd >= CHEST_P) return false;
  c.got++; c.miss = 0;
  return true;
}
const CHEST_SID = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
let CHEST_PEND = null;
/* Хорошая серия: вызывается из kid.js / play.js */
function chestEvent() {
  if (CHEST_PEND) return;
  const c = chestOf(S);
  if (chestRoll(c, CHEST_SID, Math.random())) { c.ts = Date.now(); CHEST_PEND = chestPrize(); save(); }
  else { c.ts = Date.now(); save(); }
}

/* ---------- Что в сундуке ---------- */
function chestPools() {
  const w = worldOf(), kid = w === 'kid', hero = heroKey(), pools = [];
  const st = (CHEST_STK[w] || []).map((x, i) => 'st:' + w + ':' + i).filter(id => !hasColl(id));
  const thing = (kid ? CHEST_HOUSE.map(x => 'h:' + x[0]) : CHEST_TROPHY.map(x => 'tr:' + x[0])).filter(id => !hasColl(id));
  const wear = CHEST_WEAR.map(x => 'w:' + hero + ':' + x[0]).filter(id => !hasColl(id));
  let sec = [];
  if (typeof STORY !== 'undefined' && STORY[w] && typeof forestNews === 'function') {
    const open = forestNews(S, w).open;
    sec = STORY[w].chapters.map((_, i) => 'sec:' + w + ':' + i).filter((id, i) => i < open && !hasColl(id));
  }
  for (const p of [st, thing, wear, sec]) if (p.length) pools.push(p);
  return pools;
}
function chestPrize() {
  const pools = chestPools(); if (!pools.length) return { id: null };
  const pool = R.pick(pools);
  return { id: pool[0].startsWith('sec:') ? pool[0] : R.pick(pool) };   /* секретные страницы — по порядку глав */
}
function chestInfo(id) {
  if (!id) return { e: '🌰', name: 'Всё уже собрано! Ты молодец!', kind: 'none' };
  const [k, a, b] = id.split(':');
  if (k === 'st') { const x = (CHEST_STK[a] || [])[+b] || ['⭐', 'Наклейка']; return { e: x[0], name: 'Наклейка «' + x[1] + '»', kind: 'st' }; }
  if (k === 'h') { const x = CHEST_HOUSE.find(y => y[0] === a) || ['', '🎁', 'Вещь']; return { e: x[1], name: x[2] + ' — в Домик Жёлудика', kind: 'h' }; }
  if (k === 'tr') { const x = CHEST_TROPHY.find(y => y[0] === a) || ['', '🏆', 'Трофей']; return { e: x[1], name: 'Трофей: ' + x[2], kind: 'tr' }; }
  if (k === 'w') { const x = CHEST_WEAR.find(y => y[0] === b) || ['', '🎀', 'Наряд']; return { e: x[1], name: 'Наряд: ' + x[2], kind: 'w' }; }
  if (k === 'sec') { const c = STORY[a] && STORY[a].chapters[+b]; return { e: '📜', name: 'Секретная страница к главе «' + (c ? c.t : b) + '»', kind: 'sec' }; }
  if (k === 'fam') { const m = typeof MISSIONS !== 'undefined' && MISSIONS.find(y => y.id === a); return { e: m ? m.e : '🤝', name: 'Семейная наклейка: ' + (m ? m.t : a), kind: 'fam' }; }
  return { e: '🎁', name: id, kind: k };
}

/* ---------- Открытие: крышка, блеск, 2 секунды. Без рулетки ---------- */
const CHEST_SVG = `<svg class="chsvg" viewBox="0 0 200 170" aria-hidden="true">
  <ellipse cx="100" cy="160" rx="72" ry="7" fill="#5B3418" opacity=".18"/>
  <rect x="30" y="78" width="140" height="78" rx="10" fill="#B9773A" stroke="#5B3418" stroke-width="4"/>
  <rect x="30" y="100" width="140" height="10" fill="#8A5326"/><rect x="88" y="94" width="24" height="30" rx="5" fill="#F2C53D" stroke="#5B3418" stroke-width="3"/>
  <g class="chlid"><path d="M30 80 Q30 34 100 34 Q170 34 170 80Z" fill="#C9853F" stroke="#5B3418" stroke-width="4"/><path d="M60 40 V80 M140 40 V80" stroke="#8A5326" stroke-width="6"/></g>
</svg>`;
function chestShow(after) {
  const P = CHEST_PEND; CHEST_PEND = null;
  if (!P) return after();
  const kid = worldOf() === 'kid', I = chestInfo(P.id);
  if (P.id) addColl(P.id);
  save();
  Sound.ok();
  if (kid) Voice.say(CHEST_SAY.open, 'zh');
  ACT.chestGo = () => { closeModal(); after(); };
  modal(`<div class="chest center"><h2>🎁 Сундук-сюрприз!</h2>
    <div class="chbox">${CHEST_SVG}<div class="chglow"></div><div class="chitem">${I.e}</div></div>
    <p class="chname">${esc(I.name)}</p>
    <button class="btn green block big chbtn" data-act="chestGo">${kid ? 'Ура! Дальше ➜' : 'Здорово! Дальше →'}</button></div>`);
  setTimeout(() => {
    const m = document.querySelector('.chest'); if (!m) return;
    m.classList.add('open'); Sound.win(); confetti(18);
    if (kid) setTimeout(() => { if (document.querySelector('.chest')) Voice.say(CHEST_SAY[I.kind] || CHEST_SAY.st, 'zh'); }, 400);
  }, 900);
}
/* Показываем между заданиями: при «Дальше» после серии */
(() => {
  for (const k of ['kNext', 'next']) {
    const orig = ACT[k]; if (!orig) continue;
    ACT[k] = el => CHEST_PEND ? chestShow(() => orig(el)) : orig(el);
  }
})();

/* ---------- Наряд на аватаре ---------- */
function wearHtml(hero = heroKey()) {
  const id = S.wear && S.wear[hero], x = id && CHEST_WEAR.find(y => y[0] === id);
  return x && hasColl('w:' + hero + ':' + id) ? `<span class="wear w-${x[3]}">${x[1]}</span>` : '';
}
function wearAvatar() {
  const a = document.querySelector('.topbar .avatar'); if (!a || a.querySelector('.wear')) return;
  a.insertAdjacentHTML('beforeend', wearHtml());
}
ACT.wear = el => {
  const hero = heroKey(), id = el.dataset.id;
  S.wear = Object.assign({}, S.wear, { [hero]: S.wear && S.wear[hero] === id ? null : id, ts: Date.now() });
  save();
  if (S.wear[hero] && worldOf() === 'kid') Voice.say(CHEST_SAY.wearOn, 'zh');
  showAlbum();
};

/* ---------- Раздел «Сюрпризы из сундука» в альбоме ---------- */
function chestAlbum() {
  const w = worldOf(), kid = w === 'kid', hero = heroKey();
  const stk = (CHEST_STK[w] || []).map((x, i) => { const has = hasColl('st:' + w + ':' + i); return `<div class="stk ${has ? '' : 'no'}"><div class="e">${has ? x[0] : '🎁'}</div><div class="n">${has ? esc(x[1]) : '???'}</div></div>`; }).join('');
  const things = (kid ? CHEST_HOUSE.map(x => ['h:' + x[0], x[1], x[2]]) : CHEST_TROPHY.map(x => ['tr:' + x[0], x[1], x[2]]))
    .map(([id, e, n]) => hasColl(id) ? `<div class="stk"><div class="e">${e}</div><div class="n">${esc(n)}</div></div>` : `<div class="stk no"><div class="e">🎁</div><div class="n">???</div></div>`).join('');
  const on = S.wear && S.wear[hero];
  const wear = CHEST_WEAR.map(([id, e, n]) => hasColl('w:' + hero + ':' + id)
    ? `<button class="stk wbtn${on === id ? ' on' : ''}" data-act="wear" data-id="${id}"><div class="e">${e}</div><div class="n">${esc(n)}</div><div class="small muted">${on === id ? 'надето ✓' : 'надеть'}</div></button>`
    : `<div class="stk no"><div class="e">🎁</div><div class="n">???</div></div>`).join('');
  const fam = (S.coll || []).filter(id => id.startsWith('fam:')).map(id => { const I = chestInfo(id); return `<div class="stk"><div class="e">${I.e}</div><div class="n">${esc(I.name.replace('Семейная наклейка: ', ''))}</div></div>`; }).join('');
  const secN = (S.coll || []).filter(id => id.startsWith('sec:' + w + ':')).length;
  return `<h3 style="margin-top:18px">🎁 Сюрпризы из сундука</h3><p class="small muted">Сундук иногда выпадает после хорошей серии ответов. Его нельзя купить — только найти!</p>
    <div class="album">${stk}</div>
    <h3>${kid ? '🏠 Вещи для домика' : '🏆 Трофеи штаба'}</h3><div class="album">${things}</div>
    <h3>👒 Наряды героя</h3><div class="album">${wear}</div>
    ${fam ? `<h3>🤝 Семейные наклейки</h3><div class="album">${fam}</div>` : ''}
    <p class="small muted">📜 Секретных страниц истории: ${secN}${STORY[w] ? ' из ' + STORY[w].chapters.length : ''}</p>`;
}

/* Вещи из сундука в Домике Жёлудика (ставятся рядом с игрушками) */
function chestHouseItems() { return CHEST_HOUSE.filter(x => hasColl('h:' + x[0])).map((x, i) => ({ k: 'c:' + x[0], e: x[1], spot: [20 + (i % 4) * 9, 46 + Math.floor(i / 4) * 10] })); }

/* Фразы для озвучки */
function chestPhrases() { return Object.values(CHEST_SAY).map(t => ['zh', t, 'chest']); }

/* Тест частоты (dev/test-merge.html): ≤2 за запуск, не реже 1 раза в 3 запуска, в среднем около 30% серий */
function chestTests(check) {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const c = {}; let maxPer = 0, worstGap = 0, gap = 0, drops = 0, tries = 0;
  for (let s = 1; s <= 3000; s++) {
    const series = 1 + Math.floor(rnd() * 6); let got = 0;
    for (let k = 0; k < series; k++) { tries++; if (chestRoll(c, 's' + s, rnd())) { got++; drops++; } }
    maxPer = Math.max(maxPer, got); gap = got ? 0 : gap + 1; worstGap = Math.max(worstGap, gap);
  }
  check('сундук: не больше 2 за запуск', maxPer <= 2, maxPer);
  check('сундук: не реже 1 раза в 3 запуска', worstGap <= 2, worstGap);
  check('сундук: в среднем примерно 30% серий', drops / tries > 0.22 && drops / tries < 0.4, drops / tries);
  const c2 = {}; chestRoll(c2, 'a', 0.9); chestRoll(c2, 'b', 0.9);
  check('сундук: после двух пустых запусков — точно', chestRoll(c2, 'c', 0.99) === true, c2);
}
