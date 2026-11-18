/**
 * Resource Radar — Host half.
 *
 * Routes registered on the DSH web server:
 *  - GET /radar-fetch?url=… : same-origin feed proxy (no CORS in Node).
 *  - GET /radar-ai?payload=…: AI triage via the DSH-configured default model
 *    (ctx.agentDefaultModel + ctx.llm.stream). Payload is JSON:
 *    { items: [{ id, title, note, url, source }] }.
 *
 * No top-level `import` of `node:` builtins: the DSH profile loader's ESM
 * resolver can reject those for an out-of-tree package. Optional diagnostics
 * run only when RESOURCE_RADAR_DIAG names a log file.
 */

const FETCH_ROUTE = '/radar-fetch';
const AI_ROUTE = '/radar-ai';
const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 20000;
const AI_TIMEOUT_MS = 60000;
const AI_MAX_ITEMS = 8;
const DIAG = typeof process !== 'undefined' && process.env ? process.env.RESOURCE_RADAR_DIAG : '';

function diag(msg) {
  if (!DIAG) return;
  try {
    const fs = process.getBuiltinModule ? process.getBuiltinModule('node:fs') : null;
    if (fs && fs.appendFileSync) fs.appendFileSync(DIAG, new Date().toISOString() + ' ' + msg + '\n');
  } catch { /* diagnostics must never break the plugin */ }
}

