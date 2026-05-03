-- ============================================================
-- V-Signal · Erä 2 · neljä uutta analyysinäkymää
-- ============================================================
-- HUOM: Tämä tiedosto EI ole Lovable Cloud / Supabase-managed
-- migraatio. Aja käsin v_signal-projektissa (yjkabgtbcgvrfqtewtna)
-- esim. SQL-editorin kautta.
--
-- Näkymät vastaavat src/data/recipes.ts:n uusia reseptejä:
--   counterfactual, drift, leverage, policy_lag
--
-- Mikäli pohjafaktaa (v_segment_panel, v_intervention_simulation,
-- fact_intervention_evidence, fact_policy_*, dim_indicator) ei vielä
-- ole, korvaa view-määrittely paikallisella mockilla tai jätä
-- näkymä luomatta — UI tunnistaa puuttuvan näkymän automaattisesti
-- ja näyttää "datan katve" -tilan.
-- ============================================================

begin;

-- 1) Counterfactual ─ "mitä jos toimittu ajoissa"
create or replace view public.v_signal_counterfactual as
select
  s.year,
  s.segment,
  s.intervention_id,
  s.actual_value,
  s.counterfactual_value,
  (s.counterfactual_value - s.actual_value)             as shortfall,
  case
    when s.counterfactual_value = 0 then null
    else (s.counterfactual_value - s.actual_value) / s.counterfactual_value
  end                                                   as shortfall_ratio
from public.v_intervention_simulation s
where s.year between 1985 and 2024;

comment on view public.v_signal_counterfactual is
  'Toteuma vs. ajoissa toteutettu interventio (1985–2024). shortfall = euroja/työvuosia menetetty.';

-- 2) Drift-projektio 2035 / 2045
create or replace view public.v_signal_drift as
with base as (
  select
    p.segment,
    p.year,
    p.value,
    regr_slope(p.value, p.year) over (
      partition by p.segment
      order by p.year
      rows between 9 preceding and current row
    )                                                   as slope_10y,
    avg(p.value) over (
      partition by p.segment
      order by p.year
      rows between 4 preceding and current row
    )                                                   as level_5y
  from public.v_segment_panel p
  where p.year between 1995 and 2024
),
anchor as (
  select distinct on (segment)
    segment, year as anchor_year, level_5y as anchor_level, slope_10y as anchor_slope
  from base
  order by segment, year desc
)
select
  a.segment,
  yr                                                    as year,
  case scenario
    when 'nykytrendi' then a.anchor_level + a.anchor_slope * (yr - a.anchor_year)
    when 'varovainen' then a.anchor_level + a.anchor_slope * 0.7 * (yr - a.anchor_year)
    when 'voimakas'   then a.anchor_level + a.anchor_slope * 0.4 * (yr - a.anchor_year)
  end                                                   as value,
  scenario,
  abs(a.anchor_slope) * (yr - a.anchor_year) * 0.05     as ci_band
from anchor a
cross join generate_series(2024, 2045)                  as yr
cross join unnest(array['nykytrendi','varovainen','voimakas']) as scenario;

comment on view public.v_signal_drift is
  'Trendien ekstrapolaatio 2024 → 2045 kolmena polkuna. Naivi luottamusväli kasvaa lineaarisesti.';

-- 3) Leverage ─ kustannustehokkaimmat interventiopisteet
create or replace view public.v_signal_leverage as
select
  l.life_stage,
  l.intervention,
  l.cost_per_unit,
  l.effect_per_unit,
  case
    when l.cost_per_unit > 0
      then l.effect_per_unit / l.cost_per_unit
    else null
  end                                                   as roi_ratio,
  l.evidence_strength,
  l.duration_years
from public.fact_intervention_evidence l
where l.evidence_strength >= 2;  -- 1=heikko, 2=keskitaso, 3=vahva

comment on view public.v_signal_leverage is
  'Interventioiden ROI = vaikutus per kustannusyksikkö. Suodattaa heikon näytön pois.';

-- 4) Policy lag ─ kausaaliketju päätös → vaikutus
create or replace view public.v_signal_policy_lag as
select
  d.decision_year,
  d.sector,
  d.decision_id,
  d.decision_title,
  d.decision_year + l.lag_years                         as impact_year,
  i.indicator,
  l.lag_years,
  l.impact_size,
  l.confidence
from public.fact_policy_decisions d
join public.fact_policy_lag_model l using (sector)
join public.dim_indicator         i using (indicator_id)
where d.decision_year between 1995 and 2024;

comment on view public.v_signal_policy_lag is
  'Päätös → toteutusviive → mitattava tulos. Lag-jakauma sektoreittain.';

-- ── Anon-roolin SELECT-oikeudet (julkinen UI lukee anon-keylla)
grant select on public.v_signal_counterfactual to anon;
grant select on public.v_signal_drift          to anon;
grant select on public.v_signal_leverage       to anon;
grant select on public.v_signal_policy_lag     to anon;

commit;
