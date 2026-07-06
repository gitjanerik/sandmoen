// Kontaktskjema — MIDLERTIDIG mailto-løsning (se HANDOFF §6.1: skal avklares).
// Forhåndsutfyller tomt fra ?tomt=<nr>, og åpner e-postklient ved innsending.
(() => {
  const form = document.getElementById('kontakt-form');
  if (!form) return;
  const ok = document.getElementById('form-ok');
  const epost = 'post@sandmoen.com';

  const params = new URLSearchParams(location.search);
  const tomt = params.get('tomt');
  if (tomt) form.querySelector('#felt-tomt').value = 'Tomt ' + tomt;

  // Enkel innebygd captcha (regnestykke) — stopper enkle bots uten tredjepart.
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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (parseInt(capA.value, 10) !== sum) {
      capErr.hidden = false;
      capA.value = '';
      nyCaptcha();
      capA.focus();
      return;
    }
    capErr.hidden = true;
    const f = new FormData(form);
    const emne = f.get('tomt') ? `Interesse for ${f.get('tomt')}` : 'Henvendelse fra sandmoen.com';
    const body = [
      `Navn: ${f.get('navn') || ''}`,
      `Telefon: ${f.get('tlf') || ''}`,
      `E-post: ${f.get('epost') || ''}`,
      `Tomt: ${f.get('tomt') || ''}`,
      '',
      `${f.get('melding') || ''}`,
    ].join('\n');
    location.href = `mailto:${epost}?subject=${encodeURIComponent(emne)}&body=${encodeURIComponent(body)}`;
    form.hidden = true;
    ok.hidden = false;
  });

  const reset = document.getElementById('form-reset');
  if (reset) reset.addEventListener('click', () => {
    form.reset(); form.hidden = false; ok.hidden = true; capErr.hidden = true; nyCaptcha();
  });
})();
