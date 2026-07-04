FROM golang:1.24-alpine AS builder

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0

WORKDIR /build

COPY services/course-service/go.mod services/course-service/go.sum ./services/course-service/
COPY shared/go/go.mod ./shared/go/go.mod
COPY shared/proto/gen/go/go.mod shared/proto/gen/go/go.sum ./shared/proto/gen/go/

WORKDIR /build/services/course-service
RUN go mod download

WORKDIR /build
COPY services/course-service ./services/course-service
COPY shared/go ./shared/go
COPY shared/proto/gen/go ./shared/proto/gen/go

WORKDIR /build/services/course-service
RUN go build -o /app/service .

FROM alpine:latest

RUN apk --no-cache add ca-certificates
COPY --from=builder /app/service /app/service

EXPOSE 8083 8084

ENTRYPOINT ["/app/service"]
