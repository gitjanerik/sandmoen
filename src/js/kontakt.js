// Kontaktskjema — sender via /kontakt.php (server-side e-post på Domeneshop).
// Forhåndsutfyller tomt fra ?tomt=<nr> og viser bekreftelse uten sidelast.
(() => {
  const form = document.getElementById('kontakt-form');
  if (!form) return;
  const ok = document.getElementById('form-ok');
  const sendErr = document.getElementById('send-error');
  const btn = form.querySelector('button[type="submit"]');

  const params = new URLSearchParams(location.search);
  const tomt = params.get('tomt');
  if (tomt) form.querySelector('#felt-tomt').value = 'Tomt ' + tomt;

  // Enkel innebygd captcha (regnestykke) — litt ekstra friksjon mot bots.
  const capQ = document.getElementById('cap-q');
  const capA = document.getElementById('cap-a');
  const capErr = document.getElementById('cap-error');
  let sum = 0;
  function nyCaptcha() {
    const a = 1 + Math.floor(Math.random() * 8);
    const b = 1 + Math.floor(Math.random() * 8);
    sum = a + b;
    capQ.textContent = `${a} + ${b} = ?`;
  }
  nyCaptcha();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sendErr) sendErr.hidden = true;
    if (parseInt(capA.value, 10) !== sum) {
      capErr.hidden = false;
      capA.value = '';
      nyCaptcha();
      capA.focus();
      return;
    }
    capErr.hidden = true;

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
      capA.value = '';
      nyCaptcha();
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
    capErr.hidden = true;
    if (sendErr) sendErr.hidden = true;
    nyCaptcha();
  });
})();
