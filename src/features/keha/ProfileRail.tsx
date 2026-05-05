import { getRailSet, RailItem } from "./profileRail";

interface Props {
  phase: string;
  area: string;
  onOpenInvestment: () => void;
}

/** Suojaavien ja riskitekijöiden rinnakkainen "rail" -näkymä. */
export const ProfileRail = ({ phase, area, onOpenInvestment }: Props) => {
  const set = getRailSet(phase, area);
  return (
    <section className="paper p-4 mt-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="eyebrow">Profiilirail</p>
          <h2 className="font-serif text-lg text-ink">Suojaavat & riskitekijät</h2>
        </div>
        <button
          onClick={onOpenInvestment}
          className="font-mono text-[11px] px-3 py-1.5 rounded bg-ink text-paper hover:opacity-90"
        >
          Avaa investointikortti →
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <RailColumn title="Suojaavat" items={set.protective} color="#2d5a3d" />
        <RailColumn title="Riskit"    items={set.risk}       color="#7a3010" />
      </div>
    </section>
  );
};

const RailColumn = ({ title, items, color }: { title: string; items: RailItem[]; color: string }) => (
  <div>
    <div className="font-mono text-[10px] uppercase tracking-[0.16em] mb-2" style={{ color }}>
      {title}
    </div>
    <ul className="flex flex-col gap-1.5">
      {items.map((it) => (
        <li key={it.k} className="flex items-center gap-2">
          <span className="text-[12px] text-ink min-w-[140px]">{it.n}</span>
          <div className="flex-1 h-1.5 rounded bg-ink/5 overflow-hidden">
            <div className="h-full rounded" style={{ width: `${it.w * 100}%`, background: color }} />
          </div>
          <span className="font-mono text-[10px] text-ink-mute w-8 text-right">
            {Math.round(it.w * 100)}
          </span>
        </li>
      ))}
    </ul>
  </div>
);
