FROM golang:1.26.6-alpine3.23 AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0
# Cap compile parallelism so 9 concurrent `docker compose build`s cannot
# exhaust dev-laptop RAM (Go defaults to GOMAXPROCS workers per build).
ENV GOFLAGS=-p=2

WORKDIR /build

COPY services/api-gateway/go.mod services/api-gateway/go.sum ./services/api-gateway/
COPY shared/go/go.mod ./shared/go/go.mod
COPY shared/proto/gen/go/go.mod shared/proto/gen/go/go.sum ./shared/proto/gen/go/

WORKDIR /build/services/api-gateway
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

WORKDIR /build
COPY services/api-gateway ./services/api-gateway
COPY shared/go ./shared/go
COPY shared/proto/gen/go ./shared/proto/gen/go

WORKDIR /build/services/api-gateway
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -ldflags="-w -s" -o /app/service .

FROM alpine:3.21.2

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8080

ENTRYPOINT ["/app/service"]
