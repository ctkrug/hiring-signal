import { describe, expect, it } from "vitest";
import { extractRemote, extractSeniority, extractStack } from "../tags";

describe("extractStack", () => {
  it("finds multiple stack keywords in freeform text", () => {
    expect(extractStack("We use TypeScript, React, and PostgreSQL daily.")).toEqual([
      "PostgreSQL",
      "React",
      "TypeScript",
    ]);
  });

  it("does not match substrings inside unrelated words", () => {
    // "go" should not match inside "good" or "golang-adjacent"
    expect(extractStack("This is a good opportunity for gophers.")).toEqual([]);
  });

  it("matches Go as a standalone word", () => {
    expect(extractStack("Backend is written in Go and gRPC.")).toContain("Go");
  });

  it("returns an empty array when nothing matches", () => {
    expect(extractStack("We are hiring a marketing lead.")).toEqual([]);
  });

  it("matches modern framework and infra keywords", () => {
    const stack = extractStack(
      "Our stack is Next.js, Tailwind CSS, and Kafka, deployed with SwiftUI on iOS.",
    );
    expect(stack).toEqual(
      expect.arrayContaining(["Next.js", "Tailwind CSS", "Kafka", "SwiftUI", "iOS"]),
    );
  });

  it("normalizes keyword aliases to the same canonical tag", () => {
    expect(extractStack("Built with nextjs.")).toContain("Next.js");
    expect(extractStack("Built with Next.js.")).toContain("Next.js");
  });
});

describe("extractRemote", () => {
  it("detects remote postings", () => {
    expect(extractRemote("Fully remote, US timezones.")).toBe("remote");
  });

  it("detects onsite postings", () => {
    expect(extractRemote("This is an onsite role in NYC.")).toBe("onsite");
  });

  it("detects hybrid postings", () => {
    expect(extractRemote("Hybrid, 3 days in office.")).toBe("hybrid");
  });

  it("falls back to unknown when unstated", () => {
    expect(extractRemote("Great team, great mission.")).toBe("unknown");
  });

  it("classifies an explicit 'no remote' negation as onsite, not remote", () => {
    expect(extractRemote("Onsite only, no remote work permitted.")).toBe("onsite");
    expect(extractRemote("In-office role. No remote applicants please.")).toBe("onsite");
  });
});

describe("extractSeniority", () => {
  it("finds seniority keywords", () => {
    expect(extractSeniority("Looking for a Senior Staff Engineer.")).toEqual(["Senior", "Staff"]);
  });

  it("returns an empty array when unstated", () => {
    expect(extractSeniority("Looking for an Engineer.")).toEqual([]);
  });
});
