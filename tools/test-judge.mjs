#!/usr/bin/env node
/**
 * 判题 / 会话模型自测 —— node tools/test-judge.mjs
 *
 * 只测纯逻辑，不碰浏览器。覆盖：
 *   单选对/错 · 多选全对/漏选/多选错选/顺序无关 · 判断题
 *   未作答 · scorable:false 异常题 · 重复提交结果不变（幂等）
 *   三态流转 · 统计派生 · 选择持久化 · 断点续做
 *
 * 退出码 0 = 全部通过；非 0 = 有失败（便于接 CI / 一行命令验证）。
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const Judge = require(join(ROOT, 'js', 'core', 'judge.js'));
const { Session } = require(join(ROOT, 'js', 'core', 'session.js'));

/* ----------------------------- 测试框架 ----------------------------- */
let passed = 0;
const failures = [];
let currentGroup = '';

function group(name) {
  currentGroup = name;
  console.log(`\n${name}`);
}

function ok(label, cond, detail) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failures.push(`${currentGroup} / ${label}${detail ? ' —— ' + detail : ''}`);
    console.log(`  ❌ ${label}${detail ? ' —— ' + detail : ''}`);
  }
}

function eq(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  ok(label, a === e, a === e ? '' : `期望 ${e}，实际 ${a}`);
}

/* ----------------------------- 测试题库 ----------------------------- */
const single = {
  id: 1, type: 'single', scorable: true,
  stem: '单选示例', options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }],
  answer: ['B'], explanation: '',
};
const multiple = {
  id: 2, type: 'multiple', scorable: true,
  stem: '多选示例',
  options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }, { key: 'C', text: 'c' }, { key: 'D', text: 'd' }],
  answer: ['A', 'C', 'D'], explanation: '',
};
const judgeQ = {
  id: 3, type: 'judge', scorable: true,
  stem: '判断示例', options: [{ key: 'A', text: '正确' }, { key: 'B', text: '错误' }],
  answer: ['A'], explanation: '',
};
const invalidQ = {
  id: 31, type: 'single', scorable: false,
  stem: '选项缺失的异常题', options: [], answer: null, explanation: '解析仍在',
};

const bank = {
  key: 'test',
  title: '自测题库',
  chapters: [{ no: 1, title: '自测', count: 4 }],
  questions: [single, multiple, judgeQ, invalidQ],
};

/* ------------------------- 1. 单选 ------------------------- */
group('1. 单选题');
eq('选 B（正确）→ correct', Judge.judge(single, ['B']).outcome, 'correct');
ok('选 B → isCorrect=true', Judge.judge(single, ['B']).isCorrect === true);
eq('选 A（错误）→ wrong', Judge.judge(single, ['A']).outcome, 'wrong');
ok('选 A → countsAsAnswered=true', Judge.judge(single, ['A']).countsAsAnswered === true);
eq('未选 → unanswered', Judge.judge(single, []).outcome, 'unanswered');
ok('未选 → countsAsAnswered=false', Judge.judge(single, []).countsAsAnswered === false);

/* ------------------------- 2. 多选 ------------------------- */
group('2. 多选题');
eq('全对 [A,C,D] → correct', Judge.judge(multiple, ['A', 'C', 'D']).outcome, 'correct');
eq('全对但顺序不同 [D,A,C] → correct（顺序无关）', Judge.judge(multiple, ['D', 'A', 'C']).outcome, 'correct');
eq('漏选 [A,C] → wrong', Judge.judge(multiple, ['A', 'C']).outcome, 'wrong');
eq('漏选 [A,D] → wrong', Judge.judge(multiple, ['A', 'D']).outcome, 'wrong');
eq('多选错选 [A,C,D,B] → wrong（多选了）', Judge.judge(multiple, ['A', 'C', 'D', 'B']).outcome, 'wrong');
eq('错选 [A,B] → wrong', Judge.judge(multiple, ['A', 'B']).outcome, 'wrong');
eq('只选一个 [A] → wrong', Judge.judge(multiple, ['A']).outcome, 'wrong');
eq('未选 → unanswered', Judge.judge(multiple, []).outcome, 'unanswered');
eq('重复字母去重 [A,A,C,D] → correct', Judge.judge(multiple, ['A', 'A', 'C', 'D']).outcome, 'correct');

/* ------------------------- 3. 判断题 ------------------------- */
group('3. 判断题');
eq('选 A（正确）→ correct', Judge.judge(judgeQ, ['A']).outcome, 'correct');
eq('选 B（错误）→ wrong', Judge.judge(judgeQ, ['B']).outcome, 'wrong');
eq('未选 → unanswered', Judge.judge(judgeQ, []).outcome, 'unanswered');

