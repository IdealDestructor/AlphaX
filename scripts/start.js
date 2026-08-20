#!/usr/bin/env node
/**
 * AlphaX 一键启动（跨平台核心，Node 22+）
 *
 * 用法:  npm start [--seed] [--skip-db] [--no-docker] [--no-install]
 *        node scripts/start.js [--help]
 *
 * 流程: 环境检查 → .env 确认 → 依赖安装（如需）→ docker compose up -d
 *       （PostgreSQL + Redis，等 healthy）→ prisma generate/db push
 *       （--seed 时执行 seed）→ pnpm dev 启动前后端（web :3000 / api :4000）。
 */
'use strict';

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const COMPOSE_FILE = path.join('apps', 'api', 'docker', 'docker-compose.yml');
const ENV_FILE = path.join('apps', 'api', '.env');
const ENV_EXAMPLE = path.join('apps', 'api', '.env.example');
const POSTGRES_CONTAINER = 'alphax-postgres';
const REDIS_CONTAINER = 'alphax-redis';

// Windows 上 pnpm 是 .cmd shim，spawn 需 shell:true 才能解析；
// 其它命令在 cmd 下执行也无副作用，统一开启以简化处理。
const IS_WIN = process.platform === 'win32';
const PNPM = 'pnpm';

// ---------- 参数解析（兼容 --seed / -Seed / --seed=true 等写法） ----------
const flags = new Set(
  process.argv.slice(2).map((a) => a.replace(/^--?/, '').toLowerCase().split('=')[0]),
);
const SEED = flags.has('seed');
const SKIP_DB = flags.has('skip-db') || flags.has('skipdb');
const NO_DOCKER = flags.has('no-docker') || flags.has('nodocker');
const NO_INSTALL = flags.has('no-install') || flags.has('noinstall');

const step = (msg) => console.log(`\n==> ${msg}`);
const ok = (msg) => console.log(`  [OK] ${msg}`);
const warn = (msg) => console.log(`  [!!] ${msg}`);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function usage() {
  console.log(`AlphaX 一键启动

用法:
  npm start                默认：Docker up + 数据库初始化 + 前后端 dev
  npm start -- --seed      额外执行 db:seed（写入演示数据，首次可用）
  npm start -- --skip-db   跳过数据库初始化（数据库已就绪时）
  npm start -- --no-docker 跳过 Docker 启动（外部已提供数据库）
  npm start -- --no-install 跳过依赖安装检查

等价入口（均委托本脚本）:
  .\\start.ps1 [-Seed] [-SkipDb] [-NoDocker] [-NoInstall]   # Windows
  ./start.sh [--seed] [--skip-db] [--no-docker] [--no-install]  # Linux/macOS/Git Bash`);
}

if (flags.has('help') || flags.has('h')) {
  usage();
  process.exit(0);
}

function opts(extra = {}) {
  return IS_WIN ? { shell: true, ...extra } : extra;
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, opts({ stdio: 'inherit', cwd: ROOT }));
  return r.status ?? 1;
}

function execOut(cmd, args) {
  const r = spawnSync(cmd, args, opts({ encoding: 'utf8', cwd: ROOT }));
  if (r.status !== 0) return '';
  return r.stdout.trim();
}

function which(cmd) {
  return execOut(cmd, ['--version']) !== '';
}

function dockerHealth(container) {
  const r = spawnSync(
    'docker',
    ['inspect', '--format', '{{.State.Health.Status}}', container],
    opts({ encoding: 'utf8', cwd: ROOT }),
  );
  if (r.status !== 0) return '';
  return r.stdout.trim();
}

function waitForHealthy(container, label, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  let health = '';
  while (Date.now() < deadline) {
    health = dockerHealth(container);
    if (health === 'healthy') break;
    sleep(2000);
  }
  if (health !== 'healthy') {
    throw new Error(`${label} 未在 ${Math.round(timeoutMs / 60000)} 分钟内就绪，请检查: docker ps / docker logs ${container}`);
  }
  return health;
}

