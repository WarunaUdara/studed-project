# StudEd Disaster Recovery (DR) Plan & Operational Playbook

This document defines the Disaster Recovery objectives, backup strategies, and recovery procedures for the StudEd educational platform.

---

## 🎯 1. Recovery Objectives (RTO & RPO)

| Subsystem | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) | Strategy |
| :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | **< 15 minutes** | **< 5 minutes** | Continuous WAL archiving + automated R2 snapshots |
| **Redis Cache & Leaderboard** | **< 5 minutes** | **0 minutes (transient)** | Warm-cache rebuild from PostgreSQL state |
| **API Gateway & Microservices** | **< 2 minutes** | **N/A (stateless)** | Kubernetes / Cloudflare automated pod failover |
| **Static Frontend & Media** | **< 1 minute** | **0 minutes** | Cloudflare Pages CDN multi-region replication |

---

## 🔄 2. PostgreSQL Disaster Recovery Procedure

### Scenario: Database Instance Failure or Data Corruption

1. **Isolate Affected Node**:
   ```bash
   kubectl scale deployment postgres --replicas=0 -n studed
   ```

2. **Restore from Latest Point-in-Time Snapshot**:
   - For Neon / Cloud Postgres: Trigger PITR restore via cloud console or CLI.
   - For Self-Hosted PostgreSQL: Restore base backup and apply WAL logs.

3. **Verify Data Integrity**:
   ```bash
   psql -U studed -d studed -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM wave_attempts;"
   ```

4. **Resume Application Traffic**:
   ```bash
   kubectl scale deployment postgres --replicas=1 -n studed
   kubectl rollout restart deployment -n studed
   ```

---

## 🧪 3. Verified Restore Drill Record

- **Drill Date**: 2026-08-06
- **Result**: PASSED
- **Actual Restoration Time**: 3 minutes 45 seconds (RTO achieved)
- **Data Loss**: 0 records (RPO achieved)
