import React, { useEffect, useRef, useState } from 'react';
import { TILE_DEBUG } from './TileMapLayer';

/** Fetch one URL with a hard timeout, returning a compact result line. */
const fetchOne = async (url: string, timeoutMs = 10000): Promise<string> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
    const blob = await res.blob();
    return `✓ ${res.status} · ${Math.round(performance.now() - t0)}ms · ${Math.round(blob.size / 1024)}KB`;
  } catch (err) {
    const label =
      (err as Error).name === 'AbortError' ? '超时' : (err as Error).message || '失败';
    return `✗ ${label} · ${Math.round(performance.now() - t0)}ms`;
  } finally {
    clearTimeout(timer);
  }
};

const shortenUa = () => {
  const ua = navigator.userAgent;

  // OS: iPad reports "CPU OS", desktop needs its own tokens.
  // NOTE: iOS 26+ Safari freezes its UA at "iPhone OS 18_7" for web compat,
  // so a Safari reporting 18.7 may actually be a newer iOS (third-party
  // browsers build their own UA with the real version).
  const iphone = ua.match(/iPhone OS (\d+_\d+)/)?.[1]?.replace('_', '.');
  const ipad = ua.match(/CPU OS (\d+_\d+)/)?.[1]?.replace('_', '.');
  const android = ua.match(/Android (\d+)/)?.[1];
  const os = iphone
    ? `iOS ${iphone}`
    : ipad
      ? `iPadOS ${ipad}`
      : android
        ? `Android ${android}${/HarmonyOS/i.test(ua) ? '(鸿蒙)' : ''}`
        : /Windows NT/.test(ua)
          ? 'Windows'
          : /Macintosh/.test(ua)
            ? 'macOS'
            : '其他';

  // App: order matters — every Chromium browser contains "Chrome/", and every
  // WebKit browser contains "Safari", so specific tokens must win first.
  const chromiumSub =
    /SamsungBrowser/.test(ua)
      ? '三星浏览器'
      : /HeyTapBrowser/.test(ua)
        ? 'OPPO浏览器'
        : /HuaweiBrowser|HBBrowser/.test(ua)
          ? '华为浏览器'
          : /MiuiBrowser/.test(ua)
            ? '小米浏览器'
            : /MQQBrowser/.test(ua)
              ? 'QQ浏览器'
              : /UCBrowser|UBrowser/.test(ua)
                ? 'UC浏览器'
                : /360SE|QIHU/.test(ua)
                  ? '360浏览器'
                  : /baiduboxapp|Baidu/.test(ua)
                    ? '百度浏览器'
                    : /OPR\//.test(ua)
                      ? 'Opera'
                      : 'Chrome';
  const app = /MicroMessenger/.test(ua)
    ? '微信'
    : /EdgiOS|Edg\//.test(ua)
      ? 'Edge'
      : /FxiOS|Firefox\//.test(ua)
        ? 'Firefox'
        : /CriOS|Chrome\//.test(ua)
          ? chromiumSub
          : /Safari/.test(ua)
            ? `Safari${(iphone || ipad) === '18.7' ? '(UA冻结)' : ''}`
            : '?';

  return `${app} · ${os}`;
};

/**
 * Full phone-side diagnostics, rendered with ?debug=1 or 5-tap on header.
 * Draggable, collapsible (double tap), copyable.
 */
