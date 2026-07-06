# Handoff — Sandmoen hyttetomter (statisk nettsted)

Dette dokumentet oppsummerer beslutninger, kontekst og oppsett for `sandmoen`-prosjektet, slik at Claude Code kan ta det videre. Skrevet etter en planleggingsøkt i Claude-appen.

---

## 1. Hva vi bygger

Et **statisk nettsted** for gården Sandmoen i Lierne (Trøndelag), som presenterer 15 hyttetomter til feste ved Otersjøen. Erstatter en gammel WordPress-side. Innholdet er enkelt og endres sjelden — derfor **ingen CMS, ingen WordPress, ingen database**. Ren, statisk HTML/CSS/JS.

Eier av gården er Frode Skjelbred (kameraten min). Jeg (Jan Erik, GitHub-bruker `gitjanerik`) er utvikler. Frode skal **ikke** røre kode eller GitHub — vi ble enige om at endringer går via meg: VS Code → GitHub → live. Et enkelt admin-verktøy for Frode kan bygges senere som eget prosjekt, men er **utenfor scope nå**.

---

## 2. Sentrale beslutninger (allerede tatt)

- **Ekte, separate sider — IKKE SPA.** Claude Design-prototypen er en single-page-app der «skjermer» byttes via JS-state. Vi bygger i stedet ekte sider med egne URL-er, primært for SEO (folk googler «hyttetomt Lierne») og delbarhet. Hver tomt får sin egen side.
- **Data-drevet.** All tomtedata ligger i `data/tomter.json`. Detaljsidene **genereres** fra denne via et lite Node-byggeskript. Redigér data ett sted, kjør bygg, alle sider oppdateres. Dette holder også døra åpen for et framtidig admin-verktøy uten ombygging.
- **Relative stier overalt.** Siden publiseres først på GitHub Pages (undermappe `/sandmoen/`) og senere på Domeneshop (rot `/`). Bruk relative lenker/assets så samme bygg funker begge steder uten endring. IKKE hardkod `/sandmoen/` eller absolutte stier fra rot.
- **Vanilla.** Ingen frontend-rammeverk. Semantisk, WCAG-vennlig, mobil-først, responsivt. Korte inline-kommentarer, ikke lange forklaringer. (Node brukes KUN som byggeverktøy lokalt/i CI, ikke i nettleseren.)

---

## 3. Publiseringsstrategi (viktig rekkefølge)

**Fase 1 — nå:** Nytt repo `gitjanerik/sandmoen` på GitHub. Publiser via **GitHub Pages** for rask, synlig testing. Rør IKKE den kjørende WordPress-siden.

**Fase 2 — senere:** Koble på deploy til Domeneshop når siden er klar for `sandmoen.com`. SSH-nøkkelfundamentet er allerede satt opp (se §5).

---

## 4. Kildedesign (Claude Design-handoff)

Prototypen ligger i handoff-bundelen (`Sandmoen.dc.html`). Den er visuelt komplett og skal **gjenskapes visuelt**, men strukturen konverteres fra SPA til ekte sider. Design-token oppsummert fra kilden:

**Farger**
- Bakgrunn (papir): `#F4F0E6`
- Mørk grønn (hero/seksjoner/footer): `#26412f`, dypere `#1f3327`
- Tekst: `#20271F` / `#1b271d`, dempet `#6B7363` / `#8A917F`
- Aksent (terrakotta, CTA): `#B0552F`, hover `#97461f`
- Kortkant/hairline: `#E2DCCB`, seksjonsvariant `#EDE7D8`
- Statusbadger: Ledig `#2C6B3F` på `#E4EFE3` · Reservert `#9A6712` på `#F4E9CF` · Bortfestet `#6F6857` på `#ECE7DA`

**Typografi** (Google Fonts)
- Display: **Spectral** (600) — overskrifter, tomtenummer, tall
- Brødtekst/UI: **Hanken Grotesk** (400–700)
- `font-variant-numeric: tabular-nums` på priser/areal

**Sidetyper som skal bygges**
1. **Forside** — hero med utsiktsbilde + terrakotta-badge «Felt 4 · Lifjellet», statistikkstripe (ledige, engangsbeløp, strøm/vei, arealspenn), «Utvalgte tomter» (3 ledige kort), «Om stedet»-seksjon.
2. **Tomteoversikt** — grønn toppseksjon, filterrad (status/utsikt/sortering), visningsveksler **Kort / Liste / Kart**, teller. Dette er den ene siden med reell interaktivitet — behold som lett vanilla-JS. Kartvisningen er en skjematisk SVG med klikkbare nummererte tomte-pins (koordinater `x`/`y` i prosent ligger i data).
3. **Detaljside per tomt** — bildegalleri (hero + thumbs + lightbox) eller stilisert SVG-placeholder når foto mangler, faktabokser (areal/utsikt/sol/status), «Dette følger med», reguleringskart, sticky sidepanel med pris + CTA «Meld interesse».
4. **Kontakt** — skjema (navn, telefon, e-post, tomt, melding) + kontaktinfo. Merk: prototypens skjema er bare fake-state. Vi trenger en **ekte** innsendingsløsning — se §6 åpne spørsmål.

**Kontaktinfo (ekte, fra design):** Frode Skjelbred · tlf 472 774 42 · post@sandmoen.com

