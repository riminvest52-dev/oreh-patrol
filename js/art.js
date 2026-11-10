/* Рисунки: бурундуки Фундук и Миндалинка, жёлудь, деревья */
'use strict';

const ART = {};

/* ---------- Фундук и Миндалинка (концепт утверждён, собрано по chipmunks-gen.py) ----------
   Стиль общий с Жёлудиком: сепия-контур, градиент со светом сверху слева, большие глаза с двумя бликами.
   Позы: happy — привет, cheer — «Ура!», think — подумаем, show — «смотри, как надо».
   У каждого вывода свои id градиентов. bust = true — обрезка по грудь для плиток и аватарок. */
const CH = {
  INK: '#5B3418',
  funduk: { name: 'Фундук', f1: '#E59A5A', f2: '#C46F33', f3: '#8E4A1E', light: '#FBE3BE', stripe: '#5A2D12', inner: '#F3A893' },
  mindal: { name: 'Миндалинка', f1: '#FAD7A4', f2: '#EBB474', f3: '#BE7E40', light: '#FDF0DA', stripe: '#6E3B1C', inner: '#F7B8A6' }
};
const CH_EYES = [[90, 96], [127, 95]];
let chN = 0;
const chS = (d, fill, w = 3.5) => `<path d="${d}" fill="${fill}" stroke="${CH.INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
function chEyes(mood, glasses) {
  const I = CH.INK;
  if (mood === 'cheer') return CH_EYES.map(([x, y]) => `<path d="M${x - 12} ${y + 3} q12 -15 24 0" stroke="${I}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
  const [lx, ly] = { happy: [1, -1], think: [-3, -5], show: [4, -1] }[mood];
  let o = CH_EYES.map(([x, y]) => {
    const ix = x + lx, iy = y + ly;
    return `<ellipse cx="${x}" cy="${y}" rx="12.5" ry="15.5" fill="#FFFDF6" stroke="${I}" stroke-width="2.8"/>
<ellipse cx="${ix}" cy="${iy}" rx="8.6" ry="10.6" fill="#5A3214"/><ellipse cx="${ix}" cy="${iy + 1}" rx="4.6" ry="5.8" fill="#1E0F05"/>
<ellipse cx="${ix + 3}" cy="${iy - 4.5}" rx="3.4" ry="3.9" fill="#fff"/><circle cx="${ix - 3}" cy="${iy + 4}" r="1.4" fill="#fff"/>`;
  }).join('');
  /* Ресницы Миндалинки */
  if (glasses) o += CH_EYES.map(([x, y], i) => {
    const sg = i ? 1 : -1, ex = x + sg * 12;
    return `<path d="M${ex} ${y - 8} l${sg * 6} -5 M${ex + sg} ${y - 3} l${sg * 7} -2" stroke="${I}" stroke-width="2.6" stroke-linecap="round"/>`;
  }).join('');
  return `<g class="ch-eyes">${o}</g>`;
}
function chBrows(mood, c) {
  const d = { happy: 'M76 74 q12 -9 24 -2 M114 72 q12 -6 24 3', cheer: 'M76 76 q12 -10 24 -2 M114 74 q12 -8 24 2', think: 'M76 72 q12 -11 24 -4 M114 76 q12 0 24 4', show: 'M76 74 q12 -9 24 -2 M114 72 q12 -6 24 3' }[mood];
  return `<path d="${d}" stroke="${c.stripe}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
}
function chMouth(mood) {
  if (mood === 'think') return `<path d="M104 132 q8 -4 16 1" stroke="${CH.INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  if (mood === 'cheer') return chS('M92 124 Q109 156 128 123 Q110 131 92 124 Z', '#8E2A1E', 3) + '<path d="M101 139 Q110 133 119 139 Q110 147 101 139 Z" fill="#F07A6A"/>';
  return chS('M96 125 Q110 145 124 124 Q110 131 96 125 Z', '#8E2A1E', 3) + '<path d="M103 135 Q110 131 117 135 Q110 141 103 135 Z" fill="#F07A6A"/>';
}
function chPaw(x, y, rot, c, point) {
  const f = point ? chS('M2 -6 C10 -8 18 -8 22 -5 C24 -2 21 0 18 0 L4 1 Z', c.light, 2.4)
    : `<path d="M2 -7 q5 2 5 7 M-2 -9 q5 2 5 8" stroke="${c.f3}" stroke-width="1.6" fill="none"/>`;
  return `<g transform="translate(${x} ${y}) rotate(${rot})">${chS('M-8 -9 C2 -15 14 -10 13 0 C12 9 0 12 -8 7 Z', c.light, 2.6)}${f}</g>`;
}
function chArm([s, m, e, rot, pt], c) {
  const d = `M${s[0]} ${s[1]} Q${m[0]} ${m[1]} ${e[0]} ${e[1]}`;
  return `<path d="${d}" stroke="${CH.INK}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c.f2}" stroke-width="9.5" fill="none" stroke-linecap="round"/>` + chPaw(e[0], e[1], rot, c, pt);
}
const CH_POSES = {
  happy: [[[84, 158], [66, 180], [70, 198], 10, 0], [[136, 156], [160, 138], [166, 112], -75, 0]],
  cheer: [[[84, 152], [62, 130], [60, 104], -110, 0], [[136, 152], [158, 130], [160, 104], -70, 0]],
  think: [[[84, 160], [68, 182], [74, 200], 15, 0], [[136, 160], [132, 182], [112, 150], 200, 0]],
  show: [[[84, 160], [68, 182], [74, 200], 15, 0], [[138, 158], [164, 156], [186, 146], -15, 1]]
};
function chAccFront(who) {
  const I = CH.INK;
  if (who === 'funduk') {
    /* Зелёная кепка со значком-жёлудем и красный платок в горошек */
    const cap = chS('M58 70 C56 34 100 22 134 30 C156 36 166 54 160 68 C130 58 88 58 58 70 Z', '#4E9A4A', 3.5) +
      chS('M150 62 C166 60 182 66 186 74 C170 78 156 74 146 70 Z', '#3A7A36', 3) +
      '<path d="M70 58 C80 44 100 38 118 38" stroke="#8CCB7A" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>' +
      `<g transform="translate(108 48)"><ellipse cy="3" rx="6" ry="7" fill="#F4C542" stroke="${I}" stroke-width="2"/><path d="M-7 -1 Q0 -9 7 -1 Z" fill="#A8693A" stroke="${I}" stroke-width="2"/></g>`;
    const scarf = chS('M80 144 Q110 158 140 144 L116 178 Q110 184 104 178 Z', '#D8432A', 3.2) +
      [[96, 154], [112, 160], [124, 151], [108, 170]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#FFE7C2"/>`).join('');
    return [cap, scarf];
  }
  /* Круглые очки и зелёный шарф с золотым значком-жёлудем */
  const [[ax, ay], [bx, by]] = CH_EYES;
  const gl = `<g stroke="#5A3A22" stroke-width="3.2" fill="#FFFFFF" fill-opacity=".12"><circle cx="${ax}" cy="${ay}" r="19"/><circle cx="${bx}" cy="${by}" r="19"/></g>` +
    `<path d="M${ax + 18} 92 q9 -6 18 0" stroke="#5A3A22" stroke-width="3.2" fill="none"/>` +
    `<path d="M${ax - 10} ${ay - 10} q4 -4 8 -4" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/>`;
  const scarf = `<path d="M80 146 Q110 160 140 146" stroke="${I}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M80 146 Q110 160 140 146" stroke="#4E9A6A" stroke-width="8" fill="none" stroke-linecap="round"/>` +
    `<g transform="translate(110 158)"><circle r="8" fill="#F4C542" stroke="${I}" stroke-width="2.4"/><ellipse cy="2" rx="3.4" ry="4" fill="#C9772A"/><path d="M-4 0 Q0 -5 4 0 Z" fill="#7E4A24"/></g>`;
  return [gl, scarf];
}
/* Жёлтый цветок у уха Миндалинки (за головой) */
const chFlower = () => `<g transform="translate(152 52) rotate(15)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-10" rx="7" ry="10" transform="rotate(${a})" fill="#FFD25E" stroke="${CH.INK}" stroke-width="2.4"/>`).join('')}<circle r="6" fill="#F08C3A" stroke="${CH.INK}" stroke-width="2.4"/><circle cx="-2" cy="-2" r="2" fill="#fff" opacity=".7"/></g>`;

ART.chip = function (who = 'funduk', mood = 'happy', cls = '', bust = false) {
  if (who !== 'mindal') who = 'funduk';
  if (mood === 'sad') mood = 'think';            /* грустных героев в игре нет */
  if (!CH_POSES[mood]) mood = 'happy';
  const c = CH[who], I = CH.INK, u = 'ch' + (++chN);
  const [front, scarf] = chAccFront(who);
  const [left, right] = CH_POSES[mood];
  const squash = mood === 'cheer' ? ' transform="translate(110 244) scale(1.04 .96) translate(-110 -244)"' : '';
  const blink = (3 + Math.random() * 2).toFixed(1);
  const vb = bust ? '46 24 138 138' : '0 0 230 252';
  return `<svg class="chip ch ch-${mood}${bust ? ' bust' : ''} ${cls}" style="--blink:${blink}s" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.name}"><defs>
