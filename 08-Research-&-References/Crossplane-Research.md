---
title: "Crossplane Research"
description: "Evaluation of Crossplane as StudEd's Kubernetes-native infrastructure control plane, versus the current OpenTofu workflow."
tags:
  - research
  - crossplane
  - infrastructure
  - gitops
  - openTofu
  - gcp
  - studed
aliases:
  - "Crossplane"
  - "Crossplane Control Plane"
  - "Crossplane Research"
date: 2026-08-18
---

# Crossplane Research

> [!info] Overview
> [**Crossplane**](https://www.crossplane.io) is the CNCF-graduated (Oct 2025) **cloud-native control plane framework**: it turns cloud infrastructure (GCP, AWS, Azure, and 800+ managed resource types) into Kubernetes custom resources that Argo CD reconciles just like application workloads. This doc evaluates whether StudEd should replace its OpenTofu IaC workflow with Crossplane, given our single-cloud (GCP) production stack, existing Argo CD GitOps, and strict "everything must work locally" requirement.

## Executive Summary

| Path | Verdict |
|------|---------|
| **Adopt Crossplane now** | Not recommended. Adds a control plane to operate, cannot run against the local GCP emulator (Floci), and provider API churn is high. |
| **Defer + fix OpenTofu gaps** | Recommended. Move `infra/gcp/terraform-prod/` to a GCS backend with locking, gate CI on `tofu plan`, add scheduled drift detection (resolves audit REL-15 / OPS-06). |
| **Re-evaluate trigger** | Revisit Crossplane when StudEd needs self-service, multi-tenant, or multi-environment provisioning (educator/school sandboxes). |

## Why Crossplane for StudEd

| StudEd Need | Crossplane Feature |
|-------------|-----------|
| **Unified GitOps** | Infra managed as K8s CRs by the same Argo CD instance that syncs `infra/k8s/production/` — one pipeline for apps and infra |
| **No state file** | Kubernetes etcd is the state store; no `terraform.tfstate` to lose, leak, or corrupt (kills audit REL-15 / OPS-06) |
| **Continuous drift correction** | Controllers reconcile on a loop and auto-revert out-of-band changes, unlike OpenTofu's passive `plan`/`apply` |
| **Self-service abstractions** | `Compositions` + claims let teams request "a Postgres" or "an uploads bucket" via `kubectl apply`, without GCP console access |
| **RBAC + policy reuse** | Requests flow through the same RBAC, Kyverno, and admission chain as every other K8s resource |

## Crossplane vs OpenTofu — The Paradigm Difference

The decision is not "which tool creates an RDS instance" (both do). It is *where the loop lives*:

| Dimension | OpenTofu (current) | Crossplane |
|-----------|--------------------|------------|
| **Execution model** | CLI invoked on demand (`tofu plan` / `tofu apply`) | Always-on controllers inside a K8s cluster |
| **State** | `.tfstate` file (today: local, unlocked) | Kubernetes etcd (CR `status` fields) |
| **Drift handling** | Detected only when you run `plan`; fixed on `apply` | Continuous reconciliation, auto-corrects |
| **Config language** | HCL | YAML (K8s manifests, Compositions) |
| **Runtime dependency** | None — runs anywhere | Requires a running Kubernetes cluster |
| **Review gate** | `tofu plan` shows explicit diff → strong PR gate | PR reviews YAML diffs; no API-call-level plan |
| **Abstraction** | Modules | Compositions + Composite Resource Definitions (XRDs) |
| **Self-service** | Needs wrapper (Atlantis, Spacelift, TFC) | Native claims API |
| **Operational cost** | Near zero between applies | Another always-on system to run, patch, back up |
| **Local emulator support** | Excellent (Floci already wired into `docker-compose.yml`) | None — provider-gcp calls the real GCP API |

## Crossplane v2 — Current State (2026)

- **CNCF Graduated** Oct 28, 2025; >100 releases, 3,000+ contributors, OpenSSF badge, two security audits.
- **Release cadence (2026):** v2.1 (Nov 2025) → v2.2 (Feb 2026) → v2.3 (May 2026) → v2.4 (Aug 2026). `v1.20` is the final v1 minor, LTS extended support.
- **v2 breaking changes that matter to us:**
  - XRs and MRs are **namespaced by default** (clearer isolation).
  - Compositions can now compose **any Kubernetes resource**, not just cloud MRs.
  - **Function pipelines** replace the removed native patch-and-transform (`mode: Resources`).
  - `ControllerConfig` → `DeploymentRuntimeConfig`; `login`/`logout` CLI removed.
  - External secret store support removed — **use External Secrets Operator** (we already run it via `external-secrets.yaml`).
  - Packages must be **fully registry-qualified** (e.g. `xpkg.crossplane.io/crossplane-contrib/...`).
- **Provider landscape change:** Upbound's "Official Providers" now require UXP (Upbound's distribution). OSS Crossplane uses **community providers** in `crossplane-contrib` from the `xpkg.crossplane.io` registry.

