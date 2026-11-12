"""Озвучка игры одной командой: собрать фразы → озвучить новые → записать voice/ и js/voice-data.js.

    python dev/voice/gen.py              # показать, сколько новых фраз и сколько это стоит (ничего не тратит)
    python dev/voice/gen.py --yes        # озвучить (уже озвученное берётся из кэша dev/voice/cache бесплатно)
    python dev/voice/gen.py --check 60   # проверить N случайных фраз распознаванием SpeechKit

Нужно: локальный сервер игры на http://localhost:8765 (из него headless Chrome читает dev/voice/phrases.html),
yc под входом заказчика (`yc init`), ffmpeg (`pip install imageio-ffmpeg`).
Фраза ищется в игре по хэшу текста (js/voice.js → voiceHash), файл озвучивается по тексту с ударениями и словами-числами.
"""
import concurrent.futures as cf
import hashlib
import html
import json
import os
import random
import re
import shutil
import subprocess
import sys
import threading
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import speechkit as sk  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'voice')
DATA_JS = os.path.join(ROOT, 'js', 'voice-data.js')
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
SERVER = 'http://localhost:8765'
LIMIT_RUB = 500

# Голоса выбраны заказчиком по пробнику dev-voice/samples.html (12.11.2026)
VOICES = {
    'zh': {'voice': 'masha', 'role': 'friendly', 'speed': 1.15, 'pitch': 120},      # Жёлудик — вариант C
    'nr': {'voice': 'ermil', 'role': 'good', 'speed': 0.95},                         # Рассказчик — вариант A
    'fu': {'voice': 'alexander', 'role': 'good', 'speed': 0.85, 'chip': 1.45},      # Фундук — вариант B (бурундучий)
    'mi': {'voice': 'lera', 'role': 'friendly', 'speed': 0.85, 'chip': 1.4},        # Миндалинка — вариант D (бурундучий)
    'ez': {'voice': 'kirill', 'role': 'good', 'speed': 0.9},                         # Дедушка Ёж — не выбирали, тёплый мужской
}

# ---------- Числа словами в нужном падеже и роде ----------
NOM = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать',
       'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать', 'двадцать']
GEN = ['нуля', 'одного', 'двух', 'трёх', 'четырёх'] + [w[:-1] + 'и' for w in NOM[5:]]
INS = ['нулём', 'одним', 'двумя', 'тремя', 'четырьмя'] + [w[:-1] + 'ью' for w in NOM[5:]]
GEN[8], INS[8] = 'восьми', 'восемью'
FEM = re.compile(r'^(божь|коровк|рыбк|звёздочк|клубничк|бабочк|лягушк|пчёлк|точк)', re.I)
NEUT = re.compile(r'^яблок', re.I)


def num_word(n, case, nxt):
    if n > 20:
        return str(n)
    if case == 'gen':
        return GEN[n]
    if case == 'ins':
        return INS[n]
    if n == 1 and FEM.match(nxt):
        return 'одну' if nxt.lower().endswith('у') else 'одна'
    if n == 1 and NEUT.match(nxt):
        return 'одно'
    if n == 2 and FEM.match(nxt):
        return 'две'
    return NOM[n]


def numbers(s):
    toks = re.split(r'(\d+)', s)
    out = []
    for i, t in enumerate(toks):
        if i % 2 == 0:
            out.append(t)
            continue
        before = ''.join(toks[:i])
        after = toks[i + 1] if i + 1 < len(toks) else ''
        nxt = (re.match(r'\s*([а-яё]+)', after, re.I) or [None, ''])[1]
        prev = (re.search(r'([а-яё]+)\W*$', before, re.I) or [None, ''])[1].lower()
        case = 'nom'
        if prev in ('между', 'перед') or (prev == 'и' and re.search(r'между \d+ и\s*$', before, re.I)):
            case = 'ins'
        elif prev in ('до', 'от', 'с', 'из', 'после') or (prev in ('больше', 'меньше') and re.search(r'\d+ (больше|меньше)\s*$', before)):
            case = 'gen'
        out.append(num_word(int(t), case, nxt))
    return ''.join(out)


