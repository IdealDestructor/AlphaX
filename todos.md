# AlphaX 项目待办清单（todos）

> 本文档是项目的唯一任务清单：✅ 已完成 / 🔄 进行中 / ⏳ 未开始。
> 维护规则：任务完成后把对应条目移入「✅ 已完成」，并同步 [README.md](./README.md) 与 [UPGRADE_PLAN.md](./docs/UPGRADE_PLAN.md)。
> 阶段划分、路线与验收标准见 [docs/UPGRADE_PLAN.md](./docs/UPGRADE_PLAN.md)。

---

## 状态速览

| 阶段 | 焦点 | 状态 | 关键交付 |
|------|------|------|----------|
| **基础 MVP（V1）** | 可上线的 Gold AI 分析闭环 | ✅ 核心已完成 | Monorepo 骨架 · 16+ 后端模块 · Prisma 持久化 · 前端已接入主要端点 |
| **P0 数据源 PoC** | 真实行情替换 mock | 🔄 进行中 | 4 个 Provider（TwelveData/Binance/Treasury/TickFlow）+ Registry 分层降级；待本地验证与收尾 |
| **P1 数据湖 + 回测** | 数据沉淀 + 分析工具 | ⏳ 未开始 | Parquet/DuckDB 数据湖 · 指标管线 · Screener · 回测引擎 · SSE |
| **P2 AI 服务 + 投研** | 多 Agent 投研闭环 | ⏳ 未开始 | `apps/ai` · MCP Server · 多空辩论 · 资讯雷达 · 盘后复盘 |
| **P3 实时 + 商业化** | 主动触达 + 变现 | ⏳ 未开始 | WebSocket 网关 · 四类监控 · Stripe 真实化 · Pro 门控 |

> 当前分支 `main`，最近版本 4.6（2026-08-20）。

---

## ✅ 已完成

### 基础设施与本地启动
- [x] pnpm monorepo：`apps/web` + `apps/api`（Node 22 · pnpm 11 · workspace 已预留 `packages/*`）
- [x] PostgreSQL 16 容器（`apps/api/docker/docker-compose.yml`）+ Prisma `db:generate` / `db:push` / `db:seed`
- [x] 后端 NestJS dev server 启动（`http://localhost:4000/api/v1`）
- [x] `apps/api/.env` + `.env.example`（含 TickFlow / TwelveData / Binance / Treasury 数据源配置）
- [x] Docker 部署文件（`apps/api/docker`）

### 后端 API 模块（均通过 `nest build` / `tsc`）
| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| Auth | `/api/v1/auth` | 注册/登录/JWT 刷新/OAuth 占位（Google/GitHub） |
| User | `/api/v1/user` | profile / password / watchlist / settings（`/me` 覆盖 profile+prefs） |
| Market | `/api/v1/market` | symbols / quotes / candles / indicators / **data-source** / providers |
| Analysis | `/api/v1/analysis` | 分析生成 + 持久化 + `POST {symbol}/refresh` |
| Signals | `/api/v1/signals` | 信号列表 + `stats`（聚合/胜率） |
| Forecast | `/api/v1/forecast` | 概率带预测 + 持久化 |
| News | `/api/v1/news` | RSS 入库 + DB 查询 / 分页 / symbol 过滤 |
| Sentiment | `/api/v1/sentiment` | News 聚合 + 稳定哈希（无独立表） |
| Smart Money | `/api/v1/smart-money` | ETF/COT/央行购金确定性快照 + 历史 |
| Alerts | `/api/v1/alerts` | 告警 CRUD |
| Chat | `/api/v1/chat` | 会话/消息 + `POST /chat/stream` SSE 流式 |
| Dashboard | `/api/v1/dashboard` | 首页聚合 |
| Journal | `/api/v1/journal` | 交易日志 CRUD + 统计 |
| Tools | `/api/v1/tools` | 仓位计算器（position-calculator） |
| Billing | `/api/v1/billing` | plans 静态；checkout/portal 占位（Stripe 待接） |
| Watchlist | `/api/v1/watchlist` | 自选 CRUD（复用同一张表） |
| Enterprise | `/api/v1/enterprise/api-keys` | API 密钥：明文只返回一次，落库 SHA-256 |

