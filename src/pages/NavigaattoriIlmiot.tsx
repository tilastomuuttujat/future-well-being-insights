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
  const [t, setT] = useState(3);
  const [sel, setSel] = useState<{ kind: "phenom" | "driver"; id: string } | null>(null);
  const [activeScenario, setActiveScenario] = useState<number | null>(null);

  const phenom = useMemo(() => simulate(vars, t), [vars, t]);
  const pressure = systemPressure(phenom);
  const pressureLevel = pressure < 0.05 ? "calm" : pressure < 0.12 ? "moderate" : "critical";

  const reset = () => { setVars(baseVars); setSel(null); setT(3); setActiveScenario(null); };
  const applyScenario = (idx: number) => {
    const sc = SCENARIOS[idx];
    if (!sc) return;
    const nv = { ...baseVars };
    for (const [k, dv] of Object.entries(sc.changes)) {
      const d = DRIVERS[k];
      if (d) nv[k] = Math.max(d.min, Math.min(d.max, d.base + dv));
    }
    setVars(nv);
    setActiveScenario(idx);
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

  // Top-3 muutoksen ilmiöt nopeaan paneeliin
  const phenomDeltas = (Object.keys(PHENOMENA) as PhenomKey[])
    .map((k) => ({
      k, label: PHENOMENA[k].short,
      pct: ((phenom[k] - PHENOMENA[k].base) / PHENOMENA[k].base) * 100,
      good: PHENOMENA[k].good,
    }))
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  return (
    <div className="px-5 py-6 max-w-[1480px] mx-auto">
      <header className="mb-4 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-1">Vaihe · Hypoteesi</p>
          <h1 className="font-serif text-2xl sm:text-3xl text-ink">Hyvinvointi-ilmiöt</h1>
          <p className="text-[12px] text-ink-mute mt-1 max-w-2xl">
            Säädä vasemmalta · katso paine etenee verkossa · valitse skenaario alhaalta. Ei ennustemalli — hypoteesigeneraattori.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: pressureColor }}>
            paine {pressure.toFixed(2)}
          </span>
          <button onClick={reset}
            className="font-mono text-[10px] uppercase tracking-[0.16em] px-3 py-1.5 border border-ink/20 rounded-full text-ink-mute hover:text-ink hover:border-ink/40">
            Nollaa
          </button>
        </div>
      </header>

      {/* Ylä-grid: sliderit | verkko | tarkastelu — kaikki yhtä aikaa */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-4">
        {/* Sliderit */}
        <aside className="paper p-3 self-start lg:sticky lg:top-3 max-h-[calc(100vh-120px)] overflow-auto">
          <div className="flex items-baseline justify-between mb-2">
            <div className="eyebrow">Driverit</div>
            <span className="font-mono text-[10px] text-ink-faint">{Object.keys(DRIVERS).length}</span>
          </div>
          <DriverSliders vars={vars} onChange={(id, v) => { setVars((s) => ({ ...s, [id]: v })); setActiveScenario(null); }}
            highlight={sel?.kind === "driver" ? sel.id : null} />
        </aside>

        {/* Verkko + paine-rivi + aikaslideri */}
        <div className="paper p-3 flex flex-col gap-2">
          {/* Pressure micro-strip */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {phenomDeltas.map((d) => {
              const benef = (d.pct > 0 ? 1 : -1) === d.good;
              const color = Math.abs(d.pct) < 0.5 ? "var(--ink-faint)"
                : benef ? "var(--fn-vahvistava)" : "var(--fn-korjaava)";
              return (
                <button key={d.k}
                  onClick={() => setSel(sel?.id === d.k ? null : { kind: "phenom", id: d.k })}
                  className="font-mono text-[10px] px-2 py-0.5 rounded border transition-colors"
                  style={{
                    borderColor: sel?.id === d.k ? color : "rgba(26,29,36,0.12)",
                    color,
                    background: sel?.id === d.k ? "var(--gold-soft)" : "transparent",
                  }}>
                  {d.label} {d.pct > 0 ? "+" : ""}{d.pct.toFixed(1)}%
                </button>
              );
            })}
          </div>

          <PhenomNetwork vars={vars} phenom={phenom} t={t} selected={sel} onSelect={setSel} />

          {/* Aika-slideri verkon alle */}
          <div className="px-2">
            <div className="flex items-baseline justify-between mb-1">
              <span className="eyebrow">Aikahorisontti</span>
              <span className="font-mono text-[11px] text-ink">+{t} v</span>
            </div>
            <input type="range" min={0} max={12} step={1} value={t}
              onChange={(e) => setT(Number(e.target.value))}
              className="w-full accent-[var(--gold)]" />
            <div className="flex justify-between font-mono text-[9px] text-ink-faint">
              <span>nyt</span><span>+6v</span><span>+12v</span>
            </div>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-mute pt-1 border-t border-ink/5">
            {(Object.keys(CONF_META) as Array<keyof typeof CONF_META>).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5" style={{ background: CONF_META[k].color }} />
                <span className="font-mono" style={{ color: CONF_META[k].color }}>{CONF_META[k].label}</span>
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5" style={{ background: "var(--fn-vahvistava)" }} />
              <span className="font-mono" style={{ color: "var(--fn-vahvistava)" }}>aktiivinen +</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5" style={{ background: "var(--fn-korjaava)" }} />
              <span className="font-mono" style={{ color: "var(--fn-korjaava)" }}>aktiivinen −</span>
            </span>
          </div>
        </div>

        {/* Tarkastelu + skenaariot */}
        <aside className="flex flex-col gap-3 self-start lg:sticky lg:top-3 max-h-[calc(100vh-120px)] overflow-auto">
          <div className="paper p-3">
            <div className="eyebrow mb-2">Skenaariot</div>
            <div className="flex flex-col gap-1.5">
              {SCENARIOS.map((s, i) => {
                const active = activeScenario === i;
                return (
                  <button key={s.name} onClick={() => applyScenario(i)}
                    className="text-left p-2 border rounded transition-colors"
                    style={{
                      borderColor: active ? "var(--gold)" : "rgba(26,29,36,0.10)",
                      background: active ? "var(--gold-soft)" : "transparent",
                    }}>
                    <div className="font-serif text-[13px] text-ink leading-tight">{s.name}</div>
                    <div className="text-[10px] text-ink-mute mt-0.5">{s.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="paper p-3">
            <div className="eyebrow mb-2">Tarkastelu</div>
            {!detail && (
              <p className="text-[11px] text-ink-mute">Klikkaa solmua tai painerivi-chipiä — linkit listautuvat tähän.</p>
            )}
            {detail && (
              <>
                <div className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.16em]">{detail.kind}</div>
                <div className="font-serif text-[15px] text-ink leading-snug mb-1">{detail.title}</div>
                {detail.ph && (
                  <div className="font-mono text-[10px] text-ink-mute mb-2">
                    {phenom[sel!.id as PhenomKey].toFixed(2)} {detail.ph.unit}
                    {" · lähtö "}{detail.ph.base}
                  </div>
                )}
                <div className="space-y-1.5">
                  {detail.links.map((l, i) => (
                    <div key={i} className="border-l-2 pl-2"
                      style={{ borderColor: CONF_META[l.conf].color }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-[9px]"
                          style={{ color: CONF_META[l.conf].color }}>
                          {CONF_META[l.conf].label}
                          {l.r != null && ` · r=${l.r.toFixed(2)}`}
                        </span>
                        <span className="font-mono text-[9px] text-ink-mute">
                          w={l.weight > 0 ? "+" : ""}{l.weight.toFixed(2)} · {l.lag}v
                        </span>
                      </div>
                      <div className="text-[10px] text-ink-soft">
                        {DRIVERS[l.from]?.label ?? PHENOMENA[l.from as PhenomKey]?.label ?? l.from}
                        {" → "}
                        {PHENOMENA[l.to].label}
                      </div>
                      <div className="text-[10px] text-ink-mute italic">{l.note}</div>
                    </div>
                  ))}
                  {detail.links.length === 0 && (
                    <div className="text-[10px] text-ink-mute">Ei suoria linkkejä mallissa.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      <p className="text-[10px] text-ink-faint font-mono mt-4">
        Lähde · ilmiosim_standalone + hyvinvointisimulaattori. Kaava ΔP = Σ(w · ΔX_norm · |P_base|) · timeFactor(lag, t).
        Painot ovat assosiaatioita, eivät kausaalivaikutuksia.{" "}
        <Link to="/navigaattori/tietokanta#tiekartta" className="hover:text-gold">datatila →</Link>
      </p>
    </div>
  );
};

export default NavigaattoriIlmiot;
