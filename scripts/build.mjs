// Bygger statiske sider til dist/ fra data/ + maler. Ingen runtime-avhengigheter.
import { readFileSync, rmSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

const tomter = JSON.parse(readFileSync(join(ROOT, 'data/tomter.json'), 'utf8'));
const config = JSON.parse(readFileSync(join(ROOT, 'data/config.json'), 'utf8'));
const { vilkaar, kontakt, sted, lenker, folgerMed, merknad, url } = config;
const SITE_URL = (url || '').replace(/\/$/, '');
const OG_IMAGE = SITE_URL + '/assets/hero-poster.jpeg';

/* ---------- Formatering (speiler prototypens hjelpere) ---------- */
const kr = (n) => 'kr ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const areaTxt = (a) => a.toFixed(1).replace('.', ',') + ' da';
const engangsTxt = kr(vilkaar.engangsbelop);
const festeTxt = kr(vilkaar.festeavgift) + ' /år';

function badge(status) {
  if (status === 'Ledig') return { t: 'Ledig', cls: 'badge-ledig', fg: '#2C6B3F', bg: '#E4EFE3' };
  if (status === 'Reservert') return { t: 'Reservert', cls: 'badge-reservert', fg: '#9A6712', bg: '#F4E9CF' };
  return { t: 'Bortfestet', cls: 'badge-festet', fg: '#6F6857', bg: '#ECE7DA' };
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Kort «areal · utsikt · sol» — hopper over tomme felt.
const metaLine = (t) => [areaTxt(t.areal), t.utsikt, t.sol].filter(Boolean).map(esc).join(' · ');
// Fokuspunkt for cover-beskjæring per bilde (mer himmel). Standard favoriserer toppen.
const fokus = config.fokus || {};
const bgpos = (file) => fokus[file] || 'center 20%';

/* ---------- Relative stier per sidedybde ---------- */
function links(depth) {
  const r = '../'.repeat(depth);
  return {
    root: r,
    home: r || './',
    oversikt: r + 'tomter/',
    kontakt: r + 'kontakt/',
    css: r + 'css/style.css',
    tomt: (nr) => r + 'tomt/' + nr + '/',
    asset: (f) => r + 'assets/' + f,
    js: (f) => r + 'js/' + f,
  };
}

/* ---------- SVG-plassholder for kort uten foto ---------- */
function cardPlaceholder(h) {
  const top = h === 184
    ? 'M0 120 L70 90 L140 116 L210 78 L280 112 L350 84 L400 116 L400 184 L0 184 Z'
    : 'M0 104 L70 78 L140 100 L210 68 L280 96 L350 72 L400 100 L400 160 L0 160 Z';
  const bot = h === 184
    ? 'M0 146 L90 118 L170 140 L250 110 L330 140 L400 120 L400 184 L0 184 Z'
    : 'M0 126 L90 102 L170 122 L250 96 L330 122 L400 104 L400 160 L0 160 Z';
  return `<svg viewBox="0 0 400 ${h}" preserveAspectRatio="none"><path d="${top}" fill="rgba(255,255,255,.07)"/><path d="${bot}" fill="rgba(0,0,0,.16)"/></svg>`;
}

/* ---------- Tomtekort ---------- */
function tomtCard(t, L, { compact = false } = {}) {
  const b = badge(t.status);
  const h = compact ? 160 : 184;
  const media = (t.bilder && t.bilder.length)
    ? `<div class="photo" style="background-image:url('${L.asset(t.bilder[0])}');background-position:${bgpos(t.bilder[0])}"></div>`
    : cardPlaceholder(h);
  return `<a class="tomt-card" href="${L.tomt(t.nr)}">
      <div class="media">
        ${media}
        <div class="shade"></div>
        <span class="badge ${b.cls}">${b.t}</span>
        <span class="nr">Tomt ${t.nr}</span>
      </div>
      <div class="body">
        <div class="meta">${metaLine(t)}</div>
        <div class="price tabnum">${engangsTxt}</div>
        <div class="feste tabnum">+ festeavgift ${festeTxt}</div>
        <div class="terreng">${esc(t.terreng)}</div>
      </div>
    </a>`;
}

/* ---------- Head + rammer ---------- */
const FAVICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='10' fill='%2326412f'/><text x='20' y='28' font-family='Georgia,serif' font-size='22' font-weight='700' fill='%23F4F0E6' text-anchor='middle'>S</text></svg>";

function head(title, desc, L, path = '', opts = {}) {
  const canonical = SITE_URL ? SITE_URL + '/' + path : '';
  const seo = opts.noindex ? '\n<meta name="robots" content="noindex">' : SITE_URL ? `
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sandmoen">
<meta property="og:locale" content="nb_NO">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${OG_IMAGE}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${OG_IMAGE}">` : '';
  return `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#26412f">
<link rel="icon" href="${FAVICON}">${seo}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${L.css}">
</head>
<body>
<div class="page">`;
}

function header(L, current) {
  const cur = (k) => (current === k ? ' aria-current="page"' : '');
  return `<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${L.home}">
      <span class="brand-mark">S</span>
      <span class="brand-name"><b>${esc(sted.navn)}</b><span>${esc(sted.undertittel)}</span></span>
    </a>
    <nav class="nav">
      <span class="nav-links">
        <a href="${L.oversikt}"${cur('oversikt')}>Hyttetomter</a>
        <a href="${L.home}#om">Om Sandmoen</a>
        <a href="${L.kontakt}"${cur('kontakt')}>Kontakt</a>
      </span>
      <a class="btn btn-primary" href="${L.kontakt}">Meld interesse</a>
    </nav>
  </div>
</header>
<main>`;
}

function footer(L) {
  return `</main>
<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <div class="footer-brand"><span class="mark">S</span><b>Sandmoen gård</b></div>
      <p>Hyttetomter ved Otersjøen, langs fylkesvei 74 i Lierne. Drevet videre av familien på gården gjennom generasjoner.</p>
    </div>
    <div class="footer-col">
      <h4>Tomtene</h4>
      <a href="${L.oversikt}">Alle hyttetomter</a>
      <a href="${esc(lenker.reguleringsplan)}" target="_blank" rel="noopener">Kart over feltet</a>
      <a href="${L.kontakt}">Meld interesse</a>
    </div>
    <div class="footer-col">
      <h4>Kontakt</h4>
      <div class="lines">${esc(kontakt.navn)}<br>${esc(kontakt.telefon)}<br>${esc(kontakt.epost)}</div>
    </div>
  </div>
  <div class="footer-bottom"><div class="wrap">© 2026 Sandmoen gård · Lierne, Trøndelag</div></div>
</footer>
</div>
</body>
</html>`;
}

/* ---------- Forside ---------- */
function forside() {
  const L = links(0);
  const ledige = tomter.filter((t) => t.status === 'Ledig');
  const featured = ledige.slice(0, 3);
  const arealSpenn = () => {
    const a = tomter.map((t) => t.areal);
    return areaTxt(Math.min(...a)).replace(' da', '') + '–' + areaTxt(Math.max(...a));
  };
  return head('Sandmoen — Hyttetomter ved Otersjøen i Lierne',
    `${tomter.length} hyttetomter til feste ved Otersjøen på Lifjellet i Lierne. Strøm framført, engangsbeløp kr 300 000. Fiske, nasjonalpark og skiløyper.`, L)
    + header(L, 'forside')
    + `
<section class="hero">
  <div class="hero-bg" style="background-image:url('${L.asset('hero-poster.jpeg')}')"></div>
  <video class="hero-video" muted loop playsinline preload="metadata" poster="${L.asset('hero-poster.jpeg')}">
    <source src="${L.asset('hero-loop.mp4')}" type="video/mp4">
  </video>
  <div class="hero-veil"></div>
  <div class="wrap hero-wrap">
    <div class="hero-inner">
      <span class="pill-light">Lifjellet i Lierne</span>
      <h1>Din egen hyttetomt ved Otersjøen</h1>
      <p>${tomter.length} ryddede tomter på fjellet, med strøm framført. Fiske og bål om sommeren, skiløyper og nordlys om vinteren — fire mil fra svenskegrensen, midt i Blåfjella-Skjækerfjella og Lierne nasjonalparker.</p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-lg" href="${L.oversikt}">Se de ledige tomtene →</a>
        <a class="btn btn-glass btn-lg" href="${L.oversikt}">Slik fester du tomt</a>
      </div>
    </div>
  </div>
  <div class="hero-controls">
    <button class="hero-playpause" type="button" aria-label="Spill av bakgrunnsvideo">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 5v14l11-7z"/></svg>
    </button>
    <button class="hero-videobtn" type="button" aria-haspopup="dialog">
      <span class="play"><svg viewBox="0 0 24 24" width="9" height="9" fill="currentColor" aria-hidden="true"><path d="M7 5v14l11-7z"/></svg></span> Se video fra området
    </button>
  </div>
</section>

<div class="videomodal" id="videomodal" hidden role="dialog" aria-label="Videopresentasjon">
  <button class="vm-close" type="button" aria-label="Lukk">×</button>
  <video id="vm-video" controls playsinline preload="none" poster="${L.asset('hero-poster.jpeg')}">
    <source src="${L.asset('hero-full.mp4')}" type="video/mp4">
  </video>
</div>

<section class="stats">
  <div class="wrap">
    <div><div class="stat-v">${ledige.length}</div><div class="stat-l">ledige tomter nå</div></div>
    <div><div class="stat-v tabnum">${engangsTxt}</div><div class="stat-l">engangsbeløp ved feste</div></div>
    <div><div class="stat-v">Strøm</div><div class="stat-l">framført til feltet</div></div>
    <div><div class="stat-v">${arealSpenn()}</div><div class="stat-l">romslige tomter</div></div>
  </div>
</section>

<section class="wrap section">
  <div class="section-head">
    <div>
      <span class="eyebrow">Utvalgte tomter</span>
      <h2>Ledige nå i felt 4</h2>
    </div>
    <a class="btn btn-outline" href="${L.oversikt}">Se alle ${tomter.length} tomter</a>
  </div>
  <div class="grid-3">
    ${featured.map((t) => tomtCard(t, L)).join('\n    ')}
  </div>
</section>

<section class="section-sand" id="om">
  <div class="wrap om-grid">
    <div>
      <span class="eyebrow">Om stedet</span>
      <h2 class="h2-lg">Et sted som har gått i arv i generasjoner</h2>
      <p>Gården Sandmoen ligger ved Otersjøen langs fylkesvei 74, på venstre hånd rett etter at man kommer ned fra Lifjellet. Terje Endseth tok over som 23-åring i 1972 og drev gården til 2010. I dag drives den videre av familien Skjelbred.</p>
      <p>Otersjøen er et godt fiskevann med ørret og røye. Det er fire mil til svenskegrensen, to mil til slalåmbakken på Holand, og terrenget egner seg godt for småviltjakt. Tomtene ligger midt i et av landets fineste turområder.</p>
      <div class="om-tags">
        <span class="tag">Fiske i Otersjøen</span>
        <span class="tag">Nasjonalpark</span>
        <span class="tag">Småviltjakt</span>
        <span class="tag">Skiløyper &amp; alpint</span>
      </div>
    </div>
    <div class="om-photo"><div style="background-image:url('${L.asset('tomt7-1.jpeg')}');background-position:${bgpos('tomt7-1.jpeg')}"></div></div>
  </div>
</section>
<script src="${L.js('herovideo.js')}"></script>
`
    + footer(L);
}

/* ---------- Oversikt ---------- */
function oversikt() {
  const L = links(1);
  const sorted = tomter.slice().sort((a, b) => a.nr - b.nr);
  // Data for klient-JS (filter/sortering/visninger). Stier ferdig utregnet.
  const clientData = sorted.map((t) => {
    const b = badge(t.status);
    return {
      nr: t.nr, areal: t.areal, arealTxt: areaTxt(t.areal), status: t.status,
      utsikt: t.utsikt, sol: t.sol, terreng: t.terreng,
      engangsTxt, festeTxt, href: L.tomt(t.nr),
      badgeT: b.t, badgeCls: b.cls,
      hasFoto: !!(t.bilder && t.bilder.length),
      heroUrl: (t.bilder && t.bilder.length) ? L.asset(t.bilder[0]) : '',
      heroPos: (t.bilder && t.bilder.length) ? bgpos(t.bilder[0]) : 'center 20%',
    };
  });

  // Filtre vises kun når dataene gjør dem meningsfulle.
  const statuser = [...new Set(sorted.map((t) => t.status))];
  const utsikter = [...new Set(sorted.map((t) => t.utsikt).filter(Boolean))];
  const visStatus = statuser.length >= 2;
  const visUtsikt = utsikter.length >= 2;

  const statusField = visStatus ? `<div class="field">
        <label for="f-status">Status</label>
        <select id="f-status">
          <option value="alle">Alle statuser</option>
          ${statuser.map((s) => `<option value="${esc(s)}">${badge(s).t}</option>`).join('\n          ')}
        </select>
      </div>` : '';
  const utsiktField = visUtsikt ? `<div class="field">
        <label for="f-utsikt">Utsikt</label>
        <select id="f-utsikt">
          <option value="alle">All utsikt</option>
          ${utsikter.map((u) => `<option value="${esc(u)}">${esc(u)}</option>`).join('\n          ')}
        </select>
      </div>` : '';
  const sortField = `<div class="field">
        <label for="f-sort">Sortering</label>
        <select id="f-sort">
          <option value="nr">Tomtenummer</option>
          <option value="areal">Størst areal først</option>
          ${visStatus ? '<option value="status">Status</option>' : ''}
        </select>
      </div>`;

  return head('Hyttetomter til feste — Sandmoen',
    `Se alle ${sorted.length} hyttetomtene i Felt 4 på Lifjellet — areal, utsikt og festevilkår. Kort og liste.`, L, 'tomter/')
    + header(L, 'oversikt')
    + `
<section class="top-green">
  <div class="wrap">
    <span class="eyebrow">Felt 4 · Lifjellet</span>
    <h1>Hyttetomter til feste</h1>
    <p>${sorted.length} tomter på Lifjellet festes bort. ${esc(merknad)} Engangsbeløp ${engangsTxt} og årlig festeavgift ${kr(vilkaar.festeavgift)} for samtlige tomter.</p>
    <a class="plan-link" href="${esc(lenker.reguleringsplan)}" target="_blank" rel="noopener">Reguleringsplan fra Lierne kommune →</a>
  </div>
</section>

<div class="wrap" style="padding-top:26px;padding-bottom:80px">
  <div class="toolbar">
      ${statusField}
      ${utsiktField}
      ${sortField}
    <div class="toolbar-right">
      <span class="count"><b class="tabnum" id="count">${sorted.length}</b> tomter</span>
      <div class="viewtoggle" role="group" aria-label="Visning">
        <button type="button" data-view="kort" aria-pressed="true">Kort</button>
        <button type="button" data-view="liste" aria-pressed="false">Liste</button>
      </div>
    </div>
  </div>

  <div class="view is-active" id="view-kort">
    <div class="grid-cards" id="kort-grid">
      ${sorted.map((t) => tomtCard(t, L, { compact: true })).join('\n      ')}
    </div>
  </div>

  <div class="view" id="view-liste">
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Tomt</th><th>Areal</th><th>Utsikt</th>
          <th class="num">Engangsbeløp</th><th class="num">Festeavgift</th><th>Status</th><th></th>
        </tr></thead>
        <tbody id="liste-body"></tbody>
      </table>
    </div>
  </div>
</div>

<script>window.__TOMTER__=${JSON.stringify(clientData)};</script>
<script src="${L.js('oversikt.js')}"></script>
`
    + footer(L);
}

/* ---------- Detaljside ---------- */
function detalj(t) {
  const L = links(2);
  const b = badge(t.status);
  const raw = t.bilder || [];
  const bilder = raw.map((f) => L.asset(f));
  const pos = raw.map((f) => bgpos(f));
  const hasFoto = bilder.length > 0;
  const andre = tomter.filter((x) => x.status === 'Ledig' && x.nr !== t.nr).slice(0, 3);

  let gallery;
  if (hasFoto) {
    const more = bilder.length - 3;
    gallery = `<div class="gallery-grid">
      <button class="gallery-main" type="button" data-lb="0">
        <div class="photo" style="background-image:url('${bilder[0]}');background-position:${pos[0]}"></div>
        <span class="badge ${b.cls}">${b.t}</span>
        <span class="nr">Tomt ${t.nr}</span>
      </button>
      <div class="gallery-thumbs">
        <button type="button" data-lb="1"><div class="photo" style="background-image:url('${bilder[1] || ''}');background-position:${pos[1] || 'center 20%'}"></div></button>
        <button type="button" data-lb="2">
          <div class="photo" style="background-image:url('${bilder[2] || ''}');background-position:${pos[2] || 'center 20%'}"></div>
          ${more > 0 ? `<span class="gallery-more">+${more} bilder</span>` : ''}
        </button>
      </div>
    </div>`;
  } else {
    gallery = `<div class="ph-grid">
      <div class="ph-main">
        <svg viewBox="0 0 700 420" preserveAspectRatio="none"><path d="M0 250 L130 200 L260 248 L390 188 L520 244 L640 196 L700 240 L700 420 L0 420 Z" fill="rgba(255,255,255,.07)"/><path d="M0 300 L160 256 L320 300 L480 250 L620 300 L700 268 L700 420 L0 420 Z" fill="rgba(0,0,0,.18)"/></svg>
        <span class="badge ${b.cls}">${b.t}</span>
        <span class="nr">Tomt ${t.nr}</span>
        <span class="foto-txt">Bilder kommer</span>
      </div>
      <div class="ph-col">
        <div class="ph-tile utsikt"><svg viewBox="0 0 400 200" preserveAspectRatio="none"><rect x="0" y="120" width="400" height="80" fill="rgba(255,255,255,.08)"/><path d="M0 120 L100 96 L200 118 L300 92 L400 116 L400 200 L0 200 Z" fill="rgba(0,0,0,.15)"/></svg><span>Utsikt mot ${esc(t.utsikt)}</span></div>
        <div class="ph-tile terreng"><svg viewBox="0 0 400 200" preserveAspectRatio="none"><path d="M0 140 L80 110 L160 136 L240 104 L320 134 L400 110 L400 200 L0 200 Z" fill="rgba(0,0,0,.14)"/></svg><span>Terreng på tomta</span></div>
      </div>
    </div>`;
  }

  const lightbox = hasFoto ? `
<div class="lightbox" id="lightbox" hidden data-bilder='${JSON.stringify(bilder)}'>
  <div class="stage" id="lb-stage"></div>
  <button class="close" type="button" aria-label="Lukk">×</button>
  <button class="prev" type="button" aria-label="Forrige bilde">‹</button>
  <button class="next" type="button" aria-label="Neste bilde">›</button>
  <span class="counter" id="lb-counter"></span>
</div>
<script src="${L.js('lightbox.js')}"></script>` : '';

  return head(`Hyttetomt ${t.nr} — Sandmoen`,
    `Hyttetomt ${t.nr} ved Otersjøen — ${areaTxt(t.areal)}, utsikt ${t.utsikt}, ${b.t.toLowerCase()}. Engangsbeløp ${engangsTxt}, festeavgift ${festeTxt}.`, L, `tomt/${t.nr}/`)
    + header(L, 'oversikt')
    + `
<div class="wrap" style="padding-top:24px;padding-bottom:14px">
  <a class="back-link" href="${L.oversikt}">← Tilbake til alle tomter</a>
</div>

<div class="wrap" style="padding-bottom:30px">
  ${gallery}
</div>

<div class="wrap detalj-layout">
  <div>
    <span class="eyebrow">${esc(sted.felt)}</span>
    <h1>Hyttetomt ${t.nr}</h1>
    <p class="detalj-lead">${esc(t.terreng)} Festet gir deg en romslig tomt midt i et av Trøndelags fineste turområder. Strøm er framført til feltet — vann og vei er ikke opparbeidet.</p>

    <div class="facts">
      <div class="fact"><div class="k">Areal</div><div class="v tabnum">${areaTxt(t.areal)}</div></div>
      <div class="fact"><div class="k">Utsikt</div><div class="v">${esc(t.utsikt) || 'Kommer'}</div></div>
      <div class="fact"><div class="k">Solforhold</div><div class="v">${esc(t.sol) || 'Kommer'}</div></div>
      <div class="fact"><div class="k">Status</div><div class="v">${b.t}</div></div>
    </div>

    <h2>Dette følger med</h2>
    <div class="includes">
      ${folgerMed.map((x) => `<div><span class="dot"></span>${esc(x)}</div>`).join('\n      ')}
    </div>

    <h2>Plassering i feltet</h2>
    <p class="plan-info">${t.bfr ? `I reguleringsplanen er dette <strong>${esc(t.bfr)}</strong>. ` : ''}<a href="${esc(lenker.reguleringsplan)}" target="_blank" rel="noopener">Se tomta i reguleringsplanen (kommunekart) →</a></p>
    <div class="felt-kart">
      <div class="img" style="background-image:url('${L.asset('felt4-kart.png')}')"></div>
      <span class="note">Reguleringskart · Lierne kommune</span>
    </div>
  </div>

  <aside class="detalj-aside">
    <div class="k">Engangsbeløp ved feste</div>
    <div class="big tabnum">${engangsTxt}</div>
    <div class="aside-row"><span>Årlig festeavgift</span><b class="tabnum">${festeTxt}</b></div>
    <div class="aside-row"><span>Areal</span><b class="tabnum">${areaTxt(t.areal)}</b></div>
    <div class="aside-row"><span>Status</span><span class="badge ${b.cls}">${b.t}</span></div>
    <p class="aside-merknad">${esc(merknad)}</p>
    <a class="btn btn-primary btn-block" href="${L.kontakt}?tomt=${t.nr}">Meld interesse for tomt ${t.nr}</a>
    <a class="btn btn-sand btn-block" href="${L.kontakt}">Still et spørsmål</a>
  </aside>
</div>

<section class="section-sand">
  <div class="wrap" style="padding-top:54px;padding-bottom:66px">
    <h2 style="font:600 28px var(--font-display);margin:0 0 22px;color:var(--ink-2)">Andre ledige tomter</h2>
    <div class="andre-grid">
      ${andre.map((x) => `<a class="andre-card" href="${L.tomt(x.nr)}">
        <span class="mark">${x.nr}</span>
        <span class="info"><b>Tomt ${x.nr}</b><span>${areaTxt(x.areal)} · ${esc(x.utsikt)}</span><span class="price tabnum">${engangsTxt}</span></span>
      </a>`).join('\n      ')}
    </div>
  </div>
</section>
${lightbox}
`
    + footer(L);
}

/* ---------- Kontakt ---------- */
function kontaktside() {
  const L = links(1);
  return head('Kontakt & meld interesse — Sandmoen',
    'Meld interesse for en hyttetomt ved Otersjøen. Kontakt Frode Skjelbred på 472 774 42 eller post@sandmoen.com.', L, 'kontakt/')
    + header(L, 'kontakt')
    + `
<section class="top-green">
  <div class="wrap">
    <span class="eyebrow">Kontakt &amp; interesse</span>
    <h1>Meld interesse for en tomt</h1>
    <p>Fyll ut skjemaet, så tar vi kontakt og avtaler en visning. Det er helt uforpliktende. Du kan også ringe oss direkte.</p>
  </div>
</section>

<div class="wrap kontakt-layout">
  <div class="form-card">
    <form class="form" id="kontakt-form" action="/kontakt.php" method="post">
      <div class="hp" aria-hidden="true"><label>La stå tom<input name="nettsted" tabindex="-1" autocomplete="off"></label></div>
      <div class="form-row form-grid-gap">
        <label><span>Navn</span><input name="navn" required placeholder="Ditt navn"></label>
        <label><span>Telefon</span><input name="tlf" placeholder="Telefonnummer"></label>
      </div>
      <label><span>E-post</span><input name="epost" type="email" required placeholder="din@epost.no"></label>
      <label><span>Tomt du er interessert i</span><input name="tomt" id="felt-tomt" placeholder="F.eks. Tomt 7 — eller la stå åpent"></label>
      <label><span>Melding</span><textarea name="melding" rows="4" placeholder="Skriv gjerne litt om hva du lurer på"></textarea></label>
      <p class="cap-error" id="send-error" hidden></p>
      <button class="btn btn-primary btn-lg" type="submit">Send henvendelse</button>
    </form>
    <div class="form-ok" id="form-ok" hidden>
      <div class="check">✓</div>
      <h2>Takk for interessen</h2>
      <p>Vi har mottatt henvendelsen din og tar kontakt så snart vi kan.</p>
      <button class="btn btn-sand" type="button" id="form-reset">Send en ny henvendelse</button>
    </div>
  </div>

  <aside class="kontakt-aside">
    <div class="info-card">
      <h3>Ring oss</h3>
      <div class="lines">${esc(kontakt.navn)}<br>
        <a class="strong tabnum" href="tel:${esc(kontakt.telefonLenke)}">${esc(kontakt.telefon)}</a><br>
        <a href="mailto:${esc(kontakt.epost)}">${esc(kontakt.epost)}</a></div>
    </div>
    <div class="info-card">
      <h3>Finn fram</h3>
      <p>Sandmoen ligger ved Otersjøen langs fylkesvei 74, på venstre hånd rett etter at man kommer ned fra Lifjellet.</p>
    </div>
    <div class="info-card sand">
      <h3>Festevilkår kort</h3>
      <p>Engangsbeløp ${engangsTxt} og årlig festeavgift ${kr(vilkaar.festeavgift)} per tomt. ${esc(merknad)}</p>
    </div>
  </aside>
</div>
<script src="${L.js('kontakt.js')}"></script>
`
    + footer(L);
}

/* ---------- Redirect-side (alias) ---------- */
// Statisk omdirigering som virker uten serverconfig (GitHub Pages + Domeneshop).
// Brukes bl.a. for /tomt/ → /tomter/ når man kutter siste ledd av /tomt/<nr>/.
function redirect(title, to) {
  return `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="canonical" href="${to}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace('${to}' + location.search + location.hash);</script>
</head>
<body>
<p>Omdirigerer til <a href="${to}">hyttetomtene</a> …</p>
</body>
</html>`;
}

/* ---------- 404-side (grasiøs landing for døde/gamle lenker) ---------- */
function notFound() {
  // Serveres for vilkårlige URL-er, så alle lenker må være rot-absolutte.
  const L = {
    root: '/', home: '/', oversikt: '/tomter/', kontakt: '/kontakt/',
    css: '/css/style.css', tomt: (nr) => '/tomt/' + nr + '/',
    asset: (f) => '/assets/' + f, js: (f) => '/js/' + f,
  };
  return head('Side ikke funnet — Sandmoen',
    'Siden finnes ikke. Sandmoen har fått nye nettsider — gå til forsiden eller se de ledige hyttetomtene.',
    L, '', { noindex: true })
    + header(L, '')
    + `
<section class="notfound-section">
  <div class="wrap">
    <div class="notfound">
      <span class="eyebrow">404 · Side ikke funnet</span>
      <h1>Denne siden finnes ikke lenger</h1>
      <p>Sandmoen har fått nye nettsider. Siden du lette etter kan ha flyttet eller blitt fjernet. Prøv forsiden, eller se de ledige hyttetomtene.</p>
      <div class="notfound-cta">
        <a class="btn btn-primary" href="/">Til forsiden</a>
        <a class="btn btn-sand" href="/tomter/">Se hyttetomtene</a>
      </div>
    </div>
  </div>
</section>`
    + footer(L);
}

/* ---------- Skriv dist/ ---------- */
function write(rel, html) {
  const out = join(DIST, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

write('index.html', forside());
write('tomter/index.html', oversikt());
write('kontakt/index.html', kontaktside());
for (const t of tomter) write(`tomt/${t.nr}/index.html`, detalj(t));
// Alias: /tomt/ (uten nummer) → /tomter/ slik at avkortede URL-er lander riktig.
write('tomt/index.html', redirect('Hyttetomter — Sandmoen', '../tomter/'));
// Grasiøs 404 + Apache ErrorDocument for gamle/døde lenker (f.eks. WordPress-URL-er).
write('404.html', notFound());
write('.htaccess', 'ErrorDocument 404 /404.html\n');

cpSync(join(SRC, 'css'), join(DIST, 'css'), { recursive: true });
cpSync(join(SRC, 'js'), join(DIST, 'js'), { recursive: true });
cpSync(join(SRC, 'assets'), join(DIST, 'assets'), { recursive: true });
cpSync(join(SRC, 'php', 'kontakt.php'), join(DIST, 'kontakt.php'));

// sitemap.xml + robots.txt (krever kanonisk domene i config.url)
if (SITE_URL) {
  const routes = ['', 'tomter/', 'kontakt/', ...tomter.map((t) => `tomt/${t.nr}/`)];
  const urls = routes.map((r) => `  <url><loc>${SITE_URL}/${r}</loc></url>`).join('\n');
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
}

const pages = 3 + tomter.length;
console.log(`Bygde ${pages} sider til dist/ (${tomter.length} tomtesider)${SITE_URL ? ' + sitemap.xml/robots.txt' : ''}.`);
