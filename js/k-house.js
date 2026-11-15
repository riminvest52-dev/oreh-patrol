/* «Домик Жёлудика» (задание 10, п. 3): на что тратить орешки.
   Лиза покупает мебель и украшения (15 вещей, 10–60 орешков) и сама расставляет их перетаскиванием.
   Перед покупкой Жёлудик считает вслух: «У тебя 45 орешков. Кровать стоит 30. Останется 15».
   Число говорится кусочками (300 + 40 + 5), поэтому подходит любое количество орешков.
   Хранение: S.house = { own: [id], pos: { id: { x, y, ts } } } — x, y в процентах комнаты; игрушки из Лавки Сороки (S.toys) — ключ 't:id'.
   Слияние с облаком: mergeStates (state.js) — купленное объединяется, у каждой вещи берётся более свежее место;
   орешки пересчитываются как «заработано − наклейки − вещи в домике». */
'use strict';

const HOUSE_ITEMS = [
  { id: 'chair', e: '🪑', p: 10, say: 'Стул стоит', s: 1.2 }, { id: 'plant', e: '🪴', p: 10, say: 'Цветок стоит', s: 1.2 },
  { id: 'yarn', e: '🧶', p: 10, say: 'Клубок стоит', s: .9 }, { id: 'picture', e: '🖼️', p: 15, say: 'Картина стоит', s: 1.3 },
  { id: 'lamp', e: '💡', p: 15, say: 'Лампа стоит', s: 1 }, { id: 'books', e: '📚', p: 15, say: 'Книжки стоят', s: 1 },
  { id: 'clock', e: '🕰️', p: 20, say: 'Часы стоят', s: 1.1 }, { id: 'lantern', e: '🏮', p: 20, say: 'Фонарик стоит', s: 1 },
  { id: 'window', e: '🪟', p: 25, say: 'Окошко стоит', s: 1.8 }, { id: 'mirror', e: '🪞', p: 25, say: 'Зеркало стоит', s: 1.4 },
  { id: 'bed', e: '🛏️', p: 30, say: 'Кровать стоит', s: 2 }, { id: 'tree', e: '🎄', p: 35, say: 'Ёлочка стоит', s: 1.8 },
  { id: 'sofa', e: '🛋️', p: 40, say: 'Диван стоит', s: 2 }, { id: 'fish', e: '🐠', p: 45, say: 'Аквариум стоит', s: 1.3, box: true },
  { id: 'piano', e: '🎹', p: 60, say: 'Пианино стоит', s: 1.8 }
];
const HITEM = Object.fromEntries(HOUSE_ITEMS.map(x => [x.id, x]));
/* Сколько орешков ушло на домик (для слияния с облаком) */
const houseSpent = st => ((st.house && st.house.own) || []).reduce((s, id) => s + (HITEM[id] ? HITEM[id].p : 0), 0);
const houseOf = () => { if (!S.house || typeof S.house !== 'object') S.house = { own: [], pos: {} }; S.house.own = S.house.own || []; S.house.pos = S.house.pos || {}; return S.house; };

/* Число кусочками для озвучки: 345 → ['300', '40', '5'], 12 → ['12'] (каждый кусочек — своя запись) */
function numParts(n) {
  n = Math.max(0, Math.floor(n));
  if (n <= 20) return [String(n)];
  const out = [];
  if (n >= 1000) { out.push(String(Math.floor(n / 1000) * 1000)); n %= 1000; }
  if (n >= 100) { out.push(String(Math.floor(n / 100) * 100)); n %= 100; }
  if (n > 20) { out.push(String(Math.floor(n / 10) * 10)); n %= 10; }
  if (n) out.push(String(n));
  return out;
}
const nutsWord = n => pl(n, 'орешек', 'орешка', 'орешков');

/* Места по умолчанию: вещь «знает», где ей стоять (пол / стена) — потом Лиза переставит */
const SPOT = { chair: [62, 70], plant: [88, 66], yarn: [48, 82], picture: [38, 22], lamp: [74, 52], books: [24, 74], clock: [60, 18], lantern: [86, 22],
  window: [16, 24], mirror: [80, 28], bed: [30, 66], tree: [90, 58], sofa: [52, 66], fish: [70, 44], piano: [14, 64] };
const toySpot = i => [44 + (i % 6) * 8, 88 - Math.floor(i / 6) * 7];

