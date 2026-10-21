/**
 * 可选服务端接入 —— js/core/api.js
 *
 * 站点本身是纯静态的：双击 index.html 就全功能可用，没有后端也能用。
 * 这个文件只做一件小事——如果页面是通过 server/server.mjs 打开的，
 * 就把「提交反馈」顺手写进服务端的库里；否则静默什么都不做。
 *
 * 三条铁律：
 * 1. file:// 协议下不发任何请求（没有同源可言，fetch 必然失败，还可能刷报错）；
 * 2. 探活 1.2s 超时，失败就当没有服务端，绝不弹提示、绝不阻塞界面；
 * 3. 本文件不碰判分、统计、轮次、主题、收藏、错题本，也不碰本地反馈箱。
 */
(function (root) {
  'use strict';

  /** 探活接口（相对路径：挂在哪一层都能用） */
  var HEALTH_URL = 'api/health';
  var FEEDBACK_URL = 'api/feedback';
  /** 探活超时：1.2s */
  var PROBE_TIMEOUT = 1200;
  /** 提交超时：5s（写库比探活慢一点是正常的） */
  var SUBMIT_TIMEOUT = 5000;

  /** 前端的问题类型键 → 服务端的取值 */
  var KIND_CN = {
    stem: '题干有误',
    option: '选项有误',
    answer: '答案有误',
    explain: '解析有误',
    other: '其他',
  };

  var state = {
    /** 探活是否已经有结论（无论在线还是离线） */
    settled: false,
    /** 服务端是否可用 */
    online: false,
    /** 探活中的 Promise，避免重复请求 */
    pending: null,
  };

  /** 当前环境能不能发请求：file:// 一律不发 */
  function canRequest() {
    if (typeof fetch !== 'function') return false;
    var loc = root.location;
    if (!loc || !loc.protocol) return false;
    if (loc.protocol === 'file:') return false;
    return loc.protocol === 'http:' || loc.protocol === 'https:';
  }

  function abortController() {
    return typeof AbortController === 'function' ? new AbortController() : null;
  }

  /** 带超时的 fetch；超时/网络错误/中止都当成 null，绝不抛 */
  function fetchWithTimeout(url, options, timeout) {
    return new Promise(function (resolve) {
      var ctrl = abortController();
      var done = false;
      var timer = null;

      function end(value) {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        resolve(value);
      }

      timer = setTimeout(function () {
        if (ctrl) {
          try {
            ctrl.abort();
          } catch (e) {
            /* 老浏览器没有 abort 就算了 */
          }
        }
        end(null);
      }, timeout);

      var opts = {};
      for (var k in options) if (Object.prototype.hasOwnProperty.call(options, k)) opts[k] = options[k];
      if (ctrl) opts.signal = ctrl.signal;

      fetch(url, opts).then(
        function (res) {
          end(res);
        },
        function () {
          end(null);
        }
      );
    });
  }

  /**
   * 探活：服务端在不在。
   * 已经有结论就直接返回；正在探就复用同一个 Promise；file:// 立即 false。
   * @returns {Promise<boolean>}
   */
  function probe() {
    if (state.pending) return state.pending;
    if (state.settled) return Promise.resolve(state.online);
    if (!canRequest()) {
      state.settled = true;
      state.online = false;
      state.pending = Promise.resolve(false);
      return state.pending;
    }
    state.pending = fetchWithTimeout(
      HEALTH_URL,
      { method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' } },
      PROBE_TIMEOUT
    ).then(function (res) {
      if (!res || !res.ok) {
        state.settled = true;
        state.online = false;
        return false;
      }
      return res
        .json()
        .then(function (json) {
          state.settled = true;
          state.online = !!(json && json.ok);
          return state.online;
        })
        .catch(function () {
          state.settled = true;
          state.online = false;
          return false;
        });
    });
    return state.pending;
  }

  /** 服务端是否已经确认可用（没探过 / 探失败都是 false，同步判断用） */
  function online() {
    return state.settled && state.online;
  }

  /** 把面板里的字段折成服务端要的形状 */
  function toPayload(fields) {
    fields = fields || {};
    var picked = fields.picked;
    var answer = fields.answer;
    return {
      bankKey: String(fields.bankKey || ''),
      bankTitle: String(fields.bankTitle || ''),
      questionId: Number(fields.questionId),
      kind: KIND_CN[fields.kind] || KIND_CN.other,
      note: String(fields.note || ''),
      picked: Array.isArray(picked) ? picked.map(String) : [],
      answer: Array.isArray(answer) ? answer.map(String) : [],
      page: String(fields.page || 'quiz'),
    };
  }

  /**
   * 提交一条反馈到服务端。
   * 只有在探活成功（online()）时才真的发请求；任何失败都返回 false，由调用方回落本地。
   * @returns {Promise<boolean>}
   */
  function submitFeedback(fields) {
    if (!online()) return Promise.resolve(false);
    return fetchWithTimeout(
      FEEDBACK_URL,
      {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(toPayload(fields)),
      },
      SUBMIT_TIMEOUT
    ).then(function (res) {
      if (!res || !res.ok) return false;
      return res
        .json()
        .then(function (json) {
          return !!(json && json.ok);
        })
        .catch(function () {
          return false;
        });
    });
  }

  root.QuizApi = {
    HEALTH_URL: HEALTH_URL,
    FEEDBACK_URL: FEEDBACK_URL,
    PROBE_TIMEOUT: PROBE_TIMEOUT,
    canRequest: canRequest,
    probe: probe,
    online: online,
    toPayload: toPayload,
    submitFeedback: submitFeedback,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
