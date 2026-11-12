/* Озвучка: заранее записанные голоса героев (Yandex SpeechKit), голос браузера — только запасной.
   Фраза режется на предложения; каждое предложение — отдельный файл voice/<папка героя>/<хэш>.ogg|mp3.
   Если хоть одного предложения нет в записях — вся фраза читается голосом браузера.
   Список записей — VOICE_DATA в js/voice-data.js (его пишет dev/voice/gen.py). */
'use strict';

/* Кто говорит: zh — Жёлудик, nr — Рассказчик (задания Лизы), fu — Фундук, mi — Миндалинка, ez — Дедушка Ёж */
const VOICE_WHO = ['zh', 'nr', 'fu', 'mi', 'ez'];

/* Одинаковая нормализация и разрезка здесь и в dev/voice/phrases.html — по ним считается имя файла */
const voiceClean = s => String(s).replace(/<[^>]+>/g, ' ').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const voiceParts = s => (voiceClean(s).match(/[^.!?…]+[.!?…]*/g) || []).map(x => x.trim()).filter(x => /[0-9a-zа-яё]/i.test(x));
function voiceHash(s) {   /* FNV-1a 32 бита по UTF-16 → base36 */
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}

const Voice = (() => {
  const D = typeof VOICE_DATA === 'object' ? VOICE_DATA : null;
  const has = {};
  if (D) for (const w of VOICE_WHO) has[w] = new Set((D.has[w] || '').split(' '));
  const probe = document.createElement('audio');
  const ext = probe.canPlayType && probe.canPlayType('audio/ogg; codecs=opus') ? 'ogg' : 'mp3';
  const url = (who, h) => `voice/${D.dirs[who]}/${h}.${ext}`;
  const clipsOf = (text, who) => {
    if (!D || !has[who]) return null;
    const hs = voiceParts(text).map(voiceHash);
    return hs.length && hs.every(h => has[who].has(h)) ? hs.map(h => url(who, h)) : null;
  };

  /* --- голос браузера (запасной) --- */
  const tts = 'speechSynthesis' in window;
  let bv = null;
  const pickV = () => {
    try {
      const vs = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang));
      bv = vs.find(v => /google/i.test(v.name)) || vs.find(v => /milena|irina|svetlana|daria|female/i.test(v.name)) || vs[0] || null;
    } catch (e) { bv = null; }
  };
  if (tts) { pickV(); try { speechSynthesis.addEventListener('voiceschanged', pickV); } catch (e) { } }
  const browserSay = text => {
    if (!tts) return;
    try {
      const u = new SpeechSynthesisUtterance(voiceClean(text).replace(/−/g, ' минус ').replace(/\+/g, ' плюс '));
      u.lang = 'ru-RU'; if (bv) u.voice = bv; u.rate = 0.88; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { }
  };

  /* --- записи: одна общая <audio>, файлы берутся через fetch (кэш сервис-воркера) и играются из blob ---
     blob нужен iPhone: Safari не играет звук, отданный сервис-воркером без поддержки Range. */
  const au = new Audio(); au.preload = 'auto';
  const blobs = new Map();          /* url → objectURL, последние 80 */
  let tok = 0, pending = null, unlocked = false;
  const fetched = new Set();
  const getBlob = u => {
    if (blobs.has(u)) { const b = blobs.get(u); blobs.delete(u); blobs.set(u, b); return Promise.resolve(b); }
    return fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(b => {
      const o = URL.createObjectURL(b); blobs.set(u, o);
      if (blobs.size > 80) { const [k, v] = blobs.entries().next().value; URL.revokeObjectURL(v); blobs.delete(k); }
      return o;
    });
  };
  function playList(list, text, my) {
    let i = 0;
    const next = () => {
      if (my !== tok) return;
      if (i >= list.length) return;
      getBlob(list[i++]).then(src => {
        if (my !== tok) return;
        au.onended = next;
        au.src = src;
        const p = au.play();
        if (p && p.catch) p.catch(err => {
          /* Нет касания экрана (автозапуск) — сыграем после первого касания */
          if (err && err.name === 'NotAllowedError') { if (my === tok) pending = () => playList(list, text, my); }
          else if (my === tok) { tok++; browserSay(text); }
        });
      }).catch(() => { if (my === tok) { tok++; browserSay(text); } });   /* нет файла и нет сети — голос браузера */
    };
    next();
  }
  /* Первое касание «разблокирует» звук на iPhone и запускает отложенную фразу */
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
  const unlock = () => {
    if (pending) { const f = pending; pending = null; f(); unlocked = true; return; }
    if (unlocked) return; unlocked = true;
    if (au.src) return;
    try { au.src = SILENT; const p = au.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { }
  };
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);

  const on = () => { try { return localStorage.getItem('oreh_voice') !== '0'; } catch (e) { return true; } };
  const stop = () => { tok++; pending = null; try { au.pause(); } catch (e) { } try { if (tts) speechSynthesis.cancel(); } catch (e) { } };
  return {
    has: tts || !!D, on, stop,
    toggle() { try { localStorage.setItem('oreh_voice', on() ? '0' : '1'); } catch (e) { } if (!on()) stop(); },
    /* who — кто говорит (по умолчанию Жёлудик) */
    say(text, who = 'zh') {
      if (!on() || !text) return;
      stop();
      const list = clipsOf(text, who);
      if (list) playList(list, text, tok); else browserSay(text);
    },
    /* Докачка записей темы заранее: сервис-воркер положит их в кэш, задания потом звучат сразу и без сети */
    prefetch(topic) {
      if (!D || !D.topics || !D.topics[topic] || !on() || fetched.has(topic)) return;
      fetched.add(topic);
      const list = D.topics[topic].split(' ').map(x => { const [w, h] = x.split('/'); return url(w, h); });
      let i = 0;
      const worker = () => { if (i >= list.length) return; fetch(list[i++]).catch(() => { }).then(worker); };
      for (let k = 0; k < 4; k++) worker();
    },
    _clipsOf: clipsOf
  };
})();

