# AlphaX 注册 / 登录 / 付费授权 技术方案

| 字段 | 值 |
|------|-----|
| Version | 1.0（2026-08-20 首版） |
| Status | Proposed → 实施中（本任务落地） |
| 范围 | 注册、登录、会话、用户设置、订阅付费、授权码激活、权益门控 |
| 关联文档 | [API_SPEC](./API_SPEC.md) · [API_CLIENT](./API_CLIENT.md) · [MONETIZATION](./MONETIZATION.md) · [ARCHITECTURE_DECISIONS](./ARCHITECTURE_DECISIONS.md) · [DATABASE](./DATABASE.md) · [PRD](./PRD.md) · [todos](../todos.md) |

---

## 1. 背景与目标

### 1.1 现状（2026-08-20 审计）

| 能力 | 后端 | 前端 | 结论 |
|------|------|------|------|
| 注册 | `POST /auth/register` 已实现 | `AuthProvider.register()` 已实现但**无页面** | 不可用 |
| 登录 | `POST /auth/login` 已实现 | `AuthProvider.login()` 已实现但**无页面** | 不可用 |
| 会话刷新 | `POST /auth/refresh`（旋转 refresh token） | `apiClient` 401 自动刷新 | 可用 |
| 我的资料 | `GET /auth/me` | AuthProvider 挂载时拉取 | 可用 |
| 用户资料/密码 | `/user/profile` `PATCH`、`/user/password` | 未接入 | 不可用 |
| 用户设置 | `/user/settings` 仅 locale/timezone | 前端设置页走 mock | 不可用 |
| 订阅付费 | `/billing/*` 返回**占位 URL** | 无页面 | 不可用 |
| 授权码 | 无 | 无 | 无 |
| 权益门控 | 无强制校验 | 无 | 无 |

**关键缺陷：**

1. `register` 与 `login` 响应结构不一致：register 返回 `{ access_token, refresh_token, user }`，login 返回 `{ accessToken, refreshToken }`（无 user）→ 前端必须分别适配，易错。
2. 设置页完全 mock：币种、配色、通知、API Key 均不落库。
3. Billing 是占位符：checkout/portal 返回 `checkout.alphax.example` 假 URL，无法真正开通订阅。
4. 无「付费授权」概念：没有订阅订单、授权码（License）、权益（Entitlements）落库与强制校验。
5. 前端无登录/注册/计费页面，Topbar/Sidebar 固定显示 "Guest User"。

### 1.2 目标

1. **注册/登录可用**：完整页面 + 表单校验 + 错误提示 + 会话保持 + 退出登录。
2. **设置真正可用**：个人资料、改密码、币种、配色、通知、API Key 全部落库并在前端生效。
3. **付费授权可用**：订阅下单 → 支付确认（本地模拟；配置 Stripe 后走真实）→ 订阅/权益落库 → 套餐生效；另支持**授权码激活**（License Key）。
4. **权益门控**：后端强制校验 Pro/Enterprise 功能与配额（Free=10 Chat/日、5 自选、3 告警），前端展示套餐与升级入口。
5. 全流程本地可跑通：注册新用户 → 登录 → 修改设置 → 免费额度 → 模拟支付/授权码升级 Pro → 解锁门控功能。

---

## 2. 总体架构

```
Web (Next.js App Router)
  /login  /register            → AuthProvider.login/register
  /billing /billing/checkout   → BillingProvider / apiClient
  /settings                    → 真实 /user/* + /enterprise/api-keys
        │  fetch + JWT (Bearer) + 401 refresh
        ▼
NestJS API (apps/api)
  AuthModule      register/login/refresh/logout/me
  UserModule      profile/password/settings
  BillingModule   plans/checkout/orders/confirm/license/subscription/webhook/portal/entitlements
  Entitlements    plan→features+quota 元数据 + RequirePlan 守卫 + 配额校验
        │  Prisma
        ▼
PostgreSQL（users / refresh_tokens / subscriptions / entitlements / orders / licenses / …）
```

**付费双通道（本地即可用）：**

