#!/usr/bin/env bun
/**
 * StudEd Launcher — starts backend (Docker Compose) + frontend (Vite dev server)
 * with a real-time terminal status dashboard showing service health.
 *
 * Usage: bun run scripts/launch.ts   (or: ./scripts/launch.ts)
 *
 * Requirements: Docker Desktop running, Bun installed.
 * Press Ctrl+C to stop everything cleanly.
 */

import { spawn, type Subprocess } from "bun";

// ─── Config ───────────────────────────────────────────────────────────────────

interface ServiceDef {
  name: string;
  port: number;
  healthPath: string;
  kind: "docker" | "local";
}

const SERVICES: ServiceDef[] = [
  { name: "PostgreSQL", port: 5433, healthPath: "", kind: "docker" },
  { name: "Redis", port: 6379, healthPath: "", kind: "docker" },
  { name: "Auth Service", port: 8085, healthPath: "/health", kind: "docker" },
  { name: "Course Service", port: 8084, healthPath: "/health", kind: "docker" },
  { name: "Progress Service", port: 8087, healthPath: "/health", kind: "docker" },
  { name: "Gamification", port: 8089, healthPath: "/health", kind: "docker" },
  { name: "API Gateway", port: 8080, healthPath: "/health", kind: "docker" },
  { name: "Frontend (Vite)", port: 5173, healthPath: "", kind: "local" },
];

// ─── ANSI helpers ────────────────────────────────────────────────────────────

const ESC = "\x1b[";
const clear = `${ESC}2J${ESC}H`;
const hideCursor = `${ESC}?25l`;
const showCursor = `${ESC}?25h`;
const bold = (s: string) => `${ESC}1m${s}${ESC}0m`;
const dim = (s: string) => `${ESC}2m${s}${ESC}0m`;
const green = (s: string) => `${ESC}32m${s}${ESC}0m`;
const red = (s: string) => `${ESC}31m${s}${ESC}0m`;
const yellow = (s: string) => `${ESC}33m${s}${ESC}0m`;
const cyan = (s: string) => `${ESC}36m${s}${ESC}0m`;
const magenta = (s: string) => `${ESC}35m${s}${ESC}0m`;

function box(width: number, char = "─"): string {
  return char.repeat(width);
}

// ─── Health checking ──────────────────────────────────────────────────────────

type HealthStatus = "healthy" | "starting" | "down" | "checking";

