# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目是什么

**nav-hub** 是极简卡片式浏览器起始页（「iTab 新标签页」）。**Go 服务**提供静态 SPA、`/api` 与 SQLite 持久化：**访客只读**，**管理员**登录后可编辑分类、快捷方式与全局设置。

## 常用命令

| 命令 | 作用 |
|------|------|
| `make dev-api` | 本地 Go API（`:8080`，需已 `go build` 或 `go run ./cmd/nav-hub`） |
| `make dev-web` | `web/` 下 Vite 开发（代理 `/api` → 8080） |
| `make build-web` | 构建前端并复制到 `internal/static/dist/`（Docker / Vercel 部署会自动做） |
| `make build` | 构建 web + `bin/nav-hub` |
| `make docker` | 本地 Docker 镜像 |
| `cd web && pnpm lint` | Oxlint |

生产默认管理员由环境变量初始化：`ADMIN_USER` / `ADMIN_PASSWORD`（仅库中无用户时写入）。`SESSION_SECRET`、`DATABASE_DSN`（默认 `file:/data/app.db?...`）。

## 目录结构

- `web/` — React + Vite 前端（原根目录前端已迁入）
- `cmd/nav-hub/` — Go 入口
- `internal/store` — SQLite 与配置读写
- `internal/auth` — Cookie Session
- `internal/seed` — `seed.json` 首次灌库
- `internal/static/dist/` — go:embed 目录（仓库仅占位 index.html；完整 SPA 由 `make build-web` / Docker / Vercel 生成，不提交）
- `Dockerfile` / `docker-compose.yml` — 单镜像部署
- `.github/workflows/docker-ghcr.yml` — 推送到 GHCR（BuildKit GHA cache）

## 架构

- 公开：`GET /api/public/config` → `{ categories, shortcuts, settings }`
- 鉴权：`GET /api/auth/me`，`POST /api/auth/login|logout`
- 管理：`PUT /api/admin/config`（整包 JSON，与前端导出格式一致）
- 前端 `web/src/utils/api.js`；状态仍在 `App.jsx`，管理员改数据后 debounce 写回 API

## 子代理协作

见 `~/.claude/rules/multi-agent-protocol.md`。

## 注意点

- 自定义快捷方式图标注意体积（约 200KB 上限，见 `EditShortcutModal`）
- 分类 `code === 'common'` 不可删；实体主键为数字 `id`
- 默认壁纸为 Unsplash 外链