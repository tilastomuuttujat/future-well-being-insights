// Vuosikymmenlinssi: data, profiili-pohjaiset 1980→2024 -aikasarjat ja ROI-malli.
// Lähde: naviga-10-2.html rivit 3140-3903.

export const DECADE_YEARS = [1980, 1990, 2000, 2010, 2020, 2024];

export interface DecadeFix {
  shockMult: number;
  shockYears: number;
  payoffYears: number;
  lifeBoost: number;
}

export interface DecadeProfile {
  label: string;
  actual: number[];
  need: number[];
  takeaway: string;
  fix: DecadeFix;
}

export const DECADE_PROFILES: Record<string, DecadeProfile> = {
  lapset: {
    label: "Lapset",
    actual: [105, 118, 128, 132, 138, 134],
    need:   [100, 112, 124, 138, 156, 168],
    takeaway: "Lapsiperheiden panostus on jäänyt jälkeen tarpeen kasvusta — varhaiskasvatus, neuvolat ja lastensuojelu venyvät.",
    fix: { shockMult: 2.4, shockYears: 3, payoffYears: 12, lifeBoost: 0.8 },
  },
  nuoret: {
    label: "Nuoret",
    actual: [100, 110, 122, 130, 142, 138],
    need:   [100, 108, 120, 140, 168, 180],
    takeaway: "Nuorten mielenterveys ja koulutuspolut: tarve kasvanut nopeasti, järjestelmä reagoinut hitaasti.",
    fix: { shockMult: 2.6, shockYears: 3, payoffYears: 9, lifeBoost: 1.2 },
  },
  tyoikainen: {
    label: "Työikäiset",
    actual: [100, 112, 124, 130, 138, 140],
    need:   [100, 116, 128, 134, 144, 148],
    takeaway: "Työikäisten kohdalla panostus ja tarve ovat kulkeneet käsi kädessä — vajaus pieni mutta sitkeä.",
    fix: { shockMult: 1.8, shockYears: 2, payoffYears: 7, lifeBoost: 0.9 },
  },
  elakeikainen: {
    label: "Eläkeikäiset",
    actual: [100, 124, 152, 184, 220, 238],
    need:   [100, 122, 148, 178, 210, 224],
    takeaway: "Eläkeläisten panostus on kasvanut tarvetta nopeammin — järjestelmä on suosinut tätä kohorttia.",
    fix: { shockMult: 1.2, shockYears: 2, payoffYears: 14, lifeBoost: 0.4 },
  },
  vanhuusikainen: {
    label: "Vanhuusikäiset",
    actual: [100, 126, 158, 196, 240, 262],
    need:   [100, 130, 168, 218, 282, 314],
    takeaway: "Vanhuusikäisten hoivatarve kasvaa väestön ikääntyessä nopeammin kuin panostus ehtii — vajaus syvenee.",
    fix: { shockMult: 2.2, shockYears: 3, payoffYears: 10, lifeBoost: 0.7 },
  },
};

export const AREA_FACTOR: Record<string, number> = {
  kaupunki: 0.92,
  taajama: 1.0,
  maaseutu: 1.12,
};

export interface DecadeData {
  phase: string;
  label: string;
  actual: number[];
  need: number[];
  deltas: number[];
  currentDelta: number;
  currentPct: number;
  cum: number;
  fix: DecadeFix;
  takeaway: string;
}

export function getDecadeData(phase: string, area: string): DecadeData {
  const base = DECADE_PROFILES[phase] || DECADE_PROFILES.tyoikainen;
  const af = AREA_FACTOR[area] || 1;
  const need = base.need.map((v) => Math.round(v * af));
  const actual = base.actual.slice();
  const deltas = actual.map((a, i) => a - need[i]);
  const currentDelta = deltas[deltas.length - 1];
  const currentNeed = need[need.length - 1];
  const currentPct = currentDelta / currentNeed;
  const cum = deltas.reduce(
    (s, d, i) => s + d * (i === 0 || i === deltas.length - 1 ? 0.5 : 1),
    0,
  );
  return {
    phase, label: base.label, actual, need, deltas,
    currentDelta, currentPct, cum, fix: base.fix, takeaway: base.takeaway,
  };
}

export interface RoiPoint { t: number; annual: number; cum: number; }
export interface RoiResult {
  series: RoiPoint[];
  gap: number;
  payback: number | null;
  N: number;
  fx: DecadeFix;
}

export function computeRoi(data: DecadeData): RoiResult | null {
  const gap = Math.max(0, -data.currentDelta);
  if (gap === 0) return null;
  const fx = data.fix;
  const N = fx.shockYears + fx.payoffYears + 4;
  const series: RoiPoint[] = [];
  let cum = 0;
  let payback: number | null = null;
  for (let t = 0; t <= N; t++) {
    let annual: number;
    if (t < fx.shockYears) {
      annual = gap * fx.shockMult;
    } else {
      const k = (t - fx.shockYears) / fx.payoffYears;
      annual = gap * (1 - k * (1 + fx.lifeBoost));
    }
    cum += annual;
    if (payback === null && t > fx.shockYears && cum <= 0) payback = t;
    series.push({ t, annual, cum });
  }
  return { series, gap, payback, N, fx };
}
