import { useMemo } from "react";
import { autoSelect } from "./auto";
import {
  CLUSTERS,
  CORNERS,
  CORNER_ROLE,
  CornerId,
  Cluster,
  FN_COLOR,
  Time,
  Wake,
} from "./constants";

interface Props {
  cluster: Cluster;
  time: Time;
  year: number;
  wake: Wake | null;
  views: Record<CornerId, string>;
}

/**
 * CoveragePanel — näyttää kuinka hyvin neljä kulmanäkymää kattavat
 * aktiivisen klusterin roolit. Käyttää autoSelectin top-3-pisteytystä:
 * korkein normalisoitu pistemäärä = 100% kattavuus.
 */
export const CoveragePanel = ({ cluster, time, year, wake, views }: Props) => {
  const ctx = { activeCluster: cluster, activeTime: time, activeYear: year, activeWake: wake };

  const rows = useMemo(() => {
    return CORNERS.map((corner) => {
      const auto = autoSelect(corner, ctx);
      const current = views[corner] === "auto" ? auto.id : views[corner];
      const inTop = auto.top.find((t) => t.id === current);
      const score = inTop?.score ?? 35; // ei top-3:ssa → vajaa kattavuus
      return {
        corner,
        role: CORNER_ROLE[corner],
        view: current,
        autoView: auto.id,
        score,
        isAuto: views[corner] === "auto",
        reason: inTop?.reason || auto.reason,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster.id, time, year, wake?.theme, views.tl, views.tr, views.bl, views.br]);

  const overall = Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length);
  const fn = FN_COLOR[cluster.fn];

  return (
    <div className="paper p-3">
      <div className="flex items-baseline justify-between mb-2">
        <p className="eyebrow">Kattavuus</p>
        <span className="font-mono text-[11px] text-ink">
          <span style={{ color: fn }}>●</span> {overall}%
        </span>
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.corner} className="flex items-center gap-2 text-[10px] font-mono">
            <span className="w-6 text-ink-faint uppercase">{r.corner}</span>
            <span className="w-20 text-ink-mute truncate">{r.role.tag}</span>
            <div className="flex-1 h-1.5 bg-ink/5 rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${r.score}%`, background: fn, opacity: r.isAuto ? 0.9 : 0.55 }}
              />
            </div>
            <span className="w-10 text-right text-ink-mute">{r.score}%</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] font-mono text-ink-faint mt-2 leading-snug">
        Kattavuus mittaa kuinka hyvin valittu linssi vastaa kulman roolia tämänhetkisessä kontekstissa.
        Lukittu linssi voi laskea kattavuutta — palaa "Älykäs" saadaksesi täyden katteen.
      </p>
    </div>
  );
};
