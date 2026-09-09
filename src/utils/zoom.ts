import type { MapOrientation } from '../types/map';

const L2_SOURCE_WIDTH: Record<MapOrientation, number> = {
  horizontal: 9912,
  vertical: 6848,
};

/** Integer zoom rungs (100%..1000%) used by the +/- buttons. */
export const ZOOM_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * Zoom cap: the smallest "nice" rung of 2/3/4/5/6/8/10x that still covers the
 * L2 original scan at 1:1 device pixels. Overshoot past native resolution is
 * at most one rung (~12% on phones) — invisible with high-quality interpolation,
 * and every device gets a clean integer ceiling (phones 10x, 1080p 8x, 4K 4x).
 */
export const maxNativeScale = (
  cardW: number,
  dpr: number,
  orientation: MapOrientation
): number => {
  if (!cardW || !dpr) return 10;
  const l2Width = L2_SOURCE_WIDTH[orientation] || L2_SOURCE_WIDTH.horizontal;
  const native = l2Width / (cardW * dpr);
  const cap = [2, 3, 4, 5, 6, 8, 10].find((r) => r >= native) ?? 10;
  return Math.max(2, cap);
};

/**
 * Next integer rung above (dir=+1) or below (dir=-1) the current zoom, so the
 * +/- buttons always land on whole multiples (200%, 300%, ...) even after a
 * free pinch left the scale at e.g. 237%. Clamped to [1, cap].
 */
export const nextZoomStep = (current: number, dir: 1 | -1, cap: number): number => {
  if (dir > 0) {
    const next = ZOOM_STEPS.find((s) => s > current + 1e-9);
    return Math.min(next ?? cap, cap);
  }
  const prev = [...ZOOM_STEPS].reverse().find((s) => s < current - 1e-9);
  return Math.max(prev ?? 1, 1);
};

/**
 * Next progressive zoom rung for double-tap / double-click.
 * Always zooms in towards maxScale (e.g. ~100% -> 300% -> 600% -> maxScale).
 * Once at or near maxScale, it stays at maxScale (never resets to fit;
 * reset to fit is exclusively handled by the dedicated fit button).
 */
export const nextDoubleTapScale = (current: number, maxScale: number): number | null => {
  if (current >= maxScale - 0.05) {
    return null; // Already at or near maxScale, do not zoom further or reset
  }
  // Ladder rungs: 3x (regional), 6x (detail), maxScale (native pixel ceiling)
  const candidateLadder = [3, 6, maxScale];
  const ladder: number[] = [];
  for (const step of candidateLadder) {
    if (step <= maxScale && (ladder.length === 0 || step > ladder[ladder.length - 1] + 0.5)) {
      ladder.push(step);
    }
  }
  if (!ladder.includes(maxScale)) {
    ladder.push(maxScale);
  }

  const next = ladder.find((s) => s > current + 0.1);
  return next ? Math.min(next, maxScale) : maxScale;
};

