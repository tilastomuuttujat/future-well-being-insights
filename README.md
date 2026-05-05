# TTT — Suomen hyvinvointijärjestelmän pitkät linjat

Repo on jaettu kolmeen osaan:

```
repo/
├── src/, package.json, vite.config.ts ...   ← React-EDITORI (Lovable)
├── build-scripts/                           ← Supabase + staattinen → JSON
└── docs/                                    ← LUKIJAVERSIO (GitHub Pages)
    ├── index.html, ilmiot.html, ...
    ├── css/, js/
    └── data/*.json   ← build-scripts paistaa
```

## Työnkulku

```
1. Editoi Reactissa            bun run dev
       ↓ (kirjoita Supabaseen / muokkaa staattisia datoja)
2. Paista JSONit               cd build-scripts && bun run generate
       ↓
3. docs/data/*.json päivittyy
       ↓
4. git push  →  GitHub Pages julkaisee docs/-kansion
```

## Editori (kehittäjä)

```bash
bun install
bun run dev       # http://localhost:8080
```

React + Vite + shadcn. Editorin tarkoitus on tehdä analyysien rakentaminen
ja säätäminen sujuvaksi — lukijan ei tarvitse ladata Reactia.

## Lukijaversio

Pelkkää HTML/CSS/vanilla-JS:ää, D3 CDN:stä. Voit avata `docs/index.html`
suoraan selaimessa (tai tarjoilla `docs/`-kansion millä tahansa staattisella
hostingilla). GitHub Actions deployaa sen automaattisesti `main`-haaran
pushissa.

## JSONien generointi

Katso `build-scripts/README.md`. Lyhyesti:

```bash
cd build-scripts
bun install
bun run generate
```

Kirjoittaa `docs/data/*.json` -tiedostot. Commitoi ne mukaan.
