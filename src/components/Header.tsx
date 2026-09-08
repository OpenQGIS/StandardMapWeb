import React, { useState } from 'react';
import type { ComparisonMode } from '../types/map';
import { Info, ExternalLink } from 'lucide-react';
import { RollingShutterIcon, DualWindowIcon, LayerOverlayIcon, GalleryIcon, SwapLeftAndRightIcon } from './CustomIcons';

interface HeaderProps {
  mode: ComparisonMode;
  onModeChange: (mode: ComparisonMode) => void;
  zoomPercent: number;
  onSwapOrder: () => void;
  isSwapped: boolean;
  isGalleryOpen: boolean;
  onToggleGallery: () => void;
  themesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  zoomPercent,
  onSwapOrder,
  isSwapped,
  isGalleryOpen,
  onToggleGallery,
  themesCount = 2,
}) => {
  const [showComplianceModal, setShowComplianceModal] = useState(false);

  return (
    <header className="h-14 bg-panel border-b border-border flex items-center justify-between px-2.5 sm:px-4 z-40 relative select-none">
      {/* Left: Branding & Compliance Info */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <img
            src="./icons/webicon.svg"
            alt="标准地图/复刻地图"
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-zinc-800 border border-zinc-700 p-0.5 object-contain shrink-0 shadow-sm"
          />
          <div>
            <h1 className="text-xs sm:text-sm font-semibold text-zinc-100 flex items-center gap-2 leading-tight whitespace-nowrap">
              <span className="hidden md:inline">标准地图/复刻地图</span>
              <span className="inline md:hidden max-[420px]:hidden">标准/复刻</span>
            </h1>
            <p className="text-[11px] text-zinc-400 leading-tight hidden xl:block whitespace-nowrap">
              左右顺序一键切换 视口联动缩放
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowComplianceModal(true)}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 p-1.5 sm:px-2 sm:py-1 rounded bg-zinc-800/60 border border-zinc-700/60 transition-colors ml-0.5 sm:ml-1 cursor-pointer"
          title="查看地图说明（标准地图与复刻地图对比说明）"
        >
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden xl:inline">地图说明</span>
        </button>
      </div>

      {/* Center: Comparison Mode Switcher */}
      <div className="flex items-center bg-surface border border-border p-1 rounded-lg">
        <button
          onClick={() => onModeChange('swipe')}
          className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:px-3 rounded-md text-xs font-medium transition-all ${
            mode === 'swipe'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="卷帘对比 (单视口拖动中轴卷帘对比)"
        >
          <RollingShutterIcon className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">卷帘对比</span>
        </button>

        <button
          onClick={() => onModeChange('sync')}
          className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:px-3 rounded-md text-xs font-medium transition-all ${
            mode === 'sync'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="双屏联动 (左右双屏同步缩放与移动)"
        >
          <DualWindowIcon className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">双屏联动</span>
        </button>

        <button
          onClick={() => onModeChange('overlay')}
          className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 lg:px-3 rounded-md text-xs font-medium transition-all ${
            mode === 'overlay'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="透明叠置 (透明度叠置渐变对比)"
        >
          <LayerOverlayIcon className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">透明叠置</span>
        </button>
      </div>

      {/* Right: Swap Order & Viewport State & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Swap Map Order Button (互换左右图/底表层顺序) */}
        <button
          onClick={onSwapOrder}
          className={`group flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded text-xs font-medium transition-all border ${
            isSwapped
              ? 'bg-amber-500/20 text-[#fbbf24] border-amber-500/50 shadow-sm'
              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-zinc-100'
          }`}
          title={
            mode === 'sync'
              ? (isSwapped ? '左右地图位置已互换 (点击恢复默认)' : '左右互换 (左右双屏位置对调)')
              : (isSwapped ? '图层上下层顺序已对调 (点击恢复默认)' : '图层对调 (底图与复刻图层序互换)')
          }
        >
          <SwapLeftAndRightIcon
            className={`w-3.5 h-3.5 transition-colors ${
              isSwapped ? 'text-[#fbbf24]' : 'text-zinc-400 group-hover:text-zinc-200'
            }`}
          />
          <span className="hidden lg:inline">{mode === 'sync' ? '互换左右图' : '对调图层顺序'}</span>
          {isSwapped && <span className="text-[10px] text-[#fbbf24] font-mono hidden lg:inline">(已调换)</span>}
        </button>

        <div className="hidden lg:block text-[11px] font-mono text-zinc-400 bg-surface px-2.5 py-1 rounded border border-border">
          缩放: <span className="text-zinc-200 font-semibold">{zoomPercent}%</span>
        </div>

        {/* Toggle Floating Gallery Button */}
        <button
          onClick={onToggleGallery}
          className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded text-xs font-medium transition-all border ${
            isGalleryOpen
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-zinc-100 hover:bg-zinc-750'
          }`}
          title="展开或收起底部浮动地图画廊 (快捷键 G)"
        >
          <GalleryIcon className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">地图画廊</span>
          <span className="text-[10px] font-mono text-zinc-400 bg-surface px-1 rounded border border-border">{themesCount}</span>
        </button>
      </div>

      {/* Map Information / Description Modal */}
      {showComplianceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-panelSub border border-zinc-700 rounded-xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="text-base font-semibold text-zinc-100">标准地图与复刻地图对比说明</h3>
              </div>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-lg leading-none p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
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
              <div className="pt-1.5 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <p className="font-medium text-zinc-200 mb-2">详细的标准地图投影坐标系可以查看文章：</p>
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
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-md border border-zinc-600 transition-colors cursor-pointer"
              >
                已了解
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
