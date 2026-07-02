import type { JobPosting, RemoteType } from "./types";

export interface FilterState {
  query: string;
  remote: RemoteType | "all";
  /** Selected stack tags; a posting matches if it has ANY of them. */
  stack: string[];
  /** Selected seniority tags; a posting matches if it has ANY of them. */
  seniority: string[];
}

export const EMPTY_FILTER_STATE: FilterState = {
  query: "",
  remote: "all",
  stack: [],
  seniority: [],
};

function matchesQuery(posting: JobPosting, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    posting.raw.toLowerCase().includes(q) ||
    (posting.company?.toLowerCase().includes(q) ?? false) ||
    (posting.location?.toLowerCase().includes(q) ?? false)
  );
}

/** A facet with nothing selected matches everything; otherwise any overlap matches. */
function matchesFacet(selected: string[], postingValues: string[]): boolean {
  return selected.length === 0 || selected.some((tag) => postingValues.includes(tag));
}

export function filterPostings(postings: JobPosting[], filters: FilterState): JobPosting[] {
  return postings.filter(
    (posting) =>
      matchesQuery(posting, filters.query) &&
      (filters.remote === "all" || posting.remote === filters.remote) &&
      matchesFacet(filters.stack, posting.stack) &&
      matchesFacet(filters.seniority, posting.seniority),
  );
}
