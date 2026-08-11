@echo off
setlocal enableextensions

rem 1. If GNU make.exe is installed on Windows PATH, use it directly
where make.exe >nul 2>nul
if %errorlevel%==0 (
    make.exe %*
    exit /b %errorlevel%
)

rem 2. Target router for native Windows execution (CMD & PowerShell)
set TARGET=%1
if "%TARGET%"=="" set TARGET=dev-up

if "%TARGET%"=="dev-up" (
    docker info >nul 2>nul
    if errorlevel 1 (
        echo Docker Desktop is not running. Please start it and try again.
        exit /b 1
    )
    docker compose -f docker-compose.yml up --build -d --remove-orphans
    exit /b %errorlevel%
)

if "%TARGET%"=="dev-down" (
    docker compose -f docker-compose.yml down
    exit /b %errorlevel%
)

if "%TARGET%"=="launch" (
    bun run scripts/launch.ts
    exit /b %errorlevel%
)

if "%TARGET%"=="dev-logs" (
    docker compose logs -f
    exit /b %errorlevel%
)

if "%TARGET%"=="monitoring-up" (
    docker compose --profile monitoring up -d prometheus grafana tempo postgres-exporter redis-exporter
    exit /b %errorlevel%
)

if "%TARGET%"=="monitoring-down" (
    docker compose --profile monitoring stop prometheus grafana tempo postgres-exporter redis-exporter
    exit /b %errorlevel%
)

if "%TARGET%"=="floci-gcp-up" (
    docker compose -f docker-compose.yml up -d floci-gcp
    exit /b %errorlevel%
)

if "%TARGET%"=="floci-gcp-down" (
    docker compose -f docker-compose.yml stop floci-gcp
    exit /b %errorlevel%
)

if "%TARGET%"=="frontend-install" (
    cd frontend && bun install
    exit /b %errorlevel%
)

if "%TARGET%"=="frontend-dev" (
    cd frontend && bun run dev
    exit /b %errorlevel%
)

if "%TARGET%"=="frontend-build" (
    cd frontend && bun run build
    exit /b %errorlevel%
)

if "%TARGET%"=="frontend-typecheck" (
    cd frontend && bun run typecheck
    exit /b %errorlevel%
)

if "%TARGET%"=="frontend-lint" (
    cd frontend && bun run lint
    exit /b %errorlevel%
)

if "%TARGET%"=="frontend-test" (
    cd frontend && bun run test --run
    exit /b %errorlevel%
)

if "%TARGET%"=="content-sync" (
    cd scripts/content-sync && bun run sync
    exit /b %errorlevel%
)

if "%TARGET%"=="content-validate" (
    cd scripts/content-sync && bun run validate
    exit /b %errorlevel%
)

if "%TARGET%"=="seed" (
    cd scripts/content-sync && bun run sync
    exit /b %errorlevel%
)

if "%TARGET%"=="shared-test" (
    cd shared/go && go test ./...
    exit /b %errorlevel%
)

if "%TARGET%"=="doctor" (
    echo Checking development environment toolchain...
    go version
    bun --version
    docker --version
    echo Environment doctor check passed!
    exit /b 0
)

rem Fallback: try executing via Git Bash if available
if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" -c "make %*"
    exit /b %errorlevel%
)

echo Unknown or unsupported target on Windows: %TARGET%
echo Please check Makefile for available targets.
exit /b 1
