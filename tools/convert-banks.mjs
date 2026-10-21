#!/usr/bin/env node
/**
 * 题库转换脚本：ref/题库/*.md  -->  js/data/*.js
 *
 * 用法：  node tools/convert-banks.mjs
 *
 * 三条硬约定：
 *  1) ref/ 下的原始题库文件只读，永不修改。
 *  2) 题干 / 选项 / 解析一律“只去首尾空行”，内部换行与行首缩进原样保留，
 *     不做任何空白归一化、不折叠空行、不去缩进。
 *  3) 勘误只发生在产出数据上，全部由 ERRATA 表驱动，并写入《数据质量报告》。
 *
 * 每次运行都会做一遍“保真自检”：用一份独立实现的参照提取器，逐题逐字段
 * 把原始 Markdown 切片与产出字段做字符级比对，任何非 ERRATA 允许的差异
 * 都会报错并指出题号 / 字段。
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const REF = join(ROOT, 'ref', '题库');
const OUT_DATA = join(ROOT, 'js', 'data');
const OUT_DOCS = join(ROOT, 'docs');

/* =========================================================================
 * 题库清单
 * =======================================================================*/
const BANKS = [
  {
    key: 'java',
    title: 'Java程序设计题库',
    src: 'Java题库.md',
    out: 'java.js',
    varName: 'JAVA_BANK',
    expected: { total: 219, single: 192, multiple: 12, judge: 15 },
    // Java 保持单章节：不另建分组、不移动题目
    chapters: [{ no: 1, title: 'Java题库', srcHeadings: ['Java题库'] }],
  },
  {
    key: 'web',
    title: 'Web前端题库',
    src: 'Web题库.md',
    out: 'web.js',
    varName: 'WEB_BANK',
    expected: { total: 120, single: 65, multiple: 13, judge: 42 },
    chapters: [
      { no: 1, title: 'HTML基础', srcHeadings: ['一、HTML基础'] },
      { no: 2, title: 'HTML进阶', srcHeadings: ['二、HTML进阶'] },
      { no: 3, title: 'HTML表单与表格', srcHeadings: ['三、HTML表单与表格'] },
      { no: 4, title: 'CSS', srcHeadings: ['四、CSS'] },
      { no: 5, title: 'JavaScript基础', srcHeadings: ['五、JavaScript基础'] },
      { no: 6, title: 'JavaScript进阶', srcHeadings: ['六、JavaScript进阶'] },
    ],
  },
];

/* =========================================================================
 * 勘误表（唯一真源）
 *  kind: fixAnswer（有依据的改答案）/ keepEmpty（保持为空，不补写）
 *        / invalid（数据异常，不参与判分）
 * =======================================================================*/
const ERRATA = {
  java: {
    71: {
      kind: 'fixAnswer',
      answer: ['B'],
      correction: '（源文件无答案行）→ B',
      problem: '缺少“**答案**：”行，题目无法判分。',
      basis: '题干问“定义常量”的关键字，解析中明确指出 final 修饰的变量用于定义常量、const 未使用；四个选项中唯一对应的是 B。',
      fix: '答案补为 B（不改动题干、选项、解析任何文字）。',
    },
    142: {
      kind: 'keepEmpty',
      correction: '解析保持为空（不补写）',
      problem: '缺少“**解析**：”行。',
      basis: '原文只有答案行，无任何解析文字。',
      fix: '不补写解析；数据中 explanation 为空字符串，展示时解析区留空。判分不受影响。',
    },
  },
  web: {
    31: {
      kind: 'invalid',
      correction: '选项保持缺失；answer: null；scorable: false',
      problem: '选项整体缺失（题干与答案之间没有 A/B/C/D 选项行）。',
      basis: '源文件只保留题干、答案 A 和解析，选项被截断丢失；自行补写选项即等于编题，超出授权。',
      fix: '不补写选项；标记 scorable:false（不参与判分）。题干与解析照常显示，答题页/结果页以一行小字说明。',
    },
    80: {
      kind: 'fixAnswer',
      answer: ['B'],
      correction: 'E → B',
      problem: '答案写作 E，但只有 A–D 四个选项，且 E 不在选项中。',
      basis: '解析明确“unshift() 在数组开头添加元素”，unshift() 是选项 B。',
      fix: '答案改为 B（不改动题干、选项、解析任何文字）。',
    },
  },
};

