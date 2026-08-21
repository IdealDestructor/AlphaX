# AlphaX

> AI-Powered Gold Trading Intelligence Platform

AlphaX 是一个基于 AI 的资本市场分析平台，通过实时行情、技术指标、宏观经济数据、新闻事件、市场情绪和 AI 推理，为投资者提供**可解释**的交易分析与决策建议。

**定位：**

> TradingView + ChatGPT + Bloomberg + AI Analyst

目标不是预测市场，而是帮助用户更高效地做出交易决策。

---

## 项目状态（2026-08-20）

| 阶段 | 状态 | 说明 |
|------|------|------|
| **V1 基础 MVP**（前后端 + API） | ✅ 核心已完成 | NestJS 16+ 模块、Prisma 持久化、前端主要页面已接入后端 |
| **P0 数据源 PoC** | 🔄 收尾中 | 4 个真实 Provider + 熔断/主备切换/串行限流 + 内存 TTL 缓存 + RSS 摄入；待本地验证 |
| **P1 数据湖 + 回测** | ⏳ 未开始 | Parquet/DuckDB 数据湖、指标管线、Screener、回测、SSE |
| **P2 AI 服务 + 投研** | ⏳ 未开始 | `apps/ai` Python 服务、MCP、多空辩论、资讯雷达 |
| **P3 实时 + 商业化** | ⏳ 未开始 | WebSocket、四类监控、Stripe、Pro 门控 |

> 任务清单见 [todos.md](./todos.md)，升级路线与阶段定义见 [UPGRADE_PLAN.md](./docs/UPGRADE_PLAN.md)。

---

## 文档导航

| 分类 | 文档 | 说明 |
|------|------|------|
| 产品 | [PRD.md](./docs/PRD.md) | 完整产品需求、用户故事、权限设计 |
| 产品 | [ROADMAP.md](./docs/ROADMAP.md) | 版本路线图与里程碑 |
| 架构 | [SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) | 系统架构、服务划分、数据流 |
| 架构 | [DATABASE.md](./docs/DATABASE.md) | ER 图、表结构、索引、迁移 |
| 架构 | [API_SPEC.md](./docs/API_SPEC.md) | REST + WebSocket + OpenAPI |
| 架构 | [API_CLIENT.md](./docs/API_CLIENT.md) | 前端 API 客户端实现与 Mock 开关 |
| AI | [AI_ARCHITECTURE.md](./docs/AI_ARCHITECTURE.md) | Multi-Agent、RAG、决策融合 |
| AI | [AGENTS.md](./docs/AGENTS.md) | 各 Agent 职责与输入输出 |
| AI | [PROMPTS.md](./docs/PROMPTS.md) | Prompt 集中管理规范 |
| 规范 | [CODING_RULES.md](./docs/CODING_RULES.md) | AI 编码约束（Cursor / Codex / Claude） |
| 规范 | [UI_UX_SPEC.md](./docs/UI_UX_SPEC.md) | 设计语言、主题、组件、交互 |
| 规范 | [DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) | 本地开发、目录、测试、提交 |
| 商业 | [COMPETITOR_ANALYSIS.md](./docs/COMPETITOR_ANALYSIS.md) | 竞品对比与差异化 |
| 商业 | [MONETIZATION.md](./docs/MONETIZATION.md) | 订阅体系与商业模式 |
| 决策 | [ARCHITECTURE_DECISIONS.md](./docs/ARCHITECTURE_DECISIONS.md) | ADR 技术选型记录 |
| 决策 | [UPGRADE_PLAN.md](./docs/UPGRADE_PLAN.md) | 整体升级方案（数据源/产品/架构） |
| 运维 | [OPS.md](./docs/OPS.md) | Docker、CI/CD、监控、安全、部署 |
| 进度 | [todos.md](./todos.md) | 任务清单（已完成 / 进行中 / 未开始） |

---

## Vision

打造全球领先的 AI 金融分析平台。

**第一阶段专注：** Gold（XAUUSD）

**未来扩展：** BTC · Forex · Stocks · Oil · Silver · ETF

---

## Core Features（含当前状态）

### 1. AI Market Analysis（核心）✅ 接口与页面已实现（AI 引擎待 P2）
首页展示 AI 实时分析：趋势（Bullish / Bearish / Neutral）、Confidence、Buy / Sell / Wait、Entry / SL / TP、Risk Level、更新时间。当前分析由种子数据 / 确定性生成，真实 AI 推理在 P2 接入 `apps/ai`。

### 2. Explainable AI ✅ 框架已实现
所有 AI 建议必须给出原因（美元、美债、ETF、技术指标、新闻、情绪等证据）。禁止只返回「Buy」。

