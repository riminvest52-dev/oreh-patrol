/* Экраны: знакомство, карта леса, локация, результаты, родителям, альбом */
'use strict';

/* ---------- Переезд с GitHub Pages ---------- */
const NEW_HOME = 'https://oreh-patrol.website.yandexcloud.net/';
const OLD_HOME = /(^|\.)github\.io$/.test(location.hostname);
const movedCard = () => OLD_HOME ? `<div class="moved"><div class="mvh">🚚 Игра переехала!</div>
  <p>Теперь «Ореховый патруль» живёт по новому адресу, он открывается быстрее и без перебоев. Нажми кнопку: игра откроется там вместе со всеми звёздами и орешками, а взрослый сможет подключить её к облаку семьи.</p>
  <button class="btn green block" data-act="moveGo">Перенести в семью →</button>
  <button class="btn ghost block" style="margin-top:8px" data-act="moveCode">Показать код переноса</button>
  <p class="small muted" style="margin-top:8px">Новый адрес: ${NEW_HOME.replace('https://', '')}</p></div>` : '';
ACT.moveGo = () => { location.href = NEW_HOME + '#move=' + exportMove(); };
ACT.moveCode = () => modal(`<h2>Код переноса</h2><p class="muted small">Если кнопка не сработала: откройте ${NEW_HOME.replace('https://', '')}, зайдите в раздел для взрослых → «Загрузить прогресс» и вставьте этот код. Переедут все игроки.</p>
  <textarea class="input" style="height:140px;font-size:12px" readonly onclick="this.select()">${exportMove()}</textarea>
  <button class="btn green block" style="margin-top:10px" data-act="copyCode">Скопировать</button><button class="btn ghost block" style="margin-top:10px" data-act="close">Закрыть</button>`);
/* На новом адресе: прогресс приходит в части ссылки после #, на сервер она не отправляется */
function takeMove() {
  const m = /^#move=(.+)$/.exec(location.hash);
  if (!m) return false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
  try { const n = importMove(fromCode(decodeURIComponent(m[1]))); setTimeout(() => toast(`Прогресс перенесён! Игроков: ${n} 🎉`, 3000), 300); return true; }
  catch (e) { setTimeout(() => toast('Не получилось перенести прогресс 😕 Попробуйте код переноса.', 3500), 300); return false; }
}

/* ---------- Кто играет ---------- */
function showWho() {
  SES = null;
  const tiles = liveProfiles().map(p => `<button class="who-tile" data-act="pickWho" data-id="${p.id}">${ART.chip(heroOf(p), 'happy', '', true)}<b>${esc(playerName(p) || 'Новый игрок')}</b><span class="small muted">${(WORLDS[p.world] || {}).title || ''}</span></button>`).join('');
  mount(`${movedCard()}${newDeviceCard()}<h1 class="center" style="margin-top:14px">Кто играет?</h1>
    <div class="who">${tiles}<button class="who-tile" data-act="addWho"><span class="plus">＋</span><b>Добавить</b><span class="small muted">нового игрока</span></button></div>`);
}
const isKid = () => (curProfile() || {}).world === 'kid';
const isFour = () => (curProfile() || {}).world === 'four';
/* Герои: у 4 класса — белка Шустрик, у 5 класса — Фундук и Миндалинка, у подготовки — Жёлудик */
const heroFor = name => isFour() ? 'shustrik' : name;
const heroOf = p => p.world === 'four' ? 'shustrik' : p.hero;
function enterWorld() { if (isKid()) return S.name ? showKidMap() : showKidWelcome(); if (!S.name) showWelcome(); else showMap(); }
ACT.who = () => showWho();
ACT.pickWho = el => { useProfile(el.dataset.id); enterWorld(); };
ACT.addWho = () => modal(`<h2>Новый игрок</h2><p class="muted">Что будем проходить?</p><div class="stack">
  <button class="btn gold block" data-act="addGo" data-w="kid">Подготовку к 1 классу 🌱</button>
  <button class="btn green block" data-act="addGo" data-w="four">Математику 4 класса</button>
  <button class="btn green block" data-act="addGo" data-w="five">Математику 5 класса</button>
  <button class="btn ghost block" data-act="close">Отмена</button></div>`);
