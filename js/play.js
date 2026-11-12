/* Игровая сессия: уровень, проверка сил, задание дня, корзинка ошибок */
'use strict';

let SES = null;
/* Неразрывный пробел между числом и словом/единицей: «39 см²» не разорвётся на две строки */
const nb = s => String(s).replace(/(\d) (?=[а-яёА-ЯЁ])/g, '$1 ');

function startLevel(topicId, n) {
  const T = TOPIC[topicId], L = LEVELS[n - 1];
  const gens = []; while (gens.length < L.count) gens.push(...R.shuffle(T.gens));
  begin({ mode: 'level', topic: topicId, level: n, boss: !!L.boss, title: `${T.name} · ${L.name}`, queue: gens.slice(0, L.count).map(g => ({ gen: g, d: L.d })) });
}
function startDiag() {
  const queue = [];
  for (const T of TOPICS) {
    if (T.noDiag) continue;
    if (T.id === 'fund') { queue.push({ gen: 'f_div0', d: 2 }, { gen: 'f_units', d: 2 }); continue; }
    const [a, b] = R.shuffle(T.gens);
    queue.push({ gen: a, d: 1 }, { gen: b || a, d: 2 });
  }
  begin({ mode: 'diag', title: 'Проверка сил', queue });
}
function startDaily() {
  const due = R.shuffle(dueMistakes()).slice(0, 4).map(m => ({ gen: m.gen, d: m.d, mistakeId: m.id }));
  const weak = weakTopics(3), rest = [];
  for (let i = 0; due.length + rest.length < 10; i++) {
    const tid = i < 5 ? weak[i % weak.length] : R.pick(TOPICS).id;
    rest.push({ gen: weakGen(tid), d: topicDifficulty(tid) });
  }
  begin({ mode: 'daily', title: 'Задание дня', queue: R.shuffle(due.concat(rest)) });
}
function startReview() {
  let list = dueMistakes(); const early = !list.length;
  if (early) list = S.mistakes.slice();
  if (!list.length) { toast('Корзинка пуста — ошибок нет! 🎉'); return; }
  begin({ mode: 'review', early, title: 'Корзинка ошибок', queue: R.shuffle(list).slice(0, 10).map(m => ({ gen: m.gen, d: m.d, mistakeId: m.id })) });
}
function begin(cfg) {
  SES = Object.assign({ i: 0, ok: 0, score: 0, acorns: 0, wrongStreak: 0, cleanRun: 0, run: 0, pend: null, cheapN: 0, results: [] }, cfg);
  /* Повтор «Ростка» после 3★: орешки только за каждый второй чистый ответ */
  SES.cheap = SES.mode === 'level' && SES.level === 1 && starsOf(SES.topic, 1) === 3;
  nextTask();
}
/* Вторая попытка: везде, кроме проверки сил и выбора из двух */
const is5050 = t => t.type === 'choice' && t.options.length <= 2;
const canRetry = t => SES.mode !== 'diag' && !is5050(t);
function findTrap(t, given) {
  if (!t.traps || !t.traps.length || given === null || given === undefined) return null;
  return t.traps.find(x => t.type === 'num' ? +x.v === +String(given).replace(/\s/g, '') : String(x.v) === String(given)) || null;
}

function nextTask() {
  if (SES.i >= SES.queue.length) return finish();
  const item = SES.queue[SES.i];
  let d = item.d, easier = false;
  let star = false;
  if (SES.mode === 'level' && SES.wrongStreak >= 2 && d > 1) { d--; easier = true; }
  /* После 4 чистых ответов подряд — задача на ступень выше */
  else if (SES.mode === 'level' && !SES.boss && SES.cleanRun >= 4 && d < 3) { d++; star = true; SES.cleanRun = 0; }
  Object.assign(SES, { task: makeTask(item.gen, d), item, easier, star, answered: false, hint: false, tries: 0, firstGiven: null, firstTrap: null, input: '', sel: new Set() });
  renderTask();
}

