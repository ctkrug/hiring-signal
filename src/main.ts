const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app root element missing from index.html");

app.innerHTML = `
  <header style="padding: var(--space-4) var(--space-5);">
    <span class="wordmark">Hiring Signal<span class="cursor">_</span></span>
  </header>
  <main style="flex: 1; display: grid; place-items: center; padding: var(--space-5); text-align: center;">
    <p style="color: var(--text-muted); font-family: var(--font-ui); max-width: 60ch;">
      The searchable job board is under construction — see
      <a href="docs/BACKLOG.md">docs/BACKLOG.md</a> for the build plan.
    </p>
  </main>
`;
