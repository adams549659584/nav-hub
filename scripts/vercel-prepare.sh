#!/usr/bin/env bash
# Vercel 部署前：构建 web 并写入 internal/static/dist，供 @vercel/go 的 go:embed 使用。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export CI=true
export PNPM_CONFIG_MINIMUM_RELEASE_AGE=0

echo "==> install & build frontend (web/)"
cd web
if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@9.15.9 --activate 2>/dev/null || true
fi
if command -v pnpm >/dev/null 2>&1; then
  pnpm install --frozen-lockfile
  pnpm build
else
  npm install -g pnpm@9.15.9
  pnpm install --frozen-lockfile
  pnpm build
fi
cd "$ROOT"

echo "==> sync to internal/static/dist for go:embed"
rm -rf internal/static/dist/*
mkdir -p internal/static/dist
cp -R web/dist/. internal/static/dist/

test -f internal/static/dist/index.html
ls internal/static/dist/assets/*.js >/dev/null
ls internal/static/dist/assets/*.css >/dev/null

echo "==> frontend embed ready"
