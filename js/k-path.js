/* «Тропинка к дубу» — линейная настольная игра с числами для Лизы (по исследованиям Siegler & Ramani).
   Строго: клетки в ОДИН ряд слева направо, на каждой — крупная цифра. Не по кругу, не цветами без чисел.
   Волчок 1–2, фишка идёт по клеткам, каждое число звучит вслух. Соперник — Сорока или второй игрок.
   Между ходами: «Сейчас 4, выпало 2 — на какую клетку придёшь?», «Покажи, где живёт число 7».
   Ступени: 1 — 10 клеток, шагаем нажатием на каждую клетку; 2 — 10 клеток и вопросы; 3 — 20 клеток и вопросы. */
'use strict';

const PATH_ID = 'k_path';
let PT = null;

/* ---------- Чистые функции (их проверяет dev/test-path.html) ---------- */
const pathCells = d => d >= 3 ? 20 : 10;
const pathSpin = bird => (bird ? R.chance(0.55) : R.chance(0.5)) ? 1 : 2;   /* Сорока чуть чаще получает 1 */
/* Вопрос «куда придёшь»: только если не перешагиваем дуб */
function pathAsk(pos, r, n) {
  if (pos + r > n) return null;
  return { kind: 'move', ans: pos + r,
    text: `${pos ? `Сейчас ${pos}.` : 'Ты на старте.'} Выпало ${r}. На какую клетку придёшь?`,
    hint: pos ? `Встань на клетку ${pos} и шагай вперёд.` : 'Шагай с первой клетки.' };
}
/* «Покажи, где живёт число k»: не там, где стоят фишки (чтобы не угадывать по фишке) */
function pathWhere(n, busy) {
  const free = Array.from({ length: n }, (_, i) => i + 1).filter(k => !busy.includes(k));
  const k = R.pick(free.length ? free : [1]);
  return { kind: 'where', ans: k, text: `Покажи, где живёт число ${k}.`, hint: 'Считай клетки слева: один, два, три…' };
}

/* Все фразы раздела — для озвучки (dev/voice/phrases.html) */
function pathPhrases() {
  const out = [];
  const zh = t => out.push(['zh', t]), nr = t => out.push(['nr', t]);
  ['С кем будешь играть?', 'Твой ход! Крути волчок.', 'Ход Жёлудика! Крути волчок.', 'Ход Фундука! Крути волчок.', 'Ход Сороки!',
    'Шагай: нажимай на клетки по порядку.', 'Нажми на следующую клетку.', 'Считай со мной!', 'Попробуй ещё раз!', 'Смотри.',
    'Ура! Мы у дуба!', 'Сорока прилетела первой!', 'А ты отлично считала. Сыграем ещё?', 'Жёлудик первый у дуба!', 'Фундук первый у дуба!',
    'Верно!', 'Шагай с первой клетки.', 'Считай клетки слева: один, два, три…'].forEach(zh);
  for (let r = 1; r <= 2; r++) zh(`Выпало ${r}.`);
  for (let k = 1; k <= 20; k++) { zh(String(k)); zh(`Вот число ${k}.`); nr(`Покажи, где живёт число ${k}.`); }
  for (let k = 1; k <= 19; k++) { zh(`Встань на клетку ${k} и шагай вперёд.`); nr(`Сейчас ${k}.`); }
  nr('Ты на старте.'); nr('Выпало 1.'); nr('Выпало 2.'); nr('На какую клетку придёшь?');
  return out;
}
KID_GAMES[PATH_ID] = { start: () => pathSetup(), phrases: pathPhrases };