| 通道 | 场景 | 实现 |
|------|------|------|
| 订阅（Subscription） | 线上支付（生产 Stripe） | `POST /billing/checkout` 创建 Order → 前端确认页 → `POST /billing/orders/:id/confirm`（本地模拟）或 Stripe Checkout/Webhook（配置 `STRIPE_SECRET_KEY` 后） |
| 授权码（License） | 线下/企业/离线授权 | `POST /billing/license/activate`，凭 seed 生成的授权码激活对应套餐 |

两通道统一落库：`users.plan` + `subscriptions` + `entitlements`。

---

## 3. 数据模型（Prisma 变更）

### 3.1 `User` 扩展（设置落库）

```prisma
model User {
  // …现有字段…
  currency      String  @default("USD")                // 基准币种
  colorScheme   String  @default("international") @map("color_scheme")  // international | chinese
  notifications Json    @default("{}")                 // 通知偏好 JSON
  orders        Order[]
  licenseRedemptions LicenseRedemption[]
}
```

### 3.2 新增 `Order`（订阅订单，本地可模拟支付）

```prisma
model Order {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  plan        Plan
  amount      Decimal  @db.Decimal(12, 2)
  currency    String   @default("USD")
  status      String   @default("pending")   // pending | paid | failed | canceled
  provider    String   @default("simulate")  // simulate | stripe
  providerRef String?  @map("provider_ref")
  paidAt      DateTime? @map("paid_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, status])
  @@map("orders")
}
```

### 3.3 新增 `License` + `LicenseRedemption`（授权码）

```prisma
model License {
  id             String   @id @default(uuid()) @db.Uuid
  key            String   @unique
  plan           Plan
  maxActivations Int      @default(1) @map("max_activations")
  usedCount      Int      @default(0) @map("used_count")
  expiresAt      DateTime? @map("expires_at")
  createdAt      DateTime @default(now()) @map("created_at")
  redemptions    LicenseRedemption[]
  @@map("licenses")
}

model LicenseRedemption {
  id        String   @id @default(uuid()) @db.Uuid
  licenseId String   @map("license_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  license License @relation(fields: [licenseId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([licenseId, userId])
  @@map("license_redemptions")
}
```

> `Subscription` / `Entitlement` 表已存在（`schema.prisma`），本方案直接使用：支付确认或授权码激活时写 `subscriptions`（status=active、provider=simulate|license）并 upsert 用户 `entitlements`。

---

## 4. 权益模型（Entitlements）

### 4.1 套餐 → 功能/配额（单一事实源 `entitlements.ts`）

```ts
export type Plan = "free" | "pro" | "enterprise";
export const PLAN_LEVEL: Record<Plan, number> = { free: 0, pro: 1, enterprise: 2 };
export const PLAN_FEATURES: Record<Plan, { features: FeatureKey[]; quota: Record<QuotaKey, number> }> = {
  free:       { features: ["market","analysis","news","chat","alerts","watchlist"], quota: { chatPerDay: 10, watchlist: 5, alerts: 3 } },
  pro:        { features: [/*free…*/,"forecast","signals","smart-money","journal","tools","analysis-history","api-keys"], quota: { chatPerDay: 200, watchlist: 50, alerts: 50 } },
  enterprise: { features: [/*pro…*/,"api-keys","enterprise"], quota: { chatPerDay: 2000, watchlist: 500, alerts: 500 } },
};
```

### 4.2 强制校验

- `@RequirePlan("pro")` 装饰器 + `PlanGuard`：读 `request.user.id` → 查用户 plan → 低于要求抛 `403 FORBIDDEN`（含 `upgradeHint`）。
- 配额校验：`EntitlementsService.assertQuota(userId, key)` 在写操作前比较当前数量（如自选数量、激活告警数）。
- 应用于：`/journal/*`、`/tools/position-calculator`、`/smart-money/*`、`/analysis/:symbol/history`、`/enterprise/api-keys` POST（Pro+）、`/watchlist` POST（配额）、`/alerts` POST（配额）。

### 4.3 响应约定

```json
{ "data": null, "error": { "code": "FORBIDDEN", "message": "Pro 套餐才能使用该功能", "details": { "requiredPlan": "pro", "currentPlan": "free" } } }
```