### 3. Real-time Market 🔄 P0 进行中
多品种（Gold / Silver / DXY / US10Y / BTC / Nasdaq / SP500 / Oil / VIX）、多周期（1m ~ Monthly）、完整技术指标库。已接入 4 个真实数据源（TwelveData / Binance / Treasury / TickFlow），未覆盖标的一键回退模拟；真实端点待本地验证。

### 4. AI Signals / Forecast / Chat ✅ API 已实现（Chat 已支持真实 LLM：配置 `AI_API_KEY` 环境变量即可；Signals/Forecast 由真实行情确定性生成）
实时信号、概率带预测、自然语言问答助手；Chat 已支持 SSE 流式。

### 5. News · Smart Money · Sentiment ✅ 接口 + 页面已实现（SM 的 COT 已接 CFTC 真实源；情绪已接 CNN Fear & Greed）
新闻智能摘要、机构资金面板、市场情绪指数。News 走真实 RSS；Smart Money 的 COT 走 CFTC 官方（ETF/央行仍估算并标注）；市场情绪走 CNN Fear & Greed（真实）。

### 6. Alerts · Journal · Calculator · Backtesting 🔄 部分实现
多通道提醒、交易复盘、仓位计算、策略回测。Alerts / Journal / Position Calculator 后端与前端页面均已落地；回测引擎未开始（P1）。

> 完整功能说明见 [PRD.md](./docs/PRD.md)。

---

## Tech Stack

| 层 | 技术 | 状态 |
|----|------|------|
| Frontend | Next.js (App Router) · React · TypeScript · TailwindCSS · shadcn/ui · TanStack Query · Lightweight Charts · Framer Motion | ✅ 已落地 |
| Backend | NestJS · REST · Prisma/PostgreSQL · SSE（Chat 流式） | ✅ 已落地（WebSocket / Redis / BullMQ 待 P3） |
| Data Source | TwelveData · Binance · US Treasury · TickFlow · RSS（Provider 注册表 + 分层降级） | 🔄 P0 进行中 |
| AI | Python AI Service · Multi-Agent · RAG · OpenAI / Claude / DeepSeek | ⏳ 规划中（P2 `apps/ai`） |
| Database | PostgreSQL · TimescaleDB · Redis · Vector DB | 🔄 Postgres 已用，Redis/时序/向量待接入 |
| Ops | Docker · GitHub Actions · Cloudflare · Vercel · Railway | 🔄 Docker 已就绪，CI/CD 待落地 |

---

## Product Principles

1. **Explainable** — 可解释  
2. **Real-time** — 实时  
3. **Evidence-based** — 有数据依据  
4. **Confidence Score** — 置信度  
5. **Risk Awareness** — 风险提示  

AI 不应直接「预测未来」，而应基于数据提供高质量决策辅助。

---

## Quick Start（已可用）

### 一键启动（推荐）

```bash
npm start                 # 拉起 Docker + 初始化数据库 + 启动前后端（web :3000 / api :4000）
npm start -- --seed       # 首次可用：额外写入演示数据
# 可选参数：--skip-db / --no-docker / --no-install
```

> 等价入口（均委托同一份 `scripts/start.js`，跨平台）：

```powershell
# Windows PowerShell
.\start.ps1 -Seed
```

```bash
# Linux / macOS / Git Bash
./start.sh --seed
```

> 流程：环境检查 → .env 确认 → 依赖安装（如需）→ `docker compose up -d`（PostgreSQL + Redis，等待 healthy）→ `prisma generate / db push`（`--seed` 时执行 seed）→ `pnpm dev` 启动前后端。
> 仅启动前端生产构建（需先 `npm run build`）：`npm run start:web`。

### 手动启动

```bash
# 1. 克隆仓库
git clone https://github.com/<org>/AlphaX.git
cd AlphaX

# 2. 安装依赖
pnpm install

# 3. 启动 PostgreSQL（Docker）
docker compose -f apps/api/docker/docker-compose.yml up -d

# 4. 配置环境变量
cp apps/api/.env.example apps/api/.env
# 必填：DATABASE_URL / JWT_SECRET；可选：TICKFLOW_API_KEY / TWELVEDATA_API_KEY 等数据源 Key

# 5. 初始化数据库
pnpm --filter @alphax/api db:generate
pnpm --filter @alphax/api db:push
pnpm --filter @alphax/api db:seed

# 6. 启动开发服务
pnpm dev
# web :3000 · api :4000（http://localhost:4000/api/v1）
```

**Demo 用户：** `demo@alphax.com` / `demo123456`

> 详细开发流程见 [DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)。

---

## License

[MIT](./LICENSE) © 2026 Francis

