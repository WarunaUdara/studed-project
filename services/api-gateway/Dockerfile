FROM golang:1.24-alpine AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0

WORKDIR /build

COPY services/api-gateway/go.mod services/api-gateway/go.sum ./services/api-gateway/
COPY shared/go/go.mod ./shared/go/go.mod
COPY shared/proto/gen/go/go.mod shared/proto/gen/go/go.sum ./shared/proto/gen/go/

WORKDIR /build/services/api-gateway
RUN go mod download

WORKDIR /build
COPY services/api-gateway ./services/api-gateway
COPY shared/go ./shared/go
COPY shared/proto/gen/go ./shared/proto/gen/go

WORKDIR /build/services/api-gateway
RUN go build -o /app/service .

FROM alpine:latest

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8080

ENTRYPOINT ["/app/service"]
