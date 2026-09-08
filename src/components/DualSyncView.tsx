import React, { useRef, useState, useEffect } from 'react';
import type { MapLayer, MapOrientation, ViewportState } from '../types/map';
import { MapSvg } from './MapSvg';
import { useCardDimensions } from '../hooks/useCardDimensions';
import { ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';

interface DualSyncViewProps {
  baseMap: MapLayer;
  reproductionMap: MapLayer;
  orientation: MapOrientation;
  aspectRatio: string;
  viewport: ViewportState;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  isSwapped: boolean;
}

export const DualSyncView: React.FC<DualSyncViewProps> = ({
  baseMap,
  reproductionMap,
  orientation,
  aspectRatio,
  viewport,
  setViewport,
  isSwapped,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const cardDimensions = useCardDimensions(leftPaneRef, aspectRatio, orientation, 0.92);
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

  // Ref-based viewport cache to avoid stale state and enable rAF batching
  const viewportRef = useRef<ViewportState>(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  const rafIdRef = useRef<number | null>(null);
  const pendingViewportRef = useRef<ViewportState | null>(null);

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
    e.preventDefault();
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
    const newScale = Math.min(Math.max(current.scale * zoomFactor, 0.4), 16);
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

  // Touch support for synchronized drag
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      panStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        startX: viewport.x,
        startY: viewport.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isPanning && e.touches.length > 0) {
      const touch = e.touches[0];
      const dx = touch.clientX - panStartRef.current.x;
      const dy = touch.clientY - panStartRef.current.y;
      setViewport((prev) => ({
        ...prev,
        x: panStartRef.current.startX + dx,
        y: panStartRef.current.startY + dy,
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Zoom controls (centered on viewport)
  const zoomIn = () => {
    setViewport((prev) => {
      const newScale = Math.min(prev.scale * 1.25, 16);
      const ratio = newScale / prev.scale;
      return { scale: newScale, x: prev.x * ratio, y: prev.y * ratio };
    });
  };
  const zoomOut = () => {
    setViewport((prev) => {
      const newScale = Math.max(prev.scale / 1.25, 0.4);
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
      className="relative w-full h-full bg-[#0a0c10] grid grid-cols-1 md:grid-cols-2 gap-2 p-2 overflow-hidden select-none"
    >
      {/* ================= LEFT PANE ================= */}
      <div
        ref={leftPaneRef}
        onWheel={(e) => handleWheel(e, leftPaneRef.current)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMovePane}
        onMouseLeave={handleMouseLeavePane}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full bg-[#13151c] rounded-xl border border-zinc-700/60 overflow-hidden cursor-grab active:cursor-grabbing shadow-inner"
      >
        {/* Background Grid Pattern inside Pane */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Top Tag - Hidden on narrow screens / mobile, pure map title without prefix on large screens */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none hidden lg:flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-zinc-100 bg-panel/80 px-2 py-1 rounded border border-border shadow-sm">
            {leftMap.title}
          </span>
          <span className="text-[10px] text-zinc-400 bg-panel/80 px-1.5 py-0.5 rounded border border-border shadow-sm">
            {leftMap.approvalCode || leftMap.categoryLabel}
          </span>
        </div>

        {/* Map Canvas */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            className="shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden flex items-center justify-center bg-[#242834] ring-1 ring-white/15"
            style={{
              width: cardDimensions.width ? `${cardDimensions.width}px` : 'auto',
              height: cardDimensions.height ? `${cardDimensions.height}px` : 'auto',
              maxWidth: '92%',
              maxHeight: '92%',
              aspectRatio,
            }}
          >
            <MapSvg key={leftMap.tilePath || leftMap.imageUrl || leftMap.id} item={leftMap} orientation={orientation} viewport={viewport} />
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full bg-[#13151c] rounded-xl border border-zinc-700/60 overflow-hidden cursor-grab active:cursor-grabbing shadow-inner"
      >
        {/* Background Grid Pattern inside Pane */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />

        {/* Top Tag - Hidden on narrow screens / mobile, pure map title without prefix on large screens */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none hidden lg:flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-xs font-semibold text-zinc-100 bg-panel/80 px-2 py-1 rounded border border-border shadow-sm">
            {rightMap.title}
          </span>
          <span className="text-[10px] text-amber-400 bg-panel/80 px-1.5 py-0.5 rounded border border-border shadow-sm">
            {rightMap.approvalCode || rightMap.categoryLabel}
          </span>
        </div>

        {/* Map Canvas */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            className="shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden flex items-center justify-center bg-[#242834] ring-1 ring-white/15"
            style={{
              width: cardDimensions.width ? `${cardDimensions.width}px` : 'auto',
              height: cardDimensions.height ? `${cardDimensions.height}px` : 'auto',
              maxWidth: '92%',
              maxHeight: '92%',
              aspectRatio,
            }}
          >
            <MapSvg key={rightMap.tilePath || rightMap.imageUrl || rightMap.id} item={rightMap} orientation={orientation} viewport={viewport} />
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
          title="同步放大 (+)"
        >
          <ZoomIn className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
        <button
          onClick={zoomOut}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          title="同步缩小 (-)"
        >
          <ZoomOut className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
        <div className="h-[1px] bg-white/10 my-0.5" />
        <button
          onClick={fitScreen}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          title="双屏自适应居中"
        >
          <Maximize2 className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
      </div>
    </div>
  );
};
