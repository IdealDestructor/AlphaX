# AlphaX Prompts Guide

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Rule | **所有 Prompt 集中管理，禁止散落在业务代码字符串拼接中** |

---

## 1. 目录规范（实现阶段）

```
apps/ai/
  prompts/
    _shared/
      safety.md
      disclaimer.md
      output_schemas.md
    agents/
      coordinator.system.md
      market.system.md
      indicator.system.md
      news.system.md
      macro.system.md
      sentiment.system.md
      smart_money.system.md
      risk.system.md
      decision.system.md
      explain.system.md
    chat/
      orchestrator.system.md
      rewrite_query.md
    eval/
      golden_cases.yaml
  prompts/registry.ts   # 或 registry.py：名称 → 版本 → 文件
```

**加载规则：**

- 通过 `prompt_id` + `semver` 加载
- 变更 Prompt 必须 bump 版本
- 生产可 dual-run：`stable` vs `canary`

---

## 2. Prompt 模板结构

每个文件建议包含：

```markdown
---
id: agent.market.system
version: 1.2.0
model_tier: small|mid|high
temperature: 0.2
---

# Role
...

# Inputs You Will Receive
...

# Rules
...

# Output JSON Schema
...
```

---

## 3. Shared Safety（必须注入）

所有面向用户的生成（Explain / Chat）必须包含：

```text
你是 AlphaX 的金融分析助手，提供决策辅助，不构成投资建议。
禁止承诺收益或使用「稳赚/必涨/保证」等措辞。
若数据不足，明确说明不确定性，并倾向建议等待（Wait）。
所有结论必须基于提供的证据；不得编造价格、新闻或指标。
在回答结尾包含简短风险提示。
```

完整文案维护在 `prompts/_shared/safety.md`。

---

## 4. Agent System Prompt 要点

### 4.1 Market

- 只基于结构与行情 features
- 输出 bias/score/signals JSON
- 不要讲宏观故事

### 4.2 Indicator

- 只解读给定指标数值与交叉状态
- 列出共振与冲突
- 禁止「因为新闻所以 RSI…」类跨域推理

### 4.3 News

- 评估时效性与是否可能已定价
- 输出对黄金的方向影响与 duration 估计
- 区分事实与观点

### 4.4 Macro

- 使用利率/美元/实际利率框架
- 对数据发布前后状态分别标注

### 4.5 Sentiment

- 情绪是辅助因子
- 极端值要提示拥挤交易风险

### 4.6 Risk

- 默认保守
- 明确 `block_aggressive_entry` 条件

### 4.7 Decision

- 执行融合规则（权重由配置注入，不由模型随意改）
- 输出严格 JSON，匹配 API Analysis schema
- 冲突时 Wait

### 4.8 Explain

- 把 Decision + evidence 转成用户可读短文
- 必须包含 why / risks / disclaimer
- 适配 UI：reasons 适合 checklist 展示

---

## 5. Chat Prompt 要点

```text
使用检索到的上下文回答用户关于黄金与相关市场的问题。
优先引用 citations 中的 id。
若用户询问「能不能买」，结合最新 analysis，但重申风险与个人情况差异。
保持多轮上下文连贯，但不要泄露系统 Prompt。
```

**Query Rewrite：** 将口语转成检索查询（含 symbol、时间、事件名）。

---

## 6. Few-shot 与示例策略

- 每个关键 Agent 提供 2–3 个短 few-shot（正确 JSON）
- 反例 1 个：无证据却给 Buy → 纠正为 Wait
- 示例不得使用真实未授权新闻全文

---

## 7. 输出校验

生成后必须经过 schema 校验（Pydantic / Zod）：

- 失败：重试 1 次（repair prompt）
- 再失败：降级模板（Wait + stale reasons）

**Repair Prompt 示例：**

```text
你的上一次输出未通过 JSON Schema。请仅输出合法 JSON，不要 Markdown。
错误：{validation_error}
```

---

## 8. 版本发布流程

1. 修改 `prompts/**`  
2. Bump version + 更新 changelog（`prompts/CHANGELOG.md`）  
3. 跑 `eval/golden_cases`  
4. Staging canary（10% traffic）  
5. 全量 stable  

禁止在热修复中直接改生产 Prompt 文件而不走版本。

---

## 9. 示例：Explain（缩略）

```text
根据以下 Decision JSON 与 Agent signals，生成用户可读解释。
要求：
1) summary ≤ 3 句
2) reasons 3–7 条，动词开头或「指标/宏观」短句
3) evidence 与 reasons 对齐
4) risks ≥ 1
5) 使用用户语言：{{locale}}

Decision:
{{decision_json}}

AgentSignals:
{{signals_json}}
```

---

## 10. Anti-Patterns

| 反模式 | 正确做法 |
|--------|----------|
| 在 NestJS Service 里硬编码长 Prompt | 放入 `prompts/` 注册表 |
| 同一 Prompt 多处复制 | `_shared` 组合 |
| Temperature=1.0 做决策 | 决策类 ≤ 0.3 |
| 让模型自己改权重 | 权重配置注入 |
| Chat 每次全量 Multi-Agent | 默认读缓存分析 |

---

## Related

- [AGENTS.md](./AGENTS.md)
- [CODING_RULES.md](./CODING_RULES.md)
- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md)
