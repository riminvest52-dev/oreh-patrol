"""Синтез речи Yandex SpeechKit API v3 с кэшем по хэшу «текст + голос».

Доступ: IAM-токен берётся при запуске командой `yc iam create-token` (yc авторизован через `yc init`
под аккаунтом заказчика). Токен живёт ~12 часов и нигде не сохраняется. Статических ключей нет.

Оплата API v3: за запрос (фраза до 250 символов = 1 единица). Уже озвученные фразы берутся из кэша
и повторно не оплачиваются.
"""
import base64
import hashlib
import json
import os
import shutil
import subprocess
import threading
import time
import urllib.error
import urllib.request

FOLDER_ID = 'b1gl9n17l478q72haebv'          # каталог default в облаке заказчика (не секрет)
URL = 'https://tts.api.cloud.yandex.net/tts/v3/utteranceSynthesis'
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
EXT = {'MP3': 'mp3', 'OGG_OPUS': 'ogg', 'WAV': 'wav'}

_token = None
stats = {'requests': 0, 'cached': 0, 'chars': 0}


def find_yc():
    yc = shutil.which('yc')
    if yc:
        return yc
    home = os.path.join(os.path.expanduser('~'), 'yandex-cloud', 'bin', 'yc.exe' if os.name == 'nt' else 'yc')
    if os.path.exists(home):
        return home
    raise SystemExit('Не найден yc. Установите Yandex Cloud CLI и выполните `yc init`.')


def token():
    global _token
    if not _token:
        r = subprocess.run([find_yc(), 'iam', 'create-token'], capture_output=True, text=True)
        _token = r.stdout.strip()
        if r.returncode or not _token:
            raise SystemExit('Не получилось получить IAM-токен: выполните `yc init`.\n' + r.stderr)
    return _token


def hints_of(voice):
    """voice: {'voice': 'dasha', 'role': 'friendly', 'speed': 1.1, 'pitch': 100}"""
    h = [{'voice': voice['voice']}]
    if voice.get('role'):
        h.append({'role': voice['role']})
    if voice.get('speed'):
        h.append({'speed': voice['speed']})
    if voice.get('pitch'):
        h.append({'pitchShift': voice['pitch']})
    return h


def key(text, voice, fmt):
    raw = json.dumps({'t': text, 'v': hints_of(voice), 'f': fmt}, ensure_ascii=False, sort_keys=True)
    return hashlib.sha1(raw.encode('utf-8')).hexdigest()[:16]


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        exe = shutil.which('ffmpeg')
        if exe:
            return exe
        raise SystemExit('Нужен ffmpeg: pip install imageio-ffmpeg')


ENC = {'MP3': ['-c:a', 'libmp3lame', '-b:a', '64k'], 'OGG_OPUS': ['-c:a', 'libopus', '-b:a', '32k'], 'WAV': []}


def chipmunk(text, voice, fmt):
    """Детский «бурундучий» голос: ускоряем запись в `chip` раз — тон и тембр поднимаются вместе,
    как на быстро прокрученной плёнке. Встроенный pitchShift SpeechKit звучит по-стариковски."""
    path = os.path.join(CACHE, f'{key(text, voice, fmt)}-{voice["chip"]}.{EXT[fmt]}')
    if os.path.exists(path) and os.path.getsize(path) > 0:
        stats['cached'] += 1
        return path
    base = {k: v for k, v in voice.items() if k != 'chip'}
    wav = synth(text, base, 'WAV')
    import wave
    with wave.open(wav) as w:
        rate = w.getframerate()
    af = f'asetrate={int(rate * voice["chip"])},aresample=48000'
    r = subprocess.run([ffmpeg(), '-y', '-loglevel', 'error', '-i', wav, '-af', af, '-ac', '1', *ENC[fmt], path],
                       capture_output=True, text=True)
    if r.returncode:
        raise RuntimeError('ffmpeg: ' + r.stderr)
    return path


def synth(text, voice, fmt='OGG_OPUS'):
    """Возвращает путь к файлу в кэше. Повторный вызов с тем же текстом и голосом бесплатен."""
    os.makedirs(CACHE, exist_ok=True)
    if voice.get('chip'):
        return chipmunk(text, voice, fmt)
    path = os.path.join(CACHE, f'{key(text, voice, fmt)}.{EXT[fmt]}')
    if os.path.exists(path) and os.path.getsize(path) > 0:
        stats['cached'] += 1
        return path
    audio = request(text, voice, {'containerAudio': {'containerAudioType': fmt}})
    with open(path, 'wb') as f:
        f.write(audio)
    stats['requests'] += 1
    stats['chars'] += len(text)
    return path


def request(text, voice, spec):
    """Один платный запрос к SpeechKit v3 → байты звука."""
    body = {'text': text, 'hints': hints_of(voice), 'loudnessNormalizationType': 'LUFS', 'outputAudioSpec': spec}
    for attempt in range(8):   # сеть через прокси иногда рвётся — повторяем с нарастающей паузой
        req = urllib.request.Request(URL, data=json.dumps(body).encode('utf-8'), headers={
            'Authorization': 'Bearer ' + token(), 'x-folder-id': FOLDER_ID, 'Content-Type': 'application/json'})
        try:
            raw = urllib.request.urlopen(req, timeout=90).read().decode('utf-8')
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode('utf-8', 'replace')[:500]
            if e.code in (429, 500, 502, 503, 504) and attempt < 7:
                time.sleep(3 * (attempt + 1)); continue
            raise RuntimeError(f'SpeechKit {e.code}: {msg}\nТекст: {text}')
        except (urllib.error.URLError, OSError):
            if attempt < 7:
                time.sleep(3 * (attempt + 1)); continue
            raise
    audio = b''
    for line in raw.splitlines():
        if not line.strip():
            continue
        j = json.loads(line)
        if 'error' in j:
            raise RuntimeError(f'SpeechKit: {j["error"]}\nТекст: {text}')
        r = j.get('result', j)
        if 'audioChunk' in r:
            audio += base64.b64decode(r['audioChunk']['data'])
    if not audio:
        raise RuntimeError('SpeechKit вернул пустой звук: ' + text)
    return audio


PCM_RATE = 24000
_lock = threading.Lock()


def master_path(text, voice):
    base = {k: v for k, v in voice.items() if k != 'chip'}
    return os.path.join(CACHE, 'pcm', f'{key(text, base, "PCM24")}.pcm'), base


def has_master(text, voice):
    p, _ = master_path(text, voice)
    return os.path.exists(p) and os.path.getsize(p) > 0


def master(text, voice):
    """Исходная запись фразы: 16 бит, 24 кГц, моно, без эффектов. Кэш по хэшу «текст + голос» — повтор бесплатен."""
    path, base = master_path(text, voice)
    if has_master(text, voice):
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    audio = request(text, base, {'rawAudio': {'audioEncoding': 'LINEAR16_PCM', 'sampleRateHertz': PCM_RATE}})
    with open(path + '.tmp', 'wb') as f:
        f.write(audio)
    os.replace(path + '.tmp', path)
    with _lock:
        stats['requests'] += 1
        stats['chars'] += len(text)
    return path


PRICE_PER_REQUEST = 0.1626   # ₽ с НДС за запрос API v3 до 250 символов (прайс SpeechKit, ноябрь 2026)


def cost(n_requests):
    return round(n_requests * PRICE_PER_REQUEST, 2)
