INK='#3A2414'; D1='#4A5878'; D2='#2E3A57'; D3='#1E2740'; TEAL='#2F9C9A'; TEAL2='#1F6F86'
WHITE='#FFFDF7'; BEAK='#3B3B48'; BLUSH='#F28C9A'

def defs(u):
    return f'''<defs>
<radialGradient id="h{u}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#6E7FA6"/><stop offset=".55" stop-color="{D1}"/><stop offset="1" stop-color="{D3}"/></radialGradient>
<linearGradient id="t{u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{TEAL}"/><stop offset=".55" stop-color="{TEAL2}"/><stop offset="1" stop-color="{D3}"/></linearGradient>
<radialGradient id="w{u}" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E9E4DA"/></radialGradient>
</defs>'''

def S(d,f,w=3.4,x=''):
    return f'<path d="{d}" fill="{f}" stroke="{INK}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round" {x}/>'

EYES=((92,90),(128,88))
def eyes(m):
    o=''
    for i,(x,y) in enumerate(EYES):
        if (m=='sly' and i==1) or m=='cheer':
            o+=f'<path d="M{x-11} {y+2} q11 -13 22 0" stroke="{WHITE}" stroke-width="5" fill="none" stroke-linecap="round"/>'
            continue
        lx,ly={'happy':(1,-1),'sly':(-3,0),'oops':(5,-2)}[m]
        big=1.12 if m=='oops' else 1
        o+=f'''<ellipse cx="{x}" cy="{y}" rx="{13*big:.1f}" ry="{16*big:.1f}" fill="{WHITE}" stroke="{INK}" stroke-width="2.6"/>
<ellipse cx="{x+lx}" cy="{y+ly}" rx="8.4" ry="10.4" fill="#5A3214"/><ellipse cx="{x+lx}" cy="{y+ly+1}" rx="4.6" ry="5.8" fill="#140A04"/>
<ellipse cx="{x+lx+3}" cy="{y+ly-4.5}" rx="3.4" ry="3.9" fill="#fff"/><circle cx="{x+lx-3}" cy="{y+ly+4}" r="1.4" fill="#fff"/>'''
    # реснички — она девочка
    for (x,y),s in zip(EYES,(-1,1)):
        if (m=='sly' and s==1) or m=='cheer': continue
        ex=x+s*12
        o+=f'<path d="M{ex} {y-9} l{s*6} -5 M{ex+s} {y-4} l{s*7} -2" stroke="{WHITE}" stroke-width="2.4" stroke-linecap="round"/>'
    return o

def brows(m):
    d={'happy':'M78 68 q12 -8 24 -2 M116 66 q12 -5 23 3','sly':'M78 70 q12 -4 24 0 M116 62 q12 -9 23 1',
       'cheer':'M78 70 q12 -10 24 -2 M116 68 q12 -8 23 2','oops':'M78 64 q12 -10 24 -4 M116 62 q12 -8 23 0'}[m]
    return f'<path d="{d}" stroke="#AAB4D0" stroke-width="4" fill="none" stroke-linecap="round"/>'

def beak(m):
    B='#5A5A6A'
    if m=='cheer':
        return S('M104 100 Q90 100 78 106 Q92 108 106 108 Z',B,3)+S('M104 112 Q92 114 82 120 Q96 122 106 116 Z',B,3)+'<path d="M90 110 L102 111" stroke="#C0465A" stroke-width="4" stroke-linecap="round"/>'
    return S('M106 98 Q94 100 80 110 Q94 114 108 112 Z',B,3)+'<path d="M100 102 Q92 104 86 108" stroke="#B5BACB" stroke-width="2.2" fill="none" stroke-linecap="round"/>'

def wing(cx,cy,rot,u,front=True):
    return (f'<g transform="translate({cx} {cy}) rotate({rot})">'
            + S('M0 -6 C26 -14 52 -4 62 16 C50 22 36 22 26 18 C30 26 26 32 18 32 C10 30 2 20 0 -6 Z',f'url(#t{u})',3.2)
            + S('M4 -2 C16 -8 28 -6 34 2 C26 10 14 12 6 8 Z',WHITE,2.4)
            + '<path d="M36 14 L58 14 M30 22 L48 22" stroke="#7FD3CF" stroke-width="2.2" stroke-linecap="round" opacity=".7"/></g>')

POSE={'happy':((70,148,200),(150,140,-60)),'sly':((70,150,200),(140,160,150)),
      'cheer':((70,130,240),(152,128,-80)),'oops':((70,150,200),(148,150,-30))}

