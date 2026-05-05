import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MetaSection } from "@/features/meta/MetaSection";
import { StatusBadge } from "@/features/meta/StatusBadge";
import { CoverageBar } from "@/features/meta/CoverageBar";
import {
  INFRASTRUCTURE, DATA_TABLES, COVERAGE_SEGMENTS, COVERAGE_INDICATORS,
  COVERAGE_YEARS, KNOWN_GAPS, ROADMAP,
} from "@/features/meta/data";
import { useTableCounts } from "@/hooks/useTableCount";
import { ImpactMatrix } from "@/features/meta/ImpactMatrix";

const NavigaattoriTietokanta = () => {
  useEffect(() => { document.title = "V-Signal · Tietokannan kokonaisarvio"; }, []);

  const tableNames = DATA_TABLES.map((t) => t.name);
  const { counts } = useTableCounts(tableNames);

  return (
    <div className="px-5 py-8 max-w-5xl mx-auto">
      <header className="mb-6 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-2">Vaihe · Meta</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink">
            Tietokannan kokonaisarvio
          </h1>
          <p className="text-sm text-ink-mute mt-2 max-w-2xl">
            Mitä V-Signalin datakerros sisältää juuri nyt: infrastruktuuri, taulut ja
            näkymät, kattavuus, tunnetut puutteet ja tiekartta.
          </p>
        </div>
        <Link to="/navigaattori" className="font-mono text-[11px] text-ink-mute hover:text-gold">
          ← yleisnäkymä
        </Link>
      </header>

      {/* INFRA */}
      <MetaSection id="infra" eyebrow="01 · Infrastruktuuri" title="Mistä koostuu">
        <div className="grid sm:grid-cols-2 gap-3">
          {INFRASTRUCTURE.map((it) => (
            <div key={it.area} className="paper p-4">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                  {it.area}
                </div>
                <StatusBadge status={it.status} />
              </div>
              <div className="font-serif text-base text-ink leading-snug">{it.detail}</div>
              {it.note && (
                <div className="text-[12px] text-ink-soft mt-2">{it.note}</div>
              )}
            </div>
          ))}
        </div>
      </MetaSection>

      {/* TAULUT */}
      <MetaSection
        id="taulut"
        eyebrow="02 · Taulut & näkymät"
        title="Live-rivimäärät"
        right={<span className="font-mono text-[10px] text-ink-faint">live → fallback staattiseen</span>}
      >
        <div className="paper overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper-deep">
              <tr className="text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Nimi</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Rivit (live)</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Rivit (oletus)</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Kuvaus</th>
              </tr>
            </thead>
            <tbody>
              {DATA_TABLES.map((t) => {
                const live = counts[t.name];
                const liveLabel =
                  live == null ? "—" : live.toLocaleString("fi-FI");
                const liveStatus =
                  live == null ? "missing" : live > 0 ? "ok" : "partial";
                return (
                  <tr key={t.name} className="border-t border-ink/5 align-top">
                    <td className="px-4 py-3 font-mono text-xs text-ink">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span style={{ color: live == null ? "var(--ink-faint)" : "var(--ink)" }}>
                        {liveLabel}
                      </span>{" "}
                      <StatusBadge status={liveStatus} label={live == null ? "ei tavoitettu" : "live"} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-mute">
                      {t.rows == null ? "—" : t.rows.toLocaleString("fi-FI")}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-[13px] text-ink-soft">
                      {t.desc}
                      {t.source && (
                        <div className="font-mono text-[10px] text-ink-faint mt-1">{t.source}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </MetaSection>

      {/* KATTAVUUS */}
      <MetaSection id="kattavuus" eyebrow="03 · Kattavuus" title="Segmentti · indikaattori · vuosi">
        <div className="grid md:grid-cols-3 gap-5">
          <div className="paper p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-2">
              Segmentit
            </div>
            {COVERAGE_SEGMENTS.map((c) => <CoverageBar key={c.label} {...c} />)}
          </div>
          <div className="paper p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-2">
              Indikaattorit
            </div>
            {COVERAGE_INDICATORS.map((c) => <CoverageBar key={c.label} {...c} />)}
          </div>
          <div className="paper p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-2">
              Vuosijaksot
            </div>
            {COVERAGE_YEARS.map((c) => <CoverageBar key={c.label} {...c} />)}
          </div>
        </div>
      </MetaSection>

      {/* PUUTTEET */}
      <MetaSection id="puutteet" eyebrow="04 · Tunnetut puutteet" title="Datan katve">
        <ul className="paper p-5 flex flex-col gap-2">
          {KNOWN_GAPS.map((g) => (
            <li key={g} className="text-[14px] text-ink-soft flex gap-3 items-start">
              <span
                className="w-1.5 h-1.5 rounded-full mt-[9px] flex-shrink-0"
                style={{ background: "var(--fn-korjaava)" }}
              />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </MetaSection>

      {/* TIEKARTTA */}
      <MetaSection id="tiekartta" eyebrow="05 · Tiekartta" title="Mihin suuntaan">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROADMAP.map((p) => (
            <div key={p.phase} className="paper p-4 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                  {p.phase}
                </div>
                <StatusBadge status={p.status} />
              </div>
              <h3 className="font-serif text-lg text-ink leading-snug">{p.title}</h3>
              <ul className="text-[12.5px] text-ink-soft space-y-1.5 list-disc list-inside marker:text-ink-faint">
                {p.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </MetaSection>

      <p className="text-[10px] text-ink-faint font-mono mt-8">
        Erä A · staattinen meta-sivu · Erä B · datatilan chipit Kehään & tiekartta Lukijaan · Erä C · live-rivimäärät
      </p>
    </div>
  );
};

export default NavigaattoriTietokanta;
