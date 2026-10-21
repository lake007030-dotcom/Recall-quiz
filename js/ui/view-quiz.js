/**
 * 视图：答题页 —— js/ui/view-quiz.js
 *
 * 只负责渲染。所有对错判定一律来自 session.evaluate()（最终来自 judge.js），
 * 本文件不重复实现任何判定逻辑。
 */
(function (root) {
  'use strict';

  var Copy = root.QuizCopy;
  var Rich = root.QuizRich;
  var OUTCOME = root.QuizJudge.OUTCOME;
  var esc = Rich.escapeHtml;

  /** 单个选项的类名与标签 */
  function optionView(q, key, rec, submitted) {
    var isPicked = rec.picked.indexOf(key) >= 0;
    var isCorrect = !!(q.answer && q.answer.indexOf(key) >= 0);

    var cls = 'opt';
    var tag = '';

    if (submitted) {
      if (isCorrect) {
        cls += ' opt--correct';
        tag = '<span class="opt__tag">✓ ' + esc(Copy.TAG_CORRECT) + '</span>';
      } else if (isPicked) {
        cls += ' opt--wrong';
        tag = '<span class="opt__tag">✕ ' + esc(Copy.TAG_YOURS) + '</span>';
      } else {
        cls += ' opt--dimmed';
      }
    } else if (isPicked) {
      cls += ' opt--selected';
    }

    return { cls: cls, tag: tag, disabled: submitted };
  }

  /** 星标按钮：收藏是题目级的，答题页与结果页共用同一个按钮样子 */
  function starBtn(id, starred) {
    return (
      '<button type="button" class="star" data-star="' + esc(String(id)) + '"' +
      ' aria-pressed="' + (starred ? 'true' : 'false') + '"' +
      ' aria-label="' + esc(starred ? Copy.STAR_UNMARK : Copy.STAR_MARK) + '"' +
      ' title="' + esc(starred ? Copy.STAR_UNMARK : Copy.STAR_MARK) + '">' +
      esc(starred ? Copy.STAR_ON : Copy.STAR_OFF) +
      '</button>'
    );
  }

  /**
   * 进度条里的章节刻度：按「该章累计题数 / 全库题数」定位，1px 细线。
   * 只有整库一轮（本轮题数 = 全库题数）时章节边界才和进度条对得上，
   * 随机/章节/重练/错题/收藏这些部分轮一律不画；单章题库（Java）也不画。
   */
  function progressTicks(s) {
    var bank = s.bank;
    var chapters = (bank && bank.chapters) || [];
    if (chapters.length < 2) return '';
    if (s.questions.length !== bank.questions.length) return '';

    var total = 0;
    var i;
    for (i = 0; i < chapters.length; i++) total += chapters[i].count || 0;
    if (!total) return '';

    var html = '';
    var cum = 0;
    for (i = 0; i < chapters.length - 1; i++) {
      cum += chapters[i].count || 0;
      html +=
        '<span class="progress__tick" style="left:' +
        ((cum / total) * 100).toFixed(3) + '%"></span>';
    }
    return html;
  }

  /**
   * 题号跳转：输入「第几题」（按本轮题序）+「跳」。
   * 只读快照不给跳转也不给收藏——快照是用来回看的，不该有操作入口。
   */
  function jumpBox() {
    return (
      '<span class="jump">' +
      '<input class="jump__input" type="text" inputmode="numeric" autocomplete="off"' +
      ' maxlength="4" placeholder="' + esc(Copy.JUMP_PLACEHOLDER) + '"' +
      ' aria-label="' + esc(Copy.JUMP_ARIA) + '" data-jump-input>' +
      '<button type="button" class="jump__btn" data-act="jump">' + esc(Copy.JUMP_BTN) + '</button>' +
      '<span class="jump__hint" data-jump-hint hidden></span>' +
      '</span>'
    );
  }

  /**
   * 答题卡（题号网格）：一格一题，底色只看 session 的提交与判定结果，不另存任何状态。
   * 宽屏侧边浮窗与窄屏覆盖层共用这一个渲染函数，区别只在外面套的容器。
   * 只读快照同样按快照里的作答渲染：颜色照常，点击只跳题、不改判分。
   */
  function answerCard(s, opts) {
    opts = opts || {};
    // 浮窗（130px）装不下完整统计句，拆成两行短句；覆盖层仍是完整一行
    var side = !!opts.side;
    var stats = s.stats();
    var total = s.questions.length;
    // 未答 = 本轮题数 - 判对 - 判错；选而未提交、数据异常题都落在这里
    var unanswered = total - stats.correct - stats.wrong;
    var statsHtml = side
      ? '<span class="answer-card__stats-line">' + esc(Copy.ANSWER_CARD_STATS_SIDE_UNANSWERED(unanswered)) + '</span>' +
        '<span class="answer-card__stats-line">' + esc(Copy.ANSWER_CARD_STATS_SIDE_RESULT(stats.correct, stats.wrong)) + '</span>'
      : esc(Copy.ANSWER_CARD_STATS(unanswered, stats.correct, stats.wrong));

    var html =
      '<div class="answer-card" data-answer-card>' +
      '<p class="answer-card__stats num' + (side ? ' answer-card__stats--side' : '') + '" data-answer-card-stats>' +
      statsHtml +
      '</p>' +
      '<div class="answer-card__grid" role="group" aria-label="' + esc(Copy.ANSWER_CARD_TOGGLE) + '">';

    for (var i = 0; i < total; i++) {
      var qq = s.questions[i];
      var rec = s.recordOf(qq.id);
      var state = 'unanswered';
      if (rec.submitted) {
        var outcome = s.evaluate(qq.id).outcome;
        if (outcome === OUTCOME.CORRECT) state = 'correct';
        else if (outcome === OUTCOME.WRONG) state = 'wrong';
      }
      var current = i === s.index;
      var cls = 'answer-card__cell answer-card__cell--' + state;
      if (current) cls += ' answer-card__cell--current';
      // 数据异常题：底色不变，只在右下角点一个小点
      if (qq.scorable === false) cls += ' answer-card__cell--invalid';

      html +=
        '<button type="button" class="' + cls + '" data-goto="' + i + '"' +
        (current ? ' aria-current="true"' : '') +
        ' aria-label="' + esc(Copy.ANSWER_CARD_CELL_ARIA(i + 1, state)) + '">' +
        (i + 1) +
        '</button>';
    }

    html += '</div></div>';
    return html;
  }

  /**
   * 窄屏 meta 行的「总览」按钮：点开全屏覆盖层里的答题卡。
   * 宽屏同一功能在侧边浮窗里，这颗由 CSS 藏起来，两种形态不会同时出现。
   */
  function cardToggle(open) {
    return (
      '<button type="button" class="card-toggle card-toggle--meta" data-act="card-toggle"' +
      ' aria-expanded="' + (open ? 'true' : 'false') + '"' +
      ' aria-controls="answerCardOverlay"' +
      ' title="' + esc(Copy.ANSWER_CARD_TOGGLE_ARIA) + '">' +
      esc(Copy.ANSWER_CARD_TOGGLE) +
      '</button>'
    );
  }

  /**
   * 窄屏答题卡：全屏遮罩 + 居中卡片，点遮罩 / 「关闭」/ Esc 收起。
   * 宽屏不显示（CSS 藏起来）——宽屏的同一份网格在侧边浮窗里展开。
   */
  function answerCardOverlay(s) {
    return (
      '<div class="card-overlay" data-card-overlay>' +
      '<div class="card-overlay__scrim" data-act="card-close" aria-hidden="true"></div>' +
      '<div class="card-overlay__panel" id="answerCardOverlay" role="dialog" aria-modal="true"' +
      ' aria-label="' + esc(Copy.ANSWER_CARD_TITLE) + '">' +
      '<div class="card-overlay__head">' +
      '<span class="card-overlay__title">' + esc(Copy.ANSWER_CARD_TITLE) + '</span>' +
      '<button type="button" class="card-overlay__close" data-act="card-close" data-card-close-btn>' +
      esc(Copy.ANSWER_CARD_CLOSE) +
      '</button>' +
      '</div>' +
      answerCard(s) +
      '</div>' +
      '</div>'
    );
  }

  /**
   * 宽屏侧边跳转浮窗：答题页两侧的空白在 ≥1080px 时够宽，就把跳转做成一块固定小卡。
   * 两种形态（meta 行里的 / 侧边浮窗）都渲染，由 CSS 决定谁可见——
   * 同一功能只留一个入口，宽屏看浮窗、窄屏看 meta 行，不会同时出现。
   *
   * 浮窗里还有答题卡：「总览」按钮展开/收起。只读快照不给跳转输入框，
   * 但答题卡照常给（格子只按快照数据着色，点格子走同一套 data-goto）。
   */
  function jumpDock(s, opts) {
    opts = opts || {};
    var readonly = !!opts.readonly;
    var open = !!opts.open;

    var jumpBits = readonly
      ? ''
      : '<input class="jump-dock__input" type="text" inputmode="numeric" autocomplete="off"' +
        ' maxlength="4" placeholder="' + esc(Copy.JUMP_PLACEHOLDER) + '"' +
        ' aria-label="' + esc(Copy.JUMP_ARIA) + '" data-jump-dock-input>' +
        '<button type="button" class="jump-dock__btn" data-act="jump-dock">' +
        esc(Copy.JUMP_DOCK_BTN) +
        '</button>' +
        '<span class="jump-dock__hint" data-jump-dock-hint hidden></span>';

    return (
      '<aside class="jump-dock' + (open ? ' jump-dock--card-open' : '') + '" aria-label="题号跳转与答题卡">' +
      '<span class="jump-dock__count num" data-jump-count>' +
      esc(Copy.PROGRESS_QUESTION(s.index + 1, s.questions.length)) +
      '</span>' +
      jumpBits +
      '<button type="button" class="jump-dock__overview" data-act="card-toggle"' +
      ' aria-expanded="' + (open ? 'true' : 'false') + '"' +
      ' aria-controls="answerCardDock"' +
      ' title="' + esc(Copy.ANSWER_CARD_TOGGLE_ARIA) + '">' +
      esc(Copy.ANSWER_CARD_TOGGLE) +
      '</button>' +
      '<div class="jump-dock__card" id="answerCardDock"' + (open ? '' : ' hidden') + '>' +
      answerCard(s, { side: true }) +
      '</div>' +
      '</aside>'
    );
  }

  function render(ctx) {
    var s = ctx.session;
    var bank = s.bank;
    var q = s.question;
    var stats = s.stats();
    var rec = s.recordOf(q.id);
    // judged = 已提交且没被解锁；editing = 已提交但点了「修改答案」，界面回到可改样子
    var judged = rec.submitted && !rec.editing;
    var editing = rec.submitted && !!rec.editing;
    var invalid = q.scorable === false;
    var result = s.evaluate(q.id);
    var readonly = !!ctx.readonly || !!s.isSnapshot;

    var html = '<div class="page page--quiz page--with-actionbar stack--block">';

    /* ------------------------- 进度 ------------------------- */
    html += '<section class="stack">';

    // 重练轮：标清楚自己是在重练哪一轮；错题练习 / 收藏练习：标清来源；普通轮：标出这一轮的范围
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
        esc(Copy.POOL_BADGE(Copy.POOL_NAME(s.origin), s.questions.length)) +
        '</span>' +
        '</div>';
    } else if (s.scope) {
      html +=
        '<div class="chips">' +
        '<span class="badge">' + esc(s.scopeLabel()) + '</span>' +
        '</div>';
    }

    // 题型 / 章节 / 数据异常徽标：都收进 meta 行，题目卡里只剩题干与选项
    var tags = '<span class="meta__tags">';
    tags += '<span class="badge">' + esc(Copy.TYPE_NAME(q.type)) + '</span>';
    if (bank.chapters.length > 1) {
      var ch = null;
      for (var ci = 0; ci < bank.chapters.length; ci++) {
        if (bank.chapters[ci].no === q.chapter) ch = bank.chapters[ci];
      }
      if (ch) tags += '<span class="badge">' + esc(ch.title) + '</span>';
    }
    if (invalid) tags += '<span class="badge">数据异常</span>';
    tags += '</span>';

    // 右侧工具组：题号跳转 + 答题卡 + 收藏星（只读快照三者都不给）
    var tools = '';
    if (!readonly) {
      tools = jumpBox() + cardToggle(!!ctx.answerCardOpen) +
        starBtn(q.id, !!(ctx.starredOf && ctx.starredOf(q.id)));
    }

    html +=
      '<div class="meta">' +
      '<span class="meta__info">' +
      // 分母是本轮的题数：重练轮要显示「第 1/3 题」，不是全库题数
      '<span class="meta__count num">' + esc(Copy.PROGRESS_QUESTION(s.index + 1, s.questions.length)) + '</span>' +
      '<span class="meta__ok num">' + esc(Copy.PROGRESS_CORRECT(stats.correct)) + '</span>' +
      '</span>' +
      tags +
      '<span class="meta__tools">' + tools + '</span>' +
      '</div>' +
      '<div class="progress">' +
      '<div class="progress__track">' +
      '<div class="progress__fill" style="width:' + stats.coverage + '%"></div>' +
      progressTicks(s) +
      '</div>' +
      '<span class="progress__value num">' + stats.coverage + '%</span>' +
      '</div>' +
      '</section>';

    /* ------------------------- 题目卡片 ------------------------- */
    html += '<article class="card stack--block">';

    // 题干
    html += '<div class="rich">' + Rich.render(q.stem) + '</div>';

    // 选项
    if (q.options.length) {
      html += '<div class="stack" role="group" aria-label="选项">';
      for (var i = 0; i < q.options.length; i++) {
        var opt = q.options[i];
        var v = invalid
          ? { cls: 'opt opt--invalid', tag: '', disabled: true }
          : optionView(q, opt.key, rec, judged);

        html +=
          '<button type="button" class="' + v.cls + '" data-opt="' + esc(opt.key) + '"' +
          (v.disabled ? ' disabled aria-disabled="true"' : '') +
          ' aria-pressed="' + (rec.picked.indexOf(opt.key) >= 0) + '">' +
          '<span class="opt__key" aria-hidden="true">' + esc(opt.key) + '</span>' +
          '<span class="opt__body rich">' + Rich.render(opt.text) + '</span>' +
          v.tag +
          '</button>';
      }
      html += '</div>';
    }

    // 数据异常提示
    if (invalid) {
      html += '<p class="notice">' + esc(Copy.INVALID_NOTICE) + '</p>';
    }

    /* ------------------------- 判定提示 + 解析 ------------------------- */
    // 数据异常题不判分、没有「答对/答错」可显示，但题干与解析照常显示（见 docs\数据质量报告.md）。
    // 解锁重改（editing）期间也照常显示解析：答案已经看过，藏起来没有意义。
    if (judged || invalid || editing) {
      if (judged) {
        var modifyBtn =
          '<button type="button" class="linkbtn" data-act="modify">' + esc(Copy.BTN_MODIFY) + '</button>';
        if (result.outcome === OUTCOME.CORRECT) {
          html +=
            '<div class="tip tip--ok">' +
            '<span class="tip__icon" aria-hidden="true">✓</span>' +
            '<span class="tip__body"><span class="tip__head"><span class="tip__title">' + esc(Copy.TIP_OK) + '</span>' + modifyBtn + '</span>' +
            esc(Copy.TIP_CORRECT_IS(result.correctAnswer)) + '</span>' +
            '</div>';
        } else {
          html +=
            '<div class="tip tip--bad">' +
            '<span class="tip__icon" aria-hidden="true">✕</span>' +
            '<span class="tip__body"><span class="tip__head"><span class="tip__title">' + esc(Copy.TIP_BAD) + '</span>' + modifyBtn + '</span>' +
            esc(Copy.TIP_CORRECT_IS(result.correctAnswer)) +
            '<br>' + esc(Copy.TIP_YOURS_IS(result.picked)) + '</span>' +
            '</div>';
        }
      } else if (editing) {
        html +=
          '<p class="notice notice--soft">' + esc(Copy.MODIFY_UNLOCKED) + '</p>';
      }

      // 解析：原文为空则整块不渲染（Java #142）
      if (q.explanation) {
        html +=
          '<div class="explain">' +
          '<div class="explain__label">' + esc(Copy.EXPLAIN_LABEL) + '</div>' +
          '<div class="rich muted--2">' + Rich.render(q.explanation) + '</div>' +
          '</div>';
      }
    }

    // 题目反馈入口：轻量、右对齐，不抢主操作按钮（反馈只存本机，见 README）
    html += '<div class="fb-foot">' + root.QuizViewFeedback.link(q.id, 'quiz') + '</div>';

    html += '</article>';
    html += '</div>';

    /* ------------------------- 底部操作区 ------------------------- */
    var isLast = s.nav.isLast();
    html += '<div class="actionbar"><div class="actionbar__inner">';

    html +=
      '<button type="button" class="btn" data-act="prev"' +
      (s.nav.canPrev() ? '' : ' disabled aria-disabled="true"') +
      '>' + esc(Copy.BTN_PREV) + '</button>';

    /* 提交按钮：状态全部从本轮记录派生（rec.submitted / rec.editing），不另存任何标记。
       按钮禁用只是入口变化——重复判定由 session.submit() 保证幂等。 */
    var submitLabel = Copy.BTN_SUBMIT;
    var submitOff = false;
    if (invalid) {
      submitLabel = Copy.BTN_INVALID;
      submitOff = true;
    } else if (judged) {
      submitLabel = Copy.BTN_SUBMITTED;
      submitOff = true;
    } else if (rec.picked.length === 0) {
      submitOff = true;
    }

    html +=
      '<button type="button" class="btn btn--primary" data-act="submit"' +
      (submitOff ? ' disabled aria-disabled="true"' : '') +
      '>' + esc(submitLabel) + '</button>';

    html +=
      '<button type="button" class="btn" data-act="' + (isLast ? 'finish' : 'next') + '">' +
      esc(isLast ? Copy.BTN_FINISH : Copy.BTN_NEXT) +
      '</button>';

    html += '</div></div>';

    // 宽屏侧边跳转浮窗（fixed，不参与文档流；窄屏由 CSS 藏起来）。
    // 只读时浮窗只留「第 x/y 题」与答题卡，不给跳转输入框。
    html += jumpDock(s, { readonly: readonly, open: !!ctx.answerCardOpen });

    // 窄屏的答题卡覆盖层：宽屏同样输出、由 CSS 藏起来，
    // 这样窗口跨过 1080px 时不用 JS 跟着换形态，两种形态始终同源。
    if (ctx.answerCardOpen) html += answerCardOverlay(s);

    return html;
  }

  root.QuizViewQuiz = {
    render: render,
    starBtn: starBtn,
    answerCard: answerCard,
    answerCardOverlay: answerCardOverlay,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
