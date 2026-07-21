# AlphaX Coding Rules

> 给 **Cursor / Claude Code / Codex** 与人类开发者的强制约束。  
> 生成或修改代码前必须遵守本文；与本文冲突时以本文为准。

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Stack | Next.js App Router · NestJS · Python AI · TS Strict · Tailwind · shadcn/ui |

---

## 1. 绝对规则（Do / Don't）

### Do

- TypeScript **Strict Mode**
- Next.js **App Router**（不用 Pages Router）
- **Server Components 优先**；仅在需要交互/浏览器 API 时加 `"use client"`
- UI：**TailwindCSS + shadcn/ui**
- 客户端数据：**TanStack Query（React Query）**
- 实时行情：**WebSocket**（禁止轮询刷行情）
- 所有外部输入：**Zod** 校验（前端 form、API DTO、WS payload、AI JSON）
- NestJS：**业务逻辑只写在 Service 层**；Controller 只做鉴权/校验/调用
- **所有 AI Prompt 集中管理**（见 [PROMPTS.md](./PROMPTS.md)）
- ESLint + Prettier + Husky（commit 前 lint/format）
- **Feature-first** 目录结构
- 组件与页面：**可维护命名**；复杂逻辑写清注释「为什么」

### Don't

- 不要用 `any`（必要用 `unknown` + 收窄）
- 不要在组件里塞复杂业务编排（抽 hooks / services）
- 不要在 Client Component 默认化整页
- 不要把密钥写入仓库或客户端 bundle
- 不要在 AI 回答里承诺收益
- 不要为了「好看」引入与 [UI_UX_SPEC.md](./UI_UX_SPEC.md) 冲突的随机风格
- 不要提交 `console.log` 调试残留（用结构化 logger）
- 不要写 exploit / 攻击脚本

---

## 2. Monorepo 目录规范（目标结构）

```
AlphaX/
  apps/
    web/                 # Next.js
    api/                 # NestJS
    ai/                  # Python AI service
  packages/
    ui/                  # 共享 UI（可选）
    schemas/             # 共享 Zod / OpenAPI types
    config/              # eslint/tsconfig/tailwind presets
  db/
    migrations/
    timeseries/
  docs/                   # 项目文档（README 除外）
  docker/
  .github/workflows/
```

### 2.1 Frontend Feature-First

```
apps/web/src/
  app/                      # routes only
    (marketing)/
    (app)/
      dashboard/page.tsx
      market/[symbol]/page.tsx
      chat/page.tsx
  features/
    analysis/
      components/
      hooks/
      api.ts
      schema.ts
    market/
    chat/
    alerts/
    billing/
  components/               # 真正通用的裸组件
    layout/
    charts/
  lib/
    ws/
    query/
    auth/
  styles/
```

### 2.2 NestJS

```
apps/api/src/
  modules/
    market/
      market.controller.ts
      market.service.ts
      market.module.ts
      dto/
    analysis/
    chat/
    alerts/
    auth/
    users/
  common/
    guards/
    filters/
    pipes/
    interceptors/
  config/
```

### 2.3 Python AI

```
apps/ai/
  app/
    main.py
    api/
    agents/
    rag/
    fusion/
  prompts/          # 唯一 Prompt 源
  tests/
```

---

## 3. TypeScript 规范

```json
// 关键要求
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true
}
```

- 共享类型放在 `packages/schemas`，前后端/AI JSON 对齐
- API 响应类型从 Zod `z.infer<>` 推导，避免手写重复 interface
- 禁止 `enum` 滥用；优先 `as const` + Zod enum

---

## 4. React / Next.js 规范

| 场景 | 做法 |
|------|------|
| 首屏 Dashboard | RSC + 流式；图表/WS 客户端岛 |
| 表单 | Zod + React Hook Form（或等价） |
| 服务端突变 | Server Actions **或** 调用 Nest API（团队统一一种主路径） |
| 环境变量 | `NEXT_PUBLIC_*` 仅公开配置 |
| 样式 | Tailwind token；遵循 UI_UX_SPEC 的 CSS 变量 |
| 动画 | Framer Motion；克制，见 UI 规范 |

