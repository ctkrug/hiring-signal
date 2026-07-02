import { describe, expect, it } from "vitest";
import { EMPTY_FILTER_STATE, filterPostings } from "../filter";
import type { JobPosting } from "../types";

function posting(overrides: Partial<JobPosting>): JobPosting {
  return {
    commentId: 1,
    company: "Acme",
    location: "Remote (US)",
    remote: "remote",
    stack: ["TypeScript"],
    seniority: ["Senior"],
    unparsed: false,
    raw: "Acme | Remote (US) | Senior TypeScript engineer",
    ...overrides,
  };
}

describe("filterPostings", () => {
  it("returns everything when filters are empty", () => {
    const postings = [posting({ commentId: 1 }), posting({ commentId: 2 })];
    expect(filterPostings(postings, EMPTY_FILTER_STATE)).toHaveLength(2);
  });

  it("matches search query against company, location, and raw text", () => {
    const postings = [
      posting({ commentId: 1, company: "Acme Robotics" }),
      posting({ commentId: 2, company: "Foundry Labs", raw: "Foundry Labs | SF | React role" }),
    ];
    expect(filterPostings(postings, { ...EMPTY_FILTER_STATE, query: "robotics" })).toEqual([
      expect.objectContaining({ commentId: 1 }),
    ]);
    expect(filterPostings(postings, { ...EMPTY_FILTER_STATE, query: "react" })).toEqual([
      expect.objectContaining({ commentId: 2 }),
    ]);
  });

  it("filters by exact remote type", () => {
    const postings = [
      posting({ commentId: 1, remote: "remote" }),
      posting({ commentId: 2, remote: "onsite" }),
    ];
    expect(filterPostings(postings, { ...EMPTY_FILTER_STATE, remote: "onsite" })).toEqual([
      expect.objectContaining({ commentId: 2 }),
    ]);
  });

  it("matches stack facet on any selected tag", () => {
    const postings = [
      posting({ commentId: 1, stack: ["Go"] }),
      posting({ commentId: 2, stack: ["Rust"] }),
      posting({ commentId: 3, stack: ["Python"] }),
    ];
    const result = filterPostings(postings, { ...EMPTY_FILTER_STATE, stack: ["Go", "Rust"] });
    expect(result.map((p) => p.commentId)).toEqual([1, 2]);
  });

  it("composes search, remote, and facet filters together", () => {
    const postings = [
      posting({ commentId: 1, remote: "remote", stack: ["Go"], company: "Acme" }),
      posting({ commentId: 2, remote: "onsite", stack: ["Go"], company: "Acme" }),
      posting({ commentId: 3, remote: "remote", stack: ["Python"], company: "Acme" }),
    ];
    const result = filterPostings(postings, {
      query: "acme",
      remote: "remote",
      stack: ["Go"],
      seniority: [],
    });
    expect(result.map((p) => p.commentId)).toEqual([1]);
  });
});
