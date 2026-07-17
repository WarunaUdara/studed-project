FROM golang:1.24.0-alpine3.21 AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0

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
    go build -ldflags="-w -s" -o /app/service .

FROM alpine:3.21.2

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8091

ENTRYPOINT ["/app/service"]
