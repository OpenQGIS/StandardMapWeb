import React, { useState, useEffect } from 'react';
import {
  MorphThemeButton,
  MorphModeSwipeButton,
  MorphModeSyncButton,
  MorphModeOverlayButton,
  MorphSwapButton,
  MorphGalleryButton,
  MorphCollapseButton,
  MorphComplianceButton,
} from './MorphButtons';
import { MorphIconWrapper } from './MorphIconWrapper';
import { morphIconData } from './iconData';
import type { ThemeMode } from '../hooks/useThemeMode';
import type { SplitDirection } from '../types/map';
import type { SpringPreset } from 'morphicons';
import { Play, Pause, Sparkles, X, Activity } from 'lucide-react';

interface MorphDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const MorphDemoModal: React.FC<MorphDemoModalProps> = ({
  isOpen,
  onClose,
  currentTheme = 'system',
  onThemeChange,
}) => {
  // Demo 状态
  const [theme, setTheme] = useState<ThemeMode>(currentTheme);
  const [swipeActive, setSwipeActive] = useState(true);
  const [swipeDir, setSwipeDir] = useState<SplitDirection>('vertical');
  const [syncActive, setSyncActive] = useState(false);
  const [syncDir, setSyncDir] = useState<SplitDirection>('horizontal');
  const [overlayActive, setOverlayActive] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);

  // 物理弹簧参数
  const [springPreset, setSpringPreset] = useState<SpringPreset>('snappy');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'buttons' | 'playground' | 'docs'>('buttons');

  // 自动循环播放动画演示
  useEffect(() => {
    if (!isAutoPlaying || !isOpen) return;

    const interval = setInterval(() => {
      // 循环切换各个状态
      setTheme((t) => (t === 'system' ? 'light' : t === 'light' ? 'dark' : 'system'));
      setSwipeDir((d) => (d === 'vertical' ? 'horizontal' : 'vertical'));
      setSyncDir((d) => (d === 'horizontal' ? 'vertical' : 'horizontal'));
      setOverlayActive((a) => !a);
      setIsSwapped((s) => !s);
      setIsGalleryOpen((g) => !g);
      setIsCollapsed((c) => !c);
      setIsComplianceOpen((i) => !i);
    }, 1800);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isOpen]);

  if (!isOpen) return null;

  const cycleThemeDemo = () => {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    onThemeChange?.(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-themePanel border border-themeBorder/30 rounded-2xl shadow-2xl overflow-hidden text-themeText transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-themeBorder/15 bg-themeBtn/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Morphicons 动效交互实验室</span>
                <span className="text-[10px] font-mono font-normal uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Zero Runtime Overhead
                </span>
              </h2>
              <p className="text-xs text-themeMuted">
                基于物理弹簧（Spring Physics）与 2D Procrustes 对齐的无缝图标形态变形
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 自动播放开关 */}
            <button
              type="button"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                isAutoPlaying
                  ? 'bg-amber-500 text-zinc-900 border-amber-600 shadow-md font-semibold'
                  : 'bg-themeBtn text-themeMuted border-themeBorder/20 hover:text-themeText hover:bg-themeBtnHover'
              }`}
            >
              {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoPlaying ? '停止演示' : '自动巡演'}</span>
            </button>

            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-themeMuted hover:text-themeText hover:bg-themeBtnHover transition-colors border border-transparent hover:border-themeBorder/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 控制条：物理预设与选项 */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 border-b border-themeBorder/15 bg-themeBtn/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-themeMuted flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span>物理阻尼预设:</span>
            </span>
            {(['snappy', 'bouncy', 'gentle', 'stiff'] as SpringPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSpringPreset(preset)}
                className={`px-2.5 py-1 rounded-md capitalize transition-all cursor-pointer text-xs ${
                  springPreset === preset
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 font-semibold shadow-xs'
                    : 'text-themeMuted hover:text-themeText border border-transparent'
                }`}
              >
                {preset === 'snappy' ? '轻脆 (Snappy)' : preset === 'bouncy' ? '弹性 (Bouncy)' : preset === 'gentle' ? '柔和 (Gentle)' : '硬朗 (Stiff)'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-themeBtn p-0.5 rounded-lg border border-themeBorder/20">
            <button
              type="button"
              onClick={() => setActiveTab('buttons')}
              className={`px-3 py-1 rounded-md text-xs transition-all ${
                activeTab === 'buttons'
                  ? 'bg-themeCard text-themeText font-medium shadow-xs'
                  : 'text-themeMuted hover:text-themeText'
              }`}
            >
              系统现有按钮
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('playground')}
              className={`px-3 py-1 rounded-md text-xs transition-all ${
                activeTab === 'playground'
                  ? 'bg-themeCard text-themeText font-medium shadow-xs'
                  : 'text-themeMuted hover:text-themeText'
              }`}
            >
              形态变形透视
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('docs')}
              className={`px-3 py-1 rounded-md text-xs transition-all ${
                activeTab === 'docs'
                  ? 'bg-themeCard text-themeText font-medium shadow-xs'
                  : 'text-themeMuted hover:text-themeText'
              }`}
            >
              原理说明
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'buttons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 卡片 1: 三态主题切换 */}
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-themeText flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      主题切换 (三态闭环形变)
                    </span>
                    <span className="text-[11px] font-mono text-themeDim">
                      Monitor → Sun → Moon
                    </span>
                  </div>
                  <p className="text-xs text-themeMuted mb-4">
                    点击时电脑屏幕平滑散开为太阳光芒，太阳光芒向内收敛成上弦月牙，月牙再展平成显示器。
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-themeBorder/10">
                  <MorphThemeButton
                    theme={theme}
                    onCycleTheme={cycleThemeDemo}
                    springPreset={springPreset}
                  />
                  <span className="text-xs font-mono text-amber-500 bg-themeBtn px-2 py-1 rounded">
                    当前: {theme}
                  </span>
                </div>
              </div>

              {/* 卡片 2: 卷帘对比按钮 */}
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-themeText flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      卷帘对比 (垂直 / 水平切割形变)
                    </span>
                    <span className="text-[11px] font-mono text-themeDim">
                      Split Vertical ↔ Horizontal
                    </span>
                  </div>
                  <p className="text-xs text-themeMuted mb-4">
                    点击切换分割线方向，中缝线条与两翼方块在物理弹簧驱动下完成 90° 旋转与解构重组。
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-themeBorder/10">
                  <MorphModeSwipeButton
                    isActive={swipeActive}
                    swipeDirection={swipeDir}
                    onSelect={() => setSwipeActive(true)}
                    onToggleDirection={() =>
                      setSwipeDir((d) => (d === 'vertical' ? 'horizontal' : 'vertical'))
                    }
                    springPreset={springPreset}
                  />
                  <span className="text-xs font-mono text-blue-500 bg-themeBtn px-2 py-1 rounded">
                    分割线: {swipeDir}
                  </span>
                </div>
              </div>

              {/* 卡片 3: 双屏同步按钮 */}
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-themeText flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      双屏同步 (左右 / 上下分屏)
                    </span>
                    <span className="text-[11px] font-mono text-themeDim">
                      Columns ↔ Rows
                    </span>
                  </div>
                  <p className="text-xs text-themeMuted mb-4">
                    双联视窗布局变换，左/右双列平滑对偶变更为上/下双行，过渡自然无硬切感。
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-themeBorder/10">
                  <MorphModeSyncButton
                    isActive={syncActive}
                    dualDirection={syncDir}
                    onSelect={() => setSyncActive(true)}
                    onToggleDirection={() =>
                      setSyncDir((d) => (d === 'horizontal' ? 'vertical' : 'horizontal'))
                    }
                    springPreset={springPreset}
                  />
                  <span className="text-xs font-mono text-emerald-500 bg-themeBtn px-2 py-1 rounded">
                    排列: {syncDir === 'horizontal' ? '左右并排' : '上下并列'}
                  </span>
                </div>
              </div>

              {/* 卡片 4: 叠置融合模式 */}
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-themeText flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      叠置融合模式
                    </span>
                    <span className="text-[11px] font-mono text-themeDim">
                      Layers ↔ Combine
                    </span>
                  </div>
                  <p className="text-xs text-themeMuted mb-4">
                    激活透光融合时，单层图层矩阵形态拉伸变更为多层复合叠加，直观体现图层混合操作。
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-themeBorder/10">
                  <MorphModeOverlayButton
                    isActive={overlayActive}
                    onSelect={() => setOverlayActive(!overlayActive)}
                    springPreset={springPreset}
                  />
                  <span className="text-xs font-mono text-purple-500 bg-themeBtn px-2 py-1 rounded">
                    状态: {overlayActive ? '已激活' : '常规'}
                  </span>
                </div>
              </div>

              {/* 卡片 5: 对调图层/双屏位置 */}
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-themeText flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      对调顺序 / 互换图层
                    </span>
                    <span className="text-[11px] font-mono text-themeDim">
                      ArrowLeftRight ↔ Repeat
                    </span>
                  </div>
                  <p className="text-xs text-themeMuted mb-4">
                    左右图层或底表层顺序对换，双向箭头在点击时平滑流向反转并形成环流弹跳。
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-themeBorder/10">
                  <MorphSwapButton
                    isSwapped={isSwapped}
                    onSwap={() => setIsSwapped(!isSwapped)}
                    springPreset={springPreset}
                  />
                  <span className="text-xs font-mono text-rose-500 bg-themeBtn px-2 py-1 rounded">
                    顺序: {isSwapped ? '已对调' : '原始'}
                  </span>
                </div>
              </div>

              {/* 卡片 6: 地图画廊展开/收起 */}
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-themeText flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500" />
                      地图画廊开关
                    </span>
                    <span className="text-[11px] font-mono text-themeDim">
                      Grid ↔ PanelClose
                    </span>
                  </div>
                  <p className="text-xs text-themeMuted mb-4">
                    展开抽屉时，四方格缩略图矩阵聚拢缩回为折叠箭头；收起时箭头平滑绽放为九宫格。
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-themeBorder/10">
                  <MorphGalleryButton
                    isOpen={isGalleryOpen}
                    onToggle={() => setIsGalleryOpen(!isGalleryOpen)}
                    themesCount={14}
                    springPreset={springPreset}
                  />
                  <span className="text-xs font-mono text-cyan-500 bg-themeBtn px-2 py-1 rounded">
                    画廊: {isGalleryOpen ? '展开状态' : '收起状态'}
                  </span>
                </div>
              </div>

              {/* 卡片 7: 沉浸全屏 / 折叠顶栏 */}
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-themeText flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      收起顶栏 / 沉浸全屏
                    </span>
                    <span className="text-[11px] font-mono text-themeDim">
                      ChevronUp ↔ ChevronDown
                    </span>
                  </div>
                  <p className="text-xs text-themeMuted mb-4">
                    向上尖角在点击时平滑翻折反转为向下尖角，提供极其精准的折叠意象。
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-themeBorder/10">
                  <MorphCollapseButton
                    isCollapsed={isCollapsed}
                    onToggle={() => setIsCollapsed(!isCollapsed)}
                    springPreset={springPreset}
                  />
                  <span className="text-xs font-mono text-teal-500 bg-themeBtn px-2 py-1 rounded">
                    顶栏: {isCollapsed ? '已折叠' : '展开中'}
                  </span>
                </div>
              </div>

              {/* 卡片 8: 地图说明 / 规制核准 */}
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15 flex flex-col justify-between hover:border-amber-500/30 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-themeText flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      说明规制与认证
                    </span>
                    <span className="text-[11px] font-mono text-themeDim">
                      Info ↔ FileCheck
                    </span>
                  </div>
                  <p className="text-xs text-themeMuted mb-4">
                    说明感叹号在打开模态框时，平滑变身为核准书卷文书，强化权威合规仪式感。
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-themeBorder/10">
                  <MorphComplianceButton
                    isOpen={isComplianceOpen}
                    onClick={() => setIsComplianceOpen(!isComplianceOpen)}
                    springPreset={springPreset}
                  />
                  <span className="text-xs font-mono text-amber-600 bg-themeBtn px-2 py-1 rounded">
                    模态: {isComplianceOpen ? '规制核准' : '一般说明'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'playground' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-themeCard border border-themeBorder/15 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-amber-500 font-semibold mb-2">大型形态变形放大镜</span>
                <div className="w-32 h-32 rounded-2xl bg-themeBtn flex items-center justify-center border border-themeBorder/20 shadow-inner my-4">
                  <MorphIconWrapper
                    icon={
                      theme === 'system'
                        ? morphIconData.theme.system
                        : theme === 'light'
                        ? morphIconData.theme.light
                        : morphIconData.theme.dark
                    }
                    size={64}
                    strokeWidth={1.8}
                    springPreset={springPreset}
                    className="text-amber-500"
                  />
                </div>
                <p className="text-sm font-medium text-themeText mb-3">
                  当前处于主题切换形态（大小 64px 采样）
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cycleThemeDemo}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold text-xs shadow-md hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
                  >
                    点击触发一次三态变形
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4 text-xs leading-relaxed text-themeMuted">
              <div className="p-4 rounded-xl bg-themeCard border border-themeBorder/15">
                <h4 className="font-bold text-sm text-themeText mb-2">🚀 为什么选择 Morphicons 驱动按钮？</h4>
                <ul className="list-disc list-inside space-y-1.5">
                  <li><strong>零额外渲染管线</strong>：不依赖笨重的 Canvas 或 WebGL，完全在 SVG Path 层面利用单一 rAF 调度器运作。</li>
                  <li><strong>Procrustes 闭式最优旋转解</strong>：不需要手写繁琐的旋转关键帧，数学算法自动求解最简形态对齐路径。</li>
                  <li><strong>物理弹簧动效（Spring Physics）</strong>：告别机械生硬的线性过渡，点击时赋予按钮犹如实体机械按键般的弹润反馈。</li>
                  <li><strong>本地完全自洽</strong>：直接调用本地已有资源，无需从外部 npm 重新拉取或依赖任何网络环境。</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-themeBorder/15 bg-themeBtn/30 text-xs text-themeMuted">
          <span>StandardMapWeb · Morphicons 动效集成工程</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-themeBtn hover:bg-themeBtnHover text-themeText border border-themeBorder/20 transition-all font-medium"
          >
            完成并返回
          </button>
        </div>
      </div>
    </div>
  );
};
