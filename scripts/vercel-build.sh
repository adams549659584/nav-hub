#!/usr/bin/env bash
# Vercel zero-config 构建：先编前端写入 go:embed，再编译 Go 服务。
# 注意：vercel.json 里若使用 legacy "builds"，本脚本不会被执行。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CI=true
export PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
export CGO_ENABLED=0

echo "==> [1/2] build frontend → internal/static/dist"
cd web
if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.15.9 --activate 2>/dev/null || true
fi
if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm@9.15.9
fi
pnpm install --frozen-lockfile
pnpm build
cd "$ROOT"

rm -rf internal/static/dist/*
mkdir -p internal/static/dist
cp -R web/dist/. internal/static/dist/
test -f internal/static/dist/index.html
ls internal/static/dist/assets/*.js >/dev/null
ls internal/static/dist/assets/*.css >/dev/null
echo "    frontend embed ready"

echo "==> [2/2] go build"
mkdir -p bin
OUT="bin/nav-hub"
if [ -n "${VERCEL_OUTPUT_FILE:-}" ]; then
  OUT="$VERCEL_OUTPUT_FILE"
fi
# 入口必须是 cmd/server（Vercel 预设探测路径）；与本地 ./cmd/nav-hub 共用 server.ListenAndServe
go build -trimpath -ldflags="-s -w" -o "$OUT" ./cmd/server
echo "    binary: $OUT"
