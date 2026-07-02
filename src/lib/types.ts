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

/** A job posting extracted from one top-level "Who is hiring" comment. */
export interface JobPosting {
  commentId: number;
  company: string | null;
  location: string | null;
  remote: RemoteType;
  stack: string[];
  seniority: string[];
  /** Original comment text (HTML stripped), kept for display and re-extraction. */
  raw: string;
}
