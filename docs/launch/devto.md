---
title: "Grepwork: making the HN 'Who is hiring?' thread searchable"
published: false
tags: typescript, webdev, showdev, jobs
---

Every month, the top "Ask HN: Who is hiring?" post collects hundreds of job listings as freeform
comments. It is one of the better places to find engineering work: remote-friendly, no recruiter
spam, and the audience is squarely developers. The problem is the format. It is one long thread of
plain-text comments with no search, no filters, and no structure. If you only want senior remote
Go roles, you are reading every comment by hand.

I built [Grepwork](https://apps.charliekrug.com/hiring-signal/) to fix that: it turns each month's
thread into a job board you can search and filter by stack, location, remote type, and seniority.
The code is on [GitHub](https://github.com/ctkrug/hiring-signal). Here are the two decisions that
shaped it.

## Decision 1: parse at build time, ship a static site

There is no backend. A small Node script (`scripts/build-data.ts`) runs before the Vite build. It
hits the public Hacker News Algolia Search API, pulls the six most recent "Who is hiring?" threads,
flattens each comment tree, parses every top-level post, and writes the result to static JSON under
`public/data/`. Vite copies that into the bundle, and the browser just fetches JSON and renders.

The trade-off is freshness: the board is only as current as the last deploy. For a thread that
updates monthly, that is fine, and the payoff is large. The site cannot break at runtime if Algolia
has a hiccup, it caches trivially, it costs nothing to host, and it works from any subpath because
every asset and data path is relative. The only place network I/O happens is the build.

## Decision 2: deterministic extraction, not a model

The interesting part is pulling structure out of text that follows no fixed schema. Most posts open
with `Company | Location | ...`, but plenty invert the first two fields, use an en dash or em dash
instead of a pipe, or skip the convention entirely. I went with transparent keyword and pattern
matching rather than an LLM, for three reasons: it is debuggable, it is free to run, and it is easy
to test.

A few details that turned out to matter:

- **Field-order detection.** A `looksLikeLocation` heuristic checks whether a segment is a bare
  remote descriptor or ends in a short `City, ST` suffix, while treating `..., Inc.` as a company
  suffix rather than a place. When the first segment looks like a location and the second does not,
  the two are swapped. This fixed a real class of posts that were showing the city as the company.
- **Negation ordering.** The remote classifier checks `no remote` before the generic `remote`
  pattern, so an onsite post that says "no remote" does not get tagged remote. Order is the whole
  bug fix.
- **Regex-safe keywords.** Stack names like `C#`, `C++`, and `.NET` contain regex metacharacters,
  so the matcher escapes each keyword and wraps it in non-alphanumeric boundaries instead of `\b`
  (which does not behave the way you want around `#` and `+`).

When a post does not follow the opening convention closely enough to trust, the posting is flagged
`unparsed` and the UI shows a small warning rather than presenting a guessed company as fact. Being
honest about low-confidence extraction felt more useful than silently guessing.

## What I would do differently

The build refetches all six threads every time. Caching the raw thread JSON between builds would
make it faster and gentler on the API. I would also like a confidence score per field instead of a
single `unparsed` flag, and support for a couple more opening separators I have seen in the wild.

Try it: [apps.charliekrug.com/hiring-signal](https://apps.charliekrug.com/hiring-signal/) ·
source: [github.com/ctkrug/hiring-signal](https://github.com/ctkrug/hiring-signal)
</content>
