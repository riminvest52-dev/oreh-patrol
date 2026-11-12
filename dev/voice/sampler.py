"""Пробник голосов: каждая фраза — 4 вариантами голоса SpeechKit, страница samples.html с кнопками ▶.

    python dev/voice/sampler.py            # озвучить (из кэша — бесплатно) и собрать страницу
    python dev/voice/sampler.py --upload   # + выложить в бакет: /dev-voice/samples.html
"""
import html
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import speechkit as sk  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'samples')

# Герой → варианты голоса (A–D) и фразы. «+» перед гласной — ударение.
HEROES = [
    {'id': 'zh', 'name': 'Жёлудик', 'about': 'мир Лизы: звонкий, чуть выше и быстрее', 'chosen': 'C', 'variants': [
        {'voice': 'dasha', 'role': 'friendly', 'speed': 1.15, 'pitch': 150},
        {'voice': 'lera', 'role': 'friendly', 'speed': 1.1, 'pitch': 200},
        {'voice': 'masha', 'role': 'friendly', 'speed': 1.15, 'pitch': 120},
        {'voice': 'marina', 'role': 'friendly', 'speed': 1.2, 'pitch': 250},
    ], 'phrases': [
        'Привет! Я Ж+ёлудик. Пойдём считать ор+ешки?',
        'Ой, давай попробуем ещё раз. Посмотри внимательно!',
        'Л+иза, умница!',
        'Л+изонька, получилось!',
        'Попробовала ещё раз — и вышло! Здорово, Л+иза!',
    ]},
    {'id': 'nr', 'name': 'Рассказчик', 'about': 'читает задания Лизе: тёплый, спокойный', 'chosen': 'A', 'variants': [
        {'voice': 'ermil', 'role': 'good', 'speed': 0.95},
        {'voice': 'marina', 'role': 'friendly', 'speed': 0.95},
        {'voice': 'jane', 'role': 'good', 'speed': 0.95},
        {'voice': 'dasha', 'role': 'good', 'speed': 0.95},
    ], 'phrases': [
        'Было семь ор+ешков. Два убрали — они зачёркнуты. Сколько осталось?',
        'Сколько тут гриб+ов? Нажимай по очереди и считай.',
    ]},
    # Детских голосов у SpeechKit нет, а его pitchShift звучит по-стариковски.
    # Поэтому «бурундучий» эффект: запись ускоряется в chip раз (тон и тембр вверх, как быстрая плёнка),
    # а speed < 1 возвращает темп речи к нормальному.
    {'id': 'fu', 'name': 'Фундук', 'about': 'мир Насти: бурундучок-мальчик, бодрый', 'chosen': 'B', 'variants': [
        {'voice': 'anton', 'role': 'good', 'speed': 0.85, 'chip': 1.4},
        {'voice': 'alexander', 'role': 'good', 'speed': 0.85, 'chip': 1.45},
        {'voice': 'zahar', 'role': 'good', 'speed': 0.85, 'chip': 1.5},
        {'voice': 'lera', 'role': 'friendly', 'speed': 0.9, 'chip': 1.25},
    ], 'phrases': [
        'Ура! Ор+ешек наш! Так держать!',
        'Три подряд! Настя, ты в ударе.',
        'Медаль твоя, Настя! Это было настоящее испытание.',
    ]},
    {'id': 'mi', 'name': 'Миндалинка', 'about': 'мир Насти: бурундучок-девочка, мягкая', 'chosen': 'D', 'variants': [
        {'voice': 'dasha', 'role': 'friendly', 'speed': 0.9, 'chip': 1.3},
        {'voice': 'marina', 'role': 'friendly', 'speed': 0.9, 'chip': 1.3},
        {'voice': 'alena', 'role': 'good', 'speed': 0.9, 'chip': 1.3},
        {'voice': 'lera', 'role': 'friendly', 'speed': 0.85, 'chip': 1.4},
    ], 'phrases': [
        'Не беда — смотри, как надо. Разберём по шаг+ам.',
        'Настя, ты не сдалась — и получилось!',
    ]},
]
LETTERS = 'ABCD'


def label(v):
    s = v['voice'] + (f' · {v["role"]}' if v.get('role') else '')
    if v.get('speed'):
        s += f' · скорость {v["speed"]}'
    if v.get('pitch'):
        s += f' · тон +{v["pitch"]}'
    if v.get('chip'):
        s += f' · бурундук ×{v["chip"]}'
    return s


