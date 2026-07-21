# AlphaX Agents Specification

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Companion | [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md) · [PROMPTS.md](./PROMPTS.md) |

---

## 1. 通用契约

所有子 Agent 实现同一接口（逻辑契约）：

```ts
type AgentBias = "bullish" | "bearish" | "neutral";

interface AgentSignal {
  key: string;
  direction: AgentBias;
  strength: number; // 0–1
  label: string;
  refs?: Record<string, unknown>;
}

interface AgentInput {
  run_id: string;
  symbol: string;
  timeframe: string;
  as_of: string; // ISO
  features: Record<string, unknown>;
  rag_context?: string[];
}

interface AgentOutput {
  agent: string;
  bias: AgentBias;
  score: number;       // -1 ~ 1
  confidence: number;  // 0 ~ 1
  signals: AgentSignal[];
  notes: string[];
  errors?: string[];
  latency_ms?: number;
  model?: string;
}
```

**硬性规则：**

- 不得输出最终 `buy/sell`（除 Decision Agent）
- 不得编造 features 中不存在的数值
- `confidence` 必须反映数据完整度

---

## 2. Coordinator Agent

| 项 | 说明 |
|----|------|
| ID | `coordinator` |
| 输入 | 触发类型、symbol、timeframe、用户意图（Chat） |
| 输出 | 调度计划 + 聚合后的 `AgentOutput[]` |
| 超时 | 总预算 20–45s（可配置） |
| 失败 | 部分失败仍继续；全部失败则 stale fallback |

**意图路由（Chat 示例）：**

| 用户意图 | 启用 Agents |
|----------|-------------|
| 「为什么涨」 | News, Macro, Market |
| 「能不能买」 | 全量轻量版 + Risk |
| 「止损放哪」 | Market, Risk |
| 「今天有什么风险」 | Risk, News, Macro |

---

## 3. Market Agent

| 项 | 说明 |
|----|------|
| ID | `market` |
| 关注 | 趋势结构、支撑/压力、ATR、成交量、VWAP、摆动高点低点 |
| 输入 features | OHLCV 摘要、结构位、波动率 |
| 典型 signals | `hh_hl_structure`, `break_resistance`, `above_vwap` |

**输出偏向：** 价格行为与结构，不直接解读新闻。

---

## 4. Indicator Agent

| 项 | 说明 |
|----|------|
| ID | `indicator` |
| 关注 | MA/EMA、RSI、MACD、Bollinger、SuperTrend、Ichimoku 等 |
| 输入 | 预计算指标快照（禁止 Agent 内重算重行情） |
| 典型 signals | `macd_golden_cross`, `rsi_breakout`, `supertrend_flip` |

**规则：** 多指标冲突时降低 confidence，列出冲突对。

---

## 5. News Agent

| 项 | 说明 |
|----|------|
| ID | `news` |
| 关注 | 头条、央行、地缘、突发 |
| 输入 | 最近 N 条新闻摘要 + RAG 切片 |
| 典型 signals | `fomc_dovish`, `geopolitical_risk_up`, `etf_news_inflow` |

**规则：** 区分「已定价」与「新信息」；过旧新闻降权。

---

## 6. Macro Agent

| 项 | 说明 |
|----|------|
| ID | `macro` |
| 关注 | DXY、美债收益率、实际利率、CPI/PPI/NFP、利率路径 |
| 输入 | 宏观序列快照 + 日历事件 |
| 典型 signals | `dxy_down`, `us10y_down`, `real_rate_down` |

黄金框架（简化）：美元↓ / 实际利率↓ → 偏多支撑（仍需融合）。

---

## 7. Sentiment Agent

| 项 | 说明 |
|----|------|
| ID | `sentiment` |
| 关注 | X/Reddit/News 情绪、Google Trends、Fear & Greed |
| 输入 | sentiment components |
| 典型 signals | `extreme_greed`, `social_heat_spike` |

**规则：** 极端贪婪可作为反向风险提示，而非单纯追多。

---

## 8. Smart Money Agent（V1.5+）

| 项 | 说明 |
|----|------|
| ID | `smart_money` |
| 关注 | ETF 净流入、COMEX、COT、央行购金 |
| 输入 | `smart_money_snapshots` |
| 典型 signals | `etf_net_inflow`, `cot_spec_long` |

---

## 9. Risk Agent

| 项 | 说明 |
|----|------|
| ID | `risk` |
| 关注 | 波动率、事件窗口、RR、流动性、建议仓位风险 |
| 输入 | ATR、VIX 相关、日历、账户风险参数（若有） |
| 输出特化 | `risk_level`, `position_risk_notes`, `event_windows` |

**特殊字段（可挂在 notes/refs）：**

```json
{
  "risk_level": "high",
  "penalty": 0.35,
  "block_aggressive_entry": true
}
```

Risk Agent **可以否决**激进 action（通过 penalty 传给 Decision）。

---

## 10. Decision Agent

| 项 | 说明 |
|----|------|
| ID | `decision` |
| 输入 | 全部 `AgentOutput` + 融合权重配置 |
| 输出 | 最终结构化决策（非自然语言长文） |

```json
{
  "trend": "bullish",
  "action": "buy",
  "confidence": 0.87,
  "entry": 3358,
  "stop_loss": 3344,
  "take_profit": 3385,
  "risk_level": "medium",
  "fusion": {
    "fused_score": 0.41,
    "weights_used": {},
    "conflicts": []
  },
  "evidence_ids": ["macro:dxy_down", "indicator:macd_golden_cross"]
}
```

**守卫清单：**

- [ ] evidence ≥ 最小条数（默认 3）
- [ ] 无价格结构则禁止具体 entry
- [ ] Risk penalty 应用后重算 action
- [ ] 重大数据发布前 N 分钟强制 wait（可配置）

---

## 11. Explain Agent

| 项 | 说明 |
|----|------|
| ID | `explain` |
| 输入 | Decision 结果 + 子 Agent notes/signals |
| 输出 | 面向用户的说明 |

```json
{
  "summary": "偏多，建议回调买入，但留意美元反弹风险。",
  "reasons": ["美元指数走弱", "4H MACD 金叉", "ETF 净流入"],
  "evidence": [
    { "source": "macro", "signal": "DXY ↓", "weight": 0.22 }
  ],
  "risks": ["若 DXY 强势反弹，多头逻辑削弱"],
  "disclaimer": "AI 分析仅供决策辅助，不构成投资建议。"
}
```

**语气：** 专业、克制、短句；默认中英可配置。

---

## 12. Chat Orchestrator（非融合决策核心）

| 项 | 说明 |
|----|------|
| ID | `chat_orchestrator` |
| 职责 | 理解问题、调 RAG、按需拉 Agent、流式回答 |
| 约束 | 引用优先；不确定就说不确定；附带风险提示 |

与 Decision Pipeline 分离：Chat 可**读取**最新分析，但不应每次聊天都全量重跑贵价 Pipeline（除非用户明确要求 refresh）。

---

## 13. 版本与测试

- 每个 Agent：`AGENT_VERSION` + Prompt 版本号
- 单元测试：给定 fixture features → 快照输出 bias/signals
- 集成测试：黄金日样本 end-to-end fusion

---

## Related

- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)
- [PROMPTS.md](./PROMPTS.md)
