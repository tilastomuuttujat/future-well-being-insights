/**
 * Navigaattori-data: klusteri × aika × vanavesi.
 *
 * Solmut edustavat järjestelmän osia (palveluja, etuuksia, mekanismeja).
 * Sijainti aikaikkunassa (1985–2045) ja klusterissa määrittää näkyvyyden
 * Navigaattori-sivulla. Funktio ja vanavesi ohjaavat värin.
 *
 * Data on suunnittelukäytössä mock — tuotannossa korvataan
 * v_signal_navigator-näkymällä joka aggregoi reseptien tulokset.
 */

export type Funktio = "vahvistava" | "varautuminen" | "korjaava";
export type Vanavesi = "individual" | "cohort" | "state";
export type Klusteri =
  | "lapsi"
  | "nuori"
  | "tyoika"
  | "ikaantyva"
  | "rakenne";

export interface NavNode {
  id: string;
  label: string;
  klusteri: Klusteri;
  funktio: Funktio;
  vanavesi: Vanavesi;
  yearFrom: number;
  yearTo: number;
  severity: 1 | 2 | 3;          // 1 vakaa, 3 kriittinen
  recipeIds: string[];          // kytkös /reseptit/:id
  note: string;
}

export const KLUSTERIT: Record<Klusteri, { label: string; row: number }> = {
  lapsi:     { label: "Lapsi (0–12)",      row: 0 },
  nuori:     { label: "Nuori (13–25)",     row: 1 },
  tyoika:    { label: "Työikä (26–63)",    row: 2 },
  ikaantyva: { label: "Ikääntyvä (64+)",   row: 3 },
  rakenne:   { label: "Rakenne / poikkileikkaus", row: 4 },
};

export const FUNKTIOT: Record<Funktio, { label: string; color: string }> = {
  vahvistava:    { label: "Vahvistava",    color: "var(--fn-vahvistava)" },
  varautuminen:  { label: "Varautuminen",  color: "var(--fn-varautuminen)" },
  korjaava:      { label: "Korjaava",      color: "var(--fn-korjaava)" },
};

export const VANAVEDET: Record<Vanavesi, { label: string; color: string }> = {
  individual: { label: "Yksilö",        color: "var(--wake-individual)" },
  cohort:     { label: "Kohortti",      color: "var(--wake-cohort)" },
  state:      { label: "Valtio / järj.", color: "var(--wake-state)" },
};

export const NAV_NODES: NavNode[] = [
  // Lapsi
  { id: "neuvola", label: "Neuvola", klusteri: "lapsi", funktio: "vahvistava", vanavesi: "individual",
    yearFrom: 1985, yearTo: 2045, severity: 1, recipeIds: ["leverage", "lifecycle"],
    note: "Suomen vahvin varhainen vahvistava palvelu — eniten leverage-pisteitä." },
  { id: "varhaiskasvatus", label: "Varhaiskasvatus", klusteri: "lapsi", funktio: "vahvistava", vanavesi: "cohort",
    yearFrom: 1996, yearTo: 2045, severity: 1, recipeIds: ["leverage", "counterfactual"],
    note: "Subjektiivinen oikeus 1996. Counterfactualin mukaan myöhästyneet lapset näkyvät 16-vuotiaina nuorisotyöttöminä." },
  { id: "lastensuojelu", label: "Lastensuojelu", klusteri: "lapsi", funktio: "korjaava", vanavesi: "state",
    yearFrom: 1985, yearTo: 2045, severity: 3, recipeIds: ["funding_paradox", "trend"],
    note: "Rahoitus +180 % 2000–2024, sijoitukset eivät vähene. Klassinen funding paradox." },

  // Nuori
  { id: "koulupsykologi", label: "Koulupsykologi", klusteri: "nuori", funktio: "varautuminen", vanavesi: "individual",
    yearFrom: 2000, yearTo: 2045, severity: 2, recipeIds: ["leverage", "data_gap"],
    note: "Tarjonta vajaa, datan katve kuntien välillä." },
  { id: "opiskeluterveys", label: "Opiskeluterveys", klusteri: "nuori", funktio: "varautuminen", vanavesi: "cohort",
    yearFrom: 1990, yearTo: 2045, severity: 2, recipeIds: ["elasticity", "leverage"],
    note: "Ylireagoiva (ε > 1) — yksi euro lisää tuottaa enemmän kuin sektorin keskiarvo." },
  { id: "nuorisotakuu", label: "Nuorisotakuu", klusteri: "nuori", funktio: "korjaava", vanavesi: "state",
    yearFrom: 2013, yearTo: 2045, severity: 2, recipeIds: ["policy_lag", "comparison_pair"],
    note: "Päätös 2013, vaikutusten vertailu 2000-luvun kohorttiin näkyy vasta 2025+." },

  // Työikä
  { id: "tyoterveys", label: "Työterveys", klusteri: "tyoika", funktio: "varautuminen", vanavesi: "individual",
    yearFrom: 1985, yearTo: 2045, severity: 1, recipeIds: ["data_gap", "elasticity"],
    note: "Yksityinen + julkinen — datan katve julkiselle päätöksenteolle." },
  { id: "mielenterveys_avo", label: "Mielenterveys (avo)", klusteri: "tyoika", funktio: "korjaava", vanavesi: "individual",
    yearFrom: 1995, yearTo: 2045, severity: 3, recipeIds: ["elasticity", "drift", "counterfactual"],
    note: "ε = 1.42 (ylireagoiva). Drift 2045: nykytrendi +75 %, voimakas interventio +30 %." },
  { id: "tyokyvyttomyys", label: "Työkyvyttömyyseläkkeet", klusteri: "tyoika", funktio: "korjaava", vanavesi: "state",
    yearFrom: 1985, yearTo: 2045, severity: 3, recipeIds: ["counterfactual", "policy_lag"],
    note: "30–40 v. policy lag — tämän päivän virhe näkyy eläkemenoissa 2055." },

  // Ikääntyvä
  { id: "kotihoito", label: "Kotihoito", klusteri: "ikaantyva", funktio: "varautuminen", vanavesi: "individual",
    yearFrom: 2000, yearTo: 2045, severity: 2, recipeIds: ["elasticity", "leverage"],
    note: "Lähes yhdenmukainen kysynnälle (ε ≈ 1)." },
  { id: "vanhuspalvelut", label: "Vanhuspalvelut (laitos)", klusteri: "ikaantyva", funktio: "korjaava", vanavesi: "state",
    yearFrom: 1985, yearTo: 2045, severity: 3, recipeIds: ["drift", "elasticity", "trend"],
    note: "Jäykkä (ε = 0.18). Drift 2045: kapasiteettivaje 30 % nykytrendillä." },

  // Rakenne
  { id: "sote", label: "SOTE-uudistus", klusteri: "rakenne", funktio: "varautuminen", vanavesi: "state",
    yearFrom: 2023, yearTo: 2045, severity: 2, recipeIds: ["policy_lag", "trend"],
    note: "Toteutusviive 8–12 v. — vaikutukset näkyvät indikaattoreissa 2031+." },
  { id: "tulonsiirrot", label: "Tulonsiirtojärjestelmä", klusteri: "rakenne", funktio: "korjaava", vanavesi: "cohort",
    yearFrom: 1985, yearTo: 2045, severity: 2, recipeIds: ["funding_paradox", "comparison_pair"],
    note: "Kohorttien välinen siirtymä — 1970-luvun ja 2000-luvun syntyneet eri elämänvaiheessa." },
];

export const NAV_YEARS_MIN = 1985;
export const NAV_YEARS_MAX = 2045;
