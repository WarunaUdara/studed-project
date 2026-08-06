# Runbook: High Error Rate (HTTP 5xx > 5%)

## Target Service
StudEd Microservices (`api-gateway`, `auth-service`, `course-service`, `progress-service`, `gamification-service`, `payment-service`, `notification-service`).

## Symptoms
- Alert `HighErrorRate` firing with `severity: warning` or `severity: critical`.
- HTTP 5xx response percentage exceeding SLO threshold (5%).

## Diagnosis
1. Inspect Gateway and Service logs:
   ```bash
   docker compose logs -f --tail=100 api-gateway <failing-service>
   ```
2. Check database connection pool and status:
   ```bash
   curl -sf http://localhost:8080/ready
   ```
3. Check upstream dependency connectivity (PostgreSQL, Redis, Elasticsearch).

## Remediation
1. If database connection pool is exhausted, restart service:
   ```bash
   docker compose restart <failing-service>
   ```
2. If memory leak or OOM killed, scale service or increase container limits in `docker-compose.yml`.
3. Re-check `/health` and `/ready` endpoints.
