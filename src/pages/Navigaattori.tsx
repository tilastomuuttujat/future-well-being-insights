import { useEffect } from "react";

const Navigaattori = () => {
  useEffect(() => {
    document.title = "V-Signal · Navigaattori";
  }, []);

  return (
    <div className="px-5 py-16 max-w-4xl mx-auto">
      <p className="eyebrow mb-3">Vaihe 2 · tulossa</p>
      <h1 className="font-serif text-4xl sm:text-5xl text-ink mb-4">Navigaattori</h1>
      <p className="lede mb-8 text-lg">
        Klusteri × aika × vanavesi -kartta, jossa funktiot (vahvistava / varautuminen /
        korjaava) ja kohorttisolmut yhdistyvät elinkaarivirtaan. Counterfactual- ja
        drift-overlayt tulevat tähän näkymään.
      </p>
      <div className="paper gold-mark p-5">
        <p className="text-sm text-ink-soft m-0">
          <strong className="font-serif text-ink">Toteutusvaihe 2.</strong> Lukija on nyt
          käytettävissä kokonaisuudessaan. Navigaattori ja interaktiivinen reseptimylly
          rakennetaan seuraavassa erässä — pyydä jatkamaan kun olet käynyt lukijan läpi.
        </p>
      </div>
    </div>
  );
};

export default Navigaattori;
