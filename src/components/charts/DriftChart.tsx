import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSignalView } from "@/hooks/useSignalView";

interface DriftRow {
  segment: string;
  year: number;
  scenario: "nykytrendi" | "varovainen" | "voimakas";
  value: number;
  ci_band: number;
}

const SCENARIO_COLOR: Record<DriftRow["scenario"], string> = {
  nykytrendi: "var(--fn-korjaava)",
  varovainen: "var(--fn-varautuminen)",
  voimakas: "var(--fn-vahvistava)",
};

// Mock-fallback jos näkymää ei vielä ole projektissa
const MOCK: DriftRow[] = (() => {
  const rows: DriftRow[] = [];
  const segments = ["Mielenterveys", "TULES", "Vanhuspalvelut"];
  for (const segment of segments) {
    const base = segment === "Vanhuspalvelut" ? 100 : segment === "TULES" ? 80 : 60;
    const slope = segment === "Mielenterveys" ? 4.2 : segment === "Vanhuspalvelut" ? 5.1 : 1.8;
    for (let y = 2024; y <= 2045; y++) {
      const dt = y - 2024;
      (["nykytrendi", "varovainen", "voimakas"] as const).forEach((scenario) => {
        const k = scenario === "nykytrendi" ? 1 : scenario === "varovainen" ? 0.7 : 0.4;
        rows.push({
          segment,
          year: y,
          scenario,
          value: base + slope * k * dt,
          ci_band: Math.abs(slope) * dt * 0.05,
        });
      });
    }
  }
  return rows;
})();

export const DriftChart = () => {
  const { data, isLoading } = useSignalView<DriftRow>("v_signal_drift");
  const rows = data && data.length > 0 ? data : MOCK;
  const segments = useMemo(
    () => Array.from(new Set(rows.map((r) => r.segment))),
    [rows]
  );
  const [segment, setSegment] = useState(segments[0]);

  // Pivotoi rivit { year, nykytrendi, varovainen, voimakas, ci_low, ci_high }
  const series = useMemo(() => {
    const filtered = rows.filter((r) => r.segment === segment);
    const byYear = new Map<number, any>();
    for (const r of filtered) {
      const e = byYear.get(r.year) ?? { year: r.year };
      e[r.scenario] = Number(r.value.toFixed(1));
      if (r.scenario === "nykytrendi") {
        e.ci_low = Number((r.value - r.ci_band).toFixed(1));
        e.ci_high = Number((r.value + r.ci_band).toFixed(1));
      }
      byYear.set(r.year, e);
    }
    return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
  }, [rows, segment]);

  return (
    <div className="paper p-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
        <div>
          <p className="eyebrow mb-1">Drift 2024 → 2045</p>
          <h3 className="font-serif text-xl text-ink">Ajauma kolmena polkuna</h3>
        </div>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="font-mono text-xs bg-paper border border-ink/10 rounded px-2 py-1 text-ink"
        >
          {segments.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--ink-mute)", fontSize: 11, fontFamily: "JetBrains Mono" }}
              stroke="var(--ink-faint)"
            />
            <YAxis
              tick={{ fill: "var(--ink-mute)", fontSize: 11, fontFamily: "JetBrains Mono" }}
              stroke="var(--ink-faint)"
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--paper))",
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
                fontFamily: "JetBrains Mono",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
            <Area
              type="monotone"
              dataKey="ci_high"
              stackId="ci"
              stroke="none"
              fill={SCENARIO_COLOR.nykytrendi}
              fillOpacity={0.08}
              legendType="none"
            />
            <Line type="monotone" dataKey="nykytrendi" stroke={SCENARIO_COLOR.nykytrendi} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="varovainen" stroke={SCENARIO_COLOR.varovainen} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="voimakas" stroke={SCENARIO_COLOR.voimakas} strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-ink-mute font-mono mt-3">
        {isLoading ? "Ladataan…" : data && data.length > 0 ? "Live · v_signal_drift" : "Mock-data · näkymä puuttuu projektista"}
      </p>
    </div>
  );
};
