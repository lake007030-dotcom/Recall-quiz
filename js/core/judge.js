/**
 * 判题单一真源 —— js/core/judge.js
 *
 * 全站（答题页 / 错题本 / 结果页）只允许从这里判断对错。
 * 本文件是纯函数，无 DOM、无存储、无副作用，可在浏览器与 Node 下同时使用。
 *
 * 数据侧事实：每道题的正确答案是 question.answer（字母数组，如 ['B'] 或 ['A','C','D']），
 * 题干类型（single/multiple/judge）不影响判定算法——判定一律是“作答集合与答案集合相等”。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizJudge = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** 判题结果。对一题一次判定，恰好落到其中一种。 */
  var OUTCOME = {
    CORRECT: 'correct',      // 已作答，且完全正确
    WRONG: 'wrong',          // 已作答，但不正确
    UNANSWERED: 'unanswered',// 未作答（没有任何选择）
    INVALID: 'invalid',      // 数据异常题（scorable:false），不参与判分
  };

  /** 把任意输入整理成“判题用的字母集合”：去重、去空、排序。 */
  function normalizeKeys(keys) {
    if (!Array.isArray(keys)) return [];
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (typeof k !== 'string' || k === '') continue;
      if (seen[k]) continue;
      seen[k] = true;
      out.push(k);
    }
    return out.sort();
  }

  /** 集合相等：选项顺序不影响结果，漏选 / 错选都判为不等。 */
  function sameAnswer(picked, answer) {
    var a = normalizeKeys(picked);
    var b = normalizeKeys(answer);
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  /**
   * 判定一题。
   * @param {object} question  题库数据里的题目对象
   * @param {string[]} picked  当前选择（字母数组）
   * @returns {{outcome:string, questionId:*, picked:string[], correctAnswer:string[], isCorrect:boolean, countsAsAnswered:boolean, reason:string}}
   */
  function judge(question, picked) {
    var normalized = normalizeKeys(picked);
    var result = {
      questionId: question ? question.id : null,
      picked: normalized,
      correctAnswer: [],
      outcome: OUTCOME.UNANSWERED,
      isCorrect: false,
      countsAsAnswered: false,
      reason: '',
    };

    if (!question || question.scorable === false) {
      result.outcome = OUTCOME.INVALID;
      result.reason = '数据异常题，不参与判分';
      return result;
    }

    result.correctAnswer = normalizeKeys(question.answer);

    if (normalized.length === 0) {
      result.outcome = OUTCOME.UNANSWERED;
      result.reason = '未作答';
      return result;
    }

    result.isCorrect = sameAnswer(normalized, result.correctAnswer);
    result.countsAsAnswered = true;
    result.outcome = result.isCorrect ? OUTCOME.CORRECT : OUTCOME.WRONG;
    result.reason = result.isCorrect ? '回答正确' : '回答错误';
    return result;
  }

  return {
    OUTCOME: OUTCOME,
    normalizeKeys: normalizeKeys,
    sameAnswer: sameAnswer,
    judge: judge,
  };
});
