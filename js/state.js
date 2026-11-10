/* Прогресс. У каждого игрока свой, сначала всё пишется на устройство (localStorage).
   Слияние данных с разных устройств: mergeStates. Отправка в облако: js/cloud.js */
'use strict';

const STORE_KEY = 'orehpatrol_v1';          /* формат первой версии (один игрок); не удаляем, это страховка */
const FAMILY_KEY = 'orehpatrol_family_v2';
const profKey = id => 'orehpatrol_p2_' + id;
const WORLDS = { five: { title: '5 класс' } };
const dstr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dstr(new Date());
function addDays(s, n) { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return dstr(d); }

const fresh = () => ({ v: 2, name: '', created: today(), acorns: 0, earned: 0, sound: true, stars: {}, medals: {},
  mastery: {}, mistakes: [], history: {}, streak: { last: null, count: 0, best: 0 }, daily: { date: null, done: false },
  stickers: [], diag: null, recent: [], solved: 0, right: 0, _epoch: 0, _ts: 0, _tally: {}, gone: {} });
const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const readJson = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
/* Сравнение данных без учёта порядка полей */
const canon = o => Array.isArray(o) ? o.map(canon) : (o && typeof o === 'object') ? Object.keys(o).sort().reduce((r, k) => { r[k] = canon(o[k]); return r; }, {}) : o;
const sameData = (x, y) => JSON.stringify(canon(x)) === JSON.stringify(canon(y));

/* Счётчики ведутся отдельно по каждому устройству, поэтому при слиянии ничего не теряется и не удваивается */
const COUNTERS = ['solved', 'right', 'earned'];
function tallyFor(st, dev) {
  st._tally = st._tally || {};
  const mine = st._tally[dev] || (st._tally[dev] = {});
  for (const k of COUNTERS) {
    let others = 0;
    for (const d in st._tally) if (d !== dev) others += st._tally[d][k] || 0;
    mine[k] = Math.max(0, (st[k] || 0) - others);
  }
}

/* Семья: устройство, код, список игроков */
function loadFamily() {
  const saved = readJson(FAMILY_KEY);
  if (saved && saved.v === 2) return saved;
  const fam = { v: 2, device: newId('d'), code: null, lastSync: 0, profiles: [], current: null };
  const old = readJson(STORE_KEY);
  if (old && old.name) {                    /* перенос прогресса из первой версии */
    const id = newId('p'), st = Object.assign(fresh(), old, { v: 2, _ts: Date.now() });
    tallyFor(st, fam.device);
    writeJson(profKey(id), st);
    fam.profiles.push({ id, world: 'five', hero: 'mindal', created: st.created });
    fam.current = id;
  }
  writeJson(FAMILY_KEY, fam);
  return fam;
}
const saveFamily = () => writeJson(FAMILY_KEY, F);
const readProfile = id => { const st = readJson(profKey(id)); return st ? Object.assign(fresh(), st) : null; };
const playerName = p => (readProfile(p.id) || {}).name || '';
const curProfile = () => F.profiles.find(p => p.id === F.current) || null;
function useProfile(id) { F.current = id; saveFamily(); S = readProfile(id) || fresh(); }
function addProfile(world) {
  const id = newId('p');
  F.profiles.push({ id, world, hero: ['mindal', 'funduk'][F.profiles.length % 2], created: today() });
  writeJson(profKey(id), fresh());
  useProfile(id);
}
function save() {
  if (!F.current) return;
  S._ts = Date.now(); tallyFor(S, F.device);
  writeJson(profKey(F.current), S);
  if (typeof Cloud !== 'undefined') Cloud.soon();
}
/* Сброс новой «эпохой»: иначе при слиянии старый прогресс вернулся бы с другого устройства */
function resetAll() { S = Object.assign(fresh(), { name: S.name, sound: S.sound, _epoch: (S._epoch || 0) + 1 }); save(); }

/* Освоенность темы: 0..1, сглаженная по последним ответам */
function mast(topic) { return S.mastery[topic] || { m: null, n: 0, ok: 0 }; }
function updMastery(topic, d, ok) {
  const M = S.mastery[topic] || { m: 0.5, n: 0, ok: 0 };
  const target = ok ? (d === 1 ? 0.8 : 1) : (d === 3 ? 0.2 : 0);
  M.m = M.n === 0 && M.m === 0.5 ? (ok ? 0.7 : 0.3) : M.m * 0.85 + target * 0.15;
  M.n++; if (ok) M.ok++;
  M.ts = Date.now();
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
  m.ts = Date.now();
  if (ok) { m.box++; if (m.box > 3) { S.gone[m.id] = Date.now(); S.mistakes.splice(i, 1); return; } m.due = addDays(today(), BOX_DAYS[m.box]); }
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
  S = mergeStates(S, Object.assign({}, obj, { _epoch: S._epoch })); save();
}

