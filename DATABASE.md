# AlphaX Database Design

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| OLTP | PostgreSQL 16+ |
| Time-series | TimescaleDB |
| Cache / Queue | Redis |
| Vectors | pgvector（首选）或独立 Vector DB |

---

## 1. ER 概览

```
┌──────────┐       ┌──────────────┐       ┌─────────────┐
│  users   │───┬───│  watchlists  │       │ subscriptions│
└────┬─────┘   │   └──────────────┘       └──────▲──────┘
     │         │                                  │
     │         ├───┌──────────────┐               │
     │         │   │   alerts     │               │
     │         │   └──────────────┘               │
     │         │                                  │
     │         ├───┌──────────────┐       ┌───────┴───────┐
     │         │   │  journals    │       │  entitlements │
     │         │   └──────────────┘       └───────────────┘
     │         │
     │         ├───┌──────────────┐       ┌──────────────┐
     │         │   │ chat_sessions│───────│ chat_messages│
     │         │   └──────────────┘       └──────────────┘
     │         │
     │         └───┌──────────────┐
     │             │  api_keys    │ (enterprise)
     │             └──────────────┘
     │
     │   （分析域，多用户共享只读）
     │
┌────▼─────────┐   ┌──────────────┐   ┌──────────────┐
│ ai_analyses  │   │   signals    │   │  forecasts   │
└──────────────┘   └──────────────┘   └──────────────┘

┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    news      │   │ news_embeds  │   │  sentiments  │
└──────────────┘   └──────────────┘   └──────────────┘

┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ smart_money  │   │   symbols    │   │ ohlcv_*      │
└──────────────┘   └──────────────┘   │ (Timescale)  │
                                      └──────────────┘
```

---

## 2. 表结构（PostgreSQL）

> 类型以 PostgreSQL 为准；UUID 主键；时间一律 `timestamptz`。

### 2.1 `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK | `gen_random_uuid()` |
| email | citext | UNIQUE NOT NULL | |
| password_hash | text | NULL | OAuth 用户可空 |
| display_name | text | | |
| avatar_url | text | | |
| role | text | NOT NULL DEFAULT `user` | `user`/`pro`/`enterprise`/`admin` |
| plan | text | NOT NULL DEFAULT `free` | `free`/`pro`/`enterprise` |
| locale | text | DEFAULT `en` | |
| timezone | text | DEFAULT `UTC` | |
| email_verified_at | timestamptz | | |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | |
| deleted_at | timestamptz | | 软删 |

**索引：** `UNIQUE(email)`；`INDEX(plan)`；`INDEX(created_at)`

### 2.2 `oauth_accounts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → users | ON DELETE CASCADE |
| provider | text | `google`/`github` |
| provider_account_id | text | |
| created_at | timestamptz | |

**索引：** `UNIQUE(provider, provider_account_id)`；`INDEX(user_id)`

### 2.3 `subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | |
| provider | text | `stripe` |
| provider_subscription_id | text | UNIQUE |
| plan | text | |
| status | text | `active`/`past_due`/`canceled`/`trialing` |
| current_period_end | timestamptz | |
| created_at / updated_at | timestamptz | |

### 2.4 `entitlements`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | |
| feature_key | text | 如 `chat.daily_limit` |
| value | jsonb | 如 `{"limit":200}` |
| source | text | `plan`/`override` |
| expires_at | timestamptz | NULL=长期 |

**索引：** `UNIQUE(user_id, feature_key)` WHERE active

### 2.5 `symbols`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| code | text UNIQUE | `XAUUSD` |
| name | text | |
| asset_class | text | `metal`/`fx`/`crypto`/`index` |
| tick_size | numeric | |
| is_active | boolean | |

### 2.6 `watchlists`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | |
| symbol_id | uuid FK | |
| sort_order | int | DEFAULT 0 |
| created_at | timestamptz | |

**索引：** `UNIQUE(user_id, symbol_id)`；`INDEX(user_id)`

