import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { NavigatorStage } from "@/features/navigator/NavigatorStage";
import { useNavStore } from "@/features/navigator/store";
import {
  CLUSTERS,
  CORNER_ROLE,
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
import { useNavigatorUrlSync } from "@/features/navigator/useNavigatorUrlSync";
import { CoveragePanel } from "@/features/navigator/CoveragePanel";
import { InsightIntro } from "@/features/navigator/InsightIntro";
import { StoryMode } from "@/features/navigator/StoryMode";

/**
 * /navigaattori/kartta — natiivi React-portti TTT-Navigaattorista.
 *
 * Erä 3: lens memory (per klusteri, persist localStorageen),
 * URL-state-synkronointi, kulmanäkymän zoom-overlay,
 * näppäimistö- ja klikkausinteraktiot kartalla.
 */
const NavigaattoriKartta = () => {
  useEffect(() => { document.title = "V-Signal · Navigaattori-kartta"; }, []);
  useNavigatorUrlSync();

  const cx = useNavStore((s) => s.cx);
  const cy = useNavStore((s) => s.cy);
  const lensMode = useNavStore((s) => s.lensMode);
  const setLensMode = useNavStore((s) => s.setLensMode);
  const views = useNavStore((s) => s.views);
  const setView = useNavStore((s) => s.setView);
  const recallMemory = useNavStore((s) => s.recallMemory);
  const zoomed = useNavStore((s) => s.zoomed);
  const setZoom = useNavStore((s) => s.setZoom);

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

  // Klusterivaihdoksessa: jos lukittu, palauta muistettu valinta;
  // jos auto, varmista että rivit ovat "auto".
  const lastClusterRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastClusterRef.current === activeCluster.id) return;
    lastClusterRef.current = activeCluster.id;
    if (lensMode === "lock") recallMemory(activeCluster.id);
  }, [activeCluster.id, lensMode, recallMemory]);

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
        <div className="flex items-center gap-3">
          <StoryMode />
          <div className="text-[11px] font-mono text-ink-mute">
            {activeYear} · {TIME_LABELS[activeTime]} · {FN_LABEL[activeCluster.fn]}
          </div>
        </div>
      </div>

      <InsightIntro cluster={activeCluster} time={activeTime} year={activeYear} wake={activeWake} />

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 2fr 1fr", gridTemplateRows: "auto auto" }}>
        <CornerCard corner="tl" ctx={ctx} views={views} setView={setView} lensMode={lensMode} onZoom={() => setZoom("tl")} />
        <div className="row-span-2 paper p-2">
          <NavigatorStage />
        </div>
        <CornerCard corner="tr" ctx={ctx} views={views} setView={setView} lensMode={lensMode} onZoom={() => setZoom("tr")} />
        <CornerCard corner="bl" ctx={ctx} views={views} setView={setView} lensMode={lensMode} onZoom={() => setZoom("bl")} />
        <CornerCard corner="br" ctx={ctx} views={views} setView={setView} lensMode={lensMode} onZoom={() => setZoom("br")} />
      </div>

      <div className="mt-4">
        <CoveragePanel cluster={activeCluster} time={activeTime} year={activeYear} wake={activeWake} views={views} />
      </div>

      <p className="text-[11px] text-ink-mute font-mono mt-4">
        Erä 4 · coverage · insight-intro · tarinatila valmiina
      </p>

      {zoomed && (
        <ZoomOverlay corner={zoomed} ctx={ctx} views={views} setView={setView} lensMode={lensMode} onClose={() => setZoom(null)} />
      )}
    </div>
  );
};

const CornerCard = ({
  corner, ctx, views, setView, lensMode, onZoom,
}: {
  corner: CornerId;
  ctx: Parameters<typeof autoSelect>[1];
  views: Record<CornerId, string>;
  setView: (c: CornerId, v: string, clusterId?: string) => void;
  lensMode: "auto" | "lock";
  onZoom: () => void;
}) => {
  const role = CORNER_ROLE[corner];
  const auto = useMemo(() => autoSelect(corner, ctx), [corner, ctx]);
  const current = views[corner] === "auto" ? auto.id : views[corner];
  const available = viewsForRole(corner);
  const fn = FN_COLOR[ctx.activeCluster.fn];

  return (
    <div className="paper p-3 flex flex-col gap-2 min-h-[180px] relative">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow" style={{ color: fn }}>{role.tag}</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-faint uppercase">{corner}</span>
          <button
            onClick={onZoom}
            title="Suurenna"
            aria-label="Suurenna kulmanäkymä"
            className="font-mono text-[10px] text-ink-mute hover:text-gold border border-ink/10 rounded px-1.5 leading-none py-0.5"
          >⤢</button>
        </div>
      </div>
      <h3 className="font-serif text-base text-ink leading-tight">{role.hint}</h3>

      <select
        value={views[corner]}
        onChange={(e) => setView(corner, e.target.value, ctx.activeCluster.id)}
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

const ZoomOverlay = ({
  corner, ctx, views, setView, lensMode, onClose,
}: {
  corner: CornerId;
  ctx: Parameters<typeof autoSelect>[1];
  views: Record<CornerId, string>;
  setView: (c: CornerId, v: string, clusterId?: string) => void;
  lensMode: "auto" | "lock";
  onClose: () => void;
}) => {
  const role = CORNER_ROLE[corner];
  const auto = useMemo(() => autoSelect(corner, ctx), [corner, ctx]);
  const current = views[corner] === "auto" ? auto.id : views[corner];
  const available = viewsForRole(corner);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="paper w-full max-w-3xl max-h-[85vh] flex flex-col p-5 gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between">
          <div>
            <p className="eyebrow">{role.tag}</p>
            <h2 className="font-serif text-2xl text-ink">{role.hint}</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={views[corner]}
              onChange={(e) => setView(corner, e.target.value, ctx.activeCluster.id)}
              className="text-[11px] font-mono bg-transparent border border-ink/10 rounded px-2 py-1 text-ink"
            >
              {available.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.glyph}  {v.label}{v.id === "auto" ? ` → ${auto.id}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="font-mono text-xs text-ink-mute hover:text-gold border border-ink/10 rounded px-2 py-1"
              aria-label="Sulje"
            >Sulje · esc</button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
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
      </div>
    </div>
  );
};

export default NavigaattoriKartta;
