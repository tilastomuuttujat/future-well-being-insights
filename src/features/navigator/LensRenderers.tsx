// Linssikomponentit — natiivit React/SVG-portit navigaattori-8-2.html:n
// renderöintifunktioista (rivit 2948–3666). Kaikki käyttävät pseudoVal-dataa.
// Yhtenäinen viewBox 0 0 220 140 (paitsi vanavesi-br joka on 0 0 1400 360).
import {
  CLUSTERS,
  Cluster,
  CornerId,
  CORNER_ROLE,
  FN_COLOR,
  FN_LABEL,
  LEVEL_LABELS,
  Time,
  TIME_LABELS,
  Wake,
  YEAR_MAX,
  YEAR_MIN,
  YEAR_NOW,
  clamp,
  pseudoVal,
} from "./constants";

interface Ctx {
  cluster: Cluster;
  time: Time;
  year: number;
  wake: Wake | null;
}

const TRIPTYCH_DEF = {
  aika:         { vertices: ["Ennen", "Nyt", "Kaiku"],                    color: "#3a6b9a" },
  episteeminen: { vertices: ["Panos", "Empiria", "Teoria"],               color: "#8a6510" },
  funktio:      { vertices: ["Vahvistava", "Varautuminen", "Korjaava"],   color: "#2f6b46" },
  sukupolvi:    { vertices: ["Lapset", "Työikä", "Vanhukset"],            color: "#a04878" },
} as const;

type TripKind = keyof typeof TRIPTYCH_DEF;

const Wrap = ({
  vb = "0 0 220 140",
  children,
}: {
  vb?: string;
  children: React.ReactNode;
}) => (
  <svg viewBox={vb} preserveAspectRatio="xMidYMid meet" width="100%" height="100%">
    {children}
  </svg>
);

// ─── TRIPTYYKKI ───
export const Triptych = ({ kind, ctx }: { kind: TripKind; ctx: Ctx }) => {
  const { cluster, time } = ctx;
  const def = TRIPTYCH_DEF[kind];
  let values: number[];
  if (kind === "aika")
    values = (["past", "now", "future"] as Time[]).map((t) => pseudoVal(cluster.id, "aika:" + t));
  else if (kind === "funktio")
    values = ["vahvistava", "varautuminen", "korjaava"].map((p) => pseudoVal(cluster.id, "fn:" + p + ":" + time));
  else if (kind === "sukupolvi")
    values = ["lapset", "tyoika", "vanhukset"].map((g) => pseudoVal(cluster.id, "gen:" + g + ":" + time));
  else
    values = ["panos", "empiria", "teoria"].map((k) => pseudoVal(cluster.id, "epi:" + k + ":" + time));

  const W = 220, H = 140, cx = W / 2, cy = H / 2 + 4, R = 52;
  const corners: [number, number][] = [
    [cx, cy - R],
    [cx - R * Math.cos(Math.PI / 6), cy + R * Math.sin(Math.PI / 6)],
    [cx + R * Math.cos(Math.PI / 6), cy + R * Math.sin(Math.PI / 6)],
  ];
  const max = Math.max(...values, 1);
  const inner = values.map((v, i) => {
    const t = 0.15 + 0.85 * (v / max);
    return [cx + (corners[i][0] - cx) * t, cy + (corners[i][1] - cy) * t] as [number, number];
  });
  const labelPos: [number, number, "middle" | "start" | "end"][] = [
    [cx, cy - R - 6, "middle"],
    [cx - R * Math.cos(Math.PI / 6) - 4, cy + R * Math.sin(Math.PI / 6) + 14, "end"],
    [cx + R * Math.cos(Math.PI / 6) + 4, cy + R * Math.sin(Math.PI / 6) + 14, "start"],
  ];

  return (
    <Wrap>
      {[0.33, 0.66].map((t, i) => (
        <polygon
          key={i}
          points={corners.map((c) => `${cx + (c[0] - cx) * t},${cy + (c[1] - cy) * t}`).join(" ")}
          fill="none"
          stroke="rgba(26,29,36,0.08)"
          strokeWidth={0.6}
        />
      ))}
      <polygon points={corners.map((p) => p.join(",")).join(" ")} fill="none" stroke="rgba(26,29,36,0.25)" strokeWidth={1} />
      {corners.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(26,29,36,0.10)" strokeWidth={0.8} />
      ))}
      <polygon points={inner.map((p) => p.join(",")).join(" ")} fill={def.color} fillOpacity={0.25} stroke={def.color} strokeWidth={1.6} strokeLinejoin="round" />
      {inner.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={def.color} />
      ))}
      {def.vertices.map((lab, i) => (
        <text key={i} x={labelPos[i][0]} y={labelPos[i][1]} textAnchor={labelPos[i][2]} fontSize={10} fill="rgba(26,29,36,0.7)" fontWeight={500}>
          {lab}
        </text>
      ))}
      {values.map((v, i) => (
        <text key={i} x={inner[i][0]} y={inner[i][1] - 6} textAnchor="middle" fontSize={8} fill={def.color} fontFamily="JetBrains Mono, monospace" fontWeight={700}>
          {v}
        </text>
      ))}
    </Wrap>
  );
};

