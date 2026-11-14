/* ВПР-тренировка (4 класс): 12 заданий в порядке, похожем на демоверсию ВПР; формулировки свои.
   Без подсказок и без второй попытки, ответы не проверяются сразу — разбор списком в конце.
   Открывается после Проверки сил. Лучший результат — S.vpr. */
'use strict';

const VPR_PLAN = [
  ['c_sub', 2, 'Вычисления с многозначными числами'],
  ['o4_value', 2, 'Порядок действий'],
  ['r_shop', 3, 'Задача о покупке'],
  ['u_time', 2, 'Время'],
  ['g_ps', 2, 'Периметр и площадь'],
  ['d_table', 2, 'Таблица'],
  ['m_div1', 2, 'Умножение и деление'],
  ['r_meet', 2, 'Задача на движение'],
  ['d_tf', 2, 'Верные утверждения'],
  ['u_conv', 2, 'Величины'],
  ['g_solid', 2, 'Объёмные фигуры'],
  ['d_logic', 3, 'Задача на смекалку']
];
function vprCard() {
  const v = S.vpr;
  if (!S.diag) return `<div class="qcard off"><div class="qi">📝</div><div><div class="qt">ВПР-тренировка</div><div class="qs">Откроется после Проверки сил</div></div></div>`;
  return `<div class="qcard" data-act="vpr"><div class="qi">📝</div><div><div class="qt">ВПР-тренировка</div><div class="qs">${v ? `Лучший: ${v.best} из 12` : '12 заданий, как на ВПР'}</div></div></div>`;
}
ACT.vpr = () => modal(`<h2>📝 ВПР-тренировка</h2><p>12 заданий — как на настоящей проверочной работе в конце 4 класса.</p>
  <ul style="padding-left:20px;margin:0 0 12px"><li>Подсказок нет.</li><li>Ответ даётся один раз — исправить нельзя.</li><li>Верно или нет — узнаешь в конце, там же будет разбор каждой задачи.</li><li>Черновик пригодится! Примерно 30–45 минут.</li></ul>
  <div class="stack"><button class="btn green block" data-act="vprGo">Начать</button><button class="btn ghost block" data-act="close">Не сейчас</button></div>`);
ACT.vprGo = () => { closeModal(); startVpr(); };
function startVpr() {
  begin({ mode: 'vpr', title: 'ВПР-тренировка', queue: VPR_PLAN.map(([gen, d, name]) => ({ gen, d, name })) });
}
/* Ответ в ВПР: записываем и сразу дальше (play.js → answered) */
function vprAnswered(ok, given) {
  const t = SES.task;
  recordAnswer(t, ok, given, {});
  if (ok) SES.ok++;
  SES.results.push({ ok, topic: t.topic, gen: t.gen, task: t, given });
  SES.i++; nextTask();
}
function vprFinish(s) {
  const ok = s.ok, n = s.queue.length, prev = S.vpr || {};
  S.vpr = { date: today(), last: ok, best: Math.max(prev.best || 0, ok), n: (prev.n || 0) + 1 };
  const ac = ok; giveAcorns(ac); save(); Sound.win(); if (ok >= 10) confetti();
  const mark = ok >= 11 ? 5 : ok >= 8 ? 4 : ok >= 5 ? 3 : 2;
  const rows = s.results.map((r, i) => {
    const t = r.task;
    return `<details class="vrow ${r.ok ? 'ok' : 'bad'}"${r.ok ? '' : ' open'}><summary><b>${i + 1}.</b> ${r.ok ? '✅' : '❌'} <span class="small muted">${esc(s.queue[i].name)}</span></summary>
      <div class="vq">${nb(t.q)}</div>${t.fig || ''}
      <div>Твой ответ: <b style="color:${r.ok ? 'var(--green-d)' : 'var(--red)'}">${esc(String(r.given === null || r.given === undefined || r.given === '' ? '—' : r.given))}</b>${r.ok ? '' : ` · верно: <b style="color:var(--green-d)">${esc(answerText(t))}</b>`}</div>
      <ol>${t.explain.map(x => `<li>${nb(x)}</li>`).join('')}</ol></details>`;
  }).join('');
  mount(`<div class="topbar"><button class="iconbtn" data-act="map" aria-label="На карту">←</button><div class="grow"><b>ВПР-тренировка</b><div class="small muted">Разбор</div></div></div>
    <div class="result">${ART.chip(ok >= 8 ? 'funduk' : 'mindal', ok >= 8 ? 'cheer' : 'think')}<h1>${ok} из ${n}</h1>
      <p class="muted">Примерно как отметка «${mark}» (ориентир, не настоящая оценка). Лучший результат: ${S.vpr.best} из ${n}.</p>
      <p><span class="pill">+${ac} ${ART.acorn(20)}</span></p></div>
    <div class="vlist">${rows}</div>
    <div class="stack" style="margin-top:14px"><button class="btn green block" data-act="map">На карту</button><button class="btn ghost block" data-act="vpr">Пройти ещё раз</button></div>`);
}
