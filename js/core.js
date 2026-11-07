/* Ореховый патруль — ядро: утилиты, выражения, реестр генераторов */
'use strict';

const R = {
  int(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  chance(p) { return Math.random() < p; },
  sample(arr, k) { return R.shuffle(arr).slice(0, k); }
};

/* Числа: 4812, но 30 450 (пробел с 5 знаков, как в учебниках) */
function fmt(n) {
  if (typeof n !== 'number') return String(n);
  const s = String(Math.abs(n));
  const out = s.length >= 5 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
  return (n < 0 ? '−' : '') + out;
}

const SYM = { '+': '+', '-': '−', '*': '·', ':': ':' };
const PREC = { '+': 1, '-': 1, '*': 2, ':': 2 };

/* Склонение после числа: pl(5, 'орех', 'ореха', 'орехов') → 'орехов' */
function pl(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
const NUTS = n => `${n} ${pl(n, 'орех', 'ореха', 'орехов')}`;
function divisors(n) { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; }
function isPrime(n) { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
function digitSum(n) { return String(n).split('').reduce((s, c) => s + +c, 0); }
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }

/* Варианты ответа: правильный + отвлекающие, уникальные, перемешанные */
function choices(correct, distractors, n = 4) {
  const seen = new Set([String(correct)]);
  const opts = [correct];
  for (const d of distractors) {
    if (opts.length >= n) break;
    if (d === undefined || d === null) continue;
    if (typeof d === 'number' && (!Number.isFinite(d) || d < 0 || !Number.isInteger(d))) continue;
    const k = String(d);
    if (seen.has(k)) continue;
    seen.add(k); opts.push(d);
  }
  return R.shuffle(opts).map(o => typeof o === 'number' ? fmt(o) : o);
}
function numChoiceTask(base, correct, distractors) {
  const options = choices(correct, distractors);
  return Object.assign(base, { type: 'choice', options, answer: fmt(correct) });
}

/* ---------- Выражения ---------- */
function L(n) { return { n }; }
function N(op, l, r) { return { op, l, r }; }
function val(e) {
  if (e.n !== undefined) return e.n;
  const a = val(e.l), b = val(e.r);
  switch (e.op) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case ':': return a / b; }
}
function opCount(e) { return e.n !== undefined ? 0 : 1 + opCount(e.l) + opCount(e.r); }
/* strict = скобки у правого операнда того же приоритета всегда (для «перевода» дерево = запись) */
function toStr(e, strict) {
  if (e.n !== undefined) return fmt(e.n);
  const wrap = (c, isRight) => {
    if (c.n !== undefined) return toStr(c, strict);
    const s = toStr(c, strict);
    if (PREC[c.op] < PREC[e.op]) return '(' + s + ')';
    if (isRight && PREC[c.op] === PREC[e.op]) {
      if (strict) return '(' + s + ')';
      if (!((e.op === '+' && c.op === '+') || (e.op === '*' && c.op === '*'))) return '(' + s + ')';
    }
    return s;
  };
  return wrap(e.l, false) + ' ' + SYM[e.op] + ' ' + wrap(e.r, true);
}
/* Порядок действий как в школе: скобки → умножение/деление слева направо → сложение/вычитание */
function tokenize(s) {
  const t = [];
  const str = s.replace(/ /g, '');
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === ' ') continue;
    if (/\d/.test(c)) { let j = i; while (j < str.length && /\d/.test(str[j])) j++; t.push(+str.slice(i, j)); i = j - 1; }
    else if (c === '−') t.push('-');
    else if (c === '·') t.push('*');
    else t.push(c);
  }
  return t;
}
function schoolSteps(s) {
  let t = tokenize(s);
  const steps = [];
  const apply = (a, op, b) => op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
  let guard = 0, ok = true;
  while (t.length > 1 && guard++ < 50) {
    let lo = 0, hi = t.length;
    const close = t.indexOf(')');
    if (close >= 0) { let open = close; while (t[open] !== '(') open--; lo = open + 1; hi = close; }
    let idx = -1;
    for (let i = lo; i < hi; i++) if (t[i] === '*' || t[i] === ':') { idx = i; break; }
    if (idx < 0) for (let i = lo; i < hi; i++) if (t[i] === '+' || t[i] === '-') { idx = i; break; }
    if (idx < 0) { // в скобках одно число — снимаем скобки
      t.splice(hi, 1); t.splice(lo - 1, 1); continue;
    }
    const a = t[idx - 1], op = t[idx], b = t[idx + 1], c = apply(a, op, b);
    if (!Number.isInteger(c) || c < 0) ok = false;
    steps.push(`${fmt(a)} ${SYM[op]} ${fmt(b)} = ${fmt(c)}`);
    t.splice(idx - 1, 3, c);
    if (lo > 0 && t[lo - 1] === '(' && t[lo + 1] === ')') { t.splice(lo + 1, 1); t.splice(lo - 1, 1); }
  }
  return { value: t[0], steps, ok };
}
/* Вычисление «слева направо» без учёта приоритета — типичная ошибка, используем как ловушку */
function leftToRight(s) {
  const t = tokenize(s).filter(x => x !== '(' && x !== ')');
  let v = t[0];
  for (let i = 1; i < t.length; i += 2) { const op = t[i], b = t[i + 1]; v = op === '+' ? v + b : op === '-' ? v - b : op === '*' ? v * b : v / b; }
  return v;
}
/* Случайное дерево «сверху вниз» от заданного значения: все деления нацело, вычитания неотрицательны */
function buildExpr(v, k, cfg) {
  if (k <= 0) return L(v);
  const ops = R.shuffle(cfg.ops);
  for (const op of ops) {
    const kl = R.int(0, k - 1), kr = k - 1 - kl;
    if (op === '+' && v >= 4) {
      const a = R.int(Math.max(1, Math.round(v * 0.15)), v - 1);
      return N('+', buildExpr(a, kl, cfg), buildExpr(v - a, kr, cfg));
    }
    if (op === '-') {
      const b = R.int(2, cfg.subMax || 60);
      if (v + b > (cfg.max || 10000)) continue;
      return N('-', buildExpr(v + b, kl, cfg), buildExpr(b, kr, cfg));
    }
    if (op === '*') {
      const ds = divisors(v).filter(d => d >= 2 && d <= (cfg.mulMax || 9) && v / d >= 2);
      if (!ds.length) continue;
      const d = R.pick(ds);
      return N('*', buildExpr(v / d, kl, cfg), buildExpr(d, kr, cfg));
    }
    if (op === ':') {
      const d = R.int(2, cfg.divMax || 9);
      if (v * d > (cfg.max || 10000)) continue;
      return N(':', buildExpr(v * d, kl, cfg), buildExpr(d, kr, cfg));
    }
  }
  return L(v);
}

