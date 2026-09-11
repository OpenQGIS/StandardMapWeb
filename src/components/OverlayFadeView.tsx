import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { MapLayer, MapOrientation, ViewportState } from '../types/map';
import { MapSvg } from './MapSvg';
import { useCardDimensions } from '../hooks/useCardDimensions';
import { useDoubleTapZoom } from '../hooks/useDoubleTapZoom';
import { maxNativeScale, nextZoomStep } from '../utils/zoom';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Zoom100Icon } from './Zoom100Icon';
import { Tooltip } from './Tooltip';
import { LayerOverlayIcon } from './CustomIcons';

interface OverlayFadeViewProps {
  baseMap: MapLayer;
  reproductionMap: MapLayer;
  orientation: MapOrientation;
  aspectRatio: string;
  viewport: ViewportState;
  setViewport: React.Dispatch<React.SetStateAction<ViewportState>>;
  isSwapped: boolean;
  opacity?: number;
  onOpacityChange?: React.Dispatch<React.SetStateAction<number>>;
}

export const OverlayFadeView: React.FC<OverlayFadeViewProps> = ({
  baseMap,
  reproductionMap,
  orientation,
  aspectRatio,
  viewport,
  setViewport,
  isSwapped,
  opacity: controlledOpacity,
  onOpacityChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardDimensions = useCardDimensions(containerRef, aspectRatio, orientation, 0.94);

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
  const [internalOpacity, setInternalOpacity] = useState<number>(0.65);
  const opacity = controlledOpacity !== undefined ? controlledOpacity : internalOpacity;
  const setOpacity = onOpacityChange || setInternalOpacity;

  const handlePanelWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    const step = e.shiftKey ? 0.01 : 0.05;
    const delta = e.deltaY < 0 ? step : -step;
    setOpacity((prev: number) => Math.min(1, Math.max(0, Math.round((prev + delta) * 100) / 100)));
  };

  const [mixBlendMode, setMixBlendMode] = useState<'normal' | 'multiply' | 'difference'>('normal');
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });

  const bottomMap = isSwapped ? reproductionMap : baseMap;
  const topMap = isSwapped ? baseMap : reproductionMap;

  // Ref-based viewport cache to avoid stale state and enable rAF batching
  const viewportRef = useRef<ViewportState>(viewport);
  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  // Double tap on the stack jumps straight to high-res tiles and back to fit
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.overlay-control-panel') || (e.target as HTMLElement).closest('.overlay-zoom-controls')) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: viewportRef.current.x,
      startY: viewportRef.current.y,
    };
  };

  const touchPinchDistRef = useRef<number | null>(null);
  const touchPinchCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchPinchStartScaleRef = useRef<number>(1);
  const touchPinchStartViewportRef = useRef<ViewportState>({ scale: 1, x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.overlay-control-panel') || (e.target as HTMLElement).closest('.overlay-zoom-controls')) return;
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
    if ((e.target as HTMLElement).closest('.overlay-control-panel') || (e.target as HTMLElement).closest('.overlay-zoom-controls')) return;
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
      setIsPanning(false);
      touchPinchDistRef.current = null;
    } else if (e.touches.length === 1) {
      touchPinchDistRef.current = null;
      const touch = e.touches[0];
      if (!(e.target as HTMLElement).closest('.overlay-control-panel') && !(e.target as HTMLElement).closest('.overlay-zoom-controls')) {
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

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative w-full h-full bg-[#0d0e12] overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
    >
      {/* Layer 1: Bottom Map */}
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
          <MapSvg key={bottomMap.tilePath || bottomMap.imageUrl || bottomMap.id} item={bottomMap} orientation={orientation} viewport={viewport} cardSize={cardSize} />
        </div>
      </div>

      {/* Layer 2: Top Map with variable Opacity & Blend Mode */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          opacity,
          mixBlendMode,
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
          <MapSvg key={topMap.tilePath || topMap.imageUrl || topMap.id} item={topMap} orientation={orientation} viewport={viewport} cardSize={cardSize} />
        </div>
      </div>

      {/* Opacity & Blend Controls Panel */}
      <div
        onWheel={handlePanelWheel}
        className="absolute top-2.5 sm:top-4 left-1/2 -translate-x-1/2 z-30 overlay-control-panel bg-panelSub/60 hover:bg-panelSub/80 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-white/10 hover:border-zinc-700/80 flex flex-col gap-1.5 sm:gap-2 shadow-2xl w-auto max-w-[calc(100vw-16px)] sm:max-w-[270px] transition-colors overflow-hidden"
      >
        {/* Row 1: Opacity Slider */}
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
          <Tooltip content="图层透明度" position="bottom">
            <div className="flex items-center gap-1.5 shrink-0 cursor-default">
              <LayerOverlayIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-medium text-zinc-300 shrink-0 hidden min-[360px]:inline">
                透明度
              </span>
            </div>
          </Tooltip>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 justify-end">
            <Tooltip content="调节顶层透明度 (支持滚轮微调)" position="bottom" shortcut="[ / ]" className="flex-1 min-w-[36px] sm:min-w-[60px] max-w-[130px] flex">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="opacity-slider w-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${opacity * 100}%, #3f3f46 ${opacity * 100}%, #3f3f46 100%)`,
                }}
              />
            </Tooltip>
            <Tooltip content="双击重置为 50%" position="bottom" shortcut="双击">
              <span
                onDoubleClick={() => setOpacity(0.5)}
                className="text-xs font-mono text-amber-400 w-8 sm:w-9 text-right font-semibold shrink-0 select-none cursor-pointer hover:underline"
              >
                {Math.round(opacity * 100)}%
              </span>
            </Tooltip>
          </div>
        </div>

        {/* Row 2: Blend Modes (Using Glassmorphism Tooltip) */}
        <div className="w-full grid grid-cols-3 gap-1 pt-1.5 border-t border-zinc-800/80">
          {(
            [
              { key: 'normal', label: '正常', desc: '正常模式 · 标准半透明叠置，直观对比图层吻合度' },
              { key: 'multiply', label: '正片叠底', desc: '正片叠底 · 过滤底图白底，高亮线划与色块差异' },
              { key: 'difference', label: '差值比对', desc: '差值比对 · 重合完全一致呈黑色，差异区域反色高亮' },
            ] as const
          ).map((m) => (
            <Tooltip key={m.key} content={m.desc} position="bottom" className="w-full flex">
              <button
                onClick={() => setMixBlendMode(m.key)}
                className={`w-full py-0.5 sm:py-1 px-1 rounded text-[10px] sm:text-[11px] font-medium text-center transition-colors truncate cursor-pointer ${
                  mixBlendMode === m.key
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-800/90 border border-zinc-700/80 hover:bg-zinc-750'
                }`}
              >
                {m.label}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-3 right-2.5 min-[500px]:bottom-4 min-[500px]:right-4 z-20 flex flex-col gap-1 min-[500px]:gap-1.5 bg-panelSub/60 hover:bg-panelSub/80 p-1 min-[500px]:p-1.5 rounded-lg border border-white/10 hover:border-zinc-600 shadow-md hover:shadow-xl overlay-zoom-controls transition-all duration-200">
        <Tooltip
          content={`放大至 ${Math.round(nextZoomStep(viewport.scale, 1, zoomMax) * 100)}%`}
          position="top"
          shortcut="+"
        >
          <button
            onClick={() =>
              setViewport((prev) => {
                const newScale = nextZoomStep(prev.scale, 1, zoomMax);
                const ratio = newScale / prev.scale;
                return { scale: newScale, x: prev.x * ratio, y: prev.y * ratio };
              })
            }
            className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          </button>
        </Tooltip>
        <Tooltip
          content={`缩小至 ${Math.round(nextZoomStep(viewport.scale, -1, zoomMax) * 100)}%`}
          position="top"
          shortcut="-"
        >
          <button
            onClick={() =>
              setViewport((prev) => {
                const newScale = nextZoomStep(prev.scale, -1, zoomMax);
                const ratio = newScale / prev.scale;
                return { scale: newScale, x: prev.x * ratio, y: prev.y * ratio };
              })
            }
            className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          </button>
        </Tooltip>
        <div className="h-[1px] bg-white/10 my-0.5" />
        <Tooltip content="自适应居中 (100% 原始比例)" position="top" shortcut="0">
          <button
            onClick={() => setViewport({ scale: 1, x: 0, y: 0 })}
            className="w-7 h-7 min-[500px]:w-8 min-[500px]:h-8 rounded flex items-center justify-center text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Zoom100Icon className="w-4 h-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