前端 `ApiError.code === "FORBIDDEN"` 时展示升级引导，跳转 `/billing`。

---

## 5. API 设计

### 5.1 Auth（对齐响应结构）

| Method | Path | 说明 |
|--------|------|------|
| POST | `/auth/register` | 入参 `{email,password,displayName?}`；返回 `{accessToken,refreshToken,expiresIn,user}`（与 login 一致） |
| POST | `/auth/login` | 返回同上（增加 `user`） |
| POST | `/auth/refresh` | `{refreshToken}` → 新 token 对（旋转） |
| GET | `/auth/me` | 当前用户（含 plan/currency/colorScheme/notifications） |
| POST | `/auth/logout` | 吊销该用户全部 refresh token |
| GET | `/auth/oauth/:provider` | OAuth 跳转（占位保留，文档标注） |

### 5.2 User / Settings

| Method | Path | 说明 |
|--------|------|------|
| GET | `/user/profile` | 资料（无 passwordHash） |
| PATCH | `/user/profile` | `{displayName, locale, timezone}` |
| POST | `/user/password` | `{oldPassword,newPassword}`（校验旧密码） |
| GET | `/user/settings` | `{locale, timezone, currency, colorScheme, notifications}` |
| PATCH | `/user/settings` | 上述字段部分更新 |

### 5.3 Billing

| Method | Path | 说明 |
|--------|------|------|
| GET | `/billing/plans` | 套餐列表（公开） |
| GET | `/billing/entitlements` | 我的权益（plan/features/quota/used/subscription） |
| POST | `/billing/checkout` | `{plan}` → 创建 Order(pending) → `{orderId, checkoutUrl, amount}`；Stripe 配置后返回真实 Checkout Session URL |
| GET | `/billing/orders/:id` | 订单详情（本人） |
| POST | `/billing/orders/:id/confirm` | **本地模拟支付确认**：把 Order 置 paid → 激活套餐（写 subscription + entitlements + user.plan） |
| POST | `/billing/orders/:id/cancel` | 取消 pending 订单 |
| POST | `/billing/license/activate` | `{licenseKey}` → 校验授权码 → 激活套餐 |
| GET | `/billing/subscription` | 当前订阅信息（plan/status/periodEnd/provider） |
| GET | `/billing/portal` | 管理订阅：Stripe 配置后返回 Customer Portal，否则返回前端模拟管理 URL |
| POST | `/billing/webhook` | Stripe Webhook（仅生产，配置后启用） |

---

## 6. 前端设计

### 6.1 路由

| 路由 | 说明 | 布局 |
|------|------|------|
| `/login` | 登录页（邮箱+密码、OAuth 按钮、去注册） | 独立（无侧栏） |
| `/register` | 注册页（邮箱、密码×2、昵称） | 独立 |
| `/billing` | 套餐/当前套餐/升级/授权码激活/管理订阅 | App 布局（需登录） |
| `/billing/checkout?session=:orderId` | 订单确认（本地模拟支付） | App 布局（需登录） |
| `/settings` | 设置页（真实化） | App 布局（需登录） |

### 6.2 AuthProvider 调整

- `login/register` 统一消费 `{accessToken, refreshToken, user}`，`setUser(user)`。
- 挂载时：有 token → `GET /auth/me` 恢复用户；无 → 保持匿名。
- 暴露 `user`（id/email/displayName/plan）、`isAuthenticated`、`refreshProfile()`。
- 退出登录：调 `POST /auth/logout`（尽力而为）→ `tokenStore.clear()`。

### 6.3 鉴权与导航

- `RequireAuth` 组件包裹 `/settings`、`/billing`：未登录跳转 `/login?next=…`。
- Topbar/Sidebar：显示真实用户（昵称/邮箱）+ 套餐 Badge + 「登录/退出」；新增「套餐与授权」入口。
- 403/FORBIDDEN 处理：`ApiError.code==="FORBIDDEN"` → 设置页 API Key 区、billing 页展示升级引导。

### 6.4 设置页真实化（`features/settings/api.ts`）