/* ---------- Экран выбора соперника ---------- */
function pathSetup() {
  PT = null; Voice.stop();
  mountKid(`<div class="playtop"><button class="iconbtn" data-act="map" aria-label="На полянку">✕</button><div class="grow"><b>Тропинка к дубу</b></div></div>
    <div class="psetup">
      <div class="pduo">${ART.zhel('happy')}${ART.soroka('happy')}</div>
      <div class="bubble" style="font-size:20px">Добежим до дуба? Крути волчок, шагай по числам и считай вслух!</div>
      <div class="stack">
        <button class="btn green block big" data-act="pGo" data-m="bird">🐦 С Сорокой</button>
        <button class="btn gold block big" data-act="pGo" data-m="two">👫 Вдвоём на одном планшете</button>
      </div>
      <p class="small muted center">Вдвоём: Жёлудик — первый игрок, Фундук — второй.</p>
    </div>`);
  Voice.prefetch(PATH_ID);
  Voice.say('С кем будешь играть?', 'zh');
}
ACT.pGo = el => pathStart(el.dataset.m);
ACT.pAgain = () => pathStart(PT ? PT.mode : 'bird');
ACT.pQuit = () => { if (!PT) return showKidMap(); modal(`<h2>Выйти на полянку?</h2><p class="muted">Игру можно начать заново в любой момент.</p>
  <div class="stack"><button class="btn green block" data-act="close">Играть дальше</button><button class="btn ghost block" data-act="pQuitYes">На полянку</button></div>`); };
ACT.pQuitYes = () => { closeModal(); PT = null; Voice.stop(); showKidMap(); };

const P_PLAYERS = {
  bird: [{ who: 'zhel', name: 'Жёлудик', art: () => ART.zhel('happy') }, { who: 'sor', name: 'Сорока', art: () => ART.soroka('happy'), bot: true }],
  two: [{ who: 'zhel', name: 'Жёлудик', art: () => ART.zhel('happy') }, { who: 'fu', name: 'Фундук', art: () => ART.chip('funduk', 'happy', '', true) }]
};

function pathStart(mode) {
  const d = kidLevel(PATH_ID), n = pathCells(d);
  PT = { id: Math.random(), mode, d, n, pos: [0, 0], turn: 0, human: 0, asks: 0, first: 0, acorns: 0, phase: 'idle', q: null, tries: 0, need: 0, target: 0 };
  K = null;
  pathRender();
  pathTurn();
}
const P_REPEAT = 900;   /* мс после каждого числа на ходу ребёнка: «повтори за мной» */
const pAlive = id => PT && PT.id === id;
const pWait = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Отрисовка ---------- */
function pathRender() {
  const P = PT, pl = P_PLAYERS[P.mode];
  const cells = Array.from({ length: P.n }, (_, i) => `<button class="pcell" data-act="pCell" data-i="${i + 1}"><span class="ptoks"></span><b>${i + 1}</b></button>`).join('');
  mountKid(`<div class="kplay ppath">
    <div class="playtop"><button class="iconbtn" data-act="pQuit" aria-label="Выйти">✕</button><div class="grow"><b>Тропинка к дубу</b></div>
      <span class="pill">${ART.acorn(20)}<span id="pac">${P.acorns}</span></span></div>
    <div class="ptrack ${P.n > 10 ? 'n20' : ''}">
      <div class="pstart"><span class="ptoks"></span><b>старт</b></div>
      <div class="pcells">${cells}</div>
      <div class="poak">${ART.oak()}</div>
    </div>
    <div class="pbottom">
      <div class="helper" id="khelp">${ART.zhel('happy')}<div class="bubble" id="kbub"></div></div>
      <div class="pspin"><button class="ptopbtn" data-act="pSpin" id="pspin" aria-label="Крутить волчок" disabled>${ART.top('')}</button>
        <div class="small muted center" id="pwho"></div></div>
    </div></div>`);
  pathTokens();
}
function pathTokens() {
  const P = PT, pl = P_PLAYERS[P.mode];
  document.querySelectorAll('.ptoks').forEach(t => { t.innerHTML = ''; });
  [0, 1].forEach(k => {
    const at = P.pos[k], box = at ? document.querySelector(`.pcell[data-i="${at}"] .ptoks`) : document.querySelector('.pstart .ptoks');
    if (box) box.insertAdjacentHTML('beforeend', `<span class="ptok t${k}${P.turn === k ? ' cur' : ''}" id="ptok${k}">${pl[k].art()}</span>`);
  });
}
const pBub = (html, mood) => {
  const b = document.getElementById('kbub'); if (b) b.innerHTML = html;
  const h = document.querySelector('#khelp svg'); if (h && mood) h.outerHTML = ART.zhel(mood);
};
const pMark = (k, cls) => { const c = document.querySelector(`.pcell[data-i="${k}"]`); if (c) { c.classList.remove('ok', 'no', 'hint', 'goal'); if (cls) c.classList.add(cls); } };
const pClear = () => document.querySelectorAll('.pcell').forEach(c => c.classList.remove('ok', 'no', 'hint', 'goal', 'next'));

