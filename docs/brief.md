# Take-home assessment: The Pragmatist

> Markdown copy of [`brief.docx`](brief.docx) so agents can read it. The `.docx` is the source of truth; wording below is transcribed, not rewritten.

## Our decisions (highlighted in the original)

Danny highlighted these phrases in `brief.docx`. They are decisions, not just emphasis:

| Highlight                                                                      | Decision                                                                                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| "You must be able to explain every line you submit."                           | Prefer plain, explainable code over clever abstractions. No code lands that the author can't walk through. |
| "shadcn"                                                                       | UI library is **shadcn/ui** (Tailwind v4), not Mantine.                                                    |
| "Docker Compose"                                                               | Postgres runs via `docker-compose.yml`.                                                                    |
| "Generating the data with a library or an AI tool is fine."                    | Seed with `@faker-js/faker` (fixed seed, deterministic).                                                   |
| "we'd rather see the core done well. … pick one at most"                       | Core first. Exactly one extra: Postgres trigram indexes with before/after `EXPLAIN ANALYZE`.               |
| "public"                                                                       | The GitHub repo will be public.                                                                            |
| "How you used AI tools: which tools, what worked, and what you had to correct" | `docs/ai-log.md` is kept throughout and summarised in the README.                                          |
| "AGENTS.md"                                                                    | `AGENTS.md` is the agent context file and stays in the repo.                                               |

---

**AI-Native Full Stack Engineer · Technical Interview**

|               |                                         |         |                                          |
| ------------- | --------------------------------------- | ------- | ---------------------------------------- |
| Expected time | About 3–4 hours                         | Cost    | Free, no paid services needed            |
| Submit        | At least 24 hours before your interview | Contact | Oliver Markey, Lead Full Stack Developer |

**Objective:** Build a small full stack app, from database to API to front end, that lets a user search and filter a table of material records.

## The scenario

Our customers are industrial and maintenance teams who manage large catalogues of materials: spare parts, consumables and raw materials, often synced from SAP. A maintenance planner needs to find the right part quickly, for example "all active bearings from SKF stocked at the Brisbane plant".

Your task is to build a Material Register: a web app that displays material records in a table with search, filtering, sorting and pagination, backed by a real database and API.

## Important notes

- **Cost:** You should not need to pay for anything to complete this task.
- **Flexibility:** Beyond the required tech stack below, you are free to use any additional tools, libraries or approaches you prefer.
- **Time:** We expect this to take about 3–4 hours. Please don't spend significantly more. A focused, working solution beats an ambitious, unfinished one.
- **AI tools:** You are encouraged to use AI coding agents (Claude Code, Codex, Cursor or similar) as you normally would. You must be able to explain every line you submit.

## Tech stack

### Front end

- React Router v7 SPA: a single-page application with client-side routing
- UI library: Mantine or shadcn/ui (your choice). Any table library is fine, such as TanStack Table

### Back end

- Node and TypeScript for the API
- PostgreSQL database
- Run it locally however you like. Docker Compose is recommended
- Drizzle ORM for schema, migrations and queries

## Data

Design a simple schema with at minimum a materials table and one related table (such as plants or manufacturers) linked by a foreign key. A suggested starting point:

| Field                         | Notes                                                                  |
| ----------------------------- | ---------------------------------------------------------------------- |
| Material number               | Unique identifier, such as MAT-000123                                  |
| Description                   | Free text, such as "Bearing, deep groove ball, 25mm bore"              |
| Material type                 | One of a fixed set, such as Spare Part, Consumable, Raw Material, Tool |
| Manufacturer & part number    | Manufacturer name and manufacturer part number (MPN)                   |
| Plant                         | Foreign key to a plants table (code and name, such as 1000 · Brisbane) |
| Status                        | Active, Obsolete or Pending Review                                     |
| Unit of measure, price, stock | Such as EA, unit price in AUD and quantity on hand                     |
| Last updated                  | Timestamp                                                              |

Feel free to change or extend this. Write a seed script that generates at least 5,000 realistic records so that search and pagination are meaningful. Generating the data with a library or an AI tool is fine.

## Core functionality

- **Data table**
  - Display materials in a clean, readable table, including the related plant or manufacturer
  - Pagination, handled on the server
  - Sorting by at least two columns
- **Search**
  - A single search box that matches material number, description and manufacturer part number
  - Case-insensitive, and it shouldn't send a request on every keystroke
- **Filtering**
  - At least two filters, such as material type, status or plant
  - Filters and search work together, and the user can clear them easily
- **API**
  - Search, filtering, sorting and pagination happen in the database, not in the browser
  - Validate API inputs. Design the API as you see fit; we recommend tRPC for type safety, but REST is fine
- **User experience**
  - Loading, empty and error states
  - Table state (search, filters, sort and page) is kept in the URL, so a view can be refreshed or shared

## Optional extras

These are not required, and we'd rather see the core done well. If you have time left, pick one at most:

- Natural-language filters: type "obsolete bearings in Brisbane" and have an LLM turn it into filters. OpenRouter (openrouter.ai) offers free models
- Faster search: use Postgres full-text search or trigram indexes, and tell us how you measured the improvement
- Detail view: click a row to view or edit a single material, with validation
- Tests: a few meaningful tests for the API or the query logic

## Deliverables

- A GitHub repository containing your code (public, or private and shared with us)
- A README.md that includes:
  - Setup instructions. We should be able to run it locally in a few commands
  - Brief notes on your architectural decisions and the trade-offs you made
  - What you'd improve or do next with more time
  - How you used AI tools: which tools, what worked, and what you had to correct
- Any agent context files you used, such as CLAUDE.md or AGENTS.md (please leave them in the repository)

## The interview

We'll spend about 30–35 minutes of your interview on this project. Please have it running locally and be ready to share your screen. We'll ask you to:

- Give a short demo of the app
- Walk us through the code from database to API to front end, and explain why you built it this way
- Make a small change live, such as adding a new filter or column, using your normal tools including AI agents

## How we'll assess it

| Area                | What we look for                                                                        |
| ------------------- | --------------------------------------------------------------------------------------- |
| It works            | The app runs from the README and the core functionality behaves correctly               |
| End-to-end design   | Sensible schema and indexes, a clean API and data handled on the server                 |
| Code quality        | Readable, typed and appropriately simple, with good error handling and input validation |
| User experience     | A clear, usable table with sensible loading, empty and error states                     |
| AI-native judgement | Effective use of agents, and a clear understanding of the code they produced            |
| Communication       | Clear README notes and a confident explanation of your decisions and trade-offs         |

## Questions?

If you have any questions or need clarification, please don't hesitate to reach out to Oliver Markey. Asking questions is encouraged, just as it would be on the job.