### 2.7 `ai_analyses`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| symbol_id | uuid FK | |
| timeframe | text | `1h`/`4h`/`1d`… |
| trend | text | `bullish`/`bearish`/`neutral` |
| action | text | `buy`/`sell`/`wait` |
| confidence | numeric(5,4) | 0–1 |
| entry / stop_loss / take_profit | numeric | nullable |
| risk_level | text | `low`/`medium`/`high` |
| summary | text | |
| reasons | jsonb | `string[]` |
| evidence | jsonb | `[{source,signal,weight}]` |
| model_versions | jsonb | Agent/模型版本 |
| raw_payload | jsonb | 调试用，可归档 |
| created_at | timestamptz | |

**索引：** `INDEX(symbol_id, timeframe, created_at DESC)`；`INDEX(created_at DESC)`

### 2.8 `signals`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| symbol_id | uuid FK | |
| analysis_id | uuid FK NULL | |
| action | text | |
| price | numeric | |
| entry / tp / sl | numeric | |
| confidence | numeric(5,4) | |
| status | text | `open`/`hit_tp`/`hit_sl`/`expired`/`canceled` |
| timeframe | text | |
| created_at / closed_at | timestamptz | |
| outcome | jsonb | 准确率统计用 |

**索引：** `INDEX(symbol_id, created_at DESC)`；`INDEX(status)`

### 2.9 `forecasts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| symbol_id | uuid FK | |
| horizon | text | `30m`/`1h`/`4h`/`1d`/`3d`/`1w` |
| p_up / p_down / p_range | numeric(5,4) | |
| cone | jsonb | 概率带坐标 |
| confidence | numeric(5,4) | |
| created_at | timestamptz | |

**索引：** `INDEX(symbol_id, horizon, created_at DESC)`

### 2.10 `news`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| external_id | text | 源内唯一 |
| source | text | |
| title | text | |
| url | text | |
| summary | text | |
| body_text | text | 可选，合规注意 |
| impact | text | `bullish`/`bearish`/`neutral` |
| impact_confidence | numeric(5,4) | |
| expected_duration | text | |
| symbols | text[] | |
| published_at | timestamptz | |
| created_at | timestamptz | |

**索引：** `UNIQUE(source, external_id)`；`INDEX(published_at DESC)`；`GIN(symbols)`

### 2.11 `news_embeddings`

| Column | Type | Notes |
|--------|------|-------|
| news_id | uuid PK/FK | |
| embedding | vector(1536) | 维度随模型 |
| model | text | |
| created_at | timestamptz | |

**索引：** `ivfflat` / `hnsw` on `embedding`

### 2.12 `sentiments`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| symbol_id | uuid FK NULL | 全局可空 |
| score | numeric | -1 ~ 1 或 0–100 |
| label | text | `fear`…`extreme_greed` |
| heat_score | numeric | |
| components | jsonb | twitter/reddit/news/trends |
| created_at | timestamptz | |

### 2.13 `smart_money_snapshots`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| as_of | date | |
| etf_flow | numeric | |
| comex | jsonb | |
| cot | jsonb | |
| central_bank | jsonb | |
| dxy | numeric | |
| us10y | numeric | |
| composite_score | numeric | |
| bias | text | `bullish`/`neutral`/`bearish` |
| created_at | timestamptz | |

**索引：** `UNIQUE(as_of)`；`INDEX(as_of DESC)`

### 2.14 `alerts`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | |
| type | text | `price`/`ai`/`news`/`indicator` |
| symbol_id | uuid FK NULL | |
| condition | jsonb | |
| channels | text[] | |
| status | text | `active`/`triggered`/`disabled` |
| last_triggered_at | timestamptz | |
| created_at | timestamptz | |

**索引：** `INDEX(user_id, status)`；`INDEX(type, status)`

### 2.15 `alert_deliveries`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| alert_id | uuid FK | |
| channel | text | |
| status | text | `sent`/`failed` |
| error | text | |
| created_at | timestamptz | |

### 2.16 `journals`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | |
| symbol_id | uuid FK | |
| side | text | `long`/`short` |
| entry_price / exit_price | numeric | |
| qty | numeric | |
| profit | numeric | |
| ai_signal_id | uuid NULL | |
| note | text | |
| tags | text[] | |
| opened_at / closed_at | timestamptz | |
| created_at | timestamptz | |

