import React, { useMemo } from 'react';
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
    1: { cols: 3, rows: 2 }, // 6 tiles
    2: { cols: 6, rows: 4 }, // 24 tiles
  },
  vertical: {
    1: { cols: 2, rows: 2 }, // 4 tiles
    2: { cols: 4, rows: 5 }, // 20 tiles
  },
};

export const TileMapLayer: React.FC<TileMapLayerProps> = ({
  tilePath,
  title,
  orientation = 'horizontal',
  viewport,
  className = '',
}) => {
  const scale = viewport?.scale ?? 1;

  // Level determination:
  // Level 0: scale < 1.35 (Instant overview, 1 tile)
  // Level 1: 1.35 <= scale < 2.8 (Regional near-square tiles, 4~6 tiles)
  // Level 2: scale >= 2.8 (Ultra-high-res near-square tiles, 20~24 tiles)
  const currentLevel = useMemo(() => {
    if (scale < 1.35) return 0;
    if (scale < 2.8) return 1;
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

  return (
    <div
      className={`w-full h-full relative overflow-hidden bg-[#1a1d26] select-none ${className}`}
    >
      {/* 1. Level 0 Base Overview Layer (Loaded in ~50ms, permanently visible underneath) */}
      <img
        key={level0Url}
        src={level0Url}
        alt={title}
        className="w-full h-full object-fill pointer-events-none select-none block map-image-layer"
        loading="eager"
        decoding="async"
      />

      {/* 2. Higher Level QuadTree Tiles (Rendered directly on top, instant paint as soon as decoded) */}
      {currentLevel > 0 &&
        activeTiles.map((tile) => (
          <div
            key={tile.key}
            style={tile.style}
            className="overflow-hidden pointer-events-none select-none"
          >
            <img
              src={tile.url}
              alt={`${title} - Tile L${tile.level} (${tile.row},${tile.col})`}
              className="w-full h-full object-fill pointer-events-none select-none block"
              loading="eager"
              decoding="async"
            />
          </div>
        ))}
    </div>
  );
};