FROM golang:1.24-alpine AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0

WORKDIR /build

COPY services/gamification-service/go.mod services/gamification-service/go.sum ./services/gamification-service/
COPY shared/go/go.mod ./shared/go/go.mod
COPY shared/proto/gen/go/go.mod shared/proto/gen/go/go.sum ./shared/proto/gen/go/

WORKDIR /build/services/gamification-service
RUN go mod download

WORKDIR /build
COPY services/gamification-service ./services/gamification-service
COPY shared/go ./shared/go
COPY shared/proto/gen/go ./shared/proto/gen/go

WORKDIR /build/services/gamification-service
RUN go build -o /app/service .

FROM alpine:latest

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8088 8089

ENTRYPOINT ["/app/service"]
