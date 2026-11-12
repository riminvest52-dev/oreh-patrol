#!/usr/bin/env python3
"""Облако на компьютере — для проверки синхронизации. Та же логика, что в облачной функции (server/index.py),
только документы лежат в папке dev/kv_data (в git не попадает).

Запуск: python dev/kv_server.py
В консоли браузера на localhost: localStorage.setItem('oreh_dev_cloud', 'http://127.0.0.1:8766')
Для автотеста есть служебные команды (только здесь, в облаке их нет):
  {op:'dev_wipe'} — очистить всё,  {op:'dev_shift', days:N} — «перевести часы» на N дней вперёд.
"""
import json
import os
import shutil
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'server'))
import index  # noqa: E402

DATA = os.path.join(HERE, 'kv_data')
STORE = index.FileStore(DATA)
SHIFT = {'days': 0}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        data = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        for k, v in index.cors(self.headers.get('Origin', '')).items():
            self.send_header(k, v)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_POST(self):
        size = int(self.headers.get('Content-Length', 0))
        try:
            req = json.loads(self.rfile.read(size).decode('utf-8'))
        except ValueError:
            return self._send(400, {'ok': False})
        if req.get('op') == 'dev_wipe':
            shutil.rmtree(DATA, ignore_errors=True)
            SHIFT['days'] = 0
            return self._send(200, {'ok': True})
        if req.get('op') == 'dev_shift':
            SHIFT['days'] += int(req.get('days', 1))
            return self._send(200, {'ok': True})
        ip = req.pop('_ip', None) or self.client_address[0]
        code, res = index.handle(req, ip, STORE, now=time.time() + SHIFT['days'] * 86400)
        self._send(code, res)

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    print('Облако на компьютере: http://127.0.0.1:8766')
    ThreadingHTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
