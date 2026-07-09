// Åpner videopresentasjon i fullskjerms modal. Binder alle .js-open-video-knapper
// på siden til #videomodal. Brukes på forsiden og på tomtesider med egen video.
(() => {
  const modal = document.getElementById('videomodal');
  const triggers = document.querySelectorAll('.js-open-video');
  if (!modal || !triggers.length) return;
  const video = document.getElementById('vm-video');

  function open() {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (video) video.play().catch(() => {});
  }
  function close() {
    if (video) video.pause();
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  triggers.forEach((t) => t.addEventListener('click', open));
  modal.querySelector('.vm-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (!modal.hidden && e.key === 'Escape') close(); });
})();
