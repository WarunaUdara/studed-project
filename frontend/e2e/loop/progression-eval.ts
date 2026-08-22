/**
 * Progression eval loop.
 *
 * Two passes over the leaderboard, XP, streak, achievement and progress
 * features, run together and reported as one score:
 *
 *   Pass A — Source invariants. Cheap, no stack required. Each rule exists
 *            because the codebase actually broke it: invented classmates,
 *            ranks derived from `rank % 3`, three copies of the name mask,
 *            a scope with no backend. These fail the build if they come back.
 *
 *   Pass B — Live invariants. Drives the real API end to end: register, enrol,
 *            submit, and then assert the award, the ranking, the streak and
 *            the achievement all agree with each other. Skipped with a clear
 *            message when no stack is running.
 *
 * Run: bun run eval:progression   (or `make eval-progression`)
 * The contract each rule defends is documented in docs/PROGRESSION-SYSTEM.md.
 */

import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(__dirname, "../../..");
const FRONTEND_SRC = path.join(REPO, "frontend/src");
const REPORT_FILE = path.join(__dirname, "PROGRESSION-EVAL.md");
const API = process.env.STUDED_API ?? "http://localhost:8080/graphql";

type Severity = "critical" | "high" | "medium";

interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  evidence?: string;
}

const findings: Finding[] = [];
const passed: string[] = [];
let liveSkipped: string | null = null;

function fail(id: string, severity: Severity, title: string, detail: string, evidence?: string) {
  findings.push({ id, severity, title, detail, evidence });
}
function pass(id: string) {
  passed.push(id);
}

/* ------------------------------------------------------------------ *
 * Pass A — source invariants
 * ------------------------------------------------------------------ */

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function read(file: string): string {
  return fs.readFileSync(file, "utf-8");
}

/**
 * Source with comments stripped. These rules are about what a surface renders,
 * not what it says about itself — a comment recording that "David E" was
 * removed must not read as "David E" being rendered.
 */
