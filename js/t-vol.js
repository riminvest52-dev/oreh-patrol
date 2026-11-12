/* Объёмная мастерская у Бобра (Настя): кубики в штабеле, развёртки куба, противоположные грани,
   виды сверху / спереди / справа, объём и единицы объёма, задание руками раз в неделю. */
'use strict';

const VOLC = { top: '#FBD98B', l: '#E3A257', r: '#C47A3A', ink: '#5A3214', floor: '#F1DDB8', face: '#FFE7B8' };
const v1 = n => Math.round(n * 10) / 10;
let volN = 0;

/* ---------- Постройка из кубиков в изометрии ----------
   H[i][j] — высота столбика. i растёт вправо-назад, j — влево-назад, ближний угол (0, 0) внизу картинки.
   «Спереди» — смотрим на левую ближнюю стенку, «справа» — на правую ближнюю (на картинке стрелки). */
function isoSvg(H, o = {}) {
  const W = H.length, D = H[0].length, c = o.c || 30, cx = c * 0.866, cy = c / 2;
  const P = (i, j, z) => [(i - j) * cx, -(i + j) * cy - z * c];
  const pts = [];
  const poly = (ps, f, extra = '') => { ps.forEach(p => pts.push(p)); return `<polygon points="${ps.map(p => v1(p[0]) + ',' + v1(p[1])).join(' ')}" fill="${f}"${extra}/>`; };
  const cubes = [];
  for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) for (let z = 0; z < H[i][j]; z++) cubes.push([i, j, z]);
  cubes.sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]) || a[2] - b[2]);   /* дальние раньше, нижние раньше */
  let body = poly([P(0, 0, 0), P(W, 0, 0), P(W, D, 0), P(0, D, 0)], VOLC.floor, ` stroke="#D9BC8C" stroke-width="1.5"`);
  for (const [i, j, z] of cubes) body += `<g stroke="${VOLC.ink}" stroke-width="1.6" stroke-linejoin="round">`
    + poly([P(i, j, z + 1), P(i + 1, j, z + 1), P(i + 1, j + 1, z + 1), P(i, j + 1, z + 1)], VOLC.top)
    + poly([P(i, j, z), P(i, j + 1, z), P(i, j + 1, z + 1), P(i, j, z + 1)], VOLC.l)
    + poly([P(i, j, z), P(i + 1, j, z), P(i + 1, j, z + 1), P(i, j, z + 1)], VOLC.r) + '</g>';
  let defs = '';
  if (o.arrows) {
    const id = 'va' + (++volN);
    defs = `<defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#2E7D4F"/></marker></defs>`;
    const arrow = (A, u, txt, anchor) => {
      const s = [A[0] + u[0] * c * 1.5, A[1] + u[1] * c * 1.5], e = [A[0] + u[0] * c * 0.35, A[1] + u[1] * c * 0.35];
      const t = [s[0] + u[0] * c * 0.25, s[1] + u[1] * c * 0.25 + c * 0.42];
      pts.push(s, [t[0] + (anchor === 'end' ? -c * 2.6 : c * 2.6), t[1] + 6]);
      return `<line x1="${v1(s[0])}" y1="${v1(s[1])}" x2="${v1(e[0])}" y2="${v1(e[1])}" stroke="#2E7D4F" stroke-width="3" marker-end="url(#${id})"/>`
        + `<text x="${v1(t[0])}" y="${v1(t[1])}" text-anchor="${anchor}" class="vlbl" font-size="${v1(c * 0.5)}">${txt}</text>`;
    };
    body += arrow(P(0, D / 2, 0.4), [-0.866, 0.5], 'спереди', 'end') + arrow(P(W / 2, 0, 0.4), [0.866, 0.5], 'справа', 'start');
  }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), pad = 6;
  const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
  return `<svg class="${o.cls || 'fig iso'}" viewBox="${v1(x0)} ${v1(y0)} ${v1(w)} ${v1(h)}" width="${Math.round(w * (o.k || 1.25))}" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`;
}

/* Лесенка: к дальнему углу столбики не ниже, поэтому верх каждого столбика виден и кубики можно сосчитать */
function stairs(W, D, lo, hi, maxSum = 99) {
  for (let t = 0; t < 400; t++) {
    const H = Array.from({ length: W }, () => Array(D).fill(0));
    for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) {
      const m = Math.max(i ? H[i - 1][j] : lo, j ? H[i][j - 1] : lo);
      H[i][j] = R.chance(0.45) ? m : R.int(m, hi);
    }
    const f = H.flat(), sum = f.reduce((s, x) => s + x, 0);
    if (new Set(f).size < 2 || Math.max(...f) < 2 || sum > maxSum || H[W - 1][D - 1] === 0) continue;
    if (lo === 0 && !f.includes(0)) continue;
    return H;
  }
  return null;
}
const hSum = H => H.flat().reduce((s, x) => s + x, 0);

