import type { HiringThread, HNComment } from "./types";

const ALGOLIA_BASE = "https://hn.algolia.com/api/v1";

interface AlgoliaHit {
  story_id?: number;
  title?: string;
  created_at?: string;
}

interface AlgoliaSearchResponse {
  hits: AlgoliaHit[];
}

interface AlgoliaCommentTree {
  id: number;
  author: string | null;
  text: string | null;
  created_at: string;
  parent_id: number;
  children: AlgoliaCommentTree[];
}

/**
 * Fetches and parses JSON from `url`, retrying once on any failure (network
 * error or non-2xx status) before surfacing a build-time error. Threads are
 * fetched at build time with no user waiting on a spinner, so a single retry
 * buys resilience against Algolia's occasional transient blip cheaply.
 */
async function fetchJsonWithRetry<T>(url: string, label: string): Promise<T> {
  const attempt = async (): Promise<T> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()) as T;
  };

  try {
    return await attempt();
  } catch {
    try {
      return await attempt();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`${label} failed after retry: ${detail}`);
    }
  }
}

/**
 * Finds the story id of the most recent "Ask HN: Who is hiring?" post by
 * searching titles and taking the newest match. whoishiring posts monthly
 * under the `whoishiring` account, but title search is more resilient than
 * hardcoding an author (the account has posted under slight title variants).
 */
export async function findLatestHiringThreadId(): Promise<number> {
  const data = await fetchJsonWithRetry<AlgoliaSearchResponse>(
    `${ALGOLIA_BASE}/search_by_date?tags=story&query=Who%20is%20hiring&numericFilters=`,
    "Algolia search",
  );
  const hit = data.hits.find((h) => h.title?.toLowerCase().includes("who is hiring"));
  if (!hit?.story_id) throw new Error("no 'who is hiring' thread found");
  return hit.story_id;
}

/** Matches "Ask HN: Who is hiring? (Month Year)" but not "who is hiring"-adjacent chatter. */
const HIRING_TITLE_PATTERN = /^ask hn:\s*who is hiring\??/i;

/**
 * Lists the most recent monthly "Who is hiring?" threads, newest first, for
 * the archive/month picker. `search_by_date` already sorts by recency, so
 * this just filters to on-title matches and takes the first `limit`.
 */
export async function findRecentHiringThreads(limit = 12): Promise<HiringThread[]> {
  const data = await fetchJsonWithRetry<AlgoliaSearchResponse>(
    `${ALGOLIA_BASE}/search_by_date?tags=story&query=Who%20is%20hiring&hitsPerPage=100`,
    "Algolia recent threads search",
  );

  const threads: HiringThread[] = [];
  for (const hit of data.hits) {
    if (
      typeof hit.story_id === "number" &&
      typeof hit.title === "string" &&
      typeof hit.created_at === "string" &&
      HIRING_TITLE_PATTERN.test(hit.title)
    ) {
      threads.push({ storyId: hit.story_id, title: hit.title, createdAt: hit.created_at });
    }
  }
  return threads.slice(0, limit);
}

/** Flattens the Algolia comment tree into a list, dropping deleted/empty nodes. */
function flatten(node: AlgoliaCommentTree, out: HNComment[]): void {
  if (node.text) {
    out.push({
      id: node.id,
      author: node.author,
      text: node.text,
      createdAt: node.created_at,
      parentId: node.parent_id,
    });
  }
  for (const child of node.children ?? []) flatten(child, out);
}

export async function fetchThreadComments(storyId: number): Promise<HNComment[]> {
  const root = await fetchJsonWithRetry<AlgoliaCommentTree>(
    `${ALGOLIA_BASE}/items/${storyId}`,
    `Algolia item fetch for story ${storyId}`,
  );

  const comments: HNComment[] = [];
  for (const child of root.children ?? []) flatten(child, comments);
  return comments;
}
