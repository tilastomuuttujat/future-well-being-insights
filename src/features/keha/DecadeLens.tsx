import { useMemo } from "react";
import { DECADE_YEARS, computeRoi, getDecadeData } from "./decade";

interface Props {
  phase: string;
  area: string;
}

/**
 * Vuosikymmenlinssi: 1980 → 2024 toteutunut panostus vs. tarvetaso,
 * sekä korjausinvestoinnin paluukäyrä (ROI). 1:1 portti naviga-10-2.html:n
 * decade-paneelista (rivit 3140-3920) — natiivina React/SVG-komponenttina.
 */
export function DecadeLens({ phase, area }: Props) {
  const data = useMemo(() => getDecadeData(phase, area), [phase, area]);
  const roi = useMemo(() => computeRoi(data), [data]);
  const pct = Math.round(data.currentPct * 100);
  const sign = data.currentDelta >= 0 ? "+" : "";

  return (
    <section className="paper p-4 mt-4">
      <header className="flex items-baseline justify-between flex-wrap gap-2 mb-3 border-b border-ink/10 pb-2">
        <div>
          <p className="eyebrow">Vuosikymmenten linssi</p>
          <h2 className="font-serif text-xl text-ink mt-0.5">{data.label} · {areaLabel(area)}</h2>
        </div>
        <div className="text-right">
          <div
            className="font-mono text-[11px] uppercase tracking-wider"
            style={{ color: data.currentDelta >= 0 ? "#2d5a3d" : "#7a3010" }}
          >
            {data.currentDelta >= 0 ? "Ylijäämä" : "Vajaus"} 2024
          </div>
          <div
            className="font-serif text-2xl"
            style={{ color: data.currentDelta >= 0 ? "#2d5a3d" : "#7a3010" }}
          >
            {sign}{pct}%
          </div>
        </div>
      </header>

      <p className="text-[12px] text-ink leading-relaxed mb-4">{data.takeaway}</p>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Historia 1980 → 2024 */}
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-ink-mute mb-1">
            Mitä tapahtui 1980 → 2024
            <span className="ml-2 text-ink-faint normal-case tracking-normal">
              indeksi 100 = tarvetaso 1980
            </span>
          </h4>
          <HistoryChart data={data} />
          <Legend
            items={[
              { c: "#2d5a3d", l: "Toteutunut panostus" },
              { c: "#7a3010", l: "Tarvetaso", dashed: true },
              { c: "rgba(45,90,61,0.25)", l: "Ylijäämä" },
              { c: "rgba(122,48,16,0.25)", l: "Vajaus" },
            ]}
          />
        </div>

        {/* ROI */}
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-ink-mute mb-1">
            Korjausinvestoinnin paluukäyrä
            <span className="ml-2 text-ink-faint normal-case tracking-normal">
              lisäkulu nyt → säästö myöhemmin
            </span>
          </h4>
          {roi ? (
            <>
              <RoiChart roi={roi} />
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Stat lbl="Shokkikerroin" val={roi.fx.shockMult.toFixed(1)} unit="×" />
                <Stat lbl="Vaikutusaika" val={String(roi.fx.payoffYears)} unit="v" />
                <Stat lbl="Takaisinmaksu" val={roi.payback != null ? String(roi.payback) : "—"} unit="v" />
              </div>
            </>
          ) : (
            <div className="border border-ink/10 rounded p-4 text-center text-[12px] text-ink-mute">
              Ei vajausta — ryhmä on saanut tarvetasoa vastaavasti tai enemmän.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const W = 360, H = 180;
const M = { t: 14, r: 14, b: 22, l: 36 };
const iw = W - M.l - M.r;
const ih = H - M.t - M.b;

function HistoryChart({ data }: { data: ReturnType<typeof getDecadeData> }) {
  const all = [...data.actual, ...data.need];
  const yMin = Math.floor(Math.min(...all) / 10) * 10;
  const yMax = Math.ceil(Math.max(...all) / 10) * 10;
  const xs = DECADE_YEARS.map((_, i) => (i / (DECADE_YEARS.length - 1)) * iw);
  const yScale = (v: number) => ih - ((v - yMin) / (yMax - yMin)) * ih;

  // Polut
  const actualPath = data.actual.map((v, i) => `${i === 0 ? "M" : "L"}${xs[i]},${yScale(v)}`).join(" ");
  const needPath = data.need.map((v, i) => `${i === 0 ? "M" : "L"}${xs[i]},${yScale(v)}`).join(" ");
  // Vajaus/ylijäämä-täyttöalue actualin ja needin välissä
  const gapPath = (() => {
    const top = data.actual.map((v, i) => `${i === 0 ? "M" : "L"}${xs[i]},${yScale(v)}`).join(" ");
    const bottom = data.need.slice().reverse().map((v, i) => {
      const idx = data.need.length - 1 - i;
      return `L${xs[idx]},${yScale(v)}`;
    }).join(" ");
    return `${top} ${bottom} Z`;
  })();

  const gridLines = [yMin, Math.round((yMin + yMax) / 2), yMax];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-paper-deep/30 rounded">
      <g transform={`translate(${M.l},${M.t})`}>
        {/* Y-grid */}
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={0} x2={iw} y1={yScale(g)} y2={yScale(g)} stroke="rgba(0,0,0,0.06)" />
            <text x={-6} y={yScale(g) + 3} fontSize={8} textAnchor="end"
              fontFamily="IBM Plex Mono, monospace" fill="var(--ink-mute)">{g}</text>
          </g>
        ))}
        {/* Vaja/ylijäämä */}
        <path d={gapPath} fill={data.currentDelta >= 0 ? "rgba(45,90,61,0.18)" : "rgba(122,48,16,0.18)"} />
        {/* Linjat */}
        <path d={needPath} fill="none" stroke="#7a3010" strokeWidth={1.6} strokeDasharray="4 3" />
        <path d={actualPath} fill="none" stroke="#2d5a3d" strokeWidth={2} />
        {/* Pisteet */}
        {data.actual.map((v, i) => (
          <circle key={`a${i}`} cx={xs[i]} cy={yScale(v)} r={3} fill="#2d5a3d" />
        ))}
        {data.need.map((v, i) => (
          <circle key={`n${i}`} cx={xs[i]} cy={yScale(v)} r={2.5} fill="#7a3010" fillOpacity={0.7} />
        ))}
        {/* X-akseli */}
        {DECADE_YEARS.map((y, i) => (
          <text key={y} x={xs[i]} y={ih + 14} fontSize={8} textAnchor="middle"
            fontFamily="IBM Plex Mono, monospace" fill="var(--ink-mute)">{y}</text>
        ))}
      </g>
    </svg>
  );
}