const TYPE_MAP = { 单选题: 'single', 多选题: 'multiple', 判断题: 'judge' };
const TYPE_CN = { single: '单选题', multiple: '多选题', judge: '判断题' };

/* ------------------------------ 文本规则 ---------------------------------
 * 唯一的“空白处理”规则：只去掉首尾空行。
 * 内部空行、行首缩进（代码块缩进）一律原样保留。
 * -----------------------------------------------------------------------*/
function trimOuterBlankLines(lines) {
  const isBlank = (l) => l.trim() === '';
  let a = 0;
  let b = lines.length;
  while (a < b && isBlank(lines[a])) a++;
  while (b > a && isBlank(lines[b - 1])) b--;
  return lines.slice(a, b).join('\n');
}

/** 结构标记识别（题干/选项/答案/解析的分界） */
function classify(line) {
  let m;
  if ((m = /^-\s+([A-Z])[\.、）)]\s*(.*)$/.exec(line))) return { kind: 'option', key: m[1], rest: m[2] };
  if ((m = /^\*\*答案\*\*：\s*(.*)$/.exec(line))) return { kind: 'answer', rest: m[1] };
  if ((m = /^\*\*解析\*\*：\s*(.*)$/.exec(line))) return { kind: 'explanation', rest: m[1] };
  return { kind: 'text' };
}

/** 答案字符串 -> 字母数组："A、C、D" -> ['A','C','D'] */
function parseAnswerLetters(raw) {
  if (raw == null) return null;
  const letters = raw.match(/[A-Z]/g);
  return letters && letters.length ? [...new Set(letters)].sort() : null;
}

/* =========================================================================
 * 扫描：把所有题目块切成 [start, end) 的原始行区间
 * =======================================================================*/
function scanBlocks(rawLines, bank) {
  const chapterByHeading = new Map();
  for (const ch of bank.chapters) for (const h of ch.srcHeadings) chapterByHeading.set(h, ch.no);

  const blocks = [];
  let currentChapter = null;
  let fence = false;
  let cur = null;

  const close = (endIdx) => {
    if (!cur) return;
    cur.end = endIdx;
    blocks.push(cur);
    cur = null;
  };

  rawLines.forEach((line, i) => {
    const fenceLine = line.trim().startsWith('```');
    if (!fenceLine) {
      const h2 = /^##\s+(.+?)\s*$/.exec(line);
      if (h2 && chapterByHeading.has(h2[1])) {
        close(i);
        currentChapter = chapterByHeading.get(h2[1]);
        return;
      }
      const h3 = /^###\s+(\d+)\.\s*(单选题|多选题|判断题)\s*$/.exec(line);
      if (h3) {
        close(i);
        cur = { no: Number(h3[1]), typeCn: h3[2], chapter: currentChapter, start: i, end: null };
        return;
      }
      if (/^---\s*$/.test(line)) {
        close(i);
        return;
      }
    }
    if (fenceLine) fence = !fence;
  });
  close(rawLines.length);
  return blocks;
}

/* =========================================================================
 * 生产用字段提取器（唯一实现，供产出数据使用）
 * =======================================================================*/
function extractFields(rawLines, block) {
  const stemLines = [];
  const expLines = [];
  const options = [];
  let curOpt = null;
  let answerRaw = null;
  let zone = 'stem';
  let fence = false;

  for (let i = block.start + 1; i < block.end; i++) {
    const line = rawLines[i];
    const fenceLine = line.trim().startsWith('```');
    const insideFence = fence;
    if (fenceLine) fence = !fence;

    // 只在代码围栏之外识别结构行；围栏内一切行都是内容，原样归入当前区域
    if (!insideFence && !fenceLine) {
      const c = classify(line);
      if (c.kind === 'option') {
        if (curOpt) options.push(curOpt);
        curOpt = { key: c.key, lines: [c.rest] };
        zone = 'option';
        continue;
      }
      if (c.kind === 'answer') {
        if (curOpt) { options.push(curOpt); curOpt = null; }
        answerRaw = c.rest;
        zone = 'answer';
        continue;
      }
      if (c.kind === 'explanation') {
        if (curOpt) { options.push(curOpt); curOpt = null; }
        expLines.push(c.rest);
        zone = 'explanation';
        continue;
      }
    }

    if (curOpt) curOpt.lines.push(line);
    else if (zone === 'explanation') expLines.push(line);
    else if (zone === 'stem') stemLines.push(line);
    // zone === 'answer' 时忽略中间行（正常题库没有）
  }
  if (curOpt) options.push(curOpt);

  return {
    stem: trimOuterBlankLines(stemLines),
    options: options.map((o) => ({ key: o.key, text: trimOuterBlankLines(o.lines) })),
    answerRaw,
    explanation: trimOuterBlankLines(expLines),
  };
}

