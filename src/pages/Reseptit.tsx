import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  RECIPE_CATEGORIES,
  RECIPE_LIST,
  RECIPES,
  type Recipe,
  type RecipeCategory,
} from "@/data/recipes";
import { ElasticityChart } from "@/components/charts/ElasticityChart";
import { LeverageChart } from "@/components/charts/LeverageChart";

/**
 * Reseptimylly — Erä 2.
 *
 * - Yläosassa kategoriasuodatin + näkymänvaihto (kortit / taulukko)
 * - Taulukko: J-koodi, näkymä, kategoria, kysymys, aikaväli
 * - Klikkaus laajentaa drill-paneelin (oletukset, rajoitteet, SQL)
 * - Vertailupari: valitse 2 reseptiä rinnakkaiseen tarkasteluun
 * - Anomaliarivit (poikkeavan voimakkaat reseptit) korostetaan
 * - Alaosassa kaksi visualisointia (joustavuus + leverage)
 */

// J-koodit reseptin tunnistamiseen analyysiketjussa
const J_CODE: Record<string, string> = {
  lifecycle: "J-01",
  elasticity: "J-02",
  trend: "J-03",
  funding_paradox: "J-04",
  data_gap: "J-05",
  comparison_pair: "J-06",
  counterfactual: "J-07",
  drift: "J-08",
  leverage: "J-09",
  policy_lag: "J-10",
};

// Anomalia: reseptit joiden vaikutusarvio poikkeaa muista (manuaalisesti merkitty)
const ANOMALY: Record<string, string> = {
  funding_paradox: "Rahoitus +180 % ilman tulosvaikutusta",
  drift: "Mielenterveyden ennuste 2045 +75 %",
  policy_lag: "Työkyvyttömyydessä 30–40 v. lag",
};

