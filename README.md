# nav-hub

极简卡片式浏览器起始页（「iTab 新标签页」）。

单二进制部署：**Go** 提供静态 SPA 与 `/api`，**SQLite** 持久化配置。访客只读；管理员登录后可编辑分类、快捷方式与全局设置。

镜像：[`ghcr.io/adams549659584/nav-hub`](https://github.com/adams549659584/nav-hub/pkgs/container/nav-hub)

## 功能概览

- 分类侧边栏 + 卡片式快捷方式（可调尺寸、颜色、自定义图标）
- 搜索栏（多搜索引擎）
- 壁纸、模糊与亮度等全局设置
- 日历小组件、底部名言
- 配置导入 / 导出（JSON）
- 访客公开只读；管理员 Cookie Session 鉴权后写回服务端

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19、Vite、lucide-react、Oxlint |
| 后端 | Go 1.22+、chi、bcrypt Session Cookie |
| 存储 | SQLite（`modernc.org/sqlite`，纯 Go） |
| 部署 | Docker 单镜像 / 本地二进制，GHCR 自动构建 |

## 快速开始

### Docker Compose（推荐）

```bash
# 务必修改 SESSION_SECRET 与 ADMIN_PASSWORD
docker compose up -d
```

浏览器打开 <http://localhost:8080>。默认管理员见 `docker-compose.yml` 中的环境变量。

数据卷：`nav-hub-data` → 容器内 `/data/app.db`。

### 本地二进制

依赖：Go 1.22+、Node.js、[pnpm](https://pnpm.io/)。

```bash
make build          # 构建前端并嵌入，输出 bin/nav-hub
./bin/nav-hub       # 默认监听 :8080，数据库 ./data/app.db
```

首次启动若库为空，会从 `internal/seed/seed.json` 灌入默认配置；若无管理员用户，则用环境变量中的账号密码创建（仅一次）。

### 开发模式（前后端分离）

需要两个终端：

```bash
make dev-api        # Go API → http://localhost:8080
make dev-web        # Vite → http://localhost:5173（/api 代理到 8080）
```

开发时请打开 **Vite 地址**（5173），不要只开 8080 的旧嵌入资源。

#### VS Code / Cursor 调试

仓库已包含 `.vscode/launch.json`：

| 配置 | 说明 |
|------|------|
| **Full Stack (API + Vite)** | 同时调试后端 + 启动前端（推荐） |
| **Debug API (Go)** | 仅后端，断点调试 |
| **Chrome: Frontend (Vite)** | 前端 Chrome 源码映射调试 |

需安装推荐扩展：Go、`oxc.oxc-vscode`（见 `.vscode/extensions.json`）。

## 环境变量

| 变量 | 默认（本地） | 说明 |
|------|----------------|------|
| `ADDR` | `:8080` | 监听地址 |
| `DATABASE_DSN` | `file:./data/app.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)` | SQLite DSN；Docker 镜像内为 `file:/data/app.db?...` |
| `ADMIN_USER` | `admin` | 首次初始化管理员用户名 |
| `ADMIN_PASSWORD` | `admin` | 首次初始化管理员密码 |
| `SESSION_SECRET` | `dev-secret-change-me` | Session 签名密钥，**生产务必修改** |

说明：

- `ADMIN_*` **仅在库中尚无管理员时**写入；之后改环境变量不会更新已有密码。
- 生产环境请使用强随机 `SESSION_SECRET` 与独立管理员密码。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/public/config` | 公开配置：`{ categories, shortcuts, settings }` |
| `GET` | `/api/auth/me` | `{ admin: boolean }` |
| `POST` | `/api/auth/login` | `{ username, password }` → Set-Cookie |
| `POST` | `/api/auth/logout` | 清除 Session |
| `PUT` | `/api/admin/config` | 需登录；整包 JSON，与前端导出格式一致 |

## 目录结构

```
nav-hub/
├── cmd/nav-hub/          # Go 入口
├── internal/
│   ├── auth/             # Cookie Session
│   ├── seed/             # 首次灌库 seed.json
│   ├── static/dist/      # 嵌入的前端构建产物（勿手改）
│   └── store/            # SQLite 读写
├── web/                  # React + Vite 前端
├── .vscode/              # 调试与推荐扩展
├── Dockerfile
├── docker-compose.yml
└── Makefile
```

`internal/static/dist/` 由 `make build-web` 或 Docker 构建生成；Git 中仅保留占位 `index.html`。

## 常用命令

| 命令 | 作用 |
|------|------|
| `make dev-api` | 本地 Go API |
| `make dev-web` | Vite 开发服务器 |
| `make build-web` | 构建前端并复制到 `internal/static/dist/` |
| `make build` | 前端 + `bin/nav-hub` |
| `make docker` | 构建本地镜像 `nav-hub:local` |
| `cd web && pnpm lint` | Oxlint |

## 使用注意

- 分类 id 为 `common` 的「常用推荐」不可删除。
- 自定义快捷方式图标建议 ≤ **200KB**（前端上传限制，过大影响配置体积）。
- 默认壁纸使用 Unsplash 外链，离线或网络受限环境可改为本地 / 自定义 URL。
- 管理员修改分类、快捷方式或设置后，前端会 debounce 写回 `PUT /api/admin/config`。

## License

按仓库内声明为准；未单独声明时请以源码仓库设置为准。
