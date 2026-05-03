import { useEffect } from "react";
import { Link } from "react-router-dom";

/**
 * Täyskokoinen interaktiivinen TTT-Navigaattori (klusteri × aika × vanavesi).
 *
 * Alkuperäinen prototyyppi (`navigaattori-8-2.html`) on ~4400 rivin itsenäinen
 * canvas/SVG-sovellus, jolla on oma tilakone, URL-sync ja näkymäjärjestelmä.
 * Se on tässä vaiheessa upotettu sellaisenaan iframella `public/`-kansiosta —
 * näin saamme sen elävänä Reittiin ja GitHub-repoon ilman riskialtista
 * porttausta. Komponenttipohjainen jälleenrakennus tehdään palasina myöhemmin.
 */
const NavigaattoriKartta = () => {
  useEffect(() => {
    document.title = "V-Signal · Navigaattori-kartta";
  }, []);

  const src = `${import.meta.env.BASE_URL}navigaattori-kartta.html`;

  return (
    <div className="px-5 py-8 max-w-6xl mx-auto">
      <header className="mb-4 flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <p className="eyebrow mb-2">Vaihe 2 · Interaktiivinen kartta</p>
          <h1 className="font-serif text-3xl text-ink">
            Klusteri × Aika × Vanavesi
          </h1>
        </div>
        <Link
          to="/navigaattori"
          className="font-mono text-[11px] text-ink-mute hover:text-gold"
        >
          ← takaisin yleisnäkymään
        </Link>
      </header>

      <div className="paper p-2 overflow-hidden">
        <iframe
          src={src}
          title="TTT-Navigaattori"
          className="w-full block border-0 rounded"
          style={{ height: "min(94vh, 1000px)" }}
          loading="lazy"
        />
      </div>

      <p className="text-[11px] text-ink-mute font-mono mt-3">
        Upotettu prototyyppi · navigaattori-8-2.html
      </p>
    </div>
  );
};

export default NavigaattoriKartta;
