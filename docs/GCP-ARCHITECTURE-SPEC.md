# GCP Cloud Architecture & Icon Mapping Specification

This document provides an enterprise-grade architectural specification for the **StudEd** production environment on **Google Cloud Platform (GCP)**. It is structured to serve as both an authoritative technical reference and a direct blueprint for generating official GCP architecture diagrams in tools like **Draw.io**, **Lucidchart**, **Excalidraw**, **Eraser.io**, **Cloudcraft**, or Python's `diagrams` module.

---

## 1. Official GCP Service Icon & Tooling Mapping

When rendering this architecture in visual diagramming tools, use official Google Cloud Architecture Icons (v2024+) with the following mapping:

| Logical Component | Official GCP Service / Symbol | Category / Shape | Official Color Code |
| :--- | :--- | :--- | :--- |
| **GCP Project Boundary** | GCP Project | Container / Boundary | `#4285F4` (Google Blue) |
| **GCP Region & Zone** | `us-central1` / `us-central1-a` | Sub-boundary | `#E8EAED` (Light Gray) |
| **VPC Network & Subnet** | Virtual Private Cloud (VPC) | Network Boundary | `#34A853` (Google Green) |
| **Public External IP** | Compute Engine Static External IP | Network Endpoint | `#EA4335` (Google Red) |
| **HTTPS Load Balancer** | Cloud Load Balancing (Global L7) | Networking / Traffic | `#4285F4` (Google Blue) |
| **Managed TLS Certificate** | Certificate Manager / SSL | Security | `#FBBC05` (Google Yellow) |
| **WAF & Rate Limiter** | Cloud Armor | Security / Defense | `#EA4335` (Google Red) |
| **Kubernetes Cluster** | Google Kubernetes Engine (GKE) | Compute | `#4285F4` (Google Blue) |
| **Private Worker Nodes** | Compute Engine Virtual Machines (`e2-standard-2`) | Compute | `#4285F4` (Google Blue) |
| **Outbound Internet Egress** | Cloud NAT & Cloud Router | Networking | `#34A853` (Google Green) |
| **Secrets Repository** | Secret Manager | Security & Identity | `#FBBC05` (Google Yellow) |
| **Identity / Service Account** | IAM & Admin / Workload Identity | Security | `#FBBC05` (Google Yellow) |
| **Cost Optimization Cron** | Cloud Scheduler | Management Tools | `#4285F4` (Google Blue) |
| **Automated Resizing Job** | Cloud Run Jobs (`idle-scout`) | Compute / Serverless | `#4285F4` (Google Blue) |
| **Managed Relational DB** | Neon Serverless Postgres 15 (External) | Database | `#34A853` (Google Green) |
| **Edge CDN & Proxy** | Cloudflare Pages & Workers/Functions | External Edge | `#F38020` (Cloudflare Orange) |

---

## 2. Structural Layer-by-Layer Architecture

```mermaid
flowchart TB
    subgraph ClientLayer["1. Client Tier"]
        CLIENT["User Devices<br/>(Mobile / Desktop Web Browsers)"]
    end

    subgraph EdgeLayer["2. Cloudflare Global Edge Network"]
        PAGES["Cloudflare Pages<br/>(React 18 SPA Delivery)"]
        FUNC["Cloudflare Pages Function<br/>functions/graphql.ts<br/>(Same-Origin Reverse Proxy)"]
    end

    subgraph GCPSystem["3. Google Cloud Platform (Project: studed-prod | Region: us-central1)"]
        subgraph IngressTier["A. Ingress & Perimeter Defense Tier"]
            STATIC_IP["Static External IP<br/>8.232.85.250"]
            HTTPS_LB["Global L7 HTTPS Load Balancer<br/>(Google-Managed TLS Cert)"]
            CLOUD_ARMOR["Cloud Armor WAF<br/>• OWASP Top 10 CRS Rules<br/>• IP Rate Limit: 100 req/min<br/>• GraphQL Safe Rule"]
        end

        subgraph VPCTier["B. VPC Network (Custom Subnet: 10.0.0.0/20)"]
            ROUTER["Cloud Router"]
            NAT["Cloud NAT<br/>(Egress for Private Pods)"]

            subgraph GKECluster["GKE Standard Cluster (Zone: us-central1-a)"]
                subgraph GW_NS["Namespace: studed (Gateway Tier)"]
                    GATEWAY["api-gateway :4000<br/>(chi + gqlgen)<br/>• Complexity Limit 200<br/>• 5s/90s Context Timeouts<br/>• 15s Graceful Drain"]
                end

                subgraph SVC_NS["Namespace: studed (Microservices Tier - Private Internal)"]
                    AUTH["auth-service :8085 (gRPC)"]
                    COURSE["course-service :8083 (gRPC)"]
                    PROGRESS["progress-service :8086 (gRPC)"]
                    GAMIFICATION["gamification-service :8088 (gRPC)<br/>• Atomic XP & Award-Once"]
                    AI_SVC["ai-service :8090 (HTTP)<br/>• Gemini 1.5 Flash Integration"]
                    PAYMENT["payment-service :8091 (HTTP)<br/>• PayHere HMAC Signature"]
                    NOTIF["notification-service :8092 (HTTP)"]
                    UPLOAD["upload-service :8090 (HTTP)"]
                    USER_SVC["user-service :8082 (HTTP)"]
                end

                subgraph DATA_NS["Namespace: studed (Stateful Data Tier)"]
                    REDIS[("Redis 7.0<br/>Leaderboards & PubSub")]
                    ES[("Elasticsearch 8.x<br/>Course Search Index")]
                end

                subgraph NETSEC["Zero-Trust Pod Isolation"]
                    NP_DENY["NetworkPolicy: default-deny-all"]
                    NP_ALLOW["NetworkPolicy: ingress-gateway & service-isolation"]
                end
            end
        end

        subgraph SecurityIAM["C. Security, Identity & Secret Operations"]
            GSM["Secret Manager<br/>(8 Encrypted Secrets)"]
            WI_SA["Workload Identity SA<br/>studed-external-secrets"]
            ESO_POD["External Secrets Operator<br/>(Syncs GSM ➔ K8s Secrets)"]
        end

        subgraph AutomationTier["D. Operations & Cost Optimization"]
            CRON["Cloud Scheduler<br/>(Hourly Heartbeat)"]
            IDLE_JOB["Cloud Run Job<br/>idle-scout<br/>(Resizes GKE Nodes 2 ↔ 0)"]
        end
    end

    subgraph DatabaseTier["4. External Database Tier"]
        NEON_DB[("Neon Postgres 15<br/>(Pooled TCP / SSL Mode Required)")]
    end

    %% Flow Traces
    CLIENT -->|HTTPS| PAGES
    CLIENT -->|HTTPS| FUNC
    PAGES -->|GraphQL Fetch| FUNC
    FUNC -->|TLS Server-to-Server| STATIC_IP
    STATIC_IP --> HTTPS_LB
    HTTPS_LB --> CLOUD_ARMOR
    CLOUD_ARMOR --> GATEWAY

    GATEWAY -->|gRPC + Service Token| AUTH
    GATEWAY -->|gRPC + Service Token| COURSE
    GATEWAY -->|gRPC + Service Token| PROGRESS
    GATEWAY -->|gRPC + Service Token| GAMIFICATION
    GATEWAY -->|HTTP + Service Token| AI_SVC
    GATEWAY -->|HTTP + Service Token| PAYMENT
    GATEWAY -->|HTTP + Service Token| NOTIF
    GATEWAY <--> REDIS
    GATEWAY --> ES

    PROGRESS -->|gRPC + Timeout| COURSE
    PROGRESS -->|gRPC + Service Token| GAMIFICATION

    AUTH & COURSE & PROGRESS & GAMIFICATION & PAYMENT & NOTIF -->|SSL Pooled TCP| NEON_DB

    WI_SA -.->|IAM Accessor| GSM
    ESO_POD -->|Workload Identity| WI_SA
    ESO_POD -.->|Injects Secrets| GW_NS & SVC_NS

    CRON -->|Trigger| IDLE_JOB
    IDLE_JOB -.->|gcloud cluster resize| GKECluster
```

