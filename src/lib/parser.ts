import { extractRemote, extractSeniority, extractStack } from "./tags";
import type { HNComment, JobPosting } from "./types";

/**
 * Most "Who is hiring" posts open with `Company Name | Location | ...`
 * (pipe- or em-dash-separated). This grabs the first segment as the company
 * name and the second, if it looks like a place, as the location. Posts that
 * don't follow the convention just get `company: null`.
 */
function extractCompanyAndLocation(text: string): {
  company: string | null;
  location: string | null;
} {
  const firstLine = text.split("\n")[0]?.trim() ?? "";
  const segments = firstLine
    .split(/\s*[|–—]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) return { company: null, location: null };

  const company = segments[0]?.slice(0, 80) ?? null;
  const location = segments.length > 1 ? (segments[1]?.slice(0, 80) ?? null) : null;
  return { company, location };
}

/**
 * HTML entity decode + tag strip for the handful of tags the HN API embeds
 * in comment text (<p>, <a>, <i>, <code>). Good enough for extraction and
 * display; not a general-purpose sanitizer.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<a href="([^"]+)"[^>]*>.*?<\/a>/gi, "$1")
    .replace(/<\/?(p|i|b|code|pre)[^>]*>/gi, "\n")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseComment(comment: HNComment): JobPosting {
  const text = stripHtml(comment.text ?? "");
  const { company, location } = extractCompanyAndLocation(text);

  return {
    commentId: comment.id,
    company,
    location,
    remote: extractRemote(text),
    stack: extractStack(text),
    seniority: extractSeniority(text),
    // No location means no `|`/`–`/`—` separator was found at all, so the
    // opening line didn't follow the `Company | Location` convention —
    // `company` is just the whole first line truncated, not a real parse.
    unparsed: location === null,
    raw: text,
  };
}

/** Top-level job posts reply directly to the story; sub-thread discussion doesn't. */
export function isTopLevelJobPost(comment: HNComment, storyId: number): boolean {
  return comment.parentId === storyId && Boolean(comment.text) && comment.text!.length > 40;
}

export function parseThread(comments: HNComment[], storyId: number): JobPosting[] {
  return comments.filter((c) => isTopLevelJobPost(c, storyId)).map(parseComment);
}
