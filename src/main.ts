import { debounce } from "./lib/debounce";
import { EMPTY_FILTER_STATE, filterPostings } from "./lib/filter";
import { renderPostingCard } from "./lib/postingCard";
import { renderShell } from "./ui/shell";
import type { FilterState } from "./lib/filter";
import type { ThreadData, ThreadIndexEntry } from "./lib/types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app root element missing from index.html");

app.innerHTML = renderShell();

const monthPicker = document.querySelector<HTMLSelectElement>("#month-picker")!;
const searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#results-status")!;
const resultsList = document.querySelector<HTMLDivElement>("#results-list")!;

interface AppState {
  index: ThreadIndexEntry[];
  active: ThreadData | null;
  filters: FilterState;
}

const state: AppState = { index: [], active: null, filters: { ...EMPTY_FILTER_STATE } };

function setStatus(message: string): void {
  statusEl.textContent = message;
}

function applyFilters(): void {
  if (!state.active) return;
  const filtered = filterPostings(state.active.postings, state.filters);

  resultsList.innerHTML = filtered.length
    ? filtered.map(renderPostingCard).join("")
    : `<p class="results__empty">&gt; no postings match your filters_</p>`;

  setStatus(
    `> showing ${filtered.length} of ${state.active.postingCount} postings for ${state.active.monthLabel}_`,
  );
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
    // Stack/seniority tags are specific to each month's thread, so a filter
    // selection from the previous month wouldn't map onto the new one.
    state.filters = { ...EMPTY_FILTER_STATE };
    applyFilters();
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

const handleSearchInput = debounce((query: string) => {
  state.filters = { ...state.filters, query };
  applyFilters();
}, 200);

searchInput.addEventListener("input", () => {
  handleSearchInput(searchInput.value);
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