/* ---------- Виды ---------- */
const viewFront = H => { const D = H[0].length; return Array.from({ length: D }, (_, k) => Math.max(...H.map(r => r[D - 1 - k]))); };
const viewRight = H => H.map(r => Math.max(...r));
const viewTop = H => { const W = H.length, D = H[0].length; return Array.from({ length: W }, (_, r) => Array.from({ length: D }, (_, k) => H[W - 1 - r][D - 1 - k] > 0 ? 1 : 0)); };
const vKey = v => JSON.stringify(v);
/* Вид спереди/справа — столбики-квадратики на линии земли; вид сверху — клетки, клетка с кубиками закрашена */
function elevSvg(h, s = 20) {
  const n = h.length, mh = Math.max(...h, 1), W = n * s + 8, Hh = mh * s + 10;
  let b = `<line x1="0" y1="${mh * s + 4}" x2="${W}" y2="${mh * s + 4}" stroke="#8A6A4A" stroke-width="2"/>`;
  h.forEach((v, k) => { for (let r = 0; r < v; r++) b += `<rect x="${4 + k * s}" y="${4 + (mh - 1 - r) * s}" width="${s}" height="${s}" fill="${VOLC.top}" stroke="${VOLC.ink}" stroke-width="1.6"/>`; });
  return `<svg class="vview" viewBox="0 0 ${W} ${Hh}" width="${W * 1.5}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
}
function topSvg(m, s = 20, nums) {
  const rows = m.length, cols = m[0].length, W = cols * s + 8, Hh = rows * s + 8;
  let b = '';
  m.forEach((row, r) => row.forEach((v, k) => {
    b += `<rect x="${4 + k * s}" y="${4 + r * s}" width="${s}" height="${s}" fill="${v ? VOLC.top : '#FFF8EC'}" stroke="${v ? VOLC.ink : '#D9BC8C'}" stroke-width="${v ? 1.6 : 1}"${v ? '' : ' stroke-dasharray="3 3"'}/>`;
    if (nums && nums[r][k]) b += `<text x="${4 + k * s + s / 2}" y="${4 + r * s + s * 0.72}" text-anchor="middle" font-size="${s * 0.62}" font-weight="800" fill="${VOLC.ink}">${nums[r][k]}</text>`;
  }));
  return `<svg class="vview" viewBox="0 0 ${W} ${Hh}" width="${W * 1.5}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
}
/* Числа высот в виде сверху (как разложены столбики) */
const topNums = H => { const W = H.length, D = H[0].length; return Array.from({ length: W }, (_, r) => Array.from({ length: D }, (_, k) => H[W - 1 - r][D - 1 - k])); };

/* Варианты-картинки: подписи А–Г, ответ — буква */
const LETTERS = ['А', 'Б', 'В', 'Г'];
function picChoice(base, correctHtml, wrongHtml, why) {
  const items = R.shuffle([{ ok: true, h: correctHtml }].concat(wrongHtml.slice(0, 3).map((h, k) => ({ ok: false, h, why: why && why[k] }))));
  const options = items.map((_, k) => LETTERS[k]);
  /* Разбор по буквам: почему не подходит каждый неверный вариант */
  if (why) base.explain = items.map((it, k) => it.why ? `<b>${options[k]}</b> — ${it.why}.` : null).filter(Boolean).concat(base.explain || []);
  return Object.assign(base, { type: 'choice', options, optHtml: items.map((it, k) => `<span class="olbl">${options[k]}</span>${it.h}`), answer: options[items.findIndex(it => it.ok)] });
}

/* ---------- Сколько кубиков в штабеле ---------- */
reg('vol', 'vol_count', d => {
  if (d === 1) {
    const a = R.int(2, 3), b = R.int(2, 3), c = R.int(1, 3);
    if (a * b * c < 6) return null;
    const H = Array.from({ length: a }, () => Array(b).fill(c)), n = a * b * c, vis = n - (a - 1) * (b - 1) * (c - 1);
    return { q: 'Бобр сложил кубики штабелем. <b>Сколько всего кубиков</b>, вместе со спрятанными?', fig: isoSvg(H), type: 'num', answer: n,
      traps: [[vis, 'Это только кубики, которые видно. Внутри штабеля и сзади спрятаны ещё.'], [a * b, 'Это кубики только в верхнем слое. А слоёв несколько!']],
      hint: 'Посчитай кубики в верхнем слое и умножь на число слоёв.',
      explain: [`В верхнем слое ${a} · ${b} = ${a * b} ${pl(a * b, 'кубик', 'кубика', 'кубиков')}.`, `Слоёв ${c}: ${a * b} · ${c} = ${n}.`],
      note: `${a} · ${b} · ${c} = ${n} (куб.)` };
  }
  const [W, D] = d === 2 ? R.pick([[2, 3], [3, 2], [3, 3]]) : R.pick([[3, 3], [3, 4], [4, 3]]);
  const H = d === 2 ? stairs(W, D, 1, 3, 18) : stairs(W, D, 0, 4, 26);
  if (!H) return null;
  const n = hSum(H), cols = H.flat().filter(x => x > 0), mh = Math.max(...cols);
  const sumTxt = topNums(H).flat().filter(x => x > 0).join(' + ');   /* по порядку, как в виде сверху */
  if (d === 3 && R.chance(0.5)) {
    const full = W * D * mh;
    return { q: `Бобр хочет достроить штабель до целого бруска ${D} × ${W} × ${mh} (как самая высокая часть). <b>Сколько кубиков нужно добавить?</b>`, fig: isoSvg(H, { arrows: false }), type: 'num', answer: full - n,
      traps: [[n, 'Это сколько кубиков уже есть. А спрашивают, сколько добавить.'], [full, 'Это кубики целого бруска. Вычти те, что уже стоят.']],
      hint: 'Найди, сколько кубиков в целом бруске, и вычти, сколько уже есть.',
      explain: [`В целом бруске ${D} · ${W} · ${mh} = ${full} ${pl(full, 'кубик', 'кубика', 'кубиков')}.`, `Сейчас по столбикам: ${sumTxt} = ${n}.`, `Добавить: ${full} − ${n} = ${full - n}.`, `Высоты столбиков (вид сверху): ${topSvg(viewTop(H), 22, topNums(H))}`],
      note: `${D} · ${W} · ${mh} − ${n} = ${full - n} (куб.)` };
  }
  return { q: 'Сколько кубиков в этой постройке? Кубики не висят в воздухе: под каждым — столбик до самого пола.', fig: isoSvg(H), type: 'num', answer: n,
    traps: [[cols.length, 'Это число столбиков. А в каждом столбике может быть несколько кубиков.'], [W * D * mh, 'Это был бы целый брусок, но в постройке есть ступеньки.']],
    hint: 'Считай по столбикам: смотри на верхние грани и определяй высоту каждого столбика.',
    explain: ['Каждая верхняя грань — это верх одного столбика.', `Высоты столбиков (вид сверху): ${topSvg(viewTop(H), 22, topNums(H))}`, `${sumTxt} = ${n}.`],
    note: `${sumTxt} = ${n} (куб.)` };
});