- 保留 `featureIsMock("settings")` 开关（`NEXT_PUBLIC_MOCK=settings` 时仍可用 mock）。
- 真实模式：
  - `useSettings` → `GET /user/profile` + `GET /user/settings` + `GET /enterprise/api-keys`（API Key 仅 Pro+，403 时降级为「升级解锁」）。
  - `useUpdateSettings` → 按字段 PATCH `/user/profile`（displayName）与 `/user/settings`（currency/colorScheme/notifications）。
  - 改密码表单 → `POST /user/password`。
  - API Key → `POST /enterprise/api-keys`（创建时展示明文一次）/ `DELETE /enterprise/api-keys/:id`。

---

## 7. 安全与合规

- 密码 bcrypt(10)；JWT access 15min + refresh token 7d 旋转存储（`refresh_tokens`，退出即吊销）。
- 邮箱统一 `trim().toLowerCase()`；注册防重复（唯一索引）。
- 所有金额 Decimal；订单/授权码激活幂等（`@@unique([licenseId,userId])`、Order 状态机）。
- 门控**后端强制**（前端只是体验优化）；前端不依赖 `localStorage` 存敏感信息（仅 token）。
- 登录/注册加 Throttler（现有全局 100 req/min，对 auth 收敛到更严限制）。
- 免责声明：不承诺收益；AI 输出免责（沿用 MONETIZATION §9）。

---

## 8. 实施步骤（DoD）

### 后端
1. Prisma：User 扩展 + Order + License/LicenseRedemption → `db push` → `prisma generate`。
2. `auth`：统一 token 响应 + user；email 归一化；login 返回 user。
3. `user`：settings 读写（currency/colorScheme/notifications）；profile/password 完善。
4. `billing`：plans → checkout/order/confirm/license/subscription/portal/webhook + 模拟支付 + Stripe 可选。
5. `entitlements`：元数据 + `RequirePlan` 守卫 + 配额校验，接入 journal/tools/smart-money/analysis-history/api-keys/watchlist/alerts。
6. `seed`：demo 用户（含设置）、2 条演示授权码（Pro/Enterprise，打印到控制台）。
7. `.env.example`：补 `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`STRIPE_PRICE_*`/`BILLING_PROVIDER`。

### 前端
8. `/login`、`/register` 页；AuthProvider 对齐；Topbar/Sidebar 用户区。
9. `/billing`、`/billing/checkout`；`features/billing/api.ts` + 组件。
10. 设置页真实化 + 改密码 + API Key CRUD + 403 升级引导。

### 验证
11. 本地启动 API+Web：注册 → 登录 → /auth/me → 改设置 → free 配额 → 模拟支付升级 Pro → 授权码升级 Enterprise → 门控接口 200/403 → 前端页面流转。
12. `pnpm typecheck`、`pnpm lint`、web `vitest` 通过；文档同步（API_SPEC/API_CLIENT/MONETIZATION/todos）。

---

## 9. 环境变量（新增）

| 变量 | 默认 | 说明 |
|------|------|------|
| `BILLING_PROVIDER` | `simulate` | `simulate`（本地）\| `stripe`（生产） |
| `STRIPE_SECRET_KEY` | 空 | 配置后 checkout/portal 走 Stripe |
| `STRIPE_WEBHOOK_SECRET` | 空 | Webhook 签名校验 |
| `STRIPE_PRICE_PRO` / `STRIPE_PRICE_ENTERPRISE` | 空 | 价格 ID |
| `LICENSE_AUTO_GENERATE` | `false` | 开发期 true 时 seed 自动生成演示授权码 |

---

## 10. 风险与取舍

| 风险/取舍 | 对策 |
|-----------|------|
| 无 Stripe 账号导致无法真实收款 | 本地 `simulate` 通道保证流程闭环；生产切 `stripe` 只改 provider 分支 |
| 门控误伤现有演示页 | 仅对未接入前端的 Pro 端点强制；free 端点只做配额 |
| 设置页字段与 mock 结构差异 | 后端以 `/user/settings` 为准，前端映射到 `SettingsPageData`，保留 mock 开关 |
| OAuth 未真正实现（无凭据） | 本期保留占位与文档标注，Email+Password 为可用主路径 |
