# 01 — Security & Attack Surface

**23 findings · 3 Critical · 5 High · 12 Medium · 3 Low**

---

## Trust boundaries

```mermaid
flowchart LR
    subgraph Untrusted["🌍 Untrusted"]
        Student["Student browser"]
        Educator["Educator browser"]
        Attacker["Attacker"]
        PayHere["PayHere callback"]
    end

    subgraph Edge["Edge"]
        Pages["Cloudflare Pages<br/>+ /graphql proxy fn"]
        Armor["Cloud Armor WAF<br/>studed-waf"]
        LB["GCE L7 LB<br/>api.&lt;ip&gt;.sslip.io"]
    end

    subgraph Cluster["🔒 GKE — private nodes"]
        GW["api-gateway :8080<br/>JWT verify"]
        Svcs["auth · course · progress<br/>gamification · ai · payment"]
    end

    subgraph Data["Data"]
        Neon[("Neon Postgres")]
        Redis[("Redis")]
        ES[("Elasticsearch")]
        Gemini["Gemini API 💸"]
    end

    Student --> Pages --> LB
    Educator --> Pages
    Attacker -.->|"❌ SEC-02: direct, WAF bypassed"| LB
    PayHere --> LB
    LB --> Armor --> GW
    GW --> Svcs --> Neon
    Svcs --> Redis
    Svcs --> ES
    Svcs -->|"❌ COST-01: unmetered"| Gemini

    classDef bad stroke:#e5484d,stroke-width:3px
    class Armor,GW bad
```

The boundary that matters most — **the WAF at the edge** — is bypassed for
100% of API traffic (SEC-02), and the boundary behind it (**the gateway**) has
no rate limiting of its own (SEC-03). There is currently no layer at which
abusive traffic is stopped.

---

## 🔴 SEC-01 — Quiz answers are readable by any enrolled student

**Severity: Critical · Assessment integrity**

`shared/graphql-schema/schema.graphql:111-119` exposes `correctAnswer` and
`explanation` on the `EvaluateBlock` type, and that type is reachable from the
student-facing `Wave` query:

```graphql
type Wave {
  evaluateBlocks: [EvaluateBlock!]!   # schema.graphql:99
}
type EvaluateBlock {
  correctAnswer: String               # schema.graphql:116
  explanation: String                 # schema.graphql:117
}
```

`services/api-gateway/graph/schema.resolvers.go:576` (`Wave` resolver) enforces
publication status and enrolment correctly — and then returns the full block,
answers included. `internal/client/course.go:425` explicitly maps
`correctAnswer` into the payload.

**Exploit.** Any enrolled student runs:

```graphql
query { wave(id: "…") { evaluateBlocks { id question correctAnswer explanation } } }
```

…and gets 100% on every quiz, every XP award, every achievement, and the top
of every leaderboard. The frontend not requesting the field is irrelevant —
GraphQL is a client-driven query language.

**Why it matters.** This is the core value proposition of the product. Every
grade, XP total, proficiency badge, and leaderboard rank in the system is
unverifiable while this exists.

**Fix.** Split the type. Students must never receive answer data:

```graphql
type EvaluateBlock {          # student-facing
  id: ID!
  type: String!
  question: String!
  options: [String!]
  metadata: String
}
type AuthoredEvaluateBlock {  # educator/owner-only
  ...EvaluateBlock fields
  correctAnswer: String!
  explanation: String
}
```

Return `AuthoredEvaluateBlock` only from an `authoredWave(id:)` query gated on
course ownership. Correct answers should reach a student **only** through
`QuestionFeedback` after submission — and see FLOW-05, which is the second
half of this leak.

---

## 🔴 SEC-02 — Cloud Armor allows `/graphql` past every WAF rule *and* the rate limit

**Severity: Critical · Edge protection is inoperative**

`infra/gcp/terraform/armor.tf:22-33`:

```hcl
rule {
  action      = "allow"
  priority    = 999                     # ← evaluated FIRST
  description = "Allow GraphQL endpoint (structured JSON, not raw SQL)"
  match { expr { expression = "request.path.contains('/graphql')" } }
}
```

Cloud Armor evaluates rules in ascending priority order and **stops at the
first match**. Priority 999 precedes the SQLi (1000), XSS (1001), LFI (1002),
protocol-attack (1003) rules *and the per-IP rate limit at 1004*.

