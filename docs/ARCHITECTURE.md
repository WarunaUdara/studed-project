# StudEd Production Architecture

End-to-end architecture of the live StudEd deployment (GCP backend, Cloudflare frontend, Neon Postgres).

## Full GCP Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["End User Layer"]
        U["Browser / Mobile App<br/>(React 18 SPA)"]
    end

    subgraph CF["Cloudflare Edge"]
        P["Pages Hosting<br/>studed-project-frontend.pages.dev"]
        PF["Pages Function<br/>functions/graphql.ts<br/>(Server-to-Server Proxy)"]
    end

    subgraph GCP["Google Cloud Platform (studed-prod)"]
        subgraph Edge["Edge & Ingress Security"]
            IP["Static External IP<br/>34.149.224.124"]
            LB["GCE L7 HTTPS Load Balancer<br/>(Managed SSL Cert)"]
            WAF["Cloud Armor WAF<br/>(OWASP CRS + Rate Limit: 100 req/min)"]
        end

        subgraph GKE["GKE Standard Cluster (us-central1-a)"]
            subgraph NetSec["Network Policy Isolation (Default-Deny)"]
                subgraph GatewayNS["Gateway Tier"]
                    GW["api-gateway :4000<br/>(chi router + gqlgen)<br/>• Context Timeouts (5s/90s)<br/>• Complexity Limit 200<br/>• Graceful Drain (15s)"]
                end

                subgraph ServicesNS["Microservices Tier (Internal Only)"]
                    AUTH["auth-service :8085 (gRPC)<br/>• Service Token Auth<br/>• Graceful Shutdown"]
                    CRS["course-service :8083 (gRPC)<br/>• Service Token Auth<br/>• Graceful Shutdown"]
                    PROG["progress-service :8086 (gRPC)<br/>• Outbound Timeouts<br/>• Graceful Shutdown"]
                    GAME["gamification-service :8088 (gRPC)<br/>• Atomic XP & Award-Once<br/>• Service Token Auth"]
                    AI["ai-service :8090 (HTTP)<br/>• Gemini 1.5 Flash<br/>• Graceful Shutdown"]
                    NOTIF["notification-service :8092 (HTTP)<br/>• Bearer Auth Guard<br/>• Graceful Shutdown"]
                    PAY["payment-service :8091 (HTTP)<br/>• PayHere Webhook + Signature<br/>• Bearer Auth Guard"]
                    UP["upload-service :8096 (HTTP)<br/>• Extension Stub"]
                    USER["user-service :8082 (HTTP)<br/>• Extension Stub"]
                    CNT["content-service :8095 (HTTP)<br/>• Extension Stub"]
                end

                subgraph DataNS["In-Cluster Data Tier"]
                    REDIS[("Redis 7.0<br/>(Leaderboard & PubSub)")]
                    ES[("Elasticsearch 8.x<br/>(Course Search Index)")]
                end
            end
        end

        subgraph Security["Identity & Secrets Management"]
            SM["GCP Secret Manager<br/>(7/7 ExternalSecrets:<br/>Database, JWT, PayHere, Gemini, Tokens)"]
            WI["Workload Identity SA<br/>studed-external-secrets"]
            ESEC["External Secrets Operator<br/>(In-Cluster Sync)"]
        end

        subgraph Automation["Infra Automation & Idle Control"]
            SCHED["Cloud Scheduler<br/>(Hourly Cron)"]
            SCOUT["Cloud Run Job<br/>idle-scout<br/>(Scales nodes 2 ↔ 0 on idle)"]
        end
    end

    subgraph ExtDB["Managed Database Tier"]
        NEON[("Neon Postgres 15<br/>(Serverless Pooled DB)<br/>• Rotated Credential Manager")]
    end

    subgraph CI["CI/CD Pipeline (GitHub Actions)"]
        GH["GitHub Repo: WarunaUdara/studed-project"]
        WORKFLOW["ci.yml Workflow<br/>• Vitest Unit Tests<br/>• Go Microservices Tests<br/>• Helm Lint & Template<br/>• GCP OpenTofu IaC Validate<br/>• GHCR Docker Builds"]
        ARGO["ArgoCD GitOps<br/>(Production Auto-Sync)"]
    end

    %% Flow connections
    U -->|HTTPS| P
    U -->|HTTPS| PF
    P -->|fetch /graphql| PF
    PF -->|HTTPS / SSL| LB
    LB --> WAF
    WAF --> GW

    %% Gateway to Internal Services (gRPC/HTTP with Service Token)
    GW -->|gRPC + Service Token| AUTH
    GW -->|gRPC + Service Token| CRS
    GW -->|gRPC + Service Token| PROG
    GW -->|gRPC + Service Token| GAME
    GW -->|HTTP + Service Token| AI
    GW -->|HTTP + Service Token| NOTIF
    GW -->|HTTP + Service Token| PAY
    GW <--> REDIS
    GW --> ES

    %% Inter-service calls
    PROG -->|gRPC + Timeout| CRS
    PROG -->|gRPC + Service Token| GAME

    %% Database connections
    AUTH & CRS & PROG & GAME & NOTIF & PAY -->|TLS / Pooled TCP| NEON

    %% Secrets & Workload Identity
    WI -.->|IAM Scope| SM
    ESEC -->|Workload Identity Sync| WI
    ESEC -.->|Populates Secrets| GatewayNS & ServicesNS

    %% Idle Automation
    SCHED -->|Trigger| SCOUT
    SCOUT -.->|gcloud container clusters resize| GKE

    %% GitOps & Build
    GH --> WORKFLOW
    WORKFLOW --> ARGO
    ARGO -->|Sync k8s manifests| GKE