### 前端接入（typecheck / eslint 通过）
- [x] **Market** — `features/market/api.ts` 聚合 `/market/symbols` + `/quotes` + `/candles` + `/indicators`
- [x] **Forecast** — 改为 `GET /forecast/latest?symbol=&horizon=`
- [x] **News** — `features/news/api.ts` 调用后端 `/news`（字段映射 + 失败回退 mock）
- [x] **Analysis** — 组装 current + history + `/signals/stats`；「刷新分析」接入 `POST /analysis/{symbol}/refresh`
- [x] **Auth** — `register()`（`POST /auth/register`）；修复 `loginWithOAuth` base URL bug；OAuth 路由已由后端补齐
- [x] **Chat** — 非 mock 下走 `POST /chat/stream` SSE 流式（乐观更新 + token 增量）
- [x] 行情页来源角标（`MarketHeader`：TickFlow / Binance / US Treasury / TwelveData / 模拟数据）

### P0 数据源（2026-08-20 落地）
- [x] Provider 注册表 + 分层降级（`market/providers/registry.ts`）：**TwelveData → Binance → Treasury → TickFlow → Mock**，按标的路由，quotes/candles 带 `source` 字段
- [x] **TickFlow Provider**（股票/ETF/指数）：`/v1/quotes` + `/v1/klines[/intraday]`，标的映射 GLD/SLV/SPY/NAS100/SPX500
- [x] **Binance Provider**（加密，免 Key）：`/ticker/24hr` + `/klines`，BTCUSD→BTCUSDT
- [x] **Treasury Provider**（美债，免 Key）：US Treasury 官方 CSV → US10Y 收益率
- [x] **TwelveData Provider**（黄金/白银，需 Key）：`/price` + `/time_series`；未配置 Key 自动跳过
- [x] `GET /market/data-source`：primary / providers / live / lastError / symbolMap
- [x] `.env` 加载（Node22 `process.loadEnvFile`，零依赖）
- [x] 三类标的免费数据源调研落定（UPGRADE_PLAN §3.2.1）：黄金/白银、加密、美债收益率

### 种子数据
- [x] 15 条新闻 / 8 个信号 / 6 条 AI 分析 / 5 条预测 / 4 条日志 / 4 个自选
- [x] Demo 用户：`demo@alphax.com` / `demo123456`

---

## 🔄 进行中（P0 收尾）

### 待本地验证（沙箱无外网，需本地 curl / 启动复核）
- [ ] Binance / Treasury / TwelveData 真实端点 curl 验证（字段语义、周期支持、限频）
- [ ] TickFlow 真实 Key 验证 `/v1/quotes`、`/v1/klines` 响应结构与 `INTERVAL_MAP`
- [ ] 前端 `apps/web` dev server 本地启动复核

### P0 剩余
- [ ] 新闻 RSS 收编为 Provider（Google News / Kitco / CoinDesk / CNBC）
- [ ] `/market/quotes|candles` 默认切换真实数据；`NEXT_PUBLIC_MOCK` 一键回退
- [ ] Provider 健康检查 + 主备切换 + 串行限流（参考 a-stock-data `em_get`）
- [ ] Redis 缓存（quote 5–15s / candle 30–60s）；P0 用内存 TTL 过渡
- [ ] `symbols` 表扩展（exchange / market / currency / timezone / price_source）


### 注册 / 登录 / 付费授权（2026-08-20，技术方案见 docs/AUTH_BILLING_TECHNICAL_PLAN.md）
- [x] 技术方案文档整理（AUTH_BILLING_TECHNICAL_PLAN.md + ADR-017 + API_SPEC/API_CLIENT/MONETIZATION 同步）
- [ ] 后端：User 设置字段 + Order/License 表；auth 统一响应；/user/settings 落库
- [ ] 后端：billing checkout/confirm/license/subscription/portal + 模拟支付 + Stripe 可选
- [ ] 后端：Entitlements 权益门控（RequirePlan + 配额）
- [ ] 前端：/login /register 页 + AuthProvider 对齐 + Topbar/Sidebar 用户区
- [ ] 前端：/billing /billing/checkout 页
- [ ] 前端：/settings 真实化（资料/密码/币种/配色/通知/API Key）
- [ ] 本地全流程验证 + 文档最终同步

