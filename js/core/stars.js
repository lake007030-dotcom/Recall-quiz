/**
 * 收藏（重点题标记）—— js/core/stars.js
 *
 * 收藏是**题目级**的：一道题标了星，普通练习轮 / 重练轮 / 错题练习 / 收藏练习里都是同一颗星。
 * 所以存储是「一张扁平表」，不按轮次、不按题库分键：
 *
 *   quiz:stars = { "web:31": 1760000000000, "java:12": 1760000000123 }
 *                └─ 键：题库 key + ':' + 题号      └─ 值：第一次标星的时间（毫秒）
 *
 * 三条纪律：
 *  1) 只走 store.js 读写，不直接摸 localStorage；版本号由 store 管，坏 JSON / 坏条目一律当没有。
 *  2) 只新增 quiz:stars 这一个键，不动 quiz:progress / quiz:rounds / quiz:feedback 等既有键。
 *  3) 「收藏练习」的题序 = 题库原序（由调用方按 bank.questions 过滤），本模块只回答「哪些题标了星」。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./store.js'));
  else root.QuizStars = factory(root.QuizStore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Store) {
  'use strict';

  var SCHEMA_VERSION = 1;
  var KEY = 'quiz:stars';

  function store(storage) {
    return Store.createStore({
      storage: storage !== undefined ? storage : Store.defaultStorage(),
      key: KEY,
      version: SCHEMA_VERSION,
    });
  }

  /** 扁平表的键：题库 + 题号（"web:31"） */
  function keyOf(bankKey, id) {
    return String(bankKey) + ':' + String(id);
  }

  /**
   * 读出整张表（副本）。
   * 坏数据容错：不是对象 / 值不是正数时间戳 / 键里没有 ':' 的条目一律丢掉，绝不让页面崩。
   */
  function all(storage) {
    var data = store(storage).load();
    var src = data && data.stars && typeof data.stars === 'object' ? data.stars : {};
    var out = {};
    for (var k in src) {
      if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
      var v = src[k];
      if (typeof v !== 'number' || !isFinite(v) || v <= 0) continue;
      if (k.indexOf(':') <= 0) continue;
      out[k] = v;
    }
    return out;
  }

  function write(map, storage) {
    return store(storage).save({ stars: map });
  }

  /** 这道题标星了吗 */
  function has(bankKey, id, storage) {
    return Object.prototype.hasOwnProperty.call(all(storage), keyOf(bankKey, id));
  }

  /** 标星时间（毫秒）；没标返回 null */
  function at(bankKey, id, storage) {
    var map = all(storage);
    var k = keyOf(bankKey, id);
    return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null;
  }

  /** 直接设成 on/off（幂等）；返回设置后的状态 */
  function set(bankKey, id, on, storage) {
    var map = all(storage);
    var k = keyOf(bankKey, id);
    if (on) {
      if (!Object.prototype.hasOwnProperty.call(map, k)) map[k] = Date.now();
      write(map, storage);
      return true;
    }
    if (Object.prototype.hasOwnProperty.call(map, k)) {
      delete map[k];
      write(map, storage);
    }
    return false;
  }

  /** 切换；返回切换后的状态 { starred, at } */
  function toggle(bankKey, id, storage) {
    var now = !has(bankKey, id, storage);
    set(bankKey, id, now, storage);
    return { starred: now, at: now ? at(bankKey, id, storage) : null };
  }

  /** 某题库标了几道 */
  function count(bankKey, storage) {
    var map = all(storage);
    var prefix = String(bankKey) + ':';
    var n = 0;
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k) && k.indexOf(prefix) === 0) n++;
    }
    return n;
  }

  /**
   * 某题库的收藏题号，**按题库原序**（收藏练习的题序就是它）。
   * 只认题库里真实存在的题：题库换版后残留的旧题号会被跳过。
   */
  function ids(bank, storage) {
    var map = all(storage);
    var out = [];
    if (!bank || !Array.isArray(bank.questions)) return out;
    for (var i = 0; i < bank.questions.length; i++) {
      var id = bank.questions[i].id;
      if (Object.prototype.hasOwnProperty.call(map, keyOf(bank.key, id))) out.push(id);
    }
    return out;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    KEY: KEY,
    keyOf: keyOf,
    all: all,
    has: has,
    at: at,
    set: set,
    toggle: toggle,
    count: count,
    ids: ids,
    /** 供自测：清空这张表 */
    clear: function (storage) { return store(storage).clear(); },
  };
});