```

## Component Inventory

| Component | Architecture Role | Security & Reliability Controls |
| :--- | :--- | :--- |
| **GKE Standard Cluster** | Private zonal cluster (`us-central1-a`) hosting 9 microservices | NetworkPolicies default-deny, Shielded VMs, Workload Identity |
| **GCE HTTPS Load Balancer** | Ingress termination with Google-managed TLS & static IP | Managed TLS, Cloud Armor WAF attachment, SSL redirect |
| **Cloud Armor WAF** | Web application firewall & DDoS mitigation | OWASP CRS rules, 100 req/min IP rate limit, GraphQL pass rule |
| **GCP Secret Manager** | Centralized secrets storage (7 ExternalSecrets) | KMS encrypted, zero hardcoded cluster credentials, Workload Identity sync |
| **Neon Postgres 15** | Serverless PostgreSQL database | Connection pooling, rotation tooling (`rotate-neon-password`), SSL mode |
| **Cloudflare Pages & Functions** | Front-end static distribution & same-origin GraphQL proxy | Server-to-server TLS proxying, zero public origin exposure |
| **Idle-Scout (Cloud Run)** | Operational cost control automation | Scales node pool to 0 after 2h idle; preserves cluster state |
| **GitHub Actions & ArgoCD** | Declarative CI/CD & GitOps engine | Vitest, Go unit tests, GCP OpenTofu IaC validation, Helm lint |

## Core Architectural Guarantees

1. **Defense-in-Depth Network Isolation**: Default-deny NetworkPolicies restrict pod communication so that microservices are reachable strictly via `api-gateway` or explicitly permitted inter-service gRPC paths.
2. **Strict Service-to-Service Authentication**: All internal calls carry a cryptographically random shared service token verified via gRPC interceptors and HTTP middleware.
3. **Outbound Resilience & Drain**: Every outbound gRPC and HTTP client call enforces a strict context timeout (3s-5s for standard RPCs, 90s for AI generation). All services implement `signal.NotifyContext` graceful SIGTERM draining.
4. **XP & Gamification Integrity**: XP increments execute atomically (`UPDATE ... SET xp = xp + $1`), guarded by single-completion checks on wave attempts to eliminate race conditions and farming.
5. **Continuous Verification (CI/IaC)**: The automated CI pipeline validates GCP OpenTofu IaC configurations, runs Vitest frontend unit tests, executes Go service test suites, and lints Helm manifests on every commit.