# ---------- Ударения («+» перед ударной гласной) ----------
STRESS = {
    'орешки': 'ор+ешки', 'орешек': 'ор+ешек', 'орешков': 'ор+ешков', 'орешка': 'ор+ешка',
    'грибов': 'гриб+ов', 'гриба': 'гриб+а', 'жёлудик': 'ж+ёлудик', 'звёздочка': 'зв+ёздочка', 'звёздочки': 'зв+ёздочки',
    'звёздочку': 'зв+ёздочку', 'звёздочек': 'зв+ёздочек', 'лизонька': 'л+изонька', 'настенька': 'н+астенька',
    'пальчики': 'п+альчики', 'кружочке': 'круж+очке', 'шагам': 'шаг+ам', 'загибай': 'загиб+ай', 'поровну': 'п+оровну',
    'равно': 'равн+о', 'лишнее': 'л+ишнее', 'лишнюю': 'л+ишнюю', 'ленточку': 'л+енточку', 'башню': 'б+ашню', 'узор': 'уз+ор',
    'стоит': 'сто+ит', 'домике': 'д+омике', 'корзинку': 'корз+инку', 'корзинке': 'корз+инке', 'считай': 'счит+ай',
    'посчитай': 'посчит+ай', 'верно': 'в+ерно', 'сдалась': 'сдал+ась', 'разобралась': 'разобрал+ась', 'патруль': 'патр+уль',
    'слева': 'сл+ева', 'справа': 'спр+ава', 'нажимай': 'нажим+ай', 'одинаково': 'один+аково', 'одинаковые': 'один+аковые',
    'зачёркнуты': 'зач+ёркнуты', 'зачёркнуто': 'зач+ёркнуто', 'клубнички': 'клубн+ички', 'клубничку': 'клубн+ичку',
    'клубничек': 'клубн+ичек', 'пчёлок': 'пч+ёлок', 'пчёлку': 'пч+ёлку', 'лягушек': 'лягуш+ек', 'бабочек': 'б+абочек',
    'коровок': 'кор+овок', 'пятиклассники': 'пятикл+ассники', 'браво': 'бр+аво', 'испытание': 'испыт+ание',
    # Тропинка к дубу
    'выпало': 'в+ыпало', 'волчок': 'волч+ок', 'сорока': 'сор+ока', 'сороки': 'сор+оки', 'сорокой': 'сор+окой',
    'дуба': 'д+уба', 'шагай': 'шаг+ай', 'клетку': 'кл+етку', 'клетки': 'кл+етки', 'клетке': 'кл+етке', 'первой': 'п+ервой',
}
STRESS_RE = re.compile(r'(?<![а-яё+])(' + '|'.join(sorted(STRESS, key=len, reverse=True)) + r')(?![а-яё])', re.I)


def stress(s):
    def rep(m):
        w = m.group(1)
        r = STRESS[w.lower()]
        return r[0].upper() + r[1:] if w[0].isupper() else r
    return STRESS_RE.sub(rep, s)


def tts_text(s):
    s = s.replace('−', ' минус ').replace('=', ' равно ').replace('+', ' плюс ').replace('«', '').replace('»', '')
    s = re.sub(r'\s+', ' ', numbers(s)).strip()
    return stress(s)


# ---------- Фразы из игры ----------
def load_phrases():
    try:
        urllib.request.urlopen(SERVER + '/dev/voice/phrases.html', timeout=5).read(100)
    except Exception:
        raise SystemExit(f'Не отвечает {SERVER}: запустите сервер игры (python -m http.server 8765 в папке oreh-patrol).')
    r = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--dump-dom', SERVER + '/dev/voice/phrases.html?runs=20000'],
                       capture_output=True, text=True, encoding='utf-8', timeout=600)
    m = re.search(r'<pre id="out">(.*?)</pre>', r.stdout, re.S)
    if not m:
        raise SystemExit('Не удалось прочитать phrases.html')
    d = json.loads(html.unescape(m.group(1)))
    if d['errs']:
        raise SystemExit('Совпали хэши разных фраз: ' + '; '.join(d['errs'][:5]))
    return d['items']


def rev_of(who, items):
    raw = json.dumps([VOICES[who], sorted((i['h'], tts_text(i['text'])) for i in items if i['who'] == who)], ensure_ascii=False)
    return who + '-' + hashlib.sha1(raw.encode('utf-8')).hexdigest()[:6]


