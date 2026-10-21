/**
 * 控制器 —— js/app.js
 *
 * 唯一职责：把「视图（纯渲染）」和「模型（session / round / judge / store）」连起来。
 *  - 路由：题库列表 / 答题页 / 结果页
 *  - 轮次：普通练习轮（全库）· 重练轮（某一轮的错题）· 历史快照（只读）
 *  - 事件：只在这里处理用户操作，视图里不放业务逻辑
 *  - 刷新恢复：把「当前是哪一类轮、哪个题库、哪一份快照」记在本机
 *
 * 三类轮的唯一区别是「题目列表 + 进度键」，行为全部复用同一套 Session：
 *   normal    全库题号，键 quiz:progress:<bankKey>（老键，保持兼容）
 *   practice  原轮错题题号，键 quiz:practice:<bankKey>:<roundId>
 *   wrongbook 错题本题号（跨轮聚合），键 quiz:pool:<bankKey>:wrongbook
 *   stars     收藏题号（题库原序），键 quiz:pool:<bankKey>:stars
 *   snapshot  历史快照，只读视图（Round.view），无键
 */
(function (root) {
  'use strict';

  var SessionNS = root.QuizSession;
  var Session = SessionNS.Session;
  var KIND = SessionNS.KIND;
  var Round = root.QuizRound;
  var Scope = root.QuizScope;
  var Store = root.QuizStore;
  var Feed = root.QuizFeedback;
  var Theme = root.QuizTheme;
  var Wrongbook = root.QuizWrongbook;
  var Stars = root.QuizStars;
  var Copy = root.QuizCopy;
  var OUTCOME = root.QuizJudge.OUTCOME;
  var esc = root.QuizRich.escapeHtml;

  var APP_KEY = 'quiz:app';
  var appStore = Store.createStore({
    storage: Store.defaultStorage(),
    key: APP_KEY,
    version: 1,
  });

  // mode: 'normal' | 'practice' | 'wrongbook' | 'stars' | 'snapshot'
  // view: 'list' | 'quiz' | 'result' | 'records' | 'wrongbook' | 'feedback' | 'changelog'
  var state = { view: 'list', mode: 'normal', bankKey: null, sourceRoundId: null, snapshotId: null };
  var session = null;
  var currentRound = null; // 刚冻结 / 正在查看的快照（内存副本）
  var pendingFocus = null;
  var modalConfirm = null;
  var modalClose = null; // 弹窗关掉之后要恢复的东西（例如「开始一轮」面板）
  var fbPanel = null; // 反馈面板状态（不进 state、不落盘）
  var answerCardOpen = false; // 答题卡展开状态（不进 state、不落盘；离开答题页就收起）
  var lastCopied = ''; // 最近一次复制出去的文本（供自测页断言，不参与业务）
  var copyTimer = null; // 「已复制」文案的恢复定时器
  var lastScrollKey = '';
  var viewStack = []; // 顶栏「返回」的层级栈（只在内存里，刷新即清空）

  // 主题（夜间模式）：默认浅色；值存在 quiz:theme，切换只改 <html data-theme>
  var theme = Theme.load();

  /* ------------------------- 题库注册 ------------------------- */
  // 数据来自 js/data/*.js（由 tools/convert-banks.mjs 生成）。这里只登记有哪些题库。
  function bankList() {
    return [root.JAVA_BANK, root.WEB_BANK].filter(function (b) {
      return b && b.questions && b.questions.length;
    });
  }

  function findBank(key) {
    var all = bankList();
    for (var i = 0; i < all.length; i++) if (all[i].key === key) return all[i];
    return null;
  }

  /** 列表页显示的进度摘要。统计口径仍走 session，不在这里另算一套。 */
  function progressOf(bankKey) {
    var bank = findBank(bankKey);
    if (!bank) return null;
    var s = new Session(bank, {});
    var st = s.stats();
    return st.answered > 0 ? { answered: st.answered, index: s.index } : null;
  }

  /** 某题库的练习记录（已完成快照 + 进行中进度），字段与排序都由 round.js 备好 */
  function recordsOf(bankKey) {
    var bank = findBank(bankKey);
    if (!bank) return [];
    return Round.records(bank);
  }

  /** 待上报的反馈条数（首页入口的角标） */
  function feedbackPending() {
    return Feed.pendingCount();
  }

  /** 某题库的错题本条目（跨轮聚合，口径与排序都在 wrongbook.js 里定死） */
  function wrongBookOf(bankKey) {
    var bank = findBank(bankKey);
    if (!bank) return [];
    return Wrongbook.entries(bank);
  }

  /** 某题库收藏了哪几道（题库原序） */
  function starsOf(bankKey) {
    var bank = findBank(bankKey);
    if (!bank) return [];
    return Stars.ids(bank);
  }

  /** 当前这一轮里，这道题标星了吗（答题页 / 结果页共用） */
  function starredOf(qid) {
    if (!session) return false;
    return Stars.has(session.bank.key, qid);
  }

  /**
   * 首页「最近练习」：跨题库合并的**已完成**轮次，按 finishedAt 倒序取前 3 条。
   * 数据来源仍是 round.js 的 records（快照冻结值），这里只做合并/截断/取名，
   * 不另算一套统计；进行中的一轮不进这个列表（首页已经用「继续 N」表达它）。
   */
  function recentRounds(limit) {
    var banks = bankList();
    var out = [];
    for (var i = 0; i < banks.length; i++) {
      var arr = recordsOf(banks[i].key);
      for (var j = 0; j < arr.length; j++) {
        var r = arr[j];
        if (r.status !== 'done') continue;
        out.push({
          key: r.key,
          bankKey: banks[i].key,
          bankTitle: banks[i].title,
          scopeLabel: r.scopeLabel || '',
          correct: r.correct,
          scorable: r.scorable,
          score: r.accuracy + '%',
          finishedAt: r.finishedAt,
        });
      }
    }
    out.sort(function (a, b) {
      var x = a.finishedAt || '';
      var y = b.finishedAt || '';
      if (x === y) return 0;
      return x < y ? 1 : -1; // 新的在前
    });
    return out.slice(0, limit || 3);
  }

  /* ------------------------- 状态持久化 ------------------------- */
  function saveState() {
    appStore.save({
      view: state.view,
      mode: state.mode,
      bankKey: state.bankKey,
      sourceRoundId: state.sourceRoundId,
      snapshotId: state.snapshotId,
    });
  }

  function restoreState() {
    var saved = appStore.load();
    if (!saved) return;

    // 无会话的两个页面：反馈箱 / 维护日志（刷新后停在同一页）
    if (saved.view === 'feedback' || saved.view === 'changelog') {
      state.view = saved.view;
      state.mode = KIND.NORMAL;
      state.bankKey = null;
      state.sourceRoundId = null;
      state.snapshotId = null;
      return;
    }

    if (saved.view !== 'quiz' && saved.view !== 'result' && saved.view !== 'records' && saved.view !== 'wrongbook') return;
    var bank = findBank(saved.bankKey);
    if (!bank) return;

    // 练习记录页 / 错题本页：只是列表视图，没有会话
    if (saved.view === 'records' || saved.view === 'wrongbook') {
      state.view = saved.view;
      state.mode = KIND.NORMAL;
      state.bankKey = bank.key;
      state.sourceRoundId = null;
      state.snapshotId = null;
      return;
    }

    // 历史快照：只读结果页
    if (saved.mode === 'snapshot') {
      var snap = Round.roundStore(bank.key).get(String(saved.snapshotId || ''));
      if (!snap) return; // 记录不在了就老实回列表，不硬撑
      session = Round.view(snap, bank);
      currentRound = snap;
      state.view = 'result';
      state.mode = 'snapshot';
      state.bankKey = bank.key;
      state.snapshotId = snap.id;
      return;
    }

    // 重练轮：进度键由原轮 id 决定
    if (saved.mode === 'practice') {
      var srcId = saved.sourceRoundId ? String(saved.sourceRoundId) : '';
      if (!srcId) return;
      var ps = new Session(bank, { kind: KIND.PRACTICE, storageKey: Round.practiceKey(bank.key, srcId) });
      if (!ps.hasPersistedProgress()) return; // 进度没了就不要退化成全库题
      session = ps;
      state.mode = KIND.PRACTICE;
      state.bankKey = bank.key;
      state.sourceRoundId = srcId;
      state.view = saved.view;
      return;
    }

    // 错题练习 / 收藏练习：进度键由 kind 决定（每个题库每种练习各一条）
    if (saved.mode === KIND.WRONGBOOK || saved.mode === KIND.STARS) {
      var pool = new Session(bank, {
        kind: saved.mode,
        storageKey: Round.poolKey(bank.key, saved.mode),
      });
      if (!pool.hasPersistedProgress()) return; // 进度没了就不要退化成全库题
      session = pool;
      state.mode = saved.mode;
      state.bankKey = bank.key;
      state.sourceRoundId = null;
      state.snapshotId = null;
      state.view = saved.view;
      return;
    }

    // 普通轮（含老版本留存的数据）
    session = new Session(bank, {});
    state.mode = KIND.NORMAL;
    state.view = saved.view;
    state.bankKey = bank.key;
  }

  /* ------------------------- 渲染 ------------------------- */
  function render() {
    var app = document.getElementById('app');
    var titleEl = document.getElementById('topTitle');
    var finishBtn = document.getElementById('btnFinish');
    var backBtn = document.getElementById('btnBack');

    // 答题卡只在答题页有意义：离开答题页就收起，不把展开状态带进结果页 / 首页
    if (state.view !== 'quiz') answerCardOpen = false;

    var ctx = {
      banks: bankList(),
      progressOf: progressOf,
      recordsOf: recordsOf,
      wrongBookOf: wrongBookOf,
      starsOf: starsOf,
      starredOf: starredOf,
      feedbackPending: feedbackPending(),
      recent: recentRounds(3),
      session: session,
      // 历史记录只读：不提供跳题、不提供交卷
      readonly: !!(session && session.isSnapshot),
      answerCardOpen: answerCardOpen,
    };

    if (state.view === 'quiz' && session && !session.isSnapshot) {
      app.innerHTML = root.QuizViewQuiz.render(ctx);
      titleEl.textContent = session.bank.title;
      finishBtn.hidden = false;
    } else if (state.view === 'result' && session) {
      app.innerHTML = root.QuizViewResult.render(ctx);
      titleEl.textContent = Copy.RESULT_TITLE;
      finishBtn.hidden = true;
    } else if (state.view === 'records') {
      var bank = findBank(state.bankKey);
      app.innerHTML = root.QuizViewRecords.render({
        bank: bank,
        records: recordsOf(state.bankKey),
      });
      titleEl.textContent = Copy.RECORDS_TITLE;
      finishBtn.hidden = true;
    } else if (state.view === 'wrongbook') {
      var wb = findBank(state.bankKey);
      var wbEntries = wrongBookOf(state.bankKey);
      app.innerHTML = root.QuizViewWrongbook.render({
        bank: wb,
        groups: wb ? Wrongbook.groups(wb) : [],
        count: wbEntries.length,
        entries: wbEntries,
      });
      titleEl.textContent = Copy.WRONGBOOK_TITLE;
      finishBtn.hidden = true;
    } else if (state.view === 'feedback') {
      app.innerHTML = root.QuizViewFeedback.renderBox({ items: Feed.list() });
      titleEl.textContent = Copy.FB_BOX_TITLE;
      finishBtn.hidden = true;
    } else if (state.view === 'changelog') {
      app.innerHTML = root.QuizViewChangelog.render({ items: root.QUIZ_CHANGELOG || [] });
      titleEl.textContent = Copy.CHANGELOG_TITLE;
      finishBtn.hidden = true;
    } else {
      state.view = 'list';
      state.mode = KIND.NORMAL;
      state.bankKey = null;
      state.sourceRoundId = null;
      state.snapshotId = null;
      session = null;
      currentRound = null;
      app.innerHTML = root.QuizViewList.render(ctx);
      titleEl.textContent = Copy.SITE_NAME;
      finishBtn.hidden = true;
    }

    // 把当前视图写到 <body data-view>，只给样式层用：宽屏时首页容器放宽到 960，
    // 顶栏也跟着放宽，站名和主题按钮才与内容左右对齐；其余视图仍是 760。
    if (document.body) document.body.setAttribute('data-view', state.view);

    // 顶栏「返回」：所有二级页面都有（列表页是根，不显示）。
    // 点它走 goBack()，按层级返回上一级；页面底部的「返回题库列表」保持原样，直接回列表。
    if (backBtn) backBtn.hidden = state.view === 'list';

    // 换视图 / 换题时回到顶部（结果页点「查看」跳题除外）
    var scrollKey = state.view + ':' + (state.bankKey || '') + ':' + (session ? session.index : 0) + ':' + (session ? session.snapshotId || '' : '');
    if (scrollKey !== lastScrollKey) {
      lastScrollKey = scrollKey;
      window.scrollTo(0, 0);
    }

    applyFocus();
  }

  function applyFocus() {
    if (!pendingFocus) return;
    var sel = pendingFocus;
    pendingFocus = null;
    var el = document.querySelector(sel);
    if (el && !el.disabled) el.focus({ preventScroll: true });
  }

  /* ------------------------- 操作 ------------------------- */
  /* ------------------------- 开始一轮（范围选择） ------------------------- */
  // 面板自己的临时状态：不进 state、不落盘（关掉就当没选过）
  var panel = null;

  function defaultPanel(bank) {
    var n = 0;
    for (var i = 0; i < Scope.RANDOM_SIZES.length; i++) {
      if (bank.questions.length >= Scope.RANDOM_SIZES[i]) {
        n = Scope.RANDOM_SIZES[i];
        break;
      }
    }
    // n 存字符串：用户可能在输入框里留下空串 / 半截数字，这些也要能如实校验
    return { bankKey: bank.key, type: Scope.TYPES.ALL, chapterNos: [], n: String(n), nFromPreset: true };
  }

  /** 点题库卡片：先选范围，不直接进答题页 */
  function openStart(bankKey) {
    var bank = findBank(bankKey);
    if (!bank) return;
    panel = defaultPanel(bank);
    renderPanel(true);
  }

  /** 进行中的普通轮摘要（面板顶部横幅）：统计只信 session，不另算 */
  function activeSummary(bank) {
    var s = new Session(bank, {});
    // 已经交过卷的那一轮由「练习记录」代表，不算「没做完」
    if (s.snapshotId) return null;
    var st = s.stats();
    if (!st.answered) return null;
    return { index: s.index, total: s.questions.length, correct: st.correct };
  }

  /**
   * 随机题数的校验（唯一一处）：面板里的按钮可不可点、提示说什么、开轮时用几题，全从这儿来。
   * 只认纯数字整数；空串 / 0 / 负数 / 小数 / 超过题库题数都不合法。
   */
  function randomCount(bank) {
    var total = bank.questions.length;
    var raw = String(panel && panel.n != null ? panel.n : '').trim();
    if (!/^\d+$/.test(raw)) return { ok: false, n: 0, hint: Copy.SCOPE_COUNT_INVALID(total) };
    var n = Number(raw);
    if (!(n >= 1)) return { ok: false, n: 0, hint: Copy.SCOPE_COUNT_INVALID(total) };
    if (n > total) return { ok: false, n: n, hint: Copy.SCOPE_COUNT_OVER(total) };
    return { ok: true, n: n, hint: '' };
  }

  function panelScope(bank) {
    if (!panel) return null;
    if (panel.type === Scope.TYPES.CHAPTERS) {
      return { type: panel.type, chapterNos: panel.chapterNos.slice(), n: 0 };
    }
    if (panel.type === Scope.TYPES.RANDOM) {
      return { type: panel.type, chapterNos: [], n: randomCount(bank).n };
    }
    return { type: Scope.TYPES.ALL, chapterNos: [], n: 0 };
  }

  function canStart(bank) {
    var scope = panelScope(bank);
    if (!scope) return false;
    if (scope.type === Scope.TYPES.CHAPTERS) return scope.chapterNos.length > 0;
    if (scope.type === Scope.TYPES.RANDOM) return randomCount(bank).ok;
    return true;
  }

  function startHint(bank) {
    var scope = panelScope(bank);
    if (!scope) return '';
    if (scope.type === Scope.TYPES.CHAPTERS && !scope.chapterNos.length) return Copy.START_NEED_CHAPTER;
    if (scope.type === Scope.TYPES.RANDOM) return randomCount(bank).hint;
    return '';
  }

  /**
   * 输入框每敲一下：只原地改「提示 + 开始按钮 + 档位高亮」，不整块重画面板——
   * 重画会把输入框换掉、焦点和输入法状态全丢。
   */
  function applyStartValidity(bank) {
    var host = document.getElementById('modalRoot');
    if (!host || !bank) return;
    var hintEl = host.querySelector('[data-start-hint]');
    var hint = startHint(bank);
    if (hintEl) {
      hintEl.textContent = hint;
      if (hint) hintEl.removeAttribute('hidden');
      else hintEl.setAttribute('hidden', '');
    }
    var startEl = host.querySelector('[data-act="start-round"]');
    var ok = canStart(bank);
    if (startEl) {
      if (ok) startEl.removeAttribute('disabled');
      else startEl.setAttribute('disabled', '');
      startEl.setAttribute('aria-disabled', ok ? 'false' : 'true');
    }
    var presets = host.querySelectorAll('[data-scope-n]');
    for (var i = 0; i < presets.length; i++) {
      var n = Number(presets[i].getAttribute('data-scope-n'));
      var on = panel.nFromPreset === true && Number(panel.n) === n && !presets[i].disabled;
      presets[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) presets[i].classList.add('btn--primary');
      else presets[i].classList.remove('btn--primary');
    }
  }

  function renderPanel(focusFirst) {
    var host = document.getElementById('modalRoot');
    if (!host) return;
    var bank = panel ? findBank(panel.bankKey) : null;
    if (!bank) {
      host.innerHTML = '';
      return;
    }
    host.innerHTML = root.QuizViewStart.render({
      bank: bank,
      panel: panel,
      active: activeSummary(bank),
      canStart: canStart(bank),
      hint: startHint(bank),
    });
    if (focusFirst) {
      var el = host.querySelector('[data-scope-type="all"]') || host.querySelector('[data-modal-close]');
      if (el) el.focus({ preventScroll: true });
    }
  }

  /** 清掉这一轮未完成的作答（只动 quiz:progress:<题库>，已完成记录不受影响） */
  function clearProgress(bank) {
    Store.createStore({
      storage: Store.defaultStorage(),
      key: SessionNS.progressKey(bank.key),
      version: SessionNS.SCHEMA_VERSION,
    }).clear();
  }

  /** 按面板里选的范围真正开一轮 */
  function startRound(bank) {
    var scope = panelScope(bank);
    if (!scope || !canStart(bank)) return;
    var ids = Scope.ids(bank, scope);
    if (!ids.length) return;

    pushFrame();
    clearProgress(bank);

    session = new Session(bank, {
      // 「全部」不带题号：老键形态保持不变；章节 / 随机把本轮题号一起存下来
      questionIds: scope.type === Scope.TYPES.ALL ? null : ids,
      scope: scope,
    });
    session.persist(); // 一进来就落盘：选完范围立刻刷新也能接着做

    currentRound = null;
    panel = null;
    state.mode = KIND.NORMAL;
    state.bankKey = bank.key;
    state.sourceRoundId = null;
    state.snapshotId = null;
    state.view = 'quiz';
    closeModal();
    saveState();
    render();
  }

  /** 点「开始」：已有进行中的一轮时先确认（等于放弃当前轮） */
  function askStartRound() {
    if (!panel) return;
    var bank = findBank(panel.bankKey);
    if (!bank || !canStart(bank)) return;
    if (!activeSummary(bank)) {
      startRound(bank);
      return;
    }
    showModal({
      title: Copy.CONFIRM_ABANDON_TITLE,
      message: Copy.CONFIRM_ABANDON_MESSAGE,
      confirmText: Copy.CONFIRM_ABANDON_OK,
      onConfirm: function () {
        startRound(bank);
      },
      onClose: function () {
        renderPanel();
      },
    });
  }

  /** 点「重新开始」：清空这一轮未完成的作答，然后留在面板里重新选范围 */
  function askRestart() {
    if (!panel) return;
    var bank = findBank(panel.bankKey);
    if (!bank) return;
    showModal({
      title: Copy.CONFIRM_RESTART_TITLE,
      message: Copy.CONFIRM_RESTART_MESSAGE,
      confirmText: Copy.CONFIRM_RESTART_OK,
      onConfirm: function () {
        clearProgress(bank);
        render(); // 列表卡片上的「练习记录（N）」也要跟着更新
        panel = defaultPanel(bank);
        renderPanel(true);
      },
      onClose: function () {
        renderPanel();
      },
    });
  }

  /** 面板里「继续」：回到那一轮的原题号 */
  function continueFromPanel() {
    if (!panel) return;
    var bank = findBank(panel.bankKey);
    if (!bank) return;
    panel = null;
    closeModal();
    continueNormal(bank);
  }

  function doSubmit(fromKeyboard) {
    var result = session.submit();
    // 提交后把焦点交给「下一题 / 交卷」，键盘可以一路走下去。
    // 只有键盘触发时才接管焦点：鼠标点击不应该跳出焦点环。
    if (fromKeyboard && result.outcome !== OUTCOME.UNANSWERED) {
      pendingFocus = '[data-act="next"], [data-act="finish"]';
    }
    render();
  }

  /**
   * 交卷：先把这一轮冻结成只读快照（重复交卷不会重复造），再进结果页。
   * 结果页、重练轮、历史记录看到的数字都来自这份快照。
   */
  function freezeRound() {
    if (!session || session.isSnapshot) return session && session.snapshot || null;
    // 交卷即冻结：还开着「修改答案」的题在此合上（作答与判分保持现状），快照里不留过程状态
    session.sealEdits();
    var snap = Round.fromSession(session);
    Round.roundStore(session.bank.key).append(snap);
    session.setSnapshotId(snap.id);
    currentRound = snap;
    return snap;
  }

  function askFinish() {
    if (!session || session.isSnapshot) return;
    var stats = session.stats();
    var skipped = stats.scorable - stats.answered;
    var message = skipped > 0 ? Copy.CONFIRM_INCOMPLETE(skipped) : Copy.CONFIRM_ALL_DONE;

    showModal({
      title: Copy.CONFIRM_TITLE,
      message: message,
      confirmText: Copy.BTN_CONFIRM_FINISH,
      onConfirm: function () {
        freezeRound();
        state.view = 'result';
        saveState();
        render();
      },
    });
  }

  /** 再练一遍没做对的：用本轮错题建一个独立的新轮（题序沿用原轮） */
  function startReplay() {
    if (!session) return;
    var ids = session.wrongIds();
    if (!ids.length) return; // 全对：按钮本来就是置灰的

    var sourceRoundId = session.isSnapshot ? session.snapshot.id : session.snapshotId;
    var endedAt = null;
    if (session.isSnapshot) {
      endedAt = session.snapshot.finishedAt;
    } else {
      var snap = currentRound && currentRound.id === session.snapshotId
        ? currentRound
        : Round.roundStore(session.bank.key).get(session.snapshotId);
      endedAt = snap ? snap.finishedAt : new Date().toISOString();
    }
    if (!sourceRoundId) return;

    // 同一轮反复点「再练一遍」应当是全新的一轮：清掉这一轮的旧重练进度
    Round.practiceStore(session.bank.key, sourceRoundId).clear();

    session = new Session(session.bank, {
      kind: KIND.PRACTICE,
      questionIds: ids,
      source: { roundId: sourceRoundId, endedAt: endedAt, wrong: ids.length },
      storageKey: Round.practiceKey(session.bank.key, sourceRoundId),
    });
    currentRound = null;
    state.mode = KIND.PRACTICE;
    state.bankKey = session.bank.key;
    state.sourceRoundId = sourceRoundId;
    state.snapshotId = null;
    state.view = 'quiz';
    // 立刻落一次盘：这样「刚进来还没答题」就刷新也能接着做（不然进度键还不存在）
    session.persist();
    saveState();
    render();
  }

  /** 打开某份历史快照（只读结果页；找不到就留在原地，不硬撑） */
  function openSnapshot(bank, snapshotId) {
    var snap = Round.roundStore(bank.key).get(String(snapshotId || ''));
    if (!snap) return;
    pushFrame();
    session = Round.view(snap, bank);
    currentRound = snap;
    state.mode = 'snapshot';
    state.bankKey = bank.key;
    state.sourceRoundId = null;
    state.snapshotId = snap.id;
    state.view = 'result';
    saveState();
    render();
  }

  /* ------------------------- 首页最近练习 ------------------------- */
  /** 点「最近练习」里的某条：用这条记录自己的题库打开只读快照（不看当前 state.bankKey） */
  function openRecent(bankKey, recordKey) {
    var bank = findBank(bankKey);
    if (!bank) return;
    var record = Round.findRecord(bank, String(recordKey));
    if (!record || record.status !== 'done') return; // 记录刚被清掉，什么也不做
    openSnapshot(bank, record.snapshotId);
  }

  /** 「全部记录 ›」：进练习记录页（优先最近一轮所在的题库，没有记录就用第一个题库） */
  function openAllRecords() {
    var newest = recentRounds(1);
    var bank = newest.length ? findBank(newest[0].bankKey) : null;
    if (!bank) bank = bankList()[0];
    if (bank) openRecords(bank.key);
  }

  /** 空态「开始」：弹「开始一轮」面板，默认 Web 题库 */
  function startFromRecent() {
    var bank = findBank('web') || bankList()[0];
    if (bank) openStart(bank.key);
  }

  /** 打开「这一轮是从哪来的」那轮结果（只读快照） */
  function openSourceRound() {
    if (!session || !session.source) return;
    openSnapshot(session.bank, session.source.roundId);
  }

  /* ------------------------- 练习记录 ------------------------- */
  /** 打开某题库的练习记录页 */
  function openRecords(bankKey) {
    var bank = findBank(bankKey);
    if (!bank) return;
    pushFrame();
    session = null;
    currentRound = null;
    state.view = 'records';
    state.mode = KIND.NORMAL;
    state.bankKey = bank.key;
    state.sourceRoundId = null;
    state.snapshotId = null;
    saveState();
    render();
  }

  /** 点记录里的一行：已完成的打开只读快照，进行中的回到原题号继续 */
  function openRecord(recordKey) {
    var bank = findBank(state.bankKey);
    if (!bank) return;
    var record = Round.findRecord(bank, String(recordKey));
    if (!record) return; // 记录刚被清掉（别的标签页操作过），什么也不做

    if (record.status === 'done') {
      openSnapshot(bank, record.snapshotId);
      return;
    }
    if (record.kind === KIND.PRACTICE) {
      continuePractice(bank, record.sourceRoundId);
      return;
    }
    if (record.kind === KIND.WRONGBOOK || record.kind === KIND.STARS) {
      continuePool(bank, record.kind);
      return;
    }
    continueNormal(bank);
  }

  /** 继续普通轮：进度就在老键里，重新建 session 即可原样读回 */
  function continueNormal(bank) {
    // 从「练习记录」点进来时记下记录页：这一轮交卷后的结果页能按层级退回记录
    pushFrame();
    session = new Session(bank, {});
    currentRound = null;
    state.mode = KIND.NORMAL;
    state.bankKey = bank.key;
    state.sourceRoundId = null;
    state.snapshotId = null;
    state.view = 'quiz';
    saveState();
    render();
  }

  /** 继续重练轮：题号与作答都在该轮的 practice 键里 */
  function continuePractice(bank, roundId) {
    var s = new Session(bank, { kind: KIND.PRACTICE, storageKey: Round.practiceKey(bank.key, roundId) });
    if (!s.hasPersistedProgress()) {
      // 进度没了：不要退化成全库题，留在记录页（下次渲染时这一行会消失）
      render();
      return;
    }
    session = s;
    currentRound = null;
    state.mode = KIND.PRACTICE;
    state.bankKey = bank.key;
    state.sourceRoundId = String(roundId);
    state.snapshotId = null;
    state.view = 'quiz';
    saveState();
    render();
  }
  /* ------------------------- 错题本 / 收藏 ------------------------- */
  /** 打开某题库的错题本页（只读列表，没有会话） */
  function openWrongBook(bankKey) {
    var bank = findBank(bankKey);
    if (!bank) return;
    pushFrame();
    session = null;
    currentRound = null;
    state.view = 'wrongbook';
    state.mode = KIND.NORMAL;
    state.bankKey = bank.key;
    state.sourceRoundId = null;
    state.snapshotId = null;
    saveState();
    render();
  }

  /**
   * 开一轮「错题练习」/「收藏练习」：题目来自错题本或收藏，其余（作答/交卷/成绩/重练）全部复用同一套 Session。
   * 每次开都是全新一轮：先清掉这一种练习的旧进度。
   */
  function startPoolRound(bank, kind) {
    var ids = kind === KIND.WRONGBOOK ? Wrongbook.ids(bank) : Stars.ids(bank);
    if (!ids.length) return; // n=0：按钮本来就是置灰的
    pushFrame();
    var storageKey = Round.poolKey(bank.key, kind);
    Store.createStore({
      storage: Store.defaultStorage(),
      key: storageKey,
      version: SessionNS.SCHEMA_VERSION,
    }).clear();

    session = new Session(bank, { kind: kind, questionIds: ids, storageKey: storageKey });
    currentRound = null;
    state.mode = kind;
    state.bankKey = bank.key;
    state.sourceRoundId = null;
    state.snapshotId = null;
    state.view = 'quiz';
    // 立刻落一次盘：刚进来还没答题就刷新也能接着做
    session.persist();
    saveState();
    render();
  }

  /** 继续错题练习 / 收藏练习（从练习记录里的「进行中」行进来） */
  function continuePool(bank, kind) {
    var s = new Session(bank, { kind: kind, storageKey: Round.poolKey(bank.key, kind) });
    if (!s.hasPersistedProgress()) {
      render(); // 进度没了：留在记录页，下次渲染时这一行会消失
      return;
    }
    session = s;
    currentRound = null;
    state.mode = kind;
    state.bankKey = bank.key;
    state.sourceRoundId = null;
    state.snapshotId = null;
    state.view = 'quiz';
    saveState();
    render();
  }

  /**
   * 星标开关。收藏是题目级的：普通轮 / 重练轮 / 错题练习 / 收藏练习、甚至只读的历史结果页都共享同一颗星。
   * 只动 quiz:stars，不碰本轮的任何作答与成绩。
   */
  function toggleStar(qid, keepFocus) {
    if (!session) return;
    var id = String(qid);
    Stars.toggle(session.bank.key, id);
    // 键盘触发时把焦点留在星标上（鼠标点击不抢焦点）
    if (keepFocus) pendingFocus = '[data-star="' + id + '"]';
    render();
  }

  /* ------------------------- 题目反馈 ------------------------- */
  /** 把纯文本写进剪贴板：先试 execCommand（同步，点击事件里最稳），再退到异步 API */
  function copyToClipboard(text) {
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {
      ok = false;
    }
    if (!ok && typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        // 无头浏览器/未聚焦时这里会 reject，但拒绝原因对我们没有额外信息，
        // 吞掉它，避免在控制台冒出一个吓人的未处理拒绝。
        var p = navigator.clipboard.writeText(text);
        if (p && typeof p.catch === 'function') p.catch(function () {});
        ok = true;
      } catch (e2) {
        ok = false;
      }
    }
    if (ok) lastCopied = text;
    return ok;
  }

  /**
   * 结果页「复制成绩」：文本由 js/ui/copy.js 的 RESULT_TEXT 拼装，
   * 数字一律取 session.stats()，时间取本轮快照的交卷时间。
   */
  function resultFinishedAt() {
    if (currentRound && currentRound.finishedAt) return currentRound.finishedAt;
    if (session && session.finishedAt) return session.finishedAt;
    return new Date().toISOString();
  }

  function copyResult() {
    if (!session) return;
    var st = session.stats();
    var finishedAt = resultFinishedAt();
    var text = Copy.RESULT_TEXT({
      bankTitle: session.bank.title,
      // 错题练习 / 收藏练习没有范围，改用来源标记；重练轮的来源在 scopeLabel 之外，这里不强求
      scopeLabel: session.scopeLabel && session.scopeLabel()
        ? session.scopeLabel()
        : (session.origin ? Copy.POOL_NAME(session.origin) : ''),
      correct: st.correct,
      scorable: st.scorable,
      accuracy: st.accuracy,
      duration: Copy.FMT_DURATION(session.startedAt, finishedAt),
      at: finishedAt,
    });
    var ok = copyToClipboard(text);
    flashCopyBtn(ok ? Copy.RESULT_COPIED : Copy.RESULT_COPY_FAILED);
  }

  /** 按钮文案临时改成「已复制」，2 秒后恢复（不重渲染，避免打断当前页面） */
  function flashCopyBtn(label) {
    var btn = document.querySelector('[data-act="copy-result"]');
    if (!btn) return;
    btn.textContent = label;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(function () {
      copyTimer = null;
      var b = document.querySelector('[data-act="copy-result"]');
      if (b) b.textContent = Copy.RESULT_COPY_BTN;
    }, 2000);
  }

  /** 打开反馈面板：qid 是题库里的题目 id，page 是当前页面（quiz / result） */
  function openFeedback(qid, page) {
    if (!session) return;
    var goal = String(qid);
    var q = null;
    var index = 0;
    for (var i = 0; i < session.questions.length; i++) {
      if (String(session.questions[i].id) === goal) {
        q = session.questions[i];
        index = i;
        break;
      }
    }
    if (!q) return;
    var rec = session.recordOf(q.id);
    fbPanel = {
      bankKey: session.bank.key,
      bankTitle: session.bank.title,
      questionId: q.id,
      index: index + 1,
      qtype: q.type,
      stem: Feed.summary(q.stem),
      picked: rec.picked.slice(),
      answer: (q.answer || []).slice(),
      page: page === 'result' ? 'result' : 'quiz',
      at: new Date().toISOString(),
      kind: Feed.KINDS[0],
      note: '',
      saved: null,
      copyHint: '',
      // 'online' 表示这条已经进了服务端的库（只有起过 server/server.mjs 才会）
      reported: '',
    };
    renderFeedbackPanel(true);
  }

  function panelInfo(p) {
    return {
      bankKey: p.bankKey,
      bankTitle: p.bankTitle,
      questionId: p.questionId,
      index: p.index,
      qtype: p.qtype,
      stem: p.stem,
      picked: p.picked,
      answer: p.answer,
      page: p.page,
      at: p.at,
    };
  }

  function renderFeedbackPanel(focusFirst) {
    var host = document.getElementById('modalRoot');
    if (!host) return;
    if (!fbPanel) {
      host.innerHTML = '';
      return;
    }
    host.innerHTML = root.QuizViewFeedback.renderPanel({
      info: panelInfo(fbPanel),
      kinds: Feed.KINDS,
      kind: fbPanel.kind,
      note: fbPanel.note,
      noteMax: Feed.NOTE_MAX,
      saved: fbPanel.saved,
      copyHint: fbPanel.copyHint,
      online: fbPanel.reported === 'online',
    });
    if (!focusFirst) return;
    var target = fbPanel.saved
      ? host.querySelector('[data-act="fb-copy-one"]')
      : host.querySelector('[data-fb-kind]');
    if (target) target.focus({ preventScroll: true });
  }

  /** 面板里的字段整形成能写本地、也能发给服务端的一份 */
  function feedbackFields() {
    return {
      bankKey: fbPanel.bankKey,
      bankTitle: fbPanel.bankTitle,
      questionId: fbPanel.questionId,
      index: fbPanel.index,
      qtype: fbPanel.qtype,
      stem: fbPanel.stem,
      picked: fbPanel.picked,
      answer: fbPanel.answer,
      page: fbPanel.page,
      kind: fbPanel.kind,
      note: fbPanel.note,
    };
  }

  /** 回落：写进本机反馈箱（只走 store.js），成功后面板切到「已记录（仅本设备）」 */
  function saveFeedbackLocally(fields) {
    var rec = Feed.add(null, fields);
    if (!rec) return null;
    fbPanel.saved = rec;
    fbPanel.reported = 'local';
    fbPanel.copyHint = '';
    renderFeedbackPanel(true);
    return rec;
  }

  /** 服务端模式下的「已保存」：只给面板显示用，不写本地反馈箱 */
  function onlineSavedRecord(fields) {
    return {
      id: 'server',
      at: new Date().toISOString(),
      bankKey: fields.bankKey,
      bankTitle: fields.bankTitle,
      questionId: fields.questionId,
      index: fields.index,
      qtype: fields.qtype,
      stem: fields.stem,
      picked: fields.picked || [],
      answer: fields.answer || [],
      page: fields.page || 'quiz',
      kind: fields.kind,
      note: fields.note,
      status: 'pending',
    };
  }

  /**
   * 提交反馈：先试在线（起过服务端才算在线），成功提示「已上报」；
   * 失败或没有服务端就回落本地反馈箱，提示「已记录（仅本设备）」。
   * 纯静态模式（file://）不会发任何请求，行为与以前完全一致。
   */
  function submitFeedback() {
    if (!fbPanel || fbPanel.saved) return;
    var fields = feedbackFields();
    var api = root.QuizApi;
    if (!api || !api.online()) {
      saveFeedbackLocally(fields);
      return;
    }
    api.submitFeedback(fields).then(function (sent) {
      if (!fbPanel || fbPanel.saved) return;
      if (sent) {
        fbPanel.saved = onlineSavedRecord(fields);
        fbPanel.reported = 'online';
        fbPanel.copyHint = '';
        renderFeedbackPanel(true);
        return;
      }
      saveFeedbackLocally(fields);
    });
  }

  /** 复制单条（面板里 / 反馈箱里） */
  function copyFeedback(id) {
    var rec = Feed.get(null, String(id));
    if (!rec) return false;
    var ok = copyToClipboard(Copy.FB_TEXT(rec));
    if (ok) Feed.markCopied(null, rec.id);
    if (fbPanel && fbPanel.saved && String(fbPanel.saved.id) === String(rec.id)) {
      fbPanel.copyHint = ok ? Copy.FB_COPIED_HINT : Copy.FB_COPY_FAILED;
      renderFeedbackPanel(false);
    }
    if (state.view === 'feedback') render();
    return ok;
  }

  /** 全部复制 */
  function copyAllFeedback() {
    var items = Feed.list(null);
    if (!items.length) return false;
    var ok = copyToClipboard(Copy.FB_TEXT_ALL(items));
    if (ok) {
      var ids = [];
      for (var i = 0; i < items.length; i++) ids.push(items[i].id);
      Feed.markCopied(null, ids);
    }
    render();
    return ok;
  }

  function deleteFeedback(id) {
    Feed.remove(null, String(id));
    render();
  }

  function askClearFeedback() {
    if (!Feed.list(null).length) return;
    showModal({
      title: Copy.FB_CLEAR_TITLE,
      message: Copy.FB_CLEAR_MESSAGE,
      confirmText: Copy.FB_CLEAR_OK,
      onConfirm: function () {
        Feed.clear(null);
        render();
      },
    });
  }

  function openFeedbackBox() {
    pushFrame();
    session = null;
    currentRound = null;
    state.view = 'feedback';
    state.mode = KIND.NORMAL;
    state.bankKey = null;
    state.sourceRoundId = null;
    state.snapshotId = null;
    saveState();
    render();
  }

  function openChangelog() {
    pushFrame();
    session = null;
    currentRound = null;
    state.view = 'changelog';
    state.mode = KIND.NORMAL;
    state.bankKey = null;
    state.sourceRoundId = null;
    state.snapshotId = null;
    saveState();
    render();
  }

  function goToQuestion(index) {
    if (!session || session.isSnapshot) return;
    session.goTo(index);
    state.view = 'quiz';
    saveState();
    render();
  }

  function backToList() {
    viewStack = []; // 列表是根：回到这里就把层级清空
    state.view = 'list';
    state.mode = KIND.NORMAL;
    state.bankKey = null;
    state.sourceRoundId = null;
    state.snapshotId = null;
    session = null;
    currentRound = null;
    saveState();
    render();
  }

  /* ------------------------- 顶栏「返回」：按层级返回上一级 ------------------------- */
  /**
   * 返回目标 = 上一级页面。层级只记在内存里（viewStack），不落盘：
   * 刷新后栈是空的，于是各页一律回题库列表——不会因为记着旧来源而跳进一个不存在的页面。
   * 列表页是根，不压栈；每次真正换页之前调一次 pushFrame()。
   */
  function pushFrame() {
    if (state.view === 'list') return; // 题库列表没有上一级
    viewStack.push({
      view: state.view,
      mode: state.mode,
      bankKey: state.bankKey,
      sourceRoundId: state.sourceRoundId,
      snapshotId: state.snapshotId,
      session: session,
      round: currentRound,
    });
  }

  /** 这一层还能不能回得去：题库没了 / 会话没了就跳过，不硬撑 */
  function frameUsable(f) {
    if (!f || f.view === 'list') return false;
    if (f.view === 'feedback' || f.view === 'changelog') return true;
    if (!findBank(f.bankKey)) return false;
    if ((f.view === 'quiz' || f.view === 'result') && !f.session) return false;
    return true;
  }

  function restoreFrame(f) {
    session = f.session;
    currentRound = f.round;
    state.view = f.view;
    state.mode = f.mode;
    state.bankKey = f.bankKey;
    state.sourceRoundId = f.sourceRoundId;
    state.snapshotId = f.snapshotId;
    saveState();
    render();
  }

  /**
   * 顶栏「返回」：回到上一级。
   * 答题页是例外——它一律回题库列表（作答进度已落盘，从「练习记录」能接着做），
   * 这样从记录里点「继续」进来的那一轮也不会把人带到记录页去。
   * 其余页面：栈空（含刷新之后）就回题库列表。
   */
  function goBack() {
    if (state.view === 'quiz') {
      backToList();
      return;
    }
    while (viewStack.length) {
      var f = viewStack.pop();
      if (!frameUsable(f)) continue;
      restoreFrame(f);
      return;
    }
    backToList();
  }

  /* ------------------------- 弹窗（确认 / 面板） ------------------------- */
  function showModal(opts) {
    var host = document.getElementById('modalRoot');
    modalConfirm = opts.onConfirm || null;
    modalClose = opts.onClose || null;

    host.innerHTML =
      '<div class="modal__scrim" data-modal-close></div>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
      '<h2 class="h2" id="modalTitle">' + esc(opts.title) + '</h2>' +
      '<p class="muted--2">' + esc(opts.message) + '</p>' +
      '<div class="modal__actions">' +
      '<button type="button" class="btn" data-modal-close>' + esc(Copy.BTN_CANCEL) + '</button>' +
      '<button type="button" class="btn btn--primary" data-modal-confirm>' +
      esc(opts.confirmText) +
      '</button>' +
      '</div>' +
      '</div>';

    var btn = host.querySelector('[data-modal-confirm]');
    if (btn) btn.focus();
  }

  /** 关掉弹窗；onClose 用来把「开始一轮」面板恢复回来 */
  function closeModal() {
    var after = modalClose;
    modalConfirm = null;
    modalClose = null;
    document.getElementById('modalRoot').innerHTML = '';
    if (after) after();
  }

  /* ------------------------- 事件 ------------------------- */
  function onClick(e) {
    var t = e.target.closest('[data-bank],[data-opt],[data-act],[data-goto],[data-records],[data-record],[data-recent],[data-wrongbook],[data-stars],[data-star],[data-theme-pick],[data-scope-type],[data-scope-chapter],[data-scope-n],[data-fb],[data-fb-kind],[data-fb-copy],[data-fb-del],[data-modal-close],[data-modal-confirm]');

    /* ---- 主题菜单：点菜单外面关掉 ----
       这一句必须在「没命中选择器就 return」之前：点空白处同样要能关掉菜单。
       点菜单项（data-theme-pick）不在这里关，交给下面的分支去选；点顶栏按钮本身也不关，
       由 data-act="theme" 去切换开合。 */
    if (themeMenuOpen && (!t || (!t.closest('#themeMenu') && t.getAttribute('data-act') !== 'theme'))) {
      closeThemeMenu(false);
    }

    if (!t) return;

    /* 置灰入口（n=0 的练习记录/错题本/收藏练习等）不响应任何点击，
       连程序化派发的 MouseEvent 也不行——「置灰就是不能点」不能只靠浏览器默认行为兜底 */
    if (t.disabled || t.getAttribute('aria-disabled') === 'true') return;

    /* ---- 主题菜单：选一项 ---- */
    if (t.hasAttribute('data-theme-pick')) {
      chooseThemeMode(t.getAttribute('data-theme-pick'));
      return;
    }

    /* ---- 星标：题目级收藏，在只读快照页也该能用，所以放在所有「只读就返回」的守卫之前 ---- */
    if (t.hasAttribute('data-star')) {
      toggleStar(t.getAttribute('data-star'), e.detail === 0);
      return;
    }

    if (t.hasAttribute('data-modal-confirm')) {
      var fn = modalConfirm;
      // 确认走了就别再弹回面板（面板由确认后的动作自己决定）
      modalClose = null;
      closeModal();
      if (fn) fn();
      return;
    }
    if (t.hasAttribute('data-modal-close')) {
      // 反馈面板走同一个遮罩：关掉就等于放弃这次反馈（什么也没写）
      var wasFb = !!fbPanel;
      fbPanel = null;
      closeModal();
      if (wasFb) render();
      return;
    }

    /* ---- 反馈入口 / 面板里的选择 ---- */
    if (t.hasAttribute('data-fb')) {
      openFeedback(t.getAttribute('data-fb'), t.getAttribute('data-fb-page'));
      return;
    }

    if (t.hasAttribute('data-fb-kind')) {
      if (!fbPanel || fbPanel.saved) return;
      fbPanel.kind = t.getAttribute('data-fb-kind');
      renderFeedbackPanel(false);
      return;
    }

    if (t.hasAttribute('data-fb-copy')) {
      copyFeedback(t.getAttribute('data-fb-copy'));
      return;
    }

    if (t.hasAttribute('data-fb-del')) {
      deleteFeedback(t.getAttribute('data-fb-del'));
      return;
    }

    if (t.hasAttribute('data-bank')) {
      openStart(t.getAttribute('data-bank'));
      return;
    }

    /* ---- 「开始一轮」面板里的选择 ---- */
    if (t.hasAttribute('data-scope-type')) {
      if (!panel) return;
      panel.type = t.getAttribute('data-scope-type');
      // 切到「随机」时若输入框里还是空的，就给一个默认档位（已经有合法数字就保留用户填的）
      if (panel.type === Scope.TYPES.RANDOM && !/^\d+$/.test(String(panel.n))) {
        var bankOfPanel = findBank(panel.bankKey);
        var fallback = bankOfPanel ? Scope.RANDOM_SIZES[0] : 10;
        if (bankOfPanel) {
          for (var fi = 0; fi < Scope.RANDOM_SIZES.length; fi++) {
            if (bankOfPanel.questions.length >= Scope.RANDOM_SIZES[fi]) {
              fallback = Scope.RANDOM_SIZES[fi];
              break;
            }
          }
        }
        panel.n = String(fallback);
        panel.nFromPreset = true;
      }
      renderPanel();
      return;
    }

    if (t.hasAttribute('data-scope-chapter')) {
      if (!panel) return;
      var no = Number(t.getAttribute('data-scope-chapter'));
      var at = panel.chapterNos.indexOf(no);
      if (at >= 0) panel.chapterNos.splice(at, 1);
      else panel.chapterNos.push(no);
      panel.chapterNos.sort(function (a, b) { return a - b; });
      renderPanel();
      return;
    }

    // 快捷档：把数字填进输入框（并高亮该档），输入框内容随之更新
    if (t.hasAttribute('data-scope-n')) {
      if (!panel) return;
      panel.n = String(Number(t.getAttribute('data-scope-n')));
      panel.nFromPreset = true;
      renderPanel();
      var again = document.querySelector('[data-scope-n="' + panel.n + '"]');
      if (again) again.focus({ preventScroll: true });
      return;
    }

    // 练习记录：题库列表上的入口 / 记录里的某一行
    if (t.hasAttribute('data-records')) {
      openRecords(t.getAttribute('data-records'));
      return;
    }

    if (t.hasAttribute('data-record')) {
      openRecord(t.getAttribute('data-record'));
      return;
    }

    // 首页「最近练习」的一条（列表页语境，不带 state.bankKey）
    if (t.hasAttribute('data-recent')) {
      openRecent(t.getAttribute('data-recent-bank'), t.getAttribute('data-recent'));
      return;
    }

    // 错题本入口（题库卡片下方）
    if (t.hasAttribute('data-wrongbook')) {
      openWrongBook(t.getAttribute('data-wrongbook'));
      return;
    }

    // 收藏练习入口（题库卡片下方）
    if (t.hasAttribute('data-stars')) {
      var starBank = findBank(t.getAttribute('data-stars'));
      if (starBank) startPoolRound(starBank, KIND.STARS);
      return;
    }

    if (t.hasAttribute('data-goto')) {
      var gotoIndex = Number(t.getAttribute('data-goto'));
      if (answerCardOpen && !isWideLayout()) {
        // 窄屏：格子藏在覆盖层里，跳完就收起，别挡着题目；焦点回到 meta 行的「总览」
        answerCardOpen = false;
        pendingFocus = '.card-toggle--meta';
      }
      goToQuestion(gotoIndex);
      // 宽屏浮窗保持展开：重渲染换掉了整块网格，把焦点还给新的「当前格」，
      // 键盘用户可以继续用 Tab 在格子里走，不会掉到 body 上
      if (answerCardOpen) {
        var curCell = document.querySelector('.answer-card__cell[aria-current="true"]');
        if (curCell && curCell.focus) curCell.focus({ preventScroll: true });
      }
      return;
    }

    if (t.hasAttribute('data-opt')) {
      var key = t.getAttribute('data-opt');
      // e.detail === 0 表示由键盘（Enter/Space）触发；鼠标点击不抢焦点
      var fromKeyboard = e.detail === 0;
      if (session && session.pick(key)) {
        if (fromKeyboard) pendingFocus = '[data-opt="' + key + '"]';
        render();
      }
      return;
    }

    var act = t.getAttribute('data-act');
    if (!act) return;

    // 主题：顶栏按钮开/关三态菜单，任何页面都能点，不重渲染、不打断当前进度
    if (act === 'theme') {
      toggleThemeMenu();
      return;
    }

    if (act === 'replay') {
      startReplay();
      return;
    }
    // 错题本页顶部的主按钮：开一轮「错题练习」
    if (act === 'wrongbook-start') {
      var wbBank = findBank(state.bankKey);
      if (wbBank) startPoolRound(wbBank, KIND.WRONGBOOK);
      return;
    }
    if (act === 'copy-result') {
      copyResult();
      return;
    }
    if (act === 'open-source') {
      openSourceRound();
      return;
    }
    if (act === 'back') {
      backToList();
      return;
    }    if (act === 'start-round') {
      askStartRound();
      return;
    }
    if (act === 'continue') {
      continueFromPanel();
      return;
    }
    if (act === 'restart') {
      askRestart();
      return;
    }
    if (act === 'feedback-box') {
      openFeedbackBox();
      return;
    }
    if (act === 'changelog') {
      openChangelog();
      return;
    }
    // 首页「最近练习」：标题行的「全部记录」与空态的「开始」
    if (act === 'all-records') {
      openAllRecords();
      return;
    }
    if (act === 'recent-start') {
      startFromRecent();
      return;
    }
    if (act === 'fb-submit') {
      submitFeedback();
      return;
    }
    if (act === 'fb-copy-one') {
      if (fbPanel && fbPanel.saved) copyFeedback(fbPanel.saved.id);
      return;
    }
    if (act === 'fb-copy-all') {
      copyAllFeedback();
      return;
    }
    if (act === 'fb-clear') {
      askClearFeedback();
      return;
    }
    // 答题卡的关闭：遮罩和「关闭」按钮都走这里，和答题状态无关
    if (act === 'card-close') {
      closeAnswerCard();
      return;
    }

    if (!session || session.isSnapshot) return;

    if (act === 'prev') {
      session.nav.prev();
      render();
    } else if (act === 'next') {
      session.nav.next();
      render();
    } else if (act === 'submit') {
      doSubmit(e.detail === 0);
    } else if (act === 'modify') {
      // 交卷前才有的入口：解锁本题重新选择（判分与统计仍按原来那次提交算）
      if (session.reopen(session.question.id)) {
        if (e.detail === 0) pendingFocus = '[data-opt]';
        render();
      }
    } else if (act === 'finish') {
      askFinish();
    } else if (act === 'jump') {
      // 「跳」按钮：值从输入框读，校验交给 jumpToNumber（只认 1..本轮题数）
      jumpToNumber(document.querySelector('[data-jump-input]'));
    } else if (act === 'jump-dock') {
      // 宽屏侧边浮窗的「确认跳转」
      jumpToNumber(document.querySelector('[data-jump-dock-input]'));
    } else if (act === 'card-toggle') {
      toggleAnswerCard();
    }
  }

  /* ------------------------- 答题卡 ------------------------- */
  /** 当前是不是宽屏布局（与 CSS 的 1080px 断点保持一致） */
  function isWideLayout() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        return window.matchMedia('(min-width: 1080px)').matches;
      } catch (e) {
        /* 拿不到 media query 就按窗口宽度兜底，不影响布局本身（可见性交给 CSS） */
      }
    }
    return typeof window !== 'undefined' ? window.innerWidth >= 1080 : false;
  }

  /**
   * 答题卡开合：宽屏切换侧边浮窗里的网格，窄屏切换全屏覆盖层。
   * 两种形态共用「总览」一颗按钮，所以统一走重渲染：覆盖层要盖住整页，
   * 直接改节点显隐会漏掉焦点回位。重渲染前把浮窗输入框里的题号记下来再写回，
   * 免得宽屏展开/收起时把用户正在输的题号清掉。
   * 展开状态记在内存（answerCardOpen），切题后由 render 按它恢复。
   */
  function toggleAnswerCard() {
    setAnswerCardOpen(!answerCardOpen);
  }

  /** Esc / 点遮罩 / 「关闭」：只关不切换 */
  function closeAnswerCard() {
    if (!answerCardOpen) return;
    setAnswerCardOpen(false);
  }

  function setAnswerCardOpen(open) {
    answerCardOpen = open;
    var wide = isWideLayout();
    var kept = '';
    var input = document.querySelector('[data-jump-dock-input]');
    if (input) kept = input.value;

    // 焦点：打开窄屏覆盖层时落在「关闭」上；收起后回到对应的「总览」按钮
    pendingFocus = wide
      ? '.jump-dock__overview'
      : (answerCardOpen ? '[data-card-close-btn]' : '.card-toggle--meta');

    render();

    if (kept) {
      var again = document.querySelector('[data-jump-dock-input]');
      if (again) again.value = kept;
    }
  }

  /* ------------------------- 题号跳转 ------------------------- */
  var jumpHintTimer = null;

  /** 非法输入：在对应形态的提示位给一句「1–y」，2 秒后自己消失（不做抖动动画） */
  function showJumpHint(total, dock) {
    var sel = dock ? '[data-jump-dock-hint]' : '[data-jump-hint]';
    var hint = document.querySelector(sel);
    if (!hint) return;
    hint.textContent = Copy.JUMP_HINT(total);
    hint.hidden = false;
    if (jumpHintTimer) clearTimeout(jumpHintTimer);
    jumpHintTimer = setTimeout(function () {
      jumpHintTimer = null;
      var h = document.querySelector(sel);
      if (h) {
        h.hidden = true;
        h.textContent = '';
      }
    }, 2000);
  }

  /**
   * 按「本轮题序」跳题：输入的是第几题（1 起），不是题库原题号。
   * 只接受 1..total 的整数，其它一律不跳、提示区间。
   * 侧边浮窗与 meta 行是同一功能的两副样子，区别只有一处：
   * 浮窗跳完保留输入值（方便连跳），meta 行跳完清空（那一行地方小，不留给下一次）。
   */
  function jumpToNumber(input) {
    if (!session || session.isSnapshot) return;
    var total = session.questions.length;
    var dock = !!(input && input.hasAttribute && input.hasAttribute('data-jump-dock-input'));
    var raw = input && input.value != null ? String(input.value).trim() : '';
    if (!/^\d+$/.test(raw) || !(Number(raw) >= 1 && Number(raw) <= total)) {
      showJumpHint(total, dock);
      return;
    }
    var n = Number(raw);
    if (!dock) input.value = '';
    goToQuestion(n - 1);
    if (dock) {
      // 重渲染会换掉整个浮窗：把值还回去，并让焦点留在输入框里
      var again = document.querySelector('[data-jump-dock-input]');
      if (again) {
        again.value = raw;
        if (again.focus) again.focus();
      }
    }
  }

  /** 备注输入：只更新计数，不重渲染面板（否则输入框会失焦） */
  function onInput(e) {
    var t = e.target;
    if (!t || !t.hasAttribute) return;

    // 随机题数输入框：改数字只原地刷新可用性，不重画面板（否则焦点和输入法都会丢）
    if (t.hasAttribute('data-scope-n-input')) {
      if (!panel) return;
      // 只留数字，避免把「12a」「1.5」这种半截输入带进校验之外的分支
      var digits = String(t.value || '').replace(/[^\d]/g, '').slice(0, 4);
      if (digits !== t.value) t.value = digits;
      panel.n = digits;
      panel.nFromPreset = false;
      var bank = findBank(panel.bankKey);
      if (bank) applyStartValidity(bank);
      return;
    }

    if (!t.hasAttribute('data-fb-note')) return;
    if (!fbPanel || fbPanel.saved) return;
    fbPanel.note = String(t.value || '').slice(0, Feed.NOTE_MAX);
    var counter = document.querySelector('[data-fb-count]');
    if (counter) counter.textContent = Copy.FB_NOTE_COUNT(fbPanel.note.length, Feed.NOTE_MAX);
  }

  function onKeydown(e) {
    // 题号输入框（meta 行的 / 宽屏浮窗的）里回车 = 点它对应的按钮
    if (e.key === 'Enter' && e.target && e.target.hasAttribute &&
      (e.target.hasAttribute('data-jump-input') || e.target.hasAttribute('data-jump-dock-input'))) {
      e.preventDefault();
      jumpToNumber(e.target);
      return;
    }
    if (e.key !== 'Escape') return;
    // 确认框优先：先关确认框，回到它背后的面板
    if (modalConfirm !== null) {
      closeModal();
      return;
    }
    if (fbPanel) {
      fbPanel = null;
      closeModal();
      render();
      return;
    }
    if (panel) {
      panel = null;
      closeModal();
      return;
    }
    // 答题卡覆盖层：盖在页面之上，Esc 先收它，再轮到主题菜单
    if (answerCardOpen) {
      closeAnswerCard();
      return;
    }
    if (themeMenuOpen) {
      closeThemeMenu(true);
    }
  }

  /* ------------------------- 主题（三态：跟随系统 / 亮色 / 暗色） ------------------------- */
  var MOON_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.4 1.3a6.7 6.7 0 1 0 8.3 8.3 5.6 5.6 0 0 1-8.3-8.3z"></path></svg>';
  var SUN_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="3.1" fill="currentColor"></circle><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 1.1v1.8M8 13.1v1.8M1.1 8h1.8M13.1 8h1.8M3.2 3.2l1.3 1.3M11.5 11.5l1.3 1.3M12.8 3.2l-1.3 1.3M4.5 11.5l-1.3 1.3"></path></g></svg>';
  // 「跟随系统」：半明半暗，和单纯的黑白区分开
  var AUTO_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.5"></circle><path fill="currentColor" d="M8 1.8a6.2 6.2 0 0 1 0 12.4z"></path></svg>';

  var themeMenuOpen = false;

  function themeMenuEl() { return document.getElementById('themeMenu'); }

  function themeIcon(mode) {
    if (mode === Theme.SYSTEM) return AUTO_ICON;
    return mode === Theme.DARK ? MOON_ICON : SUN_ICON;
  }

  /** 顶栏按钮：图标 + 短标签反映「当前选的是哪种模式」（三态都不同），aria-expanded 表示菜单开着没 */
  function syncThemeBtn() {
    var btn = document.getElementById('btnTheme');
    if (!btn) return;
    var mode = Theme.normalize(theme);
    btn.innerHTML = themeIcon(mode) + '<span>' + Copy.THEME_LABEL(mode) + '</span>';
    btn.setAttribute('aria-expanded', themeMenuOpen ? 'true' : 'false');
    btn.setAttribute('aria-haspopup', 'menu');
    btn.title = Copy.THEME_MENU_HINT;
  }

  /** 菜单内容：三项，选中项 aria-checked + 勾 */
  function renderThemeMenu() {
    var host = themeMenuEl();
    if (!host) return;
    var mode = Theme.normalize(theme);
    var items = [
      { mode: Theme.SYSTEM, label: Copy.THEME_SYSTEM },
      { mode: Theme.LIGHT, label: Copy.THEME_LIGHT },
      { mode: Theme.DARK, label: Copy.THEME_DARK },
    ];
    var html = '<p class="menu__title" id="themeMenuTitle">' + Copy.THEME_MENU_TITLE + '</p>';
    for (var i = 0; i < items.length; i++) {
      var on = items[i].mode === mode;
      html +=
        '<button type="button" class="menu__item" role="menuitemradio"' +
        ' aria-checked="' + (on ? 'true' : 'false') + '"' +
        ' data-theme-pick="' + items[i].mode + '">' +
        '<span class="menu__ico">' + themeIcon(items[i].mode) + '</span>' +
        '<span class="menu__label">' + items[i].label + '</span>' +
        '<span class="menu__tick" aria-hidden="true">' + (on ? '✓' : '') + '</span>' +
        '</button>';
    }
    host.innerHTML = html;
    host.setAttribute('aria-label', Copy.THEME_MENU_TITLE);
  }

  function openThemeMenu() {
    var host = themeMenuEl();
    if (!host) return;
    themeMenuOpen = true;
    renderThemeMenu();
    host.removeAttribute('hidden');
    syncThemeBtn();
    var sel = host.querySelector('[aria-checked="true"]') || host.querySelector('[data-theme-pick]');
    if (sel) sel.focus({ preventScroll: true });
  }

  function closeThemeMenu(returnFocus) {
    var host = themeMenuEl();
    themeMenuOpen = false;
    if (host) host.setAttribute('hidden', '');
    syncThemeBtn();
    if (returnFocus) {
      var btn = document.getElementById('btnTheme');
      if (btn) btn.focus({ preventScroll: true });
    }
  }

  /** 选一种模式：落盘 + 应用 + 关菜单（焦点回按钮） */
  function chooseThemeMode(mode) {
    theme = Theme.save(Theme.normalize(mode));
    Theme.apply(theme);
    closeThemeMenu(true);
  }

  function toggleThemeMenu() {
    if (themeMenuOpen) closeThemeMenu(true);
    else openThemeMenu();
  }

  /** 「跟随系统」时系统偏好变了要实时跟着换 */
  function onSchemeChange() {
    if (Theme.normalize(theme) !== Theme.SYSTEM) return;
    Theme.apply(theme);
    if (themeMenuOpen) renderThemeMenu();
  }

  /* ------------------------- 启动 ------------------------- */
  function start() {
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('input', onInput);

    var finishBtn = document.getElementById('btnFinish');
    if (finishBtn) {
      finishBtn.addEventListener('click', function () {
        askFinish();
      });
    }

    // 顶栏「返回」：按层级回上一级（答题页回列表）
    var backBtn = document.getElementById('btnBack');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        goBack();
      });
    }

    // 主题按钮：内容按当前模式渲染（图标 + 短标签）
    syncThemeBtn();

    // 「跟随系统」时监听系统偏好变化（旧 Safari 用 addListener）
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq && typeof mq.addEventListener === 'function') mq.addEventListener('change', onSchemeChange);
        else if (mq && typeof mq.addListener === 'function') mq.addListener(onSchemeChange);
      } catch (e) {
        /* 拿不到系统偏好就当浅色，不影响其它功能 */
      }
    }

    restoreState();
    render();

    // 探活可选服务端：有就顺手启用在线反馈，没有就静默留在本地模式（file:// 下不发请求）
    if (root.QuizApi && typeof root.QuizApi.probe === 'function') {
      try {
        root.QuizApi.probe();
      } catch (e) {
        /* 探活失败不影响任何本地功能 */
      }
    }
  }

  /** 供自测页读取内部状态（只读，不提供写操作） */
  root.QuizApp = {
    state: function () { return { view: state.view, mode: state.mode, bankKey: state.bankKey, sourceRoundId: state.sourceRoundId, snapshotId: state.snapshotId }; },
    session: function () { return session; },
    round: function () { return currentRound; },
    theme: function () { return theme; },
    feedback: function () {
      return {
        items: Feed.list(null),
        panel: fbPanel
          ? {
            kind: fbPanel.kind,
            note: fbPanel.note,
            saved: fbPanel.saved ? fbPanel.saved.id : null,
            copyHint: fbPanel.copyHint,
          }
          : null,
        lastCopied: lastCopied,
      };
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