**命名：**

- 组件：`PascalCase` → `AiAnalysisCard.tsx`
- hooks：`useAiAnalysis.ts`
- 工具：`camelCase`
- 常量：`SCREAMING_SNAKE` 或 `as const` 对象

**注释：**

```tsx
// 为什么：Pro 用户才能看 entry；与 PRD 权限矩阵一致
if (plan === "free") sanitizeAnalysis(data);
```

---

## 5. NestJS 规范

- DTO：`class-validator` **或** Zod（二选一，推荐 Zod pipe 与前端共享 schema）
- 鉴权：Guard；配额：Interceptor / Guard
- 错误：统一异常过滤器 → API_SPEC 错误包络
- 数据库访问：Repository / Prisma Client 仅在 Service 或 Infrastructure 层
- 禁止 Controller 直接写 SQL

---

## 6. 数据与实时

- 行情更新：WS 推送 → Query Client `setQueryData` 或专用 store
- REST 负责历史与首屏；WS 负责增量
- AI 分析：REST 拉最新 + 订阅 `ai.analysis.{symbol}`

---

## 7. AI 集成规范

- Nest 只做：鉴权、配额、调用 AI、缓存、落库
- 融合逻辑在 Python AI Service
- Prompt 变更走 [PROMPTS.md](./PROMPTS.md) 版本流程
- 所有模型输出必须 schema validate

---

## 8. 测试

| 层级 | 要求 |
|------|------|
| Unit | schemas、fusion 权重、权限矩阵纯函数 |
| Integration | API 模块 + 测试库 |
| Component | 关键卡片（Analysis / Chat） |
| E2E | 登录 → 首页 → Chat 冒烟（Playwright） |
| AI | Prompt golden cases |

覆盖率目标（MVP）：关键路径有测试即可，不追求虚高 %。

---

## 9. Lint / Format / Git Hooks

- ESLint：`typescript-eslint` + Next + import order
- Prettier：统一格式
- Husky + lint-staged：`*.{ts,tsx}` → eslint --fix + prettier
- CI：typecheck + lint + test + build

---

## 10. Commit 规范

采用 **Conventional Commits**：

```
feat(analysis): add evidence chain on dashboard card
fix(ws): reconnect with exponential backoff
docs(prd): clarify pro permission matrix
refactor(api): move quota check into guard
chore(ci): add openapi diff check
test(fusion): cover macro-market conflict → wait
```

规则：

- 主题行 ≤ 72 字符
- 正文解释 **为什么**
- 一 commit 一件事
- 禁止 secrets

---

## 11. AI 编码助手专用指令

当在 Cursor / Claude Code / Codex 中工作时：

1. 先读相关 `*.md` 与现有代码风格，再改代码  
2. **最小改动**：不做无关重构  
3. 新 UI 必须符合 [UI_UX_SPEC.md](./UI_UX_SPEC.md)（深色、Geist、卡片规范）  
4. 新接口必须补 Zod schema + 错误码  
5. 新功能检查 [PRD.md](./PRD.md) 权限矩阵  
6. 不要主动创建 git commit / PR，除非用户明确要求  
7. 回答用户时用中文（若用户规则要求）  

**推荐 Cursor Rule 摘要（可写入 `.cursor/rules`）：**

```
AlphaX: App Router, Strict TS, Tailwind+shadcn, RSC first,
TanStack Query, Zod everywhere, Nest services for business logic,
Prompts only in apps/ai/prompts, follow UI_UX_SPEC dark theme.
```

---

## 12. Code Review Checklist

- [ ] 权限 / plan 门控正确  
- [ ] Zod 覆盖输入输出  
- [ ] 无密钥泄漏  
- [ ] WS/REST 职责清晰  
- [ ] AI 输出可解释且有免责  
- [ ] 移动端可用  
- [ ] 有必要测试或说明为何不测  

---

## Related

- [UI_UX_SPEC.md](./UI_UX_SPEC.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [API_SPEC.md](./API_SPEC.md)
- [PROMPTS.md](./PROMPTS.md)
