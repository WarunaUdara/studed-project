// Command rotate-neon-password rotates the credential used by StudEd against
// Neon Postgres and updates the repo .env connection string.
//
// Neon does not allow the project owner role's password to be reset over SQL
// ("must be superuser to alter replication roles"). The supported rotation is
// therefore to provision a dedicated application role and switch the app to it:
//
//  1. Connect as the current owner role (read from DATABASE_CONNECTION_STRING).
//  2. Create (or update the password of) a dedicated app role.
//  3. Grant the role full access to the current database, tables, sequences,
//     and default privileges (so future migrations remain usable).
//  4. Verify the new role can connect, then rewrite DATABASE_CONNECTION_STRING.
//
// The password is never printed; only a masked confirmation is shown.
//
// Usage:
//
//	go run . -env ../../.env -role studed_app
package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/base64"
	"flag"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func main() {
	envPath := flag.String("env", "", "path to .env (default: repo root .env)")
	appRole := flag.String("role", "studed_app", "name of the application role to provision")
	flag.Parse()

	if *envPath == "" {
		*envPath = "../../.env"
	}

	connStr, err := readConnectionString(*envPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	u, err := url.Parse(connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: parse connection string: %v\n", err)
		os.Exit(1)
	}

	if !strings.Contains(u.Host, ".neon.tech") {
		fmt.Fprintf(os.Stderr, "error: %q does not look like a Neon connection string\n", u.Host)
		os.Exit(1)
	}

	dbName := strings.TrimPrefix(u.Path, "/")
	if dbName == "" {
		fmt.Fprintf(os.Stderr, "error: no database name in connection string\n")
		os.Exit(1)
	}

	newPassword, err := generatePassword()
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: generate password: %v\n", err)
		os.Exit(1)
	}

	if err := provisionAppRole(connStr, *appRole, dbName, newPassword); err != nil {
		fmt.Fprintf(os.Stderr, "error: provision role: %v\n", err)
		os.Exit(1)
	}

	newConnStr := buildConnStr(connStr, *appRole, newPassword)
	if err := verifyConnection(newConnStr); err != nil {
		fmt.Fprintf(os.Stderr, "error: new role connection rejected: %v\n", err)
		os.Exit(1)
	}

	if err := updateEnv(*envPath, "DATABASE_CONNECTION_STRING", newConnStr); err != nil {
		fmt.Fprintf(os.Stderr, "error: update .env: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("rotated database credential: app now connects as %s (connection string written to %s)\n", *appRole, *envPath)
}

func readConnectionString(envPath string) (string, error) {
	f, err := os.Open(envPath)
	if err != nil {
		return "", fmt.Errorf("open %s: %w", envPath, err)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "DATABASE_CONNECTION_STRING=") {
			return strings.TrimPrefix(line, "DATABASE_CONNECTION_STRING="), nil
		}
	}
	if err := scanner.Err(); err != nil {
		return "", fmt.Errorf("read %s: %w", envPath, err)
	}
	return "", fmt.Errorf("DATABASE_CONNECTION_STRING not found in %s", envPath)
}

func generatePassword() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func provisionAppRole(connStr, role, dbName, newPassword string) error {
	if strings.ContainsRune(newPassword, '\'') {
		return fmt.Errorf("generated password contains a single quote; refusing to inline it")
	}
	if !isValidIdent(role) {
		return fmt.Errorf("invalid role name %q", role)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return fmt.Errorf("connect with current credentials: %w", err)
	}
	defer conn.Close(ctx)

	roleLit := pgx.Identifier{role}.Sanitize()

	var exists bool
	if err := conn.QueryRow(ctx, "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1)", role).Scan(&exists); err != nil {
		return fmt.Errorf("check role existence: %w", err)
	}

	if exists {
		if _, err := conn.Exec(ctx, "ALTER ROLE "+roleLit+" WITH PASSWORD '"+newPassword+"'"); err != nil {
			return fmt.Errorf("ALTER ROLE %s: %w", role, err)
		}
	} else {
		if _, err := conn.Exec(ctx, "CREATE ROLE "+roleLit+" WITH LOGIN PASSWORD '"+newPassword+"'"); err != nil {
			return fmt.Errorf("CREATE ROLE %s: %w", role, err)
		}
	}

	stmts := []string{
		"GRANT USAGE ON SCHEMA public TO " + roleLit,
		"GRANT ALL PRIVILEGES ON DATABASE " + pgx.Identifier{dbName}.Sanitize() + " TO " + roleLit,
		"GRANT ALL ON ALL TABLES IN SCHEMA public TO " + roleLit,
		"GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO " + roleLit,
		"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO " + roleLit,
		"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO " + roleLit,
	}
	for _, stmt := range stmts {
		if _, err := conn.Exec(ctx, stmt); err != nil {
			return fmt.Errorf("%s: %w", stmt, err)
		}
	}
	return nil
}

func buildConnStr(connStr, role, password string) string {
	u, err := url.Parse(connStr)
	if err != nil {
		return connStr
	}
	u.User = url.UserPassword(role, password)
	return u.String()
}

func verifyConnection(connStr string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	conn, err := pgx.Connect(ctx, connStr)
	if err != nil {
		return fmt.Errorf("reconnect with new credentials: %w", err)
	}
	defer conn.Close(ctx)
	return nil
}

func isValidIdent(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if !(r >= 'a' && r <= 'z' || r >= '0' && r <= '9' || r == '_') {
			return false
		}
	}
	return true
}

func updateEnv(envPath, key, value string) error {
	f, err := os.Open(envPath)
	if err != nil {
		return fmt.Errorf("open %s: %w", envPath, err)
	}
	defer f.Close()

	var lines []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, key+"=") {
			lines = append(lines, key+"="+value)
			continue
		}
		lines = append(lines, line)
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("read %s: %w", envPath, err)
	}

	return os.WriteFile(envPath, []byte(strings.Join(lines, "\n")+"\n"), 0o600)
}
