// Oversiktsside: filter, sortering og veksling kort/liste. Data i window.__TOMTER__.
(() => {
  const data = window.__TOMTER__ || [];
  const state = { status: 'alle', utsikt: 'alle', sort: 'nr', view: 'kort' };

  const $ = (id) => document.getElementById(id);
  const kortGrid = $('kort-grid');
  const listeBody = $('liste-body');
  const countEl = $('count');

  const placeholder = () =>
    '<svg viewBox="0 0 400 160" preserveAspectRatio="none"><path d="M0 104 L70 78 L140 100 L210 68 L280 96 L350 72 L400 100 L400 160 L0 160 Z" fill="rgba(255,255,255,.07)"/><path d="M0 126 L90 102 L170 122 L250 96 L330 122 L400 104 L400 160 L0 160 Z" fill="rgba(0,0,0,.16)"/></svg>';

  const photo = (t) => t.hasFoto
    ? `<div class="photo" style="background-image:url('${t.heroUrl}');background-position:${t.heroPos}"></div>`
    : placeholder();

  const meta = (t) => [t.arealTxt, t.utsikt, t.sol].filter(Boolean).join(' · ');

  const card = (t) => `<a class="tomt-card" href="${t.href}">
      <div class="media">${photo(t)}<div class="shade"></div>
        <span class="badge ${t.badgeCls}">${t.badgeT}</span>
        <span class="nr">Tomt ${t.nr}</span></div>
      <div class="body">
        <div class="meta">${meta(t)}</div>
        <div class="price tabnum">${t.engangsTxt}</div>
        <div class="feste tabnum">+ festeavgift ${t.festeTxt}</div>
        <div class="terreng">${t.terreng}</div>
      </div></a>`;

  const row = (t) => `<tr onclick="location.href='${t.href}'">
      <td class="tomt">Tomt ${t.nr}</td>
      <td class="tabnum">${t.arealTxt}</td>
      <td>${t.utsikt}</td>
      <td class="num price tabnum">${t.engangsTxt}</td>
      <td class="num tabnum">${t.festeTxt}</td>
      <td><span class="badge ${t.badgeCls}">${t.badgeT}</span></td>
      <td class="go"><a href="${t.href}">Se tomt →</a></td>
    </tr>`;

  function filtered() {
    let r = data.slice();
    if (state.status !== 'alle') r = r.filter((t) => t.status === state.status);
    if (state.utsikt !== 'alle') r = r.filter((t) => t.utsikt.indexOf(state.utsikt) >= 0);
    if (state.sort === 'nr') r.sort((a, b) => a.nr - b.nr);
    else if (state.sort === 'areal') r.sort((a, b) => b.areal - a.areal);
    else if (state.sort === 'status') r.sort((a, b) => a.status.localeCompare(b.status, 'nb'));
    return r;
  }

  function render() {
    const list = filtered();
    countEl.textContent = list.length;
    kortGrid.innerHTML = list.map(card).join('');
    listeBody.innerHTML = list.map(row).join('');
  }

  function setView(v) {
    state.view = v;
    document.querySelectorAll('.viewtoggle button').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    document.querySelectorAll('.view').forEach((el) => el.classList.remove('is-active'));
    $('view-' + v).classList.add('is-active');
  }

  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('change', fn); };
  on('f-status', (e) => { state.status = e.target.value; render(); });
  on('f-utsikt', (e) => { state.utsikt = e.target.value; render(); });
  on('f-sort', (e) => { state.sort = e.target.value; render(); });
  document.querySelectorAll('.viewtoggle button').forEach((b) =>
    b.addEventListener('click', () => setView(b.dataset.view)));

  render();
})();
