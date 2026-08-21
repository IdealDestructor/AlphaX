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

> 当前分支 `main`，最近版本 4.9（2026-08-21）。

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

### 模拟数据接口 → 真实 API 对接（2026-08-21，api build / web typecheck / lint / build 绿）
- [x] **Smart Money COT → CFTC 官方**：`cot.provider.ts` 解析每周 Disaggregated 报告（免费无 Key，COMEX Gold/Silver Money Manager 持仓），失败降级估算并标注 `sources.cot='cftc'|'mock'`；`GET /smart-money` 返回 `cot` 报告元信息
- [x] **Sentiment → CNN Fear & Greed**：`fear-greed.provider.ts`（免费无 Key），作为 `/sentiment` 的 `market` 级真实情绪 + `/dashboard` KPI/看板联动；news 分量本已真实，social 仍估算（无免费源）
- [x] **Forecast 去随机**：pUp/pDown/median/band 改由真实日K（ATR 波动率 + RSI/EMA 方向偏置）确定性计算，置信度由数据完整度决定
- [x] **Analysis 去随机**：trend/action/levels/evidence 改由真实指标规则引擎（EMA/RSI/MACD/BB/ATR）确定性生成，`modelVersion=rule-v2.1`（真实 LLM 待 P2）
- [x] **Dashboard 联动**：市场情绪分读 CNN、ETF/COT 字段读真实 Smart Money，去掉 `Math.random` 编造
- [ ] **仍为估算/待 P2**：Chat mockAiResponse（LLM）、social 情绪分量、ETF 净流入/央行购金（无可靠免费 API）
- [ ] 待本地验证：CFTC / CNN 端点 curl 复核（沙箱无外网）

### 前后端对齐（2026-08-21 落地，typecheck / lint / build / test 绿）
- [x] `/analysis/{symbol}/history` — 分析页 History tab 已接入 `AnalysisHistory`
- [x] `/journal` 全套 CRUD + `/journal/stats` — 前端 `/journal` 页（表单/列表/统计/编辑/删除，Pro 门控）
- [x] `/tools/position-calculator` — 前端 `/tools` 页（本地即时预览 + 后端权威计算，Pro 门控）
- [x] `/sentiment` — 前端 `/sentiment` 页（情绪指数 + 新闻/社媒分量）
- [x] `/smart-money` — 前端 `/smart-money` 页（ETF/COT/央行 + 14 日资金流历史，Pro 门控）
- [x] `/watchlist` — 前端 `/watchlist` 页（增删 + 实时价格 + 配额提示）
- [x] `/enterprise` — 前端 `/enterprise` 企业工作台（API 密钥管理 + 安全说明 + 套餐门控）
- [x] 注册流程 UI 页面（`/register`，4.7 已落地）
- [x] 导航接入：Sidebar 新增 6 项 + Topbar 标题/AssetSwitcher 排除

### P0 数据源增强（2026-08-21 落地）
- [x] Provider 健康检查：连续失败计数 + 熔断冷却（`MARKET_CIRCUIT_THRESHOLD` / `MARKET_CIRCUIT_COOLDOWN_MS`）
- [x] 主备切换：失败自动尝试下一个可解析真实源，最后才 mock（quotes 批量 + candles 均支持）
- [x] 串行限流：同一源最小请求间隔（`MARKET_MIN_REQUEST_INTERVAL_MS`），状态透出 `/market/data-source`
- [x] 内存 TTL 缓存过渡（`MarketCacheService`：quote 15s / candle 60s，`MARKET_QUOTE_TTL_MS` / `MARKET_CANDLE_TTL_MS`）
- [x] `symbols` 表扩展字段（exchange/market/currency/timezone/price_source）+ seed 补齐
- [x] 新闻 RSS 收编为 Provider：零依赖 RSS/Atom 解析（`rss-xml.parser.ts`）+ `NewsRssService` + `POST /news/sync` 幂等入库

---

## 🔄 进行中（P0 收尾）

### 待本地验证（沙箱无外网，需本地 curl / 启动复核）
- [ ] Binance / Treasury / TwelveData 真实端点 curl 验证（字段语义、周期支持、限频）
- [ ] TickFlow 真实 Key 验证 `/v1/quotes`、`/v1/klines` 响应结构与 `INTERVAL_MAP`
- [ ] 前端 `apps/web` dev server 本地启动复核

### P0 剩余
- [x] 新闻 RSS 收编为 Provider（零依赖解析 Google News / Kitco / CoinDesk / CNBC + `POST /news/sync` 幂等入库；真实源抓取待本地验证）
- [x] `/market/quotes|candles` 默认真实数据（配置 Key 即走真实源）；`NEXT_PUBLIC_MOCK` 一键回退（机制就绪，端点待本地验证）
- [x] Provider 健康检查（熔断计数 + 冷却）+ 主备切换（失败自动切下一真实源）+ 串行限流（最小请求间隔），状态透出 `/market/data-source`
- [x] P0 内存 TTL 缓存过渡（quote 15s / candle 60s，`MarketCacheService`）；Redis 待 P3 换入
- [x] `symbols` 表扩展（exchange / market / currency / timezone / price_source，schema+seed 已落地，`db push` 待本地执行）


### 注册 / 登录 / 付费授权（2026-08-20，技术方案见 docs/AUTH_BILLING_TECHNICAL_PLAN.md）
- [x] 技术方案文档整理（AUTH_BILLING_TECHNICAL_PLAN.md + ADR-017 + API_SPEC/API_CLIENT/MONETIZATION 同步）
- [x] 后端：User 设置字段 + Order/License 表；auth 统一响应；/user/settings 落库
- [x] 后端：billing checkout/confirm/license/subscription/portal + 模拟支付 + Stripe 可选
- [x] 后端：Entitlements 权益门控（RequirePlan + 配额：Chat 10/200/2000 · 自选 5/50/500 · 告警 3/50/500）
- [x] 前端：/login /register 页 + AuthProvider 对齐 + Topbar/Sidebar 用户区
- [x] 前端：/billing /billing/checkout 页
- [x] 前端：/settings 真实化（资料/密码/币种/配色/通知/API Key + 403 升级引导）
- [x] 本地全流程验证（注册→登录→设置→门控→模拟支付→授权码）+ typecheck/lint/test 绿



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




