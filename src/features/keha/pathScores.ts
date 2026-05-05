// A/T/E/U-polkujen vertailu klustereille.
// Lähde: hyvinvointi_v43.html (proton "score-strip"). Indeksi 0..100,
// jossa 50 = lähtötaso. >50 = parempi, <50 = heikompi. Staattinen otos
// — vaihe 3:ssa korvataan v_signal-näkymällä.

export type Path = "A" | "T" | "E" | "U";

export interface PathScores {
  A: number; // toteutunut
  T: number; // teoria (ROI-painotettu)
  E: number; // empiria (vertailumaat)
  U: number; // oma — täytetään käyttäjän valinnoista myöhemmin
}

export const PATH_META: Record<Path, { label: string; sub: string; color: string }> = {
  A: { label: "Toteutunut",  sub: "havaittu kehitys",          color: "var(--ink)" },
  T: { label: "Teoria",      sub: "ROI-painotettu allokaatio", color: "#2c5a8a" },
  E: { label: "Empiria",     sub: "vertailumaat",              color: "#2f6b46" },
  U: { label: "Oma",         sub: "käyttäjän painotus",        color: "var(--gold)" },
};

// Klusterikohtaiset polkupisteet. Skaalattu niin, että A=50 on lähtötaso.
// Lähde: V-Signalin Vaihe 1 -näkymät (counterfactual, leverage). Otos —
// päivittyy kun fact_intervention_evidence täydentyy.
export const CLUSTER_PATHS: Record<string, PathScores> = {
  lapset_perhe:    { A: 50, T: 68, E: 62, U: 55 },
  koulutus_perus:  { A: 50, T: 64, E: 60, U: 53 },
  koulutus_korkea: { A: 50, T: 58, E: 56, U: 52 },
  nuoret_tyo:      { A: 50, T: 72, E: 65, U: 58 },
  asuminen:        { A: 50, T: 60, E: 55, U: 50 },
  elakkeet:        { A: 50, T: 52, E: 54, U: 50 },
  ikaantyminen:    { A: 50, T: 66, E: 60, U: 55 },
  ymparisto:       { A: 50, T: 58, E: 60, U: 52 },
  infra:           { A: 50, T: 55, E: 53, U: 50 },
  hallinto:        { A: 50, T: 53, E: 52, U: 50 },
  talous:          { A: 50, T: 56, E: 55, U: 51 },
  vaesto:          { A: 50, T: 51, E: 51, U: 50 },
  puolustus:       { A: 50, T: 50, E: 51, U: 50 },
  terveys:         { A: 50, T: 65, E: 62, U: 56 },
  mielenterveys:   { A: 50, T: 74, E: 68, U: 60 },
};
