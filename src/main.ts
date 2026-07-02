import { debounce } from "./lib/debounce";
import { countTagFrequency } from "./lib/facets";
import { EMPTY_FILTER_STATE, filterPostings } from "./lib/filter";
import { escapeHtml, renderPostingCard } from "./lib/postingCard";
import { renderShell } from "./ui/shell";
import type { FilterState } from "./lib/filter";
import type { ThreadData, ThreadIndexEntry } from "./lib/types";

const STACK_FACET_LIMIT = 16;
const SENIORITY_FACET_LIMIT = 12;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app root element missing from index.html");

app.innerHTML = renderShell();

const monthPicker = document.querySelector<HTMLSelectElement>("#month-picker")!;
const searchInput = document.querySelector<HTMLInputElement>("#search-input")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#results-status")!;
const resultsList = document.querySelector<HTMLDivElement>("#results-list")!;
const remoteFilterEl = document.querySelector<HTMLDivElement>("#remote-filter")!;
const stackFilterEl = document.querySelector<HTMLDivElement>("#stack-filter")!;
const seniorityFilterEl = document.querySelector<HTMLDivElement>("#seniority-filter")!;

const REMOTE_OPTIONS: Array<{ value: FilterState["remote"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

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
    searchInput.value = "";
    renderRemoteFilter();
    renderFacetFilter(stackFilterEl, "stack", STACK_FACET_LIMIT);
    renderFacetFilter(seniorityFilterEl, "seniority", SENIORITY_FACET_LIMIT);
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

function renderRemoteFilter(): void {
  remoteFilterEl.innerHTML = REMOTE_OPTIONS.map(
    ({ value, label }) => `
      <button
        type="button"
        class="chip chip--toggle"
        data-remote="${value}"
        aria-pressed="${state.filters.remote === value}"
      >${label}</button>
    `,
  ).join("");
}

remoteFilterEl.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-remote]");
  if (!button) return;
  state.filters = { ...state.filters, remote: button.dataset.remote as FilterState["remote"] };
  renderRemoteFilter();
  applyFilters();
});

renderRemoteFilter();

function renderFacetFilter(
  container: HTMLElement,
  key: "stack" | "seniority",
  limit: number,
): void {
  const tags = state.active ? countTagFrequency(state.active.postings, key).slice(0, limit) : [];
  container.innerHTML = tags
    .map(
      ({ tag, count }) => `
        <button
          type="button"
          class="chip chip--toggle"
          data-tag="${escapeHtml(tag)}"
          aria-pressed="${state.filters[key].includes(tag)}"
        >${escapeHtml(tag)} <span class="chip__count">${count}</span></button>
      `,
    )
    .join("");
}

function wireFacetFilter(container: HTMLElement, key: "stack" | "seniority", limit: number): void {
  container.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-tag]");
    if (!button) return;
    const tag = button.dataset.tag!;
    const selected = state.filters[key];
    const next = selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag];
    state.filters = { ...state.filters, [key]: next };
    renderFacetFilter(container, key, limit);
    applyFilters();
  });
}

wireFacetFilter(stackFilterEl, "stack", STACK_FACET_LIMIT);
wireFacetFilter(seniorityFilterEl, "seniority", SENIORITY_FACET_LIMIT);

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
