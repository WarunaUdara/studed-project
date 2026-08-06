# StudEd Service Level Objectives (SLOs) & Error Budgets

This document outlines the Service Level Objectives (SLOs) and Multi-Window Burn-Rate Alerts for the StudEd Sri Lankan Educational Platform.

---

## 🎯 1. Service Level Objectives

| Service | Indicator (SLI) | Target (SLO) | Window |
| :--- | :--- | :--- | :--- |
| **API Gateway** | HTTP Availability (`1 - 5xx / total`) | **99.9%** | 30 Days |
| **API Gateway** | P95 Response Latency (`duration <= 500ms`) | **99.0%** | 30 Days |
| **Auth Service** | Authentication Success Rate | **99.95%** | 30 Days |
| **Course Service** | Lesson / Wave Read Latency (`p95 <= 200ms`) | **99.5%** | 30 Days |
| **Progress Service** | Wave Attempt Processing Success Rate | **99.9%** | 30 Days |

---

## 🚨 2. Multi-Window Burn-Rate Alerting

Prometheus alert rules evaluate error budget consumption over rolling windows:

- **Fast Burn (2% budget in 1 hour)**: Critical PagerDuty alert (`for: 2m`).
- **Slow Burn (5% budget in 6 hours)**: Warning Slack alert (`for: 15m`).
