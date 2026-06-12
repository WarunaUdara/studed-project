---
title: "Tech Stack"
description: "Complete technology stack for frontend, backend, database, and infrastructure."
tags:
  - technical
  - tech-stack
  - architecture
  - golang
  - graphql
  - studed
aliases:
  - "Stack"
  - "Technology Choices"
  - "Tools"
date: 2026-06-03
---

# Tech Stack

> [!info] Overview
> StudEd is built on a modern, scalable web stack optimized for interactive content delivery, real-time gamification, and AI-assisted content creation. The backend is a **Go-based microservices** architecture exposing both **GraphQL** and **REST** APIs, while the frontend is a lightweight React SPA powered by TanStack Router.

## Frontend

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Build Tool** | Vite | 5+ | Fast dev server, optimized builds, SPA-friendly |
| **Framework** | React | 18+ | Component-based UI |
| **Router** | TanStack Router | latest | Type-safe, file-based routing, data loading |
| **Language** | TypeScript | 5.x | Type safety, DX |
| **Styling** | Tailwind CSS | 3.x | Utility-first, rapid development |
| **Components** | shadcn/ui + Radix | latest | Accessible, customizable primitives |
| **State (Client)** | Zustand | latest | Lightweight global state |
| **State (Server)** | TanStack Query | 5.x | Server state, caching, background sync |
| **Animation** | Framer Motion | latest | Declarative animations |
| **Charts** | Recharts | latest | Leaderboards, progress graphs |
| **Forms** | React Hook Form + Zod | latest | Performance, validation |
| **Editor** | Puck | latest | Visual component editor for Wave content |
| **GraphQL Client** | urql / TanStack Query + GraphQL | latest | Efficient GraphQL data fetching |

## Backend — Go Microservices

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Language** | Go | 1.22+ | High performance, excellent concurrency, small binaries |
| **Framework** | Gin / Echo / stdlib + chi | latest | Lightweight HTTP routers for REST & GraphQL |
| **GraphQL** | gqlgen | latest | Schema-first GraphQL with Go code generation |
| **REST** | Gin / Echo handlers | latest | Webhooks, payment callbacks, third-party integrations |
| **gRPC** | protobuf + gRPC-Go | latest | High-performance inter-service communication |
| **ORM / DB** | GORM / sqlc | latest | Type-safe SQL, migrations |
| **Validation** | go-playground/validator | latest | Struct validation |
| **Auth** | golang-jwt / casbin | latest | JWT issuance, RBAC policy engine |
| **Queue** | Asynq / Watermill + Redis | latest | Background jobs in Go |
| **WebSocket** | gorilla/websocket / melody | latest | Real-time leaderboards |
| **API Gateway** | Kong / Traefik / custom Go | latest | Route to microservices, rate limiting |

## API Strategy

> [!info] Dual API Surface
> StudEd exposes two API interfaces to maximize flexibility:
> - **GraphQL** (`/graphql`) — Primary API for the React SPA. Frontend requests exactly the data it needs.
> - **REST** (`/api/v1/...`) — Used for webhooks (payments), third-party integrations, and simple CRUD where GraphQL is unnecessary.
> - **gRPC** — Internal-only. Used for fast inter-service communication between Go microservices.

## Database & Storage

| Service | Technology | Purpose |
|---------|------------|---------|
| **Primary DB** | PostgreSQL 15+ | Relational data, ACID compliance |
| **Cache** | Redis 7+ | Sessions, leaderboard cache, rate limits, job queues |
| **Search** | Elasticsearch 8+ | Full-text search, Sinhala tokenization |
| **Object Storage** | Cloudflare R2 | Images, audio, graphics, Manim MP4s, file backups |
| **CDN** | Cloudflare | Static assets, media delivery, edge caching |

## AI / LLM

> [!info] Open-Source First
> StudEd uses **open-source and accessible AI models** to keep costs low and avoid vendor lock-in.

| Task | Model | Provider | Notes |
|------|-------|----------|-------|
| **Sinhala OCR, text, translation** | **Gemini 3.5 Flash** | Google AI Studio | Fast, free tier available, excellent Sinhala script handling |
| **General pedagogy, planning** | **Qwen 2.5 (72B)** | Alibaba Cloud / Self-hosted | Open-weights, strong reasoning, multilingual |
| **Code generation (Manim, 3Dmol, tscircuit, Matter.js)** | **DeepSeek-V3 / DeepSeek-Coder** | DeepSeek API / Self-hosted | State-of-the-art code generation, very low cost |
| **Local fallback (all tasks)** | **Qwen 2.5 (7B/14B)** | Ollama / vLLM | Self-hosted for privacy, offline environments |
| **Embeddings** | **BGE-M3** | HuggingFace / Xorbits | Open-source multilingual embeddings |

> [!tip] Model Routing
> The AI Service routes requests based on task type and language. Sinhala tasks always hit Gemini 3.5 Flash. Code generation routes to DeepSeek-Coder. General pedagogy routes to Qwen 2.5. All models are accessed via standard HTTP APIs from Go.

## DevOps & Infrastructure

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Containerization** | Docker | Development & deployment |
| **Orchestration** | Docker Compose (dev) / Kubernetes (prod) | Microservices orchestration |
| **Service Mesh** | Istio / Linkerd (future) | Traffic management, observability |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Hosting** | Cloudflare Pages (frontend SPA) / Fly.io (Go services) | Serverless / managed containers |
| **Monitoring** | Sentry (errors) + Prometheus + Grafana (metrics) | Observability |
| **Logs** | Grafana Loki | Centralized logging |
| **Tracing** | Jaeger / Tempo | Distributed tracing across microservices |

## Third-Party Integrations

| Service | Provider | Purpose |
|---------|----------|---------|
| **Payments** | PayHere / Stripe | Subscription billing |
| **Email** | Resend | Transactional emails (welcome, receipts, notifications) |
| **SMS** | Twilio / local gateway | OTP, notifications |
| **Push** | Firebase Cloud Messaging | Mobile push notifications |

## Related Notes

- [[Frontend Architecture]] — Detailed frontend structure.
- [[Backend Architecture]] — Detailed backend structure.
- [[Database Schema]] — Data model design.
- [[System Architecture]] — High-level system diagram.
- [[Development Plan]] — Git submodules, branch strategy, and development workflow.