function code(file: string): string {
  return read(file)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function rel(file: string): string {
  return path.relative(REPO, file);
}

/** Files that render progression signals to a student. */
function progressionSurfaces(): string[] {
  return walk(FRONTEND_SRC).filter((f) => {
    const p = rel(f);
    // The marketing landing page is allowed illustrative data; it is the one
    // place a reader cannot mistake a demo standing for their own.
    if (p.includes("/components/public/")) return false;
    if (p.includes("/lib/demoData")) return false;
    if (p.endsWith(".test.ts") || p.endsWith(".test.tsx")) return false;
    return (
      p.includes("leaderboard") ||
      p.includes("Leaderboard") ||
      p.includes("dashboard/") ||
      p.includes("daily-spark/") ||
      p.includes("achievements") ||
      p.includes("gamification")
    );
  });
}

function checkNoInventedPeople() {
  // The exact invented classmates that shipped, plus the fictional league.
  const ghosts = [
    "David E",
    "Jeremy L",
    "Yolanda J",
    "Ankit K",
    "Waruna U",
    "Hydrogen League",
    "Gold League",
  ];
  const hits: string[] = [];
  for (const file of progressionSurfaces()) {
    const src = code(file);
    for (const ghost of ghosts) {
      if (src.includes(ghost)) hits.push(`${rel(file)} — "${ghost}"`);
    }
  }
  if (hits.length > 0) {
    fail(
      "PROG-A1",
      "critical",
      "Invented people or leagues are rendered to students",
      "A progression surface must show a real value or an empty state. Hardcoded classmates and a league tier with no backend are defects, not placeholders.",
      hits.join("\n"),
    );
  } else {
    pass("PROG-A1");
  }
}

function checkNoMockSchools() {
  const hits: string[] = [];
  for (const file of progressionSurfaces()) {
    if (/MOCK_SCHOOLS|getMockSchool/.test(code(file))) hits.push(rel(file));
  }
  if (hits.length > 0) {
    fail(
      "PROG-A2",
      "critical",
      "Students are labelled with schools they do not attend",
      "The standings page assigned each student a random real Sri Lankan school by hashing their id.",
      hits.join("\n"),
    );
  } else {
    pass("PROG-A2");
  }
}

function checkNoFabricatedTrend() {
  const hits: string[] = [];
  for (const file of progressionSurfaces()) {
    // A trend or rank derived from arithmetic on the rank itself, or from a
    // dice roll, is decoration presented as data.
    const src = code(file);
    if (/rank\s*%\s*\d+\s*===?/.test(src)) {
      hits.push(`${rel(file)} — a trend derived from the rank itself`);
    }
    if (/Math\.random\(\)/.test(src) && /\b(rank|xp|Xp|XP)\b/.test(src)) {
      hits.push(`${rel(file)} — randomised ranking data`);
    }
  }
  if (hits.length > 0) {
    fail(
      "PROG-A3",
      "critical",
      "Ranking movement is fabricated",
      "Up/down arrows and rank climbs must come from real movement or not be shown.",
      hits.join("\n"),
    );
  } else {
    pass("PROG-A3");
  }
}

function checkSingleNameMask() {
  // Masking belongs at the gateway. A frontend copy is how three
  // implementations of one rule came to disagree.
  const hits: string[] = [];
  for (const file of walk(FRONTEND_SRC)) {
    const src = code(file);
    if (/charAt\(0\)\s*\+\s*"\."/.test(src) || /privateLeaderboardName/.test(src)) {
      hits.push(rel(file));
    }
  }
  if (hits.length > 0) {
    fail(
      "PROG-A4",
      "high",
      "A second name-masking implementation exists in the frontend",
      "The gateway masks display names on the way out. Masking again in the client means two rules that can drift apart.",
      hits.join("\n"),
    );
  } else {
    pass("PROG-A4");
  }
}

function checkNoClientSideAchievementRules() {
  const hits: string[] = [];
  for (const file of walk(FRONTEND_SRC)) {
    if (rel(file).endsWith(".test.ts")) continue;
    const src = code(file);
    // The XP thresholds the server owns, re-asserted in the client.
    if (/totalXp\s*>=\s*(500|2000|5000)/.test(src)) {
      hits.push(`${rel(file)} — an XP achievement threshold`);
    }
    if (/computeBadges|BADGE_DEFS/.test(src)) {
      hits.push(`${rel(file)} — a client-side badge rule set`);
    }
  }
  if (hits.length > 0) {
    fail(
      "PROG-A5",
      "high",
      "Achievement unlock rules are duplicated in the frontend",
      "gamification-service owns the rules and returns an `unlocked` flag. A client copy reads a different XP total and can disagree.",
      hits.join("\n"),
    );
  } else {
    pass("PROG-A5");
  }
}

function checkNoUnbackedScope() {
  const schema = path.join(REPO, "services/api-gateway/graph/schema.graphqls");
  if (!fs.existsSync(schema)) return;
  if (/^\s*FRIENDS\s*$/m.test(read(schema))) {
    fail(
      "PROG-A6",
      "high",
      "A leaderboard scope exists with nothing behind it",
      "FRIENDS was in the enum with no friends model, so the tab could only ever return an empty board.",
      rel(schema),
    );
  } else {
    pass("PROG-A6");
  }
}

function checkOneReattemptPolicy() {
  const file = path.join(REPO, "services/progress-service/internal/service/progress.go");
  if (!fs.existsSync(file)) return;
  const src = read(file);
  // The cap was enforced on submit while the response hardcoded -1.
  if (/remainingAttempts\s*:?=\s*int32\(-1\)/.test(src)) {
    fail(
      "PROG-A7",
      "critical",
      "The reattempt cap is enforced but not reported",
      "RecordAttempt refused submissions past the cap while telling the client attempts were unlimited.",
      rel(file),
    );
  } else {
    pass("PROG-A7");
  }
}

function checkStreakIsNotMutatedOnRead() {
  const file = path.join(REPO, "services/gamification-service/internal/service/gamification.go");
  if (!fs.existsSync(file)) return;
  const src = read(file);
  const start = src.indexOf("func (s *gamificationService) GetUserStreak(");
  if (start === -1) return;
  const body = src.slice(start, src.indexOf("\nfunc ", start + 10));
  if (/SaveStreak|AwardXp/.test(body)) {
    fail(
      "PROG-A8",
      "critical",
      "Reading a streak mutates it",
      "`me` calls GetUserStreak on every page load. A streak that advances there measures browsing, not learning.",
      rel(file),
    );
  } else {
    pass("PROG-A8");
  }
}

function checkNoDeadProgressionModules() {
  const dead = [
    "frontend/src/lib/gamificationUtils.ts",
    "frontend/src/components/gamification/LeaderboardTable.tsx",
  ];
  const present = dead.filter((f) => fs.existsSync(path.join(REPO, f)));
  if (present.length > 0) {
    fail(
      "PROG-A9",
      "medium",
      "Dead progression modules are back",
      "These had zero importers while their contents were copy-pasted inline elsewhere.",
      present.join("\n"),
    );
  } else {
    pass("PROG-A9");
  }
}

function checkOneLeaderboardRow() {
  // Every board renders the shared row. Counting bespoke rows catches the
  // six-renderings problem returning.
  const bespoke: string[] = [];
  for (const file of progressionSurfaces()) {
    // Components only: a helper module that mentions "rank" renders nothing.
    if (!file.endsWith(".tsx")) continue;
    const src = code(file);
    const rendersRanking = /\brank\b/.test(src) && /totalXp|XP</.test(src);
    // LeaderboardRankings is the educator-side shared table; either is fine,
    // what is not fine is a fifth bespoke row.
    const usesShared = /LeaderboardRow|LeaderboardRankings/.test(src);
    const isShared = /LeaderboardRow\.tsx|leaderboard-rankings\.tsx/.test(rel(file));
    if (rendersRanking && !usesShared && !isShared) bespoke.push(rel(file));
  }
  if (bespoke.length > 0) {
    fail(
      "PROG-A10",
      "medium",
      "A leaderboard row is rendered without the shared component",
      "Six separate row renderings existed before, four of which showed invented people.",
      bespoke.join("\n"),
    );
  } else {
    pass("PROG-A10");
  }
}

/* ------------------------------------------------------------------ *
 * Pass B — live invariants
 * ------------------------------------------------------------------ */

interface GqlResult {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

async function gql(
  query: string,
  variables: Record<string, unknown> = {},
  cookies: string[] = [],
): Promise<{ body: GqlResult; setCookies: string[] }> {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookies.length > 0 ? { Cookie: cookies.join("; ") } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return {
    body: (await res.json()) as GqlResult,
    setCookies: setCookie.map((c) => c.split(";")[0]),
  };
}

async function stackIsUp(): Promise<boolean> {
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "query{__typename}" }),
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function runLivePass(): Promise<void> {
  if (!(await stackIsUp())) {
    liveSkipped = `No API reachable at ${API}. Start the stack (docker compose up -d) to run the live pass.`;
    return;
  }

  const stamp = Date.now();
  const email = `prog-eval-${stamp}@studed.lk`;
  const password = "Str0ngPassphrase!42";
  let jar: string[] = [];

  const call = async (q: string, v: Record<string, unknown> = {}) => {
    const { body, setCookies } = await gql(q, v, jar);
    if (setCookies.length > 0) jar = setCookies;
    return body;
  };

  // --- register ---
  const reg = await call(
    "mutation R($i:RegisterInput!){register(input:$i){user{id fullName streak longestStreak lastActiveAt}}}",
    {
      i: {
        email,
        password,
        fullName: "Eval Runner",
        preferredLanguage: "en",
        grade: "G10",
      },
    },
  );
  const user = (reg.data?.register as { user?: Record<string, unknown> })?.user;
  if (!user) {
    fail(
      "PROG-B0",
      "critical",
      "Could not register an eval student",
      "The live pass cannot run.",
      JSON.stringify(reg.errors ?? reg),
    );
    return;
  }
  const userId = user.id as string;
  pass("PROG-B0");

  // --- reading `me` must never advance the streak ---
  const streaks: unknown[] = [];
  for (let i = 0; i < 3; i++) {
    const me = await call("query{me{streak}}");
    streaks.push((me.data?.me as { streak?: number })?.streak);
  }
  if (new Set(streaks.map(String)).size !== 1 || streaks[0] !== 0) {
    fail(
      "PROG-B1",
      "critical",
      "Reading `me` advanced the streak",
      "A streak must count days of learning, not page loads.",
      `three reads returned ${JSON.stringify(streaks)}`,
    );
  } else {
    pass("PROG-B1");
  }

  // --- an unranked student gets an answer, not an error ---
  const empty = await call(
    "query($s:LeaderboardScope!){leaderboard(scope:$s,limit:5){totalRanked me{rank}}}",
    { s: "GLOBAL" },
  );
  const emptyBoard = empty.data?.leaderboard as { me?: unknown } | undefined;
  if (empty.errors || !emptyBoard) {
    fail(
      "PROG-B2",
      "high",
      "The leaderboard errors for a student with no XP",
      "Not being ranked yet is an ordinary answer.",
      JSON.stringify(empty.errors),
    );
  } else if (emptyBoard.me !== null) {
    fail("PROG-B2", "high", "An unranked student was given a standing", "Expected me:null.");
  } else {
    pass("PROG-B2");
  }

  const rank = await call("query($s:LeaderboardScope!){myRank(scope:$s)}", { s: "GLOBAL" });
  if (rank.errors) {
    fail(
      "PROG-B3",
      "high",
      "myRank errors when the student is unranked",
      "It must return null.",
      JSON.stringify(rank.errors),
    );
  } else {
    pass("PROG-B3");
  }

  // --- the catalog returns locked achievements too ---
  const ach = await call("query{achievements{id unlocked unlockedAt}}");
  const catalog = (ach.data?.achievements as Array<Record<string, unknown>>) ?? [];
  if (catalog.length === 0) {
    fail(
      "PROG-B4",
      "high",
      "The achievements catalog is empty for a new student",
      "Locked achievements must be returned so the UI need not know the rules.",
    );
  } else if (catalog.some((a) => a.unlocked)) {
    fail("PROG-B4", "high", "A brand new student already has achievements", "");
  } else {
    pass("PROG-B4");
  }

  // --- find a wave to submit ---
  const cat = await call(
    "query{courses(pagination:{first:40}){edges{node{id title isPublished lessons{waves{id isPublished evaluateBlocks{id options}}}}}}}",
  );
  const edges =
    (cat.data?.courses as { edges?: Array<{ node: Record<string, any> }> })?.edges ?? [];
  let course: Record<string, any> | null = null;
  let wave: Record<string, any> | null = null;
  for (const edge of edges) {
    if (!edge.node.isPublished) continue;
    for (const lesson of edge.node.lessons ?? []) {
      for (const w of lesson.waves ?? []) {
        if (w.isPublished && (w.evaluateBlocks ?? []).length > 0) {
          course = edge.node;
          wave = w;
          break;
        }
      }
      if (wave) break;
    }
    if (wave) break;
  }

  if (!course || !wave) {
    liveSkipped = "No seeded published wave with questions; the award chain was not exercised.";
    return;
  }

  await call("mutation E($id:ID!){enrollInCourse(courseId:$id){id}}", { id: course.id });

  const answers = (wave.evaluateBlocks as Array<Record<string, any>>).map((b) => ({
    evaluateBlockId: b.id,
    answer: (b.options ?? ["x"])[0],
  }));
  const submissionId = `prog-eval-${stamp}`;
  const submitQuery =
    "mutation S($w:ID!,$a:[AnswerInput!]!,$s:String){submitWaveAnswers(waveId:$w,answers:$a,submissionId:$s){score passed xpEarned totalXp remainingAttempts}}";

  const first = await call(submitQuery, { w: wave.id, a: answers, s: submissionId });
  const result = first.data?.submitWaveAnswers as Record<string, any> | undefined;
  if (!result) {
    fail(
      "PROG-B5",
      "critical",
      "A wave submission failed",
      "A graded attempt must never be lost to a downstream failure.",
      JSON.stringify(first.errors),
    );
    return;
  }
  pass("PROG-B5");

  // --- a replay must agree with the original in every field ---
  const replay = await call(submitQuery, { w: wave.id, a: answers, s: submissionId });
  const rep = replay.data?.submitWaveAnswers as Record<string, any> | undefined;
  const mismatches = (["score", "passed", "xpEarned", "totalXp", "remainingAttempts"] as const)
    .filter((k) => rep?.[k] !== result[k])
    .map((k) => `${k}: ${result[k]} then ${rep?.[k]}`);
  if (mismatches.length > 0) {
    fail(
      "PROG-B6",
      "critical",
      "An idempotent replay disagreed with the original submission",
      "A client retrying after a timeout must be told the same thing.",
      mismatches.join("\n"),
    );
  } else {
    pass("PROG-B6");
  }

  if (!result.passed) {
    liveSkipped = `The eval guessed wrong (score ${result.score}), so the award chain was not exercised.`;
    return;
  }

  // --- the award chain ---
  const me = await call("query{me{totalXp streak lastActiveAt}}");
  const profile = (me.data?.me as Record<string, any>) ?? {};
  if (!(profile.totalXp > 0)) {
    fail("PROG-B7", "critical", "A passed wave credited no XP", "", JSON.stringify(profile));
  } else {
    pass("PROG-B7");
  }
  if (profile.streak !== 1) {
    fail(
      "PROG-B8",
      "high",
      "Passing a wave did not advance the streak",
      "Learning is what advances a streak.",
      `streak=${profile.streak}`,
    );
  } else {
    pass("PROG-B8");
  }

  // --- every scope the student stands on ---
  let globalXp = 0;
  for (const scope of ["GLOBAL", "WEEKLY", "GRADE"] as const) {
    const board = await call(
      "query($s:LeaderboardScope!){leaderboard(scope:$s,limit:100){totalRanked me{rank displayName totalXp isMe}}}",
      { s: scope },
    );
    const mine = (board.data?.leaderboard as { me?: Record<string, any> })?.me;
    if (!mine) {
      fail(
        `PROG-B9-${scope}`,
        "critical",
        `The ${scope} board did not rank a student who just passed a wave`,
        "",
        JSON.stringify(board.errors),
      );
      continue;
    }
    if (scope === "GLOBAL") globalXp = mine.totalXp;
    if (mine.displayName !== "Eval R.") {
      fail(
        `PROG-B10-${scope}`,
        "high",
        `The ${scope} board did not mask the display name`,
        'Expected "Eval R.".',
        String(mine.displayName),
      );
    } else if (mine.isMe !== true) {
      fail(
        `PROG-B11-${scope}`,
        "high",
        `The ${scope} board did not mark the viewer's own row`,
        "Without isMe the You highlight cannot work.",
      );
    } else {
      pass(`PROG-B9-${scope}`);
    }
  }

  // --- a course board ranks by course XP, not the global total ---
  const courseBoard = await call(
    "query($s:LeaderboardScope!,$c:ID){leaderboard(scope:$s,courseId:$c,limit:20){me{rank totalXp}}}",
    { s: "COURSE", c: course.id },
  );
  const courseMine = (courseBoard.data?.leaderboard as { me?: Record<string, any> })?.me;
  if (!courseMine) {
    fail("PROG-B12", "high", "The course board did not rank the student", "");
  } else if (courseMine.totalXp > globalXp) {
    fail(
      "PROG-B12",
      "high",
      "The course board carries more XP than the student's global total",
      "A course board must hold only XP earned inside that course.",
      `course=${courseMine.totalXp} global=${globalXp}`,
    );
  } else {
    pass("PROG-B12");
  }

  // --- the achievement the pass earned ---
  const after = await call("query{achievements{id unlocked}}");
  const list = (after.data?.achievements as Array<Record<string, any>>) ?? [];
  if (!list.some((a) => a.id === "first_wave" && a.unlocked)) {
    fail("PROG-B13", "high", "first_wave did not unlock on a first passed wave", "");
  } else if (!list.some((a) => !a.unlocked)) {
    fail("PROG-B13", "medium", "Locked achievements stopped being returned", "");
  } else {
    pass("PROG-B13");
  }

  void userId;
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

function writeReport(): void {
  const total = passed.length + findings.length;
  const critical = findings.filter((f) => f.severity === "critical").length;
  const high = findings.filter((f) => f.severity === "high").length;
  const medium = findings.filter((f) => f.severity === "medium").length;

  const lines = [
    "# Progression eval",
    "",
    `Run at ${new Date().toISOString()}`,
    "",
    `**${passed.length} of ${total} invariants hold.**`,
    critical + high + medium > 0
      ? `${critical} critical, ${high} high, ${medium} medium.`
      : "No findings.",
    "",
    liveSkipped ? `> Live pass incomplete: ${liveSkipped}\n` : "",
    "The contract these rules defend is in `docs/PROGRESSION-SYSTEM.md`.",
    "",
  ];

  if (findings.length > 0) {
    lines.push("## Findings", "");
    for (const f of findings) {
      lines.push(`### ${f.severity.toUpperCase()} · ${f.id} — ${f.title}`, "", f.detail, "");
      if (f.evidence) lines.push("```", f.evidence, "```", "");
    }
  }

  lines.push("## Holding", "", ...passed.map((id) => `- ${id}`), "");
  fs.writeFileSync(REPORT_FILE, lines.join("\n"));
}

async function main() {
  console.log("Progression eval\n");

  console.log("Pass A — source invariants");
  checkNoInventedPeople();
  checkNoMockSchools();
  checkNoFabricatedTrend();
  checkSingleNameMask();
  checkNoClientSideAchievementRules();
  checkNoUnbackedScope();
  checkOneReattemptPolicy();
  checkStreakIsNotMutatedOnRead();
  checkNoDeadProgressionModules();
  checkOneLeaderboardRow();
  console.log(`  ${passed.length} holding, ${findings.length} failing\n`);

  console.log("Pass B — live invariants");
  const before = passed.length;
  await runLivePass();
  console.log(`  ${passed.length - before} holding`);
  if (liveSkipped) console.log(`  note: ${liveSkipped}`);
  console.log("");

  writeReport();

  for (const f of findings) {
    console.log(`  FAIL  [${f.severity}] ${f.id} — ${f.title}`);
    if (f.evidence) {
      for (const line of f.evidence.split("\n").slice(0, 4)) console.log(`          ${line}`);
    }
  }

  const total = passed.length + findings.length;
  console.log(
    `\n${passed.length}/${total} invariants hold. Report: ${path.relative(REPO, REPORT_FILE)}`,
  );

  // Only critical and high findings fail the run; medium is a nudge.
  const blocking = findings.filter((f) => f.severity !== "medium").length;
  process.exit(blocking > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("progression eval crashed:", err);
  process.exit(2);
});
