# Hiring Signal

Turns each month's Hacker News ["Who is hiring?"](https://news.ycombinator.com/submitted?id=whoishiring)
thread into a searchable, filterable job board.

Every month, hundreds of companies post freeform job listings as comments on a single HN
thread. It's a great source of jobs — remote-friendly, no recruiter spam, and the audience is
squarely developers — but the thread itself is just a flat wall of unstructured text with no
search, no filters, and no way to tell what's remote, what stack it uses, or what seniority
it targets without reading every comment.

Hiring Signal fetches a thread via HN's public Algolia Search API, runs a lightweight
extraction pass over each top-level comment to pull out structured facets — company, location,
remote/hybrid/onsite, tech stack, seniority — and serves the result as a fast, static, searchable
board.

## Why this is interesting

It's real (if lite) NLP over messy, inconsistent, human-written text: no two companies format
their post the same way, so the extraction has to be resilient to a wide variety of phrasing
rather than parsing one known schema. That's a meaningfully different problem than a CRUD
job board over structured data.

## Features

- **Ingestion** — fetches the 6 most recent "Who is hiring" threads via the HN Algolia API,
  no scraping, with a retry-once on transient failures.
- **Extraction** — derives company, location, remote type, stack tags, and seniority from
  freeform comment text using deterministic keyword/pattern matching (transparent and
  debuggable, not a black box); low-confidence extractions are flagged rather than guessed
  silently.
- **Search** — full-text search across parsed postings, debounced.
- **Filters** — remote/hybrid/onsite, stack, seniority — composable, ranked by how often
  each tag actually appears in the active month.
- **Month picker** — browse the archive, not just the latest thread.

## Development

```sh
npm install
npm run build-data   # fetch + parse the archive into public/data/ (needed for `dev`)
npm run dev           # vite dev server at localhost:5173
npm test              # vitest — src/lib unit tests
npm run build          # type-check, refresh public/data/, and build dist/
```

The build is fully static: `scripts/build-data.ts` fetches and parses threads at build time,
so `dist/` ships with zero runtime dependency on the Algolia API and works from any subpath
(asset/data paths are all relative). See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for
how the pieces fit together.

## Stack

TypeScript throughout. Vite for the static site build, Vitest for unit tests around the parser
and filtering logic (the highest-value things to test — extraction and search correctness). No
backend: the site is a static bundle that fetches/parses at build time and ships as plain
HTML/CSS/JS.

See [`docs/VISION.md`](docs/VISION.md) for the full design rationale and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## License

MIT — see [LICENSE](LICENSE).
