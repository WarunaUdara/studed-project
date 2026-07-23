---
title: "Backend Architecture"
description: "Go microservices architecture, API gateway, inter-service communication, and business logic."
tags:
  - architecture
  - backend
  - api
  - golang
  - graphql
  - microservices
  - studed
aliases:
  - "Backend"
  - "Server Architecture"
  - "API Layer"
  - "Go Architecture"
date: 2026-06-03
---

# Backend Architecture

> [!abstract] Overview
> The StudEd backend is a **Go-based microservices** architecture. Services communicate internally via **gRPC** and expose a unified **GraphQL** gateway to the frontend, with **REST** endpoints reserved for webhooks, file uploads, and third-party integrations.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Language** | Go 1.22+ | High performance, excellent concurrency, small binaries |
| **HTTP Router** | Gin / Echo / chi | Lightweight REST handlers, GraphQL HTTP transport |
| **GraphQL** | gqlgen | Schema-first GraphQL with Go code generation |
| **gRPC** | protobuf + grpc-go | Inter-service communication |
| **Service Discovery** | Consul / Kubernetes DNS | Microservice lookup |
| **ORM / DB** | GORM / sqlc | Type-safe SQL, migrations |
| **Validation** | go-playground/validator | Struct validation |
| **Auth** | golang-jwt / casbin | JWT issuance, RBAC policy engine |
| **Queue** | Asynq / Watermill + Redis | Background jobs |
| **WebSocket** | gorilla/websocket | Real-time subscriptions |
| **API Gateway** | Kong / Traefik / custom Go | External routing, rate limiting, auth |

## Microservices Layout

```mermaid
graph TB
    subgraph "Client Layer"
        A[React SPA<br/>GraphQL + WebSocket]
    end

    subgraph "Edge / Gateway"
        B[API Gateway (Go + gqlgen)<br/>Port 8080]
    end

    subgraph "Go Microservices (gRPC)"
        D[Auth Service (Port 8081/8085)]
        F[Course Service (Port 8083/8084)]
        H[Progress Service (Port 8086/8087)]
        I[Gamification Service (Port 8088/8089)]
        J[Payment Service (Port 8091)]
        K[AI Service (Port 8090)]
        L[Notification Service (Port 8092)]
        M[Upload Service (Port 8096)]
    end

    subgraph "Data Layer"
        N[(PostgreSQL 15)]
        O[(Redis 7 Cache & Leaderboard)]
        P[(Elasticsearch 8)]
    end

    subgraph "External Integration"
        Q[PayHere / Stripe]
        R[Gemini 3.5 Flash]
        S[Resend / Twilio]
        T[Cloudflare R2 / S3]
    end

    A -->|GraphQL Queries / Mutations| B
    B -->|gRPC| D
    B -->|gRPC| F
    B -->|gRPC| H
    B -->|gRPC| I
    B -->|gRPC| J
    B -->|gRPC| K

    D --> N
    F --> N
    F --> P
    H --> N
    I --> N
    I --> O
    F -.-> P
    G -.-> P

    J --> Q
    K --> R
    L --> S
```

## Why Go + Microservices?

| Benefit | How StudEd Leverages It |
|---------|------------------------|
| **Concurrency** | Goroutines handle thousands of simultaneous WebSocket connections for leaderboards. |
| **Performance** | Low-latency GraphQL responses even under high student traffic. |
| **Small Binaries** | Docker images are tiny, enabling fast CI/CD and low memory footprint per service. |
| **Type Safety** | Go's strict typing prevents entire classes of runtime errors in a financial/ educational system. |
| **Independent Deploy** | Each microservice can be deployed, scaled, and rolled back independently. |
| **Team Scalability** | Different teams can own different services without blocking each other. |

## API Gateway Layer

The **API Gateway** is the single entry point for all client traffic:

| Responsibility | Implementation |
|----------------|----------------|
| **GraphQL Federation** | Combines subgraphs from each microservice into one unified schema. |
| **REST Proxy** | Routes `/webhooks/*` to Payment Service, `/upload/*` to Upload Service. |
| **Authentication** | Verifies JWT, attaches `userId` and `role` to gRPC metadata. |
| **Rate Limiting** | Per-user and per-tier limits (Redis-backed). |
| **Request Routing** | Routes GraphQL operations to the correct downstream service via gRPC. |

> [!tip] GraphQL Federation
> Each microservice owns a piece of the GraphQL schema (subgraph). The gateway stitches them together.
> Example: `CourseService` owns `Course`, `Lesson`, `Wave` types. `UserService` owns `User` type. The gateway composes them.

## Core Microservices

### 1. Auth Service

- User registration, login, logout.
- JWT issuance (access + refresh) using `golang-jwt`.
- Password reset, OTP verification.
- Role management (`student`, `educator`, `admin`).
- **Exposes:** gRPC + GraphQL mutations (`register`, `login`, `refreshToken`).

### 2. User Service

- Profile CRUD.
- Subscription tier and status.
- Preferences (language, grade).
- **Exposes:** gRPC + GraphQL queries/mutations (`me`, `updateProfile`).

### 3. Course Service

- CRUD for [[Course-Lesson-Wave-Hierarchy|Courses, Lessons, and Waves]].
- Content versioning (educator drafts vs. published).
- Publishing workflow.
- **Exposes:** gRPC + GraphQL types (`Course`, `Lesson`, `Wave`).

