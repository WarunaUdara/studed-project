.PHONY: dev-up dev-down test lint build frontend-install frontend-dev frontend-build go-build go-test

# Development
 dev-up:
	docker-compose -f docker-compose.yml up -d postgres redis elasticsearch

 dev-down:
	docker-compose -f docker-compose.yml down

# Frontend
 frontend-install:
	cd frontend && bun install

 frontend-dev:
	cd frontend && bun run dev

 frontend-build:
	cd frontend && bun run build

 frontend-typecheck:
	cd frontend && bun run typecheck

# Go services
 go-build:
	@for svc in services/*; do \
		if [ -f "$$svc/main.go" ]; then \
			echo "building $$svc..."; \
			cd "$$svc" && go build -o bin/service . && cd ../..; \
		fi \
	 done

 go-test:
	@for svc in services/*; do \
		if [ -f "$$svc/go.mod" ]; then \
			echo "testing $$svc..."; \
			cd "$$svc" && go test ./... && cd ../..; \
		fi \
	 done

# Shared
 shared-test:
	cd shared/go && go test ./...

# Combined
 test: go-test shared-test
	cd frontend && bun run test

 lint:
	cd frontend && bun run lint

 build: frontend-build go-build
