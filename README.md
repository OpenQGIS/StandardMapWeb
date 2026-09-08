# 中国标准底图与复刻地图对比工作台 (Standard Map Compare Workbench)

一个面向专业测绘鉴赏、地理历史对比的在线地图对比平台。支持横竖版标准中国地图规范底图，并与清代古舆图、宋代青绿山水、民国实测石印图进行**双图视口毫秒级同步联动**与**高精卷帘对比**。

---

## 🌟 核心功能

1. **上部核心主视窗**
   - **卷帘对比 (Swipe Curtain)**：支持「跟随地图移动缩放（图面要素锚定）」与「固定视窗切分」双模式，拖动中轴卷帘无缝比对底图与复刻版。
   - **双屏联动 (Sync Dual-View)**：左右双屏布局，在任意一侧滚轮缩放、鼠标平移，两侧绝对毫秒级同步锁定。
   - **透明叠置 (Opacity Overlay)**：单视口上下直接重叠，支持 0%~100% 透明度渐变与正片叠底/差值混合模式。
   - **投影微调 (Calibration)**：提供 X/Y 轴与比例尺微调托盘，精准校准手工古图的投影变形。
   - **以鼠标光标为中心缩放**：采用标准 GIS 仿射变换不变式，光标所指地标像素在缩放过程中绝对锚定。

2. **下部地图画廊**
   - **横版规范图幅**：包含国家标准横版（1:1600万带南海诸岛附图）、清代宣纸舆图复刻、宋代千里江山复刻、民国申报实测石印复刻。
   - **竖版规范图幅**：包含国家标准竖版（1:2400万陆海同幅）、古代万里海疆针经更路图复刻、立体晕渲地貌复刻。

---

## 💻 本地运行与开发

```bash
# 1. 克隆或进入项目目录
cd StandardMapWeb

# 2. 安装依赖包
npm install

# 3. 启动本地开发服务
npm run dev

# 4. 构建生产产物
npm run build
```

---

## 🚀 推送到 GitHub 并自动挂载 (GitHub Pages)

本项目已针对 GitHub Pages 进行了专项适配（静态资源路径采用相对路径 `./`，并内置了 `.github/workflows/deploy.yml` 自动化工作流）。

### 第一步：在 GitHub 上新建空仓库
在您的 GitHub 账号中点击 `New repository`，仓库名称建议填 `StandardMapWeb`（Public 或 Private 均可），**不要勾选** "Add a README file"（本地已有完整代码）。

### 第二步：添加远程地址并推送到 GitHub
在当前项目根目录终端中执行以下命令（将其中的 `YOUR-USERNAME` 替换为您自己的 GitHub 用户名）：

```bash
# 1. 关联远程仓库
git remote add origin https://github.com/YOUR-USERNAME/StandardMapWeb.git

# 2. 推送代码到 GitHub
git push -u origin main
```

### 第三步：开启 GitHub Pages 自动挂载
1. 进入您 GitHub 仓库的 **Settings**（设置）页面；
2. 在左侧菜单点击 **Pages**；
3. 在 **Build and deployment** 下方的 **Source** 下拉菜单中，选择 **GitHub Actions**；
4. 此时 GitHub Actions 会自动读取项目中的 `.github/workflows/deploy.yml` 执行自动打包与发布；
5. 约 1~2 分钟后，刷新页面即可看到公开访问网址：
   `https://YOUR-USERNAME.github.io/StandardMapWeb/`

---

## 📜 审图与地图规范说明
本项目底图标绘严格遵照自然资源部标准地图服务系统（GS(2019)1651号、GS(2019)1652号等）编制，完整规范呈现中国陆海疆域、南海十段线、诸岛礁、钓鱼岛与赤尾屿。
