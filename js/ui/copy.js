/**
 * 界面文案 —— js/ui/copy.js
 *
 * 规范要求：状态与文案是「渲染层常量」，不放进数据文件。
 * 全站文案只在这里定义，避免同一个说法在多处漂移。
 */
(function (root) {
  'use strict';

  /* 首页大标题拆两段：前半句用正文色、后半句用强调色（同字号同字重）。
     三段都从这两个字面量拼出来，改文案只改这里。 */
  var LIST_TITLE_HEAD = '今天刷';
  var LIST_TITLE_ACCENT = '哪套？';

  var Copy = {
    /* 站点 */
    SITE_NAME: 'Recall',

    /* 题库列表（首页）：标题 / 副文案 / 统计胶囊 / 题型图例 / 页脚 */
    // 标题与副文案都不带数字、不提实现细节（浏览器 / localStorage）——加题库时不用改文案
    LIST_TITLE: LIST_TITLE_HEAD + LIST_TITLE_ACCENT,
    LIST_TITLE_HEAD: LIST_TITLE_HEAD,
    LIST_TITLE_ACCENT: LIST_TITLE_ACCENT,
    LIST_HINT: '先做一道，剩下的慢慢来。',
    LIST_ENTER: '进入',
    LIST_RESUME: '继续',
    HERO_DONE: '已练',
    HERO_WRONG: '错题',
    HERO_STARS: '收藏',
    HERO_UNIT: '题',
    /** 图例/分布条的无障碍说明：「单选 192 · 多选 12 · 判断 15」 */
    LIST_LEGEND: function (counts) {
      var order = ['single', 'multiple', 'judge'];
      var parts = [];
      for (var i = 0; i < order.length; i++) {
        var n = (counts && counts[order[i]]) || 0;
        if (n) parts.push(Copy.TYPE_SHORT_NAME(order[i]) + ' ' + n);
      }
      return parts.join(' · ');
    },
    FOOTER_TEXT: function () {
      return '数据只存在本机 · ' + Copy.SITE_NAME;
    },

    /* 首页：最近练习（跨题库合并的已完成记录，最多 3 条） */
    RECENT_TITLE: '最近练习',
    RECENT_ALL: '全部记录 ›',
    RECENT_EMPTY: '还没有练习记录，先做一轮',
    RECENT_START: '开始',
    RECENT_SCORE: function (correct, scorable) {
      return '答对 ' + correct + ' / ' + scorable;
    },
    /** 完成时间：当天显示「今天 14:20」，其余「10-17 21:05」（本机时间） */
    RECENT_WHEN: function (iso) {
      var d = iso ? new Date(iso) : null;
      if (!d || isNaN(d.getTime())) return '—';
      var now = new Date();
      function p(x) {
        return (x < 10 ? '0' : '') + x;
      }
      var hm = p(d.getHours()) + ':' + p(d.getMinutes());
      var today = d.getFullYear() === now.getFullYear()
        && d.getMonth() === now.getMonth()
        && d.getDate() === now.getDate();
      return today ? '今天 ' + hm : p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + hm;
    },

    /* 答题页 */
    PROGRESS_QUESTION: function (current, total) {
      return '第 ' + current + '/' + total + ' 题';
    },
    PROGRESS_CORRECT: function (n) {
      return '已答对 ' + n + ' 道';
    },
    /* 题号跳转：输入「第几题」（按本轮题序），非法时提示可用区间 */
    JUMP_PLACEHOLDER: '题号',
    JUMP_BTN: '跳',
    JUMP_DOCK_BTN: '确认跳转',
    JUMP_ARIA: '跳到第几题',
    JUMP_HINT: function (total) {
      return '1–' + total;
    },

    /* 答题卡（题号网格）：一格一题，点格子跳题；顶部一行实时统计 */
    ANSWER_CARD_TOGGLE: '总览',
    ANSWER_CARD_TOGGLE_ARIA: '总览：按题号查看答题情况',
    ANSWER_CARD_TITLE: '答题卡',
    ANSWER_CARD_CLOSE: '关闭',
    ANSWER_CARD_STATS: function (unanswered, correct, wrong) {
      return '未答 ' + unanswered + ' · 答对 ' + correct + ' · 答错 ' + wrong;
    },
    /* 宽屏浮窗只有 130px，完整文案会折行：拆成两行短句，各自一行放得下 */
    ANSWER_CARD_STATS_SIDE_UNANSWERED: function (unanswered) {
      return '未答 ' + unanswered;
    },
    ANSWER_CARD_STATS_SIDE_RESULT: function (correct, wrong) {
      return '对 ' + correct + ' · 错 ' + wrong;
    },
    ANSWER_CARD_STATE_CN: {
      unanswered: '未答',
      correct: '已答对',
      wrong: '已答错',
    },
    /** 每格的无障碍名字：「第 3 题，已答对」 */
    ANSWER_CARD_CELL_ARIA: function (n, state) {
      return '第 ' + n + ' 题，' + (Copy.ANSWER_CARD_STATE_CN[state] || Copy.ANSWER_CARD_STATE_CN.unanswered);
    },

    /* 题型：数据里只存 type（single / multiple / judge），中文名属于展示层 */
    TYPE_CN: {
      single: '单选题',
      multiple: '多选题',
      judge: '判断题',
    },
    TYPE_NAME: function (type) {
      return Copy.TYPE_CN[type] || String(type);
    },
    /** 图例里的短名（去「题」字）：「单选 192 · 多选 12 · 判断 15」 */
    TYPE_SHORT_NAME: function (type) {
      return (Copy.TYPE_CN[type] || String(type)).replace(/题$/, '');
    },

    /* 选项状态标签 */
    TAG_CORRECT: '正确答案',
    TAG_YOURS: '你的选择',

    /* 判定提示 */
    TIP_OK: '答对了',
    TIP_BAD: '答错了',
    TIP_CORRECT_IS: function (letters) {
      return '正确答案是 ' + letters.join('、');
    },
    TIP_YOURS_IS: function (letters) {
      return '你选的是 ' + letters.join('、');
    },

    /* 数据异常 */
    INVALID_NOTICE: '本题数据异常，不计入判分',

    /* 修改答案（交卷前） */
    BTN_MODIFY: '修改答案',
    MODIFY_UNLOCKED: '已解锁，改选后点「提交」重新判定（交卷后不可再改）',
    MODIFY_HINT_TITLE: '本题已解锁',

    /* 按钮 */
    BTN_SUBMIT: '提交',
    BTN_SUBMITTED: '已提交',
    BTN_INVALID: '本题不计分',
    BTN_PREV: '上一题',
    BTN_NEXT: '下一题',
    BTN_FINISH: '交卷',
    BTN_BACK: '返回题库列表',
    BTN_BACK_TOPBAR: '返回',
    BTN_CANCEL: '取消',
    BTN_CONFIRM_FINISH: '确定交卷',

    /* 交卷确认 */
    CONFIRM_TITLE: '交卷',
    CONFIRM_INCOMPLETE: function (n) {
      return '还有 ' + n + ' 题没做，确定交卷？';
    },
    CONFIRM_ALL_DONE: '全部题目都做完了，确定交卷？',

    /* 结果页 */
    RESULT_TITLE: '答题结果',
    STAT_CORRECT: '答对',
    STAT_WRONG: '答错',
    STAT_ACCURACY: '正确率',
    RESULT_SCOPE: function (scorable, invalid) {
      return invalid
        ? '参与判分 ' + scorable + ' 题（另有 ' + invalid + ' 题数据异常未计入）'
        : '参与判分 ' + scorable + ' 题';
    },
    RESULT_SKIPPED: function (n) {
      return '未作答 ' + n + ' 题';
    },
    RESULT_SECTION_WRONG: '错题',
    RESULT_SECTION_SKIPPED: '未作答',
    RESULT_PERFECT: '全部答对，没有错题。',
    RESULT_NO_SKIPPED: '没有未作答的题。',
    RESULT_JUMP: '查看',

    /* 重练：从某一轮的错题派生出新的一轮 */
    REPLAY_BTN: function (n) {
      return '再练一遍没做对的（' + n + '）';
    },
    REPLAY_NONE: '这一轮没有做错的题',
    REPLAY_HINT: '只练本轮已提交且判错的题，题序与原轮一致；新的一轮有自己独立的作答与成绩。',
    REPLAY_LABEL: function (when, wrong) {
      return '重练 · 来自 ' + when + ' 的那轮（错 ' + wrong + ' 题）';
    },
    ROUND_SNAPSHOT_NOTE: '这是已完成的一轮记录，只读。',
    BTN_OPEN_SOURCE: '查看原轮结果',
    /** 轮次时间：显示为「10-17 14:20」（本机时间） */
    ROUND_WHEN: function (iso) {
      var d = iso ? new Date(iso) : new Date();
      if (isNaN(d.getTime())) return '—';
      function p(x) {
        return (x < 10 ? '0' : '') + x;
      }
      return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    },

    /* 结果页：复制成绩（纯文本，粘到聊天里就能看） */
    RESULT_COPY_BTN: '复制成绩',
    RESULT_COPIED: '已复制',
    RESULT_COPY_FAILED: '复制失败',
    /** 用时：06:32；超过 1 小时给 1:02:03；时间缺失/非法返回 '' （调用方据此省略这一项） */
    FMT_DURATION: function (startISO, endISO) {
      var a = startISO ? new Date(startISO).getTime() : NaN;
      var b = endISO ? new Date(endISO).getTime() : NaN;
      if (isNaN(a) || isNaN(b) || b < a) return '';
      var sec = Math.max(1, Math.round((b - a) / 1000));
      function p(x) {
        return (x < 10 ? '0' : '') + x;
      }
      var h = Math.floor(sec / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var s = sec % 60;
      return h ? h + ':' + p(m) + ':' + p(s) : p(m) + ':' + p(s);
    },
    /**
     * 一轮成绩的复制文本。题库名/范围/得分/时间全部来自本轮真实数据：
     *   我在《Web前端题库》做完一轮「二、HTML进阶 15 题」：
     *   答对 12 / 15，正确率 80%，用时 06:32。
     *   —— Recall · 2026-10-17 14:20
     */
    RESULT_TEXT: function (o) {
      var head = '我在《' + o.bankTitle + '》做完一轮';
      if (o.scopeLabel) head += '「' + o.scopeLabel + '」';
      head += '：';
      var line2 = '答对 ' + o.correct + ' / ' + o.scorable + '，正确率 ' + o.accuracy + '%';
      if (o.duration) line2 += '，用时 ' + o.duration;
      line2 += '。';
      return [head, line2, '—— ' + Copy.SITE_NAME + ' · ' + Copy.FB_WHEN(o.at)].join('\n');
    },

    /* 练习记录 */
    RECORDS_ENTRY: function (n) {
      return '练习记录（' + n + '）';
    },
    RECORDS_TITLE: '练习记录',
    RECORDS_HINT: '按时间倒序。已完成的一轮可以回看（只读，数字与交卷时一致）；进行中的一轮可以接着做。',
    RECORDS_EMPTY: '还没有练习记录',
    RECORD_KIND_NORMAL: '普通练习',
    RECORD_KIND_PRACTICE: '重练',
    RECORD_STATUS_DONE: '已完成',
    RECORD_STATUS_ACTIVE: '进行中',
    RECORD_ACTION_DONE: '查看',
    RECORD_ACTION_ACTIVE: '继续',
    /** 已完成一行的成绩：答对 3 / 参与判分 119（3%） */
    RECORD_SCORE: function (correct, scorable, accuracy) {
      return '答对 ' + correct + ' / ' + scorable + '（' + accuracy + '%）';
    },
    /** 进行中一行的进度：已答 5 / 119 题 */
    RECORD_PROGRESS: function (answered, scorable) {
      return '已答 ' + answered + ' / ' + scorable + ' 题';
    },
    RECORD_META: function (when, total) {
      return (when || '—') + ' · ' + total + ' 题';
    },
    RECORD_FROM: function (when, wrong) {
      return ' · 来自 ' + (when || '—') + ' 的那轮（错 ' + wrong + ' 题）';
    },

    /* 开始一轮（范围选择） */
    START_TITLE: '开始一轮',
    START_SUBTITLE: function (title, total) {
      return title + ' · 共 ' + total + ' 题';
    },
    SCOPE_ALL: '全部',
    SCOPE_CHAPTERS: '按章节',
    SCOPE_RANDOM: '随机',
    SCOPE_ALL_NOTE: function (n) {
      return n + ' 题 · 题库原顺序';
    },
    SCOPE_CHAPTERS_NOTE: function (n) {
      return '共 ' + n + ' 章，可多选';
    },
    SCOPE_RANDOM_NOTE: '只抽一次，题序抽完就固定',
    SCOPE_COUNT: function (n) {
      return n + ' 题';
    },
    /** 随机「自定义题数」输入框 */
    SCOPE_COUNT_LABEL: '随机题数',
    SCOPE_COUNT_UNIT: '题',
    SCOPE_COUNT_INVALID: function (total) {
      return '请输入 1–' + total + ' 之间的题数';
    },
    SCOPE_COUNT_OVER: function (total) {
      return '题库共 ' + total + ' 题';
    },
    START_BTN: '开始',
    /** 面板顶部：已经有一轮没做完 */
    START_ACTIVE: function (index, total, correct) {
      return '有一轮没做完：第 ' + (index + 1) + ' / ' + total + ' 题 · 已答对 ' + correct;
    },
    START_CONTINUE: '继续',
    START_RESTART: '重新开始',
    START_NEED_CHAPTER: '至少选 1 章',
    START_TOO_FEW: function (n) {
      return '题库不足 ' + n + ' 题';
    },
    /** 重新开始 / 换范围重开的二次确认 */
    CONFIRM_RESTART_TITLE: '重新开始这一轮？',
    CONFIRM_RESTART_MESSAGE: '会清空这一轮未完成的作答，历史练习记录不受影响。',
    CONFIRM_RESTART_OK: '清空并重新开始',
    /** 直接换范围开新一轮 = 放弃当前这一轮 */
    CONFIRM_ABANDON_TITLE: '开始新的一轮？',
    CONFIRM_ABANDON_MESSAGE: '当前这一轮没做完的作答会被丢弃，历史练习记录不受影响。',
    CONFIRM_ABANDON_OK: '丢弃并开始',
    /** 范围标签在记录行里的分隔 */
    SCOPE_SEP: ' · ',

    /* 题目纠错反馈 */
    FB_ENTRY: '反馈',
    FB_PANEL_TITLE: '反馈这道题',
    FB_PANEL_HINT: '反馈只存在本机，不会自动上传。提交后点「复制这条反馈」，把文本贴给维护者就算上报。',
    FB_BANK: '题库',
    FB_NO: '题号',
    FB_TYPE: '题型',
    FB_STEM: '题干',
    FB_PICKED: '我的选择',
    FB_ANSWER: '当前答案',
    FB_PAGE: '页面',
    FB_TIME: '时间',
    FB_KIND_LABEL: '问题类型',
    FB_KIND_CN: {
      stem: '题干有误',
      option: '选项有误',
      answer: '答案有误',
      explain: '解析有误',
      other: '其他',
    },
    FB_KIND_NAME: function (kind) {
      return Copy.FB_KIND_CN[kind] || Copy.FB_KIND_CN.other;
    },
    FB_NOTE_LABEL: function (max) {
      return '备注（选填，最多 ' + max + ' 字）';
    },
    FB_NOTE_PLACEHOLDER: '补充说明（选填）',
    FB_NOTE_COUNT: function (n, max) {
      return n + ' / ' + max;
    },
    FB_SUBMIT: '提交反馈',
    FB_SAVED: '已记录（仅本设备）',
    FB_SAVED_HINT: '想让维护者看到，就复制下面这段文字贴给他。',
    /* 服务端模式（起过 server/server.mjs 才有） */
    FB_SAVED_ONLINE: '已上报',
    FB_SAVED_ONLINE_HINT: '已直接写进服务端的反馈库，维护者在管理后台能看到这条。',
    FB_COPY_ONE: '复制这条反馈',
    FB_CLOSE: '关闭',
    FB_NONE: '未作答',
    FB_PAGE_CN: { quiz: '答题页', result: '结果页' },
    FB_PAGE_NAME: function (page) {
      return Copy.FB_PAGE_CN[page] || Copy.FB_PAGE_CN.quiz;
    },
    /** 复制文本里的时间：2026-10-17 14:02（本机时间） */
    FB_WHEN: function (iso) {
      var d = iso ? new Date(iso) : new Date();
      if (isNaN(d.getTime())) return '—';
      function p(x) {
        return (x < 10 ? '0' : '') + x;
      }
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
        ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    },
    /** 单条反馈的复制文本（格式固定，可直接贴进聊天窗口） */
    FB_TEXT: function (rec) {
      var picked = rec.picked && rec.picked.length ? rec.picked.join('、') : Copy.FB_NONE;
      var answer = rec.answer && rec.answer.length ? rec.answer.join('、') : '—';
      return [
        '【题库纠错】' + (rec.bankTitle || rec.bankKey) + ' · 第 ' + rec.questionId + ' 题（' + Copy.TYPE_NAME(rec.qtype) + '）',
        '类型：' + Copy.FB_KIND_NAME(rec.kind),
        '我的选择：' + picked + ' ｜ 当前答案：' + answer,
        '题干：' + (rec.stem || '—'),
        '说明：' + (rec.note || '（可选）'),
        '页面：' + Copy.FB_PAGE_NAME(rec.page) + ' ｜ 时间：' + Copy.FB_WHEN(rec.at),
      ].join('\n');
    },
    /** 整个反馈箱的复制文本：每条之间空一行 */
    FB_TEXT_ALL: function (items) {
      var parts = [];
      for (var i = 0; i < items.length; i++) parts.push(Copy.FB_TEXT(items[i]));
      return parts.join('\n\n');
    },

    /* 反馈箱 */
    FB_BOX_ENTRY: function (n) {
      return n > 0 ? '反馈箱（' + n + '）' : '反馈箱';
    },
    FB_BOX_TITLE: '反馈箱',
    FB_BOX_HINT: '反馈只存本机。复制成文字贴给维护者就算上报；删除、清空只影响本机。',
    FB_BOX_EMPTY: '还没有反馈',
    FB_STATUS_PENDING: '待上报',
    FB_STATUS_COPIED: '已复制',
    FB_ACTION_COPY: '复制',
    FB_ACTION_DELETE: '删除',
    FB_COPY_ALL: function (n) {
      return '全部复制（' + n + '）';
    },
    FB_CLEAR: '清空反馈箱',
    FB_CLEAR_TITLE: '清空反馈箱？',
    FB_CLEAR_MESSAGE: '本机记录会全部删掉，无法恢复。已经复制出去的内容不受影响。',
    FB_CLEAR_OK: '清空',
    FB_COPIED_HINT: '已复制到剪贴板',
    FB_COPY_FAILED: '复制失败：请手动选中文本，或用长按/右键复制',
    FB_ROW_META: function (bankTitle, no, kindName) {
      return bankTitle + ' · 第 ' + no + ' 题 · ' + kindName;
    },

    /* 维护日志（公开） */
    CHANGELOG_ENTRY: '维护日志',
    CHANGELOG_TITLE: '维护日志',
    CHANGELOG_HINT: '公开记录：题库修正、功能更新、样式调整。新的在上。',
    CHANGELOG_EMPTY: '还没有日志',
    CHANGELOG_TYPE_CN: {
      question: '题库修正',
      feature: '功能更新',
      style: '样式调整',
    },
    CHANGELOG_TYPE_NAME: function (type) {
      return Copy.CHANGELOG_TYPE_CN[type] || type;
    },
    CHANGELOG_BACK: '返回题库列表',

    /* 主题（三态）：按钮上是「当前选择」，菜单里三项，选中项带勾 */
    THEME_SYSTEM: '跟随系统',
    THEME_LIGHT: '亮色',
    THEME_DARK: '暗色',
    /** 按钮上的短标签（空间小） */
    THEME_SHORT_SYSTEM: '跟随',
    THEME_SHORT_LIGHT: '亮色',
    THEME_SHORT_DARK: '暗色',
    THEME_MENU_TITLE: '主题',
    THEME_MENU_HINT: '选择主题（跟随系统 / 亮色 / 暗色）',
    THEME_LABEL: function (mode) {
      if (mode === 'light') return Copy.THEME_SHORT_LIGHT;
      if (mode === 'dark') return Copy.THEME_SHORT_DARK;
      return Copy.THEME_SHORT_SYSTEM;
    },

    /* 错题本（跨轮聚合）与 收藏练习 */
    WRONGBOOK_ENTRY: function (n) {
      return '错题本（' + n + '）';
    },
    WRONGBOOK_TITLE: '错题本',
    WRONGBOOK_HINT: '跨所有已完成的一轮汇总：同一道题只出现一次，记做错次数与最近一次做错的时间。',
    WRONGBOOK_EMPTY: '还没有错题，去练一轮吧',
    WRONGBOOK_NOTE_EMPTY: '还没有错题',
    WRONGBOOK_NOTE_EMPTY_SHORT: '暂无错题',
    WRONGBOOK_COUNT: function (n) {
      return '错 ' + n + ' 次';
    },
    WRONGBOOK_LAST: function (when) {
      return '最近 ' + (when || '—');
    },
    WRONGBOOK_CHAPTER: function (title, n) {
      return (title || '未分章') + '（' + n + '）';
    },
    WRONGBOOK_START: function (n) {
      return '错题练习（' + n + '）';
    },
    WRONGBOOK_START_HINT: '只练错题本里的题，按章节与题号顺序；作答、交卷、成绩都跟普通一轮一样。',
    WRONGBOOK_START_NONE: '错题本是空的：先做一轮，答错的题会自动进来。',

    STAR_MARK: '标记重点题',
    STAR_UNMARK: '取消标记',
    STAR_ON: '★',
    STAR_OFF: '☆',

    STARS_ENTRY: function (n) {
      return '收藏练习（' + n + '）';
    },
    STARS_NOTE_EMPTY: '还没有标记的题',
    STARS_NOTE_EMPTY_SHORT: '暂无收藏',
    STARS_START: function (n) {
      return '收藏练习（' + n + '）';
    },
    STARS_START_HINT: '只练这个题库里标了星的题，按题库原顺序；作答、交卷、成绩都跟普通一轮一样。',
    STARS_START_NONE: '还没有标记的题：在答题页点题目卡片右上角的星标就能收藏。',

    /** 错题练习 / 收藏练习在答题页、结果页、记录页的来源标记 */
    POOL_KIND_WRONGBOOK: '错题练习',
    POOL_KIND_STARS: '收藏练习',
    POOL_NAME: function (kind) {
      return kind === 'stars' ? Copy.POOL_KIND_STARS : Copy.POOL_KIND_WRONGBOOK;
    },
    POOL_BADGE: function (name, n) {
      return name + ' · 共 ' + n + ' 题';
    },
    RECORD_KIND_WRONGBOOK: '错题练习',
    RECORD_KIND_STARS: '收藏练习',

    /* 通用 */
    ANSWER_NONE: '未作答',
    EXPLAIN_LABEL: '解析',
  };

  root.QuizCopy = Copy;
})(typeof globalThis !== 'undefined' ? globalThis : this);