/* Словесное чтение выражения: «частное суммы чисел 48 и 12 и числа 6» */
const OPNAME = { '+': ['сумма', 'суммы'], '-': ['разность', 'разности'], '*': ['произведение', 'произведения'], ':': ['частное', 'частного'] };
function verbal(e, gen) {
  if (e.n !== undefined) return (gen ? 'числа ' : '') + fmt(e.n);
  const head = OPNAME[e.op][gen ? 1 : 0];
  if (e.l.n !== undefined && e.r.n !== undefined) return `${head} чисел ${fmt(e.l.n)} и ${fmt(e.r.n)}`;
  return `${head} ${verbal(e.l, true)} и ${verbal(e.r, true)}`;
}

/* Деление уголком — пошаговое объяснение */
function longDivSteps(a, b) {
  const ds = String(a).split('').map(Number);
  const steps = [];
  let cur = 0, started = false, q = '';
  for (let i = 0; i < ds.length; i++) {
    cur = cur * 10 + ds[i];
    if (!started) {
      if (cur < b && i < ds.length - 1) continue;
      started = true;
      const qd = Math.floor(cur / b);
      steps.push(`Первое неполное делимое — ${cur}. ${cur} : ${b} = ${qd}, остаток ${cur - qd * b}.`);
      q += qd; cur -= qd * b; continue;
    }
    const qd = Math.floor(cur / b);
    if (qd === 0) steps.push(`Сносим ${ds[i]} → получилось ${cur}. ${cur} меньше ${b} — <b>пишем в частном 0!</b>`);
    else steps.push(`Сносим ${ds[i]} → ${cur}. ${cur} : ${b} = ${qd}, остаток ${cur - qd * b}.`);
    q += qd; cur -= qd * b;
  }
  steps.push(`Ответ: ${fmt(+q)}${cur ? ' (остаток ' + cur + ')' : ''}.`);
  return steps;
}

/* ---------- Реестр генераторов ---------- */
const GEN = {};
function reg(topic, id, f) { GEN[id] = { topic, id, f }; }
function makeTask(id, d) {
  for (let tries = 0; tries < 30; tries++) {
    try {
      const t = GEN[id].f(d);
      if (!t) continue;
      t.gen = id; t.topic = GEN[id].topic; t.d = d;
      return t;
    } catch (err) { if (tries === 29) throw err; }
  }
}
