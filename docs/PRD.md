# AlphaX Product Requirement Document (PRD)

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Status | Draft → Ready for Implementation |
| Owner | Product |
| Last Updated | 2026-07-20 |

---

## 1. Product Overview

AlphaX 是一个 **AI 驱动的黄金市场分析平台**。

### 1.1 产品目标

帮助用户快速理解市场，并做出更理性的交易决策。

**不是**提供机械交易信号，而是提供：

- 实时数据
- AI 分析（可解释）
- 风险提示
- 决策辅助
- 证据链（Evidence Chain）

### 1.2 产品定位

> TradingView（图表） + ChatGPT（对话） + Bloomberg（宏观/新闻） + AI Analyst（可解释决策）

### 1.3 成功指标（North Star）

| 指标 | 定义 | MVP 目标 |
|------|------|----------|
| DAU | 日活跃用户 | — |
| AI Analysis CTR | 首页 AI 卡片点击率 | ≥ 40% |
| Chat Retention | 7 日回访使用 Chat 的比例 | ≥ 25% |
| Signal Trust | 用户对信号「有帮助」评分 | ≥ 4.0 / 5 |
| Time-to-Insight | 打开首页到看懂建议的时间 | ≤ 10s |

---

## 2. Target Users

| 角色 | 画像 | 核心诉求 | 付费意愿 |
|------|------|----------|----------|
| Beginner | 不会读 K 线，怕错过机会 | AI 解释、简单建议、风险提示 | 低→中 |
| Swing Trader | 关注 4H / Daily 趋势 | 趋势 + 宏观 + 新闻影响 | 高 |
| Scalper | 1m / 5m / 15m 短线 | 实时信号、低延迟、告警 | 高 |
| Professional | 机构/资深交易者 | ETF/COT/宏观、证据链、API | 很高 |
| Analyst / Content | 写研报、做内容 | 新闻摘要、可引用解释 | 中 |

---

## 3. User Stories

### 3.1 访客（Guest）

| ID | 故事 | 验收标准 |
|----|------|----------|
| US-G01 | 作为访客，我想看到首页 AI 市场摘要，以便快速了解黄金当前趋势 | 无需登录可见趋势/置信度/简要理由；完整 Entry/SL/TP 可模糊或引导登录 |
| US-G02 | 作为访客，我想浏览公开图表与新闻摘要 | 延迟行情 + 公开新闻列表可用 |
| US-G03 | 作为访客，我想注册/登录以解锁更多功能 | 支持 Email、Google、GitHub OAuth |

### 3.2 注册用户（Free）

| ID | 故事 | 验收标准 |
|----|------|----------|
| US-F01 | 我想把黄金加入自选，以便下次快速打开 | Watchlist CRUD，上限见权限表 |
| US-F02 | 我想问 AI「今天能不能买黄金」 | Chat 有每日次数限制；回答含证据与风险 |
| US-F03 | 我想收到价格突破提醒 | Email / Web Push；告警条数有上限 |
| US-F04 | 我想查看历史 AI 信号与准确率概览 | 可查看近 N 天公开信号 |

### 3.3 Pro 用户

| ID | 故事 | 验收标准 |
|----|------|----------|
| US-P01 | 我想看完整 Entry / SL / TP 与详细 Explain | 无模糊；含 Evidence Chain |
| US-P02 | 我想看 AI Forecast 概率带 | 多时间窗概率锥 |
| US-P03 | 我想用 Smart Money / Sentiment 面板 | 完整仪表盘可用 |
| US-P04 | 我想用仓位计算器与交易日志 | Journal + Position Calculator |
| US-P05 | 我想用 Telegram / 多通道告警 | 全通道 + 更高配额 |

### 3.4 Enterprise

| ID | 故事 | 验收标准 |
|----|------|----------|
| US-E01 | 我想通过 API 拉取分析与信号 | API Key + 速率限制 + OpenAPI |
| US-E02 | 我想要团队席位与审计日志 | Org / Role / Audit |
| US-E03 | 我想要 SLA 与专属支持 | 合同级 SLA |

### 3.5 Admin

| ID | 故事 | 验收标准 |
|----|------|----------|
| US-A01 | 我想管理用户、订阅、Feature Flag | Admin Console |
| US-A02 | 我想审核/下架异常 AI 输出 | 人工审核队列 |
| US-A03 | 我想查看系统健康与数据源状态 | Ops Dashboard |

---

## 4. Functional Modules

### 4.1 Dashboard（首页）

**布局：**

```
Header
AI Market Analysis（核心卡片）
Real-time Chart
AI Signals | AI Forecast
News | Smart Money | Sentiment
AI Chat 入口
Footer
```

**要求：**

- SSR 首屏
- AI 分析 Streaming 更新
- 深色主题默认

### 4.2 Market

- 品种：Gold、Silver、BTC、Oil、DXY、US10Y、VIX、Nasdaq、SP500
- 周期：1m / 5m / 15m / 1H / 4H / Daily / Weekly / Monthly
- 指标：MA、EMA、RSI、MACD、ATR、VWAP、Bollinger、SuperTrend、Ichimoku、Fibonacci、Pivot、Volume Profile

### 4.3 AI Analysis

输出结构（强制）：

```json
{
  "symbol": "XAUUSD",
  "trend": "bullish | bearish | neutral",
  "action": "buy | sell | wait",
  "confidence": 0.0,
  "entry": null,
  "stop_loss": null,
  "take_profit": null,
  "risk_level": "low | medium | high",
  "reasons": ["..."],
  "evidence": [{ "source": "...", "signal": "...", "weight": 0.0 }],
  "updated_at": "ISO-8601"
}
```

