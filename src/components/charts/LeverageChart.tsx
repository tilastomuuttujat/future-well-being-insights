import { useMemo } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { useSignalView } from "@/hooks/useSignalView";

interface LeverageRow {
  life_stage: string;
  intervention: string;
  cost_per_unit: number;
  effect_per_unit: number;
  roi_ratio: number;
  evidence_strength: number;
  duration_years: number;
}

const MOCK: LeverageRow[] = [
  { life_stage: "0–6 v.", intervention: "Neuvolan laajennettu seuranta", cost_per_unit: 1200, effect_per_unit: 8400, roi_ratio: 7.0, evidence_strength: 3, duration_years: 30 },
  { life_stage: "7–15 v.", intervention: "Koulupsykologin matala kynnys", cost_per_unit: 800, effect_per_unit: 4200, roi_ratio: 5.25, evidence_strength: 3, duration_years: 25 },
  { life_stage: "16–25 v.", intervention: "Opiskeluterveys + työvalmennus", cost_per_unit: 2400, effect_per_unit: 9600, roi_ratio: 4.0, evidence_strength: 2, duration_years: 20 },
  { life_stage: "26–55 v.", intervention: "Työterveyden mt-polku", cost_per_unit: 3600, effect_per_unit: 10200, roi_ratio: 2.83, evidence_strength: 3, duration_years: 15 },
  { life_stage: "56–67 v.", intervention: "Osa-aikainen työ + kuntoutus", cost_per_unit: 5200, effect_per_unit: 11800, roi_ratio: 2.27, evidence_strength: 2, duration_years: 10 },
  { life_stage: "68+", intervention: "Kotihoidon tehostus", cost_per_unit: 8400, effect_per_unit: 12400, roi_ratio: 1.48, evidence_strength: 2, duration_years: 8 },
];

export const LeverageChart = () => {
  const { data, isLoading } = useSignalView<LeverageRow>("v_signal_leverage");
  const rows = data && data.length > 0 ? data : MOCK;

  const points = useMemo(
    () =>
      rows.map((r) => ({
        x: r.cost_per_unit,
        y: r.roi_ratio,
        z: r.duration_years * 8, // bubble-koko
        ...r,
      })),
    [rows]
  );

  return (
    <div className="paper p-5">
      <div className="mb-3">
        <p className="eyebrow mb-1">Leverage-pisteet</p>
        <h3 className="font-serif text-xl text-ink">ROI vs. interventiokustannus</h3>
        <p className="lede text-sm">Kupla = vaikutuksen kesto (vuosia)</p>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" />
            <XAxis
              dataKey="x"
              type="number"
              name="€/yksikkö"
              tick={{ fill: "var(--ink-mute)", fontSize: 11, fontFamily: "JetBrains Mono" }}
              stroke="var(--ink-faint)"
              label={{ value: "€ / yksikkö", position: "insideBottom", offset: -2, fontSize: 10, fill: "var(--ink-mute)" }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name="ROI"
              tick={{ fill: "var(--ink-mute)", fontSize: 11, fontFamily: "JetBrains Mono" }}
              stroke="var(--ink-faint)"
            />
            <ZAxis dataKey="z" range={[60, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "hsl(var(--paper))",
                border: "1px solid hsl(var(--border))",
                fontSize: 12,
                fontFamily: "JetBrains Mono",
              }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const r = payload[0].payload as LeverageRow;
                return (
                  <div className="paper p-3 text-xs">
                    <div className="font-serif text-ink text-base mb-1">{r.intervention}</div>
                    <div className="text-ink-mute font-mono">{r.life_stage}</div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-ink-soft">
                      <span>Kust.</span><span className="text-right">{r.cost_per_unit} €</span>
                      <span>Vaikutus</span><span className="text-right">{r.effect_per_unit} €</span>
                      <span>ROI</span><span className="text-right text-fn-vahvistava">{r.roi_ratio.toFixed(2)}×</span>
                      <span>Kesto</span><span className="text-right">{r.duration_years} v.</span>
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={points} fill="var(--gold)" fillOpacity={0.55} stroke="var(--gold)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-ink-mute font-mono mt-3">
        {isLoading ? "Ladataan…" : data && data.length > 0 ? "Live · v_signal_leverage" : "Mock-data · näkymä puuttuu projektista"}
      </p>
    </div>
  );
};
