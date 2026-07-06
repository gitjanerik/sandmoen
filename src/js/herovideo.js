// Hero-bakgrunnsvideo: spill i halv hastighet (roligere, bedre lesbarhet).
(() => {
  const hero = document.querySelector('.hero-video');
  if (hero) {
    const slow = () => { hero.playbackRate = 0.25; };
    slow();
    hero.addEventListener('loadedmetadata', slow);
    hero.addEventListener('play', slow);
  }
})();

// Åpner full-oppløsnings videopresentasjon i en enkel modal (med lyd + kontroller).
(() => {
  const modal = document.getElementById('videomodal');
  const btn = document.querySelector('.hero-videobtn');
  if (!modal || !btn) return;
  const video = document.getElementById('vm-video');

  function open() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    video.play().catch(() => {});
  }
  function close() {
    video.pause();
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', open);
  modal.querySelector('.vm-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (!modal.hidden && e.key === 'Escape') close(); });
})();