ACT.addGo = el => { closeModal(); addProfile(el.dataset.w); Cloud.soon(); enterWorld(); };

/* ---------- Знакомство ---------- */
function showWelcome() {
  mount(`<div class="hero">${isFour() ? ART.chip('shustrik', 'happy') : ART.chip('funduk', 'happy') + ART.chip('mindal', 'happy')}</div>
    <h1 class="center">Ореховый патруль</h1>
    <div class="bubble" style="margin:10px 0 16px">${isFour() ? 'Привет! Я — белка <b>Шустрик</b>, хозяйка Беличьей кладовой. У нас беда: белки разложили орехи рядами, а сколько всего — сосчитать не могут! Без таблицы умножения не разобраться. Поможешь?' : `Привет! Мы — <b>Фундук</b> и <b>Миндалинка</b>, лесные спасатели. В лесу беда: у Бобра перепутались чертежи, у Совы разбежались высказывания, а на Ореховом складе никто не может разделить орехи поровну! Без математики не справиться. Поможешь нам?`}</div>
    <label class="muted small" for="nm">Как тебя зовут?</label>
    <input class="input" id="nm" maxlength="20" autocomplete="off" placeholder="Твоё имя" value="${esc(S.name)}">
    <button class="btn block green" style="margin-top:14px" data-act="join">${isFour() ? 'Помогу! 🌰' : 'Вступить в патруль! 🌰'}</button>`);
}
ACT.join = () => {
  const v = document.getElementById('nm').value.trim();
  if (!v) { toast('Напиши своё имя 🙂'); return; }
  S.name = v.slice(0, 20); save();
  if (isFour()) return mount(`<div class="hero">${ART.chip('shustrik', 'cheer')}</div>
    <h2 class="center">Рады знакомству, ${esc(S.name)}!</h2>
    <div class="bubble" style="margin:10px 0 16px">Начнём с <b>Беличьей кладовой</b> — там живёт таблица умножения. Каждый пример — орешек на дереве. Выучишь все — дерево станет золотым! Остальные уголки леса 4 класса уже ждут на карте.</div>
    <button class="btn block green" data-act="mulOpen">В Беличью кладовую 🐿️</button><button class="btn block ghost" style="margin-top:10px" data-act="map">На карту</button>`);
  mount(`<div class="hero">${ART.chip('mindal', 'happy')}</div>
    <h2 class="center">Рады знакомству, ${esc(S.name)}!</h2>
    <div class="bubble" style="margin:10px 0 16px">Давай сначала пройдём <b>Проверку сил</b>: 16 заданий из всех уголков леса, примерно 10–15 минут. Так мы поймём, кому помочь в первую очередь. Ошибаться можно — это не контрольная!</div>
    <div class="stack"><button class="btn block green" data-act="diag">Начать Проверку сил</button><button class="btn block ghost" data-act="map">Позже — сразу на карту</button></div>`);
};
ACT.diag = () => startDiag();
ACT.map = () => showMap();

