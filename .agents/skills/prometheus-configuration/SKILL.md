---
name: prometheus-configuration
description: Customized Prometheus monitoring and metric scrape configuration skill for StudEd microservices, PostgreSQL, Redis, and Kubernetes.
---

# Prometheus Configuration for StudEd

Customized guide for metric scraping, rule evaluation, and alert validation across StudEd microservices.

## Architecture

- **Prometheus Server**: Running on port `9090` (`http://localhost:9090`)
- **Scrape Targets**:
  - `api-gateway` (`:8080/health`)
  - `auth-service` (`:8085/health`)
  - `course-service` (`:8084/health`)
  - `progress-service` (`:8087/health`)
  - `gamification-service` (`:8089/health`)
  - `ai-service` (`:8090/health`)
  - `payment-service` (`:8091/health`)
  - `notification-service` (`:8092/health`)
  - `postgres-exporter` (`:9187/metrics`)
  - `redis-exporter` (`:9121/metrics`)

## Key Commands

```bash
# Check targets health
curl -s http://localhost:9090/api/v1/targets | jq .

# Query instant metrics
curl -s 'http://localhost:9090/api/v1/query?query=up' | jq .

# Hot-reload Prometheus configuration
curl -X POST http://localhost:9090/-/reload
```

## Validation & Verification

Always validate Prometheus rules and config before committing:
```bash
promtool check config infra/monitoring/prometheus/prometheus.yml
promtool check rules infra/monitoring/prometheus/rules/*.yml
```
