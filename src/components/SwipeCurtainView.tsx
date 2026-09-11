import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { MapLayer, MapOrientation, ViewportState, SplitDirection } from '../types/map';
import { MapSvg } from './MapSvg';
import { useCardDimensions } from '../hooks/useCardDimensions';
import { ZoomIn, ZoomOut, MoveHorizontal, MoveVertical } from 'lucide-react';
import { Zoom100Icon } from './Zoom100Icon';
import { LottieLoader } from './LottieLoader';
import { useDoubleTapZoom } from '../hooks/useDoubleTapZoom';
import { maxNativeScale, nextZoomStep } from '../utils/zoom';

import { GLOBAL_LOADED_TILES } from './TileMapLayer';

interface SwipeCurtainViewProps {
  baseMap: MapLayer;
  reproductionMap: MapLayer;
  orientation: MapOrientation;
  aspectRatio: string;
  viewport: ViewportState;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  isSwapped: boolean;
  direction?: SplitDirection;
}

export const SwipeCurtainView: React.FC<SwipeCurtainViewProps> = ({
  baseMap,
  reproductionMap,
  orientation,
  aspectRatio,
  viewport,
  setViewport,
  isSwapped,
  direction = 'vertical',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardDimensions = useCardDimensions(containerRef, aspectRatio, orientation, 0.94);

  // Clamp gestures at the L2 native-pixel zoom: further zoom only upsamples
  const zoomMax = maxNativeScale(
    cardDimensions.width,
    window.devicePixelRatio || 1,
    orientation
  );

  // Layout zoom (Leaflet-style): bake the scale into the card's layout size
  // instead of a transform scale on the wrapper. Mobile WebKit rasters
  // transform-scaled layers at layout resolution and then stretches the
  // texture, which looked blurry even with L2 tiles loaded; a translate-only
  // wrapper forces re-rasterization at the final device resolution.
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

  // Active layer order based on isSwapped (bottomMap on left, topMap on right)
  const bottomMap = isSwapped ? reproductionMap : baseMap;
  const topMap = isSwapped ? baseMap : reproductionMap;

  // Screen-locked curtain position in percentage (0% to 100% of viewport width)
  const [curtainPercent, setCurtainPercent] = useState<number>(50);

  // Each layer only needs the tiles on its own side of the curtain
  const bottomClipWindow = useMemo(
    () =>
      direction === 'horizontal'
        ? { minY: 0, maxY: curtainPercent / 100 }
        : { minX: 0, maxX: curtainPercent / 100 },
    [curtainPercent, direction]
  );
  const topClipWindow = useMemo(
    () =>
      direction === 'horizontal'
        ? { minY: curtainPercent / 100, maxY: 1 }
        : { minX: curtainPercent / 100, maxX: 1 },
    [curtainPercent, direction]
  );

  // Check if base layers are already decoded in persistent session cache
  const isBaseCached = () =>
    bottomMap.tilePath
      ? GLOBAL_LOADED_TILES.has(`${bottomMap.tilePath}/0/0_0.webp`)
      : Boolean(bottomMap.imageUrl);
  const isReproCached = () =>
    topMap.tilePath
      ? GLOBAL_LOADED_TILES.has(`${topMap.tilePath}/0/0_0.webp`)
      : Boolean(topMap.imageUrl);

  // Track whether base overview layers (Level 0) are ready
  const [baseLoaded, setBaseLoaded] = useState<boolean>(isBaseCached);
  const [reproductionLoaded, setReproductionLoaded] = useState<boolean>(isReproCached);

  // Reset base loaded states when active map group changes
  useEffect(() => {
    const bCached = isBaseCached();
    const rCached = isReproCached();
    if (bCached && rCached) {
      setBaseLoaded(true);
      setReproductionLoaded(true);
      return;
    }
    setBaseLoaded(bCached);
    setReproductionLoaded(rCached);

    // Safety fallback: reveal curtain after 2000ms if any network hang occurs
    const timer = setTimeout(() => {
      setBaseLoaded(true);
      setReproductionLoaded(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [baseMap.id, reproductionMap.id]);

  const isCurtainReady = baseLoaded && reproductionLoaded;

  // Independent loading states for bottom and top maps (drives status LED indicators)
  const [bottomLoading, setBottomLoading] = useState<boolean>(true);
  const [topLoading, setTopLoading] = useState<boolean>(true);

  const [isDraggingHandle, setIsDraggingHandle] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });

  const lastDividerClickTimeRef = useRef<number>(0);
  const dividerDownPosRef = useRef<number>(0);
  const dragThresholdPassedRef = useRef<boolean>(false);
  const lastDividerTouchTimeRef = useRef<number>(0);

  // Multi-touch pinch-to-zoom references for mobile
  const touchPinchDistRef = useRef<number | null>(null);
  const touchPinchCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchPinchStartScaleRef = useRef<number>(1);
  const touchPinchStartViewportRef = useRef<ViewportState>({ scale: 1, x: 0, y: 0 });

  // Ref-based viewport cache to avoid stale state and enable rAF batching
  const viewportRef = useRef<ViewportState>(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Double tap on the map jumps straight to high-res tiles and back to fit
  useDoubleTapZoom(containerRef, setViewport, {
    getViewport: () => viewportRef.current,
    maxScale: zoomMax,
  });

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
    if (e.cancelable) e.preventDefault();
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
    dividerDownPosRef.current = direction === 'horizontal' ? e.clientY : e.clientX;
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
    const touch = e.touches[0];
    if (touch) {
      dividerDownPosRef.current = direction === 'horizontal' ? touch.clientY : touch.clientX;
    }
    dragThresholdPassedRef.current = false;
    setIsDraggingHandle(true);
  };

  // Global mouse move & up
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingHandle) {
        // Require moving > 3px to count as drag, protecting clicks and double clicks
        const currentCoord = direction === 'horizontal' ? e.clientY : e.clientX;
        if (!dragThresholdPassedRef.current) {
          if (Math.abs(currentCoord - dividerDownPosRef.current) > 3) {
            dragThresholdPassedRef.current = true;
          }
        }
        if (dragThresholdPassedRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (direction === 'horizontal') {
            const relativeY = e.clientY - rect.top;
            const newPercent = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
            setCurtainPercent(newPercent);
          } else {
            const relativeX = e.clientX - rect.left;
            const newPercent = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
            setCurtainPercent(newPercent);
          }
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

  // Touch handling (Single finger pan/divider, Two finger pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchPinchDistRef.current = null;
      const touch = e.touches[0];
      if ((e.target as HTMLElement).closest('.swipe-divider-handle')) {
        setIsDraggingHandle(true);
      } else if (!(e.target as HTMLElement).closest('.swipe-control-panel')) {
        setIsPanning(true);
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          startX: viewportRef.current.x,
          startY: viewportRef.current.y,
        };
      }
    } else if (e.touches.length === 2) {
      setIsDraggingHandle(false);
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
    if (isDraggingHandle && e.touches.length === 1) {
      const touch = e.touches[0];
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (direction === 'horizontal') {
          const relativeY = touch.clientY - rect.top;
          const newPercent = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
          setCurtainPercent(newPercent);
        } else {
          const relativeX = touch.clientX - rect.left;
          const newPercent = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
          setCurtainPercent(newPercent);
        }
      }
    } else if (isPanning && e.touches.length === 1) {
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

      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
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
      setIsDraggingHandle(false);
      setIsPanning(false);
      touchPinchDistRef.current = null;
    } else if (e.touches.length === 1) {
      // Transition from pinch to single-finger pan
      touchPinchDistRef.current = null;
      const touch = e.touches[0];
      if (!(e.target as HTMLElement).closest('.swipe-control-panel')) {
        setIsPanning(true);
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          startX: viewportRef.current.x,
          startY: viewportRef.current.y,
        };
      }
    }
  };

  // Quick zoom buttons (centered on viewport)
  // Quick zoom buttons snap to whole multiples (200%, 300%...) anchored at the view center
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
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-full h-full bg-zinc-100 dark:bg-[#0d0e12] overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none transition-colors duration-150"
    >
      {/* Background Canvas Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none text-zinc-400 dark:text-white"
        style={{
          backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Layer 1: Left / Top Map (Screen-Level Clip: revealed on the left or top of divider) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          clipPath:
            direction === 'horizontal'
              ? `inset(0 0 ${100 - curtainPercent}% 0)`
              : `inset(0 ${100 - curtainPercent}% 0 0)`,
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0)`,
          }}
        >
          <div
            ref={cardRef}
            className={`shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden flex items-center justify-center bg-white dark:bg-[#242834] ring-1 ring-black/10 dark:ring-white/15 shrink-0 transition-opacity duration-150 ${
              zoomedW ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: zoomedW ? `${zoomedW}px` : 'auto',
              height: zoomedH ? `${zoomedH}px` : 'auto',
              aspectRatio,
            }}
          >
            <MapSvg
              key={bottomMap.tilePath || bottomMap.imageUrl || bottomMap.id}
              item={bottomMap}
              orientation={orientation}
              viewport={viewport}
              onLoadingChange={setBottomLoading}
              onBaseLoaded={() => {
                if (bottomMap.type === 'base') setBaseLoaded(true);
                else setReproductionLoaded(true);
              }}
              hideLoader
              clipWindow={bottomClipWindow}
              cardSize={cardSize}
            />
          </div>
        </div>
      </div>

      {/* Layer 2: Right / Top Map (Screen-Level Clip: revealed on the right or bottom of divider) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          clipPath:
            direction === 'horizontal'
              ? `inset(${curtainPercent}% 0 0 0)`
              : `inset(0 0 0 ${curtainPercent}%)`,
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0)`,
          }}
        >
          <div
            className={`shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.7)] rounded-sm overflow-hidden flex items-center justify-center bg-white dark:bg-[#242834] ring-1 ring-black/10 dark:ring-white/15 shrink-0 transition-opacity duration-150 ${
              zoomedW ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              width: zoomedW ? `${zoomedW}px` : 'auto',
              height: zoomedH ? `${zoomedH}px` : 'auto',
              aspectRatio,
            }}
          >
            <MapSvg
              key={topMap.tilePath || topMap.imageUrl || topMap.id}
              item={topMap}
              orientation={orientation}
              viewport={viewport}
              onLoadingChange={setTopLoading}
              onBaseLoaded={() => {
                if (topMap.type === 'base') setBaseLoaded(true);
                else setReproductionLoaded(true);
              }}
              hideLoader
              clipWindow={topClipWindow}
              cardSize={cardSize}
            />
          </div>
        </div>
      </div>

      {/* Screen-Locked Divider Bar (Fixed to screen coordinates, never scales with map!) */}
      <div
        className={`absolute z-20 swipe-divider-handle flex items-center justify-center group transition-opacity duration-500 ease-out ${
          direction === 'horizontal'
            ? 'left-0 right-0 cursor-ns-resize'
            : 'top-0 bottom-0 cursor-ew-resize'
        } ${
          isCurtainReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={
          direction === 'horizontal'
            ? { top: `${curtainPercent}%`, transform: 'translateY(-50%)', height: '36px' }
            : { left: `${curtainPercent}%`, transform: 'translateX(-50%)', width: '36px' }
        }
        onMouseDown={handleDividerMouseDown}
        onTouchStart={handleDividerTouchStart}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setCurtainPercent(50);
          setIsDraggingHandle(false);
          dragThresholdPassedRef.current = false;
        }}
        title={`拖动调整${direction === 'horizontal' ? '水平' : '垂直'}卷帘位置，双击居中 (50%)`}
      >
        {/* Full guideline */}
        <div
          className={`${
            direction === 'horizontal' ? 'w-full h-[2px]' : 'w-[2px] h-full'
          } bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] group-hover:bg-amber-300 transition-colors pointer-events-none`}
        />

        {/* Center Grab Handle - Always fixed 32px on screen */}
        <div className="absolute w-8 h-8 rounded-full bg-white dark:bg-[#16181f] border-2 border-amber-500 dark:border-amber-400 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.7)] text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform pointer-events-none">
          {direction === 'horizontal' ? (
            <MoveVertical className="w-4 h-4" />
          ) : (
            <MoveHorizontal className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Floating Labels indicating layers - Hidden on narrow screens / mobile, pure map title on large screens */}
      {(() => {
        const isBottomBase = bottomMap.type === 'base';
        const isTopBase = topMap.type === 'base';
        return (
          <>
            {/* Bottom/Left Layer Label: dark chip wraps LED + title only; the badge sits on its own row */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 pointer-events-none flex flex-col items-start gap-1 lg:flex-row lg:items-center lg:gap-2">
              <div
                className={`bg-white/90 dark:bg-panelSub/90 backdrop-blur-md px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 shadow-lg transition-colors max-w-[42vw] lg:max-w-none ${
                  isBottomBase ? 'border-emerald-500/40 shadow-emerald-950/20' : 'border-amber-500/40 shadow-amber-950/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                    isBottomBase
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  } ${bottomLoading ? 'animate-pulse scale-110' : ''}`}
                  title={bottomLoading ? '正在加载高清切片...' : '高清切片已就绪'}
                />
                <span
                  className="text-zinc-800 dark:text-zinc-100 font-medium text-[11px] sm:text-xs truncate max-w-[30vw] lg:max-w-none"
                  title={bottomMap.title}
                >
                  {bottomMap.title}
                </span>
              </div>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium border shadow-sm shrink-0 ${
                  isBottomBase
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600/70'
                }`}
              >
                {bottomMap.approvalCode || bottomMap.categoryLabel}
              </span>
            </div>

            {/* Top/Right Layer Label: dark chip wraps LED + title only; the badge sits on its own row */}
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 pointer-events-none flex flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-2">
              <div
                className={`bg-white/90 dark:bg-panelSub/90 backdrop-blur-md px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1.5 shadow-lg transition-colors max-w-[42vw] lg:max-w-none ${
                  isTopBase ? 'border-emerald-500/40 shadow-emerald-950/20' : 'border-amber-500/40 shadow-amber-950/20'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                    isTopBase
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  } ${topLoading ? 'animate-pulse scale-110' : ''}`}
                  title={topLoading ? '正在加载高清切片...' : '高清切片已就绪'}
                />
                <span
                  className="text-zinc-800 dark:text-zinc-100 font-medium text-[11px] sm:text-xs truncate max-w-[30vw] lg:max-w-none"
                  title={topMap.title}
                >
                  {topMap.title}
                </span>
              </div>
              <span
                className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium border shadow-sm shrink-0 ${
                  isTopBase
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600/70'
                }`}
              >
                {topMap.approvalCode || topMap.categoryLabel}
              </span>
            </div>
          </>
        );
      })()}

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-3 right-2.5 min-[500px]:bottom-4 min-[500px]:right-4 z-20 flex flex-col gap-1 min-[500px]:gap-1.5 bg-white/90 dark:bg-panelSub/60 hover:bg-white dark:hover:bg-panelSub/80 p-1 min-[500px]:p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-md hover:shadow-xl swipe-control-panel transition-all duration-200">
        <button
          onClick={zoomIn}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          title={`放大至 ${Math.round(nextZoomStep(viewport.scale, 1, zoomMax) * 100)}%`}
        >
          <ZoomIn className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
        <button
          onClick={zoomOut}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          title={`缩小至 ${Math.round(nextZoomStep(viewport.scale, -1, zoomMax) * 100)}%`}
        >
          <ZoomOut className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
        <div className="h-[1px] bg-white/10 my-0.5" />
        <button
          onClick={fitScreen}
          className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
          title="自适应居中 (100% 原始比例)"
        >
          <Zoom100Icon className="w-4 h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
        </button>
      </div>

      {/* Screen Curtain Position Gauge (Hidden on small windows, click or double click to center on desktop) */}
      <div
        className={`absolute bottom-4 left-4 z-20 hidden lg:flex items-center gap-2 swipe-control-panel transition-opacity duration-500 ease-out ${
          isCurtainReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => setCurtainPercent(50)}
          onDoubleClick={() => setCurtainPercent(50)}
          className="bg-white/90 dark:bg-panelSub/60 hover:bg-white dark:hover:bg-panelSub/80 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 hover:border-zinc-400 dark:hover:border-zinc-600 text-xs flex items-center gap-2 shadow-md hover:shadow-xl cursor-pointer select-none transition-all duration-200 active:scale-95 group"
          title="点击或双击重置卷帘居中 (50%)"
        >
          <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">
            {direction === 'horizontal' ? '水平卷帘:' : '屏幕卷帘:'}
          </span>
          <span className="text-amber-400 font-mono font-semibold">{Math.round(curtainPercent)}%</span>
          <span className="text-zinc-400 group-hover:text-amber-300 text-[10px] transition-colors">
            · 拖动分割线 / 点击居中
          </span>
        </button>
      </div>

      {/* Unified Initial Loading Overlay: completely unobstructed, no clip seam, perfectly centered */}
      {!isCurtainReady && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-100/60 dark:bg-[#0d0e12]/60 select-none pointer-events-none transition-opacity duration-300">
          <LottieLoader size={60} text="载入高精度地图中..." />
        </div>
      )}
    </div>
  );
};
