// Synteettinen pistedata Kehänavigaattorille.
// Kun Supabase-yhteys on käytössä, korvaa generateRaw() oikealla haulla.
import { CLUSTERS, KehaCluster } from "./constants";

export type Source = "sector" | "indicator";

export interface RawPoint {
  id: string;
  name: string;
  source: Source;
  rawKey: string;
  kategoria_id?: string;
  cid: string;
  cname: string;
  ccol: string;
  value: number | null;
  unit: string;
  latestYear?: number;
  roi?: number | null;
}

// Deterministinen hash jotta layout on stabiili.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const SECTOR_NAMES: Record<string, string> = {
  varhaiskasvatus: "Varhaiskasvatusmenot",
  lastensuojelu: "Lastensuojelumenot",
  perusopetus: "Perusopetusmenot",
  toinen_aste: "Toisen asteen menot",
  korkeakoulutus_tki: "Korkeakoulu- & TKI-menot",
  elinkeinot_tyollisyys: "Elinkeino- & työllisyysmenot",
  kulttuuri_liikunta_nuoriso: "Kulttuuri- & nuorisomenot",
  asuminen_yhdyskunta: "Asumis- & yhdyskuntamenot",
  elakkeet_sosiaaliturva: "Eläke- & sosiaaliturvamenot",
  vanhus_vammais: "Vanhus- & vammaispalvelumenot",
  ymparisto_ilmasto: "Ympäristö- & ilmastomenot",
  liikenne_infra: "Liikenne- & infrapalvelumenot",
  hallinto_yleinen: "Yleishallinnon menot",
  yhteisollisyys: "Yhteisöllisyysmenot",
  puolustus_jarjestys: "Puolustus- & järjestysmenot",
  somaattinen_th: "Somaattisen TH:n menot",
  mielenterveys: "Mielenterveysmenot",
  paihdepalvelut: "Päihdepalvelumenot",
};

const INDICATOR_NAMES: Record<string, string[]> = {
  lapset_perhe: ["Lapsiköyhyysaste", "Toimeentulotuen lapset", "Päivähoidon kattavuus"],
  koulutus: ["PISA-tulokset", "Koulupudokkaat", "Lukutaitoindeksi"],
  nuoret_tyollisyys: ["Nuorisotyöttömyys", "NEET-aste"],
  tyo_toimeentulo: ["Pitkäaikaistyöttömät", "Mediaanitulo"],
  asuminen_toimeentulo: ["Asunnottomuus", "Asumiskustannus/tulot"],
  sosiaaliturva: ["Sosiaaliturvakorvaukset", "Köyhyysriski"],
  ikaantyminen: ["75+ huoltosuhde", "Hoivapaikat/1000"],
  vammaisuus_kuntoutus: ["Kuntoutusjonot", "Apuvälineiden kattavuus"],
  elinymparisto: ["Ilmanlaatuindeksi", "Vihreä lähialue %"],
  rakenne_hyvinvointi: ["Palvelujen yhdenvertaisuus"],
  osallisuus: ["Äänestysaktiivisuus", "Yhdistystoiminta"],
  talous_julkinen_rahoitus: ["Velka/BKT", "Verokertymä"],
  vaesto_demografia: ["Syntyvyys", "Maahanmuutto netto"],
  terveys: ["Elinajan odote", "Terveyspalvelujonot", "Lihavuusaste"],
  mielenterveys_paihde: ["Mielenterveyshoitojonot", "Päihdekuolleisuus", "Itsemurhat"],
};

