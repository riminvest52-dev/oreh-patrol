/* Для проверки раскладки: открыть в консоли игры (профиль Лизы) и вызвать kShot(i) — покажет i-ю тему с типичным заданием.
   Также kMeasure() — проверка размеров: предметы ≥ 44/56 px, зоны нажатия ≥ 64 px, Жёлудик ≥ 120 px. */
const K_SHOTS = [['k_cnt', 'k_count', 2], ['k_dig', 'k_digit', 2], ['k_cmp', 'k_more', 2], ['k_line', 'k_line', 2], ['k_house', 'k_frame', 2],
  ['k_add', 'k_sub', 2], ['k_shape', 'k_shape', 3], ['k_where', 'k_where', 3], ['k_logic', 'k_odd', 3]];
function kShot(i) {
  const [tid, gen, d] = K_SHOTS[i];
  kidStart(tid); K.queue = Array(KID_PER_SESSION).fill(gen); K.d = d; K.i = 0;
  for (let k = 0; k < 50; k++) { kidNext(); if (gen !== 'k_digit' || K.t.layout === 'col') break; }
  return KTOPIC[tid].name;
}
function kMeasure() {
  const tablet = innerWidth >= 700 && innerHeight >= 560, need = tablet ? 56 : 44, bad = [];
  const sel = '.kgrp > span, .kpat > span, .dots i, .dice i, .kshapes svg, .kemo, .kit, .tenframe .cell';
  document.querySelectorAll(sel).forEach(e => {
    const r = e.getBoundingClientRect(), m = Math.min(r.width, r.height);
    if (m && m < need - 0.5) bad.push(e.className || e.tagName, Math.round(m));
  });
  document.querySelectorAll('button').forEach(e => {
    const r = e.getBoundingClientRect(); if (!r.width) return;
    if (Math.min(r.width, r.height) < (e.matches('.kit,.kopt,.cell,.ksay') ? 64 : 44) - 0.5) bad.push('btn ' + e.className, Math.round(r.width) + 'x' + Math.round(r.height));
  });
  const z = document.querySelector('#khelp svg'), zh = z ? Math.round(z.getBoundingClientRect().height) : 0;
  const scr = document.querySelector('.screen'), over = scr.scrollWidth > scr.clientWidth + 1;
  return { need, zh, bad, hscroll: over, scrollH: scr.scrollHeight, viewH: scr.clientHeight };
}