/* Слияние прогресса одного игрока с двух устройств. a — данные этого устройства.
   Заработанное не теряется, повторное слияние ничего не меняет. */
function normState(x) {
  const st = Object.assign(fresh(), x);
  if (!Object.keys(st._tally).length && (st.solved || st.right || st.earned)) st._tally = { old: { solved: st.solved, right: st.right, earned: st.earned } };
  return st;
}
function mergeStates(a, b) {
  const A = normState(a), B = normState(b);
  const keysOf = (x, y) => [...new Set([...Object.keys(x), ...Object.keys(y)])];
  const copy = o => JSON.parse(JSON.stringify(o));
  if (A._epoch !== B._epoch) return Object.assign(copy(A._epoch > B._epoch ? A : B), { sound: A.sound });

  const newer = B._ts > A._ts ? B : A, R = fresh();
  R._epoch = A._epoch; R._ts = Math.max(A._ts, B._ts); R.sound = A.sound;
  R.name = newer.name || A.name || B.name;
  R.created = A.created < B.created ? A.created : B.created;

  for (const k of keysOf(A.stars, B.stars)) R.stars[k] = Math.max(A.stars[k] || 0, B.stars[k] || 0);
  R.medals = Object.assign({}, A.medals, B.medals);
  R.stickers = [...new Set([...A.stickers, ...B.stickers])].sort((x, y) => x - y);

  for (const d of keysOf(A._tally, B._tally)) {
    R._tally[d] = {};
    for (const k of COUNTERS) R._tally[d][k] = Math.max((A._tally[d] || {})[k] || 0, (B._tally[d] || {})[k] || 0);
  }
  for (const k of COUNTERS) R[k] = Object.values(R._tally).reduce((s, t) => s + (t[k] || 0), 0);
  R.acorns = Math.max(0, R.earned - R.stickers.reduce((s, i) => s + (STICKERS[i] ? STICKERS[i][2] : 0), 0));

  for (const t of keysOf(A.mastery, B.mastery)) {
    const x = A.mastery[t], y = B.mastery[t];
    R.mastery[t] = !x ? y : !y ? x : ((y.ts || 0) > (x.ts || 0) || ((y.ts || 0) === (x.ts || 0) && y.n > x.n)) ? y : x;
  }
  for (const d of keysOf(A.history, B.history)) {
    const x = A.history[d], y = B.history[d];
    R.history[d] = !x ? y : !y ? x : y.n > x.n ? y : x;
  }

  /* Корзинка ошибок: в gone — уже решённые, чтобы они не вернулись с другого устройства */
  R.gone = Object.assign({}, A.gone, B.gone);
  Object.keys(R.gone).sort((x, y) => R.gone[y] - R.gone[x]).slice(300).forEach(id => delete R.gone[id]);
  const pool = {};
  for (const m of [...A.mistakes, ...B.mistakes]) {
    if (R.gone[m.id]) continue;
    const key = m.gen + ':' + m.d, cur = pool[key];
    if (!cur || (m.ts || 0) > (cur.ts || 0)) pool[key] = m;
  }
  R.mistakes = Object.values(pool).sort((x, y) => (x.ts || 0) - (y.ts || 0)).slice(-60);

  /* Серия дней считается по объединённой истории */
  const late = (B.streak.last || '') > (A.streak.last || '') ? B.streak : A.streak;
  let run = 0;
  if (late.last) for (let d = late.last; R.history[d]; d = addDays(d, -1)) run++;
  const count = Math.max(late.count, run);
  R.streak = { last: late.last, count, best: Math.max(A.streak.best, B.streak.best, count) };

  const da = A.daily, db = B.daily;
  R.daily = da.date === db.date ? { date: da.date, done: !!(da.done || db.done) } : (db.date || '') > (da.date || '') ? db : da;
  R.diag = !A.diag ? B.diag : !B.diag ? A.diag : B.diag.date > A.diag.date ? B.diag : A.diag;

  const seen = new Set();
  R.recent = [...A.recent, ...B.recent].filter(r => { const k = r.ts + '|' + r.q; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((x, y) => y.ts - x.ts).slice(0, 40);
  return copy(R);
}

let F = loadFamily();
let S = (F.current && readProfile(F.current)) || fresh();