/* ---------- Ходы ---------- */
async function pathTurn() {
  const P = PT, id = P.id, me = P_PLAYERS[P.mode][P.turn];
  pathTokens(); pClear();
  const spin = document.getElementById('pspin');
  document.getElementById('pwho').textContent = `Ход: ${me.name}`;
  if (me.bot) {
    spin.disabled = true;
    pBub('Ход Сороки! 🐦', 'happy');
    await Voice.say('Ход Сороки!', 'zh'); if (!pAlive(id)) return;
    await pWait(300);
    return pathSpun(pathSpin(true));
  }
  /* Каждый третий ход человека — сначала «покажи, где живёт число» */
  if (P.turn === 0 && P.human % 3 === 2) {
    P.human++;
    return pathQuestion(pathWhere(P.n, P.pos.filter(Boolean)), () => pathTurn());
  }
  if (P.turn === 0) P.human++;
  P.phase = 'spin'; spin.disabled = false;
  const line = P.mode === 'two' ? `Ход ${P.turn ? 'Фундука' : 'Жёлудика'}! Крути волчок.` : 'Твой ход! Крути волчок.';
  pBub(line + ' 👇', 'happy');
  Voice.say(line, 'zh');
}
ACT.pSpin = () => {
  if (!PT || PT.phase !== 'spin') return;
  PT.phase = 'spinning';
  pathSpun(pathSpin(false));
};
async function pathSpun(r) {
  const P = PT, id = P.id, k = P.turn;
  const spin = document.getElementById('pspin');
  spin.disabled = true; spin.innerHTML = ART.top('', 'spinning');
  Sound.tap && Sound.tap();
  await pWait(1000); if (!pAlive(id)) return;
  spin.innerHTML = ART.top(r);
  pBub(`Выпало <b class="pbig">${r}</b>`, 'happy');
  await Voice.say(`Выпало ${r}.`, 'zh'); if (!pAlive(id)) return;
  const pos = P.pos[k], target = Math.min(P.n, pos + r);
  if (P_PLAYERS[P.mode][k].bot) { await pathWalk(k, target); return pathAfter(); }
  if (P.d === 1) {   /* ступень 1: шагаем сами, нажимая на каждую клетку */
    P.phase = 'tap'; P.target = target; P.tries = 0;
    pMark(pos + 1, 'next');
    pBub('Шагай: нажимай на клетки по порядку 👆', 'show');
    Voice.say('Шагай: нажимай на клетки по порядку.', 'zh');
    return;
  }
  const q = pathAsk(pos, r, P.n);
  if (!q) { await pathWalk(k, target); return pathAfter(); }
  pathQuestion(q, async () => { await pathWalk(k, target); pathAfter(); });
}

