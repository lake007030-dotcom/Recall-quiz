/**
 * 视图：题目反馈面板 + 反馈箱 —— js/ui/view-feedback.js
 *
 * 只负责渲染。反馈的增删改查在 js/core/feedback.js，复制文本格式在 js/ui/copy.js
 * （Copy.FB_TEXT），事件与状态在 js/app.js。
 */
(function (root) {
  'use strict';

  var Copy = root.QuizCopy;
  var esc = root.QuizRich.escapeHtml;

  /** 小旗图标：内联 SVG，不依赖外部资源 */
  var FLAG =
    '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">' +
    '<path d="M3.2 2h9.6v8.4H6.6L3.2 13.4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>' +
    '</svg>';

  /**
   * 轻量反馈入口（答题页题目卡片底部 / 结果页错题行）
   * @param {string|number} qid  题库里的题目 id
   * @param {'quiz'|'result'} page 当前页面
   */
  function link(qid, page) {
    return (
      '<button type="button" class="fb-link" data-fb="' + esc(String(qid)) + '"' +
      ' data-fb-page="' + esc(page) + '" aria-label="' + esc(Copy.FB_PANEL_TITLE) + '">' +
      FLAG + '<span>' + esc(Copy.FB_ENTRY) + '</span>' +
      '</button>'
    );
  }

  function infoRow(key, value) {
    return (
      '<div class="fb-info__row">' +
      '<span class="fb-info__key">' + esc(key) + '</span>' +
      '<span class="fb-info__val num">' + esc(value) + '</span>' +
      '</div>'
    );
  }

  function letters(list) {
    return list && list.length ? list.join('、') : '';
  }

  /** 面板的「定位信息」：题库 / 题号 / 题型 / 题干摘要 / 我的选择 / 当前答案 / 页面 / 时间 */
  function infoBlock(info) {
    var html = '<div class="fb-info">';
    html += infoRow(Copy.FB_BANK, info.bankTitle || info.bankKey);
    html += infoRow(Copy.FB_NO, '第 ' + info.questionId + ' 题');
    html += infoRow(Copy.FB_TYPE, Copy.TYPE_NAME(info.qtype));
    html += infoRow(Copy.FB_STEM, info.stem || '—');
    html += infoRow(Copy.FB_PICKED, letters(info.picked) || Copy.FB_NONE);
    html += infoRow(Copy.FB_ANSWER, letters(info.answer) || '—');
    html += infoRow(Copy.FB_PAGE, Copy.FB_PAGE_NAME(info.page));
    html += infoRow(Copy.FB_TIME, Copy.FB_WHEN(info.at));
    html += '</div>';
    return html;
  }

  /**
   * 反馈面板。
   * ctx: { info, kinds, kind, note, noteMax, saved(number|null), copyHint }
   *  - saved 为 null：填写态；否则是提交成功态（显示已记录 + 复制这条反馈）
   */
  function renderPanel(ctx) {
    var html =
      '<div class="modal__scrim" data-modal-close></div>' +
      '<div class="modal modal--panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<h2 class="h2" id="modalTitle">' + esc(Copy.FB_PANEL_TITLE) + '</h2>';

    if (ctx.saved) {
      // 服务端模式提示「已上报」，纯静态模式提示「已记录（仅本设备）」
      html +=
        '<p class="notice">' + esc(ctx.online ? Copy.FB_SAVED_ONLINE : Copy.FB_SAVED) + '</p>' +
        '<p class="muted--2">' + esc(ctx.online ? Copy.FB_SAVED_ONLINE_HINT : Copy.FB_SAVED_HINT) + '</p>' +
        '<pre class="fb-text">' + esc(Copy.FB_TEXT(ctx.saved)) + '</pre>';
      if (ctx.copyHint) html += '<p class="muted--2">' + esc(ctx.copyHint) + '</p>';
      html +=
        '<div class="modal__actions">' +
        '<button type="button" class="btn" data-modal-close>' + esc(Copy.FB_CLOSE) + '</button>' +
        // 已经进了服务端就不需要再复制粘贴上报了
        (ctx.online
          ? ''
          : '<button type="button" class="btn btn--primary" data-act="fb-copy-one">' +
            esc(Copy.FB_COPY_ONE) +
            '</button>') +
        '</div>';
      html += '</div>';
      return html;
    }

    html += '<p class="muted--2">' + esc(Copy.FB_PANEL_HINT) + '</p>' + infoBlock(ctx.info);

    // 问题类型（单选）
    html += '<div class="stack"><p class="muted">' + esc(Copy.FB_KIND_LABEL) + '</p>' +
      '<div class="choice-list choice-list--row">';
    for (var i = 0; i < ctx.kinds.length; i++) {
      var k = ctx.kinds[i];
      var on = k === ctx.kind;
      html +=
        '<button type="button" class="btn btn--choice" data-fb-kind="' + esc(k) + '"' +
        ' aria-pressed="' + (on ? 'true' : 'false') + '">' +
        '<span>' + esc(Copy.FB_KIND_NAME(k)) + '</span>' +
        '</button>';
    }
    html += '</div></div>';

    // 备注（选填，计数由 app.js 在输入时更新）
    html +=
      '<label class="fb-note">' +
      '<span class="muted">' + esc(Copy.FB_NOTE_LABEL(ctx.noteMax)) + '</span>' +
      '<textarea class="input fb-note__input" data-fb-note maxlength="' + ctx.noteMax + '"' +
      ' rows="3" placeholder="' + esc(Copy.FB_NOTE_PLACEHOLDER) + '">' + esc(ctx.note || '') + '</textarea>' +
      '<span class="muted--2 num" data-fb-count>' +
      esc(Copy.FB_NOTE_COUNT((ctx.note || '').length, ctx.noteMax)) +
      '</span>' +
      '</label>';

    html +=
      '<div class="modal__actions">' +
      '<button type="button" class="btn" data-modal-close>' + esc(Copy.BTN_CANCEL) + '</button>' +
      '<button type="button" class="btn btn--primary" data-act="fb-submit">' + esc(Copy.FB_SUBMIT) + '</button>' +
      '</div>';

    html += '</div>';
    return html;
  }

  /** 反馈箱一行 */
  function boxRow(item) {
    var status = item.status === 'copied'
      ? '<span class="badge">' + esc(Copy.FB_STATUS_COPIED) + '</span>'
      : '<span class="badge badge--accent">' + esc(Copy.FB_STATUS_PENDING) + '</span>';

    return (
      '<div class="card card--flat fb-card">' +
      '<div class="fb-card__main">' +
      '<div class="fb-card__head">' +
      '<span class="muted num">' + esc(Copy.FB_WHEN(item.at)) + '</span>' +
      status +
      '</div>' +
      '<div class="num">' +
      esc(Copy.FB_ROW_META(item.bankTitle || item.bankKey, item.questionId, Copy.FB_KIND_NAME(item.kind))) +
      '</div>' +
      '<div class="muted--2">' + esc(item.stem || '—') + '</div>' +
      '</div>' +
      '<div class="fb-card__side">' +
      '<button type="button" class="btn btn--ghost" data-fb-copy="' + esc(item.id) + '">' +
      esc(Copy.FB_ACTION_COPY) + '</button>' +
      '<button type="button" class="btn btn--ghost" data-fb-del="' + esc(item.id) + '">' +
      esc(Copy.FB_ACTION_DELETE) + '</button>' +
      '</div>' +
      '</div>'
    );
  }

  /** 反馈箱整页 */
  function renderBox(ctx) {
    var items = ctx.items || [];
    var html = '<div class="page stack--block">';

    html +=
      '<header class="stack page-head">' +
      '<h1 class="h1">' + esc(Copy.FB_BOX_TITLE) + '</h1>' +
      '<p class="muted--2">' + esc(Copy.FB_BOX_HINT) + '</p>' +
      '</header>';

    if (!items.length) {
      html += '<p class="notice">' + esc(Copy.FB_BOX_EMPTY) + '</p>';
    } else {
      html +=
        '<div class="stack">' +
        '<button type="button" class="btn btn--block btn--primary" data-act="fb-copy-all">' +
        esc(Copy.FB_COPY_ALL(items.length)) + '</button>' +
        '<button type="button" class="btn btn--block" data-act="fb-clear">' + esc(Copy.FB_CLEAR) + '</button>' +
        '</div>';
      html += '<div class="list">';
      for (var i = 0; i < items.length; i++) html += boxRow(items[i]);
      html += '</div>';
    }

    html +=
      '<div>' +
      '<button type="button" class="btn btn--block" data-act="back">' + esc(Copy.BTN_BACK) + '</button>' +
      '</div>';

    html += '</div>';
    return html;
  }

  root.QuizViewFeedback = { link: link, renderPanel: renderPanel, renderBox: renderBox };
})(typeof globalThis !== 'undefined' ? globalThis : this);
