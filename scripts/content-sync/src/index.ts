import { Glob } from "bun";
import { statSync } from "fs";
import { resolve } from "path";
import { authenticate } from "./client";
import { formatIssues, validateManifest } from "./validate";
import { syncCourse } from "./sync";
import type { SyncReport } from "./sync";
import type { CourseManifest } from "./types";

const REPO_ROOT = resolve(import.meta.dir, "../../..");
const DEFAULT_CONTENT_DIR = resolve(REPO_ROOT, "content/courses");

interface CliOptions {
  targets: string[];
  gateway?: string;
  email?: string;
  password?: string;
  cookieJar?: string;
  validateOnly: boolean;
  quiet: boolean;
}

function printUsage() {
  console.log(
    [
      "StudEd Content Sync — upsert courses/lessons/waves from declarative manifests.",
      "",
      "Usage:",
      "  bun run scripts/content-sync/src/index.ts [options] [path ...]",
      "",
      "Options:",
      "  path                    course.json file or directory of course.json files",
      "                          (default: content/courses)",
      "  --gateway <url>         API gateway base URL (default: $STUDED_API_URL or http://localhost:8080)",
      "  --email <email>         educator email (default: $STUDED_EDUCATOR_EMAIL or demo.educator@studed.lk)",
      "  --password <password>   educator password (default: $STUDED_EDUCATOR_PASSWORD or password1234)",
      "  --cookie-jar <path>     persist session cookies to a file",
      "  --validate              validate manifests only; do not sync",
      "  --quiet                 only print failures",
      "  --help                  show this help",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: string[]): CliOptions | null {
  const opts: CliOptions = { targets: [], validateOnly: false, quiet: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--help":
      case "-h":
        printUsage();
        return null;
      case "--validate":
        opts.validateOnly = true;
        break;
      case "--quiet":
        opts.quiet = true;
        break;
      case "--gateway":
        opts.gateway = argv[++i];
        break;
      case "--email":
        opts.email = argv[++i];
        break;
      case "--password":
        opts.password = argv[++i];
        break;
      case "--cookie-jar":
        opts.cookieJar = argv[++i];
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`unknown option: ${arg}`);
          printUsage();
          return null;
        }
        opts.targets.push(arg);
    }
  }

  return opts;
}

function collectManifestFiles(targets: string[]): string[] {
  if (targets.length === 0) targets = [DEFAULT_CONTENT_DIR];

  const files: string[] = [];
  for (const target of targets) {
    let stat;
    try {
      stat = statSync(target);
    } catch {
      console.error(`[content-sync] path not found: ${target}`);
      process.exitCode = 1;
      continue;
    }

    if (stat.isFile()) {
      files.push(target);
      continue;
    }

    const glob = new Glob("**/course.json");
    for (const file of glob.scanSync(target)) {
      files.push(`${target.replace(/\/$/, "")}/${file}`);
    }
  }

  return [...new Set(files)];
}

type LoadResult =
  | { manifest: CourseManifest; path: string }
  | { error: string; path: string };

async function loadManifest(file: string): Promise<LoadResult> {
  try {
    const raw: unknown = await Bun.file(file).json();
    const result = validateManifest(raw);
    if ("issues" in result && result.issues.length > 0) {
      return { error: formatIssues(result.issues), path: file };
    }
    return { manifest: raw as CourseManifest, path: file };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), path: file };
  }
}

function printReport(report: SyncReport): void {
  const badge = (s: string) =>
    s === "created" ? "created " : s === "updated" ? "updated " : "skipped ";
  console.log(`\n[content-sync] ${report.title} (${report.slug}) — course ${report.course}`);
  for (const lesson of report.lessons) {
    console.log(`  lesson ${badge(lesson.status)} ${lesson.title}`);
    for (const wave of lesson.waves) {
      console.log(`    wave ${badge(wave.status)} ${wave.title}`);
    }
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts) return;

  const files = collectManifestFiles(opts.targets);
  if (files.length === 0) {
    console.error("[content-sync] no course.json manifests found");
    process.exitCode = 1;
    return;
  }

  const loaded = await Promise.all(files.map(loadManifest));
  const ok: { manifest: CourseManifest; path: string }[] = [];
  let failed = 0;

  for (const item of loaded) {
    if ("error" in item) {
      failed++;
      console.error(`[content-sync] INVALID ${item.path}:\n${item.error}`);
    } else {
      ok.push(item);
      if (!opts.quiet) console.log(`[content-sync] valid ${item.path}`);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
  if (opts.validateOnly) {
    console.log(`\n[content-sync] validation complete: ${ok.length} valid, ${failed} invalid`);
    return;
  }
  if (ok.length === 0) return;

  console.log("[content-sync] authenticating educator...");
  const { client } = await authenticate({
    gateway: opts.gateway,
    email: opts.email,
    password: opts.password,
    cookieJarPath: opts.cookieJar,
  });

  for (const { manifest } of ok) {
    const report = await syncCourse(client, manifest);
    printReport(report);
  }

  console.log("\n[content-sync] done");
}

main().catch((err) => {
  console.error(`[content-sync] ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
