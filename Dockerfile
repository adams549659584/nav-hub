# syntax=docker/dockerfile:1
# 自托管镜像（docker compose / GHCR）：多架构交叉编译 + 数据卷 /data
# 容器内统一监听 8080

# 前端：固定在构建机原生平台，避免 arm64 QEMU 下 pnpm 异常
FROM --platform=$BUILDPLATFORM node:20-alpine AS web-build
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml ./
ENV CI=true
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

# Go：在构建机上交叉编译目标 GOARCH
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS go-build
ARG TARGETOS
ARG TARGETARCH
RUN apk add --no-cache git ca-certificates
WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY . .
RUN rm -rf internal/static/dist && mkdir -p internal/static/dist
COPY --from=web-build /app/web/dist/ internal/static/dist/
RUN test -f internal/static/dist/index.html \
  && ls internal/static/dist/assets/*.js >/dev/null \
  && ls internal/static/dist/assets/*.css >/dev/null
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags="-s -w" -o /nav-hub ./cmd/nav-hub

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata su-exec
WORKDIR /app
RUN adduser -D -u 10001 app
COPY --from=go-build /nav-hub /app/nav-hub
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /data \
  && chown app:app /data
ENV PORT=8080
ENV ADDR=:8080
ENV DATABASE_DSN=file:/data/app.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)
EXPOSE 8080
VOLUME ["/data"]
ENTRYPOINT ["/app/docker-entrypoint.sh"]
