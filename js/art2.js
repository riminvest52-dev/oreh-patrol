/* Новые герои и предметы для разделов рядом с математикой — в стиле Жёлудика:
   толстый тёплый контур, объём градиентом, большие глаза с бликами, румянец.
   Сорока (соперница в «Тропинке к дубу»), Дуб, Волчок. Бобр появится в «Объёмной мастерской». */
'use strict';

let art2N = 0;
const A2 = { INK: '#2A2030', NAVY1: '#4A5878', NAVY2: '#26304A', NAVY3: '#151B2C', TEAL1: '#5FC7C0', TEAL2: '#2E7E96', CHEEK: '#F28C70', IRIS: '#3B2A4A' };

/* Сорока: mood = happy | cheer (крылья вверх) | think */
ART.soroka = function (mood = 'happy', cls = '') {
  const u = 'so' + (++art2N), I = A2.INK;
  const cheer = mood === 'cheer', think = mood === 'think';
  const eye = (cx, cy) => {
    if (cheer) return `<path d="M${cx - 11} ${cy + 3} q11 -14 22 0" stroke="${I}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    const lx = think ? -3 : 2, ly = think ? -4 : 0;
    return `<ellipse cx="${cx}" cy="${cy}" rx="12.5" ry="15.5" fill="#FFFDF6" stroke="${I}" stroke-width="2.8"/>
<ellipse cx="${cx + lx}" cy="${cy + ly}" rx="8.4" ry="10.5" fill="${A2.IRIS}"/><ellipse cx="${cx + lx}" cy="${cy + ly + 1}" rx="4.6" ry="6" fill="#0E0812"/>
<ellipse cx="${cx + lx + 3}" cy="${cy + ly - 4.5}" rx="3.4" ry="3.9" fill="#fff"/><circle cx="${cx + lx - 2.6}" cy="${cy + ly + 3.6}" r="1.4" fill="#fff"/>`;
  };
  const wing = cheer
    ? `<g transform="rotate(-38 82 112)"><path d="M84 112 C66 96 34 92 22 104 C34 110 30 118 40 122 C34 128 40 136 52 134 C62 142 82 136 92 128 Z" fill="url(#w${u})" stroke="${I}" stroke-width="3.6" stroke-linejoin="round"/>
<path d="M40 110 C54 112 68 116 82 120 M46 126 C58 126 70 126 84 126" stroke="#BFF1EC" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/></g>`
    : `<path d="M66 108 C84 92 118 100 122 126 C126 150 100 166 74 160 C58 154 52 124 66 108 Z" fill="url(#w${u})" stroke="${I}" stroke-width="3.6" stroke-linejoin="round"/>
<path d="M72 120 C86 118 100 124 110 134 M74 136 C86 134 98 140 106 148" stroke="#BFF1EC" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".7"/>`;
  return `<svg class="chip sor sor-${mood} ${cls}" viewBox="0 0 220 210" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Сорока"><defs>
<radialGradient id="b${u}" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="${A2.NAVY1}"/><stop offset=".6" stop-color="${A2.NAVY2}"/><stop offset="1" stop-color="${A2.NAVY3}"/></radialGradient>
<linearGradient id="w${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${A2.TEAL1}"/><stop offset="1" stop-color="${A2.TEAL2}"/></linearGradient>
<linearGradient id="t${u}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${A2.TEAL2}"/><stop offset="1" stop-color="${A2.NAVY3}"/></linearGradient></defs>
<ellipse cx="112" cy="202" rx="50" ry="6" fill="${I}" opacity=".15"/>
<g class="sor-hop">
<path d="M78 146 L20 192 C14 197 8 191 13 185 L64 128 Z" fill="url(#t${u})" stroke="${I}" stroke-width="3.6" stroke-linejoin="round"/>
<path d="M30 180 L64 146" stroke="#9FE3DD" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
<path d="M104 172 L100 196 M126 172 L130 196" stroke="${I}" stroke-width="5" stroke-linecap="round"/>
<path d="M90 198 L110 198 M120 198 L140 198" stroke="${I}" stroke-width="4.5" stroke-linecap="round"/>
<path d="M114 84 C156 84 170 116 166 142 C162 166 140 180 112 180 C82 180 62 162 62 134 C62 104 80 84 114 84 Z" fill="url(#b${u})" stroke="${I}" stroke-width="4" stroke-linejoin="round"/>
<path d="M122 104 C154 110 162 146 146 166 C134 178 112 176 106 160 C102 142 108 118 122 104 Z" fill="#FFFDF7" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
<path d="M130 120 C140 128 144 142 140 156" stroke="#E8E0D6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
${wing}
<circle cx="128" cy="64" r="44" fill="url(#b${u})" stroke="${I}" stroke-width="4"/>
<path d="M112 22 C114 10 124 6 128 14 C132 4 144 8 140 22" fill="${A2.NAVY2}" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
<path d="M98 42 C106 32 118 28 128 28" stroke="#7F90B8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/>
${eye(112, 62)}${eye(146, 60)}
<ellipse cx="102" cy="84" rx="8" ry="5" fill="${A2.CHEEK}" opacity=".55"/><ellipse cx="160" cy="82" rx="8" ry="5" fill="${A2.CHEEK}" opacity=".55"/>
${think ? `<path d="M100 40 q10 -6 20 0 M136 38 q10 -2 18 4" stroke="${I}" stroke-width="3.6" fill="none" stroke-linecap="round"/>` : ''}
<path d="M156 74 L186 82 C188 83 188 85 186 86 L156 92 C150 88 150 78 156 74 Z" fill="#3A3340" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
<path d="M158 80 L180 83" stroke="#8C8496" stroke-width="2" stroke-linecap="round"/>
${cheer ? `<path d="M150 96 q8 8 16 0" stroke="${I}" stroke-width="3" fill="#C84A3A" stroke-linejoin="round"/>` : ''}
</g></svg>`;
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

/* Волчок: half — число на боку (1 или 2), spinning — для анимации */
ART.top = function (n = '', cls = '') {
  const u = 'top' + (++art2N), I = '#4A2814';
  return `<svg class="ktop ${cls}" viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Волчок"><defs>
<linearGradient id="g${u}" x1="0" x2="1"><stop offset="0" stop-color="#E8742E"/><stop offset=".5" stop-color="#F5B43C"/><stop offset="1" stop-color="#E8742E"/></linearGradient></defs>
<ellipse cx="60" cy="124" rx="26" ry="5" fill="${I}" opacity=".15"/>
<g class="ktop-body"><path d="M54 10 L66 10 L66 30 L54 30 Z" fill="#8A5530" stroke="${I}" stroke-width="3" stroke-linejoin="round"/>
<path d="M14 58 C14 38 36 28 60 28 C84 28 106 38 106 58 C106 80 76 104 62 120 C61 121 59 121 58 120 C44 104 14 80 14 58 Z" fill="url(#g${u})" stroke="${I}" stroke-width="4" stroke-linejoin="round"/>
<path d="M18 60 C40 70 80 70 102 60" stroke="#C0561E" stroke-width="5" fill="none"/>
<path d="M30 44 C40 36 52 34 62 34" stroke="#FFE3A6" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
${n !== '' ? `<circle cx="60" cy="80" r="17" fill="#FFFBF3" stroke="${I}" stroke-width="3"/><text x="60" y="89" text-anchor="middle" font-size="26" font-weight="800" fill="${I}" font-family="system-ui, sans-serif">${n}</text>` : ''}</g></svg>`;
};
