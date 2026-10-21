/**
 * 视图：错题本 —— js/ui/view-wrongbook.js
 *
 * 只负责渲染。数据全部来自 js/core/wrongbook.js 的 groups()/entries()：
 * 聚合口径（去重、次数、最近时间）、排序（章节 → 题号）都在那一层定死，
 * 这里不判题、不统计、不读写存储，也不提供跳题（行是只读的）。
 */
(function (root) {
  'use strict';

  var Copy = root.QuizCopy;
  var esc = root.QuizRich.escapeHtml;

  /** 题干摘要：压掉换行与多余空白，取前 40 字 */
  function stemShort(raw) {
    var t = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
    return t.length > 40 ? t.slice(0, 40) + '…' : t;
  }

  function row(item) {
    var q = item.question || {};
    return (
      '<div class="row wb-row">' +
      '<span class="row__idx num">第 ' + esc(String(item.id)) + ' 题</span>' +
      '<span class="badge">' + esc(Copy.TYPE_NAME(q.type)) + '</span>' +
      '<span class="wb-stem">' + esc(stemShort(q.stem)) + '</span>' +
      '<span class="wb-side num">' +
      '<span>' + esc(Copy.WRONGBOOK_COUNT(item.wrongCount)) + '</span>' +
      '<span>' + esc(Copy.WRONGBOOK_LAST(Copy.ROUND_WHEN(item.lastAt))) + '</span>' +
      '</span>' +
      '</div>'
    );
  }

  function render(ctx) {
    var bank = ctx.bank;
    var groups = ctx.groups || [];
    var n = ctx.count || 0;

    var html = '<div class="page stack--block">';

    html +=
      '<header class="stack page-head">' +
      '<h1 class="h1">' + esc(Copy.WRONGBOOK_TITLE) + '</h1>' +
      '<p class="muted--2">' + esc((bank ? bank.title + ' · ' : '') + Copy.WRONGBOOK_HINT) + '</p>' +
      '</header>';

    /* ------------------------- 主操作：错题练习 ------------------------- */
    html += '<section class="stack">';
    if (n === 0) {
      html +=
        '<button type="button" class="btn btn--block" data-act="wrongbook-start" disabled aria-disabled="true">' +
        esc(Copy.WRONGBOOK_START(0)) +
        '</button>' +
        '<p class="muted--2">' + esc(Copy.WRONGBOOK_START_NONE) + '</p>';
    } else {
      html +=
        '<button type="button" class="btn btn--block btn--primary" data-act="wrongbook-start">' +
        esc(Copy.WRONGBOOK_START(n)) +
        '</button>' +
        '<p class="muted--2">' + esc(Copy.WRONGBOOK_START_HINT) + '</p>';
    }
    html += '</section>';

    /* ------------------------- 按章节分组的只读列表 ------------------------- */
    if (n === 0) {
      html += '<p class="notice">' + esc(Copy.WRONGBOOK_EMPTY) + '</p>';
    } else {
      html += '<div class="wb-list">';
      for (var g = 0; g < groups.length; g++) {
        var grp = groups[g];
        html += '<section class="wb-group">';
        html +=
          '<h2 class="h2 wb-group__title">' + esc(Copy.WRONGBOOK_CHAPTER(grp.title, grp.rows.length)) + '</h2>' +
          '<div class="card card--flat">';
        for (var r = 0; r < grp.rows.length; r++) html += row(grp.rows[r]);
        html += '</div></section>';
      }
      html += '</div>';
    }

    html +=
      '<div>' +
      '<button type="button" class="btn btn--block" data-act="back">' + esc(Copy.BTN_BACK) + '</button>' +
      '</div>';

    html += '</div>';
    return html;
  }

  root.QuizViewWrongbook = { render: render, stemShort: stemShort };
})(typeof globalThis !== 'undefined' ? globalThis : this);
