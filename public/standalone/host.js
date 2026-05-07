// V-Signal · Plugin-työpöytä (vanilla JS, drag-and-drop, multi-pane).
// - Lukee plugins/index.json
// - Käyttäjä raahaa moduuleja kirjastosta lohkoihin (1..4 preset-asettelua)
// - core.bus välittää valintoja, suodattimia ja highlight-tapahtumia moduulien välillä
// - Asettelu tallentuu localStorageen ja URL-hashiin

// --- Polut suhteessa tähän tiedostoon ----------------------------------------
const HOST_DIR = new URL("./", import.meta.url).href;
const SITE_BASE = new URL("../", import.meta.url).href;
const PLUGINS_BASE = new URL("plugins/", SITE_BASE).href;
const DATA_BASE_DEFAULT = new URL("data/views/", SITE_BASE).href;

const STORAGE_KEY = "vsignal.workspace.v1";

// --- Apurit ------------------------------------------------------------------
const uniq = (a) => [...new Set(a.filter(Boolean))];
const escapeHtml = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const errorText = (e) => e?.stack || e?.message || String(e || "Tuntematon virhe");

// --- Data loader -------------------------------------------------------------
function createDataLoader(baseUrl, extraBaseUrls = []) {
  const cache = new Map();
  const baseUrls = uniq([baseUrl, ...extraBaseUrls]).map((u) => u.endsWith("/") ? u : u + "/");
  return {
    async load(filename) {
      const key = baseUrls.join("|") + "::" + filename;
      if (cache.has(key)) return cache.get(key);
      const p = (async () => {
        const errs = [];
        for (const base of baseUrls) {
          const url = new URL(filename, base).href;
          try {
            const r = await fetch(url, { cache: "no-cache" });
            if (!r.ok) throw new Error("HTTP " + r.status);
            const ct = r.headers.get("content-type") || "";
            return ct.includes("json") || filename.endsWith(".json") ? r.json() : r.text();
          } catch (e) { errs.push(`${url} → ${e?.message || e}`); }
        }
        throw new Error(`Datan lataus epäonnistui (${filename}): ${errs.join(" | ")}`);
      })();
      cache.set(key, p);
      return p;
    },
  };
}

// --- Bus (jaetut valinnat, suodattimet, highlight) ---------------------------
function createBus() {
  const channels = new Map();          // channel -> Set<listener>
  const state = new Map();             // channel -> last value (sticky for selection.* / filter.*)
  function on(channel, fn) {
    if (!channels.has(channel)) channels.set(channel, new Set());
    channels.get(channel).add(fn);
    // toimita välitön lasten arvo jos kyseessä sticky-kanava
    if ((channel.startsWith("selection.") || channel.startsWith("filter.")) && state.has(channel)) {
      try { fn(state.get(channel), { sticky: true }); } catch (e) { console.error(e); }
    }
    return () => channels.get(channel)?.delete(fn);
  }
  function emit(channel, value, meta = {}) {
    if (channel.startsWith("selection.") || channel.startsWith("filter.")) {
      state.set(channel, value);
    }
    const subs = channels.get(channel);
    if (subs) for (const fn of subs) { try { fn(value, meta); } catch (e) { console.error(e); } }
    // notifoi globaalit kuuntelijat
    const all = channels.get("*");
    if (all) for (const fn of all) { try { fn({ channel, value, meta }); } catch (e) { console.error(e); } }
  }
  function get(channel) { return state.get(channel); }
  function snapshot() { return Object.fromEntries(state); }
  return { on, emit, get, snapshot };
}

