# Sandmoen

Statisk nettsted for hyttetomter til feste ved Otersjøen, Sandmoen gård i Lierne (Trøndelag).
Erstatter en gammel WordPress-side. Ingen CMS, ingen database — ren, statisk HTML/CSS/JS,
generert fra data med et lite Node-byggeskript.

Se [`HANDOFF.md`](HANDOFF.md) for full kontekst og beslutninger.

## Kom i gang

```bash
npm run build      # genererer dist/
npm run serve      # forhåndsvis dist/ på http://localhost:8080
npm run dev        # bygg + serve
```

Node 18+ kreves. Ingen avhengigheter installeres (`npm install` er ikke nødvendig).

## Struktur

```
data/
  tomter.json     # all tomtedata — kilde til sannhet
  config.json     # priser, kontaktinfo, stedstekst
src/
  css/style.css   # design-tokens + komponentstiler
  js/             # oversikt (filter/kart), lightbox, kontaktskjema
  assets/         # bilder (tomt 7 + reguleringskart)
scripts/
  build.mjs       # genererer dist/ fra data + maler
  serve.mjs       # lokal forhåndsvisning
dist/             # byggeutdata (gitignored, deployes)
```

## Slik endrer du innhold

- **Tomtedata** (status, areal, utsikt, bilder …): rediger `data/tomter.json`, kjør `npm run build`.
- **Priser / kontaktinfo**: rediger `data/config.json`.
- **Nye bilder**: web-optimaliser råbilder først (auto-rotasjon, nedskalering, komprimering),
  så refereres filnavnet i `bilder`-lista på tomta i `tomter.json`:

  ```bash
  npm install                                   # engangs: henter sharp (devDependency)
  node scripts/optimize-images.mjs 14 ~/raabilder-tomt14
  # → skriver src/assets/tomt14-1.jpeg, -2.jpeg … (sortert etter filnavn)
  ```

Alle sider bruker relative stier, så samme bygg fungerer både på GitHub Pages
(undermappe) og på rot-domenet (Domeneshop).

## Sider som genereres

- `index.html` — forside
- `tomter/` — oversikt med filter og kort/liste/kart-visning
- `tomt/<nr>/` — én side per tomt
- `kontakt/` — kontakt og interesseskjema

## Publisering

**Fase 1 (nå):** GitHub Pages via `.github/workflows/pages.yml` — bygger og
publiserer `dist/` ved push til `main`.

**Fase 2 (senere):** deploy til Domeneshop for `sandmoen.com`. Se HANDOFF §5.

## Åpne punkter

- Kontaktskjemaet bruker foreløpig en midlertidig `mailto:`-løsning (HANDOFF §6.1).
- Reguleringskart-lenke peker foreløpig til kommunekart.com generelt (§6.3).
