# GKE Standard (zonal) cluster with:
#   - private nodes, public control-plane endpoint restricted to admin CIDRs
#   - Workload Identity enabled (no SA keys in the cluster)
#   - shielded VMs (secure boot / vTPM / integrity monitoring)
#   - VPC-native networking (alias IPs)

resource "google_container_cluster" "studed" {
  name     = var.cluster_name
  location = var.zone

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.studed_vpc.id
  subnetwork = google_compute_subnetwork.studed_subnet.id

  networking_mode = "VPC_NATIVE"
  ip_allocation_policy {
    cluster_secondary_range_name  = "studed-pods"
    services_secondary_range_name = "studed-services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  master_authorized_networks_config {
    dynamic "cidr_blocks" {
      for_each = var.authorized_cidrs
      content {
        cidr_block   = cidr_blocks.value
        display_name = "admin-${index(var.authorized_cidrs, cidr_blocks.value) + 1}"
      }
    }
  }

  workload_identity_config {
    workload_pool = "${local.project_id}.svc.id.goog"
  }

  release_channel {
    channel = "STABLE"
  }

  deletion_protection = false

  depends_on = [google_project_service.apis]
}

resource "google_container_node_pool" "primary" {
  name     = "primary"
  location = var.zone
  cluster  = google_container_cluster.studed.name

  initial_node_count = var.node_count
  max_pods_per_node  = 32

  node_config {
    service_account = google_service_account.gke_node_sa.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]
    machine_type = var.node_machine_type
    disk_size_gb = var.node_disk_size_gb
    disk_type    = "pd-standard"
    labels = {
      app = "studed"
    }
    tags = ["studed-gke"]
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
