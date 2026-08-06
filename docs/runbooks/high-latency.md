# Runbook: High P95 Latency (> 1s)

## Target Service
StudEd Microservices and API Gateway.

## Symptoms
- Alert `HighP95Latency` firing.
- P95 response latency exceeds 1.0 second over 5-minute window.

## Diagnosis
1. Inspect trace and database query latencies:
   ```bash
   docker compose logs --tail=100 api-gateway
   ```
2. Check PostgreSQL active query locks and slow queries:
   ```bash
   docker compose exec postgres psql -U studed -d studed -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;"
   ```

## Remediation
1. Terminate runaway PostgreSQL queries if blocking locks:
   ```bash
   docker compose exec postgres psql -U studed -d studed -c "SELECT pg_cancel_backend(<pid>);"
   ```
2. Verify Redis cache hit rates.
3. Restart affected service if threads are stuck.
