# AlphaX Backend 启动待办事项

## 启动步骤记录

- [x] **依赖检查** — pnpm/node_modules 已安装，Node v22.14.0
- [x] **Docker Desktop 启动** — 启动 Docker 服务
- [x] **PostgreSQL 容器启动** — 使用 `apps/api/docker/docker-compose.yml` 启动 postgres:16-alpine
- [x] **Prisma Client 生成** — `pnpm db:generate` 成功
- [x] **数据库 Schema 推送** — `pnpm db:push` 成功，数据库已就绪
- [x] **后端 Dev Server 启动** — `pnpm dev` 在 http://localhost:4000/api/v1 运行

## 已注册的路由

| 模块 | 路由前缀 |
|---|---|
| Auth | `/api/v1/auth` |
| Market | `/api/v1/market` |
| Analysis | `/api/v1/analysis` |
| Signals | `/api/v1/signals` |
| Forecast | `/api/v1/forecast` |
| News | `/api/v1/news` |
| Alerts | `/api/v1/alerts` |
| Chat | `/api/v1/chat` |
| User | `/api/v1/user` |

## 已完成改进 (2026-07-26)

### 数据层修复
- [x] **News Service 重构** — 从内存生成改为 Prisma DB 查询，支持按 symbol 过滤和分页
- [x] **Analysis Service 持久化** — `generateAndSave()` 现在将分析结果保存到数据库
- [x] **Forecast Service 持久化** — `generateAndSave()` 现在将预测结果保存到数据库

### 新模块
- [x] **Journal 模块** — 完整的 CRUD + 统计数据 (`/api/v1/journal`)
- [x] **Tools 模块** — Position Calculator (`/api/v1/tools/position-calculator`)

### Seed 数据增强
- [x] 15 条新闻、8 个信号、6 条 AI 分析、5 条预测、4 条日志、4 个自选
- [x] Demo 用户: `demo@alphax.com` / `demo123456`

### 路由总览

| 模块 | 路由前缀 | 状态 |
|------|---------|------|
| Auth | `/api/v1/auth` | ✅ |
| Market | `/api/v1/market` | ✅ |
| Analysis | `/api/v1/analysis` | ✅ (DB 持久化) |
| Signals | `/api/v1/signals` | ✅ (DB 读取) |
| Forecast | `/api/v1/forecast` | ✅ (DB 持久化) |
| News | `/api/v1/news` | ✅ (DB 查询) |
| Alerts | `/api/v1/alerts` | ✅ |
| Chat | `/api/v1/chat` | ✅ |
| User | `/api/v1/user` | ✅ |
| Dashboard | `/api/v1/dashboard` | ✅ |
| Journal | `/api/v1/journal` | ✅ (新增) |
| Tools | `/api/v1/tools` | ✅ (新增) |

## 当前缺失/待办

- [ ] Redis 容器未启动（redis:7-alpine 镜像下载超时，后续需要时再启动）
- [ ] 前端 `apps/web` 的启动尚未验证
- [ ] Python AI 服务尚未实现

---

## API 补齐（2026-08-14 本轮）

### 后端新增路由（已实现并通过 `nest build` / `tsc`）
| 模块 | 路由前缀 | 说明 |
|------|---------|------|
| Sentiment | `/api/v1/sentiment`、`/api/v1/sentiment/{symbol}` | 由 News 数据聚合 + 稳定哈希生成；无独立 DB 表 |
| Smart Money | `/api/v1/smart-money`、`/api/v1/smart-money/history`、`/api/v1/smart-money/{symbol}` | 确定性 ETF/COT/央行购金快照 + 历史序列 |
| Billing | `/api/v1/billing/plans`、`/billing/checkout`、`/billing/portal` | Plans 静态；checkout/portal 为占位 URL（Stripe 待配置） |
| Watchlist | `/api/v1/watchlist`（GET/POST/DELETE `:symbol`） | spec 独立路径，复用同一张表 |
| Enterprise | `/api/v1/enterprise/api-keys`（GET/POST/DELETE `:id`） | API 密钥：创建时返回一次明文，落库仅存 SHA-256 |
| Signals | `/api/v1/signals/stats` | 状态/方向聚合 + 胜率 |
| Analysis | `POST /api/v1/analysis/{symbol}/refresh` | 强制触发决策管线并持久化（JWT 保护） |
| Auth | `GET /api/v1/auth/oauth/{provider}`、`/auth/oauth/{provider}/callback` | OAuth 跳转/回调占位（Google/GitHub） |

### 前端已接入（typecheck / eslint 通过）
- [x] **News** — `features/news/api.ts` 改为调用后端 `/news`（含字段映射：category/tone/impact/confidence/bodyText），失败时回退 mock
- [x] **Analysis** — `features/analysis/api.ts` 组装 `/analysis/{symbol}`(current) + `/analysis/{symbol}/history` + `/signals/stats`(accuracy)；新增 `useRefreshAnalysis` 调用 `POST /analysis/{symbol}/refresh`，分析页“刷新分析”按钮已接入
- [x] **Auth** — `AuthProvider` 新增 `register()`（`POST /auth/register`）；修复 `loginWithOAuth` 的 base URL bug（缺少 `/api`），统一走 `apiUrl()`
- [x] **Chat SSE** — `features/chat/api.ts` 新增 `useSendMessageStream` + `streamChatReply`（读取 `POST /chat/stream` SSE 分块），`ChatDrawer` 在非 mock 下使用流式发送