function isForbiddenTarget(target) {
  let parsed;
  try { parsed = new URL(target); } catch { return true; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
  const host = parsed.hostname;
  if (host === 'localhost' || host === '::1' || host.endsWith('.local')) return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

async function fetchFeed(request) {
  const url = new URL(request.url);
  const target = url.searchParams.get('url') || '';
  if (isForbiddenTarget(target)) return new Response('radar-fetch: rejected target', { status: 400 });
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(target, {
      signal: ac.signal,
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });
    const text = await res.text();
    const body = text.length > MAX_BYTES ? text.slice(0, MAX_BYTES) : text;
    return new Response(body, {
      status: res.status,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch (e) {
    return new Response('radar-fetch error: ' + String((e && e.message) || e).slice(0, 160), { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// AI triage
// ---------------------------------------------------------------------------

const KINDS = ['freebie', 'deal', 'opensource', 'news', 'info', 'noise'];
const OBTAINS = ['free', 'conditional', 'lottery', 'trial', 'promo', 'paid'];
const CATEGORIES = ['ai', 'vps', 'cloud', 'domain', 'opensource', 'software', 'dev', 'design', 'security', 'hardware', 'media', 'game', 'carpool', 'trade', 'headline', 'world', 'finance', 'stock', 'tech', 'news', 'goods', 'offline', 'invite', 'edu', 'pan', 'course', 'other'];

function defaultSelection(ctx) {
  try {
    const svc = ctx.agentDefaultModel;
    const sel = svc && svc.currentSelection && svc.currentSelection();
    if (sel && sel.provider && sel.model) return { provider: sel.provider, model: sel.model, from: 'default-selection' };
  } catch (e) { diag('defaultSelection failed: ' + String(e).slice(0, 120)); }
  try {
    const providers = ctx.llm.listProviders();
    for (const p of providers) {
      // listModels is async; the synchronous path only names the provider.
      return { provider: p.id, model: '', from: 'first-provider', pendingModels: true };
    }
  } catch (e) { diag('listProviders failed: ' + String(e).slice(0, 120)); }
  return null;
}

function buildPrompt(items) {
  const system = '你是福利/资讯聚合雷达的分类与翻译引擎。只输出一个 JSON 数组，不要输出任何其他文字、不要用 markdown 代码块。';
  const user = '对下列条目逐条做筛选、语义定级和中文翻译。\n'
    + 'keep: 布尔值。true = 入选（对用户有价值），false = 淘汰（纯求助、灌水、无价值噪音、广告软文、与描述不符的内容）。\n'
    + 'kind 取值: freebie(白嫖福利) deal(特价好价/拼车/二手) opensource(开源项目) news(重要新闻) info(行业资讯/教程) noise(纯求助/灌水,无价值)\n'
    + 'category 取值: ' + CATEGORIES.join('/') + '\n'
    + 'obtain 取值: free(直接白嫖) conditional(有条件) lottery(抽奖) trial(试用) promo(推广引流) paid(需付费)\n'
    + 'quality: 1-5 整数, 5=高价值确定可领, 1=噪音。\n'
    + 'reason: 不超过 30 字的中文理由。\n'
    + 'titleZh: 条目标题的简体中文翻译（保留产品名/活动名等专有名词原文）；keep=false 时可为空字符串。\n'
    + 'noteZh: 摘要的简体中文翻译（无摘要或摘要无信息量时可为空字符串）。\n'
    + '条目列表(JSON):\n' + JSON.stringify(items);
  return { system, user };
}

function extractJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end <= start) throw new Error('no JSON array in model output');
  const parsed = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error('model output is not an array');
  return parsed;
}

async function aiClassify(ctx, items) {
  if (!ctx.llm || typeof ctx.llm.stream !== 'function') {
    return { ok: false, error: 'DSH llm service not available in this composition' };
  }
  let sel = defaultSelection(ctx);
  if (!sel) return { ok: false, error: 'no model provider registered in DSH' };
  try {
    if (sel.pendingModels) {
      const models = await ctx.llm.listModels(sel.provider);
      const first = Array.isArray(models) && models.length ? models[0] : null;
      if (!first || !first.id) return { ok: false, error: 'provider "' + sel.provider + '" exposes no models' };
      sel = { provider: sel.provider, model: first.id, from: 'first-model' };
    }
  } catch (e) {
    return { ok: false, error: 'listModels failed: ' + String((e && e.message) || e).slice(0, 120) };
  }
  diag('aiClassify via ' + sel.provider + '/' + sel.model + ' (' + sel.from + '), items=' + items.length);
  const { system, user } = buildPrompt(items);
  let text = '';
  try {
    const stream = ctx.llm.stream({
      provider: sel.provider,
      model: sel.model,
      system,
      messages: [{ role: 'user', content: [{ type: 'text', text: user }] }],
      temperature: 0.2,
      maxTokens: 3000,
    });
    for await (const chunk of stream) {
      if (chunk && chunk.type === 'text-delta') text += chunk.text;
      if (chunk && chunk.type === 'finish') break;
      if (chunk && (chunk.type === 'error' || chunk.type === 'aborted')) {
        const msg = chunk.failure ? (chunk.failure.message || chunk.failure.code) : 'stream failure';
        return { ok: false, error: 'model stream failed: ' + String(msg).slice(0, 160), model: sel.provider + '/' + sel.model };
      }
    }
  } catch (e) {
    return { ok: false, error: 'model call failed: ' + String((e && e.message) || e).slice(0, 160), model: sel.provider + '/' + sel.model };
  }
  let parsed;
  try { parsed = extractJsonArray(text); } catch (e) {
    return { ok: false, error: 'bad model output: ' + String((e && e.message) || e).slice(0, 120), raw: text.slice(0, 200), model: sel.provider + '/' + sel.model };
  }
  const byId = new Map();
  for (const row of parsed) {
    if (!row || typeof row !== 'object' || !row.id) continue;
    byId.set(String(row.id), {
      id: String(row.id),
      keep: row.keep !== false,
      kind: KINDS.includes(row.kind) ? row.kind : undefined,
      category: CATEGORIES.includes(row.category) ? row.category : undefined,
      obtain: OBTAINS.includes(row.obtain) ? row.obtain : undefined,
      quality: Math.max(1, Math.min(5, Number(row.quality) || 3)),
      reason: String(row.reason || '').slice(0, 60),
      titleZh: String(row.titleZh || '').slice(0, 200),
      noteZh: String(row.noteZh || '').slice(0, 200),
    });
  }
  return { ok: true, model: sel.provider + '/' + sel.model, results: Array.from(byId.values()) };
}

async function radarAi(request, ctx) {
  const url = new URL(request.url);
  let payload;
  try {
    payload = JSON.parse(url.searchParams.get('payload') || '{}');
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad payload' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const items = Array.isArray(payload.items) ? payload.items.slice(0, AI_MAX_ITEMS) : [];
  if (!items.length) return new Response(JSON.stringify({ ok: false, error: 'no items' }), { status: 400, headers: { 'content-type': 'application/json' } });
  const slim = items.map((it) => ({
    id: String(it.id || ''),
    title: String(it.title || '').slice(0, 160),
    note: String(it.note || '').slice(0, 120),
    url: String(it.url || '').slice(0, 200),
    source: String(it.source || '').slice(0, 40),
  }));
  const result = await aiClassify(ctx, slim);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 502,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** Required services: the model-call channel and the default model selection. */
export const inject = ['llm', 'agentDefaultModel'];

export function apply(ctx) {
  let present = false;
  try { present = !!(ctx && ctx.webServer); } catch { present = false; }
  diag('apply() ran; webServer=' + (present ? 'present' : 'missing'));

  const install = (webServer) => {
    if (!webServer || typeof webServer.register !== 'function') { diag('install: no usable webServer'); return; }
    try {
      ctx.effect(
        () => {
          const disposers = [];
          try {
            disposers.push(webServer.register({ kind: 'prefix', path: FETCH_ROUTE, resource: fetchFeed }));
            disposers.push(webServer.register({ kind: 'prefix', path: AI_ROUTE, resource: (request) => radarAi(request, ctx) }));
            let origin = '?';
            try { origin = webServer.getOrigin ? webServer.getOrigin() : '?'; } catch { origin = '?'; }
            diag('registered ' + FETCH_ROUTE + ' + ' + AI_ROUTE + ' on ' + origin);
            return () => { for (const d of disposers) { if (typeof d === 'function') d(); } };
          } catch (e) {
            diag('register FAILED: ' + String((e && e.stack) || e).slice(0, 400));
            return () => { for (const d of disposers) { if (typeof d === 'function') d(); } };
          }
        },
        'resource-radar: feed proxy + AI triage routes',
      );
    } catch (e) {
      diag('effect FAILED: ' + String((e && e.stack) || e).slice(0, 400));
    }
  };

  if (present) {
    install(ctx.webServer);
  } else if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], (tctx) => { diag('inject resolved webServer'); install(tctx.webServer); });
  }
}
