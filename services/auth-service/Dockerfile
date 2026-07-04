FROM golang:1.24-alpine AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0

WORKDIR /build

COPY services/auth-service/go.mod services/auth-service/go.sum ./services/auth-service/
COPY shared/go/go.mod ./shared/go/go.mod
COPY shared/proto/gen/go/go.mod shared/proto/gen/go/go.sum ./shared/proto/gen/go/

WORKDIR /build/services/auth-service
RUN go mod download

WORKDIR /build
COPY services/auth-service ./services/auth-service
COPY shared/go ./shared/go
COPY shared/proto/gen/go ./shared/proto/gen/go

WORKDIR /build/services/auth-service
RUN go build -o /app/service .

FROM alpine:latest

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8081 8085

ENTRYPOINT ["/app/service"]
