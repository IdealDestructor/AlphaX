# AlphaX Development Guide

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Audience | 人类开发者 + AI 编码助手 |

---

## 1. 前置要求

| 工具 | 版本建议 |
|------|----------|
| Node.js | 22 LTS |
| pnpm | 9+ |
| Python | 3.11+ |
| Docker | 24+ |
| PostgreSQL | 16+（含 Timescale / pgvector 扩展） |
| Redis | 7+ |

可选：`direnv` / `1Password` 管理密钥。

---

## 2. 仓库结构

见 [CODING_RULES.md](./CODING_RULES.md) §2。当前阶段可能仅有文档；脚手架落地后按该结构创建 `apps/` 与 `packages/`。

---

## 3. 本地启动（目标流程）

```bash
# 1. 依赖
pnpm install
python -m venv apps/ai/.venv
source apps/ai/.venv/bin/activate
pip install -r apps/ai/requirements.txt

# 2. 环境变量
cp .env.example .env
# 填写 DATABASE_URL / REDIS_URL / JWT_SECRET / OPENAI_API_KEY 等

# 3. 基础设施
docker compose -f docker/docker-compose.yml up -d

# 4. 迁移
pnpm --filter api prisma migrate dev
# 或对应迁移命令

# 5. 开发
pnpm dev
# web :3000  api :4000  ai :8000
```

---

## 4. 环境变量（分类）

| 类别 | 示例 | 备注 |
|------|------|------|
| DB | `DATABASE_URL` | OLTP |
| TS | `TIMESCALE_URL` | 可与 DB 同实例不同 schema |
| Redis | `REDIS_URL` | |
| Auth | `JWT_SECRET`, `GOOGLE_CLIENT_ID` | |
| AI | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | 服务端 only |
| Billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | |
| Public | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` | |
| Dev | `NEXT_PUBLIC_MOCK` | Mock 开关（见 [API_CLIENT.md](./API_CLIENT.md)）|

禁止把服务端密钥放入 `NEXT_PUBLIC_*`。

---

## 5. 前端 API 对接

前端通过 `src/lib/api/client.ts` 统一调用后端 NestJS API。

**核心规则：**
- 每个 feature 的 `api.ts` 使用 `featureIsMock()` 判断走 mock 还是真实 API
- 环境变量 `NEXT_PUBLIC_MOCK=1` 全局 mock，`NEXT_PUBLIC_MOCK=market` 局部 mock
- 真实 API 走 `apiClient`（自动注入 JWT、401 刷新、超时控制）
- API 响应格式遵循 `{ data, meta, error }` 包络约定

详见 [API_CLIENT.md](./API_CLIENT.md)。

---

## 6. 日常开发工作流

1. 从 `main` 拉功能分支：`feat/analysis-card`  
2. 先写/更新 Zod schema（`packages/schemas`）  
3. API Service → 前端 feature → UI（遵循 UI_UX_SPEC）  
4. 本地自测 + unit  
5. PR：描述为什么、如何验证、权限影响  

---

## 7. 测试命令（约定）

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e

# AI
cd apps/ai && pytest
python -m tools.eval_prompts
```

---

## 8. 调试技巧

| 问题 | 建议 |
|------|------|
| WS 连不上 | 查 token、CORS、代理；看 `ops` 日志 request_id |
| AI 慢 | 看缓存是否命中；Agent 超时配置 |
| 分析结果怪 | 核对 features 快照与 Prompt 版本 |
| 权限错 | 对照 PRD 权限矩阵与 entitlements |

---

## 9. 文档优先开发顺序

新功能建议：

1. 更新 PRD / ROADMAP（若范围变化）  
2. API_SPEC 补端点  
3. DATABASE 补表/索引  
4. 实现  
5. 若涉及选型，补 ADR  

---

## 10. 代码生成（AI）提示词模板

```
在 AlphaX 中实现 <功能>。
遵守 CODING_RULES 与 UI_UX_SPEC。
相关文档：PRD 权限、API_SPEC、DATABASE。
最小改动；补 Zod；Pro/Free 门控；不要改无关文件。
```

---

## 11. 发布前检查

- [ ] migration 可回放  
- [ ] OpenAPI / 客户端类型已更新  
- [ ] Feature Flag / plan 门控  
- [ ] 免责声明仍在 AI 表面  
- [ ] 监控指标与错误告警  
- [ ] `.env.example` 已同步  

