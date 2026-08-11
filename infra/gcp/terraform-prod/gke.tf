# GKE Standard (zonal) cluster, isolated stack (studed-prod).
# Same hardened profile as the original root but with its own VPC, node SA and
# master CIDR (172.16.1.0/28 avoids any overlap with the old master peering
# subnet which still occupies 172.16.0.0/28 in us-central1).

resource "google_container_cluster" "studed" {
  name     = var.cluster_name
  location = var.zone

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.studed2_vpc.id
  subnetwork = google_compute_subnetwork.studed2_subnet.id

  networking_mode = "VPC_NATIVE"
  ip_allocation_policy {
    cluster_secondary_range_name  = "studed2-pods"
    services_secondary_range_name = "studed2-services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.1.0/28"
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

  addons_config {
    network_policy_config {
      disabled = false
    }
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

  autoscaling {
    min_node_count = var.node_min_count
    max_node_count = var.node_max_count
  }

  node_config {
    service_account = google_service_account.gke_node_sa.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
      "https://www.googleapis.com/auth/devstorage.read_only",
    ]
    machine_type = var.node_machine_type
    disk_size_gb = var.node_disk_size_gb
    disk_type    = "pd-standard"
    labels = {
      app = "studed"
    }
    tags = ["studed2-gke"]
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
