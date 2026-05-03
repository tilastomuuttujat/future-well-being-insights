// Pisteytyspohjainen auto-valitsija — portattu navigaattori-8-2.html:n
// autoSelect-funktiosta (rivit 1135–1251). Yksinkertaistettu: ei
// localStorage-muistia (lisätään myöhemmin Erässä 3).
import {
  CORNER_ROLE,
  Cluster,
  CornerId,
  Time,
  YEAR_MAX,
  YEAR_MIN,
  pseudoVal,
  viewsForRole,
} from "./constants";
import { Wake } from "./constants";

export interface AutoCtx {
  activeWake: Wake | null;
  activeTime: Time;
  activeYear: number;
  activeCluster: Cluster;
}

export interface AutoTopEntry {
  id: string;
  label: string;
  glyph: string;
  score: number;
  reason: string;
}

export interface AutoResult {
  id: string;
  reason: string;
  top: AutoTopEntry[];
}

export function autoSelect(role: CornerId, ctx: AutoCtx): AutoResult {
  const { activeWake, activeTime, activeCluster: c } = ctx;
  const candidates = viewsForRole(role).filter((v) => v.id !== "auto" && v.id !== "taulukko");

  const samples: number[] = [];
  for (let yr = YEAR_MIN; yr <= YEAR_MAX; yr += 10) {
    samples.push(pseudoVal(c.id, role + ":trend:" + yr));
  }
  const sMin = Math.min(...samples);
  const sMax = Math.max(...samples);
  const spread = (sMax - sMin) / Math.max(1, sMax);
  const slopeVal = samples[samples.length - 1] - samples[0];

  const score = (id: string) => {
    let s = 0;
    const reasons: string[] = [];

    if (role === "tl") {
      if (id === "trendi")          { s += 30; reasons.push("aikajatkumo on TL:n äidinkieli"); }
      if (id === "kumulatiivinen")  s += 12;
      if (id === "slope")           s += 10;
      if (id === "tripyykki")       s += 14;
      if (id === "vertailu")        s += 10;
      if (id === "numero")          s += 6;
      if (id === "vanavesi")        s += activeWake ? 18 : -10;
    }
    if (role === "tr") {
      if (id === "luotettavuus")    { s += 26; reasons.push("näyttöä luetaan tasona ja luottamusvälinä"); }
      if (id === "vertailu")        s += 22;
      if (id === "hajonta")         s += 16;
      if (id === "tripyykki")       s += 14;
      if (id === "numero")          s += 12;
      if (id === "trendi")          s += 10;
      if (id === "vanavesi")        s += activeWake ? 14 : -8;
    }
    if (role === "bl") {
      if (id === "pyramidi")        { s += 28; reasons.push("ihmisten kokoluokat näkyvät pyramidista"); }
      if (id === "kohorttivirta")   s += 22;
      if (id === "tripyykki")       s += 18;
      if (id === "vertailu")        s += 14;
      if (id === "trendi")          s += 10;
      if (id === "numero")          s += 8;
      if (id === "vanavesi")        s += activeWake ? 16 : -10;
    }
    if (role === "br") {
      if (id === "kausaali")        { s += 24; reasons.push("seurauksia luetaan ketjuna"); }
      if (id === "vanavesi")        { s += activeWake ? 30 : -20; if (activeWake) reasons.push("aktiivinen vanavesi havaittu"); }
      if (id === "skenaario")       s += 18;
      if (id === "tripyykki")       s += 14;
      if (id === "vertailu")        s += 12;
      if (id === "trendi")          s += 10;
      if (id === "numero")          s += 8;
    }

    if (activeTime === "past") {
      if (id === "kumulatiivinen" || id === "slope" || id === "trendi") { s += 6; reasons.push("painopiste menneisyydessä"); }
      if (id === "skenaario") s -= 6;
    } else if (activeTime === "future") {
      if (id === "skenaario" || id === "numero" || id === "kausaali") { s += 6; reasons.push("katse on tulevaisuudessa"); }
      if (id === "kumulatiivinen") s -= 4;
    } else {
      if (id === "vertailu" || id === "luotettavuus" || id === "pyramidi") s += 4;
    }

    if (c.level === "individual" && (id === "pyramidi" || id === "kausaali")) { s += 4; reasons.push("yksilötason klusteri"); }
    if (c.level === "society"    && (id === "trendi" || id === "kumulatiivinen" || id === "skenaario")) s += 4;
    if (c.level === "group"      && (id === "vertailu" || id === "kohorttivirta")) s += 4;

    if (c.fn === "korjaava" && (id === "kausaali" || id === "vanavesi")) s += 5;
    if (c.fn === "varautuminen" && (id === "luotettavuus" || id === "skenaario")) s += 5;
    if (c.fn === "vahvistava" && (id === "trendi" || id === "kumulatiivinen")) s += 4;

    if (spread > 0.55 && (id === "hajonta" || id === "vertailu")) { s += 5; reasons.push("datassa paljon hajontaa"); }
    if (Math.abs(slopeVal) > 30 && (id === "slope" || id === "trendi")) { s += 4; reasons.push("vahva trendi havaittu"); }

    return { s, reasons };
  };

  const scored = candidates
    .map((v) => {
      const { s, reasons } = score(v.id);
      return { v, s, reasons };
    })
    .sort((a, b) => b.s - a.s);

  const best = scored[0]?.v || candidates[0];
  const bestReasons = scored[0]?.reasons || [];
  const cause = bestReasons.length
    ? bestReasons.slice(0, 2).join(" · ")
    : `parhaiten istuva tapa lukea ${CORNER_ROLE[role].tag.toLowerCase()} -roolia`;
  const reason = `${best.label}: ${cause}.`;

  const tMax = Math.max(1, scored[0]?.s || 1);
  const tMin = Math.min(0, scored[scored.length - 1]?.s || 0);
  const tRange = Math.max(1, tMax - tMin);
  const top: AutoTopEntry[] = scored.slice(0, 3).map((x) => ({
    id: x.v.id,
    label: x.v.label,
    glyph: x.v.glyph,
    score: Math.round(((x.s - tMin) / tRange) * 100),
    reason: x.reasons.slice(0, 2).join(" · ") || x.v.hint || "",
  }));

  return { id: best.id, reason, top };
}

export const autoViewFor = (role: CornerId, ctx: AutoCtx) => autoSelect(role, ctx).id;
