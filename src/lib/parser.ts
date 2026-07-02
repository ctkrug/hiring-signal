import { extractRemote, extractSeniority, extractStack } from "./tags";
import type { HNComment, JobPosting } from "./types";

/** Corporate suffixes that follow a comma in a company name, not a location's "City, ST". */
const CORP_SUFFIXES = new Set([
  "inc",
  "llc",
  "corp",
  "ltd",
  "co",
  "llp",
  "gmbh",
  "pbc",
  "plc",
  "ag",
  "sa",
  "srl",
]);

/**
 * Heuristic for "this segment names a place, not a company": either it's a
 * bare remote descriptor, or it ends in a short "City, ST"/"City, Country"
 * suffix that isn't actually a corporate suffix like "..., Inc.".
 */
function looksLikeLocation(segment: string): boolean {
  const s = segment.trim();
  if (/\bremote\b/i.test(s)) return true;

  const commaIndex = s.lastIndexOf(",");
  if (commaIndex === -1) return false;

  const after = s.slice(commaIndex + 1).trim();
  if (!/^[A-Za-z.]{2,20}$/.test(after)) return false;
  return !CORP_SUFFIXES.has(after.toLowerCase().replace(/\.$/, ""));
}

/**
 * Most "Who is hiring" posts open with `Company Name | Location | ...`
 * (pipe- or em-dash-separated), but some invert the first two fields to
 * `Location | Company Name | ...`. This grabs the first segment as the
 * company name and the second, if it looks like a place, as the location —
 * swapping them when the first segment looks like a place and the second
 * doesn't. Posts that don't follow the convention just get `company: null`.
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
  if (segments.length === 1) return { company: segments[0]!.slice(0, 80), location: null };

  const swapped = looksLikeLocation(segments[0]!) && !looksLikeLocation(segments[1]!);
  const company = (swapped ? segments[1] : segments[0])!.slice(0, 80);
  const location = (swapped ? segments[0] : segments[1])!.slice(0, 80);
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