## Core Concepts

### 1. Managed Resource (MR)

A one-to-one mapping of a cloud resource to a K8s CR. Example — GCS bucket:

```yaml
apiVersion: storage.gcp.upbound.io/v1beta1
kind: Bucket
metadata:
  name: studed-uploads-prod
  namespace: crossplane-system
spec:
  forProvider:
    location: ASIA-SOUTH1
    storageClass: STANDARD
  providerConfigRef:
    name: gcp-prod
  writeConnectionSecretToRef:
    name: uploads-bucket-conn
```

### 2. Provider + ProviderConfig

`provider-gcp` (community) installs the CRD + controller. Auth is via **Workload Identity** (the same mechanism our `ClusterSecretStore` already uses — no new credential handling):

```yaml
apiVersion: gcp.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: gcp-prod
spec:
  projectID: studed-prod
  credentials:
    source: InjectedIdentity   # GKE Workload Identity
```

### 3. Composition (XR + XRD)

The platform abstraction layer — defines "an uploads bucket with IAM + retention" as one logical API a team requests:

```yaml
apiVersion: apiextensions.crossplane.io/v1
kind: Composition
metadata:
  name: uploadsbucket.gcp.studed.io
spec:
  resources:
    - name: bucket
      base:
        apiVersion: storage.gcp.upbound.io/v1beta1
        kind: Bucket
      patches:
        - type: FromCompositeFieldPath
          fromFieldPath: spec.parameters.name
          toFieldPath: spec.forProvider.name
```

### 4. Function Pipelines (v2)

`patch-and-transform` was removed in v2; all composition logic runs through `crossplane-contrib/function-patch-and-transform`:

```yaml
spec:
  pipeline:
    - step: patch
      functionRef:
        name: function-patch-and-transform
      input:
        apiVersion: pt.fn.crossplane.io/v1beta1
        kind: Parameters
```

### 5. Operations (v2, day-2)

New `Operation` type for one-off, scheduled, or event-driven tasks (backups, validation, maintenance) — the mechanism you would use to replace the `studed2-idle-scout` Cloud Scheduler job eventually.

## GCP Provider Coverage vs StudEd's Production Stack

Current `infra/gcp/terraform-prod/` resources mapped to Crossplane MRs:

| StudEd resource (OpenTofu today) | Crossplane MR group | Notes |
|----------------------------------|---------------------|-------|
| GKE cluster `studed-prod` | `container.gcp` `Cluster` | **Bootstrap problem** — see §Risks |
| GCS bucket `studed-uploads-*` | `storage.gcp` `Bucket` | Solid coverage |
| Secret Manager secrets | `secretmanager.gcp` `Secret` | Good fit (10 secrets; ESO already reads them) |
| Cloud Armor `studed2-waf` | `compute.gcp` `SecurityPolicy` | Covered; `BackendConfig` stays a k8s annotation CRD |
| Cloud Run job `studed2-idle-scout` | `cloudrun.gcp` `V2Job` | **API churn risk** — v1beta1 removed in provider v3.0.0 |
| Cloud Scheduler | `cloudscheduler.gcp` `Job` | v1beta1 removed in provider v3.0.0 |
| Static IP + managed cert | `compute.gcp` `Address` / `ManagedSSLCertificate` | Covered |
| IAM / Service Accounts | `cloudplatform.gcp` `ServiceAccountIAMMember` | Covered |
| **Neon Postgres** (external) | — | Stays a secret; no Crossplane MR (3rd-party provider exists) |
| **Cloudflare Pages** (external) | — | Stays in wrangler/Pages; outside Crossplane scope |

## GitOps Integration with Argo CD

We already run Argo CD with `automated: { prune: true, selfHeal: true }` on `infra/k8s/production/`. Crossplane needs specific Argo CD config (from the official guide):