### 前后端对齐（后端已实现、前端待消费）
- [ ] `/analysis/{symbol}/history` — 前端 `AnalysisHistory` 组件未接入
- [ ] `/journal` 全套 CRUD + `/journal/stats` — 前端无 journal 页面
- [ ] `/tools/position-calculator` — 前端无 tools 页面
- [ ] `/user/*`（profile/password/watchlist/settings）— 前端 settings 走 `/me`
- [ ] `/sentiment`、`/smart-money`、`/billing`、`/watchlist`、`/enterprise` — 后端已实现，前端页面/消费待落地
- [ ] 注册流程 UI 页面（`AuthProvider.register()` 已实现，页面未落地）

---

## ⏳ 未开始

### P1 — 本地数据湖 + 指标 + 回测（3–4 周）
- [ ] `data/` 本地数据湖：日K/分钟K Parquet + schema 版本化（参考 tickflow）
- [ ] 盘后批量同步 + 盘中增量追加
- [ ] 指标 enriched 管线（MA/EMA/MACD/RSI/KDJ/BOLL/ATR/VWAP）
- [ ] 信号扫描（Screener）：内置策略 + 自定义条件（对齐 tickflow 18 策略思路）
- [ ] 回测引擎：因子回测（IC/IR/分层）+ 策略回测（净值/回撤/夏普/胜率）
- [ ] SSE：`/market/stream`、`/analysis/stream`（替代 15s 轮询）

### P2 — apps/ai + 投研闭环（4–6 周）
- [ ] `apps/ai` FastAPI 服务：/ai/chat /ai/debate /ai/reflect /ai/analyze（SSE/NDJSON）
- [ ] 可插拔 LLM：OpenAI 兼容 / DeepSeek / Ollama / 本机 CLI 订阅 + token 预算
- [ ] 多空辩论（事实底稿 → 多方/空方 → 中立主持 → 验证清单）
- [ ] 反思审计（对已有分析做推理审计）
- [ ] 资讯雷达（12 赛道多源 RSS + AI 提炼今日要点）
- [ ] 盘后 AI 复盘（定时执行 + 推送）
- [ ] MCP Server（零依赖 JSON-RPC over stdio：query_quote / query_analysis / query_news…）
- [ ] Pydantic schema 与前端 Zod 对齐（ADR-006 落地）

### P3 — 实时 + 监控 + 商业化（4–6 周）
- [ ] WebSocket `/v1/ws` 网关（quote/candle/analysis/signal 频道；安装 `@nestjs/websockets`/`ws`）
- [ ] 四类监控（策略/个股信号/价格/异动）+ 多通道推送（邮件/Telegram/飞书/WebPush）
- [ ] 自选批量导入 + 表格/卡片双视图 + 实时行情开关
- [ ] 首页看板升级：市场情绪评分 + 榜单 + 异动事件流
- [ ] Stripe 真实 checkout/webhook/portal + Pro 门控
- [ ] `packages/schemas` 共享 Zod 契约落地
- [ ] `/admin/*` 管理端点

### 产品原则（长期约束，开发时始终遵守）
- [ ] 数据摆全、框架公开、结论归用户；AI 不产出买卖指令
- [ ] 多空辩论/反思以「分歧点 + 验证清单」收尾，不以下结论收尾
- [ ] 能拿到真数据绝不让模型编；源挂了如实报缺，不填空
- [ ] 用户自选/持仓/研报仅存本地，不上传第三方

---

## 历史记录（changelog）

### 2026-07-26 — Backend 启动 + 数据层修复
- News / Analysis / Forecast 持久化到 DB；新增 Journal、Tools 模块；seed 增强；路由总览 ✅

### 2026-08-14 — API 补齐
- 后端新增 Sentiment / Smart Money / Billing / Watchlist / Enterprise / Signals stats / Analysis refresh / Auth OAuth
- 前端接入 News / Analysis / Auth register + OAuth 修复 / Chat SSE

### 2026-08-20 — P0 数据源接入
- TickFlow 接入 → 三类免费源调研落定 → 新增 Binance / Treasury / TwelveData → Registry 多 Provider 路由 + `/market/data-source`
