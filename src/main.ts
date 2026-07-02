import { renderShell } from "./ui/shell";
import type { ThreadData, ThreadIndexEntry } from "./lib/types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app root element missing from index.html");

app.innerHTML = renderShell();

const monthPicker = document.querySelector<HTMLSelectElement>("#month-picker")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#results-status")!;

interface AppState {
  index: ThreadIndexEntry[];
  active: ThreadData | null;
}

const state: AppState = { index: [], active: null };

function setStatus(message: string): void {
  statusEl.textContent = message;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return (await res.json()) as T;
}

async function loadThread(storyId: number): Promise<void> {
  setStatus(`> loading postings…_`);
  try {
    state.active = await fetchJson<ThreadData>(`./data/${storyId}.json`);
    setStatus(`> ${state.active.postingCount} postings loaded for ${state.active.monthLabel}_`);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    setStatus(`> failed to load this month's postings: ${detail}_`);
  }
}

function populateMonthPicker(index: ThreadIndexEntry[]): void {
  monthPicker.innerHTML = index
    .map((entry) => `<option value="${entry.storyId}">${entry.monthLabel}</option>`)
    .join("");
}

monthPicker.addEventListener("change", () => {
  void loadThread(Number(monthPicker.value));
});

async function init(): Promise<void> {
  setStatus("> loading archive…_");
  try {
    state.index = await fetchJson<ThreadIndexEntry[]>("./data/index.json");
    if (state.index.length === 0) throw new Error("no threads in index");
    populateMonthPicker(state.index);
    await loadThread(state.index[0]!.storyId);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    setStatus(`> failed to load the archive: ${detail}_`);
  }
}

void init();
