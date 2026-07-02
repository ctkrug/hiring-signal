# Architecture

A concise map of the codebase for anyone (including a future session) picking this up cold.
Keep this current as the build evolves — see `docs/BACKLOG.md` for what's still open.

## Data flow

```
Algolia HN Search API
       │  findRecentHiringThreads() / fetchThreadComments()   src/lib/hn.ts
       ▼
scripts/build-data.ts  (runs before `vite build`, via `npm run build-data`)
       │  parseThread() → JobPosting[]                        src/lib/parser.ts + tags.ts
       ▼
public/data/index.json          — [{ storyId, title, createdAt, monthLabel, postingCount }]
public/data/<storyId>.json      — { ...index entry, postings: JobPosting[] }
       │  copied verbatim into dist/data/ by Vite's publicDir handling
       ▼
src/main.ts  (browser, runtime)
       │  fetch("./data/index.json") → populate month picker
       │  fetch("./data/<storyId>.json") → filterPostings() → renderPostingCard()
       ▼
rendered job board (no runtime API dependency once built)
```

Both `public/data/` and `dist/` are gitignored — regenerated on every `npm run build` /
`npm run build-data`. There is no server and no database; the build is the only place
network I/O happens.

## Modules

**`src/lib/`** — pure, unit-tested logic. No DOM access.

- `types.ts` — shared shapes: `HNComment`, `JobPosting`, `RemoteType`, `HiringThread`,
  `ThreadIndexEntry`, `ThreadData`.
- `hn.ts` — Algolia HN Search API client. `findRecentHiringThreads(limit)` lists monthly
  threads newest-first; `fetchThreadComments(storyId)` flattens a thread's comment tree.
  Both retry once (`fetchJsonWithRetry`) before throwing.
- `parser.ts` — `stripHtml` (tag strip + entity decode) and `parseComment`/`parseThread`,
  which turn a raw `HNComment` into a `JobPosting` by pattern-matching the
  `Company | Location | ...` convention. Sets `unparsed: true` when no separator is found.
- `tags.ts` — keyword → canonical tag tables (`extractStack`, `extractRemote`,
  `extractSeniority`) driving the parser's structured extraction.
- `months.ts` — `formatMonthLabel(isoDate)` → `"July 2026"` for the month picker.
- `filter.ts` — `filterPostings(postings, FilterState)`: full-text search composed with
  remote-type (single-select) and stack/seniority (multi-select, any-of) facets.
- `facets.ts` — `countTagFrequency(postings, "stack" | "seniority")`, ranks tags by how
  often they appear so the filter rail surfaces the most useful values first.
- `debounce.ts` — generic debounce, used to delay board re-filtering while typing.
- `postingCard.ts` — `renderPostingCard(posting)`: pure HTML-string builder for one job
  card (company/location/badge/chips/expandable excerpt/unparsed flag). Escapes all
  user-supplied text.

**`src/ui/shell.ts`** — `renderShell()`: the static app chrome (header, filter rail,
results containers) as an HTML string, rendered once into `#app`.

**`src/main.ts`** — the only DOM-wiring module. Fetches `data/index.json` and the active
thread's JSON, holds `AppState` (index, active thread, `FilterState`), and wires the month
select / search input / remote toggle / stack+seniority chips to `applyFilters()`, which
re-runs `filterPostings` and re-renders `#results-list`. Not unit tested (no jsdom in this
project) — verify UI changes by running `npm run dev` or `npm run build && npm run preview`
and checking in a browser.

**`scripts/build-data.ts`** — Node/tsx script, run via `npm run build-data` (wired into
`npm run build` as a prebuild step). Fetches the 6 most recent threads, parses each, and
writes `public/data/*.json`. A single thread's fetch failure is logged and skipped; the
script only hard-fails if every thread fails.

## Styling

Single stylesheet, `src/style.css`. CSS custom properties in `:root` hold the design tokens
from `docs/DESIGN.md` (colors, fonts, spacing scale, radius, transitions) — components
reference `var(--token)` rather than hardcoded values. No CSS framework or component library.

## Build & test

- `npm run dev` — Vite dev server. Populate `public/data/` first with `npm run build-data`
  if you want real data locally (the dev server doesn't run it automatically).
- `npm run build` — `tsc --noEmit` (type-check) → `build-data` (fetch+parse into
  `public/data/`) → `vite build` (outputs `dist/`, relative asset paths for subpath hosting).
- `npm test` — Vitest, `src/lib/**/*.test.ts`. Covers everything under `src/lib/`; UI wiring
  in `main.ts` is verified manually in a browser, not by these tests.
- `npm run lint` / `npm run format` — ESLint / Prettier check.
