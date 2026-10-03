# StandardMapWeb · 按钮交互动效实验室 (Morphicons Demo)

本项目基于本地调用的 **Morphicons** 动效引擎，为 StandardMapWeb 整个界面中的所有核心按钮制作了专属的 **SVG 矢量形态无缝形变（Morphing Animation）与弹簧物理（Spring Physics）微交互动画**。

---

## 🌟 核心特性

1. **直接调用本地资源**：
   - 依赖本地项目 `d:\GitHub\morphicons` 与 `d:\GitHub\lucide`，无需额外 npm 网络安装。
   - Vite 配置与构建体系深度适配本地路径，支持直接导入与类型推导。
2. **2D Procrustes 最优对齐与极坐标插值**：
   - 图标之间的形态旋转与端点匹配无需手动声明关键帧，算法自动解析封闭形状与路径弧长。
3. **弹簧物理阻尼（Spring Physics）**：
   - 支持 `snappy`（迅捷轻脆）、`bouncy`（弹性回弹）、`gentle`（柔和优雅）、`stiff`（硬朗干脆）等多种物理动力学曲线。
4. **零外部运行时额外开销**：
   - 共享全局单例 `requestAnimationFrame` 调度管线，帧率稳定 60/120fps，无内存泄漏与 DOM 冗余。

---

## 🔘 现有按钮与动效映射表

| 按钮组件 | 现有功能 | Morphicons 变形动画形态 | 交互触感 |
| :--- | :--- | :--- | :--- |
| **`MorphThemeButton`** | 切换主题风格 | `Monitor` (系统) ↔ `Sun` (浅色) ↔ `Moon` (深色) 三态闭环流体形变 | 边缘微光、微弹跳 `active:scale-95` |
| **`MorphModeSwipeButton`** | 卷帘对比模式与方向 | 垂直卷帘 `SplitVertical` ↔ 水平卷帘 `SplitHorizontal`，90° 旋转拉伸 | 激活呼吸点、边框聚光 |
| **`MorphModeSyncButton`** | 双屏同步分屏方向 | 左右双列 `Columns2` ↔ 上下双行 `Rows2`，窗口分割中线解构重塑 | 激活指示微波 |
| **`MorphModeOverlayButton`** | 叠置融合模式 | 单层透光 `Layers` ↔ 双层透射复合 `Combine` | 层叠片立体回弹 |
| **`MorphSwapButton`** | 对调图层/双屏位置 | 左右互换 `ArrowLeftRight` ↔ 环流对调 `Repeat`，方向逆向流转 | 180° 旋转冲击波反馈 |
| **`MorphGalleryButton`** | 展开/收起底部地图画廊 | 网格矩阵 `LayoutGrid` ↔ 收起指示 `ChevronDown` / `PanelClose` | 矩阵收敛与绽放动画 |
| **`MorphCollapseButton`** | 沉浸全屏/折叠顶栏 | 向上收起 `ChevronUp` ↔ 向下展开 `ChevronDown` | 尖角弹性反折 |
| **`MorphComplianceButton`** | 地图说明与规制核准 | 说明 `Info` ↔ 证书规制 `FileCheck` | 墨水印章舒展形态 |

---

## 🚀 如何体验 Demo

1. **在主地图系统中直接打开**：
   - 启动项目 `npm run dev`，在顶部导航栏右侧点击 **「✨ 动效」** 按钮，即可随时呼出交互式动效实验室弹窗，支持调节物理参数并一键开启自动巡演！
2. **在独立浏览器页面中预览**：
   - 双击打开根目录下的 `demo/index.html`，即可体验轻量级纯矢量动效预览页面。
3. **在组件中使用**：
   ```tsx
   import { MorphThemeButton, MorphModeSwipeButton } from '@/demo/MorphButtons';
   
   <MorphThemeButton theme={theme} onCycleTheme={handleCycleTheme} />
   ```