/* ------------------------- 4. 异常题 ------------------------- */
group('4. scorable:false 数据异常题');
const inv = Judge.judge(invalidQ, ['A']);
eq('无论选什么都 → invalid', inv.outcome, 'invalid');
ok('invalid → countsAsAnswered=false', inv.countsAsAnswered === false);
ok('invalid → isCorrect=false', inv.isCorrect === false);
eq('异常题未选 → 仍是 invalid（而非 unanswered）', Judge.judge(invalidQ, []).outcome, 'invalid');

/* ------------------------- 5. 判题纯函数 ------------------------- */
group('5. 判题是纯函数');
const before = JSON.stringify(multiple);
Judge.judge(multiple, ['A', 'B']);
Judge.judge(multiple, []);
ok('判题不修改题目对象', JSON.stringify(multiple) === before);
ok('判题不返回内部引用（normalizeKeys 每次新建）',
  Judge.normalizeKeys(['B', 'A']) !== Judge.normalizeKeys(['A', 'B']));

/* ------------------------- 6. 幂等：重复提交 ------------------------- */
group('6. 幂等：同一题重复提交，成绩不变');
{
  const s = new Session(bank, {});
  s.goTo(0);
  s.pick('B');
  const first = s.submit();
  const statsAfterFirst = s.stats();
  for (let i = 0; i < 5; i++) s.submit(); // 手抖多点 5 次
  const statsAfterMany = s.stats();
  eq('第一次提交 → correct', first.outcome, 'correct');
  eq('重复提交 5 次后 correct 仍为 1', statsAfterMany.correct, 1);
  eq('重复提交 5 次后 submitted 仍为 1', statsAfterMany.submitted, 1);
  eq('重复提交 5 次后正确率不变', statsAfterMany.accuracy, statsAfterFirst.accuracy);
  ok('重复提交后状态仍是 submitted', s.statusOf(1) === 'submitted');
}
{
  const s = new Session(bank, {});
  s.goTo(0);
  s.pick('A'); // 错
  s.submit();
  const st1 = s.stats();
  for (let i = 0; i < 3; i++) s.submit();
  const st2 = s.stats();
  eq('错题重复提交：wrong 仍为 1', st2.wrong, 1);
  eq('错题重复提交：correct 仍为 0', st2.correct, 0);
  eq('错题重复提交：answered 不变', st2.answered, st1.answered);
}

/* ------------------------- 7. 三态流转 ------------------------- */
group('7. 每题三态：未选 / 已选未提交 / 已提交已判分');
{
  const s = new Session(bank, {});
  s.goTo(0);
  eq('初始 → unselected', s.statusOf(1), 'unselected');
  s.pick('B');
  eq('选择后 → picked', s.statusOf(1), 'picked');
  eq('已选未提交不计入 answered', s.stats().answered, 0);
  eq('已选未提交计入 pickedNotSubmitted', s.stats().pickedNotSubmitted, 1);
  s.submit();
  eq('提交后 → submitted', s.statusOf(1), 'submitted');
  eq('提交后 answered=1', s.stats().answered, 1);
  eq('提交后 pickedNotSubmitted=0', s.stats().pickedNotSubmitted, 0);
  s.reset(1);
  eq('撤销提交 → 回到 picked', s.statusOf(1), 'picked');
  eq('撤销提交后 answered=0（不残留计分）', s.stats().answered, 0);
  ok('撤销提交后选择仍在', JSON.stringify(s.pickedOf(1)) === JSON.stringify(['B']));
}

/* ------------------------- 8. 提交后锁定 ------------------------- */
group('8. 已提交后不允许改选');
{
  const s = new Session(bank, {});
  s.goTo(0);
  s.pick('A');
  s.submit();
  const changed = s.pick('B');
  ok('已提交后 pick 被拒绝', changed === false);
  eq('已提交后选择未被篡改', s.pickedOf(1), ['A']);
  eq('已提交后判定仍为 wrong', s.evaluate(1).outcome, 'wrong');
}

/* ------------------------- 9. 多选交互 ------------------------- */
group('9. 多选：点选可累加，再点可取消');
{
  const s = new Session(bank, {});
  s.goTo(1); // multiple
  s.pick('A');
  s.pick('C');
  s.pick('D');
  eq('依次点 A,C,D → picked=[A,C,D]', s.pickedOf(2), ['A', 'C', 'D']);
  s.pick('C');
  eq('再点 C → 取消，picked=[A,D]', s.pickedOf(2), ['A', 'D']);
  s.pick('C');
  s.submit();
  eq('补回 C 后提交 → correct', s.evaluate(2).outcome, 'correct');
}