The inline comment asserts *"Rate limiting still applies (priority 1004)"*.
That is factually incorrect — a terminal `allow` short-circuits evaluation.

**Impact.** `/graphql` is the entire API. Every request to the application
bypasses the entire WAF and the only rate limit that exists anywhere in the
stack. `var.waf_rate_limit_per_ip = 120` is never enforced.

**Fix.** Do not exempt the endpoint; scope the exemption to the *rule* that
false-positives. Move the throttle above the allow, and narrow the bypass:

```hcl
rule { priority = 900  action = "throttle" ... }      # rate limit FIRST, always applies
rule { priority = 1001 action = "deny(403)" ... }     # xss
rule { priority = 1002 action = "deny(403)" ... }     # lfi
rule { priority = 1003 action = "deny(403)" ... }     # protocolattack
rule {                                                 # SQLi with GraphQL-tuned sensitivity
  priority   = 1000
  action     = "deny(403)"
  match { expr { expression = <<-EOT
    evaluatePreconfiguredExpr('sqli-v33-stable',
      ['owasp-crs-v030301-id942440-sqli','owasp-crs-v030301-id942430-sqli'])
  EOT
  }}
}
```

Preconfigured expressions accept an **exclusion list** of noisy rule IDs —
that is the supported way to reduce false positives without disabling the WAF.
Also set `log_level = "VERBOSE"` and run in `preview` first to measure.

---

## 🔴 SEC-03 — No rate limiting anywhere in the application

**Severity: Critical · Credential stuffing, enumeration, resource abuse**

Verified absent across the whole Go codebase — no `httprate`, no
`golang.org/x/time/rate`, no Redis token bucket, no per-user quota:

```
$ grep -rn "httprate\|rate.Limiter\|ratelimit\|golang.org/x/time" services/ --include=*.go
(no matches)
```

`services/api-gateway/main.go:104-108` installs only `Logger`, `Recoverer`,
`WithResponseWriter`, and `Auth`. The `login`, `register`, and `refreshToken`
mutations are unthrottled, and with SEC-02 the edge does not throttle either.

**Attack paths this opens:**

| Target | Consequence |
| :--- | :--- |
| `login` | Credential stuffing at line rate against student accounts |
| `register` | Mass fake-account creation, DB and leaderboard pollution |
| `refreshToken` | Token-grinding |
| `translateContent` / `generate*Blocks` | Unbounded Gemini spend (see COST-01) |
| Any query | Application-layer DoS on a single-replica deployment (REL-02) |

Aggravated by COST-02: the Pages proxy strips `x-forwarded-for` and
`cf-connecting-ip`, so the origin cannot even *see* the client IP to rate-limit
on. That must be fixed first.

**Fix.**
1. Pages function: forward the real IP as a trusted header
   (`x-studed-client-ip`) and sign/secret it so clients cannot spoof it.
2. Gateway: Redis-backed sliding window (`go-redis` + `redis_rate`), keyed by
   client IP for anonymous operations and by `user_id` for authenticated ones.
3. Tighter buckets per operation: `login` 5/min/IP with exponential backoff,
   `register` 3/hour/IP, AI mutations 10/hour/user.
4. Fix SEC-02 so Cloud Armor provides the coarse outer layer.

---

## 🟠 SEC-04 — Logout does not revoke anything; no refresh-token rotation

**Severity: High · Session management**

`services/api-gateway/graph/schema.resolvers.go:73-101` — `Logout` clears two
cookies and returns `true`. No server-side state changes.

`services/auth-service/internal/service/auth.go:113` — `RefreshToken`
validates the presented refresh token and mints a new pair. **The old refresh
token remains valid for its full 168h TTL.** No `jti`, no denylist, no reuse
detection, no family invalidation.

**Consequences:**
- A stolen refresh token grants 7 days of access and **survives logout**.
- Logging out on a shared/school computer does not end the session for anyone
  holding the token.
- There is no password-change flow, so there is no way to end a session at all.
- Compromise cannot be contained: an incident response has no lever to pull.

**Fix.** Redis is already deployed and reachable from the gateway.
1. Add `jti` (UUID) to both token types.
2. On logout: `SETEX revoked:<jti> <remaining_ttl> 1` for the access token, and
   revoke the whole refresh family.
3. Rotate refresh tokens: each refresh issues a new `jti` and revokes the
   presented one. If a **revoked** refresh token is ever presented again, that
   is a theft signal — invalidate the entire family and force re-login.
