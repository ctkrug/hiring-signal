import type { JobPosting, RemoteType } from "./types";

const REMOTE_LABELS: Record<RemoteType, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
  unknown: "Remote type unknown",
};

const EXCERPT_LENGTH = 140;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** First line of the posting, trimmed to a single-line excerpt for the card summary. */
export function excerpt(raw: string, length = EXCERPT_LENGTH): string {
  const oneLine = raw.replace(/\s+/g, " ").trim();
  return oneLine.length > length ? `${oneLine.slice(0, length).trimEnd()}…` : oneLine;
}

function chipList(className: string, values: string[]): string {
  if (values.length === 0) return "";
  const items = values.map((v) => `<li class="${className}__item">${escapeHtml(v)}</li>`).join("");
  return `<ul class="${className}">${items}</ul>`;
}

/**
 * Renders one JobPosting as a self-contained HTML card. Kept as a pure
 * string-builder (no DOM APIs) so it's testable without jsdom and cheap to
 * re-render on every filter change.
 */
export function renderPostingCard(posting: JobPosting): string {
  const company = escapeHtml(posting.company ?? "Company not specified");
  const location = escapeHtml(posting.location ?? "Location not specified");
  const badge = `<span class="badge badge--${posting.remote}">${REMOTE_LABELS[posting.remote]}</span>`;
  const stackChips = chipList("card__chips", posting.stack);
  const seniorityChips = chipList("card__chips card__chips--seniority", posting.seniority);
  const flag = posting.unparsed
    ? `<p class="card__flag">⚠ auto-extracted — verify company/location in the full post</p>`
    : "";

  return `
    <article class="card" data-comment-id="${posting.commentId}">
      <header class="card__head">
        <div class="card__identity">
          <h3 class="card__company">${company}</h3>
          <p class="card__location">${location}</p>
        </div>
        ${badge}
      </header>
      ${stackChips}
      ${seniorityChips}
      <details class="card__excerpt">
        <summary>${escapeHtml(excerpt(posting.raw))}</summary>
        <p class="card__full">${escapeHtml(posting.raw)}</p>
      </details>
      ${flag}
    </article>
  `.trim();
}
