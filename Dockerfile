# syntax=docker/dockerfile:1

# 前端产物与架构无关，固定在构建机原生平台上构建，避免 arm64 下 QEMU 装 pnpm
FROM --platform=$BUILDPLATFORM node:20-alpine AS web-build
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml ./
ENV CI=true
# pnpm 11+ 默认校验 minimumReleaseAge，lock 里 vite/rolldown 等新包会在 CI 被拒
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

# Go 交叉编译：在构建机原生平台编译目标 GOARCH，无需 QEMU 跑 go build
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS go-build
ARG TARGETOS
ARG TARGETARCH
RUN apk add --no-cache git
WORKDIR /app
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download
COPY . .
RUN rm -rf internal/static/dist && mkdir -p internal/static/dist
COPY --from=web-build /app/web/dist/ internal/static/dist/
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags="-s -w" -o /nav-hub ./cmd/nav-hub

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
RUN adduser -D -u 10001 app
COPY --from=go-build /nav-hub /app/nav-hub
RUN mkdir -p /data && chown app:app /data
USER app
ENV ADDR=:8080
ENV DATABASE_DSN=file:/data/app.db?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)
EXPOSE 8080
VOLUME ["/data"]
ENTRYPOINT ["/app/nav-hub"]