4. Gateway `Auth` middleware checks the denylist (one Redis `GET`, ~0.2ms).
5. Add password change + "sign out all devices", both bumping a per-user
   `token_generation` counter embedded in the claims.

---

## 🟠 SEC-05 — Containers run as root; no pod hardening

**Severity: High · CIS Kubernetes Benchmark / Pod Security Standards**

`services/api-gateway/Dockerfile:29-36` (representative of all services):

```dockerfile
FROM alpine:3.21.2
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service
ENTRYPOINT ["/app/service"]        # ← no USER directive → runs as UID 0
```

And no application manifest sets a `securityContext`:

```
$ grep -rln securityContext infra/k8s/
infra/k8s/production/elasticsearch-deployment.yaml
infra/k8s/production/redis-deployment.yaml
   → all 8 application deployments: NONE
```

Missing on every app pod: `runAsNonRoot`, `runAsUser`, `readOnlyRootFilesystem`,
`allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`,
`seccompProfile: RuntimeDefault`. No `serviceAccountName` is set, so every pod
mounts the `default` ServiceAccount token.

**Impact.** Any RCE in a Go service yields root in the container, a writable
filesystem for tooling, and a mounted API token — the difference between a
contained bug and a cluster incident.

**Fix.** Dockerfile — static Go binaries need no OS at all:

```dockerfile
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder --chown=65532:65532 /app/service /app/service
USER 65532:65532
ENTRYPOINT ["/app/service"]
```

Manifest, on every deployment:

```yaml
spec:
  automountServiceAccountToken: false
  serviceAccountName: api-gateway
  securityContext:
    runAsNonRoot: true
    runAsUser: 65532
    fsGroup: 65532
    seccompProfile: { type: RuntimeDefault }
  containers:
    - securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities: { drop: ["ALL"] }
```

Then enforce it so it cannot regress — label the namespace
`pod-security.kubernetes.io/enforce: restricted`.

---

## 🟠 SEC-06 — PayHere webhook never verifies the amount; replay reactivates cancelled subscriptions

**Severity: High · Payment integrity / revenue loss**

`services/payment-service/internal/handler/handler.go:161-232`. The signature
check (`payhere.VerifyNotification`) is correct and the merchant ID is
validated. Two flaws follow it:

**(a) The paid amount is never compared to the tier price.** The handler reads
`payhere_amount` and `payhere_currency` purely to compute the signature, then
activates:

```go
if r.FormValue("status_code") == "2" {
    // ... loads sub by order_id, sets status = ACTIVE
}
```

There is no price table in the codebase at all — `validTiers` (`handler.go:18`)
maps tier names to `true`, with no amounts. PayHere signs *whatever was
actually paid*. A user who manipulates the amount in the hosted-checkout
redirect pays LKR 1.00, PayHere signs it legitimately, and the handler grants
`PREMIUM`. Currency substitution works the same way.

**(b) Replay reactivates a cancelled subscription.** The idempotency guard is
`if sub.Status != SubscriptionStatusActive`. After a user cancels
(`status = CANCELED`), replaying the original notification passes the guard and
sets the subscription back to `ACTIVE` — free indefinite service. No
`payment_id` uniqueness constraint, no processed-webhook ledger, no timestamp
freshness window.

**Fix.**
1. Introduce a server-side price table (tier → amount, currency) and reject any
   notification where `payhere_amount < expected` or the currency differs.
   Store money as integer minor units, never `float64` (FLOW-11).
2. Persist a `processed_webhooks` table keyed by `payment_id` with a unique
   constraint; make activation idempotent on that key, not on current status.
3. Only transition `PENDING → ACTIVE`. A `CANCELED` or `EXPIRED` order must be
   rejected and alerted on, never silently revived.
4. Extend `end_date` on renewal — currently activation never touches it, so a
   renewed subscription still expires on the original date (FLOW-06).
5. Use `subtle.ConstantTimeCompare` on the signature, not `strings.EqualFold`
   (SEC-19).

---

## 🟠 SEC-07 — NetworkPolicy denies the progress-service call graph

**Severity: High · Also a correctness break — see FLOW-01**

`infra/k8s/production/network-policies.yaml` establishes `default-deny-all`
(ingress + egress), then grants egress explicitly **only to `api-gateway`**
(`allow-gateway-egress`). But `progress-service` makes gRPC calls to
`course-service:8083` and `gamification-service:8088` on every wave submission
(`services/progress-service/internal/service/progress.go:75, 130, 165`).

