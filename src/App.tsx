import { useState, useEffect } from 'react';
import type { ComparisonMode, MapThemeGroup, ViewportState, SplitDirection } from './types/map';
import { MAP_THEMES } from './data/maps';
import { Header } from './components/Header';
import { useThemeMode } from './hooks/useThemeMode';
import { SwipeCurtainView } from './components/SwipeCurtainView';
import { DualSyncView } from './components/DualSyncView';
import { OverlayFadeView } from './components/OverlayFadeView';
import { GalleryCarousel } from './components/GalleryCarousel';
import { DebugOverlay } from './components/DebugOverlay';
import { ChevronDown } from 'lucide-react';
import { nextZoomStep } from './utils/zoom';
import './App.css';

export function App() {
  const { theme, cycleTheme } = useThemeMode();
  const [mode, setMode] = useState<ComparisonMode>('swipe');

  // Active theme group (selected from the 11 themes)
  const [selectedTheme, setSelectedTheme] = useState<MapThemeGroup>(MAP_THEMES[0]);

  // Order swap state (false: Map A is Left/Bottom, true: Map B is Left/Bottom)
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  // Sub-direction states: swipe curtain (vertical/horizontal), dual sync view (horizontal/vertical)
  const [swipeDirection, setSwipeDirection] = useState<SplitDirection>('vertical');
  const [dualDirection, setDualDirection] = useState<SplitDirection>('horizontal');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.65);

  // Immersive / Fullscreen mode: collapse header bar to maximize map viewport
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

  // Independent viewports per comparison mode: preserve mode parameters on same map
  const [viewports, setViewports] = useState<Record<ComparisonMode, ViewportState>>({
    swipe: { scale: 1, x: 0, y: 0 },
    sync: { scale: 1, x: 0, y: 0 },
    overlay: { scale: 1, x: 0, y: 0 },
  });

  const handleModeViewportChange = (
    targetMode: ComparisonMode,
    value: ViewportState | ((prev: ViewportState) => ViewportState)
  ) => {
    setViewports((prev) => {
      const current = prev[targetMode];
      const updated = typeof value === 'function' ? value(current) : value;
      return {
        ...prev,
        [targetMode]: updated,
      };
    });
  };

  // Floating gallery drawer open/collapsed state (defaults to false for maximized map workspace!)
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  // Phone diagnostics panel: enabled if ?debug in URL or toggled via 5-tap easter egg on logo
  const [showDebug, setShowDebug] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).has('debug');
  });

  // Keyboard shortcut listener (Scheme 1: 1/2/3 mode switch, +/-/0 zoom, X/S swap, [/] opacity, F/G/Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Ignore when system modifier keys (Ctrl, Alt, Meta/Cmd) are held
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') {
        if (isGalleryOpen) {
          setIsGalleryOpen(false);
        } else if (isHeaderCollapsed) {
          setIsHeaderCollapsed(false);
        }
      } else if (e.key === 'g' || e.key === 'G') {
        setIsGalleryOpen((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsHeaderCollapsed((prev) => !prev);
      } else if (e.key === 'x' || e.key === 'X' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSwapOrder();
      } else if (e.key === '1') {
        e.preventDefault();
        if (mode === 'swipe') {
          setSwipeDirection((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'));
        } else {
          setMode('swipe');
        }
      } else if (e.key === '2') {
        e.preventDefault();
        if (mode === 'sync') {
          setDualDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'));
        } else {
          setMode('sync');
        }
      } else if (e.key === '3') {
        e.preventDefault();
        setMode('overlay');
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleModeViewportChange(mode, (prev) => {
          const nextScale = nextZoomStep(prev.scale, 1, 10);
          const ratio = nextScale / prev.scale;
          return {
            scale: nextScale,
            x: prev.x * ratio,
            y: prev.y * ratio,
          };
        });
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleModeViewportChange(mode, (prev) => {
          const nextScale = nextZoomStep(prev.scale, -1, 10);
          const ratio = nextScale / prev.scale;
          return {
            scale: nextScale,
            x: prev.x * ratio,
            y: prev.y * ratio,
          };
        });
      } else if (e.key === '0') {
        e.preventDefault();
        handleModeViewportChange(mode, () => ({ scale: 1, x: 0, y: 0 }));
      } else if (mode === 'overlay' && (e.key === '[' || e.key === '【')) {
        e.preventDefault();
        const step = e.shiftKey ? 0.1 : 0.05;
        setOverlayOpacity((prev) => Math.max(0, Math.round((prev - step) * 100) / 100));
      } else if (mode === 'overlay' && (e.key === ']' || e.key === '】')) {
        e.preventDefault();
        const step = e.shiftKey ? 0.1 : 0.05;
        setOverlayOpacity((prev) => Math.min(1, Math.round((prev + step) * 100) / 100));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 200 : 50;
        handleModeViewportChange(mode, (prev) => ({ ...prev, x: prev.x + step }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 200 : 50;
        handleModeViewportChange(mode, (prev) => ({ ...prev, x: prev.x - step }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.shiftKey ? 200 : 50;
        handleModeViewportChange(mode, (prev) => ({ ...prev, y: prev.y + step }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const step = e.shiftKey ? 200 : 50;
        handleModeViewportChange(mode, (prev) => ({ ...prev, y: prev.y - step }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, swipeDirection, dualDirection, isGalleryOpen, isHeaderCollapsed]);

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
    // Reset all modes to default initial viewport when switching map theme
    setViewports({
      swipe: { scale: 1, x: 0, y: 0 },
      sync: { scale: 1, x: 0, y: 0 },
      overlay: { scale: 1, x: 0, y: 0 },
    });
  };

  // Toggle order of Left vs Right / Bottom vs Top
  const handleSwapOrder = () => {
    setIsSwapped((prev) => !prev);
  };

  const zoomPercent = Math.round((viewports[mode]?.scale ?? 1) * 100);

  return (
    <div className="w-screen h-full flex flex-col bg-[#0c0d10] text-zinc-100 overflow-hidden select-none relative">
      {/* 1. Header Toolbar with smooth collapse transition */}
      <div
        className={`transition-all duration-300 ease-in-out z-40 overflow-hidden shrink-0 ${
          isHeaderCollapsed ? 'h-0 opacity-0 -translate-y-full pointer-events-none' : 'h-14 opacity-100 translate-y-0'
        }`}
      >
        <Header
          mode={mode}
          onModeChange={setMode}
          swipeDirection={swipeDirection}
          onToggleSwipeDirection={() =>
            setSwipeDirection((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'))
          }
          dualDirection={dualDirection}
          onToggleDualDirection={() =>
            setDualDirection((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'))
          }
          zoomPercent={zoomPercent}
          onSwapOrder={handleSwapOrder}
          isSwapped={isSwapped}
          isGalleryOpen={isGalleryOpen}
          onToggleGallery={() => setIsGalleryOpen((prev) => !prev)}
          themesCount={MAP_THEMES.length}
          onToggleDebug={() => setShowDebug((prev) => !prev)}
          onToggleHeaderCollapse={() => setIsHeaderCollapsed(true)}
          theme={theme}
          onCycleTheme={cycleTheme}
        />
      </div>

      {/* Floating Top Capsule to Restore Header when Collapsed */}
      {isHeaderCollapsed && (
        <button
          onClick={() => setIsHeaderCollapsed(false)}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1 rounded-full bg-themeCard/90 hover:bg-themeCard text-themeMuted hover:text-themeText border border-themeBorder/15 hover:border-amber-400/50 shadow-xl backdrop-blur-md text-xs font-medium cursor-pointer transition-all duration-200 group hover:scale-105 animate-in fade-in slide-in-from-top-2"
          title="展开顶部工具栏 (快捷键 F 或 Esc)"
        >
          <ChevronDown className="w-3.5 h-3.5 text-amber-400 group-hover:translate-y-0.5 transition-transform" />
          <span>展开工具栏</span>
          <span className="text-[10px] text-zinc-400 bg-white/10 px-1 rounded font-mono hidden sm:inline">F / Esc</span>
        </button>
      )}

      {/* 2. Main Comparison Viewport (Takes up flexible height, keep-alive across mode toggles for zero flash) */}
      <main className="flex-1 relative w-full h-full min-h-0 overflow-hidden bg-zinc-100 dark:bg-[#0c0d10] transition-colors duration-150">
        <div className={`absolute inset-0 ${mode === 'swipe' ? 'block' : 'hidden'}`}>
          <SwipeCurtainView
            baseMap={selectedTheme.baseMap}
            reproductionMap={selectedTheme.reproductionMap}
            orientation={selectedTheme.orientation}
            aspectRatio={selectedTheme.aspectRatio}
            viewport={viewports.swipe}
            setViewport={(v) => handleModeViewportChange('swipe', v)}
            isSwapped={isSwapped}
            direction={swipeDirection}
          />
        </div>

        <div className={`absolute inset-0 ${mode === 'sync' ? 'block' : 'hidden'}`}>
          <DualSyncView
            baseMap={selectedTheme.baseMap}
            reproductionMap={selectedTheme.reproductionMap}
            orientation={selectedTheme.orientation}
            aspectRatio={selectedTheme.aspectRatio}
            viewport={viewports.sync}
            setViewport={(v) => handleModeViewportChange('sync', v)}
            isSwapped={isSwapped}
            direction={dualDirection}
          />
        </div>

        <div className={`absolute inset-0 ${mode === 'overlay' ? 'block' : 'hidden'}`}>
          <OverlayFadeView
            baseMap={selectedTheme.baseMap}
            reproductionMap={selectedTheme.reproductionMap}
            orientation={selectedTheme.orientation}
            aspectRatio={selectedTheme.aspectRatio}
            viewport={viewports.overlay}
            setViewport={(v) => handleModeViewportChange('overlay', v)}
            isSwapped={isSwapped}
            opacity={overlayOpacity}
            onOpacityChange={setOverlayOpacity}
          />
        </div>

        {/* Mobile zoom readout (desktop keeps the header pill; the bottom-left curtain gauge is desktop-only too) */}
        <div className="lg:hidden absolute bottom-3 left-3 z-20 pointer-events-none select-none bg-themeCard/70 px-2 py-1 rounded-lg border border-themeBorder/15 text-[10px] font-mono text-themeMuted shadow-md">
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

      {showDebug && <DebugOverlay onClose={() => setShowDebug(false)} />}
    </div>
  );
}

export default App;
