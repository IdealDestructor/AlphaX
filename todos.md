# AlphaX Backend 启动待办事项

## 启动步骤记录

- [x] **依赖检查** — pnpm/node_modules 已安装，Node v22.14.0
- [x] **Docker Desktop 启动** — 启动 Docker 服务
- [x] **PostgreSQL 容器启动** — 使用 `apps/api/docker/docker-compose.yml` 启动 postgres:16-alpine
- [x] **Prisma Client 生成** — `pnpm db:generate` 成功
- [x] **数据库 Schema 推送** — `pnpm db:push` 成功，数据库已就绪
- [x] **后端 Dev Server 启动** — `pnpm dev` 在 http://localhost:4000/api/v1 运行

## 已注册的路由

| 模块 | 路由前缀 |
|---|---|
| Auth | `/api/v1/auth` |
| Market | `/api/v1/market` |
| Analysis | `/api/v1/analysis` |
| Signals | `/api/v1/signals` |
| Forecast | `/api/v1/forecast` |
| News | `/api/v1/news` |
| Alerts | `/api/v1/alerts` |
| Chat | `/api/v1/chat` |
| User | `/api/v1/user` |

## 当前缺失/待办

- [ ] Redis 容器未启动（redis:7-alpine 镜像下载超时，后续需要时再启动）
- [ ] 可能需要运行的 seed 数据：`pnpm db:seed`
- [ ] 前端 `apps/web` 的启动尚未验证
