/**
 * 错题本（跨轮聚合）—— js/core/wrongbook.js
 *
 * 错题本**不新增任何存储**：数据全部从 `quiz:rounds:<题库>` 里已完成快照现算。
 *
 * 口径（与 session.wrongIds 完全一致，只算已提交判错的题）：
 *   算    快照里 submitted === true 且判定 outcome === 'wrong'
 *   不算  选而未提交 / 完全没碰 / 数据异常题（scorable:false 永远判不出 wrong）
 *         也不把「进行中还没交卷」的那一轮算进来（那一轮还没冻结，不算事实）
 *
 * 聚合规则：
 *   - 同一道题在多轮里做错过，只出现一次；
 *   - wrongCount = 做错过的轮次数；
 *   - lastAt = 最近一次做错的那一轮的交卷时间（多个快照取最大）；快照缺时间则跳过时间比较；
 *   - 顺序 = 章节号升序 → 题号数值升序（不依赖数据文件里的排列，转换脚本重排也不会乱）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./round.js'), require('./session.js'));
  else root.QuizWrongbook = factory(root.QuizRound, root.QuizSession);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Round, Session) {
  'use strict';

  function byChapterThenNo(a, b) {
    var ca = Number(a.chapter);
    var cb = Number(b.chapter);
    if (ca !== cb) return (isNaN(ca) ? 0 : ca) - (isNaN(cb) ? 0 : cb);
    var ia = Number(a.id);
    var ib = Number(b.id);
    if (!isNaN(ia) && !isNaN(ib) && ia !== ib) return ia - ib;
    return String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0;
  }

  /**
   * 错题本条目（按 章节 → 题号 排序）。
   * @returns {Array<{id:*, question:object, chapter:*, wrongCount:number, lastAt:string|null}>}
   */
  function entries(bank, storage) {
    var out = [];
    if (!bank || !Array.isArray(bank.questions)) return out;

    var byId = Object.create(null);
    for (var i = 0; i < bank.questions.length; i++) {
      byId[String(bank.questions[i].id)] = bank.questions[i];
    }

    var tally = Object.create(null);
    var snaps = Round.roundStore(bank.key, storage).list();
    for (var s = 0; s < snaps.length; s++) {
      var snap = snaps[s];
      var qids = Array.isArray(snap.questionIds) ? snap.questionIds : [];
      var questions = [];
      for (var j = 0; j < qids.length; j++) {
        if (byId[String(qids[j])]) questions.push(byId[String(qids[j])]);
      }
      if (!questions.length) continue;

      // 判定走同一套模型（快照里存的是原始作答事实）
      var model = Session.createModel(questions, Session.copyAnswers(snap.answers || {}));
      var wrong = model.wrongIds();
      if (!wrong.length) continue;

      var at = snap.finishedAt || snap.startedAt || null;
      for (var w = 0; w < wrong.length; w++) {
        var key = String(wrong[w]);
        var cell = tally[key] || (tally[key] = { wrongCount: 0, lastAt: null });
        cell.wrongCount++;
        if (at && (!cell.lastAt || at > cell.lastAt)) cell.lastAt = at;
      }
    }

    for (var k in tally) {
      if (!Object.prototype.hasOwnProperty.call(tally, k)) continue;
      var q = byId[k];
      if (!q) continue; // 题库换版后残留的题号直接跳过
      out.push({
        id: q.id,
        question: q,
        chapter: q.chapter,
        wrongCount: tally[k].wrongCount,
        lastAt: tally[k].lastAt,
      });
    }
    out.sort(byChapterThenNo);
    return out;
  }

  /** 错题练习的题号（顺序 = 错题本顺序） */
  function ids(bank, storage) {
    var list = entries(bank, storage);
    var out = [];
    for (var i = 0; i < list.length; i++) out.push(list[i].id);
    return out;
  }

  function count(bank, storage) {
    return entries(bank, storage).length;
  }

  /**
   * 按章节分组（章节顺序取题库自己的章节顺序，只输出有错题的章节）。
   * @returns {Array<{ no:*, title:string, rows:Array }>}
   */
  function groups(bank, storage) {
    var list = entries(bank, storage);
    var byNo = Object.create(null);
    var order = [];

    for (var i = 0; i < list.length; i++) {
      var no = list[i].chapter;
      var k = String(no);
      if (!byNo[k]) {
        byNo[k] = { no: no, title: chapterTitle(bank, no), rows: [] };
        order.push(k);
      }
      byNo[k].rows.push(list[i]);
    }

    // 章节顺序：题库 chapters 里的顺序优先，找不到的章节按号排到最后
    var rank = Object.create(null);
    if (bank && Array.isArray(bank.chapters)) {
      for (var c = 0; c < bank.chapters.length; c++) rank[String(bank.chapters[c].no)] = c;
    }
    order.sort(function (a, b) {
      var ra = Object.prototype.hasOwnProperty.call(rank, a) ? rank[a] : 9999 + Number(a);
      var rb = Object.prototype.hasOwnProperty.call(rank, b) ? rank[b] : 9999 + Number(b);
      return ra - rb;
    });

    var out = [];
    for (var o = 0; o < order.length; o++) out.push(byNo[order[o]]);
    return out;
  }

  function chapterTitle(bank, no) {
    if (bank && Array.isArray(bank.chapters)) {
      for (var i = 0; i < bank.chapters.length; i++) {
        if (Number(bank.chapters[i].no) === Number(no)) return bank.chapters[i].title || '';
      }
    }
    return '';
  }

  return {
    entries: entries,
    ids: ids,
    count: count,
    groups: groups,
    chapterTitle: chapterTitle,
  };
});
