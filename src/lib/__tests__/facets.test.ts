import { describe, expect, it } from "vitest";
import { countTagFrequency } from "../facets";
import type { JobPosting } from "../types";

function posting(overrides: Partial<JobPosting>): JobPosting {
  return {
    commentId: 1,
    company: "Acme",
    location: "Remote",
    remote: "remote",
    stack: [],
    seniority: [],
    unparsed: false,
    raw: "",
    ...overrides,
  };
}

describe("countTagFrequency", () => {
  it("counts occurrences across postings, most frequent first", () => {
    const postings = [
      posting({ stack: ["Go", "Rust"] }),
      posting({ stack: ["Go"] }),
      posting({ stack: ["Python"] }),
    ];
    expect(countTagFrequency(postings, "stack")).toEqual([
      { tag: "Go", count: 2 },
      { tag: "Python", count: 1 },
      { tag: "Rust", count: 1 },
    ]);
  });

  it("breaks ties alphabetically", () => {
    const postings = [posting({ seniority: ["Senior"] }), posting({ seniority: ["Junior"] })];
    expect(countTagFrequency(postings, "seniority")).toEqual([
      { tag: "Junior", count: 1 },
      { tag: "Senior", count: 1 },
    ]);
  });

  it("returns an empty array for no postings", () => {
    expect(countTagFrequency([], "stack")).toEqual([]);
  });
});
