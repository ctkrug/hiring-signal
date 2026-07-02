/** A single comment as returned by the HN Algolia Search API. */
export interface HNComment {
  id: number;
  author: string | null;
  text: string | null;
  createdAt: string;
  /** Comment id this one replies to; top-level job posts reply directly to the story. */
  parentId: number;
}

export type RemoteType = "remote" | "onsite" | "hybrid" | "unknown";

/** A monthly "Who is hiring?" thread, as surfaced by the archive/month picker. */
export interface HiringThread {
  storyId: number;
  title: string;
  createdAt: string;
}

/** One entry in public/data/index.json — enough to populate the month picker. */
export interface ThreadIndexEntry extends HiringThread {
  monthLabel: string;
  postingCount: number;
}

/** The full contents of public/data/<storyId>.json. */
export interface ThreadData extends ThreadIndexEntry {
  postings: JobPosting[];
}

/** A job posting extracted from one top-level "Who is hiring" comment. */
export interface JobPosting {
  commentId: number;
  company: string | null;
  location: string | null;
  remote: RemoteType;
  stack: string[];
  seniority: string[];
  /**
   * True when the posting didn't follow the `Company | Location | ...`
   * convention closely enough to trust `company`/`location` — the UI should
   * flag these rather than presenting a guess as fact.
   */
  unparsed: boolean;
  /** Original comment text (HTML stripped), kept for display and re-extraction. */
  raw: string;
}
