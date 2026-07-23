# StudEd Infrastructure as Code (IaC) with OpenTofu & Floci

This directory contains modular OpenTofu / Terraform configurations for provisioning StudEd platform infrastructure. It is designed to work seamlessly with both local **Floci cloud emulation** (port 4566) and cloud environments.

## Architecture & Modules

- `s3_storage`: S3 Bucket for user/course asset upload service.
- `redis_cache`: Redis Cache & PubSub event broker.
- `postgres_db`: Relational PostgreSQL Database for microservices persistence.
- `app_cluster`: Container execution cluster configuration.

---

## Local Development Inner-Loop (via Floci Emulator)

Using **Floci**, developer and AI coding agents can plan, apply, and verify infrastructure changes locally in ~24ms with **zero cloud bill and zero credential leakage**.

### 1. Start the Floci Local Cloud Emulator
```bash
floci start
floci doctor
```

### 2. Initialize and Apply with OpenTofu
```bash
cd infra/terraform

# Initialize OpenTofu
tofu init

# Format & Validate
tofu fmt
tofu validate

# Plan against Floci local endpoint (http://localhost:4566)
tofu plan

# Apply changes locally
tofu apply -auto-approve
```

---

## Production / Remote Deployment

To deploy to real cloud infrastructure (e.g., AWS), pass `use_floci = false`:

```bash
tofu apply -var="use_floci=false" -var="environment=prod"
```
