# AlphaX 整体升级方案（2026-Q3）

| 字段 | 值 |
|------|-----|
| Status | Proposed（待评审） |
| Date | 2026-08-20 |
| 参考项目 | `G:/SourceCode/tickflow-stock-panel` · `G:/SourceCode/financial-Research` |
| 关联文档 | [ROADMAP](./ROADMAP.md) · [SYSTEM_DESIGN](./SYSTEM_DESIGN.md) · [AI_ARCHITECTURE](./AI_ARCHITECTURE.md) · [DATABASE](./DATABASE.md) · [todos](../todos.md) |

---

## 1. 现状与差距

### 1.1 现状（2026-08）

AlphaX 目前是 **mock-first 演示架构**：

- 行情报价 / K线 / 指标：已接入 **TickFlow** 真实源（`market/providers/`，Key 配置于 `apps/api/.env`），未映射/失败的标的自动回退 `Math.random()` 模拟（前端 15s 轮询），`GET /market/data-source` 可查主源与降级状态
- AI 分析 / 预测 / 信号 / 情绪 / Smart Money：本地随机生成或种子数据
- 唯一真实数据：新闻 RSS（Google News / Kitco / CoinDesk / CNBC）
- 无 WebSocket、无 `apps/ai` Python 服务、无本地数据湖、无回测/监控/复盘

### 1.2 与参考项目差距

| 维度 | AlphaX（现状） | tickflow-stock-panel | financial-Research |
|------|----------------|----------------------|--------------------|
| 行情数据 | 本地随机 | TickFlow 多档实时 + 自定义数据源 YAML | 东财/腾讯/mootdx/akshare 分层降级 |
| 本地存储 | Postgres（业务） | Parquet + DuckDB 本地数据湖 | 本地缓存 `~/.vibe-research/`，用户数据不上传 |
| 数据源架构 | 无抽象 | `data_providers/`（base/registry/normalizer/schemas） | 数据源优先级 + 串行限流 + TTL 缓存 |
| 选股/信号 | 静态种子 | Polars 毫秒级扫全市场 + 18 策略 + AI 生成策略 | 关注列表 + 行情表格 |
| 回测 | 无 | 因子/策略/组合回测 + Walk-forward + 优化器 | 无 |
| 监控 | 简单告警 CRUD | 四类监控 + 语音 + 飞书推送 | 无 |
| 复盘 | 无 | 盘后 AI 复盘 + 定时推送 | 每日复盘 + AI 一键复盘 |
| AI 投研 | 单一分析卡片 | AI 四维分析（技术/基本面/财务/消息） | 多空辩论 + 反思审计 + 资讯雷达 + 可插拔 LLM |
| AI 接入 | 未实现 | OpenAI 兼容（DeepSeek/通义/Ollama）+ token 预算 | OpenAI 兼容 + 本机 CLI 订阅 + MCP Server |
| Agent 接口 | 无 | — | MCP Server（JSON-RPC over stdio） |

---

## 2. 升级目标

1. **真实数据源接入**：行情/指标/新闻/财务 全部接入真实源，替换 mock 生成
2. **数据源插件化 + 分层降级**：Provider 适配层 + 主备源切换 + 限流防封 + TTL 缓存
3. **本地数据湖**：行情与计算结果落盘（Parquet/DuckDB），降低对上游依赖、支撑回测
4. **产品能力补齐**：看板、自选、信号扫描、回测、监控、复盘、多空辩论、资讯雷达
5. **技术架构升级**：`apps/ai` Python AI 服务、SSE/WebSocket 实时推送、MCP、可插拔 LLM
6. **数据主权与合规**：用户数据本地化、AI 输出带免责、不承诺收益

---

## 3. 数据源接入方案（核心）

### 3.1 数据源适配层（参考 tickflow `data_providers/` + financial-Research 分层）

在 NestJS 新增 `market-data` 模块，结构对齐 tickflow：