/* ---------- Карта леса ---------- */
function showMap() {
  SES = null;
  if (isKid()) return showKidMap();
  const due = dueMistakes().length, dailyDone = S.daily.date === today() && S.daily.done;
  const weak = S.diag || Object.values(S.mastery).some(m => m.n >= 5) ? weakTopics(2) : [];
  const W = Math.min(window.innerWidth, 560), stepY = 156, top = 70;
  const four = isFour();
  const all = TOPICS.map(t => ({ t, locked: false })).concat(LOCKED.map(t => ({ t, locked: true })));
  const pts = all.map((x, i) => ({ x: i % 2 ? W * 0.7 : W * 0.3, y: top + i * stepY }));
  const H = top + all.length * stepY + 10;
  let path = `M${pts[0].x} ${pts[0].y + 44}`;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; path += ` C${a.x} ${a.y + 110} ${b.x} ${b.y - 70} ${b.x} ${b.y + 44}`; }
  let deco = '';
  for (let i = 0; i < all.length; i++) {
    const y = top + i * stepY + 40, side = i % 2 ? W * 0.16 : W * 0.86;
    deco += ART.tree(side + (i % 3 - 1) * 10, y, 0.75 + (i % 3) * 0.12, i);
    deco += ART.leaf(W * (i % 2 ? 0.45 : 0.55), y + 70, i * 47, ['#E8833A', '#F2B33D', '#C9532A'][i % 3]);
  }
  const nodes = all.map((x, i) => {
    const p = pts[i], t = x.t;
    if (x.locked) return `<div class="node locked" style="left:${p.x}px;top:${p.y}px"><div class="disc">${t.icon}</div><div class="nm">${t.name}</div><div class="small muted">🔒 ${t.sub}</div></div>`;
    if (t.act) { const c = mulCount(S); return `<div class="node" data-act="${t.act}" style="left:${p.x}px;top:${p.y}px"><div class="disc">${t.icon}${S.medals.mulgold ? '<span class="medal">🌟</span>' : ''}</div>
      <div class="nm">${t.name}</div><div class="st">🌳 ${c.know + c.gold}/64</div></div>`; }
    const st = topicStars(t.id), tip = weak.includes(t.id) ? '<div class="tip">Сюда сначала!</div>' : '';
    return `<div class="node" data-act="topic" data-id="${t.id}" style="left:${p.x}px;top:${p.y}px">${tip}<div class="disc">${t.icon}${S.medals[t.id] ? '<span class="medal">🏅</span>' : ''}</div>
      <div class="nm">${t.name}</div><div class="st">★ ${st}/9</div></div>`;
  }).join('');
  const sn = streakNow();
  mount(`<div class="topbar"><div class="avatar" data-act="who" role="button" aria-label="Сменить игрока">${ART.chip(curProfile() ? heroOf(curProfile()) : 'funduk', 'happy', '', true)}<span class="swap">⇄</span></div>
      <div class="grow"><div class="hello">Привет, ${esc(S.name || 'друг')}!</div><div class="small muted">${sn ? `🔥 ${sn} ${pl(sn, 'день', 'дня', 'дней')} подряд` : 'Ореховый патруль на связи'}</div></div>
      <span class="pill">${ART.acorn(22)}${S.acorns}</span><button class="iconbtn" data-act="parent" aria-label="Для взрослых">⚙️${cloudDot()}</button></div>
    ${four ? fourQuick() : `<div class="quick">
      <div class="qcard ${dailyDone || !S.diag ? '' : 'hot'}" data-act="daily">${dailyDone ? '<span class="done">✅</span>' : ''}<div class="qi">☀️</div><div><div class="qt">Задание дня</div><div class="qs">${dailyDone ? 'Выполнено! Можно ещё' : '10 задач · +10 орешков'}</div></div></div>
      <div class="qcard" data-act="review">${due ? `<span class="badge">${due}</span>` : ''}<div class="qi">🧺</div><div><div class="qt">Корзинка ошибок</div><div class="qs">${due ? 'Пора повторить!' : S.mistakes.length ? `${S.mistakes.length} ждут своего дня` : 'Пока пусто'}</div></div></div>
      <div class="qcard ${S.diag ? '' : 'hot first'}" data-act="${S.diag ? 'diagAsk' : 'diag'}">${S.diag ? '' : '<div class="tip">Начни отсюда!</div>'}<div class="qi">🧭</div><div><div class="qt">Проверка сил</div><div class="qs">${S.diag ? 'Пройдена ' + S.diag.date.split('-').reverse().slice(0, 2).join('.') : '16 задач — с чего начать'}</div></div></div>
      <div class="qcard" data-act="album"><div class="qi">📒</div><div><div class="qt">Альбом наклеек</div><div class="qs">${S.stickers.length} из ${STICKERS.length}</div></div></div>
    </div>`}
    <h3 style="margin:4px 0 0">${four ? 'Лес 4 класса' : 'Карта леса'}</h3>
    <div class="forest" style="height:${H}px"><svg class="paths" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${deco}
      <path d="${path}" stroke="#E2B47C" stroke-width="22" fill="none" stroke-linecap="round"/><path d="${path}" stroke="#F6D7A6" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="2 18"/></svg>${nodes}</div>`);
  Praise.hello(); if (!four) Voice.prefetch('five');
}
let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (document.querySelector('.forest')) showMap(); }, 200); });
ACT.daily = () => startDaily();
ACT.review = () => startReview();
ACT.diagAsk = () => modal(`<h2>Пройти Проверку сил ещё раз?</h2><p class="muted">Результаты обновят подсказки «Сюда сначала!» на карте. Звёзды и орешки сохранятся.</p>
  <div class="stack"><button class="btn green block" data-act="diagGo">Да, пройти</button><button class="btn ghost block" data-act="close">Не сейчас</button></div>`);
