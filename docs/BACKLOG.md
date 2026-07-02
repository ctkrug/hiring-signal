# Backlog

Epic/story breakdown for the build. High-level — enough to guide later BUILD/QA runs, not a
full spec. Check items off as they land.

## Epic 1 — Data ingestion

- [x] Fetch the current month's thread by id via `findLatestHiringThreadId` + `fetchThreadComments`
- [x] Support fetching an arbitrary past thread by story id (for the month picker/archive) —
      `findRecentHiringThreads` + `scripts/build-data.ts` archive the 6 most recent months
- [x] Handle Algolia fetch failures gracefully (retry once, then surface a build-time error)

## Epic 2 — Parsing & tagging

- [x] Expand `STACK_KEYWORDS` coverage based on a real thread sample (aim for high recall on
      the top ~40 stack terms actually used) — ~75 keywords now, verified against live threads
- [x] Improve company/location extraction to handle posts that don't follow the
      `Company | Location | ...` convention (fallback heuristics, or mark as unparsed) —
      flagged via `unparsed`, not silently guessed
- [x] Add a confidence/`unparsed` flag on `JobPosting` so the UI can visually distinguish
      low-confidence extractions instead of silently guessing

## Epic 3 — Search & filter UI

- [x] Render the job board list (company, location/remote badge, stack chips, excerpt) per
      the layout in `docs/DESIGN.md`
- [x] Full-text search across posting text, debounced, filtering the visible list
- [x] Filter controls for remote type, stack (multi-select), and seniority, composable with
      search
- [x] Month picker to switch between archived threads
- [x] Designed empty/loading/error states for the results list (no blank screens)
- [x] Design polish pass: verify against `docs/DESIGN.md` at 390/768/1440px, confirm every
      control has hover/focus/active/disabled states, squint-test the hierarchy

## Epic 4 — Build & deploy

- [x] Wire thread fetch + parse into the Vite build so `npm run build` produces a fully
      populated static `dist/` with no runtime API dependency
- [x] Verify the built site works correctly when served from a subpath (relative asset paths)
      ahead of publishing to `apps.charliekrug.com/hiring-signal`
- [x] Expand the README with real usage/screenshots once the board is functional

## Epic 5 — QA hardening

- [x] Company/location extraction still mis-orders fields on posts that lead with
      `Location | Company | ...` instead of `Company | Location | ...` (e.g. swapped output
      seen on real July 2026 data) — fixed with a `looksLikeLocation` heuristic (bare
      "remote", or a trailing "City, ST"/"City, Country" suffix that isn't a corporate
      suffix like "Inc.") that swaps the first two segments when warranted
- [x] No screenshots in the README yet — added desktop + mobile screenshots
- [x] No automated visual regression coverage for `src/main.ts`/`src/ui` — added a
      jsdom-backed integration suite (`src/__tests__/main.test.ts`) covering wiring/state;
      visual/layout correctness is still a manual browser check
- [x] Mobile filter rail (<=768px) overflowed all three filter groups into one ~2800px
      horizontal-scroll row with no scroll affordance, hiding Stack/Seniority off-screen —
      fixed by stacking groups vertically with each group's own scrollable chip row