/* ---------- Развёртки куба ---------- */
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function polyNorm(cs) { const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1])); return cs.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]); }
const polyKey = cs => polyNorm(cs).map(c => c.join(',')).join(';');
const SYM8 = [c => [c[0], c[1]], c => [-c[1], c[0]], c => [-c[0], -c[1]], c => [c[1], -c[0]], c => [-c[0], c[1]], c => [c[1], c[0]], c => [c[0], -c[1]], c => [-c[1], -c[0]]];
const polyCanon = cs => SYM8.map(t => polyKey(cs.map(t))).sort()[0];
const polyRand = cs => polyNorm(cs.map(R.pick(SYM8)));
function has2x2(cs) { const h = new Set(cs.map(c => c.join(','))); return cs.some(([x, y]) => h.has((x + 1) + ',' + y) && h.has(x + ',' + (y + 1)) && h.has((x + 1) + ',' + (y + 1))); }
function longRun(cs) {
  let best = 0; const h = new Set(cs.map(c => c.join(',')));
  for (const [x, y] of cs) for (const [dx, dy] of [[1, 0], [0, 1]]) { let k = 0; while (h.has((x + dx * k) + ',' + (y + dy * k))) k++; best = Math.max(best, k); }
  return best;
}
/* Перекатываем кубик по развёртке: какая грань ложится на каждую клетку. Складывается, если все 6 граней разные.
   Грани: 0 низ, 1 верх, 2 север, 3 юг, 4 восток, 5 запад; противоположные — f и f ^ 1. */
