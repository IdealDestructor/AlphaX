<#
.SYNOPSIS
  AlphaX 一键启动（Windows 包装脚本）→ 委托给 scripts/start.js（跨平台核心逻辑）。

.DESCRIPTION
  用法（在仓库根目录执行）:
    .\start.ps1               # 默认：Docker up + 数据库初始化 + 前后端 dev
    .\start.ps1 -Seed         # 额外执行 db:seed（写入演示数据）
    .\start.ps1 -SkipDb       # 跳过数据库初始化
    .\start.ps1 -NoDocker     # 跳过 Docker 启动
    .\start.ps1 -NoInstall    # 跳过依赖安装检查

.PARAMETER Seed
  数据库初始化后执行 prisma seed（写入演示数据，可重复运行）。
.PARAMETER SkipDb
  跳过 prisma generate / db push。
.PARAMETER NoDocker
  不执行 docker compose up。
.PARAMETER NoInstall
  不检查 / 安装 node_modules。
#>
[CmdletBinding()]
param(
  [switch]$Seed,
  [switch]$SkipDb,
  [switch]$NoDocker,
  [switch]$NoInstall
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$argsList = @()
if ($Seed)      { $argsList += '--seed' }
if ($SkipDb)    { $argsList += '--skip-db' }
if ($NoDocker)  { $argsList += '--no-docker' }
if ($NoInstall) { $argsList += '--no-install' }

node (Join-Path $root 'scripts/start.js') @argsList
exit $LASTEXITCODE