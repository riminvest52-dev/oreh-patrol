/* Задание 11: общее для «Леса», «Семейной миссии» и «Сундука-сюрприза».
   Новые поля прогресса: forest (js/forest.js), fam (js/mission.js), coll — коллекция сюрпризов, chest, wear (js/chest.js).
   Слияние с другого устройства — mergeInteres (вызывается из mergeStates): ничего не теряется и не удваивается. */
'use strict';

const uniq = (...lists) => [...new Set([].concat(...lists.map(x => x || [])))];
const hasColl = id => (S.coll || []).includes(id);
function addColl(id) { S.coll = S.coll || []; if (S.coll.includes(id)) return false; S.coll.push(id); return true; }

function mergeInteres(A, B, R, keysOf) {
  /* Лес: показанные объекты и прочитанные главы — объединение */
  if (A.forest || B.forest) {
    const x = A.forest || {}, y = B.forest || {};
    R.forest = { seen: uniq(x.seen, y.seen), read: uniq(x.read, y.read).sort((a, b) => a - b), init: x.init || y.init ? 1 : 0 };
  }
  R.coll = uniq(A.coll, B.coll);
  /* Наряд героя — более поздний выбор */
  R.wear = !A.wear ? B.wear : !B.wear ? A.wear : (B.wear.ts || 0) > (A.wear.ts || 0) ? B.wear : A.wear;
  /* Сундук: «сколько сессий без сундука» — с более нового устройства */
  R.chest = !A.chest ? B.chest : !B.chest ? A.chest : (B.chest.ts || 0) > (A.chest.ts || 0) ? B.chest : A.chest;
  if (typeof mergeFam === 'function') mergeFam(A, B, R, keysOf);
}

/* Фразы частей 2 и 3 — для озвучки (dev/voice/phrases.html) */
function interesPhrases() {
  return [].concat(typeof missionPhrases === 'function' ? missionPhrases() : [], typeof chestPhrases === 'function' ? chestPhrases() : []);
}
