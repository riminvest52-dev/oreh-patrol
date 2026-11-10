/* Общие элементы интерфейса: экраны, модалка, звук, конфетти, фразы */
'use strict';

const $app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function mount(html, onMount) {
  document.body.classList.remove('kidw');
  $app.innerHTML = `<div class="screen">${html}</div>`;
  const root = $app.firstElementChild;
  root.scrollTop = 0;
  if (onMount) onMount(root);
  return root;
}
/* Делегирование кликов: data-act="имя" → ACT[имя](элемент) */
const ACT = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.hasAttribute('disabled')) return;
  const f = ACT[el.dataset.act];
  if (f) { Sound.click(); f(el, e); }
});

function modal(html) {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="sheet">${html}</div>`;
  m.classList.remove('hidden');
  m.onclick = e => { if (e.target === m) closeModal(); };
}
function closeModal() { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; }
ACT.close = closeModal;

let toastT;
function toast(msg, ms = 1800) {
  const t = document.getElementById('toast');
  t.innerHTML = msg; t.classList.remove('hidden');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), ms);
}
function confetti(n = 26) {
  const box = document.createElement('div'); box.className = 'confetti';
  const items = ['🍂', '🌰', '⭐', '🍁', '✨'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.textContent = items[i % items.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
    s.style.animationDelay = (Math.random() * 0.5) + 's';
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3800);
}

/* Звуки синтезируются на лету — никаких файлов */
const Sound = (() => {
  let ctx = null;
  const ensure = () => {
    if (!S.sound) return null;
    try { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); } catch (e) { return null; }
    return ctx;
  };
  const tone = (f, t0, dur, type = 'sine', vol = 0.18) => {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    const t = c.currentTime + t0;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  };
  return {
    unlock: ensure,
    click: () => tone(900, 0, 0.05, 'sine', 0.05),
    ok: () => { tone(660, 0, 0.14, 'triangle'); tone(990, 0.1, 0.22, 'triangle'); },
    bad: () => { tone(330, 0, 0.18, 'sine', 0.12); tone(262, 0.14, 0.26, 'sine', 0.12); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.16)),
    coin: () => { tone(1320, 0, 0.08, 'square', 0.05); tone(1760, 0.06, 0.12, 'square', 0.05); }
  };
})();
document.addEventListener('pointerdown', () => Sound.unlock(), { once: true });

const PH_OK = ['Верно!', 'Отлично!', 'Точно в цель!', 'Вот это да!', 'Ты наш герой!', 'Орешек в копилку!', 'Супер!', 'Так держать, {name}!', 'Ура, правильно!', 'Здорово, {name}!'];
const PH_BAD = ['Почти! Давай разберёмся.', 'Не беда — смотри, как надо.', 'Ошибки — это ступеньки вверх. Разберём!', 'Хитрая задачка! Вот решение.', 'Ничего страшного, {name}! Смотри.'];
const phrase = arr => R.pick(arr).replace('{name}', S.name || 'друг');
const starsHtml = (n, max = 3) => Array.from({ length: max }, (_, i) => i < n ? '★' : '<span class="off">★</span>').join('');