function answerUI(t) {
  if (t.type === 'num') return `<div class="display empty" id="disp">?</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button class="key" data-act="key" data-k="${k}">${k}</button>`).join('')}
    <button class="key del" data-act="key" data-k="del">⌫</button><button class="key" data-act="key" data-k="0">0</button>
    <button class="key" style="background:var(--green);color:#fff;border-color:var(--green-d);box-shadow:0 4px 0 var(--green-d)" data-act="check">✓</button></div>`;
  if (t.type === 'build') return buildUI(t);
  if (t.optHtml) return `<div class="opts two pics">${t.options.map((o, i) => `<button class="opt pic" data-act="pick" data-i="${i}" aria-label="Вариант ${o}">${t.optHtml[i]}</button>`).join('')}</div>`;
  if (t.type === 'choice') {
    const two = t.options.length === 2 || t.cols2 || (t.options.length === 3 && t.options.every(o => o.length < 12)) ? (t.options.length === 2 || t.cols2 ? ' two' : '') : '';
    return `<div class="opts${two}">${t.options.map((o, i) => `<button class="opt${t.mono ? ' mono' : ''}" data-act="pick" data-i="${i}">${o}</button>`).join('')}</div>`;
  }
  return `<div class="chips${t.wide ? ' wide' : ''}">${t.items.map((o, i) => `<button class="chipb" data-act="tog" data-i="${i}">${o}</button>`).join('')}</div>
    <button class="btn green block" style="margin-top:14px" data-act="check" id="mcheck" disabled>Проверить</button>`;
}
function renderTask() {
  const t = SES.task, pct = (SES.i / SES.queue.length) * 100;
  const tags = (SES.easier ? '<div class="easier">полегче — разминка 🌱</div> ' : '') + (SES.star ? '<div class="easier star">⭐ задача со звёздочкой · +1 орешек</div> ' : '')
    + (SES.item.mistakeId ? '<div class="easier">🧺 из корзинки ошибок</div> ' : '') + (t.draft ? '<div class="easier draft">✏️ реши на черновике</div>' : '');
  mount(`<div class="play">
    <div class="playtop"><button class="iconbtn" data-act="quit" aria-label="Выйти">✕</button><div class="progress"><i style="width:${pct}%"></i></div>
      <span class="pill">${ART.acorn(20)}<span>${SES.acorns}</span></span></div>
    <div class="muted small" style="margin:0 0 8px 2px">${esc(SES.title)} · ${SES.i + 1} из ${SES.queue.length}</div>
    <div class="card task">${tags}<div>${nb(t.q)}</div>${t.fig || ''}</div>
    <div class="answer" id="ans">${answerUI(t)}</div>
    <div id="fb"></div>
    <div class="helper" id="helper">${ART.chip('mindal', 'happy')}<div class="bubble">
      ${SES.mode === 'diag' ? 'Это проверка сил — просто реши как умеешь. Подсказок тут нет 🙂' : `Не спеши, подумай! <button class="btn ghost" style="min-height:40px;padding:6px 12px;font-size:15px;margin-top:6px" data-act="hint">💡 Подсказка</button>`}
    </div></div></div>`);
}

ACT.key = el => {
  if (SES.answered) return;
  const k = el.dataset.k;
  if (k === 'del') SES.input = SES.input.slice(0, -1);
  else if (SES.input.length < 7) SES.input = (SES.input === '0' ? '' : SES.input) + k;
  const d = document.getElementById('disp');
  d.textContent = SES.input ? fmt(+SES.input) : '?';
  d.classList.toggle('empty', !SES.input);
};
document.addEventListener('keydown', e => {
  if (!SES || SES.answered || !SES.task || !document.getElementById('ans')) return;
  if (SES.task.type === 'num') {
    if (/^\d$/.test(e.key)) ACT.key({ dataset: { k: e.key } });
    else if (e.key === 'Backspace') ACT.key({ dataset: { k: 'del' } });
    else if (e.key === 'Enter') ACT.check();
  }
});
ACT.pick = el => {
  if (SES.answered) return;
  const t = SES.task, i = +el.dataset.i, given = t.options[i], ok = given === t.answer;
  if (!ok && SES.tries === 0 && canRetry(t)) { el.disabled = true; el.classList.add('wrong'); return retry(given); }
  document.querySelectorAll('.opt').forEach((b, j) => {
    b.disabled = true;
    if (t.options[j] === t.answer) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); else b.classList.add('dim');
  });
  answered(ok, given);
};
ACT.tog = el => {
  if (SES.answered) return;
  const i = +el.dataset.i;
  if (SES.sel.has(i)) SES.sel.delete(i); else SES.sel.add(i);
  el.classList.toggle('on');
  document.getElementById('mcheck').disabled = !SES.sel.size;
};
ACT.check = () => {
  if (SES.answered) return;
  const t = SES.task;
  if (t.type === 'num') {
    if (!SES.input) { toast('Сначала введи ответ 🙂'); return; }
    const given = +SES.input, ok = given === t.answer;
    const d = document.getElementById('disp');
    if (!ok && SES.tries === 0 && canRetry(t)) {
      SES.input = ''; d.textContent = fmt(given); d.style.borderColor = 'var(--red)'; d.style.background = '#FBE0D8';
      setTimeout(() => { if (!SES || SES.answered || SES.input) return; d.textContent = '?'; d.classList.add('empty'); d.style.borderColor = ''; d.style.background = ''; }, 900);
      return retry(fmt(given));
    }
    d.style.borderColor = ok ? 'var(--green)' : 'var(--red)'; d.style.background = ok ? '#E3F4D2' : '#FBE0D8';
    document.querySelector('.keypad').classList.add('hidden');
    return answered(ok, fmt(given));
  }
  if (t.type === 'build') {   /* «Построй по трём видам» (js/t-vol.js) */
    const B = SES.bh, ok = t.check(B), txt = buildText(B);
    if (!B.flat().some(Boolean)) { toast('Сначала поставь кубики 🙂'); return; }
    if (!ok && SES.tries === 0 && canRetry(t)) return retry(txt);
    document.querySelectorAll('.vbc').forEach(b => { b.disabled = true; });
    document.getElementById('vbcheck').classList.add('hidden');
    return answered(ok, txt);
  }
  const chosen = [...SES.sel].map(i => t.items[i]);
  const ok = chosen.length === t.answer.length && chosen.every(c => t.answer.includes(c));
  if (!ok && SES.tries === 0 && canRetry(t)) return retry(chosen.join('; ') || '—');
  document.querySelectorAll('.chipb').forEach((b, i) => {
    b.disabled = true; const inA = t.answer.includes(t.items[i]), on = SES.sel.has(i);
    b.classList.remove('on');
    if (on && inA) b.classList.add('right'); else if (on && !inA) b.classList.add('wrong'); else if (!on && inA) b.classList.add('missed');
  });
  document.getElementById('mcheck').classList.add('hidden');
  answered(ok, chosen.join('; ') || '—');
};
ACT.hint = () => {
  if (SES.answered) return;
  SES.hint = true;
  const hb = document.querySelector('#helper .bubble');
  hb.innerHTML = `💡 ${SES.task.hint}<div class="small muted" style="margin-top:4px">(с подсказкой орешек не начисляется, а для звёзд ответ считается за половинку)</div>`;
  document.querySelector('#helper svg').outerHTML = ART.chip('mindal', 'think');
};

/* Первая ошибка: не показываем ответ, даём подсказку и ещё одну попытку */
function retry(given) {
  const t = SES.task;
  SES.tries = 1; SES.firstGiven = given; SES.firstTrap = findTrap(t, given);
  Sound.bad();
  document.getElementById('fb').innerHTML = `<div class="feedback try"><div class="fh">🤔 Не совсем. Попробуй ещё раз!</div></div>`;
  const hl = document.getElementById('helper');
  hl.innerHTML = `${ART.chip('mindal', 'think')}<div class="bubble">${SES.firstTrap ? `🔎 ${SES.firstTrap.msg}<br>` : ''}💡 ${t.hint}</div>`;
}

function answered(ok, given) {
  const t = SES.task, second = SES.tries > 0;
  SES.answered = true;
  const first = ok && !second;                         /* верно с первой попытки */
  const credit = first ? (SES.hint ? 0.5 : 1) : 0;     /* вклад в звёзды */
  /* Выбор из двух засчитывается, только если следующая задача тоже решена */
  if (SES.pend !== null) { if (!credit) SES.score -= SES.pend; SES.pend = null; }
  SES.score += credit;
  if (credit && is5050(t) && SES.mode === 'level') SES.pend = credit;
  recordAnswer(t, first, second ? SES.firstGiven : given, { mistakeId: SES.item.mistakeId, hint: SES.hint });
  let ac = 0;
  if (credit === 1) {
    ac = (t.d >= 3 ? 2 : 1) + (SES.star ? 1 : 0);
    if (SES.cheap && (++SES.cheapN) % 2) ac = 0;
  }
  if (first) SES.ok++;
  SES.cleanRun = credit === 1 ? SES.cleanRun + 1 : 0;
  SES.wrongStreak = first ? 0 : ok ? SES.wrongStreak : SES.wrongStreak + 1;
  if (ac) { SES.acorns += ac; giveAcorns(ac); save(); }
  if (ok) Sound.ok(); else Sound.bad();
  SES.results.push({ ok: first, topic: t.topic, gen: t.gen });
  const last = SES.i + 1 >= SES.queue.length;
  /* Шаг «запиши как в тетради» и картинка после ответа (складывание развёртки) — js/t-vol.js */
  const steps = `<ol>${t.explain.map(s => `<li>${nb(s)}</li>`).join('')}</ol>`
    + (t.note ? `<div class="tetrad"><div class="small"><b>📓 Запиши в тетрадь:</b></div><div class="tline">${t.note}</div></div>` : '') + (t.after || '');
  const trap = ok ? null : (findTrap(t, given) || SES.firstTrap);
  const okHead = second ? '👍 Получилось со второй попытки!' : `✅ ${phrase(PH_OK)} ${ac ? `+${ac} ${ART.acorn(20)}` : ''}`;
  const okNote = second ? 'В следующий раз постарайся с первой — тогда будет орешек.' : SES.hint ? 'С подсказкой ответ идёт в счёт звёзд половинкой.' : (credit === 1 && !ac && SES.cheap ? 'Этот уровень уже пройден на 3★ — здесь орешек за каждый второй ответ.' : '');
  document.getElementById('fb').innerHTML = ok
    ? `<div class="feedback ok"><div class="fh">${okHead}</div>${okNote ? `<div class="small muted">${okNote}</div>` : ''}
       <details${second || t.after || t.note ? ' open' : ''}><summary class="small muted">Как решать?</summary>${steps}</details></div>`
    : `<div class="feedback bad"><div class="fh">🤔 ${phrase(PH_BAD)}</div>${trap ? `<div class="trapline">🔎 ${nb(trap.msg)}</div>` : ''}<div>Правильный ответ: <b>${esc(answerText(t))}</b></div>${steps}</div>`;
  document.getElementById('fb').insertAdjacentHTML('beforeend', `<button class="btn ${ok ? 'green' : ''} block" style="margin-top:14px" data-act="next">${last ? 'Готово 🏁' : ok ? 'Дальше →' : 'Понятно, дальше →'}</button>`);
  /* Похвала голосом (js/voice.js): со второй попытки, звёздочка, 3 и 5 подряд — всегда, обычный верный ответ — примерно 1 из 3 */
  SES.run = first ? SES.run + 1 : 0;
  const p = ok ? Praise.say(second ? 'second' : SES.star ? 'star' : SES.run === 5 ? 'streak5' : SES.run === 3 ? 'streak3' : 'ok', 'five') : Praise.say('bad', 'five');
  const hero = p ? (p.who === 'mi' ? 'mindal' : 'funduk') : ok ? 'funduk' : 'mindal';
  const line = p ? esc(p.text) : ok ? R.pick(['Ура! 🎉', 'Молодец!', 'Так держать!', 'Орешек наш! 🌰']) : R.pick(['Прочитай разбор — в следующий раз точно получится!', 'Я положу эту задачку в корзинку, повторим позже 🧺', 'Ошибаться — нормально. Главное — понять!']);
  const hl = document.getElementById('helper');
  hl.innerHTML = `${ART.chip(hero, ok ? 'cheer' : 'show')}<div class="bubble">${line}</div>`;
  setTimeout(() => { const fb = document.getElementById('fb'); if (fb) fb.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
}
ACT.next = () => { SES.i++; nextTask(); };
ACT.quit = () => {
  modal(`<h2>Выйти из задания?</h2><p class="muted">Орешки, которые ты уже заработала, останутся. А уровень придётся начать заново.</p>
    <div class="stack"><button class="btn green block" data-act="close">Продолжить решать</button><button class="btn ghost block" data-act="quitYes">Выйти на карту</button></div>`);
};
ACT.quitYes = () => { closeModal(); SES = null; showMap(); };

function finish() {
  const s = SES; SES = null;
  markActive();
  const n = s.queue.length, ok = s.ok, sc = Math.max(0, s.score), scTxt = String(sc).replace('.', ',');
  if (s.mode === 'level') {
    const T = TOPIC[s.topic];
    if (s.boss) {
      const win = sc >= n - 1;
      if (win) { const first = !S.medals[s.topic]; S.medals[s.topic] = true; S.stars[lvKey(s.topic, 4)] = 3; if (first) giveAcorns(15); }
      save();
      if (win) { Sound.win(); confetti(); }
      if (win) setTimeout(() => Praise.say('medal', 'five'), 0);
      return showResult({
        mood: win ? 'cheer' : 'think', title: win ? `Испытание пройдено! 🏅` : 'Почти получилось!',
        text: win ? `${T.who} говорит спасибо! Ты получаешь медаль «${T.name}».` : `Нужно ${n - 1} верных из ${n} с первой попытки, а у тебя ${scTxt}. Попробуй ещё раз — ты сможешь!`,
        stars: null, ok: scTxt, n, acorns: s.acorns + (win ? 15 : 0),
        buttons: [[win ? 'На карту' : 'Попробовать ещё', win ? 'map' : 'again', 'green'], [win ? 'Ещё раз' : 'На карту', win ? 'again' : 'map', 'ghost']], again: [s.topic, s.level]
      });
    }
    const stars = sc >= 9 ? 3 : sc >= 8 ? 2 : sc >= 6 ? 1 : 0;
    const prev = starsOf(s.topic, s.level);
    S.stars[lvKey(s.topic, s.level)] = Math.max(prev, stars);
    const bonus = Math.max(0, stars - prev) * 2; giveAcorns(bonus); save();
    if (stars >= 2) { Sound.win(); if (stars === 3) confetti(); setTimeout(() => Praise.say('level', 'five'), 0); }
    const nextOpen = s.level < 4 && isOpen(s.topic, s.level + 1);
    const btns = [];
    if (stars >= 2 && nextOpen) btns.push([`Дальше: ${LEVELS[s.level].name} →`, 'nextLevel', 'green']);
    btns.push(['Ещё раз', 'again', stars >= 2 ? 'ghost' : 'green'], ['К локации', 'toTopic', 'ghost']);
    return showResult({
      mood: stars >= 2 ? 'cheer' : stars === 1 ? 'happy' : 'think',
      title: stars === 3 ? 'Великолепно!' : stars === 2 ? 'Отличная работа!' : stars === 1 ? 'Неплохо!' : 'Надо ещё потренироваться',
      text: (stars >= 2 ? (nextOpen && s.level < 3 ? (prev < 2 ? 'Следующий уровень открыт!' : '') : s.level === 3 ? 'Теперь тебе по силам Испытание!' : '') : `Чтобы открыть следующий уровень, нужно 8 верных из 10.`)
        + ' Считаются ответы с первой попытки; с подсказкой — половинка.',
      stars, ok: scTxt, n, acorns: s.acorns + bonus, buttons: btns, again: [s.topic, s.level]
    });
  }
  if (s.mode === 'diag') {
    const scores = {};
    TOPICS.forEach(T => { if (!T.noDiag) scores[T.id] = 0; });
    s.results.forEach(r => { if (r.ok) scores[r.topic]++; });
    TOPICS.forEach(T => { if (T.noDiag) return; const sc = scores[T.id]; S.mastery[T.id] = { m: [0.3, 0.6, 0.85][sc], n: 2, ok: sc, ts: Date.now() }; });
    S.diag = { date: today(), scores }; giveAcorns(5); save(); Sound.win();
    return showDiagResult(scores, ok, n);
  }
  if (s.mode === 'daily') {
    const first = !(S.daily.date === today() && S.daily.done);
    S.daily = { date: today(), done: true }; if (first) giveAcorns(10); save(); Sound.win(); confetti(18);
    return showResult({ mood: 'cheer', title: 'Задание дня выполнено! 🔥', text: `Серия: ${streakNow()} ${pl(streakNow(), 'день', 'дня', 'дней')} подряд. Приходи завтра!`,
      stars: null, ok, n, acorns: s.acorns + (first ? 10 : 0), buttons: [['На карту', 'map', 'green']] });
  }
  save();
  return showResult({ mood: ok >= n - 1 ? 'cheer' : 'happy', title: 'Повторение окончено', text: `В корзинке ${S.mistakes.length ? 'осталось ' + S.mistakes.length + ' ' + pl(S.mistakes.length, 'задание', 'задания', 'заданий') : 'пусто — всё повторено! 🎉'}. Правильно решённые задачи вернутся через несколько дней для закрепления.`,
    stars: null, ok, n, acorns: s.acorns, buttons: [['На карту', 'map', 'green']] });
}
