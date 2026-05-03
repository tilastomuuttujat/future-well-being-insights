// Vakiot ja staattinen data TTT-Navigaattorille.
// Lähteinä alkuperäinen prototyyppi navigaattori-8-2.html (rivit 978–1120).

export const YEAR_MIN = 1960;
export const YEAR_MAX = 2060;
export const YEAR_NOW = 2024;
export const PX_PER_YEAR = 22;
export const ROW_PX = 44;
export const SCALE_X_HEIGHT = 64;
export const SCALE_Y_WIDTH = 160;
export const FADE_DELAY = 1400;

export type Funktio = "vahvistava" | "varautuminen" | "korjaava";
export type Level = "individual" | "group" | "society";
export type Time = "past" | "now" | "future";
export type CornerId = "tl" | "tr" | "bl" | "br";

export const FN_COLOR: Record<Funktio, string> = {
  vahvistava: "#2f6b46",
  varautuminen: "#2c5a8a",
  korjaava: "#a8401f",
};
export const FN_LABEL: Record<Funktio, string> = {
  vahvistava: "Vahvistava",
  varautuminen: "Varautuminen",
  korjaava: "Korjaava",
};
export const LEVEL_LABELS: Record<Level, string> = {
  individual: "Yksilö",
  group: "Ryhmä",
  society: "Yhteiskunta",
};
export const TIME_LABELS: Record<Time, string> = {
  past: "Menneisyys",
  now: "Nykyisyys",
  future: "Tulevaisuus",
};
export const TIME_YEAR: Record<Time, number> = { past: 1990, now: 2024, future: 2040 };

export interface Cluster {
  id: string;
  label: string;
  fn: Funktio;
  level: Level;
}

export const CLUSTERS: Cluster[] = [
  { id: "elinkeinot",      label: "Elinkeinot & työllisyys",       fn: "vahvistava",   level: "society" },
  { id: "korkeakoulu",     label: "Korkeakoulutus & TKI",          fn: "vahvistava",   level: "society" },
  { id: "kulttuuri",       label: "Kulttuuri, liikunta & nuoriso", fn: "vahvistava",   level: "group" },
  { id: "perusopetus",     label: "Perusopetus",                   fn: "vahvistava",   level: "group" },
  { id: "toinen-aste",     label: "Toisen asteen koulutus",        fn: "vahvistava",   level: "group" },
  { id: "varhaiskasvatus", label: "Varhaiskasvatus",               fn: "vahvistava",   level: "individual" },
  { id: "mielenterveys",   label: "Mielenterveyspalvelut",         fn: "varautuminen", level: "individual" },
  { id: "paihteet",        label: "Päihdepalvelut",                fn: "varautuminen", level: "individual" },
  { id: "somaattinen",     label: "Somaattinen terveydenhuolto",   fn: "varautuminen", level: "individual" },
  { id: "elakkeet",        label: "Eläkkeet & sosiaaliturva",      fn: "korjaava",     level: "society" },
  { id: "lastensuojelu",   label: "Lastensuojelu",                 fn: "korjaava",     level: "individual" },
  { id: "vanhus",          label: "Vanhus- & vammaispalvelut",     fn: "korjaava",     level: "individual" },
];

export interface Wake {
  state: number;
  cohort: number;
  indiv: number;
  theme: string;
  clusters: string[];
}

export const WAKES: Wake[] = [
  { state: 2000, cohort: 2010, indiv: 2015, theme: "VAKA-laajennus → koulupolku → työelämä",
    clusters: ["varhaiskasvatus","perusopetus","toinen-aste"] },
  { state: 2010, cohort: 2020, indiv: 2025, theme: "Säästöt opetuksessa → oppimistulokset → työllistyminen",
    clusters: ["perusopetus","toinen-aste","mielenterveys"] },
  { state: 2015, cohort: 2025, indiv: 2030, theme: "Sote-valmistelu → palvelujen ruuhka → perheen arki",
    clusters: ["mielenterveys","somaattinen","lastensuojelu"] },
  { state: 2023, cohort: 2033, indiv: 2040, theme: "Hyvinvointialueet → hoivan saatavuus → omaishoito",
    clusters: ["vanhus","somaattinen","elakkeet"] },
  { state: 2030, cohort: 2040, indiv: 2050, theme: "Hoiva-investointi → eläköityminen → työkyky",
    clusters: ["elakkeet","vanhus","elinkeinot"] },
];

