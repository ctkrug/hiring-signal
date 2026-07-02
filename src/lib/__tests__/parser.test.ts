import { describe, expect, it } from "vitest";
import { isTopLevelJobPost, parseComment, parseThread, stripHtml } from "../parser";
import type { HNComment } from "../types";
import sampleThread from "./fixtures/sample-thread.json";

const { storyId, comments } = sampleThread as { storyId: number; comments: HNComment[] };

describe("stripHtml", () => {
  it("converts paragraph tags to newlines and decodes entities", () => {
    expect(stripHtml("<p>A &amp; B<p>C")).toBe("A & B\nC");
  });

  it("decodes numeric HTML entities HN uses for slashes and punctuation", () => {
    expect(stripHtml("Contract &#x2F; Part-time")).toBe("Contract / Part-time");
    expect(stripHtml("It&#x27;s &#8212; great")).toBe("It's — great");
  });
});

describe("isTopLevelJobPost", () => {
  it("accepts a substantial reply directly to the story", () => {
    expect(isTopLevelJobPost(comments[0]!, storyId)).toBe(true);
  });

  it("rejects a reply to another comment", () => {
    expect(isTopLevelJobPost(comments[2]!, storyId)).toBe(false);
  });

  it("rejects a too-short top-level comment", () => {
    expect(isTopLevelJobPost(comments[3]!, storyId)).toBe(false);
  });
});

describe("parseComment", () => {
  it("extracts company, location, remote type, and stack from a well-formed posting", () => {
    const posting = parseComment(comments[0]!);
    expect(posting.company).toBe("Acme Robotics");
    expect(posting.location).toBe("Remote (US)");
    expect(posting.remote).toBe("remote");
    expect(posting.stack).toEqual(
      expect.arrayContaining(["TypeScript", "Node.js", "PostgreSQL", "Kubernetes", "AWS"]),
    );
    expect(posting.seniority).toContain("Senior");
  });

  it("extracts an onsite posting with junior seniority", () => {
    const posting = parseComment(comments[1]!);
    expect(posting.company).toBe("Foundry Labs");
    expect(posting.remote).toBe("onsite");
    expect(posting.stack).toEqual(expect.arrayContaining(["React", "GraphQL"]));
  });
});

describe("parseThread", () => {
  it("only parses top-level postings, skipping replies and too-short comments", () => {
    const postings = parseThread(comments, storyId);
    expect(postings).toHaveLength(3);
    expect(postings.map((p) => p.commentId)).toEqual([40000001, 40000002, 40000005]);
  });
});

describe("company/location field-order heuristic", () => {
  const post = (text: string): HNComment => ({
    id: 1,
    author: "poster",
    text,
    createdAt: "2026-07-01T14:00:00.000Z",
    parentId: storyId,
  });

  it("swaps fields when the post leads with Location | Company", () => {
    const posting = parseComment(
      post("<p>Berlin, Germany | PixelForge | Remote<p>Hiring a platform engineer."),
    );
    expect(posting.company).toBe("PixelForge");
    expect(posting.location).toBe("Berlin, Germany");
    expect(posting.unparsed).toBe(false);
  });

  it("does not swap when the company name itself contains a comma-separated suffix", () => {
    const posting = parseComment(
      post("<p>Contoso, Inc. | Austin, TX | Remote<p>Hiring a support engineer."),
    );
    expect(posting.company).toBe("Contoso, Inc.");
    expect(posting.location).toBe("Austin, TX");
  });

  it("leaves a normal Company | Location order untouched", () => {
    const posting = parseComment(post("<p>Acme Robotics | Remote (US)<p>Hiring."));
    expect(posting.company).toBe("Acme Robotics");
    expect(posting.location).toBe("Remote (US)");
  });
});

describe("unparsed flag", () => {
  it("is false for a well-formed Company | Location posting", () => {
    expect(parseComment(comments[0]!).unparsed).toBe(false);
  });

  it("is true for a freeform posting with no pipe-delimited opening line", () => {
    const posting = parseComment(comments[4]!);
    expect(posting.unparsed).toBe(true);
    expect(posting.location).toBeNull();
  });
});
