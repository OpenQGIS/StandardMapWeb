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

  return (
    <div className="fixed top-1 left-1 z-[999] bg-black/85 text-lime-300 text-[10px] font-mono leading-tight p-1.5 rounded pointer-events-none max-w-[94vw] break-all">
      <div className="text-amber-300">
        {bundle} | dpr {Math.round(window.devicePixelRatio * 100) / 100} | {window.innerWidth}x
        {window.innerHeight}
      </div>
      {Object.entries(TILE_DEBUG).map(([id, d]) => (
        <div key={id}>
          {id}: L{d.level} card {d.cardW}x{d.cardH} view {d.viewW}x{d.viewH} vis {d.visible} loaded{' '}
          {d.loaded} err {d.errors}
        </div>
      ))}
    </div>
  );
};
