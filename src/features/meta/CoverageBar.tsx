interface Props {
  label: string;
  pct: number; // 0..100
  note?: string;
}

export const CoverageBar = ({ label, pct, note }: Props) => {
  const w = Math.max(0, Math.min(100, pct));
  const color =
    w >= 80 ? "var(--fn-vahvistava)" : w >= 60 ? "var(--gold)" : "var(--fn-korjaava)";
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[13px] text-ink">{label}</span>
        <span className="font-mono text-[11px] text-ink-mute">{w.toFixed(0)} %</span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(26,29,36,0.08)" }}
      >
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
      {note && <div className="font-mono text-[10px] text-ink-faint mt-1">{note}</div>}
    </div>
  );
};
