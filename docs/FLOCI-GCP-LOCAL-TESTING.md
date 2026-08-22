# floci-gcp Local Emulator — Capability Matrix (empirically verified)

Verified on 2026-08-22 against `floci/floci-gcp:latest` (compose service
`studed-floci-gcp`, port 4588). Every claim below was tested with direct API
calls and an OpenTofu plan run against the emulator.

## What floci-gcp is

A wire-compatible GCP **API emulator** (Quarkus native, distroless) that
persists state under `/app/data` (compose volume `floci_gcp_data`). It speaks
the JSON REST shape of a handful of GCP APIs. It does **not** run any real
Google infrastructure — no compute, no Kubernetes, no identity.

## Capability matrix

| GCP service | Endpoint probed | Result | Emulated? |
| :--- | :--- | :--- | :--- |
| Cloud Storage | `GET /storage/v1/b` | 200, buckets persisted | Yes (wire-level) |
| Storage bucket IAM | `GET /storage/v1/b/<b>/iam` | 200, policy persisted | Yes (wire-level) |
| Secret Manager | `GET /v1/projects/{p}/secrets` | 200, secrets persisted | Yes (wire-level) |
| Secret-level IAM | `POST .../secrets/<s>:setIamPolicy` | 200 | Yes (wire-level) |
| Pub/Sub | `GET /v1/projects/{p}/topics` | 200 | Yes (wire-level) |
| GKE cluster (stub) | `POST .../clusters?clusterId=...` | 200 — fake cluster backed by Kafka, `vcpuCount` hardcoded, no control plane | **Partial** |
| GKE node pools | cluster body carries `nodePools`, response omits them entirely | node pool lifecycle ignored — no nodes, no scheduling | **No** |
| IAM service accounts | `POST /v1/projects/{p}/serviceAccounts` | 200, persisted | Partial (CRUD only) |
| IAM roles/bindings | `POST ...:setIamPolicy` with a **nonexistent role** | 200 — accepts any role string, zero validation, zero enforcement, no workload identity pool | **No** |
| Project IAM read | `POST /v1/projects/{p}:getIamPolicy` | 404 | **No** |
| Compute (VPC, subnets, router, NAT, global IP) | `GET /compute/v1/projects/{p}/global/networks` | 404 | **No** |
| Cloud Armor WAF | (compute family) | 404 | **No** |
| Cloud Scheduler | `POST /v1/projects/{p}/locations/.../schedules` | 404 | **No** |
| Cloud Run jobs | `POST /v1/projects/{p}/locations/{r}/jobs` | 200, persisted | Yes (wire-level) |

## The OpenTofu trap (important)

`tofu plan -var use_floci_gcp=true` against the emulator **succeeds** — it
reports `Plan: 58 to add` for the `terraform-prod` stack. This is false
confidence, not validation:

- The google provider only wires **four** custom endpoints to floci
  (`providers.tf`): storage, secret_manager, pubsub, container.
- Every other resource (`google_service_account`, `google_project_iam_member`,
  `google_service_account_iam_binding`, `google_compute_network`/`subnetwork`/
  `router`/`router_nat`/`global_address`, `google_compute_security_policy`,
  `google_cloud_run_v2_job`, `google_cloud_scheduler_job`,
  `google_project_service`) has **no custom endpoint** and therefore targets
  **real GCP** with real credentials at apply time.
- Result: a "local" apply would create the Secret Manager entries, the bucket
  and a fake cluster in the emulator while simultaneously creating service
  accounts, a VPC and Cloud Armor in real `studed-prod` — a split-brain state
  that `tofu destroy` cannot clean up coherently.

## What you can safety-test locally with floci-gcp

- Code paths in the Go services that read `STORAGE_EMULATOR_HOST` /
  `FLOCI_GCP_BASE_URL` (upload-service storage layer, config).
- Wire-level CRUD for buckets, secrets, pubsub topics, Cloud Run job stubs.
- Smoke tests for anything that must not touch real GCP credentials.

## What you must test on a real cluster instead

- **IAM semantics**: role validation, least privilege, Workload Identity
  (`<project>.svc.id.goog` pool, GSA impersonation). floci accepts `roles/not.a.real.role`.
- **GKE node pools**: cluster bootstrap and node lifecycle (~40 min on real GCP).
- **VPC / private nodes / Cloud NAT / static IP**: compute API is 404 in floci.
- **Cloud Armor WAF + rate limiting**, **Cloud Scheduler**, **managed TLS certs**, **GCE ingress**.
- Anything verified by `kubectl` (pod scheduling, probes, readiness).