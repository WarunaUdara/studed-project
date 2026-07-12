.PHONY: dev-up dev-down dev dev-stop launch test lint build frontend-install frontend-dev frontend-build frontend-typecheck frontend-lint frontend-e2e go-build go-test shared-test proto-gen

# Development
 dev-up:
	@docker info >/dev/null 2>&1 || (echo "Docker Desktop is not running. Please start it and try again." && exit 1)
	docker compose -f docker-compose.yml up --build -d

 launch:
	bun run scripts/launch.ts

 dev-down:
	docker compose -f docker-compose.yml down

 dev-logs:
	docker compose logs -f

 seed:
	./scripts/mock-data-loader.sh

 dev:
	./scripts/dev.sh

 dev-stop:
	./scripts/dev-stop.sh

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

 frontend-e2e:
	cd frontend && bun run test:e2e

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
		shared/proto/auth/auth.proto \
		shared/proto/course/course.proto \
		shared/proto/progress/progress.proto \
		shared/proto/gamification/gamification.proto
	cd shared/proto/gen/go && go mod tidy

# Combined
 test: go-test shared-test
	cd frontend && bun run test

 lint: frontend-lint

 build: frontend-build go-build