/* ---------- Похвала голосом ----------
   Голосом звучит не каждый верный ответ: обычный верный ответ — примерно 1 раз из 3, остальное — звук и анимация.
   Всегда: верно со второй попытки, 3 и 5 подряд, задача со звёздочкой, конец уровня, медаль, первый вход за день.
   Хвалим за старание и способ, не за «ум». Одна и та же фраза — не чаще раза в 10 минут. */
const PRAISE = {
  /* Настя (5 класс): Фундук — fu, Миндалинка — mi, Дедушка Ёж — ez */
  five: {
    ok: [['fu', 'Настя, точно!'], ['fu', 'Настя, в точку!'], ['mi', 'Настя, верно! Ты внимательно прочитала условие.'], ['fu', 'Да, Настя! Аккуратно посчитала.'],
      ['mi', 'Настенька, именно так!'], ['fu', 'Настя, ловко! Ты выбрала верный способ.'], ['mi', 'Настя, ты проверила — и не ошиблась.'], ['fu', 'Настенька, чисто сработано!'],
      ['fu', 'Верно! Ловко посчитала.'], ['mi', 'Да! Именно так.'], ['fu', 'Чисто сработано.'], ['mi', 'Точно! Ты не спешила — и всё сошлось.'],
      ['fu', 'Верно! Хороший способ.'], ['mi', 'Так и есть! Ты разобралась.'], ['fu', 'Правильно! Аккуратная работа.'], ['fu', 'В точку!']],
    second: [['mi', 'Вот! Нашла ошибку и исправила — это и есть математика.'], ['mi', 'Настя, ты не сдалась — и получилось!'], ['mi', 'Настенька, со второй попытки — и точно! Ты разобралась.'],
      ['fu', 'Исправила — и верно! Так и учатся.'], ['mi', 'Вторая попытка — и в точку. Ты не сдалась!'], ['mi', 'Настя, ты нашла, где ошиблась. Это важнее всего!']],
    streak3: [['fu', 'Три подряд! Настя, ты в ударе.'], ['fu', 'Три верных подряд! Ты внимательна.'], ['fu', 'Настенька, три из трёх! Так держать.'], ['mi', 'Три подряд — без единой ошибки!']],
    streak5: [['fu', 'Пять без единой ошибки! Патруль гордится тобой.'], ['mi', 'Настя, пять подряд! Ты по-настоящему разобралась.'], ['fu', 'Пять верных подряд! Отличная работа!'], ['fu', 'Настенька, пять из пяти! Патруль в восторге.']],
    star: [['ez', 'Ого! Эту задачу решают не все пятиклассники. Настя, браво!'], ['fu', 'Задача со звёздочкой — твоя! Ты не испугалась трудной.'], ['ez', 'Настя, звёздочка покорена! Ты долго думала — и додумала.'], ['ez', 'Трудная задача — и верно! Браво!']],
    level: [['fu', 'Настя, уровень пройден! Ты молодец.'], ['mi', 'Лес стал спокойнее — спасибо, Настя!'], ['fu', 'Настя, отличная работа. Дедушка Ёж такого давно не видел!'],
      ['mi', 'Уровень пройден! Ты старалась — и это видно.'], ['fu', 'Ещё один уровень позади. Отличная работа!'], ['mi', 'Настенька, уровень твой! Ты не сдавалась.']],
    medal: [['ez', 'Медаль твоя, Настя! Это было настоящее испытание.'], ['ez', 'Испытание пройдено! Ты честно заработала эту медаль.'], ['ez', 'Настенька, медаль твоя! Ты справилась с трудными задачами.']],
    hello: [['fu', 'Настя, привет! Патруль на месте, ждали тебя.'], ['mi', 'Привет, Настенька! Лес ждёт патруль.'], ['fu', 'Привет! Патруль на месте. Начнём?'], ['mi', 'С возвращением! Орешки сами себя не соберут.']],
    /* Утешение после неверного ответа (Миндалинка) — звучит каждый раз */
    bad: [['mi', 'Прочитай разбор — в следующий раз точно получится!'], ['mi', 'Я положу эту задачку в корзинку, повторим позже.'], ['mi', 'Ошибаться — нормально. Главное — понять!']]
  },
  /* Лиза (Лесная полянка): всё говорит Жёлудик */
  kid: {
    ok: [['zh', 'Лиза, умница!'], ['zh', 'Лизонька, получилось!'], ['zh', 'Ура! Лиза, ты молодец!'], ['zh', 'Лиза, правильно! Ты внимательно посчитала.'], ['zh', 'Лизонька, верно! Ты не спешила.'],
      ['zh', 'Правильно! Ты так хорошо посчитала!'], ['zh', 'Верно! Ты внимательно посмотрела.'], ['zh', 'Ура, получилось!'], ['zh', 'Здорово! Ты сама нашла ответ.'], ['zh', 'Да! Ты посчитала по порядку.']],
    second: [['zh', 'Попробовала ещё раз — и вышло! Здорово, Лиза!'], ['zh', 'Лизонька, ты не сдалась — и получилось!'], ['zh', 'Со второго раза — и верно! Молодец, что попробовала ещё.'], ['zh', 'Получилось! Ты не сдалась.']],
    streak3: [['zh', 'Три подряд! Лиза, ты умница!'], ['zh', 'Три правильных подряд! Ура!'], ['zh', 'Лизонька, три раза подряд верно!'], ['zh', 'Три подряд! Ты так стараешься!']],
    streak5: [['zh', 'Пять подряд! Лиза, вот это да!'], ['zh', 'Пять правильных подряд! Ты так стараешься!'], ['zh', 'Лизонька, пять раз подряд верно! Ура!']],
    level: [['zh', 'Молодец, Лиза! Сыграем ещё?'], ['zh', 'Всё задание пройдено! Ты так старалась!'], ['zh', 'Лизонька, молодец! Сыграем ещё?'], ['zh', 'Ура, задание пройдено! Сыграем ещё?']],
    star: [['zh', 'Лиза, звёздочка твоя!'], ['zh', 'Новая звёздочка! Лиза, ты молодец!'], ['zh', 'Ура! У тебя новая звёздочка!'], ['zh', 'Звёздочка твоя! Ты так старалась!']],
    hello: [['zh', 'Привет, Лиза! Выбирай игру.'], ['zh', 'Лизонька, привет! Пойдём считать орешки?'], ['zh', 'Привет! Я Жёлудик. Пойдём считать орешки?'], ['zh', 'Привет! Выбирай игру.']]
  }
};
const PRAISE_ALWAYS = new Set(['second', 'streak3', 'streak5', 'star', 'level', 'medal', 'hello', 'bad']);
const PRAISE_GAP = 10 * 60 * 1000;

