<div align="center">
  <img width="130" src="https://github.com/BlackishGreen33/BiliBili-Analyzer/blob/main/public/icon.png?raw=true" alt="BiliBili-Analyzer logo">
  <h1 align="center">BiliBili-Analyzer</h1>
  <h3>哔哩哔哩近期热门视频分类检索分析系统</h3>
  <a href="https://github.com/BlackishGreen33/BiliBili-Analyzer"><strong>探索项目文档 »</strong></a>
  <br />
  <br />

![license](https://img.shields.io/github/license/BlackishGreen33/BiliBili-Analyzer)
![language](https://img.shields.io/github/languages/top/BlackishGreen33/BiliBili-Analyzer)
![last](https://img.shields.io/github/last-commit/BlackishGreen33/BiliBili-Analyzer)

<a href="https://bilibili-analyzer.vercel.app/" target="_blank">在线体验</a>
·
<a href="https://github.com/BlackishGreen33/BiliBili-Analyzer/issues">报告Bug</a>
·
<a href="https://github.com/BlackishGreen33/BiliBili-Analyzer/issues">提出新特性</a>

</div>

## ✨ 项目简介

BiliBili-Analyzer 是一个基于 [Bilibili](https://www.bilibili.com) 热门视频榜单的检索与可视化分析系统。

- 🛰️ **数据采集**：通过 B 站官方热门 API（`/x/web-interface/popular` + `/x/tag/archive/tags`）抓取每日热门视频并附带 UP 主、分区、标签等元信息
- 🔍 **多维检索**：支持按标题关键字、一级/二级分区组合过滤
- 📊 **可视化分析**：详情页提供视频统计图表、标签云、作者卡片等分析视图
- 📱 **跨端**：基于 Next.js App Router 构建 Web 端，并通过 Capacitor 打包为 Android/iOS 应用

## 🧱 技术栈

- **框架**：Next.js 15 / React 19 / TypeScript
- **UI**：Tailwind CSS v4、antd、Radix UI、Syncfusion EJ2 Charts、react-d3-cloud
- **状态**：Zustand
- **数据源**：`github:result` 分支上的 `list.json` + 按日期命名的 JSON 抓取结果
- **数据采集**：Axios（Node 脚本，调用 B 站官方 API）
- **移动端**：Capacitor
- **代码规范**：ESLint 9 (flat config) + Prettier + Husky + lint-staged

## 🗂️ 目录结构

```
src/
├── app/                # Next.js App Router 路由
│   ├── (main)/         # 首页（Search）
│   ├── api/            # 服务端 API 路由（randomBvid / videoInfo / videoTags）
│   ├── details/        # 视频详情页
│   └── search/         # 同首页（Search）
├── common/
│   ├── components/     # 通用组件（layouts / sidebar / navbar / ui ...）
│   ├── constants/      # 全局常量
│   ├── hooks/          # Zustand store 等通用 hooks
│   ├── libs/           # 工具库（含结果数据 fetcher）
│   ├── providers/      # 全局 Provider
│   ├── styles/         # 全局样式与字体
│   └── types/          # 共享类型定义
└── modules/            # 业务模块
    ├── Home/           # 首页壳
    ├── Search/         # 检索 + 列表
    └── Detail/         # 视频详情
```

## 🔖 提交规范

- 🎉 init：项目初始化
- ✨ feat：新增功能（feature）
- 🐞 fix：修复bug
- 📃 docs：文档修改
- 🌈 style：代码样式修改，不影响原代码逻辑
- ✅ test：测试相关的改动
- 🔨 refactor：代码重构
- 🔧 chore：建制过程或辅助工具的变动

## 🎯 相容环境

- 现代浏览器（Chrome >= 64, Edge >= 79, Firefox >= 78, Safari >= 12）

## 💻 本地调试

记得先配置环境变量（仅在使用 Syncfusion 高级特性时需要）：

```env
SYNCFUSION_LICENSE=
```

接着拉取代码和安装依赖：

```bash
$ git clone https://github.com/BlackishGreen33/BiliBili-Analyzer.git
$ cd BiliBili-Analyzer
$ pnpm install
$ pnpm run dev
```

## 🛠️ 可用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm lint` | 跑 ESLint（flat config） |
| `pnpm prettier` | 格式化代码 |
| `pnpm crawldata` | 抓取当日热门视频（写入 `result/` 目录） |

## 🛰️ 数据采集

`CrawlPopular.cjs` 调用 [B 站热门 API](https://socialsisteryi.github.io/bilibili-API-collect/docs/video_ranking/popular.html) 取得每日热门视频列表（含 `tid`/`tname`/`tnamev2` 等分区与 UP 主元信息），并对每支视频调用标签 API 补齐普通标签，最终生成 `result/<时间戳>.json`，并把文件名维护到 `result/list.json`。CI 中通过 `crawl.yml` 每天 12:00（UTC+8）自动执行。

## 📝 授权

上述文件皆以 MIT 许可授权

> 详细之授权请参考 [LICENSE](LICENSE) 文件
