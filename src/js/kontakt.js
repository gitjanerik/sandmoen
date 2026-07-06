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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
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
  if (reset) reset.addEventListener('click', () => { form.reset(); form.hidden = false; ok.hidden = true; });
})();