function RoiChart({ roi }: { roi: NonNullable<ReturnType<typeof computeRoi>> }) {
  const x = (t: number) => (t / roi.N) * iw;
  const ys = roi.series.map((p) => p.annual);
  const yMin = Math.min(0, ...ys);
  const yMax = Math.max(0, ...ys);
  const pad = (yMax - yMin) * 0.15 || 1;
  const yLo = yMin - pad, yHi = yMax + pad;
  const yScale = (v: number) => ih - ((v - yLo) / (yHi - yLo)) * ih;
  const y0 = yScale(0);

  // Alueet — positiivinen (kulu) ja negatiivinen (säästö)
  const buildArea = (filterFn: (v: number) => number) => {
    const top = roi.series.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t)},${yScale(filterFn(p.annual))}`).join(" ");
    return `${top} L${x(roi.N)},${y0} L0,${y0} Z`;
  };
  const areaPos = buildArea((v) => Math.max(0, v));
  const areaNeg = buildArea((v) => Math.min(0, v));
  const linePath = roi.series.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t)},${yScale(p.annual)}`).join(" ");

  const xt = [0, roi.fx.shockYears, Math.round(roi.N / 2), roi.N];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-paper-deep/30 rounded">
      <g transform={`translate(${M.l},${M.t})`}>
        <line x1={0} x2={iw} y1={y0} y2={y0} stroke="rgba(0,0,0,0.4)" strokeDasharray="2 3" />
        <path d={areaPos} fill="rgba(122,48,16,0.25)" />
        <path d={areaNeg} fill="rgba(45,90,61,0.25)" />
        <path d={linePath} fill="none" stroke="var(--ink)" strokeWidth={1.6} />
        {roi.payback != null && (
          <g>
            <line x1={x(roi.payback)} x2={x(roi.payback)} y1={0} y2={ih}
              stroke="#2d5a3d" strokeWidth={1.2} strokeDasharray="3 3" />
            <text x={x(roi.payback) + 3} y={10} fontSize={8}
              fontFamily="IBM Plex Mono, monospace" fill="#2d5a3d">
              takaisinmaksu v.{roi.payback}
            </text>
          </g>
        )}
        {xt.map((t) => (
          <text key={t} x={x(t)} y={ih + 14} fontSize={8} textAnchor="middle"
            fontFamily="IBM Plex Mono, monospace" fill="var(--ink-mute)">v{t}</text>
        ))}
        <text x={-4} y={y0 + 3} fontSize={8} textAnchor="end"
          fontFamily="IBM Plex Mono, monospace" fill="var(--ink-mute)">0</text>
        <text x={-4} y={10} fontSize={8} textAnchor="end"
          fontFamily="IBM Plex Mono, monospace" fill="var(--ink-mute)">+kulu</text>
        <text x={-4} y={ih - 2} fontSize={8} textAnchor="end"
          fontFamily="IBM Plex Mono, monospace" fill="var(--ink-mute)">−säästö</text>
      </g>
    </svg>
  );
}

const Stat = ({ lbl, val, unit }: { lbl: string; val: string; unit?: string }) => (
  <div className="border border-ink/10 rounded p-2 text-center">
    <div className="font-mono text-[9px] uppercase tracking-wider text-ink-faint">{lbl}</div>
    <div className="font-serif text-lg text-ink">
      {val}{unit && <span className="text-[10px] text-ink-mute ml-0.5">{unit}</span>}
    </div>
  </div>
);

const Legend = ({ items }: { items: { c: string; l: string; dashed?: boolean }[] }) => (
  <div className="flex flex-wrap gap-3 mt-1.5 text-[10px] font-mono text-ink-mute">
    {items.map((it) => (
      <span key={it.l} className="flex items-center gap-1.5">
        <span
          className="w-3 h-1 rounded-sm"
          style={{
            background: it.dashed ? "transparent" : it.c,
            borderTop: it.dashed ? `2px dashed ${it.c}` : undefined,
          }}
        />
        {it.l}
      </span>
    ))}
  </div>
);

const areaLabel = (k: string) =>
  ({ kaupunki: "Kaupunki", taajama: "Taajama", maaseutu: "Maaseutu" }[k] || k);
