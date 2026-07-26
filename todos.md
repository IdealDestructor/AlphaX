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

## 已完成改进 (2026-07-26)

### 数据层修复
- [x] **News Service 重构** — 从内存生成改为 Prisma DB 查询，支持按 symbol 过滤和分页
- [x] **Analysis Service 持久化** — `generateAndSave()` 现在将分析结果保存到数据库
- [x] **Forecast Service 持久化** — `generateAndSave()` 现在将预测结果保存到数据库

### 新模块
- [x] **Journal 模块** — 完整的 CRUD + 统计数据 (`/api/v1/journal`)
- [x] **Tools 模块** — Position Calculator (`/api/v1/tools/position-calculator`)

### Seed 数据增强
- [x] 15 条新闻、8 个信号、6 条 AI 分析、5 条预测、4 条日志、4 个自选
- [x] Demo 用户: `demo@alphax.com` / `demo123456`

### 路由总览

| 模块 | 路由前缀 | 状态 |
|------|---------|------|
| Auth | `/api/v1/auth` | ✅ |
| Market | `/api/v1/market` | ✅ |
| Analysis | `/api/v1/analysis` | ✅ (DB 持久化) |
| Signals | `/api/v1/signals` | ✅ (DB 读取) |
| Forecast | `/api/v1/forecast` | ✅ (DB 持久化) |
| News | `/api/v1/news` | ✅ (DB 查询) |
| Alerts | `/api/v1/alerts` | ✅ |
| Chat | `/api/v1/chat` | ✅ |
| User | `/api/v1/user` | ✅ |
| Dashboard | `/api/v1/dashboard` | ✅ |
| Journal | `/api/v1/journal` | ✅ (新增) |
| Tools | `/api/v1/tools` | ✅ (新增) |

## 当前缺失/待办

- [ ] Redis 容器未启动（redis:7-alpine 镜像下载超时，后续需要时再启动）
- [ ] 前端 `apps/web` 的启动尚未验证
- [ ] Python AI 服务尚未实现
