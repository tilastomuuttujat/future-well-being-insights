import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  const [showDrivers, setShowDrivers] = useState(true);
  const [showInspect, setShowInspect] = useState(true);
  const [playing, setPlaying] = useState(false);

  // canvas size = container size for full-bleed
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1100, h: 620 });
  useEffect(() => {
    if (!stageRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      const r = e.contentRect;
      setSize({ w: Math.max(600, r.width), h: Math.max(420, r.height) });
    });
    ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, []);

  const phenom = useMemo(() => simulate(vars, t), [vars, t]);
  const pressure = systemPressure(phenom);
  const pressureLevel = pressure < 0.05 ? "calm" : pressure < 0.12 ? "moderate" : "critical";

  const reset = () => { setVars(baseVars); setSel(null); setT(3); setActiveScenario(null); setPlaying(false); };
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

  // Play loop: t 0 → 12 → loop
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      setT((prev) => {
        const next = prev + dt * 1.5; // 8 sec for 0→12
        return next > 12 ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

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

  const phenomDeltas = (Object.keys(PHENOMENA) as PhenomKey[])
    .map((k) => ({
      k, label: PHENOMENA[k].short,
      pct: ((phenom[k] - PHENOMENA[k].base) / PHENOMENA[k].base) * 100,
      good: PHENOMENA[k].good,
    }))
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));

  return (
    <div className="px-4 py-4 max-w-[1800px] mx-auto">
      {/* Header — kompakti */}
      <header className="mb-3 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-0.5">Vaihe · Hypoteesi</p>
          <h1 className="font-serif text-xl sm:text-2xl text-ink leading-tight">Hyvinvointi-ilmiöt</h1>
          <p className="text-[11px] text-ink-mute mt-0.5 max-w-2xl">
            Säädä vasemmalta · katso paine etenee verkossa · valitse skenaario oikealta. Hypoteesigeneraattori, ei ennustemalli.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: pressureColor }}>
            paine {pressure.toFixed(2)}
          </span>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="font-mono text-[10px] uppercase tracking-[0.16em] px-3 py-1.5 border rounded-full transition-colors"
            style={{
              borderColor: playing ? "var(--gold)" : "rgba(26,29,36,0.2)",
              background: playing ? "var(--gold-soft)" : "transparent",
              color: playing ? "var(--gold)" : "var(--ink-mute)",
            }}>
            {playing ? "⏸ tauko" : "▶ aja aika"}
          </button>
          <button onClick={reset}
            className="font-mono text-[10px] uppercase tracking-[0.16em] px-3 py-1.5 border border-ink/20 rounded-full text-ink-mute hover:text-ink hover:border-ink/40">
            Nollaa
          </button>
        </div>
      </header>

      {/* Stage — full width canvas, paneelit kelluvat overlay-tasolla */}
      <div ref={stageRef}
        className="relative paper p-2"
        style={{ height: "calc(100vh - 180px)", minHeight: 520 }}>

        {/* Verkko täyttää koko stagen */}
        <div className="absolute inset-2">
          <PhenomNetwork
            vars={vars} phenom={phenom} t={t}
            selected={sel} onSelect={setSel}
            width={size.w} height={size.h}
          />
        </div>

        {/* Toggle-napit overlay-paneelien näkyvyyteen */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          <button onClick={() => setShowDrivers((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded border bg-paper/90 backdrop-blur"
            style={{
              borderColor: showDrivers ? "var(--gold)" : "rgba(26,29,36,0.15)",
              color: showDrivers ? "var(--gold)" : "var(--ink-mute)",
            }}>
            {showDrivers ? "◧ piilota driverit" : "◨ driverit"}
          </button>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <button onClick={() => setShowInspect((v) => !v)}
            className="font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded border bg-paper/90 backdrop-blur"
            style={{
              borderColor: showInspect ? "var(--gold)" : "rgba(26,29,36,0.15)",
              color: showInspect ? "var(--gold)" : "var(--ink-mute)",
            }}>
            {showInspect ? "skenaariot ◨" : "◧ skenaariot"}
          </button>
        </div>

        {/* Drivers overlay — vasen */}
        <AnimatePresence>
          {showDrivers && (
            <motion.aside
              key="drv"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="absolute top-12 left-3 w-[260px] paper p-3 z-10 shadow-sm border border-ink/10"
              style={{ maxHeight: "calc(100% - 80px)", overflow: "auto", background: "rgba(250,248,243,0.96)", backdropFilter: "blur(4px)" }}>
              <div className="flex items-baseline justify-between mb-2">
                <div className="eyebrow">Driverit</div>
                <span className="font-mono text-[10px] text-ink-faint">{Object.keys(DRIVERS).length}</span>
              </div>
              <DriverSliders vars={vars}
                onChange={(id, v) => { setVars((s) => ({ ...s, [id]: v })); setActiveScenario(null); }}
                highlight={sel?.kind === "driver" ? sel.id : null} />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Inspect + scenarios overlay — oikea */}
        <AnimatePresence>
          {showInspect && (
            <motion.aside
              key="ins"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="absolute top-12 right-3 w-[280px] z-10 flex flex-col gap-2"
              style={{ maxHeight: "calc(100% - 80px)" }}>

              <div className="paper p-3 shadow-sm border border-ink/10"
                style={{ background: "rgba(250,248,243,0.96)", backdropFilter: "blur(4px)" }}>
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
                        <div className="font-serif text-[12.5px] text-ink leading-tight">{s.name}</div>
                        <div className="text-[10px] text-ink-mute mt-0.5">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="paper p-3 shadow-sm border border-ink/10 overflow-auto"
                style={{ background: "rgba(250,248,243,0.96)", backdropFilter: "blur(4px)" }}>
                <div className="eyebrow mb-2">Tarkastelu</div>
                {!detail && (
                  <p className="text-[11px] text-ink-mute">Klikkaa solmua tai painerivi-chipiä — linkit listautuvat tähän.</p>
                )}
                {detail && (
                  <motion.div
                    key={sel!.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}>
                    <div className="font-mono text-[9px] text-ink-faint uppercase tracking-[0.16em]">{detail.kind}</div>
                    <div className="font-serif text-[14px] text-ink leading-snug mb-1">{detail.title}</div>
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
                            <span className="font-mono text-[9px]" style={{ color: CONF_META[l.conf].color }}>
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
                  </motion.div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Bottom bar: pressure chips + aika-slideri + legenda */}
        <div className="absolute left-3 right-3 bottom-3 z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {phenomDeltas.map((d) => {
              const benef = (d.pct > 0 ? 1 : -1) === d.good;
              const color = Math.abs(d.pct) < 0.5 ? "var(--ink-faint)"
                : benef ? "var(--fn-vahvistava)" : "var(--fn-korjaava)";
              return (
                <button key={d.k}
                  onClick={() => setSel(sel?.id === d.k ? null : { kind: "phenom", id: d.k })}
                  className="font-mono text-[10px] px-2 py-0.5 rounded border transition-colors bg-paper/90 backdrop-blur"
                  style={{
                    borderColor: sel?.id === d.k ? color : "rgba(26,29,36,0.12)",
                    color,
                    background: sel?.id === d.k ? "var(--gold-soft)" : "rgba(250,248,243,0.85)",
                  }}>
                  {d.label} {d.pct > 0 ? "+" : ""}{d.pct.toFixed(1)}%
                </button>
              );
            })}
          </div>
          <div className="paper px-3 py-2 border border-ink/10 mx-auto w-full max-w-[640px]"
            style={{ background: "rgba(250,248,243,0.94)", backdropFilter: "blur(4px)" }}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="eyebrow">Aikahorisontti</span>
              <span className="font-mono text-[11px] text-ink">+{t.toFixed(t % 1 ? 1 : 0)} v</span>
            </div>
            <input type="range" min={0} max={12} step={0.1} value={t}
              onChange={(e) => { setT(Number(e.target.value)); setPlaying(false); }}
              className="w-full accent-[var(--gold)]" />
            <div className="flex justify-between font-mono text-[9px] text-ink-faint">
              <span>nyt</span><span>+6v</span><span>+12v</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda + lähde */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-mute">
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
        <p className="text-[10px] text-ink-faint font-mono">
          ΔP = Σ(w · ΔX_norm · |P_base|) · timeFactor(lag, t) ·{" "}
          <Link to="/navigaattori/tietokanta#tiekartta" className="hover:text-gold">datatila →</Link>
        </p>
      </div>
    </div>
  );
};

export default NavigaattoriIlmiot;
