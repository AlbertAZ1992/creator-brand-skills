const icons = [
  ["capture-idea", "Capture Idea"],
  ["sketch-fast", "Sketch Fast"],
  ["build-palette", "Build Palette"],
  ["shape-story", "Shape Story"],
  ["record-moment", "Record Moment"],
  ["collect-notes", "Collect Notes"],
  ["save-favorite", "Save Favorite"],
  ["share-draft", "Share Draft"],
  ["team-chat", "Team Chat"],
  ["pin-reference", "Pin Reference"],
  ["plan-drop", "Plan Drop"],
  ["upload-asset", "Upload Asset"],
  ["download-kit", "Download Kit"],
  ["launch-project", "Launch Project"],
  ["publish-worldwide", "Publish Worldwide"],
  ["protect-work", "Protect Work"],
  ["add-magic", "Add Magic"],
  ["score-sound", "Score Sound"],
  ["reward-fans", "Reward Fans"],
  ["take-a-break", "Take a Break"],
];

const state = {
  selected: icons[0][0],
  color: "original",
  sources: new Map(),
};

const grid = document.querySelector("#icon-grid");
const inspectorTitle = document.querySelector("#inspector-title");
const inspectorPreview = document.querySelector("#inspector-preview");
const svgCode = document.querySelector("#svg-code");

function activeMarkup(slug) {
  const source = state.sources.get(slug) ?? "";
  if (state.color === "original") return source;
  return source.replace(/#(?:FF765F|20A7C9|F7BD24)/gi, state.color);
}

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function selectedLabel() {
  return icons.find(([slug]) => slug === state.selected)?.[1] ?? "Icon";
}

function renderInspector() {
  const markup = activeMarkup(state.selected);
  inspectorTitle.textContent = selectedLabel();
  inspectorPreview.innerHTML = markup;
  svgCode.value = markup;
}

function selectIcon(slug) {
  state.selected = slug;
  document.querySelectorAll(".icon-card").forEach((card) => {
    const selected = card.dataset.slug === slug;
    card.classList.toggle("is-selected", selected);
    card.querySelector("button").setAttribute("aria-pressed", String(selected));
  });
  renderInspector();
}

function renderGrid() {
  grid.innerHTML = icons
    .map(([slug, label], index) => {
      const selected = index === 0 ? " is-selected" : "";
      return `<article class="icon-card${selected}" data-slug="${slug}">
        <button type="button" aria-label="Inspect ${label}" aria-pressed="${index === 0}"></button>
        <div class="icon-preview" aria-hidden="true">${activeMarkup(slug)}</div>
        <h3>${label}</h3>
        <span class="download-hint">↓ SVG</span>
      </article>`;
    })
    .join("");

  grid.querySelectorAll(".icon-card").forEach((card) => {
    card.querySelector("button").addEventListener("click", () => selectIcon(card.dataset.slug));
  });
}

function activateButton(button, selector) {
  document.querySelectorAll(selector).forEach((item) => item.classList.remove("is-active"));
  button.classList.add("is-active");
}

function bindControls() {
  document.querySelectorAll("[data-playback]").forEach((button) => {
    button.addEventListener("click", () => {
      document.documentElement.style.setProperty("--motion-state", button.dataset.playback);
      activateButton(button, "[data-playback]");
    });
  });

  document.querySelectorAll("[data-amplitude]").forEach((button) => {
    button.addEventListener("click", () => {
      document.documentElement.style.setProperty("--motion-amplitude", button.dataset.amplitude);
      activateButton(button, "[data-amplitude]");
    });
  });

  document.querySelectorAll("[data-speed]").forEach((button) => {
    button.addEventListener("click", () => {
      document.documentElement.style.setProperty("--motion-speed", button.dataset.speed);
      activateButton(button, "[data-speed]");
    });
  });

  document.querySelectorAll("[data-color]").forEach((button) => {
    button.addEventListener("click", () => {
      state.color = button.dataset.color;
      activateButton(button, "[data-color]");
      renderGrid();
      selectIcon(state.selected);
    });
  });
}

function bindExportActions() {
  document.querySelector("#copy-svg").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(activeMarkup(state.selected));
    event.currentTarget.textContent = "Copied";
    window.setTimeout(() => (event.currentTarget.textContent = "Copy SVG"), 1200);
  });

  document.querySelector("#download-svg").addEventListener("click", () => {
    download(activeMarkup(state.selected), `${state.selected}.svg`, "image/svg+xml");
  });
}

async function loadIcons() {
  const responses = await Promise.all(
    icons.map(async ([slug]) => {
      const response = await fetch(`icons/${slug}.svg`);
      if (!response.ok) throw new Error(`Unable to load ${slug}.svg`);
      return [slug, await response.text()];
    }),
  );
  responses.forEach(([slug, source]) => state.sources.set(slug, source));
}

async function init() {
  try {
    await loadIcons();
    renderGrid();
    renderInspector();
    bindControls();
    bindExportActions();
  } catch (error) {
    grid.innerHTML = `<p>Could not load the icon set. ${error.message}</p>`;
  }
}

init();
