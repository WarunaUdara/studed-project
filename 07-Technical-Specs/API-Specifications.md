---
title: "API Specifications"
description: "GraphQL schema, REST endpoints, WebSocket subscriptions, and gRPC definitions for StudEd."
tags:
  - technical
  - api
  - graphql
  - rest
  - grpc
  - websocket
  - backend
  - studed
aliases:
  - "API Docs"
  - "Endpoints"
  - "API Design"
  - "GraphQL Schema"
date: 2026-06-03
---

# API Specifications

> [!info] Purpose
> StudEd exposes a **dual API surface**:
> - **GraphQL** (`/graphql`) — Primary API for the React SPA. Flexible queries, mutations, and real-time subscriptions.
> - **REST** (`/api/v1/...` + `/webhooks/...`) — Used for payment webhooks, file uploads, and third-party integrations.
> - **gRPC** — Internal-only. High-performance communication between Go microservices.

## Base URLs

```
GraphQL:     https://api.studed.lk/graphql
REST API:    https://api.studed.lk/api/v1
Webhooks:    https://api.studed.lk/webhooks/...
WebSocket:   wss://api.studed.lk/graphql  (GraphQL subscriptions)
```

## Authentication

All GraphQL and REST requests (except public catalog and webhooks) require a Bearer token:

```http
Authorization: Bearer <jwt_access_token>
```

The JWT is verified at the API Gateway and propagated to microservices via gRPC metadata.

---

## GraphQL Schema (Primary)

### Types

```graphql
type User {
  id: ID!
  email: String!
  fullName: String!
  role: Role!
  grade: Grade
  preferredLanguage: String!
  subscription: Subscription
  totalXp: Int!
  createdAt: DateTime!
}

type Course {
  id: ID!
  title: String!
  description: String!
  slug: String!
  gradeLevel: Grade!
  educator: User!
  price: Float
  isPublished: Boolean!
  lessons: [Lesson!]!
  myProgress: CourseProgress
  createdAt: DateTime!
}

type Lesson {
  id: ID!
  course: Course!
  title: String!
  sequenceOrder: Int!
  waves: [Wave!]!
  isPublished: Boolean!
}

type Wave {
  id: ID!
  lesson: Lesson!
  title: String!
  sequenceOrder: Int!
  xpReward: Int!
  maxReattempts: Int!
  passingThreshold: Int!
  estimatedDuration: Int!
  difficulty: Difficulty!
  learnBlocks: [LearnBlock!]!
  evaluateBlocks: [EvaluateBlock!]!
  myProgress: WaveProgress
  isPublished: Boolean!
}

type WaveProgress {
  status: ProgressStatus!
  attemptsCount: Int!
  highestScore: Int
  completedAt: DateTime
  lastAttemptedAt: DateTime
}

type LeaderboardEntry {
  rank: Int!
  user: User!
  totalXp: Int!
  course: Course
}

type Subscription {
  id: ID!
  tier: Tier!
  status: SubscriptionStatus!
  startDate: DateTime!
  endDate: DateTime!
}

enum Role { STUDENT EDUCATOR HEAD_EDUCATOR ADMIN }
enum Grade { G1 G2 G3 G4 G5 G6 G7 G8 G9 G10 G11 OL AL }
enum Difficulty { EASY MEDIUM HARD }
enum ProgressStatus { LOCKED AVAILABLE STARTED COMPLETED }
enum Tier { BASIC STANDARD PREMIUM SCHOOL }
enum SubscriptionStatus { ACTIVE CANCELED EXPIRED }
```

### Queries

```graphql
type Query {
  me: User!
  
  courses(filter: CourseFilter, pagination: PaginationInput): CourseConnection!
  course(id: ID!): Course
  
  lesson(id: ID!): Lesson
  wave(id: ID!): Wave
  
  progress(courseId: ID): [LessonProgress!]!
  waveProgress(waveId: ID!): WaveProgress
  
  leaderboard(scope: LeaderboardScope!, courseId: ID, grade: Grade): [LeaderboardEntry!]!
  myRank(scope: LeaderboardScope!, courseId: ID): Int
  
  achievements: [Achievement!]!
}

input CourseFilter {
  grade: Grade
  subject: String
  search: String
  isPublished: Boolean
}

input PaginationInput {
  first: Int = 20
  after: String
}

type CourseConnection {
  edges: [CourseEdge!]!
  pageInfo: PageInfo!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

### Mutations

```graphql
type Mutation {
  # Auth
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  refreshToken(refreshToken: String!): AuthPayload!
  logout: Boolean!
  
  # Course / Content (educator)
  createCourse(input: CreateCourseInput!): Course!
  updateCourse(id: ID!, input: UpdateCourseInput!): Course!
  publishCourse(id: ID!): Course!
  createLesson(courseId: ID!, input: CreateLessonInput!): Lesson!
  createWave(lessonId: ID!, input: CreateWaveInput!): Wave!
  updateWave(id: ID!, input: UpdateWaveInput!): Wave!
  
  # Student interaction
  submitWaveAnswers(waveId: ID!, answers: [AnswerInput!]!): WaveResult!
  enrollInCourse(courseId: ID!): Course!
  
  # AI
  generateLearnBlocks(prompt: String!, language: String, grade: Grade): [LearnBlock!]!
  generateEvaluateBlocks(content: String!, count: Int = 3): [EvaluateBlock!]!
  translateContent(content: String!, targetLanguage: String!): String!
  
  # Payment
  createSubscription(input: CreateSubscriptionInput!): Subscription!
  cancelSubscription: Subscription!
}

