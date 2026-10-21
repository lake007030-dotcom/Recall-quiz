/**
 * 视图：维护日志 —— js/ui/view-changelog.js
 *
 * 数据来自 js/data/changelog.js（人工维护的静态数组）。这里只排序 + 渲染，
 * 不读 docs/数据质量报告.md（那是给维护者定位题目用的，不是对外日志）。
 */
(function (root) {
  'use strict';

  var Copy = root.QuizCopy;
  var esc = root.QuizRich.escapeHtml;

  /** 按日期倒序；同一天内保持数组原顺序（人工维护时新的写在上） */
  function sortDesc(items) {
    return items.slice().sort(function (a, b) {
      var da = a && a.date ? String(a.date) : '';
      var db = b && b.date ? String(b.date) : '';
      if (da === db) return 0;
      return da < db ? 1 : -1;
    });
  }

  function item(entry) {
    return (
      '<article class="card card--flat cl-item">' +
      '<div class="cl-item__head">' +
      '<span class="muted num">' + esc(entry.date || '—') + '</span>' +
      '<span class="badge">' + esc(Copy.CHANGELOG_TYPE_NAME(entry.type)) + '</span>' +
      '</div>' +
      '<h2 class="h2">' + esc(entry.title || '') + '</h2>' +
      (entry.body ? '<p class="muted--2">' + esc(entry.body) + '</p>' : '') +
      '</article>'
    );
  }

  function render(ctx) {
    var items = sortDesc(ctx.items || []);

    var html = '<div class="page stack--block">';
    html +=
      '<header class="stack page-head">' +
      '<h1 class="h1">' + esc(Copy.CHANGELOG_TITLE) + '</h1>' +
      '<p class="muted--2">' + esc(Copy.CHANGELOG_HINT) + '</p>' +
      '</header>';

    if (!items.length) {
      html += '<p class="notice">' + esc(Copy.CHANGELOG_EMPTY) + '</p>';
    } else {
      html += '<div class="list">';
      for (var i = 0; i < items.length; i++) html += item(items[i]);
      html += '</div>';
    }

    html +=
      '<div>' +
      '<button type="button" class="btn btn--block" data-act="back">' + esc(Copy.CHANGELOG_BACK) + '</button>' +
      '</div>';

    html += '</div>';
    return html;
  }

  root.QuizViewChangelog = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : this);
