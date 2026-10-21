/**
 * 本地持久化 —— js/core/store.js
 *
 * 唯一负责“读写本地存储”的模块：所有需要跨刷新保存的东西（答题进度、收藏、设置）
 * 都通过它落地，避免每个功能各写一套 JSON.parse + try/catch。
 *
 * 特点：
 *  - storage 可注入（浏览器用 localStorage，测试用内存假实现）；
 *  - storage 不可用 / 数据损坏 / 版本不符时一律静默降级为空，绝不让页面崩；
 *  - 版本号由调用方提供，用于“旧数据自动作废”。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizStore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * @param {object} opts
   * @param {Storage} [opts.storage]  兼容 localStorage 的对象；不传则纯内存
   * @param {string}  [opts.key]      存储键；不传则纯内存
   * @param {number}  opts.version    数据版本号，不符即视为无效
   */
  function createStore(opts) {
    opts = opts || {};
    var storage = opts.storage || null;
    var key = opts.key || null;
    var version = opts.version;
    var memory = null; // 无 storage 时的内存兜底

    function enabled() {
      return !!(storage && key);
    }

    /** 读取；无效数据一律返回 null（调用方自己决定默认值）。 */
    function load() {
      if (!enabled()) return memory;
      var raw;
      try {
        raw = storage.getItem(key);
      } catch (e) {
        return null; // 隐私模式 / 存储被禁用
      }
      if (!raw) return null;
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        return null; // 坏 JSON
      }
      if (!parsed || typeof parsed !== 'object') return null;
      if (parsed.version !== version) return null; // 版本不符，旧数据作废
      return parsed;
    }

    /** 写入；写不进去（配额满 / 被禁用）不抛错，返回 false。 */
    function save(data) {
      var payload = Object.assign({}, data, { version: version, savedAt: new Date().toISOString() });
      if (!enabled()) {
        memory = payload;
        return true;
      }
      try {
        storage.setItem(key, JSON.stringify(payload));
        return true;
      } catch (e) {
        return false;
      }
    }

    /** 删除该键 */
    function clear() {
      memory = null;
      if (!enabled()) return true;
      try {
        storage.removeItem(key);
        return true;
      } catch (e) {
        return false;
      }
    }

    return { load: load, save: save, clear: clear, enabled: enabled };
  }

  /** 浏览器环境下取 localStorage；不可用时返回 null。 */
  function defaultStorage() {
    try {
      var s = typeof window !== 'undefined' ? window.localStorage : null;
      if (!s) return null;
      var probe = '__quiz_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch (e) {
      return null;
    }
  }

  /**
   * 列出这个 storage 里以 prefix 开头的所有键。
   * 用于「一个前缀对应多条记录」的场景（例如某一轮派生的多个重练进度）；
   * 依然只从本模块访问 storage，别处不要直接摸 localStorage。
   */
  function keysWithPrefix(storage, prefix) {
    var out = [];
    if (!storage || !prefix) return out;
    try {
      for (var i = 0; i < storage.length; i++) {
        var k = storage.key(i);
        if (typeof k === 'string' && k.indexOf(prefix) === 0) out.push(k);
      }
    } catch (e) {
      return out; // 存储被禁用 / 访问抛错：当成没有
    }
    return out;
  }

  return { createStore: createStore, defaultStorage: defaultStorage, keysWithPrefix: keysWithPrefix };
});
