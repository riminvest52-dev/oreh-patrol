/* Новые герои и предметы для разделов рядом с математикой — в стиле Жёлудика:
   толстый тёплый контур, объём градиентом, большие глаза с бликами, румянец.
   Сорока (соперница в «Тропинке к дубу»), Дуб, Волчок. Бобр появится в «Объёмной мастерской». */
'use strict';

let art2N = 0;

/* ---------- Сорока (Сорока-Путаница) — по утверждённому концепту (генератор заказчика soroka-gen.py, перенесён в JS) ----------
   Приметы: тёмно-синее тело с сине-бирюзовым отливом, белое брюшко и белые пятна на крыльях, длинный бирюзовый хвост,
   хохолок из трёх перьев, большие карие глаза с бликами и светлыми ресничками, короткий серый клюв, бусы из блестяшек.
   Позы: happy — машет крылом (по умолчанию), cheer — «Ура! Мой ход!», sly — подмигивает с блестящим орешком
   (хитрит; в будущем «Исправь Путаницу»), oops — её обогнали / поймали: удивлённые глаза, капелька.
   head = true — только голова (для фишки на дорожке). */
const SOR = { INK: '#3A2414', D1: '#4A5878', D2: '#2E3A57', D3: '#1E2740', TEAL: '#2F9C9A', TEAL2: '#1F6F86', WHITE: '#FFFDF7', BEAK: '#3B3B48', BLUSH: '#F28C9A' };
const SOR_EYES = [[92, 90], [128, 88]];
const SOR_POSE = { happy: [[70, 148, 200], [150, 140, -60]], sly: [[70, 150, 200], [140, 160, 150]], cheer: [[70, 130, 240], [152, 128, -80]], oops: [[70, 150, 200], [148, 150, -30]] };
const sorS = (d, f, w = 3.4) => `<path d="${d}" fill="${f}" stroke="${SOR.INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
function sorEyes(m) {
  const W = SOR.WHITE, I = SOR.INK;
  let open = '', closed = '';
  SOR_EYES.forEach(([x, y], i) => {
    if ((m === 'sly' && i === 1) || m === 'cheer') { closed += `<path d="M${x - 11} ${y + 2} q11 -13 22 0" stroke="${W}" stroke-width="5" fill="none" stroke-linecap="round"/>`; return; }
    const [lx, ly] = { happy: [1, -1], sly: [-3, 0], oops: [5, -2] }[m], big = m === 'oops' ? 1.12 : 1;
    open += `<ellipse cx="${x}" cy="${y}" rx="${(13 * big).toFixed(1)}" ry="${(16 * big).toFixed(1)}" fill="${W}" stroke="${I}" stroke-width="2.6"/>
<ellipse cx="${x + lx}" cy="${y + ly}" rx="8.4" ry="10.4" fill="#5A3214"/><ellipse cx="${x + lx}" cy="${y + ly + 1}" rx="4.6" ry="5.8" fill="#140A04"/>
<ellipse cx="${x + lx + 3}" cy="${y + ly - 4.5}" rx="3.4" ry="3.9" fill="#fff"/><circle cx="${x + lx - 3}" cy="${y + ly + 4}" r="1.4" fill="#fff"/>`;
  });
  SOR_EYES.forEach(([x, y], i) => {   /* реснички — она девочка */
    const s = i ? 1 : -1;
    if ((m === 'sly' && s === 1) || m === 'cheer') return;
    const ex = x + s * 12;
    open += `<path d="M${ex} ${y - 9} l${s * 6} -5 M${ex + s} ${y - 4} l${s * 7} -2" stroke="${W}" stroke-width="2.4" stroke-linecap="round"/>`;
  });
  return (open ? `<g class="sor-eyes">${open}</g>` : '') + closed;
}
const sorBrows = m => `<path d="${{ happy: 'M78 68 q12 -8 24 -2 M116 66 q12 -5 23 3', sly: 'M78 70 q12 -4 24 0 M116 62 q12 -9 23 1',
  cheer: 'M78 70 q12 -10 24 -2 M116 68 q12 -8 23 2', oops: 'M78 64 q12 -10 24 -4 M116 62 q12 -8 23 0' }[m]}" stroke="#AAB4D0" stroke-width="4" fill="none" stroke-linecap="round"/>`;
function sorBeak(m) {
  const B = '#5A5A6A';
  if (m === 'cheer') return sorS('M104 100 Q90 100 78 106 Q92 108 106 108 Z', B, 3) + sorS('M104 112 Q92 114 82 120 Q96 122 106 116 Z', B, 3) + '<path d="M90 110 L102 111" stroke="#C0465A" stroke-width="4" stroke-linecap="round"/>';
  return sorS('M106 98 Q94 100 80 110 Q94 114 108 112 Z', B, 3) + '<path d="M100 102 Q92 104 86 108" stroke="#B5BACB" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
}
const sorWing = ([cx, cy, rot], u, side) => `<g transform="translate(${cx} ${cy}) rotate(${rot})"><g class="sor-wing sor-wing-${side}">`
  + sorS('M0 -6 C26 -14 52 -4 62 16 C50 22 36 22 26 18 C30 26 26 32 18 32 C10 30 2 20 0 -6 Z', `url(#t${u})`, 3.2)
  + sorS('M4 -2 C16 -8 28 -6 34 2 C26 10 14 12 6 8 Z', SOR.WHITE, 2.4)
  + '<path d="M36 14 L58 14 M30 22 L48 22" stroke="#7FD3CF" stroke-width="2.2" stroke-linecap="round" opacity=".7"/></g></g>';

