# Isolated VPC for the new stack. Fully separate from studed-vpc so nothing
# about the old (wedged) cluster or its subnets can block this deployment.

resource "google_compute_network" "studed2_vpc" {
  name                    = "studed2-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "studed2_subnet" {
  name          = "studed2-subnet"
  network       = google_compute_network.studed2_vpc.id
  region        = var.region
  ip_cidr_range = "10.0.0.0/16"

  secondary_ip_range {
    range_name    = "studed2-pods"
    ip_cidr_range = "10.1.0.0/16"
  }
  secondary_ip_range {
    range_name    = "studed2-services"
    ip_cidr_range = "10.2.0.0/16"
  }
  private_ip_google_access = true
}

# Cloud NAT for egress from private GKE nodes (image pulls, Neon, ACME).
resource "google_compute_router" "studed2_router" {
  name    = "studed2-router"
  network = google_compute_network.studed2_vpc.id
  region  = var.region
}

resource "google_compute_router_nat" "studed2_nat" {
  name                               = "studed2-nat"
  router                             = google_compute_router.studed2_router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# Global static IP for the L7 external ingress (GCE Ingress uses global forwarding rules).
resource "google_compute_global_address" "studed2_ingress_ip" {
  name         = "studed2-ingress-ip"
  address_type = "EXTERNAL"
  ip_version   = "IPV4"
}
