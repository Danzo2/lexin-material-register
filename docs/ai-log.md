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

## 2026-11-19 · T07 · Claude Code

- **What went wrong:** The first error-state draft showed only `error.message`. With the API stopped, the Vite proxy answers with an empty 500, so the planner saw "Failed to execute 'json' on 'Response': Unexpected end of JSON input". Separately, the skeleton rows were 2px shorter than real rows because adjacent `my-0.5` margins collapse.
- **How it was caught:** The manual browser check (killing the API process), and measuring skeleton vs real row heights with `getBoundingClientRect` in the built-in browser.
- **Correction:** `ErrorState` now adds a plain-language hint ("The server could not be reached" when there is no tRPC error body) above the raw message, and the manufacturer skeleton's second line uses `mt-1 mb-0.5` so rows are 53px like the real table.
- **Lesson:** Exercise the failure path in the real browser, not just with `curl`; a proxy can turn "API down" into an error message nobody wrote.

## 2026-11-19 · T03 · Codex (review of Claude Code)

- **What went wrong:** Claude Code's search box decided whether the draft should follow the URL by comparing the URL's `q` with its previous value. If you typed into an empty box and clicked Clear all within the 300 ms debounce, `q` stayed `""`, so the box saw no change and the pending write put the search back after Clear all. Claude's first fix sent the draft straight away when the box lost focus. In the browser, Clear all's navigation replaced that write before it landed, so the URL was clean but the box still showed the old text. The same fix would also have lost the search when you clicked a filter, because React Router's functional `setSearchParams` builds on the params from the last render.
- **How it was caught:** `codex review` (P2). The first fix failed the browser re-test, and reading `useSearchParams` in react-router showed why.
- **Correction:** The box now watches the router's `location.key`, which changes on every navigation. On a new location it follows the URL when `q` changed and it wasn't the box's own write, or when the URL is empty (Clear all).
- **Lesson:** A component that only receives a value can't see events that don't change that value. Test the debounce together with resets that start from the default state, not only from a non-default one.

## 2026-11-19 · T02 · Claude Code

- **What went wrong:** The first realistic seed gave each manufacturer one set of MPN patterns regardless of the item, so a Sandvik stainless bar got a cutting-insert code and a Gates hydraulic hose got a V-belt code.
- **How it was caught:** Reading the first 30 seeded rows in `psql` before opening the PR.
- **Correction:** Moved MPN patterns onto each category's list of makers (`packages/db/src/seed/categories.ts`), so the format depends on both the maker and the kind of item.
- **Lesson:** Look at real seeded rows, not just test results, when the goal is data that "looks real".

## 2026-11-19 · T02 · Codex (review of Claude Code)

- **What went wrong:** Claude Code picked each row's description and MPN independently, so one MPN could name several different products (e.g. the same Festo valve code on 3/2-way and 5/2-way valves). Claude had listed the looser version of this as a known gap rather than fixing it.
- **How it was caught:** `codex review` (P2).
- **Correction:** `createMaterialBuilder()` now remembers one MPN per maker + description and never reuses an MPN for a different description, with a test for both directions. Narrow MPN patterns were widened so the unique-suffix fallback is never needed at 10k or 200k rows.
- **Second pass:** Re-running `codex review` on the fixed head found the MPN _style_ could still contradict the description (a CNMG turning insert with an R390 milling code; a taper roller bearing with a spherical-roller series). Bearings are now one category per kind and inserts are split into turning and milling, each with matching MPN series. A third pass found the same mix in the electrical and belt templates; they are now split into contactor / drive / motor circuit breaker and V-belt / timing belt. Its other point (the same product can appear twice at one plant) was left deliberately: unique maker + description + plant is impossible at 200,000 rows with template descriptions, and duplicate materials are a real SAP data-quality issue.
- **Lesson:** "Looks real" includes consistency across rows, not just plausible values in each row.