```yaml
# argocd-cm ConfigMap
data:
  application.resourceTrackingMethod: annotation   # required for Crossplane CRs
  resource.respectRBAC: normal
```

1. **Annotation tracking** — Argo CD must track Crossplane resources by annotation, not labels, or it will try to prune XRs it thinks are orphaned.
2. **Resource exclusion** — hide `ProviderConfigUsage` (auto-generated bookkeeping) from the Argo CD UI to keep reactivity.
3. **Health checks** — provider `Provider` health is built-in; add per-MR checks via `resource_customizations`.
4. **QPS** — `ARGOCD_K8S_CLIENT_QPS=300` once CRD count grows.
5. **`prune: false` for infra** — best practice: never let Argo CD auto-prune managed infrastructure (prevents accidental DB/storage deletion). Prefer sync waves: IAM → VPC → Cloud SQL/GCS → app.

## Fit Analysis for StudEd

**What Crossplane would genuinely improve:**
- Kills the local-state/plaintext-secret problem (REL-15) and un-locked-state problem (OPS-06) outright — etcd is the state store, and the control plane is HA.
- Brings infrastructure under the same Argo CD sync that already governs the 9 services → single mental model.
- Enables self-service claims if/when schools/educators get their own environments.

**What it costs us:**
- A second always-on system (Crossplane core + provider controllers) on the prod GKE cluster, which we must patch, monitor, and back up (etcd now holds infra state).
- **No local dev story**: provider-gcp issues real GCP API calls. Floci (the GCP emulator already in `docker-compose.yml`) cannot serve Crossplane. This directly violates the "everything must work locally, blazing fast" requirement.
- Provider API churn (the community provider removed a broad set of `v1beta1` resources in v3.0.0, including `cloudrun` and `cloudscheduler` groups we depend on).
- Weaker PR review gate than `tofu plan` (no "what will change" diff at the API level).
- Bootstrapping: something must still provision the GKE cluster + IAM + Workload Identity *before* Crossplane can run — the chicken-and-egg problem keeps a minimal OpenTofu root around regardless.

**Deferred/rejected (for now):**
- Multi-cloud is a stated Crossplane strength, but StudEd is single-cloud (GCP + Cloudflare Pages + Neon). The value is untapped.
- The Crossplane *Terraform* provider (hybrid) adds two tools' worth of failure modes for zero benefit at our scale — skip.

## Recommendation

**Do not adopt Crossplane yet.** The gaps the audit actually flags (REL-15, OPS-06 — local, unlocked, plaintext state) are solved far more cheaply on the current OpenTofu path:

1. Move `infra/gcp/terraform-prod/` to a **GCS backend with locking + versioning** (already an open item in `audit/TODO.md:119`).
2. Gate CI on `tofu plan` (today CI only runs `tofu validate`), not just push to apply.
3. Add **scheduled drift detection** (e.g. nightly `tofu plan` in a workflow, diff posted to the PR).
4. Delete the abandoned `infra/gcp/terraform/` root; keep `infra/terraform/` (AWS/Floci) as-is for the local dev-loop.

**Re-evaluate Crossplane when** a concrete trigger appears:
- Multi-tenant / self-service provisioning (per-school sandboxes, environments requested via claims).
- A second cloud or a need for portable abstractions (`ClassClaim` / provider-agnostic APIs).
- GitOps unification of infra + apps becomes a stated priority over local-fidelity testing.

If/when that happens, the adoption path is: Crossplane core on the prod GKE cluster → community `provider-gcp` with Workload Identity → migrate GCS + Secret Manager + Cloud Armor first (low-risk, no in-flight cluster mutations) → leave GKE/IAM bootstrap in a minimal OpenTofu root → wire the Argo CD annotation/config above → run against a real dev GCP project for local-equivalent testing (no emulator exists).

## References

- CNCF Graduation announcement — https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/
- Crossplane releases / support policy — https://github.com/crossplane/crossplane
- Crossplane v2.0 release notes — https://github.com/crossplane/crossplane/releases/tag/v2.0.0
- Crossplane with Argo CD guide — https://docs.crossplane.io/latest/guides/crossplane-with-argo-cd/
- Community GCP provider — https://github.com/crossplane-contrib/provider-gcp
- Upbound provider-family-gcp — https://marketplace.upbound.io/providers/upbound/provider-family-gcp
- Terraform vs Pulumi vs Crossplane (2026) — https://encore.dev/articles/crossplane-vs-terraform
