# Vision

## The problem

Once a month, HN's `whoishiring` account posts an "Ask HN: Who is hiring?" thread, and hundreds
of companies reply with a freeform job listing as a comment. It's one of the best job sources on
the internet for developers — no recruiter noise, no LinkedIn spam, self-selected for an
HN-reading audience — but the thread itself is unusable as a _tool_. It's a flat list of
plain-text comments in whatever order they were posted, with no search, no filters, and no way
to answer "which of these are remote and use TypeScript" without reading all of them.

## Who it's for

Developers who already read the monthly thread (or know they should) and want to filter it the
way they'd filter any job board — by remote/onsite, by stack, by seniority — without giving up
the thread's actual signal: it's real listings from real companies, written by the people
hiring, not scraped/reposted/paraphrased.

## The core idea

Fetch a given month's thread via HN's public Algolia Search API (no scraping, no auth), run a
deterministic keyword/pattern extraction pass over each top-level comment to pull out structured
facets, and serve the result as a static, fast, searchable board. The extraction doesn't try to
be a general-purpose NLP model — it's pattern matching tuned to how these posts are actually
written (the `Company | Location | ...` convention, common stack names, common remote phrasing),
which keeps it transparent, debuggable, and cheap to run at build time.

## Key design decisions

- **Static site, no backend.** Parsing happens at build time (or on demand client-side against
  the Algolia API), and the result ships as a plain HTML/CSS/JS bundle. Cheap to host, matches
  the factory's servable-static-site constraint, and there's no user data to protect.
- **Algolia HN Search API as the only data source.** It's public, free, unauthenticated, and
  already indexes full comment trees — no scraping HN's HTML and no rate-limit risk.
- **Deterministic extraction over ML.** Regex/keyword matching against known conventions
  (company/location opening line, stack keyword lists, remote-type phrasing) instead of a
  model call. Every extraction is explainable, the keyword lists are trivial to extend, and it
  costs nothing to run per thread.
- **TypeScript end to end.** The parser (`src/lib`) and the UI share one `JobPosting` type, so
  a change to what gets extracted is a compile error in the UI until it's handled, not a
  silent mismatch.

## What "v1 done" looks like

- A specific month's thread can be fetched and parsed into structured `JobPosting`s with
  reasonable accuracy on company, remote type, stack, and seniority.
- The board renders that list with working full-text search and filters (remote type, stack,
  seniority), fills the viewport with a designed layout (see `docs/DESIGN.md`), and works on
  both desktop and phone widths.
- A month picker lets you browse at least a handful of past threads, not just the latest.
- The whole thing builds to a static bundle with relative asset paths and deploys to
  `apps.charliekrug.com/hiring-signal` with zero server-side component.
