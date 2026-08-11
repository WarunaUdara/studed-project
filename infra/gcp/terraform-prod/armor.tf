# Cloud Armor WAF policy protecting the public API entrypoint of the isolated
# stack. Attached to the GCE Ingress backend service via a BackendConfig
# in-cluster.

resource "google_compute_security_policy" "studed2_waf" {
  name        = "studed2-waf"
  description = "OWASP-based WAF + rate limiting for the StudEd API (isolated stack)"

  rule {
    action      = "throttle"
    priority    = 900
    description = "Rate limit per source IP across all endpoints"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = var.waf_rate_limit_per_ip
        interval_sec = 60
      }
    }
  }

  rule {
    action      = "deny(403)"
    priority    = 1000
    description = "Block SQL injection (OWASP preconfigured)"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
  }

  rule {
    action      = "deny(403)"
    priority    = 1001
    description = "Block cross-site scripting (OWASP preconfigured)"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
  }

  rule {
    action      = "deny(403)"
    priority    = 1002
    description = "Block local file inclusion (OWASP preconfigured)"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('lfi-v33-stable')"
      }
    }
  }

  rule {
    action      = "deny(403)"
    priority    = 1003
    description = "Block protocol attacks (OWASP preconfigured)"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('protocolattack-v33-stable')"
      }
    }
  }

  # Default allow (only reachable behind the LB; service itself is private).
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}
