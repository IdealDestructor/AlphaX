#!/usr/bin/env bash
# AlphaX 一键启动（Linux / macOS / Git Bash 包装脚本）→ 委托给 scripts/start.js
# 用法: ./start.sh [--seed] [--skip-db] [--no-docker] [--no-install]
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
exec node scripts/start.js "$@"