**Responsiv:** brekkpunkt 880px. Skjul sekundær-nav, kollaps grid til 1–2 kolonner, kart/galleri stables, tabeller får `overflow-x`. `prefers-reduced-motion` respekteres.

---

## 5. Server-/deploy-fundament (FERDIG satt opp)

Alt dette er verifisert fungerende i planleggingsøkta:

- **Host:** Domeneshop, SSH på `login.domeneshop.no` (port 22), bruker `sandmoencom`.
- **Web-rot bekreftet:** `/home/3/s/sandmoencom/www`
  - Den kjørende WP-siden ligger i undermappa `www/wordpress/`. Roten inneholder også gammel skrot (FrontPage `_vti_*` fra 2008, `Joomla` fra 2009, `images`, `index_ORIG.html`). **Rør ikke** disse ennå.
  - Det ligger en `.htaccess` (2021) i roten som trolig styrer ruting til `wordpress/`. **Denne må inspiseres** (`cat ~/www/.htaccess`) før vi bytter — avgjør hvor ny side må ligge. TODO før Fase 2.
- **SSH deploy-nøkkel (ed25519):**
  - Privat: `C:\Users\Janer\.ssh\sandmoen_deploy` (skal inn som GitHub Actions-secret ved Fase 2 — ALDRI commites)
  - Offentlig: lagt i `/home/3/s/sandmoencom/.ssh/authorized_keys` på serveren
  - Rettigheter satt korrekt: `.ssh` = 700, `authorized_keys` = 600
  - **Passordfri innlogging testet og virker:** `ssh -i %USERPROFILE%\.ssh\sandmoen_deploy sandmoencom@login.domeneshop.no`
- **Deploy-metode Fase 2:** GitHub Actions → rsync over SSH til `www/` (eller testmappe `www/ny/` først). Bygg statisk, synk `dist/`.

Lokal maskin: Windows, VS Code. Lokalt repo: `C:\Sourcecode\Sandmoen`.

---

## 6. Åpne spørsmål å avklare med meg før/underveis

1. **Kontaktskjema:** GitHub Pages og statisk Domeneshop kan ikke ta imot skjema-post uten en tredjepart. Alternativer: (a) enkel `mailto:`-lenke, (b) tjeneste som Formspree/Web3Forms, (c) senere en liten serverfunksjon. Avklar hvilken.
2. **Bilder:** Kun tomt 7 har foto foreløpig (5 bilder). Resten bruker stiliserte SVG-placeholders. Flere bilder legges inn senere.
3. **Reguleringskart:** prototypen har en placeholder (`felt4-kart.png`). Ekte kart/lenke til Lierne kommune må inn.
4. **Domeneshop `.htaccess`:** må leses før Fase 2-byttet.

---

## 7. Foreslått prosjektstruktur

```
sandmoen/
├── README.md
├── HANDOFF.md                 # dette dokumentet
├── package.json               # kun byggeskript (Node), ingen runtime-deps
├── data/
│   └── tomter.json            # all tomtedata (kilde til sannhet)
├── src/
│   ├── templates/             # sidemaler (forside, oversikt, tomt, kontakt)
│   ├── partials/              # header, footer, kort, badge
│   ├── css/style.css          # ett stilark, moderne CSS (nesting/vars/layer)
│   ├── js/oversikt.js         # filter + kort/liste/kart-veksler + lightbox
│   └── assets/                # bilder, ikoner
├── scripts/
│   └── build.mjs              # genererer dist/ fra data + maler
├── dist/                      # byggeutdata (deployes; gitignores)
└── .github/workflows/
    └── deploy.yml             # Fase 2: rsync til Domeneshop
```

Byggeskriptet (`build.mjs`) leser `tomter.json`, fyller maler, skriver ferdige HTML-sider til `dist/` (bl.a. én `tomt/<nr>/index.html` per tomt for pene URL-er). Hold det lite og avhengighetsfritt — gjerne ren Node uten template-motor, eller en minimal én som `eta`/`mustache` hvis klart begrunnet.

---

## 8. Tomtedata (kopi fra prototypen — legg i data/tomter.json)

Feltene per tomt: `nr`, `areal` (dekar), `status` (Ledig/Reservert/Festet), `utsikt`, `sol`, `terreng`, `x`/`y` (kart-posisjon i %), `foto` (bool), evt. `bilder` (array). Felles vilkår: engangsbeløp kr 300 000, festeavgift kr 6 000/år.

Hjelpeformatering fra prototypen som bør gjenskapes: pris som `kr 300 000` (mellomrom som tusenskille), areal som `1,0 da` (komma), festeavgift `kr 6 000 /år`. Statusetikett «Festet» vises som «Bortfestet» i UI.

---

## 9. Første steg for Claude Code

1. Init repo `gitjanerik/sandmoen`, legg inn denne strukturen og `HANDOFF.md`.
2. Legg tomtedata i `data/tomter.json`.
3. Bygg design-token + `style.css` fra §4, gjenskap forsiden først (visuell fasit = prototypen), få den til å se riktig ut på mobil og desktop.
4. Bygg byggeskriptet som genererer oversikt + detaljsider.
5. Sett opp GitHub Pages-publisering (Fase 1).
6. Stopp og vis meg resultatet før vi går videre til Domeneshop-deploy (Fase 2) og kontaktskjema.

Spør meg om de åpne punktene i §6 når de blir relevante, i stedet for å gjette.