ACT.diagGo = () => { closeModal(); startDiag(); };

/* ---------- Локация ---------- */
let curTopic = null;
function showTopic(id) {
  curTopic = id;
  const T = TOPIC[id], M = mast(id), [lbl, col] = masteryLabel(M.m);
  const lv = LEVELS.map(L => {
    const open = isOpen(id, L.n), st = starsOf(id, L.n);
    const icon = L.boss ? (S.medals[id] ? '🏅' : '🏆') : ['🌱', '🌰', '🌳'][L.n - 1];
    return `<div class="level ${open ? '' : 'locked'} ${L.boss ? 'boss' : ''}" ${open ? `data-act="level" data-n="${L.n}"` : ''}>
      <div class="ln">${open ? icon : '🔒'}</div><div class="grow"><div class="lt">${L.n}. ${L.name}</div>
      <div class="small muted">${L.boss ? `${L.count} трудных задач · нужно ${L.count - 1} верных` : `${L.count} задач · ${['лёгкий', 'средний', 'сложный'][L.n - 1]} уровень`}${open ? '' : ' · откроется после 2★'}</div></div>
      ${L.boss ? '' : `<div class="stars">${starsHtml(st)}</div>`}</div>`;
  }).join('');
  mount(`<div class="topbar"><button class="iconbtn" data-act="map" aria-label="Назад">←</button><div class="grow"><b>${T.name}</b><div class="small muted">${T.sub}</div></div>
      <span class="pill">${ART.acorn(20)}${S.acorns}</span></div>
    <div class="loc-head"><div class="big">${T.art ? T.art() : T.icon}</div><div class="bubble grow"><b>${T.who}:</b> ${T.intro}</div></div>
    <div class="row" style="margin-bottom:12px"><button class="btn gold grow" data-act="sheet">📜 Шпаргалка</button></div>
    <div class="small muted" style="margin:0 0 6px 2px">Освоено: <b style="color:${col}">${lbl}</b></div>
    <div class="levels">${lv}</div>${T.extra ? T.extra() : ''}`);
}
ACT.topic = el => showTopic(el.dataset.id);
ACT.toTopic = () => showTopic(curTopic);
ACT.level = el => startLevel(curTopic, +el.dataset.n);
ACT.sheet = () => { const T = TOPIC[curTopic]; modal(`<h2>📜 Шпаргалка: ${T.name}</h2><ul style="padding-left:20px">${T.sheet.map(s => `<li>${s}</li>`).join('')}</ul><button class="btn block green" data-act="close">Понятно!</button>`); };

/* ---------- Результаты ---------- */
let LASTRES = null;
function showResult(r) {
  LASTRES = r;
  mount(`<div class="result">${ART.chip(heroFor(r.mood === 'think' ? 'mindal' : 'funduk'), r.mood)}
    <h1>${r.title}</h1>${r.stars !== null ? `<div class="bigstars">${starsHtml(r.stars)}</div>` : ''}
    <p style="font-size:19px">Верно: <b>${r.ok}</b> из ${r.n}</p>
    <p><span class="pill">+${r.acorns} ${ART.acorn(20)}</span></p>
    ${r.text ? `<p class="muted">${r.text}</p>` : ''}
    <div class="stack">${r.buttons.map(([t, a, c]) => `<button class="btn block ${c}" data-act="${a}">${t}</button>`).join('')}</div></div>`);
}
ACT.again = () => startLevel(LASTRES.again[0], LASTRES.again[1]);
ACT.nextLevel = () => startLevel(LASTRES.again[0], LASTRES.again[1] + 1);
function showDiagResult(scores, ok, n) {
  const rows = TOPICS.filter(T => !T.noDiag).map(T => {
    const sc = scores[T.id], col = ['#D9553A', '#F5B43C', '#5E9E4A'][sc];
    return `<div class="trow"><div style="font-size:22px">${T.icon}</div><div><div class="tn">${T.name}</div><div class="bar"><i style="width:${(sc / 2) * 100}%;background:${col}"></i></div></div><div class="small" style="font-weight:800;color:${col}">${sc}/2</div></div>`;
  }).join('');
  const weak = weakTopics(2).map(id => TOPIC[id].name);
  mount(`<div class="result">${ART.chip(heroFor('funduk'), 'cheer')}<h1>Проверка сил пройдена!</h1><p>Верно: <b>${ok}</b> из ${n} · <span class="pill">+5 ${ART.acorn(18)}</span></p></div>
    <div class="card" style="margin-top:12px">${rows}</div>
    <div class="bubble" style="margin-top:14px">Начнём с локаций: <b>${weak.join('</b> и <b>')}</b> — на карте они отмечены «Сюда сначала!».</div>
    <button class="btn green block" style="margin-top:16px" data-act="map">На карту леса 🗺️</button>`);
}

