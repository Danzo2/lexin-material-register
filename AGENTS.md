# AGENTS.md: Material Register

Instructions for coding agents (Claude Code, Codex, Cursor) and for the humans reviewing their work. This is the single source of truth; `CLAUDE.md` only imports it.

**The task:** Lexin's "The Pragmatist" take-home. Read [`docs/brief.md`](docs/brief.md) before any ticket, including the "Our decisions" table at the top. A focused, working, well-explained solution beats an ambitious one. Every line must be explainable by the author in a live interview, so prefer plain code over clever code.

## Stack and layout

pnpm workspace, Node 22, TypeScript everywhere, Postgres 17 in Docker Compose.

```
apps/web         React Router v7 SPA (data mode, createBrowserRouter) + Vite + shadcn/ui (Tailwind v4)
                 + TanStack Query via @trpc/tanstack-react-query. Vite proxies /trpc to the API.
apps/api         tRPC v11 on the standalone Node HTTP adapter. Routers, procedures, query logic.
packages/db      Drizzle schema (src/schema.ts), generated SQL migrations (drizzle/), seed script.
packages/shared  zod schemas, enum value lists and inferred types used by BOTH web and api.
docs/            brief.md (+ brief.docx), ai-log.md. Spec and tickets live in GitHub Issues.
```

Workspace packages export TypeScript source directly (no build step). Import local files with an explicit `.ts`/`.tsx` extension. In `apps/web`, `@/` maps to `apps/web/src`.

## Commands

| Task                                 | Command                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| First run                            | `cp .env.example .env && pnpm install && docker compose up -d && pnpm db:migrate && pnpm db:seed` |
| Dev (web :5173, api :3001)           | `pnpm dev` (override with `WEB_PORT` / `API_PORT`)                                                |
| Generate migration after schema edit | `pnpm db:generate` (commit the SQL in `packages/db/drizzle/`)                                     |
| Apply migrations / seed              | `pnpm db:migrate` / `pnpm db:seed`                                                                |
| Typecheck / lint / format / test     | `pnpm typecheck` / `pnpm lint` / `pnpm format:check` / `pnpm test`                                |
| Everything CI-ish                    | `pnpm check`                                                                                      |
| Add a shadcn component               | `pnpm dlx shadcn@latest add <name>` from `apps/web`                                               |

Never hand-edit generated migrations; change `schema.ts` and regenerate. Never edit `pnpm-lock.yaml` by hand.

## Architecture rules (non-negotiable)

1. **All querying happens on the server.** Search, filters, sorting and pagination are SQL (Drizzle query builder) in `apps/api`. The browser never filters, sorts or slices a result set. It renders one page.
2. **Every API input is zod-validated.** Every tRPC procedure declares `.input(schema)` (use `z.object({})` explicitly when there are no inputs). Schemas live in `packages/shared`, never inline in the router. Sort columns are an allow-list enum mapped to Drizzle columns; never interpolate user strings into SQL. Use Drizzle's `sql` template (parameterised), never `sql.raw` with user input.
3. **Shared types live in `packages/shared`.** It owns the enum value lists (material type, status), the list-query input schema, and `z.infer` types. `packages/db` imports the enum lists to build `pgEnum`s; `apps/api` uses the schemas for `.input()`; `apps/web` uses the same schemas to parse the URL. Output types reach the web only through `import type { AppRouter } from "@lexin/api"`. Web must never import runtime code from `apps/api` or `packages/db`, and `packages/shared` must stay browser-safe.
4. **Paginate in SQL with `limit`/`offset` plus a `count(*)` over the same `where`.** Always add a unique tiebreaker (`id`) to `order by` so pages are stable.
5. **Indexes are part of the schema.** Any column we filter or sort on gets an index in `schema.ts`, justified in the README.

## URL state

The URL is the single source of truth for the table. No `useState` copy of filters, sort or page.

- Params: `q`, `type`, `status`, `plant`, `sort`, `dir`, `page`, `pageSize`. Defaults are omitted from the URL.
- Read with `useSearchParams`, then parse with the shared list-input schema (`safeParse`; invalid or unknown values fall back to defaults instead of crashing).
- The parsed object is passed straight to the tRPC query, so the query key equals the URL state. Use `placeholderData: keepPreviousData` to avoid flashing on page change.
- The search box keeps a local draft and writes `q` to the URL after a ~300 ms debounce. That is the only local state.
- Changing search, a filter or sort resets `page` to 1. "Clear all" removes every param. Use `replace` for search keystrokes so history isn't flooded.

## Code style

