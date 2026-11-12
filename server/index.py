"""Облако «Орехового патруля»: Yandex Cloud Function + закрытый бакет oreh-patrol-data.

Один документ на семью. Семейный код на сервер не приходит: игра присылает только его SHA-256 (key).
Запрос: POST, тело JSON {op, key, ...}. Ответ: JSON {ok, ...}.
  get / join  {key}              -> {doc, ts}   (doc = null, если семьи нет: это считается неверным кодом)
  put         {key, doc}         -> {ts}        (предыдущая версия хранится рядом; раз в день — копия в bak/)
  backups     {key}              -> {list: [{id, ts}]}   копии за 30 дней и предыдущая версия
  backup      {key, id}          -> {doc, ts}

Хранилище (объекты в бакете):
  fam/<key>.json                 {doc, ts, day, prev, prevTs}
  bak/<key>/<ГГГГ-ММ-ДД>.json    {doc, ts} — состояние на конец последнего дня, когда семья играла
  rl/<хэш адреса>/<ГГГГММДДЧЧ>.json  {n} — неверные коды за час
Старые bak/ и rl/ удаляет правило жизненного цикла бакета (31 и 2 дня).

Ключей в коде нет: функция работает от своего сервисного аккаунта, IAM-токен приходит в context.token.
Для проверки на компьютере эту же логику запускает dev/kv_server.py с хранилищем в папке.
"""
import base64
import datetime as dt
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

BUCKET = os.environ.get('BUCKET', 'oreh-patrol-data')
ORIGINS = ('https://oreh-patrol.website.yandexcloud.net', 'https://riminvest52-dev.github.io')
LOCAL = re.compile(r'^http://(localhost|127\.0\.0\.1)(:\d+)?$')
MAX_DOC = 600 * 1024          # байт; обычная семья — 20–60 КБ
LIMIT = 10                    # неверных кодов в час с одного адреса
KEY = re.compile(r'^[0-9a-f]{64}$')
BAK_ID = re.compile(r'^(\d{4}-\d{2}-\d{2}|prev)$')
MSK = dt.timezone(dt.timedelta(hours=3))


class S3Store:
    """Объектное хранилище Yandex по IAM-токену сервисного аккаунта (заголовок X-YaCloud-SubjectToken)."""

    def __init__(self, token):
        self.token = token

    def _req(self, method, path, data=None, query=''):
        url = f'https://storage.yandexcloud.net/{BUCKET}/{urllib.parse.quote(path)}' + ('?' + query if query else '')
        r = urllib.request.Request(url, data=data, method=method, headers={'X-YaCloud-SubjectToken': self.token})
        if data is not None:
            r.add_header('Content-Type', 'application/json')
        try:
            with urllib.request.urlopen(r, timeout=8) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise

    def get(self, path):
        b = self._req('GET', path)
        return None if b is None else json.loads(b)

    def put(self, path, obj):
        self._req('PUT', path, json.dumps(obj, ensure_ascii=False, separators=(',', ':')).encode('utf-8'))

    def list(self, prefix):
        b = self._req('GET', '', query='list-type=2&max-keys=100&prefix=' + urllib.parse.quote(prefix, safe=''))
        if not b:
            return []
        root = ET.fromstring(b)
        return [el.text for el in root.iter() if el.tag.endswith('}Key') or el.tag == 'Key']


class FileStore:
    """То же хранилище в папке на компьютере — для dev/kv_server.py и автотестов."""

    def __init__(self, base):
        self.base = base

    def _p(self, path):
        return os.path.join(self.base, *path.split('/'))

    def get(self, path):
        try:
            with open(self._p(path), encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return None

    def put(self, path, obj):
        p = self._p(path)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False)

    def list(self, prefix):
        d = self._p(prefix.rstrip('/'))
        return [prefix + n for n in sorted(os.listdir(d))] if os.path.isdir(d) else []


def _rl_path(ip, now):
    h = hashlib.sha256(('oreh-rl:' + ip).encode()).hexdigest()[:24]
    return f'rl/{h}/{dt.datetime.fromtimestamp(now, MSK):%Y%m%d%H}.json'


def _limited(store, ip, now):
    rec = store.get(_rl_path(ip, now))
    return bool(rec) and rec.get('n', 0) >= LIMIT