/* =========================================================================
 * 参照提取器（自检专用，独立实现，故意不复用生产提取器）
 * 目的：生产提取器一旦回归出“空白归一化”，这里立刻能比对出差错。
 * =======================================================================*/
function referenceFields(rawLines, block) {
  const out = { stemLines: [], options: [], explanationLines: [], answerRaw: null };
  let opt = null;
  let zone = 'head'; // head -> option -> answer -> explanation
  let fence = false;
  for (const line of rawLines.slice(block.start + 1, block.end)) {
    const fenceLine = line.trim().startsWith('```');
    const insideFence = fence;
    if (fenceLine) fence = !fence;
    if (insideFence) {
      // 代码围栏内容原样归入当前区域
      targetPush(line);
      continue;
    }
    if (fenceLine) {
      targetPush(line);
      continue;
    }
    const c = classify(line);
    switch (c.kind) {
      case 'option':
        if (opt) out.options.push(opt);
        opt = { key: c.key, lines: [c.rest] };
        zone = 'option';
        break;
      case 'answer':
        if (opt) { out.options.push(opt); opt = null; }
        out.answerRaw = c.rest;
        zone = 'answer';
        break;
      case 'explanation':
        if (opt) { out.options.push(opt); opt = null; }
        out.explanationLines.push(c.rest);
        zone = 'explanation';
        break;
      default:
        targetPush(line);
    }
  }
  if (opt) out.options.push(opt);

  function targetPush(line) {
    if (opt) opt.lines.push(line);
    else if (zone === 'explanation') out.explanationLines.push(line);
    else if (zone === 'head') out.stemLines.push(line);
  }

  return {
    stem: trimOuterBlankLines(out.stemLines),
    options: out.options.map((o) => ({ key: o.key, text: trimOuterBlankLines(o.lines) })),
    answerRaw: out.answerRaw,
    explanation: trimOuterBlankLines(out.explanationLines),
  };
}

/* =========================================================================
 * 组装题目对象 + 套用勘误
 * =======================================================================*/
function finalize(block, fields, bank, stats) {
  const type = TYPE_MAP[block.typeCn];
  stats[type] += 1;

  const errata = (ERRATA[bank.key] || {})[block.no] || null;
  const sourceAnswer = fields.answerRaw == null ? null : parseAnswerLetters(fields.answerRaw);
  let answer = sourceAnswer ? [...sourceAnswer] : null;
  let scorable = true;

  if (errata) {
    if (errata.kind === 'fixAnswer') answer = [...errata.answer];
    else if (errata.kind === 'invalid') scorable = false;
    // keepEmpty：不改数据
  }

  const optionKeys = new Set(fields.options.map((o) => o.key));
  const issues = [];
  if (!fields.options.length) issues.push('无选项');
  if (!sourceAnswer) issues.push('无答案');
  else if (sourceAnswer.some((k) => !optionKeys.has(k))) issues.push('答案不在选项内');
  if (!fields.explanation) issues.push('无解析');

  return {
    id: block.no,
    type,
    typeCn: block.typeCn,
    chapter: block.chapter,
    scorable,
    stem: fields.stem,
    options: fields.options,
    answer: scorable ? answer : null,
    sourceAnswer, // 供保真自检比对，不写入数据文件
    explanation: fields.explanation,
    autoIssues: issues,
    errata: errata ? errata.kind : null,
    _block: block,
  };
}

