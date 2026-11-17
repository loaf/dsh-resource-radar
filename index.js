/**
 * Resource Radar — Host half.
 *
 * Registers a same-origin feed proxy (`GET /radar-fetch?url=…`) on the DSH web
 * server so the client workbench can collect RSS/Atom feeds without being
 * blocked by the browser's cross-origin (CORS) policy. Fetching happens here,
 * in Node, where no such restriction exists.
 *
 * No top-level `import` of `node:` builtins: the DSH profile loader's ESM
 * resolver can reject those for an out-of-tree package, so builtins are taken
 * lazily from `process.getBuiltinModule`.
 */

const ROUTE = '/radar-fetch';
const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 20000;
// Optional diagnostics: set RESOURCE_RADAR_DIAG to a file path to trace activation.
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

export function apply(ctx) {
  let present = false;
  try { present = !!(ctx && ctx.webServer); } catch { present = false; }
  diag('apply() ran; webServer=' + (present ? 'present' : 'missing'));

  const install = (webServer) => {
    if (!webServer || typeof webServer.register !== 'function') { diag('install: no usable webServer'); return; }
    try {
      ctx.effect(
        () => {
          try {
            const dispose = webServer.register({ kind: 'prefix', path: ROUTE, resource: fetchFeed });
            let origin = '?';
            try { origin = webServer.getOrigin ? webServer.getOrigin() : '?'; } catch { origin = '?'; }
            diag('registered ' + ROUTE + ' on ' + origin);
            return () => { if (typeof dispose === 'function') dispose(); };
          } catch (e) {
            diag('register FAILED: ' + String((e && e.stack) || e).slice(0, 400));
            return undefined;
          }
        },
        'resource-radar: feed proxy route',
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
