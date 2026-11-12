"""Выкладка игры в Yandex Object Storage (бакет с хостингом сайта).

Запуск из корня репозитория:  python dev/deploy/deploy.py           — выложить
                              python dev/deploy/deploy.py --dry-run — только показать, что уйдёт
                              python dev/deploy/deploy.py --preview — пробная версия нового раздела в /preview/
                                (игра у детей не меняется; голоса — в общую папку voice/, они вечные и не мешают)

Нужен Yandex Cloud CLI (yc), один раз авторизованный командой `yc init`.
Ключей и секретов здесь нет и быть не должно: yc берёт доступ из своего профиля на этом компьютере.
После каждой правки игру выкладываем и сюда, и на GitHub (git push).
"""
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request

BUCKET = 'oreh-patrol'
SITE = 'https://oreh-patrol.website.yandexcloud.net/'

TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.opus': 'audio/ogg',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
}
NO_CACHE = {'index.html', 'sw.js'}          # браузер всегда сверяется с сервером
LAST = ['index.html', 'sw.js']              # в самом конце; sw.js последним: новая версия «включается», когда все файлы уже на месте
SKIP_DIRS = {'dev', '.git', '.github', '.claude', 'node_modules', '_old', 'voice'}   # voice/ — отдельно, см. upload_voice
VOICE_CACHE = 'public, max-age=31536000, immutable'   # имя папки голоса меняется при любой перезаписи — файлы вечные
SKIP_FILES = {'README.md', '.gitignore', '.gitattributes', '.nojekyll'}


def find_yc():
    yc = shutil.which('yc')
    if yc:
        return yc
    home = os.path.join(os.path.expanduser('~'), 'yandex-cloud', 'bin', 'yc.exe' if os.name == 'nt' else 'yc')
    if os.path.exists(home):
        return home
    sys.exit('Не найден yc. Установите Yandex Cloud CLI и выполните `yc init`.')


def collect(root):
    out = []
    for d, dirs, files in os.walk(root):
        dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS and not x.startswith('.'))
        for f in sorted(files):
            if f in SKIP_FILES or f.startswith('.'):
                continue
            path = os.path.join(d, f)
            key = os.path.relpath(path, root).replace(os.sep, '/')
            ext = os.path.splitext(f)[1].lower()
            if ext not in TYPES:
                print(f'  пропускаю (неизвестный тип): {key}')
                continue
            out.append((key, path, TYPES[ext]))
    out.sort(key=lambda x: (x[0] in LAST, LAST.index(x[0]) if x[0] in LAST else 0, x[0]))
    return out


def upload_voice_dir(base, d, yc, only=('ogg', 'mp3')):
    """Каждый тип — из своей временной папки: --exclude в `yc storage s3 cp` не срабатывает,
    и второй проход перезаписывал бы тип у всех файлов."""
    for ext in only:
        ctype = TYPES['.' + ext]
        with tempfile.TemporaryDirectory() as tmp:
            for f in os.listdir(os.path.join(base, d)):
                if f.endswith('.' + ext):
                    shutil.copy2(os.path.join(base, d, f), tmp)
            cmd = [yc, 'storage', 's3', 'cp', tmp, f's3://{BUCKET}/voice/{d}/', '--recursive',
                   '--content-type', ctype, '--cache-control', VOICE_CACHE, '--no-guess-mime-type', '--only-show-errors']
            r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
            if r.returncode:
                sys.exit(f'Ошибка при выкладке voice/{d} ({ext}): {r.stderr or r.stdout}')


def upload_voice(root, yc, dry):
    """Голоса: тысячи файлов, поэтому папка целиком одной командой и только если её ещё нет в бакете.
    Готовность папки отмечает файл done.json, он выкладывается последним."""
    base = os.path.join(root, 'voice')
    if not os.path.isdir(base):
        return
    for d in sorted(os.listdir(base)):
        n = len(os.listdir(os.path.join(base, d)))
        try:
            urllib.request.urlopen(f'{SITE}voice/{d}/done.json', timeout=15).read()
            print(f'  voice/{d}: уже в бакете ({n} файлов)')
            continue
        except Exception:
            pass
        print(f'  voice/{d}: выкладываю {n} файлов')
        if dry:
            continue
        upload_voice_dir(base, d, yc)
        done = os.path.join(root, 'dev', 'deploy', '.done.json')
        with open(done, 'w') as f:
            f.write('{"files": %d}' % n)
        r = subprocess.run([yc, 'storage', 's3', 'cp', done, f's3://{BUCKET}/voice/{d}/done.json', '--content-type', 'application/json',
                            '--cache-control', 'no-cache', '--no-guess-mime-type', '--only-show-errors'], capture_output=True, text=True)
        os.remove(done)
        if r.returncode:
            sys.exit('Ошибка при выкладке done.json: ' + r.stderr)


PREVIEW_HEAD = ('<head>\n<script>var VOICE_BASE = "../", OREH_PREVIEW = true;</script>\n'
                '<style>body::after{content:"ПРОБНАЯ ВЕРСИЯ";position:fixed;bottom:6px;left:50%;transform:translateX(-50%);'
                'background:#C0392B;color:#fff;font:700 12px system-ui,sans-serif;padding:3px 10px;border-radius:10px;z-index:9999;pointer-events:none}</style>')


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    dry = '--dry-run' in sys.argv
    preview = '--preview' in sys.argv
    yc = None if dry else find_yc()
    files = collect(root)
    if preview:   # без sw.js: пробная версия не ставит офлайн и не трогает кэш игры
        tmp = tempfile.mkdtemp()
        idx = os.path.join(tmp, 'index.html')
        with open(os.path.join(root, 'index.html'), encoding='utf-8') as f:
            html = f.read()
        assert '<head>' in html
        with open(idx, 'w', encoding='utf-8', newline='') as f:
            f.write(html.replace('<head>', PREVIEW_HEAD, 1))
        files = [('preview/' + k, idx if k == 'index.html' else p, t) for k, p, t in files if k != 'sw.js']
    print(f'Бакет {BUCKET}: голоса')
    upload_voice(root, yc, dry)
    print(f'Бакет {BUCKET}: файлов {len(files)}{" (проверка, без выкладки)" if dry else ""}')
    for key, path, ctype in files:
        cache = 'no-cache' if key in NO_CACHE or key.startswith('preview/') else 'max-age=3600'
        print(f'  {key:32} {ctype:40} {cache}')
        if dry:
            continue
        cmd = [yc, 'storage', 's3', 'cp', path, f's3://{BUCKET}/{key}', '--content-type', ctype,
               '--cache-control', cache, '--no-guess-mime-type', '--only-show-errors']
        r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if r.returncode:
            sys.exit(f'Ошибка при выкладке {key}:\n{r.stderr or r.stdout}')
    print('Готово:' if not dry else 'Адрес:', SITE + ('preview/' if preview else ''))


if __name__ == '__main__':
    main()