### 4. Content Service

- Stores and serves [[Learn Component]] and [[Evaluate Component]] block JSONB.
- Media asset metadata (actual files in Cloudflare R2).
- MDX block schema validation before save.
- **Exposes:** gRPC + GraphQL. Also handles REST multipart uploads via Upload Service.

### 5. Progress Service

- Tracks wave completion, lesson proficiency, course progress.
- Stores student answers and attempt history.
- Calculates proficiency percentages.
- Emits domain events (`WaveCompleted`, `LessonProficient`) to Redis pub/sub.
- **Exposes:** gRPC + GraphQL queries/mutations + event stream.

### 6. Gamification Service

- Listens to `WaveCompleted` events from Progress Service.
- [[XP-System|XP calculation]], [[Leaderboards|leaderboard]] aggregation, [[Reattempt Mechanics|reattempt]] tracking.
- Maintains Redis sorted sets for real-time leaderboards.
- **Exposes:** gRPC + GraphQL queries/subscriptions (`leaderboard`, `xpGained` subscription).

### 7. Payment Service

- Subscription creation, renewal, cancellation.
- Webhook handling from PayHere / Stripe (**REST endpoints**).
- Invoice generation and billing history.
- Access gating based on active subscription.
- **Exposes:** REST webhooks + gRPC/GraphQL for internal queries.

### 8. AI Service

- Proxy to open-source LLM APIs (Gemini, Qwen, DeepSeek) with Go HTTP client.
- Prompt engineering for [[AI Integration|educator content generation]].
- Rate limiting and cost monitoring per educator.
- Response formatting (LLM text → JSONB editor blocks).
- **Exposes:** gRPC + GraphQL mutations (`generateLearnBlocks`, `generateEvaluateBlocks`).

### 9. Notification Service

- Email (Resend).
- SMS (Twilio / local gateway).
- Push notifications (Firebase).
- Listens to domain events and sends notifications.
- **Exposes:** gRPC (triggered by events) + GraphQL queries (`myNotifications`).

### 10. Upload Service

- Handles multipart file uploads directly from the frontend.
- Validates file type, size, virus scan.
- Streams to Cloudflare R2 and returns CDN URL.
- **Exposes:** REST endpoint (`POST /upload`).

## Inter-Service Communication

| Pattern | Use Case | Tech |
|---------|----------|------|
| **Synchronous (gRPC)** | Immediate queries (e.g., gateway asks Course Service for a Wave) | gRPC with protobuf |
| **Asynchronous (Events)** | Domain events (e.g., Progress Service emits `WaveCompleted`, Gamification listens) | Redis pub/sub or NATS / RabbitMQ |
| **REST (External)** | Webhooks from payment providers | Gin/Echo handlers |

### Event Bus (Redis Pub/Sub or NATS)

```
WaveCompleted
  └── Gamification Service → calculate XP
  └── Notification Service → send congratulatory email
  └── Leaderboard Service → update Redis sorted set

PaymentSucceeded
  └── Payment Service → update subscription
  └── Notification Service → send receipt email
  └── User Service → unlock courses
```

## Database Per Service

> [!warning] Data Ownership
> Each microservice owns its data. Direct cross-service DB queries are forbidden.
> - **Course Service** owns the `courses`, `lessons`, `waves` tables.
> - **Progress Service** owns the `progress`, `attempts` tables.
> - **User Service** owns the `users`, `profiles` tables.
> - **Payment Service** owns the `subscriptions`, `payments`, `invoices` tables.
>
> Shared read models (e.g., leaderboard snapshots) can be replicated or cached in Redis.

## Background Jobs (Asynq / Watermill)

| Job | Trigger | Handler |
|-----|---------|---------|
| **XP Recalculation** | `WaveCompleted` event | Update total XP, check rank change |
| **Leaderboard Refresh** | Scheduled / Event | Aggregate top N users per course/grade into Redis |
| **Email Digest** | Daily cron | Send progress/streak reminders |
| **Report Generation** | Admin request | Compile CSV/PDF analytics |
| **Subscription Reminder** | 3 days before expiry | Send renewal email/SMS |
| **AI Cost Report** | Daily | Aggregate LLM usage per educator |

## Error Handling & Logging

- **Structured logging:** `uber-go/zap` with correlation IDs propagated via gRPC metadata.
- **Centralized log aggregation:** Grafana Loki or Datadog.
- **Error tracking:** Sentry integration per microservice.
- **Distributed tracing:** OpenTelemetry + Jaeger/Tempo to trace a request across services.

## Deployment

| Environment | Setup |
|-------------|-------|
| **Development** | Docker Compose with all services, hot-reload via `air` (Go live reload). |
| **Staging** | Kubernetes cluster (minikube or cloud), CI/CD from `develop` branch. |
| **Production** | Managed Kubernetes (EKS/GKE) or Fly.io / AWS ECS with auto-scaling per service. |

## Related Notes

- [[System Architecture]] — Full system diagram.
- [[Frontend Architecture]] — Client-side structure.
- [[Database Schema]] — Data model and relationships per service.
- [[API Specifications]] — GraphQL schema + REST endpoints.
- [[Authentication & Authorization]] — Security model.
- [[Tech Stack]] — Complete technology choices.