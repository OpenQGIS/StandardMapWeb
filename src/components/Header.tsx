import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { ComparisonMode, SplitDirection } from '../types/map';
import type { ThemeMode } from '../hooks/useThemeMode';
import { Info, ExternalLink, ChevronUp } from 'lucide-react';
import { RollingShutterIcon, DualWindowIcon, LayerOverlayIcon, GalleryIcon, SwapLeftAndRightIcon, ThemeAutoIcon, ThemeLightIcon, ThemeDarkIcon } from './CustomIcons';
import { Tooltip } from './Tooltip';

interface HeaderProps {
  mode: ComparisonMode;
  onModeChange: (mode: ComparisonMode) => void;
  swipeDirection: SplitDirection;
  onToggleSwipeDirection: () => void;
  dualDirection: SplitDirection;
  onToggleDualDirection: () => void;
  zoomPercent: number;
  onSwapOrder: () => void;
  isSwapped: boolean;
  isGalleryOpen: boolean;
  onToggleGallery: () => void;
  themesCount?: number;
  onToggleDebug?: () => void;
  onToggleHeaderCollapse?: () => void;
  theme: ThemeMode;
  onCycleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  swipeDirection,
  onToggleSwipeDirection,
  dualDirection,
  onToggleDualDirection,
  zoomPercent,
  onSwapOrder,
  isSwapped,
  isGalleryOpen,
  onToggleGallery,
  themesCount = 2,
  onToggleDebug,
  onToggleHeaderCollapse,
  theme,
  onCycleTheme,
}) => {
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const tapCountRef = React.useRef(0);
  const lastTapTimeRef = React.useRef(0);

  const handleBrandingClick = () => {
    const now = Date.now();
    if (now - lastTapTimeRef.current > 2500) {
      tapCountRef.current = 1;
    } else {
      tapCountRef.current += 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate?.([40, 60, 40]);
        } catch {
          // ignore
        }
      }
      onToggleDebug?.();
    }
  };

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-border bg-white/95 dark:bg-panelSub/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between z-30 select-none shadow-sm relative transition-colors duration-150">
      {/* Left: Branding & Compliance Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          onClick={handleBrandingClick}
          className="flex items-center gap-2 cursor-pointer group"
          title="标准地图与复刻地图对比平台"
        >
          <div className="relative flex items-center justify-center">
            <img
              src="./icons/webicon.svg"
              alt="Logo"
              className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform shrink-0"
            />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
              <span className="hidden md:inline">标准地图/复刻地图</span>
              <span className="inline md:hidden max-[420px]:hidden">标准/复刻</span>
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight hidden xl:block whitespace-nowrap">
              左右顺序一键切换 视口联动缩放
            </p>
          </div>
        </div>

        <Tooltip content="标准地图与复刻地图对比说明" position="bottom">
          <button
            onClick={() => setShowComplianceModal(true)}
            className="flex items-center justify-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 p-1.5 sm:px-2 sm:py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 transition-colors ml-0.5 sm:ml-1 cursor-pointer min-w-[31px] min-h-[31px]"
          >
            <Info className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span className="hidden xl:inline">地图说明</span>
          </button>
        </Tooltip>
      </div>

      {/* Center: Comparison Mode Switcher */}
      <div className="flex items-center bg-zinc-100/90 dark:bg-surface border border-zinc-200/90 dark:border-border p-1 rounded-lg">
        <Tooltip
          content={
            mode === 'swipe'
              ? swipeDirection === 'vertical'
                ? '卷帘对比: 垂直分割线 (再次点击切换为水平分割线)'
                : '卷帘对比: 水平分割线 (再次点击切换为垂直分割线)'
              : '卷帘对比 (点击激活)'
          }
          position="bottom"
          shortcut="1"
        >
          <button
            onClick={() => {
              if (mode === 'swipe') {
                onToggleSwipeDirection();
              } else {
                onModeChange('swipe');
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:px-3 rounded-md text-xs font-medium transition-all ${
              mode === 'swipe'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RollingShutterIcon
              className={`w-[18px] h-[18px] sm:w-4 sm:h-4 transition-transform duration-200 ${
                mode === 'swipe' && swipeDirection === 'horizontal' ? 'rotate-90 text-amber-400' : ''
              }`}
            />
            <span className="hidden lg:inline">
              {mode === 'swipe' && swipeDirection === 'horizontal' ? '卷帘(水平)' : '卷帘对比'}
            </span>
          </button>
        </Tooltip>

        <Tooltip
          content={
            mode === 'sync'
              ? dualDirection === 'horizontal'
                ? '双屏联动: 左右双屏 (再次点击切换为上下双屏)'
                : '双屏联动: 上下双屏 (再次点击切换为左右双屏)'
              : '双屏联动 (点击激活)'
          }
          position="bottom"
          shortcut="2"
        >
          <button
            onClick={() => {
              if (mode === 'sync') {
                onToggleDualDirection();
              } else {
                onModeChange('sync');
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:px-3 rounded-md text-xs font-medium transition-all ${
              mode === 'sync'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DualWindowIcon
              className={`w-[18px] h-[18px] sm:w-4 sm:h-4 transition-transform duration-200 ${
                mode === 'sync' && dualDirection === 'vertical' ? 'rotate-90 text-amber-400' : ''
              }`}
            />
            <span className="hidden lg:inline">
              {mode === 'sync' && dualDirection === 'vertical' ? '双屏(上下)' : '双屏联动'}
            </span>
          </button>
        </Tooltip>

        <Tooltip content="透明叠置对比 (连续透明度滑动渐变)" position="bottom" shortcut="3">
          <button
            onClick={() => onModeChange('overlay')}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:px-3 rounded-md text-xs font-medium transition-all ${
              mode === 'overlay'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayerOverlayIcon className="w-[18px] h-[18px] sm:w-4 sm:h-4" />
            <span className="hidden lg:inline">透明叠置</span>
          </button>
        </Tooltip>
      </div>

      {/* Right: Swap Order & Viewport State & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Swap Map Order Button (互换左右/上下图/底表层顺序) */}
        <Tooltip
          content={
            mode === 'sync'
              ? dualDirection === 'vertical'
                ? isSwapped
                  ? '上下地图位置已互换 (快捷键 X / S)'
                  : '对调上下双屏位置'
                : isSwapped
                ? '左右地图位置已互换 (快捷键 X / S)'
                : '对调左右双屏位置'
              : isSwapped
              ? '图层已对调 (快捷键 X / S)'
              : '对调图层'
          }
          position="bottom"
          shortcut="X"
        >
          <button
            onClick={onSwapOrder}
            className={`group flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded text-xs font-medium transition-all border ${
              isSwapped
                ? 'bg-amber-500/20 text-[#fbbf24] border-amber-500/50 shadow-sm'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-zinc-100'
            }`}
          >
            <SwapLeftAndRightIcon
              className={`w-[18px] h-[18px] sm:w-4 sm:h-4 transition-colors ${
                isSwapped ? 'text-[#fbbf24]' : 'text-zinc-400 group-hover:text-zinc-200'
              }`}
            />
            <span className="hidden lg:inline">
              {mode === 'sync'
                ? dualDirection === 'vertical'
                  ? '互换上下图'
                  : '互换左右图'
                : '对调图层'}
            </span>
            {isSwapped && <span className="text-[10px] text-[#fbbf24] font-mono hidden lg:inline">(已调换)</span>}
          </button>
        </Tooltip>

        <div className="hidden lg:block text-[11px] font-mono text-zinc-400 bg-surface px-2.5 py-1 rounded border border-border">
          缩放: <span className="text-zinc-200 font-semibold">{zoomPercent}%</span>
        </div>

        {/* Toggle Floating Gallery Button */}
        <Tooltip content="展开或收起底部浮动地图画廊" position="bottom" shortcut="G">
          <button
            onClick={onToggleGallery}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded text-xs font-medium transition-all border ${
              isGalleryOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-750'
            }`}
          >
            <GalleryIcon className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden lg:inline">地图画廊</span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-200 dark:bg-surface text-zinc-600 dark:text-zinc-400 px-1 rounded border border-zinc-300 dark:border-border">{themesCount}</span>
          </button>
        </Tooltip>

        {/* Three-State Theme Mode Switcher */}
        <Tooltip
          content={
            theme === 'system'
              ? '主题: 系统 (点击切换为浅色)'
              : theme === 'light'
              ? '主题: 浅色 (点击切换为深色)'
              : '主题: 深色 (点击切换为系统)'
          }
          position="bottom"
        >
          <button
            onClick={onCycleTheme}
            className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded text-xs font-medium transition-all border bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-750 cursor-pointer min-w-[31px] min-h-[31px]"
            aria-label="切换主题风格"
          >
            {theme === 'system' && (
              <ThemeAutoIcon className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            )}
            {theme === 'light' && (
              <ThemeLightIcon className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            )}
            {theme === 'dark' && (
              <ThemeDarkIcon className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            )}
            <span className="hidden xl:inline">
              {theme === 'system' ? '系统' : theme === 'light' ? '浅色' : '深色'}
            </span>
          </button>
        </Tooltip>

        {/* Collapse Header Button (沉浸纯净模式 / 全屏) */}
        {onToggleHeaderCollapse && (
          <Tooltip content="收起顶部工具栏进入全屏沉浸对比" position="bottom" shortcut="F">
            <button
              onClick={onToggleHeaderCollapse}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2 rounded text-xs font-medium transition-all border bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-750"
            >
              <ChevronUp className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-zinc-400 hover:text-zinc-200" />
              <span className="hidden xl:inline">收起顶栏</span>
            </button>
          </Tooltip>
        )}
      </div>

      {/* Map Information / Description Modal (Rendered via Portal to document.body to escape header transform containing block) */}
      {showComplianceModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#18191e] border border-zinc-200 dark:border-zinc-700 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-left text-zinc-800 dark:text-zinc-300">
              <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">标准地图与复刻地图对比说明</h3>
                </div>
                <button
                  onClick={() => setShowComplianceModal(false)}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-lg leading-none p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="关闭"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-zinc-300 leading-relaxed">
                <p>
                  网站标准地图底图源自于{' '}
                  <a
                    href="http://bzdt.ch.mnr.gov.cn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors inline-flex items-center gap-0.5 font-medium"
                    title="访问自然资源部标准地图服务系统"
                  >
                    <span>标准地图服务系统</span>
                    <ExternalLink className="w-3 h-3 inline shrink-0" />
                  </a>
                  ，主要涵盖了中国标准地图（横版、竖版）、七大洲标准地图、世界标准地图。
                </p>
                <p>
                  对比图由 <strong className="text-zinc-100 font-semibold">OpenQGIS / NOWZoom</strong> 针对标准地图进行1:1投影复刻，网站提供 <span className="text-amber-300 font-medium">卷帘对比</span>、<span className="text-amber-300 font-medium">双屏对比</span>、<span className="text-amber-300 font-medium">叠加对比</span> 三种对比方式，用户可以更直观的查看比较复制地图与标准地图的差距。
                </p>
                <div className="pt-1.5 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">详细的标准地图投影坐标系可以查看文章：</p>
                  <ul className="space-y-2 text-zinc-300">
                    <li className="flex items-center gap-2">
                      <a
                        href="https://mp.weixin.qq.com/s/K7OZfybh-yHbXeRp26riEw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:text-amber-300 underline underline-offset-4 inline-flex items-center gap-1 transition-colors group font-medium"
                        title="点击在新标签页阅读文章：《标准地图教程——中国篇》"
                      >
                        <span>《标准地图教程——中国篇》</span>
                        <ExternalLink className="w-3.5 h-3.5 inline shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </li>
                    <li className="flex items-center gap-2 text-zinc-400">
                      <span>《标准地图教程——各大洲篇》</span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-700/60">
                        待发布
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-zinc-400">
                      <span>《标准地图教程——世界篇》</span>
                      <span className="text-[10px] text-zinc-400 bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-700/60">
                        待发布
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowComplianceModal(false)}
                  className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs rounded-md border border-zinc-300 dark:border-zinc-600 transition-colors cursor-pointer"
                >
                  已了解
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