const Reseptit = () => {
  useEffect(() => {
    document.title = "V-Signal · Reseptit";
  }, []);

  const [view, setView] = useState<"cards" | "table">("table");
  const [filter, setFilter] = useState<RecipeCategory | "all">("all");
  const [drillId, setDrillId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const rows = useMemo(
    () =>
      filter === "all"
        ? RECIPE_LIST
        : RECIPE_LIST.filter((r) => r.category === filter),
    [filter]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  return (
    <div className="px-5 py-12 max-w-6xl mx-auto">
      <header className="mb-8">
        <p className="eyebrow mb-3">Reseptimylly · Erä 2</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink mb-3">
          {RECIPE_LIST.length} reseptiä, {Object.keys(RECIPE_CATEGORIES).length} kategoriaa
        </h1>
        <p className="lede text-lg max-w-3xl">
          J-koodit, drill-paneeli, vertailupari ja anomaliarivit.
          Valitse kaksi reseptiä rinnakkaiseen vertailuun, klikkaa rivin J-koodia
          avataksesi drillin.
        </p>
      </header>

      {/* Suodatin- ja näkymärivi */}
      <div className="paper p-3 mb-6 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          <CatChip active={filter === "all"} onClick={() => setFilter("all")}>
            Kaikki ({RECIPE_LIST.length})
          </CatChip>
          {(Object.entries(RECIPE_CATEGORIES) as [RecipeCategory, { label: string; description: string }][]).map(
            ([k, meta]) => {
              const count = RECIPE_LIST.filter((r) => r.category === k).length;
              return (
                <CatChip key={k} active={filter === k} onClick={() => setFilter(k)}>
                  {meta.label} ({count})
                </CatChip>
              );
            }
          )}
        </div>
        <div className="flex gap-1 font-mono text-[10px]">
          <ViewBtn active={view === "table"} onClick={() => setView("table")}>Taulukko</ViewBtn>
          <ViewBtn active={view === "cards"} onClick={() => setView("cards")}>Kortit</ViewBtn>
        </div>
      </div>

      {/* Vertailu-status */}
      {compareIds.length > 0 && (
        <div className="paper gold-mark p-4 mb-6">
          <p className="eyebrow mb-2">Vertailupari ({compareIds.length}/2)</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {compareIds.map((id) => {
              const r = RECIPES[id];
              return (
                <div key={id} className="text-sm">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <code className="font-mono text-[11px] text-gold">{J_CODE[id]} · {r.view}</code>
                    <button
                      onClick={() => toggleCompare(id)}
                      className="font-mono text-[10px] text-ink-mute hover:text-fn-korjaava"
                    >
                      poista
                    </button>
                  </div>
                  <div className="font-serif text-lg text-ink mb-1">{r.title}</div>
                  <p className="text-ink-soft text-xs italic">{r.question}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-2 text-[11px] font-mono text-ink-mute">
                    <span>Aikaväli</span><span>{r.timeRange}</span>
                    <span>Oletuksia</span><span>{r.assumptions.length}</span>
                    <span>Rajoitteita</span><span>{r.limits.length}</span>
                  </div>
                </div>
              );
            })}
            {compareIds.length === 1 && (
              <div className="border border-dashed border-ink/15 rounded p-4 text-center text-ink-mute text-xs italic flex items-center justify-center">
                Valitse toinen resepti taulukosta
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pää-näkymä */}
      {view === "table" ? (
        <div className="paper overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left">
                <Th>J</Th>
                <Th>Näkymä</Th>
                <Th>Resepti</Th>
                <Th>Kategoria</Th>
                <Th>Aikaväli</Th>
                <Th className="text-center">Vrt.</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const open = drillId === r.id;
                const inCompare = compareIds.includes(r.id);
                const anomaly = ANOMALY[r.id];
                return (
                  <RowGroup
                    key={r.id}
                    recipe={r}
                    open={open}
                    inCompare={inCompare}
                    anomaly={anomaly}
                    onToggleDrill={() => setDrillId(open ? null : r.id)}
                    onToggleCompare={() => toggleCompare(r.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <CardGrid recipes={rows} />
      )}

      {/* Visualisoinnit */}
      <section className="mb-4">
        <p className="eyebrow mb-2">Tulosvisualisoinnit</p>
        <div className="grid lg:grid-cols-2 gap-4">
          <ElasticityChart />
          <LeverageChart />
        </div>
      </section>
    </div>
  );
};

const RowGroup = ({
  recipe,
  open,
  inCompare,
  anomaly,
  onToggleDrill,
  onToggleCompare,
}: {
  recipe: Recipe;
  open: boolean;
  inCompare: boolean;
  anomaly?: string;
  onToggleDrill: () => void;
  onToggleCompare: () => void;
}) => (
  <>
    <tr
      className={`border-b border-ink/5 hover:bg-paper-deep cursor-pointer ${
        anomaly ? "bg-[color:var(--gold-soft)]" : ""
      }`}
      onClick={onToggleDrill}
    >
      <Td>
        <code className="font-mono text-[11px] text-gold">{J_CODE[recipe.id]}</code>
      </Td>
      <Td>
        <code className="font-mono text-[11px] text-ink-mute">{recipe.view}</code>
      </Td>
      <Td>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-base text-ink">{recipe.title}</span>
          {recipe.isNew && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fn-vahvistava border border-fn-vahvistava/40 px-1 rounded">
              uusi
            </span>
          )}
        </div>
        {anomaly && (
          <div className="mt-1 text-[11px] italic text-fn-korjaava">⚠ {anomaly}</div>
        )}
      </Td>
      <Td>
        <span className="font-mono text-[11px] text-ink-mute">
          {RECIPE_CATEGORIES[recipe.category].label}
        </span>
      </Td>
      <Td>
        <span className="font-mono text-[11px] text-ink-mute">{recipe.timeRange}</span>
      </Td>
      <Td className="text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompare();
          }}
          className={`w-5 h-5 rounded border text-[10px] font-mono transition-colors ${
            inCompare
              ? "bg-gold border-gold text-paper"
              : "border-ink/20 text-ink-mute hover:border-gold"
          }`}
          aria-label="Lisää vertailuun"
        >
          {inCompare ? "✓" : "+"}
        </button>
      </Td>
    </tr>
    {open && (
      <tr className="bg-paper-deep">
        <td colSpan={6} className="px-4 py-5">
          <div className="grid md:grid-cols-3 gap-5">
            <DrillCol title="Tutkimuskysymys">
              <p className="font-serif text-base text-ink italic">{recipe.question}</p>
            </DrillCol>
            <DrillCol title="Oletukset">
              <ul className="list-disc list-inside space-y-0.5 text-xs marker:text-ink-faint text-ink-soft">
                {recipe.assumptions.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </DrillCol>
            <DrillCol title="Rajoitteet">
              <ul className="list-disc list-inside space-y-0.5 text-xs marker:text-fn-korjaava text-ink-soft">
                {recipe.limits.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </DrillCol>
            <div className="md:col-span-3">
              <p className="eyebrow mb-2">SQL-luonnos</p>
              <pre className="paper p-3 text-[11px] font-mono overflow-x-auto text-ink m-0">
                {recipe.sqlSketch}
              </pre>
            </div>
            <div className="md:col-span-3">
              <Link
                to={`/reseptit/${recipe.id}`}
                className="font-mono text-[11px] text-gold hover:underline"
              >
                Avaa täysi reseptisivu →
              </Link>
            </div>
          </div>
        </td>
      </tr>
    )}
  </>
);

const CardGrid = ({ recipes }: { recipes: Recipe[] }) => {
  const grouped = recipes.reduce((acc, r) => {
    (acc[r.category] ||= []).push(r);
    return acc;
  }, {} as Record<RecipeCategory, Recipe[]>);
  return (
    <div className="mb-8">
      {(Object.entries(grouped) as [RecipeCategory, Recipe[]][]).map(([cat, list]) => (
        <section key={cat} className="mb-8">
          <div className="flex items-baseline gap-3 mb-3">
            <h2 className="font-serif text-2xl text-ink">{RECIPE_CATEGORIES[cat].label}</h2>
            <span className="lede text-sm">{RECIPE_CATEGORIES[cat].description}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {list.map((r) => (
              <Link
                key={r.id}
                to={`/reseptit/${r.id}`}
                className="paper p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <code className="font-mono text-[11px] text-gold">{J_CODE[r.id]} · {r.view}</code>
                  {r.isNew && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fn-vahvistava border border-fn-vahvistava/40 px-1.5 py-0.5 rounded">
                      Uusi
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl text-ink mb-1 group-hover:text-gold">{r.title}</h3>
                <p className="text-sm text-ink-soft mb-3">{r.oneliner}</p>
                <p className="text-[12px] italic text-ink-mute border-t border-ink/10 pt-2">
                  {r.question}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const DrillCol = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="eyebrow mb-2">{title}</p>
    {children}
  </div>
);

const Th = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute ${className}`}>
    {children}
  </th>
);

const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 align-top ${className}`}>{children}</td>
);

const CatChip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
      active
        ? "bg-ink text-paper border-ink"
        : "text-ink-soft border-ink/15 hover:border-gold"
    }`}
  >
    {children}
  </button>
);

const ViewBtn = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded border ${
      active ? "bg-ink text-paper border-ink" : "text-ink-mute border-ink/15 hover:border-gold"
    }`}
  >
    {children}
  </button>
);

export default Reseptit;