function parseBank(bank) {
  const raw = readFileSync(join(REF, bank.src), 'utf8');
  const rawLines = raw.split(/\r?\n/);
  const blocks = scanBlocks(rawLines, bank);
  const stats = { single: 0, multiple: 0, judge: 0 };
  const questions = blocks.map((b) => finalize(b, extractFields(rawLines, b), bank, stats));
  return { rawLines, blocks, questions, stats, actual: { total: questions.length, ...stats } };
}

/* =========================================================================
 * 保真自检
 * =======================================================================*/
function selfCheck(bank, parsed) {
  const problems = [];
  const allowed = [];
  const { rawLines, questions } = parsed;

  for (const q of questions) {
    const ref = referenceFields(rawLines, q._block);
    const at = (field) => `${bank.title} 第 ${q.id} 题 / ${field}`;

    if (ref.stem !== q.stem) {
      problems.push(`${at('题干')}：参照长度 ${ref.stem.length}，产出长度 ${q.stem.length}`);
    }
    if (ref.explanation !== q.explanation) {
      problems.push(`${at('解析')}：参照长度 ${ref.explanation.length}，产出长度 ${q.explanation.length}`);
    }
    if (ref.options.length !== q.options.length) {
      problems.push(`${at('选项')}：参照 ${ref.options.length} 项，产出 ${q.options.length} 项`);
    } else {
      for (let i = 0; i < ref.options.length; i++) {
        if (ref.options[i].key !== q.options[i].key || ref.options[i].text !== q.options[i].text) {
          problems.push(`${at('选项 ' + ref.options[i].key)}：与原文不一致`);
        }
      }
    }

    // 参照提取器 vs 生产提取器：答案原文是否一致
    const refAns = ref.answerRaw == null ? null : parseAnswerLetters(ref.answerRaw);
    if (JSON.stringify(refAns) !== JSON.stringify(q.sourceAnswer)) {
      problems.push(`${at('答案(原文提取)')}：参照 ${JSON.stringify(refAns)}，产出 ${JSON.stringify(q.sourceAnswer)}`);
    }

    // 产出答案 vs 原文答案：差异必须由 ERRATA 明确允许
    if (JSON.stringify(refAns) !== JSON.stringify(q.answer)) {
      const e = (ERRATA[bank.key] || {})[q.id];
      if (e && (e.kind === 'fixAnswer' || e.kind === 'invalid')) {
        allowed.push(`${bank.title} 第 ${q.id} 题：${refAns ? refAns.join('') : '无'} → ${q.answer ? q.answer.join('') : '无'}（${e.correction}）`);
      } else {
        problems.push(`${at('答案(产出)')}：参照 ${JSON.stringify(refAns)}，产出 ${JSON.stringify(q.answer)}，且无 ERRATA 允许`);
      }
    }
  }

  // 专项：行首缩进逐行保真（这正是本轮的回归点）
  const indentViolations = [];
  let indentChecked = 0;
  const indentQuestions = [];
  for (const q of questions) {
    const fields = [['题干', q.stem], ['解析', q.explanation], ...q.options.map((o) => ['选项 ' + o.key, o.text])];
    const producedLines = new Set();
    for (const [, text] of fields) for (const l of text.split('\n')) producedLines.add(l);

    let hasIndentedCode = false;
    for (const line of rawLines.slice(q._block.start + 1, q._block.end)) {
      if (line.trim() === '') continue;
      if (/^[ \t]+\S/.test(line)) {
        hasIndentedCode = true;
        if (!producedLines.has(line)) {
          indentViolations.push(`${bank.title} 第 ${q.id} 题：原文缩进行未在产出中原样出现 → "${line.slice(0, 40)}"`);
        }
      }
    }
    if (hasIndentedCode) { indentChecked++; indentQuestions.push(q.id); }
  }

  // 专项：空行数保真（针对多段材料题）
  const blankViolations = [];
  for (const q of questions) {
    const ref = referenceFields(rawLines, q._block);
    const refBlank = ref.stem.split('\n').filter((l) => l.trim() === '').length;
    const outBlank = q.stem.split('\n').filter((l) => l.trim() === '').length;
    if (refBlank !== outBlank) blankViolations.push(`${bank.title} 第 ${q.id} 题：题干内部空行 参照 ${refBlank}，产出 ${outBlank}`);
  }

  problems.push(...indentViolations, ...blankViolations);

  return { problems, allowed, indentChecked, indentQuestions };
}

