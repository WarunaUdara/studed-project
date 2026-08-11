# upload-service

Course image and attachment storage, backed by Google Cloud Storage in
production and by a GCS emulator (or plain disk) locally.

The same code path runs in all three modes — only the endpoint changes — so what
works locally is what runs in production.

## Storage modes

The mode is chosen entirely by two environment variables:

| `GCS_BUCKET_NAME` | `STORAGE_EMULATOR_HOST` | Mode | Use |
|---|---|---|---|
| set | unset | **Real GCS** via Workload Identity | Production |
| set | set | **Emulator**, bucket auto-created | `docker compose` / local |
| unset | — | **Local disk** under `UPLOAD_LOCAL_DIR` | `go run .` with no dependencies |

Production needs no key file: the pod's ServiceAccount is bound to the
`studed-upload` GSA through Workload Identity.

## API

Port `8093`. Reads are public (images are embedded in course pages); writes
require the shared service token, which the api-gateway attaches **after** it has
authenticated the user as an educator.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/v1/uploads` | service token | multipart, field `file`. Returns `201` + `{key,url,contentType,size}` |
| `GET` | `/v1/uploads/files/{key}` | public | streams the object, cached immutably |
| `DELETE` | `/v1/uploads/files/{key}` | service token | `204`, or `404` if absent |
| `GET` | `/health` | public | liveness — process only, independent of GCS |
| `GET` | `/ready` | public | readiness — verifies the bucket is reachable |
| `GET` | `/metrics` | public | Prometheus RED metrics |

Browsers never call this service directly; they go through the gateway at the
same paths.

## Security model

- **Writes fail closed.** An unset `SERVICE_TOKEN` makes the service refuse all
  writes (`503`) rather than accept them unauthenticated.
- **The uploaded filename is never used.** Keys are generated as
  `uploads/YYYY/MM/<128-bit random>.<ext>`, where the extension comes from the
  *sniffed* content type. This makes path traversal and content-type spoofing
  structurally impossible rather than filtered.
- **Content is sniffed, not trusted.** The declared `Content-Type` and the file
  extension are both attacker-controlled and are ignored for the allowlist
  decision.
- **Size is capped while streaming** (`UPLOAD_MAX_BYTES`, default 10MiB), so an
  oversize upload is rejected with `413` instead of being buffered first.
- **Downloads are served with** `X-Content-Type-Options: nosniff` and a
  restrictive CSP, so a stored file cannot be re-interpreted as active content.
- The 128 bits of randomness in each key also prevent enumerating other users'
  uploads through the public read route.

## Local development

```bash
docker compose up -d upload-service     # starts the GCS emulator too
curl localhost:8093/ready               # 200 once the bucket exists

curl -X POST localhost:8093/v1/uploads \
  -H "Authorization: Bearer local-dev-service-token-secret" \
  -F "file=@some-image.png"
```

The bucket is created automatically in emulator mode, so there is no seeding
step. To run with no containers at all, unset `GCS_BUCKET_NAME` and the service
falls back to disk.

## Configuration

See `.env.example`. Everything has a working default except `SERVICE_TOKEN`
(required for writes) and `GCS_BUCKET_NAME` (required for object storage).

## Deploying to GCP

The bucket, the `studed-upload` service account, its bucket-scoped IAM, and the
Workload Identity binding are all created by
`infra/gcp/terraform/storage.tf` — nothing manual.

If `project_id` is not `studed-prod`, update the
`iam.gke.io/gcp-service-account` annotation in
`infra/k8s/production/services/upload-service.yaml` to match.

## Tests

```bash
go test ./...
```

Covers authentication, disguised content, oversize rejection, path traversal,
key uniqueness, and the delete lifecycle. Gateway-side authorization (educator
only, service-token injection, cookie stripping) is tested in
`services/api-gateway/internal/handler/upload_proxy_test.go`.
