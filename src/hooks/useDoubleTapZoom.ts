import { useEffect, useRef } from 'react';
import type { ViewportState } from '../types/map';
import { nextDoubleTapScale } from '../utils/zoom';

interface DoubleTapZoomConfig {
  /** Upper zoom clamp (e.g. 8x on desktop, 10x on mobile) */
  maxScale?: number;
  /** Reads the freshest viewport so native listeners never see stale closures */
  getViewport: () => ViewportState;
  /** Resolves the element whose center anchors the zoom (defaults to the container) */
  getAnchorEl?: (target: HTMLElement) => HTMLElement | null;
}

const DOUBLE_TAP_INTERVAL_MS = 380;
const TAP_MAX_MOVE_PX = 24;
const TAP_MAX_DURATION_MS = 350;
const DOUBLE_TAP_MAX_DISTANCE_PX = 60;

const INTERACTIVE_SELECTOR =
  'button, a, input, .swipe-divider-handle, .swipe-control-panel, .overlay-control-panel, .overlay-zoom-controls';

/**
 * WebGIS-standard progressive zoom: double tap/double click zooms in along a
 * clean integer ladder (e.g. 100% -> 300% -> 600% -> maxScale) anchored at the
 * tapped point. Once at or near maxScale, double tap stops (never resets to fit;
 * view reset is exclusively handled by the dedicated fit/maximize button).
 */
export function useDoubleTapZoom(
  containerRef: React.RefObject<HTMLDivElement | null>,
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>,
  config: DoubleTapZoomConfig
): void {
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStart: { x: number; y: number; time: number } | null = null;
    let lastTap: { x: number; y: number; time: number } | null = null;
    let lastTouchTime = 0;
    let lastZoomTime = 0;

    const zoomAt = (clientX: number, clientY: number, target: EventTarget | null) => {
      const now = Date.now();
      // Debounce rapid triple/quadruple taps to prevent accidental double-jumps
      if (now - lastZoomTime < 350) return;

      const { maxScale = 10, getAnchorEl } = configRef.current;
      const current = configRef.current.getViewport();

      const newScale = nextDoubleTapScale(current.scale, maxScale);
      // Already at maxScale: stay firm, no-op, never bounce back to fit!
      if (newScale === null || Math.abs(newScale - current.scale) < 1e-4) {
        return;
      }

      lastZoomTime = now;

      const anchorEl =
        (getAnchorEl && target instanceof HTMLElement && getAnchorEl(target)) || container;
      const rect = anchorEl.getBoundingClientRect();
      const dx = clientX - rect.left - rect.width / 2;
      const dy = clientY - rect.top - rect.height / 2;
      const scaleRatio = newScale / current.scale;

      setViewport({
        scale: newScale,
        x: dx - (dx - current.x) * scaleRatio,
        y: dy - (dy - current.y) * scaleRatio,
      });
    };

    const isInteractive = (target: EventTarget | null) =>
      target instanceof HTMLElement && target.closest(INTERACTIVE_SELECTOR) !== null;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || isInteractive(e.target)) {
        touchStart = null;
        return;
      }
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
    };

    const onTouchEnd = (e: TouchEvent) => {
      lastTouchTime = Date.now();
      if (!touchStart) return;
      const t = e.changedTouches[0];
      const moved = Math.hypot(t.clientX - touchStart.x, t.clientY - touchStart.y);
      const duration = Date.now() - touchStart.time;
      touchStart = null;
      if (moved > TAP_MAX_MOVE_PX || duration > TAP_MAX_DURATION_MS) {
        // It was a pan or a long press: break the tap chain
        lastTap = null;
        return;
      }
      if (
        lastTap &&
        Date.now() - lastTap.time < DOUBLE_TAP_INTERVAL_MS &&
        Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < DOUBLE_TAP_MAX_DISTANCE_PX
      ) {
        lastTap = null;
        if (e.cancelable) e.preventDefault(); // suppress the synthesized dblclick after a touch double tap
        zoomAt(t.clientX, t.clientY, e.target);
      } else {
        lastTap = { x: t.clientX, y: t.clientY, time: Date.now() };
      }
    };

    const onDblClick = (e: MouseEvent) => {
      if (isInteractive(e.target)) return;
      // Skip mouse dblclick right after a handled touch double tap
      if (Date.now() - lastTouchTime < 500) return;
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.target);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('dblclick', onDblClick);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('dblclick', onDblClick);
    };
  }, [containerRef, setViewport]);
}
