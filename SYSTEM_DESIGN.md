# AlphaX System Design

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Stack | Next.js · NestJS · Python AI · PostgreSQL · TimescaleDB · Redis · WebSocket · Multi-Agent |

---

## 1. Architecture Overview

```
                         ┌─────────────────────┐
                         │   Cloudflare CDN    │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  Next.js Frontend   │
                         │  (Vercel / Docker)  │
                         └──────────┬──────────┘
              ┌─────────────────────┼─────────────────────┐
              │ REST                │ WebSocket           │ AI Stream
              ▼                     ▼                     ▼
                         ┌─────────────────────┐
                         │     NestJS API      │
                         │  Gateway / BFF      │
                         └──────────┬──────────┘
      ┌───────────┬─────────┬───────┴───────┬───────────┬──────────┐
      ▼           ▼         ▼               ▼           ▼          ▼
 Market Svc   News Svc   Alert Svc      Auth Svc   User Svc   AI Gateway
      │           │         │               │           │          │
      │           │         │               │           │          ▼
      │           │         │               │           │   Python AI Service
      │           │         │               │           │   (Multi-Agent)
      └───────────┴─────────┴───────┬───────┴───────────┘          │
                                    │                              │
                    ┌───────────────┼───────────────┐              │
                    ▼               ▼               ▼              ▼
               PostgreSQL     TimescaleDB        Redis      Vector Store
               (业务)         (行情时序)         (缓存/队列)  (RAG)
```

---

## 2. Service Boundaries

### 2.1 Frontend（Next.js App Router）

- SSR / RSC 首屏（Dashboard、公开行情摘要）
- Client Components：图表、WebSocket、Chat Streaming
- TanStack Query：REST 缓存与失效
- Feature Flag 按 `plan` 门控 UI

### 2.2 NestJS API Gateway

职责：

- 鉴权（JWT / API Key）
- 限流与配额
- 聚合 BFF（减少前端扇出）
- WebSocket 网关（行情、信号、分析更新）
- 调用 Python AI（HTTP/gRPC）与内部服务

**原则：** 业务逻辑在 Service 层；Controller 只做校验与编排。

### 2.3 Market Service

- 接入行情源、规范化 OHLCV
- 写入 TimescaleDB；热数据缓存 Redis
- 计算技术指标（或委托 Indicator Worker）
- 向 WebSocket 频道广播 `ticks` / `candles` / `indicators`

### 2.4 News Service

- RSS / API 采集
- 去重、分类、宏观日历对齐
- 触发 News Agent 分析
- 写入 `news` + 向量化入 RAG

### 2.5 AI Service（Python）

- Multi-Agent Pipeline（见 AI_ARCHITECTURE）
- Prompt 版本管理
- RAG 检索
- Streaming 输出
- 结果结构化（Zod/Pydantic 对等 schema）

### 2.6 Alert Service

- BullMQ 消费触发条件
- 多通道投递（Email / Telegram / Web Push）
- 投递日志与重试

### 2.7 Auth / User Service

- 注册登录、OAuth、Refresh Token
- 订阅与 Entitlements
- Watchlist / Journal / Profile

---

## 3. Data Flow

### 3.1 行情 → AI → 前端

```
Vendor Feed
  → Ingest Worker
  → TimescaleDB (ohlcv)
  → Redis (last price / candle)
  → Indicator Engine
  → Feature Snapshot
  → AI Coordinator (定时 or 事件触发)
  → ai_analysis / signals 落库 + Redis
  → WS: analysis.updated / signal.created
  → Next.js 订阅更新 UI
```

### 3.2 Chat

```
Client POST/SSE /chat
  → NestJS Quota + Auth
  → RAG Query (news + analysis + macro)
  → Python Chat Orchestrator
  → Token Stream → Client
  → Persist messages
```

### 3.3 缓存策略

| Key Pattern | TTL | 说明 |
|-------------|-----|------|
| `quote:{symbol}` | 5–15s | 最新报价 |
| `candle:{symbol}:{tf}:last` | 30–60s | 最新 K |
| `indicator:{symbol}:{tf}` | 60s | 指标快照 |
| `ai:analysis:{symbol}` | 2–5min | AI 分析结果 |
| `news:latest` | 1–5min | 新闻列表 |
| `session:{userId}` | 对齐 JWT | 会话辅助 |

**降级：** AI 服务不可用时，展示最近一次缓存分析 + 「Stale」标记。

---

## 4. Real-time（WebSocket）

### 频道（建议）

| Channel | 内容 | 权限 |
|---------|------|------|
| `market.quote.{symbol}` | 报价 | Public / Pro 低延迟 |
| `market.candle.{symbol}.{tf}` | K 线更新 | Auth |
| `ai.analysis.{symbol}` | 分析更新 | Auth（完整字段按 plan） |
| `ai.signal.{symbol}` | 新信号 | Pro+ |
| `user.alerts` | 个人告警 | Owner |
| `chat.{sessionId}` | Chat 事件 | Owner |

心跳：`ping/pong` 30s；断线指数退避重连。

---

## 5. Async Jobs（BullMQ）

| Queue | Job | 触发 |
|-------|-----|------|
| `ingest.market` | 拉行情/写库 | cron / webhook |
| `compute.indicators` | 指标计算 | candle close |
| `ai.analyze` | Multi-Agent 分析 | 定时 + 重大新闻 |
| `news.ingest` | 新闻采集 | cron |
| `news.embed` | 向量化 | 新新闻 |
| `alert.dispatch` | 告警投递 | 条件命中 |
| `billing.sync` | 订阅同步 | Stripe webhook |

---

## 6. Security Architecture

- TLS 全链路
- JWT Access（短）+ Refresh（长，可旋转）
- API Key 仅 Enterprise；哈希存储
- Zod / class-validator 校验所有输入
- 密钥：环境变量 / Secret Manager，禁止入库明文
- AI 输出过滤：禁止承诺收益话术模板
- 速率限制：IP + User + API Key 三维

---

## 7. Deployment Topology

| 组件 | 建议部署 |
|------|----------|
| Frontend | Vercel 或 Cloudflare Pages |
| NestJS | Railway / Fly.io / K8s |
| Python AI | GPU 可选；CPU 可跑小模型路由 |
| PostgreSQL + Timescale | Managed（Neon / Timescale Cloud / RDS） |
| Redis | Upstash / Redis Cloud |
| CDN / WAF | Cloudflare |

详见 [OPS.md](./OPS.md)。

---

## 8. Observability

- **Metrics：** 请求延迟、WS 连接数、队列积压、AI Token、缓存命中率
- **Logs：** 结构化 JSON；Trace ID 贯穿 Nest ↔ Python
- **Traces：** OpenTelemetry
- **Alerts：** 错误率、行情中断、AI 超时、队列堆积

---

## 9. Scalability Notes

- 行情写入与查询分离（Timescale hypertable + 压缩）
- AI 分析按 symbol 串行/限流，结果缓存共享
- WebSocket 水平扩展需 sticky 或 Redis Pub/Sub 广播
- 未来 K8s：按服务独立 HPA

---

## 10. Related Docs

- [DATABASE.md](./DATABASE.md)
- [API_SPEC.md](./API_SPEC.md)
- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)
