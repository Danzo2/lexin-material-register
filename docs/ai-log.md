# AI log

Every time an agent got something wrong and how it was corrected. This feeds the README's "How I used AI tools" section, so keep entries short and honest.

**Format** (newest at the bottom):

```
## YYYY-MM-DD · T<nn> · <agent: Claude Code | Codex | …>
- **What went wrong:** the mistake, as concretely as possible.
- **How it was caught:** test, typecheck, review, manual browser check, human.
- **Correction:** what changed.
- **Lesson:** what we changed in AGENTS.md or the prompt, if anything.
```

---

## 2026-11-18 · setup · Claude Code

- **What went wrong:** Scaffolded the web app with Mantine, although the brief's highlights record shadcn/ui as the chosen UI library.
- **How it was caught:** Human, mid-session.
- **Correction:** Replaced Mantine with shadcn/ui (Tailwind v4, `components.json`, `cn` helper) before any feature code was written.
- **Lesson:** Added an "Our decisions" table to the top of `docs/brief.md` so highlighted decisions are explicit for every agent.

## 2026-11-18 · setup · Claude Code + Codex

- **What went wrong:** Claude installed Docker Desktop with Homebrew without checking that Homebrew lived under `/usr/local` (the Intel prefix) on an Apple Silicon Mac, so it got the Intel build. Docker refused to start and showed an error dialog Claude couldn't see.
- **How it was caught:** `docker version` couldn't reach the socket. A Codex agent with computer use read the dialog ("This is the Intel version of Docker Desktop").
- **Correction:** Codex replaced it with the Apple Silicon build from docker.com. Claude checked that the backend is arm64 and signed by Docker's developer ID.
- **Lesson:** Check `uname -m` against `brew --prefix` before installing casks. Delegating to an agent that can see the screen is the quickest way past GUI-only errors.

## 2026-11-18 · setup · Claude Code

- **What went wrong:** `pnpm db:migrate` failed silently on a fresh database because `packages/db/drizzle/` was empty (no migration journal).
- **How it was caught:** Running the README commands end to end once Docker worked.
- **Correction:** Generated an empty baseline migration with `drizzle-kit generate --custom --name init`.
- **Lesson:** Run the reviewer's exact setup commands against a fresh database before calling setup done.
