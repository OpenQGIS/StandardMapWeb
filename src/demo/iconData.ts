/**
 * Morphicons 标准图标节点数据
 * 从 lucide-react 规范 ESM 节点中提取并结构化导出，确保无需额外运行时即可由 morphicons 驱动纯净形变动画
 */
import type { IconNode } from 'morphicons';

// 1. 主题切换三态
import { __iconData as sunData } from 'lucide-react/dist/esm/icons/sun.mjs';
import { __iconData as moonData } from 'lucide-react/dist/esm/icons/moon.mjs';
import { __iconData as monitorData } from 'lucide-react/dist/esm/icons/monitor.mjs';

// 2. 视图模式与分屏对比
import { __iconData as layersData } from 'lucide-react/dist/esm/icons/layers.mjs';
import { __iconData as combineData } from 'lucide-react/dist/esm/icons/combine.mjs';

// 3. 对调与刷新
import { __iconData as arrowLeftRightData } from 'lucide-react/dist/esm/icons/arrow-left-right.mjs';
import { __iconData as arrowUpDownData } from 'lucide-react/dist/esm/icons/arrow-up-down.mjs';
import { __iconData as refreshCwData } from 'lucide-react/dist/esm/icons/refresh-cw.mjs';
import { __iconData as repeatData } from 'lucide-react/dist/esm/icons/repeat.mjs';

// 4. 折叠、箭头与画廊
import { __iconData as chevronUpData } from 'lucide-react/dist/esm/icons/chevron-up.mjs';
import { __iconData as chevronDownData } from 'lucide-react/dist/esm/icons/chevron-down.mjs';
import { __iconData as chevronLeftData } from 'lucide-react/dist/esm/icons/chevron-left.mjs';
import { __iconData as chevronRightData } from 'lucide-react/dist/esm/icons/chevron-right.mjs';
import { __iconData as layoutGridData } from 'lucide-react/dist/esm/icons/layout-grid.mjs';
import { __iconData as imagePlayData } from 'lucide-react/dist/esm/icons/image-play.mjs';
import { __iconData as panelBottomCloseData } from 'lucide-react/dist/esm/icons/panel-bottom-close.mjs';
import { __iconData as panelBottomOpenData } from 'lucide-react/dist/esm/icons/panel-bottom-open.mjs';

// 5. 信息、合规与辅助
import { __iconData as infoData } from 'lucide-react/dist/esm/icons/info.mjs';
import { __iconData as fileCheckData } from 'lucide-react/dist/esm/icons/file-check.mjs';
import { __iconData as checkData } from 'lucide-react/dist/esm/icons/check.mjs';
import { __iconData as xData } from 'lucide-react/dist/esm/icons/x.mjs';
import { __iconData as maximize2Data } from 'lucide-react/dist/esm/icons/maximize-2.mjs';
import { __iconData as minimize2Data } from 'lucide-react/dist/esm/icons/minimize-2.mjs';
import { __iconData as sparklesData } from 'lucide-react/dist/esm/icons/sparkles.mjs';
import { __iconData as compassData } from 'lucide-react/dist/esm/icons/compass.mjs';

export const morphIconData = {
  // 主题三态
  theme: {
    system: monitorData.node as unknown as IconNode,
    light: sunData.node as unknown as IconNode,
    dark: moonData.node as unknown as IconNode,
  },

  // 卷帘对比 (垂直分割线 vs 水平分割线) - 几何流体 Pinch & Expand Morph
  swipe: {
    // 垂直卷帘：外框静止，长主中线 (纵贯) + 卷帘滑块手柄 (横向)
    vertical: [
      ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
      ['path', { d: 'M12 3v18' }],
      ['path', { d: 'M9 12h6' }],
    ] as unknown as IconNode,
    // 水平卷帘：外框静止，卷帘滑块手柄 (纵向) + 长主中线 (横贯)
    horizontal: [
      ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
      ['path', { d: 'M12 9v6' }],
      ['path', { d: 'M3 12h18' }],
    ] as unknown as IconNode,
  },

  // 双屏同步 (左右分屏 vs 上下分屏) - 空间分割重组 Morph
  sync: {
    // 左右分屏：外框静止，主分割竖线 + 中心收敛核
    horizontal: [
      ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
      ['path', { d: 'M12 3v18' }],
      ['path', { d: 'M11 12h2' }],
    ] as unknown as IconNode,
    // 上下分屏：外框静止，中心收敛核 + 主分割横线
    vertical: [
      ['rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }],
      ['path', { d: 'M12 11v2' }],
      ['path', { d: 'M3 12h18' }],
    ] as unknown as IconNode,
  },

  // 叠置融合 (单层透光 vs 双层叠置)
  overlay: {
    single: layersData.node as unknown as IconNode,
    combined: combineData.node as unknown as IconNode,
  },

  // 对调顺序 (左右互换 vs 上下互换 vs 旋转对调)
  swap: {
    leftRight: arrowLeftRightData.node as unknown as IconNode,
    upDown: arrowUpDownData.node as unknown as IconNode,
    refresh: refreshCwData.node as unknown as IconNode,
    repeat: repeatData.node as unknown as IconNode,
  },

  // 浮动画廊 (展开状态箭头 vs 收起状态网格)
  gallery: {
    closed: layoutGridData.node as unknown as IconNode,
    opened: panelBottomCloseData.node as unknown as IconNode,
    play: imagePlayData.node as unknown as IconNode,
    capsuleClosed: panelBottomOpenData.node as unknown as IconNode,
    capsuleOpened: chevronDownData.node as unknown as IconNode,
  },

  // 折叠顶栏 (折叠 vs 展开)
  collapse: {
    up: chevronUpData.node as unknown as IconNode,
    down: chevronDownData.node as unknown as IconNode,
  },

  // 左右翻页
  carousel: {
    left: chevronLeftData.node as unknown as IconNode,
    right: chevronRightData.node as unknown as IconNode,
  },

  // 规制信息 (说明 vs 规制核准)
  compliance: {
    info: infoData.node as unknown as IconNode,
    checked: fileCheckData.node as unknown as IconNode,
  },

  // 视口与通用控制
  common: {
    check: checkData.node as unknown as IconNode,
    close: xData.node as unknown as IconNode,
    maximize: maximize2Data.node as unknown as IconNode,
    minimize: minimize2Data.node as unknown as IconNode,
    sparkles: sparklesData.node as unknown as IconNode,
    compass: compassData.node as unknown as IconNode,
  },
};
