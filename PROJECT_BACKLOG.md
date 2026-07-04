# StudEd Shared Backlog

This file tracks active and upcoming work across all development agents.
Update your row when you start or finish a task so others avoid duplication.

## Rules

- Add a task before starting work if it is not already listed.
- Set status to `IN_PROGRESS` while working and `DONE` when merged.
- If a task is `BLOCKED`, note the blocker and the agent who can unblock it.
- Keep commits small and focused; one logical change per commit.

## Active Work

| ID | Task | Owner | Status | Blocker | Notes |
|----|------|-------|--------|---------|-------|
| A-1 | Sync shared GraphQL schema with api-gateway | A | DONE | - | Merged |
| A-2 | Scope educator course list to authenticated user | A | DONE | - | Merged |
| A-3 | Local dev orchestration (scripts, Makefile, env examples) | A | DONE | - | `make dev` and `make dev-stop` added |
| A-4 | Update README local development instructions | A | DONE | - | Merged |
| A-5 | Implement `UpdateCourse` GraphQL resolver + frontend edit | A | IN_PROGRESS | - | gRPC method already added by another agent |
| B-1 | Dockerize auth/course/api-gateway services | B/C | IN_PROGRESS | - | Dockerfiles and compose changes are local but uncommitted |
| C-1 | Implement `progress-service` schema + gRPC | C | NOT_STARTED | - | Blocks `submitWaveAnswers` |
| C-2 | Implement `gamification-service` XP + leaderboard | C | NOT_STARTED | - | Depends on progress-service |

## Backlog

| Priority | Task | Dependencies | Required For |
|----------|------|--------------|--------------|
| High | Implement `submitWaveAnswers` resolver | progress-service, gamification-service | MVP demo |
| High | Student wave-taking UI | submitWaveAnswers | MVP demo |
| High | Demo seed data/script | Local dev running | MVP demo |
| Medium | Propagate `totalXp` through auth token and `Me` query | auth-service proto update | MVP |
| Medium | Implement `enrollInCourse` resolver + UI | progress-service | MVP |
| Medium | Add lesson/wave publish mutations to educator UI | - | MVP |
| Low | Implement `payment-service` | - | Production |
| Low | Implement `upload-service` | R2 config | Production |
| Low | GraphQL subscriptions (leaderboard, xp, achievements) | gamification-service | Production |
