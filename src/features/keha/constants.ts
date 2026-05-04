// Vakiot ja staattinen data Kehänavigaattorille (1:1 portti naviga-10-2.html:stä).
// Lähdekoodi: rivit 1086–1176.

export interface KehaCluster {
  id: string;
  name: string;
  slot: number;
  sectors: string[];
  cats: string[];
}

export const CLUSTERS: KehaCluster[] = [
  { id: "lapset_perhe",    name: "Lapset & perhe",            slot: 0,
    sectors: ["varhaiskasvatus","lastensuojelu"],            cats: ["lapset_perhe"] },
  { id: "koulutus_perus",  name: "Perusopetus",               slot: 1,
    sectors: ["perusopetus"],                                cats: ["koulutus"] },
  { id: "koulutus_korkea", name: "Korkeakoulutus & TKI",      slot: 2,
    sectors: ["toinen_aste","korkeakoulutus_tki"],           cats: [] },
  { id: "nuoret_tyo",      name: "Nuoret & työllisyys",       slot: 3,
    sectors: ["elinkeinot_tyollisyys","kulttuuri_liikunta_nuoriso"],
    cats: ["nuoret_tyollisyys","tyo_toimeentulo"] },
  { id: "asuminen",        name: "Asuminen",                  slot: 4,
    sectors: ["asuminen_yhdyskunta"],                        cats: ["asuminen_toimeentulo"] },
  { id: "elakkeet",        name: "Eläkkeet & sosiaaliturva",  slot: 5,
    sectors: ["elakkeet_sosiaaliturva"],                     cats: ["sosiaaliturva"] },
  { id: "ikaantyminen",    name: "Ikääntyminen & vammaisuus", slot: 6,
    sectors: ["vanhus_vammais"],                             cats: ["ikaantyminen","vammaisuus_kuntoutus"] },
  { id: "ymparisto",       name: "Ympäristö & ilmasto",       slot: 7,
    sectors: ["ymparisto_ilmasto"],                          cats: ["elinymparisto"] },
  { id: "infra",           name: "Liikenne & infra",          slot: 8,
    sectors: ["liikenne_infra"],                             cats: [] },
  { id: "hallinto",        name: "Hallinto & rakenne",        slot: 9,
    sectors: ["hallinto_yleinen","yhteisollisyys"],
    cats: ["rakenne_hyvinvointi","osallisuus"] },
  { id: "talous",          name: "Julkinen talous",           slot: 10,
    sectors: [],                                             cats: ["talous_julkinen_rahoitus"] },
  { id: "vaesto",          name: "Väestö & demografia",       slot: 11,
    sectors: [],                                             cats: ["vaesto_demografia"] },
  { id: "puolustus",       name: "Turvallisuus",              slot: 12,
    sectors: ["puolustus_jarjestys"],                        cats: [] },
  { id: "terveys",         name: "Terveys",                   slot: 13,
    sectors: ["somaattinen_th"],                             cats: ["terveys"] },
  { id: "mielenterveys",   name: "Mielenterveys & päihteet",  slot: 14,
    sectors: ["mielenterveys","paihdepalvelut"],             cats: ["mielenterveys_paihde"] },
];

// Hienostunut ikonisto — minimalistiset SVG-polut 20×20.
export const ICONS: Record<string, string> = {
  lapset_perhe:
    "M10 16 C10 16 4 11 4 7.5 C4 5.5 5.7 4 7.5 4 C8.8 4 10 4.9 10 4.9 C10 4.9 11.2 4 12.5 4 C14.3 4 16 5.5 16 7.5 C16 11 10 16 10 16Z",
  koulutus_perus:
    "M10 5 L10 16 M4 5 C4 5 7 4 10 5 M10 5 C13 4 16 5 16 5 L16 16 C13 15 10 16 10 16 C7 15 4 16 4 16 L4 5",
  koulutus_korkea:
    "M10 5 L17 9 L10 13 L3 9 Z M14 11 L14 16 M14 16 C14 16 12 17 10 17 C8 17 6 16 6 16 M6 11 L6 16",
  nuoret_tyo:
    "M10 4 L10 16 M5 9 L10 4 L15 9 M4 17 L16 17",
  asuminen:
    "M3 17 L3 9 L10 3 L17 9 L17 17 M7 17 L7 12 L13 12 L13 17",
  elakkeet:
    "M10 4 C8 4 6.5 5.5 6.5 7 C6.5 8.5 8 10 10 10 C12 10 13.5 8.5 13.5 7 C13.5 5.5 12 4 10 4Z M10 10 L10 17 M6 14 C6 14 7.5 16 10 16 C12.5 16 14 14 14 14",
  ikaantyminen:
    "M3 12 C3 12 5.5 6 8 6 C10.5 6 10.5 14 13 14 C15.5 14 17 9 17 9",
  ymparisto:
    "M10 3 C10 3 16 7 16 12 C16 15 13 17 10 17 C7 17 4 15 4 12 C4 7 10 3 10 3Z M10 17 L10 10 M10 10 L6 7",
  infra:
    "M3 14 L17 14 M7 14 C7 14 7 10 10 10 C13 10 13 14 13 14 M3 17 L3 14 M17 17 L17 14",
  hallinto:
    "M10 5 C10 5 6 5 6 9 C6 13 10 15 10 15 C10 15 14 13 14 9 C14 5 10 5 10 5Z M4 10 L6 9 M16 10 L14 9 M10 3 L10 5 M10 15 L10 17",
  talous:
    "M4 16 L4 10 L4 10 M8 16 L8 6 M12 16 L12 12 M16 16 L16 8 M3 16 L17 16",
  vaesto:
    "M6 8 C6 6.3 7.1 5 8.5 5 C9.9 5 11 6.3 11 8 M3 15 C3 12.8 5.2 11 8 11 M13 8 C13 6.3 14.1 5 15.5 5 C16.9 5 18 6.3 18 8 M10 15 C10 12.8 12.2 11 15 11",
  terveys:
    "M10 4 L10 16 M4 10 L16 10",
  mielenterveys:
    "M3 10 C3 10 5 5 7.5 5 C10 5 10 15 12.5 15 C15 15 17 10 17 10",
  puolustus:
    "M10 3 L4 6 L4 13 C4 15.5 6.7 17 10 18 C13.3 17 16 15.5 16 13 L16 6 Z",
};

// Muted earth tones — 15 sävyä.
export const PALETTE = [
  "#3d6b52","#4d6b3a","#6b6b30","#7a5f28","#7a4828",
  "#7a3530","#6b3050","#4a3878","#2a4878","#2a6070",
  "#2a6858","#4a5a3a","#5a4878","#6a3860","#3a4d3a",
];

// Kehän geometria.
export const W = 800, H = 800, CX = 400, CY = 400;
export const VB = 920;
export const R_OUTER = 345;
export const R_ICON = 128;
export const R_DOT_MIN = 168;
export const R_DISK = R_OUTER + 40;
export const LENS_R = 88;
export const ZOOM = 2.6;
export const DRAG_A = 0.82 * Math.PI;