/* Вопрос с ответом нажатием на клетку; после 2 ошибок Жёлудик показывает */
function pathQuestion(q, then) {
  const P = PT;
  Object.assign(P, { phase: 'ask', q, tries: 0, then });
  pBub(`<b>${q.text}</b> 👆`, 'think');
  Voice.say(q.text, 'nr');
}
ACT.pCell = el => {
  const P = PT; if (!P) return;
  const k = +el.dataset.i;
  if (P.phase === 'tap') return pathTapStep(k);
  if (P.phase !== 'ask') return;
  const q = P.q, mine = P.turn === 0;
  if (k === q.ans) {
    P.phase = 'busy';
    pMark(k, 'ok'); Sound.ok();
    const first = P.tries === 0;
    if (mine) pathRecord(q, first);
    const p = first ? Praise.say('ok', 'kid') : Praise.say('second', 'kid');
    pBub(p ? esc(p.text) : 'Верно! 👍', 'cheer');
    const go = async () => { await pWait(p ? 1600 : 700); if (PT === P) P.then(); };
    if (!p) Voice.say('Верно!', 'zh').then(go); else go();
    return;
  }
  P.tries++; Sound.bad(); pMark(k, 'no');
  setTimeout(() => { const c = document.querySelector(`.pcell[data-i="${k}"]`); if (c) c.classList.remove('no'); }, 900);
  if (P.tries < 2) {
    pBub(`Не совсем. ${q.hint}`, 'think');
    Voice.say('Попробуй ещё раз! ' + q.hint, 'zh');
    return;
  }
  /* Вторая ошибка: показываем */
  P.phase = 'busy';
  if (mine) pathRecord(q, false);
  pathShow(q).then(() => { if (PT === P) P.then(); });
};
async function pathShow(q) {
  const P = PT, id = P.id;
  pBub('Смотри!', 'show');
  if (q.kind === 'where') {
    await Voice.say('Смотри.', 'zh'); if (!pAlive(id)) return;
    for (let i = 1; i <= q.ans; i++) { pMark(i, 'hint'); pBub(`<span class="pbig">${i}</span>`, 'show'); await Voice.say(String(i), 'zh'); if (!pAlive(id)) return; }
    pMark(q.ans, 'goal'); pBub(`Вот число <b class="pbig">${q.ans}</b>`, 'show');
    await Voice.say(`Вот число ${q.ans}.`, 'zh'); await pWait(500);
    return;
  }
  pMark(q.ans, 'goal');
  await Voice.say('Смотри.', 'zh'); await pWait(200);
}

/* Ступень 1: Лиза сама шагает, нажимая на следующую клетку */
async function pathTapStep(k) {
  const P = PT, id = P.id, me = P.turn, next = P.pos[me] + 1;
  if (k !== next) {
    P.tries++; Sound.bad(); pMark(k, 'no');
    setTimeout(() => { const c = document.querySelector(`.pcell[data-i="${k}"]`); if (c && !c.classList.contains('next')) c.classList.remove('no'); }, 900);
    if (P.tries >= 2) {   /* после двух промахов шагаем вместе */
      if (me === 0) pathRecord({ kind: 'step', text: `Шаг на клетку ${next}`, ans: next }, false);
      P.tries = 0; return pathTapStep(next);
    }
    pBub(`Нажми на следующую клетку — она светится 👆`, 'think');
    Voice.say('Нажми на следующую клетку.', 'zh');
    return;
  }
  if (P.phase !== 'tap') return;
  P.phase = 'stepping';
  if (P.tries === 0 && me === 0) pathRecord({ kind: 'step', text: `Шаг на клетку ${next}`, ans: next }, true);
  P.tries = 0;
  pClear();
  P.pos[me] = next; pathTokens(); pathHop(me);
  pBub(`<span class="pbig">${next}</span>`, 'happy');
  await Voice.say(String(next), 'zh'); if (!pAlive(id)) return;
  await pWait(P_REPEAT); if (!pAlive(id)) return;   /* пауза: Лиза повторяет число вслух */
  if (next >= P.target) return pathAfter();
  P.phase = 'tap'; pMark(next + 1, 'next');
}

