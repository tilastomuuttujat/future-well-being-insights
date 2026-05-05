# build-scripts/

Paistaa lukijaversion (`docs/`) JSON-tiedostot.

## Asennus

```bash
cd build-scripts
bun install     # tai: npm install
```

## Ympäristö

Luo `.env` (valinnainen — tarvitaan vain kun jokin generaattori lukee Supabasea):

```
SUPABASE_URL=https://yjkabgtbcgvrfqtewtna.supabase.co
SUPABASE_ANON_KEY=...
```

## Ajo

Kaikki generaattorit:

```bash
bun run generate
```

Vain ilmiöt (nopein iterointi):

```bash
bun run generate:ilmiot
```

Tulos kirjoittuu `../docs/data/*.json`-tiedostoihin. Commitoi ne mukaan
gittiin — GitHub Pages tarjoilee ne sellaisinaan lukijasivustolle.

## Generaattorit

| Skripti | Lähde | Kohde |
|---|---|---|
| `generators/ilmiot.ts` | `src/features/ilmiot/data.ts` (staattinen) | `docs/data/ilmiot.json` |
| `generators/reseptit.ts` | `src/data/recipes.ts` (staattinen) | `docs/data/reseptit.json` |
| `generators/keha.ts` | (tuleva) Supabase `v_signal_*` | `docs/data/keha.json` |
| `generators/navigator.ts` | (tuleva) Supabase | `docs/data/navigator.json` |
