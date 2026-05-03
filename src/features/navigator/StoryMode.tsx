import { useEffect, useRef, useState } from "react";
import { CLUSTERS, ROW_PX, yearToWorldX } from "./constants";
import { useNavStore } from "./store";

/**
 * Story mode — ohjattu esitysreitti TTT-Navigaattorin läpi.
 * Jokainen kohtaus liikuttaa keskustaa (klusteri × vuosi) ja näyttää
 * narratiivin. Käyttäjä voi pysäyttää ja siirtyä askel kerrallaan.
 */
interface Beat {
  cluster: string;
  year: number;
  title: string;
  body: string;
}

const STORY: Beat[] = [
  { cluster: "varhaiskasvatus", year: 2000, title: "Vanavesi alkaa", body: "VAKA-laajennus 2000 → ensimmäiset vahvat kohortit lähtevät koulupolulle." },
  { cluster: "perusopetus",     year: 2010, title: "Säästöjen jälki",  body: "2010-luvun säästöt muokkaavat oppimistuloksia ja kohorttien valmiuksia." },
  { cluster: "toinen-aste",     year: 2020, title: "Siirtymä työhön",  body: "Kohortit kohtaavat työelämän — koulutuspolun pohja näkyy nyt." },
  { cluster: "mielenterveys",   year: 2024, title: "Ruuhkautuminen",   body: "Sote-valmistelun jälkijäristys: palvelujen ruuhka kasaantuu nuoriin aikuisiin." },
  { cluster: "vanhus",          year: 2033, title: "Hoivan painopiste",body: "Hyvinvointialueet kohtaavat suurten ikäluokkien hoivakohortin." },
  { cluster: "elakkeet",        year: 2050, title: "Pitkä vanavesi",   body: "Eläköityminen ja työkyky määrittävät yhteiskunnan kantokyvyn." },
];

const TICK_MS = 4500;

export const StoryMode = () => {
  const [active, setActive] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const setCenter = useNavStore((s) => s.setCenter);
  const timerRef = useRef<number | null>(null);

  // Kun kohtaus vaihtuu, siirrä karttaa
  useEffect(() => {
    if (!active) return;
    const beat = STORY[idx];
    const row = CLUSTERS.findIndex((c) => c.id === beat.cluster);
    if (row >= 0) setCenter(yearToWorldX(beat.year), row * ROW_PX);
  }, [active, idx, setCenter]);

  // Ajastin
  useEffect(() => {
    if (!playing) return;
    timerRef.current = window.setTimeout(() => {
      setIdx((i) => (i + 1 >= STORY.length ? 0 : i + 1));
    }, TICK_MS);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [playing, idx]);

  if (!active) {
    return (
      <button
        onClick={() => { setActive(true); setIdx(0); setPlaying(true); }}
        className="font-mono text-[11px] text-ink-mute hover:text-gold border border-ink/10 rounded-full px-3 py-1"
      >
        ▶ Tarinatila
      </button>
    );
  }

  const beat = STORY[idx];
  return (
    <div className="paper p-3 flex items-center gap-3 w-full">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          className="font-mono text-xs text-ink-mute hover:text-gold px-2"
          aria-label="Edellinen"
        >‹</button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="font-mono text-xs text-ink hover:text-gold border border-ink/10 rounded px-2 py-0.5"
        >{playing ? "⏸" : "▶"}</button>
        <button
          onClick={() => setIdx((i) => Math.min(STORY.length - 1, i + 1))}
          className="font-mono text-xs text-ink-mute hover:text-gold px-2"
          aria-label="Seuraava"
        >›</button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="eyebrow text-gold">{idx + 1}/{STORY.length} · {beat.year}</p>
        <p className="font-serif text-sm text-ink leading-tight truncate">{beat.title}</p>
        <p className="text-[11px] font-mono text-ink-mute leading-snug truncate">{beat.body}</p>
      </div>
      <div className="flex items-center gap-1">
        {STORY.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: i === idx ? "var(--gold, #8a6510)" : "rgba(26,29,36,0.18)" }}
            aria-label={`Kohtaus ${i + 1}`}
          />
        ))}
      </div>
      <button
        onClick={() => { setActive(false); setPlaying(false); }}
        className="font-mono text-[10px] text-ink-mute hover:text-gold ml-1"
        aria-label="Sulje tarinatila"
      >✕</button>
    </div>
  );
};
