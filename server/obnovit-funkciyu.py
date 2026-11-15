#!/usr/bin/env python3
"""Обновить код облачной функции oreh-cloud из server/index.py — и больше ничего.

    python server/obnovit-funkciyu.py

Под входом заказчика в yc. Аккаунты, бакеты и права не создаёт и не меняет:
берёт уже настроенный сервисный аккаунт oreh-cloud-fn и выкладывает новую версию кода функции.
"""
import os
import shutil
import sys
import tempfile
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import setup_cloud as sc  # noqa: E402  — тот же вызов yc с повторами


def main():
    sa = sc.yc('iam', 'service-account', 'get', '--name', sc.SA_NAME)
    fn = sc.yc('serverless', 'function', 'get', '--name', sc.FN)
    tmp = tempfile.mkdtemp()
    try:
        z = os.path.join(tmp, 'fn.zip')
        with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
            f.write(os.path.join(sc.HERE, 'index.py'), 'index.py')
        v = sc.yc('serverless', 'function', 'version', 'create', '--function-name', sc.FN, '--runtime', 'python312',
                  '--entrypoint', 'index.handler', '--memory', '128m', '--execution-timeout', '10s',
                  '--service-account-id', sa['id'], '--environment', f'BUCKET={sc.BUCKET}', '--source-path', z)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print('Готово: новая версия функции', (v or {}).get('id', ''), '→ https://functions.yandexcloud.net/' + fn['id'])


if __name__ == '__main__':
    main()
