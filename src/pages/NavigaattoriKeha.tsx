import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KehaCanvas } from "@/features/keha/KehaCanvas";
import { PlacedPoint } from "@/features/keha/data";

interface Sel { A: PlacedPoint | null; B: PlacedPoint | null; }

/**
 * /navigaattori/keha — natiivi React-portti TTT-Kehänavigaattorista (naviga-10-2.html).
 *
 * Erä 1: ympyräkehä, 15 klusteria ikonein ja kaarinimin, raahattavat A/B-linssit,
 * valintapaneeli (A vs. B). Erät 2-4 lisäävät topbarin (väestöryhmä/asema/alue),
 * vuosikymmenlinssin, profiilirailin ja investointimodaalin.
 */
const NavigaattoriKeha = () => {
  useEffect(() => { document.title = "V-Signal · Kehänavigaattori"; }, []);
  const [sel, setSel] = useState<Sel>({ A: null, B: null });

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

      <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)" }}>
        <div className="paper p-3">
          <KehaCanvas onSelect={setSel} />
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
          <p className="eyebrow">Valinta</p>
          <div className="grid grid-cols-2 gap-2">
            <SelCard label="A" color="#2d5a3d" point={sel.A} />
            <SelCard label="B" color="#7a3010" point={sel.B} />
          </div>
          {sel.A && sel.B ? (
            <div className="border-t border-ink/10 pt-3 grid grid-cols-3 gap-2 text-center">
              <Stat lbl="A · arvo" val={fmt(sel.A.d.value)} sub={sel.A.d.unit} />
              <Stat lbl="B · arvo" val={fmt(sel.B.d.value)} sub={sel.B.d.unit} />
              <Stat lbl="Ryhmä" val={sameCluster ? "=" : "≠"} sub={sameCluster ? "sama" : "eri"} />
            </div>
          ) : (
            <p className="text-[11px] text-ink-faint font-mono">Valitse A ja B linsseillä.</p>
          )}
          <p className="text-[10px] text-ink-faint font-mono leading-snug border-t border-ink/5 pt-2">
            Erä 1 valmis · seuraavaksi topbar (väestöryhmä/asema/alue), vuosikymmenlinssi ja investointikortti.
          </p>
        </aside>
      </div>
    </div>
  );
};

const fmt = (v: number | null) =>
  v == null || isNaN(v) ? "—" : v.toLocaleString("fi-FI", { maximumFractionDigits: 1 });

const SelCard = ({ label, color, point }: { label: string; color: string; point: PlacedPoint | null }) => (
  <div className="border border-ink/10 rounded p-2 min-h-[88px]">
    <div className="font-mono text-[10px]" style={{ color }}>{label}</div>
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
