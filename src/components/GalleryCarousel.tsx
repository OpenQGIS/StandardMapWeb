import React, { useRef, useState, useEffect } from 'react';
import type { MapThemeGroup, RegionScope } from '../types/map';
import { MapSvg } from './MapSvg';
import { ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { GalleryIcon } from './CustomIcons';

interface GalleryCarouselProps {
  themes: MapThemeGroup[];
  selectedTheme: MapThemeGroup;
  onSelectTheme: (theme: MapThemeGroup) => void;
  isSwapped: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
}

const getThemeRatio = (ratioStr: string): number => {
  const parts = ratioStr.split('/').map(Number);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return parts[0] / parts[1];
  }
  return 1;
};

const getShortTitle = (title: string): string => {
  if (title.includes('横版')) return '中国地图 · 横版';
  if (title.includes('竖版')) return '中国地图 · 竖版';
  if (title.includes('多圆锥')) return '世界 · 多圆锥';
  if (title.includes('墨卡托')) return '世界 · 墨卡托';
  const match = title.match(/^([^·\s]+)/);
  return match ? match[1] : title;
};

export const GalleryCarousel: React.FC<GalleryCarouselProps> = ({
  themes,
  selectedTheme,
  onSelectTheme,
  isSwapped,
  isOpen,
  onToggleOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | RegionScope>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredThemes = themes.filter((theme) => {
    if (filter === 'all') return true;
    return theme.regionScope === filter;
  });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Enable mouse wheel scrolling horizontally across the gallery cards
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      // If native horizontal gesture (trackpad), let the browser handle naturally
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      // Convert vertical mouse wheel (deltaY) into horizontal scroll & prevent background map zooming
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  return (
    <>
      {/* 1. Floating Capsule Toggle Button at Bottom Center (when drawer is closed) */}
      {!isOpen && (
        <div className="fixed bottom-3 min-[500px]:bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center justify-center max-w-[calc(100vw-124px)] min-[500px]:max-w-[calc(100vw-160px)] md:max-w-none">
          <button
            onClick={onToggleOpen}
            className="group flex items-center gap-1.5 min-[500px]:gap-2 sm:gap-2.5 px-2.5 min-[500px]:px-3.5 sm:px-4 py-1 min-[500px]:py-1.5 sm:py-2 rounded-full bg-panelSub/60 hover:bg-panelSub/80 text-zinc-200 hover:text-amber-400 border border-zinc-700/50 hover:border-amber-500/60 shadow-lg transition-all duration-200 cursor-pointer hover:shadow-amber-500/10 hover:scale-[1.02] max-w-full"
            title="展开地图画廊 (快捷键 G)"
          >
            <GalleryIcon className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-xs font-semibold hidden md:inline">地图画廊</span>
            <span className="text-zinc-600 text-xs hidden md:inline">|</span>
            <span className="text-[10px] min-[500px]:text-[11px] text-zinc-300 group-hover:text-zinc-100 transition-colors font-medium truncate max-w-[130px] min-[380px]:max-w-[170px] min-[500px]:max-w-[260px] md:max-w-none">
              {selectedTheme.title}
            </span>
            <ChevronUp className="w-3 h-3 min-[500px]:w-3.5 min-[500px]:h-3.5 text-zinc-400 group-hover:text-amber-400 group-hover:-translate-y-0.5 transition-all shrink-0" />
          </button>
        </div>
      )}

      {/* 2. Backdrop Overlay when open (Click outside on map to collapse) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/35 backdrop-blur-[1px] transition-opacity duration-300 cursor-pointer"
          title="点击视口空白处收起画廊"
        />
      )}

      {/* 3. Floating Drawer Panel (Completely hidden & overflow-clipped when closed) */}
      <section
        className={`fixed bottom-0 inset-x-0 z-40 bg-[#12141a]/95 backdrop-blur-xl border-t border-zinc-700/80 shadow-[0_-12px_40px_rgba(0,0,0,0.7)] flex flex-col select-none transition-all duration-300 ease-out h-[155px] sm:h-[185px] overflow-hidden ${
          isOpen ? 'translate-y-0 opacity-100 visible' : 'translate-y-full opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Gallery Header Bar (Strictly single row, non-wrapping) */}
        <div className="h-8 sm:h-9 px-2.5 sm:px-4 border-b border-border/60 flex items-center justify-between text-xs bg-panelSub/60 shrink-0 gap-2 overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <span className="font-semibold text-zinc-200 flex items-center gap-1 shrink-0">
              <GalleryIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">地图画廊</span>
            </span>

            {/* Region Scope Filter Pills */}
            {(() => {
              const availableScopes = new Set(themes.map((t) => t.regionScope));
              const tabs = ([
                { key: 'all', label: '全部' },
                { key: 'china', label: '中国' },
                { key: 'continents', label: '七大洲' },
                { key: 'world', label: '全球' },
              ] as const).filter((tab) => tab.key === 'all' || availableScopes.has(tab.key));

              if (tabs.length <= 2) {
                return (
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-medium border border-zinc-700/60">
                    中国标准地图 ({themes.length}组)
                  </span>
                );
              }

              return (
                <div className="flex items-center bg-surface p-0.5 rounded-md border border-border shrink-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setFilter(tab.key)}
                      className={`px-1.5 sm:px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium transition-colors ${
                        filter === tab.key
                          ? 'bg-zinc-800 text-amber-400 shadow-sm border border-zinc-700/60 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Current Active Theme & Scroll Arrows & Collapse Button */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-zinc-400 shrink-0">
            <div className="hidden xl:flex items-center gap-1 text-[11px] font-mono">
              <span>当前:</span>
              <span className="text-amber-400 font-semibold truncate max-w-[150px]">{selectedTheme.title}</span>
              {isSwapped && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                  (已调换)
                </span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                title="向左滚动"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                title="向右滚动"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Collapse Gallery Button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-400 border border-zinc-700 hover:border-zinc-600 transition-colors text-xs font-medium cursor-pointer shadow-sm"
              title="收起画廊 (快捷键 Esc / G)"
            >
              <span className="hidden sm:inline">收起画廊</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cards Scroll Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden px-2.5 py-1.5 sm:px-4 sm:py-2 flex items-center gap-2 sm:gap-3 scrollbar-thin"
        >
          {filteredThemes.map((theme) => {
            const isSelected = selectedTheme.id === theme.id;
            const ratio = getThemeRatio(theme.aspectRatio);

            return (
              <div
                key={theme.id}
                onClick={() => {
                  if (isSelected) {
                    onClose();
                  } else {
                    onSelectTheme(theme);
                  }
                }}
                onDoubleClick={() => {
                  onSelectTheme(theme);
                  onClose();
                }}
                className={`flex-shrink-0 h-full rounded-xl p-1.5 sm:p-2 cursor-pointer transition-all duration-150 flex flex-col items-center justify-between group ${
                  isSelected
                    ? 'bg-zinc-800/95 ring-2 ring-amber-500/90 border-transparent shadow-2xl scale-[1.01]'
                    : 'bg-surface hover:bg-zinc-800/60 border border-border hover:border-zinc-700 shadow-md'
                }`}
                style={{
                  width: `calc(var(--gallery-img-h) * ${ratio} + var(--gallery-card-pad))`,
                }}
                title={isSelected ? '已处于当前对比中 (点击可收起画廊)' : '单击载入对比，双击载入并收起'}
              >
                {/* Card Picture Frame (100% snugly matches the image with zero empty borders!) */}
                <div
                  className="h-[76px] sm:h-[92px] w-full rounded-lg overflow-hidden flex items-center justify-center bg-zinc-950 relative border border-zinc-800/80 shadow-md group-hover:border-zinc-700 transition-colors pointer-events-none"
                >
                  {(theme.thumbnailUrl || theme.baseMap.imageUrl || theme.reproductionMap.imageUrl) ? (
                    <img
                      src={theme.thumbnailUrl || theme.baseMap.imageUrl || theme.reproductionMap.imageUrl}
                      alt={theme.title}
                      className="w-full h-full object-cover pointer-events-none select-none block"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <MapSvg item={theme.baseMap} orientation={theme.orientation} />
                  )}

                  {/* Real image badge */}
                  {theme.tag === '实图对比' && (
                    <span className="absolute bottom-1 left-1 text-[7.5px] sm:text-[8px] font-semibold px-1 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-600/70 hidden xs:inline-block">
                      实图
                    </span>
                  )}

                  {/* Region Tag (中国 / 七大洲 / 全球) */}
                  <div className="absolute top-1 left-1 z-10">
                    <span
                      className={`text-[7.5px] sm:text-[9px] font-semibold px-1 py-0.2 rounded shadow ${
                        theme.regionScope === 'china'
                          ? 'bg-red-950/85 text-red-300 border border-red-800/60'
                          : theme.regionScope === 'continents'
                          ? 'bg-blue-950/85 text-blue-300 border border-blue-800/60'
                          : 'bg-emerald-950/85 text-emerald-300 border border-emerald-800/60'
                      }`}
                    >
                      {theme.regionScopeLabel}
                    </span>
                  </div>

                  {/* Active Checkmark */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 z-10 bg-amber-500 text-black rounded-full p-0.5 shadow-md">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Card Title: simple, concise, snug to card width */}
                <h4
                  className="text-[10px] sm:text-[11px] font-medium text-zinc-200 truncate group-hover:text-amber-400 transition-colors text-center mt-1 px-0.5 w-full block"
                  title={theme.title}
                >
                  {getShortTitle(theme.title)}
                </h4>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};
