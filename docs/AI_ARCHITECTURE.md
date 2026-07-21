# AlphaX AI Architecture

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Pattern | Multi-Agent · RAG · Explainable AI · Decision Fusion |

---

## 1. Design Principles

1. **No single LLM oracle** — 多 Agent 分工，再融合决策  
2. **Evidence first** — 无证据不得给出 Buy/Sell  
3. **Prefer Wait** — 冲突或低置信度时默认 Wait  
4. **Explainable** — 每个结论必须能追溯到数据源  
5. **Cost-aware** — 结果缓存、模型分级、可降级  
6. **Safe** — 禁止收益承诺；强制风险提示  

---

## 2. Pipeline Overview

```
                 Feature Snapshot
            (quotes, indicators, news,
             macro, sentiment, smart money)
                        │
                        ▼
               ┌─────────────────┐
               │ Coordinator     │
               │ Agent           │
               └────────┬────────┘
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    Market Agent   News Agent    Macro Agent
    Indicator Ag.  Sentiment Ag. Risk Agent
          │             │             │
          └─────────────┼─────────────┘
                        ▼
               ┌─────────────────┐
               │ Decision Agent  │  ← 加权融合 + 规则守卫
               └────────┬────────┘
                        ▼
               ┌─────────────────┐
               │ Explain Agent   │  ← 自然语言 + Evidence Chain
               └────────┬────────┘
                        ▼
              Structured Analysis JSON
              → DB / Redis / WebSocket / Chat
```

详细 Agent 契约见 [AGENTS.md](./AGENTS.md)；Prompt 规范见 [PROMPTS.md](./PROMPTS.md)。

---

## 3. Coordinator Agent

**职责：**

- 根据触发类型（定时 / 新闻突发 / 用户 Chat）选择 Agent 子集
- 并行调度、超时控制（单 Agent 默认 8–15s）
- 汇总中间结果，交给 Decision Agent
- 记录 `run_id`、模型版本、耗时、Token

**触发策略：**

| 触发 | Agent 集 | 频率 |
|------|----------|------|
| Candle close (4H/1D) | 全量 | 按周期 |
| High-impact news | News + Macro + Risk + Decision | 事件 |
| Manual refresh (Pro) | 全量（强限流） | 用户 |
| Chat question | 按意图路由子集 + RAG | 用户 |

---

## 4. Decision Fusion

### 4.1 输入

每个子 Agent 输出统一中间结构：

```json
{
  "agent": "market",
  "bias": "bullish",
  "score": 0.72,
  "confidence": 0.81,
  "signals": [{ "key": "macd_cross", "direction": "bullish", "strength": 0.7 }],
  "notes": ["4H MACD golden cross"]
}
```

### 4.2 融合算法（MVP 建议）

1. **映射：** `bullish=+1`, `neutral=0`, `bearish=-1`  
2. **加权得分：**

| Agent | 默认权重 |
|-------|----------|
| Market / Indicator | 0.25 |
| Macro | 0.20 |
| News | 0.15 |
| Sentiment | 0.10 |
| Smart Money（若有） | 0.15 |
| Risk（风险惩罚） | 见下 |

```
fused = Σ (weight_i × score_i × confidence_i)
```

3. **Risk 守卫：**
   - `risk_level=high` → 强制降低 action 激进度；倾向 Wait
   - 波动率极端 / 重大数据发布窗口 → Wait

4. **阈值：**
   - `|fused| < 0.25` 或 `avg_confidence < 0.55` → `action=wait`, `trend=neutral|弱方向`
   - `fused ≥ 0.25` → bullish / buy（仍需证据 ≥ N 条）
   - `fused ≤ -0.25` → bearish / sell

5. **冲突检测：** Market 与 Macro 方向相反且都高置信 → Wait + 解释冲突

### 4.3 价格建议

- Entry / SL / TP 由 Market + Risk 基于 ATR / 结构位计算
- Decision Agent **不得臆造**价格；无有效结构则只给方向 + Wait

---

## 5. Explainable AI

Explain Agent 输入：融合结果 + 各 Agent signals。

**强制输出：**

- `summary`（1–3 句）
- `reasons[]`（可读要点）
- `evidence[]`（可机器追溯）
- `risks[]`（至少 1 条风险）
- `disclaimer`（标准免责）

**禁止：**

- 无证据的绝对化措辞（「一定涨」）
- 编造未提供的数据点

UI 展示为 Evidence Chain：来源图标 → 信号 → 权重。

---

## 6. RAG

### 6.1 语料

| 语料 | 用途 |
|------|------|
| 新闻摘要与正文切片 | 事件问答 |
| 历史 AI 分析 | 一致性 / 对比 |
| 宏观日历与解读模板 | 数据日问答 |
| 产品帮助文档 | 使用问题 |
| 指标释义知识库 | 教学向解释 |

### 6.2 流程

```
Query → Rewrite（可选）→ Embed → Top-K 检索
  → Rerank（可选）→ 注入 Prompt Context
  → 生成（带 citation ids）
```

### 6.3 引用规则

- Chat 回答必须尽量附 `citations`
- 检索为空时明确「当前知识库无直接证据」，降级为通用教育性解释 + 风险提示

---

## 7. Model Routing

| 任务 | 建议模型档位 |
|------|----------------|
| 指标摘要 / 结构化抽取 | 小模型 / 便宜档 |
| News 情感与影响 | 中档 |
| Decision + Explain | 中高档 |
| 复杂 Chat / 冲突解释 | 高档 |
| 本地兜底（可选） | Local LLM |

路由配置集中在 `ai/config/models.yaml`（实现阶段），支持按成本熔断切换。

---

## 8. Caching & Idempotency

- 同一 `symbol+timeframe+feature_hash` 在 TTL 内复用分析结果
- Chat 不缓存最终答案（可缓存检索结果）
- Agent run 写入 `ai_runs`（可选表）便于审计与成本核算

---

## 9. Evaluation & Quality

| 机制 | 说明 |
|------|------|
| Offline eval set | 标注历史日：趋势/建议是否合理 |
| Signal outcomes | 与 `signals.outcome` 对齐准确率 |
| Human review | Admin 抽检队列 |
| Regression prompts | Prompt 变更必须跑黄金集 |

**对外口径：** 准确率统计需注明样本、周期、前视偏差处理方式。

---

## 10. Failure Modes

| 故障 | 行为 |
|------|------|
| 单 Agent 超时 | 跳过该 Agent，降低 confidence |
| AI 服务整体不可用 | 返回最近缓存 + `stale: true` |
| 行情中断 | 拒绝新 Decision；Chat 提示数据不可用 |
| 检索失败 | 无 citation 的保守回答 |

---

## 11. Safety & Compliance

- System Prompt 固定：决策辅助，非投资建议
- 输出过滤器：拦截收益承诺模式
- 用户内容：注入防护（忽略恶意「无视规则」）
- 日志：脱敏；不记录完整密钥/支付信息

---

## Related

- [AGENTS.md](./AGENTS.md)
- [PROMPTS.md](./PROMPTS.md)
- [API_SPEC.md](./API_SPEC.md)
- [DATABASE.md](./DATABASE.md)