function foldNet(cs) {
  if (cs.length !== 6 || has2x2(cs)) return null;
  const idx = new Map(cs.map((c, k) => [c.join(','), k])), st = Array(6), face = Array(6).fill(-1);
  st[0] = { b: 0, t: 1, n: 2, s: 3, e: 4, w: 5 }; face[0] = 0;
  const q = [0];
  while (q.length) {
    const k = q.shift(), [x, y] = cs[k], o = st[k];
    for (const [dx, dy] of NB4) {
      const m = idx.get((x + dx) + ',' + (y + dy));
      if (m === undefined || st[m]) continue;
      const r = dx === 1 ? { b: o.e, e: o.t, t: o.w, w: o.b, n: o.n, s: o.s } : dx === -1 ? { b: o.w, w: o.t, t: o.e, e: o.b, n: o.n, s: o.s }
        : dy === 1 ? { b: o.s, s: o.t, t: o.n, n: o.b, e: o.e, w: o.w } : { b: o.n, n: o.t, t: o.s, s: o.b, e: o.e, w: o.w };
      st[m] = r; face[m] = r.b; q.push(m);
    }
  }
  return new Set(face).size === 6 && !face.includes(-1) ? face : null;
}
/* Все 35 фигур из 6 квадратов: 11 складываются в куб, 24 — нет */
const HEXO = (() => {
  let level = new Map([['0,0', [[0, 0]]]]);
  for (let n = 1; n < 6; n++) {
    const nx = new Map();
    for (const cs of level.values()) for (const [x, y] of cs) for (const [dx, dy] of NB4) {
      const c = [x + dx, y + dy];
      if (cs.some(a => a[0] === c[0] && a[1] === c[1])) continue;
      const ns = polyNorm(cs.concat([c])), k = polyCanon(ns);
      if (!nx.has(k)) nx.set(k, ns);
    }
    level = nx;
  }
  const all = [...level.values()];
  return { all, ok: all.filter(cs => foldNet(cs)), bad: all.filter(cs => !foldNet(cs)) };
})();
function netSvg(cs, o = {}) {
  const s = o.s || 22, W = (Math.max(...cs.map(c => c[0])) + 1) * s + 6, Hh = (Math.max(...cs.map(c => c[1])) + 1) * s + 6;
  const b = cs.map(([x, y], k) => {
    const lab = o.lab ? o.lab[k] : '';
    return `<rect x="${3 + x * s}" y="${3 + y * s}" width="${s}" height="${s}" fill="${lab === '★' ? '#BFE3B4' : VOLC.face}" stroke="${VOLC.ink}" stroke-width="1.8"/>`
      + (lab ? `<text x="${3 + x * s + s / 2}" y="${3 + y * s + s * 0.7}" text-anchor="middle" font-size="${s * 0.6}" font-weight="800" fill="${lab === '★' ? '#2E7D4F' : VOLC.ink}">${lab}</text>` : '');
  }).join('');
  return `<svg class="${o.cls || 'vnet'}" viewBox="0 0 ${W} ${Hh}" width="${W * (o.k || 1.5)}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
}
function whyBad(cs) {
  if (has2x2(cs)) return 'не сложится: квадрат 2 × 2 — четыре грани сходятся в одной вершине';
  if (longRun(cs) >= 5) return `не сложится: ${longRun(cs) === 6 ? 'шесть' : 'пять'} квадратов в ряд, пятый ляжет на первый`;
  return 'не сложится: две грани налезут друг на друга, а одна сторона куба останется открытой';
}

/* Складывание развёртки в 3D (CSS): каждая грань вложена в соседнюю и поворачивается на 90° вокруг общего ребра */
function fold3d(cs, lab, s = 62) {
  const idx = new Map(cs.map((c, k) => [c.join(','), k]));
  const deg = k => NB4.filter(([dx, dy]) => idx.has((cs[k][0] + dx) + ',' + (cs[k][1] + dy))).length;
  let root = 0; cs.forEach((_, k) => { if (deg(k) > deg(root)) root = k; });
  const seen = new Set([root]); let maxD = 0;
  const DIR = { '1,0': 'e', '-1,0': 'w', '0,1': 's', '0,-1': 'n' };
  const node = (k, depth, dx, dy) => {
    maxD = Math.max(maxD, depth);
    let kids = '';
    for (const [ex, ey] of NB4) {
      const m = idx.get((cs[k][0] + ex) + ',' + (cs[k][1] + ey));
      if (m === undefined || seen.has(m)) continue;
      seen.add(m); kids += node(m, depth + 1, ex, ey);
    }
    const dir = depth ? DIR[dx + ',' + dy] : 'root';
    return `<div class="f3 ${dir}" style="left:${dx * s}px;top:${dy * s}px;--d:${depth}"><b>${lab ? lab[k] : ''}</b>${kids}</div>`;
  };
  const tree = node(root, 0, 0, 0);
  const xs = cs.map(c => c[0] - cs[root][0]), ys = cs.map(c => c[1] - cs[root][1]);
  const ox = ((Math.min(...xs) + Math.max(...xs) + 1) / 2) * s, oy = ((Math.min(...ys) + Math.max(...ys) + 1) / 2) * s;
  const spin = (1 + maxD * 0.9 + 1).toFixed(1);
  return `<div class="fold3d" data-act="refold" role="button" aria-label="Сложить ещё раз" style="--s:${s}px;height:${Math.max(4, Math.max(...ys) - Math.min(...ys) + 2) * s}px">
    <div class="f3scene" style="left:calc(50% - ${ox}px);top:calc(50% - ${oy}px);--spin:${spin}s">${tree}</div><div class="f3tip small muted">нажми, чтобы сложить ещё раз</div></div>`;
}
ACT.refold = el => { const n = el.cloneNode(true); el.replaceWith(n); };

reg('vol', 'vol_net', d => {
  const good = polyRand(R.pick(HEXO.ok));
  if (d === 3 && R.chance(0.5)) {   /* три складываются, одна нет */
    const goods = R.sample(HEXO.ok, 3).map(polyRand), bad = polyRand(R.pick(HEXO.bad.filter(cs => !has2x2(cs) && longRun(cs) < 5)));
    const t = picChoice({ q: 'Три развёртки складываются в куб, а одна — <b>нет</b>. Какая не складывается?', cols2: true,
      hint: 'Мысленно складывай каждую: выбери середину и загибай соседние квадраты вверх. Где две грани налезут друг на друга?',
      explain: [`Лишняя развёртка ${whyBad(bad).replace('не сложится: ', 'не сложится, потому что ')}.`, 'Остальные три складываются: у куба 6 граней, и каждая встречается ровно один раз.', 'Посмотри, как складывается одна из правильных.'],
      note: 'Куб: 6 граней, 12 рёбер, 8 вершин.' }, netSvg(bad), goods.map(g => netSvg(g)));
    t.after = fold3d(goods[0]);
    return t;
  }
  const pool = d === 1 ? HEXO.bad.filter(cs => has2x2(cs) || longRun(cs) >= 5) : HEXO.bad.filter(cs => !has2x2(cs) && (d === 3 || longRun(cs) < 6));
  const bads = R.sample(pool, 3).map(polyRand);
  const t = picChoice({ q: 'Бобр вырезал из картона развёртки. <b>Какая из них складывается в коробочку-куб?</b>', cols2: true,
    hint: d === 1 ? 'У куба 6 граней. Квадрат 2 × 2 или 5 квадратов в ряд сложить в куб нельзя.' : 'Мысленно складывай: выбери середину развёртки и загибай соседние квадраты вверх.',
    explain: ['Правильная развёртка складывается — посмотри, как это происходит.'],
    note: 'Куб: 6 граней, 12 рёбер, 8 вершин.' }, netSvg(good), bads.map(b => netSvg(b)), bads.map(whyBad));
  t.after = fold3d(good);
  return t;
});

reg('vol', 'vol_opp', d => {
  const pool = d === 1 ? HEXO.ok.filter(cs => longRun(cs) === 4) : d === 2 ? HEXO.ok : HEXO.ok.filter(cs => longRun(cs) < 4);
  const cs = polyRand(R.pick(pool)), face = foldNet(cs), star = R.int(0, 5);
  const opp = face.indexOf(face[star] ^ 1), letters = R.shuffle(['А', 'Б', 'В', 'Г', 'Д']);
  const lab = cs.map((_, k) => k === star ? '★' : '');
  let li = 0; cs.forEach((_, k) => { if (k !== star) lab[k] = letters[li++]; });
  const answer = lab[opp], others = lab.filter((l, k) => k !== star && k !== opp);
  return { q: 'Из развёртки склеили кубик. <b>Какая грань окажется напротив грани ★?</b>', fig: netSvg(cs, { lab, cls: 'fig vnet', k: 2 }),
    type: 'choice', mono: true, cols2: true, options: choices(answer, R.shuffle(others)), answer,
    hint: 'Противоположные грани в развёртке не касаются друг друга. В ряду из квадратов напротив — через одну.',
    explain: ['Грани, которые касаются ★ стороной, — её соседи, они не напротив.', `Напротив ★ остаётся грань ${answer}.`, 'Посмотри, как кубик складывается.'],
    note: `Напротив ★ — грань ${answer}. У куба 3 пары противоположных граней.`, after: fold3d(cs, lab) };
});

/* ---------- Вид сверху, спереди, справа ---------- */
const VIEWS = { front: ['спереди', viewFront], right: ['справа', viewRight], top: ['сверху', viewTop] };
function perturbElev(h) { const c = h.slice(), k = R.int(0, c.length - 1); c[k] = Math.max(1, Math.min(4, c[k] + (R.chance(0.5) ? 1 : -1))); return c; }
function perturbTop(m) { const c = m.map(r => r.slice()), r = R.int(0, c.length - 1), k = R.int(0, c[0].length - 1); c[r][k] ^= 1; return c.flat().some(Boolean) ? c : m; }
reg('vol', 'vol_view', d => {
  if (d === 3 && R.chance(0.4)) return buildTask();
  const [W, D] = d === 1 ? R.pick([[2, 2], [2, 3], [3, 2]]) : R.pick([[3, 3], [2, 3], [3, 2], [3, 3]]);
  const H = stairs(W, D, d === 1 ? 1 : 0, 3, 16);
  if (!H) return null;
  const which = d === 1 ? R.pick(['front', 'right']) : R.pick(['front', 'right', 'top', 'top']);
  if (which === 'top' && !H.flat().includes(0)) return null;
  const [name, f] = VIEWS[which], v = f(H), key = vKey(v), seen = new Set([key]), wrong = [];
  const draw = x => which === 'top' ? topSvg(x) : elevSvg(x);
  const cand = which === 'top'
    ? [v.map(r => r.slice().reverse()), v.slice().reverse(), ...Array.from({ length: 30 }, () => perturbTop(v))]
    : [(which === 'front' ? viewRight : viewFront)(H), v.slice().reverse(), (which === 'front' ? viewRight : viewFront)(H).reverse(), ...Array.from({ length: 30 }, () => perturbElev(v))];
  for (const c of cand) { const k = vKey(c); if (!seen.has(k) && wrong.length < 3) { seen.add(k); wrong.push(draw(c)); } }
  if (wrong.length < 3) return null;
  const how = { front: 'Встань на место стрелки «спереди»: самые высокие столбики в каждом ряду закрывают те, что за ними.',
    right: 'Встань на место стрелки «справа»: в каждом ряду видно только самый высокий столбик. Смотришь справа: то, что было спереди, окажется слева.',
    top: 'Сверху видно только, где стоят кубики, а не какой они высоты. Смотришь сверху: передний ряд — внизу картинки.' }[which];
  return picChoice({ q: `Как выглядит постройка <b>${name}</b>?`, fig: isoSvg(H, { arrows: true }), cols2: true, hint: how,
    explain: [how, which === 'top' ? 'Пустые клетки пола остаются пустыми.' : `Высоты столбиков на виде ${name}: ${v.join(', ')}.`],
    note: which === 'top' ? `Вид сверху: ${v.flat().filter(Boolean).length} ${pl(v.flat().filter(Boolean).length, 'клетка', 'клетки', 'клеток')} с кубиками.` : `Вид ${name}: столбики ${v.join(', ')}.` }, draw(v), wrong);
});
/* Уровень «Дуб»: по трём видам собрать постройку самой (подходит любая постройка с такими же видами) */
function buildTask() {
  const H = stairs(3, 3, 0, 3, 14);
  if (!H) return null;
  const f = viewFront(H), r = viewRight(H), tp = viewTop(H), keys = vKey([f, r, tp]);
  const views = `<div class="v3"><div><b>спереди</b>${elevSvg(f)}</div><div><b>справа</b>${elevSvg(r)}</div><div><b>сверху</b>${topSvg(tp)}</div></div>`;
  return { q: 'Бобр начертил постройку с трёх сторон. <b>Построй её сама</b>: нажимай на клетки пола, каждое нажатие — ещё один кубик.', fig: views,
    type: 'build', W: 3, D: 3, maxH: 3, sol: H, check: B => vKey([viewFront(B), viewRight(B), viewTop(B)]) === keys,
    answer: 'постройка как на картинке в разборе', cols2: false,
    hint: 'Начни с вида сверху: на пустых клетках кубиков нет. Потом по виду спереди и справа подбери высоту столбиков.',
    explain: ['Вид сверху показывает, на каких клетках стоят кубики.', 'Вид спереди и справа — самую высокую башню в каждом ряду.', `Например, так: ${isoSvg(H, { cls: 'vview', k: 1 })}`, `Высоты по клеткам (вид сверху): ${topSvg(tp, 22, topNums(H))}`],
    note: `Кубиков в такой постройке: ${topNums(H).flat().filter(Boolean).join(' + ')} = ${hSum(H)}.` };
}
function buildGrid(t) {
  let g = '';
  for (let r = 0; r < t.W; r++) for (let k = 0; k < t.D; k++) {
    const i = t.W - 1 - r, j = t.D - 1 - k;
    g += `<button class="vbc" data-act="vb" data-i="${i}" data-j="${j}">${SES.bh[i][j] || ''}</button>`;
  }
  return g;
}
function buildUI(t) {
  SES.bh = Array.from({ length: t.W }, () => Array(t.D).fill(0));
  return `<div class="vbuild"><div><div class="vbgrid" style="grid-template-columns:repeat(${t.D},1fr)">${buildGrid(t)}</div><div class="small muted center">↓ спереди ↓</div></div>
    <div class="vbprev" id="vbprev">${isoSvg(SES.bh, { arrows: true, cls: 'vview', k: 1 })}</div></div>
    <p class="small muted center">Клетки — пол, вид сверху. После ${t.maxH} кубиков столбик снова станет пустым.</p>
    <button class="btn green block" data-act="check" id="vbcheck">Проверить</button>`;
}
ACT.vb = el => {
  if (!SES || SES.answered || SES.task.type !== 'build') return;
  const i = +el.dataset.i, j = +el.dataset.j;
  SES.bh[i][j] = (SES.bh[i][j] + 1) % (SES.task.maxH + 1);
  el.textContent = SES.bh[i][j] || '';
  el.classList.toggle('on', !!SES.bh[i][j]);
  document.getElementById('vbprev').innerHTML = isoSvg(SES.bh, { arrows: true, cls: 'vview', k: 1 });
};
const buildText = B => B.slice().reverse().map(r => r.slice().reverse().join(' ')).join(' / ');

/* ---------- Объём и единицы объёма ---------- */
reg('vol', 'vol_calc', d => {
  if (d === 1) {
    if (R.chance(0.3)) {
      const a = R.int(2, 6), V = a * a * a;
      return { q: `Бобр выпилил кубик с ребром ${a} см. Найди его объём (в см³).`, fig: isoSvg([[1]], { c: 44 }), type: 'num', answer: V,
        traps: [[a * a, 'Это площадь одной грани. Объём — ещё раз умножить на ребро.'], [a * 3, 'Ребро не складывают, а перемножают: a · a · a.'], [a * a * 6, 'Это площадь всей поверхности (6 граней). А нужен объём.']],
        hint: 'Объём куба: V = a · a · a.', explain: [`V = a · a · a`, `${a} · ${a} · ${a} = ${V} см³`], note: `V = ${a} · ${a} · ${a} = ${V} (см³)` };
    }
    const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 6), V = a * b * c;
    return { q: `Ящик для орехов имеет длину ${a} дм, ширину ${b} дм и высоту ${c} дм. Найди его объём (в дм³).`, type: 'num', answer: V,
      traps: [[a * b, 'Это площадь дна. Умножь ещё на высоту.'], [a + b + c, 'Длину, ширину и высоту не складывают, а перемножают.'], [2 * (a * b + b * c + a * c), 'Это площадь поверхности ящика. А нужен объём.']],
      hint: 'Объём прямоугольного параллелепипеда: V = a · b · c.', explain: ['V = a · b · c', `${a} · ${b} · ${c} = ${V} дм³`], note: `V = ${a} · ${b} · ${c} = ${V} (дм³)` };
  }
  if (d === 2) {
    const v = R.int(0, 2);
    if (v === 0) {
      const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 9), V = a * b * c;
      return { q: `Объём коробки ${V} см³, длина ${a} см, ширина ${b} см. Найди её высоту (в см).`, type: 'num', answer: c,
        traps: [[a * b, 'Это площадь дна. Теперь раздели объём на неё.'], [V - a - b, 'Объём — это произведение, поэтому неизвестное находим делением.']],
        hint: 'V = a · b · c, значит c = V : (a · b).', explain: [`Площадь дна: ${a} · ${b} = ${a * b} см²`, `Высота: ${V} : ${a * b} = ${c} см`, `Проверка: ${a} · ${b} · ${c} = ${V} ✓`], note: `c = ${V} : (${a} · ${b}) = ${c} (см)` };
    }
    if (v === 1) {
      const a = R.int(3, 9), b = R.int(2, 6), c = R.int(2, 5), V = a * b * c;
      return { q: `Сколько кубиков с ребром 1 см поместится в коробку ${a} см × ${b} см × ${c} см?`, fig: isoSvg(Array.from({ length: Math.min(a, 4) }, () => Array(Math.min(b, 3)).fill(1)), { c: 22 }), type: 'num', answer: V,
        traps: [[a * b, `Это кубики только на дне, в один слой. А слоёв ${c}.`], [a + b + c, 'Кубики укладывают рядами и слоями — нужно умножать.']],
        hint: 'Сначала посчитай кубики в одном слое на дне, потом умножь на число слоёв.', explain: [`В одном ряду ${a}, рядов ${b}: на дне ${a} · ${b} = ${a * b} кубиков.`, `Слоёв ${c}: ${a * b} · ${c} = ${V}.`], note: `${a} · ${b} · ${c} = ${V} (куб. по 1 см³)` };
    }
    const a = R.int(2, 6), b = R.int(2, 6), c = R.int(2, 5), V = a * b * c;
    return { q: `Бобр делает ящик длиной ${a} дм, шириной ${b} дм и высотой ${c} дм. <b>Сколько литров</b> воды в него поместится?`, type: 'num', answer: V,
      traps: [[V * 1000, '1 дм³ — это ровно 1 литр, умножать на 1000 не нужно.'], [a * b, 'Это площадь дна. Умножь ещё на высоту.']],
      hint: 'Найди объём в дм³. 1 дм³ = 1 л.', explain: [`V = ${a} · ${b} · ${c} = ${V} дм³`, `1 дм³ = 1 л, значит ${V} л.`], note: `V = ${a} · ${b} · ${c} = ${V} (дм³) = ${V} л` };
  }
  const v = R.int(0, 2);
  if (v === 0) {   /* амбар и ящики */
    const p = R.int(1, 2), q = R.int(1, 2), r = 1, A = p * R.int(2, 4), B = q * R.int(2, 3), C = R.int(2, 3), n = (A * B * C) / (p * q * r);
    return { q: `Амбар Бобра длиной ${A} м, шириной ${B} м и высотой ${C} м. Сколько ящиков размером ${p} м × ${q} м × ${r} м в нём поместится?`, type: 'num', answer: n,
      traps: [[A * B * C, `Это объём амбара в м³. Один ящик занимает ${p * q * r} м³.`], [A * B * C * p * q * r, 'Объём амбара нужно разделить на объём ящика, а не умножить.']],
      hint: 'Найди объём амбара и объём одного ящика. Сколько раз объём ящика уложится в объём амбара?',
      explain: [`Амбар: ${A} · ${B} · ${C} = ${A * B * C} м³`, `Ящик: ${p} · ${q} · ${r} = ${p * q * r} м³`, `${A * B * C} : ${p * q * r} = ${n} ${pl(n, 'ящик', 'ящика', 'ящиков')}`, `(И по длине, и по ширине, и по высоте ящики укладываются ровно: ${A} : ${p}, ${B} : ${q}, ${C} : ${r}.)`],
      note: `${A} · ${B} · ${C} : (${p} · ${q} · ${r}) = ${n} (ящ.)` };
  }
  if (v === 1) {
    const a = R.pick([2, 3, 4, 5]), V = a * a * a * 1000;
    return { q: `Кубический ящик с ребром ${a} дм. Сколько кубиков с ребром 1 см в него поместится?`, type: 'num', answer: V,
      traps: [[a * a * a, `Это объём в дм³. А кубики — по 1 см³, а 1 дм³ = 1000 см³.`], [a * a * a * 10, '1 дм = 10 см, но 1 дм³ = 10 · 10 · 10 = 1000 см³.']],
      hint: 'Переведи ребро в сантиметры: 1 дм = 10 см.', explain: [`${a} дм = ${a * 10} см`, `V = ${a * 10} · ${a * 10} · ${a * 10} = ${fmt(V)} см³`, `Значит, поместится ${fmt(V)} кубиков.`],
      note: `V = ${a * 10} · ${a * 10} · ${a * 10} = ${fmt(V)} (см³)` };
  }
  const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 9), x = R.int(2, 4), V = a * b * c;
  return { q: `Объём ящика ${V} дм³. Его длину увеличили в ${x} ${raza(x)}, а ширину и высоту оставили. Какой стал объём (в дм³)?`, type: 'num', answer: V * x,
    traps: [[V + x, `«В ${x} ${raza(x)}» — это умножение, а не сложение.`], [V * x * x * x, 'Увеличили только длину, а не все три измерения.']],
    hint: 'V = a · b · c. Если один множитель увеличить в несколько раз, произведение увеличится во столько же раз.',
    explain: [`Было: V = a · b · c = ${V} дм³`, `Стало: (a · ${x}) · b · c = ${V} · ${x} = ${V * x} дм³`], note: `${V} · ${x} = ${V * x} (дм³)` };
});
reg('vol', 'vol_units', d => {
  const U = [
    () => { const k = R.int(2, 9); return [`${k} дм³ = ? см³`, k * 1000, '1 дм³ = 1000 см³', [[k * 100, '1 дм = 10 см, но 1 дм³ = 10 · 10 · 10 = 1000 см³.'], [k * 10, '1 дм³ = 10 · 10 · 10 = 1000 см³.']]]; },
    () => { const k = R.int(2, 9); return [`${k} м³ = ? дм³`, k * 1000, '1 м³ = 1000 дм³', [[k * 100, '1 м = 10 дм, а 1 м³ = 10 · 10 · 10 = 1000 дм³.'], [k * 10, '1 м³ = 1000 дм³.']]]; },
    () => { const k = R.int(2, 40); return [`${k} л = ? дм³`, k, '1 л = 1 дм³', [[k * 1000, '1 литр — это ровно 1 дм³.']]]; }
  ];
  const U2 = [
    () => { const k = R.int(2, 9), m = R.int(1, 9) * 50; return [`${k} дм³ ${m} см³ = ? см³`, k * 1000 + m, '1 дм³ = 1000 см³', [[k * 100 + m, '1 дм³ = 1000 см³, а не 100.'], [k + m, 'Сначала переведи дм³ в см³.']]]; },
    () => { const k = R.int(2, 9); return [`${fmt(k * 1000)} см³ = ? л`, k, '1 л = 1 дм³ = 1000 см³', [[k * 1000, 'В литры: 1000 см³ = 1 л, раздели на 1000.']]]; },
    () => { const k = R.int(2, 9); return [`${k} м³ = ? л`, k * 1000, '1 м³ = 1000 дм³ = 1000 л', [[k, '1 м³ — это 1000 литров.']]]; }
  ];
  if (d === 3) {
    for (let t = 0; t < 50; t++) {
      const a = R.pick([20, 30, 40, 50, 60]), b = R.pick([20, 25, 30, 40]), c = R.pick([20, 30, 40, 50]), V = a * b * c;
      if (V % 1000) continue;
      return { q: `Аквариум для рыбок у Бобра: длина ${a} см, ширина ${b} см, высота ${c} см. Сколько литров воды в него войдёт?`, type: 'num', answer: V / 1000,
        traps: [[V, `Это объём в см³. В литре 1000 см³.`], [V / 100, '1 л = 1000 см³ — делить нужно на 1000.']],
        hint: 'Найди объём в см³, потом переведи: 1 л = 1 дм³ = 1000 см³.', explain: [`V = ${a} · ${b} · ${c} = ${fmt(V)} см³`, `${fmt(V)} : 1000 = ${V / 1000} л`, 'Можно и в дециметрах: ' + `${a / 10} · ${b / 10} · ${c / 10} = ${V / 1000} дм³ = ${V / 1000} л`],
        note: `V = ${a} · ${b} · ${c} = ${fmt(V)} (см³) = ${V / 1000} л` };
    }
    return null;
  }
  const [q, ans, rule, traps] = R.pick(d === 1 ? U : U2)();
  return { q: `Переведи: <b>${q.replace('?', '…')}</b>`, type: 'num', answer: ans, traps, hint: rule, explain: [rule, `${q.replace('?', fmt(ans))}`], note: q.replace('?', fmt(ans)) };
});

/* ---------- Задание руками (раз в неделю), подтверждает взрослый ---------- */
const HANDS = [
  { id: 'box', title: 'Коробочка из развёртки', text: 'Нарисуй на картоне или плотной бумаге 6 квадратов 4 × 4 см вот так. По краям добавь узкие клапаны для клея, вырежи, согни по линиям и склей кубик. Напиши на одной грани ★ и проверь, какая грань окажется напротив.',
    fig: () => netSvg([[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]], { k: 2 }) },
  { id: 'views', title: 'Постройка по трём видам', text: 'Построй из кубиков (подойдут Лего, кубики-игрушки или сахар-рафинад) фигуру по трём видам. Сколько кубиков понадобилось? Покажи постройку взрослому с трёх сторон.',
    fig: () => { const H = [[1, 1, 2], [1, 2, 3], [2, 2, 3]]; return `<div class="v3"><div><b>спереди</b>${elevSvg(viewFront(H))}</div><div><b>справа</b>${elevSvg(viewRight(H))}</div><div><b>сверху</b>${topSvg(viewTop(H))}</div></div>`; } },
  { id: 'measure', title: 'Объём настоящей коробки', text: 'Найди дома коробку (из-под чая, сока или обуви). Измерь линейкой длину, ширину и высоту в сантиметрах, найди объём V = a · b · c и запиши решение в тетрадь. Сколько это литров, если 1 л = 1000 см³?', fig: () => isoSvg([[2, 2], [2, 2], [2, 2]], { c: 26 }) },
  { id: 'twelve', title: 'Двенадцать кубиков', text: 'Возьми 12 одинаковых кубиков (или спичечных коробков). Сложи из них прямоугольный параллелепипед. А сколько разных можно сложить? Запиши размеры каждого, например: 1 · 1 · 12.',
    /* Россыпь из 12 отдельных кубиков — без готового ответа на картинке */
    fig: () => isoSvg([[1, 0, 0, 0, 1, 0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 1, 0], [1, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 1, 0, 0, 1], [0, 0, 1, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0, 1, 0], [0, 0, 0, 1, 0, 0, 0, 0]], { c: 15 }) }
];
function handsWeek() {
  const d = new Date(), wk = addDays(today(), -((d.getDay() + 6) % 7));
  const n = Math.round(new Date(wk + 'T12:00:00').getTime() / (7 * 864e5));
  return { wk, h: HANDS[((n % HANDS.length) + HANDS.length) % HANDS.length], st: (S.hands || {})[wk] };
}
function handsCard() {
  const { h, st } = handsWeek();
  const foot = !st ? `<button class="btn green block" data-act="handsDone">✋ Готово! Я сделала</button>`
    : st.st === 'done' ? '<p class="small"><b>⏳ Ждёт взрослого:</b> пусть он посмотрит и нажмёт «Подтвердить» в разделе для родителей (⚙️ на карте).</p>'
      : '<p class="small"><b>✅ Выполнено и подтверждено! +5 орешков.</b> Новое задание — в понедельник.</p>';
  return `<div class="card hands"><div class="hh">✋ Задание руками на эту неделю</div><b>${h.title}</b><p class="small">${h.text}</p><div class="hfig">${h.fig()}</div>${foot}</div>`;
}
ACT.handsDone = () => {
  const { wk, h } = handsWeek();
  S.hands = S.hands || {}; S.hands[wk] = { id: h.id, st: 'done', ts: Date.now() }; save();
  if (typeof Cloud !== 'undefined') Cloud.soon();
  Sound.ok(); toast('Здорово! Покажи взрослому — он подтвердит в разделе для родителей 👍', 3200); showTopic('vol');
};
function handsParentCard() {
  const list = Object.entries(S.hands || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  const rows = list.map(([wk, x]) => {
    const h = HANDS.find(z => z.id === x.id) || { title: x.id }, date = wk.split('-').reverse().slice(0, 2).join('.');
    return `<div class="hrow"><div style="font-size:22px">✋</div><div class="grow"><div class="tn">${h.title}</div><div class="small muted">неделя с ${date}</div></div>
      ${x.st === 'done' ? `<button class="btn green" data-act="handsOk" data-wk="${wk}">Подтвердить</button>` : '<div class="small" style="color:var(--green-d);font-weight:800">✓ +5</div>'}</div>`;
  }).join('');
  return `<h3 style="margin-top:18px">Задания руками · Объёмная мастерская</h3><div class="card">${rows || '<p class="muted">Пока не было. Задание появляется раз в неделю в «Объёмной мастерской».</p>'}
    <p class="small muted">Раз в неделю ребёнок делает что-то настоящими руками: склеивает коробку по развёртке, строит из кубиков по трём видам, измеряет коробку. Посмотрите результат и подтвердите — это +5 орешков. С настоящими предметами пространственное мышление развивается лучше, чем только на экране.</p></div>`;
}
ACT.handsOk = el => {
  const x = (S.hands || {})[el.dataset.wk];
  if (!x || x.st !== 'done') return;
  x.st = 'ok'; x.ok = Date.now(); giveAcorns(5); save();
  if (typeof Cloud !== 'undefined') Cloud.soon();
  Sound.coin(); toast('Подтверждено! +5 орешков 🌰'); showParent();
};