/* ------------------------- 10. 单选点第二次取消 ------------------------- */
group('10. 单选：再点同一项可取消选择');
{
  const s = new Session(bank, {});
  s.goTo(0);
  s.pick('B');
  eq('点 B → [B]', s.pickedOf(1), ['B']);
  s.pick('B');
  eq('再点 B → 清空', s.pickedOf(1), []);
  eq('清空后 → unselected', s.statusOf(1), 'unselected');
  s.pick('A');
  s.pick('B');
  eq('单选改选：A→B 只保留 B', s.pickedOf(1), ['B']);
}

/* ------------------------- 11. 未选不能提交 ------------------------- */
group('11. 未选择时提交');
{
  const s = new Session(bank, {});
  s.goTo(0);
  const r = s.submit();
  eq('未选提交 → unanswered', r.outcome, 'unanswered');
  eq('未选提交后状态仍 unselected', s.statusOf(1), 'unselected');
  eq('未选提交不计入 submitted', s.stats().submitted, 0);
}

/* ------------------------- 12. 异常题不参与判分 ------------------------- */
group('12. 异常题（scorable:false）在会话中');
{
  const s = new Session(bank, {});
  s.goTo(3);
  eq('异常题 pick 被拒绝', s.pick('A'), false);
  const r = s.submit();
  eq('异常题提交 → invalid', r.outcome, 'invalid');
  eq('异常题提交后不计入 submitted', s.stats().submitted, 0);
  eq('异常题提交后不计入 answered', s.stats().answered, 0);
  eq('异常题不计入正确率分母（scorable=3）', s.stats().scorable, 3);
}

/* ------------------------- 13. 统计口径 ------------------------- */
group('13. 统计派生：正确率 / 覆盖率');
{
  const s = new Session(bank, {});
  s.goTo(0); s.pick('B'); s.submit();      // 对
  s.goTo(1); s.pick('A'); s.submit();      // 错
  s.goTo(2); s.pick('A');                  // 已选未提交
  const st = s.stats();
  eq('answered=2（只有已提交判分的算）', st.answered, 2);
  eq('correct=1', st.correct, 1);
  eq('wrong=1', st.wrong, 1);
  eq('pickedNotSubmitted=1', st.pickedNotSubmitted, 1);
  eq('unselected=1（异常题始终未选）', st.unselected, 1);
  eq('accuracy=50', st.accuracy, 50);
  eq('coverage=67（2/3 计分题）', st.coverage, 67);
  eq('allScorableAnswered=false', st.allScorableAnswered, false);
  eq('wrongIds 只含第 2 题', s.wrongIds(), [2]);
}

/* ------------------------- 14. 持久化 / 断点续做 ------------------------- */
group('14. 持久化：刷新后进度与“选而未交”都在');
{
  const mem = (() => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
      _map: m,
    };
  })();

  const s1 = new Session(bank, { storage: mem, storageKey: 'quiz:test' });
  s1.goTo(0); s1.pick('B'); s1.submit();   // 已提交
  s1.goTo(1); s1.pick('A'); s1.pick('C');  // 选而未交
  s1.goTo(2);                              // 停在第 3 题

  const s2 = new Session(bank, { storage: mem, storageKey: 'quiz:test' });
  eq('刷新后停在同一题（index=2）', s2.index, 2);
  eq('刷新后第 1 题仍是 submitted', s2.statusOf(1), 'submitted');
  eq('刷新后第 1 题判定仍 correct', s2.evaluate(1).outcome, 'correct');
  eq('刷新后第 2 题“选而未交”保留', s2.pickedOf(2), ['A', 'C']);
  eq('刷新后第 2 题状态 picked', s2.statusOf(2), 'picked');
  eq('刷新后统计一致', s2.stats().answered, 1);
  eq('刷新后第 2 题不计入 answered', s2.stats().pickedNotSubmitted, 1);
}
{
  const mem = (() => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
    };
  })();
  const s1 = new Session(bank, { storage: mem, storageKey: 'quiz:test2' });
  s1.goTo(0); s1.pick('B'); s1.submit();
  const s2 = new Session(bank, { storage: mem, storageKey: 'quiz:test2' });
  s2.submit(); s2.submit(); s2.submit(); // 刷新后继续手抖提交
  eq('刷新后再重复提交，correct 仍为 1', s2.stats().correct, 1);
  eq('刷新后再重复提交，submitted 仍为 1', s2.stats().submitted, 1);
}
{
  const s = new Session(bank, {});
  eq('无 storage 时正常工作（纯内存）', s.stats().total, 4);
  eq('无 storage 时 index 从 0 开始', s.index, 0);
}