### 4.4 AI Chat

- 多轮上下文
- 引用当前行情 / 新闻 / 信号
- Streaming 输出
- 强制风险免责声明

### 4.5 News Center

- 源：Reuters、Bloomberg、Kitco、Investing、ForexFactory、央行与宏观日历
- AI 字段：Summary、Market Impact、Bullish/Bearish、Confidence、Expected Duration

### 4.6 Signal Center

- 实时与历史信号
- 准确率统计（按周期、按品种）
- 点击展开：分析 / 风险 / 新闻 / 指标

### 4.7 Watchlist / Alerts / User Center / Journal / Calculator / Backtesting

见 README Core Features；权限边界见第 6 节。

---

## 5. Feature Flows

### 5.1 首页 AI 分析流

```
Market Feed → Redis Cache → Indicator Engine
        ↓
  Multi-Agent Pipeline（Market/News/Macro/Sentiment/Risk）
        ↓
  Decision Agent → Explain Agent
        ↓
  Persist (ai_analysis) + Cache + WebSocket Push
        ↓
  Frontend Dashboard 渲染 / Streaming
```

### 5.2 用户提问流

```
User Chat Message
  → Auth + Quota Check
  → RAG（新闻/分析/指标摘要）
  → Coordinator → 相关 Agents
  → Streaming Response + Citations
  → 写入 chat_messages
```

### 5.3 告警流

```
Condition Trigger（价格/AI/新闻/指标）
  → Alert Worker
  → Channel Adapter（Email / Telegram / Web Push）
  → Delivery Log + 用户状态更新
```

### 5.4 订阅升级流

```
Pricing Page → Checkout（Stripe 等）
  → Webhook → Update users.plan + entitlements
  → Feature Flag 即时生效
```

---

## 6. Permission Design

### 6.1 角色

| Role | 说明 |
|------|------|
| `guest` | 未登录 |
| `user` | 免费注册用户 |
| `pro` | 付费 Pro |
| `enterprise` | 企业 |
| `admin` | 平台管理员 |

### 6.2 功能权限矩阵

| 功能 | Guest | Free | Pro | Enterprise |
|------|:-----:|:----:|:---:|:----------:|
| 首页 AI 摘要（简版） | ✅ | ✅ | ✅ | ✅ |
| 完整 Entry/SL/TP + Evidence | ❌ | 模糊/部分 | ✅ | ✅ |
| 实时图表（延迟） | ✅ | ✅ | ✅ | ✅ |
| 实时图表（低延迟） | ❌ | ❌ | ✅ | ✅ |
| AI Chat（次/日） | 0 | 10 | 200 | 自定义 |
| AI Forecast | ❌ | ❌ | ✅ | ✅ |
| Smart Money / Sentiment | 只读摘要 | 摘要 | 完整 | 完整 + API |
| Watchlist 数量 | 0 | 5 | 50 | 无限 |
| Alerts 数量 | 0 | 3 | 50 | 无限 |
| Telegram 告警 | ❌ | ❌ | ✅ | ✅ |
| Trading Journal | ❌ | ❌ | ✅ | ✅ |
| Backtesting | ❌ | ❌ | 有限 | 完整 |
| OpenAPI 访问 | ❌ | ❌ | ❌ | ✅ |
| 多席位 / SSO | ❌ | ❌ | ❌ | ✅ |

### 6.3 API 鉴权

- Guest：公开只读端点，速率限制更严
- User/Pro：JWT（Access + Refresh）
- Enterprise：API Key（`X-API-Key`）+ JWT（控制台）
- Admin：JWT + RBAC

### 6.4 数据权限

- 用户只能读写自己的 watchlist / alerts / journal / chat
- Admin 可审计，不可随意查看聊天明文（需合规开关）
- Enterprise Org Admin 可管理本组织成员

---

## 7. Non-functional Requirements

| 类别 | 要求 |
|------|------|
| API 响应 | P95 < 200ms（非 AI） |
| WebSocket 行情 | 端到端 < 100ms（同区域） |
| 首页 | SSR + 关键路径优先 |
| AI 分析 | Streaming；完整结果可异步落库 |
| 可用性 | MVP ≥ 99.5%；Enterprise 目标 99.9% |
| 客户端 | Desktop / Tablet / Mobile 响应式 |
| 安全 | HTTPS、JWT、密钥不入库明文、输入 Zod 校验 |
| 合规 | 金融免责声明；不承诺收益；日志脱敏 |

---

## 8. Out of Scope（MVP）

- 自动下单 / Broker 实盘对接
- 移动原生 App
- 多资产全市场覆盖（仅 Gold 深度 + 相关宏观）
- 保证收益或「稳赚」话术

---

## 9. Risks & Mitigations

| 风险 | 缓解 |
|------|------|
| AI 幻觉导致错误建议 | 强制 Evidence；置信度；Wait 优先；免责声明 |
| 行情源延迟/中断 | 多源备份 + 状态横幅 |
| 成本（LLM Token） | 缓存 AI 结果；分层模型；配额 |
| 监管与合规 | 明确「决策辅助」定位；不提供投资建议法律承诺 |

---

## 10. Open Questions

1. 首选行情供应商与授权成本？
2. Stripe 区域与税务？
3. 向量库选型：pgvector vs 独立 Vector DB？
4. 信号准确率对外披露口径？
