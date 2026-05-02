import { Link } from "react-router-dom";
import { useEffect } from "react";
import { RECIPE_LIST, RECIPE_CATEGORIES, type RecipeCategory } from "@/data/recipes";

const Reseptit = () => {
  useEffect(() => {
    document.title = "V-Signal · Reseptit";
  }, []);

  // Ryhmittele kategorioittain
  const grouped = RECIPE_LIST.reduce((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {} as Record<RecipeCategory, typeof RECIPE_LIST>);

  return (
    <div className="px-5 py-16 max-w-5xl mx-auto">
      <header className="mb-10">
        <p className="eyebrow mb-3">Reseptimylly</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink mb-4">
          {RECIPE_LIST.length} reseptiä, {Object.keys(grouped).length} kategoriaa
        </h1>
        <p className="lede text-lg max-w-2xl">
          Jokainen lukijan havainto on tuotettu yhdellä näistä resepteistä. Klikkaa
          reseptiä nähdäksesi kysymyksen, lähteet, oletukset ja SQL-luonnoksen.
        </p>
        <div className="mt-6 paper gold-mark p-4">
          <p className="text-sm text-ink-soft m-0">
            <strong className="font-serif text-ink">Tulossa erässä 2:</strong> J-koodi-taulukko,
            interaktiivinen drill, vertailupari ja anomaliarivit.
          </p>
        </div>
      </header>

      {(Object.entries(grouped) as [RecipeCategory, typeof RECIPE_LIST][]).map(
        ([cat, recipes]) => (
          <section key={cat} className="mb-10">
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-serif text-2xl text-ink">
                {RECIPE_CATEGORIES[cat].label}
              </h2>
              <span className="lede text-sm">{RECIPE_CATEGORIES[cat].description}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {recipes.map((r) => (
                <Link
                  key={r.id}
                  to={`/reseptit/${r.id}`}
                  className="paper p-5 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2">
                    <code className="font-mono text-[11px] text-gold">{r.view}</code>
                    {r.isNew && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fn-vahvistava border border-fn-vahvistava/40 px-1.5 py-0.5 rounded">
                        Uusi
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-xl text-ink mb-1 group-hover:text-gold">
                    {r.title}
                  </h3>
                  <p className="text-sm text-ink-soft mb-3">{r.oneliner}</p>
                  <p className="text-[12px] italic text-ink-mute border-t border-ink/10 pt-2">
                    {r.question}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )
      )}
    </div>
  );
};

export default Reseptit;
