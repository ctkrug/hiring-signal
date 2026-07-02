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

## Planned features

- **Ingestion** — pull any month's thread by ID via the HN Algolia API, no scraping.
- **Extraction** — derive company, location, remote type, stack tags, and seniority from
  freeform comment text using deterministic keyword/pattern matching (transparent and
  debuggable, not a black box).
- **Search** — full-text search across parsed postings.
- **Filters** — remote/hybrid/onsite, stack, seniority, location — composable and fast.
- **Month picker** — browse archived threads, not just the latest.

## Stack

TypeScript throughout. Vite for the static site build, Vitest for unit tests around the parser
(the highest-value thing to test — extraction correctness). No backend: the site is a static
bundle that fetches/parses at build time and ships as plain HTML/CSS/JS.

See [`docs/VISION.md`](docs/VISION.md) for the full design rationale and
[`docs/BACKLOG.md`](docs/BACKLOG.md) for the build plan.

## License

MIT — see [LICENSE](LICENSE).
