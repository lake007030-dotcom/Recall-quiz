/**
 * 主题（三态：跟随系统 / 亮色 / 暗色）—— js/core/theme.js
 *
 * 唯一职责：记住「用户选的是哪种模式」，把它解析成「现在实际是浅色还是深色」，
 * 再落到 <html data-theme="light|dark">。
 *  - 存储只走 js/core/store.js（键 quiz:theme，值是 { theme: 'system' | 'light' | 'dark' }）
 *  - 旧值 'light' / 'dark' 继续认；缺失 / 坏数据 / 其它值一律当 'system'
 *  - 'system' 时用 prefers-color-scheme 解析；变化时由 app.js 监听并重新 apply
 *  - 样式只在 css/styles.css 的 :root[data-theme="dark"] 里覆盖变量，组件类不改
 *
 * 这个文件在 index.html 的 <head> 里就加载，加载即生效，避免首屏先闪一下浅色。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./store.js'));
  } else {
    root.QuizTheme = factory(root.QuizStore);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Store) {
  'use strict';

  var KEY = 'quiz:theme';
  var SCHEMA_VERSION = 1;
  var SYSTEM = 'system';
  var LIGHT = 'light';
  var DARK = 'dark';
  var MODES = [SYSTEM, LIGHT, DARK];

  function createStore(storage) {
    return Store.createStore({
      storage: storage || Store.defaultStorage(),
      key: KEY,
      version: SCHEMA_VERSION,
    });
  }

  /** 只认三个合法值；缺失 / 非法 / 坏数据一律当「跟随系统」 */
  function normalize(mode) {
    return MODES.indexOf(mode) >= 0 ? mode : SYSTEM;
  }

  function load(storage) {
    var data = null;
    try {
      data = createStore(storage).load();
    } catch (e) {
      data = null;
    }
    return normalize(data && data.theme);
  }

  function save(mode, storage) {
    var m = normalize(mode);
    try {
      createStore(storage).save({ theme: m });
    } catch (e) {
      /* 存不了就只影响下次打开，当前这次照常切换 */
    }
    return m;
  }

  /** 系统偏好（拿不到 matchMedia 的旧环境按浅色算） */
  function prefersDark(win) {
    var w = win || (typeof window !== 'undefined' ? window : null);
    if (!w || typeof w.matchMedia !== 'function') return false;
    try {
      return w.matchMedia('(prefers-color-scheme: dark)').matches === true;
    } catch (e) {
      return false;
    }
  }

  /** 模式 → 实际生效的主题：'light' | 'dark'。三态里只有 system 需要看系统偏好。 */
  function resolve(mode, win) {
    var m = normalize(mode);
    if (m === DARK) return DARK;
    if (m === LIGHT) return LIGHT;
    return prefersDark(win) ? DARK : LIGHT;
  }

  function isDark(mode, win) {
    return resolve(mode, win) === DARK;
  }

  /** 兼容旧调用：在「亮 / 暗」两态之间翻（不产生 system） */
  function toggle(mode, win) {
    return isDark(mode, win) ? LIGHT : DARK;
  }

  /**
   * 把主题落到文档上。data-theme 写解析后的 'light' / 'dark'（CSS 与自测都读它），
   * data-theme-mode 写用户选的三态（便于自测与排查），color-scheme 与 theme-color 跟着走。
   */
  function apply(mode, doc, win) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    var m = normalize(mode);
    var t = resolve(m, win);
    if (!d || !d.documentElement) return t;

    d.documentElement.setAttribute('data-theme', t);
    d.documentElement.setAttribute('data-theme-mode', m);
    // 让浏览器原生控件（滚动条、表单）跟着换，深浅都不会出现白底控件
    d.documentElement.style.colorScheme = t === DARK ? 'dark' : 'light';

    // 手机地址栏配色跟着变
    var meta = d.querySelector ? d.querySelector('meta[name="theme-color"]') : null;
    if (meta) meta.setAttribute('content', t === DARK ? '#2f3339' : '#e0e5ec');

    return t;
  }

  var Api = {
    KEY: KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    SYSTEM: SYSTEM,
    LIGHT: LIGHT,
    DARK: DARK,
    MODES: MODES,
    normalize: normalize,
    prefersDark: prefersDark,
    resolve: resolve,
    isDark: isDark,
    toggle: toggle,
    createStore: createStore,
    load: load,
    save: save,
    apply: apply,
  };

  // 加载即生效：<head> 里执行，赶在首屏绘制之前
  if (typeof document !== 'undefined' && document.documentElement) {
    apply(load());
  }

  return Api;
});
