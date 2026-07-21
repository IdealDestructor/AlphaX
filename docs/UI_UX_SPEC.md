# AlphaX UI / UX Specification

> 设计语言目标：**TradingView（专业图表）× Linear（克制效率）× Vercel（现代极简）**  
> 供设计师与 AI 生成统一风格界面。

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Default Theme | **Dark** |
| Font | **Geist** (Sans) · Geist Mono（数值/代码） |

---

## 1. Design Principles

1. **专业冷静** — 金融产品，避免娱乐化与过度霓虹  
2. **信息密度可控** — 首页先看懂 AI 结论，再下钻细节  
3. **一张主卡片** — Dashboard 首屏以 AI Analysis 为视觉锚点  
4. **证据可见** — Explainable AI 用 checklist / chain，而非长文墙  
5. **运动克制** — 2–3 处有意义动效，不做全局闪烁  
6. **响应式优先** — Desktop 为主，Tablet/Mobile 不降级核心路径  

**避免（AI 常见审美陷阱）：**

- 紫白渐变模板风  
- 奶油底 + 衬线 + 陶土色「博客风」  
- 过度 glow、圆角胶囊堆砌、多重阴影卡片墙  

---

## 2. Brand & Voice

- 产品名 **AlphaX** 在营销页需有 hero 级存在感  
- 应用内 Header 显示 Logo + 名称；页面标题不压过品牌  
- 文案语气：专业、短句、可执行；中英可切换  
- 涨跌色语义全局一致（见颜色）

---

## 3. Color System

CSS 变量（示例，实现可微调）：

```css
:root {
  /* Dark default */
  --bg: #07090c;
  --bg-elevated: #0e1218;
  --bg-panel: #121820;
  --border: #1e2633;
  --border-subtle: #171d28;

  --text: #e8edf5;
  --text-secondary: #9aa6b8;
  --text-muted: #6b7689;

  --accent: #3ecf8e;          /* 主强调：冷静绿，非紫 */
  --accent-muted: #1f3d32;

  --bullish: #22c55e;
  --bearish: #ef4444;
  --neutral: #94a3b8;
  --warning: #f59e0b;

  --focus: #5b9fd4;
  --danger: #ef4444;
}
```

**规则：**

- 默认深色；浅色主题可后期加，但非 MVP 重点  
- 涨 = `--bullish`，跌 = `--bearish`，禁止用品牌紫表达涨跌  
- 图表网格线极低对比，不抢 K 线  

---

## 4. Typography

| 用途 | 字体 | 大小 / 字重 |
|------|------|-------------|
| 页面标题 | Geist Sans | 24–32 / 600 |
| 区块标题 | Geist Sans | 16–18 / 600 |
| 正文 | Geist Sans | 14–15 / 400 |
| 辅助说明 | Geist Sans | 12–13 / 400 · secondary |
| 价格 / 置信度 | Geist Mono | 13–28 / 500–600 |
| AI 大数字 Confidence | Geist Mono | 突出但不超过品牌 |

行高：正文 1.5；紧凑列表 1.35。

---

## 5. Spacing · Radius · Elevation

| Token | 值 | 用途 |
|-------|-----|------|
| space-1..6 | 4 / 8 / 12 / 16 / 24 / 32 | 间距阶梯 |
| radius-sm | 6px | 按钮、输入 |
| radius-md | 10px | 小组件 |
| radius-lg | 14px | 面板卡片 |
| border | 1px solid var(--border) | 默认分隔 |
| shadow | 极少；靠 border + 背景层级 | 避免厚重阴影 |

**布局：**

- 内容最大宽：`1280–1440px` 居中  
- Dashboard 网格：`12` 栏；AI 卡通栏，其下图表通栏，再两列 Signals/Forecast  

---

## 6. Iconography

- 图标库：`lucide-react`（与 shadcn 一致）  
- 尺寸：14 / 16 / 20  
- 描边 1.5–2；颜色跟随 text-secondary  
- 证据链可用简洁符号：↑ ↓ · 而非 emoji 堆砌  

---

## 7. Components

### 7.1 卡片（Panel）

