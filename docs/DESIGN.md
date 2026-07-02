# Design direction

## Aesthetic direction

**Terminal-mono, HN-flavored.** Hiring Signal looks like a well-kept terminal built for
developers: dark backdrop, monospace accents, sharp low-radius edges, and Hacker News's own
signature orange as the single accent color that ties the product back to its source. It should
feel fast, dense-but-legible, and unmistakably built _for_ the HN audience — not a generic SaaS
dashboard that happens to show job listings.

## Tokens

| Token              | Value                                                                                      | Use                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `--bg`             | `#0d1117`                                                                                  | page background                                                         |
| `--surface-1`      | `#151b23`                                                                                  | cards, panel backgrounds                                                |
| `--surface-2`      | `#1c232c`                                                                                  | raised elements (inputs, chips, hovered rows)                           |
| `--text`           | `#e6edf3`                                                                                  | primary text                                                            |
| `--text-muted`     | `#8b949e`                                                                                  | secondary text, metadata                                                |
| `--accent`         | `#ff6600`                                                                                  | HN orange — primary actions, active filters, wordmark                   |
| `--accent-support` | `#58a6ff`                                                                                  | links, secondary interactive accents                                    |
| `--success`        | `#3fb950`                                                                                  | remote badge, positive states                                           |
| `--danger`         | `#f85149`                                                                                  | error state                                                             |
| Display font       | **JetBrains Mono** (700)                                                                   | wordmark, headings — system fallback `ui-monospace, monospace`          |
| UI font            | **Inter**                                                                                  | body copy, listings, controls — system fallback `system-ui, sans-serif` |
| Spacing unit       | 8px scale (4/8/16/24/32/48)                                                                | all padding/margin/gap                                                  |
| Corner radius      | 6px                                                                                        | terminal-window feel — sharp but not brutalist                          |
| Shadow/glow        | `0 0 0 1px var(--surface-2)` resting, `0 0 0 2px var(--accent)` + soft amber glow on focus | cards, focus rings                                                      |
| Motion             | UI transitions 150ms ease-out; hover/press 120ms ease-out                                  | never longer than 250ms                                                 |

Not pure black/white: `--bg` is `#0d1117`, not `#000`, and `--text` is `#e6edf3`, not `#fff` —
avoids the flat/generic look pure extremes give.

## Layout intent

The **job board list** is the hero. Above it, a compact header bar: wordmark on the left, a
month picker and the search input on the right — all in one row on desktop, stacked on phone.
Below the header, a slim filter rail (remote type, stack multi-select, seniority) sits to the
left of the results on desktop (≈20% width) and collapses into a horizontal scroll-chip row
above the results on phone. The results list itself takes the remaining space and fills at
least 65vh on desktop — each posting is a card showing company, location/remote badge, stack
tags as mono chips, and a one-line excerpt, expandable to the full text.

- **1440×900 desktop:** header row (64px) → filter rail (left, sticky) + results (right, fills
  remaining viewport height, scrollable).
- **390×844 phone:** header stacks to three rows (wordmark, then month picker, then search) →
  filter rail stacks Remote/Stack/Seniority as separate titled rows, each with its own
  horizontally-scrolling chip strip (so every group stays visible — no group scrolls fully
  off-screen behind another) → results stack full-width, one card per row.

No dead space: the results column always fills its container height (min-height: 65vh) even
when a filtered set is short — an empty state fills that space instead of leaving blank
background.

## Signature detail

The wordmark renders as `Hiring Signal_` with a CSS-animated block cursor (steps() blink,
so it looks like a real terminal caret, not a smooth fade) after "Signal." The search input
carries a `$` prompt prefix instead of a magnifying-glass icon, reinforcing the terminal
framing without relying on an icon font or SVG library.

## Juice plan

Not a game — no juice plan required. Interaction feedback is limited to the craft-rule
requirements: themed hover/focus/active/disabled states on every control, 120–250ms ease-out
transitions, and a designed empty/loading/error state for the results list (each rendered in
the terminal-mono voice, e.g. a blinking `> no postings match your filters_` empty state).
