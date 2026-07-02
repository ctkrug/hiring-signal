// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ThreadData, ThreadIndexEntry } from "../lib/types";

const julyIndex: ThreadIndexEntry = {
  storyId: 100,
  title: "Ask HN: Who is hiring? (July 2026)",
  createdAt: "2026-07-01T00:00:00.000Z",
  monthLabel: "July 2026",
  postingCount: 2,
};

const juneIndex: ThreadIndexEntry = {
  storyId: 200,
  title: "Ask HN: Who is hiring? (June 2026)",
  createdAt: "2026-06-01T00:00:00.000Z",
  monthLabel: "June 2026",
  postingCount: 1,
};

const julyData: ThreadData = {
  ...julyIndex,
  postings: [
    {
      commentId: 1,
      company: "Acme Robotics",
      location: "Remote (US)",
      remote: "remote",
      stack: ["TypeScript", "React"],
      seniority: ["Senior"],
      unparsed: false,
      raw: "Acme Robotics | Remote (US)\nHiring a senior TypeScript/React engineer.",
    },
    {
      commentId: 2,
      company: "Foundry Labs",
      location: "San Francisco, CA",
      remote: "onsite",
      stack: ["React"],
      seniority: [],
      unparsed: false,
      raw: "Foundry Labs | San Francisco, CA\nOnsite frontend role.",
    },
  ],
};

const juneData: ThreadData = {
  ...juneIndex,
  postings: [
    {
      commentId: 3,
      company: "Nimbus",
      location: "Remote",
      remote: "remote",
      stack: ["Go"],
      seniority: ["Staff"],
      unparsed: false,
      raw: "Nimbus | Remote\nStaff backend role.",
    },
  ],
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function mockFetch(routes: Record<string, unknown>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const entry = Object.entries(routes).find(([path]) => url.endsWith(path));
      if (!entry) return Promise.resolve(new Response("not found", { status: 404 }));
      return Promise.resolve(jsonResponse(entry[1]));
    }),
  );
}

async function loadApp(): Promise<void> {
  document.body.innerHTML = '<div id="app"></div>';
  vi.resetModules();
  await import("../main");
  // Let the init()/loadThread() promise chains settle.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("main.ts app wiring", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("populates the month picker and renders the newest thread's postings by default", async () => {
    mockFetch({
      "data/index.json": [julyIndex, juneIndex],
      "data/100.json": julyData,
    });
    await loadApp();

    const options = Array.from(document.querySelectorAll("#month-picker option")).map(
      (o) => o.textContent,
    );
    expect(options).toEqual(["July 2026", "June 2026"]);
    expect(document.querySelectorAll("#results-list .card")).toHaveLength(2);
    expect(document.querySelector("#results-status")?.textContent).toContain(
      "showing 2 of 2 postings for July 2026",
    );
  });

  it("filters the board as the user types, debounced", async () => {
    mockFetch({
      "data/index.json": [julyIndex],
      "data/100.json": julyData,
    });
    await loadApp();

    const input = document.querySelector<HTMLInputElement>("#search-input")!;
    input.value = "foundry";
    input.dispatchEvent(new Event("input"));

    // Immediately after typing the debounced filter hasn't fired yet.
    expect(document.querySelectorAll("#results-list .card")).toHaveLength(2);

    await wait(250);
    expect(document.querySelectorAll("#results-list .card")).toHaveLength(1);
    expect(document.querySelector("#results-list")?.textContent).toContain("Foundry Labs");
  });

  it("shows the designed empty state when no posting matches the filters", async () => {
    mockFetch({
      "data/index.json": [julyIndex],
      "data/100.json": julyData,
    });
    await loadApp();

    const input = document.querySelector<HTMLInputElement>("#search-input")!;
    input.value = "nonexistent company zzz";
    input.dispatchEvent(new Event("input"));
    await wait(250);

    expect(document.querySelector(".results__empty")).not.toBeNull();
    expect(document.querySelector("#results-status")?.textContent).toContain("showing 0 of 2");
  });

  it("narrows results and toggles aria-pressed when a remote-type chip is clicked", async () => {
    mockFetch({
      "data/index.json": [julyIndex],
      "data/100.json": julyData,
    });
    await loadApp();

    document.querySelector<HTMLButtonElement>('[data-remote="onsite"]')!.click();

    // The click handler re-renders the remote filter's buttons, so re-query
    // rather than reuse the (now detached) element from before the click.
    const onsiteBtn = document.querySelector<HTMLButtonElement>('[data-remote="onsite"]')!;
    expect(onsiteBtn.getAttribute("aria-pressed")).toBe("true");
    expect(document.querySelectorAll("#results-list .card")).toHaveLength(1);
    expect(document.querySelector("#results-list")?.textContent).toContain("Foundry Labs");
  });

  it("resets filters and loads new postings when the month picker changes", async () => {
    mockFetch({
      "data/index.json": [julyIndex, juneIndex],
      "data/100.json": julyData,
      "data/200.json": juneData,
    });
    await loadApp();

    const onsiteBtn = document.querySelector<HTMLButtonElement>('[data-remote="onsite"]')!;
    onsiteBtn.click();
    expect(document.querySelectorAll("#results-list .card")).toHaveLength(1);

    const monthPicker = document.querySelector<HTMLSelectElement>("#month-picker")!;
    monthPicker.value = "200";
    monthPicker.dispatchEvent(new Event("change"));
    await wait(50);

    expect(document.querySelectorAll("#results-list .card")).toHaveLength(1);
    expect(document.querySelector("#results-list")?.textContent).toContain("Nimbus");
    // The remote filter reset to "all" for the new month, not still "onsite".
    expect(document.querySelector('[data-remote="all"]')?.getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("shows a designed error status when the archive index fails to load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("boom", { status: 500 }))),
    );
    await loadApp();

    expect(document.querySelector("#results-status")?.textContent).toContain(
      "failed to load the archive",
    );
  });

  it("shows a designed error status when a specific month's thread fails to load", async () => {
    mockFetch({ "data/index.json": [julyIndex] });
    await loadApp();

    expect(document.querySelector("#results-status")?.textContent).toContain(
      "failed to load this month's postings",
    );
  });
});