def soroka(m,u,w=220):
    (lx,ly,lr),(rx,ry,rr)=POSE[m]
    tuft=S('M104 44 C100 26 112 18 118 24 C114 30 114 38 112 46 Z',D2,3)+S('M114 46 C116 30 130 26 134 34 C126 36 120 42 118 48 Z',D2,3)
    extra=''
    if m=='sly':  # блестящий орешек
        extra=f'<g transform="translate(150 160)"><ellipse rx="11" ry="13" fill="#F4C542" stroke="{INK}" stroke-width="2.6"/><path d="M-11 -4 Q0 -18 11 -4 Z" fill="#A8693A" stroke="{INK}" stroke-width="2.4"/><path d="M-4 2 q2 -6 6 -6" stroke="#fff" stroke-width="2.4" fill="none"/><path d="M16 -14 l4 -4 M18 -6 l6 -1 M14 -20 l1 -6" stroke="#F4C542" stroke-width="2.5" stroke-linecap="round"/></g>'
    if m=='oops':
        extra='<path d="M150 70 q6 10 0 14 q-6 -4 0 -14 Z" fill="#9FD8F2" stroke="#3A2414" stroke-width="2"/>'
    squash='transform="translate(115 244) scale(1.04 .96) translate(-115 -244)"' if m=='cheer' else ''
    return f'''<svg viewBox="0 0 240 252" width="{w}" xmlns="http://www.w3.org/2000/svg" aria-label="Сорока">{defs(u)}
<ellipse cx="118" cy="244" rx="56" ry="7" fill="{INK}" opacity=".15"/>
<g {squash}>
<!-- хвост -->
{S('M138 196 C170 206 200 222 226 240 C216 246 196 246 176 236 C160 228 146 218 132 210 Z',f'url(#t{u})',3.4)}
<path d="M146 206 C172 218 196 230 218 240" stroke="#7FD3CF" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
<!-- лапки -->
<path d="M100 222 L98 238 M126 222 L128 238" stroke="{BEAK}" stroke-width="5" stroke-linecap="round"/>
<path d="M86 240 L98 238 L108 241 M116 241 L128 238 L140 240" stroke="{BEAK}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
<!-- тело -->
{S('M114 120 C152 122 162 160 156 188 C150 214 132 226 114 226 C94 226 76 214 72 188 C68 160 78 120 114 120 Z',f'url(#h{u})',3.6)}
{S('M114 140 C138 142 146 168 142 190 C138 210 126 218 114 218 C100 218 88 210 86 190 C82 168 92 140 114 140 Z',f'url(#w{u})',2.4)}
{wing(lx,ly,lr,u)}
<!-- голова -->
{tuft}
{S('M112 40 C150 40 164 70 160 96 C156 122 136 134 112 134 C86 134 66 120 62 96 C58 70 76 40 112 40 Z',f'url(#h{u})',3.6)}
<path d="M76 66 C84 54 98 48 110 48" stroke="#8C9BC4" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/>
<ellipse cx="80" cy="112" rx="9" ry="5.5" fill="{BLUSH}" opacity=".45"/><ellipse cx="144" cy="110" rx="9" ry="5.5" fill="{BLUSH}" opacity=".45"/>
{brows(m)}{eyes(m)}{beak(m)}
<!-- бусы: любит блестящее -->
<path d="M84 128 Q114 146 144 128" stroke="{INK}" stroke-width="1.6" fill="none"/>
<circle cx="98" cy="136" r="5" fill="#F4C542" stroke="{INK}" stroke-width="2"/><circle cx="114" cy="140" r="6" fill="#E25B5B" stroke="{INK}" stroke-width="2"/><circle cx="130" cy="136" r="5" fill="#4FC3C0" stroke="{INK}" stroke-width="2"/>
<circle cx="112" cy="138" r="1.8" fill="#fff"/>
{wing(rx,ry,rr,u)}
{extra}
</g></svg>'''

labels={'happy':'Привет! (по умолчанию)','sly':'Хитрит / Путаница','cheer':'Ура! Мой ход!','oops':'Ой! Поймали'}
cards=''.join(f'<figure>{soroka(m,m,210)}<figcaption>{labels[m]}</figcaption></figure>' for m in labels)
for m in labels: open(f'/home/claude/soroka/out/soroka-{m}.svg','w').write(soroka(m,m))
open('/home/claude/soroka/concept.html','w').write(f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><style>body{{margin:0;background:#FFF4E0;font-family:Georgia,serif;color:#4A2A12}}
.wrap{{max-width:1100px;margin:0 auto;padding:24px}} h1{{margin:0 0 4px;font-size:32px}} .sub{{opacity:.75;margin-bottom:14px}}
.row{{display:flex;justify-content:space-between;background:radial-gradient(ellipse at 50% 30%,#FFF9EC,#F6E2BD);border-radius:22px;padding:14px 10px;border:3px solid #E8C894}}
figure{{margin:0;text-align:center}} figcaption{{font-style:italic;font-size:17px}}</style></head><body><div class="wrap">
<h1>Сорока-Путаница · концепт</h1><div class="sub">Тот же стиль, что Жёлудик и бурундуки. Озорная, но добрая: хохолок, реснички, бусы из блестяшек, сине-бирюзовый отлив вместо угольно-чёрного.</div>
<div class="row">{cards}</div></div></body></html>''')
