FROM golang:1.26.2-alpine3.22 AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0
# Cap compile parallelism so 9 concurrent `docker compose build`s cannot
# exhaust dev-laptop RAM (Go defaults to GOMAXPROCS workers per build).
ENV GOFLAGS=-p=2

WORKDIR /build

COPY services/course-service/go.mod services/course-service/go.sum ./services/course-service/
COPY shared/go/go.mod ./shared/go/go.mod
COPY shared/proto/gen/go/go.mod shared/proto/gen/go/go.sum ./shared/proto/gen/go/

WORKDIR /build/services/course-service
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

WORKDIR /build
COPY services/course-service ./services/course-service
COPY shared/go ./shared/go
COPY shared/proto/gen/go ./shared/proto/gen/go

WORKDIR /build/services/course-service
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -ldflags="-w -s" -o /app/service .

FROM alpine:3.21.2

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8083 8084

ENTRYPOINT ["/app/service"]
