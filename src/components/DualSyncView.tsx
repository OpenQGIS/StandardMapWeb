import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { MapLayer, MapOrientation, ViewportState, SplitDirection } from '../types/map';
import { MapSvg } from './MapSvg';
import { useCardDimensions } from '../hooks/useCardDimensions';
import { useDoubleTapZoom } from '../hooks/useDoubleTapZoom';
import { maxNativeScale, nextZoomStep } from '../utils/zoom';
import { ZoomIn, ZoomOut, Crosshair } from 'lucide-react';
import { Zoom100Icon } from './Zoom100Icon';

interface DualSyncViewProps {
  baseMap: MapLayer;
  reproductionMap: MapLayer;
  orientation: MapOrientation;
  aspectRatio: string;
  viewport: ViewportState;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  isSwapped: boolean;
  direction?: SplitDirection;
}

export const DualSyncView: React.FC<DualSyncViewProps> = ({
  baseMap,
  reproductionMap,
  orientation,
  aspectRatio,
  viewport,
  setViewport,
  isSwapped,
  direction = 'horizontal',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const cardDimensions = useCardDimensions(leftPaneRef, aspectRatio, orientation, 0.92);

  // Clamp gestures at the L2 native-pixel zoom: further zoom only upsamples
  const zoomMax = maxNativeScale(
    cardDimensions.width,
    window.devicePixelRatio || 1,
    orientation
  );

  // Layout zoom (Leaflet-style): bake scale into the card size so mobile WebKit
  // rasters at final device resolution; wrapper transform stays translate-only.
  // Screen mapping stays identical: center + d*scale + (x, y).
  const zoomedW = cardDimensions.width
    ? Math.round(cardDimensions.width * viewport.scale)
    : 0;
  const zoomedH = cardDimensions.height
    ? Math.round(cardDimensions.height * viewport.scale)
    : 0;
  const cardSize = useMemo(
    () => ({ width: zoomedW, height: zoomedH }),
    [zoomedW, zoomedH]
  );
  const [isPanning, setIsPanning] = useState(false);
  const [hoverNormalizedPos, setHoverNormalizedPos] = useState<{ x: number; y: number } | null>(null);
  const panStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });

  // Determine left and right map based on isSwapped
  const leftMap = isSwapped ? reproductionMap : baseMap;
  const rightMap = isSwapped ? baseMap : reproductionMap;

  // Independent loading states for left and right maps (drives status LED indicators)
  const [leftLoading, setLeftLoading] = useState<boolean>(true);
  const [rightLoading, setRightLoading] = useState<boolean>(true);

  // Ref-based viewport cache to avoid stale state and enable rAF batching
  const viewportRef = useRef<ViewportState>(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Double tap on either pane jumps straight to high-res tiles and back to fit,
  // anchored on the tapped pane so the point stays under the finger in both panes
  useDoubleTapZoom(containerRef, setViewport, {
    getViewport: () => viewportRef.current,
    getAnchorEl: (target) => target.closest('.dual-pane'),
    maxScale: zoomMax,
  });

  const rafIdRef = useRef<number | null>(null);
  const pendingViewportRef = useRef<ViewportState | null>(null);

  // Pinch-to-zoom touch state refs
  const touchPinchDistRef = useRef<number | null>(null);
  const touchPinchCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchPinchStartScaleRef = useRef<number>(1);
  const touchPinchStartViewportRef = useRef<ViewportState>({ scale: 1, x: 0, y: 0 });

  const scheduleViewportUpdate = (nextViewport: ViewportState) => {
    pendingViewportRef.current = nextViewport;
    viewportRef.current = nextViewport;
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        if (pendingViewportRef.current) {
          setViewport(pendingViewportRef.current);
          pendingViewportRef.current = null;
        }
        rafIdRef.current = null;
      });
    }
  };

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Handle synchronized wheel zoom strictly centered on mouse cursor with rAF
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>, paneEl: HTMLDivElement | null) => {
    if (e.cancelable) e.preventDefault();
    if (!paneEl) return;

    const rect = paneEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    let zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    if (Math.abs(e.deltaY) < 50) {
      zoomFactor = 1 - e.deltaY * 0.003;
    }

    const current = viewportRef.current;
    const newScale = Math.min(Math.max(current.scale * zoomFactor, 0.1), zoomMax);
    const scaleRatio = newScale / current.scale;

    const newX = dx - (dx - current.x) * scaleRatio;
    const newY = dy - (dy - current.y) * scaleRatio;

    scheduleViewportUpdate({
      scale: newScale,
      x: newX,
      y: newY,
    });
  };

  // Handle synchronized pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: viewportRef.current.x,
      startY: viewportRef.current.y,
    };
  };

  const handleMouseMovePane = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const relativeY = (e.clientY - rect.top) / rect.height;
    setHoverNormalizedPos({ x: relativeX, y: relativeY });
  };

  const handleMouseLeavePane = () => {
    setHoverNormalizedPos(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      scheduleViewportUpdate({
        ...viewportRef.current,
        x: panStartRef.current.startX + dx,
        y: panStartRef.current.startY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);
 
  // Suppress browser native pinch-to-zoom on iOS/Safari with a non-passive listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventNativePinch = (e: TouchEvent) => {
      if (e.touches.length >= 2 && e.cancelable) {
        e.preventDefault();
      }
    };
    el.addEventListener('touchmove', preventNativePinch, { passive: false });
    return () => {
      el.removeEventListener('touchmove', preventNativePinch);
    };
  }, []);

  // Touch support for synchronized drag & two-finger pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchPinchDistRef.current = null;
      const touch = e.touches[0];
      setIsPanning(true);
      panStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        startX: viewportRef.current.x,
        startY: viewportRef.current.y,
      };
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      touchPinchDistRef.current = dist;
      touchPinchCenterRef.current = { x: midX, y: midY };
      touchPinchStartScaleRef.current = viewportRef.current.scale;
      touchPinchStartViewportRef.current = { ...viewportRef.current };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - panStartRef.current.x;
      const dy = touch.clientY - panStartRef.current.y;
      scheduleViewportUpdate({
        ...viewportRef.current,
        x: panStartRef.current.startX + dx,
        y: panStartRef.current.startY + dy,
      });
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      if (!touchPinchDistRef.current || touchPinchDistRef.current <= 0) {
        touchPinchDistRef.current = dist;
        touchPinchCenterRef.current = { x: midX, y: midY };
        touchPinchStartScaleRef.current = viewportRef.current.scale;
        touchPinchStartViewportRef.current = { ...viewportRef.current };
        return;
      }

      const factor = dist / touchPinchDistRef.current;
      const startScale = touchPinchStartScaleRef.current;
      const newScale = Math.min(Math.max(startScale * factor, 0.1), zoomMax);

      const targetPane = (e.currentTarget as HTMLDivElement) || containerRef.current;
      if (targetPane) {
        const rect = targetPane.getBoundingClientRect();
        const mouseX = touchPinchCenterRef.current.x - rect.left;
        const mouseY = touchPinchCenterRef.current.y - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;

        const scaleRatio = newScale / startScale;
        const panDeltaX = midX - touchPinchCenterRef.current.x;
        const panDeltaY = midY - touchPinchCenterRef.current.y;

        const startVp = touchPinchStartViewportRef.current;
        const newX = dx - (dx - startVp.x) * scaleRatio + panDeltaX;
        const newY = dy - (dy - startVp.y) * scaleRatio + panDeltaY;

        scheduleViewportUpdate({
          scale: newScale,
          x: newX,
          y: newY,
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      setIsPanning(false);
      touchPinchDistRef.current = null;
    } else if (e.touches.length === 1) {
      // Transition from pinch to single-finger pan
      touchPinchDistRef.current = null;
      const touch = e.touches[0];
      setIsPanning(true);
      panStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        startX: viewportRef.current.x,
        startY: viewportRef.current.y,
      };
    }
  };

  // Zoom controls snap to whole multiples (200%, 300%...) anchored at the view center
  const zoomIn = () => {
    setViewport((prev) => {
      const newScale = nextZoomStep(prev.scale, 1, zoomMax);
      const ratio = newScale / prev.scale;
      return { scale: newScale, x: prev.x * ratio, y: prev.y * ratio };
    });
  };
  const zoomOut = () => {
    setViewport((prev) => {
      const newScale = nextZoomStep(prev.scale, -1, zoomMax);
      const ratio = newScale / prev.scale;
      return { scale: newScale, x: prev.x * ratio, y: prev.y * ratio };
    });
  };
  const fitScreen = () => {
    setViewport({ scale: 1, x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative w-full h-full bg-[#0a0c10] gap-2 p-2 overflow-hidden select-none touch-none ${
        direction === 'vertical'
          ? 'grid grid-cols-1 grid-rows-2'
          : 'grid grid-cols-1 landscape:grid-cols-2 md:grid-cols-2'
      }`}
    >
      {/* ================= LEFT PANE ================= */}
      <div
        ref={leftPaneRef}
        onWheel={(e) => handleWheel(e, leftPaneRef.current)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMovePane}
        onMouseLeave={handleMouseLeavePane}
        className="dual-pane relative w-full h-full bg-[#13151c] rounded-xl border border-zinc-700/60 overflow-hidden cursor-grab active:cursor-grabbing shadow-inner touch-none"
      >
        {/* Background Grid Pattern inside Pane */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Top Tag - Two rows on mobile with 30vw truncate, single row on desktop */}
        {(() => {
          const isLeftBase = leftMap.type === 'base';
          return (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 pointer-events-none flex flex-col items-start gap-1 lg:flex-row lg:items-center lg:gap-2">
              <div
                className={`bg-panelSub/90 backdrop-blur-md px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-xs flex items-center gap-1.5 shadow-lg transition-colors max-w-[42vw] lg:max-w-none ${
                  isLeftBase ? 'border-emerald-500/40 shadow-emerald-950/20' : 'border-amber-500/40 shadow-amber-950/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                    isLeftBase
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  } ${leftLoading ? 'animate-pulse scale-110' : ''}`}
                  title={leftLoading ? '正在加载高清切片...' : '高清切片已就绪'}
                />
                <span
                  className="text-[11px] sm:text-xs font-semibold text-zinc-100 truncate max-w-[30vw] lg:max-w-none"
                  title={leftMap.title}
                >
                  {leftMap.title}
                </span>
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded border shadow-sm shrink-0 ${
                  isLeftBase
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600/70'
                }`}
              >
                {leftMap.approvalCode || leftMap.categoryLabel}
              </span>
            </div>
          );
        })()}

        {/* Map Canvas */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0)`,
          }}
        >
          <div
            className={`shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden flex items-center justify-center bg-[#242834] ring-1 ring-white/15 shrink-0 transition-opacity duration-150 ${
              zoomedW ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: zoomedW ? `${zoomedW}px` : 'auto',
              height: zoomedH ? `${zoomedH}px` : 'auto',
              aspectRatio,
            }}
          >
            <MapSvg
              key={leftMap.tilePath || leftMap.imageUrl || leftMap.id}
              item={leftMap}
              orientation={orientation}
              viewport={viewport}
              onLoadingChange={setLeftLoading}
              cardSize={cardSize}
            />
          </div>
        </div>

        {/* Crosshair indicator */}
        {hoverNormalizedPos && (
          <div
            className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${hoverNormalizedPos.x * 100}%`,
              top: `${hoverNormalizedPos.y * 100}%`,
            }}
          >
            <Crosshair className="w-5 h-5 text-emerald-400/80" />
          </div>
        )}
      </div>

      {/* ================= RIGHT PANE ================= */}
      <div
        ref={rightPaneRef}
        onWheel={(e) => handleWheel(e, rightPaneRef.current)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMovePane}
        onMouseLeave={handleMouseLeavePane}
        className="dual-pane relative w-full h-full bg-[#13151c] rounded-xl border border-zinc-700/60 overflow-hidden cursor-grab active:cursor-grabbing shadow-inner touch-none"
      >
        {/* Background Grid Pattern inside Pane */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Top Tag - Two rows on mobile with 30vw truncate, single row on desktop */}
        {(() => {
          const isRightBase = rightMap.type === 'base';
          return (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 landscape:left-auto landscape:right-2 md:left-auto md:right-3 z-20 pointer-events-none flex flex-col items-start gap-1 landscape:items-end md:items-end lg:flex-row lg:items-center lg:gap-2">
              <div
                className={`bg-panelSub/90 backdrop-blur-md px-2 py-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-xs flex items-center gap-1.5 shadow-lg transition-colors max-w-[42vw] lg:max-w-none ${
                  isRightBase ? 'border-emerald-500/40 shadow-emerald-950/20' : 'border-amber-500/40 shadow-amber-950/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                    isRightBase
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  } ${rightLoading ? 'animate-pulse scale-110' : ''}`}
                  title={rightLoading ? '正在加载高清切片...' : '高清切片已就绪'}
                />
                <span
                  className="text-[11px] sm:text-xs font-semibold text-zinc-100 truncate max-w-[30vw] lg:max-w-none"
                  title={rightMap.title}
                >
                  {rightMap.title}
                </span>
              </div>
              <span
                className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded border shadow-sm shrink-0 ${
                  isRightBase
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600/70'
                }`}
              >
                {rightMap.approvalCode || rightMap.categoryLabel}
              </span>
            </div>
          );
        })()}

        {/* Map Canvas */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0)`,
          }}
        >
          <div
            className={`shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden flex items-center justify-center bg-[#242834] ring-1 ring-white/15 shrink-0 transition-opacity duration-150 ${
              zoomedW ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: zoomedW ? `${zoomedW}px` : 'auto',
              height: zoomedH ? `${zoomedH}px` : 'auto',
              aspectRatio,
            }}
          >
            <MapSvg
              key={rightMap.tilePath || rightMap.imageUrl || rightMap.id}
              item={rightMap}
              orientation={orientation}
              viewport={viewport}
              onLoadingChange={setRightLoading}
              cardSize={cardSize}
            />
          </div>
        </div>

        {/* Crosshair indicator */}
        {hoverNormalizedPos && (
          <div
            className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${hoverNormalizedPos.x * 100}%`,
              top: `${hoverNormalizedPos.y * 100}%`,
            }}
          >
            <Crosshair className="w-5 h-5 text-amber-400/80" />
          </div>
        )}
      </div>

      {/* Viewport Floating Controls */}
      <div className="absolute bottom-3 right-2.5 min-[500px]:bottom-4 min-[500px]:right-4 z-20 flex flex-col gap-1 min-[500px]:gap-1.5 bg-panelSub/60 hover:bg-panelSub/80 p-1 min-[500px]:p-1.5 rounded-lg border border-white/10 hover:border-zinc-600 shadow-md hover:shadow-xl transition-all duration-200">
        <button
          onClick={zoomIn}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          title={`同步放大至 ${Math.round(nextZoomStep(viewport.scale, 1, zoomMax) * 100)}%`}
        >
          <ZoomIn className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
        <button
          onClick={zoomOut}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          title={`同步缩小至 ${Math.round(nextZoomStep(viewport.scale, -1, zoomMax) * 100)}%`}
        >
          <ZoomOut className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
        <div className="h-[1px] bg-white/10 my-0.5" />
        <button
          onClick={fitScreen}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          title="双屏自适应居中 (100% 原始比例)"
        >
          <Zoom100Icon className="w-4 h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
      </div>
    </div>
  );
};
