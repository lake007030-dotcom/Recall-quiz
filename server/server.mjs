/**
 * Recall 可选服务端 —— server/server.mjs
 *
 * 唯一入口：静态托管 + 反馈 API + 管理后台。
 * 只用 Node 内置模块（node:http / node:fs / node:crypto / node:sqlite），零 npm 依赖。
 *
 * 定位：纯静态模式仍然是主形态。双击 index.html 全功能可用；
 * 起这个服务只是为了额外提供「反馈入库 + 管理后台」，前端探测不到就静默退回本地反馈箱。
 *
 * 启动：node server\server.mjs            （默认 http://localhost:8080）
 *       PORT=9090 DB_PATH=D:\tmp\x.db node server\server.mjs
 */

import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const SELF_FILE = fileURLToPath(import.meta.url);
const SERVER_DIR = path.dirname(SELF_FILE);
const ROOT = path.resolve(SERVER_DIR, '..');
const DEFAULT_PORT = 8080;
const SERVER_VERSION = '1.0.0';

/** 请求体上限 64KB */
const BODY_MAX = 64 * 1024;
/** 会话有效期 2 小时 */
const SESSION_TTL = 2 * 60 * 60 * 1000;
/** 限流：POST /api/feedback 每 IP 10 次 / 分钟；/admin/login 5 次 / 分钟 */
const LIMIT_FEEDBACK = { max: 10, windowMs: 60 * 1000 };
const LIMIT_LOGIN = { max: 5, windowMs: 60 * 1000 };

/** 问题类型的对外取值（中文标签）与前端键的对应关系 */
const KIND_BY_KEY = {
  stem: '题干有误',
  option: '选项有误',
  answer: '答案有误',
  explain: '解析有误',
  other: '其他',
};
const KIND_LABELS = Object.keys(KIND_BY_KEY).map((k) => KIND_BY_KEY[k]);

/** 静态托管的顶层白名单（目录或文件） */
const STATIC_FILES = new Set(['index.html', 'style-preview.html']);
const STATIC_DIRS = ['css', 'js', 'docs', 'ref', 'tools'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
};

// ---------------------------------------------------------------------------
// 小工具
// ---------------------------------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

function clip(v, max) {
  const s = v === null || v === undefined ? '' : String(v);
  return s.length > max ? s.slice(0, max) : s;
}

function str(v) {
  return v === null || v === undefined ? '' : String(v);
}

function letters(v) {
  if (!Array.isArray(v)) return null;
  const out = [];
  for (const x of v) {
    if (typeof x !== 'string' && typeof x !== 'number') return null;
    if (String(x).length > 8) return null;
    out.push(String(x));
  }
  return out.slice(0, 8);
}

function escapeHtml(v) {
  return str(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function json(res, status, obj, extraHeaders) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(
    status,
    Object.assign(
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': body.length,
        'Cache-Control': 'no-store',
      },
      extraHeaders || {}
    )
  );
  res.end(body);
}

function fail(res, status, error, extraHeaders) {
  json(res, status, { ok: false, error: str(error) }, extraHeaders);
}

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf) return xf.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

/** 固定窗口限流（内存，键为 IP + 用途） */
function makeLimiter() {
  const hits = new Map();
  return function hit(key, rule) {
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || now >= cur.resetAt) {
      hits.set(key, { count: 1, resetAt: now + rule.windowMs });
      return true;
    }
    if (cur.count >= rule.max) return false;
    cur.count += 1;
    return true;
  };
}

/**
 * 超过 64KB：等请求体读完再回 413。
 * 边读边砍会让客户端在写请求体时收到 ECONNRESET，看不到这个 413；
 * 所以在 4MB 以内把它读完（丢掉内容），超出上限才直接断开。
 */
const DRAIN_MAX = 4 * 1024 * 1024;

/** 读请求体；超过 64KB 读完后回 413 并返回 null */
function readBody(req, res) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    let over = false;
    let done = false;

    function finish(value) {
      if (done) return;
      done = true;
      resolve(value);
    }

    req.on('data', (chunk) => {
      if (done) return;
      size += chunk.length;
      if (size > BODY_MAX) {
        over = true;
        if (size > DRAIN_MAX) {
          fail(res, 413, '请求体超过 64KB');
          res.setHeader('Connection', 'close');
          req.destroy();
          finish(null);
          return;
        }
        return; // 超限后只计数，不再攒内容
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (done) return;
      if (over) {
        fail(res, 413, '请求体超过 64KB');
        finish(null);
        return;
      }
      finish(Buffer.concat(chunks));
    });
    req.on('error', () => finish(null));
  });
}