let HB = null;   /* открытая покупка */
function showHouse() {
  K = null; if (typeof PT !== 'undefined') PT = null; Voice.stop();
  const H = houseOf(), toys = (S.toys || []).filter(id => SHOP_TOYS.some(t => t.id === id));
  /* Новые вещи и игрушки встают на свои места */
  H.own.forEach(id => { if (!H.pos[id]) { const [x, y] = SPOT[id] || [50, 60]; H.pos[id] = { x, y, ts: Date.now() }; } });
  toys.forEach((id, i) => { const k = 't:' + id; if (!H.pos[k]) { const [x, y] = toySpot(i); H.pos[k] = { x, y, ts: Date.now() }; } });
  const item = (k, e, s) => `<div class="hitem${HITEM[k] && HITEM[k].box ? ' box' : ''}" data-k="${k}" style="left:${H.pos[k].x}%;top:${H.pos[k].y}%;--s:${s}">${e}</div>`;
  const placed = H.own.map(id => item(id, HITEM[id].e, HITEM[id].s)).join('') + toys.map(id => item('t:' + id, SHOP_TOYS.find(t => t.id === id).e, .9)).join('');
  const cards = HOUSE_ITEMS.filter(x => !H.own.includes(x.id)).map(x => `<button class="hcard${S.acorns < x.p ? ' dim' : ''}" data-act="hPick" data-id="${x.id}">
      <span class="he">${x.e}</span><span class="hp">${x.p} ${ART.acorn(18)}</span></button>`).join('');
  mountKid(`<div class="playtop"><button class="iconbtn" data-act="map" aria-label="На полянку">✕</button><div class="grow"><b>Домик Жёлудика</b></div>
      <span class="pill">${ART.acorn(22)}<span id="hac">${S.acorns}</span></span></div>
    <div class="hwrap">
      <div class="hroom" id="hroom"><div class="hwall"></div><div class="hfloor"></div>
        <div class="hzhel">${ART.zhel('happy')}</div>${placed}
        ${!H.own.length && !toys.length ? '<div class="hempty">Пока пусто. Выбери вещь внизу 👇</div>' : ''}</div>
      <div class="hshop"><div class="small muted hcap">${cards ? 'Нажми на вещь, чтобы купить:' : 'Всё куплено! Ура!'}</div><div class="hcards">${cards}</div>
        ${toys.length ? '' : '<div class="small muted hcap">🛍️ Игрушки из Лавки Сороки тоже попадут сюда.</div>'}</div>
    </div>`);
  houseDrag();
  Voice.prefetch('k_house_room');
  Voice.say('Это мой домик! Покупай вещи за орешки и ставь их, куда хочешь.', 'zh');
}
ACT.house = () => showHouse();

/* Покупка: Жёлудик говорит, сколько есть, сколько стоит и сколько останется */
ACT.hPick = el => {
  const x = HITEM[el.dataset.id]; if (!x || houseOf().own.includes(x.id)) return;
  const a = S.acorns, ok = a >= x.p;
  HB = x.id;
  modal(`<div class="hbuy"><div class="hbig">${x.e}</div>
    <p class="hcalc">У тебя <b>${a}</b> ${ART.acorn(20)} · стоит <b>${x.p}</b> ${ok ? `· останется <b>${a - x.p}</b>` : `· нужно ещё <b>${x.p - a}</b>`}</p>
    <div class="stack">${ok ? `<button class="btn green block big" data-act="hBuy">Купить ✓</button>` : ''}<button class="btn ghost block big" data-act="hNo">${ok ? 'Не сейчас' : 'Понятно'}</button></div></div>`);
  const say = ['У тебя', ...numParts(a), nutsWord(a), x.say, ...numParts(x.p)];
  Voice.say(ok ? say.concat(['Останется', ...numParts(a - x.p)]) : say.concat(['Нужно ещё', ...numParts(x.p - a), nutsWord(x.p - a), 'Реши задания — и орешков станет больше!']), 'zh');
};
ACT.hNo = () => { HB = null; closeModal(); Voice.stop(); };
ACT.hBuy = () => {
  const x = HITEM[HB]; HB = null; closeModal();
  if (!x || S.acorns < x.p || houseOf().own.includes(x.id)) return;
  S.acorns -= x.p; houseOf().own.push(x.id);
  save(); Sound.coin && Sound.coin(); confetti(14);
  showHouse();
  Voice.say('Ура! Новая вещь в домике! Перетащи её, куда хочешь.', 'zh');
};

/* Перетаскивание пальцем: вещь остаётся в пределах комнаты, место сохраняется */
function houseDrag() {
  const room = document.getElementById('hroom'); if (!room) return;
  room.querySelectorAll('.hitem').forEach(el => {
    el.addEventListener('pointerdown', e => {
      e.preventDefault();
      const r = room.getBoundingClientRect(), k = el.dataset.k;
      el.setPointerCapture(e.pointerId); el.classList.add('drag');
      const move = ev => {
        const x = Math.min(96, Math.max(4, (ev.clientX - r.left) / r.width * 100)), y = Math.min(94, Math.max(8, (ev.clientY - r.top) / r.height * 100));
        el.style.left = x + '%'; el.style.top = y + '%'; el._xy = [x, y];
      };
      const up = () => {
        el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('drag');
        if (el._xy) { houseOf().pos[k] = { x: Math.round(el._xy[0] * 10) / 10, y: Math.round(el._xy[1] * 10) / 10, ts: Date.now() }; save(); el._xy = null; }
      };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  });
}

/* Фразы Домика — для озвучки (dev/voice/phrases.html) */
function housePhrases() {
  const out = ['Это мой домик! Покупай вещи за орешки и ставь их, куда хочешь.', 'Ура! Новая вещь в домике! Перетащи её, куда хочешь.', 'У тебя', 'Останется', 'Нужно ещё',
    'Реши задания — и орешков станет больше!', 'орешек', 'орешка', 'орешков', ...HOUSE_ITEMS.map(x => x.say)];
  for (let n = 0; n <= 20; n++) out.push(String(n));
  for (let n = 30; n <= 90; n += 10) out.push(String(n));
  for (let n = 100; n <= 900; n += 100) out.push(String(n));
  for (let n = 1000; n <= 9000; n += 1000) out.push(String(n));
  return out;
}
