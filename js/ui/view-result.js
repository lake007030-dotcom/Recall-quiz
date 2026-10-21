/**
 * 视图：结果页 —— js/ui/view-result.js
 *
 * 统计口径全部来自 session.stats()；错题判定全部来自 session.evaluate()/wrongIds()。
 * 本文件只负责组织展示，不重复判定、不另算统计。
 *
 * 三类轮共用这个页面：
 *   普通练习轮 · 重练轮（只有原轮错题）· 历史快照（只读，跳题按钮不渲染）
 */
(function (root) {
  'use strict';

  var Copy = root.QuizCopy;
  var esc = root.QuizRich.escapeHtml;
  var OUTCOME = root.QuizJudge.OUTCOME;
  var STATUS = root.QuizSession.STATUS;

  function statItem(value, label, key) {
    return (
      '<div class="stat" data-stat="' + key + '">' +
      '<div class="stat__value">' + esc(String(value)) + '</div>' +
      '<div class="stat__label">' + esc(label) + '</div>' +
      '</div>'
    );
  }

  /**
   * 环形正确率：72×72 内联 SVG，半径 30（8px 描边正好收在框里）。
   * 轨道整圈打底，进度圈用 dasharray/dashoffset 表示百分比，从 -90°（正上方）起画。
   */
  function accuracyRing(accuracy) {
    var R = 30;
    var C = 2 * Math.PI * R;
    var pct = Math.max(0, Math.min(100, Number(accuracy) || 0));
    var dash = (C * pct) / 100;
    return (
      '<div class="ring" role="img" aria-label="正确率 ' + pct + '%">' +
      '<svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true" focusable="false">' +
      '<circle class="ring__track" cx="36" cy="36" r="' + R + '" fill="none" stroke-width="8"></circle>' +
      '<circle class="ring__bar" cx="36" cy="36" r="' + R + '" fill="none" stroke-width="8"' +
      ' stroke-linecap="round" stroke-dasharray="' + C.toFixed(2) + '"' +
      ' stroke-dashoffset="' + (C - dash).toFixed(2) + '"' +
      ' transform="rotate(-90 36 36)"></circle>' +
      '</svg>' +
      '<span class="ring__value num" data-accuracy>' + pct + '%</span>' +
      '</div>'
    );
  }

  /** 行左侧的题型色点：单选强调色 / 多选成功色 / 判断中性灰 */
  function typeDot(type) {
    var cls = 'row__dot';
    if (type === 'single') cls += ' row__dot--single';
    else if (type === 'multiple') cls += ' row__dot--multiple';
    else if (type === 'judge') cls += ' row__dot--judge';
    return '<span class="' + cls + '" aria-hidden="true"></span>';
  }

  function render(ctx) {
    var s = ctx.session;
    var bank = s.bank;
    var stats = s.stats();
    var readonly = !!ctx.readonly || !!s.isSnapshot;
    // 本轮题目（重练轮 = 原轮错题），序号一律按本轮算
    var questions = s.questions;
    var invalidCount = stats.total - stats.scorable;
    var skippedCount = stats.scorable - stats.answered;
    // “没做对”的唯一口径：已提交且判错（选而未交 / 没碰 / 数据异常都不算）
    var wrongCount = s.wrongIds().length;

    var html = '<div class="page page--result stack--block">';

    /* ------------------------- 标题 ------------------------- */
    html +=
      '<header class="stack">' +
      '<h1 class="h1">' + esc(Copy.RESULT_TITLE) + '</h1>' +
      '<p class="muted--2">' + esc(bank.title) + '</p>';

    // 重练轮：标清楚自己是在重练哪一轮；错题练习 / 收藏练习：标清来源
    if (s.source) {
      html +=
        '<div class="chips">' +
        '<span class="badge badge--accent">' +
        esc(Copy.REPLAY_LABEL(Copy.ROUND_WHEN(s.source.endedAt), s.source.wrong)) +
        '</span>' +
        '</div>';
    } else if (s.origin) {
      html +=
        '<div class="chips">' +
        '<span class="badge badge--accent">' +
        esc(Copy.POOL_BADGE(Copy.POOL_NAME(s.origin), questions.length)) +
        '</span>' +
        '</div>';
    }
    // 历史快照：只读
    if (readonly) {
      html += '<p class="muted num">' + esc(Copy.ROUND_SNAPSHOT_NOTE) + ' ' +
        esc(Copy.ROUND_WHEN(s.finishedAt)) + '</p>';
    }
    html += '</header>';

    /* ------------------------- 环形正确率 + 统计行 ------------------------- */
    html += '<div class="result-head">';
    html += accuracyRing(stats.accuracy);
    html += '<div class="stats">';
    html += statItem(stats.correct, Copy.STAT_CORRECT, 'correct');
    html += statItem(stats.wrong, Copy.STAT_WRONG, 'wrong');
    html += statItem(skippedCount, Copy.ANSWER_NONE, 'skipped');
    html += '</div>';
    html += '</div>';

    /* ------------------------- 口径说明 ------------------------- */
    html +=
      '<p class="muted num">' +
      esc(Copy.RESULT_SCOPE(stats.scorable, invalidCount)) +
      ' · ' + esc(Copy.RESULT_SKIPPED(skippedCount)) +
      '</p>';

    /* ------------------------- 再练一遍没做对的 ------------------------- */
    html += '<section class="stack">';
    if (wrongCount === 0) {
      // 没有错题时不抢主按钮位：置灰的次要按钮 + 一句说明
      html +=
        '<button type="button" class="btn btn--block btn--quiet" data-act="replay" disabled aria-disabled="true">' +
        esc(Copy.REPLAY_BTN(0)) +
        '</button>' +
        '<p class="muted--2">' + esc(Copy.REPLAY_NONE) + '</p>';
    } else {
      html +=
        '<button type="button" class="btn btn--block btn--primary" data-act="replay">' +
        esc(Copy.REPLAY_BTN(wrongCount)) +
        '</button>' +
        '<p class="muted--2">' + esc(Copy.REPLAY_HINT) + '</p>';
    }
    // 复制成绩：次要按钮（4/8 一档），不跟主操作抢视觉
    html +=
      '<button type="button" class="btn btn--block btn--quiet" data-act="copy-result">' +
      esc(Copy.RESULT_COPY_BTN) +
      '</button>';
    html += '</section>';

    /* ------------------------- 错题列表 ------------------------- */
    var wrong = [];
    var skipped = [];
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      if (q.scorable === false) continue;
      var st = s.statusOf(q.id);
      if (st !== STATUS.SUBMITTED) {
        skipped.push({ q: q, index: i });
        continue;
      }
      var r = s.evaluate(q.id);
      if (r.outcome === OUTCOME.WRONG) wrong.push({ q: q, index: i, result: r });
    }

    html += '<section class="stack">';
    html += '<h2 class="h2">' + esc(Copy.RESULT_SECTION_WRONG) + ' <span class="num muted">' + wrong.length + '</span></h2>';

    if (!wrong.length) {
      html += '<p class="muted--2">' + esc(Copy.RESULT_PERFECT) + '</p>';
    } else {
      html += '<div class="card card--flat">';
      for (var w = 0; w < wrong.length; w++) {
        var item = wrong[w];
        html +=
          '<div class="row">' +
          typeDot(item.q.type) +
          '<span class="row__idx num">第 ' + (item.index + 1) + ' 题</span>' +
          '<span class="row__main num">' +
          esc(Copy.TIP_YOURS_IS(item.result.picked)) + '<br>' +
          '<span class="muted">' + esc(Copy.TIP_CORRECT_IS(item.result.correctAnswer)) + '</span>' +
          '</span>' +
          '<span class="row__actions">' +
          root.QuizViewQuiz.starBtn(item.q.id, !!(ctx.starredOf && ctx.starredOf(item.q.id))) +
          root.QuizViewFeedback.link(item.q.id, 'result') +
          (readonly
            ? ''
            : '<button type="button" class="btn btn--ghost" data-goto="' + item.index + '">' +
              esc(Copy.RESULT_JUMP) + '</button>') +
          '</span>' +
          '</div>';
      }
      html += '</div>';
    }
    html += '</section>';

    /* ------------------------- 未作答列表 ------------------------- */
    html += '<section class="stack">';
    html += '<h2 class="h2">' + esc(Copy.RESULT_SECTION_SKIPPED) + ' <span class="num muted">' + skipped.length + '</span></h2>';

    if (!skipped.length) {
      html += '<p class="muted--2">' + esc(Copy.RESULT_NO_SKIPPED) + '</p>';
    } else {
      html += '<div class="card card--flat">';
      for (var k = 0; k < skipped.length; k++) {
        html +=
          '<div class="row">' +
          typeDot(skipped[k].q.type) +
          '<span class="row__idx num">第 ' + (skipped[k].index + 1) + ' 题</span>' +
          '<span class="row__main row__status--skip">' + esc(Copy.ANSWER_NONE) + '</span>' +
          '<span class="row__actions">' +
          root.QuizViewQuiz.starBtn(skipped[k].q.id, !!(ctx.starredOf && ctx.starredOf(skipped[k].q.id))) +
          (readonly
            ? ''
            : '<button type="button" class="btn btn--ghost" data-goto="' + skipped[k].index + '">' +
              esc(Copy.RESULT_JUMP) + '</button>') +
          '</span>' +
          '</div>';
      }
      html += '</div>';
    }
    html += '</section>';

    /* ------------------------- 操作 ------------------------- */
    // 底部只放「切页面」的动作：纯文字层级（ghost 无阴影），不跟上面的主按钮争
    html += '<div class="result-actions">';
    // 重练轮：可以回看它来自的那一轮（原记录只读，数字原样保留）
    if (s.source) {
      html +=
        '<button type="button" class="btn btn--ghost" data-act="open-source">' +
        esc(Copy.BTN_OPEN_SOURCE) +
        '</button>';
    }
    html += '<button type="button" class="btn btn--ghost" data-act="back">' + esc(Copy.BTN_BACK) + '</button>';
    html += '</div>';

    html += '</div>';
    return html;
  }

  root.QuizViewResult = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : this);
