---
title: "System Architecture"
description: "High-level system architecture diagram and component overview for StudEd."
tags:
  - architecture
  - system-design
  - backend
  - frontend
  - golang
  - graphql
  - microservices
  - studed
aliases:
  - "Architecture"
  - "System Design"
  - "High-Level Architecture"
date: 2026-06-03
---

# System Architecture

> [!abstract] Overview
> StudEd follows a modern **microservices architecture** with a decoupled React SPA frontend, a Go-based backend composed of specialized microservices, and a unified **GraphQL** gateway. AI services and file storage are integrated as external components.

## Architecture Diagram

```mermaid
graph TB
    subgraph Client
        A[Web App<br/>React SPA<br/>Vite + TanStack Router]
        B[Mobile App<br/>React Native / PWA]
    end

    subgraph "CDN / Edge"
        C[Cloudflare / CloudFront]
    end

    subgraph "API Gateway"
        D[GraphQL Gateway<br/>Go + gqlgen]
        E[REST Proxy<br/>Go + Gin<br/>Webhooks / Uploads]
    end

    subgraph "Go Microservices"
        F[Auth Service]
        G[Course Service]
        H[Content Service]
        I[Progress Service]
        J[Gamification Service]
        K[Payment Service]
        L[AI Service]
        M[Notification Service]
        N[Upload Service]
    end

    subgraph "External Services"
        O[AI / LLM<br/>Gemini / Qwen / DeepSeek]
        P[File Storage<br/>Cloudflare R2]
        Q[Payment Gateway<br/>PayHere / Stripe]
        R[Email / SMS<br/>Resend / Twilio]
    end

    subgraph "Data Layer"
        S[(Primary DB<br/>PostgreSQL)]
        T[(Cache<br/>Redis)]
        U[(Search<br/>Elasticsearch)]
    end

    A --> C
    B --> C
    C --> D
    C --> E
    D -->|gRPC| F
    D -->|gRPC| G
    D -->|gRPC| H
    D -->|gRPC| I
    D -->|gRPC| J
    D -->|gRPC| K
    D -->|gRPC| L
    D -->|gRPC| M
    E -->|HTTP| K
    E -->|HTTP| N
    F --> S
    G --> S
    H --> S
    I --> S
    J --> S
    K --> S
    L --> S
    M --> S
    J --> T
    I --> T
    M --> T
    K --> T
    G -.-> U
    H -.-> U
    N --> P
    L --> O
    K --> Q
    M --> R
```

## Component Breakdown

### 1. Client Layer

| Platform | Tech | Purpose |
|----------|------|---------|
| **Web App** | [[Tech Stack\|React SPA (Vite + TanStack Router)]] | Primary student & educator interface |
| **Mobile** | React Native / PWA | Mobile-first access for students |

### 2. API Gateway Layer

- **GraphQL Gateway:** Go service using `gqlgen`. Combines subgraphs from all microservices into a single schema. Handles JWT verification, rate limiting, and request routing via gRPC.
- **REST Proxy:** Go service using `Gin` or `Echo`. Handles REST-only traffic: payment webhooks, multipart file uploads, and third-party integrations.

### 3. Microservices Layer

| Service | Language | Responsibility |
|---------|----------|----------------|
| **Auth Service** | Go | Registration, login, JWT, RBAC |
| **Course Service** | Go | Course/Lesson/Wave CRUD |
| **Content Service** | Go | Block JSONB, media metadata |
| **Progress Service** | Go | Completion tracking, attempts |
| **Gamification Service** | Go | XP, leaderboards, proficiency |
| **Payment Service** | Go | Subscriptions, billing, webhooks |
| **AI Service** | Go | LLM proxy, prompt engineering |
| **Notification Service** | Go | Email, SMS, push notifications |
| **Upload Service** | Go | File validation & S3 streaming |

### 4. Data Layer

| Store | Role | Data |
|-------|------|------|
| **PostgreSQL** | Primary database | Each service owns its schema/tablespace |
| **Redis** | Cache & sessions | Active sessions, leaderboard ZSETs, rate limits, pub/sub events |
| **Elasticsearch** | Full-text search | Course search, Sinhala text indexing |

### 5. External Services

| Service | Provider | Purpose |
|---------|----------|---------|
| **AI / LLM** | Gemini / Qwen / DeepSeek | AI-assisted content creation in [[MDX Editor]] |
| **File Storage** | Cloudflare R2 | Images, audio, graphics for [[Learn Component]] |
| **Payments** | PayHere / Stripe | Subscription billing |
| **Notifications** | Resend / Twilio | OTP, payment confirmations, progress alerts |

## Scalability Considerations

> [!tip] Design for Scale
> - **Independent scaling:** High-traffic services (Gamification, Progress) can scale horizontally without scaling the entire backend.
> - **Database per service:** Each microservice owns its PostgreSQL schema, preventing coupling.
> - **Read replicas:** PostgreSQL read replicas for high-traffic queries (leaderboards, course browsing).
> - **CDN:** Static assets (images, audio, frontend bundles) served from edge locations.
> - **Async jobs:** Asynq + Redis for XP calculations, report generation, and email digests.
> - **gRPC efficiency:** Binary protobuf over HTTP/2 reduces latency and payload size between services.

## Security

- HTTPS everywhere. TLS between services (mTLS optional with Istio/Linkerd).
- Input validation and sanitization (critical for user-generated MDX).
- Role-based access control (RBAC) with Casbin — see [[Authentication & Authorization]].
- Encrypted storage of payment tokens (PCI compliance considerations).
- JWT verification at the API Gateway layer before requests reach microservices.

## Related Notes

- [[Frontend Architecture]] — Detailed frontend structure.
- [[Backend Architecture]] — Microservices design, inter-service communication, and Go stack.
- [[Database Schema]] — Entity relationships and table design.
- [[Authentication & Authorization]] — Security and access control.
- [[API Specifications]] — GraphQL schema + REST endpoint documentation.
- [[Tech Stack]] — Complete technology choices.