def build():
    shutil.rmtree(OUT, ignore_errors=True)
    os.makedirs(OUT)
    rows = []
    for h in HEROES:
        ch = h.get('chosen')
        head = ''.join(f'<th class="{"pick" if L == ch else ""}">{L}{" ✓" if L == ch else ""}<small>{html.escape(label(v))}</small></th>'
                       for L, v in zip(LETTERS, h['variants']))
        body = ''
        for i, text in enumerate(h['phrases'], 1):
            cells = ''
            for L, v in zip(LETTERS, h['variants']):
                name = f'{h["id"]}-{L}{i}-{sk.key(text, v, "MP3")[:6]}{v.get("chip", "")}.mp3'
                shutil.copyfile(sk.synth(text, v, 'MP3'), os.path.join(OUT, name))
                cells += f'<td class="{"pick" if L == ch else ""}"><button data-src="samples/{name}" aria-label="{h["name"]}, вариант {L}">▶</button></td>'
            body += f'<tr><td class="ph">{html.escape(text.replace("+", ""))}</td>{cells}</tr>'
        done = f' <b class="ok">выбран вариант {ch}</b>' if ch else ' <b class="new">новые варианты</b>'
        rows.append(f'<section><h2>{h["name"]}{done} <span>{h["about"]}</span></h2>'
                     f'<div class="wrap"><table><thead><tr><th class="ph">Фраза</th>{head}</tr></thead>'
                     f'<tbody>{body}</tbody></table></div></section>')
    page = PAGE.replace('{{ROWS}}', '\n'.join(rows))
    with open(os.path.join(HERE, 'samples.html'), 'w', encoding='utf-8') as f:
        f.write(page)


PAGE = '''<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Голоса героев — пробник</title>
<style>
  body { margin: 0; padding: 16px; background: #FFF3DE; color: #4A2814; font: 16px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
  h1 { font-size: 22px; margin: 0 0 6px; }
  .intro { margin: 0 0 18px; max-width: 720px; }
  h2 { font-size: 19px; margin: 22px 0 8px; }
  h2 span { font-size: 14px; font-weight: 500; opacity: .7; }
  .wrap { overflow-x: auto; }
  table { border-collapse: collapse; background: #fff; border-radius: 14px; overflow: hidden; min-width: 520px; }
  th, td { padding: 8px; border-bottom: 1px solid #F1E2C8; text-align: center; vertical-align: middle; }
  th { background: #F7DFB2; font-size: 20px; }
  th small { display: block; font-size: 11px; font-weight: 500; line-height: 1.25; margin-top: 2px; }
  .ph { text-align: left; font-size: 15px; min-width: 180px; }
  th.ph { font-size: 14px; }
  button { width: 52px; height: 44px; border: 0; border-radius: 12px; background: #5E9E4A; color: #fff; font-size: 20px; cursor: pointer;
    box-shadow: 0 3px 0 #3F7432; }
  button.on { background: #F3A23F; box-shadow: 0 3px 0 #B9701F; }
  th.pick, td.pick { background: #E3F2D6; }
  h2 b { font-size: 13px; padding: 2px 8px; border-radius: 8px; vertical-align: middle; }
  h2 b.ok { background: #5E9E4A; color: #fff; }  h2 b.new { background: #F3A23F; color: #fff; }
  .note { margin-top: 22px; font-size: 14px; opacity: .8; max-width: 720px; }
</style></head><body>
<h1>🌰 Голоса героев — выберите лучший вариант</h1>
<p class="intro">Голоса выбраны — они в зелёном столбце. Остальные варианты оставлены для сравнения.</p>
{{ROWS}}
<p class="note">Голоса Yandex SpeechKit. Это пробник: в игре пока звучит голос браузера.</p>
<script>
  var a = new Audio(), cur = null;
  a.onended = function () { if (cur) cur.classList.remove('on'); cur = null; };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-src]'); if (!b) return;
    if (cur) cur.classList.remove('on');
    if (cur === b && !a.paused) { a.pause(); cur = null; return; }
    cur = b; b.classList.add('on'); a.src = b.dataset.src; a.play();
  });
</script>
</body></html>
'''


def upload():
    yc = sk.find_yc()
    files = [('samples.html', os.path.join(HERE, 'samples.html'), 'text/html; charset=utf-8')]
    files += [(f'samples/{n}', os.path.join(OUT, n), 'audio/mpeg') for n in sorted(os.listdir(OUT))]
    for key, path, ctype in files:
        r = subprocess.run([yc, 'storage', 's3', 'cp', path, f's3://oreh-patrol/dev-voice/{key}', '--content-type', ctype,
                            '--cache-control', 'no-cache', '--no-guess-mime-type', '--only-show-errors'],
                           capture_output=True, text=True)
        if r.returncode:
            raise SystemExit(f'Не выложился {key}: {r.stderr}')
    print(f'Выложено файлов: {len(files)} → https://oreh-patrol.website.yandexcloud.net/dev-voice/samples.html')


if __name__ == '__main__':
    build()
    print(f'Запросов к SpeechKit: {sk.stats["requests"]} (≈{sk.cost(sk.stats["requests"])} ₽), из кэша: {sk.stats["cached"]}')
    if '--upload' in sys.argv:
        upload()
