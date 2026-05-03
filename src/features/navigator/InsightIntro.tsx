import { useEffect, useMemo, useState } from "react";
import {
  CORNERS,
  CORNER_ROLE,
  Cluster,
  Time,
  TIME_LABELS,
  Wake,
} from "./constants";
import { autoSelect } from "./auto";

interface Props {
  cluster: Cluster;
  time: Time;
  year: number;
  wake: Wake | null;
}

const STORAGE_KEY = "nav-insight-dismissed-v1";

/**
 * InsightIntro — pieni banneri, joka selittää miksi nämä neljä linssiä
 * on valittu juuri tähän kontekstiin. Käyttäjä voi sulkea pysyvästi.
 */
export const InsightIntro = ({ cluster, time, year, wake }: Props) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  const reasons = useMemo(() => {
    const ctx = { activeCluster: cluster, activeTime: time, activeYear: year, activeWake: wake };
    return CORNERS.map((corner) => {
      const r = autoSelect(corner, ctx);
      return { corner, role: CORNER_ROLE[corner], view: r.id, reason: r.reason };
    });
  }, [cluster.id, time, year, wake?.theme]);

  if (dismissed) return null;

  return (
    <div className="paper p-4 mb-4 border-l-2 border-gold/60">
      <div className="flex items-baseline justify-between mb-2">
        <p className="eyebrow text-gold">Miksi tämä näkymä</p>
        <button
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          className="font-mono text-[10px] text-ink-mute hover:text-gold"
          aria-label="Piilota selitys pysyvästi"
        >Piilota ✕</button>
      </div>
      <p className="font-serif text-[15px] text-ink leading-snug mb-2">
        Lukkari "{cluster.label}" vuonna {year} ({TIME_LABELS[time]}){wake ? `, vanavesi: ${wake.theme}` : ""}.
      </p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono text-ink-mute">
        {reasons.map((r) => (
          <li key={r.corner}>
            <span className="text-ink-faint">{r.corner.toUpperCase()}</span>{" "}
            <span className="text-ink">{r.role.tag}</span> · {r.reason}
          </li>
        ))}
      </ul>
    </div>
  );
};
