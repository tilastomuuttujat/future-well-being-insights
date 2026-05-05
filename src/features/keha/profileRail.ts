// Profiilirail: suojaavat ja riskitekijät elämänvaiheen + alueen mukaan.
// Lähde: naviga-10-2.html (rail-osio). Synteettinen tiivistys.

export interface RailItem { k: string; n: string; w: number; }
export interface RailSet { protective: RailItem[]; risk: RailItem[]; }

const BASE: Record<string, RailSet> = {
  lapset: {
    protective: [
      { k: "neuvola", n: "Neuvolan kattavuus", w: 0.9 },
      { k: "vaka",    n: "Varhaiskasvatus",    w: 0.85 },
      { k: "perhe",   n: "Vanhempien tuki",    w: 0.8 },
    ],
    risk: [
      { k: "koyhyys",  n: "Lapsiköyhyys",       w: 0.75 },
      { k: "lassu",    n: "Lastensuojelutarve", w: 0.6 },
      { k: "asunto",   n: "Asumisen ahtaus",    w: 0.5 },
    ],
  },
  nuoret: {
    protective: [
      { k: "koulu",    n: "Koulukokemus",        w: 0.85 },
      { k: "harraste", n: "Harrastusmahdollisuus", w: 0.8 },
      { k: "kaveri",   n: "Vertaissuhteet",      w: 0.75 },
    ],
    risk: [
      { k: "neet",     n: "NEET-riski",            w: 0.8 },
      { k: "mt",       n: "Mielenterveyskuorma",   w: 0.85 },
      { k: "paihde",   n: "Päihteet",              w: 0.55 },
    ],
  },
  tyoikainen: {
    protective: [
      { k: "tyo",      n: "Vakaa työ",             w: 0.85 },
      { k: "tulo",     n: "Riittävä toimeentulo",  w: 0.8 },
      { k: "verkosto", n: "Sosiaalinen verkosto",  w: 0.7 },
    ],
    risk: [
      { k: "uupumus",  n: "Työuupumus",            w: 0.75 },
      { k: "velka",    n: "Velkaantuminen",        w: 0.6 },
      { k: "yksinaisyys", n: "Yksinäisyys",        w: 0.55 },
    ],
  },
  elakeikainen: {
    protective: [
      { k: "elake",    n: "Riittävä eläke",        w: 0.85 },
      { k: "terveys",  n: "Toimintakyky",          w: 0.85 },
      { k: "yhteiso",  n: "Yhteisöllisyys",        w: 0.7 },
    ],
    risk: [
      { k: "yksin",    n: "Yksinäisyys",           w: 0.7 },
      { k: "krooniset", n: "Krooniset sairaudet",  w: 0.65 },
      { k: "digi",     n: "Digisyrjäytyminen",     w: 0.5 },
    ],
  },
  vanhuusikainen: {
    protective: [
      { k: "hoiva",    n: "Hoivan saatavuus",      w: 0.9 },
      { k: "kotihoito", n: "Kotihoidon laatu",     w: 0.85 },
      { k: "laheinen", n: "Läheisten tuki",        w: 0.75 },
    ],
    risk: [
      { k: "muisti",   n: "Muistisairaus",         w: 0.8 },
      { k: "kaatumiset", n: "Kaatumiset",          w: 0.65 },
      { k: "yksin",    n: "Yksinäisyys",           w: 0.7 },
    ],
  },
};

export function getRailSet(phase: string, area: string): RailSet {
  const base = BASE[phase] || BASE.tyoikainen;
  // Maaseudulla yksinäisyys & digi painaa enemmän, kaupungissa asuminen.
  const af = area === "maaseutu" ? 1.12 : area === "kaupunki" ? 0.92 : 1;
  const adj = (it: RailItem): RailItem => ({
    ...it,
    w: Math.min(1, +(it.w * (it.k.includes("yksin") || it.k === "digi" ? af : 1)).toFixed(2)),
  });
  return {
    protective: base.protective.map(adj),
    risk: base.risk.map(adj),
  };
}

// Arjen vaikutuslistat investoinnin kohdistuessa eri väestöryhmiin.
export const EVERYDAY_IMPACT: Record<string, string[]> = {
  lapset: [
    "Neuvolakäynnit toteutuvat ajallaan",
    "Varhaiskasvatuksen ryhmäkoot pienenevät",
    "Lastensuojelun perhetyö ehtii ennakoiden",
    "Koulun tukiopetus on saatavilla",
  ],
  nuoret: [
    "Nuorisotakuun jonotus lyhenee",
    "Mielenterveyspalveluun pääsee viikossa",
    "Etsivä nuorisotyö tavoittaa NEET-nuoret",
    "Toiselle asteelle siirtymä sujuu tuetusti",
  ],
  tyoikainen: [
    "Työterveyden ennaltaehkäisy paranee",
    "Lyhytterapiajonot lyhenevät",
    "Velkaneuvonta saatavilla matalalla kynnyksellä",
    "Aikuiskoulutus joustaa työn rinnalla",
  ],
  elakeikainen: [
    "Senioriyhteisöjen toiminta vahvistuu",
    "Liikuntaneuvonta tavoittaa eläkkeellesiirtyjät",
    "Digiopastusta saa lähikirjastosta",
    "Ennakoiva kotikäynti 75 v. iässä",
  ],
  vanhuusikainen: [
    "Kotihoidon käyntien kesto riittää",
    "Muistineuvolan resurssi laajenee",
    "Omaishoitajien vapaat toteutuvat",
    "Tehostetun palveluasumisen jonotus lyhenee",
  ],
};
