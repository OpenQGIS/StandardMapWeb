import React from 'react';
import { MorphIconWrapper } from './MorphIconWrapper';
import { morphIconData } from './iconData';
import {
  RollingShutterIcon,
  DualWindowIcon,
  LayerOverlayIcon,
  GalleryIcon,
  ThemeAutoIcon,
  ThemeLightIcon,
  ThemeDarkIcon,
} from '../components/CustomIcons';
import type { ComparisonMode, SplitDirection } from '../types/map';
import type { ThemeMode } from '../hooks/useThemeMode';
import type { SpringPreset } from 'morphicons';

// ==========================================
// 1. 三态主题切换按钮 (System -> Light -> Dark)
// ==========================================
export interface MorphThemeButtonProps {
  theme: ThemeMode;
  onCycleTheme: () => void;
  springPreset?: SpringPreset;
  className?: string;
  showLabel?: boolean;
}

export const MorphThemeButton: React.FC<MorphThemeButtonProps> = ({
  theme,
  onCycleTheme,
  className = '',
  showLabel = true,
}) => {
  const label = theme === 'system' ? '系统' : theme === 'light' ? '浅色' : '深色';

  return (
    <button
      type="button"
      onClick={onCycleTheme}
      className={`group relative flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto px-0 lg:px-2.5 rounded-lg text-xs font-medium border transition-all duration-200 select-none cursor-pointer bg-themeBtn border-themeBorder/15 hover:border-amber-500/40 hover:bg-themeBtnHover hover:text-themeText text-themeMuted shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${className}`}
      aria-label="切换主题风格"
    >
      {theme === 'system' && (
        <ThemeAutoIcon className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
      )}
      {theme === 'light' && (
        <ThemeLightIcon className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
      )}
      {theme === 'dark' && (
        <ThemeDarkIcon className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
      )}
      {showLabel && (
        <span className="hidden lg:inline text-xs transition-colors group-hover:text-themeText">
          {label}
        </span>
      )}
    </button>
  );
};

// ==========================================
// 2. 卷帘对比按钮 (Swipe Mode: 垂直 / 水平切换)
// ==========================================
export interface MorphModeSwipeButtonProps {
  isActive: boolean;
  swipeDirection: SplitDirection;
  onSelect: () => void;
  onToggleDirection: () => void;
  springPreset?: SpringPreset;
  label?: string;
  className?: string;
}

export const MorphModeSwipeButton: React.FC<MorphModeSwipeButtonProps> = ({
  isActive,
  swipeDirection,
  onSelect,
  onToggleDirection,
  label = '卷帘对比',
  className = '',
}) => {
  const handleClick = () => {
    if (isActive) {
      onToggleDirection();
    } else {
      onSelect();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative flex items-center justify-center gap-1.5 h-7 px-2 lg:px-2.5 rounded-[6px] text-xs font-medium border transition-all duration-200 select-none cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
        isActive
          ? 'bg-white dark:bg-zinc-700/90 text-zinc-900 dark:text-zinc-100 shadow-xs border-black/10 dark:border-white/15 font-semibold'
          : 'border-transparent text-themeMuted hover:text-themeText hover:bg-black/5 dark:hover:bg-white/5'
      } ${className}`}
      aria-label={label}
    >
      <RollingShutterIcon
        className={`w-4 h-4 shrink-0 transition-transform duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          swipeDirection === 'horizontal' ? 'rotate-90' : 'rotate-0'
        } ${
          isActive
            ? 'text-amber-500 dark:text-amber-400 scale-105'
            : 'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
        }`}
      />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
};

// ==========================================
// 3. 双屏同步按钮 (Sync Mode: 左右 / 上下切换)
// ==========================================
export interface MorphModeSyncButtonProps {
  isActive: boolean;
  dualDirection: SplitDirection;
  onSelect: () => void;
  onToggleDirection: () => void;
  springPreset?: SpringPreset;
  label?: string;
  className?: string;
}

export const MorphModeSyncButton: React.FC<MorphModeSyncButtonProps> = ({
  isActive,
  dualDirection,
  onSelect,
  onToggleDirection,
  label = '双屏同步',
  className = '',
}) => {
  const handleClick = () => {
    if (isActive) {
      onToggleDirection();
    } else {
      onSelect();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative flex items-center justify-center gap-1.5 h-7 px-2 lg:px-2.5 rounded-[6px] text-xs font-medium border transition-all duration-200 select-none cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
        isActive
          ? 'bg-white dark:bg-zinc-700/90 text-zinc-900 dark:text-zinc-100 shadow-xs border-black/10 dark:border-white/15 font-semibold'
          : 'border-transparent text-themeMuted hover:text-themeText hover:bg-black/5 dark:hover:bg-white/5'
      } ${className}`}
      aria-label={label}
    >
      <DualWindowIcon
        className={`w-4 h-4 shrink-0 transition-transform duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          dualDirection === 'vertical' ? 'rotate-90' : 'rotate-0'
        } ${
          isActive
            ? 'text-amber-500 dark:text-amber-400 scale-105'
            : 'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
        }`}
      />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
};