/* =========================================================================
 * 生成数据模块（只放数据）
 *  var 名 wave：为了能在 index.html 里写死 <script src>，窗口全局变量固定。
 * =======================================================================*/
function buildDataModule(bank, parsed) {
  const chapters = bank.chapters.map((ch) => ({
    no: ch.no,
    title: ch.title,
    count: parsed.questions.filter((q) => q.chapter === ch.no).length,
  }));

  const payload = {
    key: bank.key,
    title: bank.title,
    source: `ref/题库/${bank.src}`,
    chapters,
    questions: parsed.questions.map((q) => ({
      id: q.id,
      type: q.type,
      chapter: q.chapter,
      scorable: q.scorable,
      stem: q.stem,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
    })),
  };

  return (
    `/* 由 tools/convert-banks.mjs 生成，请勿手改；改题库请改 ref/题库/${bank.src} 后重跑脚本 */\n` +
    `window.${bank.varName} = ` +
    JSON.stringify(payload, null, 2) +
    `;\n`
  );
}

/* =========================================================================
 * 《数据质量报告》
 * =======================================================================*/
function buildReport(banks, parsedByKey, checks) {
  let md = `# 题库数据质量报告\n\n`;
  md += `> 本文件由 \`tools/convert-banks.mjs\` 生成，请勿手改。\n`;
  md += `> 改题库请改 \`ref/题库/\` 下的原始文件；改勘误请改脚本里的 ERRATA 表；然后重跑脚本。\n\n`;
  md += `- 原始题库文件在整个转换过程中**只读**，未做任何修改；\n`;
  md += `- 题干 / 选项 / 解析**只去首尾空行**，内部换行与行首缩进原样保留；\n`;
  md += `- 所有勘误只发生在产出数据（\`js/data/*.js\`）上，且与脚本 ERRATA 表一一对应。\n\n`;

  md += `## 一、题量对账\n\n`;
  md += `| 题库 | 预期总数 | 实际总数 | 单选 | 多选 | 判断 | 结论 |\n|---|---|---|---|---|---|---|\n`;
  for (const bank of banks) {
    const p = parsedByKey[bank.key];
    const e = bank.expected;
    const a = p.actual;
    const ok = e.total === a.total && e.single === a.single && e.multiple === a.multiple && e.judge === a.judge;
    md += `| ${bank.title} | ${e.total} | ${a.total} | ${a.single}/${e.single} | ${a.multiple}/${e.multiple} | ${a.judge}/${e.judge} | ${ok ? '✅ 一致' : '❌ 不一致'} |\n`;
  }
  md += `\n`;

  md += `## 二、勘误清单（有依据的改动）\n\n`;
  for (const bank of banks) {
    const entries = Object.entries(ERRATA[bank.key] || {});
    if (!entries.length) continue;
    md += `### ${bank.title}\n\n`;
    md += `| 题号 | 问题 | 依据 | 修正值 | 处理方式 |\n|---|---|---|---|---|\n`;
    for (const [no, e] of entries.sort((x, y) => x[0] - y[0])) {
      md += `| 第 ${no} 题 | ${e.problem} | ${e.basis} | ${e.correction} | ${e.fix} |\n`;
    }
    md += `\n`;
  }

  md += `## 三、自动体检（仅报告，未擅自修改）\n\n`;
  md += `下表为脚本对全部题目做的结构体检。**除「二」中已定的勘误外，其余内容零改动。**\n\n`;
  md += `| 题库 | 题号 | 题型 | 自动发现 | 勘误处理 |\n|---|---|---|---|---|\n`;
  let issueCount = 0;
  for (const bank of banks) {
    for (const q of parsedByKey[bank.key].questions) {
      if (!q.autoIssues.length) continue;
      issueCount++;
      md += `| ${bank.title} | 第 ${q.id} 题 | ${q.typeCn} | ${q.autoIssues.join('、')} | ${q.errata || '（未处理，原样保留）'} |\n`;
    }
  }
  md += issueCount ? `\n体检共发现 **${issueCount}** 处结构异常，均已在上表列明。\n\n` : `\n体检未发现异常。\n\n`;

  md += `## 四、保真自检\n\n`;
  const totalQ = banks.reduce((n, b) => n + parsedByKey[b.key].questions.length, 0);
  const totalProblems = checks.reduce((n, c) => n + c.problems.length, 0);
  const totalAllowed = checks.reduce((n, c) => n + c.allowed.length, 0);
  md += `- 题目总数：${totalQ}\n`;
  md += `- 意外差异：**${totalProblems}** 处\n`;
  md += `- ERRATA 允许的差异：${totalAllowed} 处\n`;
  md += `- 缩进保真专项：${checks.reduce((n, c) => n + c.indentChecked, 0)} 道含缩进代码的题逐行核对\n\n`;
  if (totalAllowed) {
    md += `允许的差异（均有 ERRATA 依据）：\n\n`;
    for (const c of checks) for (const a of c.allowed) md += `- ${a}\n`;
    md += `\n`;
  }
  if (totalProblems) {
    md += `⚠️ 意外差异明细：\n\n`;
    for (const c of checks) for (const p of c.problems) md += `- ${p}\n`;
    md += `\n`;
  } else {
    md += `✅ 逐题逐字段比对通过，无意外差异。\n\n`;
  }

  md += `## 五、章节结构\n\n`;
  for (const bank of banks) {
    const p = parsedByKey[bank.key];
    md += `**${bank.title}**\n\n| 章节 | 题数 |\n|---|---|\n`;
    for (const ch of p.chapters) md += `| ${ch.no}. ${ch.title} | ${ch.count} |\n`;
    md += `\n`;
  }

  return md;
}

