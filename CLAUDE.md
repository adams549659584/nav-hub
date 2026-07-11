# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目是什么

**nav-hub** 是极简卡片式浏览器起始页（「iTab 新标签页」）。**Go 服务**提供静态 SPA、`/api` 与 SQLite 持久化：**访客只读**，**管理员** Session 登录后可编辑分类、快捷方式与全局设置。

技术栈概要：前端 React 19 + Vite + lucide-react；后端 Go 1.22+ / chi / bcrypt Session；存储 pure-Go SQLite（`modernc.org/sqlite`）。

## 常用命令

| 命令 | 作用 |
|------|------|
| `make dev-api` | 本地 Go API（`:8080`，`go run ./cmd/nav-hub`） |
| `make dev-web` | `web/` 下 Vite 开发（代理 `/api` → 8080） |
| `make build-web` | 构建前端并复制到 `internal/static/dist/`（Docker / Vercel 部署会自动做） |
| `make build` | 构建 web + `bin/nav-hub` |
| `make docker` | 本地 Docker 镜像 `nav-hub:local` |
| `cd web && pnpm lint` | Oxlint |

开发请开两个终端：`make dev-api` + `make dev-web`，浏览器用 Vite 地址（`:5173`）。

### 环境变量

| 变量 | 说明 |
|------|------|
| `ADMIN_USER` / `ADMIN_PASSWORD` | 仅库中尚无管理员时写入；之后请设置页改密 |
| `SESSION_SECRET` | Session 签名密钥，生产务必修改 |
| `DATABASE_DSN` | 本地默认 `file:./data/app.db?...`；Docker 为 `file:/data/app.db?...`；Vercel / 无盘环境为 `/tmp`（**不持久**） |
| `PORT` / `ADDR` | 监听端口；容器统一 `8080` |

## 目录结构

- `web/` — React + Vite 前端
- `cmd/nav-hub/` — 唯一 Go 入口（本地 / Docker / Vercel 镜像）
- `server/` — HTTP 路由与 API（勿塞进 `internal`，供镜像外复用）
- `internal/store` — SQLite、schema 迁移、配置读写
- `internal/auth` — Cookie Session
- `internal/seed` — `seed.json` 首次灌库
- `internal/favicon` — 站点图标抓取（`GET /api/public/favicon`）
- `internal/wallpaper` — 壁纸库代理（sources / list / download）
- `internal/static/dist/` — go:embed（仓库仅占位；`make build-web` / Docker 生成完整 SPA）
- `Dockerfile` / `docker-compose.yml` — 自托管单镜像
- `Dockerfile.vercel` — Vercel 容器部署（镜像内编前端，Fluid compute）
- `.github/workflows/docker-ghcr.yml` — 推送到 GHCR（BuildKit GHA cache）

## 架构

### API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/public/config` | 公开配置 → `{ categories, shortcuts, settings }` |
| `GET` | `/api/public/favicon?url=` | 抓取站点图标（优先 SVG），返回 data URL |
| `GET` | `/api/public/wallpapers/sources` | 壁纸库分类 |
| `GET` | `/api/public/wallpapers?source=&page=&size=&q=` | 壁纸列表（服务端代理） |
| `GET` | `/api/public/wallpapers/download?url=` | 壁纸下载代理 |
| `GET` | `/api/auth/me` | `{ admin: boolean }` |
| `POST` | `/api/auth/login` | `{ username, password }` → Set-Cookie |
| `POST` | `/api/auth/logout` | 清除 Session |
| `POST` | `/api/admin/password` | 需登录；`{ currentPassword, newPassword }`，新密码至少 6 位 |
| `PUT` | `/api/admin/config` | 需登录；**整包** JSON 写回（与前端导出格式一致） |

- 路由入口：`server/server.go`；favicon / wallpaper 各自 `Register` 挂到 `/api`
- 前端 API：`web/src/utils/api.js`
- 状态集中在 `web/src/App.jsx`；管理员改 `categories` / `shortcuts` / `settings` 后 **debounce ~600ms** 写回 API（`skipPersist` 避免首屏加载误写）

### 前端关键模块

| 路径 | 作用 |
|------|------|
| `web/src/App.jsx` | 全局状态、持久化、快捷键、壁纸与 iframe 会话 |
| `web/src/utils/api.js` | fetch 封装 |
| `web/src/utils/categories.js` / `ids.js` | 多分类归属、数字 id / code |
| `web/src/utils/wallpaper.js` | 壁纸设置归一化、选择与下载 |
| `web/src/utils/backup.js` | 导出 / 导入 / 清空配置 |
| `web/src/utils/commandItems.js` + `CommandPalette` | `⌘/Ctrl+K` 或 `/` 命令面板 |
| `web/src/utils/defaultData.js` | **仅前端兜底**；真实默认以 `seed.json` / API 为准 |
| `IframeViewer` + `IframeSessionDock` | 站内预览与右下角托盘 |
| `EditShortcutModal` | 编辑快捷方式（图标体积校验） |

### 数据模型（简要）

- **categories**：`id`（数字主键）/ `code` / `name` / `icon`；`code === 'common'` 不可删
- **shortcuts**：`categoryIds[]` 多对多；`openMode`：`tab` | `iframe`；`iframeDevice`：`mobile` | `desktop`
- **settings**：单行 JSON（布局、品牌、搜索引擎、结构化 `wallpaper` 等）

## 注意点

- 自定义快捷方式图标约 **200KB** 上限（见 `EditShortcutModal`）
- 分类 `code === 'common'` 不可删；实体主键为数字 `id`
- 配置为 **整包 PUT**（全量覆盖），不是局部 patch；备份还原同格式（可含 `version` / `exportedAt`）
- 壁纸以 `settings.wallpaper` 为准（壁纸库：必应 / Wallhaven / Deepin / 自定义等）；旧 flat 字段（`selectedWallpaper` / `customWallpaperUrl` / `bgBlur` 等）仍兼容
- `defaultData.js` 里 Unsplash 预设仅 legacy 兜底，勿当作当前默认壁纸来源
- `ADMIN_*` 只初始化一次；改密走设置页 / `POST /api/admin/password`（新密码 ≥ 6）
- Vercel 演示环境数据在 `/tmp`，不保证持久化与跨实例一致；长期自托管用 Docker / 本地二进制
- 多数站点禁止 iframe 嵌入；站内预览失败时可回退新标签页

## 子代理协作

若本机存在 `~/.claude/rules/multi-agent-protocol.md` 则遵循；仓库内无该文件时忽略本条。
