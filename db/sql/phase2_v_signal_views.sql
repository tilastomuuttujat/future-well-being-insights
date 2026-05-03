-- ============================================================
-- V-Signal · Erä 2 · neljä uutta analyysinäkymää (itsenäinen)
-- ============================================================
-- Tämä versio EI oleta että pohjafaktaa on jo olemassa. Se luo
-- minimaaliset taulut + esimerkkidatat, joiden päälle näkymät
-- toimivat. Kun korvaat taulut oikealla datalla (Tilastokeskus,
-- THL, Kela), näkymät pysyvät samanlaisina.
--
-- Aja v_signal-projektissa (yjkabgtbcgvrfqtewtna) SQL-editorin
-- kautta. Ei käytä Lovable Cloudia.
-- ============================================================

begin;

-- ────────────────────────────────────────────────────────────
-- Pohjataulut (luodaan vain jos eivät jo ole olemassa)
-- ────────────────────────────────────────────────────────────

create table if not exists public.v_segment_panel (
  segment text   not null,
  year    int    not null,
  value   numeric not null,
  primary key (segment, year)
);

create table if not exists public.v_intervention_simulation (
  intervention_id      text   not null,
  segment              text   not null,
  year                 int    not null,
  actual_value         numeric not null,
  counterfactual_value numeric not null,
  primary key (intervention_id, segment, year)
);

create table if not exists public.fact_intervention_evidence (
  life_stage         text    not null,
  intervention       text    not null,
  cost_per_unit      numeric not null,
  effect_per_unit    numeric not null,
  evidence_strength  int     not null check (evidence_strength between 1 and 3),
  duration_years     int     not null,
  primary key (life_stage, intervention)
);

create table if not exists public.dim_indicator (
  indicator_id text primary key,
  indicator    text not null
);

create table if not exists public.fact_policy_decisions (
  decision_id    text primary key,
  decision_year  int  not null,
  sector         text not null,
  decision_title text not null,
  indicator_id   text not null references public.dim_indicator(indicator_id)
);

create table if not exists public.fact_policy_lag_model (
  sector      text not null,
  lag_years   int  not null,
  impact_size numeric not null,
  confidence  numeric not null,
  primary key (sector, lag_years)
);

-- ────────────────────────────────────────────────────────────
-- Esimerkkidata (idempotentti — ON CONFLICT DO NOTHING)
-- ────────────────────────────────────────────────────────────

-- v_segment_panel: 1995–2024, kolme segmenttiä
insert into public.v_segment_panel (segment, year, value)
select s.segment,
       y.year,
       case s.segment
         when 'Mielenterveys'    then 30 + (y.year - 1995) * 1.6 + sin(y.year * 0.4) * 2
         when 'Vanhuspalvelut'   then 60 + (y.year - 1995) * 2.1
         when 'TULES'            then 45 + (y.year - 1995) * 0.9
       end
from (values ('Mielenterveys'),('Vanhuspalvelut'),('TULES')) s(segment)
cross join generate_series(1995, 2024) y(year)
on conflict do nothing;

-- v_intervention_simulation: 1985–2024, kaksi interventiota
insert into public.v_intervention_simulation (intervention_id, segment, year, actual_value, counterfactual_value)
select i.id, seg.segment, y.year,
       100 + (y.year - 1985) * 1.2,
       100 + (y.year - 1985) * 0.7
from (values ('mt_varhainen'),('tyokyky_polku')) i(id)
cross join (values ('Mielenterveys'),('Työkyky')) seg(segment)
cross join generate_series(1985, 2024) y(year)
on conflict do nothing;

-- fact_intervention_evidence: 6 elinkaarivaihetta
insert into public.fact_intervention_evidence
  (life_stage, intervention, cost_per_unit, effect_per_unit, evidence_strength, duration_years)
values
  ('0–6 v.',   'Neuvolan laajennettu seuranta',     1200,  8400, 3, 30),
  ('7–15 v.',  'Koulupsykologin matala kynnys',      800,  4200, 3, 25),
  ('16–25 v.', 'Opiskeluterveys + työvalmennus',    2400,  9600, 2, 20),
  ('26–55 v.', 'Työterveyden mt-polku',             3600, 10200, 3, 15),
  ('56–67 v.', 'Osa-aikainen työ + kuntoutus',      5200, 11800, 2, 10),
  ('68+',      'Kotihoidon tehostus',               8400, 12400, 2,  8)
on conflict do nothing;

-- dim_indicator
insert into public.dim_indicator (indicator_id, indicator) values
  ('IND_MT_AVO',   'Mielenterveyden avokäynnit / 1000 as.'),
  ('IND_TYOKYV',   'Työkyvyttömyyseläkkeelle siirtyneet / v.'),
  ('IND_LASTSUOJ', 'Lastensuojelun sijoitukset / 1000 lasta'),
  ('IND_VANH_LAIT','Vanhuspalveluiden laitospaikat')
