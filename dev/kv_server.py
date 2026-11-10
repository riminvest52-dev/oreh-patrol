#!/usr/bin/env python3
"""Заглушка облака для проверки синхронизации на компьютере. Хранит документы в памяти.

Запуск: python dev/kv_server.py
В консоли браузера на localhost: localStorage.setItem('oreh_dev_cloud', 'http://127.0.0.1:8766')
"""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

STORE = {}


class Handler(BaseHTTPRequestHandler):
    def _send(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        size = int(self.headers.get('Content-Length', 0))
        req = json.loads(self.rfile.read(size).decode('utf-8'))
        if req.get('op') == 'get':
            self._send({'ok': True, 'doc': STORE.get(req['key'])})
        elif req.get('op') == 'put':
            STORE[req['key']] = req['doc']
            self._send({'ok': True})
        else:
            self._send({'ok': False}, 400)

    def log_message(self, *args):
        pass


ThreadingHTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
