import { useEffect, useRef, useState } from "react";
import { loadRegistry, mountAll, type LoadedPlugin, type PluginRegistry } from "@/plugins/loader";

/**
 * Pluginit — kevyt sivu, joka kiinnittää kaikki public/plugins/-rekisterin moduulit
 * peräkkäin DOMiin. Reactia käytetään vain kuoreen; kukin plugin hallitsee oman
 * DOM-puunsa ja injektoi omat tyylinsä.
 */
const Pluginit = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [registry, setRegistry] = useState<PluginRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "V-Signal · Pluginit";
    let mounted: LoadedPlugin[] = [];
    let cancelled = false;

    (async () => {
      try {
        const reg = await loadRegistry();
        if (cancelled) return;
        setRegistry(reg);
        if (hostRef.current) {
          mounted = await mountAll(hostRef.current);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();

    return () => {
      cancelled = true;
      mounted.forEach(p => p.unmount());
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, []);

  return (
    <article className="pb-16">
      <header className="px-5 py-12">
        <div className="max-w-3xl mx-auto">
          <span className="eyebrow">V-Signal · Pluginit (v2)</span>
          <h1 className="font-serif text-4xl sm:text-5xl text-ink mt-3 mb-4 leading-[1.05]">
            Pluginit
          </h1>
          <p className="lede">
            Itsenäisiä yhden tiedoston moduuleja, jotka lukevat dataa jaetusta
            <code className="mx-1 font-mono text-[12px]">/data/views/</code>-kansiosta.
            Rekisteri:{" "}
            <code className="font-mono text-[12px]">/plugins/index.json</code>.
          </p>
          {registry && (
            <p className="mt-3 font-mono text-[11px] text-ink-mute">
              {registry.plugins.length} moduulia ladattu · dataDir {registry.dataDir}
            </p>
          )}
        </div>
      </header>

      <div className="px-5">
        <div className="max-w-4xl mx-auto" ref={hostRef} />
        {error && (
          <div className="max-w-3xl mx-auto p-4 mt-4 border border-fn-korjaava text-fn-korjaava">
            Virhe: {error}
          </div>
        )}
      </div>
    </article>
  );
};

export default Pluginit;