ART.soroka = function (mood = 'happy', cls = '', head = false) {
  if (mood === 'think') mood = 'oops';
  if (!SOR_POSE[mood]) mood = 'happy';
  const u = 'so' + (++art2N), I = SOR.INK, [L, Rw] = SOR_POSE[mood];
  const blink = (3 + Math.random() * 2).toFixed(1);
  const tuft = sorS('M96 48 C88 34 92 26 100 30 C100 36 102 42 104 48 Z', SOR.D2, 3)   /* хохолок: три пера */
    + sorS('M104 44 C100 26 112 18 118 24 C114 30 114 38 112 46 Z', SOR.D2, 3)
    + sorS('M114 46 C116 30 130 26 134 34 C126 36 120 42 118 48 Z', SOR.D2, 3);
  const extra = mood === 'sly'
    ? `<g transform="translate(150 160)"><ellipse rx="11" ry="13" fill="#F4C542" stroke="${I}" stroke-width="2.6"/><path d="M-11 -4 Q0 -18 11 -4 Z" fill="#A8693A" stroke="${I}" stroke-width="2.4"/><path d="M-4 2 q2 -6 6 -6" stroke="#fff" stroke-width="2.4" fill="none"/><path class="sor-spark" d="M16 -14 l4 -4 M18 -6 l6 -1 M14 -20 l1 -6" stroke="#F4C542" stroke-width="2.5" stroke-linecap="round"/></g>`
    : mood === 'oops' ? `<path d="M150 70 q6 10 0 14 q-6 -4 0 -14 Z" fill="#9FD8F2" stroke="${I}" stroke-width="2"/>` : '';
  const squash = mood === 'cheer' ? ' transform="translate(115 244) scale(1.04 .96) translate(-115 -244)"' : '';
  const vb = head ? '54 14 116 116' : '0 0 240 252';
  const body = head ? '' : `<g class="sor-tail">${sorS('M138 196 C170 206 200 222 226 240 C216 246 196 246 176 236 C160 228 146 218 132 210 Z', `url(#t${u})`, 3.4)}
<path d="M146 206 C172 218 196 230 218 240" stroke="#7FD3CF" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/></g>
<path d="M100 222 L98 238 M126 222 L128 238" stroke="${SOR.BEAK}" stroke-width="5" stroke-linecap="round"/>
<path d="M86 240 L98 238 L108 241 M116 241 L128 238 L140 240" stroke="${SOR.BEAK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
${sorS('M114 120 C152 122 162 160 156 188 C150 214 132 226 114 226 C94 226 76 214 72 188 C68 160 78 120 114 120 Z', `url(#h${u})`, 3.6)}
${sorS('M114 140 C138 142 146 168 142 190 C138 210 126 218 114 218 C100 218 88 210 86 190 C82 168 92 140 114 140 Z', `url(#w${u})`, 2.4)}
${sorWing(L, u, 'l')}`;
  const front = head ? '' : `<path d="M84 128 Q114 146 144 128" stroke="${I}" stroke-width="1.6" fill="none"/>
<circle cx="98" cy="136" r="5" fill="#F4C542" stroke="${I}" stroke-width="2"/><circle cx="114" cy="140" r="6" fill="#E25B5B" stroke="${I}" stroke-width="2"/><circle cx="130" cy="136" r="5" fill="#4FC3C0" stroke="${I}" stroke-width="2"/>
<circle cx="112" cy="138" r="1.8" fill="#fff"/>
${sorWing(Rw, u, 'r')}
${extra}`;
  return `<svg class="chip sor sor-${mood}${head ? ' head' : ''} ${cls}" style="--blink:${blink}s" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Сорока"><defs>
<radialGradient id="h${u}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#6E7FA6"/><stop offset=".55" stop-color="${SOR.D1}"/><stop offset="1" stop-color="${SOR.D3}"/></radialGradient>
<linearGradient id="t${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SOR.TEAL}"/><stop offset=".55" stop-color="${SOR.TEAL2}"/><stop offset="1" stop-color="${SOR.D3}"/></linearGradient>
<radialGradient id="w${u}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9E4DA"/></radialGradient></defs>
${head ? '' : `<ellipse cx="118" cy="244" rx="56" ry="7" fill="${I}" opacity=".15"/>`}
<g class="sor-jump"><g class="sor-bob"><g${squash}>
${body}
${tuft}
${sorS('M112 40 C150 40 164 70 160 96 C156 122 136 134 112 134 C86 134 66 120 62 96 C58 70 76 40 112 40 Z', `url(#h${u})`, 3.6)}
<path d="M76 66 C84 54 98 48 110 48" stroke="#8C9BC4" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>
<ellipse cx="80" cy="112" rx="9" ry="5.5" fill="${SOR.BLUSH}" opacity=".45"/><ellipse cx="144" cy="110" rx="9" ry="5.5" fill="${SOR.BLUSH}" opacity=".45"/>
${sorBrows(mood)}${sorEyes(mood)}${sorBeak(mood)}
${front}
</g></g></g></svg>`;
};

/* Дуб у конца тропинки: big — для финальной сцены */
ART.oak = function (cls = '') {
  const u = 'oak' + (++art2N), I = '#4A2814';
  const acorn = (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="4" rx="5" ry="6" fill="#E8A040" stroke="${I}" stroke-width="1.6"/><path d="M-6 0 C-6 -6 6 -6 6 0 Z" fill="#8A5530" stroke="${I}" stroke-width="1.6"/></g>`;
  return `<svg class="oak ${cls}" viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Дуб"><defs>
<radialGradient id="c${u}" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#B8DA6A"/><stop offset=".6" stop-color="#7FB04A"/><stop offset="1" stop-color="#4E7F2A"/></radialGradient>
<linearGradient id="t${u}" x1="0" x2="1"><stop offset="0" stop-color="#9A6438"/><stop offset=".5" stop-color="#B97E4A"/><stop offset="1" stop-color="#7A4A26"/></linearGradient></defs>
<ellipse cx="100" cy="222" rx="70" ry="7" fill="${I}" opacity=".15"/>
<path d="M82 222 C86 190 84 160 78 132 L122 132 C116 160 114 190 120 222 C108 226 94 226 82 222 Z" fill="url(#t${u})" stroke="${I}" stroke-width="4" stroke-linejoin="round"/>
<path d="M82 222 C70 220 62 224 58 222 M120 222 C132 220 140 224 144 222" stroke="${I}" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="101" cy="178" rx="10" ry="13" fill="#4A2814"/><ellipse cx="101" cy="180" rx="6" ry="9" fill="#2A160A"/>
<path d="M100 20 C130 10 162 26 166 52 C192 58 198 92 180 110 C188 132 166 152 140 146 C126 162 82 164 66 148 C38 154 14 132 22 108 C4 92 14 58 40 54 C46 28 74 14 100 20 Z" fill="url(#c${u})" stroke="${I}" stroke-width="4" stroke-linejoin="round"/>
<path d="M52 66 C60 50 76 42 92 42" stroke="#D8EE9A" stroke-width="6" fill="none" stroke-linecap="round" opacity=".6"/>
${acorn(60, 96)}${acorn(132, 72)}${acorn(150, 118)}${acorn(92, 124)}${acorn(110, 92)}</svg>`;
};

/* Волчок: n — число на боку (1 или 2), dots — ещё и столько же жёлудей-точек сверху, spinning — для анимации */
ART.top = function (n = '', cls = '', dots = false) {
  const u = 'top' + (++art2N), I = '#4A2814';
  return `<svg class="ktop ${cls}" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Волчок"><defs>
<linearGradient id="g${u}" x1="0" x2="1"><stop offset="0" stop-color="#E8742E"/><stop offset=".5" stop-color="#F5B43C"/><stop offset="1" stop-color="#E8742E"/></linearGradient></defs>
<ellipse cx="60" cy="124" rx="26" ry="5" fill="${I}" opacity=".15"/>
<g class="ktop-body"><path d="M54 10 L66 10 L66 30 L54 30 Z" fill="#8A5530" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
<path d="M14 58 C14 38 36 28 60 28 C84 28 106 38 106 58 C106 80 76 104 62 120 C61 121 59 121 58 120 C44 104 14 80 14 58 Z" fill="url(#g${u})" stroke="${I}" stroke-width="4" stroke-linejoin="round"/>
<path d="M18 60 C40 70 80 70 102 60" stroke="#C0561E" stroke-width="5" fill="none"/>
<path d="M30 44 C40 36 52 34 62 34" stroke="#FFE3A6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
${n !== '' ? (() => { const cy = dots ? 54 : 80; return `<circle cx="60" cy="${cy}" r="17" fill="#FFFBF3" stroke="${I}" stroke-width="3"/><text x="60" y="${cy + 9}" text-anchor="middle" font-size="26" font-weight="800" fill="${I}" font-family="system-ui, sans-serif">${n}</text>`; })() : ''}
${dots && n ? Array.from({ length: n }, (_, i) => `<g transform="translate(${60 + (i - (n - 1) / 2) * 22} 84)"><path d="M-7 1 C-7 9 -3 14 0 15 C3 14 7 9 7 1 Z" fill="#7A3E12" stroke="${I}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-9 1.5 C-9 -7 9 -7 9 1.5 Z" fill="#4A2814" stroke="${I}" stroke-width="2.5" stroke-linejoin="round"/><path d="M0 -6 L1 -10" stroke="${I}" stroke-width="2.5" stroke-linecap="round"/></g>`).join('') : ''}</g></svg>`;
};
