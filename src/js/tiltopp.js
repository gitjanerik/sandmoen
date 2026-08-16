// Viser «til toppen»-knappen først når man har rullet et stykke ned.
// Selve rullingen gjøres av CSS (scroll-behavior: smooth på html).
(() => {
  const knapp = document.querySelector('.til-topp');
  if (!knapp) return;
  const oppdater = () => knapp.classList.toggle('vis', window.scrollY > 420);
  addEventListener('scroll', oppdater, { passive: true });
  oppdater();
})();