// ─── TRENDI ───
export const Trendi = ({ corner, ctx }: { corner: CornerId; ctx: Ctx }) => {
  const { cluster, year } = ctx;
  const W = 220, H = 140, pad = 14;
  const color = FN_COLOR[cluster.fn];
  const points: [number, number][] = [];
  for (let yr = YEAR_MIN; yr <= YEAR_MAX; yr += 5) {
    const key =
      corner === "tl" ? "trend:smooth:" + yr :
      corner === "tr" ? "tr:trend:" + yr :
      corner === "bl" ? "bl:trend:" + yr :
      "br:trend:" + yr;
    points.push([yr, pseudoVal(cluster.id, key)]);
  }
  const max = Math.max(...points.map((p) => p[1]));
  const min = Math.min(...points.map((p) => p[1]));
  const range = Math.max(1, max - min);
  const xy = points.map(
    ([yr, v]) =>
      [
        pad + ((yr - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - 2 * pad),
        H - pad - ((v - min) / range) * (H - 2 * pad),
      ] as [number, number],
  );

  let body: React.ReactNode = null;
  if (corner === "tl") {
    let d = `M ${xy[0][0]},${xy[0][1]}`;
    for (let i = 1; i < xy.length; i++) {
      const p0 = xy[i - 1], p1 = xy[i];
      const cx = (p0[0] + p1[0]) / 2;
      d += ` Q ${cx},${p0[1]} ${cx},${(p0[1] + p1[1]) / 2} T ${p1[0]},${p1[1]}`;
    }
    const area = `${d} L ${xy[xy.length - 1][0]},${H - pad} L ${xy[0][0]},${H - pad} Z`;
    const gradId = `tg-${cluster.id}-tl`;
    body = (
      <>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradId})`} />
        <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  } else if (corner === "tr") {
    const bw = (W - 2 * pad) / xy.length - 1;
    body = (
      <>
        {xy.map(([x, y], i) => (
          <rect key={i} x={x - bw / 2} y={y} width={bw} height={H - pad - y} fill={color} opacity={0.6} rx={1} />
        ))}
      </>
    );
  } else if (corner === "bl") {
    let d = `M ${xy[0][0]},${xy[0][1]}`;
    for (let i = 1; i < xy.length; i++) d += ` L ${xy[i][0]},${xy[i - 1][1]} L ${xy[i][0]},${xy[i][1]}`;
    body = (
      <>
        <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="miter" />
        {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.8} fill={color} />)}
      </>
    );
  } else {
    let d = `M ${xy[0][0]},${xy[0][1]}`;
    for (let i = 1; i < xy.length; i++) d += ` L ${xy[i][0]},${xy[i][1]}`;
    body = (
      <>
        <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 3" />
        {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.2} fill="none" stroke={color} strokeWidth={1.4} />)}
      </>
    );
  }

  const cursorX = pad + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - 2 * pad);
  return (
    <Wrap>
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="rgba(26,29,36,0.18)" />
      {body}
      {[1980, 2000, 2024, 2040].map((yr) => {
        const x = pad + ((yr - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - 2 * pad);
        return (
          <text key={yr} x={x} y={H - 2} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.5)" fontFamily="JetBrains Mono, monospace">
            {yr}
          </text>
        );
      })}
      <line x1={cursorX} x2={cursorX} y1={pad} y2={H - pad} stroke={color} strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
      <circle cx={cursorX} cy={pad + 8} r={3} fill={color} />
      <text x={cursorX} y={pad - 2} textAnchor="middle" fontSize={9} fill="#1a1d24" fontFamily="JetBrains Mono, monospace" fontWeight={700}>
        {year}
      </text>
    </Wrap>
  );
};

// ─── NUMERO ───
export const Numero = ({ corner, ctx }: { corner: CornerId; ctx: Ctx }) => {
  const { cluster, time, wake } = ctx;
  const color = FN_COLOR[cluster.fn];
  const W = 220, H = 140;
  let bigNum: string | number;
  let label: string;
  let sub: string;
  let unit = "";
  if (corner === "tl") {
    bigNum = pseudoVal(cluster.id, "tl:num:" + time);
    const prev = pseudoVal(cluster.id, "tl:num:past");
    label = `historia ↦ ${TIME_LABELS[time].toLowerCase()}`;
    sub = `Δ ${(bigNum as number) - prev >= 0 ? "+" : ""}${(bigNum as number) - prev} vs. 1990`;
  } else if (corner === "tr") {
    bigNum = pseudoVal(cluster.id, "tr:num:" + time);
    label = `näytön luotettavuus`;
    sub = `panos · empiria · teoria`;
    unit = "/100";
  } else if (corner === "bl") {
    const v = pseudoVal(cluster.id, "bl:num:" + time);
    bigNum = (v / 10).toFixed(1);
    unit = " %";
    label = `väestöosuus`;
    sub = `${LEVEL_LABELS[cluster.level]}-painotus`;
  } else {
    if (wake) {
      bigNum = wake.indiv - wake.state;
      unit = " v";
      label = `vanavesiviive`;
      sub = `${wake.state} → ${wake.indiv}`;
    } else {
      bigNum = pseudoVal(cluster.id, "br:num:" + time);
      label = `funktion paine`;
      sub = FN_LABEL[cluster.fn];
    }
  }
  const spark = (["past", "now", "future"] as Time[]).map((t) => pseudoVal(cluster.id, corner + ":num:" + t));
  const sx = [30, W / 2, W - 30];
  const sy = spark.map((v) => 115 - (v / 100) * 22);
  const sparkPath = `M${sx[0]},${sy[0]} Q${sx[1]},${sy[1] - 5} ${sx[2]},${sy[2]}`;

  return (
    <Wrap vb={`0 0 ${W} ${H}`}>
      <text x={W / 2} y={22} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.55)" fontFamily="JetBrains Mono, monospace" letterSpacing={1.5}>
        {label.toUpperCase()}
      </text>
      <text x={W / 2} y={62} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize={40} fontWeight={700} fill="#1a1d24" letterSpacing={-2}>
        {bigNum}
        <tspan fontSize={16} fill={color}>{unit}</tspan>
      </text>
      <text x={W / 2} y={80} textAnchor="middle" fontSize={9.5} fill="rgba(26,29,36,0.6)" fontFamily="JetBrains Mono, monospace">
        {sub}
      </text>
      <path d={sparkPath} fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
      {sx.map((x, i) => <circle key={i} cx={x} cy={sy[i]} r={2} fill={color} />)}
      {["ennen", "nyt", "tuleva"].map((t, i) => (
        <text key={t} x={sx[i]} y={132} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.5)" fontFamily="JetBrains Mono, monospace">{t}</text>
      ))}
    </Wrap>
  );
};

// ─── VERTAILU ───
export const Vertailu = ({ corner, ctx }: { corner: CornerId; ctx: Ctx }) => {
  const { cluster, time } = ctx;
  const W = 220, H = 140, pad = 18;
  const color = FN_COLOR[cluster.fn];
  let categories: [string, string][];
  let vals: number[];
  let activeIdx: number;
  if (corner === "tl") {
    categories = [["past", "Ennen"], ["now", "Nyt"], ["future", "Tuleva"]];
    vals = categories.map(([k]) => pseudoVal(cluster.id, "tl:vert:" + k));
    activeIdx = ["past", "now", "future"].indexOf(time);
  } else if (corner === "tr") {
    categories = [["panos", "Panos"], ["empiria", "Empiria"], ["teoria", "Teoria"]];
    vals = categories.map(([k]) => pseudoVal(cluster.id, "tr:vert:" + k + ":" + time));
    activeIdx = 1;
  } else if (corner === "bl") {
    categories = [["lapset", "Lapset"], ["tyoika", "Työikä"], ["vanhukset", "Vanhukset"]];
    vals = categories.map(([k]) => pseudoVal(cluster.id, "bl:vert:" + k + ":" + time));
    activeIdx = cluster.level === "individual"
      ? (cluster.id.includes("vanhus") || cluster.id === "elakkeet" ? 2 : 0)
      : cluster.level === "group" ? 1 : 1;
  } else {
    categories = [["vahvistava", "Vahvist."], ["varautuminen", "Varaut."], ["korjaava", "Korjaava"]];
    vals = categories.map(([k]) => pseudoVal(cluster.id, "br:vert:" + k + ":" + time));
    activeIdx = ["vahvistava", "varautuminen", "korjaava"].indexOf(cluster.fn);
  }
  const max = Math.max(...vals, 1);

  if (corner === "tl") {
    const bh = (H - 2 * pad) / vals.length - 8;
    return (
      <Wrap>
        {vals.map((v, i) => {
          const y = pad + i * (bh + 8);
          const bw = (v / max) * (W - 2 * pad - 60);
          const active = i === activeIdx;
          return (
            <g key={i}>
              <text x={pad} y={y + bh / 2 + 3} fontSize={9} fill={active ? "#1a1d24" : "rgba(26,29,36,0.6)"} fontWeight={active ? 600 : 500}>{categories[i][1]}</text>
              <rect x={pad + 50} y={y} width={bw} height={bh} rx={2} fill={color} opacity={active ? 0.95 : 0.4} />
              <text x={pad + 50 + bw + 4} y={y + bh / 2 + 3} fontSize={9} fill={active ? "#1a1d24" : "rgba(26,29,36,0.55)"} fontFamily="JetBrains Mono, monospace" fontWeight={active ? 700 : 500}>{v}</text>
            </g>
          );
        })}
      </Wrap>
    );
  }
  if (corner === "tr") {
    const total = vals.reduce((a, b) => a + b, 0);
    const colors = ["#8a6510", "#3a6b9a", "#a04878"];
    let xAcc = pad;
    const barH = 24, barY = H / 2 - barH / 2 - 10;
    return (
      <Wrap>
        {vals.map((v, i) => {
          const seg = (v / total) * (W - 2 * pad);
          const x = xAcc;
          xAcc += seg;
          return (
            <g key={i}>
              <rect x={x} y={barY} width={seg} height={barH} fill={colors[i]} opacity={i === activeIdx ? 0.95 : 0.55} />
              <text x={x + seg / 2} y={barY + barH / 2 + 3} textAnchor="middle" fontSize={9} fill="#fff" fontFamily="JetBrains Mono, monospace" fontWeight={700}>{Math.round((v / total) * 100)}%</text>
              <text x={x + seg / 2} y={barY + barH + 12} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.65)" fontWeight={i === activeIdx ? 600 : 500}>{categories[i][1]}</text>
            </g>
          );
        })}
      </Wrap>
    );
  }
  if (corner === "bl") {
    const bw = (W - 2 * pad - 20) / 3;
    return (
      <Wrap>
        <line x1={pad} x2={W - pad} y1={H - 28} y2={H - 28} stroke="rgba(26,29,36,0.18)" />
        {vals.map((v, i) => {
          const h = (v / max) * (H - 50);
          const x = pad + i * (bw + 10);
          const y = H - 28 - h;
          const active = i === activeIdx;
          return (
            <g key={i}>
              <rect x={x} y={y} width={bw} height={h} rx={2} fill={color} opacity={active ? 0.95 : 0.4} />
              {active && <rect x={x - 1} y={y - 1} width={bw + 2} height={h + 2} rx={2} fill="none" stroke={color} strokeWidth={1} />}
              <text x={x + bw / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={active ? "#1a1d24" : "rgba(26,29,36,0.55)"} fontFamily="JetBrains Mono, monospace" fontWeight={active ? 700 : 500}>{v}</text>
              <text x={x + bw / 2} y={H - 14} textAnchor="middle" fontSize={9} fill={active ? "#1a1d24" : "rgba(26,29,36,0.6)"} fontWeight={active ? 600 : 500}>{categories[i][1]}</text>
            </g>
          );
        })}
      </Wrap>
    );
  }
  // br: donitsi
  const cx = W / 2, cy = H / 2 - 4, R = 44, r = 24;
  const total = vals.reduce((a, b) => a + b, 0);
  const fnColors = [FN_COLOR.vahvistava, FN_COLOR.varautuminen, FN_COLOR.korjaava];
  let a0 = -Math.PI / 2;
  const segs = vals.map((v, i) => {
    const a1 = a0 + (v / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0);
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
    const xi0 = cx + r * Math.cos(a0), yi0 = cy + r * Math.sin(a0);
    const xi1 = cx + r * Math.cos(a1), yi1 = cy + r * Math.sin(a1);
    const path = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${r} ${r} 0 ${large} 0 ${xi0} ${yi0} Z`;
    a0 = a1;
    return { path, color: fnColors[i], active: i === activeIdx };
  });
  return (
    <Wrap>
      {segs.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={s.active ? 0.95 : 0.45} />)}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.6)" fontFamily="JetBrains Mono, monospace">{categories[activeIdx][1].toUpperCase()}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={14} fill="#1a1d24" fontFamily="JetBrains Mono, monospace" fontWeight={700}>{vals[activeIdx]}</text>
      {categories.map(([, lab], i) => (
        <g key={i}>
          <circle cx={pad} cy={pad + i * 14} r={3} fill={fnColors[i]} opacity={i === activeIdx ? 1 : 0.5} />
          <text x={pad + 8} y={pad + i * 14 + 3} fontSize={8.5} fill={i === activeIdx ? "#1a1d24" : "rgba(26,29,36,0.55)"} fontWeight={i === activeIdx ? 600 : 500}>{lab}</text>
        </g>
      ))}
    </Wrap>
  );
};