```text
apps/api/src/modules/market-data/
├── providers/
│   ├── base.ts          # DataProvider 接口（quote/candle/indicators/fundamentals/news）
│   ├── registry.ts      # Provider 注册、健康检查、主备路由
│   ├── normalizer.ts    # 各源响应 → 内部标准字段（NormalizedSchema）
│   ├── schemas.ts       # 内部契约（与 packages/schemas 对齐）
│   ├── twelve-data.ts   # 黄金/白银（免费 Key，主源）
│   ├── yahoo.ts         # 备用源（指数/原油，示例）
│   ├── binance.ts       # 加密源（公开 API，免 Key）
│   └── rss.ts           # 新闻源（现有 RSS 收编为 Provider）
└── ingest/
    ├── candle-sync.ts   # 盘后批量同步 → 本地数据湖
    └── quote-cache.ts   # 盘中增量 → Redis/内存 TTL
```

**内部标准字段（NormalizedSchema）**：`symbol | ts | open | high | low | close | volume | amount | source | quality`。所有下游（指标、AI、图表）只依赖内部契约，不感知具体数据源。

### 3.2 具体数据源建议（免费起步，分阶段替换 mock）

> 本轮已把「现货黄金/白银、加密、美债收益率」三类标的的免费数据源调研落定（2026-08-20），
> 精确端点与认证方式见 §3.2.1。其余品类见下表。

| 数据 | 主源 | 备用源 | 说明 |
|------|------|--------|------|
| 现货黄金/白银 XAUUSD / XAGUSD | TwelveData（免费 Key） | Frankfurter(ECB) / Stooq CSV | 分钟~日线，见 §3.2.1 |
| 加密 BTC / ETH 等 | Binance 公开行情 | CoinGecko | 无需 Key，REST + WS，见 §3.2.1 |
| 美债收益率 US10Y 等 | US Treasury 官方 CSV | FRED(DGS10, 免费 Key) | 每日官方数据，见 §3.2.1 |
| DXY / 指数 / WTI / BRENT | TwelveData / Yahoo Finance | Frankfurter / Stooq | 待接入（本轮未做） |
| 新闻 | 现有 RSS（Google News/Kitco/CoinDesk/CNBC） | 东财全球资讯（参考 a-stock-data） | 已具备，收编为 Provider |
| 财务/基本面（扩展个股时） | 参考 a-stock-data / global-stock-data 分层 | — | 未来 V3 多市场时引入 |

> **关键原则（参考 financial-Research VISION）：** 能拿到真数据绝不让模型编；主源挂了走备用源，备用源也挂了如实报缺（`source:"unavailable"`），不用「看起来合理」的数据填空。

#### 3.2.1 三类标的精确端点（2026-08-20 调研落定）

| 标的 | 源 | 端点 | 认证 | 说明 |
|------|----|------|------|------|
| XAUUSD/XAGUSD 实时价 | TwelveData | `GET https://api.twelvedata.com/price?symbol=XAU/USD&apikey=KEY` | 免费 Key（800 credits/天，8 req/min） | 返回 `{price:"2350.12"}` |
| XAUUSD/XAGUSD K线 | TwelveData | `GET https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1min&outputsize=500&apikey=KEY` | 同上 | 返回 `{values:[{datetime,open,high,low,close,volume}]}`，`datetime`→time 需解析 |
| XAUUSD/XAGUSD 备用 | Frankfurter(ECB) | `GET https://api.frankfurter.app/latest?from=XAU&to=USD` | 免 Key | XAU 支持待验证；不支持则用 Stooq `https://stooq.com/q/d/l/?s=xauusd&i=d`（日线 CSV） |
| BTCUSD/ETHUSD 实时+K线 | Binance | `GET https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT`；`/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=500`；WS `wss://data-stream.binance.vision/ws/btcusdt@kline_1m` | 无需 Key | klines 返回二维数组 `[openTime,open,high,low,close,volume,...]` |
| 加密备用 | CoinGecko | `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd` | 免 Key，限频宽松 | 仅实时价，无 K线 |
| US10Y 收益率 | US Treasury 官方 | `GET https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/{year}/all?type=daily_treasury_yield_curve&field_tdr_date_value={year}&page&_format=csv` | 免 Key，S级可商用 | 每日 1M~30Y 收益率 CSV，10 年期列名 `10 Yr`（实测 10Y=4.71，参考 global-stock-data） |
| US10Y 备用 | FRED | `GET https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=KEY` | 免费 Key | 官方权威，需注册 |