// ==========================================
// 4. 叠置融合按钮 (Overlay Mode)
// ==========================================
export interface MorphModeOverlayButtonProps {
  isActive: boolean;
  onSelect: () => void;
  springPreset?: SpringPreset;
  label?: string;
  className?: string;
}

export const MorphModeOverlayButton: React.FC<MorphModeOverlayButtonProps> = ({
  isActive,
  onSelect,
  label = '叠置融合',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex items-center justify-center gap-1.5 h-7 px-2 lg:px-2.5 rounded-[6px] text-xs font-medium border transition-all duration-200 select-none cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
        isActive
          ? 'bg-white dark:bg-zinc-700/90 text-zinc-900 dark:text-zinc-100 shadow-xs border-black/10 dark:border-white/15 font-semibold'
          : 'border-transparent text-themeMuted hover:text-themeText hover:bg-black/5 dark:hover:bg-white/5'
      } ${className}`}
      aria-label={label}
    >
      <LayerOverlayIcon
        className={`w-4 h-4 shrink-0 transition-all duration-200 ${
          isActive
            ? 'text-amber-500 dark:text-amber-400 scale-105'
            : 'text-zinc-500 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
        }`}
      />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
};

// ==========================================
// 5. 对调顺序按钮 (Swap Order)
// ==========================================
export interface MorphSwapButtonProps {
  isSwapped: boolean;
  onSwap: () => void;
  mode?: ComparisonMode;
  dualDirection?: SplitDirection;
  springPreset?: SpringPreset;
  label?: string;
  className?: string;
}

export const MorphSwapButton: React.FC<MorphSwapButtonProps> = ({
  isSwapped,
  onSwap,
  mode = 'swipe',
  dualDirection = 'horizontal',
  springPreset = 'bouncy',
  label,
  className = '',
}) => {
  const icon = isSwapped
    ? morphIconData.swap.repeat
    : mode === 'sync' && dualDirection === 'vertical'
    ? morphIconData.swap.upDown
    : morphIconData.swap.leftRight;

  const defaultLabel =
    label ??
    (mode === 'sync'
      ? dualDirection === 'vertical'
        ? isSwapped ? '已对调上下' : '对调上下'
        : isSwapped ? '已对调左右' : '对调左右'
      : isSwapped ? '已对调图层' : '对调图层');

  return (
    <button
      type="button"
      onClick={onSwap}
      className={`group relative flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto px-0 lg:px-2.5 rounded-lg text-xs font-medium border transition-all duration-200 select-none cursor-pointer lg:min-w-[92px] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
        isSwapped
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 dark:border-amber-400/50 shadow-xs'
          : 'bg-themeBtn text-themeMuted border-themeBorder/15 hover:border-amber-500/40 hover:bg-themeBtnHover hover:text-themeText shadow-xs'
      } ${className}`}
      aria-label={defaultLabel}
    >
      <MorphIconWrapper
        icon={icon}
        springPreset={springPreset}
        size={16}
        strokeWidth={2}
        className={`${
          isSwapped
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
        } transition-transform duration-300 shrink-0 fill-none [&_*]:fill-none`}
      />
      <span className="hidden lg:inline text-xs">{defaultLabel}</span>
    </button>
  );
};

// ==========================================
// 6. 画廊开关按钮 (Gallery Toggle)
// ==========================================
export interface MorphGalleryButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  themesCount?: number;
  springPreset?: SpringPreset;
  label?: string;
  className?: string;
}

export const MorphGalleryButton: React.FC<MorphGalleryButtonProps> = ({
  isOpen,
  onToggle,
  themesCount = 2,
  label = '地图画廊',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group relative flex items-center justify-center gap-1.5 h-8 px-2 lg:px-2.5 rounded-lg text-xs font-medium border transition-all duration-200 select-none cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
        isOpen
          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 dark:border-amber-400/50 shadow-xs'
          : 'bg-themeBtn text-themeMuted border-themeBorder/15 hover:border-amber-500/40 hover:text-themeText hover:bg-themeBtnHover shadow-xs'
      } ${className}`}
      aria-label={label}
    >
      <GalleryIcon
        className={`w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0 ${
          isOpen ? 'scale-105' : ''
        }`}
      />
      <span className="hidden lg:inline text-xs">{label}</span>
      {typeof themesCount === 'number' && (
        <span className="text-[11px] font-mono leading-none bg-themeBtnHover/80 text-themeMuted px-1.5 py-0.5 rounded-[4px] border border-themeBorder/20 flex items-center justify-center shrink-0">
          {themesCount}
        </span>
      )}
    </button>
  );
};

