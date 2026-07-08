.PHONY: dev-web dev-api dev build docker

dev-web:
	cd web && pnpm dev

dev-api:
	go run ./cmd/nav-hub

dev:
	@echo "Run in two terminals: make dev-api && make dev-web"

build-web:
	cd web && pnpm install && pnpm build
	rm -rf internal/static/dist/*
	cp -R web/dist/* internal/static/dist/

build:
	$(MAKE) build-web
	go build -o bin/nav-hub ./cmd/nav-hub

docker:
	docker build -t nav-hub:local .