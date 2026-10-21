/**
 * 视图：练习记录 —— js/ui/view-records.js
 *
 * 一个题库的全部轮次（已完成 + 进行中），按时间倒序。
 * 只负责渲染：数字全部由 js/core/round.js 的 records() 备好（快照的冻结值 / 进行中的派生值），
 * 这里不判题、不统计、不读写存储。
 */
(function (root) {
  'use strict';

  var Copy = root.QuizCopy;
  var esc = root.QuizRich.escapeHtml;

  /** 一行记录：类型（+ 范围）+ 时间 + 题目数 + 成绩/进度 + 状态 */
  function row(record) {
    var isPractice = record.kind === 'practice';
    var title = isPractice
      ? Copy.RECORD_KIND_PRACTICE
      : record.kind === 'wrongbook'
        ? Copy.RECORD_KIND_WRONGBOOK
        : record.kind === 'stars'
          ? Copy.RECORD_KIND_STARS
          : Copy.RECORD_KIND_NORMAL;
    if (isPractice && record.source) {
      title += Copy.RECORD_FROM(Copy.ROUND_WHEN(record.source.endedAt), record.source.wrong);
    } else if (record.scopeLabel) {
      // 范围标签由 scope.js 生成（全部 120 题 / 二、HTML进阶 15 题 / 随机 20 题）
      title += Copy.SCOPE_SEP + record.scopeLabel;
    }

    var score = record.status === 'done'
      ? Copy.RECORD_SCORE(record.correct, record.scorable, record.accuracy)
      : Copy.RECORD_PROGRESS(record.answered, record.scorable);

    var statusBadge = record.status === 'done'
      ? '<span class="badge">' + esc(Copy.RECORD_STATUS_DONE) + '</span>'
      : '<span class="badge badge--accent">' + esc(Copy.RECORD_STATUS_ACTIVE) + '</span>';
    var action = record.status === 'done' ? Copy.RECORD_ACTION_DONE : Copy.RECORD_ACTION_ACTIVE;

    return (
      '<button type="button" class="card card--clickable" data-record="' + esc(record.key) + '">' +
      '<span class="record__main">' +
      '<span class="h2">' + esc(title) + '</span>' +
      '<span class="muted num">' + esc(Copy.RECORD_META(Copy.ROUND_WHEN(record.at), record.total)) + '</span>' +
      '<span class="muted--2 num">' + esc(score) + '</span>' +
      '</span>' +
      '<span class="record__side">' +
      statusBadge +
      '<span class="muted">' + esc(action) + '</span>' +
      '</span>' +
      '</button>'
    );
  }

  function render(ctx) {
    var bank = ctx.bank;
    var records = ctx.records || [];

    var html = '<div class="page stack--block">';

    html +=
      '<header class="stack page-head">' +
      '<h1 class="h1">' + esc(Copy.RECORDS_TITLE) + '</h1>' +
      '<p class="muted--2">' + esc((bank ? bank.title + ' · ' : '') + Copy.RECORDS_HINT) + '</p>' +
      '</header>';

    if (records.length) {
      html += '<div class="list">';
      for (var i = 0; i < records.length; i++) html += row(records[i]);
      html += '</div>';
    } else {
      html += '<p class="notice">' + esc(Copy.RECORDS_EMPTY) + '</p>';
    }

    html +=
      '<div>' +
      '<button type="button" class="btn btn--block" data-act="back">' + esc(Copy.BTN_BACK) + '</button>' +
      '</div>';

    html += '</div>';
    return html;
  }

  root.QuizViewRecords = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : this);
