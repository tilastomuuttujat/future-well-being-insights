import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavStore } from "./store";
import {
  CLUSTERS,
  CORNERS,
  CornerId,
  ROW_PX,
  VIEWS,
  clamp,
  worldXToYear,
  yearToWorldX,
  YEAR_MAX,
  YEAR_MIN,
} from "./constants";

const VALID_VIEW_IDS = new Set(VIEWS.map((v) => v.id));

/**
 * Synkronoi navigator-tilan URL-parametreihin (?y, ?c, ?lens, ?tl, ?tr, ?bl, ?br).
 *
 * - URL → store kerran ladattaessa (jos URL:ssä on parametreja).
 * - Store → URL muutoksilla (replace, ei spammaa historiaa).
 */
export function useNavigatorUrlSync() {
  const [params, setParams] = useSearchParams();
  const cx = useNavStore((s) => s.cx);
  const cy = useNavStore((s) => s.cy);
  const views = useNavStore((s) => s.views);
  const lensMode = useNavStore((s) => s.lensMode);
  const hydrate = useNavStore((s) => s.hydrate);
  const hydrated = useRef(false);

  // URL → store (kerran)
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const patch: Parameters<typeof hydrate>[0] = {};
    const y = params.get("y");
    if (y) {
      const yr = clamp(parseInt(y), YEAR_MIN, YEAR_MAX);
      if (Number.isFinite(yr)) patch.cx = yearToWorldX(yr);
    }
    const c = params.get("c");
    if (c) {
      const idx = CLUSTERS.findIndex((x) => x.id === c);
      if (idx >= 0) patch.cy = idx * ROW_PX;
    }
    const lens = params.get("lens");
    if (lens === "auto" || lens === "lock") patch.lensMode = lens;
    const v: Partial<Record<CornerId, string>> = {};
    CORNERS.forEach((corner) => {
      const val = params.get(corner);
      if (val && VALID_VIEW_IDS.has(val)) v[corner] = val;
    });
    if (Object.keys(v).length) patch.views = v as Record<CornerId, string>;
    if (Object.keys(patch).length) hydrate(patch);
  }, [params, hydrate]);

  // Store → URL
  useEffect(() => {
    if (!hydrated.current) return;
    const next = new URLSearchParams(params);
    const yr = Math.round(worldXToYear(cx));
    next.set("y", String(yr));
    const row = clamp(Math.round(cy / ROW_PX), 0, CLUSTERS.length - 1);
    next.set("c", CLUSTERS[row].id);
    next.set("lens", lensMode);
    CORNERS.forEach((corner) => {
      if (views[corner] && views[corner] !== "auto") next.set(corner, views[corner]);
      else next.delete(corner);
    });
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cx, cy, lensMode, views.tl, views.tr, views.bl, views.br]);
}
