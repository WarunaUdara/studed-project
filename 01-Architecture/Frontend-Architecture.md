---
title: "Frontend Architecture"
description: "Frontend stack, component structure, and state management for StudEd."
tags:
  - architecture
  - frontend
  - react
  - tanstack
  - studed
aliases:
  - "Frontend"
  - "Client Architecture"
  - "UI Architecture"
date: 2026-06-03
---

# Frontend Architecture

> [!abstract] Overview
> The StudEd frontend is a modern, responsive **single-page application (SPA)** built with **Vite + React + TanStack Router**. It communicates with the Go backend primarily via **GraphQL**, with a **REST** fallback for webhooks and file uploads. The app is split into two primary portals: the **Student Portal** and the **Educator Portal**.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Build Tool** | Vite | Fast HMR, optimized builds, SPA output |
| **Framework** | React 18+ | Component-based UI |
| **Router** | TanStack Router | Type-safe, file-based routing, data loaders |
| **Language** | TypeScript | Type safety across the entire stack |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid, consistent UI |
| **State (Client)** | Zustand | Global state (auth, progress, editor) |
| **State (Server)** | TanStack Query | Server state, caching, background sync |
| **GraphQL Client** | urql / TanStack Query + GraphQL | Efficient data fetching, caching, subscriptions |
| **Forms** | React Hook Form + Zod | Validation |
| **Animation** | Framer Motion | Gamification animations, transitions |
| **Charts** | Recharts / Chart.js | Leaderboards, progress graphs |

## Project Structure

```
frontend/
├── src/
│   ├── routes/              # TanStack Router file-based routes
│   │   ├── (student)/       # Student portal layouts & pages
│   │   │   ├── dashboard.tsx
│   │   │   ├── courses.tsx
│   │   │   ├── lessons.$courseId.tsx
│   │   │   ├── waves.$lessonId.tsx
│   │   │   └── leaderboard.tsx
│   │   ├── (educator)/      # Educator portal layouts & pages
│   │   │   ├── dashboard.tsx
│   │   │   ├── courses.tsx
│   │   │   ├── editor.$waveId.tsx
│   │   │   └── analytics.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── __root.tsx       # Root layout
│   ├── components/
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── learn/           # Learn component blocks
│   │   ├── evaluate/        # Evaluate component blocks
│   │   ├── editor/          # MDX editor UI
│   │   ├── gamification/    # XP bars, badges, streaks
│   │   └── shared/          # Navbars, footers, loaders
│   ├── graphql/             # GraphQL queries, mutations, fragments
│   │   ├── queries/
│   │   ├── mutations/
│   │   └── subscriptions/
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utils, constants, types
│   ├── stores/              # Zustand stores
│   └── styles/              # Global CSS, Tailwind config
├── public/                  # Static assets
├── index.html               # Vite entry point
└── vite.config.ts
```

## Routing with TanStack Router

TanStack Router provides:

- **File-based routing:** Routes auto-generated from the `src/routes/` directory.
- **Type safety:** Routes are fully typed. `navigate({ to: '/courses/$courseId', params: { courseId } })` is type-checked.
- **Data loaders:** Fetch GraphQL data before the route renders, showing skeleton states while loading.
- **Nested layouts:** Shared layouts for `(student)` and `(educator)` portals.
- **Code splitting:** Automatic route-based code splitting via dynamic imports.

```typescript
// Example: TanStack Router data loader
export const Route = createFileRoute('/courses/$courseId')({
  component: CourseDetailPage,
  loader: async ({ params }) => {
    return graphqlClient.query(CourseByIdDocument, { id: params.courseId }).toPromise();
  },
});
```

## Data Fetching Strategy

### GraphQL (Primary)

- **urql** (or TanStack Query + GraphQL) fetches from the Go GraphQL gateway.
- The frontend requests exactly the fields it needs, reducing over-fetching.
- **Subscriptions** (via WebSocket) power real-time leaderboards and XP notifications.

```graphql
# Example query used by the frontend
query GetCourseWithProgress($id: ID!) {
  course(id: $id) {
    id
    title
    lessons {
      id
      title
      waves { id title status }
    }
    myProgress { completionPercent }
  }
}
```

### REST (Secondary)

- Direct REST calls for:
  - **File uploads** (multipart/form-data to upload media to the Content Service).
  - **Payment webhooks** (handled server-to-server, but frontend may poll REST status).
  - **AI stream endpoints** (if server-sent events are used for LLM streaming).

### Server State (TanStack Query)

- Wraps GraphQL operations with caching, deduping, and background refetching.
- Optimistic updates for XP gains and wave completions.
- `invalidateQueries` triggers refetch when mutations succeed.

## State Management Strategy

### Global State (Zustand)

- **Auth Store:** JWT tokens, user profile, subscription tier.
- **Progress Store:** Completed waves, lesson proficiency, current course.
- **Gamification Store:** XP total, leaderboard rank, reattempt counts.
- **Editor Store:** Active course/lesson, editor blocks, AI suggestions.

### Server State (TanStack Query)

- Courses, lessons, waves, and user progress fetched via GraphQL.
- Optimistic updates for XP gains and wave completions.
- Background refetching to keep leaderboards near real-time.

## Key Frontend Modules

### 1. Student Portal

- **Course Browser:** Grid/list view of available courses. Data from `CoursesQuery`.
- **Lesson Player:** Sidebar navigation, wave progress indicator. Loaded via nested GraphQL fragments.
- **Wave Player:** Switches between [[Learn Component]] and [[Evaluate Component]]. Uses `WaveByIdQuery`.
- **Leaderboard View:** Real-time or cached leaderboard with filters. Subscribes to `LeaderboardSubscription`.

### 2. Educator Portal

- **Course Manager:** CRUD for courses, lessons, and waves. Uses GraphQL mutations (`CreateCourseMutation`, etc.).
- **[[MDX Editor]]:** Visual component editor powered by [[Puck Research|Puck]].
- **AI Assistant Panel:** Prompt-based AI content generation. Calls the AI Service via GraphQL mutation.
- **Analytics Dashboard:** Student engagement, completion rates, XP distribution. Aggregated GraphQL queries.

## Editor Integration

> [!important] Editor is Central
> The [[MDX Editor]] is the most complex frontend component. It must:
> - Support drag-and-drop blocks.
> - Render both [[Learn Component|Learn]] blocks (text, image, audio, graphic) and [[Evaluate Component|Evaluate]] blocks (MCQ, fill-in-blank, drag-and-drop).
> - Allow AI-powered generation of content blocks (fetched via GraphQL mutation to AI Service).
> - Support [[Sinhala Language Support|Sinhala]] input and rendering.
> - Serialize blocks to JSONB and send via GraphQL mutation to the Content Service.

## Performance Targets

- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3.5s
- **Lighthouse Score:** > 90 on mobile
- **Bundle Splitting:** Route-based (TanStack Router auto-splitting) + component-based code splitting.

## Related Notes

- [[System Architecture]] — High-level system diagram.
- [[Backend Architecture]] — Go microservices layer.
- [[Design System]] — UI/UX standards and components.
- [[Student Dashboard]] — Student portal design.
- [[Educator Dashboard]] — Educator portal design.
