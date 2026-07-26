# AlphaX Development Guide

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Audience | 人类开发者 + AI 编码助手 |

---

## 1. 前置要求

| 工具 | 版本建议 |
|------|----------|
| Node.js | 22 LTS |
| pnpm | 9+ |
| Python | 3.11+ |
| Docker | 24+ |
| PostgreSQL | 16+（含 Timescale / pgvector 扩展） |
| Redis | 7+ |

可选：`direnv` / `1Password` 管理密钥。

---

## 2. 仓库结构

见 [CODING_RULES.md](./CODING_RULES.md) §2。当前阶段可能仅有文档；脚手架落地后按该结构创建 `apps/` 与 `packages/`。

---

## 3. 本地启动（目标流程）

```bash
# 1. 依赖
pnpm install
python -m venv apps/ai/.venv
source apps/ai/.venv/bin/activate
pip install -r apps/ai/requirements.txt

# 2. 环境变量
cp .env.example .env
# 填写 DATABASE_URL / REDIS_URL / JWT_SECRET / OPENAI_API_KEY 等

# 3. 基础设施
docker compose -f docker/docker-compose.yml up -d

# 4. 迁移
pnpm --filter api prisma migrate dev
# 或对应迁移命令

# 5. 开发
pnpm dev
# web :3000  api :4000  ai :8000
```

---

## 4. 环境变量（分类）

| 类别 | 示例 | 备注 |
|------|------|------|
| DB | `DATABASE_URL` | OLTP |
| TS | `TIMESCALE_URL` | 可与 DB 同实例不同 schema |
| Redis | `REDIS_URL` | |
| Auth | `JWT_SECRET`, `GOOGLE_CLIENT_ID` | |
| AI | `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | 服务端 only |
| Billing | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | |
| Public | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` | |
| Dev | `NEXT_PUBLIC_MOCK` | Mock 开关（见 [API_CLIENT.md](./API_CLIENT.md)）|

禁止把服务端密钥放入 `NEXT_PUBLIC_*`。

---

## 5. 前端 API 对接

前端通过 `src/lib/api/client.ts` 统一调用后端 NestJS API。

**核心规则：**
- 每个 feature 的 `api.ts` 使用 `featureIsMock()` 判断走 mock 还是真实 API
- 环境变量 `NEXT_PUBLIC_MOCK=1` 全局 mock，`NEXT_PUBLIC_MOCK=market` 局部 mock
- 真实 API 走 `apiClient`（自动注入 JWT、401 刷新、超时控制）
- API 响应格式遵循 `{ data, meta, error }` 包络约定

详见 [API_CLIENT.md](./API_CLIENT.md)。

---

## 6. 日常开发工作流

1. 从 `main` 拉功能分支：`feat/analysis-card`  
2. 先写/更新 Zod schema（`packages/schemas`）  
3. API Service → 前端 feature → UI（遵循 UI_UX_SPEC）  
4. 本地自测 + unit  
5. PR：描述为什么、如何验证、权限影响  

---

## 7. 测试命令（约定）

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e

# AI
cd apps/ai && pytest
python -m tools.eval_prompts
```

---

## 8. 调试技巧

| 问题 | 建议 |
|------|------|
| WS 连不上 | 查 token、CORS、代理；看 `ops` 日志 request_id |
| AI 慢 | 看缓存是否命中；Agent 超时配置 |
| 分析结果怪 | 核对 features 快照与 Prompt 版本 |
| 权限错 | 对照 PRD 权限矩阵与 entitlements |

---

## 9. 文档优先开发顺序

新功能建议：

1. 更新 PRD / ROADMAP（若范围变化）  
2. API_SPEC 补端点  
3. DATABASE 补表/索引  
4. 实现  
5. 若涉及选型，补 ADR  

---

## 10. 代码生成（AI）提示词模板

```
在 AlphaX 中实现 <功能>。
遵守 CODING_RULES 与 UI_UX_SPEC。
相关文档：PRD 权限、API_SPEC、DATABASE。
最小改动；补 Zod；Pro/Free 门控；不要改无关文件。
```

---

## 11. 发布前检查

- [ ] migration 可回放  
- [ ] OpenAPI / 客户端类型已更新  
- [ ] Feature Flag / plan 门控  
- [ ] 免责声明仍在 AI 表面  
- [ ] 监控指标与错误告警  
- [ ] `.env.example` 已同步  

运维细节见 [OPS.md](./OPS.md)。

---

## Related

- [CODING_RULES.md](./CODING_RULES.md)
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- [OPS.md](./OPS.md)
- [API_CLIENT.md](./API_CLIENT.md) — 前端 API 客户端实现