- 允许用于**可交互信息容器**（分析卡、信号列表）  
- 样式：`bg-panel` + `border` + `radius-lg` + 内边距 16–20  
- **Hero 营销区不要卡片墙**；应用内仪表盘可用面板  

### 7.2 AI Analysis Card（核心）

必须包含：

- Trend badge（Bullish/Bearish/Neutral）  
- Confidence（大号 Mono）  
- Action（Buy / Sell / Wait）  
- Entry / SL / TP（按权限显示或模糊）  
- Reasons checklist（可解释）  
- Updated time  
- Risk level  

动效：数据更新时数字轻微 fade/slide（150–200ms）。

### 7.3 Buttons

- Primary：accent 实心  
- Secondary：ghost / outline  
- Danger：少用  
- 高度 36–40；字重 500；不要大圆胶囊除非移动端 CTA  

### 7.4 Chart

- TradingView Lightweight Charts  
- 工具条：周期切换、指标开关  
- 十字线、价格线清晰  
- 与 AI 标注可叠加（entry/sl/tp 水平线）  
- 加载用骨架，不转整页  

### 7.5 Chat

- 右侧抽屉或独立页  
- 气泡低对比；助手消息可含 citation chips  
- Streaming 光标  
- 底部固定免责声明一行  

### 7.6 Tables / Lists

- Signals 表：紧凑、Mono 价格、置信度进度微条  
- 悬停行高亮 border/背景，不跳转闪烁  

---

## 8. Interaction Patterns

| 模式 | 规范 |
|------|------|
| 实时更新 | WS 驱动；价格闪绿/红 1 帧即可 |
| 权限不足 | 模糊数值 + Upgrade CTA，不直接空白报错 |
| 空状态 | 一句话 + 一个动作 |
| 错误 | Toast + 可重试；行情中断顶栏 Banner |
| 加载 | Skeleton 对齐最终布局 |
| 快捷键（Pro） | 可选 `/` 聚焦搜索；`c` 开 Chat |

---

## 9. Motion

至少保留、且仅限：

1. AI 卡数据刷新过渡  
2. Chat token 流式出现  
3. 页面区块进入（极弱 opacity/translate，一次）  

禁止：无限 bounce、视差过载、鼠标跟随光斑。

---

## 10. Responsive

| 断点 | 行为 |
|------|------|
| ≥1280 | 完整 Dashboard 网格 |
| 768–1279 | 图表与 AI 卡堆叠；侧栏收纳 |
| <768 | 单列；Chat 全屏；次要面板 Tab 化 |

触控：点击区域 ≥ 44px；图表可横滑周期。

---

## 11. Accessibility

- 对比度达标（正文 vs 背景）  
- Focus ring 使用 `--focus`  
- 涨跌不只靠颜色（搭配 ↑↓ / 文案）  
- 动画支持 `prefers-reduced-motion`  

---

## 12. Page Templates

### 12.1 Dashboard

```
Header (logo, nav, plan, avatar)
AI Analysis Card
Chart Panel
Row: Signals | Forecast
Row: News | Smart Money | Sentiment
Footer / disclaimer
```

### 12.2 Marketing Landing（若有）

- 首屏：品牌 + 一句价值主张 + CTA + 全幅产品氛围（非卡片拼贴）  
- 避免首屏堆统计条与功能宫格  

---

## 13. shadcn / Tailwind 约定

- 使用 CSS 变量映射到 shadcn theme  
- 组件优先复用 shadcn：Button、Dialog、Drawer、Tabs、Tooltip、Dropdown  
- 自定义金融组件放 `features/*/components`  

---

## 14. AI 生成 UI 检查清单

- [ ] 深色默认，无随机紫色主题  
- [ ] Geist 字体  
- [ ] AI 卡信息架构完整  
- [ ] 证据列表可见  
- [ ] 图表与涨跌色正确  
- [ ] 移动端可滚动且无横向溢出  
- [ ] 有免责声明入口  

---

## Related

- [CODING_RULES.md](./CODING_RULES.md)
- [PRD.md](./PRD.md)
- [README.md](../README.md)
