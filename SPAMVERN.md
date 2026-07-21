# Spamvern for kontaktskjemaet

Skjemaet på `/kontakt/` fikk en del automatisk spam (SEO-tilbud, meldinger på
fremmede språk osv.). Vernet er nå lagt inn i to lag. Denne fila forklarer hva
som er gjort, og hvordan du fullfører oppsettet **fra mobilen**.

## Kort oppsummert

| Lag | Hva | Krever oppsett? |
| --- | --- | --- |
| 1. Innholdsfiltre | Avviser meldinger med lenker, ikke-latinsk skrift (kyrillisk, armensk, kinesisk …) og typiske spam-ord (SEO, backlink, casino …). | Nei — virker automatisk. |
| 2. Cloudflare Turnstile | Usynlig «bekreft at du er et menneske» på skjemaet. Stopper bots før meldingen sendes. | Ja — se stegene under. |

Lag 1 fanger begge spam-eksemplene vi så (den engelske SEO-meldingen og den
armenske). Lag 2 er den robuste sperren mot fremtidige bots. Norske og svenske
meldinger med æ, ø, å, ä og ö går fint gjennom.

> Hvorfor ikke ren «IP-sperre til Norge/Sverige»? Det krever å flytte
> navnetjenerne (DNS) for sandmoen.com til Cloudflare, noe som også flytter
> e-posten og kan slå ut `post@sandmoen.com` hvis noe gjøres feil. Vi valgte
> derfor kode-baserte tiltak som stopper spammen uten den risikoen.

---

## Fullfør Turnstile (lag 2) — fra mobilen

Skjemaet virker som normalt også **før** dette er gjort. Turnstile slår seg på
automatisk først når begge nøklene er på plass.

### Steg 1 — Lag en Turnstile-widget i Cloudflare
1. Åpne **dash.cloudflare.com** i mobilnettleseren og logg inn.
2. Meny → **Turnstile** → **Add widget**.
3. Navn: `sandmoen`. Domene: skriv `sandmoen.com` og legg også til
   `www.sandmoen.com`. Widget-modus: **Managed** (anbefalt).
4. Trykk **Create**. Du får nå to nøkler:
   - **Site Key** (offentlig – f.eks. `0x4AAAAA…`)
   - **Secret Key** (hemmelig – f.eks. `0x4AAAAA…`)

### Steg 2 — Legg inn Site Key (offentlig)
1. Åpne repoet på **github.com** (eller GitHub-appen) → fila
   `data/config.json`.
2. Trykk blyant-ikonet for å redigere, og bytt linja:
   ```json
   "siteKey": ""
   ```
   til din egen nøkkel, f.eks.:
   ```json
   "siteKey": "0x4AAAAA_din_site_key"
   ```
3. **Commit changes** direkte til `main` (eller arbeidsgrenen din).

### Steg 3 — Legg inn Secret Key (hemmelig)
Den hemmelige nøkkelen skal **aldri** i koden. Den lagres som en GitHub-secret:
1. På github.com: repoet → **Settings** → **Secrets and variables** → **Actions**.
2. **New repository secret**.
   - Name: `TURNSTILE_SECRET`
   - Secret: lim inn Secret Key fra Cloudflare.
3. **Add secret**. (Samme sted som `DEPLOY_*`-nøklene ligger fra før.)

### Steg 4 — Publiser
1. Repoet → fanen **Actions** → workflowen **«Deploy til Domeneshop (SSH/rsync)»**.
2. **Run workflow** → **Run workflow**. (Lar `slett_gamle` stå av.)
3. Vent til den blir grønn. Da er `dist/kontakt.php` bygget med secret-en satt
   inn, og lagt ut på serveren.

### Steg 5 — Sjekk at det virker
1. Åpne **sandmoen.com/kontakt/**. Du skal se en liten Turnstile-boks over
   «Send henvendelse».
2. Send en testhenvendelse til deg selv — den skal komme fram som normalt.

---

## Slik henger det sammen (for utvikleren)

- `data/config.json` → `turnstile.siteKey`: tom = widget vises ikke.
- `scripts/build.mjs`: legger Turnstile-widget og API-skript i skjemaet når
  site key er satt.
- `src/php/kontakt.php`:
  - `TURNSTILE_SECRET = '@@TURNSTILE_SECRET@@'` — plassholder. Så lenge den
    starter med `@@` er Turnstile av (skjemaet virker likevel).
  - `turnstile_ok()` verifiserer token mot Cloudflare. Avviser kun ved
    eksplisitt `success:false`; ved nettverksfeil slippes henvendelsen gjennom.
  - `ser_ut_som_spam()` er innholdsfiltrene (lag 1).
- `.github/workflows/deploy-domeneshop.yml`: bytter `@@TURNSTILE_SECRET@@` i
  `dist/kontakt.php` med GitHub-secret-en `TURNSTILE_SECRET` ved deploy.
  GitHub Pages-bygget røres ikke, så secret-en havner aldri i en offentlig fil.

### Justere filtrene
Rediger `ser_ut_som_spam()` i `src/php/kontakt.php`. Nøkkelord-lista og
TLD-lista (`.com`, `.ru`, …) kan utvides. `.no` og `.se` er bevisst holdt
utenfor så folk kan nevne norske/svenske nettsteder uten å bli blokkert.
