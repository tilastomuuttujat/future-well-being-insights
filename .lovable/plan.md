# Arkkitehtuurin uudistus: editor + build-scripts + docs

## Tavoite

Erotetaan **tekijän työkalu** (React-editori, jolla sinä rakennat ja säädät analyysejä) ja **lukijan kokemus** (kevyt vanilla-D3-sivusto, joka on nopea, tyylikäs ja toimii ilman React-bundlea). Supabase pysyy totuuden lähteenä; build-skripti paistaa siitä staattiset JSONit lukijaversiolle.

## Lopullinen rakenne

```text
repo/
├── editor/                    React-sovellus (nykyinen koodi siirretään tänne)
│   ├── src/
│   │   ├── pages/             Lukija, Navigaattori, Reseptit...
│   │   ├── features/          ilmiot, keha, navigator, meta
│   │   ├── components/
│   │   └── lib/supabase.ts    suora Supabase-yhteys editointiin
│   ├── package.json
│   ├── vite.config.ts         base: "/" (vain editori, ei deployata Pagesiin)
│   └── tsconfig.json
│
├── build-scripts/             Node-skriptit, jotka paistavat JSONit
│   ├── package.json           erillinen, riippuu @supabase/supabase-js
│   ├── src/
│   │   ├── generate-all.ts    pääorkestraattori
│   │   ├── generators/
│   │   │   ├── ilmiot.ts          → docs/data/ilmiot.json
│   │   │   ├── keha.ts            → docs/data/keha.json
│   │   │   ├── navigator.ts       → docs/data/navigator.json
│   │   │   ├── reseptit.ts        → docs/data/reseptit.json
│   │   │   └── lukija.ts          → docs/data/lukija.json
│   │   └── lib/supabase.ts    palvelinpuolen client (service-key valinnainen)
│   └── README.md              "bun run generate" -ohjeet
│
└── docs/                      GitHub Pages -juuri (vanilla, ei buildia)
    ├── index.html             lukijaversion etusivu
    ├── ilmiot.html            verkkokuvio (D3 + driver-sliderit)
    ├── keha.html
    ├── navigaattori.html
    ├── reseptit.html
    ├── css/
    │   ├── tokens.css         värit, fontit (yhtenäinen "paperi"-estetiikka)
    │   └── app.css
    ├── js/
    │   ├── lib/
    │   │   ├── d3.v7.min.js
    │   │   └── chart.umd.min.js
    │   ├── ilmiot.js          fetch('data/ilmiot.json') → D3-renderöinti
    │   ├── keha.js
    │   ├── navigaattori.js
    │   └── reseptit.js
    └── data/                  build-skriptin tuottamat tiedostot
        ├── ilmiot.json
        ├── keha.json
        ├── navigator.json
        ├── reseptit.json
        └── lukija.json
```

## Työnkulku

```text
1. Editoi Reactissa  (cd editor && bun run dev)
       ↓ kirjoita / hienosäädä Supabaseen
2. Supabase päivittyy
       ↓
3. bun run generate           (build-scripts/ ajaa generaattorit)
       ↓ kirjoittaa JSONit
4. docs/data/*.json päivittyy
       ↓
5. git push
       ↓
6. GitHub Pages julkaisee docs/-kansion lukijaversion
```

## Toteutusvaiheet

