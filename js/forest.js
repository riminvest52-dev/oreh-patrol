/* «Лес оживает» (задание 11, часть 1): у каждого мира своя картина леса из оживающих объектов (SVG-слои).
   Объект оживает за мастерство (уголок на 3 звезды, медаль, пройденная тема), а не за время — таблица FOREST_EV.
   Уже заработанное засчитывается сразу. Новые объекты оживают на экране «Мой лес»: анимация ~2,5 с и фраза героя.
   Главы истории (js/story.js) открываются по числу оживших объектов (FOREST_CH) и читаются по порядку.
   Хранение: S.forest = { seen: [id] — уже показанные оживания, read: [номер главы] }. Слияние — объединение (state.js). */
'use strict';

const worldOf = () => (typeof curProfile === 'function' && curProfile() || {}).world || 'five';
const forestOf = st => { if (!st.forest || typeof st.forest !== 'object') st.forest = { seen: [], read: [] }; st.forest.seen = st.forest.seen || []; st.forest.read = st.forest.read || []; return st.forest; };

/* ---------- События мастерства ---------- */
const kidStars = (st, id) => (st.stars || {})[id] || 0;
const step2Medals = st => Object.keys(st.medals || {}).filter(k => /#2$/.test(k)).length;
const schoolTopics = () => TOPICS.filter(t => !t.act && t.id !== 'year');
const passedN = st => schoolTopics().filter(t => ((st.stars || {})[t.id + ':3'] || 0) >= 2).length;
const medalsN = st => schoolTopics().filter(t => (st.medals || {})[t.id]).length;
const part = k => Math.max(1, Math.round(schoolTopics().length * k / 10));   /* k десятых от всех тем мира */
const FOREST_EV = {
  kid: [
    ['sun', st => kidStars(st, 'k_cnt') >= 3, 'Считалочка на 3 звезды'], ['flowers', st => kidStars(st, 'k_dig') >= 3, 'Цифры на 3 звезды'],
    ['birds', st => kidStars(st, 'k_cmp') >= 3, '«Больше и меньше» на 3 звезды'], ['stream', st => kidStars(st, 'k_line') >= 3, 'Числовая дорожка на 3 звезды'],
    ['house', st => kidStars(st, 'k_house') >= 3, 'Домики чисел на 3 звезды'], ['berries', st => kidStars(st, 'k_add') >= 3, '«Плюс и минус» на 3 звезды'],
    ['swing', st => kidStars(st, 'k_shape') >= 3, 'Фигуры на 3 звезды'], ['butterflies', st => kidStars(st, 'k_where') >= 3, '«Где что стоит» на 3 звезды'],
    ['mushrooms', st => kidStars(st, 'k_logic') >= 3, 'Логика на 3 звезды'], ['oak', st => kidStars(st, 'k_path') >= 3, 'Тропинка к дубу на 3 звезды'],
    ['hollow', st => kidStars(st, 'k_shop') >= 3, 'Лавка Сороки на 3 звезды'], ['pond', st => ((st.house || {}).own || []).length >= 3, '3 вещи в Домике Жёлудика'],
    ['bridge', st => step2Medals(st) >= 2, '2 медали Ступеньки 2'], ['lanterns', st => step2Medals(st) >= 4, '4 медали Ступеньки 2'],
    ['rainbow', st => step2Medals(st) >= 6, '6 медалей Ступеньки 2'], ['fireflies', st => kidStars(st, 'k_path#2') >= 3, 'Вторая тропинка на 3 звезды']],
  five: [
    ['sun', st => !!st.diag, 'Проверка сил'], ['stream', st => passedN(st) >= 1, 'Первая тема пройдена'], ['flowers', st => (st.streak || {}).best >= 3, '3 дня подряд'],
    ['birds', st => passedN(st) >= part(2), () => `Пройдено тем: ${part(2)}`], ['bridge', st => medalsN(st) >= 1, 'Первая медаль Испытания'],
    ['hollow', st => passedN(st) >= part(3), () => `Пройдено тем: ${part(3)}`], ['lanterns', st => passedN(st) >= part(4), () => `Пройдено тем: ${part(4)}`],
    ['pond', st => medalsN(st) >= 2, '2 медали Испытаний'], ['berries', st => passedN(st) >= part(5), () => `Пройдено тем: ${part(5)}`],
    ['butterflies', st => passedN(st) >= part(6), () => `Пройдено тем: ${part(6)}`], ['house', st => medalsN(st) >= 4, '4 медали Испытаний'],
    ['swing', st => passedN(st) >= part(7), () => `Пройдено тем: ${part(7)}`], ['mushrooms', st => passedN(st) >= part(8), () => `Пройдено тем: ${part(8)}`],
    ['oak', st => !!st.year && st.year.best >= st.year.total * 0.7, 'Большая проверка года на 70%'],
    ['rainbow', st => passedN(st) >= part(10), 'Все темы года пройдены'], ['fireflies', st => medalsN(st) >= Math.max(6, part(5)), () => `Медалей Испытаний: ${Math.max(6, part(5))}`]],
  four: [
    ['sun', st => !!st.diag, 'Проверка сил'], ['stream', st => passedN(st) >= 1, 'Первая тема пройдена'],
    ['birds', st => typeof mulCount === 'function' && mulCount(st).know + mulCount(st).gold >= 16, '16 примеров таблицы выучено'],
    ['bridge', st => medalsN(st) >= 1, 'Первая медаль Испытания'], ['flowers', st => passedN(st) >= part(3), () => `Пройдено тем: ${part(3)}`],
    ['hollow', st => typeof mulCount === 'function' && mulCount(st).know + mulCount(st).gold >= 40, '40 примеров таблицы выучено'],
    ['berries', st => passedN(st) >= part(5), () => `Пройдено тем: ${part(5)}`], ['lanterns', st => !!st.vpr && st.vpr.best >= 12, 'ВПР-тренировка: 12 верных'],
    ['pond', st => medalsN(st) >= 3, '3 медали Испытаний'], ['oak', st => passedN(st) >= part(10), 'Все темы пройдены'],
    ['rainbow', st => !!(st.medals || {}).mulgold, 'Золотое дерево умножения'], ['fireflies', st => medalsN(st) >= 6, '6 медалей Испытаний']]
};
/* Глава i открывается, когда оживших объектов не меньше FOREST_CH[мир][i] (и прочитана предыдущая) */
const FOREST_CH = { kid: [0, 2, 4, 6, 8, 10, 12, 14, 16], five: [0, 2, 4, 6, 8, 10, 12, 14, 16], four: [0, 2, 4, 7, 10, 12] };
/* Фраза героя, когда объект оживает */
const FOREST_SAY = {
  sun: 'Смотри! Солнышко проснулось!', flowers: 'Ура! Цветы раскрылись!', birds: 'Слышишь? Птицы вернулись!', stream: 'Смотри! Ручей снова побежал!',
  house: 'В домике ёжика зажёгся свет!', berries: 'Ягоды поспели!', swing: 'Качели снова качаются!', butterflies: 'Бабочки прилетели!',
  mushrooms: 'Выросли грибы-домики!', oak: 'Старый дуб зазеленел!', hollow: 'В дупле зажёгся огонёк!', pond: 'В пруду заплескались рыбки!',
  bridge: 'Через ручей появился мост!', lanterns: 'Зажглись фонарики!', rainbow: 'Над лесом радуга!', fireflies: 'Светлячки затанцевали!'
};
const FOREST_NAME = { sun: '☀️ Солнышко', flowers: '🌼 Цветы', birds: '🐦 Птицы', stream: '💧 Ручей', house: '🏡 Домик ёжика', berries: '🍓 Ягоды', swing: '🪢 Качели',
  butterflies: '🦋 Бабочки', mushrooms: '🍄 Грибы-домики', oak: '🌳 Старый дуб', hollow: '🕯️ Огонёк в дупле', pond: '🐟 Пруд', bridge: '🌉 Мост', lanterns: '🏮 Фонарики',
  rainbow: '🌈 Радуга', fireflies: '✨ Светлячки' };
/* Кто говорит в каждом мире */
const FOREST_WHO = { kid: 'zh', five: 'fu', four: 'sh' };

function forestAlive(st, world) { return (FOREST_EV[world] || []).filter(([, test]) => { try { return !!test(st); } catch (e) { return false; } }).map(([id]) => id); }
const forestHint = ev => typeof ev[2] === 'function' ? ev[2]() : ev[2];
/* Сколько глав можно читать: открытые по числу объектов и по порядку */
function chaptersOpen(st, world) {
  const alive = forestAlive(st, world).length, read = forestOf(st).read, th = FOREST_CH[world] || [];
  let n = 0;
  while (n < th.length && alive >= th[n] && (n === 0 || read.includes(n - 1))) n++;
  return n;
}
/* Есть что показать: новые объекты или непрочитанная открытая глава */
function forestNews(st, world) {
  const F0 = forestOf(st), alive = forestAlive(st, world), fresh = alive.filter(id => !F0.seen.includes(id));
  const open = chaptersOpen(st, world), unread = Array.from({ length: open }, (_, i) => i).filter(i => !F0.read.includes(i));
  return { alive, fresh, open, unread };
}
/* Первый запуск: всё уже заработанное считается показанным (лес сразу живой), первая глава ждёт */
function forestInit() {
  const F0 = forestOf(S);
  if (!F0.init) { F0.seen = forestAlive(S, worldOf()); F0.init = 1; save(); }
}

/* ---------- Картина леса: viewBox 1000×560, объекты — слои <g data-o="id"> ---------- */
const INK = '#5B3418';
const FOREST_BG = {
  kid: ['#CDEBFF', '#EEF8FF', '#A8D98A', '#8CC66A', '#7DB85B'],
  five: ['#FFE0B8', '#FFF3E0', '#E7B66A', '#D39A4E', '#C88A40'],
  four: ['#D4F0E8', '#F2FBF8', '#9FD3A0', '#7FBF83', '#6CAF72']
};
const FOREST_ART = {
  sun: `<g transform="translate(860 92)"><g class="spin">${Array.from({ length: 10 }, (_, i) => `<rect x="-5" y="-82" width="10" height="24" rx="5" fill="#F6B73C" transform="rotate(${i * 36})"/>`).join('')}</g>
    <circle r="48" fill="#FFD25E" stroke="${INK}" stroke-width="4"/><circle cx="-16" cy="-6" r="5" fill="${INK}"/><circle cx="16" cy="-6" r="5" fill="${INK}"/><path d="M-16 14 Q0 28 16 14" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`,
  rainbow: `<g fill="none" stroke-width="16" opacity=".8">${['#E8604C', '#F5A33C', '#F6D55C', '#7CC06A', '#5AA9E6', '#8C6CD8'].map((c, i) => `<path d="M140 400 A ${360 - i * 16} ${300 - i * 16} 0 0 1 ${860} 400" transform="translate(0 ${i * 2})" stroke="${c}" />`).join('')}</g>`,
  birds: `<g fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" class="flap">${[[220, 120], [270, 90], [320, 130], [180, 160]].map(([x, y]) => `<path d="M${x - 22} ${y} q11 -14 22 0 q11 -14 22 0"/>`).join('')}</g>`,
  butterflies: `<g class="flap">${[[640, 210, '#F28AB2'], [700, 170, '#8CC0F5'], [600, 260, '#F6C84C']].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><ellipse cx="-11" cy="0" rx="12" ry="16" fill="${c}" stroke="${INK}" stroke-width="3"/><ellipse cx="11" cy="0" rx="12" ry="16" fill="${c}" stroke="${INK}" stroke-width="3"/><rect x="-3" y="-14" width="6" height="28" rx="3" fill="${INK}"/></g>`).join('')}</g>`,
  lanterns: `<g><path d="M60 196 Q240 260 420 200" stroke="${INK}" stroke-width="3" fill="none"/>${[[100, 214], [170, 232], [240, 238], [310, 230], [380, 212]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><line x1="0" y1="0" x2="0" y2="10" stroke="${INK}" stroke-width="3"/><rect x="-13" y="10" width="26" height="34" rx="10" fill="${['#F2643C', '#F6B73C', '#F2643C', '#F6B73C', '#F2643C'][i]}" stroke="${INK}" stroke-width="3"/><circle cy="27" r="7" fill="#FFF2B0" class="glow"/></g>`).join('')}</g>`,
  oak: `<g><ellipse cx="500" cy="200" rx="190" ry="120" fill="#6DB45A" stroke="${INK}" stroke-width="5"/><ellipse cx="410" cy="230" rx="90" ry="70" fill="#7FC56A"/><ellipse cx="590" cy="170" rx="90" ry="70" fill="#7FC56A"/>
    ${[[430, 170], [520, 140], [580, 230], [460, 250], [620, 200]].map(([x, y]) => `<g transform="translate(${x} ${y})"><ellipse rx="9" ry="11" fill="#B9762E" stroke="${INK}" stroke-width="2.5"/><path d="M-10 -5 Q0 -16 10 -5 Z" fill="#7A4A1E" stroke="${INK}" stroke-width="2.5"/></g>`).join('')}</g>`,
  hollow: `<g><path d="M480 400 v-40 a20 20 0 0 1 40 0 v40 z" fill="#3B2210" stroke="${INK}" stroke-width="4"/><circle cx="500" cy="372" r="9" fill="#FFD25E" class="glow"/></g>`,
  stream: `<path d="M0 470 C150 440 260 520 420 490 S700 450 820 490 S940 520 1000 500 L1000 540 C900 548 760 520 640 532 S300 560 160 520 S40 520 0 530 Z" fill="#7CC6F0" stroke="${INK}" stroke-width="4" class="flow"/>`,
  bridge: `<g><path d="M650 492 Q720 440 790 492" fill="none" stroke="#9A6438" stroke-width="16"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${656 + i * 22}" y="${470 - Math.sin((i + .5) / 6 * Math.PI) * 22}" width="18" height="22" rx="3" fill="#C89462" stroke="${INK}" stroke-width="3"/>`).join('')}</g>`,
  pond: `<g><ellipse cx="170" cy="470" rx="110" ry="34" fill="#8FD0F2" stroke="${INK}" stroke-width="4"/>${[[140, 466], [200, 474]].map(([x, y]) => `<g transform="translate(${x} ${y})" class="swim"><ellipse rx="16" ry="9" fill="#F59A3C" stroke="${INK}" stroke-width="2.5"/><path d="M14 0 l12 -8 v16 z" fill="#F59A3C" stroke="${INK}" stroke-width="2.5"/></g>`).join('')}</g>`,
  flowers: `<g>${[[290, 430, '#F28AB2'], [320, 444, '#F6D55C'], [350, 428, '#B98BE8'], [380, 446, '#F28AB2'], [260, 448, '#F6D55C']].map(([x, y, c]) => `<g transform="translate(${x} ${y})"><line y2="26" stroke="#4E8F3A" stroke-width="4"/>${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-9" rx="6" ry="9" fill="${c}" stroke="${INK}" stroke-width="2" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#F6B73C" stroke="${INK}" stroke-width="2"/></g>`).join('')}</g>`,
  berries: `<g><ellipse cx="890" cy="420" rx="70" ry="44" fill="#4E9A44" stroke="${INK}" stroke-width="4"/>${[[860, 404], [890, 420], [920, 400], [905, 438], [872, 432]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#E2394E" stroke="${INK}" stroke-width="2.5"/>`).join('')}</g>`,
  house: `<g><rect x="70" y="330" width="100" height="74" rx="8" fill="#F2D3A0" stroke="${INK}" stroke-width="4"/><path d="M56 336 L120 280 L184 336 Z" fill="#C9532A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="105" y="362" width="30" height="42" rx="6" fill="#9A6438" stroke="${INK}" stroke-width="3"/><rect x="80" y="348" width="18" height="18" fill="#FFE27A" stroke="${INK}" stroke-width="3" class="glow"/></g>`,
  mushrooms: `<g>${[[420, 440, 1], [450, 452, .7], [396, 456, .6]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-10" y="-6" width="20" height="30" rx="6" fill="#FFF3DC" stroke="${INK}" stroke-width="3"/><path d="M-30 -4 Q0 -46 30 -4 Z" fill="#E2483A" stroke="${INK}" stroke-width="3"/><circle cx="-10" cy="-16" r="4" fill="#fff"/><circle cx="10" cy="-20" r="4" fill="#fff"/></g>`).join('')}</g>`,
  swing: `<g class="sway"><line x1="600" y1="300" x2="590" y2="380" stroke="${INK}" stroke-width="3"/><line x1="650" y1="300" x2="640" y2="380" stroke="${INK}" stroke-width="3"/><rect x="578" y="378" width="74" height="10" rx="4" fill="#C9532A" stroke="${INK}" stroke-width="3"/></g>`,
  fireflies: `<g class="glow">${[[120, 300], [260, 360], [560, 290], [720, 330], [900, 300], [400, 330], [820, 380], [180, 250]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#FFF07A" stroke="#E2B43C" stroke-width="2"/>`).join('')}</g>`
};
/* Порядок слоёв: дальнее — раньше */
const FOREST_Z = ['rainbow', 'sun', 'birds', 'oak', 'lanterns', 'hollow', 'swing', 'butterflies', 'house', 'stream', 'bridge', 'pond', 'flowers', 'mushrooms', 'berries', 'fireflies'];
function forestSvg(world, alive, cls = '', hide = []) {
  const [s1, s2, h1, h2, g] = FOREST_BG[world] || FOREST_BG.five, ids = (FOREST_EV[world] || []).map(e => e[0]);
  const layers = FOREST_Z.filter(id => ids.includes(id)).map(id => `<g data-o="${id}" class="fo ${alive.includes(id) && !hide.includes(id) ? 'on' : 'off'}">${FOREST_ART[id]}</g>`).join('');
  return `<svg class="fsvg ${cls}" viewBox="0 0 1000 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Мой лес"><defs><linearGradient id="fsky${world}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s1}"/><stop offset="1" stop-color="${s2}"/></linearGradient></defs>
    <rect width="1000" height="560" fill="url(#fsky${world})"/>
    <path d="M0 380 C160 300 300 330 440 360 S760 290 1000 350 L1000 560 L0 560 Z" fill="${h1}"/><path d="M0 420 C200 380 380 420 560 410 S860 380 1000 420 L1000 560 L0 560 Z" fill="${h2}"/>
    <rect x="0" y="440" width="1000" height="120" fill="${g}"/>
    <path d="M478 440 L486 300 Q500 280 514 300 L522 440 Z" fill="#8A5530" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    ${layers}</svg>`;
}

/* ---------- Карточка на главном экране ---------- */
function forestCard() {
  const w = worldOf(); if (!FOREST_EV[w]) return '';
  forestInit();
  const N = forestNews(S, w), total = FOREST_EV[w].length, news = N.fresh.length || N.unread.length;
  return `<button class="fcard${news ? ' news' : ''}" data-act="forest">${forestSvg(w, N.alive.filter(id => !N.fresh.includes(id)), 'thumb')}
    <span class="fct"><b>🌳 Мой лес</b><span class="small">${N.alive.length} из ${total} ожило${news ? ' · <b class="fnew">✨ Новое!</b>' : ''}</span></span></button>`;
}

/* ---------- Экран «Мой лес» ---------- */
let FW = null;   /* идёт показ оживления */
const STORY_PIC = { zh: () => ART.zhel('happy'), so: () => ART.soroka('happy'), fu: () => ART.chip('funduk', 'happy', '', true), mi: () => ART.chip('mindal', 'happy', '', true),
  sh: () => ART.chip('shustrik', 'happy', '', true), ez: () => '<div class="ezpic">🦔</div>', nr: () => '<div class="ezpic">📖</div>' };
const STORY_NAME = { zh: 'Жёлудик', so: 'Сорока', fu: 'Фундук', mi: 'Миндалинка', sh: 'Шустрик', ez: 'Дедушка Ёж', nr: '' };
function showForest() {
  const w = worldOf(), N = forestNews(S, w), st = STORY[w], kid = w === 'kid';
  if (typeof K !== 'undefined') K = null; if (typeof PT !== 'undefined') PT = null; Voice.stop();
  const chapters = st.chapters.map((c, i) => {
    const open = i < N.open, read = forestOf(S).read.includes(i), need = (FOREST_CH[w][i] || 0) - N.alive.length;
    const lock = !open ? (need > 0 ? `🔒 оживи ещё ${need}` : '🔒 сначала прочитай прошлую') : read ? '✓ прочитано' : '✨ Новая глава!';
    return `<button class="fch${open ? '' : ' lock'}${open && !read ? ' new' : ''}" data-act="${open ? 'chapter' : 'chLock'}" data-i="${i}"><span class="fchn">${i + 1}</span><span><b>${open ? esc(c.t) : 'Глава ' + (i + 1)}</b><span class="small">${lock}</span></span></button>`;
  }).join('');
  const next = FOREST_EV[w].filter(e => !N.alive.includes(e[0])).slice(0, 3).map(e => `<li>${FOREST_NAME[e[0]]} — ${esc(forestHint(e))}</li>`).join('');
  (kid ? mountKid : mount)(`<div class="topbar"><button class="iconbtn" data-act="map" aria-label="Назад">←</button><div class="grow"><b>Мой лес</b><div class="small muted">${esc(st.title)} · ожило ${N.alive.length} из ${FOREST_EV[w].length}</div></div></div>
    <div class="fbig" id="fbig">${forestSvg(w, N.alive, '', N.fresh)}</div>
    <div class="fsay bubble" id="fsay">${N.fresh.length ? 'Смотри, что сейчас будет!' : N.unread.length ? 'Открылась новая глава истории! 📖' : next ? 'Решай задания — и лес оживёт ещё!' : 'Весь лес живой! Ура!'}</div>
    ${next ? `<details class="card fnext"${kid ? '' : ' open'}><summary class="small muted">Что оживёт дальше</summary><ul class="small">${next}</ul></details>` : ''}
    <h3 style="margin:14px 0 6px">📖 ${esc(st.title)}</h3><div class="fchs">${chapters}</div>`);
  Voice.prefetch('story_' + w);
  if (N.fresh.length) forestWake(N.fresh, w);
  else if (kid) Voice.say(N.unread.length ? 'Открылась новая глава! Нажми на неё.' : 'Это мой лес! Решай задания, и он оживёт ещё.', 'zh');
}
/* Оживление по одному: снятие серого, рост, блеск — 2,5 с на объект */
async function forestWake(ids, w) {
  const tok = FW = Math.random(), who = FOREST_WHO[w];
  await new Promise(r => setTimeout(r, 600));
  for (const id of ids) {
    if (FW !== tok) return;
    const g = document.querySelector(`#fbig [data-o="${id}"]`), say = document.getElementById('fsay');
    if (g) { g.classList.remove('off'); g.classList.add('on', 'wake'); }
    if (say) say.textContent = FOREST_SAY[id];
    Sound.ok && Sound.ok();
    forestOf(S).seen = [...new Set([...forestOf(S).seen, id])]; save();
    await Promise.all([Voice.say(FOREST_SAY[id], who), new Promise(r => setTimeout(r, 2600))]);
  }
  if (FW !== tok) return;
  FW = null;
  if (forestNews(S, w).unread.length) showForest();   /* открылась глава — обновить список (картина уже живая) */
}
ACT.forest = () => showForest();
ACT.chLock = () => { toast('Оживи ещё немного леса — и глава откроется'); if (worldOf() === 'kid') Voice.say('Реши ещё задания, и глава откроется.', 'zh'); };

/* ---------- Глава: реплики по одной, с картинкой героя и голосом ---------- */
let CHP = null;
ACT.chapter = el => {
  const w = worldOf(), i = +el.dataset.i, c = STORY[w].chapters[i];
  const secret = typeof hasColl === 'function' && hasColl('sec:' + w + ':' + i);
  CHP = { w, i, lines: c.lines.concat(secret ? [c.secret.concat(['secret'])] : []), k: 0, tok: Math.random() };
  FW = null; Voice.stop();
  (w === 'kid' ? mountKid : mount)(`<div class="topbar"><button class="iconbtn" data-act="forest" aria-label="Назад">←</button><div class="grow"><b>Глава ${i + 1}. ${esc(c.t)}</b><div class="small muted">${esc(STORY[w].title)}</div></div></div>
    <div class="story" id="story"></div><div class="stack" style="margin-top:14px"><button class="btn green block big" data-act="chNext" id="chnext">Дальше ▶</button></div>`);
  chapterLine();
};
async function chapterLine() {
  const P = CHP; if (!P) return;
  const [who, text, mark] = P.lines[P.k], box = document.getElementById('story'), tok = P.tok;
  box.innerHTML = `<div class="sline${mark ? ' secret' : ''}"><div class="spic">${STORY_PIC[who]()}</div><div class="bubble"><div class="small muted">${mark ? '🔑 Секретная страница · ' : ''}${STORY_NAME[who]}</div>${esc(text)}</div></div>
    <div class="sdots">${P.lines.map((_, j) => `<i class="${j <= P.k ? 'on' : ''}"></i>`).join('')}</div>`;
  document.getElementById('chnext').textContent = P.k + 1 >= P.lines.length ? 'Конец главы ✓' : 'Дальше ▶';
  await Voice.say(text, who);
  /* Лиза читает медленно: после голоса — сама следующая реплика */
  if (Voice.on() && CHP === P && P.tok === tok && P.w === 'kid' && P.k + 1 < P.lines.length) setTimeout(() => { if (CHP === P && P.tok === tok) ACT.chNext(); }, 900);
}
ACT.chNext = () => {
  const P = CHP; if (!P) return;
  P.tok = Math.random();
  if (P.k + 1 < P.lines.length) { P.k++; return chapterLine(); }
  const R0 = forestOf(S).read; if (!R0.includes(P.i)) { R0.push(P.i); save(); }
  CHP = null; Voice.stop(); showForest();
};

/* Фразы для озвучки (dev/voice/phrases.html): [кто, текст, тема] */
function forestPhrases() {
  const out = [];
  for (const [w, who] of Object.entries(FOREST_WHO)) {
    for (const [id] of FOREST_EV[w]) out.push([who, FOREST_SAY[id], 'story_' + w]);
    for (const c of STORY[w].chapters) { for (const [x, t] of c.lines) out.push([x, t, 'story_' + w]); out.push([c.secret[0], c.secret[1], 'story_' + w]); }
  }
  for (const t of ['Открылась новая глава! Нажми на неё.', 'Это мой лес! Решай задания, и он оживёт ещё.', 'Реши ещё задания, и глава откроется.']) out.push(['zh', t, 'story_kid']);
  return out;
}
