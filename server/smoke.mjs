/**
 * 服务端冒烟测试 —— server/smoke.mjs
 *
 * 用 node:http 直接起一个随机端口的服务、用临时数据库，跑八组检查；
 * 全过打印 `SMOKE PASS 8/8`，有失败打印明细并以退出码 1 结束。
 *
 * 运行：node server\smoke.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startServer } from './server.mjs';

const results = [];
let failures = 0;

function ok(name, cond, extra) {
  if (cond) {
    results.push('  ok   ' + name);
  } else {
    failures += 1;
    results.push('  FAIL ' + name + (extra === undefined ? '' : '  <<< ' + extra));
  }
  return cond;
}

/** 发一个请求；返回 { status, headers, text } */
function request(port, method, reqPath, opts = {}) {
  return new Promise((resolve, reject) => {
    const headers = Object.assign({}, opts.headers || {});
    let payload = null;
    if (opts.json !== undefined) {
      payload = Buffer.from(JSON.stringify(opts.json), 'utf8');
      headers['Content-Type'] = 'application/json';
    } else if (opts.body) {
      payload = Buffer.isBuffer(opts.body) ? opts.body : Buffer.from(opts.body, 'utf8');
    }
    if (payload) headers['Content-Length'] = payload.length;

    const req = http.request(
      { host: '127.0.0.1', port, method, path: reqPath, headers, agent: false },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: Buffer.concat(chunks).toString('utf8'),
          });
        });
      }
    );
    req.on('error', (err) => {
      // 413 之后服务端会主动断开，客户端可能先收到 reset
      if (opts.tolerateReset) {
        resolve({ status: 0, headers: {}, text: '', error: err.message });
        return;
      }
      reject(err);
    });
    req.setTimeout(8000, () => req.destroy(new Error('timeout')));
    if (payload) req.write(payload);
    req.end();
  });
}

