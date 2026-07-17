FROM golang:1.24.0-alpine3.21 AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0

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