// --- Registry ----------------------------------------------------------------
async function loadRegistry() {
  const r = await fetch(PLUGINS_BASE + "index.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("plugins/index.json puuttuu");
  const reg = await r.json();
  const locationRoot = new URL("/", location.href).href;
  const dataDir = reg.dataDir
    ? (reg.dataDir.startsWith("/")
        ? new URL(reg.dataDir.replace(/^\//, ""), locationRoot).href
        : new URL(reg.dataDir, SITE_BASE).href)
    : DATA_BASE_DEFAULT;
  const fallbackDataDirs = uniq([
    DATA_BASE_DEFAULT,
    new URL("data/views/", SITE_BASE).href,
    new URL("public/data/views/", SITE_BASE).href,
    new URL("data/views/", locationRoot).href,
    new URL("public/data/views/", locationRoot).href,
    new URL("../data/views/", HOST_DIR).href,
    new URL("../public/data/views/", HOST_DIR).href,
  ]).filter((u) => u !== dataDir);
  return { ...reg, dataDir, fallbackDataDirs };
}

const moduleCache = new Map();
function loadModule(manifest) {
  if (!moduleCache.has(manifest.id)) {
    moduleCache.set(manifest.id, import(/* @vite-ignore */ PLUGINS_BASE + manifest.file));
  }
  return moduleCache.get(manifest.id);
}

// --- Globaali tila -----------------------------------------------------------
const bus = createBus();
let registry = null;
let dataLoader = null;
const PRESETS = { "1": 1, "2": 2, "2x2": 4, "3": 3, "4": 4 };
const state = loadState() || { layout: "2", panes: [null, null] };
const mounted = new Map(); // paneIndex -> { id, unmount, container }

function loadState() {
  try {
    const hash = location.hash.startsWith("#ws=") ? decodeURIComponent(location.hash.slice(4)) : null;
    if (hash) return JSON.parse(hash);
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    location.replace("#ws=" + encodeURIComponent(JSON.stringify(state)));
  } catch {}
}

// --- Core api ----------------------------------------------------------------
function buildCore(pluginId) {
  return {
    pluginId,
    data: dataLoader,
    bus: {
      on: (ch, fn) => bus.on(ch, fn),
      emit: (ch, val) => bus.emit(ch, val, { source: pluginId }),
      get: (ch) => bus.get(ch),
    },
    log: (lvl, msg, ...rest) => console[lvl === "error" ? "error" : lvl === "warn" ? "warn" : "log"](`[${pluginId}]`, msg, ...rest),
  };
}

// --- UI: kirjasto ------------------------------------------------------------
const libraryList = document.getElementById("library-list");
const workspaceEl = document.getElementById("workspace");
const statusEl = document.getElementById("status");
const busStateEl = document.getElementById("bus-state");

function renderLibrary() {
  libraryList.innerHTML = "";
  for (const m of registry.plugins) {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.pluginId = m.id;
    li.innerHTML = `<div class="title">${escapeHtml(m.title)}</div>
      <div class="id">${escapeHtml(m.id)}${m.tags ? " · " + m.tags.map(escapeHtml).join(", ") : ""}</div>`;
    li.addEventListener("dragstart", (ev) => {
      li.classList.add("dragging");
      ev.dataTransfer.effectAllowed = "copy";
      ev.dataTransfer.setData("application/x-vsignal-plugin", m.id);
      ev.dataTransfer.setData("text/plain", m.id);
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
    libraryList.appendChild(li);
  }
}

function renderBusState() {
  const snap = bus.snapshot();
  const keys = Object.keys(snap);
  busStateEl.textContent = keys.length === 0 ? "(ei valintoja)"
    : keys.map((k) => `${k}: ${JSON.stringify(snap[k])}`).join("\n");
}
bus.on("*", renderBusState);

// --- UI: työpöytä ------------------------------------------------------------
function ensurePanesCount() {
  const n = PRESETS[state.layout] || 1;
  if (state.panes.length < n) state.panes = state.panes.concat(Array(n - state.panes.length).fill(null));
  if (state.panes.length > n) {
    // unmount overflow
    for (let i = n; i < state.panes.length; i++) {
      const m = mounted.get(i); if (m) { try { m.unmount?.(); } catch {} mounted.delete(i); }
    }
    state.panes = state.panes.slice(0, n);
  }
}

function renderWorkspace() {
  ensurePanesCount();
  workspaceEl.dataset.layout = state.layout;
  workspaceEl.innerHTML = "";
  state.panes.forEach((pluginId, idx) => {
    const pane = document.createElement("div");
    pane.className = "pane"; pane.dataset.pane = String(idx);

    const header = document.createElement("div"); header.className = "pane-header";
    header.innerHTML = `
      <span class="pane-handle" draggable="true" title="Raahaa toiseen lohkoon">⋮⋮</span>
      <span class="pane-label">Lohko ${idx + 1}</span>
      <span class="pane-title">${pluginId ? escapeHtml(registry.plugins.find((p) => p.id === pluginId)?.title || pluginId) : "—"}</span>
      <span class="pane-actions">
        ${pluginId ? '<button data-act="clear" title="Tyhjennä">✕</button>' : ""}
      </span>`;
    pane.appendChild(header);

    const body = document.createElement("div"); body.className = "pane-body";
    pane.appendChild(body);

    if (!pluginId) {
      body.innerHTML = `<div class="pane-empty">Raahaa moduuli tähän lohkoon</div>`;
    }

    // Drop target
    pane.addEventListener("dragover", (ev) => {
      if (ev.dataTransfer.types.includes("application/x-vsignal-plugin") ||
          ev.dataTransfer.types.includes("application/x-vsignal-pane")) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
        pane.classList.add("drop-target");
      }
    });
    pane.addEventListener("dragleave", () => pane.classList.remove("drop-target"));
    pane.addEventListener("drop", (ev) => {
      ev.preventDefault(); pane.classList.remove("drop-target");
      const fromPane = ev.dataTransfer.getData("application/x-vsignal-pane");
      const newId = ev.dataTransfer.getData("application/x-vsignal-plugin");
      if (fromPane !== "") {
        const fromIdx = parseInt(fromPane, 10);
        if (fromIdx !== idx) swapPanes(fromIdx, idx);
      } else if (newId) {
        setPanePlugin(idx, newId);
      }
    });

    // Pane drag handle (move plugin between panes)
    const handle = header.querySelector(".pane-handle");
    handle.addEventListener("dragstart", (ev) => {
      if (!pluginId) { ev.preventDefault(); return; }
      ev.dataTransfer.effectAllowed = "move";
      ev.dataTransfer.setData("application/x-vsignal-pane", String(idx));
      ev.dataTransfer.setData("text/plain", pluginId);
    });
    header.querySelector('[data-act="clear"]')?.addEventListener("click", () => setPanePlugin(idx, null));

    workspaceEl.appendChild(pane);

    if (pluginId) {
      mountPluginInPane(idx, pluginId, body);
    }
  });
}

async function mountPluginInPane(idx, pluginId, container) {
  const prev = mounted.get(idx);
  if (prev) { try { prev.unmount?.(); } catch (e) { console.error(e); } mounted.delete(idx); }
  const manifest = registry.plugins.find((p) => p.id === pluginId);
  if (!manifest) {
    container.innerHTML = `<div class="error">Tuntematon moduuli: ${escapeHtml(pluginId)}</div>`;
    return;
  }
  container.innerHTML = "";
  const inner = document.createElement("div"); container.appendChild(inner);
  try {
    const mod = await loadModule(manifest);
    const core = buildCore(pluginId);
    const pluginObj = mod.default ?? mod;
    const result = pluginObj.mount.length >= 2
      ? pluginObj.mount(inner, core)
      : pluginObj.mount({ container: inner, slot: "pane", core, manifest });
    await result;
    mounted.set(idx, {
      id: pluginId,
      container: inner,
      unmount: () => {
        try {
          if (pluginObj.unmount?.length >= 1) pluginObj.unmount(inner);
          else pluginObj.unmount?.({ container: inner });
        } catch (e) { console.error(e); }
      },
    });
  } catch (err) {
    console.error("[host] mount epäonnistui", err);
    container.innerHTML = `<div class="error">Lisäosa "${escapeHtml(pluginId)}" epäonnistui: ${escapeHtml(errorText(err))}</div>`;
  }
}

function setPanePlugin(idx, pluginId) {
  state.panes[idx] = pluginId;
  saveState();
  renderWorkspace();
}
function swapPanes(a, b) {
  const tmp = state.panes[a]; state.panes[a] = state.panes[b]; state.panes[b] = tmp;
  saveState();
  renderWorkspace();
}
function setLayout(name) {
  state.layout = name;
  saveState();
  document.querySelectorAll(".layout-switch button").forEach((b) =>
    b.classList.toggle("active", b.dataset.layout === name));
  renderWorkspace();
}

// --- Boot --------------------------------------------------------------------
(async () => {
  try {
    registry = await loadRegistry();
    dataLoader = createDataLoader(registry.dataDir, registry.fallbackDataDirs);
    statusEl.textContent = `${registry.plugins.length} moduulia`;
    renderLibrary();

    document.querySelectorAll(".layout-switch button").forEach((b) => {
      b.addEventListener("click", () => setLayout(b.dataset.layout));
    });
    document.getElementById("reset-btn").addEventListener("click", () => {
      for (const [, m] of mounted) { try { m.unmount?.(); } catch {} }
      mounted.clear();
      state.layout = "2"; state.panes = [null, null];
      saveState(); setLayout("2");
    });

    setLayout(state.layout);
    renderBusState();
  } catch (err) {
    console.error("[host] käynnistys epäonnistui", err);
    statusEl.textContent = "Virhe: " + errorText(err);
    statusEl.style.color = "var(--danger)";
  }
})();