- TypeScript strict, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (see `tsconfig.base.json`). No `any`, no `as` casts to silence errors, no `!` non-null assertions, no `@ts-ignore`. Fix the type.
- `import type` for type-only imports (lint enforces). Named exports. Small functions, early returns, descriptive names.
- Comments explain _why_, not _what_. No commented-out code, no TODOs without a ticket reference.
- Errors: throw `TRPCError` with a precise code in the API; never leak stack traces or SQL to clients. In the UI every query has loading, empty and error states.
- React: function components, hooks at the top level, derive values instead of syncing state with effects. Use shadcn components from `@/components/ui` before writing bespoke UI.
- Keep dependencies minimal. Adding a package needs a one-line reason in the PR body.
- Never commit secrets. Config comes from the root `.env` (see `.env.example`).

## Testing

- Vitest. Tests sit beside the code as `*.test.ts`. API tests need Docker Postgres running: each run creates its own throwaway database, so parallel worktrees never collide.
- Must have: the list-input schema (defaults, coercion of URL strings, rejection of bad values) and the query builder (search/filter/sort produce the right rows against a real Postgres).
- Write the failing test first when fixing a bug. Don't mock the database for query tests.
- Don't chase coverage. A few meaningful tests beat many shallow ones.

## Definition of done

A ticket is done only when all of these are true and stated in the PR:

1. `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm test` pass (or `pnpm check`).
2. Migrations are generated and committed, and `pnpm db:migrate && pnpm db:seed` works on a fresh database if the schema or seed changed.
3. **Manual browser check:** run `pnpm dev`, open http://localhost:5173 in the built-in browser and exercise the change, including loading, empty and error states, and refresh with the URL to confirm state survives. Note what you checked.
4. README updated if setup, architecture or decisions changed.
5. `docs/ai-log.md` updated if an agent got something wrong this ticket.

Never claim something works without having run it. If a check could not be run, say so and why.

## Git and PRs

- Never push to `main`. Branch per ticket: `feat/T<nn>-short-slug` (also `fix/`, `docs/`, `chore/`).
- Commits: Conventional Commits with emoji, imperative, subject under 72 chars, no trailing period. E.g. `feat: ✨ add materials list procedure`, `fix: 🐛 reset page when filters change`, `docs: 📝 …`, `chore: 🔧 …`, `test: ✅ …`, `perf: ⚡️ …`, `refactor: ♻️ …`. Breaking changes use a `BREAKING CHANGE:` footer, never `!`.
- Write PR titles and bodies with the `/pr` skill. Open as ready for review. List checks run, the manual browser check, and any gaps. Put `Closes #<issue>` in the body.
- Label every PR `agent-assisted`. No AI `Co-Authored-By` trailers in commits and no "Generated with" footers in PRs.
- Before requesting review, run the `/code-review` skill against the branch's merge-base and fix blocking findings.
- Codex review: `codex review --base origin/main` from the branch. Post its findings as a PR comment.
- Squash-merge only after checks pass and the Codex review passes on the final head.

## Working as a team of agents

- **Orchestrator** (the main session) owns the spec issue ([#1](https://github.com/Danzo2/lexin-material-register/issues/1)) and its implementation sub-issues, labelled `implementation`, with native "blocked by" edges. Each ticket states its goal, acceptance criteria, the **files or folders it may touch**, its branch and its dev ports. The orchestrator merges, resolves conflicts and keeps this file current.
- **Ticket sessions** take exactly one unblocked ticket: assign it to yourself, then `git worktree add ../lexin-worktrees/T<nn> -b <branch> origin/main`, `cp` the main checkout's `.env` into it, `pnpm install`, and run `pnpm dev` with the ticket's `WEB_PORT`/`API_PORT` so parallel sessions don't clash. One PR per ticket.
- **Stay in scope.** A session never edits files outside its ticket's scope. If it needs a change elsewhere (e.g. a new field in `packages/shared`), it stops and reports to the orchestrator, who adds or amends a ticket.
- **Log corrections.** Whenever a session corrects itself or is corrected (wrong API, bad assumption, failing check it initially missed), it appends an entry to [`docs/ai-log.md`](docs/ai-log.md) in its PR.
- **Codex reviews every PR before merge**, against the ticket's acceptance criteria and this file. Blocking findings are fixed and re-reviewed on the new head.

## Optional extra (only after the core is merged)

Trigram search: enable `pg_trgm`, add GIN `gin_trgm_ops` indexes on material number, description and MPN, and record `EXPLAIN ANALYZE` for the same search before and after in the README. Pick no other extra.
