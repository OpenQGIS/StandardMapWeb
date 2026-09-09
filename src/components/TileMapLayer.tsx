import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { MapOrientation, ViewportState, TileClipWindow } from '../types/map';
import { LottieLoader } from './LottieLoader';

interface TileMapLayerProps {
  tilePath: string;
  title: string;
  orientation?: MapOrientation;
  viewport?: ViewportState;
  className?: string;
  onLoadingChange?: (isLoading: boolean) => void;
  onBaseLoaded?: () => void;
  hideLoader?: boolean;
  /** Horizontal window of the view actually visible (curtain clipping); omit for full width */
  clipWindow?: TileClipWindow;
}

interface TileInfo {
  key: string;
  level: number;
  row: number;
  col: number;
  url: string;
  style: React.CSSProperties;
}

interface GridLevelConfig {
  cols: number;
  rows: number;
}

const GRID_CONFIGS: Record<MapOrientation, Record<1 | 2, GridLevelConfig>> = {
  horizontal: {
    1: { cols: 3, rows: 2 }, // 6 tiles
    2: { cols: 6, rows: 4 }, // 24 tiles
  },
  vertical: {
    1: { cols: 2, rows: 2 }, // 4 tiles
    2: { cols: 4, rows: 5 }, // 20 tiles
  },
};

// Full composite pixel width of each tile level (L0 overview, L1 50%, L2 source),
// matching scripts/generate_square_tiles.py output
const LEVEL_SOURCE_WIDTH: Record<MapOrientation, readonly [number, number, number]> = {
  horizontal: [1600, 4956, 9912],
  vertical: [1357, 3424, 6848],
};

// Pre-downsampled overviews lose thin-line detail long before pixel counts match,
// so the chosen level must oversample the rendered viewport by this factor
const QUALITY_FACTOR = 1.5;
// Demote a level only clearly below its promote threshold to avoid flicker while zooming
const DEMOTION_HYSTERESIS = 1.25;

// Persistent session cache of loaded tile URLs
const GLOBAL_LOADED_TILES = new Set<string>();