/* ---------- Альбом ---------- */
function showAlbum() {
  mount(`<div class="topbar"><button class="iconbtn" data-act="map">←</button><div class="grow"><b>Альбом наклеек</b><div class="small muted">Обменивай орешки на наклейки</div></div><span class="pill">${ART.acorn(20)}${S.acorns}</span></div>
    <div class="album">${STICKERS.map(([e, nm, price], i) => {
      const has = S.stickers.includes(i);
      return `<div class="stk ${has ? '' : 'no'}"><div class="e">${e}</div><div class="n">${has ? nm : '???'}</div>${has ? '<div class="small muted">есть!</div>' : `<button class="btn gold" data-act="buy" data-i="${i}" ${S.acorns < price ? 'disabled' : ''}>${price} 🌰</button>`}</div>`;
    }).join('')}</div>`);
}
ACT.album = () => showAlbum();
ACT.buy = el => {
  const i = +el.dataset.i, [e, nm, price] = STICKERS[i];
  if (S.acorns < price || S.stickers.includes(i)) return;
  S.acorns -= price; S.stickers.push(i); save(); Sound.coin(); confetti(12); toast(`Новая наклейка: ${e} ${nm}!`); showAlbum();
};

/* ---------- Для взрослых ---------- */
ACT.parent = () => modal(`<h2>Раздел для взрослых</h2><p class="muted">Удерживай кнопку 2 секунды.</p>
  <button class="btn block hold" id="holdbtn">Для родителей 🔐<i></i></button><button class="btn ghost block" style="margin-top:10px" data-act="close">Отмена</button>`) || setupHold();
