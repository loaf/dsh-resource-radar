# dsh-resource-radar · 资源雷达

一个用于 **DeepSeek Harness (DSH)** 的界面插件：在左侧导航栏新增「资源雷达」入口，点开是一个参考 [ZiChuanLan/freebie-radar](https://github.com/ZiChuanLan/freebie-radar) 的福利 / 好价 / 开源 / 资讯聚合工作台，并带一个 **Host 端无 CORS 的 RSS 采集器**。

> 这是一个 DSH 插件（bundle），不是独立应用。它通过 DSH 的 `sidebar.panellist` 与 `main` 槽位注册导航入口与中央面板。

## 功能

- **兴趣频道**：真福利精选 / 全部白嫖 / 好价 / 开源 / 重要新闻 / 行业资讯，一键切换。
- **三级筛选**：内容形态（`freebie` / `deal` / `opensource` / `news` / `info` / `noise`）× 27 类垂直分类 × 6 级获取方式（`free` / `conditional` / `lottery` / `trial` / `promo` / `paid`）+ 关键词搜索。
- **屏蔽词防火墙**：命中屏蔽词的条目在列表中隐藏。
- **数据源管理**：内置可用的 RSS/Atom 源（可启停），支持新增自定义源、编辑订阅地址、为每个源设定默认形态。
- **手动采集**：顶部「⟳ 采集」一键采集所有已启用源；也可在「数据源」页对单源点采集。采集由 **Host 半的 `/radar-fetch` 路由在 Node 侧发起**，天然不受浏览器同源策略（CORS）限制；直连失败时前端还会退到公共中转兜底。
- **条目操作**：收藏、忽略、复制兑换码、打开原文；卡片 / 紧凑两种视图。
- **实例桥接（尽力而为）**：在「设置」填自托管 freebie-radar 地址后，可尝试拉取其 `/api/items` 并打开实例页面。

## 安装

### 方式一：插件管理器（推荐）
DeepSeek Harness → **设置 → 插件 → 添加插件 → 本地目录**，选择本仓库目录。

### 方式二：命令行
```bash
# 在 DSH 的 profile 里安装本地 bundle（把 <本仓库路径> 换成实际绝对路径）
# 可通过 DSH 的 plugin_manager / install_bundle 完成，或参照你的 DSH 版本说明
```

> **注意**：本插件有 Host 半（`index.js`，注册 `/radar-fetch` 采集路由）。DSH 的桌面宿主只在**进程启动时**加载 Host 半，因此首次安装 / 更新 Host 代码后需要**完整重启 DeepSeek Harness**（不是只刷新页面）。前端部分支持热更新。

## 结构

```
.
├── package.json         # DSH bundle 清单（dsh.bundle / dsh.client）
├── cordis.patch.yml     # 插入 resource-radar 行
├── index.js             # Host 半：注册 /radar-fetch 抓取代理（Node 抓取，无 CORS）
├── client.js            # 前端半：导航入口 + 工作台（React.createElement，无构建）
├── icon.svg             # 插件图标
├── locale/{zh,en}.json  # 插件显示标题 / 描述
└── docs/DETAIL.md       # 插件详情
```

## 采集原理

浏览器页面里的 `fetch` 读跨域资源会被 CORS 拦截（你在地址栏能打开 RSS ≠ 页面脚本能读取它）。本插件因此把抓取放到 Host 半：

```
前端「⟳ 采集」 → GET /radar-fetch?url=<RSS> → Node fetch 目标源 → 原样返回 XML → 前端 DOMParser 解析 → 去重并入信息流
```

`/radar-fetch` 带浏览器 UA、20s 超时、5MB 上限，并拒绝内网地址（防 SSRF）。

## 已知限制

- **受 Cloudflare 保护的站点**（如 LINUX DO、NodeSeek）Node 直连会返回 403「Just a moment」，需要额外部署 FlareSolverr 才能采集；这些源默认停用并在名称中标注。
- 默认启用的可用源：V2EX、GamerPower、SharewareOnSale、Reddit r/freebies、少数派、Solidot、Hacker News。
- 第一版不含定时采集、AI 语义定级与 Telegram 推送；如需完整能力可自托管 freebie-radar 并在插件「设置」中连接。

## 致谢

分类体系与产品思路参考 [ZiChuanLan/freebie-radar](https://github.com/ZiChuanLan/freebie-radar)（MIT）。

## License

[MIT](./LICENSE)
