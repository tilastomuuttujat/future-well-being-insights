import { CLUSTER_PATHS, PATH_META, type Path } from "./pathScores";

interface Props {
  cid: string | undefined | null;
}

/**
 * Pieni 4-polun score-rivi. Näyttää klusterin A/T/E/U -indeksit
 * suhteellisina palkkeina (lähtötaso 50). Tyhjä jos cid puuttuu / data ei
 * vielä peitä klusteria.
 */
export const PathScore = ({ cid }: Props) => {
  const scores = cid ? CLUSTER_PATHS[cid] : undefined;
  if (!scores) return null;
  const max = Math.max(...(Object.values(scores) as number[]));
  const paths: Path[] = ["A", "T", "E", "U"];
  return (
    <div className="border border-ink/10 rounded p-2 mt-2 bg-paper-deep/40">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          Polut · A/T/E/U
        </span>
        <span className="font-mono text-[9px] text-ink-faint">indeksi · 50 = lähtö</span>
      </div>
      <div className="flex flex-col gap-1">
        {paths.map((p) => {
          const v = scores[p];
          const m = PATH_META[p];
          const w = (v / Math.max(max, 80)) * 100;
          const delta = v - 50;
          return (
            <div key={p} className="grid grid-cols-[16px_1fr_36px] items-center gap-2">
              <span className="font-mono text-[10px] font-semibold" style={{ color: m.color }}>{p}</span>
              <div className="h-2 rounded overflow-hidden" style={{ background: "rgba(26,29,36,0.06)" }}>
                <div className="h-full rounded" style={{ width: `${w}%`, background: m.color, opacity: 0.85 }} />
              </div>
              <span className="font-mono text-[10px] text-right"
                style={{ color: delta > 0 ? "var(--fn-vahvistava)" : delta < 0 ? "var(--fn-korjaava)" : "var(--ink-mute)" }}>
                {delta > 0 ? "+" : ""}{delta}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