No policy permits that egress, and `allow-course-ingress-from-gateway` admits
only `app: api-gateway`. The traffic is denied in both directions.

The file's own header comment documents the intended graph as
`api-gateway -> auth/course/progress/gamification` and omits the
service-to-service edges entirely — the policy encodes a service graph that
does not match the code.

**Impact.** With NetworkPolicies applied and Calico enforcing (it is enabled —
`infra/gcp/terraform/gke.tf:44-49`), quiz submission, XP award, achievement
unlock, and wave progress **all fail** in production. This is very likely why
the demo runs through Docker Compose rather than the cluster.

**Fix.** Add the missing edges and keep the file in sync with the service graph:

```yaml
# progress-service egress → course + gamification
- to: [{ podSelector: { matchLabels: { app: course-service } } }]
  ports: [{ protocol: TCP, port: 8083 }]
- to: [{ podSelector: { matchLabels: { app: gamification-service } } }]
  ports: [{ protocol: TCP, port: 8088 }]
```

…plus the matching ingress allowances on `course-service` and
`gamification-service` for `app: progress-service`. Then add a CI check that
renders the manifests and asserts every gRPC client target in the Go code has a
corresponding policy edge — this class of drift should be caught mechanically.

Also tighten `allow-external-egress` (SEC-17).

---

## 🟠 SEC-08 — No security headers on the frontend

**Severity: High · Defence in depth**

`frontend/public/` contains `_redirects` but **no `_headers` file**, and no
header configuration exists in `wrangler.jsonc`. Cloudflare Pages therefore
serves the SPA with no `Content-Security-Policy`, `Strict-Transport-Security`,
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or
`Permissions-Policy`.

**Impact.** No clickjacking protection (a student's session can be framed and
click-hijacked into destructive mutations); no CSP to blunt any XSS that gets
through; referrer leakage of course/wave IDs to third parties; MIME sniffing.

**Fix.** Add `frontend/public/_headers`:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()
  X-Frame-Options: DENY
```

`style-src 'unsafe-inline'` is required by KaTeX and Tailwind's runtime; keep
`script-src` strict. Verify with securityheaders.com before the demo.

---

## 🟡 SEC-09 — GraphQL introspection is permanently enabled

**Severity: Medium · Information disclosure**

`services/api-gateway/main.go:76`:

```go
srv := handler.NewDefaultServer(graph.NewExecutableSchema(...))
// ...
if cfg.GraphQLPlayground {
    srv.Use(extension.Introspection{})     // ← main.go:100 — a no-op
}
```

**Verified against the module source** —
`gqlgen@v0.17.93/graphql/handler/server.go:54-73`:

```go
func NewDefaultServer(es graphql.ExecutableSchema) *Server {
    srv := New(es)
    srv.AddTransport(transport.Websocket{KeepAlivePingInterval: 10 * time.Second})
    srv.AddTransport(transport.Options{})
    srv.AddTransport(transport.GET{})           // ← enabled
    srv.AddTransport(transport.POST{})
    srv.AddTransport(transport.MultipartForm{}) // ← file upload, unused by this app
    srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))
    srv.Use(extension.Introspection{})          // ← line 67: unconditional
    srv.Use(extension.AutomaticPersistedQuery{Cache: lru.New[string](100)})
    return srv
}
```

The conditional guard does nothing: **introspection is on in production
regardless of `GRAPHQL_PLAYGROUND`.** An attacker gets the complete schema —
including the `correctAnswer` field of SEC-01 — for free.

Two further surfaces come along with it: the `GET` transport makes queries
cacheable, loggable in URLs, and CSRF-reachable with a cookie-authenticated
API; and `MultipartForm` exposes a file-upload code path this application never
uses. (The APQ cache is LRU-bounded at 100 entries, so it is not a memory risk
— but it is another unused surface.)

**Fix.** Stop using `NewDefaultServer`; compose explicitly:

```go
srv := handler.New(graph.NewExecutableSchema(cfg))
srv.AddTransport(transport.Options{})
srv.AddTransport(transport.POST{})
srv.AddTransport(transport.Websocket{...})
srv.SetQueryCache(lru.New[*ast.QueryDocument](1000))
srv.Use(extension.FixedComplexityLimit(200))
if cfg.GraphQLPlayground {
    srv.Use(extension.Introspection{})   // now genuinely conditional
}
```

Note this also removes the `GET` and `MultipartForm` transports, which is the
correct default for a cookie-authenticated API with no file uploads — and it
fixes SEC-23 as a side effect.

---

## 🟡 SEC-23 — The WebSocket origin allowlist is dead code

**Severity: Medium · Verified against the gqlgen module source**

`services/api-gateway/main.go:80-93` configures a careful cross-origin policy
for GraphQL subscriptions:

```go
srv.AddTransport(transport.Websocket{
    KeepAlivePingInterval: 10 * time.Second,
    Implementation: transport.CoderWebsocketImplementation{
        AcceptOptions: coderws.AcceptOptions{
            OriginPatterns: []string{"https://studed-project-frontend.pages.dev", ...},
        },
    },
})
```

**It never takes effect.** `NewDefaultServer` (SEC-09) already registered a
`transport.Websocket` at index 0 — with no `Implementation`, therefore no
`OriginPatterns`. Transport selection returns the **first** match:

```go
// gqlgen@v0.17.93/graphql/handler/server.go:132-139
func (s *Server) getTransport(r *http.Request) graphql.Transport {
    for _, t := range s.transports {
        if t.Supports(r) { return t }      // ← first match wins
    }
    return nil
}

