/* Прогресс: хранится на устройстве (localStorage) */
'use strict';

const STORE_KEY = 'orehpatrol_v1';
const dstr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dstr(new Date());
function addDays(s, n) { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return dstr(d); }

const fresh = () => ({ v: 1, name: '', created: today(), acorns: 0, earned: 0, sound: true, stars: {}, medals: {},
  mastery: {}, mistakes: [], history: {}, streak: { last: null, count: 0, best: 0 }, daily: { date: null, done: false },
  stickers: [], diag: null, recent: [], solved: 0, right: 0 });
function loadState() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return Object.assign(fresh(), JSON.parse(raw)); } catch (e) { }
  return fresh();
}
let S = loadState();
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { } }
function resetAll() { S = fresh(); save(); }

/* Освоенность темы: 0..1, сглаженная по последним ответам */
function mast(topic) { return S.mastery[topic] || { m: null, n: 0, ok: 0 }; }
function updMastery(topic, d, ok) {
  const M = S.mastery[topic] || { m: 0.5, n: 0, ok: 0 };
  const target = ok ? (d === 1 ? 0.8 : 1) : (d === 3 ? 0.2 : 0);
  M.m = M.n === 0 && M.m === 0.5 ? (ok ? 0.7 : 0.3) : M.m * 0.85 + target * 0.15;
  M.n++; if (ok) M.ok++;
  S.mastery[topic] = M;
}
function masteryLabel(m) {
  if (m === null || m === undefined) return ['нет данных', '#D8C4A8'];
  if (m >= 0.8) return ['уверенно', '#5E9E4A'];
  if (m >= 0.55) return ['почти', '#F5B43C'];
  return ['подтянуть', '#D9553A'];
}

const plain = s => String(s).replace(/<br\s*\/?>/g, ' ').replace(/<div[^>]*>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function recordAnswer(task, ok, given, opts = {}) {
  S.solved++; if (ok) S.right++;
  updMastery(task.topic, task.d, ok);
  const t = today();
  const H = S.history[t] || { n: 0, ok: 0 }; H.n++; if (ok) H.ok++; S.history[t] = H;
  S.recent.unshift({ ts: Date.now(), topic: task.topic, q: plain(task.q).slice(0, 220), given: String(given), right: answerText(task), ok });
  S.recent = S.recent.slice(0, 40);
  if (opts.mistakeId) reviewMistake(opts.mistakeId, ok);
  else if (!ok) addMistake(task, given);
  save();
}
function answerText(task) { return task.type === 'multi' ? task.answer.join(', ') : task.type === 'num' ? fmt(task.answer) : task.answer; }

/* Корзинка ошибок: интервальные повторения 1 → 3 → 7 дней */
const BOX_DAYS = [0, 1, 3, 7];
function addMistake(task, given) {
  const ex = S.mistakes.find(m => m.gen === task.gen && m.d === task.d);
  const rec = { gen: task.gen, d: task.d, topic: task.topic, q: plain(task.q).slice(0, 220), given: String(given), right: answerText(task), box: 1, due: addDays(today(), 1), ts: Date.now() };
  if (ex) Object.assign(ex, rec); else S.mistakes.push(Object.assign({ id: 'm' + Date.now() + Math.floor(Math.random() * 1000) }, rec));
  if (S.mistakes.length > 60) S.mistakes.splice(0, S.mistakes.length - 60);
}
function reviewMistake(id, ok) {
  const i = S.mistakes.findIndex(m => m.id === id); if (i < 0) return;
  const m = S.mistakes[i];
  if (ok) { m.box++; if (m.box > 3) { S.mistakes.splice(i, 1); return; } m.due = addDays(today(), BOX_DAYS[m.box]); }
  else { m.box = 1; m.due = addDays(today(), 1); }
}
const dueMistakes = () => S.mistakes.filter(m => m.due <= today());

/* Серия дней */
function markActive() {
  const t = today();
  if (S.streak.last === t) return;
  S.streak.count = S.streak.last === addDays(t, -1) ? S.streak.count + 1 : 1;
  S.streak.last = t; S.streak.best = Math.max(S.streak.best, S.streak.count);
  save();
}
const streakNow = () => (S.streak.last === today() || S.streak.last === addDays(today(), -1)) ? S.streak.count : 0;

/* Уровни */
const lvKey = (topic, n) => `${topic}:${n}`;
const starsOf = (topic, n) => S.stars[lvKey(topic, n)] || 0;
const isOpen = (topic, n) => n === 1 || starsOf(topic, n - 1) >= 2;
function topicStars(topic) { let s = 0; for (let n = 1; n <= 3; n++) s += starsOf(topic, n); return s; }
function giveAcorns(n) { S.acorns += n; S.earned += n; }

/* Рекомендация: самые слабые темы */
function weakTopics(k = 2) {
  const scored = TOPICS.map(t => { const M = mast(t.id); return { id: t.id, m: M.m === null || M.m === undefined ? 0.5 : M.m, n: M.n }; });
  return scored.sort((a, b) => a.m - b.m || a.n - b.n).slice(0, k).map(x => x.id);
}
function topicDifficulty(topic) { const M = mast(topic); const m = M.m === null || M.m === undefined ? 0.5 : M.m; return m < 0.5 ? 1 : m < 0.8 ? 2 : 3; }

/* Наклейки */
const STICKERS = [
  ['🦔', 'Ёжик', 15], ['🍄', 'Грибок', 15], ['🍁', 'Кленовый лист', 20], ['🐞', 'Божья коровка', 20], ['🦋', 'Бабочка', 25], ['🐝', 'Пчёлка', 25],
  ['🦉', 'Сова', 30], ['🦊', 'Лисёнок', 30], ['🐸', 'Лягушонок', 35], ['🦫', 'Бобр', 35], ['🐻', 'Медвежонок', 40], ['🦝', 'Енот', 40],
  ['🌈', 'Радуга', 50], ['🎃', 'Тыква', 50], ['⭐', 'Звезда', 60], ['🏰', 'Замок', 70], ['🦄', 'Единорог', 90], ['🏆', 'Кубок патруля', 120]
];

function exportCode() { try { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); } catch (e) { return ''; } }
function importCode(code) {
  const obj = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!obj || typeof obj !== 'object' || !('acorns' in obj)) throw new Error('bad');
  S = Object.assign(fresh(), obj); save();
}
