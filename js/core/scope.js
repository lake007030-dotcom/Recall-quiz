/**
 * 一轮的「范围」—— js/core/scope.js
 *
 * 范围 = 这一轮从题库里取哪些题，**只在这里定义与计算一次**：
 *   all       全部题（按题库原顺序）
 *   chapters  选中章节的题（按题库原顺序）
 *   random    随机 N 题（只抽这一次；抽到的顺序即本轮题序）
 *
 * 别的层（session / round / app / 视图）只调用这里的三个函数：
 *   normalize(scope) → 合法化的范围对象（坏数据一律退回「全部」）
 *   ids(bank, scope) → 本轮题号数组（顺序即题序）
 *   label(bank, scope) → 人类可读的一句话（「全部 120 题」「二、HTML进阶 15 题」「随机 20 题」）
 * 视图里不要自己拼这些文字，记录页 / 答题页 / 快照读的都是同一个 label。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.QuizScope = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var TYPES = {
    ALL: 'all',
    CHAPTERS: 'chapters',
    RANDOM: 'random',
  };

  /** 随机范围的档位：题库不足 N 题时该档禁用 */
  var RANDOM_SIZES = [10, 20, 50];

  var CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  function cnNo(n) {
    var i = Number(n);
    if (i >= 0 && i <= 10) return CN_NUM[i];
    if (i < 20) return '十' + CN_NUM[i - 10];
    return String(i);
  }

  /** 合法化：认不出来的范围一律当「全部」，宁可按全库跑也不崩 */
  function normalize(scope) {
    if (!scope || typeof scope !== 'object') return { type: TYPES.ALL, chapterNos: [], n: 0 };

    var type = scope.type;
    if (type === TYPES.CHAPTERS) {
      var nos = [];
      if (Array.isArray(scope.chapterNos)) {
        for (var i = 0; i < scope.chapterNos.length; i++) {
          var no = Number(scope.chapterNos[i]);
          if (!isNaN(no) && nos.indexOf(no) < 0) nos.push(no);
        }
      }
      // 没选章节的「按章节」是非法范围 → 退回全部
      if (!nos.length) return { type: TYPES.ALL, chapterNos: [], n: 0 };
      return { type: TYPES.CHAPTERS, chapterNos: nos, n: 0 };
    }

    if (type === TYPES.RANDOM) {
      var n = Number(scope.n);
      if (!(n > 0)) return { type: TYPES.ALL, chapterNos: [], n: 0 };
      return { type: TYPES.RANDOM, chapterNos: [], n: Math.floor(n) };
    }

    return { type: TYPES.ALL, chapterNos: [], n: 0 };
  }

  function allIds(bank) {
    var out = [];
    for (var i = 0; i < bank.questions.length; i++) out.push(bank.questions[i].id);
    return out;
  }

  function chapterIds(bank, chapterNos) {
    var out = [];
    for (var i = 0; i < bank.questions.length; i++) {
      var q = bank.questions[i];
      if (chapterNos.indexOf(Number(q.chapter)) >= 0) out.push(q.id);
    }
    return out;
  }

  /** 洗牌后取前 n 个：抽到的顺序原样保留（刷新 / 切题都不会重抽，因为题号已存进本轮） */
  function sample(ids, n, rng) {
    var random = typeof rng === 'function' ? rng : Math.random;
    var pool = ids.slice();
    var take = Math.min(Math.floor(n) || 0, pool.length);
    for (var i = 0; i < take; i++) {
      var j = i + Math.floor(random() * (pool.length - i));
      var tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, take);
  }

  /** 本轮题号（顺序即题序）。random 只有第一次调用会「抽」，之后一律用存下来的题号。 */
  function ids(bank, scope, rng) {
    var s = normalize(scope);
    if (s.type === TYPES.CHAPTERS) return chapterIds(bank, s.chapterNos);
    if (s.type === TYPES.RANDOM) return sample(allIds(bank), s.n, rng);
    return allIds(bank);
  }

  function chapterOf(bank, no) {
    for (var i = 0; i < bank.chapters.length; i++) {
      if (Number(bank.chapters[i].no) === Number(no)) return bank.chapters[i];
    }
    return null;
  }

  function label(bank, scope) {
    var s = normalize(scope);

    if (s.type === TYPES.CHAPTERS) {
      var total = chapterIds(bank, s.chapterNos).length;
      var first = chapterOf(bank, s.chapterNos[0]);
      if (s.chapterNos.length === 1 && first) {
        return cnNo(first.no) + '、' + first.title + ' ' + total + ' 题';
      }
      var names = [];
      for (var i = 0; i < s.chapterNos.length; i++) {
        var ch = chapterOf(bank, s.chapterNos[i]);
        if (ch) names.push(ch.title);
      }
      var head = names.length ? names[0] : '章节';
      return head + (names.length > 1 ? ' 等 ' + names.length + ' 章' : '') + ' ' + total + ' 题';
    }

    if (s.type === TYPES.RANDOM) {
      return '随机 ' + Math.min(s.n, bank.questions.length) + ' 题';
    }

    return '全部 ' + bank.questions.length + ' 题';
  }

  return {
    TYPES: TYPES,
    RANDOM_SIZES: RANDOM_SIZES,
    normalize: normalize,
    ids: ids,
    label: label,
    chapterOf: chapterOf,
    cnNo: cnNo,
  };
});
