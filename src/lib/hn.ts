import type { HNComment } from "./types";

const ALGOLIA_BASE = "https://hn.algolia.com/api/v1";

interface AlgoliaHit {
  story_id?: number;
  title?: string;
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
 * Finds the story id of the most recent "Ask HN: Who is hiring?" post by
 * searching titles and taking the newest match. whoishiring posts monthly
 * under the `whoishiring` account, but title search is more resilient than
 * hardcoding an author (the account has posted under slight title variants).
 */
export async function findLatestHiringThreadId(): Promise<number> {
  const res = await fetch(
    `${ALGOLIA_BASE}/search_by_date?tags=story&query=Who%20is%20hiring&numericFilters=`,
  );
  if (!res.ok) throw new Error(`Algolia search failed: ${res.status}`);
  const data = (await res.json()) as AlgoliaSearchResponse;
  const hit = data.hits.find((h) => h.title?.toLowerCase().includes("who is hiring"));
  if (!hit?.story_id) throw new Error("no 'who is hiring' thread found");
  return hit.story_id;
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
  const res = await fetch(`${ALGOLIA_BASE}/items/${storyId}`);
  if (!res.ok) throw new Error(`Algolia item fetch failed: ${res.status}`);
  const root = (await res.json()) as AlgoliaCommentTree;

  const comments: HNComment[] = [];
  for (const child of root.children ?? []) flatten(child, comments);
  return comments;
}
