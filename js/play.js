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
    rest.push({ gen: R.pick(TOPIC[tid].gens), d: topicDifficulty(tid) });
  }
  begin({ mode: 'daily', title: 'Задание дня', queue: R.shuffle(due.concat(rest)) });
}
function startReview() {
  let list = dueMistakes(); const early = !list.length;
  if (early) list = S.mistakes.slice();
  if (!list.length) { toast('Корзинка пуста — ошибок нет! 🎉'); return; }
  begin({ mode: 'review', early, title: 'Корзинка ошибок', queue: R.shuffle(list).slice(0, 10).map(m => ({ gen: m.gen, d: m.d, mistakeId: m.id })) });
}
function begin(cfg) { SES = Object.assign({ i: 0, ok: 0, acorns: 0, wrongStreak: 0, results: [] }, cfg); nextTask(); }

function nextTask() {
  if (SES.i >= SES.queue.length) return finish();
  const item = SES.queue[SES.i];
  let d = item.d, easier = false;
  if (SES.mode === 'level' && SES.wrongStreak >= 2 && d > 1) { d--; easier = true; }
  Object.assign(SES, { task: makeTask(item.gen, d), item, easier, answered: false, hint: false, input: '', sel: new Set() });
  renderTask();
}

function answerUI(t) {
  if (t.type === 'num') return `<div class="display empty" id="disp">?</div>
    <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => `<button class="key" data-act="key" data-k="${k}">${k}</button>`).join('')}
    <button class="key del" data-act="key" data-k="del">⌫</button><button class="key" data-act="key" data-k="0">0</button>
    <button class="key" style="background:var(--green);color:#fff;border-color:var(--green-d);box-shadow:0 4px 0 var(--green-d)" data-act="check">✓</button></div>`;
  if (t.type === 'choice') {
    const two = t.options.length === 2 || (t.options.length === 3 && t.options.every(o => o.length < 12)) ? (t.options.length === 2 ? ' two' : '') : '';
    return `<div class="opts${two}">${t.options.map((o, i) => `<button class="opt${t.mono ? ' mono' : ''}" data-act="pick" data-i="${i}">${o}</button>`).join('')}</div>`;
  }
  return `<div class="chips">${t.items.map((o, i) => `<button class="chipb" data-act="tog" data-i="${i}">${o}</button>`).join('')}</div>
    <button class="btn green block" style="margin-top:14px" data-act="check" id="mcheck" disabled>Проверить</button>`;
}
function renderTask() {
  const t = SES.task, pct = (SES.i / SES.queue.length) * 100;
  const tags = (SES.easier ? '<div class="easier">полегче — разминка 🌱</div> ' : '') + (SES.item.mistakeId ? '<div class="easier">🧺 из корзинки ошибок</div>' : '');
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
    d.style.borderColor = ok ? 'var(--green)' : 'var(--red)'; d.style.background = ok ? '#E3F4D2' : '#FBE0D8';
    document.querySelector('.keypad').classList.add('hidden');
    return answered(ok, fmt(given));
  }
  const chosen = [...SES.sel].map(i => t.items[i]);
  const ok = chosen.length === t.answer.length && chosen.every(c => t.answer.includes(c));
  document.querySelectorAll('.chipb').forEach((b, i) => {
    b.disabled = true; const inA = t.answer.includes(t.items[i]), on = SES.sel.has(i);
    b.classList.remove('on');
    if (on && inA) b.classList.add('right'); else if (on && !inA) b.classList.add('wrong'); else if (!on && inA) b.classList.add('missed');
  });
  document.getElementById('mcheck').classList.add('hidden');
  answered(ok, chosen.join(', ') || '—');
};
ACT.hint = () => {
  if (SES.answered) return;
  SES.hint = true;
  const hb = document.querySelector('#helper .bubble');
  hb.innerHTML = `💡 ${SES.task.hint}<div class="small muted" style="margin-top:4px">(с подсказкой орешек не начисляется)</div>`;
  document.querySelector('#helper svg').outerHTML = ART.chip('mindal', 'think');
};

