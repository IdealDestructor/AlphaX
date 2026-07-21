# AlphaX Operations (OPS)

| 字段 | 值 |
|------|-----|
| Version | 2.0 |
| Scope | Docker · CI/CD · 监控 · 日志 · 安全 · 部署 |

---

## 1. 目标拓扑（MVP）

```
Internet
   │
Cloudflare (CDN / WAF / DNS)
   │
   ├─► Vercel：Next.js (web)
   │
   └─► Railway / Fly：
         ├─ NestJS API (+ WS)
         ├─ Python AI
         └─ Workers (BullMQ)
              │
         Managed PostgreSQL + Timescale
         Managed Redis
```

未来：Kubernetes（多区域、HPA、服务网格按需）。

---

## 2. Docker

### 2.1 本地 `docker-compose`（建议）

服务：

- `postgres`（启用 timescaledb / pgvector 镜像或扩展安装）  
- `redis`  
- 可选：`mailhog`、`minio`  

```yaml
# docker/docker-compose.yml（示意）
services:
  postgres:
    image: timescale/timescaledb-ha:pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_PASSWORD: alphax
      POSTGRES_DB: alphax
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### 2.2 应用镜像

| 镜像 | 说明 |
|------|------|
| `alphax-web` | Next.js standalone 输出 |
| `alphax-api` | NestJS dist + Node |
| `alphax-ai` | Python slim + uvicorn |
| `alphax-worker` | 与 api 同仓不同 command |

原则：

- 多阶段构建  
- 非 root 用户  
- 只含生产依赖  
- 健康检查：`/health` / `/ready`  

---

## 3. CI/CD

### 3.1 GitHub Actions 流水线（建议）

**PR：**

1. `pnpm lint` + `typecheck`  
2. `unit/integration tests`  
3. `ai pytest`（若变更 prompts/agents）  
4. OpenAPI diff（破坏性变更失败或警告）  
5. build web/api  

**main / release：**

1. 同上  
2. 构建并推送镜像  
3. 迁移 Job（expand 兼容）  
4. 部署 staging → smoke  
5. 部署 production（手动 approval）  

### 3.2 环境

| Env | 用途 |
|-----|------|
| `development` | 本地 |
| `staging` | 预发，接沙箱 Stripe / 模拟行情 |
| `production` | 正式 |

密钥：GitHub Environments Secrets + 运行时 Secret Manager。

---

## 4. 部署流程

1. 合并 PR  
2. 镜像打 tag：`api-vX.Y.Z`  
3. DB migrate（先 expand）  
4. 滚动发布 API → AI → Worker → Web  
5. 冒烟：健康检查、登录、行情 WS、分析拉取  
6. 异常：回滚镜像；DB 仅在有经过验证的 downgrade 时回滚  

**前端：** Vercel Preview 对每个 PR；生产绑定 `main`。

---

## 5. 监控与告警

### 5.1 Metrics

| 指标 | 告警建议 |
|------|----------|
| API P95 延迟 | > 500ms 持续 5m |
| 5xx 率 | > 1% |
| WS 连接数 / 断开率 | 异常尖峰 |
| BullMQ 积压 | > 阈值 |
| AI 延迟 / 错误率 | 超时率升高 |
| 行情最后更新时间 | > 30–60s 无 tick |
| Redis / DB CPU | 饱和 |

工具建议：OpenTelemetry + Grafana Cloud / Datadog / Prometheus 任选。

### 5.2 探活

- `GET /health`：进程活着  
- `GET /ready`：DB + Redis 可连  

---

## 6. 日志

- 结构化 JSON：`timestamp`, `level`, `service`, `request_id`, `user_id?`, `msg`  
- Nest ↔ Python 传递 `x-request-id`  
- 禁止记录：密码、完整 JWT、API Key 明文、卡片号  
- AI：记录 prompt **版本号**与 token 用量，不默认落全部原文到长期存储（合规配置）  

日志后端：Axiom / Loki / CloudWatch 等。

---

## 7. 安全

| 控制 | 做法 |
|------|------|
| 传输 | 强制 HTTPS / WSS |
| WAF | Cloudflare 基础规则 + 速率限制 |
| 鉴权 | JWT 短效；Refresh 旋转；API Key 哈希 |
| 密钥 | 环境密钥；轮换；仓库扫 secret |
| 依赖 | Dependabot / Renovate；严重 CVE 限时修 |
| 供应链 | 锁文件；CI 不可变构建 |
| 数据 | 备份加密；最小权限 IAM |
| 应用 | Zod 校验；CORS 白名单；Helmet |
| 金融合规 | 免责声明；审计日志；管理员操作留痕 |
| 隐私 | 用户导出/删除流程（后续 GDPR 等按需） |

**事故响应：** 吊销密钥 → 轮换 JWT secret（谨慎）→ 公告 → 复盘。

---

## 8. 备份与恢复

| 数据 | 策略 |
|------|------|
| PostgreSQL | 日快照 + PITR |
| Timescale | 按 hypertable 保留；关键聚合长期留 |
| Redis | 可重建（缓存）；队列需持久化或可重放 |
| 对象存储（若有） | 版本化 |

每季度做一次 **恢复演练**。

---

## 9. 成本控制

- AI 分析缓存与合并触发  
- 非 Pro 延迟行情降低数据成本  
- Worker 按队列扩缩  
- 日志采样与保留周期  

---

## 10. Runbooks（摘要）

### 行情中断

1. 检查 ingest worker 与上游状态  
2. 前端 Banner「Market data delayed」  
3. 暂停依赖新鲜数据的 Decision Job  

### AI 超时飙升

1. 切 canary Prompt / 降模型档  
2. 扩大缓存 TTL  
3. 返回 stale analysis  

### 支付 Webhook 失败

1. Stripe Dashboard 重放  
2. 核对签名密钥  
3. 手动对齐 `subscriptions`  

---

## 11. 检查清单（上线日）

- [ ] 环境变量齐全且无串环境  
- [ ] migrate 成功  
- [ ] `/ready` 三服务通过  
- [ ] WS 行情与分析推送  
- [ ] Stripe 测试→生产 webhook  
- [ ] 监控面板与 pager 值班人  
- [ ] 免责声明与隐私链接可访问  

---

## Related

- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)
- [MONETIZATION.md](./MONETIZATION.md)
