import type { JobPosting } from "./types";

export interface TagCount {
  tag: string;
  count: number;
}

/**
 * Counts how often each tag appears across a set of postings' stack or
 * seniority arrays, sorted most-frequent first (ties broken alphabetically)
 * so the filter rail surfaces the most useful facet values first.
 */
export function countTagFrequency(
  postings: JobPosting[],
  key: "stack" | "seniority",
): TagCount[] {
  const counts = new Map<string, number>();
  for (const posting of postings) {
    for (const tag of posting[key]) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