// transport/websocket.go:111 — matches ANY upgrade request
func (t Websocket) Supports(r *http.Request) bool { return r.Header.Get("Upgrade") != "" }
```

Every WebSocket upgrade is therefore handled by the default transport, which
falls back to `CoderWebsocketImplementation{}`
(`transport/websocket.go:170-176`) with zero-value `AcceptOptions`.

**Effective policy: coder/websocket's default same-origin check** (the `Origin`
header's host must equal the request `Host`) — *stricter* than the intended
allowlist, not weaker. So this is not an exploitable hole; it is a
correctness and maintainability defect with two consequences:

1. **The security control that was written is not the one in force.** Anyone
   reading `main.go` would reasonably conclude the allowlist is enforced. A
   future change to that list would have no effect, silently.
2. **Subscriptions may not work at all in production.** The frontend origin
   (`*.pages.dev`) differs from the API origin
   (`api.34.149.224.124.sslip.io`), so a direct connection fails the default
   same-origin check. Whether the Pages `/graphql` proxy
   (`functions/graphql.ts`) upgrades WebSockets correctly is untested — that
   function returns a plain `fetch()` without handling the `webSocket` response
   property.

**Fix.** The SEC-09 change resolves point 1 entirely: composing the server with
`handler.New` means the only registered WebSocket transport is the configured
one. For point 2, explicitly verify the four subscriptions
(`leaderboardUpdated`, `xpGained`, `achievementUnlocked`, `waveCompleted`)
end to end in the deployed environment, and add a Playwright test that asserts a
subscription delivers a message — currently none of the eleven specs does.

---

## 🟡 SEC-10 — Internal errors are returned verbatim to clients

**Severity: Medium · Information disclosure**

No `SetErrorPresenter` is configured on the gqlgen server, so every wrapped
error propagates to the client. Examples that reach the browser today:

- `"failed to fetch wave: %w"` → gRPC status, service name, target address
- `"failed to check email: %w"` → GORM/pgx error text, potentially SQL and
  column names
- `"failed to connect to database after 15 attempts"` → topology detail

**Fix.** Add an error presenter that logs the full error with a correlation ID
and returns a stable, opaque message plus that ID:

```go
srv.SetErrorPresenter(func(ctx context.Context, e error) *gqlerror.Error {
    err := graphql.DefaultErrorPresenter(ctx, e)
    var pub *PublicError
    if errors.As(e, &pub) { return err }        // curated, safe messages
    id := middleware.GetReqID(ctx)
    log.Error("unhandled resolver error", slog.String("request_id", id), slog.Any("error", e))
    err.Message = "internal error"
    err.Extensions = map[string]any{"code": "INTERNAL", "requestId": id}
    return err
})
```

Define a small `PublicError` taxonomy (`UNAUTHENTICATED`, `FORBIDDEN`,
`NOT_FOUND`, `VALIDATION`, `RATE_LIMITED`, `CONFLICT`) — this also directly
fixes UX-02.

---

## 🟡 SEC-11 — Login timing oracle enables user enumeration

**Severity: Medium**

`services/auth-service/internal/service/auth.go:92-100`:

```go
user, err := s.repo.GetByEmail(ctx, email)
if err != nil {
    return nil, fmt.Errorf("invalid credentials")   // ← returns without bcrypt
}
if err := bcrypt.CompareHashAndPassword(...); err != nil { ... }
```

A non-existent email returns in ~1ms; an existing one costs a full bcrypt
comparison (~60-100ms at cost 10). The error *strings* match, but the timing
does not. Combined with SEC-03 (no rate limit) an attacker can enumerate the
full user base — which for this product is a list of school-age children.

**Fix.** Always perform a bcrypt comparison against a fixed dummy hash when the
user is absent, so both paths cost the same:

```go
user, err := s.repo.GetByEmail(ctx, email)
if err != nil {
    bcrypt.CompareHashAndPassword(dummyHash, []byte(password))  // constant work
    return nil, ErrInvalidCredentials
}
```

The same applies to `register` — "email already registered"
(`auth.go:52`) is an explicit enumeration oracle. Return a generic success and
send a "this address is already registered" email instead.

---

## 🟡 SEC-12 — Weak credential policy

**Severity: Medium**

`services/auth-service/internal/service/auth.go:40-58`:

- Only rule is `len(password) < 8` — `"password"` and `"12345678"` are accepted
  (and `password123` is in fact the seeded demo password).
- No email format validation at all.
- `bcrypt.DefaultCost` = 10; OWASP's current guidance is **cost ≥ 12** (or
  Argon2id).
- No breached-password check, no account lockout, no MFA, no password history,
  no password reset flow.

**Fix.** Adopt NIST SP 800-63B: minimum 12 characters, no composition rules,
screen against the Have I Been Pwned k-anonymity range API (free, no PII
leaves the service), bcrypt cost 12, and progressive lockout after 5 failed
attempts. Validate email with `net/mail.ParseAddress` plus an MX check.
MFA for `EDUCATOR`/`ADMIN` accounts at minimum — they can publish content to
minors.

---

## 🟡 SEC-13 — JWT claims are thin and the gateway does not check token type

**Severity: Medium**

`services/auth-service/internal/jwt/jwt.go:52-70` sets only `sub`, `iat`, `exp`.
Missing: `iss`, `aud`, `jti`, `nbf`.

`services/api-gateway/internal/middleware/auth.go:47-67` parses the token with
`jwt.Parse` into `MapClaims` and **never verifies `claims["type"] == "access"`**.
Today the two secrets differ so a refresh token fails signature verification —
but that is a configuration accident, not an enforced invariant. Any deployment
that sets both secrets to the same value silently accepts 7-day refresh tokens
as access tokens.

The gateway also derives all authorization from the token
(`requireEducator`, `resolver_helpers.go:24`), so a demoted or banned user keeps
their privileges for up to 15 minutes with no way to intervene.

**Fix.** Add `iss: "studed-auth"`, `aud: "studed-api"`, and `jti`; validate all
three at the gateway with `jwt.WithIssuer/WithAudience/WithValidMethods`.
Explicitly assert `type == "access"`. Combine with the SEC-04 denylist so
privilege revocation is immediate.

---

## 🟡 SEC-14 — `sslmode=disable` is the built-in default for database connections

**Severity: Medium**

`services/payment-service/main.go:28` and
`services/notification-service/main.go:27`:

```go
databaseURL := getEnv("DATABASE_URL", "postgres://studed:studed@localhost:5433/studed?sslmode=disable")
```

If `DATABASE_URL` is unset or misspelled in the production ConfigMap/Secret,
these services do not fail — they fall back to an unauthenticated,
**unencrypted** local connection string. Payment data is the worst possible
candidate for a fail-open default.

By contrast `api-gateway/internal/config/config.go:22` correctly hard-fails on
a missing `JWT_ACCESS_SECRET`. Apply that discipline uniformly.

**Fix.** Remove the defaults; fail fast:

```go
databaseURL := os.Getenv("DATABASE_URL")
if databaseURL == "" { log.Error("DATABASE_URL is required"); os.Exit(1) }
```

Require `sslmode=require` (Neon mandates TLS anyway) and validate it at
startup. Add a config-validation test asserting no service starts with an empty
critical variable.

---

## 🟡 SEC-15 — GKE node pool holds the `cloud-platform` scope; control plane is public

**Severity: Medium · Least privilege**

`infra/gcp/terraform/gke.tf:69-71`:

```hcl
oauth_scopes = [ "https://www.googleapis.com/auth/cloud-platform" ]
```

This is the broadest possible scope. Combined with SEC-05 (root containers, no
NetworkPolicy on metadata egress), a container escape reaches the node SA and
inherits access to every Google Cloud API the project has enabled.

`gke.tf:23-27` sets `enable_private_endpoint = false`, so the Kubernetes API
server has a public endpoint. It is protected by
`master_authorized_networks_config`, but `var.authorized_cidrs`
(`variables.tf:43-46`) has **no default and no validation** — nothing prevents
`["0.0.0.0/0"]` being supplied in `terraform.tfvars`.

**Credit where due:** private nodes, Workload Identity, Shielded VMs, Calico,
STABLE release channel, auto-repair, and auto-upgrade are all correctly
configured. This is a good baseline with two specific gaps.

**Fix.**
1. Reduce node scopes to `devstorage.read_only`, `logging-write`,
   `monitoring`, and rely on Workload Identity (already enabled) for
   everything else.
2. Add a validation block rejecting overly broad CIDRs:
   ```hcl
   validation {
     condition     = !contains(var.authorized_cidrs, "0.0.0.0/0")
     error_message = "authorized_cidrs must not include 0.0.0.0/0."
   }
   ```
3. Enable `database_encryption` (etcd CMEK) and Binary Authorization to pair
   with image signing (OPS-03).

---

## 🟡 SEC-16 — Leaderboard is unauthenticated and publishes minors' real names

**Severity: Medium · Child data protection**

`services/api-gateway/graph/schema.resolvers.go:665` — the `leaderboard` query
is the **only** query in the schema with no `requireUser` call. It returns
`LeaderboardEntry` containing `fullName` and XP for students who, per the
README, are Grade 1–11 children.

More broadly, for a product explicitly targeting minors there is:
- no age gate or parental-consent flow,
- no privacy policy, terms, or data-processing record,
- no data export or deletion capability (GDPR Art. 15/17, and Sri Lanka's PDPA
  No. 9 of 2022 which has analogous rights),
- no audit log of who accessed student data,
- no data-retention policy (`wave_attempts` grows forever, PERF-06),
- no PII redaction in logs.

**Fix.** Short term: require authentication on `leaderboard`, and display
display-names/initials rather than legal full names. Medium term: add a
consent and data-rights module — this is a legal prerequisite for launch, not a
nice-to-have, and it is far cheaper to design in now than to retrofit.

---

## 🟡 SEC-17 — Every pod may egress to any host on 443

**Severity: Medium**

`infra/k8s/production/network-policies.yaml:38-56`:

```yaml
metadata: { name: allow-external-egress }
spec:
  podSelector: {}                # ← every pod
  egress:
    - ports: [ { port: 443 }, { port: 5432 } ]   # ← no `to:` → 0.0.0.0/0
