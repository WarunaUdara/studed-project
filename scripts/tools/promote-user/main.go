// Command promote-user elevates a user's role directly in the database.
//
// Public self-registration only ever creates STUDENT accounts. Operator tools
// (such as the demo data seeder) use this helper to provision elevated roles
// (EDUCATOR, HEAD_EDUCATOR, ADMIN) for known accounts.
//
// Usage:
//
//	go run . -db-url "postgres://..." -email admin@studed.lk -role ADMIN
package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	dbURL := flag.String("db-url", "", "Postgres connection string (or use DATABASE_URL env)")
	email := flag.String("email", "", "email of the user to promote")
	role := flag.String("role", "", "role to assign: STUDENT, EDUCATOR, HEAD_EDUCATOR, ADMIN")
	flag.Parse()

	if *dbURL == "" {
		*dbURL = os.Getenv("DATABASE_URL")
	}
	if *email == "" || *role == "" || *dbURL == "" {
		fmt.Fprintln(os.Stderr, "db-url, email, and role are all required")
		os.Exit(2)
	}

	role = upper(role)
	switch *role {
	case "STUDENT", "EDUCATOR", "HEAD_EDUCATOR", "ADMIN":
	default:
		fmt.Fprintf(os.Stderr, "invalid role %q\n", *role)
		os.Exit(2)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	db, err := sql.Open("pgx", *dbURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "open db: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.PingContext(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "ping db: %v\n", err)
		os.Exit(1)
	}

	res, err := db.ExecContext(ctx,
		"UPDATE users SET role = $1, updated_at = NOW() WHERE email = $2", *role, strings.ToLower(strings.TrimSpace(*email)))
	if err != nil {
		fmt.Fprintf(os.Stderr, "update role: %v\n", err)
		os.Exit(1)
	}
	n, err := res.RowsAffected()
	if err != nil {
		fmt.Fprintf(os.Stderr, "rows affected: %v\n", err)
		os.Exit(1)
	}
	if n == 0 {
		fmt.Fprintf(os.Stderr, "no user found for email %q\n", *email)
		os.Exit(1)
	}
	fmt.Printf("promoted %s to %s\n", *email, *role)
}

func upper(s *string) *string {
	if s == nil {
		return s
	}
	*s = strings.ToUpper(*s)
	return s
}
