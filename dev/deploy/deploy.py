"""Выкладка игры в Yandex Object Storage (бакет с хостингом сайта).

Запуск из корня репозитория:  python dev/deploy/deploy.py           — выложить
                              python dev/deploy/deploy.py --dry-run — только показать, что уйдёт

Нужен Yandex Cloud CLI (yc), один раз авторизованный командой `yc init`.
Ключей и секретов здесь нет и быть не должно: yc берёт доступ из своего профиля на этом компьютере.
После каждой правки игру выкладываем и сюда, и на GitHub (git push).
"""
import os
import shutil
import subprocess
import sys

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
LAST = ['sw.js', 'index.html']              # в самом конце: новая версия «включается», когда все файлы уже на месте
SKIP_DIRS = {'dev', '.git', '.github', '.claude', 'node_modules', '_old'}
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


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    dry = '--dry-run' in sys.argv
    yc = None if dry else find_yc()
    files = collect(root)
    print(f'Бакет {BUCKET}: файлов {len(files)}{" (проверка, без выкладки)" if dry else ""}')
    for key, path, ctype in files:
        cache = 'no-cache' if key in NO_CACHE else 'max-age=3600'
        print(f'  {key:32} {ctype:40} {cache}')
        if dry:
            continue
        cmd = [yc, 'storage', 's3', 'cp', path, f's3://{BUCKET}/{key}', '--content-type', ctype,
               '--cache-control', cache, '--no-guess-mime-type', '--only-show-errors']
        r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
        if r.returncode:
            sys.exit(f'Ошибка при выкладке {key}:\n{r.stderr or r.stdout}')
    print('Готово:' if not dry else 'Адрес:', SITE)


if __name__ == '__main__':
    main()
