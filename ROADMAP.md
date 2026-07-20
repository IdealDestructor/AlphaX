# AlphaX Roadmap

> 原则：先做 **可解释的 Gold AI 分析闭环**，再扩展预测、资金流与多市场。

---

## 总览

```
V1 MVP ──► V1.5 Intelligence ──► V2 Pro Tools ──► V3 Multi-Market
  │              │                    │                │
  Gold深度      预测/情绪/资金流      回测/策略/Broker   Crypto/FX/App
```

---

## V1 — MVP（可上线闭环）

**目标：** 用户打开首页就能看懂「现在怎么看黄金、为什么」。

| 模块 | 交付物 | 状态 |
|------|--------|------|
| 实时行情 | XAUUSD + 关联品种；多周期 K 线；WS 推送 | 规划中 |
| 技术指标 | MA/EMA/RSI/MACD/ATR/VWAP/Bollinger 等 | 规划中 |
| AI 分析 | Trend / Action / Confidence / Reasons | 规划中 |
| Explainable AI | Evidence Chain 展示 | 规划中 |
| 新闻 | 聚合 + AI 摘要 + 影响方向 | 规划中 |
| AI Chat | 多轮问答 + 引用上下文 | 规划中 |
| 用户系统 | Email + Google/GitHub OAuth；JWT | 规划中 |
| Watchlist | 基础自选 | 规划中 |
| 订阅骨架 | Free / Pro Feature Flag | 规划中 |

**退出标准（DoD）：**

- [ ] 首页 SSR 可用，AI 卡片有证据列表
- [ ] WebSocket 行情稳定推送
- [ ] Chat 有配额与免责声明
- [ ] 基础监控与错误上报上线

---

## V1.5 — Intelligence

**目标：** 从「解释当下」扩展到「概率展望 + 主动触达」。

| 模块 | 交付物 |
|------|--------|
| AI Forecast | 多时间窗 Probability Cone |
| AI Signals | 信号中心 + 历史准确率 |
| Alerts | 价格 / AI / 新闻 / 指标；Email + Web Push + Telegram |
| Smart Money | ETF / COMEX / COT / 央行购金面板 |
| Sentiment | Fear & Greed / Heat Score |
| Journal | 交易日志与复盘草稿 |

---

## V2 — Pro Tools

**目标：** 服务严肃交易者的工作流。

| 模块 | 交付物 |
|------|--------|
| Position Calculator | 仓位 / 风险 / RR |
| Backtesting | 指标策略回测 + AI 报告 |
| Strategy Marketplace | 策略分享 / 订阅（可选） |
| Broker Integration | 只读持仓同步 → 半自动 |
| Auto Trading（可选） | 严格风控开关；默认关闭 |
| Enterprise API | OpenAPI + API Key + 审计 |

---

## V3 — Multi-Market & Clients

| 模块 | 交付物 |
|------|--------|
| 多资产 | BTC / Forex / Stocks / Oil / Silver |
| Multi-Agent 深化 | 跨市场 Coordinator |
| Mobile App | iOS / Android |
| Desktop App | Electron 或等价 |
| Voice Assistant | 语音问答 |
| K8s | 生产级弹性与多区域 |

---

## 里程碑建议（日历可调整）

| 里程碑 | 周期建议 | 焦点 |
|--------|----------|------|
| M0 脚手架 | 2 周 | Monorepo、Auth、DB、CI |
| M1 行情 + 图表 | 3 周 | Market Service、WS、图表 |
| M2 AI 分析闭环 | 4 周 | Multi-Agent、Explain、首页 |
| M3 新闻 + Chat | 3 周 | News、RAG、Streaming Chat |
| M4 计费 + 告警 | 3 周 | Stripe、Alerts、Pro 门控 |
| M5 V1.5 | 6–8 周 | Forecast、Sentiment、Smart Money |

---

## 优先级原则

1. **Explainable > Flashy** — 先保证证据链，再做炫酷预测
2. **Gold Depth > Multi-Asset Width** — 先做透一个品种
3. **Cache & Cost Control** — AI 结果必须可缓存、可降级
4. **合规默认** — 任何 AI 输出带风险提示

---

## 明确不做（近期）

- 承诺收益率或「稳赚」营销
- 无风控的全自动交易
- 未授权抓取付费数据源全文
