import { DRIVERS } from "./data";

interface Props {
  vars: Record<string, number>;
  onChange: (id: string, value: number) => void;
  highlight?: string | null;
}

const GROUPS: { label: string; ids: string[] }[] = [
  { label: "Talous & työ",        ids: ["unemp", "bkt", "gini", "exp_gdp", "ansiotaso"] },
  { label: "Palvelut",            ids: ["pdh", "perus", "lsk_p", "nuor", "mth"] },
  { label: "Asuminen & tulot",    ids: ["asumiskust", "ansios", "jaljella_vuokra", "omistus_vuokra"] },
];

export const DriverSliders = ({ vars, onChange, highlight }: Props) => {
  return (
    <div className="flex flex-col gap-3">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <div className="eyebrow mb-1.5" style={{ fontSize: 9 }}>{g.label}</div>
          <div className="flex flex-col gap-1">
            {g.ids.map((id) => {
              const d = DRIVERS[id];
              if (!d) return null;
              const v = vars[id] ?? d.base;
              const changed = Math.abs(v - d.base) > 1e-6;
              const isHi = highlight === id;
              // pos of base and value as % within slider track
              const range = d.max - d.min;
              const basePct = ((d.base - d.min) / range) * 100;
              const valPct = ((v - d.min) / range) * 100;
              const lo = Math.min(basePct, valPct);
              const hi = Math.max(basePct, valPct);
              const direction = v >= d.base ? "up" : "down";

              return (
                <div key={id}
                  className="rounded-md transition-colors"
                  style={{
                    background: isHi ? "var(--gold-soft)" : changed ? "rgba(138,101,16,0.05)" : "transparent",
                    outline: isHi ? "1px solid var(--gold)" : "none",
                    padding: "6px 8px",
                  }}>
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <span className="font-serif text-[12.5px] text-ink leading-tight truncate">
                      {d.label}
                    </span>
                    <span className="flex items-baseline gap-1.5 shrink-0">
                      {changed && (
                        <button
                          onClick={() => onChange(id, d.base)}
                          aria-label="palauta lähtöarvo"
                          className="font-mono text-[10px] text-ink-faint hover:text-gold leading-none"
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          ↺
                        </button>
                      )}
                      <span className="font-mono text-[11px] tabular-nums"
                        style={{ color: changed ? "var(--gold)" : "var(--ink-mute)", fontWeight: changed ? 600 : 400 }}>
                        {d.fmt(v)}
                      </span>
                    </span>
                  </div>

                  {/* Custom-styled slider with base marker + delta fill */}
                  <div className="relative h-3 flex items-center">
                    {/* track */}
                    <div className="absolute inset-x-0 h-[2px] rounded-full"
                      style={{ background: "rgba(26,29,36,0.12)" }} />
                    {/* delta fill */}
                    {changed && (
                      <div className="absolute h-[3px] rounded-full"
                        style={{
                          left: `${lo}%`, width: `${hi - lo}%`,
                          background: direction === "up" ? "var(--gold)" : "var(--fn-korjaava)",
                          opacity: 0.85,
                        }} />
                    )}
                    {/* base marker */}
                    <div className="absolute w-[1.5px] h-2.5"
                      style={{ left: `calc(${basePct}% - 0.75px)`, background: "var(--ink-faint)", opacity: 0.6 }} />
                    {/* invisible native range for input */}
                    <input
                      type="range"
                      min={d.min} max={d.max} step={d.step} value={v}
                      onChange={(e) => onChange(id, Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      style={{ appearance: "none", background: "transparent" }}
                    />
                    {/* thumb */}
                    <div className="absolute pointer-events-none rounded-full"
                      style={{
                        left: `calc(${valPct}% - 6px)`,
                        width: 12, height: 12,
                        background: changed ? "var(--gold)" : "hsl(var(--paper))",
                        border: `1.2px solid ${changed ? "var(--gold)" : "var(--ink-soft)"}`,
                        boxShadow: "0 1px 2px rgba(26,29,36,0.18)",
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
