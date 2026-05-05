import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PhenomNetwork } from "@/features/ilmiot/PhenomNetwork";
import { DriverSliders } from "@/features/ilmiot/DriverSliders";
import {
  DRIVERS, LINKS, PHENOMENA, SCENARIOS, CONF_META,
  simulate, systemPressure, type PhenomKey,
} from "@/features/ilmiot/data";

const NavigaattoriIlmiot = () => {
  useEffect(() => { document.title = "V-Signal · Hyvinvointi-ilmiöt"; }, []);

  const baseVars = useMemo(
    () => Object.fromEntries(Object.entries(DRIVERS).map(([k, d]) => [k, d.base])),
    [],
  );
  const [vars, setVars] = useState<Record<string, number>>(baseVars);
  const [t, setT] = useState(0);
  const [sel, setSel] = useState<{ kind: "phenom" | "driver"; id: string } | null>(null);

  const phenom = useMemo(() => simulate(vars, t), [vars, t]);
  const pressure = systemPressure(phenom);
  const pressureLevel = pressure < 0.05 ? "calm" : pressure < 0.12 ? "moderate" : "critical";

  const reset = () => { setVars(baseVars); setSel(null); setT(0); };
  const applyScenario = (idx: number) => {
    const sc = SCENARIOS[idx];
    if (!sc) return;
    const nv = { ...baseVars };
    for (const [k, dv] of Object.entries(sc.changes)) {
      const d = DRIVERS[k];
      if (d) nv[k] = Math.max(d.min, Math.min(d.max, d.base + dv));
    }
    setVars(nv);
  };

  const detail = (() => {
    if (!sel) return null;
    if (sel.kind === "driver") {
      const d = DRIVERS[sel.id];
      const out = LINKS.filter((l) => l.from === sel.id);
      return { title: d?.label ?? sel.id, kind: "Tekijä", links: out };
    }
    const ph = PHENOMENA[sel.id as PhenomKey];
    const incoming = LINKS.filter((l) => l.to === sel.id);
    return { title: ph?.label ?? sel.id, kind: "Ilmiö", links: incoming, ph };
  })();

  const pressureColor = pressureLevel === "critical" ? "var(--fn-korjaava)"
    : pressureLevel === "moderate" ? "var(--gold)" : "var(--ink-mute)";

  return (
    <div className="px-5 py-8 max-w-6xl mx-auto">
      <header className="mb-6 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-2">Vaihe · Hypoteesi</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink">Hyvinvointi-ilmiöt</h1>
          <p className="text-sm text-ink-mute mt-2 max-w-2xl">
            Kuusi ilmiötä, niiden ajurit ja keskinäiset ketjut. Säädä driveriä → katso, miten
            paine etenee verkossa. Ei ennustemalli — hypoteesigeneraattori.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: pressureColor }}>
            Järjestelmäpaine {pressure.toFixed(2)}
          </span>
          <button onClick={reset}
            className="font-mono text-[10px] uppercase tracking-[0.16em] px-3 py-1.5 border border-ink/20 rounded-full text-ink-mute hover:text-ink hover:border-ink/40">
            Nollaa
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* Verkko */}
        <div className="paper p-4">
          <PhenomNetwork vars={vars} phenom={phenom} selected={sel} onSelect={setSel} />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-mute">
            {(Object.keys(CONF_META) as Array<keyof typeof CONF_META>).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5"
                  style={{
                    background: CONF_META[k].color,
                    borderTop: k === "lit" ? `2px dashed ${CONF_META[k].color}` : undefined,
                    height: k === "lit" ? 0 : undefined,
                  }} />
                <span className="font-mono" style={{ color: CONF_META[k].color }}>{CONF_META[k].label}</span>
                <span>· {CONF_META[k].desc}</span>
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3" style={{ borderTop: "2px dotted #7a4a8a", height: 0 }} />
              <span className="font-mono" style={{ color: "#7a4a8a" }}>KETJU</span>
              <span>· ilmiö → ilmiö (×0.55)</span>
            </span>
          </div>
        </div>

        {/* Tarkastelu */}
        <aside className="paper p-4 self-start">
          <div className="eyebrow mb-2">Tarkastelu</div>
          {!detail && (
            <p className="text-[12px] text-ink-mute">Klikkaa solmua verkosta — tekijän ulospäin lähtevät
              tai ilmiön sisään tulevat linkit listautuvat tähän.</p>
          )}
          {detail && (
            <>
              <div className="font-mono text-[10px] text-ink-faint uppercase tracking-[0.16em]">{detail.kind}</div>
              <div className="font-serif text-lg text-ink leading-snug mb-2">{detail.title}</div>
              {detail.ph && (
                <div className="font-mono text-[11px] text-ink-mute mb-2">
                  {phenom[sel!.id as PhenomKey].toFixed(2)} {detail.ph.unit}
                  {" · lähtö "}{detail.ph.base}
                </div>
              )}
              <div className="space-y-2 max-h-[360px] overflow-auto pr-1">
                {detail.links.map((l, i) => (
                  <div key={i} className="border-l-2 pl-2"
                    style={{ borderColor: CONF_META[l.conf].color }}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[10px]"
                        style={{ color: CONF_META[l.conf].color }}>
                        {CONF_META[l.conf].label}
                        {l.r != null && ` · r=${l.r.toFixed(2)}`}
                        {l.n != null && ` · n=${l.n}`}
                      </span>
                      <span className="font-mono text-[10px] text-ink-mute">
                        w={l.weight > 0 ? "+" : ""}{l.weight.toFixed(2)} · lag {l.lag}v
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-soft">
                      {DRIVERS[l.from]?.label ?? PHENOMENA[l.from as PhenomKey]?.label ?? l.from}
                      {" → "}
                      {PHENOMENA[l.to].label}
                    </div>
                    <div className="text-[11px] text-ink-mute italic mt-0.5">{l.note}</div>
                  </div>
                ))}
                {detail.links.length === 0 && (
                  <div className="text-[11px] text-ink-mute">Ei suoria linkkejä mallissa.</div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Skenaariot + sliderit */}
      <section className="mt-6 grid lg:grid-cols-[260px_1fr] gap-5">
        <div className="paper p-4">
          <div className="eyebrow mb-3">Skenaariot</div>
          <div className="flex flex-col gap-2">
            {SCENARIOS.map((s, i) => (
              <button key={s.name} onClick={() => applyScenario(i)}
                className="text-left p-2 border border-ink/10 rounded hover:border-gold hover:bg-paper-deep transition-colors">
                <div className="font-serif text-sm text-ink leading-tight">{s.name}</div>
                <div className="text-[11px] text-ink-mute mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>

          <div className="mt-5 eyebrow mb-2">Aikahorisontti</div>
          <input type="range" min={0} max={12} step={1} value={t}
            onChange={(e) => setT(Number(e.target.value))}
            className="w-full accent-[var(--gold)]" />
          <div className="flex justify-between font-mono text-[10px] text-ink-mute mt-1">
            <span>0v</span>
            <span className="text-ink">+{t}v</span>
            <span>+12v</span>
          </div>
          <p className="text-[11px] text-ink-mute mt-2 italic">
            Lyhyt: nopeat reaktiot. Pitkä: rakenteelliset linkit (lag) vaikuttavat täydellä painollaan.
          </p>
        </div>

        <div className="paper p-4">
          <div className="flex items-baseline justify-between mb-3">
            <div className="eyebrow">Driverit · {Object.keys(DRIVERS).length} tekijää</div>
            <Link to="/navigaattori/tietokanta#tiekartta"
              className="font-mono text-[10px] text-ink-mute hover:text-gold">
              datatila →
            </Link>
          </div>
          <DriverSliders vars={vars} onChange={(id, v) => setVars((s) => ({ ...s, [id]: v }))}
            highlight={sel?.kind === "driver" ? sel.id : null} />
        </div>
      </section>

      <p className="text-[10px] text-ink-faint font-mono mt-8">
        Lähde · ilmiosim_standalone + hyvinvointisimulaattori (proton portaus). Kaava ΔP = Σ(w · ΔX_norm · |P_base|) · timeFactor(lag, t).
        Painot ovat assosiaatioita, eivät kausaalivaikutuksia.
      </p>
    </div>
  );
};

export default NavigaattoriIlmiot;
