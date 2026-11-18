# Material Register

A full stack app for finding materials in a 10,000-row SAP-style maintenance catalogue: one search box, four filters, sortable columns and server-side pagination, with the whole table state in the URL. Built for Lexin's "The Pragmatist" take-home ([brief](docs/brief.md)).

**Stack:** React Router v7 SPA · shadcn/ui (Tailwind v4) · TanStack Query · tRPC v11 · Node 22 + TypeScript · Drizzle ORM · PostgreSQL 17 (Docker Compose) · zod · Vitest · pnpm workspace.

## Setup

Requires Node 22+, pnpm (`corepack enable`) and Docker running.

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:5173. The API listens on http://localhost:3001/trpc and Vite proxies `/trpc` to it.

- `pnpm db:seed` truncates and refills the tables, so it is safe to re-run. It writes 10,000 materials by default; `SEED_ROWS=50000 pnpm db:seed` makes more. The faker seed is fixed, so everyone gets the same data.
- If port 5432 is taken, change `POSTGRES_PORT` and `DATABASE_URL` in `.env`.
- Try the brief's example: <http://localhost:5173/?q=bearing&status=active&plant=1000&manufacturer=skf> ("all active bearings from SKF stocked at the Brisbane plant", 228 rows).

### Checks and tests

| Command             | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `pnpm test`         | Vitest: unit tests plus API query tests against real Postgres |
| `pnpm typecheck`    | `tsc` in every package                                        |
| `pnpm lint`         | ESLint (type-aware)                                           |
| `pnpm format:check` | Prettier                                                      |
| `pnpm check`        | All four, in that order                                       |

