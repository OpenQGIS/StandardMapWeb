import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { ComparisonMode, SplitDirection } from '../types/map';
import type { ThemeMode } from '../hooks/useThemeMode';
import { THEME_PACKS, type ThemeTexts } from '../data/i18nTheme';
import { Info, ExternalLink, ChevronUp, Monitor } from 'lucide-react';
import { RollingShutterIcon, DualWindowIcon, LayerOverlayIcon, GalleryIcon, SwapLeftAndRightIcon, ThemeLightIcon, ThemeDarkIcon } from './CustomIcons';
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
  texts?: ThemeTexts;
  isWuxia?: boolean;
  onToggleWuxia?: () => void;
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
  texts = THEME_PACKS.modern,
  isWuxia = false,
  onToggleWuxia,
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
    <header className="h-14 border-b border-themeBorder/10 bg-themePanel/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between z-30 select-none shadow-sm relative transition-colors duration-150">
      {/* Left: Branding & Compliance Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          onClick={handleBrandingClick}
          className="flex items-center gap-2 cursor-pointer group"
          title={isWuxia ? "九域合符 · 山河对勘工坊" : `${texts.brandTitle} · ${texts.brandSub}`}
        >
          <div className="relative flex items-center justify-center">
            <img
              src="./icons/webicon.svg"
              alt="Logo"
              className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform shrink-0"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-themeText leading-tight flex items-center gap-1">
                <span className="hidden md:inline">{texts.brandTitle}</span>
                <span className="inline md:hidden max-[420px]:hidden">{texts.brandShort}</span>
              </h1>
              <p className="text-[11px] text-themeDim leading-tight hidden xl:block whitespace-nowrap">
                {texts.brandSub}
              </p>
            </div>
            {onToggleWuxia && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWuxia();
                }}
                title={isWuxia ? "点击切回现世日常版" : "点击体验江湖合符"}
                className={`wuxia-seal-badge ${isWuxia ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'} transition-opacity shrink-0`}
              >
                {isWuxia ? texts.toggleWuxiaBadge : texts.toggleModernBadge}
              </button>
            )}
          </div>
        </div>

        <Tooltip content={texts.btnCompliance} position="bottom">
          <button
            onClick={() => setShowComplianceModal(true)}
            className="flex items-center justify-center gap-1 text-[11px] text-themeMuted hover:text-themeText p-1.5 sm:px-2.5 sm:py-1.5 rounded text-xs font-medium bg-themeBtn border border-themeBorder/15 hover:bg-themeBtnHover transition-colors ml-0.5 sm:ml-1 cursor-pointer min-w-[31px] min-h-[31px]"
          >
            <Info
              fill="none"
              className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 stroke-amber-500 dark:stroke-amber-400 fill-none [&_*]:fill-none shrink-0"
            />
            <span className="hidden xl:inline">{isWuxia ? '勘核规制' : '地图说明'}</span>
          </button>
        </Tooltip>
      </div>

      {/* Center: Comparison Mode Switcher */}
      <div className="flex items-center bg-themeBtn border border-themeBorder/15 p-1 rounded-lg md:absolute md:left-1/2 md:-translate-x-1/2">
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
            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:w-[94px] rounded-md text-xs font-medium transition-all border ${
              mode === 'swipe'
                ? 'bg-themeCard dark:bg-zinc-800 text-themeText shadow-sm border-themeBorder/20 dark:border-zinc-700/80 font-semibold'
                : 'border-transparent text-themeMuted hover:text-themeText hover:bg-themeBtnHover/50'
            }`}
          >
            <RollingShutterIcon
              className={`w-[18px] h-[18px] sm:w-4 sm:h-4 transition-transform duration-200 ${
                mode === 'swipe'
                  ? (swipeDirection === 'horizontal' ? 'rotate-90 text-amber-500 dark:text-amber-400' : 'text-amber-500 dark:text-amber-400')
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            />
            <span className="hidden lg:inline">
              {texts.modeSwipe}
            </span>
          </button>
        </Tooltip>

        <Tooltip
          content={
            mode === 'sync'
              ? dualDirection === 'horizontal'
                ? `${texts.modeSync}: 左右双屏 (再次点击切换为上下双屏)`
                : `${texts.modeSync}: 上下双屏 (再次点击切换为左右双屏)`
              : `${texts.modeSync} (点击激活)`
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
            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:w-[94px] rounded-md text-xs font-medium transition-all border ${
              mode === 'sync'
                ? 'bg-themeCard dark:bg-zinc-800 text-themeText shadow-sm border-themeBorder/20 dark:border-zinc-700/80 font-semibold'
                : 'border-transparent text-themeMuted hover:text-themeText hover:bg-themeBtnHover/50'
            }`}
          >
            <DualWindowIcon
              className={`w-[18px] h-[18px] sm:w-4 sm:h-4 transition-transform duration-200 ${
                mode === 'sync'
                  ? (dualDirection === 'vertical' ? 'rotate-90 text-amber-500 dark:text-amber-400' : 'text-amber-500 dark:text-amber-400')
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            />
            <span className="hidden lg:inline">
              {texts.modeSync}
            </span>
          </button>
        </Tooltip>

        <Tooltip content={`${texts.modeOverlay} (支持透明度调节与图层混合)`} position="bottom" shortcut="3">
          <button
            onClick={() => onModeChange('overlay')}
            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:w-[94px] rounded-md text-xs font-medium transition-all border ${
              mode === 'overlay'
                ? 'bg-themeCard dark:bg-zinc-800 text-themeText shadow-sm border-themeBorder/20 dark:border-zinc-700/80 font-semibold'
                : 'border-transparent text-themeMuted hover:text-themeText hover:bg-themeBtnHover/50'
            }`}
          >
            <LayerOverlayIcon
              className={`w-[18px] h-[18px] sm:w-4 sm:h-4 ${
                mode === 'overlay'
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            />
            <span className="hidden lg:inline">{texts.modeOverlay}</span>
          </button>
        </Tooltip>
      </div>

      {/* Right: Swap Order & Viewport State & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Swap Map Order Button (互换左右/上下图/底表层顺序) */}
        <Tooltip
          content={
            isWuxia
              ? `${texts.btnSwap} (互换两卷之位)`
              : mode === 'sync'
              ? dualDirection === 'vertical'
                ? isSwapped
                  ? '已对调上下位置 (再次点击还原)'
                  : '对调上下双屏位置'
                : isSwapped
                ? '已对调左右位置 (再次点击还原)'
                : '对调左右双屏位置'
              : isSwapped
              ? '已对调图层顺序 (再次点击还原)'
              : '对调图层顺序'
          }
          position="bottom"
          shortcut="X / S"
        >
          <button
            onClick={onSwapOrder}
            className={`group flex items-center justify-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded text-xs font-medium transition-all border lg:min-w-[96px] ${
              isSwapped
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 dark:border-amber-400/50 shadow-sm'
                : 'bg-themeBtn text-themeMuted border-themeBorder/15 hover:bg-themeBtnHover hover:text-themeText'
            }`}
          >
            <SwapLeftAndRightIcon
              className={`w-[18px] h-[18px] sm:w-4 sm:h-4 transition-colors ${
                isSwapped
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
              }`}
            />
            <span className="hidden lg:inline">
              {isWuxia
                ? texts.btnSwap
                : mode === 'sync'
                ? dualDirection === 'vertical'
                  ? isSwapped
                    ? '已对调上下'
                    : '对调上下'
                  : isSwapped
                  ? '已对调左右'
                  : '对调左右'
                : isSwapped
                ? '已对调图层'
                : '对调图层'}
            </span>
          </button>
        </Tooltip>

        <div className="hidden lg:block text-[11px] font-mono text-themeMuted bg-themeBtn px-2.5 py-1 rounded border border-themeBorder/15">
          缩放: <span className="text-themeText font-semibold">{zoomPercent}%</span>
        </div>

        {/* Toggle Floating Gallery Button */}
        <Tooltip content={isWuxia ? "展阅山河百卷图录" : "展开或收起底部浮动地图画廊"} position="bottom" shortcut="G">
          <button
            onClick={onToggleGallery}
            className={`group flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded text-xs font-medium transition-all border ${
              isGalleryOpen
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 dark:border-amber-400/50 shadow-sm'
                : 'bg-themeBtn text-themeMuted border-themeBorder/15 hover:text-themeText hover:bg-themeBtnHover'
            }`}
          >
            <GalleryIcon className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 transition-colors" />
            <span className="hidden lg:inline">{texts.btnGallery}</span>
            <span className="text-[10px] font-mono bg-themeBtnHover/80 text-themeMuted px-1 rounded border border-themeBorder/20">{themesCount}</span>
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
            className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded text-xs font-medium transition-all border bg-themeBtn text-themeMuted border-themeBorder/15 hover:text-themeText hover:bg-themeBtnHover cursor-pointer min-w-[31px] min-h-[31px]"
            aria-label="切换主题风格"
          >
            {theme === 'system' && (
              <Monitor className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            )}
            {theme === 'light' && (
              <ThemeLightIcon className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            )}
            {theme === 'dark' && (
              <ThemeDarkIcon className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            )}
            <span className="hidden xl:inline">
              {theme === 'system' ? '系统' : theme === 'light' ? '浅色' : '深色'}
            </span>
          </button>
        </Tooltip>

        {/* Collapse Header Button (沉浸纯净模式 / 全屏) */}
        {onToggleHeaderCollapse && (
          <Tooltip content="收起顶部工具栏进入全屏模式" position="bottom" shortcut="F">
            <button
              onClick={onToggleHeaderCollapse}
              className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2 rounded text-xs font-medium transition-all border bg-themeBtn text-themeMuted border-themeBorder/15 hover:text-themeText hover:bg-themeBtnHover"
            >
              <ChevronUp className="w-[18px] h-[18px] sm:w-4 sm:h-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200" />
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
                  <Info
                    fill="none"
                    className="w-5 h-5 text-amber-500 dark:text-amber-400 stroke-amber-500 dark:stroke-amber-400 fill-none [&_*]:fill-none shrink-0"
                  />
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{texts.btnCompliance}</h3>
                </div>
                <button
                  onClick={() => setShowComplianceModal(false)}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-lg leading-none p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="关闭"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <p>
                  网站标准地图底图源自于{' '}
                  <a
                    href="http://bzdt.ch.mnr.gov.cn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-2 transition-colors inline-flex items-center gap-0.5 font-medium"
                    title="访问自然资源部标准地图服务系统"
                  >
                    <span>标准地图服务系统</span>
                    <ExternalLink
                      fill="none"
                      className="w-3 h-3 inline shrink-0 fill-none [&_*]:fill-none stroke-current"
                    />
                  </a>
                  ，主要涵盖了中国标准地图（横版、竖版）、七大洲标准地图、世界标准地图。
                </p>
                <p>
                  对比图由 <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">OpenQGIS / NOWZoom</strong> 基于标准地图进行 1:1 制图复刻。提供 <span className="text-amber-600 dark:text-amber-400 font-medium">卷帘对比</span>、<span className="text-amber-600 dark:text-amber-400 font-medium">双屏对比</span>、<span className="text-amber-600 dark:text-amber-400 font-medium">透明叠置</span> 三种对比方式，用于核验复刻地图与标准底图的几何套合精度与制图要素差异。
                </p>
                <div className="pt-1.5 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
                  <p className="font-medium text-zinc-800 dark:text-zinc-200 mb-2">详细的标准地图投影与制图说明见相关文章：</p>
                  <ul className="space-y-2 text-zinc-600 dark:text-zinc-300">
                    <li className="flex items-center gap-2">
                      <a
                        href="https://mp.weixin.qq.com/s/K7OZfybh-yHbXeRp26riEw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-4 inline-flex items-center gap-1 transition-colors group font-medium"
                        title="点击在新标签页阅读文章：《标准地图教程——中国篇》"
                      >
                        <span>《标准地图教程——中国篇》</span>
                        <ExternalLink
                          fill="none"
                          className="w-3.5 h-3.5 inline shrink-0 group-hover:translate-x-0.5 transition-transform fill-none [&_*]:fill-none stroke-current"
                        />
                      </a>
                    </li>
                    <li className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <span>《标准地图教程——各大洲篇》</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700/60">
                        待发布
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <span>《标准地图教程——世界篇》</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700/60">
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
