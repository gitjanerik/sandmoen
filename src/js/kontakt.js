// Kontaktskjema — sender via /kontakt.php (server-side e-post på Domeneshop).
// Forhåndsutfyller tomt fra ?tomt=<nr> og viser bekreftelse uten sidelast.
// Spamvern: skjult honeypot-felt sjekkes server-side (se kontakt.php).
(() => {
  const form = document.getElementById('kontakt-form');
  if (!form) return;
  const ok = document.getElementById('form-ok');
  const sendErr = document.getElementById('send-error');
  const btn = form.querySelector('button[type="submit"]');

  const params = new URLSearchParams(location.search);
  const tomt = params.get('tomt');
  if (tomt) form.querySelector('#felt-tomt').value = 'Tomt ' + tomt;

  // Meldingsfelt: tell UTF-8-bytes, tak på 1000. Ved full kvote: en vennlig hilsen.
  const melding = form.querySelector('textarea[name="melding"]');
  const teller = document.getElementById('char-count');
  if (melding && teller) {
    const MAKS = 1000;
    const enc = new TextEncoder();
    const bytes = (s) => enc.encode(s).length;
    const oppdater = () => {
      while (bytes(melding.value) > MAKS) melding.value = melding.value.slice(0, -1);
      const b = bytes(melding.value);
      const full = b >= MAKS;
      teller.textContent = full ? 'Du har mye på hjertet — ring oss for en hyggelig prat!' : b + ' / ' + MAKS;
      teller.classList.toggle('over', full);
    };
    melding.addEventListener('input', oppdater);
    oppdater();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sendErr) sendErr.hidden = true;

    const opprinnelig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sender …';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        form.hidden = true;
        ok.hidden = false;
        return;
      }
      throw new Error(data.melding || 'Kunne ikke sende meldingen.');
    } catch (err) {
      if (sendErr) {
        sendErr.textContent = (err && err.message)
          ? err.message
          : 'Noe gikk galt. Prøv igjen, eller send e-post direkte til post@sandmoen.com.';
        sendErr.hidden = false;
      }
      if (window.turnstile) window.turnstile.reset(); // token er engangsbruk
    } finally {
      btn.disabled = false;
      btn.textContent = opprinnelig;
    }
  });

  const reset = document.getElementById('form-reset');
  if (reset) reset.addEventListener('click', () => {
    form.reset();
    form.hidden = false;
    ok.hidden = true;
    if (sendErr) sendErr.hidden = true;
    if (window.turnstile) window.turnstile.reset();
  });
})();