The API tests need the Docker Postgres running (`docker compose up -d`). They never touch the dev data; see [per-run test databases](#per-run-test-databases).

## Project layout

```
apps/web         React Router v7 SPA: Vite, shadcn/ui, TanStack Query via @trpc/tanstack-react-query
  src/features/materials/   the page, table, search box, filters, sort headers, pagination, states
apps/api         tRPC server on the standalone Node HTTP adapter
  src/materials/            list.ts, search.ts, filters.ts, sort.ts, options.ts, router.ts (+ tests)
packages/db      Drizzle schema, generated SQL migrations (drizzle/), seed script and catalogue data
packages/shared  zod schemas, enum lists and types used by both web and api
docs/            brief, AI log
AGENTS.md        instructions for coding agents (CLAUDE.md imports it)
GLOSSARY.md      domain terms
```

Workspace packages export TypeScript source directly, so there is no build step between them.

## Architecture and trade-offs

### Data flow: URL → zod → tRPC → Drizzle SQL → one page

1. **URL.** The table state lives only in the query string: `q`, `type`, `status`, `plant`, `manufacturer`, `sort`, `dir`, `page`, `pageSize`. Lists are comma-separated (`status=active,pending_review`) and defaults are left out. There is no `useState` copy of it, so refresh, back/forward and shared links all restore the same view. The only local state is the search box's draft, which writes `q` after a 300 ms debounce (one request per pause in typing, not per keystroke).
2. **zod.** `parseListSearchParams` in `packages/shared` turns the URL into a `MaterialListInput`, one field at a time: a bad `pageSize` falls back to 50 without resetting your filters, and unknown values in a list are dropped. Changing search, a filter, the sort or the page size sends you back to page 1.
3. **tRPC.** The parsed object is passed straight to `materials.list`, so the TanStack Query key _is_ the URL state. The server validates the same object again with the same `materialListInput` schema, because the browser can't be trusted. Bad input gets a `BAD_REQUEST` with one readable line; unexpected errors get a generic "Internal server error" so SQL and stack traces never reach the browser.
4. **Drizzle SQL.** `listMaterials` composes `searchWhere` and `filterWhere` into one `where`, adds `orderByFor(sort, dir)` and `limit`/`offset`, and runs a `count(*)` over the same joins and `where` in parallel. All values are bound parameters; the sort column comes from an allow-list map, never from the user's string.
5. **Page.** The browser renders exactly the rows it got back. It never filters, sorts or slices.

### Shared package as the contract

`packages/shared` owns the enum lists (material type, status), sort columns, page sizes, the `materialListInput` schema and the URL helpers. The database builds its `pgEnum`s from the same lists, the API uses the schema for `.input()`, and the web uses it to parse the URL, so the three can't drift apart. The web only sees API output types through `import type { AppRouter }`; it never imports runtime code from the API or database packages. This is also what makes the interview's "add a filter or column" change small: add the value to the shared schema and the compiler points at every place that needs it.

### Schema: one row per material per plant

```
plants        (id, code unique, name)                 e.g. 1000 · Brisbane
manufacturers (id, slug unique, name unique)          e.g. skf · SKF
materials     (id, material_number unique, description, type enum, manufacturer_id → manufacturers,
               mpn, plant_id → plants, status enum, unit_of_measure, unit_price numeric(12,2),
               stock_on_hand int, updated_at timestamptz)
```

- **One row is one material at one plant**, as in the brief's table. In SAP a material master is shared across plants with per-plant data (stock, status) in a separate table. I kept the brief's flatter shape because it makes every query a simple two-join select; the split is first in [what's next](#what-id-do-next).
- **Manufacturers are a table, not a text column**, so "SKF" is one row with a stable slug. That gives the brief's example an exact manufacturer filter rather than a fuzzy text match, and gives the filter dropdown a clean list.
- **Enums for type and status** keep invalid values out of the database. Price is `numeric`, not float, because it is money; it goes over the wire as a string so no precision is lost.
- **Plant and manufacturer filters use the public keys** (`plant=1000`, `manufacturer=skf`), not database ids, so URLs are readable and survive a re-seed.

### Search: every word, any of three columns, with ILIKE

The input is trimmed and split on whitespace. Every word must match (AND) at least one of material number, description or MPN (OR), with `ILIKE '%word%'`. So `6205 deep` finds deep groove ball bearings with 6205 in the MPN. `\`, `%` and `_` are escaped so a user's `%` matches only itself.

I chose this over Postgres full-text search because the hard cases here are part numbers (`6205-2RS1`, `MAT-000123`), which full-text tokenising and stemming handle badly, and substring matching is what a planner expects. The cost is that `'%word%'` can't use a btree index, so each search is a sequential scan. At 10,000 rows the brief's demo query runs in about 1.5 ms (`EXPLAIN ANALYZE`), so that is fine for now; trigram indexes are the fix when it isn't (see below). Manufacturer _name_ is not searched, because the brief asks for number, description and MPN and the manufacturer filter covers it.

### Pagination: offset plus `count(*)`

`limit`/`offset` with a `count(*)` over the same `where` gives numbered pages and "Showing 51–100 of 10,000", which is what a planner scanning a catalogue wants. Every `order by` ends with `id`, so rows that tie on the sort column (many share a price or a stock level) keep one fixed order and never repeat or vanish between pages.

Offset gets slower the deeper you page, because Postgres still walks and discards the skipped rows, and `count(*)` is a full pass over the matches. At 10k rows both are milliseconds. **Cursor (keyset) pagination would win** with millions of rows, infinite scroll, or data that changes while you page (offsets shift when rows are inserted). It gives up jumping to page 37 and an exact total.

### Indexes and why

| Index                                        | Used for                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `materials.material_number` (unique)         | Uniqueness, and the default sort (material number ascending)            |
| `materials_type_idx`, `materials_status_idx` | Type and status filters                                                 |
| `materials_plant_id_idx`                     | Plant filter (joined through `plants.code`), and the join itself        |
| `materials_manufacturer_id_idx`              | Manufacturer filter (joined through `manufacturers.slug`), and the join |
| `materials_description_idx`                  | Sorting by description                                                  |
| `materials_unit_price_idx`                   | Sorting by unit price                                                   |
| `materials_stock_on_hand_idx`                | Sorting by stock                                                        |
| `materials_updated_at_idx`                   | Sorting by last updated                                                 |
| `plants.code`, `manufacturers.slug` (unique) | Looking up the filter values the URL carries                            |

The rule (from `AGENTS.md`) is that every filtered or sorted column gets an index in `schema.ts`. Single-column btrees are the plain choice: the planner can combine them, and with only a few distinct types and statuses Postgres will often prefer a scan anyway at this size. Composite indexes would come from measuring real query patterns, not guessing. Search columns don't have indexes yet because `ILIKE '%…%'` can't use a btree.

### Per-run test databases

The query tests run against real Postgres, not mocks, because the SQL _is_ the logic being tested. Each `pnpm test` run creates its own database (`material_register_test_<pid>`) on the Docker server, runs the migrations, loads a ~20-row hand-written fixture and drops it afterwards. That keeps the dev data untouched and let several agent worktrees run tests at the same time. Unit tests cover the shared schema (defaults, URL coercion, rejecting bad values, round-tripping), formatting and the seed builder.

### UX states

Skeleton rows on first load. When the query changes, the previous rows stay on screen dimmed with an "Updating…" badge (`keepPreviousData`), so the table doesn't flash. No matches shows "No materials match" with a Clear filters button. Errors show a plain-language message and Retry, and leave the URL alone so Retry asks for the same view. A page number past the end (a stale link) offers "Go to last page".

### Why tRPC

Web and API are both TypeScript in one repo, so tRPC gives end-to-end types without writing or generating an API spec, and the zod schema is the single definition of valid input. The trade-off is that it is a TypeScript-only RPC API; a public API for other clients would be REST or OpenAPI.

## Performance: trigram search

The one optional extra I picked: `pg_trgm` GIN indexes on material number, description and MPN, measured with `EXPLAIN ANALYZE` before and after. Tracked in [#10](https://github.com/Danzo2/lexin-material-register/issues/10); the results will go here.

## What I'd do next

- **Material–plant split.** A `materials` master (number, description, type, manufacturer, MPN) plus a `material_plants` table (plant, status, stock, price), as in SAP. Then one part stocked at three plants is one material, and search runs over far fewer rows.
- **Detail and edit view.** Click a row to see and edit one material, validated with the same shared zod schemas.
- **Natural-language filters.** Turn "obsolete bearings in Brisbane" into the existing `MaterialListInput` with an LLM and a zod-validated structured output. Because the URL is already the state, the result is just a link.
- **Cursor pagination** if the catalogue grows to millions of rows or needs infinite scroll.
- **CSV export** of the current filtered view, streamed from the same query without the `limit`.
- **Authentication** and per-plant permissions.
- **CI.** Run `pnpm check` with a Postgres service container on every PR (it currently runs locally before each merge).

## How I used AI tools

**Tools:** Claude Code (planning, implementation, reviews) and Codex (independent code review on every PR, plus computer use once). The agent instructions are in [`AGENTS.md`](AGENTS.md) and every mistake is in [`docs/ai-log.md`](docs/ai-log.md).

**How the work was split.** I grilled a plan with Claude into a spec ([#1](https://github.com/Danzo2/lexin-material-register/issues/1)) with recorded decisions, then into tickets as GitHub issues, each with acceptance criteria and a list of files it may touch. A foundation ticket landed first with all the contracts (shared schemas, database schema, API and component stubs). Then an orchestrator session ran six ticket agents in parallel (sorting, filters, pagination, search, UX states, seed), each in its own git worktree and branch with its own dev-server ports and its own test database. Each agent ran `pnpm check`, did a browser check, opened a PR labelled `agent-assisted`, and ran `/code-review` and `codex review` before merging. All six slices merged within a few minutes of each other without conflicts, because no two tickets owned the same file.

**What worked**

- **Contracts first.** Putting every shared type, schema and file name in the foundation ticket is what let parallel agents work without stepping on each other.
- **A second model as reviewer.** Codex caught real bugs Claude had missed or only listed as "known gaps": SQL and stack traces leaking to the browser, a debounce race where Clear all could bring a search back, filter checkboxes that screen readers couldn't read, a keyboard trap in the filter popovers, and seed MPNs that contradicted their descriptions.
- **Making agents look at the real thing.** Browser checks found errors tests didn't (an unreadable "Unexpected end of JSON input" when the API is down; skeleton rows 2px shorter than real rows). Reading seeded rows in `psql` found implausible data.
- **Computer use for GUI-only problems.** Docker Desktop failed to start behind a dialog Claude couldn't see; a Codex agent with computer use read it and fixed the install.
- **Decisions written down.** An "Our decisions" table at the top of the brief and a strict `AGENTS.md` (no `any`, no casts, SQL only on the server, scope per ticket) kept agents consistent.

**What I had to correct** (summarised from the log)

- **Ignoring a recorded decision:** the first scaffold used Mantine although the brief records shadcn/ui. Fixed before any feature code, and the decisions table was added so it couldn't happen again.
- **Environment slips:** Docker Desktop installed as the Intel build on an Apple Silicon Mac; `db:migrate` silently doing nothing on a fresh database (no migration journal); a code generator installing an unrelated npm package called `cn`.
- **Error handling:** raw Drizzle errors with SQL reached the browser until review caught it; the first error state showed a raw JSON parse message.
- **State and timing bugs:** the search debounce racing Clear all (two rounds of fixes); pagination reading the page from the last response rather than the URL, so two quick Next clicks only moved one page (found by review, fixed in the end-to-end check).
- **Accessibility:** `aria-sort` on a button instead of the column header, hidden checkbox state, and popovers with nothing focusable.
- **Tests and data:** tests written against stubs that weren't implemented yet; a locale assumption about month names; seed MPNs that didn't match their descriptions, which took several review passes to get fully consistent.

**Lesson.** Agents are fast and good at following explicit rules, but they report gaps instead of fixing them, assume the happy path, and miss interactions between components. The fixes that worked were structural: write decisions down, give each agent a narrow scope, make a different model review every PR, and require a real browser check of failure states before anything is called done.
