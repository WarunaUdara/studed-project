# Enterprise DevOps CI/CD & GitOps Pipeline Architecture

This document specifies the end-to-end continuous integration, continuous delivery (CI/CD), and GitOps architecture powering the **StudEd** educational platform.

---

## 1. CI/CD & GitOps Pipeline Flowchart

```mermaid
flowchart TB
    subgraph DevSpace["1. Developer Workspace"]
        DEV["Developer / AI Agent"]
        COMMIT["Local Git Commits<br/>(Conventional Commits)"]
    end

    subgraph GitHubPlatform["2. GitHub Platform & Actions CI"]
        REPO[("GitHub Repository<br/>WarunaUdara/studed-project")]
        TRIGGER["Event Trigger<br/>• Push to main<br/>• Pull Request to main<br/>• Tag v* / Manual Dispatch"]

        subgraph CIJobs["GitHub Actions Runners (Parallel Job Matrix)"]
            FE_JOB["Frontend CI<br/>• Bun Install<br/>• TypeScript Check<br/>• Vitest Unit Tests<br/>• Production Bundle Build"]
            GO_JOB["Go Services CI<br/>• Setup Go 1.25 & Protoc<br/>• Shared Package Tests<br/>• 11 Microservice Unit Tests"]
            IAC_JOB["OpenTofu IaC CI<br/>• Setup OpenTofu 1.8.0<br/>• Init & Validate<br/>  infra/gcp/terraform"]
            HELM_JOB["Helm & K8s CI<br/>• Setup Helm 3.14<br/>• Helm Chart Lint<br/>• Template Offline Render"]
        end

        subgraph RegistryJob["Container Image Build & Publish"]
            BUILDX["Docker Buildx (8 Parallel Services)<br/>• ai-service, api-gateway, auth-service<br/>• course-service, gamification-service<br/>• notification-service, payment-service<br/>• progress-service"]
            GHCR[("GitHub Container Registry<br/>ghcr.io/warunaudara/studed-*<br/>Tags: sha-<commit>, latest, main")]
        end
    end

    subgraph GitOpsCluster["3. GKE Production Cluster (GitOps Engine)"]
        ARGO_CTRL["ArgoCD Controller (argocd ns)<br/>• Auto-Sync & Self-Heal<br/>• Sync Window & Prune<br/>• Target Path: infra/k8s/production<br/>• Submodules Disabled"]
        ESO_CTRL["External Secrets Operator (external-secrets ns)<br/>• Workload Identity Auth<br/>• Pulls GCP Secret Manager Secrets"]

        subgraph WorkloadDeploy["Zero-Downtime Deployment Execution"]
            ROLLING["Kubernetes Rolling Update<br/>• Pod Anti-Affinity<br/>• Graceful SIGTERM Draining (15s)<br/>• Readyness & Liveness Probes"]
            LIVE_PODS["Live Running Microservices<br/>(Namespace: studed)"]
        end
    end

    subgraph CloudEdge["4. CDN & External Integration"]
        PAGES_DEPLOY["Cloudflare Pages Deployment<br/>(Wrangler Deploy via Edge)"]
        LIVE_APP["Live StudEd Application"]
    end

    %% Pipeline Connections
    DEV -->|git commit| COMMIT
    COMMIT -->|git push| REPO
    REPO --> TRIGGER

    TRIGGER --> FE_JOB
    TRIGGER --> GO_JOB
    TRIGGER --> IAC_JOB
    TRIGGER --> HELM_JOB

    GO_JOB & FE_JOB -->|On Verification Pass| BUILDX
    BUILDX -->|Push OCI Images| GHCR

    GHCR -.->|Image Tag Pull| ARGO_CTRL
    REPO -.->|Watch infra/k8s/production| ARGO_CTRL

    ARGO_CTRL -->|Reconcile Manifests| ESO_CTRL
    ESO_CTRL -->|Inject K8s Secrets| ROLLING
    ROLLING --> LIVE_PODS

    FE_JOB -->|Wrangler Deploy| PAGES_DEPLOY
    PAGES_DEPLOY & LIVE_PODS --> LIVE_APP
```

---

## 2. Pipeline Stages & Verification Matrix

| Stage | Trigger / Scope | Command / Tooling | Success Criteria |
| :--- | :--- | :--- | :--- |
| **Local Pre-Flight** | Pre-commit / Pre-PR | `make ci-local` | Typecheck, Vitest, Go tests, Helm lint, OpenTofu validate pass |
| **Frontend CI** | PR & Main branch | `bun run typecheck`, `bun run test --run`, `bun run build` | 0 TypeScript errors, 27/27 Vitest unit tests pass, bundle built |
| **Go Microservices CI** | PR & Main branch | `make shared-test`, `make go-test` | 100% Go test package pass across all 11 microservices |
| **OpenTofu IaC CI** | PR & Main branch | `cd infra/gcp/terraform && tofu validate` | OpenTofu configuration schema valid |
| **Kubernetes / Helm CI**| PR & Main branch | `helm lint`, `helm template` render | 0 Helm chart syntax errors, valid manifest generation |
| **Container Build** | Main branch / Tag | `docker/build-push-action@v6` | Multi-stage Docker build success, image pushed to GHCR |
| **GitOps Reconcile** | Post image publish | ArgoCD Application (`studed-production`) | Kubernetes cluster syncs desired state from `infra/k8s/production` |
| **Zero-Downtime Rollout**| Cluster sync | Kubernetes RollingUpdate | SIGTERM drain window allows zero dropped in-flight requests |

---

## 3. Key Pipeline Guarantees & Industrial Controls

1. **Strict Automated Pre-Flight Gate (`make ci-local`)**: Developers can execute the identical verification suite locally before creating pull requests.
2. **Immutable OCI Artifacts (GHCR)**: Service containers are tagged with the exact Git commit SHA (`sha-<commit>`) ensuring total auditability and reproducible rollbacks.
3. **Submodule-Safe GitOps Rendering**: ArgoCD `reposerver` explicitly disables recursive git submodule expansion (`reposerver.enable.git.submodule=false`) to prevent nested repository links (such as `submodules/math-to-manim`) from breaking manifest rendering.
4. **Secretless CI/CD Pipeline**: GitHub Actions does not store long-lived Cloud SQL or GKE credentials; workload deployments are handled pull-style by in-cluster ArgoCD via Workload Identity.

