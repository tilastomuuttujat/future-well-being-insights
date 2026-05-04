// Profiilidata: elämänvaihe, sosioekonominen asema, aluetabit.
// Lähde: naviga-10-2.html rivit 2899-2956.

import { PlacedPoint, RawPoint } from "./data";

export interface ElamanvaiheItem { k: string; n: string; cl: string[]; }
export interface AsemaItem { k: string; n: string; cl: string[]; }
export interface AreaTab { k: string; n: string; sub: string; }

export const ELAMANVAIHE: ElamanvaiheItem[] = [
  { k: "lapset",         n: "Lapset",         cl: ["lapset_perhe","koulutus_perus"] },
  { k: "nuoret",         n: "Nuoret",         cl: ["nuoret_tyo","koulutus_perus","mielenterveys"] },
  { k: "tyoikainen",     n: "Työikäiset",     cl: ["nuoret_tyo","mielenterveys","terveys","asuminen"] },
  { k: "elakeikainen",   n: "Eläkeikäiset",   cl: ["elakkeet","terveys","ikaantyminen"] },
  { k: "vanhuusikainen", n: "Vanhuusikäiset", cl: ["ikaantyminen","elakkeet","terveys"] },
];

export const ASEMA: AsemaItem[] = [
  { k: "opiskelija",  n: "Opiskelija",          cl: ["koulutus_korkea","koulutus_perus","asuminen"] },
  { k: "tyollinen",   n: "Työllinen",           cl: ["nuoret_tyo","talous"] },
  { k: "yrittaja",    n: "Yrittäjä",            cl: ["talous","nuoret_tyo"] },
  { k: "tyoton",      n: "Työtön",              cl: ["nuoret_tyo","elakkeet","mielenterveys"] },
  { k: "elakkeella",  n: "Eläkkeellä",          cl: ["elakkeet","ikaantyminen","terveys"] },
  { k: "tyoelaman_ulkopuolella", n: "Työelämän ulkopuolella", cl: ["mielenterveys","terveys","elakkeet"] },
];

export const AREA_TABS: AreaTab[] = [
  { k: "kaupunki", n: "Kaupunki", sub: "tiivis, palvelut lähellä" },
  { k: "taajama",  n: "Taajama",  sub: "keskikoko, sekä-että" },
  { k: "maaseutu", n: "Maaseutu", sub: "harva, etäisyys ratkaisee" },
];

export interface Profile {
  elamanvaihe: string;
  asema: string | null;
  area: string;
}

export const DEFAULT_PROFILE: Profile = {
  elamanvaihe: "tyoikainen",
  asema: null,
  area: "kaupunki",
};

/** Yhdistää aktiivisten ankkurien klusterit korostussetiksi. */
export function highlightedClusters(profile: Profile): Set<string> {
  const out = new Set<string>();
  const e = ELAMANVAIHE.find((x) => x.k === profile.elamanvaihe);
  e?.cl.forEach((c) => out.add(c));
  if (profile.asema) {
    const a = ASEMA.find((x) => x.k === profile.asema);
    a?.cl.forEach((c) => out.add(c));
  }
  return out;
}

/** Löydökset-paneelin pisteet: korostetuista klustereista, lajiteltu sektoreihin ensin. */
export function findingsForProfile(pts: PlacedPoint[], profile: Profile): RawPoint[] {
  const hl = highlightedClusters(profile);
  if (!hl.size) return [];
  return pts
    .filter((p) => hl.has(p.d.cid))
    .map((p) => p.d)
    .sort((a, b) => {
      if (a.source !== b.source) return a.source === "sector" ? -1 : 1;
      return a.cname.localeCompare(b.cname, "fi");
    });
}
