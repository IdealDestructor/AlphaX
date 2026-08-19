# Architecture Decision Records (ADR)

> 记录 AlphaX 的重要技术选型与架构决策。  
> 格式：上下文 → 决策 → 后果。新增决策追加，不删改历史（可标 Superseded）。

| 字段 | 值 |
|------|-----|
| Version | 1.0 |
| Status Legend | Proposed · Accepted · Deprecated · Superseded |

---

## ADR-001：采用 Next.js App Router 作为前端

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** 需要 SSR 首屏、SEO（营销页）、React 生态与良好 DX。

**决策：** 使用 **Next.js App Router + TypeScript + Server Components 优先**。

**后果：**

- 首页 AI 摘要可 SSR，利于性能与分享  
- 需清晰划分 Server/Client 边界  
- 部署可贴合 Vercel，也支持 Docker 自托管  

---

## ADR-002：NestJS 作为 API Gateway / BFF

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** 需要模块化后端、WebSocket、鉴权、队列与清晰 Service 层。

**决策：** 使用 **NestJS** 作为主 API；业务逻辑放 Service；对接 Python AI。

**后果：**

- 结构适合中大型模块增长  
- 与 Node 生态（BullMQ、WS）契合  
- 团队需遵守模块边界，避免胖 Controller  

---

## ADR-003：Python 独立 AI Service + Multi-Agent

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** AI 涉及 RAG、多模型、融合与科研向迭代；不宜与 Nest 强耦合。

**决策：** **独立 Python AI Service**；Multi-Agent（Coordinator → 专家 → Decision → Explain）。

**后果：**

- 可独立扩缩与换模型  
- 增加一次网络跳转与运维面  
- Prompt/Agent 版本可独立发布  

---

## ADR-004：PostgreSQL + TimescaleDB + Redis

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** 既有用户/订阅等 OLTP，也有高频 OHLCV 时序；需要缓存与队列。

**决策：**

- OLTP：**PostgreSQL**  
- 行情：**TimescaleDB**（可同集群扩展）  
- 缓存/限额/PubSub：**Redis**  
- 向量：优先 **pgvector**，不够再拆独立 Vector DB  

**后果：**

- 运维相对集中  
- 需区分迁移目录与保留策略  
- 早期可用单库，后期再拆读  

---

## ADR-005：REST + WebSocket 双通道，OpenAPI 契约

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** 历史查询适合 REST；行情与分析推送需要低延迟。

**决策：** REST 负责 CRUD/历史；WebSocket 负责 quote/candle/analysis/signal；用 OpenAPI 3.1 描述 REST。

**后果：**

- 前端需维护 Query + WS 两套状态同步  
- 契约可生成类型，减少漂移  

---

## ADR-006：Zod 作为跨层 Schema 源

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** 前后端与 AI JSON 易漂移；运行时校验必要。

**决策：** **Zod** 校验所有边界输入输出；共享包 `packages/schemas`；AI 侧用对等 Pydantic。

**后果：**

- 类型与校验合一  
- 需纪律：先改 schema 再改业务  

---

## ADR-007：UI 采用 Tailwind + shadcn/ui + Geist + 深色默认

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** 需要统一、可被 AI 稳定复现的设计语言；金融专业感。

**决策：** 遵循 [UI_UX_SPEC.md](./UI_UX_SPEC.md)：TradingView×Linear×Vercel 气质；深色默认；Geist；shadcn。

**后果：**

- 交付速度快  
- 必须抑制「随机 AI 审美」漂移  

---

## ADR-008：TanStack Query 管理服务端状态

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** REST 缓存、失效、分页与 SSR hydration 需要标准方案。

**决策：** 客户端用 **TanStack Query**；WS 增量写入 cache。

**后果：**

- 少写手写全局 store  
- 需约定 queryKey 规范  

---

## ADR-009：Freemium 订阅 + Entitlements 表

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** Free/Pro/Enterprise 功能边界会频繁实验。

**决策：** `plan` + **entitlements** 覆盖；后端强制门控；Stripe 订阅。

**后果：**

- 灵活改配额  
- 增加计费与权限测试面  

---

## ADR-010：图表选用 Lightweight Charts（非全量 TV 嵌入）

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** TradingView 嵌入授权与定制成本；AlphaX 差异化不在指标商店。

**决策：** 使用 **TradingView Lightweight Charts** 自研工作台体验。

**后果：**

- 可控、可叠加 AI 线  
- 高级图表功能需自建，接受与 TV 差距  

---

## ADR-011：Monorepo（pnpm）规划

| 项 | 内容 |
|----|------|
| Status | Proposed → Accepted（目标） |
| Date | 2026-07-20 |

**上下文：** web/api/schemas 强共享。

**决策：** pnpm workspace monorepo：`apps/web`, `apps/api`, `apps/ai`, `packages/*`。

**后果：**

- 共享类型容易  
- CI 需按包过滤构建  

---

## ADR-012：早期部署 Vercel + Railway（或等价），后期 K8s

