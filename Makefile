.PHONY: dev-up dev-down test lint build frontend-install frontend-dev frontend-build frontend-typecheck frontend-lint go-build go-test shared-test proto-gen

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

 frontend-lint:
	cd frontend && bun run lint

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

 proto-gen:
	mkdir -p shared/proto/gen/go
	protoc --proto_path=shared/proto \
		--go_out=shared/proto/gen/go --go_opt=paths=source_relative \
		--go-grpc_out=shared/proto/gen/go --go-grpc_opt=paths=source_relative \
		shared/proto/auth.proto
	cd shared/proto/gen/go && go mod tidy

# Combined
 test: go-test shared-test
	cd frontend && bun run test

 lint: frontend-lint

 build: frontend-build go-build
