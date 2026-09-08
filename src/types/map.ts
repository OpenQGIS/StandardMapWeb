export type MapOrientation = 'horizontal' | 'vertical';

export type ComparisonMode = 'swipe' | 'sync' | 'overlay';

export type MapCategory =
  | 'standard'
  | 'antique'
  | 'landscape'
  | 'lithograph'
  | 'relief'
  | 'night'
  | 'minimal'
  | 'nautical'
  | 'river'
  | 'gold';

export interface MapLayer {
  id: string;
  title: string;
  subtitle: string;
  type: 'base' | 'reproduction';
  scaleText: string;
  year: string;
  approvalCode?: string;
  category: MapCategory;
  categoryLabel: string;
  description: string;
  imageUrl?: string;
  tilePath?: string;
}


export type RegionScope = 'china' | 'continents' | 'world';

export interface MapThemeGroup {
  id: string;
  title: string;
  subtitle: string;
  regionScope: RegionScope;
  regionScopeLabel: string;
  orientation: MapOrientation;
  aspectRatio: string;
  tag: string;
  description: string;
  thumbnailUrl?: string;       // 画廊轻量缩略图 (0-缩略图)
  baseMap: MapLayer;           // 图 A (基准底图)
  reproductionMap: MapLayer;   // 图 B (成对复刻图)
}

export interface ViewportState {
  scale: number;
  x: number;
  y: number;
}

/** Normalized horizontal window [0..1] of the view container that is actually visible */
export interface TileClipWindow {
  minX: number;
  maxX: number;
}
