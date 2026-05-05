// Hyvinvointi-ilmiöiden simulaattori — data ja kaava.
// Lähde: ilmiosim_standalone.html (prototyyppi A) +
// hyvinvointisimulaattori.html (kaava B). Painot ovat kirjallisuus-/dataestimaatteja,
// ei ennusteita. Kaava: ΔP = Σ ( w · ΔX_norm · |P_base| ) · timeFactor(lag, t).

export type Conf = "data" | "lit" | "spec";

export interface Phenomenon {
  label: string;
  unit: string;
  base: number;
  good: 1 | -1; // +1 = suurempi parempi, -1 = pienempi parempi
  short: string;
  color: string;
}

export interface Driver {
  label: string;
  unit: string;
  base: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}

export interface DriverLink {
  from: string;
  to: keyof typeof PHENOMENA;
  weight: number;
  lag: number;
  conf: Conf;
  r?: number;
  n?: number | null;
  note: string;
}

export interface PhenomLink {
  from: keyof typeof PHENOMENA;
  to: keyof typeof PHENOMENA;
  weight: number;
  conf: Conf;
  note: string;
}

export const PHENOMENA = {
  syntyvyys:  { label: "Syntyvyys (TFR)", unit: "lapsia/nainen", base: 1.26, good: +1 as 1, short: "TFR",       color: "#2f6b46" },
  lastensuoj: { label: "Lastensuojelu",   unit: "sij. 0–17‰",    base: 4.2,  good: -1 as -1, short: "Sij.",     color: "#a8401f" },
  neet:       { label: "Nuoret syrjässä", unit: "NEET %",        base: 11.4, good: -1 as -1, short: "NEET",     color: "#8a6510" },
  julktalous: { label: "Julk. talous",    unit: "velka % BKT",   base: 82.5, good: -1 as -1, short: "Velka",    color: "#4d3a78" },
  koulutus:   { label: "Erityistuki",     unit: "% oppilaista",  base: 10.3, good: -1 as -1, short: "Erit.tuki", color: "#2c5a8a" },
  eriarvois:  { label: "Eriarvoisuus",    unit: "Gini",          base: 28.4, good: -1 as -1, short: "Gini",     color: "#7a4a2a" },
} satisfies Record<string, Phenomenon>;

export type PhenomKey = keyof typeof PHENOMENA;

