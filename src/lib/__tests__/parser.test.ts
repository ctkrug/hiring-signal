import { describe, expect, it } from "vitest";
import { isTopLevelJobPost, parseComment, parseThread, stripHtml } from "../parser";
import type { HNComment } from "../types";
import sampleThread from "./fixtures/sample-thread.json";

const { storyId, comments } = sampleThread as { storyId: number; comments: HNComment[] };

describe("stripHtml", () => {
  it("converts paragraph tags to newlines and decodes entities", () => {
    expect(stripHtml("<p>A &amp; B<p>C")).toBe("A & B\nC");
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
    expect(postings).toHaveLength(2);
    expect(postings.map((p) => p.commentId)).toEqual([40000001, 40000002]);
  });
});