def encode(src_pcm, voice, out, fmt):
    af = ['-af', f'asetrate={int(sk.PCM_RATE * voice["chip"])},aresample=48000'] if voice.get('chip') else ['-ar', '48000']
    enc = ['-c:a', 'libopus', '-b:a', '28k', '-application', 'voip'] if fmt == 'ogg' else ['-c:a', 'libmp3lame', '-b:a', '48k']
    r = subprocess.run([sk.ffmpeg(), '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(sk.PCM_RATE), '-ac', '1', '-i', src_pcm,
                        *af, '-ac', '1', *enc, out], capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError('ffmpeg: ' + r.stderr)


def build(items, go):
    todo = [i for i in items if not sk.has_master(tts_text(i['text']), VOICES[i['who']])]
    new_cost = sk.cost(len(todo))
    print(f'Фраз всего: {len(items)}, новых для озвучки: {len(todo)} ≈ {new_cost} ₽ (по {sk.PRICE_PER_REQUEST} ₽ за фразу)')
    if not go:
        print('Это только подсчёт. Чтобы озвучить: python dev/voice/gen.py --yes')
        return
    if new_cost > LIMIT_RUB and '--over-limit' not in sys.argv:
        raise SystemExit(f'Больше {LIMIT_RUB} ₽ — сначала согласуйте с заказчиком, потом запустите с --over-limit.')
    sk.token()
    done, lock = [0], threading.Lock()

    failed = []

    def one(i):
        try:
            sk.master(tts_text(i['text']), VOICES[i['who']])
        except Exception as e:
            with lock:
                failed.append(f'{i["text"]}: {str(e)[:120]}')
            return
        with lock:
            done[0] += 1
            if done[0] % 100 == 0:
                print(f'  озвучено {done[0]} из {len(todo)}', flush=True)
    with cf.ThreadPoolExecutor(6) as ex:
        list(ex.map(one, todo))
    if failed:
        print(f'Не озвучено {len(failed)} (сеть). Запустите ещё раз — продолжит с места:\n  ' + '\n  '.join(failed[:5]))
        raise SystemExit(1)

    dirs = {w: rev_of(w, items) for w in VOICES}
    if os.path.isdir(OUT):
        for d in os.listdir(OUT):
            if d not in dirs.values():
                shutil.rmtree(os.path.join(OUT, d))
    jobs = []
    for i in items:
        v = VOICES[i['who']]
        pcm = sk.master(tts_text(i['text']), v)
        for fmt in ('ogg', 'mp3'):
            out = os.path.join(OUT, dirs[i['who']], f'{i["h"]}.{fmt}')
            if not os.path.exists(out):
                jobs.append((pcm, v, out, fmt))
    for w in dirs.values():
        os.makedirs(os.path.join(OUT, w), exist_ok=True)
    with cf.ThreadPoolExecutor(os.cpu_count() or 4) as ex:
        list(ex.map(lambda j: encode(*j), jobs))
    print(f'Файлов собрано: {len(jobs)}')

    has = {w: ' '.join(sorted(i['h'] for i in items if i['who'] == w)) for w in VOICES}
    topics = {}
    for i in items:
        for t in i['topics']:
            topics.setdefault(t, []).append(i['who'] + '/' + i['h'])
    data = {'dirs': dirs, 'has': has, 'topics': {t: ' '.join(v) for t, v in sorted(topics.items())}}
    with open(DATA_JS, 'w', encoding='utf-8') as f:
        f.write('/* Создано dev/voice/gen.py — не править руками. Какие фразы записаны голосами героев. */\n')
        f.write('const VOICE_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(os.path.join(HERE, 'phrases.json'), 'w', encoding='utf-8') as f:
        json.dump([dict(i, tts=tts_text(i['text']), file=f'{dirs[i["who"]]}/{i["h"]}') for i in items], f, ensure_ascii=False, indent=0)
    size = sum(os.path.getsize(os.path.join(r, n)) for r, _, fs in os.walk(OUT) for n in fs)
    print(f'Готово: voice/ ({size // 1024 // 1024} МБ), js/voice-data.js. Потрачено сейчас ≈ {sk.cost(sk.stats["requests"])} ₽')


# ---------- Проверка распознаванием ----------
WORDNUM = {}
for n in range(21):
    for w in {NOM[n], GEN[n], INS[n]}:
        WORDNUM[w] = str(n)
WORDNUM.update({'одна': '1', 'одно': '1', 'одну': '1', 'две': '2'})


def norm(s):
    s = s.lower().replace('ё', 'е').replace('−', ' минус ').replace('+', ' ')
    words = re.findall(r'[а-яa-z0-9]+', s)
    return [WORDNUM.get(w.replace('е', 'ё'), WORDNUM.get(w, w)) for w in words]


def check(items, n, topic=None):
    random.seed(7)
    dirs = {w: rev_of(w, items) for w in VOICES}
    if topic:   # --topic k_path: только фразы одного раздела
        items = [i for i in items if topic in i.get('topics', [])]
    named = [i for i in items if i['who'] in ('fu', 'mi', 'ez') or re.search('Лиз|Наст', i['text'])]
    rest = [i for i in items if i not in named]
    k = min(15, len(named), n)
    sample = random.sample(named, k) + random.sample(rest, min(n - k, len(rest)))
    bad = 0
    for i in sample:
        path = os.path.join(OUT, dirs[i['who']], i['h'] + '.ogg')
        req = urllib.request.Request(f'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?lang=ru-RU&format=oggopus&folderId={sk.FOLDER_ID}',
                                     data=open(path, 'rb').read(), headers={'Authorization': 'Bearer ' + sk.token()})
        got = json.loads(urllib.request.urlopen(req, timeout=60).read()).get('result', '')
        ok = norm(got) == norm(i['text'])
        bad += not ok
        print(('  ок   ' if ok else '  НЕТ  ') + f'[{i["who"]}] {i["text"]}' + ('' if ok else f'\n         услышано: {got}\n         озвучено: {tts_text(i["text"])}'))
    print(f'Проверено {len(sample)}, расхождений: {bad}. Стоимость распознавания ≈ {sk.cost(len(sample))} ₽')


if __name__ == '__main__':
    items = load_phrases()
    if '--check' in sys.argv:
        check(items, int(sys.argv[sys.argv.index('--check') + 1]), sys.argv[sys.argv.index('--topic') + 1] if '--topic' in sys.argv else None)
    else:
        build(items, '--yes' in sys.argv)
