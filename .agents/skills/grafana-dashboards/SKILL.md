---
name: grafana-dashboards
description: Customized Grafana dashboard provisioning and visualization skill for StudEd platform golden signals, microservices, and database metrics.
---

# Grafana Dashboards for StudEd

Customized guide for Grafana dashboard provisioning, panel definitions, and PromQL queries for StudEd.

## Architecture

- **Grafana Server**: Running on port `3000` (`http://localhost:3000`, User: `admin`, Password: `admin`)
- **Datasource**: Prometheus (`http://prometheus:9090`)
- **Dashboard Provisions**:
  - `studed-overview.json` (Platform Golden Signals, RPS, P95 Latency, Error Rate)
  - `studed-microservices.json` (Per-service throughput, status codes, gRPC calls)
  - `studed-databases.json` (PostgreSQL connections, TPS, Redis OPS, memory usage)

## Provisioned Files

- Provisioning Configs: `infra/monitoring/grafana/provisioning/`
- Dashboard JSONs: `infra/monitoring/grafana/dashboards/`

## Key Queries

```promql
# System Throughput (RPS)
sum(rate(http_requests_total[5m]))

# Error Rate Percentage
(sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100

# P95 Response Latency
histogram_quantile(0.95, sum by (service, le) (rate(http_request_duration_seconds_bucket[5m])))
```
