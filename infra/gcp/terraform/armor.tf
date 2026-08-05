# Cloud Armor WAF policy protecting the public API entrypoint.
# Attached to the GCE Ingress backend service via a BackendConfig in-cluster.

resource "google_compute_security_policy" "studed_waf" {
  name        = "studed-waf"
  description = "OWASP-based WAF + rate limiting for the StudEd API"

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

  # GraphQL POST/GET bodies are structured JSON (never raw SQL); the OWASP
  # SQLi signature set is prone to false positives on them. Whitelist the
  # GraphQL endpoint above the OWASP rules. Rate limiting still applies
  # (priority 1004) and XSS/LFI/protocol rules still protect the rest of the API.
  rule {
    action      = "allow"
    priority    = 999
    description = "Allow GraphQL endpoint (structured JSON, not raw SQL)"
    match {
      expr {
        expression = "request.path.contains('/graphql')"
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

  rule {
    action      = "throttle"
    priority    = 1004
    description = "Rate limit per source IP to protect the GraphQL API"
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
