// Staattinen plugin-host V-Signal v2 -arkkitehtuurille.
// Lukee /plugins/index.json ja lataa yksitiedostoiset moduulit /plugins/-kansiosta.
// Data haetaan /data/views/-kansiosta core.data.load(filename) kautta.
//
// Toimii sekä Lovable-previewissa (/standalone/) että GitHub Pagesissa
// (esim. /<repo>/standalone/) — käyttää suhteellisia polkuja juureen nähden.

// Polut lasketaan suhteessa TÄHÄN tiedostoon (host.js), ei sivun URLiin.
// Tämä mahdollistaa toimimisen sekä /standalone/, /public/standalone/ että
// muiden alipolkujen (esim. /<repo>/standalone/) alta — Working Copy, Lovable
// preview ja GitHub Pages käyttäytyvät samalla tavalla.
const HOST_DIR = new URL("./", import.meta.url).href;        // .../standalone/
const SITE_BASE = new URL("../", import.meta.url).href;       // .../  (standalonen yläkansio)
const PLUGINS_BASE = new URL("plugins/", SITE_BASE).href;     // .../plugins/
const DATA_BASE_DEFAULT = new URL("data/views/", SITE_BASE).href; // .../data/views/

// --- Data loader -------------------------------------------------------------
function createDataLoader(baseUrl) {
  const cache = new Map();
  return {
    async load(filename) {
      const url = baseUrl + filename;
      if (cache.has(url)) return cache.get(url);
      const p = fetch(url, { cache: "no-cache" }).then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
        const ct = r.headers.get("content-type") || "";
        return ct.includes("json") ? r.json() : r.text();
      });
      cache.set(url, p);
      return p;
    },
  };
}

// --- Registry ----------------------------------------------------------------
async function loadRegistry() {
  const r = await fetch(PLUGINS_BASE + "index.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("plugins/index.json puuttuu");
  const reg = await r.json();
  // Normalisoi dataDir: jos absoluuttinen polku alkaa "/", käsittele se sivun
  // juuresta; muuten suhteessa standalonen yläkansioon (SITE_BASE).
  const dataDir = reg.dataDir
    ? (reg.dataDir.startsWith("/")
        ? new URL(reg.dataDir.replace(/^\//, ""), new URL("/", location.href)).href
        : new URL(reg.dataDir, SITE_BASE).href)
    : DATA_BASE_DEFAULT;
  return { ...reg, dataDir };
}

// --- Module loader -----------------------------------------------------------
const moduleCache = new Map();
function loadModule(manifest) {
  if (!moduleCache.has(manifest.id)) {
    const url = PLUGINS_BASE + manifest.file;
    moduleCache.set(manifest.id, import(/* @vite-ignore */ url));
  }
  return moduleCache.get(manifest.id);
}

// --- Core api ----------------------------------------------------------------
function buildCore(pluginId, dataDir) {
  return {
    pluginId,
    data: createDataLoader(dataDir),
    log: (level, msg, ...rest) =>
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        `[${pluginId}]`, msg, ...rest,
      ),
  };
}

// --- UI ----------------------------------------------------------------------
const statusEl = document.getElementById("status");
const menuList = document.getElementById("menu-list");
const stage = document.getElementById("stage");

let registry = null;
let activeId = null;
let currentUnmount = null;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

function renderMenu() {
  menuList.innerHTML = "";
  const plugins = registry?.plugins ?? [];
  if (plugins.length === 0) {
    menuList.innerHTML = `<li class="empty" style="padding:8px">Ei lisäosia.</li>`;
    return;
  }
  for (const m of plugins) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = m.id === activeId ? "active" : "";
    btn.innerHTML = `<div class="title">${escapeHtml(m.title)}</div>
      <div class="id">${escapeHtml(m.id)}${m.tags ? " · " + m.tags.map(escapeHtml).join(", ") : ""}</div>`;
    btn.addEventListener("click", () => mountPlugin(m.id));
    li.appendChild(btn);
    menuList.appendChild(li);
  }
}

async function mountPlugin(id) {
  const m = registry?.plugins.find((x) => x.id === id);
  if (!m) return;
  activeId = id;
  renderMenu();

  try { currentUnmount?.(); } catch (e) { console.error(e); }
  currentUnmount = null;
  stage.innerHTML = "";

  const container = document.createElement("div");
  stage.appendChild(container);

  try {
    const mod = await loadModule(m);
    const core = buildCore(m.id, registry.dataDir);
    // Tukee sekä v2-sopimusta mount(host, core) että objekti-argumenttia.
    const pluginObj = mod.default ?? mod;
    const result = pluginObj.mount.length >= 2
      ? pluginObj.mount(container, core)
      : pluginObj.mount({ container, slot: "main", core, manifest: m });
    await result;
    currentUnmount = () => {
      try {
        if (pluginObj.unmount?.length >= 1) pluginObj.unmount(container);
        else pluginObj.unmount?.({ container });
      } catch (e) { console.error(e); }
    };
  } catch (err) {
    console.error(err);
    stage.innerHTML = `<div class="error">Lisäosa "${escapeHtml(id)}" epäonnistui: ${escapeHtml(String(err?.message || err))}</div>`;
  }
}

// --- Boot --------------------------------------------------------------------
(async () => {
  try {
    registry = await loadRegistry();
    statusEl.textContent = `${registry.plugins.length} lisäosaa`;
    renderMenu();
    if (registry.plugins[0]) mountPlugin(registry.plugins[0].id);
  } catch (err) {
    console.error(err);
    statusEl.textContent = `Virhe: ${err.message}`;
    statusEl.style.color = "var(--danger)";
  }
})();