| 项 | 内容 |
|----|------|
| Status | Accepted |
| Date | 2026-07-20 |

**上下文：** MVP 速度优先。

**决策：** Frontend → Vercel；API/AI/Workers → Railway/Fly；DB 托管；Cloudflare CDN/WAF。K8s 留到 V3 规模。

**后果：**

- 上线快  
- 多厂商；需统一可观测性与密钥管理  

---

## ADR-013：数据源适配层（Provider Adapter + Registry + Normalizer）

| 项 | 内容 |
|----|------|
| Status | **In progress（2026-08-20 首版落地）** |
| Date | 2026-08-20 |
> **落地状态：** 首版按本 ADR 思路落在 `apps/api/src/modules/market/providers/`（types/registry/mock/tickflow），TickFlow 已作为主源接入 quotes/candles，失败或无映射自动回退 mock，`GET /market/data-source` 暴露状态；2026-08-20 第二轮新增 Binance（加密）/ Treasury（美债）/ TwelveData（黄金白银）三个 Provider，Registry 升级为多 Provider 按标的路由（TwelveData→Binance→Treasury→TickFlow→Mock），`/market/data-source` 返回各 Provider 健康状态；后续按 P1 拆独立 `market-data` 模块并补齐 normalizer/schemas 契约。


**上下文：** 行情/指标/新闻需要接入真实数据源，且要支持主备切换、可插拔、mock 可回退（参考 tickflow-stock-panel 的 data_providers 目录与 financial-Research 分层架构）。

**决策：** NestJS 新增 `market-data` 模块：`providers/{base,registry,normalizer,schemas}`；所有下游只依赖内部 NormalizedSchema（symbol/ts/OHLCV/amount/source/quality），不感知具体源；Provider 支持主备路由 + 健康检查；`NEXT_PUBLIC_MOCK` 保留一键回退。

**后果：**

- 换源/加源只新增 Provider，不影响业务与前端
- 增加适配层代码与契约维护成本
- 为回测/指标/AI 提供统一数据底座

---

## ADR-014：本地数据湖（Parquet/DuckDB）+ Redis 缓存

| 项 | 内容 |
|----|------|
| Status | Proposed |
| Date | 2026-08-20 |

**上下文：** 免费数据源限频；回测与指标需要历史数据；Postgres 存高频 OHLCV 成本高（参考 tickflow Parquet/DuckDB 本地数据湖）。

**决策：** `data/` 目录用 Parquet 存行情/指标/回测结果（schema 版本化），DuckDB 查询；Postgres 只存业务与最新快照；Redis 做盘中热缓存（quote 5–15s / candle 30–60s），P0 可用内存 TTL 过渡。

**后果：**

- 降低对上游依赖、支撑回测与离线分析
- 需处理数据迁移与 schema 兼容（Parquet versioning）
- 单机本地存储，多实例部署需挂共享卷或对象存储

---

## ADR-015：数据源分层降级与串行限流

| 项 | 内容 |
|----|------|
| Status | Proposed |
| Date | 2026-08-20 |

**上下文：** 免费公开源会被限频/封 IP；金融数据「能拿真数据绝不让模型编」（financial-Research VISION）。

**决策：** 每个数据集配置主源 + 备用源；主源失败自动切备用；失败退避重试；串行限流 + 随机抖动 + 会话复用（参考 a-stock-data em_get）；源故障时如实报缺（source:"unavailable"），不用「看起来合理」的数据填空；空结果不缓存。

**后果：**

- 稳定性显著提升，单源故障不中断服务
- 需监控各源健康度与配额消耗
- 偶发「数据缺失」展示，符合合规与可信原则

---

## ADR-016：apps/ai 可插拔 LLM + MCP Server

| 项 | 内容 |
|----|------|
| Status | Proposed |
| Date | 2026-08-20 |

**上下文：** AI 服务未落地；用户希望用自己的模型/订阅（参考 financial-Research：OpenAI 兼容 + 本机 CLI + MCP）。

**决策：** `apps/ai` 用 FastAPI 实现；LLM 可插拔（OpenAI 兼容 / DeepSeek / Ollama / 本机 CLI 订阅），带 token 预算与模型分级；提供 MCP Server（零依赖 JSON-RPC over stdio，暴露 query_quote / query_analysis / query_news 等工具）；结果用 Pydantic 与前端 Zod 对齐；所有流式输出走 SSE/NDJSON。

**后果：**

- 用户自备 Key/模型，成本可控，隐私更好
- 增加一套 Python 服务与运维面
- 为多空辩论/反思审计/复盘/资讯雷达提供统一 AI 底座

---
## 新增 ADR 模板

```markdown
## ADR-XXX：标题

| Status | Proposed |
| Date | YYYY-MM-DD |

**上下文：**
**决策：**
**后果：**
```

---

## Related

- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- [CODING_RULES.md](./CODING_RULES.md)
- [OPS.md](./OPS.md)

