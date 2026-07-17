module github.com/studed/api-gateway

go 1.25.0

replace (
	github.com/studed/shared/go => ../../shared/go
	github.com/studed/shared/proto/gen/go => ../../shared/proto/gen/go
)

require (
	github.com/99designs/gqlgen v0.17.93
	github.com/coder/websocket v1.8.15
	github.com/go-chi/chi/v5 v5.3.0
	github.com/golang-jwt/jwt/v5 v5.3.1
	github.com/joho/godotenv v1.5.1
	github.com/redis/go-redis/v9 v9.5.3
	github.com/studed/shared/go v0.0.0-00010101000000-000000000000
	github.com/studed/shared/proto/gen/go v0.0.0-00010101000000-000000000000
	github.com/vektah/gqlparser/v2 v2.5.35
	google.golang.org/grpc v1.82.0
)

require (
	github.com/agnivade/levenshtein v1.2.1 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/go-viper/mapstructure/v2 v2.5.0 // indirect
	github.com/goccy/go-yaml v1.19.2 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/hashicorp/golang-lru/v2 v2.0.7 // indirect
	github.com/sosodev/duration v1.4.0 // indirect
	github.com/urfave/cli/v3 v3.10.0 // indirect
	golang.org/x/mod v0.37.0 // indirect
	golang.org/x/net v0.56.0 // indirect
	golang.org/x/sync v0.21.0 // indirect
	golang.org/x/sys v0.46.0 // indirect
	golang.org/x/text v0.38.0 // indirect
	golang.org/x/tools v0.46.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260414002931-afd174a4e478 // indirect
	google.golang.org/protobuf v1.36.11 // indirect
)
