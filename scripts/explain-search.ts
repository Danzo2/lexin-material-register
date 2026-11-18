// Prints EXPLAIN (ANALYZE, BUFFERS) for the exact SQL that `materials.list` runs for a search.
// Usage (from the repo root):
//   pnpm --filter @lexin/api exec tsx ../../scripts/explain-search.ts "bearing 6205"
//
// It calls the real listMaterials() instead of a copy of its SQL, using Postgres's bundled
// auto_explain module: every statement on these connections has its analyzed plan sent back
// as a NOTICE. The settings go in the connection's startup options; loading a module that
// way needs a superuser, which the Docker Compose user is.
import { listMaterials } from "../apps/api/src/materials/list.ts";
import { createDb, databaseUrl } from "../packages/db/src/index.ts";
import { materialListInput } from "../packages/shared/src/index.ts";

const autoExplain = [
  "session_preload_libraries=auto_explain",
  "auto_explain.log_min_duration=0",
  "auto_explain.log_analyze=on",
  "auto_explain.log_buffers=on",
  "auto_explain.log_level=notice",
];
const url = new URL(databaseUrl());
url.searchParams.set("options", autoExplain.map((setting) => `-c ${setting}`).join(" "));

const input = materialListInput.parse({ q: process.argv[2] ?? "bearing 6205" });
const { db, pool } = createDb(url.toString());

// Only print plans for the second run, so the timings are for a warm cache.
let printPlans = false;
pool.on("connect", (client) => {
  client.on("notice", (notice) => {
    if (printPlans) console.log(`${notice.message ?? ""}\n`);
  });
});

try {
  await listMaterials(db, input);
  printPlans = true;
  const result = await listMaterials(db, input);
  console.log(`q = "${input.q}": ${result.total} matches, ${result.rows.length} rows on page 1`);
} finally {
  await pool.end();
}