/* Фишка идёт по клеткам, каждое число звучит */
async function pathWalk(k, target) {
  const P = PT, id = P.id;
  pClear();
  pBub('Считай со мной! 🗣️', 'happy');
  await Voice.say('Считай со мной!', 'zh'); if (!pAlive(id)) return;
  while (P.pos[k] < target) {
    P.pos[k]++;
    pathTokens(); pathHop(k);
    pBub(`<span class="pbig">${P.pos[k]}</span>`, 'happy');
    await Voice.say(String(P.pos[k]), 'zh'); if (!pAlive(id)) return;
    await pWait(P_PLAYERS[P.mode][k].bot ? 250 : P_REPEAT); if (!pAlive(id)) return;   /* на своём ходу — время повторить число */
  }
}
const pathHop = k => { const t = document.getElementById('ptok' + k); if (t) { t.classList.remove('hop'); void t.offsetWidth; t.classList.add('hop'); } };

async function pathAfter() {
  const P = PT; if (!P) return;
  const k = P.turn;
  if (P.pos[k] >= P.n) return pathFinish(k);
  await pWait(500); if (PT !== P) return;
  P.turn = 1 - P.turn;
  pathTurn();
}

function pathRecord(q, ok) {
  const P = PT;
  P.asks++; if (ok) { P.first++; P.acorns++; giveAcorns(1); const a = document.getElementById('pac'); if (a) a.textContent = P.acorns; }
  kidRecord({ topic: PATH_ID, d: P.d, gen: 'k_path_' + q.kind, text: q.text, ans: q.ans }, ok);
  save();
}

/* ---------- Финал у дуба ---------- */
async function pathFinish(winner) {
  const P = PT; P.phase = 'end';
  const pl = P_PLAYERS[P.mode], w = pl[winner];
  markActive();
  const prev = S.stars[PATH_ID] || 0;
  const earn = prev < 3 && P.asks >= 3 && P.first / P.asks >= 0.8;
  if (earn) S.stars[PATH_ID] = prev + 1;
  giveAcorns(2); save(); Sound.win(); confetti(winner === 0 || P.mode === 'two' ? 26 : 12);
  const lizaWon = winner === 0 && P.mode === 'bird';
  const title = P.mode === 'two' ? `${w.name} первый у дуба!` : lizaWon ? 'Ура! Мы у дуба!' : 'Сорока прилетела первой!';
  const st = S.stars[PATH_ID] || 0;
  mountKid(`<div class="result pfinal">
    <div class="pscene">${ART.oak('big')}<div class="pwin">${winner === 0 ? ART.zhel('cheer') : w.who === 'sor' ? ART.soroka('cheer') : ART.chip('funduk', 'cheer')}</div>
      <div class="plose">${winner === 0 ? (pl[1].who === 'sor' ? ART.soroka('think') : ART.chip('funduk', 'happy', '', true)) : ART.zhel('happy')}</div></div>
    <h1>${title}</h1>
    ${!lizaWon && P.mode === 'bird' ? '<p style="font-size:20px">А ты отлично считала!</p>' : ''}
    <div class="bigstars kst">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></div>
    ${earn ? '<p style="font-size:20px"><b>Новая звёздочка!</b></p>' : ''}
    <p style="font-size:18px">Сразу верно: <b>${P.first}</b> из ${P.asks}</p>
    <p><span class="pill">+${P.acorns + 2} ${ART.acorn(20)}</span></p>
    <div class="stack"><button class="btn green block big" data-act="pAgain">Ещё раз 🔁</button><button class="btn ghost block big" data-act="map">На полянку 🌳</button></div></div>`);
  await Voice.say(title, 'zh');
  if (PT !== P) return;
  if (!lizaWon && P.mode === 'bird') await Voice.say('А ты отлично считала. Сыграем ещё?', 'zh');
  if (PT !== P) return;
  Praise.say(earn ? 'star' : 'level', 'kid');
}
