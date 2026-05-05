// Tietokannan kokonaisarvio — staattinen kuvaus V-Signalin datakerroksesta.
// Lähde: ttt_kokonaisarvio.jsx (prototyyppi). Päivitettävä kun kanta muuttuu.

export type Status = "ok" | "partial" | "missing";

export interface InfraItem {
  area: string;
  detail: string;
  status: Status;
  note?: string;
}

export interface DataTable {
  name: string;
  rows: number | null; // null → ei tiedossa, käytetään live-fallbackia
  status: Status;
  desc: string;
  source?: string;
}

export interface CoverageRow {
  label: string;
  pct: number;
  note?: string;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  status: Status;
  bullets: string[];
}

export const INFRASTRUCTURE: InfraItem[] = [
  {
    area: "Supabase-projekti",
    detail: "yjkabgtbcgvrfqtewtna · julkinen anon-key",
    status: "ok",
    note: "Sama kuin V-Signalin alkuperäinen prototyyppi, RLS suojaa kirjoitukset.",
  },
  {
    area: "Pohja-skripti",
    detail: "db/sql/phase2_v_signal_views.sql",
    status: "ok",
    note: "Itsenäinen — luo pohjataulut + 4 analyysinäkymää, ei oleta Lovable Cloudia.",
  },
  {
    area: "React-asiakas",
    detail: "src/lib/supabase.ts · @supabase/supabase-js",
    status: "ok",
    note: "useSignalView-hook tarjoaa cachetuksen react-queryllä (5 min stale).",
  },
  {
    area: "Edge Functions",
    detail: "ei käytössä",
    status: "missing",
    note: "Kaikki laskenta tehdään SQL-näkymissä tai selaimessa.",
  },
];

export const DATA_TABLES: DataTable[] = [
  {
    name: "v_segment_panel",
    rows: 90,
    status: "ok",
    desc: "Segmenttipaneeli 1995–2024 (3 segmenttiä × 30 v.).",
    source: "Esimerkkidata · korvattavissa Tilastokeskus/THL-syötteellä",
  },
  {
    name: "v_intervention_simulation",
    rows: 160,
    status: "ok",
    desc: "Toteuma vs. counterfactual 1985–2024.",
    source: "Esimerkkidata",
  },
  {
    name: "fact_intervention_evidence",
    rows: 6,
    status: "partial",
    desc: "Interventioiden ROI elinkaarivaiheittain.",
    source: "Esimerkkidata · vahvistettava RCT-evidenssillä",
  },
  {
    name: "fact_policy_decisions",
    rows: 4,
    status: "partial",
    desc: "Hallituksen päätökset → indikaattori-mappays.",
    source: "Käsin koottu otos · laajennettava HE-rekisteriin",
  },
  {
    name: "fact_policy_lag_model",
    rows: 6,
    status: "partial",
    desc: "Sektorikohtainen lag-jakauma (vuosia).",
  },
  {
    name: "dim_indicator",
    rows: 4,
    status: "partial",
    desc: "Indikaattorisanasto.",
  },
  {
    name: "v_signal_counterfactual",
    rows: 160,
    status: "ok",
    desc: "Näkymä: toteuma vs. ajoissa toteutettu interventio.",
  },
  {
    name: "v_signal_drift",
    rows: 198,
    status: "ok",
    desc: "Näkymä: trendi-ekstrapolaatio 2024 → 2045 (3 polkua).",
  },
  {
    name: "v_signal_leverage",
    rows: 6,
    status: "ok",
    desc: "Näkymä: ROI evidence_strength ≥ 2 -suodatuksella.",
  },
  {
    name: "v_signal_policy_lag",
    rows: 24,
    status: "ok",
    desc: "Näkymä: päätös → toteutusviive → mitattava tulos.",
  },
];

export const COVERAGE_SEGMENTS: CoverageRow[] = [
  { label: "Mielenterveys", pct: 78, note: "1995–2024 · avokäynnit, jonot, alkavuudet" },
  { label: "Vanhuspalvelut", pct: 84, note: "Laitos- ja kotihoitopaikat" },
  { label: "TULES", pct: 62, note: "Työterveyden datakatve" },
  { label: "Lastensuojelu", pct: 70 },
  { label: "Koulutus", pct: 88 },
];

export const COVERAGE_INDICATORS: CoverageRow[] = [
  { label: "Avokäynnit / 1000 as.", pct: 92 },
  { label: "Työkyvyttömyysalkavuus", pct: 88 },
  { label: "Lastensuojelun sijoitukset", pct: 80 },
  { label: "Vanhuspalvelujen laitospaikat", pct: 86 },
];

export const COVERAGE_YEARS: CoverageRow[] = [
  { label: "1985–1994", pct: 45, note: "Vain rakenneindikaattorit" },
  { label: "1995–2009", pct: 78 },
  { label: "2010–2019", pct: 92 },
  { label: "2020–2024", pct: 86, note: "Viimeisimmät vuodet osin alustavia" },
];

// Klusterikohtainen kattavuus Kehän chipiä varten (cid → 0..1).
export const CLUSTER_COVERAGE: Record<string, number> = {
  lapset_perhe: 0.78,
  koulutus_perus: 0.90,
  koulutus_korkea: 0.82,
  nuoret_tyo: 0.74,
  asuminen: 0.62,
  elakkeet: 0.88,
  ikaantyminen: 0.84,
  ymparisto: 0.55,
  infra: 0.60,
  hallinto: 0.68,
  talous: 0.92,
  vaesto: 0.95,
  puolustus: 0.50,
  terveys: 0.86,
  mielenterveys: 0.78,
};

export const KNOWN_GAPS: string[] = [
  "Työterveyden ja yksityisen palvelukäytön mikrodata puuttuu (~1/3 työikäisten käytöstä).",
  "Hallituksen päätös-rekisteri (HE-tunnukset) vain otos — ei vielä koneluettavaa täyslähdettä.",
  "Vertailumaiden ROI-evidenssi ei vielä yhdistetty fact_intervention_evidence -tauluun.",
  "Alueellinen erottelu kaupunki/taajama/maaseutu nojautuu kertoimiin, ei mikrodataan.",
  "Edge Functions -laskenta puuttuu — kaikki johdannaiset ovat SQL-näkymissä tai asiakkaassa.",
];

export const ROADMAP: RoadmapPhase[] = [
  {
    phase: "Vaihe 1",
    title: "Pohja & 4 ydintä",
    status: "ok",
    bullets: [
      "Pohjataulut + esimerkkidata",
      "Counterfactual-, drift-, leverage- ja policy-lag-näkymät",
      "useSignalView-hook + asiakaspolku",
    ],
  },
  {
    phase: "Vaihe 2",
    title: "Kehä & navigaattori",
    status: "ok",
    bullets: [
      "15 klusteria · sektorimenot ja indikaattorit",
      "Profiiliperusteinen korostus (väestöryhmä × asema × alue)",
      "Decade-lens + investointimallinnus",
    ],
  },
  {
    phase: "Vaihe 3",
    title: "Live-data & laajennus",
    status: "partial",
    bullets: [
      "Korvataan esimerkkidata Tilastokeskus/THL/Kela-syötteillä",
      "HE-päätösten täysrekisteri",
      "Alueellinen mikrodata (kunta/hyvinvointialue)",
    ],
  },
  {
    phase: "Vaihe 4",
    title: "Edge & jakelu",
    status: "missing",
    bullets: [
      "Edge Functions raskaammille laskuille",
      "Avoimet rajapinnat (ulkoiset analyytikot)",
      "Versiointi ja muutoshistoria näkymille",
    ],
  },
];
