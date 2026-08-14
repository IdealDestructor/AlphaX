# AlphaX API Specification

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Style | REST + WebSocket · OpenAPI 3.1 风格 |
| Base URL | `https://api.alphax.example/v1` |
| WS URL | `wss://api.alphax.example/v1/ws` |

> 实现时以生成的 `openapi.yaml` 为准；本文是契约草案。

> **实现进度标识（2026-08-14 同步 backend `apps/api`）：**
> - ✅ = 后端已实现路由；✅️(web) = 前端已接入（见 [API_CLIENT.md](./API_CLIENT.md)）
> - 🔲 = 契约已规划、后端尚未实现

---

## 1. 通用约定

### 1.1 鉴权

| 方式 | Header | 适用 |
|------|--------|------|
| Bearer JWT | `Authorization: Bearer <access_token>` | 用户 |
| API Key | `X-API-Key: <key>` | Enterprise |
| 无 | — | 公开只读 |

### 1.2 响应包络

```json
{
  "data": {},
  "meta": {
    "request_id": "req_...",
    "timestamp": "2026-07-20T08:00:00Z"
  },
  "error": null
}
```

错误：

```json
{
  "data": null,
  "meta": { "request_id": "req_..." },
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Daily chat quota exceeded",
    "details": {}
  }
}
```

### 1.3 标准错误码

| HTTP | code | 含义 |
|------|------|------|
| 400 | `VALIDATION_ERROR` | Zod/参数错误 |
| 401 | `UNAUTHORIZED` | 未登录 |
| 403 | `FORBIDDEN` | 权限/计划不足 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 429 | `RATE_LIMITED` / `QUOTA_EXCEEDED` | 限流/配额 |
| 500 | `INTERNAL_ERROR` | 服务器错误 |
| 503 | `AI_UNAVAILABLE` | AI 降级 |

### 1.4 分页

`GET ...?cursor=<id>&limit=50`

```json
{
  "data": { "items": [], "next_cursor": "..." }
}
```

### 1.5 幂等

写操作支持 `Idempotency-Key`（告警创建、Checkout）。

---

## 2. REST Endpoints

### 2.1 Auth

| Method | Path | Auth | 说明 |
|--------|------|------|------|
| POST | `/auth/register` | Public | Email 注册 ✅(web) |
| POST | `/auth/login` | Public | 登录，返回 access/refresh ✅ |
| POST | `/auth/refresh` | Public | 刷新令牌 ✅ |
| POST | `/auth/logout` | User | 吊销 refresh ✅ |
| GET | `/auth/oauth/{provider}` | Public | OAuth 跳转 ✅ |
| GET | `/auth/oauth/{provider}/callback` | Public | 回调（占位，未交换 code→token）✅ |

**Login 响应示例：**

```json
{
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "email": "u@example.com",
      "plan": "free",
      "role": "user"
    }
  }
}
```

### 2.2 Market

| Method | Path | Auth | 说明 |
|--------|------|------|------|
| GET | `/market/symbols` | Public | 品种列表 ✅ |
| GET | `/market/{symbol}/quote` | Public | 最新报价 ✅ |
| GET | `/market/{symbol}/candles` | Public/User | K 线历史 ✅ |
| GET | `/market/{symbol}/indicators` | User | 指标快照 ✅ |

**Candles Query：**

```
GET /market/XAUUSD/candles?timeframe=1h&limit=500&to=2026-07-20T00:00:00Z
```

```json
{
  "data": {
    "symbol": "XAUUSD",
    "timeframe": "1h",
    "candles": [
      { "t": "2026-07-20T00:00:00Z", "o": 3350, "h": 3358, "l": 3348, "c": 3355, "v": 12345 }
    ]
  }
}
```

### 2.3 AI Analysis