---

## 3. Detailed Component Technical Specifications

### Tier 1: External Edge & Ingress Security
- **Cloudflare Pages & Functions**: Delivers static asset bundle globally with sub-50ms latency. The server-to-server proxy (`functions/graphql.ts`) hides backend origin IPs and eliminates CORS constraints by proxying same-origin `/graphql` calls over TLS.
- **Google Cloud Armor WAF**: Applies pre-configured OWASP Core Rule Set (CRS) for SQL Injection (SQLi), Cross-Site Scripting (XSS), Local File Inclusion (LFI), and Remote Code Execution (RCE). Enforces an IP-level rate limit of 100 requests/minute.
- **GCE L7 Global HTTPS Load Balancer**: Handles TLS termination with Google-managed certificates (`studed-api-cert`), directing clean traffic to GKE NodePort services.

### Tier 2: GKE Compute & Microservice Mesh
- **GKE Standard Cluster**: Zonal private cluster in `us-central1-a` running two `e2-standard-2` nodes (8 vCPUs, 16 GB RAM total). Private node IPs eliminate direct internet attack surface. Outbound internet connectivity flows through Cloud NAT.
- **Default-Deny Pod Isolation**: Kubernetes `NetworkPolicy` objects block all inter-pod traffic by default. Specific policies allow ingress strictly from `api-gateway` to microservices and required gRPC channels (e.g. `progress-service` ➔ `course-service`).
- **Resilient Microservice Design**:
  - **Context Timeouts**: Outbound gRPC and HTTP client calls enforce 3s–5s deadlines for standard RPCs and 90s for AI generation.
  - **Graceful Draining**: Signal interceptors (`signal.NotifyContext`) handle `SIGTERM` on deploys, allowing a 15-second drain window before process termination.
  - **Service-to-Service Auth**: Internal gRPC and HTTP APIs validate a cryptographically random shared service token passed via metadata headers (`Authorization: Bearer <token>`).

### Tier 3: Identity & Secrets Management
- **GCP Secret Manager**: Stores 8 encrypted production secrets (`database-url`, `jwt-access-secret`, `jwt-refresh-secret`, `service-token`, `gemini-api-key`, `payhere-merchant-id`, `payhere-merchant-secret`, `payhere-notify-url`).
- **Workload Identity Integration**: Eliminates long-lived GCP service account keys inside Kubernetes. The `studed-external-secrets` Kubernetes service account maps directly to GCP IAM role `roles/secretmanager.secretAccessor`.
- **External Secrets Operator**: Continuously syncs GCP Secret Manager entries into native Kubernetes `Secret` resources in namespace `studed`.

### Tier 4: Automated Cost Control Architecture
- **`idle-scout` Engine**: An automated Cloud Run Job triggered hourly by Cloud Scheduler. It inspects GCP Cloud Monitoring metrics for frontend/backend HTTP request volume over the past 2 hours.
- **Auto-Standby & Wake**: If zero traffic is detected for 2 hours, `idle-scout` resizes the GKE node pool from `2` ➔ `0`, saving ~90% of operational node costs while preserving cluster state.