/* ------------------------- 15. 持久化脏数据容错 ------------------------- */
group('15. 持久化脏数据不崩');
{
  const mem = (() => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
    };
  })();
  mem.setItem('quiz:bad', '{ 这不是 JSON');
  const s = new Session(bank, { storage: mem, storageKey: 'quiz:bad' });
  eq('坏 JSON → 回落到全新会话', s.stats().answered, 0);

  mem.setItem('quiz:bad2', JSON.stringify({ version: 999, bankKey: 'test', answers: {} }));
  const s2 = new Session(bank, { storage: mem, storageKey: 'quiz:bad2' });
  eq('版本不符 → 回落到全新会话', s2.stats().answered, 0);

  mem.setItem('quiz:bad3', JSON.stringify({
    version: 1, bankKey: 'test', index: 99,
    answers: { 1: { picked: ['B', 'B', ''], submitted: true } },
  }));
  const s3 = new Session(bank, { storage: mem, storageKey: 'quiz:bad3' });
  eq('越界 index 被夹到最后一题', s3.index, 3);
  eq('脏 picked 被清洗', s3.pickedOf(1), ['B']);
  eq('脏数据仍能正确判定', s3.evaluate(1).outcome, 'correct');
}

/* ------------------------- 16. 导航边界 ------------------------- */
group('16. 导航边界');
{
  const s = new Session(bank, {});
  ok('初始 canPrev=false', s.nav.canPrev() === false);
  ok('初始 canNext=true', s.nav.canNext() === true);
  s.nav.prev();
  eq('第 1 题点上一题不越界', s.index, 0);
  s.goTo(3);
  ok('最后一题 isLast=true', s.nav.isLast() === true);
  ok('最后一题 canNext=false', s.nav.canNext() === false);
  s.nav.next();
  eq('最后一题点下一题不越界', s.index, 3);
  s.goTo(-5);
  eq('goTo 负数被夹到 0', s.index, 0);
}

/* ------------------------- 17. 多套题库隔离 ------------------------- */
group('17. 不同题库的进度互不干扰');
{
  const mem = (() => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
    };
  })();
  const otherBank = { key: 'other', title: '另一套', chapters: [], questions: [single] };
  const a = new Session(bank, { storage: mem, storageKey: 'quiz:shared' });
  a.goTo(0); a.pick('B'); a.submit();
  const b = new Session(otherBank, { storage: mem, storageKey: 'quiz:shared' });
  eq('题库 key 不符 → 不串用进度', b.stats().answered, 0);
  eq('题库 key 不符 → 从头开始', b.index, 0);
}

/* ------------------------- 18. Store 存储层 ------------------------- */
group('18. Store：持久化层的健壮性');
{
  const Store = require(join(ROOT, 'js', 'core', 'store.js'));

  // 内存兜底（无 storage）
  const memStore = Store.createStore({ version: 1 });
  eq('无 storage 时 enabled=false', memStore.enabled(), false);
  memStore.save({ a: 1 });
  eq('无 storage 时同实例可读回', memStore.load().a, 1);
  memStore.clear();
  eq('clear 后读不到', memStore.load(), null);

  // 注入 storage
  const makeMem = () => {
    const m = new Map();
    return {
      getItem: (k) => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)),
      removeItem: (k) => m.delete(k),
    };
  };

  const mem = makeMem();
  const st = Store.createStore({ storage: mem, key: 'k', version: 2 });
  eq('有 storage 时 enabled=true', st.enabled(), true);
  st.save({ x: 'y' });
  eq('跨实例可读回', Store.createStore({ storage: mem, key: 'k', version: 2 }).load().x, 'y');
  eq('版本不同 → 读不到', Store.createStore({ storage: mem, key: 'k', version: 3 }).load(), null);
  st.clear();
  eq('removeItem 后读不到', st.load(), null);

  // 存储抛异常时不崩
  const brokenStorage = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
    removeItem() { throw new Error('SecurityError'); },
  };
  const broken = Store.createStore({ storage: brokenStorage, key: 'k', version: 1 });
  eq('读抛异常 → 返回 null', broken.load(), null);
  eq('写抛异常 → 返回 false（不抛）', broken.save({ a: 1 }), false);
  eq('删抛异常 → 返回 false（不抛）', broken.clear(), false);

  // 坏 JSON
  mem.setItem('bad', '{{{');
  eq('坏 JSON → 返回 null', Store.createStore({ storage: mem, key: 'bad', version: 1 }).load(), null);

  // 非对象
  mem.setItem('arr', '[1,2,3]');
  eq('数组载荷 → 视为无效', Store.createStore({ storage: mem, key: 'arr', version: 1 }).load(), null);
}

/* ----------------------------- 汇总 ----------------------------- */
const total = passed + failures.length;
console.log('\n' + '─'.repeat(56));
if (failures.length === 0) {
  console.log(`✅ 全部通过：${passed}/${total} 项`);
  process.exit(0);
} else {
  console.log(`❌ 失败 ${failures.length} 项 / 共 ${total} 项`);
  for (const f of failures) console.log('   · ' + f);
  process.exit(1);
}
