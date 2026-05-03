import { useEffect, useMemo, useRef } from "react";
import { useNavStore } from "./store";
import {
  CLUSTERS,
  FN_COLOR,
  ROW_PX,
  TIME_YEAR,
  WAKES,
  YEAR_MAX,
  YEAR_MIN,
  clamp,
  findActiveWake,
  worldXToYear,
  yearToWorldX,
} from "./constants";

/**
 * NavigatorStage — SVG-pohjainen klusteri × aika × vanavesi -kartta.
 *
 * Erä 1: pan/zoom (drag + wheel + touch), klusteririvit, vanavesilinjat,
 * keskeltä nykyhetken risti, HUD oikeassa yläkulmassa, aikajana alhaalla.
 * Kulmanäkymät (tl/tr/bl/br) tulevat Erässä 2.
 */
export const NavigatorStage = () => {
  const ref = useRef<HTMLDivElement>(null);
  const cx = useNavStore((s) => s.cx);
  const cy = useNavStore((s) => s.cy);
  const w = useNavStore((s) => s.size.w);
  const h = useNavStore((s) => s.size.h);
  const setSize = useNavStore((s) => s.setSize);
  const panBy = useNavStore((s) => s.panBy);
  const setCenter = useNavStore((s) => s.setCenter);

  // Tarkkaile kontainerin kokoa
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      setSize(size, size);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [setSize]);

  // Pan: hiiri/sormi
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dragging = false;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      dragging = true; lx = e.clientX; ly = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      // Liike: vasemmalle vetäminen siirtää keskustaa oikealle (eteen ajassa)
      panBy(-dx, -dy * 0.5);
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      // Shift+wheel = pysty, muuten vaaka
      if (e.shiftKey) panBy(0, e.deltaY * 0.5);
      else panBy(e.deltaY * 0.6, 0);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [panBy]);

  const activeRow = clamp(Math.round(cy / ROW_PX), 0, CLUSTERS.length - 1);
  const activeCluster = CLUSTERS[activeRow];
  const activeYear = Math.round(worldXToYear(cx));
  const activeTime = useMemo(() => {
    let best = Infinity;
    let t: keyof typeof TIME_YEAR = "now";
    (Object.keys(TIME_YEAR) as (keyof typeof TIME_YEAR)[]).forEach((k) => {
      const d = Math.abs(activeYear - TIME_YEAR[k]);
      if (d < best) { best = d; t = k; }
    });
    return t;
  }, [activeYear]);
  const activeWake = useMemo(
    () => findActiveWake(activeCluster, activeYear),
    [activeCluster, activeYear],
  );

  // Kuvataso: maailmasta näytöksi (cx,cy on keskellä)
  const sw = w; // square stage
  const sh = h;
  const toScreenX = (worldX: number) => sw / 2 + (worldX - cx);
  const toScreenY = (worldY: number) => sh / 2 + (worldY - cy);

  // Aikajana — vuosi-ticit 5v välein, dekadit korostettu
  const xTicks: number[] = [];
  for (let y = YEAR_MIN; y <= YEAR_MAX; y += 5) xTicks.push(y);

  const fnColor = FN_COLOR[activeCluster.fn];

  return (
    <div
      ref={ref}
      className="relative w-full aspect-square select-none touch-none cursor-grab active:cursor-grabbing"
      style={{ background: "var(--paper-deep, #faf8f3)" }}
      role="application"
      aria-label="TTT-Navigaattori — vedä liikuttaaksesi karttaa"
    >
      {sw > 0 && (
        <svg width={sw} height={sh} className="absolute inset-0">
          {/* paperitausta-viivat */}
          <defs>
            <pattern id="paperGrid" width="22" height="44" patternUnits="userSpaceOnUse">
              <path d="M 0 44 L 22 44" stroke="rgba(26,29,36,0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width={sw} height={sh} fill="url(#paperGrid)" />

          {/* Vuosiristikko */}
          {xTicks.map((y) => {
            const x = toScreenX(yearToWorldX(y));
            if (x < -10 || x > sw + 10) return null;
            const isDecade = y % 10 === 0;
            return (
              <line
                key={y}
                x1={x} x2={x} y1={0} y2={sh}
                stroke={isDecade ? "rgba(26,29,36,0.12)" : "rgba(26,29,36,0.05)"}
                strokeWidth={isDecade ? 1 : 0.5}
              />
            );
          })}

          {/* Klusteririvit */}
          {CLUSTERS.map((c, i) => {
            const yWorld = i * ROW_PX;
            const yScreen = toScreenY(yWorld);
            if (yScreen < -ROW_PX || yScreen > sh + ROW_PX) return null;
            const active = i === activeRow;
            return (
              <g key={c.id}>
                <line
                  x1={0} x2={sw}
                  y1={yScreen} y2={yScreen}
                  stroke={active ? FN_COLOR[c.fn] : "rgba(26,29,36,0.08)"}
                  strokeWidth={active ? 1.4 : 0.6}
                  strokeDasharray={active ? undefined : "2 4"}
                />
                <text
                  x={12}
                  y={yScreen - 4}
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  fill={active ? FN_COLOR[c.fn] : "rgba(26,29,36,0.45)"}
                  style={{ pointerEvents: "none" }}
                >
                  {c.label}
                </text>
              </g>
            );
          })}

          {/* Vanavedet — kolme pistettä + viiva */}
          {WAKES.map((wk, idx) => {
            const rows = wk.clusters
              .map((cid) => CLUSTERS.findIndex((c) => c.id === cid))
              .filter((r) => r >= 0);
            if (rows.length < 3) return null;
            const yA = toScreenY(rows[0] * ROW_PX);
            const yB = toScreenY(rows[1] * ROW_PX);
            const yC = toScreenY(rows[2] * ROW_PX);
            const xA = toScreenX(yearToWorldX(wk.state));
            const xB = toScreenX(yearToWorldX(wk.cohort));
            const xC = toScreenX(yearToWorldX(wk.indiv));
            const isActive = activeWake?.theme === wk.theme;
            const stroke = isActive ? "var(--gold, #8a6510)" : "rgba(26,29,36,0.22)";
            return (
              <g key={idx} opacity={isActive ? 1 : 0.55}>
                <path
                  d={`M ${xA} ${yA} Q ${(xA + xB) / 2} ${(yA + yB) / 2 - 8} ${xB} ${yB} T ${xC} ${yC}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isActive ? 1.6 : 0.8}
                  strokeDasharray={isActive ? undefined : "3 4"}
                />
                {[ [xA,yA,"S"], [xB,yB,"K"], [xC,yC,"Y"] ].map(([x,y,t], i) => (
                  <g key={i}>
                    <circle cx={x as number} cy={y as number} r={isActive ? 4 : 3} fill="var(--paper, #f4f1ea)" stroke={stroke} />
                    <text x={x as number} y={(y as number) + 3} textAnchor="middle" fontSize={7} fontFamily="JetBrains Mono, monospace" fill={stroke}>{t}</text>
                  </g>
                ))}
              </g>
            );
          })}

          {/* YEAR_NOW -viiva */}
          {(() => {
            const x = toScreenX(yearToWorldX(2024));
            return (
              <line x1={x} x2={x} y1={0} y2={sh}
                stroke="var(--gold, #8a6510)" strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
            );
          })()}

          {/* Keskusristi (käyttäjän fokus) */}
          <g pointerEvents="none">
            <line x1={sw/2 - 16} x2={sw/2 + 16} y1={sh/2} y2={sh/2} stroke={fnColor} strokeWidth={1.2} />
            <line x1={sw/2} x2={sw/2} y1={sh/2 - 16} y2={sh/2 + 16} stroke={fnColor} strokeWidth={1.2} />
            <circle cx={sw/2} cy={sh/2} r={5} fill="none" stroke={fnColor} strokeWidth={1.4} />
          </g>
        </svg>
      )}

      {/* HUD oikeassa yläkulmassa */}
      <div className="absolute top-3 right-3 paper px-3 py-2 text-[11px] font-mono leading-relaxed pointer-events-none max-w-[260px]">
        <div className="flex items-center gap-2">
          <span style={{ background: fnColor }} className="inline-block w-2 h-2 rounded-full" />
          <span className="text-ink">{activeCluster.label}</span>
        </div>
        <div className="text-ink-mute">
          {activeYear} · {activeTime}
        </div>
        {activeWake && (
          <div className="text-gold mt-1 text-[10px]">≈ {activeWake.theme}</div>
        )}
      </div>

      {/* Vinkki */}
      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-ink-mute pointer-events-none">
        Vedä · vieritä = aika · shift+vieritä = klusterit
      </div>

      {/* Aikajana keskellä alhaalla */}
      <div className="absolute bottom-8 left-0 right-0 pointer-events-none">
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={activeYear}
          onChange={(e) => setCenter(yearToWorldX(parseInt(e.target.value)), cy)}
          className="w-2/3 mx-auto block pointer-events-auto accent-gold"
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
};
