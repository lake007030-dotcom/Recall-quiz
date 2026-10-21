/**
 * 视图：「开始一轮」面板（模态）—— js/ui/view-start.js
 *
 * 只负责把「范围三选一 + 章节多选 + 随机档位」画出来。
 * 选中状态（panel）、可用性（canStart / hint）、题号抽取全部由控制器与 js/core/scope.js 决定，
 * 这里不判断能不能开始、也不抽题。
 */
(function (root) {
  'use strict';

  var Copy = root.QuizCopy;
  var Scope = root.QuizScope;
  var esc = root.QuizRich.escapeHtml;

  /**
   * 范围行左侧图标（Lucide · ISC，直接内联，不引库也不引 CDN）。
   * 统一 20×20、viewBox 0 0 24 24、1.5px 描边、currentColor —— 颜色跟文字走，
   * 所以未选是 --ink-3、悬停到 --ink-2、选中到 --accent，不用给图标单独写状态。
   */
  var SCOPE_ICONS = {
    all:
      '<svg class="scope-ico" viewBox="0 0 24 24" width="20" height="20" fill="none"' +
      ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"' +
      ' aria-hidden="true" focusable="false">' +
      '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/>' +
      '<path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/>' +
      '<path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>' +
      '</svg>',
    chapters:
      '<svg class="scope-ico" viewBox="0 0 24 24" width="20" height="20" fill="none"' +
      ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"' +
      ' aria-hidden="true" focusable="false">' +
      '<path d="M12 5v16"/>' +
      '<path d="M20.001 19A2 2 0 0 0 22 17V5a2 2 0 0 0-1.999-2L16 3.002A5 5 0 0 0 12 5a5 5 0 0 0-4-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 1.999 2H8a5 5 0 0 1 4 2 5 5 0 0 1 4-2z"/>' +
      '</svg>',
    random:
      '<svg class="scope-ico" viewBox="0 0 24 24" width="20" height="20" fill="none"' +
      ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"' +
      ' aria-hidden="true" focusable="false">' +
      '<path d="m18 14 4 4-4 4"/>' +
      '<path d="m18 2 4 4-4 4"/>' +
      '<path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/>' +
      '<path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/>' +
      '<path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>' +
      '</svg>'
  };

  /** 一个可点的选项行（单选 / 多选都用它，靠 aria-pressed 表示选中）。
      带图标的行多一个 btn--ico：图标和文字挨在一起，说明仍推到右端；章节行不带图标，布局不变。 */
  function choice(attrs, label, note, icon) {
    return (
      '<button type="button" class="btn btn--block btn--choice' + (icon ? ' btn--ico' : '') + '"' + attrs + '>' +
      (icon || '') +
      '<span>' + esc(label) + '</span>' +
      (note ? '<span class="muted num">' + esc(note) + '</span>' : '') +
      '</button>'
    );
  }

  function chaptersBlock(bank, panel) {
    var html = '<div class="choice-list choice-sub">';
    for (var i = 0; i < bank.chapters.length; i++) {
      var ch = bank.chapters[i];
      var on = panel.chapterNos.indexOf(Number(ch.no)) >= 0;
      html += choice(
        ' data-scope-chapter="' + esc(ch.no) + '" aria-pressed="' + on + '"',
        Scope.cnNo(ch.no) + '、' + ch.title,
        Copy.SCOPE_COUNT(ch.count)
      );
    }
    html += '</div>';
    return html;
  }

  function randomBlock(bank, panel) {
    var total = bank.questions.length;
    var html = '<div class="count-row">';
    for (var i = 0; i < Scope.RANDOM_SIZES.length; i++) {
      var n = Scope.RANDOM_SIZES[i];
      var enough = total >= n;
      // 档位高亮只在「档位选的」时亮：手动改过数字就取消高亮
      var on = enough && panel.nFromPreset === true && Number(panel.n) === n;
      html +=
        '<button type="button" class="btn' + (on ? ' btn--primary' : '') + '"' +
        ' data-scope-n="' + n + '"' +
        (enough ? '' : ' disabled aria-disabled="true"') +
        ' aria-pressed="' + on + '"' +
        (enough ? '' : ' title="' + esc(Copy.START_TOO_FEW(n)) + '"') +
        '>' + esc(Copy.SCOPE_COUNT(n)) + '</button>';
    }
    html +=
      '<label class="count-field">' +
      '<input class="count-input num" type="text" inputmode="numeric" autocomplete="off"' +
      ' maxlength="4" data-scope-n-input' +
      ' aria-label="' + esc(Copy.SCOPE_COUNT_LABEL) + '"' +
      ' value="' + esc(String(panel.n == null ? '' : panel.n)) + '">' +
      '<span class="count-unit">' + esc(Copy.SCOPE_COUNT_UNIT) + '</span>' +
      '</label>';
    html += '</div>';
    return html;
  }

  /**
   * @param {object} ctx.bank     题库
   * @param {object} ctx.panel    { type, chapterNos, n }
   * @param {object} ctx.active   进行中的普通轮 { index, total, correct } | null
   * @param {boolean} ctx.canStart
   * @param {string} ctx.hint     不能开始时的说明（空串则不显示）
   */
  function render(ctx) {
    var bank = ctx.bank;
    var panel = ctx.panel;
    var total = bank.questions.length;

    var html =
      '<div class="modal__scrim" data-modal-close></div>' +
      '<div class="modal modal--panel" role="dialog" aria-modal="true" aria-labelledby="modalTitle">';

    html +=
      '<h2 class="h2" id="modalTitle">' + esc(Copy.START_TITLE) + '</h2>' +
      '<p class="muted--2">' + esc(Copy.START_SUBTITLE(bank.title, total)) + '</p>';

    // 已经有一轮没做完：继续 / 重新开始
    if (ctx.active) {
      html +=
        '<div class="notice">' +
        '<p>' + esc(Copy.START_ACTIVE(ctx.active.index, ctx.active.total, ctx.active.correct)) + '</p>' +
        '<div class="chips">' +
        '<button type="button" class="btn btn--primary" data-act="continue">' + esc(Copy.START_CONTINUE) + '</button>' +
        '<button type="button" class="btn" data-act="restart">' + esc(Copy.START_RESTART) + '</button>' +
        '</div>' +
        '</div>';
    }

    // 范围三选一
    html += '<div class="choice-list">';
    html += choice(
      ' data-scope-type="all" aria-pressed="' + (panel.type === Scope.TYPES.ALL) + '"',
      Copy.SCOPE_ALL,
      Copy.SCOPE_ALL_NOTE(total),
      SCOPE_ICONS.all
    );
    html += choice(
      ' data-scope-type="chapters" aria-pressed="' + (panel.type === Scope.TYPES.CHAPTERS) + '"',
      Copy.SCOPE_CHAPTERS,
      Copy.SCOPE_CHAPTERS_NOTE(bank.chapters.length),
      SCOPE_ICONS.chapters
    );
    if (panel.type === Scope.TYPES.CHAPTERS) html += chaptersBlock(bank, panel);
    html += choice(
      ' data-scope-type="random" aria-pressed="' + (panel.type === Scope.TYPES.RANDOM) + '"',
      Copy.SCOPE_RANDOM,
      Copy.SCOPE_RANDOM_NOTE,
      SCOPE_ICONS.random
    );
    if (panel.type === Scope.TYPES.RANDOM) html += randomBlock(bank, panel);
    html += '</div>';

    // 提示行常驻（不能开始时由控制器原地改文字/显隐，见 app.js 的 applyStartValidity）
    html += '<p class="muted--2 num" data-start-hint' + (ctx.hint ? '' : ' hidden') + '>' + esc(ctx.hint) + '</p>';

    html +=
      '<div class="modal__actions">' +
      '<button type="button" class="btn" data-modal-close>' + esc(Copy.BTN_CANCEL) + '</button>' +
      '<button type="button" class="btn btn--primary" data-act="start-round"' +
      (ctx.canStart ? '' : ' disabled aria-disabled="true"') +
      '>' + esc(Copy.START_BTN) + '</button>' +
      '</div>';

    html += '</div>';
    return html;
  }

  root.QuizViewStart = { render: render };
  if (typeof module === 'object' && module.exports) module.exports = root.QuizViewStart;
})(typeof globalThis !== 'undefined' ? globalThis : this);
