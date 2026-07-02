import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchThreadComments, findLatestHiringThreadId } from "../hn";

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("findLatestHiringThreadId", () => {
  it("returns the story id of the newest matching title", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        hits: [{ story_id: 123, title: "Ask HN: Who is hiring? (July 2026)" }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(findLatestHiringThreadId()).resolves.toBe(123);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once after a failed request and succeeds on the second try", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network blip"))
      .mockResolvedValueOnce(
        jsonResponse({ hits: [{ story_id: 456, title: "Ask HN: Who is hiring? (June 2026)" }] }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(findLatestHiringThreadId()).resolves.toBe(456);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws a descriptive error when both attempts fail", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, false, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(findLatestHiringThreadId()).rejects.toThrow(/Algolia search failed after retry/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("fetchThreadComments", () => {
  it("flattens the comment tree, dropping deleted/empty nodes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: 1,
        children: [
          {
            id: 2,
            author: "a",
            text: "hello",
            created_at: "2026-07-01T00:00:00Z",
            parent_id: 1,
            children: [],
          },
          { id: 3, author: null, text: null, created_at: "2026-07-01T00:00:00Z", parent_id: 1 },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const comments = await fetchThreadComments(1);
    expect(comments).toHaveLength(1);
    expect(comments[0]).toMatchObject({ id: 2, text: "hello", parentId: 1 });
  });
});
