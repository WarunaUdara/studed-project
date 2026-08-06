# Runbook: Database Down (PostgreSQL / Redis Unreachable)

## Target Infrastructure
PostgreSQL (`studed-postgres`), Redis (`studed-redis`).

## Symptoms
- Alert `PostgresDatabaseDown` or `RedisDatabaseDown` firing (`severity: critical`).

## Diagnosis
1. Check container health status:
   ```bash
   docker compose ps postgres redis
   ```
2. Inspect container logs for crash loops:
   ```bash
   docker compose logs --tail=50 postgres redis
   ```

## Remediation
1. Attempt container restart:
   ```bash
   docker compose restart postgres redis
   ```
2. Verify disk space on volume mount.
3. Once containers recover, run readiness check across microservices.
