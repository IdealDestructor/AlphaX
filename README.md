# AlphaX

> AI-Powered Gold Trading Intelligence Platform

AlphaX 是一个基于 AI 的资本市场分析平台，通过实时行情、技术指标、宏观经济数据、新闻事件、市场情绪和 AI 推理，为投资者提供**可解释**的交易分析与决策建议。

**定位：**

> TradingView + ChatGPT + Bloomberg + AI Analyst

目标不是预测市场，而是帮助用户更高效地做出交易决策。

---

## 文档导航

| 分类 | 文档 | 说明 |
|------|------|------|
| 产品 | [PRD.md](./docs/PRD.md) | 完整产品需求、用户故事、权限设计 |
| 产品 | [ROADMAP.md](./docs/ROADMAP.md) | 版本路线图与里程碑 |
| 架构 | [SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) | 系统架构、服务划分、数据流 |
| 架构 | [DATABASE.md](./docs/DATABASE.md) | ER 图、表结构、索引、迁移 |
| 架构 | [API_SPEC.md](./docs/API_SPEC.md) | REST + WebSocket + OpenAPI |
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

---

## Vision

打造全球领先的 AI 金融分析平台。

**第一阶段专注：** Gold（XAUUSD）

**未来扩展：** BTC · Forex · Stocks · Oil · Silver · ETF

---

## Core Features

### 1. AI Market Analysis（核心）

首页展示 AI 实时分析：趋势（Bullish / Bearish / Neutral）、Confidence、Buy / Sell / Wait、Entry / SL / TP、Risk Level、更新时间。

### 2. Explainable AI

所有 AI 建议必须给出原因（美元、美债、ETF、技术指标、新闻、情绪等证据）。禁止只返回「Buy」。

### 3. Real-time Market

多品种（Gold / Silver / DXY / US10Y / BTC / Nasdaq / SP500 / Oil / VIX）、多周期（1m ~ Monthly）、完整技术指标库。

### 4. AI Signals / Forecast / Chat

实时信号、概率带预测、自然语言问答助手。

### 5. News · Smart Money · Sentiment

新闻智能摘要、机构资金面板、市场情绪指数。

### 6. Alerts · Journal · Calculator · Backtesting

多通道提醒、交易复盘、仓位计算、策略回测。

> 完整功能说明见 [PRD.md](./docs/PRD.md)。

---

## Tech Stack

| 层 | 技术 |
|----|------|
| Frontend | Next.js (App Router) · React · TypeScript · TailwindCSS · shadcn/ui · TanStack Query · Lightweight Charts · Framer Motion |
| Backend | NestJS · REST · WebSocket · Redis · BullMQ |
| AI | Python AI Service · Multi-Agent · RAG · OpenAI / Claude / DeepSeek |
| Database | PostgreSQL · TimescaleDB · Redis · Vector DB |
| Ops | Docker · GitHub Actions · Cloudflare · Vercel · Railway |

---

## Product Principles

1. **Explainable** — 可解释  
2. **Real-time** — 实时  
3. **Evidence-based** — 有数据依据  
4. **Confidence Score** — 置信度  
5. **Risk Awareness** — 风险提示  

AI 不应直接「预测未来」，而应基于数据提供高质量决策辅助。

---

## Quick Start（规划）

```bash
# 克隆仓库
git clone https://github.com/<org>/AlphaX.git
cd AlphaX

# 详见 docs/DEVELOPMENT_GUIDE.md
pnpm install
pnpm dev
```

---

## License

[MIT](./LICENSE) © 2026 Francis