| Method | Path | Auth | 说明 |
|--------|------|------|------|
| GET | `/analysis/{symbol}` | Public* | 最新分析 ✅；字段按 plan 脱敏 |
| GET | `/analysis/{symbol}/history` | User | 历史分析 ✅(web) |
| POST | `/analysis/{symbol}/refresh` | Pro | 手动触发（限流）✅ |

\* Guest 仅 `trend/confidence/summary` 摘要。

**完整 Analysis Schema：**

```json
{
  "data": {
    "id": "uuid",
    "symbol": "XAUUSD",
    "timeframe": "4h",
    "trend": "bullish",
    "action": "buy",
    "confidence": 0.92,
    "entry": 3358,
    "stop_loss": 3344,
    "take_profit": 3385,
    "risk_level": "medium",
    "summary": "Buy on pullback",
    "reasons": [
      "DXY weakening",
      "MACD golden cross on 4H"
    ],
    "evidence": [
      { "source": "macro", "signal": "DXY ↓", "weight": 0.22 },
      { "source": "indicator", "signal": "MACD cross", "weight": 0.18 }
    ],
    "updated_at": "2026-07-20T08:00:00Z"
  }
}
```

### 2.4 Signals & Forecast

| Method | Path | Auth |
|--------|------|------|
| GET | `/signals` | User ✅ |
| GET | `/signals/{id}` | User ✅ |
| GET | `/signals/stats` | Pro ✅ |
| GET | `/forecast/{symbol}` | Pro ✅ |
| GET | `/forecast/{symbol}/history` | Pro 🔲 |

### 2.5 News & Sentiment & Smart Money

| Method | Path | Auth |
|--------|------|------|
| GET | `/news` | Public ✅(web) |
| GET | `/news/{id}` | Public ✅ |
| GET | `/sentiment` | User（完整 Pro）✅ |
| GET | `/sentiment/{symbol}` | User ✅ |
| GET | `/smart-money` | Pro ✅ |
| GET | `/smart-money/history` | Pro ✅ |

### 2.6 Chat

| Method | Path | Auth | 说明 |
|--------|------|------|------|
| GET | `/chat/sessions` | User | 会话列表 ✅ |
| POST | `/chat/sessions` | User | 新建会话 ✅ |
| GET | `/chat/sessions/{id}/messages` | Owner | 历史消息 ⚠️（后端数据已有，前端经 `/chat/sessions` 合并返回） |
| POST | `/chat/sessions/{id}/messages` | Owner | 发送；支持 SSE ✅（前端实际调用 `/chat/stream`） |

**Streaming（SSE）：**

```
POST /chat/sessions/{id}/messages
Accept: text/event-stream

data: {"type":"token","content":"黄金"}
data: {"type":"token","content":"上涨"}
data: {"type":"citation","content":{"news_id":"..."}}
data: {"type":"done","message_id":"uuid"}
```

**Request body：**

```json
{
  "content": "今天可以买黄金吗？",
  "context": {
    "symbol": "XAUUSD",
    "timeframe": "4h"
  }
}
```

### 2.7 Watchlist

| Method | Path | Auth |
|--------|------|------|
| GET | `/watchlist` | User ✅ |
| POST | `/watchlist` | User ✅ |
| DELETE | `/watchlist/{symbol}` | User ✅ |
| PATCH | `/watchlist/reorder` | User 🔲 |

```json
// POST /watchlist
{ "symbol": "XAUUSD" }
```

### 2.8 Alerts

| Method | Path | Auth |
|--------|------|------|
| GET | `/alerts` | User |
| POST | `/alerts` | User |
| PATCH | `/alerts/{id}` | Owner |
| DELETE | `/alerts/{id}` | Owner |

```json
{
  "type": "price",
  "symbol": "XAUUSD",
  "condition": { "op": "cross_above", "price": 3400 },
  "channels": ["email", "web_push"]
}
```

