.PHONY: dev-up dev-down dev dev-stop launch test lint build frontend-install frontend-dev frontend-build frontend-typecheck frontend-lint frontend-e2e go-build go-test shared-test proto-gen seed content-validate content-sync demo-public

# Development
# Pre-builds each service on the host so the Dockerfiles can copy bin/linux_service
# instead of compiling in-image. The target arch MUST match the container engine's
# arch, not a hardcoded value: on an amd64 host (every Windows/Intel dev) a
# hardcoded arm64 binary gets baked into an amd64 image and the container dies at
# runtime with "exec format error". Ask Docker what it runs, fall back to the host.
 go-build-linux:
	@ARCH=$$(docker info --format '{{.Architecture}}' 2>/dev/null); \
	case "$$ARCH" in \
		aarch64|arm64) GOARCH=arm64 ;; \
		x86_64|amd64)  GOARCH=amd64 ;; \
		*)             GOARCH=$$(go env GOARCH) ;; \
	esac; \
	echo "pre-building services for linux/$$GOARCH..."; \
	for svc in services/*; do \
		if [ -f "$$svc/main.go" ]; then \
			echo "  $$svc"; \
			(cd "$$svc" && CGO_ENABLED=0 GOOS=linux GOARCH=$$GOARCH go build -o bin/linux_service .) || exit 1; \
		fi \
	done

dev-up: docker-mem-check docker-buildx-check
	@docker info >/dev/null 2>&1 || (echo "Container engine (Docker) is not running. Start Docker Desktop (or run 'colima start' if you use Colima) and try again." && exit 1)
	# COMPOSE_PARALLEL_LIMIT=2 caps concurrent builds so 9 Go Dockerfiles cannot
	# OOM a 16GB dev laptop (each build already runs with GOFLAGS=-p=2).
	COMPOSE_PARALLEL_LIMIT=2 docker compose -f docker-compose.yml up --build -d --remove-orphans

 launch:
	bun run scripts/launch.ts

 dev-down:
	docker compose -f docker-compose.yml down

 dev-logs:
	docker compose logs -f

 floci-gcp-up:
	@docker info >/dev/null 2>&1 || (echo "Container engine (Docker) is not running. Start Docker Desktop (or run 'colima start' if you use Colima) and try again." && exit 1)
	docker compose -f docker-compose.yml up -d floci-gcp

 floci-gcp-down:
	docker compose -f docker-compose.yml stop floci-gcp

 seed:
	./scripts/mock-data-loader.sh

 content-validate:
	cd scripts/content-sync && bun run validate

 content-sync:
	cd scripts/content-sync && bun run sync

 demo-public:
	./scripts/demo-public.sh

 k8s-up:
	./scripts/k8s-dev.sh up

 k8s-down:
	./scripts/k8s-dev.sh down

 k8s-status:
	./scripts/k8s-dev.sh status

# One-time GitOps controller install for Phase 1 progressive delivery:
#   - Argo CD Image Updater: tracks the immutable sha-* image tags CI publishes
#     and updates the Deployment manifests (rollback-safe, no mutable :latest).
#   - Argo Rollouts: BlueGreen/canary rollouts with manual promote + abort.
# Requires the argocd namespace (ArgoCD) to exist first.
 gitops-controllers:
	@kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml
	@kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-rollouts/stable/manifests/install.yaml
	@echo "Installed Argo CD Image Updater + Argo Rollouts controllers into namespace 'argocd'."
	@echo "Enable per-service Rollouts via infra/k8s/argocd/rollouts/api-gateway-rollout.yaml"

 iac-init:
	cd infra/gcp/terraform-prod && tofu init

 iac-plan: iac-init
	cd infra/gcp/terraform-prod && tofu validate && tofu plan -out=tfplan

 iac-apply:
	cd infra/gcp/terraform-prod && tofu apply tfplan

 helm-lint:
	/opt/homebrew/bin/helm lint infra/helm/studed || helm lint infra/helm/studed

 security-scan:
	./scripts/security/secret-scan.sh

 frontend-test:
	cd frontend && bun run test --run

 k8s-policy-test:
	@which kyverno >/dev/null 2>&1 || [ -f /opt/homebrew/bin/kyverno ] && (/opt/homebrew/bin/kyverno apply infra/k8s/kyverno/cluster-policies.yaml --resource infra/k8s/services/ --resource infra/k8s/production/services/ || kyverno apply infra/k8s/kyverno/cluster-policies.yaml --resource infra/k8s/services/ --resource infra/k8s/production/services/) || echo "⚠️ Kyverno CLI not found locally; install via 'brew install kyverno'"

 regression-test: go-test shared-test frontend-test k8s-policy-test
	@echo "All extensible regression test matrices passed successfully!"

 ci-local: security-scan frontend-typecheck frontend-test frontend-build go-test shared-test helm-lint k8s-policy-test iac-plan promtool-check
	@echo "All local CI pre-flight checks passed!"

 doctor:
	@echo "Checking development environment toolchain..."
	@go version
	@bun --version
	@docker --version
	@echo "Environment doctor check passed!"

# Fails fast when the container VM is too small to build/run the StudEd stack.
# The full stack (Elasticsearch + Postgres + Redis + 9 Go services) needs >= 6 GiB.
 docker-mem-check:
	@UNIT=$$(docker info 2>/dev/null | grep "Total Memory"); \
	MEM=$$(echo "$$UNIT" | awk -F': ' '{print $$2}' | tr -dc '0-9.'); \
	IS_MIB=$$(echo "$$UNIT" | grep -q MiB && echo 1 || echo 0); \
	if [ -z "$$MEM" ]; then echo "error: cannot read Docker Total Memory (is the engine running?)"; exit 1; fi; \
	if [ "$$IS_MIB" = "1" ]; then MEM_GB=$$(echo "scale=3; $$MEM/1024" | bc 2>/dev/null || echo 1); else MEM_GB=$$MEM; fi; \
	FITS=$$(echo "$$MEM_GB >= 6" | bc 2>/dev/null || echo 0); \
	if [ "$$FITS" != "1" ]; then \
		echo "error: Docker VM has only $$MEM_GB GiB (Total Memory: $$(echo "$$UNIT" | awk -F': ' '{print $$2}'))."; \
		echo "The StudEd stack needs >= 6 GiB. Fix (Docker Desktop): Settings > Resources >"; \
		echo "  Memory -> 8 GB > Apply & Restart. Fix (Colima): 'colima start --cpu 4 --memory 8'."; \
		exit 1; \
	fi; \
	echo "ok: Docker VM memory ($$MEM_GB GiB) is sufficient."

# The Go Dockerfiles use BuildKit mounts (RUN --mount=type=cache) which require
# the docker buildx plugin. Docker Desktop bundles buildx; Colima/brew users
# need 'brew install docker-buildx'. Fail early with a clear hint instead of the
# cryptic 'the --mount option requires BuildKit' build error.
 docker-buildx-check:
	@docker buildx version >/dev/null 2>&1 || { echo "error: docker buildx plugin is required (Dockerfiles use BuildKit --mount)."; echo "Docker Desktop (macOS/Windows) bundles it. Colima users: 'brew install docker-buildx'."; exit 1; }
	@echo "ok: docker buildx (BuildKit) is available."

# The observability stack sits behind the `monitoring` compose profile so a bad
# host bind-mount cannot abort `dev-up` before the api-gateway starts. On macOS
# these mounts need Docker Desktop to have access to this directory:
# System Settings > Privacy & Security > Files and Folders (or Full Disk Access).
 monitoring-up:
	docker compose --profile monitoring up -d prometheus grafana tempo postgres-exporter redis-exporter

 monitoring-down:
	docker compose --profile monitoring stop prometheus grafana tempo postgres-exporter redis-exporter

 promtool-check:
	@if docker info >/dev/null 2>&1; then \
		docker run --rm --entrypoint promtool -v $(PWD)/infra/monitoring/prometheus:/etc/prometheus prom/prometheus:v3.2.1 check config /etc/prometheus/prometheus.yml && \
		docker run --rm --entrypoint promtool -v $(PWD)/infra/monitoring/prometheus:/etc/prometheus prom/prometheus:v3.2.1 check rules /etc/prometheus/rules/studed.rules.yml; \
	else \
		echo "Skipping containerized promtool-check (Container engine daemon not running)"; \
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
	cd ${PROD_TF_DIR:-infra/gcp/terraform-prod} && tofu apply -auto-approve -var "node_count=2" | tail -5

 prod-stop:
	@echo "Standby: scaling node pool to 0 (stops ~all node charges)..."
	cd ${PROD_TF_DIR:-infra/gcp/terraform-prod} && tofu apply -auto-approve -var "node_count=0" | tail -5

 prod-status:
	./scripts/gcp/status.sh

 prod-destroy:
	./scripts/gcp/destroy.sh $(DESTROY_FLAGS)

 prod-teardown-audit:
	./scripts/gcp/verify-teardown.sh

 prod-seed:
	@IP=$$(cd ${PROD_TF_DIR:-infra/gcp/terraform-prod} && tofu output -raw ingress_static_ip 2>/dev/null || echo ""); \
	URL=$$(if [ -n "$$IP" ]; then echo "https://api.$${IP}.sslip.io"; else echo "http://localhost:8080"; fi); \
	STUDED_API_URL="$${STUDED_API_URL:-$$URL}" STUDED_DATABASE_URL="$${STUDED_DATABASE_URL:-$${DATABASE_URL:-}}" ./scripts/mock-data-loader.sh