// ─── VANAVESI ───
export const Vanavesi = ({ corner, ctx }: { corner: CornerId; ctx: Ctx }) => {
  const { wake, year } = ctx;
  if (corner !== "br") {
    if (!wake) {
      return (
        <Wrap>
          <text x={110} y={70} textAnchor="middle" fontSize={10} fill="rgba(26,29,36,0.45)">vanavesi näkyy oikeassa alalohkossa</text>
        </Wrap>
      );
    }
    return (
      <Wrap>
        <text x={110} y={64} textAnchor="middle" fontSize={11} fill="#8a6510" fontWeight={700}>≈ {wake.indiv - wake.state} v viive</text>
        <text x={110} y={80} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)">{wake.state} → {wake.cohort} → {wake.indiv}</text>
      </Wrap>
    );
  }

  // br ─ lepokehä
  if (!wake) {
    const W = 220, H = 150, cx = W / 2, cy = H / 2 + 4, r = 48;
    const pt = (deg: number): [number, number] => [cx + r * Math.cos((deg - 90) * Math.PI / 180), cy + r * Math.sin((deg - 90) * Math.PI / 180)];
    const [vx, vy] = pt(0), [kx, ky] = pt(120), [yx, yy] = pt(240);
    return (
      <Wrap vb={`0 0 ${W} ${H}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(26,29,36,0.18)" strokeWidth={1.2} strokeDasharray="3 4" />
        <circle cx={vx} cy={vy} r={4} fill="#2c5a8a" opacity={0.55} />
        <circle cx={kx} cy={ky} r={4} fill="#a85d3f" opacity={0.55} />
        <circle cx={yx} cy={yy} r={4} fill="#3f8055" opacity={0.55} />
        <text x={vx} y={vy - 8} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.6)" fontFamily="JetBrains Mono, monospace">VALTIO</text>
        <text x={kx + 10} y={ky + 4} fontSize={9} fill="rgba(26,29,36,0.6)" fontFamily="JetBrains Mono, monospace">KOHORTTI</text>
        <text x={yx - 10} y={yy + 4} textAnchor="end" fontSize={9} fill="rgba(26,29,36,0.6)" fontFamily="JetBrains Mono, monospace">YKSILÖ</text>
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize={10} fill="rgba(26,29,36,0.55)" fontWeight={600}>vanavesi</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.4)">lepää</text>
      </Wrap>
    );
  }

  // br ─ valtausvirtaus
  const W = 1400, H = 360, padX = 90;
  const earliest = wake.state;
  const latest = Math.max(wake.indiv, year);
  const totalSpan = Math.max(1, latest - earliest);
  const pad = Math.max(1, Math.round(totalSpan * 0.12));
  const minYr = earliest - pad;
  const maxYr = latest + pad;
  const span = Math.max(1, maxYr - minYr);
  const xOf = (yr: number) => padX + ((yr - minYr) / span) * (W - 2 * padX);
  const xS = xOf(wake.state), xC = xOf(wake.cohort), xI = xOf(wake.indiv), xCur = xOf(year);
  const yMid = H / 2 + 24;
  const lagSC = wake.cohort - wake.state;
  const lagCI = wake.indiv - wake.cohort;
  const lagTotal = wake.indiv - wake.state;
  const phase = year < wake.cohort ? "valtio → kohortti" : year < wake.indiv ? "kohortti → yksilö" : "saavuttanut yksilön";

  const Stage = ({ x, color, label, yr, sub }: { x: number; color: string; label: string; yr: number; sub: string }) => (
    <g>
      <circle cx={x} cy={yMid} r={14} fill="none" stroke={color} strokeWidth={1} opacity={0.22} />
      <circle cx={x} cy={yMid} r={5} fill={color} />
      <text x={x} y={yMid - 26} textAnchor="middle" fontSize={10} fill="rgba(26,29,36,0.42)" fontWeight={600} letterSpacing={2.5} fontFamily="JetBrains Mono, monospace">{label}</text>
      <text x={x} y={yMid + 30} textAnchor="middle" fontSize={14} fill="#1a1d24" fontWeight={500} fontFamily="JetBrains Mono, monospace">{yr}</text>
      <text x={x} y={yMid + 46} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.28)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">{sub}</text>
    </g>
  );

  return (
    <Wrap vb={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="wakeBand" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a1d24" stopOpacity={0} />
          <stop offset="22%" stopColor="#1a1d24" stopOpacity={0.05} />
          <stop offset="50%" stopColor="#1a1d24" stopOpacity={0.07} />
          <stop offset="78%" stopColor="#1a1d24" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#1a1d24" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="wakeFlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2c5a8a" />
          <stop offset="50%" stopColor="#a85d3f" />
          <stop offset="100%" stopColor="#3f8055" />
        </linearGradient>
      </defs>
      <rect x={padX - 40} y={yMid - 58} width={W - 2 * (padX - 40)} height={116} fill="url(#wakeBand)" />
      <text x={padX} y={44} fontSize={11} fill="rgba(26,29,36,0.55)" fontWeight={600} letterSpacing={3} fontFamily="JetBrains Mono, monospace">VANAVESI</text>
      <text x={padX} y={64} fontSize={13} fill="rgba(26,29,36,0.85)" fontWeight={500}>{wake.theme}</text>
      <text x={W - padX} y={44} textAnchor="end" fontSize={11} fill="rgba(26,29,36,0.45)" fontWeight={600} letterSpacing={3} fontFamily="JetBrains Mono, monospace">VIIVE PÄÄTÖKSESTÄ ARKEEN</text>
      <text x={W - padX} y={70} textAnchor="end" fontSize={26} fill="#1a1d24" fontWeight={500}>{lagTotal}<tspan fontSize={14} fill="rgba(26,29,36,0.55)"> vuotta</tspan></text>
      <line x1={padX} x2={W - padX} y1={yMid} y2={yMid} stroke="rgba(26,29,36,0.18)" strokeWidth={1} />
      <path d={`M${xS},${yMid} C${xS + (xC - xS) * 0.4},${yMid - 44} ${xS + (xC - xS) * 0.6},${yMid - 44} ${xC},${yMid}`} fill="none" stroke="url(#wakeFlow)" strokeWidth={1.75} strokeDasharray="3 5" strokeLinecap="round" opacity={0.85} />
      <path d={`M${xC},${yMid} C${xC + (xI - xC) * 0.4},${yMid - 44} ${xC + (xI - xC) * 0.6},${yMid - 44} ${xI},${yMid}`} fill="none" stroke="url(#wakeFlow)" strokeWidth={1.75} strokeDasharray="3 5" strokeLinecap="round" opacity={0.85} />
      <text x={(xS + xC) / 2} y={yMid - 50} textAnchor="middle" fontSize={11} fill="rgba(26,29,36,0.55)" fontFamily="JetBrains Mono, monospace">+{lagSC} v</text>
      <text x={(xC + xI) / 2} y={yMid - 50} textAnchor="middle" fontSize={11} fill="rgba(26,29,36,0.55)" fontFamily="JetBrains Mono, monospace">+{lagCI} v</text>
      <Stage x={xS} color="#2c5a8a" label="VALTIO" yr={wake.state} sub="PÄÄTÖS" />
      <Stage x={xC} color="#a85d3f" label="KOHORTTI" yr={wake.cohort} sub="PALVELU" />
      <Stage x={xI} color="#3f8055" label="YKSILÖ" yr={wake.indiv} sub="ARKI" />
      <line x1={xCur} x2={xCur} y1={yMid - 66} y2={yMid + 58} stroke="#1a1d24" strokeWidth={1} strokeDasharray="2 3" opacity={0.25} />
      <text x={xCur} y={yMid - 72} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.4)" fontWeight={600} letterSpacing={2} fontFamily="JetBrains Mono, monospace">NYT {year}</text>
      <text x={W / 2} y={H - 18} textAnchor="middle" fontSize={10} fill="rgba(26,29,36,0.32)" fontWeight={500} letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">{phase.toUpperCase()}</text>
    </Wrap>
  );
};

// ─── SLOPE ───
export const Slope = ({ ctx }: { ctx: Ctx }) => {
  const { cluster, time } = ctx;
  const W = 220, H = 140, color = FN_COLOR[cluster.fn];
  const a = pseudoVal(cluster.id, "trend:past");
  const b = pseudoVal(cluster.id, "trend:now");
  const f = pseudoVal(cluster.id, "trend:future");
  const vals = [a, b, f];
  const lab = ["1990", "2024", "2040"];
  const max = Math.max(...vals) + 5, min = Math.min(...vals) - 5;
  const X = [40, W / 2, W - 40];
  const Y = vals.map((v) => 30 + (1 - (v - min) / (max - min)) * (H - 60));
  const activeIdx = ["past", "now", "future"].indexOf(time);
  const delta = f - a;
  const arrow = delta >= 0 ? "↗" : "↘";
  return (
    <Wrap>
      <text x={W / 2} y={18} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">KALTEVUUS {arrow} {delta >= 0 ? "+" : ""}{delta}</text>
      <line x1={X[0]} y1={Y[0]} x2={X[1]} y2={Y[1]} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <line x1={X[1]} y1={Y[1]} x2={X[2]} y2={Y[2]} stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="4 3" />
      {X.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={Y[i]} r={i === activeIdx ? 6 : 4} fill={color} opacity={i === activeIdx ? 1 : 0.7} />
          <text x={x} y={Y[i] - 10} textAnchor="middle" fontSize={11} fontWeight={i === activeIdx ? 700 : 500} fill="#1a1d24" fontFamily="JetBrains Mono, monospace">{vals[i]}</text>
          <text x={x} y={H - 12} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.6)" fontFamily="JetBrains Mono, monospace">{lab[i]}</text>
        </g>
      ))}
    </Wrap>
  );
};

// ─── KUMULATIIVINEN ───
export const Kumulatiivinen = ({ ctx }: { ctx: Ctx }) => {
  const { cluster, year } = ctx;
  const W = 220, H = 140, pad = 16, color = FN_COLOR[cluster.fn];
  const pts: [number, number][] = [];
  let acc = 0;
  for (let yr = YEAR_MIN; yr <= YEAR_MAX; yr += 5) {
    acc += pseudoVal(cluster.id, "trend:smooth:" + yr) / 10;
    pts.push([yr, acc]);
  }
  const max = pts[pts.length - 1][1];
  const xy = pts.map(([yr, v]) => [
    pad + ((yr - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - 2 * pad),
    H - pad - (v / max) * (H - 2 * pad - 14),
  ] as [number, number]);
  const cursorX = pad + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - 2 * pad);
  const filled = xy.filter((p) => p[0] <= cursorX);
  const filledPath = filled.length
    ? `M ${filled[0][0]},${H - pad} ` + filled.map((p) => `L ${p[0]},${p[1]}`).join(" ") + ` L ${cursorX},${H - pad} Z`
    : "";
  const linePath = `M ${xy[0][0]},${xy[0][1]} ` + xy.slice(1).map((p) => `L ${p[0]},${p[1]}`).join(" ");
  return (
    <Wrap>
      <text x={W / 2} y={14} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">KERTYVÄ HISTORIA</text>
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="rgba(26,29,36,0.18)" />
      {filledPath && <path d={filledPath} fill={color} opacity={0.28} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <line x1={cursorX} x2={cursorX} y1={pad + 10} y2={H - pad} stroke={color} strokeWidth={1} strokeDasharray="2 2" opacity={0.7} />
      <text x={cursorX} y={pad + 8} textAnchor="middle" fontSize={9} fill="#1a1d24" fontWeight={700} fontFamily="JetBrains Mono, monospace">{year}</text>
    </Wrap>
  );
};

// ─── LUOTETTAVUUS ───
export const Luotettavuus = ({ ctx }: { ctx: Ctx }) => {
  const { cluster, time } = ctx;
  const W = 220, H = 140, color = FN_COLOR[cluster.fn];
  const v = pseudoVal(cluster.id, "tr:num:" + time);
  const ciHalf = 6 + (pseudoVal(cluster.id, "ci:" + time) % 18);
  const lo = Math.max(0, v - ciHalf), hi = Math.min(100, v + ciHalf);
  const padX = 36, axY = H - 36, axL = padX, axR = W - padX;
  const sx = (x: number) => axL + (x / 100) * (axR - axL);
  return (
    <Wrap>
      <text x={W / 2} y={18} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">LUOTETTAVUUS · 95 % CI</text>
      <line x1={axL} x2={axR} y1={axY} y2={axY} stroke="rgba(26,29,36,0.25)" />
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={axY - 3} y2={axY + 3} stroke="rgba(26,29,36,0.3)" />
          <text x={sx(t)} y={axY + 14} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.55)" fontFamily="JetBrains Mono, monospace">{t}</text>
        </g>
      ))}
      <line x1={sx(lo)} x2={sx(hi)} y1={axY - 22} y2={axY - 22} stroke={color} strokeWidth={6} strokeLinecap="round" opacity={0.35} />
      <line x1={sx(lo)} x2={sx(lo)} y1={axY - 30} y2={axY - 14} stroke={color} strokeWidth={1.5} />
      <line x1={sx(hi)} x2={sx(hi)} y1={axY - 30} y2={axY - 14} stroke={color} strokeWidth={1.5} />
      <circle cx={sx(v)} cy={axY - 22} r={6} fill={color} />
      <text x={sx(v)} y={axY - 34} textAnchor="middle" fontSize={14} fill="#1a1d24" fontWeight={700} fontFamily="JetBrains Mono, monospace">{v}</text>
      <text x={sx(lo)} y={axY - 40} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.55)" fontFamily="JetBrains Mono, monospace">{lo}</text>
      <text x={sx(hi)} y={axY - 40} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.55)" fontFamily="JetBrains Mono, monospace">{hi}</text>
    </Wrap>
  );
};

// ─── HAJONTA ───
export const Hajonta = ({ ctx }: { ctx: Ctx }) => {
  const { cluster, time } = ctx;
  const W = 220, H = 140, color = FN_COLOR[cluster.fn];
  const center = pseudoVal(cluster.id, "tr:num:" + time);
  const seed = pseudoVal(cluster.id, "hajo:" + time);
  const dots: [number, number][] = [];
  for (let i = 0; i < 14; i++) {
    const h = (seed * 31 + i * 97) >>> 0;
    const dx = ((h % 200) - 100) * 0.45;
    const dy = (((h >> 3) % 100) - 50) * 0.6;
    const v = clamp(center + dx, 0, 100);
    dots.push([v, dy]);
  }
  const padX = 36, axY = H - 32, axL = padX, axR = W - padX;
  const sx = (x: number) => axL + (x / 100) * (axR - axL);
  return (
    <Wrap>
      <text x={W / 2} y={18} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">LÄHTEIDEN HAJONTA</text>
      <line x1={axL} x2={axR} y1={axY} y2={axY} stroke="rgba(26,29,36,0.25)" />
      {[0, 50, 100].map((t) => (
        <text key={t} x={sx(t)} y={axY + 14} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.55)" fontFamily="JetBrains Mono, monospace">{t}</text>
      ))}
      {dots.map(([v, dy], i) => <circle key={i} cx={sx(v)} cy={axY - 30 + dy * 0.6} r={3} fill={color} opacity={0.55} />)}
      <line x1={sx(center)} x2={sx(center)} y1={axY - 60} y2={axY} stroke="#1a1d24" strokeWidth={1} strokeDasharray="2 2" opacity={0.4} />
      <text x={sx(center)} y={axY - 66} textAnchor="middle" fontSize={10} fontWeight={700} fill="#1a1d24" fontFamily="JetBrains Mono, monospace">μ {center}</text>
    </Wrap>
  );
};

// ─── PYRAMIDI ───
export const Pyramidi = ({ ctx }: { ctx: Ctx }) => {
  const { cluster, time } = ctx;
  const W = 220, H = 140, color = FN_COLOR[cluster.fn];
  const ages = ["65+", "45–64", "30–44", "15–29", "0–14"];
  const seed = pseudoVal(cluster.id, "pyr:" + time);
  const men = ages.map((_, i) => 20 + ((seed * 13 + i * 53) % 60));
  const women = ages.map((_, i) => 20 + ((seed * 17 + i * 41) % 60));
  const max = Math.max(...men, ...women);
  const padX = 30, midX = W / 2, padY = 24, rowH = (H - padY - 18) / ages.length - 4;
  const activeIdx = cluster.level === "individual"
    ? (cluster.id.includes("vanhus") || cluster.id === "elakkeet" ? 0 : 4)
    : cluster.level === "group" ? 3 : 2;
  return (
    <Wrap>
      <text x={midX} y={14} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">VÄESTÖPYRAMIDI</text>
      <text x={padX} y={14} fontSize={8} fill="rgba(26,29,36,0.45)" fontFamily="JetBrains Mono, monospace">miehet</text>
      <text x={W - padX} y={14} textAnchor="end" fontSize={8} fill="rgba(26,29,36,0.45)" fontFamily="JetBrains Mono, monospace">naiset</text>
      <line x1={midX} x2={midX} y1={padY - 4} y2={H - 18} stroke="rgba(26,29,36,0.18)" />
      {ages.map((lab, i) => {
        const y = padY + i * (rowH + 4);
        const mw = (men[i] / max) * (midX - padX - 18);
        const ww = (women[i] / max) * (midX - padX - 18);
        const active = i === activeIdx;
        return (
          <g key={i}>
            <rect x={midX - 2 - mw} y={y} width={mw} height={rowH} fill={color} opacity={active ? 0.9 : 0.35} rx={1.5} />
            <rect x={midX + 2} y={y} width={ww} height={rowH} fill={color} opacity={active ? 0.7 : 0.25} rx={1.5} />
            <text x={midX} y={y + rowH / 2 + 3} textAnchor="middle" fontSize={9} fill={active ? "#1a1d24" : "rgba(26,29,36,0.65)"} fontWeight={active ? 700 : 500} fontFamily="JetBrains Mono, monospace">{lab}</text>
          </g>
        );
      })}
    </Wrap>
  );
};

// ─── KOHORTTIVIRTA ───
export const Kohorttivirta = ({ ctx }: { ctx: Ctx }) => {
  const { cluster, year } = ctx;
  const W = 220, H = 140, color = FN_COLOR[cluster.fn];
  const cohorts = [
    { lab: "Lapset 2010–", born: 2010, w: 16 + (pseudoVal(cluster.id, "coh:lapset") % 20) },
    { lab: "Työikä 1985–", born: 1985, w: 22 + (pseudoVal(cluster.id, "coh:tyoika") % 24) },
    { lab: "Eläke 1955–",  born: 1955, w: 18 + (pseudoVal(cluster.id, "coh:elake") % 18) },
  ];
  const padX = 16, padY = 22, rowH = (H - padY - 14) / cohorts.length;
  const cursorX = padX + ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - 2 * padX);
  return (
    <Wrap>
      <text x={W / 2} y={14} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">KOHORTTIVIRTA</text>
      {cohorts.map((c, i) => {
        const yMid = padY + (i + 0.5) * rowH;
        const offset = ((year - c.born) / 80) * (W - 2 * padX);
        const w = c.w * 0.6;
        const x0 = padX + offset - 30;
        const x1 = x0 + 60;
        const isActive = year >= c.born && year <= c.born + 80;
        return (
          <g key={i}>
            <line x1={padX} y1={yMid} x2={W - padX} y2={yMid} stroke="rgba(26,29,36,0.10)" strokeWidth={w} strokeLinecap="round" />
            <line x1={Math.max(padX, x0)} y1={yMid} x2={Math.min(W - padX, x1)} y2={yMid} stroke={color} strokeWidth={w} strokeLinecap="round" opacity={isActive ? 0.85 : 0.35} />
            <text x={padX + 2} y={yMid - w / 2 - 3} fontSize={9} fill="rgba(26,29,36,0.7)" fontFamily="JetBrains Mono, monospace">{c.lab}</text>
          </g>
        );
      })}
      <line x1={cursorX} x2={cursorX} y1={padY - 2} y2={H - 12} stroke="#1a1d24" strokeWidth={1} strokeDasharray="2 2" opacity={0.5} />
      <text x={cursorX} y={H - 2} textAnchor="middle" fontSize={9} fill="#1a1d24" fontWeight={700} fontFamily="JetBrains Mono, monospace">{year}</text>
    </Wrap>
  );
};

// ─── SKENAARIO ───
export const Skenaario = ({ ctx }: { ctx: Ctx }) => {
  const { cluster, year } = ctx;
  const W = 220, H = 140, pad = 16, color = FN_COLOR[cluster.fn];
  const split = clamp(year, YEAR_NOW, YEAR_MAX);
  const sx = (yr: number) => pad + ((yr - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * (W - 2 * pad);
  const xNow = sx(YEAR_NOW), xEnd = sx(YEAR_MAX), xCur = sx(split);
  const baseY = H - 28;
  const v0 = pseudoVal(cluster.id, "scen:base");
  const yBase = baseY - (v0 / 100) * (H - 50);
  const yLow = yBase + 30, yHi = yBase - 36;
  const cMid = `M ${xNow},${yBase} Q ${(xNow + xEnd) / 2},${yBase - 4} ${xEnd},${yBase}`;
  const cLow = `M ${xNow},${yBase} Q ${(xNow + xEnd) / 2},${(yBase + yLow) / 2 + 10} ${xEnd},${yLow}`;
  const cHi  = `M ${xNow},${yBase} Q ${(xNow + xEnd) / 2},${(yBase + yHi) / 2 - 10} ${xEnd},${yHi}`;
  const histPts: [number, number][] = [];
  for (let yr = YEAR_MIN; yr <= YEAR_NOW; yr += 5) {
    const v = pseudoVal(cluster.id, "trend:smooth:" + yr);
    histPts.push([sx(yr), baseY - (v / 100) * (H - 50)]);
  }
  const histPath = `M ${histPts[0][0]},${histPts[0][1]} ` + histPts.slice(1).map((p) => `L ${p[0]},${p[1]}`).join(" ");
  return (
    <Wrap>
      <text x={W / 2} y={14} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">TULEVAISUUSVIUHKA</text>
      <line x1={pad} x2={W - pad} y1={baseY} y2={baseY} stroke="rgba(26,29,36,0.18)" />
      <path d={`M ${xNow},${yBase} L ${xEnd},${yHi} L ${xEnd},${yLow} Z`} fill={color} opacity={0.1} />
      <path d={histPath} fill="none" stroke="#1a1d24" strokeWidth={1.6} opacity={0.7} />
      <path d={cHi} fill="none" stroke={color} strokeWidth={1.4} strokeDasharray="2 3" opacity={0.7} />
      <path d={cMid} fill="none" stroke={color} strokeWidth={2.2} />
      <path d={cLow} fill="none" stroke={color} strokeWidth={1.4} strokeDasharray="2 3" opacity={0.7} />
      <line x1={xNow} x2={xNow} y1={pad + 8} y2={baseY} stroke="rgba(26,29,36,0.3)" strokeDasharray="2 2" />
      <text x={xNow} y={pad + 6} textAnchor="middle" fontSize={8} fill="rgba(26,29,36,0.55)" fontFamily="JetBrains Mono, monospace">NYT</text>
      <text x={xEnd - 2} y={yHi - 2} textAnchor="end" fontSize={8} fill={color} fontFamily="JetBrains Mono, monospace">korkea</text>
      <text x={xEnd - 2} y={yBase - 2} textAnchor="end" fontSize={8} fill={color} fontWeight={700} fontFamily="JetBrains Mono, monospace">keski</text>
      <text x={xEnd - 2} y={yLow + 10} textAnchor="end" fontSize={8} fill={color} fontFamily="JetBrains Mono, monospace">matala</text>
      <line x1={xCur} x2={xCur} y1={pad + 8} y2={baseY} stroke={color} strokeWidth={1.2} />
      <circle cx={xCur} cy={yBase} r={3} fill={color} />
    </Wrap>
  );
};

// ─── KAUSAALI ───
export const Kausaali = ({ ctx }: { ctx: Ctx }) => {
  const { cluster, wake } = ctx;
  const W = 220, H = 140, color = FN_COLOR[cluster.fn];
  const steps = wake
    ? [
        { lab: "Päätös", sub: String(wake.state) },
        { lab: "Kohortti", sub: String(wake.cohort) },
        { lab: "Yksilö", sub: String(wake.indiv) },
        { lab: "Vaikutus", sub: `+${wake.indiv - wake.state} v` },
      ]
    : [
        { lab: "Päätös", sub: FN_LABEL[cluster.fn] },
        { lab: "Palvelu", sub: LEVEL_LABELS[cluster.level] },
        { lab: "Yksilö", sub: "arki" },
        { lab: "Vaikutus", sub: "hyvinv." },
      ];
  const boxW = 42, boxH = 30, gap = (W - 2 * 16 - 4 * boxW) / 3;
  const y = H / 2 - boxH / 2;
  return (
    <Wrap>
      <text x={W / 2} y={14} textAnchor="middle" fontSize={9} fill="rgba(26,29,36,0.55)" letterSpacing={1.5} fontFamily="JetBrains Mono, monospace">KAUSAALIKETJU</text>
      {steps.map((s, i) => {
        const x = 16 + i * (boxW + gap);
        const active = wake ? true : i === 0;
        return (
          <g key={i}>
            <rect x={x} y={y} width={boxW} height={boxH} rx={6} fill={color} opacity={active ? 0.85 : 0.35} />
            <text x={x + boxW / 2} y={y + 12} textAnchor="middle" fontSize={9} fill="#fff" fontWeight={700}>{s.lab}</text>
            <text x={x + boxW / 2} y={y + 24} textAnchor="middle" fontSize={8} fill="#fff" opacity={0.85} fontFamily="JetBrains Mono, monospace">{s.sub}</text>
            {i < steps.length - 1 && (
              <>
                <line x1={x + boxW} x2={x + boxW + gap - 4} y1={y + boxH / 2} y2={y + boxH / 2} stroke={color} strokeWidth={1.6} opacity={0.7} />
                <polygon points={`${x + boxW + gap - 4},${y + boxH / 2 - 3} ${x + boxW + gap},${y + boxH / 2} ${x + boxW + gap - 4},${y + boxH / 2 + 3}`} fill={color} opacity={0.7} />
              </>
            )}
          </g>
        );
      })}
    </Wrap>
  );
};

// ─── TAULUKKO ───
export const Taulukko = ({ corner, ctx }: { corner: CornerId; ctx: Ctx }) => {
  const { cluster, time, year, wake } = ctx;
  let rows: [string, string | number][] = [];
  if (corner === "tl") {
    rows = [
      ["1990 (ennen)", pseudoVal(cluster.id, "trend:past")],
      ["2024 (nyt)", pseudoVal(cluster.id, "trend:now")],
      ["2040 (tuleva)", pseudoVal(cluster.id, "trend:future")],
      [`Vuosi ${year}`, pseudoVal(cluster.id, "trend:smooth:" + (Math.round(year / 5) * 5))],
    ];
  } else if (corner === "tr") {
    rows = [
      ["Panos", pseudoVal(cluster.id, "tr:vert:panos:" + time)],
      ["Empiria", pseudoVal(cluster.id, "tr:vert:empiria:" + time)],
      ["Teoria", pseudoVal(cluster.id, "tr:vert:teoria:" + time)],
      ["Luotettavuus", pseudoVal(cluster.id, "tr:num:" + time) + " / 100"],
    ];
  } else if (corner === "bl") {
    rows = [
      ["Lapset", pseudoVal(cluster.id, "bl:vert:lapset:" + time)],
      ["Työikä", pseudoVal(cluster.id, "bl:vert:tyoika:" + time)],
      ["Vanhukset", pseudoVal(cluster.id, "bl:vert:vanhukset:" + time)],
      ["Väestöosuus", (pseudoVal(cluster.id, "bl:num:" + time) / 10).toFixed(1) + " %"],
    ];
  } else {
    rows = [
      ["Vahvistava", pseudoVal(cluster.id, "br:vert:vahvistava:" + time)],
      ["Varautuminen", pseudoVal(cluster.id, "br:vert:varautuminen:" + time)],
      ["Korjaava", pseudoVal(cluster.id, "br:vert:korjaava:" + time)],
      ["Vanavesiviive", wake ? wake.indiv - wake.state + " v" : "—"],
    ];
  }
  return (
    <table className="w-full text-[10px] font-mono text-ink">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-ink/5">
            <th scope="row" className="text-left py-1 pr-2 font-medium text-ink-mute">{k}</th>
            <td className="text-right py-1 text-ink">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ─── DISPATCHER ───
export const LensRenderer = ({
  view,
  corner,
  ctx,
}: {
  view: string;
  corner: CornerId;
  ctx: Ctx;
}) => {
  switch (view) {
    case "tripyykki": {
      const axis = CORNER_ROLE[corner].axis as TripKind;
      return <Triptych kind={axis} ctx={ctx} />;
    }
    case "trendi":          return <Trendi corner={corner} ctx={ctx} />;
    case "numero":          return <Numero corner={corner} ctx={ctx} />;
    case "vertailu":        return <Vertailu corner={corner} ctx={ctx} />;
    case "vanavesi":        return <Vanavesi corner={corner} ctx={ctx} />;
    case "slope":           return <Slope ctx={ctx} />;
    case "kumulatiivinen":  return <Kumulatiivinen ctx={ctx} />;
    case "luotettavuus":    return <Luotettavuus ctx={ctx} />;
    case "hajonta":         return <Hajonta ctx={ctx} />;
    case "pyramidi":        return <Pyramidi ctx={ctx} />;
    case "kohorttivirta":   return <Kohorttivirta ctx={ctx} />;
    case "skenaario":       return <Skenaario ctx={ctx} />;
    case "kausaali":        return <Kausaali ctx={ctx} />;
    case "taulukko":        return <Taulukko corner={corner} ctx={ctx} />;
    default:                return <Wrap><text x={110} y={70} textAnchor="middle" fontSize={10} fill="rgba(26,29,36,0.45)">{view}</text></Wrap>;
  }
};

// helper exportit
export type { Ctx as LensCtx };
// Suppress unused warnings
void CLUSTERS;