export const TileMapLayer: React.FC<TileMapLayerProps> = ({
  tilePath,
  title,
  orientation = 'horizontal',
  viewport,
  className = '',
  onLoadingChange,
  onBaseLoaded,
  hideLoader = false,
  clipWindow,
}) => {
  const scale = viewport?.scale ?? 1;
  const panX = viewport?.x ?? 0;
  const panY = viewport?.y ?? 0;
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable layout geometry: the transform wrapper (view/pane box) and the card.
  // offsetWidth/offsetHeight ignore ancestor transforms, so re-measuring on
  // layout changes is enough — during gestures visibility stays pure math.
  const [layout, setLayout] = useState({ viewW: 0, viewH: 0, cardW: 0, cardH: 0 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const wrapper = el.offsetParent instanceof HTMLElement ? el.offsetParent : el;
    const update = () =>
      setLayout({
        viewW: wrapper.offsetWidth,
        viewH: wrapper.offsetHeight,
        cardW: el.offsetWidth,
        cardH: el.offsetHeight,
      });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, []);

  const [devicePixelRatio, setDevicePixelRatio] = useState(() => window.devicePixelRatio || 1);
  useEffect(() => {
    const update = () => setDevicePixelRatio(window.devicePixelRatio || 1);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const previousLevelRef = useRef(0);

  // Level determination by the device pixels the card actually has to fill:
  // neededPx = card CSS width * devicePixelRatio * scale * quality headroom,
  // then the smallest level whose source width covers it. On retina phones the
  // fit view already warrants L1, while a small desktop window stays on L0.
  const currentLevel = useMemo(() => {
    const widths = LEVEL_SOURCE_WIDTH[orientation || 'horizontal'];
    const neededPx = layout.cardW * devicePixelRatio * scale * QUALITY_FACTOR;
    let target = widths.length - 1;
    for (let level = 0; level < widths.length; level++) {
      if (widths[level] >= neededPx) {
        target = level;
        break;
      }
    }
    const previous = previousLevelRef.current;
    if (target < previous) {
      const demotionFloor = previous > 0 ? widths[previous - 1] / DEMOTION_HYSTERESIS : 0;
      if (neededPx > demotionFloor) return previous;
    }
    return target;
  }, [layout.cardW, devicePixelRatio, scale, orientation]);

  useEffect(() => {
    previousLevelRef.current = currentLevel;
  }, [currentLevel]);

  // Compute tiles for the active level
  const activeTiles = useMemo(() => {
    if (currentLevel === 0) return [];

    const effectiveOrientation: MapOrientation = orientation || 'horizontal';
    const config = GRID_CONFIGS[effectiveOrientation][currentLevel as 1 | 2];
    const { cols, rows } = config;

    const stepX = 100 / cols;
    const stepY = 100 / rows;
    const tiles: TileInfo[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push({
          key: `${tilePath}_${currentLevel}_${r}_${c}`,
          level: currentLevel,
          row: r,
          col: c,
          url: `${tilePath}/${currentLevel}/${r}_${c}.webp`,
          style: {
            position: 'absolute',
            top: `${r * stepY}%`,
            left: `${c * stepX}%`,
            width: `${stepX}%`,
            height: `${stepY}%`,
          },
        });
      }
    }

    return tiles;
  }, [currentLevel, tilePath, orientation]);

  // Pure synchronous viewport culling: derive the on-screen row/col ranges from
  // the gesture state itself. The transform wrapper centers the card, so the
  // card's rendered rect is viewW/2 - cardW*scale/2 + x (same for Y). Tiles
  // outside the visible span never mount and never fetch — including the very
  // first frame after a level change, which kills the full-level fetch storm.
  const visibleKeys = useMemo(() => {
    const keys = new Set<string>();
    if (currentLevel === 0) return keys;
    const { viewW, viewH, cardW, cardH } = layout;
    if (!viewW || !viewH || !cardW || !cardH) return keys;

    const effectiveOrientation: MapOrientation = orientation || 'horizontal';
    const config = GRID_CONFIGS[effectiveOrientation][currentLevel as 1 | 2];
    if (!config) return keys;
    const { cols, rows } = config;

    const SCREEN_MARGIN = 120; // px prefetch buffer around the visible box
    const CLIP_BUFFER = 64; // px slack on each side of a curtain clip window

    const left = viewW / 2 - (cardW * scale) / 2 + panX;
    const top = viewH / 2 - (cardH * scale) / 2 + panY;

    let x0 = Math.max(0, left - SCREEN_MARGIN);
    let x1 = Math.min(viewW, left + cardW * scale + SCREEN_MARGIN);
    if (clipWindow) {
      x0 = Math.max(x0, clipWindow.minX * viewW - CLIP_BUFFER);
      x1 = Math.min(x1, clipWindow.maxX * viewW + CLIP_BUFFER);
    }
    const y0 = Math.max(0, top - SCREEN_MARGIN);
    const y1 = Math.min(viewH, top + cardH * scale + SCREEN_MARGIN);

    const spanW = cardW * scale;
    const spanH = cardH * scale;
    const fX0 = spanW > 0 ? Math.min(1, Math.max(0, (x0 - left) / spanW)) : 0;
    const fX1 = spanW > 0 ? Math.min(1, Math.max(0, (x1 - left) / spanW)) : 0;
    const fY0 = spanH > 0 ? Math.min(1, Math.max(0, (y0 - top) / spanH)) : 0;
    const fY1 = spanH > 0 ? Math.min(1, Math.max(0, (y1 - top) / spanH)) : 0;
    if (fX1 <= fX0 || fY1 <= fY0) return keys;

    const cMin = Math.max(0, Math.floor(fX0 * cols + 1e-9));
    const cMax = Math.min(cols - 1, Math.ceil(fX1 * cols - 1e-9) - 1);
    const rMin = Math.max(0, Math.floor(fY0 * rows + 1e-9));
    const rMax = Math.min(rows - 1, Math.ceil(fY1 * rows - 1e-9) - 1);

    for (let r = rMin; r <= rMax; r++) {
      for (let c = cMin; c <= cMax; c++) {
        keys.add(`${tilePath}_${currentLevel}_${r}_${c}`);
      }
    }
    return keys;
  }, [currentLevel, layout, scale, panX, panY, orientation, tilePath, clipWindow]);

  const level0Url = `${tilePath}/0/0_0.webp`;

  const [isLevel0Loaded, setIsLevel0Loaded] = useState(() => GLOBAL_LOADED_TILES.has(level0Url));
  const [isTilesLoading, setIsTilesLoading] = useState(false);

  // Track the timestamp when tile loading initiated to ensure at least 1.5s of smooth breathing
  const loadStartTimeRef = useRef<number | null>(null);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset loading timer on map change or unmount
  useEffect(() => {
    loadStartTimeRef.current = null;
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
  }, [tilePath]);

  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
      }
    };
  }, []);

  // Helper to gracefully transition breathing light to steady with a 1.5s minimum window
  const scheduleFinishLoading = (isCancelledCheck: () => boolean) => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
    }
    const elapsed = loadStartTimeRef.current ? Date.now() - loadStartTimeRef.current : 1500;
    const minDelay = Math.max(0, 1500 - elapsed);

    finishTimeoutRef.current = setTimeout(() => {
      if (!isCancelledCheck()) {
        setIsTilesLoading(false);
        loadStartTimeRef.current = null;
      }
    }, minDelay);
  };

  // Viewport culling now happens synchronously in render (visibleKeys useMemo
  // above); only the stable layout geometry is measured in the layout effect.

  // Monitor Level 0 loading
  useEffect(() => {
    if (GLOBAL_LOADED_TILES.has(level0Url)) {
      setIsLevel0Loaded(true);
      onBaseLoaded?.();
      return;
    }
    setIsLevel0Loaded(false);
    const img = new Image();
    const handleL0Done = (success: boolean) => {
      if (success) {
        GLOBAL_LOADED_TILES.add(level0Url);
      } else {
        GLOBAL_LOADED_TILES.delete(level0Url);
      }
      setIsLevel0Loaded(true);
      onBaseLoaded?.();
    };
    img.onload = () => handleL0Done(true);
    img.onerror = () => handleL0Done(false);
    img.src = level0Url;
    if (img.complete && img.naturalWidth > 0) {
      handleL0Done(true);
    }
  }, [level0Url, onBaseLoaded]);

  // Visible tiles that need to be fetched over the network
  const pendingTiles = useMemo(() => {
    if (currentLevel === 0) return [];
    return activeTiles.filter(
      (tile) => visibleKeys.has(tile.key) && !GLOBAL_LOADED_TILES.has(tile.url)
    );
  }, [currentLevel, activeTiles, visibleKeys]);

  // Monitor Higher-Level (L1/L2) Visible Tiles loading
  useEffect(() => {
    let isCancelled = false;

    if (currentLevel === 0 || pendingTiles.length === 0) {
      if (loadStartTimeRef.current !== null) {
        scheduleFinishLoading(() => isCancelled);
      } else {
        setIsTilesLoading(false);
      }
      return;
    }

    // New or continuing loading sequence: record start time if not already set
    if (loadStartTimeRef.current === null) {
      loadStartTimeRef.current = Date.now();
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    setIsTilesLoading(true);

    let remaining = pendingTiles.length;

    pendingTiles.forEach((tile) => {
      const img = new Image();
      const handleDone = (success: boolean) => {
        if (success) {
          GLOBAL_LOADED_TILES.add(tile.url);
        } else {
          GLOBAL_LOADED_TILES.delete(tile.url);
        }
        remaining--;
        if (remaining <= 0 && !isCancelled) {
          scheduleFinishLoading(() => isCancelled);
        }
      };

      img.onload = () => handleDone(true);
      img.onerror = () => handleDone(false);
      img.src = tile.url;

      // Only treat as immediately complete if actually decoded with valid dimensions
      if (img.complete && img.naturalWidth > 0) {
        handleDone(true);
      }
    });

    // 15-second safety fallback timeout
    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setIsTilesLoading(false);
        loadStartTimeRef.current = null;
      }
    }, 15000);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [currentLevel, pendingTiles]);

  const isLoading = !isLevel0Loaded || isTilesLoading;

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden bg-[#1a1d26] select-none ${className}`}
    >
      {/* Loading placeholder spinner so user sees dynamic feedback while level 0 tiles arrive */}
      {!isLevel0Loaded && !hideLoader && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#161822]/90 z-10 select-none pointer-events-none">
          <LottieLoader size={60} text="载入高精度地图中..." />
        </div>
      )}
      {/* 1. Level 0 Base Overview Layer (Loaded in ~50ms, permanently visible underneath) */}
      <img
        key={level0Url}
        src={level0Url}
        alt={title}
        onLoad={(e) => {
          if ((e.currentTarget as HTMLImageElement).naturalWidth > 0) {
            GLOBAL_LOADED_TILES.add(level0Url);
          }
          setIsLevel0Loaded(true);
          onBaseLoaded?.();
        }}
        onError={() => {
          GLOBAL_LOADED_TILES.delete(level0Url);
          setIsLevel0Loaded(true);
          onBaseLoaded?.();
        }}
        className="w-full h-full object-fill pointer-events-none select-none block map-image-layer"
        loading="eager"
        decoding="async"
      />

      {/* 2. Higher Level QuadTree Tiles (Rendered directly on top, instant paint as soon as decoded) */}
      {currentLevel > 0 &&
        activeTiles.map((tile) => {
          const isVisible = visibleKeys.has(tile.key);
          const isLoaded = GLOBAL_LOADED_TILES.has(tile.url);
          if (!isVisible && !isLoaded) return null;

          return (
            <div
              key={tile.key}
              style={tile.style}
              className="overflow-hidden pointer-events-none select-none"
            >
              <img
                src={tile.url}
                alt={`${title} - Tile L${tile.level} (${tile.row},${tile.col})`}
                onLoad={(e) => {
                  if ((e.currentTarget as HTMLImageElement).naturalWidth > 0) {
                    GLOBAL_LOADED_TILES.add(tile.url);
                  }
                }}
                onError={() => GLOBAL_LOADED_TILES.delete(tile.url)}
                className="w-full h-full object-fill pointer-events-none select-none block"
                loading="eager"
                decoding="async"
              />
            </div>
          );
        })}
    </div>
  );
};