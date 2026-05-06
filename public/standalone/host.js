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

function uniqueUrls(urls) {
  return [...new Set(urls.filter(Boolean))];
}

function errorText(err) {
  if (!err) return "Tuntematon virhe";
  return err.stack || err.message || String(err);
}

function jsonError(err) {
  return {
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
  };
}

// --- Data loader -------------------------------------------------------------
function createDataLoader(baseUrl, extraBaseUrls = []) {
  const cache = new Map();
  const baseUrls = uniqueUrls([baseUrl, ...extraBaseUrls]).map((url) =>
    url.endsWith("/") ? url : `${url}/`,
  );
  return {
    async load(filename) {
      const cacheKey = `${baseUrls.join("|")}::${filename}`;
      if (cache.has(cacheKey)) return cache.get(cacheKey);
      const p = (async () => {
        const errors = [];
        for (const base of baseUrls) {
          const url = new URL(filename, base).href;
          try {
            console.log(`[data] haetaan ${url}`);
            const r = await fetch(url, { cache: "no-cache" });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const ct = r.headers.get("content-type") || "";
            return ct.includes("json") || filename.endsWith(".json") ? r.json() : r.text();
          } catch (err) {
            errors.push(`${url} → ${err?.message || err}`);
          }
        }
        throw new Error(`Datan lataus epäonnistui (${filename}): ${errors.join(" | ")}`);
      })();
      cache.set(cacheKey, p);
      return p;
    },
  };
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
  const fallbackDataDirs = uniqueUrls([
    DATA_BASE_DEFAULT,
    new URL("data/views/", SITE_BASE).href,
    new URL("public/data/views/", SITE_BASE).href,
    new URL("data/views/", locationRoot).href,
    new URL("public/data/views/", locationRoot).href,
    new URL("../data/views/", HOST_DIR).href,
    new URL("../public/data/views/", HOST_DIR).href,
  ]).filter((url) => url !== dataDir);
  console.log("[host] registry", { pluginsBase: PLUGINS_BASE, dataDir, fallbackDataDirs });
  return { ...reg, dataDir, fallbackDataDirs };
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
function buildCore(pluginId, dataDir, fallbackDataDirs = []) {
  return {
    pluginId,
    data: createDataLoader(dataDir, fallbackDataDirs),
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
    console.log("[host] ladataan moduuli", m.id, "→", PLUGINS_BASE + m.file);
    const mod = await loadModule(m);
    console.log("[host] moduuli ladattu", m.id, mod);
    const core = buildCore(m.id, registry.dataDir, registry.fallbackDataDirs);
    console.log("[host] kutsutaan mount", m.id, "dataDir=", registry.dataDir, "fallbacks=", registry.fallbackDataDirs);
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
    console.error("[host] mount epäonnistui", jsonError(err), err);
    stage.innerHTML = `<div class="error">Lisäosa "${escapeHtml(id)}" epäonnistui: ${escapeHtml(errorText(err))}</div>`;
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
    console.error("[host] käynnistys epäonnistui", jsonError(err), err);
    statusEl.textContent = `Virhe: ${errorText(err)}`;
    statusEl.style.color = "var(--danger)";
  }
})();