运维细节见 [OPS.md](./OPS.md)。

## 12. 本轮 API 补齐记录（2026-08-14）

记录依据 `todos.md`「API 对接清单」补上的后端接口与前端接入，实现中的关键决策如下。

### 12.1 新增后端模块（`apps/api/src/modules/*`）

| 模块 | 实现策略 |
|------|---------|
| `sentiment` | 无独立表。由 `News.symbols` 的 `impact` 权重聚合 + 符号代码稳定哈希生成，保证结果可复现。接入点上应替换为 Sentiment Agent（见 `AGENTS.md` §7）。 |
| `smart-money` | 确定性 PRNG 快照（ETF 净流 / COT / 央行购金），基于种子化哈希同一符号始终得到同一序列。真实部署需接入 `smart_money_snapshots` 数据源。 |
| `billing` | Plans 为静态列表；`checkout/portal` 返回占位 URL。接入真实 Stripe 时替换 `BillingService`（见 `MONETIZATION.md`）。 |
| `watchlist` | spec 顶层别名，复用 `Watchlist` 表，API 对外字段为 `symbol/name/assetClass/sortOrder/addedAt`。 |
| `api-keys` | 创建时返回一次明文 `ax_...`；DB 仅存 `key_prefix` + SHA-256 `key_hash`（`randomBytes` 熵≥192bit）。 |
| `signals` | 新增 `getStats()`：`groupBy(status/action)` + 胜率计算。 |
| `analysis` | 新增 `refreshAnalysis()`：复用 `generateAndSave()` 强制重跑并持久化。 |
| `auth` | 新增 OAuth start/callback 占位路由（Google/GitHub）；callback 未实际交换 code→token，无 provider secret 环境。 |

> 新模块均在 `app.module.ts` 注册；`POST analysis/:symbol/refresh`、`signals/stats` 等非公开端点用 `JwtAuthGuard` 保护。

### 12.2 前端接入要点

- **News**（`features/news/api.ts`）：后端 `News` 实体缺 `category/tone`，前端从标题关键词派生 `category`、用标题正则 + `impact` 派生 `tone`；`confidence` = `impactConfidence*100`；`content` = `bodyText ?? summary ?? title`。API 失败时回退 `fetchMockNews()`。
- **Analysis**（`features/analysis/api.ts`）：将后端单条分析组装为前端 `AnalysisPageData`（current + history + accuracy）。关键换算：后端 `confidence` 0–1 → 前端 0–100；后端 `action=hold` → 前端 `wait`。`useRefreshAnalysis` 触发 `POST /analysis/{symbol}/refresh` 并失效 query。
- **Chat SSE**（`features/chat/api.ts`）：`streamChatReply` 用 `fetch` + `getReader()` 读取 `POST /chat/stream` 的 SSE 帧（`data: {"token":...}`），`useSendMessageStream` 以乐观用户消息 + 增量 assistant 占位更新 React Query 缓存。mock 模式仍走非流式 `useSendMessage`。
- **Auth**（`lib/auth/AuthProvider.tsx`）：新增 `register()`（`POST /auth/register`）；修复 `loginWithOAuth` 的 base URL bug（`http://localhost:4000/v1` → `apiUrl('/auth/oauth/{provider}')`，补上 `/api`）。

### 12.3 约束 / 已记录待办

- **WebSocket `/v1/ws` 未落地**：需 `@nestjs/websockets` + `platform-ws`（或 `ws`），本环境沙箱无法写入 pnpm store 安装依赖。已在不改动依赖的前提下将详情写入 `todos.md`。安装后按 `API_SPEC.md` §3 的协议实现 `MarketsGateway` / `AnalysisGateway` 即可。
- **`/user/*`（profile/password/watchlist/settings）前端未消费**：`/me` 已覆盖 profile+prefs，剩余按需接入。
- **Stripe checkout/webhook/portal** 为占位：`BillingService` 中 `STRIPE_SECRET_KEY` 配置后替换。
- **`/admin/*`、Redis、`apps/ai` Python 服务** 仍待后续。

---

## Related

- [CODING_RULES.md](./CODING_RULES.md)
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- [OPS.md](./OPS.md)
- [API_CLIENT.md](./API_CLIENT.md) — 前端 API 客户端实现
