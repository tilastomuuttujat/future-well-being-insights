import { useMemo } from "react";
import {
  LINKS, PHENOMENA, PHENOM_LINKS, DRIVERS, CONF_META,
  simulate, timeFactor,
  type PhenomKey, type Conf,
} from "./data";

interface Props {
  vars: Record<string, number>;
  phenom: Record<PhenomKey, number>;
  t: number;
  selected?: { kind: "phenom" | "driver"; id: string } | null;
  onSelect?: (sel: { kind: "phenom" | "driver"; id: string } | null) => void;
}

const W = 720, H = 480;
const CX = W / 2, CY = H / 2;
const PHENOM_R = 130;
const DRIVER_R = 215;

export const PhenomNetwork = ({ vars, phenom, t, selected, onSelect }: Props) => {
  const phenKeys = Object.keys(PHENOMENA) as PhenomKey[];
  const driverKeys = Object.keys(DRIVERS);

  const phenPos = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    phenKeys.forEach((k, i) => {
      const a = (i / phenKeys.length) * Math.PI * 2 - Math.PI / 2;
      map[k] = { x: CX + Math.cos(a) * PHENOM_R, y: CY + Math.sin(a) * PHENOM_R };
    });
    return map;
  }, [phenKeys]);

  const driverPos = useMemo(() => {
    const map: Record<string, { x: number; y: number; angle: number }> = {};
    driverKeys.forEach((k, i) => {
      const a = (i / driverKeys.length) * Math.PI * 2 - Math.PI / 2;
      map[k] = { x: CX + Math.cos(a) * DRIVER_R, y: CY + Math.sin(a) * DRIVER_R, angle: a };
    });
    return map;
  }, [driverKeys]);

  // Trajektoriot ilmiöille t=0..12 nykyisillä driver-arvoilla
  const trajectories = useMemo(() => {
    const horizon = 12;
    const tr: Record<PhenomKey, number[]> = {} as Record<PhenomKey, number[]>;
    phenKeys.forEach((k) => (tr[k] = []));
    for (let i = 0; i <= horizon; i++) {
      const snap = simulate(vars, i);
      phenKeys.forEach((k) => tr[k].push(snap[k]));
    }
    return tr;
  }, [vars, phenKeys]);

  const isFocus = (kind: "phenom" | "driver", id: string) =>
    selected?.kind === kind && selected.id === id;
  const anyFocus = !!selected;

  const linkInFocus = (l: { from: string; to: string }) =>
    !anyFocus || (selected!.kind === "driver" && l.from === selected!.id) ||
    (selected!.kind === "phenom" && (l.to === selected!.id || l.from === selected!.id));

  const confColor = (c: Conf) => CONF_META[c].color;

  // Driver-aktivaatio: kuinka paljon driver poikkeaa basesta normalisoituna
  const driverDelta = (id: string) => {
    const d = DRIVERS[id];
    if (!d) return 0;
    return ((vars[id] ?? d.base) - d.base) / (d.max - d.min);
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Ilmiöverkko">
      <defs>
        <radialGradient id="phenomFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--paper))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--paper-deep))" stopOpacity="1" />
        </radialGradient>
        <style>{`
          @keyframes flow { to { stroke-dashoffset: -24; } }
          .flow-active { animation: flow 1.2s linear infinite; }
          .flow-active.fast { animation-duration: 0.6s; }
          .node-trans { transition: r 240ms ease, stroke-width 240ms ease; }
          .node-text-trans { transition: fill 240ms ease; }
        `}</style>
      </defs>

      {/* Driver → phenom links */}
      {LINKS.map((l, i) => {
        const a = driverPos[l.from], b = phenPos[l.to];
        if (!a || !b) return null;
        const focus = linkInFocus(l);
        const dDelta = driverDelta(l.from);
        const tf = timeFactor(l.lag, t);
        const intensity = Math.abs(dDelta) * Math.abs(l.weight) * tf;
        const active = intensity > 0.005;
        const fast = intensity > 0.04;
        const dir = Math.sign(dDelta * l.weight); // +1 = vahvistaa ilmiötä, -1 = laskee
        // dash flows from driver to phenom; we vary length by weight
        const dashLen = Math.max(4, Math.abs(l.weight) * 18);
        return (
          <line
            key={`d-${i}`}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={active ? (dir > 0 ? "var(--fn-vahvistava)" : "var(--fn-korjaava)") : confColor(l.conf)}
            strokeWidth={Math.max(0.6, Math.abs(l.weight) * (active ? 6 + intensity * 30 : 4))}
            strokeOpacity={focus ? (active ? 0.9 : 0.45) : (active ? 0.55 : 0.12)}
            strokeDasharray={active ? `${dashLen} ${Math.max(4, dashLen * 0.6)}` :
              l.conf === "spec" ? "3 3" : l.conf === "lit" ? "6 3" : undefined}
            className={active ? `flow-active${fast ? " fast" : ""}` : undefined}
            style={{ transition: "stroke 200ms ease, stroke-width 200ms ease, stroke-opacity 200ms ease" }}
          />
        );
      })}

      {/* Phenom → phenom (chain) */}
      {PHENOM_LINKS.map((l, i) => {
        const a = phenPos[l.from], b = phenPos[l.to];
        const focus = linkInFocus(l);
        const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.18;
        const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.18;
        const fromDelta = (phenom[l.from] - PHENOMENA[l.from].base) / Math.abs(PHENOMENA[l.from].base);
        const intensity = Math.abs(fromDelta * l.weight);
        const active = intensity > 0.01;
        return (
          <path
            key={`p-${i}`}
            d={`M${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
            fill="none"
            stroke="#7a4a8a"
            strokeWidth={Math.max(0.6, Math.abs(l.weight) * (active ? 5 : 3))}
            strokeDasharray={active ? "6 4" : "2 4"}
            strokeOpacity={focus ? (active ? 0.75 : 0.35) : (active ? 0.4 : 0.12)}
            className={active ? "flow-active" : undefined}
            style={{ transition: "stroke-opacity 200ms ease" }}
          />
        );
      })}

      {/* Drivers — siirtyvät poikkeaman mukaan radiaalisesti ulospäin */}
      {driverKeys.map((k) => {
        const p = driverPos[k];
        const d = DRIVERS[k];
        const v = vars[k] ?? d.base;
        const delta = driverDelta(k);
        const offset = delta * 18; // px ulos/sisään
        const x = p.x + Math.cos(p.angle) * offset;
        const y = p.y + Math.sin(p.angle) * offset;
        const focus = isFocus("driver", k);
        const changed = Math.abs(delta) > 1e-3;
        // Tekstin sijoitus: ulkokehällä radiaalisesti ulos
        const tx = x + Math.cos(p.angle) * 14;
        const ty = y + Math.sin(p.angle) * 14;
        const anchor = Math.cos(p.angle) > 0.3 ? "start" : Math.cos(p.angle) < -0.3 ? "end" : "middle";
        return (
          <g key={k} style={{ cursor: "pointer", transition: "transform 250ms ease" }}
             transform={`translate(${x},${y})`}
             onClick={() => onSelect?.(focus ? null : { kind: "driver", id: k })}>
            <circle r={focus ? 8 : changed ? 6 : 4}
              className="node-trans"
              fill={changed ? "var(--gold)" : "hsl(var(--paper))"}
              stroke="var(--ink)" strokeWidth={focus ? 1.5 : 0.8} />
            {changed && (
              <circle r={focus ? 8 : 6} fill="none"
                stroke="var(--gold)" strokeWidth={0.8} strokeOpacity={0.4}
                style={{
                  transformOrigin: "center",
                  animation: "pulse 1.6s ease-out infinite",
                }} />
            )}
            <text x={tx - x} y={ty - y + 3} textAnchor={anchor as "start" | "end" | "middle"}
              className="font-mono"
              fontSize={9}
              fill={changed ? "var(--gold)" : "var(--ink-mute)"}
              style={{ pointerEvents: "none" }}>
              {d.label.length > 16 ? d.label.slice(0, 14) + "…" : d.label}
            </text>
            {changed && (
              <text x={tx - x} y={ty - y + 14} textAnchor={anchor as "start" | "end" | "middle"}
                className="font-mono" fontSize={8} fill="var(--gold)"
                style={{ pointerEvents: "none" }}>
                {d.fmt(v)}
              </text>
            )}
          </g>
        );
      })}

      {/* Phenomena */}
      {phenKeys.map((k) => {
        const p = phenPos[k];
        const ph = PHENOMENA[k];
        const v = phenom[k];
        const dPct = ((v - ph.base) / ph.base) * 100;
        const critical = Math.abs(dPct) > 15;
        const beneficial = (dPct > 0 ? 1 : -1) === ph.good;
        const focus = isFocus("phenom", k);
        const tr = trajectories[k];

        // Sparkline path (in phenom node)
        const sparkW = 38, sparkH = 14;
        const sparkX = -sparkW / 2;
        const sparkY = 14;
        const min = Math.min(...tr, ph.base);
        const max = Math.max(...tr, ph.base);
        const range = Math.max(max - min, Math.abs(ph.base) * 0.001);
        const sparkPath = tr.map((val, i) => {
          const x = sparkX + (i / (tr.length - 1)) * sparkW;
          const y = sparkY + sparkH - ((val - min) / range) * sparkH;
          return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
        }).join(" ");
        // Baseline marker
        const baseY = sparkY + sparkH - ((ph.base - min) / range) * sparkH;
        // Current t marker on sparkline
        const tIdx = Math.min(tr.length - 1, Math.max(0, t));
        const tX = sparkX + (tIdx / (tr.length - 1)) * sparkW;
        const tY = sparkY + sparkH - ((tr[tIdx] - min) / range) * sparkH;

        const accent = beneficial ? "var(--fn-vahvistava)" : "var(--fn-korjaava)";

        return (
          <g key={k} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }}
             onClick={() => onSelect?.(focus ? null : { kind: "phenom", id: k })}>
            <circle r={focus ? 38 : 34}
              className="node-trans"
              fill="url(#phenomFill)"
              stroke={critical ? accent : "var(--ink)"}
              strokeWidth={critical ? 2.5 : 1}
              strokeOpacity={focus ? 1 : critical ? 0.9 : 0.55} />
            {/* Pressure ring — paksuus = |dPct| */}
            {Math.abs(dPct) > 1 && (
              <circle r={focus ? 38 : 34} fill="none"
                stroke={accent}
                strokeWidth={Math.min(4, Math.abs(dPct) / 6)}
                strokeOpacity={0.18}
                strokeDasharray={`${Math.min(220, Math.abs(dPct) * 4)} 999`}
                transform="rotate(-90)" />
            )}
            <text y={-14} textAnchor="middle" fontSize={9} className="font-mono" fill="var(--ink-mute)"
              style={{ pointerEvents: "none" }}>
              {ph.short}
            </text>
            <text y={2} textAnchor="middle" fontSize={13} fontWeight={600}
              className="node-text-trans"
              fill={critical ? accent : "var(--ink)"}
              style={{ pointerEvents: "none" }}>
              {v.toFixed(ph.base < 10 ? 2 : 1)}
            </text>
            {/* Sparkline */}
            <line x1={sparkX} y1={baseY} x2={sparkX + sparkW} y2={baseY}
              stroke="var(--ink-faint)" strokeWidth={0.4} strokeDasharray="1 2" />
            <path d={sparkPath} fill="none" stroke={accent} strokeWidth={1.2} strokeOpacity={0.8} />
            <circle cx={tX} cy={tY} r={1.8} fill={accent} />
            {Math.abs(dPct) > 0.5 && (
              <text y={36} textAnchor="middle" fontSize={9} className="font-mono"
                fill={accent}
                style={{ pointerEvents: "none" }}>
                {dPct > 0 ? "+" : ""}{dPct.toFixed(1)}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