> 备注：收益率品种（US10Y）以「收益率百分比」作为 `price` 展示（如 4.71 = 4.71%），`change/changePercent` 按相邻交易日差值计算；与价格类品种语义不同，前端展示时注意。

### 3.3 限流与防封（参考 a-stock-data `em_get`）

- 串行限流 + 随机抖动（间隔 ≥1s）+ 会话复用
- 按 Provider 配置 `rpm`（每分钟请求数），超额排队
- 失败退避 + 自动切备用源；空结果不缓存，下次重试

### 3.4 本地数据湖（参考 tickflow Parquet/DuckDB）

```text
data/
├── market/          # 日K/分钟K Parquet（按 symbol/interval 分片）
├── indicators/      # 指标 enriched 结果
├── financials/      # 财务快照（扩展）
├── backtests/       # 回测结果
└── meta/            # schema 版本、同步状态
```

- 盘后批量同步全量历史；盘中增量追加
- Parquet schema 版本化（参考 tickflow `test_parquet_schema_compat`）
- 查询用 DuckDB 或内存 Polars/轻量读取；Postgres 只存业务与最新快照

### 3.5 实时推送（分三阶段，对齐 API_SPEC §3）

| 阶段 | 方案 | 说明 |
|------|------|------|
| P0（现状） | REST 轮询 15s | 保持可用 |
| P1 | SSE：`GET /market/stream`、`/analysis/stream` | 低延迟替代轮询 |
| P2 | WebSocket 网关 `@nestjs/websockets` | quote/candle/analysis/signal 频道，对齐 SYSTEM_DESIGN |

---

### 3.6 当前进展（2026-08-20）

已落地（本轮）：
- `apps/api/.env` 配置 `TICKFLOW_API_KEY`（gitignore，不提交）；`main.ts` 用 Node22 内置 `process.loadEnvFile` 加载 `.env`（零依赖）
- `apps/api/src/modules/market/providers/`：`types`（Provider 接口 + Quote/Candle 契约）、`registry`（TickFlow→Mock 分层降级 + 健康状态）、`mock`（原模拟逻辑收编）、`tickflow/`（REST 适配：`/v1/quotes`、`/v1/klines[/intraday]`，容错归一化 + 标的映射）
- `GET /market/data-source`：primary / configured / enabled / live / lastError / symbolMap / sourceBySymbol
- 前端 `MarketHeader` 按每条 quote 的 `source` 显示「实时行情 / 模拟数据」角标

设计要点：
- 标的映射（`TICKFLOW_SYMBOL_MAP`，可 env 覆盖）：GLD/SLV/SPY→`GLD.US`/`SLV.US`/`SPY.US`；NAS100/SPX500→`NDX.US`/`SPX.US`（最佳猜测）
- **TickFlow 不覆盖现货黄金/白银、加密、美债收益率等品种**（XAUUSD/XAGUSD/BTCUSD/DXY/WTI/BRENT/US10Y 无映射），这些标的如实走 mock，不做错误顶替
- 鉴权同时携带 `Authorization: Bearer` 与 `X-API-Key`；百分比字段按文档语义 `0.01=>1%`（`TICKFLOW_PERCENT_SCALE` 可配）；时间戳 ms→s 自动归一

待本地验证（沙箱无外网，未能实时探测）：
- 启动 Postgres + `pnpm dev` 后用真实 Key 验证 `/v1/quotes`、`/v1/klines` 的响应结构/字段语义/周期支持（1m/5m/15m/30m/60m/1d/1w/1M），必要时微调归一化与 `INTERVAL_MAP`
- 若 NAS100/SPX500 映射错误，改 `TICKFLOW_SYMBOL_MAP` 或移除映射即可


### 3.7 三类新标的接入进展（2026-08-20）

