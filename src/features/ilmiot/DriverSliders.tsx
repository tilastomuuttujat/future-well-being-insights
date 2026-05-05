import { DRIVERS } from "./data";

interface Props {
  vars: Record<string, number>;
  onChange: (id: string, value: number) => void;
  highlight?: string | null;
}

export const DriverSliders = ({ vars, onChange, highlight }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      {Object.entries(DRIVERS).map(([id, d]) => {
        const v = vars[id] ?? d.base;
        const changed = Math.abs(v - d.base) > 1e-6;
        const isHi = highlight === id;
        return (
          <label key={id}
            className="flex flex-col gap-0.5 py-1 px-2 rounded transition-colors"
            style={{
              background: isHi ? "var(--gold-soft)" : "transparent",
              outline: isHi ? "1px solid var(--gold)" : "none",
            }}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] text-ink leading-tight">{d.label}</span>
              <span className="font-mono text-[11px]"
                style={{ color: changed ? "var(--gold)" : "var(--ink-mute)" }}>
                {d.fmt(v)}
              </span>
            </div>
            <input
              type="range"
              min={d.min} max={d.max} step={d.step} value={v}
              onChange={(e) => onChange(id, Number(e.target.value))}
              className="w-full h-1 accent-[var(--gold)]"
            />
          </label>
        );
      })}
    </div>
  );
};