function parseJson(buf) {
  if (!buf || !buf.length) return {};
  try {
    const v = JSON.parse(buf.toString('utf8'));
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

function parseForm(buf) {
  const out = {};
  if (!buf || !buf.length) return out;
  const text = buf.toString('utf8');
  for (const pair of text.split('&')) {
    if (!pair) continue;
    const i = pair.indexOf('=');
    const k = decodeURIComponent((i < 0 ? pair : pair.slice(0, i)).replace(/\+/g, ' '));
    const v = i < 0 ? '' : decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
    out[k] = v;
  }
  return out;
}

function isFormRequest(req) {
  const ct = str(req.headers['content-type']);
  return ct.indexOf('application/x-www-form-urlencoded') === 0;
}

function parseCookies(req) {
  const out = {};
  const raw = str(req.headers.cookie);
  if (!raw) return out;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function timingEqual(a, b) {
  const ba = Buffer.from(str(a), 'utf8');
  const bb = Buffer.from(str(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ---------------------------------------------------------------------------
// 数据库
// ---------------------------------------------------------------------------

function openDb(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_key TEXT NOT NULL,
      bank_title TEXT,
      question_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      note TEXT,
      picked TEXT,
      answer TEXT,
      page TEXT,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      handled_at TEXT,
      handler TEXT
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT,
      action TEXT,
      detail TEXT
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_feedback_bank ON feedback(bank_key)');
  return db;
}

// ---------------------------------------------------------------------------
// 静态文件
// ---------------------------------------------------------------------------

function deniedStatic(rel) {
  if (!rel) return true;
  const parts = rel.split('/');
  for (const p of parts) {
    if (!p) return true;
    if (p.startsWith('.')) return true; // 隐藏文件
    if (p === '..') return true; // 穿越
    if (p.indexOf('\\') >= 0) return true;
  }
  if (parts[0] === 'server') return true; // 服务端自身不可访问
  if (parts.length === 1) return !STATIC_FILES.has(parts[0]);
  return STATIC_DIRS.indexOf(parts[0]) < 0;
}

function etagFor(stat) {
  return '"' + Math.floor(stat.mtimeMs).toString(16) + '-' + stat.size.toString(16) + '"';
}

async function serveStatic(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    fail(res, 400, '路径编码不合法');
    return;
  }
  if (rel === '/' || rel === '') rel = '/index.html';
  rel = rel.replace(/^\/+/, '');
  if (deniedStatic(rel)) {
    fail(res, 404, 'Not Found');
    return;
  }
  const target = path.resolve(ROOT, rel);
  // 再次确认落点在项目根内
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    fail(res, 403, 'Forbidden');
    return;
  }
  let stat;
  try {
    stat = await fsp.stat(target);
  } catch {
    fail(res, 404, 'Not Found');
    return;
  }
  if (!stat.isFile()) {
    fail(res, 404, 'Not Found');
    return;
  }
  const cached = rel.startsWith('css/') || rel.startsWith('js/');
  const etag = etagFor(stat);
  const headers = {
    'Content-Type': MIME[path.extname(target).toLowerCase()] || 'application/octet-stream',
    ETag: etag,
    'Cache-Control': cached ? 'public, max-age=3600' : 'no-cache',
  };
  if (str(req.headers['if-none-match']) === etag) {
    res.writeHead(304, headers);
    res.end();
    return;
  }
  headers['Content-Length'] = stat.size;
  res.writeHead(200, headers);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(target).on('error', () => res.destroy()).pipe(res);
}

// ---------------------------------------------------------------------------
// 服务
// ---------------------------------------------------------------------------

/**
 * 启动服务。
 * @param {{port?:number, dbPath?:string, tokenPath?:string, silent?:boolean}} opts
 */
export async function startServer(opts = {}) {
  const port = opts.port === undefined ? Number(process.env.PORT || DEFAULT_PORT) : opts.port;
  const dataDir = path.join(SERVER_DIR, 'data');
  const dbPath = path.resolve(opts.dbPath || process.env.DB_PATH || path.join(dataDir, 'recall.db'));
  const tokenPath = path.resolve(opts.tokenPath || path.join(path.dirname(dbPath), 'admin-token.txt'));
  const silent = !!opts.silent;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = openDb(dbPath);

  // 管理员令牌：首次自动生成
  let token = '';
  try {
    token = fs.readFileSync(tokenPath, 'utf8').trim();
  } catch {
    token = '';
  }
  if (!token) {
    token = crypto.randomBytes(18).toString('base64url');
    fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
    fs.writeFileSync(tokenPath, token + '\n', { mode: 0o600 });
  }

  const sessions = new Map(); // sid -> expiresAt
  const limit = makeLimiter();

  function newSession() {
    const sid = crypto.randomBytes(18).toString('base64url');
    sessions.set(sid, Date.now() + SESSION_TTL);
    return sid;
  }

  function sessionOf(req) {
    const auth = str(req.headers.authorization);
    if (auth.toLowerCase().startsWith('bearer ')) {
      const given = auth.slice(7).trim();
      if (timingEqual(given, token)) return 'bearer';
      return '';
    }
    const sid = parseCookies(req).recall_admin;
    if (!sid) return '';
    const exp = sessions.get(sid);
    if (!exp) return '';
    if (Date.now() > exp) {
      sessions.delete(sid);
      return '';
    }
    return sid;
  }

  const q = {
    insert: db.prepare(`
      INSERT INTO feedback (bank_key, bank_title, question_id, kind, note, picked, answer, page, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    byId: db.prepare('SELECT * FROM feedback WHERE id = ?'),
    handle: db.prepare('UPDATE feedback SET status = ?, handled_at = ?, handler = ? WHERE id = ?'),
    audit: db.prepare('INSERT INTO admin_audit (at, action, detail) VALUES (?, ?, ?)'),
    all: db.prepare('SELECT * FROM feedback ORDER BY id DESC'),
  };

  async function handleFeedbackPost(req, res) {
    if (!limit('fb:' + clientIp(req), LIMIT_FEEDBACK)) {
      fail(res, 429, '反馈提交太频繁，请一分钟后再试', { 'Retry-After': '60' });
      return;
    }
    const body = await readBody(req, res);
    if (body === null) return;
    const input = parseJson(body);
    if (!input) {
      fail(res, 400, '请求体不是合法 JSON 对象');
      return;
    }
    const bankKey = clip(input.bankKey, 40);
    if (!bankKey) {
      fail(res, 400, 'bankKey 不能为空');
      return;
    }
    const questionId = Number(input.questionId);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      fail(res, 400, 'questionId 必须是正整数');
      return;
    }
    const rawKind = str(input.kind);
    const kind = KIND_BY_KEY[rawKind] || (KIND_LABELS.indexOf(rawKind) >= 0 ? rawKind : '');
    if (!kind) {
      fail(res, 400, 'kind 只能取：' + KIND_LABELS.join('、'));
      return;
    }
    const note = clip(input.note, 200);
    const picked = letters(input.picked);
    const answer = letters(input.answer);
    if (picked === null || answer === null) {
      fail(res, 400, 'picked / answer 必须是字符串数组');
      return;
    }
    const info = q.insert.run(
      bankKey,
      clip(input.bankTitle, 120),
      questionId,
      kind,
      note,
      picked.join(','),
      answer.join(','),
      clip(input.page, 40),
      nowIso()
    );
    json(res, 200, { ok: true, id: Number(info.lastInsertRowid) });
  }

  function requireAdmin(req, res) {
    if (sessionOf(req)) return true;
    fail(res, 401, '需要管理员登录');
    return false;
  }

  function listFeedback(url) {
    const status = str(url.searchParams.get('status') || '');
    const bank = str(url.searchParams.get('bank') || '');
    const kind = str(url.searchParams.get('kind') || '');
    const where = [];
    const args = [];
    if (status && status !== 'all') {
      where.push('status = ?');
      args.push(status);
    }
    if (bank) {
      where.push('bank_key = ?');
      args.push(bank);
    }
    if (kind) {
      where.push('kind = ?');
      args.push(KIND_BY_KEY[kind] || kind);
    }
    const sql =
      'SELECT * FROM feedback' +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ' ORDER BY id DESC LIMIT 500';
    return db.prepare(sql).all(...args);
  }

  async function handleFeedbackHandle(req, res, id) {
    if (!requireAdmin(req, res)) return;
    const row = q.byId.get(id);
    if (!row) {
      fail(res, 404, '没有这条反馈');
      return;
    }
    const body = await readBody(req, res);
    if (body === null) return;
    const input = isFormRequest(req) ? parseForm(body) : parseJson(body);
    if (!input) {
      fail(res, 400, '请求体不合法');
      return;
    }
    const status = str(input.status);
    if (status !== 'handled' && status !== 'ignored') {
      fail(res, 400, 'status 只能是 handled 或 ignored');
      return;
    }
    const at = nowIso();
    q.handle.run(status, at, 'admin', id);
    q.audit.run(at, 'feedback.' + status, 'id=' + id);
    json(res, 200, { ok: true, id: Number(id), status: status, handledAt: at });
  }

  function csvOf(rows) {
    const head = ['id', '时间', '题库', '题号', '类型', '备注', '我的选择', '当前答案', '页面', '状态', '处理时间'];
    const lines = [head.join(',')];
    for (const r of rows) {
      const cells = [
        r.id,
        r.created_at,
        r.bank_title || r.bank_key,
        r.question_id,
        r.kind,
        r.note || '',
        r.picked || '',
        r.answer || '',
        r.page || '',
        r.status,
        r.handled_at || '',
      ].map((v) => {
        const s = str(v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      });
      lines.push(cells.join(','));
    }
    return '\ufeff' + lines.join('\r\n') + '\r\n';
  }

  async function handleAdminLogin(req, res) {
    if (!limit('login:' + clientIp(req), LIMIT_LOGIN)) {
      fail(res, 429, '尝试太频繁，请一分钟后再试', { 'Retry-After': '60' });
      return;
    }
    const body = await readBody(req, res);
    if (body === null) return;
    const input = isFormRequest(req) ? parseForm(body) : parseJson(body);
    if (!input) {
      fail(res, 400, '请求体不合法');
      return;
    }
    const given = str(input.token).trim();
    if (!given || !timingEqual(given, token)) {
      fail(res, 401, '令牌不正确');
      return;
    }
    const sid = newSession();
    json(
      res,
      200,
      { ok: true },
      {
        'Set-Cookie':
          'recall_admin=' + sid + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + Math.floor(SESSION_TTL / 1000),
      }
    );
  }

  async function route(req, res) {
    const started = Date.now();
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    const method = req.method || 'GET';

    res.on('finish', () => {
      if (!silent) {
        // 只记方法、路径、状态码、耗时；不记查询串与 Cookie
        console.log('%s %s %d %dms', method, pathname, res.statusCode, Date.now() - started);
      }
    });

    // 管理后台页面
    if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin.html') {
      try {
        const html = await fsp.readFile(path.join(SERVER_DIR, 'admin.html'));
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': html.length,
          'Cache-Control': 'no-cache',
        });
        res.end(method === 'HEAD' ? undefined : html);
      } catch {
        fail(res, 500, '管理后台页面缺失');
      }
      return;
    }

    // 浏览器总会来要一下子，别在控制台刷 404
    if (pathname === '/favicon.ico') {
      res.writeHead(204, { 'Cache-Control': 'public, max-age=86400' });
      res.end();
      return;
    }

    if (pathname === '/api/health') {
      if (method !== 'GET' && method !== 'HEAD') {
        fail(res, 405, '只支持 GET');
        return;
      }
      let dbState = 'ok';
      try {
        db.prepare('SELECT 1 AS x').get();
      } catch {
        dbState = 'error';
      }
      json(res, 200, { ok: true, version: SERVER_VERSION, db: dbState });
      return;
    }

    if (pathname === '/api/feedback' && method === 'POST') {
      await handleFeedbackPost(req, res);
      return;
    }

    if (pathname === '/api/feedback' && (method === 'GET' || method === 'HEAD')) {
      if (!requireAdmin(req, res)) return;
      const items = listFeedback(url);
      json(res, 200, { ok: true, total: items.length, items: items });
      return;
    }

    const handleMatch = /^\/api\/feedback\/(\d+)\/handle$/.exec(pathname);
    if (handleMatch) {
      if (method !== 'POST') {
        fail(res, 405, '只支持 POST');
        return;
      }
      await handleFeedbackHandle(req, res, Number(handleMatch[1]));
      return;
    }

    if (pathname === '/api/export.csv') {
      if (!requireAdmin(req, res)) return;
      const rows = q.all.all();
      const csv = Buffer.from(csvOf(rows), 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Length': csv.length,
        'Content-Disposition': 'attachment; filename="recall-feedback.csv"',
        'Cache-Control': 'no-store',
      });
      res.end(method === 'HEAD' ? undefined : csv);
      return;
    }

    if (pathname === '/admin/login') {
      if (method !== 'POST') {
        fail(res, 405, '只支持 POST');
        return;
      }
      await handleAdminLogin(req, res);
      return;
    }

    if (pathname.startsWith('/api/')) {
      fail(res, 404, '没有这个接口');
      return;
    }

    if (method !== 'GET' && method !== 'HEAD') {
      fail(res, 405, '静态资源只支持 GET');
      return;
    }

    await serveStatic(req, res, pathname);
  }

  const server = http.createServer((req, res) => {
    route(req, res).catch((err) => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      fail(res, 500, '服务器内部错误' + (err && err.message ? '：' + err.message : ''));
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      resolve();
    });
  });

  const addr = server.address();

  if (!silent) {
    console.log('Recall 服务端已启动');
    console.log('  监听地址    http://localhost:%d', addr.port);
    console.log('  静态根目录  %s', ROOT);
    console.log('  数据库      %s', dbPath);
    console.log('  管理员令牌  %s', tokenPath);
    console.log('  管理后台    http://localhost:%d/admin', addr.port);
    console.log('  （纯静态模式不受影响：双击 index.html 仍然全功能可用）');
  }

  return {
    server,
    db,
    port: addr.port,
    dbPath,
    tokenPath,
    token,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      try {
        db.close();
      } catch {
        /* ignore */
      }
    },
  };
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SELF_FILE);

if (invokedDirectly) {
  startServer().catch((err) => {
    console.error('启动失败：%s', err && err.message ? err.message : err);
    process.exitCode = 1;
  });
}
