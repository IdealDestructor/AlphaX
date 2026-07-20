# AlphaX Monetization

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Model | Freemium SaaS + Enterprise API |

---

## 1. 商业模式总览

```
免费获客（Guest/Free）
    → 体验 AI 摘要与基础图表
    → 转化 Pro（完整分析 / 预测 / 告警 / 日志）
    → 升级 Enterprise（API / 席位 / SLA）
```

**收入柱：**

1. 订阅（主）— Free / Pro / Enterprise  
2. 企业 API 与数据授权  
3. 未来：策略市场抽成、经纪商返佣（谨慎合规）  

**非目标（早期）：** 广告堆砌、售卖「稳赚信号」话术。

---

## 2. 订阅层级

### 2.1 Free

**定位：** 让用户每天打开一次，建立信任。

| 包含 | 限制 |
|------|------|
| 首页 AI 摘要（简版） | Entry/SL/TP 模糊或隐藏 |
| 延迟行情 + 基础图表 | 无低延迟 |
| 公开新闻列表 | 深度 AI 影响字段部分隐藏 |
| Chat | 10 次/日 |
| Watchlist | 5 |
| Alerts | 3（Email / Web Push） |

### 2.2 Pro

**定位：** 个人严肃交易者默认档。

**建议定价（待验证）：**

| 周期 | 标价（示例） |
|------|----------------|
| 月付 | $29–$49 / 月 |
| 年付 | 约 8–10 个月价格 |

| 包含 | |
|------|--|
| 完整 AI Analysis + Evidence Chain | ✅ |
| AI Forecast 概率带 | ✅ |
| Signals + 准确率 | ✅ |
| Smart Money / Sentiment 完整面板 | ✅ |
| Chat | 200 次/日（可调） |
| Watchlist 50 / Alerts 50 | ✅ |
| Telegram 告警 | ✅ |
| Journal + Position Calculator | ✅ |
| 有限回测（V2） | ✅ |

### 2.3 Enterprise

**定位：** 团队、工作室、小型机构、内容/研究团队。

**定价：** 年费合同（示例 $5k–$50k+ / 年，按席位与 API 量）。

| 包含 | |
|------|--|
| Pro 全部能力 | ✅ |
| API Key + 更高 Rate Limit | ✅ |
| 多席位 / SSO（后期） | ✅ |
| 审计日志 | ✅ |
| SLA 与专属支持 | ✅ |
| 自定义 Agent 权重 / 私有 Prompt（可选） | ✅ |
| 发票与采购流程 | ✅ |

---

## 3. 功能边界与门控（与 PRD 对齐）

门控实现：

- `users.plan` + `entitlements` 表  
- 前端 Feature Flag（体验）+ **后端强制校验**（安全）  
- API 返回 403 `FORBIDDEN` + upgrade hint  

详见 [PRD.md](./PRD.md) §6。

---

## 4. 转化漏斗

| 阶段 | 策略 |
|------|------|
| Awareness | 黄金圈子内容；可解释分析截图；SEO「XAUUSD AI」 |
| Activation | 首日看到完整 Evidence 演示（或 7 日 Pro Trial） |
| Retention | 每日分析推送；准确率透明；Chat 解决具体问题 |
| Revenue | 在模糊 Entry/SL 处升级；告警配额用尽时升级 |
| Expansion | Pro → Enterprise API；团队席位 |

**试用建议：** Pro 7 天试用（需绑卡或限额试用，二选一做实验）。

---

## 5. 单位经济（框架）

需持续测算：

| 成本项 | 说明 |
|--------|------|
| LLM Token | 分析缓存可显著降低 |
| 行情数据授权 | 固 + 变动 |
| 基础设施 | DB / Redis / WS |
| 支付手续费 | Stripe ~2–3% |

**健康标准（方向）：** Pro 毛利覆盖 AI+数据后仍 > 60%；Free 用户成本用缓存与限额压住。

---

## 6. 支付与账单

- 支付：Stripe（订阅 + Customer Portal）  
- Webhook 更新 `subscriptions` / `plan`  
- 发票：Stripe Tax / 企业合同线下  
- 退款：按政策 7–14 天（需法务定稿）  

---

## 7. 增长路线

### Phase A — 产品驱动

- Gold 垂直口碑  
- 公开准确率看板（口径谨慎）  
- 邀请码 / 推荐返 Pro 天数  

### Phase B — 内容驱动

- 每日 AI 黄金简报（邮件/TG 频道免费引流）  
- 可分享的 Evidence 卡片图  

### Phase C — 生态

- Enterprise API  
- 经纪商合作（只读/跳转，合规优先）  
- 策略市场抽成（V2+）  

---

## 8. 定价实验清单

1. Pro $29 vs $39 转化率  
2. 年付折扣 20% vs 30%  
3. 试用绑卡 vs 不绑卡  
4. Free Chat 5 vs 10 次对升级影响  

---

## 9. 合规与信任（变现前提）

- 全站「非投资建议」声明  
- 禁止收益承诺营销  
- 信号准确率披露方法透明  
- 订阅页清晰列出功能边界  

信任是金融 AI 的真正转化率。

---

## Related

- [COMPETITOR_ANALYSIS.md](./COMPETITOR_ANALYSIS.md)
- [PRD.md](./PRD.md)
- [DATABASE.md](./DATABASE.md) `subscriptions` / `entitlements`
