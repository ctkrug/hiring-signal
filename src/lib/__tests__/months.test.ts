import { describe, expect, it } from "vitest";
import { formatMonthLabel } from "../months";

describe("formatMonthLabel", () => {
  it("formats an ISO timestamp as 'Month Year'", () => {
    expect(formatMonthLabel("2026-07-01T15:01:21Z")).toBe("July 2026");
  });

  it("handles year boundaries correctly", () => {
    expect(formatMonthLabel("2025-12-31T23:59:00Z")).toBe("December 2025");
    expect(formatMonthLabel("2026-01-01T00:00:00Z")).toBe("January 2026");
  });
});
