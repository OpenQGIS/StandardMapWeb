# Changelog

所有值得记录的变更都记录于此。格式参照 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/)。

---

## [Unreleased]

### Fixed

#### 暗色模式下主题切换图标颜色不一致

**文件：** `src/components/Header.tsx`  
**日期：** 2026-09-19

**问题描述**

暗色模式（`.dark`）下，顶部工具栏的主题切换按钮（ThemeLightIcon / ThemeDarkIcon）图标颜色与其他激活态图标不一致：

- `ThemeLightIcon`（浅色主题激活时显示）只写了 `text-amber-500`，**缺少** `dark:text-amber-400`，导致在暗色模式下无法应用 amber 颜色，图标颜色由父级 `text-zinc-100` 继承，呈白色。
- `ThemeDarkIcon`（深色主题激活时显示）只写了 `text-amber-400`，没有 `text-amber-500`（浅色值）也没有 `dark:` 前缀，颜色格式不一致。

其余激活态图标（卷帘、双屏、叠置模式图标；对调图标；画廊图标）均已正确使用 `text-amber-500 dark:text-amber-400`，仅主题切换图标遗漏。

**根本原因**

Tailwind CSS 配置 `darkMode: 'class'`，暗色类名由 `useThemeMode` hook 动态挂载到 `document.documentElement`（`<html>`）上。  
CSS 规则 `.dark\:text-amber-400:is(.dark *)` 本身正确生成，但 `ThemeLightIcon` / `ThemeDarkIcon` 上未声明该类，导致暗色模式下图标继承了根容器的白色文本色，而非目标 amber 色。

**修复内容**

```diff
- <ThemeLightIcon className="... text-amber-500 shrink-0" />
+ <ThemeLightIcon className="... text-amber-500 dark:text-amber-400 shrink-0" />

- <ThemeDarkIcon className="... text-amber-400 shrink-0" />
+ <ThemeDarkIcon className="... text-amber-500 dark:text-amber-400 shrink-0" />
```

**验证**

暗色模式下五处图标均呈 amber-400（`#fbbf24`）色：

| 图标 | 激活条件 | 修复前 | 修复后 |
|------|----------|--------|--------|
| 卷帘模式图标 | `mode === 'swipe'` | ✅ 已正确 | ✅ |
| 双屏模式图标 | `mode === 'sync'` | ✅ 已正确 | ✅ |
| 叠置模式图标 | `mode === 'overlay'` | ✅ 已正确 | ✅ |
| 对调图标 | `isSwapped === true` | ✅ 已正确 | ✅ |
| 画廊图标 | 始终显示 | ✅ 已正确 | ✅ |
| ThemeLightIcon | `theme === 'light'` | ❌ 白色 | ✅ amber |
| ThemeDarkIcon | `theme === 'dark'` | ❌ 白色 | ✅ amber |

---

*此 changelog 由 2026-09-19 版本维护开始记录。*
