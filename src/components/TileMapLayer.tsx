import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { MapOrientation, ViewportState } from '../types/map';

interface TileMapLayerProps {
  tilePath: string;
  title: string;
  orientation?: MapOrientation;
  viewport?: ViewportState;
  className?: string;
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
    1: { cols: 3, rows: 2 }, // 6 tiles, aspect 0.94:1 (near-square)
    2: { cols: 6, rows: 4 }, // 24 tiles, aspect 0.94:1 (near-square)
  },
  vertical: {
    1: { cols: 2, rows: 2 }, // 4 tiles, aspect 0.85:1
    2: { cols: 4, rows: 5 }, // 20 tiles, aspect 1.06:1 (near-square)
  },
};

export const TileMapLayer: React.FC<TileMapLayerProps> = ({
  tilePath,
  title,
  orientation = 'horizontal',
  viewport,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedTiles, setLoadedTiles] = useState<Record<string, boolean>>({});

  // Reset tile cache when tilePath changes
  useEffect(() => {
    setLoadedTiles({});
  }, [tilePath]);

  const scale = viewport?.scale ?? 1;

  // Level determination:
  // Level 0: scale < 1.35 (Instant overview)
  // Level 1: 1.35 <= scale < 2.8 (Near-square regional tiles)
  // Level 2: scale >= 2.8 (Ultra-high-res near-square tiles)
  const currentLevel = useMemo(() => {
    if (scale < 1.35) return 0;
    if (scale < 2.8) return 1;
    return 2;
  }, [scale]);

  // Compute active tiles for Level 1 or Level 2
  const activeTiles = useMemo(() => {
    if (currentLevel === 0) return [];

    const effectiveOrientation: MapOrientation = orientation || 'horizontal';
    const config = GRID_CONFIGS[effectiveOrientation][currentLevel as 1 | 2];
    const { cols, rows } = config;

    const stepX = 1 / cols;
    const stepY = 1 / rows;
    const tiles: TileInfo[] = [];

    // For Level 1 (only 4~6 tiles, ~200-400KB total), preload all tiles for silky smooth panning
    if (currentLevel === 1) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${tilePath}_1_${r}_${c}`;
          const url = `${tilePath}/1/${r}_${c}.webp`;
          tiles.push({
            key,
            level: 1,
            row: r,
            col: c,
            url,
            style: {
              position: 'absolute',
              top: `${r * stepY * 100}%`,
              left: `${c * stepX * 100}%`,
              width: `${stepX * 100}%`,
              height: `${stepY * 100}%`,
            },
          });
        }
      }
      return tiles;
    }

    // For Level 2 (20~24 tiles), load only tiles intersecting screen viewport + buffer
    const el = containerRef.current;
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 1080;

    let uMin = 0;
    let uMax = 1;
    let vMin = 0;
    let vMax = 1;
    const buffer = 0.2; // 20% preload buffer around viewport edges

    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        uMin = Math.max(0, -rect.left / rect.width - buffer);
        uMax = Math.min(1, (winW - rect.left) / rect.width + buffer);
        vMin = Math.max(0, -rect.top / rect.height - buffer);
        vMax = Math.min(1, (winH - rect.top) / rect.height + buffer);
      }
    }

    for (let r = 0; r < rows; r++) {
      const tileTop = r * stepY;
      const tileBottom = (r + 1) * stepY;
      if (tileBottom < vMin || tileTop > vMax) continue;

      for (let c = 0; c < cols; c++) {
        const tileLeft = c * stepX;
        const tileRight = (c + 1) * stepX;
        if (tileRight < uMin || tileLeft > uMax) continue;

        const key = `${tilePath}_${currentLevel}_${r}_${c}`;
        const url = `${tilePath}/${currentLevel}/${r}_${c}.webp`;

        tiles.push({
          key,
          level: currentLevel,
          row: r,
          col: c,
          url,
          style: {
            position: 'absolute',
            top: `${tileTop * 100}%`,
            left: `${tileLeft * 100}%`,
            width: `${stepX * 100}%`,
            height: `${stepY * 100}%`,
          },
        });
      }
    }

    return tiles;
  }, [currentLevel, tilePath, orientation, scale, viewport?.x, viewport?.y]);

  const handleTileLoad = (key: string) => {
    setLoadedTiles((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const level0Url = `${tilePath}/0/0_0.webp`;

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden bg-[#1a1d26] select-none ${className}`}
    >
      {/* 1. Level 0 Base Overview Layer (Loaded in ~50ms, permanently visible underneath) */}
      <img
        key={level0Url}
        src={level0Url}
        alt={title}
        className="w-full h-full object-fill pointer-events-none select-none block map-image-layer"
        style={{
          imageRendering: '-webkit-optimize-contrast',
        }}
        loading="eager"
        decoding="async"
      />

      {/* 2. Higher Level QuadTree Tiles (Smooth progressive fade-in on top of Level 0) */}
      {currentLevel > 0 &&
        activeTiles.map((tile) => {
          const isReady = !!loadedTiles[tile.key];
          return (
            <div
              key={tile.key}
              style={tile.style}
              className="overflow-hidden pointer-events-none select-none"
            >
              <img
                src={tile.url}
                alt={`${title} - Tile L${tile.level} (${tile.row},${tile.col})`}
                onLoad={() => handleTileLoad(tile.key)}
                className={`w-full h-full object-fill pointer-events-none select-none block transition-opacity duration-200 ${
                  isReady ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                }}
                loading="eager"
                decoding="async"
              />
            </div>
          );
        })}
    </div>
  );
};