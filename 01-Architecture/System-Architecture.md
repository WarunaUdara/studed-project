---
title: "System Architecture"
description: "High-level system architecture diagram, microservices breakdown, and infrastructure topology for StudEd."
tags:
  - architecture
  - system-design
  - backend
  - frontend
  - golang
  - graphql
  - microservices
  - kubernetes
  - opentofu
  - floci
  - studed
aliases:
  - "Architecture"
  - "System Design"
  - "High-Level Architecture"
date: 2026-07-23
---

# System Architecture

> [!abstract] Executive Overview
> **StudEd** is engineered as a cloud-agnostic, microservices-driven platform combining a high-performance **React SPA frontend**, a decoupled **Go 1.22+ backend microservices mesh**, a unified **GraphQL Gateway**, and local cloud emulation via **Floci** and **OpenTofu IaC**. It is fully containerized for lightweight local development on 16GB RAM machines using **k3d (K3s)**, and ready for automated continuous delivery via **ArgoCD GitOps**.

---

## 🏗️ Master System Architecture Diagram

```mermaid
graph TB
    subgraph Client_Tier ["📱 Client Tier (Web & Mobile)"]
        ReactApp["React 18 SPA (Vite + TypeScript)<br/>• TanStack Router (File-based Routing)<br/>• Tailwind CSS v4 + shadcn/ui<br/>• Puck Component Page Builder<br/>• Zustand Pomodoro Engine (Web Audio API)<br/>• KaTeX Math Renderer & Recharts"]
    end

    subgraph Ingress_Tier ["🌐 Ingress & Edge Layer"]
        Ngrok["Ngrok Ingress Tunnel<br/>(Public HTTPS Demo - mumps-lapel-rinsing.ngrok-free.dev)"]
        K8sIngress["Kubernetes Ingress / Traefik<br/>(SSL Offloading & Route Rules)"]
    end

    subgraph Gateway_Tier ["🚪 API Gateway Tier"]
        APIGateway["Go GraphQL API Gateway (Port 8080)<br/>• gqlgen GraphQL Schema Execution<br/>• JWT Bearer Token Middleware<br/>• Health & Readiness Endpoints<br/>• gRPC Client Connection Pool"]
    end

    subgraph Service_Tier ["⚡ Go Microservices Mesh (gRPC Internal / HTTP Edge)"]
        AuthSvc["Auth Service (Port 8081/8085)<br/>• User Auth, Password Hashing<br/>• JWT Access & Refresh Tokens<br/>• RBAC Role Management"]
        CourseSvc["Course Service (Port 8083/8084)<br/>• Course → Lesson → Wave Engine<br/>• Learn & Evaluate Phase Content<br/>• Puck Page Block Validation"]
        ProgressSvc["Progress Service (Port 8086/8087)<br/>• Wave Completion Verification<br/>• Quiz Grading & Accuracy Calc<br/>• Student Progress Metrics"]
        GamifySvc["Gamification Service (Port 8088/8089)<br/>• Global & School Leaderboards<br/>• XP Calculation (+10 XP Focus)<br/>• Daily Streaks & Badges"]
        AISvc["AI Service (Port 8090)<br/>• Gemini 3.5 Flash AI Tutor<br/>• Sinhala Content Generator<br/>• Practice Challenge Engine"]
        PaymentSvc["Payment Service (Port 8091)<br/>• Stripe / PayHere Integration<br/>• Subscription Tiers & Billing"]
        NotifySvc["Notification Service (Port 8092)<br/>• Email & Push Reminders<br/>• Streak Warning Alerts"]
        UploadSvc["Upload Service (Port 8096)<br/>• Media & Asset Processing"]
    end

    subgraph Data_Tier ["💾 Data & Search Tier"]
        PostgresDB[(PostgreSQL 15<br/>Relational Data, Users,<br/>Courses, Progress)]
        RedisCache[(Redis 7<br/>Leaderboard Sorted Sets,<br/>Pub/Sub, Session Cache)]
        ElasticSearch[(Elasticsearch 8<br/>Full-Text Course &<br/>Wave Discovery)]
        Storage[(Cloudflare R2 / S3<br/>Multimedia & PDF Storage)]
    end

    subgraph Infra_Tier ["🛠️ Cloud Emulation & DevOps Infrastructure"]
        Floci["Floci Local Cloud Emulator<br/>(24ms AWS S3, RDS & ElastiCache)"]
        OpenTofu["OpenTofu IaC (infra/terraform)<br/>Modular Provisioning"]
        K8sCluster["Kubernetes Cluster (k3d/K3s)<br/>Resource Budget < 1.1GB RAM"]
        ArgoCD["ArgoCD GitOps<br/>Automated Git Sync"]
    end

    %% Client and Ingress flow
    ReactApp -->|HTTP/2 / HTTPS| Ngrok
    ReactApp -->|HTTP/2 / HTTPS| K8sIngress
    Ngrok --> APIGateway
    K8sIngress --> APIGateway

    %% Gateway to Microservices (gRPC)
    APIGateway -->|gRPC| AuthSvc
    APIGateway -->|gRPC| CourseSvc
    APIGateway -->|gRPC| ProgressSvc
    APIGateway -->|gRPC| GamifySvc
    APIGateway -->|gRPC| AISvc
    APIGateway -->|gRPC| PaymentSvc

    %% Service to Service gRPC dependencies
    ProgressSvc -->|gRPC| CourseSvc
    ProgressSvc -->|gRPC| GamifySvc
    CourseSvc -->|gRPC| AuthSvc

    %% Service to Data Storage
    AuthSvc --> PostgresDB
    CourseSvc --> PostgresDB
    CourseSvc --> ElasticSearch
    ProgressSvc --> PostgresDB
    GamifySvc --> PostgresDB
    GamifySvc --> RedisCache
    PaymentSvc --> PostgresDB
    UploadSvc --> Storage

    %% DevOps & IaC Mapping
    OpenTofu -.->|Targets| Floci
    ArgoCD -.->|Deploys| K8sCluster
```

