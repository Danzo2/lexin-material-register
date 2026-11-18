# Material Register

A full stack app for searching, filtering, sorting and paginating 5,000+ material records. Built for Lexin's "The Pragmatist" take-home ([brief](docs/brief.md)).

**Stack:** React Router v7 SPA · shadcn/ui · tRPC · Node + TypeScript · Drizzle ORM · PostgreSQL (Docker Compose) · pnpm workspace.

> 🚧 Work in progress. Sections marked _TBD_ are filled in as tickets land.

## Setup

Requires Node 22+, pnpm (`corepack enable`) and Docker.

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:5173. The API runs on http://localhost:3001/trpc.

Other commands: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm check` (all of them).

## Project layout

```
apps/web         React Router v7 SPA (Vite, shadcn/ui, TanStack Query)
apps/api         tRPC server
packages/db      Drizzle schema, migrations, seed
packages/shared  zod schemas and types shared by web and api
```

## Architecture and trade-offs

_TBD._ Will cover: schema and indexes, why tRPC, server-side query design, URL state, and the shared zod schemas.

## Performance: trigram search

_TBD._ Before and after `EXPLAIN ANALYZE` for the same search.

## What I'd do next

_TBD._

## How I used AI tools

_TBD._ Summary of which tools, what worked and what I corrected, drawn from [`docs/ai-log.md`](docs/ai-log.md). Agent instructions are in [`AGENTS.md`](AGENTS.md).
