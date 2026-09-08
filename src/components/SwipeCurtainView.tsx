import React, { useRef, useState, useEffect } from 'react';
import type { MapLayer, MapOrientation, ViewportState } from '../types/map';
import { MapSvg } from './MapSvg';
import { useCardDimensions } from '../hooks/useCardDimensions';
import { ZoomIn, ZoomOut, Maximize2, MoveHorizontal } from 'lucide-react';

interface SwipeCurtainViewProps {
  baseMap: MapLayer;
  reproductionMap: MapLayer;
  orientation: MapOrientation;
  aspectRatio: string;
  viewport: ViewportState;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  isSwapped: boolean;
}

export const SwipeCurtainView: React.FC<SwipeCurtainViewProps> = ({
  baseMap,
  reproductionMap,
  orientation,
  aspectRatio,
  viewport,
  setViewport,
  isSwapped,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardDimensions = useCardDimensions(containerRef, aspectRatio, orientation, 0.94);

  // Active layer order based on isSwapped (bottomMap on left, topMap on right)
  const bottomMap = isSwapped ? reproductionMap : baseMap;
  const topMap = isSwapped ? baseMap : reproductionMap;

  // Screen-locked curtain position in percentage (0% to 100% of viewport width)
  const [curtainPercent, setCurtainPercent] = useState<number>(50);

  const [isDraggingHandle, setIsDraggingHandle] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });

  const lastDividerClickTimeRef = useRef<number>(0);
  const dividerDownXRef = useRef<number>(0);
  const dragThresholdPassedRef = useRef<boolean>(false);
  const lastDividerTouchTimeRef = useRef<number>(0);

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

  // Handle wheel zoom strictly centered on mouse cursor with rAF
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
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

  // Handle map panning
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      (e.target as HTMLElement).closest('.swipe-divider-handle') ||
      (e.target as HTMLElement).closest('.swipe-control-panel')
    ) {
      return;
    }
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: viewportRef.current.x,
      startY: viewportRef.current.y,
    };
  };

  // Start dragging divider
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeDiff = now - lastDividerClickTimeRef.current;

    // Double click detected: snap to 50% immediately, bypass drag
    if (timeDiff < 350) {
      setCurtainPercent(50);
      setIsDraggingHandle(false);
      dragThresholdPassedRef.current = false;
      lastDividerClickTimeRef.current = 0;
      return;
    }

    lastDividerClickTimeRef.current = now;
    dividerDownXRef.current = e.clientX;
    dragThresholdPassedRef.current = false;
    setIsDraggingHandle(true);
  };

  const handleDividerTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastDividerTouchTimeRef.current < 350) {
      setCurtainPercent(50);
      setIsDraggingHandle(false);
      lastDividerTouchTimeRef.current = 0;
      return;
    }
    lastDividerTouchTimeRef.current = now;
    setIsDraggingHandle(true);
  };

  // Global mouse move & up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingHandle) {
        // Require moving > 3px to count as drag, protecting clicks and double clicks
        if (!dragThresholdPassedRef.current) {
          if (Math.abs(e.clientX - dividerDownXRef.current) > 3) {
            dragThresholdPassedRef.current = true;
          }
        }
        if (dragThresholdPassedRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const relativeX = e.clientX - rect.left;
          const newPercent = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
          setCurtainPercent(newPercent);
        }
      } else if (isPanning) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        scheduleViewportUpdate({
          ...viewportRef.current,
          x: panStartRef.current.startX + dx,
          y: panStartRef.current.startY + dy,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingHandle(false);
      setIsPanning(false);
      dragThresholdPassedRef.current = false;
    };

    if (isDraggingHandle || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHandle, isPanning]);

  // Touch handling
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if ((e.target as HTMLElement).closest('.swipe-divider-handle')) {
        setIsDraggingHandle(true);
      } else if (!(e.target as HTMLElement).closest('.swipe-control-panel')) {
        setIsPanning(true);
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          startX: viewport.x,
          startY: viewport.y,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDraggingHandle && e.touches.length > 0) {
      const touch = e.touches[0];
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = touch.clientX - rect.left;
        const newPercent = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
        setCurtainPercent(newPercent);
      }
    } else if (isPanning && e.touches.length > 0) {
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
    setIsDraggingHandle(false);
    setIsPanning(false);
  };

  // Quick zoom buttons (centered on viewport)
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
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full bg-[#0d0e12] overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Background Canvas Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Layer 1: Left / Bottom Map (revealed on the left of divider) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          ref={cardRef}
          className="shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden flex items-center justify-center bg-[#242834] ring-1 ring-white/15"
          style={{
            width: cardDimensions.width ? `${cardDimensions.width}px` : 'auto',
            height: cardDimensions.height ? `${cardDimensions.height}px` : 'auto',
            maxWidth: '94%',
            maxHeight: '94%',
            aspectRatio,
          }}
        >
          <MapSvg item={bottomMap} orientation={orientation} />
        </div>
      </div>

      {/* Layer 2: Right / Top Map (Screen-Level Clip: revealed on the right of divider) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 0 0 ${curtainPercent}%)` }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
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
              maxWidth: '94%',
              maxHeight: '94%',
              aspectRatio,
            }}
          >
            <MapSvg item={topMap} orientation={orientation} />
          </div>
        </div>
      </div>

      {/* Screen-Locked Vertical Divider Bar (Fixed to screen coordinates, never scales with map!) */}
      <div
        className="absolute top-0 bottom-0 z-30 cursor-ew-resize swipe-divider-handle flex items-center justify-center group pointer-events-auto"
        style={{ left: `${curtainPercent}%`, transform: 'translateX(-50%)', width: '36px' }}
        onMouseDown={handleDividerMouseDown}
        onTouchStart={handleDividerTouchStart}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setCurtainPercent(50);
          setIsDraggingHandle(false);
          dragThresholdPassedRef.current = false;
        }}
        title="拖动调整屏幕卷帘位置，双击居中 (50%)"
      >
        {/* Full-height vertical guideline */}
        <div className="w-[2px] h-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] group-hover:bg-amber-300 transition-colors pointer-events-none" />

        {/* Center Grab Handle - Always fixed 32px on screen */}
        <div className="absolute w-8 h-8 rounded-full bg-[#16181f] border-2 border-amber-400 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.7)] text-amber-400 group-hover:scale-110 transition-transform pointer-events-none">
          <MoveHorizontal className="w-4 h-4" />
        </div>
      </div>

      {/* Floating Labels indicating layers - Hidden on narrow screens / mobile, pure map title on large screens */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none hidden lg:flex items-center gap-2">
        <div className="bg-panelSub/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border text-xs flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-100 font-medium">{bottomMap.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            {bottomMap.approvalCode || bottomMap.categoryLabel}
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20 pointer-events-none hidden lg:flex items-center gap-2">
        <div className="bg-panelSub/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border text-xs flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-zinc-100 font-medium">{topMap.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60">
            {topMap.approvalCode || topMap.categoryLabel}
          </span>
        </div>
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-3 right-2.5 min-[500px]:bottom-4 min-[500px]:right-4 z-20 flex flex-col gap-1 min-[500px]:gap-1.5 bg-panelSub/60 hover:bg-panelSub/80 p-1 min-[500px]:p-1.5 rounded-lg border border-white/10 hover:border-zinc-600 shadow-md hover:shadow-xl swipe-control-panel transition-all duration-200">
        <button
          onClick={zoomIn}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          title="放大 (+)"
        >
          <ZoomIn className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
        <button
          onClick={zoomOut}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          title="缩小 (-)"
        >
          <ZoomOut className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
        <div className="h-[1px] bg-white/10 my-0.5" />
        <button
          onClick={fitScreen}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
          title="自适应居中"
        >
          <Maximize2 className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
      </div>

      {/* Screen Curtain Position Gauge (Hidden on small windows, click or double click to center on desktop) */}
      <div className="absolute bottom-4 left-4 z-20 hidden lg:flex items-center gap-2 swipe-control-panel">
        <button
          onClick={() => setCurtainPercent(50)}
          onDoubleClick={() => setCurtainPercent(50)}
          className="bg-panelSub/60 hover:bg-panelSub/80 px-3 py-1.5 rounded-lg border border-white/10 hover:border-zinc-600 text-xs flex items-center gap-2 shadow-md hover:shadow-xl cursor-pointer select-none transition-all duration-200 active:scale-95 group"
          title="点击或双击重置卷帘居中 (50%)"
        >
          <span className="text-zinc-400 text-[11px]">屏幕卷帘:</span>
          <span className="text-amber-400 font-mono font-semibold">{Math.round(curtainPercent)}%</span>
          <span className="text-zinc-400 group-hover:text-amber-300 text-[10px] transition-colors">
            · 拖动分割线 / 点击居中
          </span>
        </button>
      </div>
    </div>
  );
};
