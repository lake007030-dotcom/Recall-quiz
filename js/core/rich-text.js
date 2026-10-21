/**
 * 富文本渲染 —— js/core/rich-text.js
 *
 * 题库原文是 Markdown 的一个**子集**，本文件是它唯一的渲染实现。
 *
 * 只支持题库里真实出现过的语法（先扫过全库确认，不做没必要的功能）：
 *   - ``` 围栏代码块（保留缩进与空行）
 *   - 行内 `code`
 *   - **粗体**
 *   - "- " 无序列表 / "1. " 有序列表
 *   - 段落之间的空行；段落内部的硬换行（用 pre-wrap 保留）
 *
 * 明确**不支持**斜体：题库里的 "*" 全是 /* 注释 * / 这类代码，转成斜体会渲染错误。
 *
 * 安全：所有文本先转义，题干里的 <video>、Map<String, Integer> 等一律当字面量显示，
 * 绝不当 HTML 解析。这是全站唯一允许“文本 -> HTML”的地方。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizRich = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ESCAPE_MAP[c];
    });
  }

  /** 粗体：输入必须已经是转义过的文本 */
  function boldOfEscaped(s) {
    return s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  /** 行内渲染：先切出 code 片段（避免 code 里的 ** 被当成粗体），再逐段转义 */
  function inline(text) {
    var out = '';
    var re = /`([^`]+)`/g;
    var last = 0;
    var m;
    while ((m = re.exec(text)) !== null) {
      out += boldOfEscaped(escapeHtml(text.slice(last, m.index)));
      out += '<code>' + escapeHtml(m[1]) + '</code>';
      last = m.index + m[0].length;
    }
    out += boldOfEscaped(escapeHtml(text.slice(last)));
    return out;
  }

  var RE_FENCE = /^\s*```/;
  var RE_FENCE_CLOSE = /^\s*```\s*$/;
  var RE_UL = /^\s*[-*]\s+\S/;
  var RE_OL = /^\s*\d+\.\s+\S/;

  /** 块级渲染 */
  function render(text) {
    if (!text) return '';
    var lines = String(text).split('\n');
    var html = '';
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      // 代码围栏
      if (RE_FENCE.test(line)) {
        i++;
        var buf = [];
        while (i < lines.length && !RE_FENCE_CLOSE.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++; // 跳过收尾围栏（未闭合时 i 会越界，循环自然结束）
        html += '<pre><code>' + escapeHtml(buf.join('\n')) + '</code></pre>';
        continue;
      }

      // 空行：块分隔
      if (line.trim() === '') {
        i++;
        continue;
      }

      // 无序列表
      if (RE_UL.test(line)) {
        var ul = [];
        while (i < lines.length && RE_UL.test(lines[i])) {
          ul.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
        }
        html += '<ul>';
        for (var u = 0; u < ul.length; u++) html += '<li>' + inline(ul[u]) + '</li>';
        html += '</ul>';
        continue;
      }

      // 有序列表
      if (RE_OL.test(line)) {
        var ol = [];
        while (i < lines.length && RE_OL.test(lines[i])) {
          ol.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        html += '<ol>';
        for (var o = 0; o < ol.length; o++) html += '<li>' + inline(ol[o]) + '</li>';
        html += '</ol>';
        continue;
      }

      // 段落：连续的非空、非结构行；内部换行由 pre-wrap 保留
      var para = [];
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !RE_FENCE.test(lines[i]) &&
        !RE_UL.test(lines[i]) &&
        !RE_OL.test(lines[i])
      ) {
        para.push(lines[i]);
        i++;
      }
      html += '<p>' + inline(para.join('\n')) + '</p>';
    }

    return html;
  }

  return { render: render, escapeHtml: escapeHtml, inline: inline };
});
