@echo off
setlocal enableextensions

rem StudEd task runner for Windows (CMD & PowerShell).
rem Mirrors the Makefile targets so Windows devs get the same behaviour as
rem macOS/Linux. Keep the two in sync when adding targets.
rem
rem Dispatch is goto-based on purpose. Inside a parenthesised `if (...)` block
rem cmd expands %errorlevel% when it PARSES the whole block, i.e. before the
rem commands in it have run - so `exit /b %errorlevel%` there always returns the
rem pre-block value and every failing target would look like it succeeded.

rem 1. If GNU make.exe is on PATH, prefer the real Makefile.
where make.exe >nul 2>nul
if %errorlevel%==0 (
    make.exe %*
    exit /b %errorlevel%
)

rem 2. Locate bash.exe for the targets that are shell scripts (seed, demo-public).
rem    Git for Windows ships one; devs already have it since they cloned this repo.
set "BASH_EXE="
for %%B in (bash.exe) do if not defined BASH_EXE set "BASH_EXE=%%~$PATH:B"
if not defined BASH_EXE if exist "%ProgramFiles%\Git\bin\bash.exe" set "BASH_EXE=%ProgramFiles%\Git\bin\bash.exe"
if not defined BASH_EXE if exist "C:\Program Files\Git\bin\bash.exe" set "BASH_EXE=C:\Program Files\Git\bin\bash.exe"

rem 3. Route the requested target.
set TARGET=%1
if "%TARGET%"=="" set TARGET=dev-up

if "%TARGET%"=="dev-up"             goto :dev_up
if "%TARGET%"=="dev-down"           goto :dev_down
if "%TARGET%"=="dev-logs"           goto :dev_logs
if "%TARGET%"=="launch"             goto :launch
if "%TARGET%"=="prod-dev"           goto :prod_dev
if "%TARGET%"=="monitoring-up"      goto :monitoring_up
if "%TARGET%"=="monitoring-down"    goto :monitoring_down
if "%TARGET%"=="floci-gcp-up"       goto :floci_up
if "%TARGET%"=="floci-gcp-down"     goto :floci_down
if "%TARGET%"=="frontend-install"   goto :frontend_install
if "%TARGET%"=="frontend-dev"       goto :frontend_dev
if "%TARGET%"=="frontend-build"     goto :frontend_build
if "%TARGET%"=="frontend-typecheck" goto :frontend_typecheck
if "%TARGET%"=="frontend-lint"      goto :frontend_lint
if "%TARGET%"=="frontend-test"      goto :frontend_test
if "%TARGET%"=="content-sync"       goto :content_sync
if "%TARGET%"=="content-validate"   goto :content_validate
if "%TARGET%"=="seed"               goto :seed
if "%TARGET%"=="demo-public"        goto :demo_public
if "%TARGET%"=="shared-test"        goto :shared_test
if "%TARGET%"=="go-test"            goto :go_test
if "%TARGET%"=="doctor"             goto :doctor
goto :unknown

:dev_up
call :preflight
if errorlevel 1 exit /b 1
rem COMPOSE_PARALLEL_LIMIT=2 caps concurrent builds so 9 Go Dockerfiles cannot
rem exhaust RAM (each build already runs with GOFLAGS=-p=2). Matches the Makefile.
set COMPOSE_PARALLEL_LIMIT=2
docker compose -f docker-compose.yml up --build -d --remove-orphans
exit /b %errorlevel%

:dev_down
docker compose -f docker-compose.yml down
exit /b %errorlevel%

:dev_logs
docker compose logs -f
exit /b %errorlevel%

:launch
bun run scripts/launch.ts
exit /b %errorlevel%

:prod_dev
call :preflight
if errorlevel 1 exit /b 1
docker compose -f docker-compose.yml up -d --remove-orphans
bun run scripts/launch.ts
exit /b %errorlevel%

:monitoring_up
docker compose --profile monitoring up -d prometheus grafana tempo postgres-exporter redis-exporter
exit /b %errorlevel%

:monitoring_down
docker compose --profile monitoring stop prometheus grafana tempo postgres-exporter redis-exporter
exit /b %errorlevel%

:floci_up
docker compose -f docker-compose.yml up -d floci-gcp
exit /b %errorlevel%

:floci_down
docker compose -f docker-compose.yml stop floci-gcp
exit /b %errorlevel%

:frontend_install
cd frontend
bun install
exit /b %errorlevel%

