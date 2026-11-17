# Resource Radar（资源雷达）

左侧导航新增「资源雷达」入口，点开后在中央面板呈现一个参考 [ZiChuanLan/freebie-radar](https://github.com/ZiChuanLan/freebie-radar) 的福利/资讯聚合工作台。

## 功能

- **兴趣频道**：真福利精选 / 全部白嫖 / 好价 / 开源 / 重要新闻 / 行业资讯，一键切换。
- **三级筛选**：内容形态（freebie / deal / opensource / news / info / noise）× 垂直分类 × 获取方式（free / conditional / lottery / trial / promo / paid），外加关键词搜索。
- **屏蔽词防火墙**：命中屏蔽词的条目在列表中直接隐藏，与管理区共享一份词库。
- **数据源管理**：内置精选源清单（可启停），新增自定义 RSS 源。
- **条目操作**：收藏、忽略（学习进屏蔽样本）、复制链接、打开原文。
- **手动采集**：工作台顶部「⟳ 采集」按钮一键采集所有已启用源；「数据源」页可对单个源点「⟳ 采集」，并为每个源配置 RSS/Atom 订阅地址与默认形态。采集在浏览器端直接抓取，直连失败时自动经公共 CORS 中转重试；结果按 URL/标题去重合并入信息流，并在面板里显示采集日志与每个源的上次结果。
- **实例桥接（尽力而为）**：在「设置」里填自托管 freebie-radar 地址后，可尝试拉取 `/api/items` 的条目并打开实例页面；拉取失败时自动回落本地数据。

## 数据存放

条目、数据源与屏蔽词保存在当前浏览器的 `localStorage`（键 `resource-radar.v1`），不写入会话日志或 Host 配置。清除浏览器数据即重置。

## 已知限制

- 采集由 Host 半的 `/radar-fetch` 路由在 Node 侧发起（无 CORS）。**受 Cloudflare 保护的站点**（如 LINUX DO、NodeSeek）会返回 403「Just a moment」，需要另行部署 FlareSolverr 才能采集；这些源默认停用并在名称中标注。
- 默认启用的可用源：V2EX、GamerPower、SharewareOnSale、Reddit r/freebies、少数派、Solidot、Hacker News。
- 第一版不含定时采集、AI 语义定级与 Telegram 推送；如需完整能力可自托管 freebie-radar 并在本插件「设置」中连接实例。
