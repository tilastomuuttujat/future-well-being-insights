/**
 * Plugin loader for the Lukija/dashboard plugin system (v2).
 *
 * Reads /plugins/index.json, dynamically imports each plugin module,
 * and mounts them into a host container.
 *
 * Plugin contract (per .js file under public/plugins/):
 *   export default {
 *     id: string,
 *     mount(host: HTMLElement, core: PluginCore): Promise<void> | void,
 *     unmount(host: HTMLElement): void,
 *   }
 *
 * The core helper exposes only `core.data.load(name)`, which fetches the
 * file from the shared data directory (default /data/views/) with caching.
 */

export type PluginManifest = {
  id: string;
  file: string;
  title: string;
  purpose: string;
  slot: string;
  views?: string[];
  tags?: string[];
};

export type PluginRegistry = {
  version: number;
  dataDir: string;
  plugins: PluginManifest[];
};

export type PluginCore = {
  data: { load: (filename: string) => Promise<unknown> };
};

export type LoadedPlugin = {
  manifest: PluginManifest;
  unmount: () => void;
};

const REGISTRY_URL = "/plugins/index.json";

let _registry: PluginRegistry | null = null;
const _dataCache = new Map<string, Promise<unknown>>();

export async function loadRegistry(): Promise<PluginRegistry> {
  if (_registry) return _registry;
  const r = await fetch(REGISTRY_URL, { cache: "no-cache" });
  if (!r.ok) throw new Error(`Plugin registry not found at ${REGISTRY_URL}`);
  _registry = (await r.json()) as PluginRegistry;
  return _registry;
}

function makeCore(dataDir: string): PluginCore {
  return {
    data: {
      load: (filename: string) => {
        const key = dataDir + filename;
        if (!_dataCache.has(key)) {
          _dataCache.set(
            key,
            fetch(key).then(r => {
              if (!r.ok) throw new Error(`Failed to load ${key}: ${r.status}`);
              return r.json();
            }),
          );
        }
        return _dataCache.get(key)!;
      },
    },
  };
}

/**
 * Mount a single plugin (by id) into a host element.
 */
export async function mountPlugin(
  id: string,
  host: HTMLElement,
): Promise<LoadedPlugin> {
  const reg = await loadRegistry();
  const manifest = reg.plugins.find(p => p.id === id);
  if (!manifest) throw new Error(`Plugin "${id}" not found in registry`);
  const core = makeCore(reg.dataDir ?? "/data/views/");
  // Vite dev server serves /public at the root; /* @vite-ignore */ keeps
  // this dynamic, runtime-only import out of the bundle graph.
  const mod = await import(/* @vite-ignore */ `/plugins/${manifest.file}`);
  await mod.default.mount(host, core);
  return {
    manifest,
    unmount: () => {
      try { mod.default.unmount(host); } catch (e) { console.error(e); }
    },
  };
}

/**
 * Mount all plugins from the registry into per-plugin host containers
 * appended to `root`. Returns the loaded plugins so the caller can unmount.
 */
export async function mountAll(root: HTMLElement): Promise<LoadedPlugin[]> {
  const reg = await loadRegistry();
  const loaded: LoadedPlugin[] = [];
  for (const m of reg.plugins) {
    const host = document.createElement("div");
    host.dataset.pluginId = m.id;
    host.style.marginBottom = "32px";
    root.appendChild(host);
    try {
      loaded.push(await mountPlugin(m.id, host));
    } catch (err) {
      host.innerHTML = `<div style="padding:16px;color:#a8401f;font-family:Georgia,serif;border:1px solid #e6e2d4;border-radius:4px;background:#fafaf7">
        Pluginia <b>${m.id}</b> ei voitu ladata: ${(err as Error).message}
      </div>`;
    }
  }
  return loaded;
}
