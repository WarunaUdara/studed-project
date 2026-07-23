---
title: "Tech Stack"
description: "Complete technology stack for frontend, backend, database, cloud emulation, and infrastructure."
tags:
  - technical
  - tech-stack
  - architecture
  - golang
  - graphql
  - kubernetes
  - opentofu
  - floci
  - studed
aliases:
  - "Stack"
  - "Technology Choices"
  - "Tools"
date: 2026-07-23
---

# Tech Stack

> [!info] Overview
> StudEd is built on a modern, scalable web stack optimized for interactive content delivery, real-time gamification, and AI-assisted content creation. The backend is a **Go-based microservices** architecture exposing **GraphQL**, **REST**, and **gRPC** interfaces, while the frontend is a high-performance React SPA powered by Vite, TanStack Router, and Bun.

---

## Frontend

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Runtime & Package Manager** | Bun | 1.x | Ultra-fast dependency installation and script runner |
| **Build Tool** | Vite | 8.x | Lightning-fast dev server, optimized Rolldown/Esbuild production bundling |
| **Framework** | React | 18+ | Component-based UI with client-side state management |
| **Router** | TanStack Router | latest | Type-safe, file-based routing and data loading |
| **Language** | TypeScript | 5.x | Comprehensive type safety across frontend |
| **Styling** | Tailwind CSS | 4.x | Utility-first styling with modern design tokens |
| **Components** | shadcn/ui + Radix UI + Base UI | latest | Accessible, unstyled UI primitives |
| **Visual Page Editor** | Puck | latest | Drag-and-drop component editor for Wave content |
| **State (Client)** | Zustand | latest | Lightweight global state store & Web Audio API Pomodoro timer |
| **State (Server)** | TanStack Query / urql | latest | GraphQL data fetching, caching, and state synchronization |
| **Math Rendering** | KaTeX | latest | Sub-millisecond mathematical notation rendering |
| **Charts** | Recharts | latest | Student progress visualization and leaderboards |
| **Forms & Validation** | React Hook Form + Zod | latest | High-performance forms and schema validation |

---

## Backend — Go Microservices

| Layer | Technology | Version | Rationale |
|-------|------------|---------|-----------|
| **Language** | Go | 1.22+ | Exceptional performance, low memory footprint (~15MB/svc) |
| **GraphQL Gateway** | gqlgen | latest | Schema-first GraphQL gateway with Go code generation |
| **gRPC** | protobuf + gRPC-Go | latest | High-performance binary inter-service communication |
| **REST Router** | stdlib + chi / Gin | latest | Lightweight REST handlers for health checks & webhooks |
| **ORM & SQL** | GORM / pgx | latest | Type-safe PostgreSQL mapping & connection pooling |
| **Validation** | go-playground/validator | latest | Struct validation for incoming DTOs |
| **Authentication** | golang-jwt | latest | HMAC SHA256 signed Access & Refresh JWT tokens |
| **Service Discovery** | Kubernetes DNS / Docker DNS | latest | Internal microservice hostname lookup (`auth-service:8081`) |

---

## Database & Data Persistence

| Service | Technology | Purpose |
|---------|------------|---------|
| **Primary DB** | PostgreSQL 15 | Relational data, user accounts, course hierarchy, wave progress |
| **Cache & PubSub** | Redis 7 | Sorted set leaderboards, session caching, focus timer states |
| **Search Engine** | Elasticsearch 8 | Full-text search and course catalog discovery |
| **Cloud Storage** | Cloudflare R2 / AWS S3 | Static assets, media uploads, and course PDFs |

---

## DevOps, Cloud Emulation & Infrastructure

| Layer | Technology | Purpose |
|---------|------------|---------|
| **Local Cloud Emulator** | Floci (v0.1.8) | 24ms cold-start local emulation for AWS S3, RDS, and ElastiCache |
| **Infrastructure as Code (IaC)** | OpenTofu (v1.12) / Terraform | Declarative cloud resource provisioning (`infra/terraform`) |
| **Kubernetes Engine** | K3s / k3d (v5.9) | Single-node local cluster orchestrated under < 1.1GB RAM budget |
| **GitOps Continuous Delivery** | ArgoCD | Automated Git-to-cluster manifest synchronization (`infra/k8s/argocd`) |
| **Ingress & Public Tunneling** | Ngrok | Single-command public HTTPS demo tunneling (`make demo-public`) |
| **Containerization** | Docker Desktop | Multi-stage Docker container builds for microservices |

---

## AI & Machine Learning

| Task | Model | Provider | Notes |
|------|-------|----------|-------|
| **Sinhala OCR, Tutor, Generation** | **Gemini 3.5 Flash** | Google AI Studio | High-speed Sinhala language processing & tutoring |
| **Pedagogy & Planning** | **Qwen 2.5 (72B)** | Self-hosted / API | Multilingual reasoning and lesson structure generation |
| **Code & Interactive Challenges** | **DeepSeek-Coder** | DeepSeek API | Interactive Python 10 Challenges question generator |

---

## Documentation Links

- [System Architecture](../01-Architecture/System-Architecture.md) — Master high-level architecture diagram.
- [Backend Architecture](../01-Architecture/Backend-Architecture.md) — Go microservices & gRPC breakdown.
- [Frontend Architecture](../01-Architecture/Frontend-Architecture.md) — React SPA and component design.
- [Database Schema](../01-Architecture/Database-Schema.md) — Relational schema & GORM models.
- [Kubernetes Guide](../infra/k8s/README.md) — Cloud-agnostic K8s & GitOps guide.
- [OpenTofu IaC Guide](../infra/terraform/README.md) — OpenTofu & Floci emulator setup.
- [Root README](../README.md) — Main repository landing page.