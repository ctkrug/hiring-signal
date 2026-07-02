import { describe, expect, it } from "vitest";
import { escapeHtml, excerpt, renderPostingCard } from "../postingCard";
import type { JobPosting } from "../types";

function posting(overrides: Partial<JobPosting>): JobPosting {
  return {
    commentId: 1,
    company: "Acme Robotics",
    location: "Remote (US)",
    remote: "remote",
    stack: ["TypeScript", "Node.js"],
    seniority: ["Senior"],
    unparsed: false,
    raw: "Acme Robotics | Remote (US) | Senior Backend Engineer building fleet coordination.",
    ...overrides,
  };
}

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<script>"a" & 'b'</script>`)).toBe(
      "&lt;script&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/script&gt;",
    );
  });
});

describe("excerpt", () => {
  it("collapses whitespace and returns short text unchanged", () => {
    expect(excerpt("Hello\n\nworld  there")).toBe("Hello world there");
  });

  it("truncates long text with an ellipsis at the given length", () => {
    const long = "a".repeat(200);
    const result = excerpt(long, 50);
    expect(result).toBe(`${"a".repeat(50)}…`);
  });
});

describe("renderPostingCard", () => {
  it("includes company, location, remote badge, and stack chips", () => {
    const html = renderPostingCard(posting({}));
    expect(html).toContain("Acme Robotics");
    expect(html).toContain("Remote (US)");
    expect(html).toContain("badge--remote");
    expect(html).toContain("TypeScript");
    expect(html).toContain("Node.js");
  });

  it("escapes company/location/raw text to prevent HTML injection", () => {
    const html = renderPostingCard(
      posting({ company: `<img src=x onerror=alert(1)>`, raw: `<script>evil()</script>` }),
    );
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>evil()</script>");
    expect(html).toContain("&lt;img");
  });

  it("shows the unparsed warning flag only when unparsed", () => {
    expect(renderPostingCard(posting({ unparsed: true }))).toContain("card__flag");
    expect(renderPostingCard(posting({ unparsed: false }))).not.toContain("card__flag");
  });

  it("falls back to placeholder text for missing company/location", () => {
    const html = renderPostingCard(posting({ company: null, location: null }));
    expect(html).toContain("Company not specified");
    expect(html).toContain("Location not specified");
  });

  it("omits chip lists entirely when stack/seniority are empty", () => {
    const html = renderPostingCard(posting({ stack: [], seniority: [] }));
    expect(html).not.toContain("card__chips");
  });
});