### 尚缺（已记录，见 API_CLIENT/API_SPEC + DEVELOPMENT_GUIDE §13）
- [ ] WebSocket `/v1/ws` 网关（需安装 `@nestjs/websockets`/`ws`，沙箱无法写 pnpm store，代码未落地）
- [ ] `apps/ai` Python AI 服务（chat `generateReply` 目前为后端 mock/fallback）
- [ ] `/user/*`（profile/password/watchlist/settings）前端尚未消费（`/me` 已覆盖 profile+prefs）
- [ ] Stripe 真实 checkout/webhook/portal（当前为占位 URL）
- [ ] `/admin/*` 管理端点
- [ ] Redis（限流/缓存）

---

## API 对接清单（未处理项）

> 来源：对照前端 `features/*/api.ts`、后端 NestJS controllers、`docs/API_SPEC.md` / `docs/API_CLIENT.md` 梳理。
> 已修复：✅ 路径不匹配 3 处（`market`、`forecast`、`chat` 已改为调用真实后端路由）。

### ✅ 已修复（本轮）
- [x] **Market 路径** — `GET /market/{symbol}` → 聚合 `/market/symbols` + `/market/quotes` + `/market/candles` + `/market/indicators` 并映射字段（`apps/web/src/features/market/api.ts`）
- [x] **Forecast 路径** — `GET /forecast/{symbol}` → `GET /forecast/latest?symbol=&horizon=`（`apps/web/src/features/forecast/api.ts`）
- [x] **Chat 发消息路径** — `POST /chat/sessions/{id}/messages` → `POST /chat/messages`（body `{content, sessionId}`），并加入乐观更新（`apps/web/src/features/chat/api.ts`）

### 🔲 后端已有、前端尚未消费
- [ ] `/analysis/{symbol}/history` — 前端 `AnalysisHistory` 组件未接入该端点
- [ ] `/news`, `/news/{id}` — 后端 News 已 DB 持久化，前端 news 仍走 Next.js `/api/news` RSS 代理，未切到后端 `/news`
- [ ] `/journal` 全套 CRUD + `/journal/stats` — 后端已实现，前端无 journal 页面/feature
- [ ] `/tools/position-calculator` — 后端已实现，前端无 tools 页面/feature
- [ ] `/user/profile`、`/user/password`、`/user/watchlist`、`/user/settings` — 后端已实现，前端 settings 走 `/me`，user 系列端点无消费
- [ ] `/chat/stream`（SSE）— 后端已实现流式，前端 chat 仍用非流式 POST，未接入 SSE
- [ ] `/auth/register` — 后端已实现，前端无注册流程页面
- [ ] `/auth/oauth/{provider}` — 前端 `loginWithOAuth` 硬编码跳转，但后端控制器无此路由，需补后端
- [ ] `/market/symbols`、`/market/quotes`、`/market/candles`、`/market/indicators` 子端点 — 已供 market 聚合使用，但无单独页面/直接消费

### 🔲 API_SPEC 已规划、后端尚未实现
- [ ] `/sentiment`, `/sentiment/{symbol}` — 后端无 sentiment 模块
- [ ] `/smart-money`, `/smart-money/history` — 后端无
- [ ] `/billing/plans`、`/billing/checkout`、`/billing/webhook`、`/billing/portal` — 后端无 billing 模块
- [ ] `/watchlist`（spec 独立路径）— 后端只挂在 `/user/watchlist` 下
- [ ] `/enterprise/api-keys`、`/admin/*` — 后端无
- [ ] `POST /analysis/{symbol}/refresh` — 后端无
- [ ] WebSocket `/v1/ws`（行情/分析推送）— 后端无 WS 网关，前端也无 WS 客户端

### 🔲 基础设施 / 服务
- [ ] 启动 Redis（后端限流/缓存依赖）
- [ ] 实现 `apps/ai` Python AI 服务（chat 的 `generateReply` / AI 分析目前是后端 mock/fallback）

---

## 整体升级方案（2026-08-20 起草）

> 方案全文见 [docs/UPGRADE_PLAN.md](./docs/UPGRADE_PLAN.md)。参考项目：`tickflow-stock-panel`（数据源插件化/本地数据湖/回测监控）、`financial-Research`（分层降级/多空辩论/反思审计/MCP/可插拔 LLM）。
> 目标：真实数据源替换 mock → 数据源适配层 + 分层降级 + 本地数据湖 → 产品能力补齐 → `apps/ai` AI 服务。

### P0 — 数据源 PoC（1–2 周）

