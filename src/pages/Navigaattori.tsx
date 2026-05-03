import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FUNKTIOT,
  KLUSTERIT,
  NAV_NODES,
  NAV_YEARS_MAX,
  NAV_YEARS_MIN,
  VANAVEDET,
  type Funktio,
  type NavNode,
  type Vanavesi,
} from "@/data/navigator";
import { RECIPES } from "@/data/recipes";
import { DriftChart } from "@/components/charts/DriftChart";

/**
 * Navigaattori — klusteri × aika × vanavesi -kartta.
 *
 * Ylhäällä funktio- ja vanavesi-suodattimet, vasemmalla klusteririvit
 * (ikäluokat + rakenne), x-akselilla vuodet 1985–2045. Kukin solmu
 * piirtyy palkkina vuosivälille; rusketus = vakavuus, väri = funktio,
 * reuna = vanavesi. Klikkaus avaa tarkemman tooltipin reseptilinkkeineen.
 */
const Navigaattori = () => {
  useEffect(() => {
    document.title = "V-Signal · Navigaattori";
  }, []);

  const [funktiot, setFunktiot] = useState<Set<Funktio>>(
    new Set(["vahvistava", "varautuminen", "korjaava"])
  );
  const [vanavedet, setVanavedet] = useState<Set<Vanavesi>>(
    new Set(["individual", "cohort", "state"])
  );
  const [selected, setSelected] = useState<NavNode | null>(null);

  const visible = useMemo(
    () =>
      NAV_NODES.filter(
        (n) => funktiot.has(n.funktio) && vanavedet.has(n.vanavesi)
      ),
    [funktiot, vanavedet]
  );

  const totalYears = NAV_YEARS_MAX - NAV_YEARS_MIN;
  const decades = [];
  for (let y = NAV_YEARS_MIN; y <= NAV_YEARS_MAX; y += 10) decades.push(y);

  const toggle = <T,>(set: Set<T>, value: T, setSet: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setSet(next);
  };

  return (
    <div className="px-5 py-12 max-w-6xl mx-auto">
      <header className="mb-8">
        <p className="eyebrow mb-3">Vaihe 2 · Navigaattori</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink mb-3">
          Klusteri × aika × vanavesi
        </h1>
        <p className="lede text-lg max-w-3xl">
          Järjestelmän {NAV_NODES.length} solmua sijoiteltuna ikäklustereihin ja
          aikajanalle 1985–2045. Suodata funktion ja vanaveden mukaan, klikkaa
          solmua nähdäksesi reseptit jotka ajavat sen tulkintaa.
        </p>
      </header>

      {/* Suodattimet */}
      <div className="paper p-4 mb-6 grid sm:grid-cols-2 gap-6">
        <FilterGroup
          title="Funktio"
          items={Object.entries(FUNKTIOT) as [Funktio, { label: string; color: string }][]}
          active={funktiot}
          onToggle={(v) => toggle(funktiot, v, setFunktiot)}
        />
        <FilterGroup
          title="Vanavesi"
          items={Object.entries(VANAVEDET) as [Vanavesi, { label: string; color: string }][]}
          active={vanavedet}
          onToggle={(v) => toggle(vanavedet, v, setVanavedet)}
        />
      </div>

      {/* Kartta */}
      <div className="paper p-5 mb-6 overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Aika-akseli */}
          <div className="relative h-6 ml-[140px] border-b border-ink/10 mb-2">
            {decades.map((y) => (
              <div
                key={y}
                className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-ink-mute"
                style={{ left: `${((y - NAV_YEARS_MIN) / totalYears) * 100}%` }}
              >
                {y}
              </div>
            ))}
            {/* Nyt-merkki */}
            <div
              className="absolute top-0 bottom-0 border-l border-dashed border-gold"
              style={{ left: `${((2026 - NAV_YEARS_MIN) / totalYears) * 100}%` }}
            />
          </div>

          {/* Rivit klustereittain */}
          {(Object.entries(KLUSTERIT) as [keyof typeof KLUSTERIT, { label: string; row: number }][])
            .sort((a, b) => a[1].row - b[1].row)
            .map(([k, meta]) => {
              const nodes = visible.filter((n) => n.klusteri === k);
              return (
                <div key={k} className="flex items-stretch border-b border-ink/5 last:border-0">
                  <div className="w-[140px] py-3 pr-3 text-right">
                    <div className="font-serif text-sm text-ink">{meta.label}</div>
                    <div className="font-mono text-[10px] text-ink-faint">
                      {nodes.length} / {NAV_NODES.filter((n) => n.klusteri === k).length}
                    </div>
                  </div>
                  <div className="relative flex-1 min-h-[64px] py-2">
                    {nodes.map((n, i) => {
                      const left = ((n.yearFrom - NAV_YEARS_MIN) / totalYears) * 100;
                      const width = ((n.yearTo - n.yearFrom) / totalYears) * 100;
                      const isSel = selected?.id === n.id;
                      return (
                        <button
                          key={n.id}
                          onClick={() => setSelected(isSel ? null : n)}
                          className="absolute h-7 rounded text-[10px] font-mono px-2 truncate text-left hover:z-10 hover:scale-[1.02] transition-transform"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            top: `${4 + (i % 2) * 32}px`,
                            background: FUNKTIOT[n.funktio].color,
                            opacity: isSel ? 1 : 0.4 + n.severity * 0.18,
                            color: "var(--paper)",
                            border: `2px solid ${VANAVEDET[n.vanavesi].color}`,
                            boxShadow: isSel ? "0 0 0 2px var(--gold)" : undefined,
                          }}
                          title={n.label}
                        >
                          {n.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Valittu solmu */}
      {selected ? (
        <div className="paper gold-mark p-5 mb-8">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <h2 className="font-serif text-2xl text-ink">{selected.label}</h2>
            <button
              onClick={() => setSelected(null)}
              className="font-mono text-[10px] text-ink-mute hover:text-gold"
            >
              sulje ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-3 mb-3 font-mono text-[10px] uppercase tracking-[0.18em]">
            <span style={{ color: FUNKTIOT[selected.funktio].color }}>
              ● {FUNKTIOT[selected.funktio].label}
            </span>
            <span style={{ color: VANAVEDET[selected.vanavesi].color }}>
              ◆ {VANAVEDET[selected.vanavesi].label}
            </span>
            <span className="text-ink-mute">
              {selected.yearFrom}–{selected.yearTo}
            </span>
          </div>
          <p className="text-ink-soft mb-4">{selected.note}</p>
          <div>
            <p className="eyebrow mb-2">Ajetaan resepteillä</p>
            <div className="flex flex-wrap gap-2">
              {selected.recipeIds.map((rid) => {
                const r = RECIPES[rid];
                if (!r) return null;
                return (
                  <Link
                    key={rid}
                    to={`/reseptit/${rid}`}
                    className="paper px-3 py-1.5 text-xs hover:shadow-md transition-shadow"
                  >
                    <code className="font-mono text-[10px] text-gold">{r.view}</code>
                    <span className="ml-2 text-ink">{r.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="paper p-5 mb-8">
          <p className="text-sm text-ink-mute m-0">
            Klikkaa solmua nähdäksesi sitä ajavat reseptit ja tulkintamuistiinpanon.
          </p>
        </div>
      )}

      {/* Drift-overlay */}
      <section className="mb-6">
        <p className="eyebrow mb-2">Overlay · Drift-projektio</p>
        <DriftChart />
      </section>
    </div>
  );
};

const FilterGroup = <T extends string>({
  title,
  items,
  active,
  onToggle,
}: {
  title: string;
  items: [T, { label: string; color: string }][];
  active: Set<T>;
  onToggle: (v: T) => void;
}) => (
  <div>
    <p className="eyebrow mb-2">{title}</p>
    <div className="flex flex-wrap gap-2">
      {items.map(([key, meta]) => {
        const on = active.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className="px-3 py-1.5 text-xs font-mono rounded border transition-colors"
            style={{
              borderColor: meta.color,
              background: on ? meta.color : "transparent",
              color: on ? "var(--paper)" : "var(--ink-soft)",
            }}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  </div>
);

export default Navigaattori;