// ==========================================
// 7. 顶栏折叠/展开按钮 (Collapse Header)
// ==========================================
export interface MorphCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  springPreset?: SpringPreset;
  className?: string;
}

export const MorphCollapseButton: React.FC<MorphCollapseButtonProps> = ({
  isCollapsed,
  onToggle,
  springPreset = 'snappy',
  className = '',
}) => {
  const icon = isCollapsed
    ? morphIconData.collapse.down
    : morphIconData.collapse.up;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`group flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto px-0 lg:px-2.5 rounded-lg text-xs font-medium border transition-all duration-200 bg-themeBtn text-themeMuted border-themeBorder/15 hover:border-amber-500/40 hover:text-themeText hover:bg-themeBtnHover shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${className}`}
      aria-label={isCollapsed ? '展开顶栏' : '收起顶栏'}
    >
      <MorphIconWrapper
        icon={icon}
        springPreset={springPreset}
        size={16}
        strokeWidth={2}
        className="text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors shrink-0"
      />
      <span className="hidden lg:inline text-xs">{isCollapsed ? '展开顶栏' : '收起顶栏'}</span>
    </button>
  );
};

// ==========================================
// 8. 合规规制/地图说明按钮 (Compliance & Info)
// ==========================================
export interface MorphComplianceButtonProps {
  isOpen: boolean;
  onClick: () => void;
  label?: string;
  springPreset?: SpringPreset;
  className?: string;
}

export const MorphComplianceButton: React.FC<MorphComplianceButtonProps> = ({
  isOpen,
  onClick,
  label = '地图说明',
  springPreset = 'gentle',
  className = '',
}) => {
  const icon = isOpen
    ? morphIconData.compliance.checked
    : morphIconData.compliance.info;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto px-0 lg:px-2.5 rounded-lg text-xs font-medium bg-themeBtn border border-themeBorder/15 hover:border-amber-500/40 hover:bg-themeBtnHover hover:text-themeText text-themeMuted transition-all duration-200 select-none cursor-pointer shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${className}`}
      aria-label={label}
    >
      <MorphIconWrapper
        icon={icon}
        springPreset={springPreset}
        size={16}
        strokeWidth={2}
        className="text-amber-500 dark:text-amber-400 shrink-0 group-hover:scale-110 transition-transform"
      />
      <span className="hidden lg:inline text-xs">{label}</span>
    </button>
  );
};