function setupHold() {
  const b = document.getElementById('holdbtn'), bar = b.querySelector('i');
  let t0 = 0, raf = 0;
  const stop = () => { cancelAnimationFrame(raf); bar.style.width = '0'; t0 = 0; };
  const tick = () => { const p = Math.min(1, (performance.now() - t0) / 2000); bar.style.width = p * 100 + '%'; if (p >= 1) { stop(); closeModal(); showParent(); } else raf = requestAnimationFrame(tick); };
  b.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(tick); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
}
function showParent() {
  if (isKid()) return showKidParent();
  const days = Array.from({ length: 14 }, (_, i) => addDays(today(), i - 13));
  const maxN = Math.max(1, ...days.map(d => (S.history[d] || {}).n || 0));
  const acc = S.solved ? Math.round(S.right / S.solved * 100) : 0;
  const four = isFour(), hasMul = Object.keys(S.mul || {}).length > 0;
  const topics = TOPICS.filter(T => !T.act).map(T => {
    const M = mast(T.id), [lbl, col] = masteryLabel(M.m), pct = M.m === null || M.m === undefined ? 0 : Math.round(M.m * 100);
    const weak = M.weak && S.skill[M.weak] && S.skill[M.weak].m < 0.8 && SKILL[M.weak] ? `<div class="small muted">слабее всего: ${SKILL[M.weak]}</div>` : '';
    return `<div class="trow"><div style="font-size:22px">${T.icon}</div><div><div class="tn">${T.name} <span class="small" style="color:${col}">· ${lbl}</span></div>${weak}
      <div class="bar"><i style="width:${pct}%;background:${col}"></i></div></div><div class="small muted">${M.n ? M.ok + '/' + M.n : '—'}</div></div>`;
  }).join('');
  const recentBad = S.recent.filter(r => !r.ok).slice(0, 15).map(r => `<div class="mist"><div class="q">${TOPIC[r.topic] ? TOPIC[r.topic].icon : ''} ${esc(r.q)}</div>
    <div>Ответ: <span style="color:var(--red)">${esc(r.given)}</span> · верно: <b style="color:var(--green-d)">${esc(r.right)}</b> <span class="muted">· ${new Date(r.ts).toLocaleDateString('ru-RU')}</span></div></div>`).join('') || '<p class="muted">Ошибок пока нет.</p>';
  mount(`<div class="topbar"><button class="iconbtn" data-act="map">←</button><div class="grow"><b>Для родителей · ${esc(S.name)}</b><div class="small muted">${CLOUD_URL && F.code ? 'Прогресс сохраняется на устройстве и в облаке семьи' : 'Прогресс хранится только на этом устройстве'}</div></div></div>
    ${familyEntry()}
    <div class="card"><div class="row" style="justify-content:space-around;text-align:center">
      <div><div style="font-size:26px;font-weight:800">${S.solved}</div><div class="small muted">задач</div></div>
      <div><div style="font-size:26px;font-weight:800">${acc}%</div><div class="small muted">верно</div></div>
      <div><div style="font-size:26px;font-weight:800">${S.streak.best}</div><div class="small muted">лучшая серия</div></div>
      <div><div style="font-size:26px;font-weight:800">${S.mistakes.length}</div><div class="small muted">в корзинке</div></div></div>
      <div class="days">${days.map(d => { const n = (S.history[d] || {}).n || 0; return `<div class="${n ? '' : 'zero'}" style="height:${Math.max(4, n / maxN * 100)}%" title="${d}: ${n}"></div>`; }).join('')}</div>
      <div class="small muted center" style="margin-top:4px">Задач в день за последние 2 недели</div></div>
    ${movedCard()}${four || hasMul ? `<h3 style="margin-top:18px">Таблица умножения</h3>${mulParentCard(S)}` : ''}
    ${`<h3 style="margin-top:18px">Темы</h3><div class="card">${topics}<p class="small muted">Тема оценивается по самому слабому навыку внутри неё. «Уверенно» — 80%+ по последним ответам с учётом сложности, «почти» — 55–80%, «подтянуть» — ниже. Ответ с подсказкой освоенность не повышает, со второй попытки — считается ошибкой.</p></div>`}
    ${!four && typeof handsParentCard === 'function' ? handsParentCard() : ''}
    <h3 style="margin-top:18px">Последние ошибки</h3><div class="card">${recentBad}</div>
    <h3 style="margin-top:18px">Настройки</h3><div class="card">
      <button class="btn ghost block" style="margin-bottom:12px" data-act="who">👧 Сменить или добавить игрока</button>
      <label class="small muted" for="pn">Имя</label><div class="row"><input class="input" id="pn" maxlength="20" value="${esc(S.name)}"><button class="btn" data-act="saveName">OK</button></div>
      <button class="btn ghost block" style="margin-top:12px" data-act="sound">${S.sound ? '🔊 Звук включён' : '🔇 Звук выключен'}</button>
      <button class="btn ghost block" style="margin-top:12px" data-act="voice5">${Voice.on() ? '🗣️ Голоса героев включены' : '🤐 Голоса героев выключены'}</button>
      <button class="btn ghost block" style="margin-top:12px" data-act="vtest">🔈 Проверить голос</button><div class="small muted center" id="vtest" style="margin-top:6px"></div>
      <button class="btn ghost block" style="margin-top:12px" data-act="export">📤 Перенести прогресс на другое устройство</button>
      <button class="btn ghost block" style="margin-top:12px" data-act="import">📥 Загрузить прогресс</button>
      <button class="btn ghost block" style="margin-top:12px;color:var(--red)" data-act="reset">Сбросить весь прогресс</button></div>
    <p class="small muted center" style="margin-top:14px">${four ? 'Ореховый патруль · математика 4 класса (ФГОС, порядок тем — «Школа России», проверка — по образцу ВПР)' : 'Ореховый патруль · математика 5 класса по программе Л. Г. Петерсон (1–2 четверть)'}</p>`);
}
/* Код семьи, устройства и копии — в js/family.js (экран «Семья») */
ACT.saveName = () => { const v = document.getElementById('pn').value.trim(); if (v) { S.name = v.slice(0, 20); save(); toast('Имя сохранено'); } };
ACT.sound = () => { S.sound = !S.sound; save(); showParent(); };
ACT.voice5 = () => { Voice.toggle(); showParent(); };
/* Проверка голоса: говорит Жёлудик, потом строка — версия игры и чем звучало (записи или голос браузера) */
ACT.vtest = async () => {
  const out = document.getElementById('vtest'); if (out) out.textContent = 'Слушайте…';
  if (!Voice.on()) Voice.toggle();
  await Voice.say('Озвучка включена.', 'zh');
  let ver = '?'; try { ver = ((await caches.keys()).find(k => /^oreh-v\d/.test(k)) || '?').replace('oreh-v', ''); } catch (e) { }
  const s = Voice.status;
  if (out) out.textContent = `Версия ${ver} · звучало: ${s.last || '—'} · формат ${s.ext}${s.err ? ' · ' + s.err : ''}${navigator.serviceWorker && navigator.serviceWorker.controller ? '' : ' · без офлайна'}`;
};
ACT.export = () => modal(`<h2>Перенос прогресса</h2><p class="muted small">Скопируйте этот код и вставьте его на другом устройстве через «Загрузить прогресс».</p>
  <textarea class="input" style="height:140px;font-size:12px" readonly onclick="this.select()">${exportCode()}</textarea>
  <button class="btn green block" style="margin-top:10px" data-act="copyCode">Скопировать</button><button class="btn ghost block" style="margin-top:10px" data-act="close">Закрыть</button>`);
