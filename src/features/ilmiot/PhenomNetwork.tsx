import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
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
  width?: number;
  height?: number;
}

type NodeKind = "phenom" | "driver";
interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  kind: NodeKind;
  label: string;
  short?: string;
  base?: number;
  good?: 1 | -1;
}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  key: string;
  weight: number;
  lag?: number;
  conf: Conf | "chain";
  kind: "dp" | "pp";
}

const confColor = (c: Conf | "chain") =>
  c === "chain" ? "#7a4a8a" : CONF_META[c as Conf].color;

export const PhenomNetwork = ({
  vars, phenom, t, selected, onSelect,
  width = 1100, height = 620,
}: Props) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gRef = useRef<SVGGElement | null>(null);
  const phenKeys = useMemo(() => Object.keys(PHENOMENA) as PhenomKey[], []);
  const driverKeys = useMemo(() => Object.keys(DRIVERS), []);

  // Build nodes/links once (stable refs across renders)
  const { nodes, links } = useMemo(() => {
    const ns: SimNode[] = [
      ...phenKeys.map((k): SimNode => ({
        id: k, kind: "phenom",
        label: PHENOMENA[k].label, short: PHENOMENA[k].short,
        base: PHENOMENA[k].base, good: PHENOMENA[k].good,
      })),
      ...driverKeys.map((k): SimNode => ({
        id: k, kind: "driver", label: DRIVERS[k].label,
      })),
    ];
    const ls: SimLink[] = [
      ...LINKS.map((l, i): SimLink => ({
        key: `dp-${i}`, source: l.from, target: l.to,
        weight: l.weight, lag: l.lag, conf: l.conf, kind: "dp",
      })),
      ...PHENOM_LINKS.map((l, i): SimLink => ({
        key: `pp-${i}`, source: l.from, target: l.to,
        weight: l.weight, conf: "chain", kind: "pp",
      })),
    ];
    return { nodes: ns, links: ls };
  }, [phenKeys, driverKeys]);

  // Force simulation — runs once, nodes get x/y assigned
  const [, force] = useState(0);
  useEffect(() => {
    const cx = width / 2, cy = height / 2;
    // Seed: phenoms inner ring, drivers outer ring
    nodes.forEach((n) => {
      if (n.kind === "phenom") {
        const i = phenKeys.indexOf(n.id as PhenomKey);
        const a = (i / phenKeys.length) * Math.PI * 2 - Math.PI / 2;
        n.x = cx + Math.cos(a) * 160;
        n.y = cy + Math.sin(a) * 160;
      } else {
        const i = driverKeys.indexOf(n.id);
        const a = (i / driverKeys.length) * Math.PI * 2 - Math.PI / 2;
        n.x = cx + Math.cos(a) * 280;
        n.y = cy + Math.sin(a) * 280;
      }
    });
    const sim = d3.forceSimulation<SimNode, SimLink>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance((l) => (l.kind === "pp" ? 180 : 150))
        .strength((l) => (l.kind === "pp" ? 0.15 : 0.35 * Math.abs(l.weight))))
      .force("charge", d3.forceManyBody().strength((d) =>
        (d as SimNode).kind === "phenom" ? -680 : -180))
      .force("center", d3.forceCenter(cx, cy).strength(0.06))
      .force("collide", d3.forceCollide<SimNode>()
        .radius((d) => (d.kind === "phenom" ? 46 : 14)).strength(0.9))
      .force("radial-phen", d3.forceRadial<SimNode>(150, cx, cy)
        .strength((d) => (d.kind === "phenom" ? 0.25 : 0)))
      .force("radial-drv", d3.forceRadial<SimNode>(280, cx, cy)
        .strength((d) => (d.kind === "driver" ? 0.18 : 0)))
      .alpha(1).alphaDecay(0.04);

    sim.on("tick", () => force((x) => x + 1));
    return () => { sim.stop(); };
  }, [nodes, links, width, height, phenKeys, driverKeys]);

  // d3-zoom on the <g>
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .filter((event) => {
        // Ignore wheel without modifier so page can scroll, allow drag/pinch
        if (event.type === "wheel") return event.ctrlKey || event.metaKey;
        return !event.button;
      })
      .on("zoom", (e) => g.attr("transform", e.transform.toString()));
    svg.call(zoom);
    return () => { svg.on(".zoom", null); };
  }, []);

  // Trajectories for phenom sparklines
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

  // Driver activation 0..1
  const driverDelta = (id: string) => {
    const d = DRIVERS[id];
    if (!d) return 0;
    return ((vars[id] ?? d.base) - d.base) / (d.max - d.min);
  };

  const isFocus = (kind: NodeKind, id: string) =>
    selected?.kind === kind && selected.id === id;
  const anyFocus = !!selected;

  const linkInFocus = (l: SimLink) => {
    if (!anyFocus) return true;
    const s = (l.source as SimNode).id;
    const t2 = (l.target as SimNode).id;
    return s === selected!.id || t2 === selected!.id;
  };

  // animated particle phase (single rAF loop)
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000; last = now;
      setPhase((p) => (p + dt) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto block select-none"
      style={{ touchAction: "none", cursor: "grab" }}
      role="img" aria-label="Ilmiöverkko">
      <defs>
        <radialGradient id="phenomFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--paper))" />
          <stop offset="100%" stopColor="hsl(var(--paper-deep))" />
        </radialGradient>
      </defs>

      <g ref={gRef}>
        {/* LINKS */}
        {links.map((l) => {
          const s = l.source as SimNode, tn = l.target as SimNode;
          if (s.x == null || tn.x == null) return null;
          const focus = linkInFocus(l);

          let intensity = 0;
          let dir = 0;
          if (l.kind === "dp") {
            const dDelta = driverDelta(s.id);
            const tf = timeFactor(l.lag ?? 0, t);
            intensity = Math.abs(dDelta) * Math.abs(l.weight) * tf;
            dir = Math.sign(dDelta * l.weight);
          } else {
            const fromKey = s.id as PhenomKey;
            const fromDelta = (phenom[fromKey] - PHENOMENA[fromKey].base) / Math.abs(PHENOMENA[fromKey].base);
            intensity = Math.abs(fromDelta * l.weight);
            dir = Math.sign(fromDelta * l.weight);
          }
          const active = intensity > 0.005;
          const stroke = active
            ? (dir > 0 ? "var(--fn-vahvistava)" : "var(--fn-korjaava)")
            : confColor(l.conf);
          const sw = Math.max(0.6, Math.abs(l.weight) * (active ? 5 + intensity * 22 : 3.2));
          const op = focus ? (active ? 0.85 : 0.35) : (active ? 0.5 : 0.1);

          // Curved path for chain links, straight for dp
          const path = l.kind === "pp"
            ? `M${s.x} ${s.y} Q ${(s.x + tn.x) / 2 + (tn.y - s.y) * 0.18} ${(s.y + tn.y) / 2 - (tn.x - s.x) * 0.18} ${tn.x} ${tn.y}`
            : `M${s.x} ${s.y} L ${tn.x} ${tn.y}`;

          // Particle along the line for active dp links
          const particleCount = active ? Math.min(4, 1 + Math.floor(intensity * 30)) : 0;
          const dx = tn.x - s.x!, dy = tn.y - s.y!;

          return (
            <g key={l.key} style={{ pointerEvents: "none" }}>
              <path d={path} fill="none" stroke={stroke}
                strokeWidth={sw} strokeOpacity={op}
                strokeDasharray={
                  active ? undefined :
                  l.conf === "spec" ? "3 3" :
                  l.conf === "lit"  ? "6 3" :
                  l.kind === "pp"   ? "2 4" : undefined
                }
                style={{ transition: "stroke 250ms ease, stroke-opacity 250ms ease, stroke-width 250ms ease" }} />
              {l.kind === "dp" && active && Array.from({ length: particleCount }).map((_, i) => {
                const speed = 0.4 + intensity * 2.5; // faster when stronger
                const f = ((phase * speed + i / particleCount) % 1);
                // Reverse direction if corrective (dir<0) — virtaa lähteestä kohti tavoitetta aina,
                // mutta käytetään sykkivää muutosta kuvaamaan suuntaa värillä
                const px = s.x! + dx * f;
                const py = s.y! + dy * f;
                return (
                  <circle key={i} cx={px} cy={py} r={Math.min(3, 1.2 + intensity * 8)}
                    fill={stroke} opacity={op * 0.95} />
                );
              })}
            </g>
          );
        })}

        {/* DRIVERS */}
        {nodes.filter((n) => n.kind === "driver").map((n) => {
          if (n.x == null) return null;
          const d = DRIVERS[n.id];
          const v = vars[n.id] ?? d.base;
          const delta = driverDelta(n.id);
          const focus = isFocus("driver", n.id);
          const changed = Math.abs(delta) > 1e-3;
          const r = focus ? 9 : changed ? 6.5 : 4.2;
          // label outside, away from center
          const cx = width / 2, cy = height / 2;
          const ang = Math.atan2(n.y! - cy, n.x! - cx);
          const tx = Math.cos(ang) * 16, ty = Math.sin(ang) * 16;
          const anchor = Math.cos(ang) > 0.3 ? "start" : Math.cos(ang) < -0.3 ? "end" : "middle";
          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}
              style={{ cursor: "pointer", pointerEvents: "all" }}
              onClick={(e) => { e.stopPropagation(); onSelect?.(focus ? null : { kind: "driver", id: n.id }); }}>
              {changed && (
                <circle r={r + 4} fill="none" stroke="var(--gold)"
                  strokeWidth={0.9} strokeOpacity={0.35 + 0.25 * Math.sin(phase * Math.PI * 2)} />
              )}
              <circle r={r} fill={changed ? "var(--gold)" : "hsl(var(--paper))"}
                stroke="var(--ink)" strokeWidth={focus ? 1.5 : 0.8}
                style={{ transition: "r 200ms ease" }} />
              <text x={tx} y={ty + 3} textAnchor={anchor as "start" | "end" | "middle"}
                className="font-mono" fontSize={9.5}
                fill={changed ? "var(--gold)" : "var(--ink-mute)"}
                style={{ pointerEvents: "none" }}>
                {d.label.length > 18 ? d.label.slice(0, 16) + "…" : d.label}
              </text>
              {changed && (
                <text x={tx} y={ty + 14} textAnchor={anchor as "start" | "end" | "middle"}
                  className="font-mono" fontSize={8.5} fill="var(--gold)"
                  style={{ pointerEvents: "none" }}>
                  {d.fmt(v)}
                </text>
              )}
            </g>
          );
        })}

        {/* PHENOMS */}
        {nodes.filter((n) => n.kind === "phenom").map((n) => {
          if (n.x == null) return null;
          const k = n.id as PhenomKey;
          const ph = PHENOMENA[k];
          const v = phenom[k];
          const dPct = ((v - ph.base) / ph.base) * 100;
          const critical = Math.abs(dPct) > 15;
          const beneficial = (dPct > 0 ? 1 : -1) === ph.good;
          const focus = isFocus("phenom", k);
          const accent = beneficial ? "var(--fn-vahvistava)" : "var(--fn-korjaava)";
          const tr = trajectories[k];

          const sparkW = 50, sparkH = 16;
          const sparkX = -sparkW / 2, sparkY = 16;
          const min = Math.min(...tr, ph.base);
          const max = Math.max(...tr, ph.base);
          const range = Math.max(max - min, Math.abs(ph.base) * 0.001);
          const sparkPath = tr.map((val, i) => {
            const x = sparkX + (i / (tr.length - 1)) * sparkW;
            const y = sparkY + sparkH - ((val - min) / range) * sparkH;
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
          }).join(" ");
          const baseY = sparkY + sparkH - ((ph.base - min) / range) * sparkH;
          const tIdx = Math.min(tr.length - 1, Math.max(0, t));
          const tX = sparkX + (tIdx / (tr.length - 1)) * sparkW;
          const tY = sparkY + sparkH - ((tr[tIdx] - min) / range) * sparkH;

          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`}
              style={{ cursor: "pointer", pointerEvents: "all" }}
              onClick={(e) => { e.stopPropagation(); onSelect?.(focus ? null : { kind: "phenom", id: k }); }}>
              <circle r={focus ? 44 : 40} fill="url(#phenomFill)"
                stroke={critical ? accent : "var(--ink)"}
                strokeWidth={critical ? 2.5 : 1}
                strokeOpacity={focus ? 1 : critical ? 0.9 : 0.55}
                style={{ transition: "r 220ms ease" }} />
              {Math.abs(dPct) > 1 && (
                <circle r={focus ? 44 : 40} fill="none" stroke={accent}
                  strokeWidth={Math.min(5, Math.abs(dPct) / 5)}
                  strokeOpacity={0.22}
                  strokeDasharray={`${Math.min(260, Math.abs(dPct) * 5)} 999`}
                  transform="rotate(-90)" />
              )}
              <text y={-16} textAnchor="middle" fontSize={9.5} className="font-mono"
                fill="var(--ink-mute)" style={{ pointerEvents: "none" }}>
                {ph.short}
              </text>
              <text y={2} textAnchor="middle" fontSize={14} fontWeight={600}
                fill={critical ? accent : "var(--ink)"}
                style={{ pointerEvents: "none", transition: "fill 220ms ease" }}>
                {v.toFixed(ph.base < 10 ? 2 : 1)}
              </text>
              <line x1={sparkX} y1={baseY} x2={sparkX + sparkW} y2={baseY}
                stroke="var(--ink-faint)" strokeWidth={0.4} strokeDasharray="1 2" />
              <path d={sparkPath} fill="none" stroke={accent} strokeWidth={1.3} strokeOpacity={0.85} />
              <circle cx={tX} cy={tY} r={2} fill={accent} />
              {Math.abs(dPct) > 0.5 && (
                <text y={42} textAnchor="middle" fontSize={9.5} className="font-mono"
                  fill={accent} style={{ pointerEvents: "none" }}>
                  {dPct > 0 ? "+" : ""}{dPct.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
      </g>

      {/* zoom hint */}
      <text x={12} y={height - 10} fontSize={9} className="font-mono"
        fill="var(--ink-faint)" style={{ pointerEvents: "none" }}>
        vedä raahataksesi · ⌘/Ctrl + rulla zoomaa
      </text>
    </svg>
  );
};