```

An omitted `to:` means *all destinations*. Any compromised pod — or an SSRF in
the AI service, which fetches URLs by construction — can reach any host on the
internet over TLS. That is the standard data-exfiltration path, and the
default-deny posture the file establishes is substantially undone by it.

The comment explains the rationale (Neon and Gemini IPs rotate), which is fair
— but the answer is a DNS-aware egress control, not a blanket allow.

**Fix.** Scope by workload and destination. Only `ai-service` needs Gemini;
only DB-touching services need 5432. Use an FQDN-aware egress policy — GKE
Dataplane V2 supports `FQDNNetworkPolicy`, or run Cilium — so
`generativelanguage.googleapis.com` can be allowlisted by name. Route Neon
through Private Service Connect to remove the public 5432 egress entirely.

---

## 🟡 SEC-18 — No supply-chain security in CI

**Severity: Medium · SLSA / SSDF**

`.github/workflows/ci.yml` runs typecheck, unit tests, build, `tofu validate`,
and `helm lint`. It contains **none** of:

| Control | Tool | Status |
| :--- | :--- | :--- |
| Go static analysis | `gosec` / CodeQL | ❌ absent |
| Go vulnerability scan | `govulncheck` | ❌ absent |
| JS dependency audit | `bun audit` / OSV | ❌ absent |
| Container image scan | Trivy / Grype | ❌ absent |
| Secret scanning | gitleaks / trufflehog | ❌ absent |
| IaC scan | tfsec / Checkov | ❌ absent |
| K8s manifest policy | kubeconform / Kyverno / Polaris | ❌ absent |
| SBOM | syft / CycloneDX | ❌ absent |
| Image signing / provenance | cosign + SLSA attestation | ❌ absent |

Additionally, every action is referenced by mutable tag (`actions/checkout@v4`,
not a commit SHA), and workflow-level `permissions` grants `packages: write` to
**all** jobs including untrusted PR builds — it should be granted only to
`publish-service-images`.

**Fix.** See [05-DEVOPS-CICD-IAC.md](05-DEVOPS-CICD-IAC.md#ops-03) for the
concrete pipeline. Given the CI already exists and is well structured, this is
a half-day of additive work with a very high return on the "technical
excellence" goal.

---

## 🔵 SEC-19 — Non-constant-time signature comparison (PayHere)

`services/payment-service/internal/payhere/payhere.go:36` uses
`strings.EqualFold(expected, md5sig)`, which short-circuits on the first
differing byte. Use `subtle.ConstantTimeCompare` on the upper-cased bytes —
the codebase already does this correctly in `shared/go/httpauth` and
`shared/go/grpcauth`, so this is an inconsistency rather than a knowledge gap.

Note MD5 is mandated by the PayHere specification, so it cannot be replaced;
document that as an accepted, vendor-imposed risk.

---

## 🔵 SEC-20 — Development-grade credentials in the compose stack

`docker-compose.yml`: Grafana `admin`/`admin` (l.276-277), Postgres
`studed`/`studed` (l.6-8), Redis with no `requirepass` (l.19), Elasticsearch
with `xpack.security.enabled=false` (l.29).

This is acceptable for a local developer stack and should stay simple. The
risks are (a) muscle-memory drift into production values, and (b) an
accidentally exposed port on a demo machine. Bind all of these to `127.0.0.1`
explicitly (`"127.0.0.1:5433:5432"`) and add a one-line banner to the README
stating the stack is local-only.

---

## 🔵 SEC-21 — No request body size limit

The gateway sets sensible `ReadHeaderTimeout`/`ReadTimeout`/`WriteTimeout`
(`main.go:120-126`) but no body cap. A single multi-megabyte GraphQL document
is parsed into memory against a 128Mi limit (PERF-04). Add
`http.MaxBytesReader` at 1MB via middleware, and cap variables separately.

---

## 🔵 SEC-22 — `RegisterInput.role` is a required field that is silently ignored

`schema.graphql:196` declares `role: Role!` as mandatory. The gateway
(`internal/client/auth.go:65`) hardcodes `Role_ROLE_STUDENT`, and auth-service
(`auth.go:60-68`) hardcodes it again.

The *security* behaviour is correct and deliberately commented — clients must
never choose their own role. The problem is the **contract lie**: the schema
advertises a control that does nothing, which misleads every consumer and has
already produced a real bug (FLOW-03: the demo seed's "Demo Educator" is
created as a student). Remove `role` from `RegisterInput` entirely.

---

## What is already right

Worth stating plainly, because it is a genuinely competent foundation:

- ✅ **Course ownership is enforced server-side** — `course.go:197,240,279,345,380,430,526,587` all check `course.EducatorID != req.EducatorId`. No IDOR in the authoring path.
- ✅ **Quiz grading is fully server-side** (`progress.go:scoreAnswers`) — the client never computes a score.
- ✅ **No SQL injection** — GORM parameterised queries throughout; zero raw SQL.
- ✅ **Tokens in `HttpOnly`, `Secure`, `SameSite=Lax` cookies**, not localStorage.
- ✅ **Service-to-service auth exists** and fails closed (`grpcauth`, `httpauth`), using constant-time comparison.
- ✅ **Default-deny NetworkPolicies** — the concept is right and rare at this level; it just needs the missing edges (SEC-07).
- ✅ **GKE hardening baseline**: private nodes, Workload Identity, Shielded VMs, Calico, STABLE channel.
- ✅ **Secrets are not committed** — `.gitignore` correctly excludes tfstate, tfvars, `k8s/secret.yaml`, and the mock cookie files; External Secrets Operator is wired up.
- ✅ **Self-registration cannot escalate role** — commented and enforced in two places.
- ✅ **GraphQL complexity limit** is present (`FixedComplexityLimit(200)`).
