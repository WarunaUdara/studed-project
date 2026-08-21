/**
 * Runs Phase 1 on its own.
 *
 * The snapshot phase has to be a separate process from discovery. Run in the
 * same process, immediately after a crawl, nearly every capture times out;
 * run alone against the identical dev server, warm or cold, the whole set
 * completes in about twenty seconds. Until the leak in that shared state is
 * found, isolation is what keeps the audit usable.
 */
import { runSnapshotEngine } from "./snapshot";

const snapshots = await runSnapshotEngine();
console.log(`[snapshot] captured ${snapshots.length} fingerprints`);
process.exit(0);