---

## 🧩 Architectural Layers Breakdown

### 1. Client Tier (Frontend SPA)
- **Framework**: Built with **Vite**, **React 18**, and **TypeScript 5**.
- **Routing**: **TanStack Router** provides type-safe, file-based routing.
- **Styling & UI**: **Tailwind CSS v4** coupled with **shadcn/ui** and **Base UI** primitives.
- **Visual Course Builder**: Integrates **Puck** drag-and-drop page editor for content creation.
- **Focus & Gamification Engine**: Built-in **Zustand** state store for Pomodoro focus timers featuring Web Audio API ambient sounds (ADHD Binaural beats, Brownian rain, Ocean breeze) and dynamic +10 XP rewards.

### 2. API Gateway & Ingress Tier
- **GraphQL API Gateway**: Built with Go using `gqlgen`. Consolidates downstream microservices into a unified GraphQL schema.
- **Authentication**: Validates JWT Bearer tokens issued by `auth-service`.
- **Public Tunnel Ingress**: Integrated with **Ngrok** (`make demo-public`) for instant, credential-free live public previews on static dev domains (`mumps-lapel-rinsing.ngrok-free.dev`).

### 3. Go Microservices Mesh
The backend is split into 8 microservices communicating internally via **gRPC (protobuf)**:
1. [Auth Service](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/auth-service): Manages student/educator accounts, bcrypt password hashing, and JWT tokens.
2. [Course Service](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/course-service): Manages the **Course → Lesson → Wave** curriculum hierarchy and Puck visual blocks.
3. [Progress Service](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/progress-service): Tracks wave completions, quiz evaluation accuracy, and student progression.
4. [Gamification Service](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/gamification-service): Manages XP calculations, Redis-backed leaderboards, streaks, and badges.
5. [Payment Service](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/payment-service): Handles Stripe and PayHere billing workflows.
6. [AI Service](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/ai-service): Integrates Gemini 3.5 Flash for AI tutoring, practice question generation, and Sinhala content translation.
7. [Notification Service](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/notification-service): Delivers automated student alerts.
8. [Upload Service](file:///Users/warunaudarasampath/Documents/projects/studed/studed-doc/services/upload-service): Manages media processing and storage upload signatures.

### 4. Data & Persistence Tier
- **PostgreSQL 15**: Primary relational database storing core platform state.
- **Redis 7**: High-performance in-memory cache, pub/sub broker, and sorted set leaderboards.
- **Elasticsearch 8**: High-speed search index for course and wave catalog discovery.

### 5. DevOps, Cloud Emulation & GitOps Infrastructure
- **Local Cloud Emulation**: Uses **Floci** (`http://localhost:4566`) to emulate AWS S3, RDS, and ElastiCache in **24ms cold-start** without cloud costs or credentials.
- **Infrastructure as Code (IaC)**: Provisioned via **OpenTofu** (`infra/terraform/`).
- **Kubernetes (K3s/k3d)**: Single-node local cluster manifest suite (`infra/k8s/`) memory-tuned for **16GB Mac/PC laptops (<1.1GB RAM total cluster footprint)**.
- **GitOps Continuous Delivery**: Configured via **ArgoCD** (`infra/k8s/argocd/application.yaml`) for declarative GitHub repository deployment synchronization.

---

## 🔗 Architecture & Technical Documentation Index

- [Backend Architecture](Backend-Architecture.md) — Detailed Go microservices & gRPC specs.
- [Frontend Architecture](Frontend-Architecture.md) — React SPA, routing, state management & UI design system.
- [Database Schema](Database-Schema.md) — PostgreSQL models, GORM schema, and indexes.
- [Tech Stack](../07-Technical-Specs/Tech-Stack.md) — Full technology choices & version inventory.
- [API Specifications](../07-Technical-Specs/API-Specifications.md) — GraphQL schema and REST endpoints.
- [Kubernetes Architecture](../infra/k8s/README.md) — K8s manifests, resource limits & ArgoCD setup.
- [OpenTofu IaC Setup](../infra/terraform/README.md) — IaC modules & Floci emulation guide.
- [Root Project README](../README.md) — Main landing page & quickstart.