type AuthPayload {
  accessToken: String!
  refreshToken: String!
  user: User!
}

type WaveResult {
  score: Int!
  xpEarned: Int!
  totalXp: Int!
  passed: Boolean!
  remainingAttempts: Int
  feedback: [QuestionFeedback!]!
}
```

### Subscriptions

```graphql
type Subscription {
  leaderboardUpdated(scope: LeaderboardScope!, courseId: ID): LeaderboardEntry!
  xpGained: XpEvent!
  achievementUnlocked: Achievement!
  waveCompleted: WaveProgress!
}

type XpEvent {
  waveId: ID!
  amount: Int!
  totalXp: Int!
  reason: String!
}
```

---

## REST Endpoints (Secondary)

### File Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/upload` | Multipart file upload (image, audio). Returns CDN URL. |

### Payment Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhooks/payhere` | PayHere payment callback |
| `POST` | `/webhooks/stripe` | Stripe webhook events |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/ready` | Kubernetes readiness probe |
| `GET` | `/metrics` | Prometheus metrics |

---

## gRPC Definitions (Internal)

```protobuf
syntax = "proto3";

service AuthService {
  rpc Register(RegisterRequest) returns (AuthResponse);
  rpc Login(LoginRequest) returns (AuthResponse);
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
}

service CourseService {
  rpc GetCourse(GetCourseRequest) returns (Course);
  rpc ListCourses(ListCoursesRequest) returns (stream Course);
  rpc CreateCourse(CreateCourseRequest) returns (Course);
}

service ProgressService {
  rpc RecordAttempt(RecordAttemptRequest) returns (AttemptResponse);
  rpc GetProgress(GetProgressRequest) returns (Progress);
  rpc StreamProgressEvents(ProgressEventFilter) returns (stream ProgressEvent);
}

service GamificationService {
  rpc CalculateXp(CalculateXpRequest) returns (XpResponse);
  rpc GetLeaderboard(GetLeaderboardRequest) returns (LeaderboardResponse);
  rpc SubscribeLeaderboard(LeaderboardFilter) returns (stream LeaderboardUpdate);
}

service PaymentService {
  rpc CreateSubscription(CreateSubscriptionRequest) returns (Subscription);
  rpc ProcessWebhook(WebhookPayload) returns (WebhookResponse);
}

service AiService {
  rpc GenerateLearnBlocks(GenerateRequest) returns (BlockList);
  rpc GenerateEvaluateBlocks(GenerateRequest) returns (BlockList);
}
```

> [!tip] gRPC Gateway
> The API Gateway translates incoming GraphQL operations into gRPC calls to the appropriate microservice.
> REST webhooks bypass GraphQL and go directly to the relevant service.

---

## WebSocket Events (GraphQL Subscriptions)

Connection: `wss://api.studed.lk/graphql`

### Client → Server (GraphQL Subscriptions)

| Operation | Variables | Description |
|-----------|-----------|-------------|
| `subscription Leaderboard` | `{ scope, courseId }` | Subscribe to leaderboard changes |
| `subscription XpGained` | — | Listen for XP events |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `leaderboardUpdated` | `{ rank, user, totalXp }` | Real-time rank changes |
| `xpGained` | `{ waveId, amount, totalXp }` | XP awarded notification |
| `achievementUnlocked` | `{ achievementId, name }` | New badge earned |

---

## Rate Limits

| Tier | GraphQL Complexity / Minute | REST Requests / Minute | AI Requests / Day |
|------|------------------------------|------------------------|-------------------|
| Free / Trial | 1,000 | 60 | 10 |
| Basic | 3,000 | 120 | 50 |
| Standard | 10,000 | 300 | 200 |
| Premium | 50,000 | 600 | 500 |

> [!warning] GraphQL Complexity
> GraphQL queries are rate-limited by **complexity score** (depth × field count), not just request count. This prevents expensive nested queries from overwhelming the backend.

## Pagination

GraphQL uses **cursor-based pagination** via the Relay specification:

```graphql
query {
  courses(first: 20, after: "eyJpZCI6IjEyMyJ9") {
    edges {
      node { id title }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

## Related Notes

- [[Backend Architecture]] — Go microservices design.
- [[Authentication & Authorization]] — Security and RBAC.
- [[Payment Integration]] — Payment flow and webhook details.
- [[AI Integration]] — AI service design.
- [[Database Schema]] — Data model backing the GraphQL types.
- [[Tech Stack]] — gqlgen, urql, and gRPC tooling.