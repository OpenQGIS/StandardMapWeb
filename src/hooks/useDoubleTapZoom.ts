import { useEffect, useRef } from 'react';
import type { ViewportState } from '../types/map';

interface DoubleTapZoomConfig {
  /** Zoom-in target of a double tap (3 reaches crisp tile levels on retina phones) */
  targetScale?: number;
  /** Scale the second double tap returns to (1 = fit) */
  minScale?: number;
  /** Upper zoom clamp, same as gesture zoom */
  maxScale?: number;
  /** Reads the freshest viewport so native listeners never see stale closures */
  getViewport: () => ViewportState;
  /** Resolves the element whose center anchors the zoom (defaults to the container) */
  getAnchorEl?: (target: HTMLElement) => HTMLElement | null;
}

const DOUBLE_TAP_INTERVAL_MS = 300;
const TAP_MAX_MOVE_PX = 10;
const TAP_MAX_DURATION_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE_PX = 50;

const INTERACTIVE_SELECTOR =
  'button, a, input, .swipe-divider-handle, .swipe-control-panel, .overlay-control-panel, .overlay-zoom-controls';

/**
 * Photo-viewer style zoom: double tap/double click zooms to targetScale anchored
 * at the tap point; tapping again returns to fit. Reuses the same anchor
 * invariant as the pinch handler, so the tapped point stays under the finger.
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

    const zoomAt = (clientX: number, clientY: number, target: EventTarget | null) => {
      const { targetScale = 3, minScale = 1, maxScale = 16, getAnchorEl } = configRef.current;
      const current = configRef.current.getViewport();
      if (current.scale >= targetScale / 2) {
        setViewport({ scale: minScale, x: 0, y: 0 });
        return;
      }
      const anchorEl =
        (getAnchorEl && target instanceof HTMLElement && getAnchorEl(target)) || container;
      const rect = anchorEl.getBoundingClientRect();
      const dx = clientX - rect.left - rect.width / 2;
      const dy = clientY - rect.top - rect.height / 2;
      const newScale = Math.min(targetScale, maxScale);
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
        e.preventDefault(); // suppress the synthesized dblclick after a touch double tap
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
