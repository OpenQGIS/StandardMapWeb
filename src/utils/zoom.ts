import type { MapOrientation } from '../types/map';

const L2_SOURCE_WIDTH: Record<MapOrientation, number> = {
  horizontal: 9912,
  vertical: 6848,
};

/**
 * Zoom cap where the L2 original scan reaches 1:1 device pixels.
 * Zooming past this point only upsamples the source (any image viewer
 * turns soft), so gestures clamp here instead of a fixed 16x.
 */
export const maxNativeScale = (
  cardW: number,
  dpr: number,
  orientation: MapOrientation
): number => {
  if (!cardW || !dpr) return 16;
  const l2Width = L2_SOURCE_WIDTH[orientation] || L2_SOURCE_WIDTH.horizontal;
  return Math.min(16, Math.max(2, l2Width / (cardW * dpr)));
};
