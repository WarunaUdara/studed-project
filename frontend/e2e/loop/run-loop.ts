import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { DeterministicAuditor } from "./audit";
import { CritiqueRunner } from "./critique";
import { runDiscovery } from "./discover";
import type { CritiqueOutput } from "./types";

const LOOP_DIR = path.resolve(__dirname);
const REPORT_FILE = path.resolve(LOOP_DIR, "REPORT.md");

export async function executeLoop(iteration = 1, maxIterations = 3): Promise<void> {
  console.log(`\n======================================================`);
  console.log(`   StudEd Self-Evaluating Agent Loop (Iteration ${iteration}/${maxIterations})`);
  console.log(`======================================================\n`);

  // PHASE 0: DISCOVER
  console.log(`[Phase 0] Running Discovery Engine...`);
  await runDiscovery();

  // PHASE 1: SNAPSHOT
  // Spawned rather than called: see snapshot-cli.ts for why sharing a process
  // with discovery makes every capture time out.
  console.log(`[Phase 1] Capturing Structured Fingerprints...`);
  const snapshotExit = await new Promise<number>((resolve) => {
    const child = spawn("bun", [path.resolve(LOOP_DIR, "snapshot-cli.ts")], {
      stdio: "inherit",
      cwd: path.resolve(LOOP_DIR, "../.."),
    });
    child.on("close", (code) => resolve(code ?? 0));
  });
  if (snapshotExit !== 0) {
    console.warn(`[Phase 1] Snapshot phase exited with code ${snapshotExit}`);
  }

  // PHASE 2: AUDIT
  console.log(`[Phase 2] Executing Deterministic Rule Auditor...`);
  const auditor = new DeterministicAuditor();
  auditor.loadInputs();
  const auditOutput = auditor.runAudit();

  // PHASE 3: CRITIQUE
  console.log(`[Phase 3] Running Three-Pass Critique Engine...`);
  const critiqueRunner = new CritiqueRunner();
  critiqueRunner.loadInputs();
  const critiqueOutput = critiqueRunner.runCritique();

  // GENERATE REPORT.md
  generateReport(iteration, auditOutput, critiqueOutput);

  console.log(`\n======================================================`);
  console.log(`   Iteration ${iteration} Completed. REPORT.md updated.`);
  console.log(`======================================================\n`);
}

function generateReport(iteration: number, audit: any, critique: CritiqueOutput): void {
  const md = `# StudEd UI/UX Self-Evaluating Loop — Iteration ${iteration} Report

**Generated At**: ${new Date().toISOString()}  
**Status**: Completed Phase 0 (Discover), Phase 1 (Snapshot), Phase 2 (Audit), Phase 3 (Critique)

---

## Executive Summary

- **Total Deterministic Faults**: ${audit.summary.totalFaults}
- **P0 Critical Defects**: ${audit.summary.p0Count}
- **P1 Visual / Interaction Defects**: ${audit.summary.p1Count}
- **P2 Polish / Spacing Defects**: ${audit.summary.p2Count}
- **Dark Pattern Flags (Pass B)**: ${critique.passB.length}
- **Creative Backlog Suggestions (Pass C)**: ${critique.passC.length}

---

## Section 1: Pass A — Defects (Fix Loop Candidate)

| Severity | Screen | Root Cause / Fault | Suggested Fix |
|---|---|---|---|
${critique.passA
  .map((d) => `| **${d.severity}** | \`${d.screen}\` | ${d.rootCause} | ${d.suggestedFix} |`)
  .join("\n")}

---

## Section 2: Pass B — Dark Pattern & Dopamine Honesty Audit

${
  critique.passB.length === 0
    ? `> [!NOTE]\n> Zero exploitative dark patterns detected. All rewarded interactions correlate with authentic student mastery and exploration.`
    : critique.passB
        .map(
          (b) => `### ${b.patternName} (${b.category})
- **Screen**: \`${b.screen}\`
- **Description**: ${b.description}
- **Verdict**: **${b.servesVsExploitsVerdict}**
- **Recommendation**: ${b.recommendation}`,
        )
        .join("\n\n")
}

---

## Section 3: Pass C — Creative & Pedagogical Backlog (Human Gate Required)

${critique.passC
  .map(
    (c) => `### ${c.title} (\`${c.category}\`)
- **Target Screen**: \`${c.screen}\`
- **Description**: ${c.description}
- **Pedagogical Rationale**: ${c.rationale}
- **Human Approval**: Mandatory prior to coding.`,
  )
  .join("\n\n")}

---

## Phase 6: Human Gate & Next Steps

1. **Review Pass A Defects**: Address top P0/P1 contrast and aria-label improvements.
2. **Review Pass C Proposals**: Select backlog items for future sprints.
`;

  fs.writeFileSync(REPORT_FILE, md, "utf-8");
}

if (import.meta.main) {
  executeLoop().catch((err) => {
    console.error("[run-loop] Error executing loop:", err);
    process.exit(1);
  });
}
