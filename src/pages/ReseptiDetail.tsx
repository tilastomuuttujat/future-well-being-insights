import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { RECIPES, RECIPE_CATEGORIES } from "@/data/recipes";
import NotFound from "./NotFound";

const ReseptiDetail = () => {
  const { id } = useParams<{ id: string }>();
  const recipe = id ? RECIPES[id] : undefined;

  useEffect(() => {
    if (recipe) {
      document.title = `V-Signal · Resepti: ${recipe.title}`;
    }
  }, [recipe]);

  if (!recipe) return <NotFound />;

  const cat = RECIPE_CATEGORIES[recipe.category];

  return (
    <article className="px-5 py-12 max-w-3xl mx-auto">
      <nav className="mb-6 font-mono text-[11px] text-ink-mute">
        <Link to="/reseptit" className="hover:text-gold">/reseptit</Link>
        <span className="mx-2">›</span>
        <span>{cat.label}</span>
        <span className="mx-2">›</span>
        <span className="text-ink">{recipe.id}</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-baseline gap-3 mb-2">
          <code className="font-mono text-xs text-gold">{recipe.view}</code>
          {recipe.isNew && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fn-vahvistava border border-fn-vahvistava/40 px-1.5 py-0.5 rounded">
              Uusi resepti
            </span>
          )}
        </div>
        <h1 className="font-serif text-4xl text-ink leading-tight mb-3">{recipe.title}</h1>
        <p className="lede text-lg">{recipe.oneliner}</p>
      </header>

      <section className="paper gold-mark p-5 mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-2">
          Tutkimuskysymys
        </p>
        <p className="font-serif text-xl text-ink italic m-0">{recipe.question}</p>
      </section>

      <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-6 mb-8">
        <Field label="Aikaväli">{recipe.timeRange}</Field>
        <Field label="Kategoria">{cat.label}</Field>
        <Field label="Lähteet" wide>
          <ul className="list-disc list-inside space-y-1 marker:text-ink-faint">
            {recipe.inputs.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Field>
        <Field label="Oletukset" wide>
          <ul className="list-disc list-inside space-y-1 marker:text-ink-faint">
            {recipe.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Field>
        <Field label="Rajoitteet" wide>
          <ul className="list-disc list-inside space-y-1 marker:text-fn-korjaava">
            {recipe.limits.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Field>
      </dl>

      <details className="paper p-5 mb-6 group">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute hover:text-ink">
          SQL-luonnos
        </summary>
        <pre className="mt-4 p-4 paper-deep rounded-md text-[12px] leading-relaxed overflow-x-auto text-ink font-mono">
          {recipe.sqlSketch}
        </pre>
      </details>

      <div className="paper p-5 border-l-2 border-fn-varautuminen">
        <p className="text-sm text-ink-soft m-0">
          <strong className="font-serif text-ink">Interaktiivinen ajo tulossa.</strong>{" "}
          Toteutusvaiheessa 2 reseptin voi ajaa Supabase-näkymää vasten ja sukeltaa
          tuloksiin J-koodeittain reseptimyllyn drill-näkymässä.
        </p>
      </div>

      <div className="mt-8 flex justify-between items-center font-mono text-[11px]">
        <Link to="/reseptit" className="text-ink-mute hover:text-gold">
          ← Kaikki reseptit
        </Link>
        <Link to="/" className="text-ink-mute hover:text-gold">
          Lukijaan →
        </Link>
      </div>
    </article>
  );
};

const Field = ({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-mute mb-2">
      {label}
    </dt>
    <dd className="text-sm text-ink-soft m-0">{children}</dd>
  </div>
);

export default ReseptiDetail;
