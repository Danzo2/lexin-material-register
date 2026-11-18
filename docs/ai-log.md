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

## 2026-11-19 · T01 · Claude Code

- **What went wrong:** `shadcn add` resolved the `utils` alias to a bare `"cn"` import and installed an unrelated npm package called `cn` instead of using `@/lib/utils`. Separately, a format test assumed `en-AU` abbreviates July as "Jul" (ICU prints "July").
- **How it was caught:** Reading the `package.json` diff after the generator ran; the failing Vitest run for the date test.
- **Correction:** Removed the `cn` package, pointed the generated components at `@/lib/utils.ts` (with explicit `.tsx`/`.ts` extensions per AGENTS.md), and changed the test to a month whose abbreviation is unambiguous.
- **Lesson:** Always review dependency diffs from code generators before committing; don't hard-code locale output without running it.

## 2026-11-19 · T01 · Codex (review of Claude Code)

- **What went wrong:** Claude Code added the first real database procedures without sanitising errors. A failed query returned Drizzle's "Failed query: select …" message and the stack trace to the browser, which the error state would then display. This breaks the AGENTS.md rule never to leak SQL or stack traces.
- **How it was caught:** `codex review` (P2), confirmed with `curl` against a database with no tables.
- **Correction:** `apps/api/src/trpc.ts` now sets `isDev: false` and an `errorFormatter` that replaces `INTERNAL_SERVER_ERROR` messages with "Internal server error". The server still logs the full error.
- **Lesson:** When adding the first procedure that touches the database, probe its failure path as well as its happy path.

## 2026-11-19 · T05 · Codex (review of Claude Code)

- **What went wrong:** Claude Code put `aria-sort` on the sort header's `<button>`. ARIA only supports `aria-sort` on column or row headers, so screen readers may not announce the active sort direction.
- **How it was caught:** `codex review` (P2). Claude had listed it as a known gap in the PR but had not given screen-reader users any other way to hear the direction.
- **Correction:** The button now also carries visually hidden text (", sorted ascending/descending"). Moving `aria-sort` to the `<th>` needs a `materials-table.tsx` change outside T05's scope, so it was reported to the orchestrator as a follow-up.
- **Lesson:** Check where an ARIA attribute is valid before choosing the element, even when the ticket allows either option.

## 2026-11-19 · T06 · Claude Code (with Codex review)

- **What went wrong:** Claude Code first wrote filtered-total API tests, forgetting that `filterWhere` and `searchWhere` are still stubs on `main`, so they failed. Separately, the pagination bar computes Next/Previous from `list.data.page`, which is the previous response while `keepPreviousData` is showing stale rows: clicking Next twice before page 2 loads asks for page 2 twice.
- **How it was caught:** The failing Vitest run (tests); `codex review` (P2) for the stale-page navigation.
- **Correction:** Replaced the filtered tests with an unfiltered past-end test plus an `it.todo` pointing at T04 (#5). The stale-page fix needs `materials-page.tsx` (outside T06's scope) to pass the URL's `page`/`pageSize`, or disable the bar while `isPlaceholderData`; reported to the orchestrator instead of changed here.
- **Lesson:** Check which collaborators are still stubs before writing tests against them. With placeholder data, controls should read the URL state, not the last response.

## 2026-11-19 · T04 · Codex (review of Claude Code)

- **What went wrong:** Claude Code hid the filter checkboxes from the accessibility tree (`aria-hidden`) so the whole row could toggle, but forgot that cmdk's `aria-selected` only tracks the keyboard highlight. Screen-reader users couldn't tell which filter values were checked.
- **How it was caught:** `codex review` (P2). Confirmed in the browser by reading the `role=option` attributes.
- **Correction:** Each option now sets `aria-checked` from the selection. Checked in the browser: `Active` reports `true` and the others `false`.
- **Lesson:** When a visual control is made decorative, move its state onto the element assistive tech actually reads.

## 2026-11-19 · T04 · Codex (second review of Claude Code)

- **What went wrong:** Claude Code showed the cmdk find box only on the long Plant and Manufacturer lists. With no input, Type and Status had nothing focusable inside the popover (cmdk items aren't tab stops), so keyboard users couldn't move through or toggle those options.
- **How it was caught:** `codex review` on the head after the first fix (P1).
- **Correction:** Every filter now renders the find box, which takes focus on open. Checked in the browser: Enter opens Type, ArrowDown and Enter set `type=consumable`.
- **Lesson:** Test every new popover control with the keyboard alone, not only with clicks.
