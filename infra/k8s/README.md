# StudEd Universal Kubernetes (K8s) & GitOps Deployment Architecture

This directory contains cloud-agnostic Kubernetes manifests and GitOps configurations for **StudEd**.

Whether deploying to a local developer machine (MacBook 16GB RAM) or any VM cloud provider (**AWS EC2, DigitalOcean Droplet, Azure VM, Fly.io, Hetzner**), this manifest suite runs with strict memory constraints (<1.2 GB total cluster footprint).

---

## 1. Cloud-Agnostic VM Deployment Guide (EC2, DigitalOcean, Azure, etc.)

Deploying to any cloud virtual machine requires just two commands using lightweight **K3s**:

### Step 1: Provision VM & Install K3s (Single-Command Bootstrap)
Run this on your target cloud instance (Ubuntu/Debian/RHEL):

```bash
# 1. Install K3s (lightweight Kubernetes)
curl -sfL https://get.k3s.io | sh -

# 2. Verify cluster readiness
sudo k3s kubectl get nodes
```

### Step 2: Apply StudEd Manifests & Secrets
```bash
# Clone repository on server
git clone https://github.com/WarunaUdara/studed-project.git
cd studed-project

# Copy and configure secrets
cp infra/k8s/secret.yaml.template infra/k8s/secret.yaml
# Edit infra/k8s/secret.yaml with real production credentials

# Apply Kubernetes manifests
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/secret.yaml
kubectl apply -f infra/k8s/postgres-deployment.yaml
kubectl apply -f infra/k8s/redis-deployment.yaml
kubectl apply -f infra/k8s/elasticsearch-deployment.yaml
kubectl apply -f infra/k8s/services/
kubectl apply -f infra/k8s/ingress.yaml
```

---

## 2. Local Mac (16GB RAM) Testing via `k3d`

`k3d` runs lightweight K3s clusters inside Docker containers in seconds:

```bash
# 1. Create single-node k3d cluster with port forwarding
k3d cluster create studed-local --port "8080:8080@loadbalancer" --port "80:80@loadbalancer"

# 2. Deploy StudEd stack
cp infra/k8s/secret.yaml.template infra/k8s/secret.yaml
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/secret.yaml
kubectl apply -f infra/k8s/postgres-deployment.yaml
kubectl apply -f infra/k8s/redis-deployment.yaml
kubectl apply -f infra/k8s/elasticsearch-deployment.yaml
kubectl apply -f infra/k8s/services/

# 3. Check status
kubectl get pods -n studed
```

---

## 3. GitOps Continuous Delivery (ArgoCD)

To enable declarative continuous delivery:

```bash
# 1. Install ArgoCD in cluster
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 2. Apply StudEd Application manifest
kubectl apply -f infra/k8s/argocd/application.yaml
```
ArgoCD will monitor the `infra/k8s` directory in GitHub and automatically synchronize changes on git push.

---

## 4. Public Live Demo (Ngrok Tunneling)

Extract a live HTTPS URL for public demos on any hosting environment:

```bash
make demo-public
```
Or directly point Ngrok to the ingress port:
```bash
ngrok http 8080
```