on conflict do nothing;

-- fact_policy_decisions
insert into public.fact_policy_decisions (decision_id, decision_year, sector, decision_title, indicator_id) values
  ('HE-2013-NUOR', 2013, 'koulutus', 'Nuorisotakuu',                'IND_TYOKYV'),
  ('HE-2014-MTL',  2014, 'sote',     'Mielenterveyslain uudistus',  'IND_MT_AVO'),
  ('HE-2017-LAPSI',2017, 'sote',     'Lapsen oikeuksien vahvistus', 'IND_LASTSUOJ'),
  ('HE-2022-SOTE', 2022, 'sote',     'SOTE-uudistus',               'IND_VANH_LAIT')
on conflict do nothing;

-- fact_policy_lag_model: lag-jakauma sektoreittain
insert into public.fact_policy_lag_model (sector, lag_years, impact_size, confidence) values
  ('sote',       8, 0.30, 0.70),
  ('sote',      12, 0.55, 0.65),
  ('koulutus',  12, 0.40, 0.60),
  ('koulutus',  18, 0.65, 0.55),
  ('elakkeet',  20, 0.50, 0.50),
  ('elakkeet',  40, 0.80, 0.40)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- Näkymät
-- ────────────────────────────────────────────────────────────

-- 1) Counterfactual
create or replace view public.v_signal_counterfactual as
select
  s.year,
  s.segment,
  s.intervention_id,
  s.actual_value,
  s.counterfactual_value,
  (s.counterfactual_value - s.actual_value) as shortfall,
  case
    when s.counterfactual_value = 0 then null
    else (s.counterfactual_value - s.actual_value) / s.counterfactual_value
  end as shortfall_ratio
from public.v_intervention_simulation s
where s.year between 1985 and 2024;

comment on view public.v_signal_counterfactual is
  'Toteuma vs. ajoissa toteutettu interventio (1985–2024).';

-- 2) Drift-projektio 2024 → 2045
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
    ) as slope_10y,
    avg(p.value) over (
      partition by p.segment
      order by p.year
      rows between 4 preceding and current row
    ) as level_5y
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
  yr as year,
  case scenario
    when 'nykytrendi' then a.anchor_level + a.anchor_slope * (yr - a.anchor_year)
    when 'varovainen' then a.anchor_level + a.anchor_slope * 0.7 * (yr - a.anchor_year)
    when 'voimakas'   then a.anchor_level + a.anchor_slope * 0.4 * (yr - a.anchor_year)
  end as value,
  scenario,
  abs(a.anchor_slope) * (yr - a.anchor_year) * 0.05 as ci_band
from anchor a
cross join generate_series(2024, 2045) as yr
cross join unnest(array['nykytrendi','varovainen','voimakas']) as scenario;

comment on view public.v_signal_drift is
  'Trendien ekstrapolaatio 2024 → 2045 kolmena polkuna.';

-- 3) Leverage
create or replace view public.v_signal_leverage as
select
  l.life_stage,
  l.intervention,
  l.cost_per_unit,
  l.effect_per_unit,
  case when l.cost_per_unit > 0
    then l.effect_per_unit / l.cost_per_unit
    else null
  end as roi_ratio,
  l.evidence_strength,
  l.duration_years
from public.fact_intervention_evidence l
where l.evidence_strength >= 2;

comment on view public.v_signal_leverage is
  'Interventioiden ROI. Suodattaa heikon näytön pois.';

-- 4) Policy lag
create or replace view public.v_signal_policy_lag as
select
  d.decision_year,
  d.sector,
  d.decision_id,
  d.decision_title,
  d.decision_year + l.lag_years as impact_year,
  i.indicator,
  l.lag_years,
  l.impact_size,
  l.confidence
from public.fact_policy_decisions d
join public.fact_policy_lag_model l using (sector)
join public.dim_indicator         i on i.indicator_id = d.indicator_id
where d.decision_year between 1995 and 2024;

comment on view public.v_signal_policy_lag is
  'Päätös → toteutusviive → mitattava tulos.';

-- ────────────────────────────────────────────────────────────
-- Anon-roolin lukuoikeudet (julkinen UI lukee anon-keylla)
-- ────────────────────────────────────────────────────────────

grant select on public.v_signal_counterfactual to anon;
grant select on public.v_signal_drift          to anon;
grant select on public.v_signal_leverage       to anon;
grant select on public.v_signal_policy_lag     to anon;

-- Pohjataulujen lukuoikeudet (näkymät tarvitsevat ne anon-roolille)
grant select on public.v_segment_panel            to anon;
grant select on public.v_intervention_simulation  to anon;
grant select on public.fact_intervention_evidence to anon;
grant select on public.fact_policy_decisions      to anon;
grant select on public.fact_policy_lag_model      to anon;
grant select on public.dim_indicator              to anon;

commit;
