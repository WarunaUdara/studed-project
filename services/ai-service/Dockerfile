FROM golang:1.26.6-alpine3.23 AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0
# Cap compile parallelism so 9 concurrent `docker compose build`s cannot
# exhaust dev-laptop RAM (Go defaults to GOMAXPROCS workers per build).
ENV GOFLAGS=-p=2

WORKDIR /build

COPY services/ai-service/go.mod services/ai-service/go.sum ./services/ai-service/
COPY shared/go/go.mod ./shared/go/go.mod

WORKDIR /build/services/ai-service
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

WORKDIR /build
COPY services/ai-service ./services/ai-service
COPY shared/go ./shared/go

WORKDIR /build/services/ai-service
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -ldflags="-w -s" -o /app/service .

FROM alpine:3.21.2

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8090

ENTRYPOINT ["/app/service"]
