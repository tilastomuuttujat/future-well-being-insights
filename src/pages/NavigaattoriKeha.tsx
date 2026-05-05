import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KehaCanvas } from "@/features/keha/KehaCanvas";
import { DecadeLens } from "@/features/keha/DecadeLens";
import { ProfileRail } from "@/features/keha/ProfileRail";
import { InvestmentModal } from "@/features/keha/InvestmentModal";
import { PlacedPoint } from "@/features/keha/data";
import { DataStatusChip } from "@/features/keha/DataStatusChip";
import {
  AREA_TABS, ASEMA, DEFAULT_PROFILE, ELAMANVAIHE, Profile,
  findingsForProfile, highlightedClusters,
} from "@/features/keha/profile";

interface Sel { A: PlacedPoint | null; B: PlacedPoint | null; }

/**
 * /navigaattori/keha — natiivi React-portti TTT-Kehänavigaattorista (naviga-10-2.html).
 *
 * Erä 2: topbar (elämänvaihe + sosioekonominen asema), aluetabit (Kaupunki/Taajama/Maaseutu),
 * profiilipohjainen klusterien korostus ja löydökset-paneeli.
 */
const NavigaattoriKeha = () => {
  useEffect(() => { document.title = "V-Signal · Kehänavigaattori"; }, []);
  const [sel, setSel] = useState<Sel>({ A: null, B: null });
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [pts, setPts] = useState<PlacedPoint[]>([]);
  const [investOpen, setInvestOpen] = useState(false);

  const highlight = useMemo(() => highlightedClusters(profile), [profile]);
  const findings = useMemo(() => findingsForProfile(pts, profile), [pts, profile]);
  const sameCluster = sel.A && sel.B && sel.A.d.cid === sel.B.d.cid;

  return (
    <div className="px-5 py-8 max-w-6xl mx-auto">
      <header className="mb-5 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-2">Vaihe 2 · Kehänavigaattori</p>
          <h1 className="font-serif text-3xl text-ink">
            TTT — Taakka · Totuus · Teko
          </h1>
          <p className="text-sm text-ink-mute mt-1">
            15 klusteria · sektorimenot ja indikaattorit · raahaa suurennuslaseja A/B
          </p>
        </div>
        <Link to="/navigaattori" className="font-mono text-[11px] text-ink-mute hover:text-gold">
          ← yleisnäkymä
        </Link>
      </header>

      {/* TOPBAR — elämänvaihe + sosioekonominen asema */}
      <div className="paper p-3 mb-4 flex flex-col gap-2">
        <RadioRow
          label="Väestöryhmä · ankkuri"
          items={ELAMANVAIHE.map((e) => ({ k: e.k, n: e.n }))}
          value={profile.elamanvaihe}
          onChange={(k) => setProfile((p) => ({ ...p, elamanvaihe: k }))}
        />
        <RadioRow
          label="Elämäntilanne · vaihe"
          items={ASEMA.map((a) => ({ k: a.k, n: a.n }))}
          value={profile.asema ?? ""}
          allowClear
          onChange={(k) => setProfile((p) => ({ ...p, asema: k || null }))}
        />
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)" }}>
        <div className="paper p-3">
          <KehaCanvas
            onSelect={setSel}
            highlight={highlight}
            onPointsReady={setPts}
          />
          <div className="flex items-center gap-4 text-[11px] font-mono text-ink-mute mt-2 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#2d5a3d" }} />
              Sektorimenot
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#7a3010" }} />
              Indikaattorit
            </span>
            <span className="ml-auto text-[10px] text-ink-faint">
              raahaa linssiä · klikkaa pistettä
            </span>
          </div>
        </div>

        <aside className="paper p-4 flex flex-col gap-3">
          {/* Aluetabit */}
          <div className="flex gap-1 border-b border-ink/10 pb-2">
            {AREA_TABS.map((t) => (
              <button
                key={t.k}
                onClick={() => setProfile((p) => ({ ...p, area: t.k }))}
                className="flex-1 px-2 py-1.5 rounded font-mono text-[10px] uppercase tracking-wider transition-colors text-left"
                style={{
                  background: profile.area === t.k ? "var(--ink)" : "transparent",
                  color: profile.area === t.k ? "var(--paper)" : "var(--ink-mute)",
                  border: "1px solid var(--ink-faint)",
                }}
              >
                <div>{t.n}</div>
                <div className="text-[9px] opacity-70 normal-case tracking-normal">{t.sub}</div>
              </button>
            ))}
          </div>

          {/* Valinta A/B */}
          <p className="eyebrow">Valinta</p>
          <div className="grid grid-cols-2 gap-2">
            <SelCard label="A" color="#2d5a3d" point={sel.A} />
            <SelCard label="B" color="#7a3010" point={sel.B} />
          </div>
          {sel.A && sel.B && (
            <div className="border-t border-ink/10 pt-3 grid grid-cols-3 gap-2 text-center">
              <Stat lbl="A · arvo" val={fmt(sel.A.d.value)} sub={sel.A.d.unit} />
              <Stat lbl="B · arvo" val={fmt(sel.B.d.value)} sub={sel.B.d.unit} />
              <Stat lbl="Ryhmä" val={sameCluster ? "=" : "≠"} sub={sameCluster ? "sama" : "eri"} />
            </div>
          )}

          {/* Löydökset */}
          <div className="border-t border-ink/10 pt-3">
            <div className="flex items-baseline justify-between mb-2">
              <p className="eyebrow">Löydökset</p>
              <span className="flex items-center gap-2">
                {findings[0] && <DataStatusChip cid={findings[0].cid} />}
                <span className="font-mono text-[10px] text-ink-faint">{findings.length}</span>
              </span>
            </div>
            {findings.length === 0 ? (
              <p className="text-[11px] text-ink-faint font-mono">
                Valitse väestöryhmä → korostuvat klusterit ja löydökset näkyvät tässä.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
                {findings.slice(0, 30).map((d) => (
                  <li key={d.id} className="flex items-baseline justify-between gap-2 text-[11px] border-b border-ink/5 py-1">
                    <span className="flex items-baseline gap-1.5 min-w-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-1px]"
                        style={{ background: d.source === "sector" ? "#2d5a3d" : "#7a3010" }}
                      />
                      <span className="truncate">{d.name}</span>
                    </span>
                    <span className="font-mono text-[10px] text-ink-mute shrink-0">
                      {fmt(d.value)} {d.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <DecadeLens phase={profile.elamanvaihe} area={profile.area} />

      <ProfileRail
        phase={profile.elamanvaihe}
        area={profile.area}
        onOpenInvestment={() => setInvestOpen(true)}
      />

      <InvestmentModal
        open={investOpen}
        onOpenChange={setInvestOpen}
        phase={profile.elamanvaihe}
        area={profile.area}
      />

      <p className="text-[10px] text-ink-faint font-mono mt-4">
        Erä 4 valmis · profiilirail, investointikortti säätimineen ja arjen vaikutuslistat.
      </p>
    </div>
  );
};

const fmt = (v: number | null) =>
  v == null || isNaN(v) ? "—" : v.toLocaleString("fi-FI", { maximumFractionDigits: 1 });

const RadioRow = ({
  label, items, value, onChange, allowClear,
}: {
  label: string;
  items: { k: string; n: string }[];
  value: string;
  onChange: (k: string) => void;
  allowClear?: boolean;
}) => (
  <div>
    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint mb-1">
      {label}
    </div>
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it) => {
        const active = it.k === value;
        return (
          <button
            key={it.k}
            onClick={() => onChange(allowClear && active ? "" : it.k)}
            className="px-2 py-1.5 rounded font-mono text-[11px] transition-colors"
            style={{
              background: active ? "var(--ink)" : "transparent",
              color: active ? "var(--paper)" : "var(--ink-mute)",
              border: "1px solid var(--ink-faint)",
            }}
          >
            {it.n}
          </button>
        );
      })}
    </div>
  </div>
);

const SelCard = ({ label, color, point }: { label: string; color: string; point: PlacedPoint | null }) => (
  <div className="border border-ink/10 rounded p-2 min-h-[88px]">
    <div className="flex items-baseline justify-between gap-2">
      <div className="font-mono text-[10px]" style={{ color }}>{label}</div>
      {point && <DataStatusChip cid={point.d.cid} />}
    </div>
    <div className="font-serif text-sm text-ink leading-tight mt-0.5">
      {point?.d.name ?? "—"}
    </div>
    <div className="text-[10px] text-ink-mute font-mono mt-1">
      {point ? `${fmt(point.d.value)} ${point.d.unit}${point.d.latestYear ? " · " + point.d.latestYear : ""}` : "—"}
    </div>
    <div className="text-[10px] text-ink-faint font-mono">
      {point ? `${point.d.source === "sector" ? "Sektori" : "Indikaattori"} · ${point.d.cname}` : ""}
    </div>
  </div>
);

const Stat = ({ lbl, val, sub }: { lbl: string; val: string; sub?: string }) => (
  <div>
    <div className="text-[10px] font-mono text-ink-faint uppercase tracking-wider">{lbl}</div>
    <div className="font-serif text-lg text-ink">{val}</div>
    {sub && <div className="text-[10px] font-mono text-ink-mute">{sub}</div>}
  </div>
);

export default NavigaattoriKeha;
