/* Рисунки: бурундуки Фундук и Миндалинка, жёлудь, деревья */
'use strict';

const ART = {};
ART.chip = function (who = 'funduk', mood = 'happy', cls = '') {
  const F = who === 'funduk'
    ? { fur: '#C46F33', furD: '#8A4A1F', light: '#F8DDB4', inner: '#F0A48A', stripe: '#5A2D12' }
    : { fur: '#DB9A5E', furD: '#A5652F', light: '#FCEBD2', inner: '#F6B4A2', stripe: '#6E3B1C' };
  const ink = '#3A1E0C';
  const cheer = mood === 'cheer', sad = mood === 'sad', think = mood === 'think';
  const px = think ? -3 : 2, py = think ? -4 : 3;
  const arms = cheer
    ? `<ellipse cx="46" cy="128" rx="11" ry="22" transform="rotate(-35 46 128)" fill="${F.fur}" stroke="${F.furD}" stroke-width="2.5"/><ellipse cx="154" cy="128" rx="11" ry="22" transform="rotate(35 154 128)" fill="${F.fur}" stroke="${F.furD}" stroke-width="2.5"/>`
    : `<ellipse cx="64" cy="170" rx="11" ry="18" transform="rotate(20 64 170)" fill="${F.fur}" stroke="${F.furD}" stroke-width="2.5"/><ellipse cx="136" cy="170" rx="11" ry="18" transform="rotate(-20 136 170)" fill="${F.fur}" stroke="${F.furD}" stroke-width="2.5"/>`;
  const eye = (cx, flip) => `<ellipse cx="${cx}" cy="88" rx="14" ry="17" fill="#fff" stroke="${ink}" stroke-width="2"/>` +
    `<circle cx="${cx + (flip ? -px : px)}" cy="${91 + py}" r="${cheer ? 10 : 9}" fill="#2A1406"/><circle cx="${cx + (flip ? -px : px) + 3}" cy="${86 + py}" r="3.5" fill="#fff"/>` +
    (sad ? `<path d="M${cx - 15} 80 Q${cx} ${flip ? 74 : 74} ${cx + 15} 80 L${cx + 15} 71 L${cx - 15} 71Z" fill="${F.fur}"/>` : '');
  const brows = think ? `<path d="M68 66 Q80 58 92 64" stroke="${F.stripe}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M108 62 Q120 56 132 62" stroke="${F.stripe}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : sad ? `<path d="M68 66 Q80 62 92 68" stroke="${F.stripe}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M108 68 Q120 62 132 66" stroke="${F.stripe}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<path d="M68 68 Q80 58 92 66" stroke="${F.stripe}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M108 66 Q120 58 132 68" stroke="${F.stripe}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const mouth = cheer ? `<path d="M86 115 Q100 140 114 115 Z" fill="#7A2A18" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="100" cy="127" rx="7" ry="5" fill="#F07A7A"/>`
    : sad ? `<path d="M91 121 Q100 125 109 121" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : think ? `<path d="M93 120 Q102 118 109 122" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<path d="M87 115 Q100 131 113 115" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const acc = who === 'funduk'
    ? `<path d="M64 140 Q100 152 136 140 L104 172 Q100 176 96 172 Z" fill="#D8432A" stroke="#8E2414" stroke-width="2.5" stroke-linejoin="round"/>
       <circle cx="88" cy="150" r="2.6" fill="#FFE7C2"/><circle cx="104" cy="156" r="2.6" fill="#FFE7C2"/><circle cx="114" cy="147" r="2.6" fill="#FFE7C2"/><circle cx="97" cy="164" r="2.2" fill="#FFE7C2"/>
       <path d="M58 52 Q70 20 104 24 Q132 26 140 46 Q120 38 100 40 Q76 40 58 52Z" fill="#3E7A3A" stroke="#234A20" stroke-width="2.5"/><path d="M100 24 Q104 12 112 10" stroke="#234A20" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<g stroke="#5A3A22" stroke-width="3" fill="none"><circle cx="80" cy="88" r="20"/><circle cx="120" cy="88" r="20"/><path d="M100 86 Q100 80 100 86"/><path d="M99 84 L101 84"/></g>
       <g transform="translate(144 40)"><circle cx="0" cy="-11" r="8" fill="#FFC94A"/><circle cx="10" cy="-3" r="8" fill="#FFC94A"/><circle cx="6" cy="9" r="8" fill="#FFC94A"/><circle cx="-6" cy="9" r="8" fill="#FFC94A"/><circle cx="-10" cy="-3" r="8" fill="#FFC94A"/><circle cx="0" cy="0" r="6" fill="#E8742E"/></g>
       <path d="M70 142 Q100 154 130 142" stroke="#4E9A6A" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="100" cy="152" r="5" fill="#F4C542" stroke="#B88A1C" stroke-width="2"/>`;
  return `<svg class="chip ${cls}" viewBox="0 0 200 215" xmlns="http://www.w3.org/2000/svg" aria-label="${who === 'funduk' ? 'Фундук' : 'Миндалинка'}">
  <path d="M138 176 C196 168 206 96 172 62 C152 44 132 66 148 84 C168 106 164 140 126 152 Z" fill="${F.fur}" stroke="${F.furD}" stroke-width="3"/>
  <path d="M150 160 C182 146 186 104 166 80" stroke="${F.light}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>
  <ellipse cx="100" cy="172" rx="46" ry="38" fill="${F.fur}" stroke="${F.furD}" stroke-width="3"/>
  <ellipse cx="100" cy="178" rx="27" ry="25" fill="${F.light}"/>
  <ellipse cx="78" cy="207" rx="15" ry="7" fill="${F.furD}"/><ellipse cx="122" cy="207" rx="15" ry="7" fill="${F.furD}"/>
  ${arms}
  <circle cx="52" cy="46" r="17" fill="${F.fur}" stroke="${F.furD}" stroke-width="2.5"/><circle cx="52" cy="47" r="9" fill="${F.inner}"/>
  <circle cx="148" cy="46" r="17" fill="${F.fur}" stroke="${F.furD}" stroke-width="2.5"/><circle cx="148" cy="47" r="9" fill="${F.inner}"/>
  <ellipse cx="100" cy="92" rx="60" ry="54" fill="${F.fur}" stroke="${F.furD}" stroke-width="3"/>
  <ellipse cx="100" cy="50" rx="6" ry="14" fill="${F.stripe}"/><ellipse cx="84" cy="54" rx="3.5" ry="10" fill="${F.stripe}" transform="rotate(-14 84 54)"/><ellipse cx="116" cy="54" rx="3.5" ry="10" fill="${F.stripe}" transform="rotate(14 116 54)"/>
  <ellipse cx="74" cy="115" rx="24" ry="18" fill="${F.light}"/><ellipse cx="126" cy="115" rx="24" ry="18" fill="${F.light}"/><ellipse cx="100" cy="124" rx="20" ry="14" fill="${F.light}"/>
  <ellipse cx="62" cy="106" rx="9" ry="5" fill="#F0836E" opacity=".45"/><ellipse cx="138" cy="106" rx="9" ry="5" fill="#F0836E" opacity=".45"/>
  ${brows}${eye(80, false)}${eye(120, true)}
  <ellipse cx="100" cy="106" rx="8" ry="6" fill="#4A2412"/><ellipse cx="97" cy="104" rx="2.5" ry="1.6" fill="#fff" opacity=".7"/>
  ${mouth}${acc}
</svg>`;
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