已落地（本轮）：
- 新增 `market/providers/binance/`（加密，免 Key）：`/api/v3/ticker/24hr` + `/api/v3/klines`，映射 BTCUSD→BTCUSDT
- 新增 `market/providers/treasury/`（美债，免 Key）：US Treasury 官方 daily-treasury-rates CSV，解析 `10 Yr` 收益率列
- 新增 `market/providers/twelve-data/`（黄金/白银，需 Key）：`/price` + `/time_series`；`TWELVEDATA_API_KEY` 未配置时自动跳过（走 mock）
- Registry 扩展为多 Provider 路由：TwelveData → Binance → Treasury → TickFlow → Mock；`/market/data-source` 返回各 Provider 的 configured/enabled/live/lastError
- 前端行情角标按真实数据源显示来源名（TickFlow / Binance / US Treasury / TwelveData），mock 仍显示「模拟数据」

待本地验证（沙箱无外网，未能实时探测）：
- Binance：`curl "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"` 与 `/klines` 字段/周期支持
- Treasury：`curl "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/2026/all?type=daily_treasury_yield_curve&field_tdr_date_value=2026&page&_format=csv"` 确认 `10 Yr` 列名与首行日期
- TwelveData：注册免费 Key 后验证 `/price`、`/time_series` 的 `datetime` 格式与限频

## 4. 产品设计升级

> 定位不变：TradingView × ChatGPT × Bloomberg × AI Analyst；先做透 Gold，再扩多市场。
> 新增模块均参考两个参考项目的成熟形态，按 AlphaX「可解释 + 合规」原则裁剪。

| 模块 | 现状 | 升级目标 | 参考 |
|------|------|----------|------|
| 首页看板 | 基础 KPI + AI 卡 | 市场情绪评分 + 涨跌/成交榜单 + 异动事件流 | tickflow Dashboard |
| 行情/图表 | 多周期 K 线 + 指标 | 真实行情 + 9 类关键价位 + 多周期同步 | tickflow Stock Analysis |
| 自选 Watchlist | 基础 CRUD | 批量导入 + 表格/卡片双视图 + 实时行情开关 | tickflow Watchlist / financial Watchlist |
| 信号中心 | 静态种子 | 策略扫描（Screener）+ 自定义条件 + AI 生成策略 | tickflow Screener |
| 回测 | 无 | 因子回测（IC/IR/分层）+ 策略回测（净值/回撤/夏普）+ Walk-forward | tickflow Backtest |
| 监控/告警 | 价格/AI/新闻/指标 CRUD | 四类监控 + 多条件 AND/OR + 邮件/Telegram/飞书/WebPush + 语音 | tickflow Monitor |
| 复盘 | Journal 草稿 | 盘后 AI 自动复盘 + 定时执行 + 推送 | tickflow Review / financial Daily Review |
| 多空辩论 | 无 | 事实底稿 → 多方/空方 → 中立主持 → 验证清单 | financial Debate |
| 反思审计 | 无 | 对已有分析做推理审计，输出「怎么继续验证」 | financial Reflection |
| 资讯雷达 | 新闻列表 | 12 赛道多源 RSS + AI 一键提炼今日要点 | financial Intel |
| 个股/财务（V3） | 无 | 财报速览 + 估值分位 + 研报/公告/资金面 | financial Stock Detail |
| 持仓/研究记录（V3） | 无 | 本地持仓 + 自选 + 研报归档 | financial Portfolio / Reports |

**产品原则（吸收 financial-Research VISION）：** 数据摆全、框架公开、结论归用户；刻意不产出「买卖指令」，多空辩论以「分歧点 + 验证清单」收尾。

---

## 5. 技术架构升级

### 5.1 新增 `apps/ai`（Python AI Service）

