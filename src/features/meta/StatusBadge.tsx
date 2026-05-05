import { Status } from "./data";

const LABELS: Record<Status, string> = {
  ok: "ok",
  partial: "osittain",
  missing: "puuttuu",
};

const COLORS: Record<Status, { bg: string; fg: string; bd: string }> = {
  ok:      { bg: "rgba(47,107,70,0.10)",  fg: "var(--fn-vahvistava)", bd: "var(--fn-vahvistava)" },
  partial: { bg: "rgba(138,101,16,0.10)", fg: "var(--gold)",          bd: "var(--gold)" },
  missing: { bg: "rgba(168,64,31,0.10)",  fg: "var(--fn-korjaava)",   bd: "var(--fn-korjaava)" },
};

export const StatusBadge = ({ status, label }: { status: Status; label?: string }) => {
  const c = COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase tracking-[0.14em]"
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.bd}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.fg }} />
      {label ?? LABELS[status]}
    </span>
  );
};
