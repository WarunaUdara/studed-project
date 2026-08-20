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
    mkdir -p /app && \
    if [ -f bin/linux_service ]; then \
        cp bin/linux_service /app/service; \
    else \
        go build -ldflags="-w -s" -o /app/service .; \
    fi

FROM alpine:3.21.2

# python3 powers the student code sandbox (/v1/run-code); util-linux provides
# prlimit, which caps a student program's memory and CPU. Without prlimit the
# runner still enforces its deadline, so the image stays functional either way.
RUN apk --no-cache add ca-certificates python3 util-linux-misc

# Student code runs as a child of this process, so the service must not be
# root: the container boundary is the real sandbox wall.
RUN adduser -D -u 10001 studed
USER studed

COPY --from=builder /app/service /app/service

EXPOSE 8090

ENTRYPOINT ["/app/service"]