:frontend_dev
cd frontend
bun run dev
exit /b %errorlevel%

:frontend_build
cd frontend
bun run build
exit /b %errorlevel%

:frontend_typecheck
cd frontend
bun run typecheck
exit /b %errorlevel%

:frontend_lint
cd frontend
bun run lint
exit /b %errorlevel%

:frontend_test
cd frontend
bun run test --run
exit /b %errorlevel%

:content_sync
cd scripts\content-sync
bun run sync
exit /b %errorlevel%

:content_validate
cd scripts\content-sync
bun run validate
exit /b %errorlevel%

rem `seed` runs the full mock-data-loader (demo users + courses + enrolments),
rem not just content-sync. It is a bash script, so it needs Git Bash on Windows.
:seed
if not defined BASH_EXE goto :need_bash
"%BASH_EXE%" ./scripts/mock-data-loader.sh
exit /b %errorlevel%

:demo_public
if not defined BASH_EXE goto :need_bash
"%BASH_EXE%" ./scripts/demo-public.sh
exit /b %errorlevel%

:shared_test
cd shared\go
go test ./...
exit /b %errorlevel%

:doctor
echo Checking development environment toolchain...
go version
bun --version
docker --version
docker buildx version
if defined BASH_EXE echo bash: %BASH_EXE%
if not defined BASH_EXE echo bash: NOT FOUND - install Git for Windows for 'seed' and 'demo-public'
echo Environment doctor check complete.
exit /b 0

:need_bash
echo error: target '%TARGET%' is a shell script and needs bash.
echo        Install Git for Windows ^(includes Git Bash^), or run it from WSL.
exit /b 1

:unknown
echo Unknown or unsupported target on Windows: %TARGET%
echo Run 'make.bat doctor' to check your toolchain, or see the Makefile for targets.
exit /b 1

rem ---------------------------------------------------------------------------
rem Runs `go test -race` per service. Delayed expansion is required so FAILED is
rem re-read each iteration; with plain %FAILED% the value would be frozen at the
rem parse of the for-block and a failing suite would still exit 0.
:go_test
setlocal enabledelayedexpansion
set FAILED=0
for /d %%S in (services\*) do (
    if exist "%%S\go.mod" (
        echo testing %%S...
        pushd "%%S"
        go test -race ./...
        if errorlevel 1 set FAILED=1
        popd
    )
)
if !FAILED! neq 0 (
    echo.
    echo One or more Go test suites failed.
    endlocal
    exit /b 1
)
endlocal
exit /b 0

rem ---------------------------------------------------------------------------
rem Pre-flight checks, mirroring docker-mem-check + docker-buildx-check.
:preflight
docker info >nul 2>nul
if errorlevel 1 (
    echo error: Docker is not running. Start Docker Desktop and try again.
    exit /b 1
)

rem BuildKit cache mounts in the Go Dockerfiles require the buildx plugin.
docker buildx version >nul 2>nul
if errorlevel 1 (
    echo error: docker buildx plugin is required - the Dockerfiles use BuildKit --mount.
    echo        Docker Desktop bundles it, so updating Docker Desktop is the fix.
    exit /b 1
)

rem The full stack needs >= 6 GiB in the Docker VM. The WSL2 backend takes half
rem the host RAM by default, which is under the bar on an 8 GB laptop and shows
rem up as builds mysteriously dying. Fail early with the actual fix.
set "MEMBYTES="
for /f %%M in ('docker info --format "{{.MemTotal}}" 2^>nul') do set "MEMBYTES=%%M"
if not defined MEMBYTES (
    echo warning: could not read Docker memory; skipping the 6 GiB check.
    exit /b 0
)
powershell -NoProfile -Command "if ([int64]$env:MEMBYTES -lt 6442450944) { exit 1 } else { exit 0 }"
if errorlevel 1 goto :low_memory
echo ok: Docker preflight passed - engine running, buildx present, memory sufficient.
exit /b 0

:low_memory
powershell -NoProfile -Command "Write-Host ('error: Docker VM has only {0:N1} GiB; the StudEd stack needs >= 6 GiB.' -f ([int64]$env:MEMBYTES / 1GB))"
echo        Fix: Docker Desktop ^> Settings ^> Resources ^> Memory ^> 8 GB ^> Apply ^& Restart.
echo        WSL2 backend: put "memory=8GB" under [wsl2] in %%UserProfile%%\.wslconfig,
echo        then run 'wsl --shutdown' and restart Docker Desktop.
exit /b 1