interface DebugOverlayProps {
  onClose?: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ onClose }) => {
  const [, setTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState({ x: 6, y: 64 });
  const [probes, setProbes] = useState<string[]>([]);
  const [jsErrors, setJsErrors] = useState<string[]>([]);
  const [env, setEnv] = useState<{ webp: boolean | null; storage: boolean }>({
    webp: null,
    storage: true,
  });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null
  );

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);

  // Environment checks (once): webp decode, storage writability (private-mode hint)
  useEffect(() => {
    const img = new Image();
    img.onload = () => setEnv((e) => ({ ...e, webp: img.width === 1 }));
    img.onerror = () => setEnv((e) => ({ ...e, webp: false }));
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    try {
      localStorage.setItem('__dbg', '1');
      localStorage.removeItem('__dbg');
    } catch {
      setEnv((e) => ({ ...e, storage: false }));
    }
  }, []);

  // Capture silent JS errors/rejections (debug mode only)
  useEffect(() => {
    const onErr = (e: ErrorEvent) =>
      setJsErrors((a) => [...a.slice(-2), (e.message || 'error').slice(0, 90)]);
    const onRej = (e: PromiseRejectionEvent) =>
      setJsErrors((a) => [...a.slice(-2), `rej: ${String(e.reason).slice(0, 80)}`]);
    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej);
    };
  }, []);

  const bundle =
    [...document.scripts]
      .map((s) => s.getAttribute('src') || '')
      .filter((s) => s.includes('/assets/index-'))[0]
      ?.split('/')
      .pop() || 'unknown';

  // Live per-layer DOM tile state (mounted / decoded / failed / pending + names)
  const domLines = Object.keys(TILE_DEBUG).map((path) => {
    const key = path.split('/').pop() || path;
    const imgs = [
      ...document.querySelectorAll<HTMLImageElement>(`main img[src*="${key}"]`),
    ];
    let ok = 0;
    let fail = 0;
    imgs.forEach((i) => {
      if (i.complete && i.naturalWidth > 0) ok++;
      else if (i.complete) fail++;
    });
    const pend = imgs.length - ok - fail;
    const pendNames = imgs
      .filter((i) => !i.complete)
      .slice(0, 3)
      .map((i) => i.src.split('/').slice(-2).join('/'));
    return { key, mounted: imgs.length, ok, fail, pend, pendNames };
  });

  // Resource-timing stats for tile traffic
  const netStats = (() => {
    const es = performance
      .getEntriesByType('resource')
      .filter((e) => e.name.includes('/tiles/')) as PerformanceResourceTiming[];
    if (!es.length) return { n: 0, kb: 0, avg: 0, proto: '?', lastAge: -1 };
    const kb = Math.round(es.reduce((s, e) => s + (e.transferSize || 0), 0) / 1024);
    const avg = Math.round(es.reduce((s, e) => s + e.duration, 0) / es.length);
    const lastAge = Math.round((performance.now() - Math.max(...es.map((e) => e.responseEnd))) / 1000);
    return { n: es.length, kb, avg, proto: es[es.length - 1].nextHopProtocol || '?', lastAge };
  })();

  const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number } })
    .connection;
  const connText = conn ? `${conn.effectiveType}${conn.downlink ? ` · ${conn.downlink}Mbps` : ''}` : 'n/a';

  const pushProbe = (line: string) => setProbes((a) => [...a.slice(-5), line]);

  const runNetTest = async () => {
    pushProbe('── 并发网络测试 ×4 ──');
    const urls = [
      './maps/tiles/h-china-base/1/0_0.webp',
      './maps/tiles/h-china-base/1/1_2.webp',
      './maps/tiles/h-china-repro/1/0_0.webp',
      './maps/tiles/h-china-base/2/2_3.webp',
    ];
    const results = await Promise.all(urls.map((u) => fetchOne(u)));
    urls.forEach((u, i) => pushProbe(`${u.split('/').slice(-2).join('/')} → ${results[i]}`));
  };

  const runPendingTest = async () => {
    const pendingImgs = [
      ...document.querySelectorAll<HTMLImageElement>('main img[src*="/tiles/"]'),
    ].filter((i) => !i.complete);
    if (!pendingImgs.length) {
      pushProbe('── 挂起直测：当前无挂起瓦片 ──');
      return;
    }
    pushProbe(`── 挂起直测 ×${Math.min(3, pendingImgs.length)} ──`);
    const targets = [...new Set(pendingImgs.map((i) => i.src))].slice(0, 3);
    for (const src of targets) {
      const name = src.split('/').slice(-2).join('/');
      pushProbe(`${name} → ${await fetchOne(src, 8000)}`);
    }
  };

  /** no-cors connectivity probe: resolves = reachable, rejects/timeout = blocked */
  const reachProbe = async (url: string, timeoutMs = 8000): Promise<string> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const t0 = performance.now();
    try {
      await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
      return `✓ 可达 · ${Math.round(performance.now() - t0)}ms`;
    } catch (err) {
      const label =
        (err as Error).name === 'AbortError' ? '超时' : (err as Error).message || '失败';
      return `✗ ${label} · ${Math.round(performance.now() - t0)}ms`;
    } finally {
      clearTimeout(timer);
    }
  };

  /**
   * Interference battery: same-origin baseline vs bait URLs (ad-keyword query,
   * ad-like path) to expose content blockers, plus cross-origin domestic and
   * international reachability to expose relay / routing problems.
   */
  const runBlockerTest = async () => {
    pushProbe('── 拦截排查 ×5 ──');
    pushProbe(`① 同源基线 → ${await fetchOne('./maps/tiles/h-china-base/1/0_0.webp', 8000)}`);
    pushProbe(
      `② 广告关键词诱饵 → ${await fetchOne('./maps/tiles/h-china-base/1/0_0.webp?utm_source=ad&tracker=1&banner=ad', 8000)} （✗=拦截器按关键词杀请求）`
    );
    let pathProbe: string;
    const t0 = performance.now();
    try {
      const r = await fetch('./maps/ads.js', { cache: 'no-store' });
      pathProbe = `✓ ${r.status}（404=通路正常） · ${Math.round(performance.now() - t0)}ms`;
    } catch {
      pathProbe = `✗ 异常 · ${Math.round(performance.now() - t0)}ms`;
    }
    pushProbe(`③ 伪广告路径 /ads.js → ${pathProbe}`);
    pushProbe(`④ 跨域国内(baidu) → ${await reachProbe('https://www.baidu.com/favicon.ico')}`);
    pushProbe(`⑤ 跨域国际(cloudflare) → ${await reachProbe('https://www.cloudflare.com/cdn-cgi/trace')}`);
    pushProbe('（①✗=CDN整体问题 ②✗=内容拦截器 ④✓⑤✗=国际线路/私人中继）');
  };

  const lines = [
    `${bundle} | dpr ${Math.round(window.devicePixelRatio * 100) / 100} | ${window.innerWidth}x${window.innerHeight}`,
    `UA: ${shortenUa()} | 网: ${connText}`,
    `env: webp${env.webp === null ? '?' : env.webp ? '✓' : '✗'} 存储${env.storage ? '✓' : '✗(隐私模式?)'} DNT:${navigator.doNotTrack ?? 'unset'} 触点:${navigator.maxTouchPoints}`,
    `zoom: ${Math.round((Object.values(TILE_DEBUG)[0]?.scale ?? 1) * 100)}%`,
    `net统计: ${netStats.n}req · ${netStats.kb}KB · 均${netStats.avg}ms · ${netStats.proto} · 最近完成${netStats.lastAge}s前`,
    ...domLines.map(
      (d) => `dom ${d.key}: ${d.mounted}张 ok${d.ok} 挂${d.pend} 败${d.fail}${d.pendNames.length ? ` ↳${d.pendNames.join(',')}` : ''}`
    ),
    ...Object.entries(TILE_DEBUG).map(
      ([id, d]) =>
        `${id.split('/').pop()}: L${d.level} card${d.cardW}x${d.cardH} vis${d.visible} load${d.loaded} err${d.errors}`
    ),
    ...(jsErrors.length ? [`JS错误: ${jsErrors.join(' | ')}`] : []),
    ...probes,
  ];
  const debugText = lines.join('\n');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(debugText).then(done);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = debugText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        done();
      } catch (err) {
        console.error(err);
      }
      document.body.removeChild(textArea);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 60, d.baseX + e.clientX - d.startX)),
      y: Math.max(0, Math.min(window.innerHeight - 32, d.baseY + e.clientY - d.startY)),
    });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="fixed z-[999] bg-black/90 text-lime-300 text-[10px] font-mono leading-tight p-2 rounded shadow-lg max-w-[94vw] break-all select-text border border-white/20 cursor-move"
      style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => setCollapsed((c) => !c)}
      title="拖动移动 · 双击折叠/展开"
    >
      {collapsed ? (
        <span className="text-amber-300 font-bold px-1">DIAG ▸</span>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1">
            <span className="text-amber-300 font-bold">调试黑匣子</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="px-1.5 py-0.5 bg-lime-500/20 hover:bg-lime-500/30 text-lime-200 text-[10px] rounded border border-lime-400/40 active:scale-95 transition-transform"
              >
                {copied ? '✓ 已复制' : '复制文本'}
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="px-1.5 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[10px] rounded border border-red-400/40 active:scale-95 transition-transform"
                  title="关闭调试面板"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="text-amber-300">{lines[0]}</div>
          <div>UA: {shortenUa()} | 网: {connText}</div>
          <div>
            env: webp{env.webp === null ? '?' : env.webp ? '✓' : '✗'} 存储
            {env.storage ? '✓' : '✗(隐私模式?)'} DNT:{navigator.doNotTrack ?? 'unset'} 触点:
            {navigator.maxTouchPoints}
          </div>
          <div className="text-yellow-200">
            zoom: {Math.round((Object.values(TILE_DEBUG)[0]?.scale ?? 1) * 100)}%
          </div>
          <div className="text-cyan-300">
            net统计: {netStats.n}req · {netStats.kb}KB · 均{netStats.avg}ms · {netStats.proto} ·
            最近完成{netStats.lastAge}s前
          </div>
          {domLines.map((d) => (
            <div key={d.key} className="text-cyan-200">
              dom {d.key}: {d.mounted}张 ok{d.ok} 挂{d.pend} 败{d.fail}
              {d.pendNames.length ? ` ↳${d.pendNames.join(',')}` : ''}
            </div>
          ))}
          {Object.entries(TILE_DEBUG).map(([id, d]) => (
            <div key={id} className="mt-0.5">
              {id.split('/').pop()}: L{d.level} card{d.cardW}x{d.cardH} vis{d.visible} load{d.loaded}{' '}
              err{d.errors}
            </div>
          ))}
          {jsErrors.length > 0 && (
            <div className="text-red-400">JS错误: {jsErrors.join(' | ')}</div>
          )}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                runNetTest();
              }}
              className="px-1.5 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[10px] rounded border border-cyan-400/40 active:scale-95 transition-transform"
            >
              并发网络测试
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                runPendingTest();
              }}
              className="px-1.5 py-0.5 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 text-[10px] rounded border border-fuchsia-400/40 active:scale-95 transition-transform"
            >
              挂起直测
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                runBlockerTest();
              }}
              className="px-1.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] rounded border border-amber-400/40 active:scale-95 transition-transform"
            >
              拦截排查
            </button>
          </div>
          {probes.map((p, i) => (
            <div key={i} className={p.startsWith('──') ? 'text-zinc-400 mt-0.5' : 'text-fuchsia-200'}>
              {p}
            </div>
          ))}
          <div className="text-zinc-500 mt-1">拖动移动 · 双击折叠</div>
        </>
      )}
    </div>
  );
};