### Vaihe 1 — Repo-rakenteen siirto
- Luo `editor/`-kansio ja siirrä sinne nykyinen `src/`, `public/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, `package.json`, `bun.lockb`, `eslint.config.js`, `vitest.config.ts`.
- Säilytä tuontipolut (`@/*` → `./src/*`) ennallaan — vain juuri muuttuu.
- Päivitä `editor/vite.config.ts`: poista GitHub Pages -base (`base: "/"`), koska editori ei enää deployaudu Pagesiin.

### Vaihe 2 — build-scripts -projekti
- Luo `build-scripts/package.json` (Node 20+, `tsx`, `@supabase/supabase-js`, `dotenv`).
- `src/generate-all.ts` lukee Supabase-näkymät (`v_signal_*`) ja staattiset datafilet, koostaa per-sivu JSONit, kirjoittaa `../docs/data/`.
- Per-sivu generaattorit käyttävät samoja tyyppejä kuin React-puoli — kopioidaan `editor/src/data/recipes.ts` ja `features/*/data.ts` jaettuun muotoon tai duplikoidaan tietoisesti (yksinkertaisempaa aluksi).
- Komento: `cd build-scripts && bun run generate`.

### Vaihe 3 — docs/ vanilla-lukijaversio
- Luo siisti, tyylitelty staattinen sivusto, joka kopioi nykyisen React-näkymän vibran (sama tokens.css: `--ink`, `--gold`, paperi-tausta, serif-otsikot).
- **ilmiot.html + js/ilmiot.js**: alkuperäisen `hyvinvointi_v43.html`-prototyypin kuminauha-D3-toteutus suoraan vanilla-pohjalla — sama force-simulaatio, drag, zoom, driver-sliderit. Lukee `data/ilmiot.json`.
- **keha.html, navigaattori.html, reseptit.html**: vastaavat staattiset näkymät.
- **index.html**: etusivu (Lukija) — johdanto + linkit muihin näkymiin.
- Ei buildia: `<script src="js/lib/d3.v7.min.js">` + `<script type="module" src="js/ilmiot.js">`. Toimii suoraan GitHub Pagesissa.

### Vaihe 4 — GitHub Actions
- Korvaa nykyinen `.github/workflows/deploy.yml`. Uusi versio:
  - Ei buildaa Reactia.
  - Deployaa pelkän `docs/`-kansion GitHub Pagesiin (`actions/upload-pages-artifact path: ./docs`).
  - Voidaan myös ajaa `build-scripts/` automaattisesti pushissa, jos halutaan tuoreet JSONit (vaatii Supabase-avaimen GitHub Secretsiin) — tai jätetään manuaaliseksi `bun run generate`-ajoksi.

### Vaihe 5 — Dokumentointi
- `README.md`: kolme sektiota — "Editori (kehittäjälle)", "JSONien generointi", "Lukijaversio (docs/)".
- `build-scripts/README.md`: ympäristömuuttujat, ajo-ohjeet.

## Tekniset huomiot

- **Polut React-koodissa**: kun siirrämme `src/` → `editor/src/`, alias `@/*` toimii ennallaan — vain `vite.config.ts` ja `tsconfig.app.json` ovat saman kansion alla, joten muutoksia ei tarvita.
- **Lovable-yhteensopivuus**: Lovable odottaa Reactin olevan repon juuressa. Editorin sisäänkirjautumiseksi `editor/`-alikansioon tarvitaan joko (a) symlinkit tai (b) Lovable-projekti pidetään juuressa ja `docs/`+`build-scripts/` lisätään sisarkansioiksi **jättämättä editor-kansiota** — eli React jää juureen, ja vain build-scripts + docs lisätään. **Suositus:** Tehdään näin yksinkertaisesti:
  ```
  repo/
  ├── src/, package.json, vite.config.ts ...   (React-editori, kuten nyt)
  ├── build-scripts/
  └── docs/
  ```
  Tämä säilyttää Lovable-toiminnallisuuden. Jos haluat ehdottomasti nimetyn `editor/`-kansion, se pitää tehdä manuaalisesti GitHubissa Lovablen ulkopuolella.
- **GitHub Pages base-polku**: nykyinen `base: "/future-well-being-insights/"` poistuu — `docs/` voi käyttää suhteellisia polkuja (`./js/...`, `./data/...`), jolloin sama HTML toimii niin alikansiossa kuin custom-domainissakin.
- **Supabase-key**: lukijaversiossa ei tarvita Supabase-yhteyttä lainkaan — kaikki on staattisissa JSONeissa. Tämä on iso voitto suorituskyvyssä ja yksityisyydessä.

## Avoimet kysymykset

1. **Kansion nimi**: voinko jättää React-koodin repon juureen (Lovable-yhteensopivuus) ja lisätä vain `build-scripts/` + `docs/` rinnalle? Vai haluatko ehdottomasti `editor/`-alikansion (vaatii Lovable-projektin uudelleenkonfiguroinnin tai manuaalisen GitHub-työn)?
2. **Aloituspiste**: aloitetaanko `ilmiot`-sivulla (jossa nykyinen React-versio ei vielä yllä alkuperäisen prototyypin tasolle), vai paistetaanko kaikki neljä sivua kerralla?
3. **JSON-generointi automaatioon vai manuaaliseksi**: ajetaanko `generate-all` GitHub Actionsissa joka pushissa (vaatii Supabase-avaimen sekretiksi) vai paikallisesti komennolla?