### 2.9 Journal & Calculator

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/journal` | Pro ✅ |
| GET/PATCH/DELETE | `/journal/{id}` | Owner ✅ |
| POST | `/tools/position-calculator` | Pro ✅ |

```json
// POST /tools/position-calculator
{
  "balance": 10000,
  "risk_percent": 1,
  "entry": 3358,
  "stop_loss": 3344,
  "symbol": "XAUUSD"
}
```

### 2.10 Billing & User

| Method | Path | Auth |
|--------|------|------|
| GET | `/me` | User ✅ |
| PATCH | `/me` | User ✅ |
| GET | `/billing/plans` | Public ✅ |
| POST | `/billing/checkout` | User ✅（Stripe 占位，未真实下单） |
| POST | `/billing/webhook` | Stripe Sig 🔲 |
| GET | `/billing/portal` | User ✅（占位 URL） |

### 2.11 Enterprise / Admin

| Method | Path | Auth |
|--------|------|------|
| GET/POST | `/enterprise/api-keys` | Enterprise ✅ |
| DELETE | `/enterprise/api-keys/{id}` | Enterprise ✅ |
| GET | `/admin/users` | Admin 🔲 |
| POST | `/admin/feature-flags` | Admin 🔲 |

---

## 3. WebSocket Protocol

> 🔲 **未实现**：需要 `@nestjs/websockets` + `@nestjs/platform-ws`（或 `ws` 网关）。当前仓库未安装这些依赖（沙箱无法写入 pnpm store），因此暂以 REST（`/market/...`、SSE `/chat/stream`）替代实时推送。接入清单见 `todos.md` 与本文件 §3。

### 3.1 连接

```
wss://api.alphax.example/v1/ws?token=<access_token>
```

Guest 可连公共行情（降级频道）。

### 3.2 客户端 → 服务端

```json
{ "op": "subscribe", "channel": "market.quote.XAUUSD" }
{ "op": "unsubscribe", "channel": "market.quote.XAUUSD" }
{ "op": "ping" }
```

### 3.3 服务端 → 客户端

```json
{
  "op": "event",
  "channel": "market.quote.XAUUSD",
  "data": {
    "symbol": "XAUUSD",
    "price": 3356.2,
    "bid": 3356.0,
    "ask": 3356.4,
    "ts": "2026-07-20T08:00:00.123Z"
  }
}
```

```json
{
  "op": "event",
  "channel": "ai.analysis.XAUUSD",
  "data": { "id": "uuid", "trend": "bullish", "confidence": 0.91 }
}
```

```json
{ "op": "pong", "ts": "..." }
{ "op": "error", "code": "FORBIDDEN", "message": "Pro required" }
```

---

## 4. OpenAPI 片段（示例）

```yaml
openapi: 3.1.0
info:
  title: AlphaX API
  version: 2.0.0
paths:
  /analysis/{symbol}:
    get:
      summary: Get latest AI analysis
      parameters:
        - name: symbol
          in: path
          required: true
          schema:
            type: string
            example: XAUUSD
        - name: timeframe
          in: query
          schema:
            type: string
            enum: [15m, 1h, 4h, 1d]
      responses:
        "200":
          description: Analysis payload
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AnalysisResponse"
```

完整 `openapi.yaml` 在实现阶段由代码注解（NestJS Swagger）生成，并在 CI 校验 breaking change。

---

## 5. 限流建议

| 层级 | 默认 |
|------|------|
| Public IP | 60 req/min |
| Free User | 120 req/min；Chat 10/day |
| Pro | 600 req/min；Chat 200/day |
| Enterprise API Key | 按合同；独立配额 |

响应头：`X-RateLimit-Limit` / `Remaining` / `Reset`

---

## 6. 版本策略

- URL 前缀 `/v1`
- 破坏性变更 → `/v2`
- 废弃字段：响应保留 ≥ 90 天 + `Sunset` 头

---

## Related

- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- [DATABASE.md](./DATABASE.md)
- [PRD.md](./PRD.md) 权限矩阵