def _miss(store, ip, now):
    p = _rl_path(ip, now)
    rec = store.get(p) or {'n': 0}
    store.put(p, {'n': rec.get('n', 0) + 1})


def _clean_doc(doc):
    """На сервере — только игровые данные: игроки, прогресс, устройства. Лишние поля отбрасываются."""
    out = {'v': 2, 'profiles': doc.get('profiles') or [], 'states': doc.get('states') or {}, 'devices': doc.get('devices') or {}}
    if not isinstance(out['profiles'], list) or not isinstance(out['states'], dict) or not isinstance(out['devices'], dict):
        raise ValueError('shape')
    return out


def handle(req, ip, store, now=None):
    """Возвращает (код HTTP, ответ)."""
    now = time.time() if now is None else now
    op, key = req.get('op'), str(req.get('key', ''))
    if not KEY.match(key):
        return 400, {'ok': False, 'err': 'key'}
    path = f'fam/{key}.json'

    if op == 'put':
        doc = req.get('doc')
        if not isinstance(doc, dict) or doc.get('v') != 2:
            return 400, {'ok': False, 'err': 'doc'}
        try:
            doc = _clean_doc(doc)
        except ValueError:
            return 400, {'ok': False, 'err': 'doc'}
        if len(json.dumps(doc, ensure_ascii=False).encode('utf-8')) > MAX_DOC:
            return 413, {'ok': False, 'err': 'size'}
        rec = store.get(path)
        today = dt.datetime.fromtimestamp(now, MSK).strftime('%Y-%m-%d')
        if rec and rec.get('day') and rec['day'] != today:   # первое сохранение за день: копия вчерашнего состояния
            store.put(f'bak/{key}/{rec["day"]}.json', {'doc': rec['doc'], 'ts': rec['ts']})
        ts = int(now * 1000)
        store.put(path, {'doc': doc, 'ts': ts, 'day': today,
                         'prev': rec['doc'] if rec else None, 'prevTs': rec['ts'] if rec else None})
        return 200, {'ok': True, 'ts': ts}

    if op not in ('get', 'join', 'backups', 'backup'):
        return 400, {'ok': False, 'err': 'op'}
    if _limited(store, ip, now):
        return 429, {'ok': False, 'err': 'limit'}
    rec = store.get(path)
    if not rec:
        _miss(store, ip, now)
        return 200, {'ok': True, 'doc': None}

    if op in ('get', 'join'):
        return 200, {'ok': True, 'doc': rec['doc'], 'ts': rec['ts']}
    if op == 'backups':
        days = sorted((p.rsplit('/', 1)[-1][:-5] for p in store.list(f'bak/{key}/') if p.endswith('.json')), reverse=True)
        lst = ([{'id': 'prev', 'ts': rec['prevTs']}] if rec.get('prev') else []) + [{'id': d} for d in days[:31]]
        return 200, {'ok': True, 'list': lst}
    bid = str(req.get('id', ''))
    if not BAK_ID.match(bid):
        return 400, {'ok': False, 'err': 'id'}
    if bid == 'prev':
        return 200, {'ok': True, 'doc': rec.get('prev'), 'ts': rec.get('prevTs')}
    b = store.get(f'bak/{key}/{bid}.json')
    return 200, {'ok': True, 'doc': b['doc'] if b else None, 'ts': b['ts'] if b else None}


def cors(origin):
    ok = origin in ORIGINS or bool(LOCAL.match(origin or ''))
    h = {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin'}
    if ok:
        h.update({'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'})
    return h


def handler(event, context):
    hdr = {k.lower(): v for k, v in (event.get('headers') or {}).items()}
    headers = cors(hdr.get('origin', ''))
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 204, 'headers': headers, 'body': ''}
    try:
        body = event.get('body') or ''
        if event.get('isBase64Encoded'):
            body = base64.b64decode(body).decode('utf-8')
        req = json.loads(body)
        ip = ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp') or hdr.get('x-forwarded-for', '?')
        code, res = handle(req, ip.split(',')[0].strip(), S3Store(context.token['access_token']))
    except Exception as e:  # noqa: BLE001 — игра получает понятный ответ, подробности — в логах функции
        print('error', type(e).__name__, e)
        code, res = 500, {'ok': False, 'err': 'server'}
    return {'statusCode': code, 'headers': headers, 'body': json.dumps(res, ensure_ascii=False)}
