import { useMemo } from "react";
import { LINKS, PHENOMENA, PHENOM_LINKS, DRIVERS, CONF_META, type PhenomKey, type Conf } from "./data";

interface Props {
  vars: Record<string, number>;
  phenom: Record<PhenomKey, number>;
  selected?: { kind: "phenom" | "driver"; id: string } | null;
  onSelect?: (sel: { kind: "phenom" | "driver"; id: string } | null) => void;
}

const W = 720, H = 460;
const CX = W / 2, CY = H / 2;
const PHENOM_R = 130;
const DRIVER_R = 210;

export const PhenomNetwork = ({ vars, phenom, selected, onSelect }: Props) => {
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
    const map: Record<string, { x: number; y: number }> = {};
    driverKeys.forEach((k, i) => {
      const a = (i / driverKeys.length) * Math.PI * 2 - Math.PI / 2;
      map[k] = { x: CX + Math.cos(a) * DRIVER_R, y: CY + Math.sin(a) * DRIVER_R };
    });
    return map;
  }, [driverKeys]);

  const isFocus = (kind: "phenom" | "driver", id: string) =>
    selected?.kind === kind && selected.id === id;
  const anyFocus = !!selected;
  const linkInFocus = (l: { from: string; to: string }) =>
    !anyFocus || (selected!.kind === "driver" && l.from === selected!.id) ||
    (selected!.kind === "phenom" && (l.to === selected!.id || l.from === selected!.id));

  const confColor = (c: Conf) => CONF_META[c].color;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Ilmiöverkko">
      {/* Driver → phenom links */}
      {LINKS.map((l, i) => {
        const a = driverPos[l.from], b = phenPos[l.to];
        if (!a || !b) return null;
        const focus = linkInFocus(l);
        return (
          <line
            key={`d-${i}`}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={confColor(l.conf)}
            strokeWidth={Math.max(0.6, Math.abs(l.weight) * 5)}
            strokeOpacity={focus ? 0.85 : 0.18}
            strokeDasharray={l.conf === "spec" ? "3 3" : l.conf === "lit" ? "6 3" : undefined}
          />
        );
      })}
      {/* Phenom → phenom (chain) */}
      {PHENOM_LINKS.map((l, i) => {
        const a = phenPos[l.from], b = phenPos[l.to];
        const focus = linkInFocus(l);
        const mx = (a.x + b.x) / 2 + (b.y - a.y) * 0.18;
        const my = (a.y + b.y) / 2 - (b.x - a.x) * 0.18;
        return (
          <path
            key={`p-${i}`}
            d={`M${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
            fill="none"
            stroke="#7a4a8a"
            strokeWidth={Math.max(0.6, Math.abs(l.weight) * 5)}
            strokeDasharray="2 4"
            strokeOpacity={focus ? 0.7 : 0.15}
          />
        );
      })}

      {/* Drivers (outer ring) */}
      {driverKeys.map((k) => {
        const p = driverPos[k];
        const d = DRIVERS[k];
        const v = vars[k] ?? d.base;
        const delta = v - d.base;
        const changed = Math.abs(delta) > 1e-6;
        const focus = isFocus("driver", k);
        return (
          <g key={k} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }}
             onClick={() => onSelect?.(focus ? null : { kind: "driver", id: k })}>
            <circle r={focus ? 9 : 6}
              fill={changed ? "var(--gold)" : "hsl(var(--paper))"}
              stroke="var(--ink)" strokeWidth={focus ? 1.5 : 0.8} />
            <text y={-12} textAnchor="middle"
              className="font-mono"
              fontSize={9}
              fill="var(--ink-mute)"
              style={{ pointerEvents: "none" }}>
              {d.label.length > 18 ? d.label.slice(0, 16) + "…" : d.label}
            </text>
          </g>
        );
      })}

      {/* Phenomena (inner ring) */}
      {phenKeys.map((k) => {
        const p = phenPos[k];
        const ph = PHENOMENA[k];
        const v = phenom[k];
        const dPct = ((v - ph.base) / ph.base) * 100;
        const critical = Math.abs(dPct) > 15;
        const beneficial = (dPct > 0 ? 1 : -1) === ph.good;
        const focus = isFocus("phenom", k);
        return (
          <g key={k} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }}
             onClick={() => onSelect?.(focus ? null : { kind: "phenom", id: k })}>
            <circle r={focus ? 32 : 28}
              fill="hsl(var(--paper))"
              stroke={critical ? (beneficial ? "var(--fn-vahvistava)" : "var(--fn-korjaava)") : "var(--ink)"}
              strokeWidth={critical ? 2.5 : 1} />
            <text y={-2} textAnchor="middle" fontSize={10} className="font-mono" fill="var(--ink-mute)"
              style={{ pointerEvents: "none" }}>
              {ph.short}
            </text>
            <text y={11} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--ink)"
              style={{ pointerEvents: "none" }}>
              {v.toFixed(ph.base < 10 ? 2 : 1)}
            </text>
            {Math.abs(dPct) > 0.5 && (
              <text y={26} textAnchor="middle" fontSize={9} className="font-mono"
                fill={beneficial ? "var(--fn-vahvistava)" : "var(--fn-korjaava)"}
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
