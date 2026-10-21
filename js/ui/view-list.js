/**
 * 视图：题库列表 —— js/ui/view-list.js
 *
 * 只负责把数据渲染成 HTML 字符串，不做任何状态变更（变更由 js/app.js 处理）。
 */
(function (root) {
  'use strict';

  var Copy = root.QuizCopy;
  var esc = root.QuizRich.escapeHtml;

  // 题型分布条的三段：顺序固定「单选 → 多选 → 判断」。多选不用黄色（--warn 太跳），
  // 改用 --ok（青绿），判断题用中性灰，保证深浅两套主题都有对比度。
  var SEGMENTS = [
    { type: 'single', cls: 'dist__seg--single' },
    { type: 'multiple', cls: 'dist__seg--multiple' },
    { type: 'judge', cls: 'dist__seg--judge' },
  ];

  /* 三入口的内联 SVG 图标（14px，1.5px 描边，currentColor 跟字色）。
     不引外部图标库：双击 index.html 也要能用。 */
  var ICONS = {
    records:
      '<svg class="mini-ico" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">' +
      '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M8 4.6V8l2.4 1.6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '</svg>',
    wrongbook:
      '<svg class="mini-ico" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">' +
      '<path d="M3 3.2h6.2A2.8 2.8 0 0 1 12 6v6.8H5.8A2.8 2.8 0 0 1 3 10z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M3 10.2h9M12 6h1.6v6.8H12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '</svg>',
    stars:
      '<svg class="mini-ico" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">' +
      '<path d="M8 2.4l1.72 3.49 3.85.56-2.78 2.71.66 3.83L8 11.18l-3.45 1.81.66-3.83-2.78-2.71 3.85-.56z" ' +
      'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '</svg>',
  };

  /** 小号入口按钮：图标 + 文案，一行三个；n=0 时置灰但保留 */
  function miniBtn(attr, bankKey, label, off, icon) {
    return (
      '<button type="button" class="btn btn--mini"' +
      (off ? ' disabled aria-disabled="true"' : '') +
      ' ' + attr + '="' + esc(bankKey) + '">' +
      ICONS[icon] +
      '<span class="mini-label">' + esc(label) + '</span>' +
      '</button>'
    );
  }

  /** 统计胶囊：数字 + 标签（凹陷小铭牌） */
  function statPill(label, value) {
    return (
      '<span class="hero__pill">' +
      '<span class="hero__num num">' + value + '</span>' +
      '<span class="hero__label">' + esc(label) + '</span>' +
      '</span>'
    );
  }

  /** 题型分布条 + 图例（button 里只能用行内元素，所以一律 span + flex） */
  function distribution(b) {
    var counts = { single: 0, multiple: 0, judge: 0 };
    for (var i = 0; i < b.questions.length; i++) {
      var t = b.questions[i].type;
      if (counts[t] === undefined) counts[t] = 0;
      counts[t]++;
    }

    var segs = '';
    for (var s = 0; s < SEGMENTS.length; s++) {
      var n = counts[SEGMENTS[s].type] || 0;
      if (!n) continue;
      // flex-grow 按题数分配宽度：不用百分比（三段之间还要留 2px 空隙）
      segs +=
        '<span class="dist__seg ' + SEGMENTS[s].cls + '" style="flex-grow:' + n +
        ';flex-basis:0"></span>';
    }

    return (
      '<span class="dist" role="img" aria-label="' +
      esc(Copy.LIST_LEGEND(counts)) + '">' +
      '<span class="dist__bar">' + segs + '</span>' +
      '<span class="dist__legend num">' + esc(Copy.LIST_LEGEND(counts)) + '</span>' +
      '</span>'
    );
  }

  /* 底部两行的内联 SVG 图标（18px，1.5px 描边，currentColor 跟字色） */
  var ROW_ICONS = {
    feedback:
      '<svg class="row-ico" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">' +
      '<path d="M3.4 5.2A2.2 2.2 0 0 1 5.6 3h8.8a2.2 2.2 0 0 1 2.2 2.2v5.6a2.2 2.2 0 0 1-2.2 2.2H8.6L5 16v-3H5.6a2.2 2.2 0 0 1-2.2-2.2z" ' +
      'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M7.4 8.6h5.2M7.4 11.2h3.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '</svg>',
    changelog:
      '<svg class="row-ico" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">' +
      '<circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
      '<path d="M10 5.8V10l3 1.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '</svg>',
  };

  /**
   * 最近练习：一条一行（左题库名+范围、中正确率+答对、右时间+箭头），无外阴影，
   * 靠 1px 分隔线与 hover 底色区分层级 —— 不跟上面的题库卡片抢视觉重量。
   */
  function recentRow(item) {
    return (
      '<button type="button" class="recent-row" data-recent="' + esc(item.key) + '"' +
      ' data-recent-bank="' + esc(item.bankKey) + '">' +
      '<span class="recent-row__left">' +
      '<span class="recent-row__bank">' + esc(item.bankTitle) + '</span>' +
      '<span class="recent-row__scope">' + esc(item.scopeLabel) + '</span>' +
      '</span>' +
      '<span class="recent-row__mid">' +
      '<span class="recent-row__score num">' + esc(item.score) + '</span>' +
      '<span class="recent-row__hint num">' + esc(Copy.RECENT_SCORE(item.correct, item.scorable)) + '</span>' +
      '</span>' +
      '<span class="recent-row__side">' +
      '<span class="recent-row__when num">' + esc(Copy.RECENT_WHEN(item.finishedAt)) + '</span>' +
      '<svg class="row-arrow" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">' +
      '<path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '</span>' +
      '</button>'
    );
  }

  /** 最近练习区块：标题行（标题 + 全部记录） + 最多 3 条 / 空态 */
  function recentSection(items) {
    var html =
      '<section class="recent" aria-labelledby="recentTitle">' +
      '<div class="recent__head">' +
      '<h2 class="recent__title" id="recentTitle">' + esc(Copy.RECENT_TITLE) + '</h2>' +
      '<button type="button" class="linkbtn recent__all" data-act="all-records">' +
      esc(Copy.RECENT_ALL) + '</button>' +
      '</div>';

    if (items.length) {
      html += '<div class="recent__list">';
      for (var i = 0; i < items.length; i++) html += recentRow(items[i]);
      html += '</div>';
    } else {
      html +=
        '<div class="recent__empty">' +
        '<p class="recent__empty-text">' + esc(Copy.RECENT_EMPTY) + '</p>' +
        '<button type="button" class="btn btn--mini recent__start" data-act="recent-start">' +
        esc(Copy.RECENT_START) +
        '</button>' +
        '</div>';
    }

    html += '</section>';
    return html;
  }

  /** 底部列表行：左图标 + 中间文字 + 右箭头，无外阴影（不跟上面的卡片抢层级） */
  function rowBtn(act, label, icon) {
    return (
      '<button type="button" class="list-row" data-act="' + esc(act) + '">' +
      ROW_ICONS[icon] +
      '<span class="list-row__label">' + esc(label) + '</span>' +
      '<svg class="row-arrow" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">' +
      '<path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '</button>'
    );
  }

  function render(ctx) {
    var banks = ctx.banks;
    var html = '<div class="page page--list page--wide stack--block">';

    // Hero：左侧标题 + 强调色短横 + 副文案，右侧三个统计胶囊（跨题库合计）。
    // 宽屏两栏（≥1024px 由 CSS 接管），窄屏上下堆叠，DOM 结构只写一份。
    var doneN = 0, wrongN = 0, starN = 0;
    for (var h = 0; h < banks.length; h++) {
      var pb = ctx.progressOf ? ctx.progressOf(banks[h].key) : null;
      doneN += pb && pb.answered > 0 ? pb.answered : 0;
      wrongN += ctx.wrongBookOf ? ctx.wrongBookOf(banks[h].key).length : 0;
      starN += ctx.starsOf ? ctx.starsOf(banks[h].key).length : 0;
    }

    html +=
      '<header class="page-head hero">' +
      '<div class="hero__main">' +
      '<h1 class="h1 hero__title">' +
      esc(Copy.LIST_TITLE_HEAD) +
      '<span class="hero__accent">' + esc(Copy.LIST_TITLE_ACCENT) + '</span>' +
      '</h1>' +
      '<span class="hero__rule" aria-hidden="true"></span>' +
      '<p class="hero__sub">' + esc(Copy.LIST_HINT) + '</p>' +
      '</div>' +
      '<div class="hero__pills">' +
      statPill(Copy.HERO_DONE, doneN) +
      statPill(Copy.HERO_WRONG, wrongN) +
      statPill(Copy.HERO_STARS, starN) +
      '</div>' +
      '</header>';

    html += '<div class="list list--banks">';
    for (var i = 0; i < banks.length; i++) {
      var b = banks[i];
      var meta = b.questions.length + ' 题';
      if (b.chapters.length > 1) meta += ' · ' + b.chapters.length + ' 个章节';

      var progress = ctx.progressOf(b.key);
      var badge = progress && progress.answered > 0
        ? '<span class="badge badge--accent">' + esc(Copy.LIST_RESUME) + ' ' + progress.answered + '</span>'
        : '<span class="badge">' + esc(Copy.LIST_ENTER) + '</span>';

      html +=
        '<div class="bank-group">' +
        '<div class="bank-block">' +
        '<button type="button" class="card card--clickable" data-bank="' + esc(b.key) + '">' +
        '<span class="bank-main">' +
        '<span class="stack">' +
        '<span class="h2">' + esc(b.title) + '</span>' +
        '<span class="muted--2 num">' + esc(meta) + '</span>' +
        '</span>' +
        distribution(b) +
        '</span>' +
        badge +
        '</button>';

      // 三个入口压成一行小号按钮：练习记录 / 错题本 / 收藏练习。
      // n=0 的按钮置灰但保留——置灰是「现在是 0」，不渲染别人就发现不了这个功能。
      var records = ctx.recordsOf ? ctx.recordsOf(b.key) : [];
      var wrongCount = ctx.wrongBookOf ? ctx.wrongBookOf(b.key).length : 0;
      var starCount = ctx.starsOf ? ctx.starsOf(b.key).length : 0;

      html += '<div class="bank-actions">';
      html += miniBtn('data-records', b.key, Copy.RECORDS_ENTRY(records.length), records.length === 0, 'records');
      html += miniBtn('data-wrongbook', b.key, Copy.WRONGBOOK_ENTRY(wrongCount), wrongCount === 0, 'wrongbook');
      html += miniBtn('data-stars', b.key, Copy.STARS_ENTRY(starCount), starCount === 0, 'stars');

      // 小字提示：只在真的空的时候说一句，两个都空就一起说（不占整行高度）。
      // 长句给桌面，≤480px 换短句（两段叠着输出，由 CSS 决定显示哪一句）。
      var notes = [], shortNotes = [];
      if (wrongCount === 0) {
        notes.push(Copy.WRONGBOOK_NOTE_EMPTY);
        shortNotes.push(Copy.WRONGBOOK_NOTE_EMPTY_SHORT);
      }
      if (starCount === 0) {
        notes.push(Copy.STARS_NOTE_EMPTY);
        shortNotes.push(Copy.STARS_NOTE_EMPTY_SHORT);
      }
      if (notes.length) {
        html += '<span class="bank-note bank-note--wide num">' + esc(notes.join(' · ')) + '</span>';
        html += '<span class="bank-note bank-note--narrow num">' + esc(shortNotes.join(' · ')) + '</span>';
      }
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }
    html += '</div>';

    // 最近练习：跨题库合并的已完成轮次，最多 3 条（数据由 app.js 备好，这里只渲染）
    html += recentSection(ctx.recent || []);

    // 底部入口：反馈箱（有未上报时带数量）+ 维护日志 —— 列表行样式，有图标/箭头/悬停底色
    html +=
      '<div class="list-rows">' +
      rowBtn('feedback-box', Copy.FB_BOX_ENTRY(ctx.feedbackPending || 0), 'feedback') +
      rowBtn('changelog', Copy.CHANGELOG_ENTRY, 'changelog') +
      '</div>';

    // 页脚：一句话 + 上方一条很淡的分隔线
    html +=
      '<footer class="page-foot">' +
      '<p class="page-foot__text">' + esc(Copy.FOOTER_TEXT()) + '</p>' +
      '</footer>';

    html += '</div>';
    return html;
  }

  root.QuizViewList = { render: render };
})(typeof globalThis !== 'undefined' ? globalThis : this);
