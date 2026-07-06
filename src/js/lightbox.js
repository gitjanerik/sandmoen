// Lightbox for bildegalleriet på detaljsider med foto.
(() => {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const bilder = JSON.parse(lb.dataset.bilder || '[]');
  const stage = document.getElementById('lb-stage');
  const counter = document.getElementById('lb-counter');
  let i = 0;

  function show(n) {
    i = (n + bilder.length) % bilder.length;
    stage.style.backgroundImage = `url('${bilder[i]}')`;
    counter.textContent = `${i + 1} / ${bilder.length}`;
  }
  function open(n) { show(n); lb.hidden = false; document.body.style.overflow = 'hidden'; }
  function close() { lb.hidden = true; document.body.style.overflow = ''; }

  document.querySelectorAll('[data-lb]').forEach((el) =>
    el.addEventListener('click', () => open(parseInt(el.dataset.lb, 10) || 0)));

  lb.querySelector('.close').addEventListener('click', close);
  lb.querySelector('.prev').addEventListener('click', () => show(i - 1));
  lb.querySelector('.next').addEventListener('click', () => show(i + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
  });
})();
