import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchThreadComments, findRecentHiringThreads } from "../src/lib/hn";
import { formatMonthLabel } from "../src/lib/months";
import { parseThread } from "../src/lib/parser";
import type { JobPosting } from "../src/lib/types";

const OUT_DIR = path.join(process.cwd(), "public", "data");
const THREAD_LIMIT = 6;

interface ThreadIndexEntry {
  storyId: number;
  title: string;
  createdAt: string;
  monthLabel: string;
  postingCount: number;
}

interface ThreadDataFile extends ThreadIndexEntry {
  postings: JobPosting[];
}

/**
 * Fetches and parses the most recent N "Who is hiring" threads into static
 * JSON under public/data/, so the built site has zero runtime dependency on
 * the Algolia API. Run before `vite build`; each thread that fails to fetch
 * is skipped (with a warning) rather than failing the whole run, so one bad
 * month doesn't block shipping the rest of the archive.
 */
async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const threads = await findRecentHiringThreads(THREAD_LIMIT);
  if (threads.length === 0) {
    throw new Error("no 'who is hiring' threads found");
  }

  const index: ThreadIndexEntry[] = [];

  for (const thread of threads) {
    try {
      const comments = await fetchThreadComments(thread.storyId);
      const postings = parseThread(comments, thread.storyId);
      const monthLabel = formatMonthLabel(thread.createdAt);
      const entry: ThreadIndexEntry = { ...thread, monthLabel, postingCount: postings.length };
      const data: ThreadDataFile = { ...entry, postings };

      await writeFile(path.join(OUT_DIR, `${thread.storyId}.json`), JSON.stringify(data));
      index.push(entry);
      console.log(
        `[build-data] ${monthLabel}: ${postings.length} postings (story ${thread.storyId})`,
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.warn(`[build-data] skipping story ${thread.storyId}: ${detail}`);
    }
  }

  if (index.length === 0) {
    throw new Error("every thread fetch failed — aborting");
  }

  await writeFile(path.join(OUT_DIR, "index.json"), JSON.stringify(index));
  console.log(`[build-data] wrote index.json with ${index.length} thread(s)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