**索引：** `INDEX(user_id, opened_at DESC)`

### 2.17 `chat_sessions` / `chat_messages`

**sessions：** `id`, `user_id`, `title`, `created_at`, `updated_at`

**messages：** `id`, `session_id`, `role`(`user`/`assistant`/`system`), `content`, `citations` jsonb, `token_usage` jsonb, `created_at`

**索引：** `INDEX(session_id, created_at)`；`INDEX(user_id)` on sessions

### 2.18 `api_keys`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id / org_id | uuid | |
| name | text | |
| key_prefix | text | 展示用 |
| key_hash | text | |
| scopes | text[] | |
| last_used_at | timestamptz | |
| revoked_at | timestamptz | |
| created_at | timestamptz | |

### 2.19 `audit_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | bigserial PK | |
| actor_id | uuid | |
| action | text | |
| resource | text | |
| meta | jsonb | |
| ip | inet | |
| created_at | timestamptz | |

**索引：** `INDEX(created_at DESC)`；`INDEX(actor_id, created_at DESC)`

---

## 3. TimescaleDB（行情）

### 3.1 `ohlcv`（hypertable）

| Column | Type | Notes |
|--------|------|-------|
| time | timestamptz | NOT NULL |
| symbol_id | uuid | NOT NULL |
| timeframe | text | `1m`… 或仅存 1m 再连续聚合 |
| open / high / low / close | numeric | |
| volume | numeric | |

```sql
SELECT create_hypertable('ohlcv', by_range('time'));
CREATE UNIQUE INDEX ON ohlcv (symbol_id, timeframe, time DESC);
```

**建议：** 原始写入 `1m`，用 Continuous Aggregates 生成 `5m/15m/1h/4h/1d`。

### 3.2 压缩与保留

- 压缩策略：> 7 天压缩
- 保留策略：1m 原始保留 90–180 天；日线长期保留
- 按成本调整

### 3.3 `indicator_values`（可选 hypertable）

`time`, `symbol_id`, `timeframe`, `name`, `values` jsonb

---

## 4. Redis 键约定

| Key | Value | TTL |
|-----|-------|-----|
| `quote:{code}` | JSON quote | 15s |
| `ai:analysis:{code}:{tf}` | JSON analysis | 3m |
| `ratelimit:{user}:{route}` | counter | window |
| `quota:chat:{user}:{yyyyMMdd}` | int | 48h |
| `ws:presence:{user}` | 1 | 60s |

---

## 5. 迁移策略

### 5.1 工具

- NestJS：`Prisma Migrate` 或 `TypeORM Migrations`（二选一，团队锁定）
- Python AI：不直接改业务库 schema；只读或通过 API
- Timescale：独立 SQL migration 目录 `db/timeseries/`

### 5.2 流程

1. 开发分支写 migration（正向 + 尽可能可逆）
2. CI 在空库上 `migrate up` 跑通
3. Staging 先执行，跑 smoke
4. Production：维护窗口或 online DDL（大表慎用锁）
5. 禁止手改生产 schema

### 5.3 版本兼容

- 应用采用 **Expand → Migrate → Contract**：
  1. 先加新列/新表（兼容旧代码）
  2. 双写或回填
  3. 切换读
  4. 删除旧列

### 5.4 种子数据

- `symbols` 基础品种
- 开发用 mock OHLCV
- Feature entitlements 模板按 plan

### 5.5 备份

- 日全量 + WAL 连续归档
- Timescale 与 OLTP 分开备份策略
- 定期恢复演练

---

## 6. 命名与约定

- 表名：`snake_case` 复数
- FK：`{table_singular}_id`
- 枚举：DB `text` + 应用层 Zod enum（避免频繁 ALTER TYPE）
- 金额/价格：`numeric`，禁止 float
- 删除：用户数据软删；行情物理保留按策略

---

## Related

- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- [API_SPEC.md](./API_SPEC.md)
- [MONETIZATION.md](./MONETIZATION.md)
