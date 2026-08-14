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
