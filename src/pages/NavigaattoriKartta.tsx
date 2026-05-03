import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { NavigatorStage } from "@/features/navigator/NavigatorStage";
import { useNavStore } from "@/features/navigator/store";
import {
  CLUSTERS,
  CORNER_ROLE,
  CORNERS,
  CornerId,
  FN_COLOR,
  FN_LABEL,
  ROW_PX,
  TIME_LABELS,
  TIME_YEAR,
  Time,
  clamp,
  findActiveWake,
  viewsForRole,
  worldXToYear,
} from "@/features/navigator/constants";
import { autoSelect } from "@/features/navigator/auto";
import { LensRenderer } from "@/features/navigator/LensRenderers";

/**
 * /navigaattori/kartta — natiivi React-portti TTT-Navigaattorista.
 *
 * Erä 1: SVG-canvas (klusterit, vanavedet, HUD), 4 kulmaa joiden
 * linssivalinta tulee Auto-pisteytyksestä, lens-mode kytkin, top-3
 * läpinäkyvyys.
 *
 * Tulossa:
 *   - Erä 2: kulmanäkymien todellinen visualisointi (triptyykki, trendi,
 *     pyramidi, kausaali, …) komponentteina.
 *   - Erä 3: lens memory + AutoMemory localStorageen, URL-state.
 *   - Erä 4: coverage-paneeli, insight-intro, story-mode.
 */
const NavigaattoriKartta = () => {
  useEffect(() => {
    document.title = "V-Signal · Navigaattori-kartta";
  }, []);

  const cx = useNavStore((s) => s.cx);
  const cy = useNavStore((s) => s.cy);
  const lensMode = useNavStore((s) => s.lensMode);
  const setLensMode = useNavStore((s) => s.setLensMode);
  const views = useNavStore((s) => s.views);
  const setView = useNavStore((s) => s.setView);

  const activeRow = clamp(Math.round(cy / ROW_PX), 0, CLUSTERS.length - 1);
  const activeCluster = CLUSTERS[activeRow];
  const activeYear = Math.round(worldXToYear(cx));
  const activeTime = useMemo<Time>(() => {
    let best = Infinity;
    let t: Time = "now";
    (Object.keys(TIME_YEAR) as Time[]).forEach((k) => {
      const d = Math.abs(activeYear - TIME_YEAR[k]);
      if (d < best) { best = d; t = k; }
    });
    return t;
  }, [activeYear]);
  const activeWake = useMemo(
    () => findActiveWake(activeCluster, activeYear),
    [activeCluster, activeYear],
  );

  const ctx = { activeWake, activeTime, activeYear, activeCluster };

  return (
    <div className="px-5 py-8 max-w-6xl mx-auto">
      <header className="mb-5 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-2">Vaihe 2 · Navigaattori-kartta</p>
          <h1 className="font-serif text-3xl text-ink">
            Klusteri × Aika × Vanavesi
          </h1>
        </div>
        <Link to="/navigaattori" className="font-mono text-[11px] text-ink-mute hover:text-gold">
          ← yleisnäkymä
        </Link>
      </header>

      {/* Toolbar */}
      <div className="paper p-3 mb-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-ink-mute uppercase tracking-[0.16em]">Linssit</span>
          <button
            onClick={() => setLensMode("auto")}
            className="px-3 py-1 rounded-full transition-colors"
            style={{
              background: lensMode === "auto" ? "var(--ink)" : "transparent",
              color: lensMode === "auto" ? "var(--paper)" : "var(--ink-mute)",
              border: "1px solid var(--ink-faint)",
            }}
          >
            Älykäs
          </button>
          <button
            onClick={() => setLensMode("lock")}
            className="px-3 py-1 rounded-full transition-colors"
            style={{
              background: lensMode === "lock" ? "var(--ink)" : "transparent",
              color: lensMode === "lock" ? "var(--paper)" : "var(--ink-mute)",
              border: "1px solid var(--ink-faint)",
            }}
          >
            Lukittu
          </button>
        </div>
        <div className="text-[11px] font-mono text-ink-mute">
          {activeYear} · {TIME_LABELS[activeTime]} · {FN_LABEL[activeCluster.fn]}
        </div>
      </div>

      {/* Layout: 4 kulmaa + canvas keskellä */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 2fr 1fr", gridTemplateRows: "auto auto" }}>
        <CornerCard corner="tl" ctx={ctx} views={views} setView={setView} lensMode={lensMode} />
        <div className="row-span-2 paper p-2">
          <NavigatorStage />
        </div>
        <CornerCard corner="tr" ctx={ctx} views={views} setView={setView} lensMode={lensMode} />
        <CornerCard corner="bl" ctx={ctx} views={views} setView={setView} lensMode={lensMode} />
        <CornerCard corner="br" ctx={ctx} views={views} setView={setView} lensMode={lensMode} />
      </div>

      <p className="text-[11px] text-ink-mute font-mono mt-4">
        Erä 1 · canvas + auto-pisteytys · kulmanäkymien visualisoinnit tulevat erässä 2
      </p>
    </div>
  );
};

const CornerCard = ({
  corner,
  ctx,
  views,
  setView,
  lensMode,
}: {
  corner: CornerId;
  ctx: Parameters<typeof autoSelect>[1];
  views: Record<CornerId, string>;
  setView: (c: CornerId, v: string) => void;
  lensMode: "auto" | "lock";
}) => {
  const role = CORNER_ROLE[corner];
  const auto = useMemo(() => autoSelect(corner, ctx), [corner, ctx]);
  const current = views[corner] === "auto" ? auto.id : views[corner];
  const available = viewsForRole(corner);
  const fn = FN_COLOR[ctx.activeCluster.fn];

  return (
    <div className="paper p-3 flex flex-col gap-2 min-h-[180px]">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow" style={{ color: fn }}>{role.tag}</p>
        <span className="font-mono text-[10px] text-ink-faint uppercase">{corner}</span>
      </div>
      <h3 className="font-serif text-base text-ink leading-tight">{role.hint}</h3>

      <select
        value={views[corner]}
        onChange={(e) => setView(corner, e.target.value)}
        disabled={lensMode === "lock" && views[corner] !== "auto" ? false : false}
        className="text-[11px] font-mono bg-transparent border border-ink/10 rounded px-2 py-1 text-ink"
      >
        {available.map((v) => (
          <option key={v.id} value={v.id}>
            {v.glyph}  {v.label}{v.id === "auto" ? ` → ${auto.id}` : ""}
          </option>
        ))}
      </select>

      <div className="flex-1 min-h-[140px]">
        <LensRenderer
          view={current}
          corner={corner}
          ctx={{
            cluster: ctx.activeCluster,
            time: ctx.activeTime,
            year: ctx.activeYear,
            wake: ctx.activeWake,
          }}
        />
      </div>

      {views[corner] === "auto" && (
        <p className="text-[10px] font-mono text-ink-faint leading-snug border-t border-ink/5 pt-1">
          {auto.reason}
        </p>
      )}
    </div>
  );
};

export default NavigaattoriKartta;
