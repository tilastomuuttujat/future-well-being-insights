import { useEffect, useMemo, useRef, useState } from "react";
import {
  CX, CY, DRAG_A, ICONS, LENS_R, PALETTE, R_DISK, R_DOT_MIN, R_ICON, R_OUTER, VB, ZOOM,
} from "./constants";
import { PlacedPoint, RawPoint, buildSeeds, generateRaw, placePoints } from "./data";

type LensKey = "A" | "B";

interface Sel {
  A: PlacedPoint | null;
  B: PlacedPoint | null;
}

interface LensPos { x: number; y: number; }

interface Props {
  onSelect?: (sel: Sel) => void;
  /** Korostetut klusterit (profiilin perusteella). Tyhjä = ei korostusta. */
  highlight?: Set<string>;
  /** Antaa pääkomponentille pääsyn kaikkiin sijoiteltuihin pisteisiin. */
  onPointsReady?: (pts: PlacedPoint[]) => void;
}

/**
 * Kehänavigaattorin SVG-canvas — 1:1 portti naviga-10-2.html:n keskuskehästä.
 */
export function KehaCanvas({ onSelect, highlight, onPointsReady }: Props) {
  const raw = useMemo<RawPoint[]>(() => generateRaw(), []);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    raw.forEach((p) => { c[p.cid] = (c[p.cid] || 0) + 1; });
    return c;
  }, [raw]);
  const seeds = useMemo(() => buildSeeds(counts, PALETTE, { CX, CY, R_ICON }), [counts]);
  const pts = useMemo(() => placePoints(raw, { CX, CY, R_DOT_MIN, R_OUTER }), [raw]);

  const svgRef = useRef<SVGSVGElement>(null);
  const [lensPos, setLensPos] = useState<Record<LensKey, LensPos>>({
    A: { x: CX - 175, y: CY - 60 },
    B: { x: CX + 175, y: CY + 60 },
  });
  const [sel, setSel] = useState<Sel>({ A: null, B: null });
  const dragging = useRef<{ key: LensKey; offX: number; offY: number } | null>(null);

  // Lähin piste annetulle pisteelle.
  const nearest = (x: number, y: number): PlacedPoint | null => {
    let best: PlacedPoint | null = null;
    let bd = Infinity;
    for (const p of pts) {
      const d = Math.hypot(p.sx - x, p.sy - y);
      if (d < bd && d < 58) { bd = d; best = p; }
    }
    return best;
  };

  // Älykäs oletusvalinta käynnistyksessä.
  useEffect(() => {
    const matchPt = (re: RegExp, source?: "sector" | "indicator") =>
      pts.find((p) => (!source || p.d.source === source) && re.test(p.d.name));
    const aDef = matchPt(/yksinasuv|yksinas/i)
      || pts.find((p) => p.d.source === "indicator")
      || pts.find((p) => p.d.source === "sector");
    const bDef = matchPt(/yksinäis|loneli/i)
      || pts.find((p) => p !== aDef && p.d.source === "indicator")
      || pts.find((p) => p !== aDef);
    const next: Sel = { A: aDef ?? null, B: (bDef && bDef !== aDef ? bDef : null) ?? null };
    setSel(next);
    if (aDef) setLensPos((lp) => ({ ...lp, A: { x: aDef.sx, y: aDef.sy } }));
    if (bDef && bDef !== aDef) setLensPos((lp) => ({ ...lp, B: { x: bDef.sx, y: bDef.sy } }));
    onSelect?.(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ilmoita pisteet ulospäin (löydöslistaa varten).
  useEffect(() => { onPointsReady?.(pts); }, [pts, onPointsReady]);

  const isDim = (cid: string) => !!highlight && highlight.size > 0 && !highlight.has(cid);

  // SVG <-> client-koordinaattimuunnos.
  const toSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  const onPointerDown = (key: LensKey) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    const pt = toSvg(e.clientX, e.clientY);
    const cur = lensPos[key];
    dragging.current = { key, offX: pt.x - cur.x, offY: pt.y - cur.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const { key, offX, offY } = dragging.current;
    const pt = toSvg(e.clientX, e.clientY);
    let nx = pt.x - offX;
    let ny = pt.y - offY;
    const dx = nx - CX, dy = ny - CY, dist = Math.hypot(dx, dy);
    if (dist > R_OUTER - 5) {
      nx = CX + dx / dist * (R_OUTER - 5);
      ny = CY + dy / dist * (R_OUTER - 5);
    }
    setLensPos((lp) => ({ ...lp, [key]: { x: nx, y: ny } }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const { key } = dragging.current;
    dragging.current = null;
    const pos = lensPos[key];
    const snap = nearest(pos.x, pos.y);
    if (snap) {
      setLensPos((lp) => ({ ...lp, [key]: { x: snap.sx, y: snap.sy } }));
      const next = { ...sel, [key]: snap };
      setSel(next);
      onSelect?.(next);
    }
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const handleClickPoint = (p: PlacedPoint) => {
    const key: LensKey = !sel.A ? "A" : !sel.B ? "B" : "A";
    setLensPos((lp) => ({ ...lp, [key]: { x: p.sx, y: p.sy } }));
    const next = { ...sel, [key]: p };
    setSel(next);
    onSelect?.(next);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`${CX - VB / 2} ${CY - VB / 2} ${VB} ${VB}`}
      className="w-full h-auto select-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <defs>
        <clipPath id="keha-disk"><circle cx={CX} cy={CY} r={R_OUTER - 3} /></clipPath>
        <filter id="keha-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="18" floodColor="rgba(0,0,0,0.12)" />
        </filter>
        {seeds.map((s) => (
          <radialGradient key={s.cluster.id} id={`keha-sg-${s.cluster.id}`}
            cx={s.ix / 800} cy={s.iy / 800} r={0.55} gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor={s.col} stopOpacity={0.13} />
            <stop offset="65%"  stopColor={s.col} stopOpacity={0.04} />
            <stop offset="100%" stopColor={s.col} stopOpacity={0} />
          </radialGradient>
        ))}
        {seeds.map((s) => {
          const ARC_R = R_OUTER + 20;
          const halfSpan = s.span * 0.44;
          const a1 = s.midAngle - halfSpan;
          const a2 = s.midAngle + halfSpan;
          const bottom = Math.sin(s.midAngle) > 0.12;
          const sa = bottom ? a2 : a1;
          const ea = bottom ? a1 : a2;
          const x1 = CX + ARC_R * Math.cos(sa), y1 = CY + ARC_R * Math.sin(sa);
          const x2 = CX + ARC_R * Math.cos(ea), y2 = CY + ARC_R * Math.sin(ea);
          const sweep = bottom ? 0 : 1;
          return (
            <path key={`arc-${s.cluster.id}`} id={`keha-arc-${s.cluster.id}`}
              d={`M${x1},${y1} A${ARC_R},${ARC_R} 0 0,${sweep} ${x2},${y2}`} fill="none" />
          );
        })}
        <clipPath id="keha-lcA"><circle r={LENS_R} /></clipPath>
        <clipPath id="keha-lcB"><circle r={LENS_R} /></clipPath>
      </defs>

      {/* Pohjalevy + varjo */}
      <circle cx={CX} cy={CY} r={R_DISK} fill="#f7f4ee" filter="url(#keha-shadow)" />

      <g clipPath="url(#keha-disk)">
        {/* Taustasäteily */}
        {seeds.map((s) => (
          <circle key={`bg-${s.cluster.id}`} cx={s.ix} cy={s.iy}
            r={Math.min(150, 30 + s.n * 2.5)} fill={`url(#keha-sg-${s.cluster.id})`} />
        ))}
        {/* Säteet ikonista ulkokehälle */}
        {seeds.map((s) => {
          const rx1 = CX + (R_ICON + 24) * Math.cos(s.midAngle);
          const ry1 = CY + (R_ICON + 24) * Math.sin(s.midAngle);
          const rx2 = CX + (R_OUTER - 8) * Math.cos(s.midAngle);
          const ry2 = CY + (R_OUTER - 8) * Math.sin(s.midAngle);
          return (
            <line key={`ray-${s.cluster.id}`} x1={rx1} y1={ry1} x2={rx2} y2={ry2}
              stroke={s.col} strokeOpacity={0.08} strokeWidth={1} strokeDasharray="2 6" />
          );
        })}
        {/* Pisteet */}
        {pts.map((p) => {
          const isSec = p.d.source === "sector";
          const col = isSec ? "#2d5a3d" : "#7a3010";
          const isSelA = sel.A?.d.id === p.d.id;
          const isSelB = sel.B?.d.id === p.d.id;
          const r = (isSelA || isSelB) ? (isSec ? 7 : 5.5) : (isSec ? 4.8 : 3.0);
          const dim = isDim(p.d.cid);
          return (
            <circle key={p.d.id} cx={p.sx} cy={p.sy} r={r} fill={col}
              fillOpacity={dim ? 0.18 : 0.82}
              stroke={isSelA ? "#2d5a3d" : isSelB ? "#7a3010" : "rgba(255,255,255,0.6)"}
              strokeWidth={(isSelA || isSelB) ? 2 : 0.7}
              style={{ cursor: "pointer" }}
              onClick={() => handleClickPoint(p)} />
          );
        })}
      </g>

      {/* Ulkokehä */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={1} />
      {/* Ikonirenkaan vihje */}
      <circle cx={CX} cy={CY} r={R_ICON + 22} fill="none" stroke="rgba(0,0,0,0.06)"
        strokeDasharray="2 8" strokeWidth={1} />

      {/* Klusterien nimet kaarella */}
      <g>
        {seeds.map((s) => (
          <text key={`name-${s.cluster.id}`} fontSize={10}
            fontFamily="IBM Plex Sans, sans-serif" fontWeight={600}
            fill={s.col} fillOpacity={0.88} letterSpacing="0.03em">
            <textPath href={`#keha-arc-${s.cluster.id}`} startOffset="50%" textAnchor="middle">
              {s.cluster.name}
            </textPath>
          </text>
        ))}
      </g>

      {/* Ikonirengas */}
      <g>
        <circle cx={CX} cy={CY} r={R_ICON + 18} fill="rgba(255,254,248,0.55)"
          stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R_ICON - 18} fill="rgba(255,254,248,0.40)"
          stroke="rgba(0,0,0,0.04)" strokeWidth={1} />
        {seeds.map((s) => {
          const sc = 18 / 20;
          const dim = isDim(s.cluster.id);
          const op = dim ? 0.25 : 1;
          return (
            <g key={`icon-${s.cluster.id}`} opacity={op}>
              <circle cx={s.ix} cy={s.iy} r={16} fill="rgba(255,254,248,0.92)"
                stroke={s.col} strokeOpacity={0.25} strokeWidth={1} />
              <path d={ICONS[s.cluster.id] || ICONS.hallinto}
                transform={`translate(${s.ix - 9},${s.iy - 9}) scale(${sc})`}
                fill="none" stroke={s.col} strokeWidth={1.6 / sc}
                strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.85} />
            </g>
          );
        })}
      </g>

      {/* Linssit */}
      {(["A", "B"] as LensKey[]).map((key) => {
        const col = key === "A" ? "#2d5a3d" : "#7a3010";
        const pos = lensPos[key];
        const hx1 = Math.cos(DRAG_A) * LENS_R, hy1 = Math.sin(DRAG_A) * LENS_R;
        const hx2 = Math.cos(DRAG_A) * (LENS_R + 22), hy2 = Math.sin(DRAG_A) * (LENS_R + 22);
        return (
          <g key={`lens-${key}`} transform={`translate(${pos.x},${pos.y})`}
             style={{ cursor: "grab" }}
             onPointerDown={onPointerDown(key)}>
            <g clipPath={`url(#keha-lc${key})`}>
              <circle r={LENS_R} fill="#faf8f2" fillOpacity={0.97} />
              {pts.map((p) => {
                const dx = (p.sx - pos.x) * ZOOM, dy = (p.sy - pos.y) * ZOOM;
                if (Math.hypot(dx, dy) > LENS_R * 1.55) return null;
                const isSec = p.d.source === "sector";
                const c = isSec ? "#2d5a3d" : "#7a3010";
                return (
                  <g key={`l${key}-${p.d.id}`}>
                    <circle cx={dx} cy={dy} r={isSec ? 5.5 : 3.8} fill={c} fillOpacity={0.88}
                      stroke="rgba(255,255,255,0.55)" strokeWidth={0.7} />
                    <text x={dx + 8} y={dy + 4} fontSize={9}
                      fontFamily="IBM Plex Sans, sans-serif" fill="#1c1810">
                      {p.d.name.slice(0, 22)}
                    </text>
                  </g>
                );
              })}
            </g>
            <circle r={LENS_R} fill="none" stroke={col} strokeWidth={1.8} />
            <text x={0} y={-LENS_R - 7} textAnchor="middle" fontSize={8}
              fontFamily="IBM Plex Mono, monospace" fontWeight={600}
              fill={col} letterSpacing=".1em">{key}</text>
            <line x1={hx1} y1={hy1} x2={hx2} y2={hy2}
              stroke="#8c7a6a" strokeWidth={2.8} strokeLinecap="round" />
            <circle cx={hx2} cy={hy2} r={9} fill="#d4c5b0" stroke="#5a4a3a" strokeWidth={1} />
          </g>
        );
      })}
    </svg>
  );
}