function jsonOf(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cookieOf(res) {
  const raw = res.headers['set-cookie'];
  if (!raw) return '';
  const first = Array.isArray(raw) ? raw[0] : raw;
  return String(first).split(';')[0];
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recall-smoke-'));
  const dbPath = path.join(tmpDir, 'smoke.db');
  const tokenPath = path.join(tmpDir, 'admin-token.txt');

  const app = await startServer({ port: 0, dbPath, tokenPath, silent: true });
  const port = app.port;
  const token = fs.readFileSync(tokenPath, 'utf8').trim();

  try {
    // ---- 1. 探活 -------------------------------------------------------
    const health = await request(port, 'GET', '/api/health');
    const healthJson = jsonOf(health.text);
    ok('1. GET /api/health → 200', health.status === 200, 'status=' + health.status);
    ok('1. health 返回 ok:true 且 db:ok', !!healthJson && healthJson.ok === true && healthJson.db === 'ok',
      health.text.slice(0, 120));

    // ---- 2. 提交反馈 ---------------------------------------------------
    const good = await request(port, 'POST', '/api/feedback', {
      json: {
        bankKey: 'web',
        bankTitle: 'Web前端题库',
        questionId: 31,
        kind: '答案有误',
        note: '答案应该是 B',
        picked: ['A'],
        answer: ['B'],
        page: 'quiz',
      },
    });
    const goodJson = jsonOf(good.text);
    ok('2. 合法反馈 → 200 且返回 id', good.status === 200 && !!goodJson && Number.isInteger(goodJson.id),
      'status=' + good.status + ' body=' + good.text.slice(0, 120));
    const feedbackId = goodJson && goodJson.id;

    const badKind = await request(port, 'POST', '/api/feedback', {
      json: { bankKey: 'web', questionId: 31, kind: '胡说八道', note: '', picked: [], answer: [] },
    });
    const badKindJson = jsonOf(badKind.text);
    ok('2. 非法 kind → 400', badKind.status === 400, 'status=' + badKind.status);
    ok('2. 400 的响应体是 { ok:false, error }', !!badKindJson && badKindJson.ok === false && !!badKindJson.error,
      badKind.text.slice(0, 120));

    const huge = await request(port, 'POST', '/api/feedback', {
      body: Buffer.alloc(70000, 0x41),
      headers: { 'Content-Type': 'application/json' },
      tolerateReset: true,
    });
    ok('2. 超大 body（70KB）→ 413', huge.status === 413, 'status=' + huge.status);

    // ---- 3. 未登录访问 --------------------------------------------------
    const unauth = await request(port, 'GET', '/api/feedback?status=pending');
    ok('3. 未登录 GET /api/feedback → 401', unauth.status === 401, 'status=' + unauth.status);

    // ---- 4. 登录 -------------------------------------------------------
    const login = await request(port, 'POST', '/admin/login', { json: { token } });
    const cookie = cookieOf(login);
    ok('4. 用令牌登录 → 200', login.status === 200, 'status=' + login.status + ' body=' + login.text.slice(0, 120));
    ok('4. 登录返回 HttpOnly + SameSite=Lax 的 Cookie',
      /recall_admin=/.test(cookie) && /HttpOnly/i.test(String(login.headers['set-cookie'])) && /SameSite=Lax/i.test(String(login.headers['set-cookie'])),
      JSON.stringify(login.headers['set-cookie'] || null));

    const authed = await request(port, 'GET', '/api/feedback?status=pending', { headers: { Cookie: cookie } });
    const authedJson = jsonOf(authed.text);
    ok('4. 登录后 GET /api/feedback → 200', authed.status === 200, 'status=' + authed.status);
    ok('4. 列表里包含刚提交的那条',
      !!authedJson && Array.isArray(authedJson.items) && authedJson.items.some((x) => x.id === feedbackId),
      authed.text.slice(0, 200));

    // ---- 5. 处理 ------------------------------------------------------
    const handled = await request(port, 'POST', '/api/feedback/' + feedbackId + '/handle', {
      json: { status: 'handled' },
      headers: { Cookie: cookie },
    });
    ok('5. POST /api/feedback/:id/handle → 200', handled.status === 200, 'status=' + handled.status + ' body=' + handled.text.slice(0, 120));

    const after = await request(port, 'GET', '/api/feedback?status=handled', { headers: { Cookie: cookie } });
    const afterJson = jsonOf(after.text);
    const handledRow = afterJson && Array.isArray(afterJson.items)
      ? afterJson.items.find((x) => x.id === feedbackId)
      : null;
    ok('5. 再查状态已是 handled', !!handledRow && handledRow.status === 'handled', JSON.stringify(handledRow && handledRow.status));

    // ---- 6. 导出 CSV ---------------------------------------------------
    const csv = await request(port, 'GET', '/api/export.csv', { headers: { Cookie: cookie } });
    const csvBody = csv.text.replace(/^\ufeff/, '');
    ok('6. GET /api/export.csv → 200', csv.status === 200, 'status=' + csv.status);
    ok('6. CSV 含表头（首行为字段名）',
      csvBody.indexOf('id,') === 0 && /题库/.test(csvBody.split('\r\n')[0]),
      csvBody.slice(0, 120));
    ok('6. CSV 含这条数据（至少有 1 行记录）', csvBody.trim().split('\r\n').length >= 2, csvBody.slice(0, 120));

    // ---- 7. 静态托管与越权 ---------------------------------------------
    const rootPage = await request(port, 'GET', '/');
    ok('7. GET / → 200 且是 index.html',
      rootPage.status === 200 && rootPage.text.indexOf('id="app"') >= 0 && rootPage.text.indexOf('<title>') >= 0,
      'status=' + rootPage.status + ' head=' + rootPage.text.slice(0, 80));

    const css = await request(port, 'GET', '/css/styles.css');
    ok('7. GET /css/styles.css → 200 且带 ETag / Cache-Control',
      css.status === 200 && !!css.headers.etag && /max-age=3600/.test(String(css.headers['cache-control'])),
      'status=' + css.status + ' etag=' + css.headers.etag + ' cc=' + css.headers['cache-control']);

    const css304 = await request(port, 'GET', '/css/styles.css', { headers: { 'If-None-Match': css.headers.etag } });
    ok('7. 带 If-None-Match 再取 css → 304', css304.status === 304, 'status=' + css304.status);

    const noStoreServer = await request(port, 'GET', '/server/server.mjs');
    ok('7. GET /server/server.mjs → 403/404', noStoreServer.status === 403 || noStoreServer.status === 404,
      'status=' + noStoreServer.status);

    let traversal;
    try {
      traversal = await request(port, 'GET', '/../package.json');
    } catch (err) {
      traversal = { status: 400, error: err.message };
    }
    ok('7. GET /../package.json → 403/404（无效 400 亦可）',
      traversal.status === 403 || traversal.status === 404 || traversal.status === 400,
      'status=' + traversal.status);

    const hidden = await request(port, 'GET', '/.git/config');
    ok('7. GET /.git/config → 403/404', hidden.status === 403 || hidden.status === 404, 'status=' + hidden.status);

    // ---- 8. 限流 ------------------------------------------------------
    const statuses = [];
    for (let i = 0; i < 12; i++) {
      const r = await request(port, 'POST', '/api/feedback', {
        json: { bankKey: 'web', questionId: 1 + i, kind: '其他', note: '', picked: [], answer: [] },
        tolerateReset: true,
      });
      statuses.push(r.status);
    }
    ok('8. 连发 12 次反馈 → 至少 1 次 429', statuses.indexOf(429) >= 0, 'statuses=' + statuses.join(','));
  } finally {
    await app.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log(results.join('\n'));
  const total = results.length;
  if (failures === 0) {
    console.log('\nSMOKE PASS %d/%d', total, total);
  } else {
    console.log('\nSMOKE FAIL %d/%d（失败 %d 项）', total - failures, total, failures);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('SMOKE FAIL 异常：%s', err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