<radialGradient id="f${u}" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="${c.f1}"/><stop offset=".65" stop-color="${c.f2}"/><stop offset="1" stop-color="${c.f3}"/></radialGradient>
<radialGradient id="t${u}" cx="30%" cy="30%" r="90%"><stop offset="0" stop-color="${c.f1}"/><stop offset="1" stop-color="${c.f3}"/></radialGradient></defs>
<ellipse cx="112" cy="244" rx="54" ry="7" fill="${I}" opacity=".15"/>
<g class="ch-bob"><g class="ch-jump"><g${squash}>
<g class="ch-tail">${chS('M138 222 C190 222 214 176 198 132 C188 104 204 78 188 58 C174 40 148 48 152 68 C156 86 170 104 162 134 C156 158 140 176 132 196 Z', `url(#t${u})`, 3.5)}
<path d="M150 210 C186 202 198 168 186 136 C178 114 190 92 180 72" stroke="${c.light}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>
<path d="M146 196 C172 186 180 160 172 136" stroke="${c.stripe}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/></g>
${chS('M72 240 C70 228 84 224 98 228 C106 231 104 242 96 242 L78 242 C74 242 72 241 72 240 Z', c.f3, 3)}
${chS('M150 240 C152 228 138 224 124 228 C116 231 118 242 126 242 L144 242 C148 242 150 241 150 240 Z', c.f3, 3)}
${chS('M110 136 C146 136 154 172 150 198 C146 224 128 236 110 236 C92 236 74 224 70 198 C66 172 74 136 110 136 Z', `url(#f${u})`, 3.8)}
<ellipse cx="110" cy="198" rx="24" ry="30" fill="${c.light}"/>
<path d="M78 170 C76 186 80 204 90 216" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".25"/>
${scarf}
${chS('M54 62 C46 40 70 32 80 48 Z', `url(#f${u})`, 3)}<path d="M58 56 C56 46 66 42 72 50 Z" fill="${c.inner}"/>
${chS('M166 60 C174 38 150 30 140 46 Z', `url(#f${u})`, 3)}<path d="M162 54 C164 44 154 40 148 48 Z" fill="${c.inner}"/>
${who === 'mindal' ? chFlower() : ''}
${chS('M108 46 C150 46 168 76 164 104 C160 132 136 146 110 146 C84 146 58 134 54 106 C50 76 66 46 108 46 Z', `url(#f${u})`, 3.8)}
<path d="M66 108 C62 134 90 146 110 142 C130 146 158 134 154 108 C140 118 124 116 110 112 C96 116 80 118 66 108 Z" fill="${c.light}"/>
<ellipse cx="108" cy="56" rx="5" ry="11" fill="${c.stripe}" opacity=".85"/><ellipse cx="93" cy="60" rx="3" ry="8" transform="rotate(-14 93 60)" fill="${c.stripe}" opacity=".7"/><ellipse cx="123" cy="60" rx="3" ry="8" transform="rotate(14 123 60)" fill="${c.stripe}" opacity=".7"/>
<path d="M70 70 C76 60 88 54 100 52" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".3"/>
<ellipse cx="74" cy="120" rx="10" ry="6.5" fill="#F28C70" opacity=".5"/><ellipse cx="146" cy="119" rx="10" ry="6.5" fill="#F28C70" opacity=".5"/>
${chBrows(mood, c)}${chEyes(mood, who === 'mindal')}
<ellipse cx="109" cy="116" rx="7.5" ry="5.5" fill="#4A2412" stroke="${I}" stroke-width="1.5"/><ellipse cx="106.5" cy="114.5" rx="2.4" ry="1.5" fill="#fff" opacity=".8"/>
${chMouth(mood)}
${front}
${chArm(left, c)}<g class="ch-arm-r">${chArm(right, c)}</g>
</g></g></g></svg>`;
};

ART.acorn = (s = 22) => `<svg class="acorn" width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true">
  <ellipse cx="20" cy="25" rx="11" ry="13" fill="#D58A3E" stroke="#8A4A1F" stroke-width="2"/><ellipse cx="16" cy="23" rx="3" ry="6" fill="#F2B56B" opacity=".8"/>
  <path d="M6 17 Q20 4 34 17 Q20 22 6 17Z" fill="#7A4A26" stroke="#4E2B12" stroke-width="2"/><path d="M20 8 Q21 3 25 2" stroke="#4E2B12" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;

ART.tree = (x, y, s, kind) => {
  const pal = [['#E8833A', '#F2A541', '#C9532A'], ['#F2B33D', '#F7CB55', '#DE8F2A'], ['#C9532A', '#E06A35', '#A43E20'], ['#8DAA45', '#A7C25A', '#6F8C34']][kind % 4];
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="0" width="12" height="34" rx="4" fill="#7A4A26"/>
  <circle cx="-16" cy="-6" r="20" fill="${pal[2]}"/><circle cx="16" cy="-6" r="20" fill="${pal[0]}"/><circle cx="0" cy="-24" r="24" fill="${pal[1]}"/><circle cx="-6" cy="-30" r="8" fill="#fff" opacity=".18"/></g>`;
};
ART.leaf = (x, y, r, c) => `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 -8 Q7 -4 6 4 Q0 9 -6 4 Q-7 -4 0 -8Z" fill="${c}" opacity=".85"/>`;