const Praise = (() => {
  const bags = {};
  let last = {};
  try { last = JSON.parse(localStorage.getItem('oreh_praise_ts') || '{}'); } catch (e) { }
  const named = (world, name) => world === 'kid' ? /^лиз/i.test(name || '') : /^наст/i.test(name || '');
  const hasName = t => /Наст|Лиз/.test(t);
  function pick(world, cat, name) {
    const all = (PRAISE[world] || {})[cat];
    if (!all) return null;
    const ok = named(world, name);
    const list = all.filter(p => ok || !hasName(p[1]));
    if (!list.length) return null;
    const key = world + cat + (ok ? 1 : 0);
    if (!bags[key] || !bags[key].length) bags[key] = R.shuffle(list.slice());
    const now = Date.now(), bag = bags[key];
    let i = bag.findIndex(p => !(now - (last[p[1]] || 0) < PRAISE_GAP));
    if (i < 0) { i = 0; bag.forEach((p, j) => { if ((last[p[1]] || 0) < (last[bag[i][1]] || 0)) i = j; }); }
    const p = bag.splice(i, 1)[0];
    last[p[1]] = now;
    try { localStorage.setItem('oreh_praise_ts', JSON.stringify(last)); } catch (e) { }
    return { who: p[0], text: p[1] };
  }
  return {
    /* Возвращает фразу, если она прозвучала (чтобы показать её и в пузыре), иначе null */
    say(cat, world) {
      world = world || (isKid() ? 'kid' : 'five');
      if (cat === 'ok' && Math.random() >= 1 / 3) return null;
      if (!PRAISE_ALWAYS.has(cat) && cat !== 'ok') return null;
      const p = pick(world, cat, S.name);
      if (p) Voice.say(p.text, p.who);
      return p;
    },
    /* Первый вход за день — приветствие (один раз в день для каждого игрока) */
    hello() {
      const k = 'oreh_hello_' + (F.current || '');
      try { if (localStorage.getItem(k) === today()) return null; localStorage.setItem(k, today()); } catch (e) { }
      return this.say('hello');
    },
    _pick: pick
  };
})();
