/**
 * 反馈箱 —— js/core/feedback.js
 *
 * 纯数据模型：题目纠错反馈的增删改查。只从 js/core/store.js 读写本地存储，
 * 不碰 DOM、不拼文案（复制文本的格式在 js/ui/copy.js 的 FEEDBACK_TEXT）。
 *
 * 为什么只存本机：这是纯静态、不联网的站点，没有后端可提交。
 * 所以「上报」= 一键复制成一段人可读文本，由使用者自己贴给维护者。
 *
 * 存储键：quiz:feedback（只有一个键，整箱一个数组）
 * 坏数据（JSON 坏掉 / 版本不符 / 形状不对）一律当成空箱，绝不让页面崩。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./store.js'));
  else root.QuizFeedback = factory(root.QuizStore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Store) {
  'use strict';

  var KEY = 'quiz:feedback';
  var SCHEMA_VERSION = 1;
  /** 问题类型（键值；中文名在 js/ui/copy.js 的 FEEDBACK_KIND_CN） */
  var KINDS = ['stem', 'option', 'answer', 'explain', 'other'];
  /** 备注上限：超出直接截断，不报错 */
  var NOTE_MAX = 200;
  /** 题干摘要长度（前 N 字） */
  var STEM_MAX = 40;
  /** 一箱最多留多少条，防止 localStorage 被撑爆 */
  var MAX_ITEMS = 200;

  function createStore(storage) {
    return Store.createStore({ storage: storage || Store.defaultStorage(), key: KEY, version: SCHEMA_VERSION });
  }

  function text(v) {
    return v === null || v === undefined ? '' : String(v);
  }

  function letters(v) {
    if (!v) return [];
    if (typeof v === 'string') return v ? [v] : [];
    var out = [];
    for (var i = 0; i < v.length; i++) out.push(text(v[i]));
    return out;
  }

  /** 题干摘要：前 40 字，超了加省略号 */
  function summary(stem) {
    var s = text(stem).replace(/\s+/g, ' ').trim();
    return s.length > STEM_MAX ? s.slice(0, STEM_MAX) + '…' : s;
  }

  function clipNote(note) {
    var s = text(note).trim();
    return s.length > NOTE_MAX ? s.slice(0, NOTE_MAX) : s;
  }

  function normalize(item) {
    if (!item || typeof item !== 'object') return null;
    var kind = KINDS.indexOf(item.kind) >= 0 ? item.kind : 'other';
    var status = item.status === 'copied' ? 'copied' : 'pending';
    var id = text(item.id);
    if (!id) return null;
    return {
      id: id,
      at: text(item.at),
      bankKey: text(item.bankKey),
      bankTitle: text(item.bankTitle),
      questionId: item.questionId === null || item.questionId === undefined ? null : item.questionId,
      index: Number(item.index) > 0 ? Number(item.index) : 0,
      qtype: text(item.qtype),
      stem: text(item.stem),
      picked: letters(item.picked),
      answer: letters(item.answer),
      page: text(item.page) || 'quiz',
      kind: kind,
      note: clipNote(item.note),
      status: status,
    };
  }

  function readRaw(storage) {
    var data = createStore(storage).load();
    if (!data || !Array.isArray(data.items)) return [];
    var out = [];
    for (var i = 0; i < data.items.length; i++) {
      var n = normalize(data.items[i]);
      if (n) out.push(n);
    }
    return out;
  }

  function writeRaw(storage, items) {
    return createStore(storage).save({ items: items });
  }

  /** 按时间倒序（新的在上）；同一时刻的保持写入顺序 */
  function sortDesc(items) {
    return items.slice().sort(function (a, b) {
      if (a.at === b.at) return 0;
      return a.at < b.at ? 1 : -1;
    });
  }

  function list(storage) {
    return sortDesc(readRaw(storage));
  }

  function get(storage, id) {
    var items = readRaw(storage);
    for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
    return null;
  }

  function newId() {
    return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /**
   * 追加一条反馈。
   * fields: { bankKey, bankTitle, questionId, index, qtype, stem, picked, answer, page, kind, note }
   * 返回写入后的记录；字段不全（没有题库或题号）时返回 null。
   */
  function add(storage, fields) {
    fields = fields || {};
    if (!text(fields.bankKey) || fields.questionId === null || fields.questionId === undefined) return null;

    var rec = normalize({
      id: newId(),
      at: new Date().toISOString(),
      bankKey: fields.bankKey,
      bankTitle: fields.bankTitle,
      questionId: fields.questionId,
      index: fields.index,
      qtype: fields.qtype,
      stem: summary(fields.stem),
      picked: fields.picked,
      answer: fields.answer,
      page: fields.page,
      kind: fields.kind,
      note: fields.note,
      status: 'pending',
    });
    if (!rec) return null;

    var items = list(storage);
    items.unshift(rec);
    if (items.length > MAX_ITEMS) items = items.slice(0, MAX_ITEMS);
    return writeRaw(storage, items) ? rec : null;
  }

  /** 标记为已复制（复制成功后调用；不影响内容） */
  function markCopied(storage, ids) {
    var set = {};
    var arr = typeof ids === 'string' ? [ids] : ids || [];
    for (var i = 0; i < arr.length; i++) set[arr[i]] = true;
    var items = readRaw(storage);
    var changed = false;
    for (var j = 0; j < items.length; j++) {
      if (set[items[j].id] && items[j].status !== 'copied') {
        items[j].status = 'copied';
        changed = true;
      }
    }
    if (changed) writeRaw(storage, sortDesc(items));
    return changed;
  }

  function remove(storage, id) {
    var items = readRaw(storage);
    var kept = [];
    var removed = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === String(id)) removed = true;
      else kept.push(items[i]);
    }
    if (removed) writeRaw(storage, sortDesc(kept));
    return removed;
  }

  function clear(storage) {
    return createStore(storage).clear();
  }

  /** 待上报（status === 'pending'）的条数：首页入口的角标用它 */
  function pendingCount(storage) {
    var items = readRaw(storage);
    var n = 0;
    for (var i = 0; i < items.length; i++) if (items[i].status === 'pending') n++;
    return n;
  }

  return {
    KEY: KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    KINDS: KINDS,
    NOTE_MAX: NOTE_MAX,
    STEM_MAX: STEM_MAX,
    MAX_ITEMS: MAX_ITEMS,
    createStore: createStore,
    list: list,
    get: get,
    add: add,
    markCopied: markCopied,
    remove: remove,
    clear: clear,
    pendingCount: pendingCount,
    summary: summary,
  };
});