function answered(ok, given) {
  const t = SES.task;
  SES.answered = true;
  recordAnswer(t, ok, given, { mistakeId: SES.item.mistakeId });
  let ac = 0;
  if (ok) { SES.ok++; SES.wrongStreak = 0; ac = SES.hint ? 0 : (t.d >= 3 ? 2 : 1); SES.acorns += ac; giveAcorns(ac); save(); Sound.ok(); }
  else { SES.wrongStreak++; Sound.bad(); }
  SES.results.push({ ok, topic: t.topic, gen: t.gen });
  const last = SES.i + 1 >= SES.queue.length;
  const steps = `<ol>${t.explain.map(s => `<li>${nb(s)}</li>`).join('')}</ol>`;
  document.getElementById('fb').innerHTML = ok
    ? `<div class="feedback ok"><div class="fh">✅ ${phrase(PH_OK)} ${ac ? `+${ac} ${ART.acorn(20)}` : ''}</div>
       <details><summary class="small muted">Как решать?</summary>${steps}</details></div>`
    : `<div class="feedback bad"><div class="fh">🤔 ${phrase(PH_BAD)}</div><div>Правильный ответ: <b>${esc(answerText(t))}</b></div>${steps}</div>`;
  document.getElementById('fb').insertAdjacentHTML('beforeend', `<button class="btn ${ok ? 'green' : ''} block" style="margin-top:14px" data-act="next">${last ? 'Готово 🏁' : ok ? 'Дальше →' : 'Понятно, дальше →'}</button>`);
  const hl = document.getElementById('helper');
  hl.innerHTML = `${ART.chip(ok ? 'funduk' : 'mindal', ok ? 'cheer' : 'think')}<div class="bubble">${ok ? R.pick(['Ура! 🎉', 'Молодец!', 'Так держать!', 'Орешек наш! 🌰']) : R.pick(['Прочитай разбор — в следующий раз точно получится!', 'Я положу эту задачку в корзинку, повторим позже 🧺', 'Ошибаться — нормально. Главное — понять!'])}</div>`;
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
  const n = s.queue.length, ok = s.ok;
  if (s.mode === 'level') {
    const T = TOPIC[s.topic];
    if (s.boss) {
      const win = ok >= n - 1;
      if (win) { const first = !S.medals[s.topic]; S.medals[s.topic] = true; S.stars[lvKey(s.topic, 4)] = 3; if (first) giveAcorns(15); }
      save();
      if (win) { Sound.win(); confetti(); }
      return showResult({
        mood: win ? 'cheer' : 'think', title: win ? `Испытание пройдено! 🏅` : 'Почти получилось!',
        text: win ? `${T.who} говорит спасибо! Ты получаешь медаль «${T.name}».` : `Нужно ${n - 1} верных из ${n}, а у тебя ${ok}. Попробуй ещё раз — ты сможешь!`,
        stars: null, ok, n, acorns: s.acorns + (win ? 15 : 0),
        buttons: [[win ? 'На карту' : 'Попробовать ещё', win ? 'map' : 'again', 'green'], [win ? 'Ещё раз' : 'На карту', win ? 'again' : 'map', 'ghost']], again: [s.topic, s.level]
      });
    }
    const stars = ok >= 9 ? 3 : ok >= 8 ? 2 : ok >= 6 ? 1 : 0;
    const prev = starsOf(s.topic, s.level);
    S.stars[lvKey(s.topic, s.level)] = Math.max(prev, stars);
    const bonus = stars * 2; giveAcorns(bonus); save();
    if (stars >= 2) { Sound.win(); if (stars === 3) confetti(); }
    const nextOpen = s.level < 4 && isOpen(s.topic, s.level + 1);
    const btns = [];
    if (stars >= 2 && nextOpen) btns.push([`Дальше: ${LEVELS[s.level].name} →`, 'nextLevel', 'green']);
    btns.push(['Ещё раз', 'again', stars >= 2 ? 'ghost' : 'green'], ['К локации', 'toTopic', 'ghost']);
    return showResult({
      mood: stars >= 2 ? 'cheer' : stars === 1 ? 'happy' : 'think',
      title: stars === 3 ? 'Великолепно!' : stars === 2 ? 'Отличная работа!' : stars === 1 ? 'Неплохо!' : 'Надо ещё потренироваться',
      text: stars >= 2 ? (nextOpen && s.level < 3 ? 'Следующий уровень открыт!' : s.level === 3 ? 'Теперь тебе по силам Испытание!' : '') : `Чтобы открыть следующий уровень, нужно 8 верных из 10.`,
      stars, ok, n, acorns: s.acorns + bonus, buttons: btns, again: [s.topic, s.level]
    });
  }
  if (s.mode === 'diag') {
    const scores = {};
    TOPICS.forEach(T => { scores[T.id] = 0; });
    s.results.forEach(r => { if (r.ok) scores[r.topic]++; });
    TOPICS.forEach(T => { const sc = scores[T.id]; S.mastery[T.id] = { m: [0.3, 0.6, 0.85][sc], n: 2, ok: sc }; });
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
