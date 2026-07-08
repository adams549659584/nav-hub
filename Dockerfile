# syntax=docker/dockerfile:1

FROM node:20-alpine AS web-build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY web/ ./
RUN pnpm build

FROM golang:1.22-alpine AS go-build
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
    CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /nav-hub ./cmd/nav-hub

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