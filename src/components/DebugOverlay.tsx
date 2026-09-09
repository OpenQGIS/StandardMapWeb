import React, { useEffect, useState } from 'react';
import { TILE_DEBUG } from './TileMapLayer';

/**
 * Phone-side diagnostics, rendered only when the URL carries ?debug=1.
 * Shows the bundle hash (stale-cache detection), DPR, viewport and per-layer
 * {level, view/card geometry, visible, loaded, errors} so any device-specific
 * tile-loading failure can be located from a single screenshot.
 */
export const DebugOverlay: React.FC = () => {
  const [, setTick] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(t);
  }, []);

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

  return (
    <div className="fixed top-1 left-1 z-[999] bg-black/90 text-lime-300 text-[10px] font-mono leading-tight p-2 rounded shadow-lg max-w-[95vw] break-all select-text pointer-events-auto border border-white/20">
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
      {Object.entries(TILE_DEBUG).map(([id, d]) => (
        <div key={id} className="mt-0.5">
          {id}: L{d.level} card {d.cardW}x{d.cardH} view {d.viewW}x{d.viewH} vis {d.visible} loaded{' '}
          {d.loaded} err {d.errors}
        </div>
      ))}
    </div>
  );
};