async function checkService(svc: ServiceDef): Promise<HealthStatus> {
  if (svc.kind === "docker" && svc.healthPath === "") {
    // For postgres/redis, just check if the port is listening
    try {
      const conn = await Bun.connect({
        hostname: "localhost",
        port: svc.port,
        socket: { data: () => {}, close: () => {} },
      });
      conn.end();
      return "healthy";
    } catch {
      return "down";
    }
  }

  if (svc.healthPath) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`http://localhost:${svc.port}${svc.healthPath}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return res.ok ? "healthy" : "starting";
    } catch {
      return "down";
    }
  }

  // Frontend — check if Vite responds
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://localhost:${svc.port}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok ? "healthy" : "starting";
  } catch {
    return "down";
  }
}

// ─── Dashboard rendering ──────────────────────────────────────────────────────

let startTime = Date.now();
let allHealthy = false;
let lastChecked: Date = new Date();

function formatUptime(): string {
  const secs = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function statusIcon(status: HealthStatus): string {
  switch (status) {
    case "healthy": return green("●");
    case "starting": return yellow("◐");
    case "checking": return yellow("◐");
    case "down": return red("○");
  }
}

function statusLabel(status: HealthStatus): string {
  switch (status) {
    case "healthy": return green("Healthy");
    case "starting": return yellow("Starting");
    case "checking": return yellow("Checking");
    case "down": return red("Down");
  }
}

function renderDashboard(statuses: Map<string, HealthStatus>) {
  const width = 56;
  const lines: string[] = [];

  lines.push(cyan(bold("┌" + box(width) + "┐")));
  lines.push(cyan(bold("│")) + `  ${bold("StudEd")} ${dim("— Development Launcher")}                    ${cyan(bold("│"))}`);
  lines.push(cyan(bold("├" + box(width) + "┤")));
  lines.push(cyan(bold("│")) + `  Uptime: ${magenta(formatUptime())}  Last check: ${lastChecked.toLocaleTimeString()}        ${cyan(bold("│"))}`);
  lines.push(cyan(bold("├" + box(width) + "┤")));

  for (const svc of SERVICES) {
    const status = statuses.get(svc.name) ?? "checking";
    const icon = statusIcon(status);
    const label = statusLabel(status);
    const namePadded = svc.name.padEnd(20);
    const portStr = dim(`:${svc.port}`.padEnd(8));
    const statusStr = label.padEnd(18);
    const line = `  ${icon}  ${namePadded} ${portStr} ${statusStr}`;
    lines.push(cyan(bold("│")) + line.padEnd(width + 1) + cyan(bold("│")));
  }

  lines.push(cyan(bold("├" + box(width) + "┤")));

  const healthyCount = [...statuses.values()].filter((s) => s === "healthy").length;
  const totalCount = SERVICES.length;
  const overall = healthyCount === totalCount
    ? green(bold("All systems operational"))
    : yellow(`Waiting for ${totalCount - healthyCount} service(s)...`);

  lines.push(cyan(bold("│")) + `  ${overall}`.padEnd(width + 1) + cyan(bold("│")));

  // Endpoints
  lines.push(cyan(bold("├" + box(width) + "┤")));
  lines.push(cyan(bold("│")) + `  ${dim("Endpoints:")}                                                  `.substring(0, width + 2) + cyan(bold("│")));
  lines.push(cyan(bold("│")) + `  GraphQL Playground  ${cyan("http://localhost:8080/")}`.padEnd(width + 1) + cyan(bold("│")));
  lines.push(cyan(bold("│")) + `  Frontend (Vite)     ${cyan("http://localhost:5173/")}`.padEnd(width + 1) + cyan(bold("│")));

  lines.push(cyan(bold("├" + box(width) + "┤")));
  lines.push(cyan(bold("│")) + `  ${dim("Press Ctrl+C to stop all services")}`.padEnd(width + 1) + cyan(bold("│")));
  lines.push(cyan(bold("└" + box(width) + "┘")));

  process.stdout.write(clear + lines.join("\n") + "\n");
}

// ─── Process management ───────────────────────────────────────────────────────

let dockerProc: Subprocess | null = null;
let viteProc: Subprocess | null = null;
let stopped = false;

async function startBackend() {
  console.log(dim("Starting Docker Compose (backend services)..."));
  dockerProc = Bun.spawn({
    cmd: ["docker", "compose", "-f", "docker-compose.yml", "up", "--build", "-d"],
    stdout: "pipe",
    stderr: "pipe",
  });
  await dockerProc.exited.catch(() => {});
}

async function startFrontend() {
  console.log(dim("Starting Vite dev server (frontend)..."));
  viteProc = Bun.spawn({
    cmd: ["bun", "run", "dev"],
    cwd: "frontend",
    stdout: "pipe",
    stderr: "pipe",
  });
}

async function stopAll() {
  if (stopped) return;
  stopped = true;
  process.stdout.write(showCursor);
  process.stdout.write(`\n${yellow("Stopping all services...")}\n`);

  if (viteProc) {
    try { viteProc.kill("SIGTERM"); } catch {}
  }

  try {
    const stopProc = Bun.spawn({
      cmd: ["docker", "compose", "-f", "docker-compose.yml", "down"],
      stdout: "pipe",
      stderr: "pipe",
    });
    await stopProc.exited.catch(() => {});
  } catch {}

  process.stdout.write(`${green("All services stopped. Goodbye!")}\\n`);
  process.exit(0);
}

// ─── Main loop ────────────────────────────────────────────────────────────────

async function main() {
  // Pre-flight: check Docker
  try {
    const dockerCheck = Bun.spawn({
      cmd: ["docker", "info"],
      stdout: "pipe",
      stderr: "pipe",
    });
    const exitCode = await dockerCheck.exited.catch(() => 1);
    if (exitCode !== 0) {
      process.stdout.write(`${red("Docker Desktop is not running. Please start it and try again.")}\n`);
      process.exit(1);
    }
  } catch {
    process.stdout.write(`${red("Docker is not installed or not in PATH.")}\n`);
    process.exit(1);
  }

  process.stdout.write(hideCursor);
  startTime = Date.now();

  await startBackend();
  await startFrontend();

  // Give services a moment to start
  await Bun.sleep(3000);

  // Health-check loop
  const statuses = new Map<string, HealthStatus>();

  async function pollAll() {
    const checks = SERVICES.map(async (svc) => {
      const status = await checkService(svc);
      statuses.set(svc.name, status);
      return [svc.name, status] as const;
    });
    await Promise.all(checks);
    lastChecked = new Date();
    renderDashboard(statuses);
  }

  await pollAll();

  const interval = setInterval(pollAll, 3000);

  process.on("SIGINT", async () => {
    clearInterval(interval);
    await stopAll();
  });
  process.on("SIGTERM", async () => {
    clearInterval(interval);
    await stopAll();
  });
}

main().catch((err) => {
  process.stdout.write(showCursor);
  process.stdout.write(`${red("Fatal error:")} ${err}\n`);
  process.exit(1);
});