export function generateRaw(): RawPoint[] {
  const out: RawPoint[] = [];
  for (const cl of CLUSTERS) {
    // Sektorit
    cl.sectors.forEach((sec) => {
      const h = hash(`s|${cl.id}|${sec}`);
      out.push({
        id: `s_${sec}`,
        name: SECTOR_NAMES[sec] || sec,
        source: "sector",
        rawKey: sec,
        cid: cl.id,
        cname: cl.name,
        ccol: "",
        value: Math.round((50 + (h % 9500)) / 10) * 10,
        unit: "M€",
        latestYear: 2022 + (h % 3),
        roi: ((h >>> 4) % 400 - 100) / 100,
      });
    });
    // Indikaattorit per kategoria
    cl.cats.forEach((cat) => {
      const names = INDICATOR_NAMES[cat] || [`Indikaattori (${cat})`];
      names.forEach((nm, i) => {
        const h = hash(`i|${cl.id}|${cat}|${nm}|${i}`);
        out.push({
          id: `i_${cl.id}_${cat}_${i}`,
          name: nm,
          source: "indicator",
          rawKey: nm,
          kategoria_id: cat,
          cid: cl.id,
          cname: cl.name,
          ccol: "",
          value: Math.round((h % 1000) / 10) / 10,
          unit: "%",
          latestYear: 2021 + (h % 4),
          roi: ((h >>> 6) % 300 - 50) / 100,
        });
      });
    });
    // Pieni hajontasarja täytteeksi (3-6 anonyymiä pistettä), jotta keilaan tulee massaa.
    const fillN = 3 + (hash(cl.id) % 4);
    for (let k = 0; k < fillN; k++) {
      const h = hash(`f|${cl.id}|${k}`);
      out.push({
        id: `f_${cl.id}_${k}`,
        name: `${cl.name} · alaerä ${k + 1}`,
        source: k % 2 === 0 ? "indicator" : "sector",
        rawKey: `${cl.id}_${k}`,
        cid: cl.id,
        cname: cl.name,
        ccol: "",
        value: Math.round((h % 800) / 10),
        unit: k % 2 === 0 ? "%" : "M€",
        latestYear: 2020 + (h % 5),
        roi: null,
      });
    }
  }
  return out;
}

// Sijoittele pisteet kunkin klusterin omaan 24°-keilaan Fibonacci-hajauttajalla.
export interface PlacedPoint {
  d: RawPoint;
  sx: number;
  sy: number;
  cluster: KehaCluster;
}

export function placePoints(
  raw: RawPoint[],
  opts: { CX: number; CY: number; R_DOT_MIN: number; R_OUTER: number },
): PlacedPoint[] {
  const PHI = Math.PI * (3 - Math.sqrt(5));
  const N = CLUSTERS.length;
  const STEP = (2 * Math.PI) / N;
  const START = -Math.PI / 2;

  const byC: Record<string, RawPoint[]> = {};
  CLUSTERS.forEach((c) => (byC[c.id] = []));
  for (const d of raw) (byC[d.cid] || (byC[d.cid] = [])).push(d);

  const out: PlacedPoint[] = [];
  for (const cl of CLUSTERS) {
    const inds = byC[cl.id] || [];
    const n = inds.length;
    if (!n) continue;
    const midA = START + cl.slot * STEP;
    const halfSpan = STEP * 0.45;
    const rMin = opts.R_DOT_MIN;
    const rMax = opts.R_OUTER - 14;

    inds.forEach((d, i) => {
      const t = n === 1 ? 0.5 : (i + 0.5) / n;
      const r = rMin + (rMax - rMin) * Math.sqrt(t);
      const aNorm = ((i * PHI) % (2 * halfSpan)) - halfSpan;
      const a = midA + aNorm;
      let sx = opts.CX + r * Math.cos(a);
      let sy = opts.CY + r * Math.sin(a);
      const dist = Math.hypot(sx - opts.CX, sy - opts.CY);
      const sc = dist > opts.R_OUTER - 9 ? (opts.R_OUTER - 9) / dist : 1;
      sx = opts.CX + (sx - opts.CX) * sc;
      sy = opts.CY + (sy - opts.CY) * sc;
      out.push({ d, sx, sy, cluster: cl });
    });
  }
  return out;
}

export interface SeedInfo {
  cluster: KehaCluster;
  midAngle: number;
  ix: number;
  iy: number;
  col: string;
  n: number;
  span: number;
}

export function buildSeeds(
  counts: Record<string, number>,
  palette: string[],
  opts: { CX: number; CY: number; R_ICON: number },
): SeedInfo[] {
  const N = CLUSTERS.length;
  const STEP = (2 * Math.PI) / N;
  const START = -Math.PI / 2;
  return CLUSTERS.map((cl) => {
    const midA = START + cl.slot * STEP;
    return {
      cluster: cl,
      midAngle: midA,
      ix: opts.CX + opts.R_ICON * Math.cos(midA),
      iy: opts.CY + opts.R_ICON * Math.sin(midA),
      col: palette[cl.slot % palette.length],
      n: counts[cl.id] || 0,
      span: STEP,
    };
  });
}
