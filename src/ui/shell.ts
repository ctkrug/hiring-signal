/**
 * Static app chrome: header (wordmark, month picker, search) plus the
 * filter rail and results containers. Rendered once into #app; main.ts
 * queries the ids below to populate/update dynamic content in place so
 * typing in search or picking a month never re-renders the whole shell.
 */
export function renderShell(): string {
  return `
    <header class="app-header">
      <span class="wordmark">Hiring Signal<span class="cursor">_</span></span>
      <div class="app-header__controls">
        <label class="visually-hidden" for="month-picker">Month</label>
        <select id="month-picker" class="select" aria-label="Month"></select>
        <div class="search">
          <span class="search__prompt" aria-hidden="true">$</span>
          <input
            id="search-input"
            class="search__input"
            type="search"
            placeholder="search postings…"
            aria-label="Search postings"
            autocomplete="off"
          />
        </div>
      </div>
    </header>
    <div class="app-body">
      <aside class="filter-rail" aria-label="Filters">
        <div class="filter-group">
          <h2 class="filter-group__title">Remote</h2>
          <div
            id="remote-filter"
            class="filter-group__options"
            role="group"
            aria-label="Remote type"
          ></div>
        </div>
        <div class="filter-group">
          <h2 class="filter-group__title">Stack</h2>
          <div
            id="stack-filter"
            class="filter-group__options filter-group__options--chips"
            role="group"
            aria-label="Stack"
          ></div>
        </div>
        <div class="filter-group">
          <h2 class="filter-group__title">Seniority</h2>
          <div
            id="seniority-filter"
            class="filter-group__options filter-group__options--chips"
            role="group"
            aria-label="Seniority"
          ></div>
        </div>
      </aside>
      <main class="results">
        <p id="results-status" class="results__status" role="status" aria-live="polite"></p>
        <div id="results-list" class="results__list"></div>
      </main>
    </div>
  `.trim();
}
