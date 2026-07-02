# Backlog

Epic/story breakdown for the build. High-level — enough to guide later BUILD/QA runs, not a
full spec. Check items off as they land.

## Epic 1 — Data ingestion

- [ ] Fetch the current month's thread by id via `findLatestHiringThreadId` + `fetchThreadComments`
- [ ] Support fetching an arbitrary past thread by story id (for the month picker/archive)
- [ ] Handle Algolia fetch failures gracefully (retry once, then surface a build-time error)

## Epic 2 — Parsing & tagging

- [ ] Expand `STACK_KEYWORDS` coverage based on a real thread sample (aim for high recall on
      the top ~40 stack terms actually used)
- [ ] Improve company/location extraction to handle posts that don't follow the
      `Company | Location | ...` convention (fallback heuristics, or mark as unparsed)
- [ ] Add a confidence/`unparsed` flag on `JobPosting` so the UI can visually distinguish
      low-confidence extractions instead of silently guessing

## Epic 3 — Search & filter UI

- [ ] Render the job board list (company, location/remote badge, stack chips, excerpt) per
      the layout in `docs/DESIGN.md`
- [ ] Full-text search across posting text, debounced, filtering the visible list
- [ ] Filter controls for remote type, stack (multi-select), and seniority, composable with
      search
- [ ] Month picker to switch between archived threads
- [ ] Designed empty/loading/error states for the results list (no blank screens)
- [ ] Design polish pass: verify against `docs/DESIGN.md` at 390/768/1440px, confirm every
      control has hover/focus/active/disabled states, squint-test the hierarchy

## Epic 4 — Build & deploy

- [ ] Wire thread fetch + parse into the Vite build so `npm run build` produces a fully
      populated static `dist/` with no runtime API dependency
- [ ] Verify the built site works correctly when served from a subpath (relative asset paths)
      ahead of publishing to `apps.charliekrug.com/hiring-signal`
- [ ] Expand the README with real usage/screenshots once the board is functional
