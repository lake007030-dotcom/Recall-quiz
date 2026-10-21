/**
 * 轮次快照 —— js/core/round.js
 *
 * 一轮 = 一组题目 + 这一轮的作答。交卷时把这一轮**冻结成一份只读快照**存下来：
 *
 *   {
 *     schema, id, bankKey, bankTitle,
 *     questionIds: [题号...],                 // 顺序即题序，重练轮沿用它
 *     answers: { [题号]: {picked, submitted} },// 逐题作答与判定的原始事实
 *     stats: { total, correct, wrong, ... },   // 交卷那一刻的派生统计（冻结数字）
 *     startedAt, finishedAt,
 *     source: { roundId, endedAt, wrong } | null  // 重练轮：来自哪一轮
 *   }
 *
 * 三条纪律：
 *  1) 快照只读：写入前深冻结（Object.freeze 递归），任何后续操作都改不动它；
 *     从存储读回来也重新冻结一次，防止被当成普通对象随意写。
 *  2) 快照里的数字是**交卷那一刻**算出来的；之后原轮再怎么重练、再看，
 *     都按快照里的数字显示 —— 这就是“原轮记录原样保留”的实现方式。
 *  3) 存储只走 Store：`quiz:rounds:<bankKey>` 存全部快照（追加式，旧的不改），
 *     `quiz:practice:<bankKey>:<roundId>` 存由该轮派生的重练轮进度。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./judge.js'), require('./store.js'), require('./session.js'), require('./scope.js'));
  } else {
    root.QuizRound = factory(root.QuizJudge, root.QuizStore, root.QuizSession, root.QuizScope);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Judge, Store, Session, Scope) {
  'use strict';

  var SCHEMA_VERSION = 1;
  var ROUNDS_PREFIX = 'quiz:rounds:';
  var PRACTICE_PREFIX = 'quiz:practice:';
  // 错题练习 / 收藏练习的进度键（这两种轮没有「来自哪一轮」，所以不能挂在本轮 id 上）
  var POOL_PREFIX = 'quiz:pool:';

  /** 轮次快照的存储键（每个题库一份） */
  function roundsKey(bankKey) {
    return ROUNDS_PREFIX + bankKey;
  }

  /** 由某一轮派生的重练轮的进度键：派生轮与原轮一一对应 */
  function practiceKey(bankKey, roundId) {
    return PRACTICE_PREFIX + bankKey + ':' + roundId;
  }

  /** 错题练习 / 收藏练习的进度键：每个题库每种练习各一条（重开就覆盖） */
  function poolKey(bankKey, kind) {
    return POOL_PREFIX + bankKey + ':' + kind;
  }

  /** origin 只有这两种取值；其余（含老快照）一律 null */
  function normalizeOrigin(v) {
    if (v === Session.KIND.WRONGBOOK || v === Session.KIND.STARS) return v;
    return null;
  }

  /** 快照原本属于哪一类轮（老快照没有 origin，只能靠 source 区分普通轮 / 重练轮） */
  function snapshotKind(snap) {
    if (snap.origin) return Session.normalizeKind(snap.origin);
    return snap.source ? Session.KIND.PRACTICE : Session.KIND.NORMAL;
  }

  function newId() {
    return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** 递归冻结：数组、普通对象都冻上；其余值原样返回。 */
  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) deepFreeze(value[keys[i]]);
    return value;
  }

  function questionMap(bank) {
    var byId = Object.create(null);
    for (var i = 0; i < bank.questions.length; i++) {
      byId[String(bank.questions[i].id)] = bank.questions[i];
    }
    return byId;
  }

  /**
   * 冻结一轮。
   * @param {object} opts
   * @param {object} opts.bank
   * @param {Array}  opts.questionIds  本轮题号（顺序即题序）
   * @param {object} opts.answers      本轮作答表
   * @param {string} [opts.startedAt]  这一轮开始时间（ISO）
   * @param {string} [opts.finishedAt] 交卷时间（ISO），不传=现在
   * @param {object} [opts.source]     重练轮的来源 { roundId, endedAt, wrong }
   * @param {string} [opts.origin]     错题练习 / 收藏练习的来历（'wrongbook' | 'stars'）
   * @param {string} [opts.id]         复用已有 id（重复交卷时不造新快照）
   */
  function create(opts) {
    opts = opts || {};
    var bank = opts.bank;
    if (!bank || !Array.isArray(bank.questions)) throw new Error('Round.create: 缺少题库');

    var byId = questionMap(bank);
    var ids = [];
    var list = Array.isArray(opts.questionIds) ? opts.questionIds : [];
    for (var i = 0; i < list.length; i++) {
      if (byId[String(list[i])]) ids.push(byId[String(list[i])].id);
    }

    var all = Session.copyAnswers(opts.answers || {});
    var answers = {};
    for (var j = 0; j < ids.length; j++) {
      var rec = all[String(ids[j])];
      if (!rec) continue;
      // 快照只留事实（选了什么、是否已提交）；「解锁重改」是过程状态，不进快照
      answers[String(ids[j])] = { picked: rec.picked, submitted: rec.submitted };
    }

    var questions = ids.map(function (id) { return byId[String(id)]; });
    var model = Session.createModel(questions, answers);

    var snapshot = {
      schema: SCHEMA_VERSION,
      id: opts.id || newId(),
      bankKey: bank.key,
      bankTitle: bank.title || bank.key,
      questionIds: ids,
      answers: answers,
      stats: model.stats(),
      startedAt: opts.startedAt || null,
      finishedAt: opts.finishedAt || new Date().toISOString(),
      source: Session.normalizeSource(opts.source),
      // 范围（全部/章节/随机 N）随快照一起冻结：记录页与只读结果页显示的就是它
      scope: opts.scope ? Scope.normalize(opts.scope) : null,
    };
    // 错题练习 / 收藏练习才有 origin；普通轮 / 重练轮不写这个字段（快照形状保持原样）
    var origin = normalizeOrigin(opts.origin);
    if (origin) snapshot.origin = origin;

    return deepFreeze(snapshot);
  }

  /** 由当前 session 冻结一轮（交卷时调用） */
  function fromSession(session, opts) {
    opts = opts || {};
    return create({
      bank: session.bank,
      questionIds: session.questionIds,
      answers: session.answersCopy(),
      startedAt: session.startedAt,
      finishedAt: opts.finishedAt,
      source: opts.source !== undefined ? opts.source : session.source,
      scope: session.scope,
      origin: session.origin,
      id: opts.id || session.snapshotId || undefined,
    });
  }

  /**
   * 快照仓库：追加式写入，已存在的 id 直接视为成功（幂等，重复交卷不重复造）。
   */
  function roundStore(bankKey, storage) {
    var store = Store.createStore({
      storage: storage !== undefined ? storage : Store.defaultStorage(),
      key: roundsKey(bankKey),
      version: SCHEMA_VERSION,
    });

    function list() {
      var data = store.load();
      var arr = data && Array.isArray(data.rounds) ? data.rounds : [];
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] && typeof arr[i] === 'object') out.push(deepFreeze(arr[i]));
      }
      return out;
    }

    function get(id) {
      var arr = list();
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === id) return arr[i];
      }
      return null;
    }

    function append(snapshot) {
      if (!snapshot || !snapshot.id) return false;
      var arr = list();
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].id === snapshot.id) return true; // 已经存过，不覆盖（只读）
      }
      arr.push(snapshot);
      return store.save({ rounds: arr });
    }

    return {
      list: list,
      get: get,
      append: append,
      last: function () { var a = list(); return a.length ? a[a.length - 1] : null; },
      size: function () { return list().length; },
      clear: store.clear,
      enabled: store.enabled,
      key: roundsKey(bankKey),
    };
  }

  /** 重练轮进度仓库（一轮一条） */
  function practiceStore(bankKey, roundId, storage) {
    return Store.createStore({
      storage: storage !== undefined ? storage : Store.defaultStorage(),
      key: practiceKey(bankKey, roundId),
      version: Session.SCHEMA_VERSION,
    });
  }

  /**
   * 快照 → 只读会话视图：API 与 Session 一致，所以结果页/答题页不用为历史记录写第二套渲染。
   * 统计用快照里冻结的数字（原样复现），判定仍走同一套 Judge。
   */
  function view(snapshot, bank) {
    var byId = questionMap(bank);
    var questions = [];
    for (var i = 0; i < snapshot.questionIds.length; i++) {
      var q = byId[String(snapshot.questionIds[i])];
      if (q) questions.push(q);
    }
    var answers = Session.copyAnswers(snapshot.answers || {});
    var model = Session.createModel(questions, answers);

    function readOnly() { return false; }

    return {
      bank: bank,
      kind: 'snapshot',
      isSnapshot: true,
      snapshot: snapshot,
      /** 这份快照原本是哪一类轮（普通 / 重练 / 错题练习 / 收藏练习） */
      roundKind: snapshotKind(snapshot),
      /** 错题练习 / 收藏练习的来历；其余为 null */
      get origin() { return snapshot.origin || null; },
      questions: questions,
      get index() { return 0; },
      get question() { return questions[0] || null; },
      get questionIds() { return questions.map(function (q) { return q.id; }); },
      get source() { return snapshot.source; },
      get startedAt() { return snapshot.startedAt; },
      get finishedAt() { return snapshot.finishedAt; },
      get snapshotId() { return snapshot.id; },
      /** 快照冻结的范围说明（历史结果页「复制成绩」用） */
      scopeLabel: function () { return snapshot.scope ? Scope.label(bank, snapshot.scope) : ''; },

      statusOf: model.statusOf,
      isSubmitted: function (id) { return model.recordOf(id).submitted; },
      pickedOf: function (id) { return model.recordOf(id).picked.slice(); },
      recordOf: function (id) {
        var rec = model.recordOf(id);
        return { picked: rec.picked.slice(), submitted: rec.submitted };
      },

      evaluate: model.evaluate,
      // 交卷那一刻的统计被冻结下来，之后无论怎么重练、看几次都不变
      stats: function () { return snapshot.stats || model.stats(); },
      wrongIds: model.wrongIds,

      pick: readOnly,
      submit: function () { return { outcome: Judge.OUTCOME.INVALID, correct: [], picked: [] }; },
      reset: readOnly,
      clear: readOnly,
      goTo: function () { return 0; },
      nav: {
        next: function () { return 0; },
        prev: function () { return 0; },
        canPrev: function () { return false; },
        canNext: function () { return false; },
        isLast: function () { return questions.length <= 1; },
      },

      persist: function () {},
      setSnapshotId: function () {},
      answersCopy: function () { return Session.copyAnswers(answers); },
      hasPersistedProgress: function () { return true; },
      clearAll: function () {},
    };
  }

  /* =========================== 练习记录 =========================== */
  /**
   * 「练习记录」= 已完成的一轮（快照） + 进行中的一轮（普通轮 / 重练轮的进度）。
   *
   * 三种记录的区别只在数据来源，字段是统一的一套；数字一律来自
   * createModel（进行中）或快照里冻结的 stats（已完成），视图不另算。
   *   key      'round:<快照id>' | 'normal' | 'practice:<原轮id>'  —— 稳定标识，视图拿来定位
   *   status   'done' | 'active'
   *   kind     'normal' | 'practice'
   */
  function snapshotRecord(bank, snap) {
    var st = snap.stats || {};
    var ids = Array.isArray(snap.questionIds) ? snap.questionIds : [];
    return {
      key: 'round:' + snap.id,
      status: 'done',
      kind: snapshotKind(snap),
      snapshotId: snap.id,
      sourceRoundId: snap.source ? snap.source.roundId : null,
      source: snap.source || null,
      scope: snap.scope || null,
      scopeLabel: snap.scope ? Scope.label(bank, snap.scope) : '',
      startedAt: snap.startedAt || null,
      finishedAt: snap.finishedAt || null,
      at: snap.finishedAt || snap.startedAt || null,
      total: ids.length,
      scorable: typeof st.scorable === 'number' ? st.scorable : ids.length,
      answered: st.answered || 0,
      correct: st.correct || 0,
      wrong: st.wrong || 0,
      accuracy: st.accuracy || 0,
    };
  }

  function activeRecord(fields) {
    return {
      key: fields.key,
      status: 'active',
      kind: fields.kind,
      snapshotId: null,
      sourceRoundId: fields.sourceRoundId || null,
      source: fields.source || null,
      scope: fields.scope || null,
      scopeLabel: fields.scopeLabel || '',
      startedAt: fields.startedAt || null,
      finishedAt: null,
      at: fields.startedAt || null,
      total: fields.total,
      scorable: fields.scorable,
      answered: fields.answered,
      correct: fields.correct,
      wrong: fields.wrong,
      accuracy: fields.accuracy,
    };
  }

  /** 进行中的普通轮（老键 quiz:progress:，范围可能是全部 / 章节 / 随机 N） */
  function normalActiveRecord(bank, storage) {
    var data = Store.createStore({
      storage: storage,
      key: Session.progressKey(bank.key),
      version: Session.SCHEMA_VERSION,
    }).load();
    if (!data || !data.answers || !Object.keys(data.answers).length) return null;
    if (data.snapshotId) return null; // 已交卷：由那条快照代表，不再单列一条「进行中」

    // 范围内的轮次把题号一起存了下来；老数据没有题号 = 全库
    var byId = questionMap(bank);
    var ids = Array.isArray(data.questionIds) ? data.questionIds : [];
    var questions = [];
    if (ids.length) {
      for (var i = 0; i < ids.length; i++) {
        if (byId[String(ids[i])]) questions.push(byId[String(ids[i])]);
      }
    } else {
      questions = bank.questions;
    }
    if (!questions.length) return null;

    var st = Session.createModel(questions, Session.copyAnswers(data.answers)).stats();
    var scope = Scope.normalize(data.scope);
    return activeRecord({
      key: 'normal',
      kind: Session.KIND.NORMAL,
      scope: scope,
      scopeLabel: Scope.label(bank, scope),
      startedAt: data.startedAt || null,
      total: questions.length,
      scorable: st.scorable,
      answered: st.answered,
      correct: st.correct,
      wrong: st.wrong,
      accuracy: st.accuracy,
      index: data.index || 0,
    });
  }

  /** 进行中的重练轮（quiz:practice:<题库>:<原轮id>，可能有多个） */
  function practiceActiveRecords(bank, storage) {
    var byId = questionMap(bank);
    var prefix = PRACTICE_PREFIX + bank.key + ':';
    var keys = Store.keysWithPrefix(storage, prefix);
    var out = [];
    for (var i = 0; i < keys.length; i++) {
      var roundId = keys[i].slice(prefix.length);
      if (!roundId) continue;
      var data = Store.createStore({
        storage: storage,
        key: keys[i],
        version: Session.SCHEMA_VERSION,
      }).load();
      if (!data || data.snapshotId) continue; // 交过卷的由快照代表
      var ids = Array.isArray(data.questionIds) ? data.questionIds : [];
      var questions = [];
      for (var j = 0; j < ids.length; j++) {
        if (byId[String(ids[j])]) questions.push(byId[String(ids[j])]);
      }
      if (!questions.length) continue;
      var answers = Session.copyAnswers(data.answers || {});
      var st = Session.createModel(questions, answers).stats();
      out.push(activeRecord({
        key: 'practice:' + roundId,
        kind: Session.KIND.PRACTICE,
        sourceRoundId: roundId,
        source: Session.normalizeSource(data.source) || { roundId: String(roundId), endedAt: null, wrong: questions.length },
        startedAt: data.startedAt || null,
        total: questions.length,
        scorable: st.scorable,
        answered: st.answered,
        correct: st.correct,
        wrong: st.wrong,
        accuracy: st.accuracy,
        index: data.index || 0,
      }));
    }
    return out;
  }

  /**
   * 进行中的错题练习 / 收藏练习（quiz:pool:<题库>:<kind>，每个题库每种练习各一条）。
   * 这两种轮没有「来自哪一轮」，所以 kind 就是它的来源标记。
   */
  function poolActiveRecords(bank, storage) {
    var byId = questionMap(bank);
    var prefix = POOL_PREFIX + bank.key + ':';
    var keys = Store.keysWithPrefix(storage, prefix);
    var out = [];
    for (var i = 0; i < keys.length; i++) {
      var kind = Session.normalizeKind(keys[i].slice(prefix.length));
      if (kind !== Session.KIND.WRONGBOOK && kind !== Session.KIND.STARS) continue;
      var data = Store.createStore({
        storage: storage,
        key: keys[i],
        version: Session.SCHEMA_VERSION,
      }).load();
      if (!data || data.snapshotId) continue; // 交过卷的由快照代表
      var ids = Array.isArray(data.questionIds) ? data.questionIds : [];
      var questions = [];
      for (var j = 0; j < ids.length; j++) {
        if (byId[String(ids[j])]) questions.push(byId[String(ids[j])]);
      }
      if (!questions.length) continue;
      var st = Session.createModel(questions, Session.copyAnswers(data.answers || {})).stats();
      out.push(activeRecord({
        key: 'pool:' + kind,
        kind: kind,
        sourceRoundId: null,
        source: null,
        scope: null,
        scopeLabel: '',
        startedAt: data.startedAt || null,
        total: questions.length,
        scorable: st.scorable,
        answered: st.answered,
        correct: st.correct,
        wrong: st.wrong,
        accuracy: st.accuracy,
        index: data.index || 0,
      }));
    }
    return out;
  }

  /** 某题库的全部练习记录，按时间倒序（进行中排最前也能被时间规则覆盖，所以按时间统一排） */
  function records(bank, storage) {
    var st = storage !== undefined ? storage : Store.defaultStorage();
    var out = [];
    var snaps = roundStore(bank.key, st).list();
    for (var i = 0; i < snaps.length; i++) out.push(snapshotRecord(bank, snaps[i]));
    var normal = normalActiveRecord(bank, st);
    if (normal) out.push(normal);
    out = out.concat(practiceActiveRecords(bank, st));
    out = out.concat(poolActiveRecords(bank, st));

    out.sort(function (a, b) {
      var x = a.at || '';
      var y = b.at || '';
      if (x === y) return 0;
      return x < y ? 1 : -1; // 新的在前
    });
    return out;
  }

  /** 按记录 key 取一条（视图点某一行时用；找不到返回 null） */
  function findRecord(bank, key, storage) {
    var arr = records(bank, storage);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].key === key) return arr[i];
    }
    return null;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    ROUNDS_PREFIX: ROUNDS_PREFIX,
    PRACTICE_PREFIX: PRACTICE_PREFIX,
    POOL_PREFIX: POOL_PREFIX,
    roundsKey: roundsKey,
    practiceKey: practiceKey,
    poolKey: poolKey,
    snapshotKind: snapshotKind,
    newId: newId,
    deepFreeze: deepFreeze,
    create: create,
    fromSession: fromSession,
    roundStore: roundStore,
    practiceStore: practiceStore,
    view: view,
    records: records,
    findRecord: findRecord,
  };
});
