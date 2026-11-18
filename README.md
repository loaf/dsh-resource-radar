# dsh-resource-radar · 资源雷达

一个用于 **DeepSeek Harness (DSH)** 的界面插件：在左侧导航栏新增「资源雷达」入口，点开是一个参考 [ZiChuanLan/freebie-radar](https://github.com/ZiChuanLan/freebie-radar) 的福利 / 好价 / 开源 / 资讯聚合工作台。采集结果**自动经 AI 筛选、定级并翻译成中文**后展示，AI 使用 DSH 中已配置的默认模型，无需额外 API Key。

> 这是一个 DSH 插件（bundle），不是独立应用。它通过 DSH 的 `sidebar.panellist` 与 `main` 槽位注册导航入口与中央面板。

## 功能

- **兴趣频道**：真福利精选 / 全部白嫖 / 好价 / 开源 / 重要新闻 / 行业资讯 + ★ 收藏，频道名带实时计数。
- **AI 自动流水线**：刷新时抓取 → 去重 → AI 筛选（`keep` 淘汰噪音/软文）→ 语义定级（六类形态 × 27 类分类 × 6 级获取方式 × 1–5 星）→ 标题/摘要翻译成中文 → 入库。
- **数据源管理**：内置可用 RSS/Atom 源（可启停/删除），支持新增自定义源、编辑订阅地址、按源刷新。
- **浏览体验**：三级筛选（收在 ⚙ 过滤弹层）、屏蔽词防火墙、已读标记（置灰沉底）、★ 收藏频道、卡片/紧凑视图、状态胶囊 + 悬浮刷新日志。
- **持久化**：数据保存在 DSH profile 目录的 `resource-radar-data.json`（可备份/迁移），localStorage 仅作缓存。

## 工作流程

```
⟳ 刷新（前端）
  → GET /radar-fetch?url=<RSS>   Host 端 Node 抓取（无 CORS，浏览器同源策略不适用）
  → 前端解析 RSS/Atom，与已入库条目按 URL/标题键去重，只取新条目
  → GET /radar-ai?payload=…      Host 端用 ctx.llm.stream 调用 DSH 默认模型
      （8 条/批 × 3 路并发；输出 keep/kind/category/obtain/quality/titleZh/noteZh/reason）
  → keep=false 丢弃；其余带着中文翻译入库 → 频道分流展示
```

模型选择：优先 `agentDefaultModel.currentSelection()`（DSH 设置里的默认模型），否则取第一个已注册 provider 的第一个模型。

## 安装

DeepSeek Harness → **设置 → 插件 → 添加插件 → 本地目录**，选择本仓库目录。

> **注意**：本插件有 Host 半（`index.js`，注册 `/radar-fetch`、`/radar-ai`、`/radar-store` 路由）。DSH 的桌面宿主只在**进程启动时**加载 Host 半，因此首次安装 / 更新 Host 代码后需要**完整重启 DeepSeek Harness**（不是只刷新页面）。前端部分支持热更新。

## 结构

```
.
├── package.json         # DSH bundle 清单（dsh.bundle / dsh.client）
├── cordis.patch.yml     # 插入 resource-radar 行（inject: llm / agentDefaultModel / webServer）
├── index.js             # Host 半：三个路由（抓取代理 / AI 定级 / 持久化存储）
├── client.js            # 前端半：导航入口 + 工作台（React.createElement，无构建）
├── icon.svg             # 插件图标
├── locale/{zh,en}.json  # 插件显示标题 / 描述
└── docs/DETAIL.md       # 插件详情（插件管理页展示）
```

## Host 端路由

| 路由 | 说明 |
|---|---|
| `GET /radar-fetch?url=…` | 抓取代理：Node 发起请求（浏览器 UA、20s 超时、5MB 上限、拒绝内网地址），原样返回内容 |
| `GET /radar-ai?payload=…` | AI 定级：`{items:[…]}`（≤8 条）→ DSH 默认模型 → `{ok, model, results:[{id,keep,kind,category,obtain,quality,titleZh,noteZh,reason}]}` |
| `GET/POST /radar-store` | 持久化：GET 读 `<profile>/resource-radar-data.json`，POST 校验后写入 |

## 已知限制

- **受 Cloudflare 保护的站点**（如 LINUX DO、NodeSeek）Node 直连返回 403，需要额外部署 FlareSolverr 才能采集；这些源默认停用并在名称中标注。
- AI 定级质量取决于 DSH 中配置的模型；每次刷新的耗时与 token 消耗随新条目数线性增长。
- RSS 抓取每源上限 40 条；不含定时自动刷新、推送路由与多用户，需要完整能力请自托管 freebie-radar。

## 致谢

分类体系与产品思路参考 [ZiChuanLan/freebie-radar](https://github.com/ZiChuanLan/freebie-radar)（MIT）。

## License

[MIT](./LICENSE)
