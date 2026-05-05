## Tavoite

Integroidaan `ttt_kokonaisarvio.jsx` V-Signal-sovellukseen kolmena eränä (vaihtoehto D = kaikki). Säilytetään prototyypin sisältö 1:1, mutta tyylit V-Signaliin (paperi/muste, serif-otsikot, mono-eyebrow, semanttiset värit `--ink`, `--paper`, `--gold`).

---

## Erä A — Oma sivu `/navigaattori/tietokanta`

**Uudet tiedostot**
- `src/features/meta/data.ts` — staattinen kopio prototyypin datasta:
  - `INFRASTRUCTURE` (kannat, pohja-skripti, Edge Functions)
  - `DATA_TABLES` (taulut + rivimäärät + status: ok/partial/missing)
  - `COVERAGE` (segmentti-, indikaattori- ja vuosikattavuus %)
  - `ROADMAP` (vaiheet 1–4 statuksin)
  - `KNOWN_GAPS` (puuttuvat lähteet/tiedot)
- `src/features/meta/MetaSection.tsx` — yleinen "paper" -lohkokomponentti (eyebrow + serif-otsikko + lapset)
- `src/features/meta/StatusBadge.tsx` — pieni mono-merkki (ok/partial/missing → vihreä/kulta/punainen)
- `src/features/meta/CoverageBar.tsx` — natiivi SVG-palkki prosentille
- `src/pages/NavigaattoriTietokanta.tsx` — koostaa yllä olevat:
  1. Hero (eyebrow "Vaihe · Meta", h1 "Tietokannan kokonaisarvio", lyhyt kuvaus)
  2. Infrastruktuuri (Supabase-projektit, anon-key sijainti, Edge Functions)
  3. Datataulut (taulukko: nimi · rivit · status · kuvaus)
  4. Kattavuus (palkit segmenteille/indikaattoreille/vuosille)
  5. Tunnetut puutteet (lista)
  6. Tiekartta (vaiheet kortteina)

**Muokattavat**
- `src/App.tsx` — lisää `<Route path="/navigaattori/tietokanta" element={<NavigaattoriTietokanta />} />`
- `src/components/TopNav.tsx` — lisää linkki "Tietokanta" Navigaattori-ryhmään

---

## Erä B — Datatilan merkit Kehään ja tiekartta Lukijaan

**Kehä (`src/pages/NavigaattoriKeha.tsx` + `src/features/keha/`)**
- Pieni `DataStatusChip`-komponentti, joka näyttää valitulle klusterille kattavuus-% ja statusvärin
- Lisätään valinta-paneeliin (A/B-korttien yhteyteen) ja Löydökset-otsikon viereen
- Linkki "→ tietokanta" joka vie `/navigaattori/tietokanta`-sivulle ankkuriin (`#kattavuus`)
- Klusterikohtainen kattavuus johdetaan `COVERAGE`-datasta (mapataan `cluster.id → coverage%`)

**Lukija (`src/pages/Lukija.tsx`)**
- Uusi alaosa "Tiekartta" -lohko: lyhennetty `ROADMAP`-näkymä (4 vaihetta vaakakortteina + linkki täydelliseen meta-sivuun)
- Käyttää samoja `MetaSection`/`StatusBadge`-komponentteja

---

## Erä C — Live-rivimäärät Supabasesta (valinnainen kytkentä)

**Toteutus**
- Uusi hook `src/hooks/useTableCount.ts` — käyttää olemassa olevaa `supabase`-asiakasta:
  ```ts
  supabase.from(table).select('*', { count: 'exact', head: true })
  ```
- `useTableCounts(tables: string[])` palauttaa `Record<string, number | null>`
- `NavigaattoriTietokanta` käyttää hookia: jos live-luku saatavilla, näyttää sen; muuten staattinen fallback ja "—" merkki
- Virhetilanteet (puuttuva näkymä/oikeus): chip muuttuu "missing"-statukseksi, tooltipissä virheviesti
- Hyödyntää jo lisättyjä `grant select ... to anon` -oikeuksia (ks. `db/sql/phase2_v_signal_views.sql`)

**Tärkeää**
- Ei muutoksia kantaan — vain lukukyselyitä
- Ei uusia ympäristömuuttujia — `src/lib/supabase.ts` jo konfiguroitu
- Ei Lovable Cloudia (käytetään ulkoista `yjkabgtbcgvrfqtewtna`-projektia kuten muutkin V-Signal-näkymät)

---

## Tekniset huomiot

- Kaikki tyylit semanttisilla CSS-muuttujilla / Tailwind-tokeneilla (`paper`, `eyebrow`, `text-ink`, `text-ink-mute`, `text-ink-faint`, `text-gold`)
- Ei uusia npm-paketteja — käytetään `@tanstack/react-query` + olemassa oleva `useSignalView`-malli pohjana `useTableCount`-hookille
- SVG-palkit natiivisti (yhdenmukainen `DecadeLens`/`ProfileRail`-tyylin kanssa, ei chart-kirjastoja)
- Reitti `/navigaattori/tietokanta` linkitetty TopNaviin ja Kehän chipistä

---

## Toimitusjärjestys

1. **Erä A** — staattinen meta-sivu + reitti + TopNav-linkki
2. **Erä B** — Kehän status-chipit + Lukijan tiekartta-lohko
3. **Erä C** — live-rivimäärät hookilla, fallback staattiseen dataan

Vahvista, niin aloitan erästä A.