export const DRIVERS: Record<string, Driver> = {
  unemp:           { label: "Työttömyysaste",            unit: "%",   base: 7.5, min: 2,  max: 20,  step: 0.1,  fmt: (v) => `${v.toFixed(1)} %` },
  bkt:             { label: "BKT-kasvu",                 unit: "%",   base: 1.0, min: -8, max: 8,   step: 0.1,  fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} %` },
  gini:            { label: "Tuloero (Gini)",            unit: "",    base: 28,  min: 20, max: 40,  step: 0.1,  fmt: (v) => v.toFixed(1) },
  pdh:             { label: "Päivähoito-panostus",       unit: "ind", base: 1.0, min: 0.4, max: 1.8, step: 0.02, fmt: (v) => v.toFixed(2) },
  perus:           { label: "Perusopetus-panostus",      unit: "ind", base: 1.0, min: 0.4, max: 1.8, step: 0.02, fmt: (v) => v.toFixed(2) },
  lsk_p:           { label: "Lastensuojelupanos",        unit: "ind", base: 1.0, min: 0.4, max: 1.8, step: 0.02, fmt: (v) => v.toFixed(2) },
  nuor:            { label: "Nuorisotyö-panostus",       unit: "ind", base: 1.0, min: 0.4, max: 1.8, step: 0.02, fmt: (v) => v.toFixed(2) },
  mth:             { label: "MT-palvelut-panostus",      unit: "ind", base: 1.0, min: 0.4, max: 1.8, step: 0.02, fmt: (v) => v.toFixed(2) },
  exp_gdp:         { label: "Julk. menot % BKT",         unit: "%",   base: 77,  min: 45, max: 100, step: 0.5,  fmt: (v) => `${v.toFixed(1)} %` },
  asumiskust:      { label: "Asumiskustannukset",        unit: "ind", base: 1.0, min: 0.4, max: 2.5, step: 0.05, fmt: (v) => v.toFixed(2) },
  ansios:          { label: "Ansiosidonnainen",          unit: "ind", base: 1.0, min: 0.4, max: 1.6, step: 0.02, fmt: (v) => v.toFixed(2) },
  jaljella_vuokra: { label: "Lapsiperh. tulo (vuokran jälk.)", unit: "ind", base: 1.0, min: 0.5, max: 1.5, step: 0.02, fmt: (v) => v.toFixed(2) },
  omistus_vuokra:  { label: "Omistaja/vuokra-tulokuilu", unit: "ind", base: 1.0, min: 0.7, max: 1.5, step: 0.02, fmt: (v) => v.toFixed(2) },
  ansiotaso:       { label: "Ansiotasoindeksi",          unit: "ind", base: 1.0, min: 0.7, max: 1.5, step: 0.02, fmt: (v) => v.toFixed(2) },
};

export const LINKS: DriverLink[] = [
  // Syntyvyys
  { from: "unemp",           to: "syntyvyys",  weight: -0.28, lag: 12, conf: "data", r: 0.47, n: 23, note: "Pitkä viive 12v. Etumerkki ristiriidassa teorian kanssa." },
  { from: "gini",            to: "syntyvyys",  weight: -0.18, lag: 10, conf: "data", r: 0.43, n: 25, note: "Tuloero heikentää syntyvyyttä pitkällä aikavälillä." },
  { from: "asumiskust",      to: "syntyvyys",  weight: -0.35, lag: 2,  conf: "lit",  r: 0.50, n: null, note: "Asumiskustannukset, kirjallisuusnäyttö vahva." },
  { from: "ansios",          to: "syntyvyys",  weight: +0.20, lag: 1,  conf: "lit",  r: 0.30, n: null, note: "Vähentää taloudellista epävarmuutta." },
  { from: "jaljella_vuokra", to: "syntyvyys",  weight: +0.22, lag: 5,  conf: "data", r: 0.38, n: 12, note: "Lapsiperheille jäävä käytettävissä oleva tulo." },
  { from: "bkt",             to: "syntyvyys",  weight: +0.12, lag: 1,  conf: "spec", note: "Suhdannevaikutus, datassa heikko." },
  // Lastensuojelu
  { from: "unemp",           to: "lastensuoj", weight: +0.22, lag: 5,  conf: "data", r: 0.39, n: 30, note: "Työttömyys lisää sijoituksia 5v viiveellä." },
  { from: "pdh",             to: "lastensuoj", weight: -0.25, lag: 6,  conf: "data", r: 0.67, n: 29, note: "Päivähoito vähentää sijoituksia." },
  { from: "lsk_p",           to: "lastensuoj", weight: -0.15, lag: 6,  conf: "data", r: 0.56, n: 29, note: "Lastensuojelupanos." },
  { from: "mth",             to: "lastensuoj", weight: -0.20, lag: 6,  conf: "data", r: 0.67, n: 29, note: "MT-palvelut." },
  { from: "omistus_vuokra",  to: "lastensuoj", weight: +0.15, lag: 3,  conf: "data", r: 0.36, n: 33, note: "Asumisrakenteen eriarvoisuus." },
  // NEET
  { from: "unemp",           to: "neet",       weight: +0.55, lag: 0,  conf: "data", r: 0.85, n: 23, note: "Vahvin linkki mallissa." },
  { from: "bkt",             to: "neet",       weight: -0.30, lag: 1,  conf: "data", r: 0.63, n: 23, note: "BKT-lasku nostaa NEETiä." },
  { from: "nuor",            to: "neet",       weight: -0.18, lag: 6,  conf: "data", r: 0.48, n: 18, note: "Nuorisotyöpanostus." },
  { from: "ansiotaso",       to: "neet",       weight: -0.20, lag: 3,  conf: "data", r: 0.47, n: 19, note: "Reaalipalkkataso ja NEET." },
  // Julkinen talous
  { from: "unemp",           to: "julktalous", weight: +0.45, lag: 0,  conf: "data", r: 0.83, n: 34, note: "Työttömyys kasvattaa menoja." },
  { from: "exp_gdp",         to: "julktalous", weight: +0.38, lag: 0,  conf: "data", r: 0.70, n: 35, note: "Kokonaismenot ja velka." },
  { from: "bkt",             to: "julktalous", weight: -0.30, lag: 1,  conf: "data", r: 0.57, n: 34, note: "BKT-kasvu pienentää velkasuhdetta." },
  // Koulutus
  { from: "perus",           to: "koulutus",   weight: +0.25, lag: 3,  conf: "data", r: 0.70, n: 26, note: "⚠ Yhteinen trendi." },
  { from: "gini",            to: "koulutus",   weight: +0.20, lag: 2,  conf: "data", r: 0.41, n: 29, note: "Tuloerot ennakoivat erityistuen kasvua." },
  { from: "unemp",           to: "koulutus",   weight: +0.15, lag: 12, conf: "data", r: 0.39, n: 23, note: "Pitkä viive." },
  // Eriarvoisuus
  { from: "unemp",           to: "eriarvois",  weight: +0.25, lag: 7,  conf: "data", r: 0.46, n: 28, note: "Työttömyys kasvattaa eriarvoistumista." },
  { from: "exp_gdp",         to: "eriarvois",  weight: -0.28, lag: 1,  conf: "data", r: 0.54, n: 34, note: "Julkiset menot tasaavat." },
  { from: "omistus_vuokra",  to: "eriarvois",  weight: +0.20, lag: 6,  conf: "data", r: 0.36, n: 29, note: "Omistaja-vuokralaiskuilu." },
];

export const PHENOM_LINKS: PhenomLink[] = [
  { from: "eriarvois",  to: "syntyvyys",  weight: -0.20, conf: "lit",  note: "Eriarvoisuuden kasvu alentaa syntyvyyttä." },
  { from: "lastensuoj", to: "julktalous", weight: +0.15, conf: "data", note: "Sijoitusten kasvu lisää julkisia menoja." },
  { from: "neet",       to: "julktalous", weight: +0.20, conf: "lit",  note: "Syrjäytyminen kasvattaa sosiaaliturvamenoja." },
  { from: "koulutus",   to: "neet",       weight: +0.12, conf: "spec", note: "Erityistukitarve ennakoi NEETiä." },
  { from: "julktalous", to: "eriarvois",  weight: +0.12, conf: "spec", note: "Talouspaine voi heikentää tasaavia palveluita." },
];

export interface Scenario {
  name: string;
  desc: string;
  changes: Record<string, number>; // delta driverin baseen
}

export const SCENARIOS: Scenario[] = [
  { name: "Nuorten epävarmuus", desc: "Asuminen kallistuu, ansiosidonnainen leikkautuu",
    changes: { unemp: +3, asumiskust: +0.4, ansios: -0.2, nuor: -0.1, jaljella_vuokra: -0.15 } },
  { name: "Leikkaukset", desc: "Julkisia palveluita supistetaan",
    changes: { pdh: -0.25, perus: -0.2, lsk_p: -0.15, nuor: -0.2, mth: -0.15, exp_gdp: -5 } },
  { name: "Lama-skenaario", desc: "1990-laman tapainen sokki",
    changes: { bkt: -7, unemp: +8, exp_gdp: -5 } },
  { name: "Panostus lapsipalveluihin", desc: "Ehkäisevien palvelujen reaalikasvu +25 %",
    changes: { pdh: +0.25, perus: +0.15, nuor: +0.25, lsk_p: +0.10 } },
  { name: "Asuminen helpottuu", desc: "Lapsiperheille jäävä tulo paranee",
    changes: { asumiskust: -0.2, jaljella_vuokra: +0.15, ansiotaso: +0.1 } },
];

// ─── ENGINE ─────────────────────────────────────────────────────────
const DAMPING = 0.55;
const CHAIN_ITER = 2;

/** Painottaa lagin: vaikutus on suurin kun horisontti vastaa lagia. */
export function timeFactor(lag: number, t: number) {
  const denom = Math.max(lag, 3);
  return Math.max(0, Math.min(1, 1 - Math.abs(lag - t) / denom));
}

function clampPhenom(v: number, key: PhenomKey) {
  const ph = PHENOMENA[key];
  return Math.max(ph.base * 0.05, Math.min(ph.base * 3.5, v));
}

/** Laskee ilmiöiden arvot annetuilla driver-arvoilla ja aikahorisontilla. */
export function simulate(vars: Record<string, number>, t: number) {
  const phenom: Record<PhenomKey, number> = {} as Record<PhenomKey, number>;
  (Object.keys(PHENOMENA) as PhenomKey[]).forEach((k) => {
    phenom[k] = PHENOMENA[k].base;
  });

  // Driver → ilmiö
  for (const lnk of LINKS) {
    const d = DRIVERS[lnk.from];
    if (!d) continue;
    const norm = (vars[lnk.from] - d.base) / (d.max - d.min);
    const tf = timeFactor(lnk.lag, t);
    phenom[lnk.to] += norm * lnk.weight * Math.abs(PHENOMENA[lnk.to].base) * tf;
  }
  for (const k of Object.keys(phenom) as PhenomKey[]) phenom[k] = clampPhenom(phenom[k], k);

  // Ilmiö → ilmiö (vaimennettu)
  for (let it = 0; it < CHAIN_ITER; it++) {
    const upd: Partial<Record<PhenomKey, number>> = {};
    for (const lnk of PHENOM_LINKS) {
      const normDelta = (phenom[lnk.from] - PHENOMENA[lnk.from].base) / Math.abs(PHENOMENA[lnk.from].base);
      const impact = normDelta * lnk.weight * DAMPING * Math.abs(PHENOMENA[lnk.to].base);
      upd[lnk.to] = (upd[lnk.to] ?? 0) + impact;
    }
    for (const k of Object.keys(upd) as PhenomKey[]) {
      phenom[k] = clampPhenom(phenom[k] + (upd[k] ?? 0), k);
    }
  }
  return phenom;
}

/** Järjestelmäpaine: keskimääräinen suhteellinen poikkeama lähtötasosta. */
export function systemPressure(phenom: Record<PhenomKey, number>) {
  const keys = Object.keys(PHENOMENA) as PhenomKey[];
  const sum = keys.reduce((acc, k) => acc + Math.abs(phenom[k] - PHENOMENA[k].base) / Math.abs(PHENOMENA[k].base), 0);
  return sum / keys.length;
}

export const CONF_META: Record<Conf, { label: string; color: string; desc: string }> = {
  data: { label: "DATA", color: "#a8401f", desc: "Muutoskorrelaatio Suomen datasta 1990–2024" },
  lit:  { label: "LIT",  color: "#4d3a78", desc: "Kansainvälinen tutkimuskirjallisuus" },
  spec: { label: "SPEK", color: "#8a6510", desc: "Teoriaperustainen, heikko datapohja" },
};
