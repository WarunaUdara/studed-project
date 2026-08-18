FROM golang:1.26.6-alpine3.23 AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0
# Cap compile parallelism so 9 concurrent `docker compose build`s cannot
# exhaust dev-laptop RAM (Go defaults to GOMAXPROCS workers per build).
ENV GOFLAGS=-p=2

WORKDIR /build

COPY services/payment-service/go.mod services/payment-service/go.sum ./services/payment-service/
COPY shared/go/go.mod ./shared/go/go.mod

WORKDIR /build/services/payment-service
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

WORKDIR /build
COPY services/payment-service ./services/payment-service
COPY shared/go ./shared/go

WORKDIR /build/services/payment-service
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    mkdir -p /app && \
    if [ -f bin/linux_service ]; then \
        cp bin/linux_service /app/service; \
    else \
        go build -ldflags="-w -s" -o /app/service .; \
    fi

FROM alpine:3.21.2

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8091

ENTRYPOINT ["/app/service"]
