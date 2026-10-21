/**
 * 一次答题会话的状态模型 —— js/core/session.js
 *
 * 轮次模型（重要）：
 *   一轮 = 「一组题目（按给定顺序） + 这一轮的作答」。
 *   普通练习轮传全库题号；重练轮传原轮的错题题号。除了题号列表，两者没有任何区别——
 *   统计、判分、进度全部从同一套派生逻辑算出来，视图不许另写一套。
 *
 * 设计要点：
 *  1) 每题只有三种状态，由“是否有选择”和“是否已提交”两个事实决定：
 *       未选          picked 为空 / 无记录
 *       已选未提交    picked 非空 且 submitted=false
 *       已提交已判分  submitted=true
 *  2) 所有统计（已作答数 / 答对数 / 错题集合 / 正确率）都是**派生值**，
 *     不额外维护任何累加计数器 —— 这是“重复点提交成绩不变”的根治办法。
 *  3) 选而未提交的选择会随会话持久化；切换题目 / 刷新页面后仍在。
 *  4) 判题一律走 Judge（js/core/judge.js），本文件不重复实现对错规则；
 *     持久化一律走 Store（js/core/store.js），本文件不直接碰 localStorage。
 *  5) 旧版本只有 `quiz:progress:<bank>` 这一个键、payload 里也只有 bankKey/index/answers。
 *     这里**不升 schema 版本**，缺 questionIds / kind / source 时按“全库 + 普通轮”补齐，
 *     所以老用户的进度会原样变成“当前这一轮”，不会被当成坏数据丢掉。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./judge.js'), require('./store.js'), require('./scope.js'));
  } else {
    root.QuizSession = factory(root.QuizJudge, root.QuizStore, root.QuizScope);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Judge, Store, Scope) {
  'use strict';

  var SCHEMA_VERSION = 1;
  var PROGRESS_PREFIX = 'quiz:progress:';

  /** 普通轮（全库）的进度键。这是老键，保持不变：旧数据能直接当「当前这一轮」读回来。 */
  function progressKey(bankKey) {
    return PROGRESS_PREFIX + bankKey;
  }

  // 每题状态。与 Judge.OUTCOME 一样，只在这里定义一次，外部一律引用枚举。
  var STATUS = {
    UNSELECTED: 'unselected',
    PICKED: 'picked',
    SUBMITTED: 'submitted',
  };

  // 轮次种类：
  //   normal     普通练习轮（全库 / 章节 / 随机 N）
  //   practice   重练轮（题目来自某一轮的错题，有具体的「哪一轮」）
  //   wrongbook  错题练习（题目来自跨轮聚合的错题本，没有具体的「哪一轮」）
  //   stars      收藏练习（题目来自标星的重点题）
  var KIND = {
    NORMAL: 'normal',
    PRACTICE: 'practice',
    WRONGBOOK: 'wrongbook',
    STARS: 'stars',
  };

  /** 合法化轮次种类：认不出来的当作普通轮（老数据里没有 kind 字段） */
  function normalizeKind(kind) {
    if (kind === KIND.PRACTICE || kind === KIND.WRONGBOOK || kind === KIND.STARS) return kind;
    return KIND.NORMAL;
  }

  var OUTCOME = Judge.OUTCOME;

  /* =========================== 纯模型 =========================== */
  /**
   * 「题目列表 + 作答表」→ 状态 / 判定 / 统计 / 错题。
   * 无存储、无 DOM、无副作用；Session 与 Round 的快照视图共用它，
   * 保证“同一轮数据在任何页面、任何时间算出来的数字完全一致”。
   *
   * @param {object[]} questions 本轮题目（顺序即题序）
   * @param {object}   answers   { [questionId]: { picked: string[], submitted: boolean, editing?: boolean } }
   *
   * editing 是「已提交、又被解锁重改」的短暂状态：判分与统计仍按已提交的答案算，
   * 只在界面上把这道题放回可改的样子；再次提交即清掉它（见 Session.reopen / sealEdits）。
   */
  function createModel(questions, answers) {
    var byId = Object.create(null);
    for (var i = 0; i < questions.length; i++) {
      byId[String(questions[i].id)] = questions[i];
    }

    function recordOf(id) {
      var rec = answers[id];
      if (!rec) return { picked: [], submitted: false, editing: false };
      return { picked: rec.picked || [], submitted: !!rec.submitted, editing: !!rec.editing };
    }

    function questionOf(id) {
      return byId[String(id)] || null;
    }

    /** 判定某题“这次作答”的结果；重复调用结果恒定，因为不含任何累计。 */
    function evaluate(id) {
      return Judge.judge(questionOf(id), recordOf(id).picked.slice());
    }

    /** 每题状态：unselected | picked | submitted
     *  「已提交但被解锁重改」仍算 submitted —— 判分与统计只看已提交的答案，
     *  解锁只是界面回到可改的样子（见 recordOf().editing）。 */
    function statusOf(id) {
      var rec = recordOf(id);
      if (rec.submitted) return STATUS.SUBMITTED;
      if (rec.picked.length) return STATUS.PICKED;
      return STATUS.UNSELECTED;
    }

    /** 全部统计都是现算的派生值，没有任何可漂移的计数器。 */
    function stats() {
      var s = {
        total: questions.length,
        scorable: 0,
        submitted: 0,
        answered: 0,
        correct: 0,
        wrong: 0,
        invalid: 0,
        pickedNotSubmitted: 0,
        unselected: 0,
        accuracy: 0,
        coverage: 0,
        allScorableAnswered: false,
      };

      for (var i = 0; i < questions.length; i++) {
        var q = questions[i];
        if (q.scorable !== false) s.scorable++;

        var st = statusOf(q.id);
        if (st === STATUS.SUBMITTED) {
          s.submitted++;
          var outcome = evaluate(q.id).outcome;
          if (outcome === OUTCOME.CORRECT) s.correct++;
          else if (outcome === OUTCOME.WRONG) s.wrong++;
          else if (outcome === OUTCOME.INVALID) s.invalid++;
        } else if (st === STATUS.PICKED) {
          s.pickedNotSubmitted++;
        } else {
          s.unselected++;
        }
      }

      // 已作答 = 已提交且真正判了分的题（异常题不计入）
      s.answered = s.correct + s.wrong;
      s.accuracy = s.answered ? Math.round((s.correct / s.answered) * 100) : 0;
      s.coverage = s.scorable ? Math.round((s.answered / s.scorable) * 100) : 0;
      s.allScorableAnswered = s.answered === s.scorable;
      return s;
    }

    /**
     * 已提交的错题 id（按本轮题序）。
     * 这**就是**“没做对”的唯一口径：
     *   算    已提交且 outcome === 'wrong'
     *   不算  选而未提交 / 完全没碰 / 数据异常题（scorable:false，永远判不出 wrong）
     */
    function wrongIds() {
      var out = [];
      for (var i = 0; i < questions.length; i++) {
        var id = questions[i].id;
        if (statusOf(id) === STATUS.SUBMITTED && evaluate(id).outcome === OUTCOME.WRONG) out.push(id);
      }
      return out;
    }

    return {
      questions: questions,
      questionOf: questionOf,
      recordOf: recordOf,
      evaluate: evaluate,
      statusOf: statusOf,
      stats: stats,
      wrongIds: wrongIds,
    };
  }

  /** 深拷贝作答表；对外的读写一律走副本，防止外部篡改内部状态。 */
  function copyAnswers(answers) {
    var out = {};
    for (var k in answers) {
      if (!Object.prototype.hasOwnProperty.call(answers, k)) continue;
      var v = answers[k];
      if (!v || typeof v !== 'object') continue;
      var rec = { picked: Judge.normalizeKeys(v.picked), submitted: !!v.submitted };
      if (v.editing) rec.editing = true; // 解锁重改的短暂状态也要跨刷新保持
      out[k] = rec;
    }
    return out;
  }

  function normalizeSource(source) {
    if (!source || typeof source !== 'object' || !source.roundId) return null;
    return {
      roundId: String(source.roundId),
      endedAt: typeof source.endedAt === 'string' ? source.endedAt : null,
      wrong: typeof source.wrong === 'number' ? source.wrong : 0,
    };
  }

  /* =========================== 会话 =========================== */
  /**
   * @param {object} bank   题库（含 questions 全量）
   * @param {object} [options]
   * @param {Array}  [options.questionIds] 本轮题号（顺序即题序）；不传 = 全库
   * @param {string} [options.kind]        KIND.NORMAL | KIND.PRACTICE
   * @param {object} [options.source]      重练轮的来源轮次 { roundId, endedAt, wrong }
   * @param {string} [options.storageKey]  进度键；不传 = quiz:progress:<bankKey>（老键，保持不变）
   */
  function Session(bank, options) {
    options = options || {};
    var kind = normalizeKind(options.kind);
    var store = Store.createStore({
      storage: options.storage !== undefined ? options.storage : Store.defaultStorage(),
      key: options.storageKey || progressKey(bank.key),
      version: SCHEMA_VERSION,
    });

    // id -> question 索引，避免每次判题都线性扫描
    var bankById = Object.create(null);
    var bankIds = [];
    for (var bi = 0; bi < bank.questions.length; bi++) {
      bankById[String(bank.questions[bi].id)] = bank.questions[bi];
      bankIds.push(bank.questions[bi].id);
    }

    var restored = store.load();
    // 不串用别的题库进度（老数据里一定带 bankKey）
    var restoredOk = !!restored && (!restored.bankKey || restored.bankKey === bank.key);

    var ids = resolveIds(options.questionIds, restoredOk ? restored.questionIds : null);
    var questions = resolveQuestions(ids);
    var answers = restoreAnswers(restoredOk ? restored : null);
    var index = clampIndex(restoredOk && typeof restored.index === 'number' ? restored.index : 0);
    var startedAt = (restoredOk && typeof restored.startedAt === 'string' && restored.startedAt)
      || new Date().toISOString();
    var source = normalizeSource(options.source || (restoredOk ? restored.source : null));
    // 范围只属于普通轮：重练轮 / 错题练习 / 收藏练习的「范围」就是那几道题，由 source 或 kind 表达
    var scope = kind !== KIND.NORMAL
      ? null
      : Scope.normalize(options.scope || (restoredOk ? restored.scope : null));
    var snapshotId = (restoredOk && typeof restored.snapshotId === 'string' ? restored.snapshotId : null) || null;

    var model = createModel(questions, answers);

    /* ------------------------- 恢复 ------------------------- */

    function resolveIds(explicit, fromStore) {
      var list = explicit || fromStore;
      if (!Array.isArray(list) || !list.length) return bankIds.slice(); // 老数据 / 普通轮 = 全库
      return list.slice();
    }

    function resolveQuestions(idList) {
      var out = [];
      for (var i = 0; i < idList.length; i++) {
        var q = bankById[String(idList[i])];
        if (q) out.push(q); // 题库更新后旧题号可能失效，直接跳过而不是崩掉
      }
      return out;
    }

    function restoreAnswers(parsed) {
      if (!parsed || !parsed.answers || typeof parsed.answers !== 'object') return {};
      return copyAnswers(parsed.answers);
    }
    /* ------------------------- 读写 ------------------------- */

    function isSubset() {
      if (questions.length !== bank.questions.length) return true;
      for (var i = 0; i < questions.length; i++) {
        if (questions[i].id !== bank.questions[i].id) return true;
      }
      return false;
    }

    function persist() {
      var payload = {
        bankKey: bank.key,
        kind: kind,
        index: index,
        answers: answers,
        startedAt: startedAt,
        snapshotId: snapshotId,
        source: source,
        scope: scope,
      };
      // 只有重练轮才存题号：普通轮的键保持老样子，旧代码/旧数据都能读
      if (isSubset()) payload.questionIds = model.questions.map(function (q) { return q.id; });
      store.save(payload);
    }

    function clampIndex(i) {
      var len = questions.length;
      if (!len) return 0;
      if (typeof i !== 'number' || isNaN(i)) return 0;
      if (i < 0) return 0;
      if (i > len - 1) return len - 1;
      return i;
    }

    function currentQuestion() {
      return questions[index] || null;
    }

    /* ------------------------- 变更操作 ------------------------- */

    /** 选择/取消选择。已提交后默认锁定；点过「修改答案」被解锁（editing）的题可以再选。 */
    function pick(key) {
      var q = currentQuestion();
      if (!q || q.scorable === false) return false;

      var rec = answers[q.id] || { picked: [], submitted: false };
      if (rec.submitted && !rec.editing) return false;

      var picked = rec.picked.slice();
      var at = picked.indexOf(key);
      if (q.type === 'multiple') {
        if (at >= 0) picked.splice(at, 1);
        else picked.push(key);
      } else {
        picked = at >= 0 ? [] : [key]; // 单选 / 判断：再点一次取消，选别的则替换
      }
      // 解锁重改期间保留 submitted（统计不动），只把 editing 留着等重新提交
      answers[q.id] = { picked: Judge.normalizeKeys(picked), submitted: !!rec.submitted, editing: !!rec.editing };
      persist();
      return true;
    }

    /**
     * 解锁一道已提交的题（「修改答案」）。交卷前的入口；异常题不可改。
     * 解锁期间判分与统计仍按原来那次提交算，重新提交才重新判定。
     */
    function reopen(id) {
      var q = model.questionOf(id);
      if (!q || q.scorable === false) return false;
      var rec = answers[q.id];
      if (!rec || !rec.submitted || rec.editing) return false;
      answers[q.id] = { picked: rec.picked.slice(), submitted: true, editing: true };
      persist();
      return true;
    }

    /** 交卷前把所有解锁的题重新合上（作答与判分保持现状），避免快照里留下 editing。 */
    function sealEdits() {
      var changed = false;
      for (var k in answers) {
        if (!Object.prototype.hasOwnProperty.call(answers, k)) continue;
        if (answers[k] && answers[k].editing) {
          answers[k] = { picked: answers[k].picked, submitted: !!answers[k].submitted };
          changed = true;
        }
      }
      if (changed) persist();
      return changed;
    }

    /** 提交当前题。幂等：重复提交只是重新判定，不新增任何累计。 */
    function submit() {
      var q = currentQuestion();
      if (!q) return Judge.judge(null, []);

      var rec = answers[q.id] || { picked: [], submitted: false };
      var result = Judge.judge(q, rec.picked);

      if (q.scorable === false) return result; // 异常题不落 submitted
      if (result.outcome === OUTCOME.UNANSWERED) return result; // 未选不能提交

      answers[q.id] = { picked: rec.picked, submitted: true };
      persist();
      return result;
    }

    /** 撤销本题提交，回到“已选未提交”（选择保留） */
    function reset(id) {
      var q = model.questionOf(id);
      if (!q) return false;
      var rec = answers[q.id];
      if (!rec || !rec.submitted) return false;
      answers[q.id] = { picked: rec.picked.slice(), submitted: false };
      persist();
      return true;
    }

    /** 清空本题选择（连选择一起丢） */
    function clear(id) {
      var q = model.questionOf(id);
      if (!q) return false;
      delete answers[q.id];
      persist();
      return true;
    }

    function goTo(i) {
      index = clampIndex(i);
      persist();
      return index;
    }

    var nav = {
      next: function () {
        if (index < questions.length - 1) index++;
        persist();
        return index;
      },
      prev: function () {
        if (index > 0) index--;
        persist();
        return index;
      },
      canPrev: function () { return index > 0; },
      canNext: function () { return index < questions.length - 1; },
      isLast: function () { return index === questions.length - 1; },
    };

    return {
      bank: bank,
      kind: kind,
      get index() { return index; },
      get question() { return currentQuestion(); },
      get questions() { return questions; },
      get questionIds() { return questions.map(function (q) { return q.id; }); },
      get source() { return source; },
      get scope() { return scope; },
      /** 错题练习 / 收藏练习：来源就是种类本身（没有「来自哪一轮」）；其余轮次为 null */
      get origin() { return kind === KIND.WRONGBOOK || kind === KIND.STARS ? kind : null; },
      /** 本轮的给人的范围说明（「全部 120 题」…）；重练轮没有范围，返回空串 */
      scopeLabel: function () { return scope ? Scope.label(bank, scope) : ''; },
      get startedAt() { return startedAt; },
      get snapshotId() { return snapshotId; },
      /** 这个 session 是否有从存储恢复出来的真实进度（重练轮的恢复入口靠它判空） */
      hasPersistedProgress: function () { return restoredOk; },

      statusOf: model.statusOf,
      isSubmitted: function (id) { return model.recordOf(id).submitted; },
      /** 已提交但被「修改答案」解锁：界面回到可改样子，判分/统计仍算原提交 */
      isEditing: function (id) { return model.recordOf(id).editing; },
      pickedOf: function (id) { return model.recordOf(id).picked.slice(); },
      // 对外只给副本，防止外部篡改内部状态
      recordOf: function (id) {
        var rec = model.recordOf(id);
        return { picked: rec.picked.slice(), submitted: rec.submitted, editing: rec.editing };
      },

      evaluate: model.evaluate,
      stats: model.stats,
      wrongIds: model.wrongIds,

      pick: pick,
      submit: submit,
      reset: reset,
      clear: clear,
      reopen: reopen,
      sealEdits: sealEdits,
      goTo: goTo,
      nav: nav,

      persist: persist,
      /** 交卷时由控制器写入：这一轮冻结成了哪份快照（重复交卷不会再造一份） */
      setSnapshotId: function (id) { snapshotId = id ? String(id) : null; persist(); },
      /** 冻结快照时用：作答表的深拷贝 */
      answersCopy: function () { return copyAnswers(answers); },
      /** 清空本次会话的所有进度（供“清空我的全部数据”用） */
      clearAll: function () {
        answers = {};
        index = 0;
        store.clear();
      },
    };
  }

  return {
    Session: Session,
    SCHEMA_VERSION: SCHEMA_VERSION,
    PROGRESS_PREFIX: PROGRESS_PREFIX,
    progressKey: progressKey,
    STATUS: STATUS,
    KIND: KIND,
    normalizeKind: normalizeKind,
    /** 供 js/core/round.js 复用同一套派生逻辑（快照只读视图） */
    createModel: createModel,
    copyAnswers: copyAnswers,
    normalizeSource: normalizeSource,
  };
});
