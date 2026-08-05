# Custom VPC with VPC-native secondary ranges for GKE.
resource "google_compute_network" "studed_vpc" {
  name                    = "studed-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "studed_subnet" {
  name          = "studed-subnet"
  network       = google_compute_network.studed_vpc.id
  region        = var.region
  ip_cidr_range = "10.0.0.0/16"

  secondary_ip_range {
    range_name    = "studed-pods"
    ip_cidr_range = "10.1.0.0/16"
  }
  secondary_ip_range {
    range_name    = "studed-services"
    ip_cidr_range = "10.2.0.0/16"
  }
  private_ip_google_access = true
}

# Cloud NAT for egress from private GKE nodes (image pulls, Neon, ACME).
resource "google_compute_router" "studed_router" {
  name    = "studed-router"
  network = google_compute_network.studed_vpc.id
  region  = var.region
}

resource "google_compute_router_nat" "studed_nat" {
  name                               = "studed-nat"
  router                             = google_compute_router.studed_router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# Global static IP for the L7 external ingress (GCE Ingress uses global forwarding rules).
resource "google_compute_global_address" "studed_ingress_ip" {
  name         = "studed-ingress-ip"
  address_type = "EXTERNAL"
  ip_version   = "IPV4"
}