function main() {
  step('AlphaX 一键启动');
  console.log(`  工作目录: ${ROOT}`);

  // ---------- 1. 环境检查 ----------
  step('1/5 环境检查 (node / pnpm / docker)');
  if (!which('node')) throw new Error('未找到 node，请先安装 Node.js 22+');
  if (!which(PNPM)) throw new Error('未找到 pnpm，请执行: corepack enable 或 npm i -g pnpm');
  if (!which('docker')) throw new Error('未找到 docker，请先启动 Docker Desktop / Docker');
  const nodeVer = execOut('node', ['-v']);
  const major = parseInt((nodeVer || '').replace(/^v/, ''), 10) || 0;
  if (major && major < 22) warn(`Node 版本过低: ${nodeVer}（建议 >=22）`);
  ok(`node ${nodeVer} · pnpm ${execOut(PNPM, ['-v'])}`);

  // ---------- 2. 环境变量 ----------
  step('2/5 环境变量');
  if (!fs.existsSync(ENV_FILE)) {
    if (fs.existsSync(ENV_EXAMPLE)) {
      fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
      warn(`已从 .env.example 复制 ${ENV_FILE}，请检查 DATABASE_URL / JWT_SECRET / 数据源 Key`);
    } else {
      warn(`缺少 ${ENV_FILE} 且无 .env.example，继续执行（数据库连接可能失败）`);
    }
  } else {
    ok(`${ENV_FILE} 已存在`);
  }

  // ---------- 3. 依赖安装 ----------
  step('3/5 依赖检查');
  if (!NO_INSTALL && !fs.existsSync(path.join(ROOT, 'node_modules'))) {
    console.log('  node_modules 不存在，执行 pnpm install ...');
    if (run(PNPM, ['install']) !== 0) throw new Error('pnpm install 失败');
  } else {
    ok('依赖已就绪（跳过安装）');
  }

  // ---------- 4. Docker 服务 ----------
  if (NO_DOCKER) {
    ok('跳过 Docker 启动 (--no-docker)');
  } else {
    step('4/5 启动 Docker 服务 (PostgreSQL + Redis)');
    console.log(`  docker compose -f ${COMPOSE_FILE} up -d`);
    if (run('docker', ['compose', '-f', COMPOSE_FILE, 'up', '-d']) !== 0) {
      throw new Error('docker compose up 失败，请检查 Docker 是否已启动');
    }
    console.log('  等待 PostgreSQL 就绪 ...');
    waitForHealthy(POSTGRES_CONTAINER, 'PostgreSQL');
    ok('PostgreSQL healthy (localhost:5433)');
    const redisHealth = dockerHealth(REDIS_CONTAINER);
    if (redisHealth === 'healthy') ok('Redis healthy (localhost:6379)');
    else warn('Redis 未就绪（当前后端暂不依赖，可稍后手动 docker compose up）');
  }

  // ---------- 5. 数据库初始化 ----------
  if (SKIP_DB) {
    ok('跳过数据库初始化 (--skip-db)');
  } else {
    step('5/5 数据库初始化 (prisma generate / db push)');
    if (run(PNPM, ['--filter', '@alphax/api', 'db:generate']) !== 0) throw new Error('prisma generate 失败');
    if (run(PNPM, ['--filter', '@alphax/api', 'db:push']) !== 0) throw new Error('prisma db push 失败');
    if (SEED) {
      console.log('  执行 db:seed ...');
      if (run(PNPM, ['--filter', '@alphax/api', 'db:seed']) !== 0) throw new Error('prisma db:seed 失败');
      ok('Seed 完成');
    }
  }

  // ---------- 6. 启动前后端 ----------
  step('启动前后端 (pnpm dev → web :3000 / api :4000)');
  console.log('  Demo 用户: demo@alphax.com / demo123456');
  console.log('  浏览器打开 http://localhost:3000 ，Ctrl+C 停止');
  const child = spawn(PNPM, ['dev'], opts({ stdio: 'inherit', cwd: ROOT }));
  child.on('exit', (code) => process.exit(code ?? 0));
}

try {
  main();
} catch (err) {
  console.error(`\n[错误] ${err.message}`);
  process.exit(1);
}