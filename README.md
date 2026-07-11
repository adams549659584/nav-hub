# nav-hub

**高颜值、极简、可自托管的卡片式导航起始页。**

像新标签页一样打开，像命令面板一样秒搜，像浏览器一样管理你的站点。  
单二进制 + SQLite，Docker 一键部署；访客即开即用，管理员登录后随意改。

镜像：[`ghcr.io/adams549659584/nav-hub`](https://github.com/adams549659584/nav-hub/pkgs/container/nav-hub)

---

## 为什么选 nav-hub

| | |
|--|--|
| **开箱即用** | 访客零登录浏览；管理员登录即可编排全站 |
| **部署极简** | 一个 Docker 镜像 / 一个 Go 二进制，数据落在 SQLite |
| **好看耐看** | 毛玻璃 UI、壁纸库、可调布局与站点品牌 |
| **键盘友好** | `⌘/Ctrl+K` 命令面板，导航 / 搜索 / 操作一触即达 |
| **打开方式灵活** | 新标签或站内预览（手机 / 小屏 PC 浮窗，可最小化托盘） |

---

## 功能亮点

### 导航与分类

- **多分类侧栏**，支持「全部」视图；一个链接可归属多个分类  
- **拖拽排序**：编辑布局下重排导航与分类，拖到侧栏即可归类  
- **卡片式快捷方式**：自定义名称、颜色、字母 / 上传图 / SVG / 自动抓取站点图标  
- **长名称友好**：省略展示，悬停展开完整标题  

### 命令面板（`⌘K` / `Ctrl+K`，或 `/`）

- **秒搜本地导航**（支持拼音与首字母）  
- **多引擎搜索**：Google / 百度 / Bing / GitHub / DuckDuckGo，品牌图标一目了然  
- **URL 直达**、切换分类、打开设置 / 编辑布局 / 添加链接 等操作  
- 层级最高，站内预览打开时也能随时唤起  

### 搜索栏

- 顶栏搜索 + 本地导航联想（图标与命令面板统一风格）  
- 任意用户可切换当前引擎；管理员可在设置中指定默认引擎  

### 站内预览

- 链接可设 **新标签页** 或 **站内预览**  
- 视口：**手机** / **电脑（1366×768）**  
- **最小化到右下角托盘**（站内预览），iframe 不卸载、点一下即可恢复  
- 多窗口可滚动列表；站点图标 + 名称省略  

### 外观与氛围

- **壁纸库**：纯色 / 必应 / 动态 / Wallhaven / Deepin / 自定义 URL  
- 模糊、亮度、遮罩可调  
- 网格列数、间距、图标大小与圆角、内容最大宽度  
- 站点标题、描述、侧栏 Logo 文案与渐变色  
- 顶部时钟日历、底部每日一言（可开关）  

### 管理与安全

- 访客只读；管理员 Session 鉴权  
- **设置中修改密码**（环境变量仅首次初始化账号）  
- **新密码至少 6 位**（设置页与 `POST /api/admin/password` 均校验；过短会拒绝）  
- 密码框即时显示 / 隐藏切换  
- 配置整体 `PUT` 持久化，改完自动写回  

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19、Vite、lucide-react、Oxlint |
| 后端 | Go 1.22+、chi、bcrypt Session Cookie |
| 存储 | SQLite（`modernc.org/sqlite`，纯 Go） |
| 部署 | Docker 单镜像 / 本地二进制 / Vercel 演示，GHCR 多架构构建 |

---

## 快速开始

### Docker Compose（推荐）

```bash
# 务必修改 SESSION_SECRET 与 ADMIN_PASSWORD
docker compose up -d
```

浏览器打开 <http://localhost:8080>。默认管理员见 `docker-compose.yml`。

数据卷：`nav-hub-data` → 容器内 `/data/app.db`。

### Vercel 一键部署

> ⭐ **仅适合演示 / 试用**。Vercel 无持久磁盘，SQLite 落在 `/tmp`，**冷启动、新实例或重新部署后数据会丢失**。长期自托管请用 Docker 或本地二进制。

一键部署，点这里 => [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/adams549659584/nav-hub&project-name=nav-hub&repository-name=nav-hub&env=SESSION_SECRET,ADMIN_USER,ADMIN_PASSWORD&envDescription=%E7%94%9F%E4%BA%A7%E5%8A%A1%E5%BF%85%E4%BF%AE%E6%94%B9%20SESSION_SECRET%20%E4%B8%8E%E7%AE%A1%E7%90%86%E5%91%98%E5%AF%86%E7%A0%81&envLink=https://github.com/adams549659584/nav-hub#%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)

部署后在 Vercel 项目 **Settings → Environment Variables** 中配置（与本地含义相同）：

| 变量 | 建议 |
|------|------|
| `SESSION_SECRET` | 随机长字符串（**必改**） |
| `ADMIN_USER` | 首次初始化管理员用户名 |
| `ADMIN_PASSWORD` | 首次初始化管理员密码（仅灌库一次） |

说明与限制：

- 仓库内已含 [`vercel.json`](./vercel.json) 与 [`api/index.go`](./api/index.go)（Go Serverless 入口）
- 未设置 `DATABASE_DSN` 时，在 Vercel 上自动使用 `file:/tmp/nav-hub.db?...`（**不持久**）
- 前端需已嵌入 `internal/static/dist/`（仓库会提交完整构建产物；改 `web/` 后请 `make build-web` 并提交，否则 Vercel 仍是旧前端）。Docker 构建会在镜像内重新构建前端，不依赖该目录是否最新。
- 部署后在设置页改密时，**新密码至少 6 位**（与本地相同；API `POST /api/admin/password` 亦校验）
- 生产勿依赖 Vercel 存配置；演示后若需长期使用请改 Docker / 自托管

### 本地二进制

依赖：Go 1.22+、Node.js、[pnpm](https://pnpm.io/)。

```bash
make build          # 构建前端并嵌入，输出 bin/nav-hub
./bin/nav-hub       # 默认监听 :8080，数据库 ./data/app.db
```

首次启动若库为空，会从 `internal/seed/seed.json` 灌入默认配置；若无管理员，则用环境变量创建（仅一次）。

### 开发模式（前后端分离）

```bash
make dev-api        # Go API → http://localhost:8080
make dev-web        # Vite → http://localhost:5173（/api 代理到 8080）
```

请打开 **Vite 地址（5173）** 做前端开发。

#### VS Code / Cursor 调试

| 配置 | 说明 |
|------|------|
| **Full Stack (API + Vite)** | 同时调试后端 + 启动前端（推荐） |
| **Debug API (Go)** | 仅后端 |
| **Chrome: Frontend (Vite)** | 前端源码映射 |

推荐扩展见 `.vscode/extensions.json`。

---

## 环境变量

| 变量 | 默认（本地） | 说明 |
|------|----------------|------|
| `ADDR` | `:8080` | 监听地址 |
| `DATABASE_DSN` | `file:./data/app.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)` | SQLite DSN；Docker 内为 `file:/data/app.db?...`；Vercel 未设置时为 `/tmp/nav-hub.db`（不持久） |
| `ADMIN_USER` | `admin` | 首次初始化管理员用户名 |
| `ADMIN_PASSWORD` | `admin` | 首次初始化管理员密码（仅灌库一次；之后改密见下） |
| `SESSION_SECRET` | `dev-secret-change-me` | Session 签名密钥，**生产务必修改** |

- `ADMIN_*` **仅在库中尚无管理员时**写入；之后请用设置页改密。  
- **修改密码**时，新密码 **至少 6 个字符**（前后端均校验）。  
- 生产请使用强随机 `SESSION_SECRET` 与独立密码。

---

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/public/config` | 公开配置：`{ categories, shortcuts, settings }` |
| `GET` | `/api/public/favicon?url=` | 抓取站点图标（优先 SVG），返回 data URL |
| `GET` | `/api/public/wallpapers/sources` | 壁纸库分类 |
| `GET` | `/api/public/wallpapers?source=&page=&size=&q=` | 壁纸列表（服务端代理） |
| `GET` | `/api/auth/me` | `{ admin: boolean }` |
| `POST` | `/api/auth/login` | `{ username, password }` → Set-Cookie |
| `POST` | `/api/auth/logout` | 清除 Session |
| `POST` | `/api/admin/password` | 需登录；改密。Body：`{ currentPassword, newPassword }`；**`newPassword` 至少 6 位** |
| `PUT` | `/api/admin/config` | 需登录；整包 JSON 写回 |

---

## 目录结构

```
nav-hub/
├── api/                  # Vercel Serverless 入口（api/index.go）
├── cmd/nav-hub/          # 本地 / Docker Go 入口
├── server/               # HTTP 路由与启动（本地与 Vercel 共用；不可放 internal，供 Vercel 引用）
├── internal/
│   ├── auth/             # Cookie Session
│   ├── favicon/          # 站点图标抓取
│   ├── seed/             # 首次灌库 seed.json
│   ├── static/dist/      # 嵌入的前端构建产物（勿手改）
│   ├── store/            # SQLite 读写
│   └── wallpaper/        # 壁纸代理
├── web/                  # React + Vite 前端
├── .vscode/              # 调试与推荐扩展
├── Dockerfile
├── docker-compose.yml
├── vercel.json
└── Makefile
```

`internal/static/dist/` 由 `make build-web` 生成并提交（供 Vercel / 纯 `go build` 的 `go:embed`）；Docker 构建时会重新生成并覆盖。

---

## 常用命令

| 命令 | 作用 |
|------|------|
| `make dev-api` | 本地 Go API |
| `make dev-web` | Vite 开发服务器 |
| `make build-web` | 构建前端并复制到 `internal/static/dist/` |
| `make build` | 前端 + `bin/nav-hub` |
| `make docker` | 构建本地镜像 `nav-hub:local` |
| `cd web && pnpm lint` | Oxlint |

---

## 数据模型（简要）

| 实体 | 说明 |
|------|------|
| categories | `id` / `code` / `name` / `icon` / `sort_order`；`common` 不可删 |
| shortcuts | 名称、URL、图标、`openMode`（`tab` \| `iframe`）、`iframeDevice`（`mobile` \| `desktop`）等 |
| shortcut_categories | 多对多；无分类的导航仅在「全部」中显示 |
| settings | 单行 JSON：布局、壁纸、品牌、开关等 |

侧栏默认选中 `code === 'common'` 的常用推荐。

---

## 使用提示

- 按 **`⌘K` / `Ctrl+K`**（或 **`/`**）打开命令面板，是最快的找站方式。  
- 自定义图标建议 ≤ **200KB**；支持粘贴 SVG 与自动抓取。  
- **站内预览**依赖目标站是否允许被 iframe 嵌入；多数大站会拒绝，请改用新标签页。  
- 管理员改数据后前端会 debounce 写回；已有库启动会自动迁移 schema。  
- 生产务必改 `SESSION_SECRET` 与管理员密码；**在设置中改密时新密码至少 6 位**。  
- Vercel 部署仅适合演示：数据在 `/tmp`，不保证持久化。

---

## License

[MIT](./LICENSE) © adams549659584