**✅ 本轮已完成 (2026-08-20)**
- [x] 配置 TickFlow API Key（`apps/api/.env`，gitignore 不提交）
- [x] API 启动时加载 `.env`（`main.ts` 用 Node22 内置 `process.loadEnvFile`，零依赖）
- [x] TickFlow Provider 适配（`market/providers/tickflow/`）：`/v1/quotes` + `/v1/klines[/intraday]`，REST 直连、鉴权 Bearer/X-API-Key、容错归一化
- [x] Provider 注册表 + 分层降级（`market/providers/registry.ts`）：TickFlow 优先，失败/无映射自动回退 Mock；quotes 与 candles 均带 `source` 字段
- [x] 标的映射（`tickflow/symbol-map.ts`）：GLD/SLV/SPY→美股ETF、NAS100/SPX500→美股指数（最佳猜测，可用 `TICKFLOW_SYMBOL_MAP` 覆盖）；XAUUSD 等现货/加密/债券暂无 TickFlow 覆盖，如实走模拟
- [x] 数据源状态接口 `GET /market/data-source`（primary/live/lastError/symbolMap/sourceBySymbol）
- [x] 前端行情页显示「实时行情 / 模拟数据」角标（`MarketHeader.tsx`，按每条 quote 的 `source` 展示）
- [ ] **待本地验证**：启动 Docker/Postgres + `pnpm dev`，用真实 Key 验证 TickFlow 返回与字段语义（当前沙箱无外网，已用离线用例验证归一化与降级逻辑）
- [x] 三类标的免费数据源调研落定（§3.2.1）：黄金/白银=TwelveData(+Frankfurter/Stooq 备用)、加密=Binance 公开行情(+CoinGecko)、美债=US Treasury 官方 CSV(+FRED)
- [x] Binance Provider（`market/providers/binance/`）：`ticker/24hr` + `klines`，免 Key，BTCUSD→BTCUSDT
- [x] Treasury Provider（`market/providers/treasury/`）：官方 daily-treasury-rates CSV → US10Y 收益率
- [x] TwelveData Provider（`market/providers/twelve-data/`）：`/price` + `/time_series`\n- [x] 配置 TwelveData API Key（`apps/api/.env`，gitignore 不提交；XAUUSD/XAGUSD 已路由到 twelve-data）
- [x] Registry 多 Provider 路由（TwelveData→Binance→Treasury→TickFlow→Mock）+ `/market/data-source` 返回各源状态；前端角标显示来源名
- [ ] **待本地验证**：Binance / Treasury / TwelveData 真实端点 curl 验证（当前沙箱无外网）

- [x] `market-data` 模块骨架：`providers/{types,registry,normalizer}`（已按 tickflow `data_providers/` 思路落地在 `market/providers/`，后续拆独立 `market-data` 模块）
- [x] 接入 TwelveData Provider（quote/candle，需 `TWELVEDATA_API_KEY`，待本地验证）；备用 Frankfurter/Stooq 待接
- [x] 接入 Binance 公开行情（BTCUSD→BTCUSDT，免 Key，待本地验证）；CoinGecko 备用待接
- [ ] 新闻 RSS 收编为 Provider（现有 Google News/Kitco/CoinDesk/CNBC）
- [ ] `/market/quotes|candles` 切换真实数据；`NEXT_PUBLIC_MOCK` 一键回退
- [ ] Provider 健康检查 + 主备切换 + 串行限流（参考 a-stock-data `em_get`）
- [ ] Redis 缓存（quote 5–15s / candle 30–60s）；P0 可用内存 TTL 过渡
- [ ] `symbols` 表扩展（exchange/market/currency/timezone/price_source）

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
- [ ] 多空辩论（事实底稿 → 多方/空方 → 中立主持 → 验证清单，参考 financial debate.py）
- [ ] 反思审计（对已有分析做推理审计，参考 reflection.py）
- [ ] 资讯雷达（12 赛道多源 RSS + AI 提炼今日要点，参考 newsradar.py）
- [ ] 盘后 AI 复盘（定时执行 + 推送，参考 tickflow Review）
- [ ] MCP Server（零依赖 JSON-RPC over stdio：query_quote / query_analysis / query_news…，参考 mcp_server.py）
- [ ] Pydantic schema 与前端 Zod 对齐（ADR-006 落地）

### P3 — 实时 + 监控 + 商业化（4–6 周）
- [ ] WebSocket `/v1/ws` 网关（quote/candle/analysis/signal 频道；安装 @nestjs/websockets）
- [ ] 四类监控（策略/个股信号/价格/异动）+ 多通道推送（邮件/Telegram/飞书/WebPush）
- [ ] 自选批量导入 + 表格/卡片双视图 + 实时行情开关
- [ ] 首页看板升级：市场情绪评分 + 榜单 + 异动事件流
- [ ] Stripe 真实 checkout/webhook/portal + Pro 门控
- [ ] `packages/schemas` 共享 Zod 契约落地

### 产品原则（吸收 financial-Research VISION）
- [ ] 数据摆全、框架公开、结论归用户；AI 不产出买卖指令
- [ ] 多空辩论/反思以「分歧点 + 验证清单」收尾，不以下结论收尾
- [ ] 能拿到真数据绝不让模型编；源挂了如实报缺，不填空
- [ ] 用户自选/持仓/研报仅存本地，不上传第三方