ACT.copyCode = () => { const ta = document.querySelector('#modal textarea'); ta.select(); try { navigator.clipboard.writeText(ta.value).then(() => toast('Скопировано!'), () => document.execCommand('copy')); } catch (e) { document.execCommand('copy'); toast('Скопировано!'); } };
ACT.import = () => modal(`<h2>Загрузить прогресс</h2><p class="muted small">Вставьте код с другого устройства. Прогресс объединится с текущим.</p>
  <textarea class="input" id="impc" style="height:140px;font-size:12px"></textarea><button class="btn green block" style="margin-top:10px" data-act="importGo">Загрузить</button><button class="btn ghost block" style="margin-top:10px" data-act="close">Отмена</button>`);
ACT.importGo = () => { try { const n = importCode(document.getElementById('impc').value); closeModal(); toast(n ? `Прогресс перенесён! Игроков: ${n}` : 'Прогресс загружен!'); if (n) boot(); else showParent(); } catch (e) { toast('Код не подошёл 😕'); } };
ACT.reset = () => modal(`<h2>Сбросить весь прогресс?</h2><p class="muted">Звёзды, орешки, наклейки и статистика игрока ${esc(S.name)} удалятся ${CLOUD_URL ? 'на всех устройствах семьи' : 'с этого устройства'}. Отменить нельзя.</p>
  <div class="stack"><button class="btn block" style="background:var(--red);box-shadow:0 5px 0 var(--red-d)" data-act="resetGo">Да, сбросить</button><button class="btn ghost block" data-act="close">Отмена</button></div>`);
ACT.resetGo = () => { resetAll(); closeModal(); showMap(); };

/* ---------- Старт ---------- */
function boot() {
  closeModal();
  const moved = takeMove();
  const famLink = takeFam();
  purgeProfiles();
  const live = liveProfiles();
  if (F.current && !live.some(p => p.id === F.current)) F.current = null;
  if (OLD_HOME && live.length) return showWho();   /* на старом адресе сразу видно «Игра переехала» */
  if (moved && F.current) { useProfile(F.current); enterWorld(); }
  else if (live.length === 1) { useProfile(live[0].id); enterWorld(); }
  else showWho();
  if (!OLD_HOME && !famLink) setTimeout(askCloudOnce, 600);
}
/* boot() и Cloud.start() вызывает index.html, когда загружены ВСЕ скрипты: мир Лизы (kid.js) подключается последним.
   Раньше boot() стоял здесь, и устройство, где единственный игрок — Лиза, получало белый экран. */
