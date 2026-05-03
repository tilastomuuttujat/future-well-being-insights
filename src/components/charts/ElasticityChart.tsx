import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSignalView } from "@/hooks/useSignalView";

interface ElasticityRow {
  segment: string;
  elasticity: number;
}

const MOCK: ElasticityRow[] = [
  { segment: "Mielenterveys (avo)", elasticity: 1.42 },
  { segment: "TULES (kirurgia)", elasticity: 0.31 },
  { segment: "Vanhuspalvelut (laitos)", elasticity: 0.18 },
  { segment: "Kotihoito", elasticity: 0.96 },
  { segment: "Päihdepalvelut", elasticity: 0.62 },
  { segment: "Lastensuojelu", elasticity: 0.24 },
];

export const ElasticityChart = () => {
  const { data, isLoading } = useSignalView<ElasticityRow>("v_signal_elasticity");
  const rows = data && data.length > 0 ? data : MOCK;

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.elasticity - a.elasticity),
    [rows]
  );

  return (
    <div className="paper p-5">
      <div className="mb-3">
        <p className="eyebrow mb-1">Joustavuus</p>
        <h3 className="font-serif text-xl text-ink">Mikä venyy kysynnän mukana</h3>
        <p className="lede text-sm">ε &lt; 1: jäykkä · ε ≈ 1: yhdenmukainen · ε &gt; 1: ylireagoiva</p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 16 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "var(--ink-mute)", fontSize: 11, fontFamily: "JetBrains Mono" }}
              stroke="var(--ink-faint)"
            />
            <YAxis
              type="category"
              dataKey="segment"
              width={140}
              tick={{ fill: "var(--ink-soft)", fontSize: 11 }}
              stroke="var(--ink-faint)"
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--paper))",
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
                fontFamily: "JetBrains Mono",
              }}
              formatter={(v: number) => [v.toFixed(2), "ε"]}
            />
            <Bar dataKey="elasticity" radius={[0, 3, 3, 0]}>
              {sorted.map((r) => (
                <Cell
                  key={r.segment}
                  fill={
                    r.elasticity > 1
                      ? "var(--fn-korjaava)"
                      : r.elasticity > 0.5
                      ? "var(--fn-varautuminen)"
                      : "var(--fn-vahvistava)"
                  }
                  fillOpacity={0.75}
                />
              ))}
              <LabelList
                dataKey="elasticity"
                position="right"
                formatter={(v: number) => v.toFixed(2)}
                style={{ fill: "var(--ink-mute)", fontSize: 11, fontFamily: "JetBrains Mono" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-ink-mute font-mono mt-3">
        {isLoading ? "Ladataan…" : data && data.length > 0 ? "Live · v_signal_elasticity" : "Mock-data · näkymä puuttuu projektista"}
      </p>
    </div>
  );
};
