import React, { useEffect, useRef, useState } from 'react';
import { TILE_DEBUG } from './TileMapLayer';

/**
 * Phone-side diagnostics, rendered only when the URL carries ?debug=1.
 * Draggable (pointer events, touch + mouse) and collapsible (double tap)
 * so it never has to sit on top of the toolbar or labels.
 */
export const DebugOverlay: React.FC = () => {
  const [, setTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [pos, setPos] = useState({ x: 6, y: 64 });
  const [probe, setProbe] = useState<string | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(
    null
  );

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);

  // Live DOM tile state (refreshed by the 500ms tick): distinguishes
  // "requests hanging" (pending) from "decoded but not painted" (ok).
  const domStats = (() => {
    const imgs = [
      ...document.querySelectorAll<HTMLElement>('main img[src*="/tiles/"]'),
    ] as HTMLImageElement[];
    let ok = 0;
    let fail = 0;
    let pend = 0;
    imgs.forEach((i) => {
      if (i.complete && i.naturalWidth > 0) ok++;
      else if (i.complete) fail++;
      else pend++;
    });
    return { mounted: imgs.length, ok, fail, pend };
  })();

  const runProbe = async () => {
    setProbe('测试中...');
    const t0 = performance.now();
    try {
      const res = await fetch('./maps/tiles/h-china-base/1/0_1.webp', { cache: 'no-store' });
      const ms = Math.round(performance.now() - t0);
      const blob = await res.blob();
      setProbe(`HTTP ${res.status} · ${ms}ms · ${Math.round(blob.size / 1024)}KB`);
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      setProbe(`失败: ${(err as Error).message} · ${ms}ms`);
    }
  };

  const bundle =
    [...document.scripts]
      .map((s) => s.getAttribute('src') || '')
      .filter((s) => s.includes('/assets/index-'))[0]
      ?.split('/')
      .pop() || 'unknown';

  const debugText = [
    `${bundle} | dpr ${Math.round(window.devicePixelRatio * 100) / 100} | ${window.innerWidth}x${window.innerHeight}`,
    ...Object.entries(TILE_DEBUG).map(
      ([id, d]) =>
        `${id}: L${d.level} card ${d.cardW}x${d.cardH} view ${d.viewW}x${d.viewH} vis ${d.visible} loaded ${d.loaded} err ${d.errors}`
    ),
  ].join('\n');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(debugText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback for WeChat or older webviews
      const textArea = document.createElement('textarea');
      textArea.value = debugText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error(err);
      }
      document.body.removeChild(textArea);
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // don't start a drag from the copy button
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
            <button
              type="button"
              onClick={handleCopy}
              className="px-1.5 py-0.5 bg-lime-500/20 hover:bg-lime-500/30 text-lime-200 text-[10px] rounded border border-lime-400/40 active:scale-95 transition-transform"
            >
              {copied ? '✓ 已复制' : '复制文本'}
            </button>
          </div>
          <div className="text-amber-300">
            {bundle} | dpr {Math.round(window.devicePixelRatio * 100) / 100} | {window.innerWidth}x
            {window.innerHeight}
          </div>
          <div className="text-cyan-300">
            dom: {domStats.mounted} 张 · 解码ok {domStats.ok} · 失败 {domStats.fail} · 挂起{' '}
            {domStats.pend}
          </div>
          {Object.entries(TILE_DEBUG).map(([id, d]) => (
            <div key={id} className="mt-0.5">
              {id}: L{d.level} card {d.cardW}x{d.cardH} view {d.viewW}x{d.viewH} vis {d.visible}{' '}
              loaded {d.loaded} err {d.errors}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                runProbe();
              }}
              className="px-1.5 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-[10px] rounded border border-cyan-400/40 active:scale-95 transition-transform"
            >
              网络测试
            </button>
            <span className="text-cyan-200">{probe ?? ''}</span>
          </div>
          <div className="text-zinc-500 mt-1">拖动移动 · 双击折叠</div>
        </>
      )}
    </div>
  );
};
