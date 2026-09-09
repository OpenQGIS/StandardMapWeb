import { useState, useEffect } from 'react';
import type { ComparisonMode, MapThemeGroup, ViewportState } from './types/map';
import { MAP_THEMES } from './data/maps';
import { Header } from './components/Header';
import { SwipeCurtainView } from './components/SwipeCurtainView';
import { DualSyncView } from './components/DualSyncView';
import { OverlayFadeView } from './components/OverlayFadeView';
import { GalleryCarousel } from './components/GalleryCarousel';
import { DebugOverlay } from './components/DebugOverlay';
import './App.css';

export function App() {
  const [mode, setMode] = useState<ComparisonMode>('swipe');

  // Active theme group (selected from the 11 themes)
  const [selectedTheme, setSelectedTheme] = useState<MapThemeGroup>(MAP_THEMES[0]);

  // Order swap state (false: Map A is Left/Bottom, true: Map B is Left/Bottom)
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  // Synchronized viewport pan & zoom state
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 1,
    x: 0,
    y: 0,
  });

  // Floating gallery drawer open/collapsed state (defaults to false for maximized map workspace!)
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  // Phone diagnostics panel, only with ?debug=1 in the URL
  const showDebug = new URLSearchParams(window.location.search).has('debug');

  // Keyboard shortcut listener: 'G' toggles gallery, 'Esc' closes it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        if (isGalleryOpen) setIsGalleryOpen(false);
      } else if (e.key === 'g' || e.key === 'G') {
        setIsGalleryOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen]);

  // Preload other map images in background so switching between horizontal & vertical is instantaneous!
  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      MAP_THEMES.forEach((theme) => {
        if (theme.baseMap.imageUrl) {
          const img1 = new Image();
          img1.src = theme.baseMap.imageUrl;
        }
        if (theme.reproductionMap.imageUrl) {
          const img2 = new Image();
          img2.src = theme.reproductionMap.imageUrl;
        }
      });
    }, 1000);
    return () => clearTimeout(preloadTimer);
  }, []);

  // Select a whole theme group (all 2 paired maps load together)
  const handleSelectTheme = (theme: MapThemeGroup) => {
    setSelectedTheme(theme);
    setIsSwapped(false);
    setViewport({ scale: 1, x: 0, y: 0 });
  };

  // Toggle order of Left vs Right / Bottom vs Top
  const handleSwapOrder = () => {
    setIsSwapped((prev) => !prev);
  };

  const zoomPercent = Math.round(viewport.scale * 100);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0c0d10] text-zinc-100 overflow-hidden select-none">
      {/* 1. Header Toolbar */}
      <Header
        mode={mode}
        onModeChange={setMode}
        zoomPercent={zoomPercent}
        onSwapOrder={handleSwapOrder}
        isSwapped={isSwapped}
        isGalleryOpen={isGalleryOpen}
        onToggleGallery={() => setIsGalleryOpen((prev) => !prev)}
        themesCount={MAP_THEMES.length}
      />

      {/* 2. Main Comparison Viewport (Takes up flexible height) */}
      <main className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
        {mode === 'swipe' && (
          <SwipeCurtainView
            baseMap={selectedTheme.baseMap}
            reproductionMap={selectedTheme.reproductionMap}
            orientation={selectedTheme.orientation}
            aspectRatio={selectedTheme.aspectRatio}
            viewport={viewport}
            setViewport={setViewport}
            isSwapped={isSwapped}
          />
        )}

        {mode === 'sync' && (
          <DualSyncView
            baseMap={selectedTheme.baseMap}
            reproductionMap={selectedTheme.reproductionMap}
            orientation={selectedTheme.orientation}
            aspectRatio={selectedTheme.aspectRatio}
            viewport={viewport}
            setViewport={setViewport}
            isSwapped={isSwapped}
          />
        )}

        {mode === 'overlay' && (
          <OverlayFadeView
            baseMap={selectedTheme.baseMap}
            reproductionMap={selectedTheme.reproductionMap}
            orientation={selectedTheme.orientation}
            aspectRatio={selectedTheme.aspectRatio}
            viewport={viewport}
            setViewport={setViewport}
            isSwapped={isSwapped}
          />
        )}

        {/* Mobile zoom readout (desktop keeps the header pill; the bottom-left curtain gauge is desktop-only too) */}
        <div className="lg:hidden absolute bottom-3 left-3 z-20 pointer-events-none select-none bg-panelSub/60 px-2 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-zinc-300 shadow-md">
          缩放 <span className="text-zinc-100 font-semibold">{zoomPercent}%</span>
        </div>
      </main>

      {/* 3. Floating Collapsible Themes Gallery (22 maps in pairs) */}
      <GalleryCarousel
        themes={MAP_THEMES}
        selectedTheme={selectedTheme}
        onSelectTheme={handleSelectTheme}
        isSwapped={isSwapped}
        isOpen={isGalleryOpen}
        onToggleOpen={() => setIsGalleryOpen((prev) => !prev)}
        onClose={() => setIsGalleryOpen(false)}
      />

      {showDebug && <DebugOverlay />}
    </div>
  );
}

export default App;