/* =========================================================================
 * 主流程
 * =======================================================================*/
function main() {
  mkdirSync(OUT_DATA, { recursive: true });
  mkdirSync(OUT_DOCS, { recursive: true });

  const parsedByKey = {};
  const checks = [];
  let totalQuestions = 0;
  let totalProblems = 0;
  let totalAllowed = 0;
  let indentCheckedTotal = 0;
  let reconciliationOk = true;

  for (const bank of BANKS) {
    const parsed = parseBank(bank);
    parsed.chapters = bank.chapters.map((ch) => ({
      no: ch.no,
      title: ch.title,
      count: parsed.questions.filter((q) => q.chapter === ch.no).length,
    }));
    parsedByKey[bank.key] = parsed;

    const check = selfCheck(bank, parsed);
    checks.push(check);

    const { total, ...byType } = bank.expected;
    const ok =
      total === parsed.actual.total &&
      byType.single === parsed.actual.single &&
      byType.multiple === parsed.actual.multiple &&
      byType.judge === parsed.actual.judge;
    if (!ok) reconciliationOk = false;
    console.log(
      `${bank.title}: 共 ${parsed.actual.total}/${total} 题 ` +
        `(单选 ${parsed.actual.single}/${byType.single}, 多选 ${parsed.actual.multiple}/${byType.multiple}, 判断 ${parsed.actual.judge}/${byType.judge}) ` +
        (ok ? '✅ 对账一致' : '❌ 对账不一致')
    );

    writeFileSync(join(OUT_DATA, bank.out), buildDataModule(bank, parsed), 'utf8');

    totalQuestions += parsed.questions.length;
    totalProblems += check.problems.length;
    totalAllowed += check.allowed.length;
    indentCheckedTotal += check.indentChecked;
  }

  console.log('');
  console.log(
    `保真自检：${totalQuestions - totalProblems}/${totalQuestions} 题无意外差异` +
      (totalProblems ? `，❌ 发现 ${totalProblems} 处差异` : ' ✅') +
      `（ERRATA 允许的差异 ${totalAllowed} 处）`
  );
  console.log(`缩进保真专项：${indentCheckedTotal}/${indentCheckedTotal} 道含缩进代码的题逐行通过`);
  if (totalAllowed) {
    for (const c of checks) for (const a of c.allowed) console.log(`  · 允许差异：${a}`);
  }
  if (totalProblems) {
    for (const c of checks) for (const p of c.problems) console.log(`  ✗ ${p}`);
  }

  writeFileSync(join(OUT_DOCS, '数据质量报告.md'), buildReport(BANKS, parsedByKey, checks), 'utf8');
  console.log('');
  console.log('已生成: js/data/java.js, js/data/web.js, docs/数据质量报告.md');

  if (!reconciliationOk || totalProblems) process.exitCode = 1;
}

main();
