// Vaikutusmatriisi: sektori × indikaattori → β-kerroin.
// Lähde: hyvinvointi_v43.html (proton "heatmap"). Otoskerroinmatriisi —
// vaihe 3:ssa korvataan v_signal_impact_matrix-näkymällä.

export const SECTORS = [
  "Päivähoito",
  "Perusopetus",
  "Lastensuojelu",
  "Nuorisotyö",
  "MT-palvelut",
  "Erikoissair.h.",
  "Iäkkäiden palvelut",
  "Asumisen tuki",
] as const;

export const INDICATORS = [
  "TFR",
  "NEET",
  "Sijoitukset",
  "Erityistuki",
  "Eriarvoisuus",
  "Velka%BKT",
] as const;

// β-kerroin: vaikutus indikaattoriin kun sektoriin lisätään 10 % panostus.
// Etumerkki indikaattorin "hyvä suunta" -konventiolla: + = parantaa, - = heikentää.
// Skaala ~ -0.5..+0.5.
export const IMPACT: number[][] = [
  // PDH    PERUS  LSK    NUOR   MTH    ESH    VAN    ASUM
  [ 0.18,  0.10,  0.05,  0.06,  0.08, -0.02, -0.01,  0.22 ], // TFR
  [ 0.20,  0.28,  0.12,  0.34,  0.18,  0.00,  0.00,  0.10 ], // NEET
  [ 0.32,  0.18,  0.20,  0.14,  0.26,  0.02,  0.00,  0.08 ], // Sijoitukset
  [ 0.22,  0.30,  0.10,  0.12,  0.16,  0.02, -0.01,  0.04 ], // Erityistuki
  [ 0.10,  0.12,  0.06,  0.08,  0.10,  0.04,  0.06,  0.18 ], // Eriarvoisuus
  [-0.06, -0.08, -0.04, -0.05, -0.04, -0.10, -0.12, -0.06 ], // Velka%BKT (panostus = lisämeno)
];
