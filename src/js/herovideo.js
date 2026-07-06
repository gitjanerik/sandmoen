// Hero-bakgrunnsvideo: start pauset, med play/pause-toggle (trekant / to streker).
(() => {
  const hero = document.querySelector('.hero-video');
  const pp = document.querySelector('.hero-playpause');
  if (!hero || !pp) return;
  const ICON_PLAY = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M7 5v14l11-7z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
  const sync = () => {
    const playing = !hero.paused;
    pp.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    pp.setAttribute('aria-label', playing ? 'Pause bakgrunnsvideo' : 'Spill av bakgrunnsvideo');
  };
  pp.addEventListener('click', () => { hero.paused ? hero.play().catch(() => {}) : hero.pause(); });
  hero.addEventListener('play', sync);
  hero.addEventListener('pause', sync);
  sync();
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
