#!/usr/bin/env python3
"""Настройка облака семьи в Yandex Cloud. Запускает заказчик на своём компьютере, под своим входом в yc.

    python server/setup_cloud.py

Что делает (повторный запуск безопасен: уже созданное не трогает, функцию обновляет):
  1. сервисный аккаунт oreh-cloud-fn — без ролей в каталоге;
  2. закрытый бакет oreh-patrol-data (не сайт, без публичного доступа);
  3. доступ к этому бакету — только аккаунту oreh-cloud-fn (права на чтение и запись объектов);
  4. правила хранения: дневные копии (bak/) — 31 день, счётчики неверных кодов (rl/) — 2 дня;
  5. облачная функция oreh-cloud из server/index.py, работает от аккаунта oreh-cloud-fn;
  6. функцию можно вызывать из браузера без входа (так работает игра);
  7. печатает адрес функции и сохраняет его в server/function-url.txt.
Ключей и паролей скрипт не создаёт и никуда не записывает.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile

FOLDER = 'b1gl9n17l478q72haebv'
SA_NAME, BUCKET, FN = 'oreh-cloud-fn', 'oreh-patrol-data', 'oreh-cloud'
HERE = os.path.dirname(os.path.abspath(__file__))


def find_yc():
    yc = shutil.which('yc')
    if yc:
        return yc
    home = os.path.join(os.path.expanduser('~'), 'yandex-cloud', 'bin', 'yc.exe' if os.name == 'nt' else 'yc')
    if os.path.exists(home):
        return home
    sys.exit('Не найден yc. Установите Yandex Cloud CLI и выполните `yc init`.')


YC = find_yc()


def yc(*args, ok_missing=False):
    """Команда yc с повторами: сеть Яндекса иногда отвечает DeadlineExceeded."""
    cmd = [YC, *args, '--folder-id', FOLDER, '--format', 'json']
    for attempt in range(6):
        r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        if r.returncode == 0:
            return json.loads(r.stdout) if r.stdout.strip() else {}
        err = r.stderr
        if ok_missing and ('NotFound' in err or 'not found' in err.lower() or 'NoSuchBucket' in err):
            return None
        if 'DeadlineExceeded' in err or 'Unavailable' in err:
            print('  сеть не ответила, повторяю…')
            time.sleep(10)
            continue
        sys.exit('Ошибка yc ' + ' '.join(args[:3]) + ':\n' + err)
    sys.exit('Сеть Яндекса не отвечает. Запустите скрипт ещё раз чуть позже.')


def main():
    print('1. Сервисный аккаунт', SA_NAME)
    sa = yc('iam', 'service-account', 'get', '--name', SA_NAME, ok_missing=True) or \
        yc('iam', 'service-account', 'create', '--name', SA_NAME, '--description', 'Облачная функция Орехового патруля: только бакет oreh-patrol-data')
    sa_id = sa['id']

    print('2. Закрытый бакет', BUCKET)
    if not yc('storage', 'bucket', 'get', '--name', BUCKET, ok_missing=True):
        yc('storage', 'bucket', 'create', '--name', BUCKET, '--default-storage-class', 'standard', '--max-size', str(1024 ** 3))

    print('3. Доступ к бакету — только аккаунту функции')
    yc('storage', 'bucket', 'update', '--name', BUCKET,
       '--grants', f'grant-type=grant-type-account,grantee-id={sa_id},permission=permission-full-control')

    print('4. Сколько хранить копии')
    rules = {'lifecycleRules': [
        {'id': 'backups-31d', 'enabled': True, 'filter': {'prefix': 'bak/'}, 'expiration': {'days': '31'}},
        {'id': 'ratelimit-2d', 'enabled': True, 'filter': {'prefix': 'rl/'}, 'expiration': {'days': '2'}}]}
    yc('storage', 'bucket', 'update', '--name', BUCKET, '--lifecycle-rules', json.dumps(rules))

    print('5. Облачная функция', FN)
    fn = yc('serverless', 'function', 'get', '--name', FN, ok_missing=True) or \
        yc('serverless', 'function', 'create', '--name', FN, '--description', 'Семейный кабинет Орехового патруля')
    tmp = tempfile.mkdtemp()
    try:
        z = os.path.join(tmp, 'fn.zip')
        with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
            f.write(os.path.join(HERE, 'index.py'), 'index.py')
        yc('serverless', 'function', 'version', 'create', '--function-name', FN, '--runtime', 'python312',
           '--entrypoint', 'index.handler', '--memory', '128m', '--execution-timeout', '10s',
           '--service-account-id', sa_id, '--environment', f'BUCKET={BUCKET}', '--source-path', z)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print('6. Вызов из браузера без входа')
    yc('serverless', 'function', 'allow-unauthenticated-invoke', '--name', FN)

    url = 'https://functions.yandexcloud.net/' + fn['id']
    with open(os.path.join(HERE, 'function-url.txt'), 'w', encoding='utf-8') as f:
        f.write(url + '\n')
    print('\nГотово. Адрес функции:', url)


if __name__ == '__main__':
    main()
