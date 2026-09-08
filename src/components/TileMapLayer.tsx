import React, { useMemo, useState, useEffect, useRef } from 'react';
import type { MapOrientation, ViewportState } from '../types/map';
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
}) => {
  const scale = viewport?.scale ?? 1;

  // Level determination:
  // Level 0: scale < 1.15 (Instant overview, 1 tile)
  // Level 1: 1.15 <= scale < 2.0 (Regional near-square tiles, 4~6 tiles)
  // Level 2: scale >= 2.0 (Ultra-high-res near-square tiles, 20~24 tiles)
  const currentLevel = useMemo(() => {
    if (scale < 1.15) return 0;
    if (scale < 2.0) return 1;
    return 2;
  }, [scale]);

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

  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(() => new Set());

  // Viewport Culling: calculate which tiles intersect the visible screen area
  useEffect(() => {
    if (currentLevel === 0) {
      setVisibleKeys(new Set());
      return;
    }

    const updateVisibility = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const margin = 120; // 120px prefetch buffer around screen boundaries

      const effectiveOrientation: MapOrientation = orientation || 'horizontal';
      const config = GRID_CONFIGS[effectiveOrientation][currentLevel as 1 | 2];
      if (!config) return;
      const { cols, rows } = config;

      const nextVisible = new Set<string>();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tileLeft = rect.left + (c / cols) * rect.width;
          const tileRight = rect.left + ((c + 1) / cols) * rect.width;
          const tileTop = rect.top + (r / rows) * rect.height;
          const tileBottom = rect.top + ((r + 1) / rows) * rect.height;

          if (
            tileRight >= -margin &&
            tileLeft <= screenW + margin &&
            tileBottom >= -margin &&
            tileTop <= screenH + margin
          ) {
            nextVisible.add(`${tilePath}_${currentLevel}_${r}_${c}`);
          }
        }
      }

      setVisibleKeys(nextVisible);
    };

    updateVisibility();
    window.addEventListener('resize', updateVisibility);
    return () => window.removeEventListener('resize', updateVisibility);
  }, [viewport?.scale, viewport?.x, viewport?.y, currentLevel, orientation, tilePath]);

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
      (tile) =>
        (visibleKeys.size === 0 || visibleKeys.has(tile.key)) &&
        !GLOBAL_LOADED_TILES.has(tile.url)
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
          const isVisible = visibleKeys.size === 0 || visibleKeys.has(tile.key);
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