```text
apps/ai/
├── app.py             # FastAPI：/ai/chat /ai/debate /ai/reflect /ai/analyze（SSE/NDJSON 流式）
├── llm.py             # 可插拔 LLM：OpenAI 兼容 / DeepSeek / Ollama / 本机 CLI 订阅
├── tools.py           # 数据工具（复用 market-data 契约，内部 HTTP 或直接调用）
├── debate.py          # 多空辩论（参考 financial-Research backend/debate.py）
├── reflection.py      # 反思审计（参考 backend/reflection.py）
├── newsradar.py       # 资讯雷达聚合 + 提炼（参考 backend/newsradar.py）
├── mcp_server.py      # MCP Server（零依赖 JSON-RPC over stdio，暴露 query_quote / query_analysis / query_news…）
└── requirements.txt
```

- 与 NestJS 通过内部 HTTP 通信；SSE/NDJSON 流式输出（对齐现有 `/chat/stream`）
- 结果结构化：Pydantic schema 与前端 Zod 对齐（ADR-006 落地）
- Token 预算 + 模型分级 + 结果缓存 + 可降级（对齐 AI_ARCHITECTURE §1）
- **MCP**：让 Claude Code / 其他 agent 用订阅额度直接调数据，参考 financial-Research `mcp_server.py`

### 5.2 NestJS 侧

| 变更 | 说明 |
|------|------|
| 新增 `market-data` 模块 | Provider 适配层 + Ingest Worker（§3.1） |
| SSE 端点 | `/market/stream`、`/analysis/stream`（P1） |
| WebSocket 网关 | `/v1/ws` 频道（P2，安装 `@nestjs/websockets`/`ws`） |
| Redis 接入 | 缓存/限流/广播；P0 先用内存 TTL 过渡 |
| `packages/schemas` | Zod 共享契约，前后端 + AI 三方同源 |

### 5.3 数据模型演进（详见 DATABASE.md 后续更新）

- `symbols` 扩展：`exchange | market | currency | timezone | price_source`
- 新增 `ohlcv`（或本地 Parquet 优先，Postgres 存最新快照）
- `news` 增强：`source_quality | provider | raw_json`；新增 `review / backtest / monitor_rule / monitor_event` 表
- `ai_analyses` 增加：`run_id | model_versions | llm_provider`（对齐 AI_ARCHITECTURE）

---

## 6. 分期路线

| 阶段 | 周期 | 焦点 | 关键交付 |
|------|------|------|----------|
| **P0 数据源 PoC** | 1–2 周 | 真实行情替换 mock | Provider 适配层骨架；TwelveData/Yahoo/Binance 接入；`/market/quotes|candles` 返回真实数据；Redis 缓存 |
| **P1 本地数据湖 + 回测** | 3–4 周 | 数据沉淀 + 分析工具 | Parquet/DuckDB 数据湖；指标 enriched 管线；信号扫描（Screener）；因子/策略回测；SSE 行情流 |
| **P2 AI 服务 + 投研** | 4–6 周 | 多 Agent 投研闭环 | `apps/ai` 落地（chat/debate/reflect/analyze）；MCP Server；资讯雷达；盘后复盘；可插拔 LLM |
| **P3 实时 + 监控 + 商业化** | 4–6 周 | 主动触达 + 变现 | WebSocket 网关；四类监控 + 多通道推送；Stripe 真实化；Pro 门控落地 |

**DoD（每阶段）：** 真实数据 ≥1 源在跑、mock 可一键切换回退、类型契约通过、构建/测试绿、文档同步。

---

## 7. 风险与合规

| 风险 | 对策 |
|------|------|
| 数据源稳定性 / IP 被封 | 分层降级 + 串行限流 + 会话复用（参考 a-stock-data） |
| 免费源限频 | 本地数据湖缓存 + 盘后批量同步，盘中增量少取 |
| AI 成本 | token 预算、模型分级、结果缓存、可降级 |
| 合规 | 不承诺收益、不推荐买卖指令、AI 输出强制免责、不抓取付费源全文（沿用 ROADMAP） |
| 数据主权 | 用户自选/持仓/研报仅存本地（参考 financial-Research） |
| 架构复杂度 | 保持 mock 可回退；每阶段独立上线、可单独回滚 |

---

## 8. 落地清单

> 对应 [todos.md](../todos.md)「整体升级方案（2026-08）」章节，按阶段拆解为可勾选任务。
