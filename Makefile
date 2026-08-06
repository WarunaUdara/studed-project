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

 demo-public:
	./scripts/demo-public.sh

 k8s-up:
	./scripts/k8s-dev.sh up

 k8s-down:
	./scripts/k8s-dev.sh down

 k8s-status:
	./scripts/k8s-dev.sh status

 iac-init:
	cd infra/gcp/terraform && tofu init -backend=false

 iac-plan:
	cd infra/gcp/terraform && tofu validate

 iac-apply:
	cd infra/gcp/terraform && tofu apply -auto-approve

 helm-lint:
	/opt/homebrew/bin/helm lint infra/helm/studed || helm lint infra/helm/studed

 security-scan:
	./scripts/security/secret-scan.sh

 frontend-test:
	cd frontend && bun run test --run

 ci-local: security-scan frontend-typecheck frontend-test frontend-build go-test shared-test helm-lint iac-plan promtool-check
	@echo "All local CI pre-flight checks passed!"

 monitoring-up:
	docker compose up -d prometheus grafana postgres-exporter redis-exporter

 monitoring-down:
	docker compose stop prometheus grafana postgres-exporter redis-exporter

 promtool-check:
	@if docker info >/dev/null 2>&1; then \
		docker run --rm -v $(PWD)/infra/monitoring/prometheus:/etc/prometheus prom/prometheus:v3.2.1 promtool check config /etc/prometheus/prometheus.yml && \
		docker run --rm -v $(PWD)/infra/monitoring/prometheus:/etc/prometheus prom/prometheus:v3.2.1 promtool check rules /etc/prometheus/rules/studed.rules.yml; \
	else \
		echo "Skipping containerized promtool-check (Docker daemon not running)"; \
	fi

 graph-refresh:
	@/Users/warunaudarasampath/Library/Python/3.14/bin/graphify extract . --code-only --force

 graph-query:
	@/Users/warunaudarasampath/Library/Python/3.14/bin/graphify query "$(Q)"

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
	@set -e; for svc in services/*; do \
		if [ -f "$$svc/go.mod" ]; then \
			echo "testing $$svc..."; \
			(cd "$$svc" && go test -race ./...); \
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

# ---- Production (GCP + Cloudflare) ----
# One-command lifecycle for the live deployment. See DEPLOYMENT.md for details.
.PHONY: prod-deploy prod-start prod-stop prod-status prod-destroy prod-teardown-audit prod-seed

 prod-deploy:
	./scripts/gcp/deploy.sh

 prod-start:
	@echo "Waking backend: scaling node pool back up..."
	cd infra/gcp/terraform && tofu apply -auto-approve -var "node_count=2" | tail -5

 prod-stop:
	@echo "Standby: scaling node pool to 0 (stops ~all node charges)..."
	cd infra/gcp/terraform && tofu apply -auto-approve -var "node_count=0" | tail -5

 prod-status:
	./scripts/gcp/status.sh

 prod-destroy:
	./scripts/gcp/destroy.sh $(DESTROY_FLAGS)

 prod-teardown-audit:
	./scripts/gcp/verify-teardown.sh

 prod-seed:
	@IP=$$(cd infra/gcp/terraform && tofu output -raw ingress_static_ip 2>/dev/null || echo ""); \
	URL=$$(if [ -n "$$IP" ]; then echo "https://api.$${IP}.sslip.io"; else echo "http://localhost:8080"; fi); \
	STUDED_API_URL="$${STUDED_API_URL:-$$URL}" STUDED_DATABASE_URL="$${STUDED_DATABASE_URL:-$${DATABASE_URL:-}}" ./scripts/mock-data-loader.sh
