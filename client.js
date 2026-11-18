window.__ModuleLoader__.load({
  id: 'dsh-resource-radar-v8',
  factory(require) {
    const React = require('react');
    const { useState, useMemo, useCallback, useEffect, useRef } = React;
    const h = React.createElement;

    const STORE_KEY = 'resource-radar.v3';
    const PANEL_ID = 'resource-radar';
    const REPO_URL = 'https://github.com/loaf/dsh-resource-radar';

    const KINDS = ['freebie', 'deal', 'opensource', 'news', 'info', 'noise'];
    const OBTAINS = ['free', 'conditional', 'lottery', 'trial', 'promo', 'paid'];
    const CATEGORIES = [
      'ai', 'vps', 'cloud', 'domain', 'opensource', 'software', 'dev', 'design',
      'security', 'hardware', 'media', 'game', 'carpool', 'trade', 'headline',
      'world', 'finance', 'stock', 'tech', 'news', 'goods', 'offline', 'invite',
      'edu', 'pan', 'course', 'other',
    ];
    const NEWS_CATEGORIES = ['headline', 'world', 'finance', 'stock', 'tech', 'dev', 'opensource', 'security', 'hardware', 'news'];
    const CHANNELS = {
      selectFreebie: { kinds: ['freebie'], obtains: ['free', 'conditional'], categories: null },
      allFreebie: { kinds: ['freebie'], obtains: null, categories: null },
      deals: { kinds: ['deal'], obtains: null, categories: null },
      oss: { kinds: ['opensource'], obtains: null, categories: null },
      news: { kinds: ['news'], obtains: null, categories: NEWS_CATEGORIES },
      info: { kinds: ['info'], obtains: null, categories: null },
    };
    const KIND_ICON = { freebie: '🎁', deal: '💰', opensource: '🛠', news: '📰', info: '💡', noise: '🗑' };

    const SEED_SOURCES = [
      { id: 'v2ex', name: 'V2EX', type: 'rss', enabled: true, feedUrl: 'https://www.v2ex.com/index.xml', kindHint: 'info', catHint: 'dev' },
      { id: 'gamerpower', name: 'GamerPower 限免', type: 'rss', enabled: true, feedUrl: 'https://www.gamerpower.com/feed', kindHint: 'freebie', catHint: 'game' },
      { id: 'sos', name: 'SharewareOnSale', type: 'rss', enabled: true, feedUrl: 'https://sharewareonsale.com/feed', kindHint: 'freebie', catHint: 'software' },
      { id: 'reddit-freebies', name: 'Reddit r/freebies', type: 'rss', enabled: true, feedUrl: 'https://www.reddit.com/r/freebies/.rss', kindHint: 'freebie', catHint: 'goods' },
      { id: 'sspai', name: '少数派', type: 'rss', enabled: true, feedUrl: 'https://sspai.com/feed', kindHint: 'info', catHint: 'tech' },
      { id: 'solidot', name: 'Solidot 奇客', type: 'rss', enabled: true, feedUrl: 'https://www.solidot.org/index.rss', kindHint: 'news', catHint: 'tech' },
      { id: 'hn', name: 'Hacker News', type: 'rss', enabled: true, feedUrl: 'https://news.ycombinator.com/rss', kindHint: 'info', catHint: 'dev' },
      { id: 'linuxdo', name: 'LINUX DO（需 FlareSolverr）', type: 'rss', enabled: false, feedUrl: 'https://linux.do/latest.rss', kindHint: 'info', catHint: 'other' },
      { id: 'nodeseek', name: 'NodeSeek（需 FlareSolverr）', type: 'rss', enabled: false, feedUrl: 'https://www.nodeseek.com/rss', kindHint: 'deal', catHint: 'vps' },
      { id: 'steam', name: 'Steam 特价', type: 'rss', enabled: false, feedUrl: '', kindHint: 'deal', catHint: 'game' },
      { id: 'github-trending', name: 'GitHub Trending', type: 'rss', enabled: false, feedUrl: '', kindHint: 'opensource', catHint: 'opensource' },
      { id: 'tg-channels', name: 'Telegram 频道', type: 'rss', enabled: false, feedUrl: '', kindHint: 'info', catHint: 'other' },
    ];

    const STORE_ROUTE = '/radar-store';

    const CORS_RELAYS = [
      { name: 'host', url: (u) => '/radar-fetch?url=' + encodeURIComponent(u), kind: 'xml' },
      { name: 'direct', url: (u) => u, kind: 'xml' },
      { name: 'rss2json', url: (u) => 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(u), kind: 'json' },
      { name: 'codetabs', url: (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u), kind: 'xml' },
      { name: 'allorigins', url: (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), kind: 'xml' },
    ];

    const SEED_ITEMS = [
      { id: 's1', title: 'Epic 本周限免：Race Rookie Rally（原价 ¥68）', kind: 'freebie', category: 'game', obtain: 'free', quality: 5, source: 'Epic 限免', url: 'https://store.epicgames.com/', note: '直接领取入库，本周内有效', time: '2026-11-16', code: '' },
      { id: 's2', title: 'OpenRouter 新增 GLM :free 免费额度模型', kind: 'freebie', category: 'ai', obtain: 'free', quality: 4, source: 'LINUX DO', url: 'https://openrouter.ai/', note: '带 :free 后缀即可白嫖', time: '2026-11-16', code: '' },
      { id: 's3', title: 'Cloudflare Workers 免费版额度提升至 10 万请求/天', kind: 'freebie', category: 'cloud', obtain: 'conditional', quality: 4, source: 'V2EX', url: 'https://workers.cloudflare.com/', note: '需注册免费账号', time: '2026-11-15', code: '' },
      { id: 's4', title: 'NameCheap .xyz 域名首年 $0.99', kind: 'deal', category: 'domain', obtain: 'paid', quality: 3, source: 'NodeSeek 福利/拼车', url: 'https://www.namecheap.com/', note: '黑五价，仅限首年', time: '2026-11-16', code: '' },
      { id: 's5', title: '黑五 RackNerd VPS：1C/768M/年付 $10.99', kind: 'deal', category: 'vps', obtain: 'paid', quality: 4, source: 'NodeSeek 福利/拼车', url: 'https://www.racknerd.com/', note: '年付，黑五链接', time: '2026-11-15', code: '' },
      { id: 's6', title: '《赛博朋克2077》Steam 史低 -60%', kind: 'deal', category: 'game', obtain: 'paid', quality: 3, source: 'Steam 特价', url: 'https://store.steampowered.com/', note: '', time: '2026-11-14', code: '' },
      { id: 's7', title: '开源：radar-cli 一行命令扫描全网站点变化', kind: 'opensource', category: 'opensource', obtain: 'free', quality: 4, source: 'GitHub Trending', url: 'https://github.com/', note: 'MIT，Go 实现', time: '2026-11-16', code: '' },
      { id: 's8', title: '开源：ocr-lite 浏览器端离线 OCR，无依赖', kind: 'opensource', category: 'opensource', obtain: 'free', quality: 5, source: 'GitHub Trending', url: 'https://github.com/', note: '', time: '2026-11-15', code: '' },
      { id: 's9', title: '重要：某主流云厂商大面积 API 网关故障已恢复', kind: 'news', category: 'tech', obtain: 'free', quality: 4, source: 'CCTV 新闻', url: 'https://news.cctv.com/', note: '', time: '2026-11-16', code: '' },
      { id: 's10', title: '央行发布支付新规征求意见稿', kind: 'news', category: 'finance', obtain: 'free', quality: 3, source: 'CCTV 新闻', url: 'https://news.cctv.com/', note: '', time: '2026-11-15', code: '' },
      { id: 's11', title: '2026 黑五折扣指南：VPS / 云服务 / 域名汇总', kind: 'info', category: 'vps', obtain: 'free', quality: 5, source: 'LINUX DO', url: 'https://linux.do/', note: '持续更新帖', time: '2026-11-14', code: '' },
      { id: 's12', title: '教程：用 Workers 免费额度自建 RSS 聚合器', kind: 'info', category: 'dev', obtain: 'free', quality: 4, source: 'V2EX', url: 'https://v2ex.com/', note: '', time: '2026-11-13', code: '' },
      { id: 's13', title: '某网盘会员 5 折拼车（还差 2 位）', kind: 'deal', category: 'carpool', obtain: 'paid', quality: 2, source: 'NGA 拼车', url: '', note: '拼车有跑路风险', time: '2026-11-16', code: '' },
      { id: 's14', title: 'SharewareOnSale：PDF 工具箱终身授权免费领', kind: 'freebie', category: 'software', obtain: 'conditional', quality: 3, source: 'SharewareOnSale', url: 'https://sharewareonsale.com/', note: '限时活动页领取', time: '2026-11-15', code: '' },
      { id: 's15', title: '求推荐一台 300 元以内的软由', kind: 'noise', category: 'hardware', obtain: 'free', quality: 1, source: 'NodeSeek 福利/拼车', url: '', note: '纯求助，建议屏蔽', time: '2026-11-16', code: '' },
    ];

    let autoCollectDone = false;

    function loadStore() {
      let firstRun = true;
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) {
          firstRun = false;
          const s = JSON.parse(raw);
          return {
            firstRun,
            items: Array.isArray(s.items) ? s.items : SEED_ITEMS,
            sources: Array.isArray(s.sources) && s.sources.length ? s.sources : SEED_SOURCES,
            blocklist: Array.isArray(s.blocklist) ? s.blocklist : [],
            view: s.view === 'compact' ? 'compact' : 'cards',
          };
        }
      } catch (e) { /* fall through */ }
      return { firstRun, items: SEED_ITEMS, sources: SEED_SOURCES, blocklist: [], view: 'cards' };
    }

    function matchesBlock(title, list) {
      return list.some((w) => w && title.toLowerCase().includes(String(w).toLowerCase()));
    }

    function stripHtml(s) {
      const div = document.createElement('div');
      div.innerHTML = String(s || '');
      return (div.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function parseFeedXml(xml, source) {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      if (doc.querySelector('parsererror')) throw new Error('bad xml');
      const nodes = Array.from(doc.querySelectorAll('item, entry')).slice(0, 40);
      return nodes.map((n, i) => {
        const get = (sel) => { const el = n.querySelector(sel); return el ? el.textContent : ''; };
        const linkEl = n.querySelector('link');
        const link = linkEl && linkEl.textContent ? linkEl.textContent.trim() : (linkEl && linkEl.getAttribute('href')) || '';
        const title = stripHtml(get('title'));
        const time = (get('pubDate') || get('updated') || get('published') || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
        const note = stripHtml(get('description') || get('summary') || get('content')).slice(0, 160);
        return {
          id: source.id + '-' + (link || title).slice(0, 120) + '-' + i,
          title: title || '(untitled)',
          kind: source.kindHint || 'info',
          category: source.catHint || 'other',
          obtain: source.kindHint === 'freebie' ? 'free' : (source.kindHint === 'deal' ? 'paid' : 'free'),
          quality: 3,
          source: source.name,
          url: link,
          note,
          time,
          code: '',
        };
      }).filter((it) => it.title);
    }

    function parseRss2Json(payload, source) {
      if (!payload || payload.status !== 'ok' || !Array.isArray(payload.items)) throw new Error(payload && payload.message ? String(payload.message).slice(0, 80) : 'bad rss2json reply');
      return payload.items.slice(0, 40).map((raw, i) => ({
        id: source.id + '-r2j-' + (raw.link || raw.title || i).slice(0, 120) + '-' + i,
        title: stripHtml(raw.title) || '(untitled)',
        kind: source.kindHint || 'info',
        category: source.catHint || 'other',
        obtain: source.kindHint === 'freebie' ? 'free' : (source.kindHint === 'deal' ? 'paid' : 'free'),
        quality: 3,
        source: source.name,
        url: String(raw.link || ''),
        note: stripHtml(raw.description || raw.content || '').slice(0, 160),
        time: String(raw.pubDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        code: '',
      })).filter((it) => it.title);
    }

    async function fetchFeed(source) {
      const attempts = [];
      for (const relay of CORS_RELAYS) {
        try {
          const res = await fetch(relay.url(source.feedUrl), { signal: AbortSignal.timeout(20000) });
          if (!res.ok) {
            let detail = '';
            try {
              const body = await res.text();
              if (/Just a moment|cf-error|Attention Required|cloudflare/i.test(body)) detail = ' (Cloudflare 防护)';
            } catch (e2) { /* ignore */ }
            throw new Error('HTTP ' + res.status + detail);
          }
          if (relay.kind === 'json') return parseRss2Json(await res.json(), source);
          return parseFeedXml(await res.text(), source);
        } catch (e) {
          const msg = String(e && e.message || e).slice(0, 60);
          const hint = relay.name === 'host' && msg.indexOf('404') >= 0 ? ' (restart DeepSeek Harness to activate)' : '';
          attempts.push(relay.name + ': ' + msg + hint);
        }
      }
      throw new Error(attempts.join(' | '));
    }

    const cardS = {
      card: { display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-1)' },
      title: { margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--dsw-alias-label-primary)', lineHeight: 1.45 },
      meta: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' },
      badge: { display: 'inline-block', padding: '1px 8px', borderRadius: 999, fontSize: 11, border: '1px solid var(--dsw-alias-border-l2)', color: 'var(--dsw-alias-label-secondary)', whiteSpace: 'nowrap' },
      badgeHi: { display: 'inline-block', padding: '1px 8px', borderRadius: 999, fontSize: 11, background: 'color-mix(in srgb, var(--dsw-alias-state-success-primary) 18%, transparent)', color: 'var(--dsw-alias-state-success-primary)', whiteSpace: 'nowrap' },
      btn: { border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: '3px 10px', fontSize: 12, cursor: 'pointer' },
      btnFav: { border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent', color: 'var(--dsw-alias-state-warn-primary)', borderRadius: 8, padding: '3px 10px', fontSize: 12, cursor: 'pointer' },
      openBtn: { display: 'inline-block', border: '2px solid var(--dsw-alias-brand-primary)', background: 'var(--dsw-alias-brand-primary)', color: 'var(--dsw-alias-bg-base)', borderRadius: 8, padding: '5px 16px', fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' },
      input: { border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: '4px 8px', fontSize: 12 },
      select: { border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)', borderRadius: 8, padding: '4px 6px', fontSize: 12 },
      tab: { border: 'none', background: 'transparent', color: 'var(--dsw-alias-label-secondary)', borderRadius: 8, padding: '5px 12px', fontSize: 13, cursor: 'pointer' },
      tabOn: { border: 'none', background: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent)', color: 'var(--dsw-alias-brand-primary)', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
      link: { color: 'var(--dsw-alias-brand-primary)', textDecoration: 'none' },
    };

    const OPEN_BTN_CSS = `
.rr-open{display:inline-flex;align-items:center;gap:6px;padding:7px 18px;border-radius:999px;
  background:color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent);
  color:var(--dsw-alias-brand-primary);
  border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 38%, transparent);
  font-size:13px;font-weight:600;letter-spacing:.02em;text-decoration:none;cursor:pointer;
  transition:background .18s ease,color .18s ease,box-shadow .18s ease,transform .18s ease;}
.rr-open:hover{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);
  box-shadow:0 4px 14px color-mix(in srgb, var(--dsw-alias-brand-primary) 38%, transparent);
  transform:translateY(-1px);}
.rr-open:active{transform:translateY(0);box-shadow:none;}
.rr-open svg{flex:none;}
.rr-read{background:transparent;color:var(--dsw-alias-label-secondary);
  border-color:var(--dsw-alias-border-l2);font-weight:500;cursor:default;}
.rr-read:hover{background:transparent;color:var(--dsw-alias-label-secondary);
  box-shadow:none;transform:none;}
@keyframes rr-pulse{0%,100%{opacity:1}50%{opacity:.45}}
`;

    function useStore() {
      const [store, setStore] = useState(loadStore);
      const saveTimer = useRef(null);
      const update = useCallback((fn) => {
        setStore((prev) => {
          const next = fn(prev);
          try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch (e) { /* ignore */ }
          try {
            clearTimeout(saveTimer.current);
            saveTimer.current = setTimeout(() => {
              fetch(STORE_ROUTE, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ items: next.items, sources: next.sources, blocklist: next.blocklist, view: next.view }),
              }).catch(() => { /* host route unavailable; localStorage cache remains */ });
            }, 800);
          } catch (e) { /* ignore */ }
          return next;
        });
      }, []);
      return [store, update];
    }

    function RadarIcon() {
      return h('svg', { viewBox: '0 0 64 64', width: 16, height: 16, 'aria-hidden': true, style: { display: 'block' } },
        h('circle', { cx: 32, cy: 40, r: 6, fill: 'currentColor' }),
        h('path', { d: 'M32 40 L52 20', stroke: 'currentColor', strokeWidth: 5, strokeLinecap: 'round', fill: 'none' }),
        h('path', { d: 'M18 40 a14 14 0 0 1 14 -14', stroke: 'currentColor', strokeWidth: 5, fill: 'none', strokeLinecap: 'round', opacity: 0.85 }),
        h('path', { d: 'M8 40 a24 24 0 0 1 24 -24', stroke: 'currentColor', strokeWidth: 5, fill: 'none', strokeLinecap: 'round', opacity: 0.45 }));
    }

    function Badge(props) {
      return h('span', { style: props.hi ? cardS.badgeHi : cardS.badge }, props.text);
    }

    function ItemCard(props) {
      const { t, item, view, onFav, onRead } = props;
      const fav = item.fav ? '★' : '☆';
      const title = item.titleZh || item.title;
      const note = item.noteZh || item.note;
      const titleS = item.read
        ? { ...cardS.title, color: 'var(--dsw-alias-label-secondary)', fontWeight: 500 }
        : cardS.title;
      const noteS = item.read
        ? { margin: 0, fontSize: 12, color: 'var(--dsw-alias-label-secondary)', opacity: 0.7 }
        : { margin: 0, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' };
      const openBtn = item.url
        ? h('a', { className: 'rr-open' + (item.read ? ' rr-read' : ''), href: item.url, target: '_blank', rel: 'noreferrer', onClick: () => onRead(item.id) },
          h('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
            h('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
            h('polyline', { points: '15 3 21 3 21 9' }),
            h('line', { x1: 10, y1: 14, x2: 21, y2: 3 })),
          item.read ? t('opened') : t('open'))
        : null;
      if (view === 'compact') {
        return h('div', { style: { ...cardS.card, flexDirection: 'row', alignItems: 'center', gap: 10, padding: '8px 12px', opacity: item.read ? 0.65 : 1 } },
          h('span', { style: { fontSize: 14 } }, KIND_ICON[item.kind] || '•'),
          h('span', { style: { ...titleS, flex: 1, fontSize: 13 } }, title),
          h('span', { style: cardS.meta }, item.source),
          h('span', { style: cardS.meta }, item.time),
          openBtn,
          h('button', { style: cardS.btnFav, title: t('favorite'), onClick: () => onFav(item.id) }, fav));
      }
      return h('div', { style: cardS.card },
        h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' } },
          h(Badge, { text: (KIND_ICON[item.kind] || '•') + ' ' + t('kind_' + item.kind), hi: item.kind === 'freebie' }),
          item.ai ? h(Badge, { text: '🤖 AI', hi: true }) : null,
          item.fav ? h(Badge, { text: '★ ' + t('favorited'), hi: true }) : null,
          h(Badge, { text: t('cat_' + item.category) }),
          h(Badge, { text: t('ob_' + item.obtain) }),
          h(Badge, { text: '★'.repeat(Math.max(1, Math.min(5, item.quality || 3))) }),
          h('span', { style: { marginLeft: 'auto', ...cardS.meta } }, item.source + ' · ' + item.time)),
        h('p', { style: titleS }, title),
        note ? h('p', { style: noteS } , note) : null,
        item.code ? h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
          h('code', { style: { fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'var(--dsw-alias-bg-layer-2)' } }, item.code),
          h('button', { style: cardS.btn, onClick: () => { try { navigator.clipboard.writeText(item.code); } catch (e) { /* ignore */ } } }, t('copy'))) : null,
        h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
          openBtn,
          h('button', { style: item.fav ? cardS.btnFav : cardS.btn, onClick: () => onFav(item.id) }, fav + ' ' + t('favorite'))));
    }

    function Workbench(props) {
      const { t } = props;
      const [store, update] = useStore();
      const [channel, setChannel] = useState('selectFreebie');
      const [kindF, setKindF] = useState('');
      const [catF, setCatF] = useState('');
      const [obF, setObF] = useState('');
      const [q, setQ] = useState('');
      const [pane, setPane] = useState('feed');
      const [busySrc, setBusySrc] = useState(null);
      const [log, setLog] = useState([]);
      const [chipOpen, setChipOpen] = useState(false);

      const isFavChannel = channel === 'favorites';
      const ch = CHANNELS[channel];
      const favCount = useMemo(() => store.items.filter((it) => it.fav).length, [store.items]);

      const items = useMemo(() => {
        return store.items.filter((it) => {
          if (isFavChannel) { if (!it.fav) return false; }
          else {
            if (!ch.kinds.includes(it.kind)) return false;
            if (ch.obtains && !ch.obtains.includes(it.obtain)) return false;
            if (ch.categories && !ch.categories.includes(it.category)) return false;
            if (kindF && it.kind !== kindF) return false;
            if (catF && it.category !== catF) return false;
            if (obF && it.obtain !== obF) return false;
          }
          if (q) { const needle = q.toLowerCase(); const hay = ((it.titleZh || it.title) + ' ' + it.title).toLowerCase(); if (!hay.includes(needle)) return false; }
          if (matchesBlock(it.title, store.blocklist)) return false;
          return true;
        }).sort((a, b) => ((a.read ? 1 : 0) - (b.read ? 1 : 0)) || (b.time || '').localeCompare(a.time || ''));
      }, [store.items, store.blocklist, channel, kindF, catF, obF, q, isFavChannel]);

      const counts = useMemo(() => {
        const c = {};
        for (const k of KINDS) c[k] = store.items.filter((it) => it.kind === k && !matchesBlock(it.title, store.blocklist)).length;
        return c;
      }, [store.items, store.blocklist]);

      const toggleFav = (id) => update((s) => ({ ...s, items: s.items.map((it) => (it.id === id ? { ...it, fav: !it.fav } : it)) }));
      const markRead = (id) => update((s) => ({ ...s, items: s.items.map((it) => (it.id === id && !it.read ? { ...it, read: true } : it)) }));

      const mergeItems = useCallback((fresh) => {
        let added = 0;
        update((s) => {
          const seen = new Set(s.items.map((it) => (it.url || it.title).slice(0, 120)));
          const add = fresh.filter((it) => { const k = (it.url || it.title).slice(0, 120); if (seen.has(k)) return false; seen.add(k); return true; });
          added = add.length;
          return { ...s, items: [...add, ...s.items] };
        });
        return added;
      }, [update]);

      const aiBatch = useCallback(async (targets) => {
        const payload = encodeURIComponent(JSON.stringify({
          items: targets.map((it) => ({ id: it.id, title: it.title, note: it.note || '', url: it.url || '', source: it.source || '' })),
        }));
        const res = await fetch('/radar-ai?payload=' + payload, { signal: AbortSignal.timeout(150000) });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'HTTP ' + res.status);
        return data;
      }, []);

      const applyAiResults = useCallback((results) => {
        const map = new Map((results || []).map((r) => [r.id, r]));
        return { map, apply: (it) => {
          const r = map.get(it.id);
          if (!r) return it;
          return {
            ...it,
            kind: r.kind || it.kind,
            category: r.category || it.category,
            obtain: r.obtain || it.obtain,
            quality: r.quality || it.quality,
            ai: true,
            keep: r.keep !== false,
            titleZh: r.titleZh || it.titleZh,
            noteZh: r.noteZh || it.noteZh,
            note: (r.reason ? r.reason + (it.note ? '；' + it.note : '') : it.note).slice(0, 200),
          };
        } };
      }, []);

      const collectSource = useCallback(async (source) => {
        if (!source.feedUrl) return { ok: false, added: 0, error: t('noFeed') };
        setBusySrc(source.id);
        let added = 0, dropped = 0, aiFailed = false;
        try {
          const fresh = await fetchFeed(source);
          const triaged = [];
          const seenKeys = new Set(store.items.map((it) => (it.url || it.title).slice(0, 120)));
          const newItems = fresh.filter((it) => { const k = (it.url || it.title).slice(0, 120); if (seenKeys.has(k)) return false; seenKeys.add(k); return true; });
          let aiFailed = false;
          const AI_CONCURRENCY = 3;
          const results = await Promise.all(Array.from({ length: Math.min(AI_CONCURRENCY, Math.ceil(newItems.length / 8)) }, async (_, worker) => {
            const out = [];
            for (let i = worker * 8; i < newItems.length; i += 8 * AI_CONCURRENCY) {
              const batch = newItems.slice(i, i + 8);
              try {
                const data = await aiBatch(batch);
                const { map, apply } = applyAiResults(data.results);
                for (const it of batch) {
                  const r = map.get(it.id);
                  const done = apply(it);
                  if (r && r.keep === false) { dropped++; continue; }
                  out.push(done);
                }
              } catch (e) {
                aiFailed = true;
                out.push(...batch);
              }
            }
            return out;
          }));
          for (const part of results) triaged.push(...part);
          added = mergeItems(triaged);
          update((s) => ({ ...s, sources: s.sources.map((x) => (x.id === source.id ? { ...x, lastCollect: new Date().toISOString(), lastCount: added, lastError: '' } : x)) }));
          setLog((l) => [{ name: source.name + ' [AI +' + added + (dropped ? ' / 淘汰 ' + dropped : '') + (newItems.length ? ' / 新 ' + newItems.length : ' / 无新条目') + (aiFailed ? ' / 部分AI失败' : '') + ']', added, fail: aiFailed, at: new Date().toLocaleTimeString() }, ...l].slice(0, 8));
          return { ok: true, added };
        } catch (e) {
          update((s) => ({ ...s, sources: s.sources.map((x) => (x.id === source.id ? { ...x, lastCollect: new Date().toISOString(), lastCount: 0, lastError: String((e && e.message) || e).slice(0, 240) } : x)) }));
          setLog((l) => [{ name: source.name, added: 0, fail: true, at: new Date().toLocaleTimeString() }, ...l].slice(0, 8));
          return { ok: false, added: 0, error: String((e && e.message) || e) };
        } finally {
          setBusySrc(null);
        }
      }, [aiBatch, applyAiResults, mergeItems, update, t]);

      const collectEnabled = useCallback(async () => {
        const enabled = store.sources.filter((s) => s.enabled);
        if (!enabled.length) { setLog([{ name: t('noEnabledSrc'), added: 0, at: new Date().toLocaleTimeString() }]); return 0; }
        for (const src of enabled) await collectSource(src);
        return enabled.length;
      }, [store.sources, collectSource, t]);

      const autoRef = useRef(false);
      const startAuto = () => collectEnabled().then((n) => {
        if (n) update((s) => ({ ...s, items: s.items.filter((it) => !/^s\d+$/.test(it.id)) }));
      });
      useEffect(() => {
        if (autoRef.current) return;
        autoRef.current = true;
        // Host-side durable store wins over the localStorage cache (it survives wipes).
        fetch(STORE_ROUTE).then((r) => r.json()).then((j) => {
          let hasHost = false;
          if (j && j.ok && j.data && Array.isArray(j.data.items) && j.data.items.length) {
            hasHost = true;
            setStore((s) => ({ ...s, items: j.data.items, sources: j.data.sources || s.sources, blocklist: j.data.blocklist || s.blocklist, view: j.data.view || s.view, firstRun: false }));
          }
          if (hasHost || !store.firstRun) return undefined;
          return startAuto();
        }).catch(() => {
          if (!store.firstRun) return undefined;
          return startAuto();
        });
      }, []);

      const statusChip = h('div', { style: { position: 'relative' } },
        (() => {
          const last = log[0];
          const busy = !!busySrc;
          const hasFail = log.some((e) => e.fail);
          const base = {
            border: 'none', background: 'transparent', cursor: busy ? 'wait' : 'pointer',
            fontSize: 12, borderRadius: 999, padding: '3px 10px',
            color: busy ? 'var(--dsw-alias-brand-primary)' : (hasFail ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-state-success-primary)'),
            opacity: busy ? 1 : 0.75, whiteSpace: 'nowrap',
            animation: busy ? 'rr-pulse 1.2s ease-in-out infinite' : 'none',
          };
          return h('button', { style: base, title: t('logTitle'), onClick: () => setChipOpen(!chipOpen) },
            busy ? '⏳ ' + t('refreshing') : (last ? (hasFail ? '⚠ ' : '✓ ') + (last.name.split(' [')[0]) + ' +' + last.added : '✓ ' + t('idle')));
        })(),
        chipOpen && !busySrc ? h('div', { style: { position: 'absolute', top: '100%', right: 0, zIndex: 20, marginTop: 6, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-overlay)', boxShadow: '0 6px 20px rgba(0,0,0,.15)', minWidth: 260, display: 'flex', flexDirection: 'column', gap: 3 } },
          log.length
            ? log.map((e, i) => h('div', { key: i, style: { fontSize: 12, color: e.fail ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-state-success-primary)', whiteSpace: 'nowrap' } },
              (e.fail ? '✕ ' : '✓ ') + e.name + ' · +' + e.added + ' · ' + e.at))
            : h('div', { style: { ...cardS.meta } }, t('noLog'))
        ) : null);

      const channelTabs = Object.keys(CHANNELS).map((key) =>
        h('button', { key, style: channel === key ? cardS.tabOn : cardS.tab, onClick: () => setChannel(key) }, t('ch_' + key)));

      const filterBar = h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' } },
        h('button', { key: 'favorites', style: channel === 'favorites' ? cardS.tabOn : cardS.tab, onClick: () => setChannel(isFavChannel ? 'selectFreebie' : 'favorites') },
          '★ ' + t('ch_favorites') + ' ' + favCount),
        h('input', { style: { ...cardS.input, minWidth: 180 }, placeholder: t('search'), value: q, onChange: (e) => setQ(e.target.value) }),
        !isFavChannel ? h('select', { style: cardS.select, value: kindF, onChange: (e) => setKindF(e.target.value) },
          h('option', { value: '' }, t('allKinds')), KINDS.map((k) => h('option', { key: k, value: k }, t('kind_' + k)))) : null,
        !isFavChannel ? h('select', { style: cardS.select, value: catF, onChange: (e) => setCatF(e.target.value) },
          h('option', { value: '' }, t('allCats')), CATEGORIES.map((c) => h('option', { key: c, value: c }, t('cat_' + c)))) : null,
        !isFavChannel ? h('select', { style: cardS.select, value: obF, onChange: (e) => setObF(e.target.value) },
          h('option', { value: '' }, t('allObtains')), OBTAINS.map((o) => h('option', { key: o, value: o }, t('ob_' + o)))) : null,
        h('span', { style: cardS.meta }, t('showing').replace('{n}', String(items.length))),
        h('span', { style: { marginLeft: 'auto' } }),
        statusChip,
        h('button', { style: cardS.btn, onClick: () => update((s) => ({ ...s, view: s.view === 'compact' ? 'cards' : 'compact' })) },
          store.view === 'compact' ? '▦ ' + t('viewCards') : '☰ ' + t('viewCompact')),
        h('button', { style: cardS.btn, title: t('collectTip'), onClick: collectEnabled },
          busySrc ? '⏳ ' + t('collecting') : '⟳ ' + t('collect')));

      const paneTabs = ['feed', 'sources', 'blocks', 'about'].map((key) =>
        h('button', { key, style: pane === key ? cardS.tabOn : cardS.tab, onClick: () => setPane(key) }, t('pane_' + key)));

      let body = null;
      if (pane === 'feed') {
        body = h('div', null,
          items.length
            ? h('div', { style: { display: store.view === 'compact' ? 'flex' : 'grid', flexDirection: 'column', gap: 8, gridTemplateColumns: store.view === 'compact' ? undefined : 'repeat(auto-fill, minmax(320px, 1fr))' } },
              items.map((it) => h(ItemCard, { key: it.id, t, item: it, view: store.view, onFav: toggleFav, onRead: markRead })))
            : h('p', { style: cardS.meta }, isFavChannel ? t('favEmpty') : t('empty')));
      } else if (pane === 'sources') {
        body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
          store.sources.map((src) => h('div', { key: src.id, style: { ...cardS.card, gap: 8, padding: '10px 12px' } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
              h('span', { style: { flex: 1, fontSize: 13, color: 'var(--dsw-alias-label-primary)' } }, src.name),
              h(Badge, { text: src.type }),
              h('button', { style: cardS.btn, title: t('collectOne'), onClick: () => collectSource(src) },
                busySrc === src.id ? '⏳' : '⟳ ' + t('collect')),
              h('button', { style: cardS.btn, onClick: () => update((s) => ({ ...s, sources: s.sources.map((x) => (x.id === src.id ? { ...x, enabled: !x.enabled } : x)) })) },
                src.enabled ? '● ' + t('enabled') : '○ ' + t('disabled')),
              h('button', { style: cardS.btn, title: t('removeSrc'), onClick: () => update((s) => ({ ...s, sources: s.sources.filter((x) => x.id !== src.id) })) }, '✕')),
            h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
              h('input', { style: { ...cardS.input, flex: 1 }, placeholder: t('feedUrlHint'), value: src.feedUrl || '',
                onChange: (e) => update((s) => ({ ...s, sources: s.sources.map((x) => (x.id === src.id ? { ...x, feedUrl: e.target.value } : x)) })) }),
              h('select', { style: cardS.select, value: src.kindHint || 'info', title: t('kindHint'),
                onChange: (e) => update((s) => ({ ...s, sources: s.sources.map((x) => (x.id === src.id ? { ...x, kindHint: e.target.value } : x)) })) },
                KINDS.filter((k) => k !== 'noise').map((k) => h('option', { key: k, value: k }, t('kind_' + k))))),
            h('div', { style: cardS.meta },
              src.lastError ? '✕ ' + src.lastError
                : (src.lastCount != null ? t('lastCollect') + ' +' + src.lastCount : (src.feedUrl ? t('neverCollected') : t('noFeed')))))),
          h('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
            h('input', { id: 'rr-new-source', style: { ...cardS.input, flex: 1 }, placeholder: t('newSourceHint') }),
            h('button', { style: cardS.btn, onClick: () => {
              const el = document.getElementById('rr-new-source');
              const name = el && el.value ? el.value.trim() : '';
              if (!name) return;
              if (el) el.value = '';
              update((s) => ({ ...s, sources: [...s.sources, { id: 'c' + Date.now(), name, type: 'rss', enabled: true, feedUrl: '', kindHint: 'info' }] }));
            } }, t('add'))));
      } else if (pane === 'blocks') {
        body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
          h('div', { style: { display: 'flex', gap: 8 } },
            h('input', { id: 'rr-new-block', style: { ...cardS.input, flex: 1 }, placeholder: t('blockHint') }),
            h('button', { style: cardS.btn, onClick: () => {
              const el = document.getElementById('rr-new-block');
              const w = el && el.value ? el.value.trim() : '';
              if (!w) return;
              if (el) el.value = '';
              update((s) => (s.blocklist.includes(w) ? s : { ...s, blocklist: [...s.blocklist, w] }));
            } }, t('add'))),
          h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
            store.blocklist.length
              ? store.blocklist.map((w) => h('span', { key: w, style: { ...cardS.badge, cursor: 'pointer' }, title: t('remove'), onClick: () => update((s) => ({ ...s, blocklist: s.blocklist.filter((x) => x !== w) })) }, w + ' ✕'))
              : h('span', { style: cardS.meta }, t('blockEmpty'))));
      } else {
        body = h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 } },
          h('p', { style: { margin: 0, fontSize: 13, lineHeight: 1.7, color: 'var(--dsw-alias-label-primary)' } }, t('aboutPipeline')),
          h('p', { style: { margin: 0, fontSize: 12, lineHeight: 1.7, color: 'var(--dsw-alias-label-secondary)' } }, t('aboutData')),
          h('p', { style: { margin: 0, fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } }, t('aboutSelfhost')),
          h('a', { href: REPO_URL, target: '_blank', rel: 'noreferrer', style: cardS.link }, t('aboutRepo')));
      }

      const statRow = h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
        KINDS.map((k) => h(Badge, { key: k, text: (KIND_ICON[k] || '•') + ' ' + t('kind_' + k) + ' ' + counts[k], hi: k === 'freebie' })));

      return h('div', { style: { height: '100%', overflowY: 'auto', padding: '20px 28px 32px', boxSizing: 'border-box', background: 'var(--dsw-alias-bg-base)', color: 'var(--dsw-alias-label-primary)' } },
        h('style', null, OPEN_BTN_CSS),
        h('h1', { style: { margin: '0 0 4px', fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 } }, '📡 ' + t('title')),
        h('p', { style: { margin: '0 0 16px', fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } }, t('subtitle')),
        h('div', { style: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 } }, channelTabs),
        statRow,
        h('div', { style: { height: 12 } }),
        filterBar,
        h('div', { style: { height: 12 } }),
        h('div', { style: { display: 'flex', gap: 4, borderTop: '1px solid var(--dsw-alias-border-l1)', borderBottom: '1px solid var(--dsw-alias-border-l1)', padding: '6px 0', marginBottom: 14 } }, paneTabs),
        body);
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.register('resourceRadar', {
            zh: {
              title: '资源雷达',
              subtitle: '福利 · 好价 · 开源 · 资讯聚合工作台（采集自动经 AI 筛选/定级/翻译）',
              navLabel: '资源雷达',
              ch_selectFreebie: '真福利精选', ch_allFreebie: '全部白嫖', ch_deals: '好价', ch_oss: '开源', ch_news: '重要新闻', ch_info: '行业资讯',
              ch_favorites: '收藏',
              kind_freebie: '白嫖福利', kind_deal: '特价好价', kind_opensource: '开源项目', kind_news: '重要新闻', kind_info: '行业资讯', kind_noise: '噪音',
              ob_free: '直接白嫖', ob_conditional: '有条件', ob_lottery: '抽奖', ob_trial: '试用/Demo', ob_promo: '推广引流', ob_paid: '需付费',
              cat_ai: 'AI 额度', cat_vps: 'VPS/主机', cat_cloud: '云服务', cat_domain: '域名/建站', cat_opensource: '开源软件', cat_software: '软件授权', cat_dev: '开发/工程', cat_design: '设计/素材', cat_security: '安全/网络', cat_hardware: '硬件/数码', cat_media: '影音会员', cat_game: '游戏', cat_carpool: '拼车/合租', cat_trade: '二手/交易', cat_headline: '时政要闻', cat_world: '国际要闻', cat_finance: '经济/商业', cat_stock: '股票/市场', cat_tech: '科技动态', cat_news: '综合资讯', cat_goods: '实物/优惠', cat_offline: '实物福利', cat_invite: '邀请码', cat_edu: '教育/考试', cat_pan: '网盘资源', cat_course: '网课/教程', cat_other: '其它',
              search: '搜索标题…', allKinds: '全部形态', allCats: '全部分类', allObtains: '全部获取方式', showing: '共 {n} 条',
              viewCards: '卡片视图', viewCompact: '紧凑视图', empty: '当前筛选下没有条目。',
              favEmpty: '还没有收藏。点击条目上的 ☆ 收藏感兴趣的内容。',
              favorited: '已收藏',
              pane_feed: '信息流', pane_sources: '数据源', pane_blocks: '屏蔽词', pane_about: '关于',
              favorite: '收藏', open: '打开原文', copy: '复制',
              enabled: '已启用', disabled: '已停用', add: '添加', remove: '移除',
              newSourceHint: '自定义 RSS 源名称…', blockHint: '添加屏蔽词（按标题匹配）…', blockEmpty: '暂无屏蔽词。',
              aboutPipeline: '工作流程：⟳ 采集 → Node 侧抓取 RSS（无 CORS）→ AI 自动筛选（淘汰噪音/软文）→ 语义定级（形态/分类/获取方式/星级）→ 标题与摘要翻译成中文 → 入库展示。',
              aboutData: '所有数据保存在当前浏览器 localStorage，不写入会话或云端；清除浏览器数据即重置。',
              aboutSelfhost: '需要定时自动采集、多路由推送、多用户等完整能力时，建议自托管 freebie-radar（见 README 链接）。',
              aboutRepo: '项目主页与源码：github.com/loaf/dsh-resource-radar',
              collect: '刷新', collecting: '刷新中…', collectTip: '刷新所有已启用源（AI 筛选/定级/翻译后更新）', collectOne: '刷新此源',
              noFeed: '未配置订阅地址（feed URL）', noEnabledSrc: '没有已启用的源', feedUrlHint: 'RSS / Atom 订阅地址…',
              kindHint: '默认形态', lastCollect: '上次刷新新增', neverCollected: '尚未刷新', removeSrc: '删除此源',
              opened: '已读', logTitle: '刷新日志（点击展开/收起）', refreshing: '刷新中…', idle: '尚未刷新', noLog: '暂无刷新记录',
            },
            en: {
              title: 'Resource Radar',
              subtitle: 'Freebie · deal · open source · news aggregation workbench (collection auto-triaged and translated by AI)',
              navLabel: 'Resource Radar',
              ch_selectFreebie: 'True freebies', ch_allFreebie: 'All freebies', ch_deals: 'Deals', ch_oss: 'Open source', ch_news: 'Headlines', ch_info: 'Insights',
              ch_favorites: 'Favorites',
              kind_freebie: 'Freebie', kind_deal: 'Deal', kind_opensource: 'Open source', kind_news: 'News', kind_info: 'Insight', kind_noise: 'Noise',
              ob_free: 'Free', ob_conditional: 'Conditional', ob_lottery: 'Lottery', ob_trial: 'Trial/Demo', ob_promo: 'Promo', ob_paid: 'Paid',
              cat_ai: 'AI quota', cat_vps: 'VPS', cat_cloud: 'Cloud', cat_domain: 'Domain', cat_opensource: 'Open-source software', cat_software: 'Software license', cat_dev: 'Dev/Engineering', cat_design: 'Design assets', cat_security: 'Security', cat_hardware: 'Hardware', cat_media: 'Media membership', cat_game: 'Games', cat_carpool: 'Carpool', cat_trade: 'Second-hand', cat_headline: 'Top news', cat_world: 'World', cat_finance: 'Business', cat_stock: 'Markets', cat_tech: 'Tech', cat_news: 'General news', cat_goods: 'Physical deals', cat_offline: 'Physical freebies', cat_invite: 'Invite codes', cat_edu: 'Education', cat_pan: 'Cloud drive', cat_course: 'Courses', cat_other: 'Other',
              search: 'Search titles…', allKinds: 'All kinds', allCats: 'All categories', allObtains: 'All obtain types', showing: '{n} items',
              viewCards: 'Card view', viewCompact: 'Compact view', empty: 'No items under the current filters.',
              favEmpty: 'No favorites yet. Click the ☆ on an item to save it.',
              favorited: 'Favorited',
              pane_feed: 'Feed', pane_sources: 'Sources', pane_blocks: 'Block list', pane_about: 'About',
              favorite: 'Favorite', open: 'Open source', copy: 'Copy',
              enabled: 'Enabled', disabled: 'Disabled', add: 'Add', remove: 'Remove',
              newSourceHint: 'Custom RSS source name…', blockHint: 'Add a block word (matches titles)…', blockEmpty: 'No block words yet.',
              aboutPipeline: 'Pipeline: ⟳ collect → Node-side RSS fetch (no CORS) → AI auto-triage (drops noise/ads) → semantic classification (kind/category/obtain/stars) → titles & summaries translated to Chinese → ingested for display.',
              aboutData: 'All data lives in this browser localStorage — nothing is written to sessions or the cloud; clearing browser data resets it.',
              aboutSelfhost: 'For scheduled collection, push routing and multi-user support, self-host freebie-radar (see the README link).',
              aboutRepo: 'Project home & source: github.com/loaf/dsh-resource-radar',
              collect: 'Refresh', collecting: 'Refreshing…', collectTip: 'Refresh every enabled source (AI-triage and translate before ingest)', collectOne: 'Refresh this source',
              noFeed: 'No feed URL configured', noEnabledSrc: 'No enabled sources', feedUrlHint: 'RSS / Atom feed URL…',
              kindHint: 'Default kind', lastCollect: 'Last refresh added', neverCollected: 'Not refreshed yet', removeSrc: 'Delete this source',
              opened: 'Read', logTitle: 'Refresh log (click to toggle)', refreshing: 'Refreshing…', idle: 'Not refreshed yet', noLog: 'No refresh log yet',
            },
          }),
          'resource-radar: dictionary',
        );
        ctx.effect(
          () => {
            const t = ctx.locale.bind('resourceRadar');
            ctx.slots.inject('sidebar.panellist', () => ctx.slots.register(
              { name: 'sidebar.panellist', id: PANEL_ID, order: 90, label: () => t('navLabel') },
              RadarIcon));
            ctx.slots.inject('main', () => ctx.slots.register(
              { name: 'main', key: PANEL_ID },
              (p) => h(Workbench, { ...p, t })));
          },
          'resource-radar: panel and nav entry',
        );
      },
    };
  },
});