export const CORNER_ROLE = {
  tl: { tag: "Mistä tullaan",  hint: "Historiallinen kehys",  axis: "aika" },
  tr: { tag: "Mitä tiedetään", hint: "Todistuspohja & taso",  axis: "episteeminen" },
  bl: { tag: "Keitä koskee",   hint: "Kohde & sukupolvet",    axis: "sukupolvi" },
  br: { tag: "Mihin johtaa",   hint: "Seuraus & vanavesi",    axis: "funktio" },
} as const;
export const CORNERS: CornerId[] = ["tl", "tr", "bl", "br"];

export interface ViewDef {
  id: string;
  glyph: string;
  label: string;
  hint: string;
  roles?: CornerId[];
}

export const VIEWS: ViewDef[] = [
  { id: "auto",          glyph: "✦", label: "Auto",        hint: "Älykäs valinta lohkon roolin mukaan", roles: ["tl","tr","bl","br"] },
  { id: "tripyykki",     glyph: "△", label: "Triptyykki",  hint: "Kolmen kärjen tasapaino", roles: ["tl","tr","bl","br"] },
  { id: "trendi",        glyph: "∿", label: "Trendi",      hint: "Aikasarja: ennen → nyt → tulevaisuus", roles: ["tl","tr","bl","br"] },
  { id: "numero",        glyph: "#", label: "Numero",      hint: "Tiivistetty indeksiluku", roles: ["tl","tr","bl","br"] },
  { id: "vertailu",      glyph: "▥", label: "Vertailu",    hint: "Tasovertailu", roles: ["tl","tr","bl","br"] },
  { id: "vanavesi",      glyph: "≈", label: "Vanavesi",    hint: "Päätös → kohortti → yksilö -viive", roles: ["tl","tr","bl","br"] },
  { id: "slope",         glyph: "╱", label: "Kaltevuus",   hint: "Ennen → nyt -kallistuma", roles: ["tl"] },
  { id: "kumulatiivinen",glyph: "⏃", label: "Kumulatiivi", hint: "Kertyvä historia", roles: ["tl"] },
  { id: "luotettavuus",  glyph: "◐", label: "Luotettavuus",hint: "Näytön taso ja CI", roles: ["tr"] },
  { id: "hajonta",       glyph: "∴", label: "Hajonta",     hint: "Lähteiden välinen hajonta", roles: ["tr"] },
  { id: "pyramidi",      glyph: "▽", label: "Pyramidi",    hint: "Väestöpyramidi", roles: ["bl"] },
  { id: "kohorttivirta", glyph: "⇶", label: "Kohorttivirta",hint:"Ikäluokat ajan virrassa", roles: ["bl"] },
  { id: "skenaario",     glyph: "⋋", label: "Skenaario",   hint: "Tulevaisuusviuhka", roles: ["br"] },
  { id: "kausaali",      glyph: "→", label: "Kausaaliketju",hint: "Päätös → seuraus → vaikutus", roles: ["br"] },
  { id: "taulukko",      glyph: "▦", label: "Taulukko",    hint: "Numerot taulukkona", roles: ["tl","tr","bl","br"] },
];

export const viewsForRole = (role: CornerId) =>
  VIEWS.filter((v) => !v.roles || v.roles.includes(role));

export const yearToWorldX = (y: number) => (y - YEAR_NOW) * PX_PER_YEAR;
export const worldXToYear = (x: number) => x / PX_PER_YEAR + YEAR_NOW;
export const WORLD_X_MIN = yearToWorldX(YEAR_MIN);
export const WORLD_X_MAX = yearToWorldX(YEAR_MAX);
export const WORLD_Y_MIN = 0;
export const WORLD_Y_MAX = (CLUSTERS.length - 1) * ROW_PX;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function findActiveWake(cluster: Cluster, year: number): Wake | null {
  let best: Wake | null = null;
  let bestDist = Infinity;
  for (const wk of WAKES) {
    if (!wk.clusters.includes(cluster.id)) continue;
    const d = Math.min(
      Math.abs(year - wk.state),
      Math.abs(year - wk.cohort),
      Math.abs(year - wk.indiv),
    );
    if (d < bestDist) { bestDist = d; best = wk; }
  }
  return bestDist <= 4 ? best : null;
}

// Deterministinen pseudo-arvo solmun datalle (sama hash kuin alkuperäisessä).
export function pseudoVal(clusterId: string, key: string): number {
  let h = 0;
  const s = clusterId + "|" + key;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 20 + (h % 80);
}
